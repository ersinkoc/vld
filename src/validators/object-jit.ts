/**
 * Generated object parser for VldObject's success path.
 *
 * A hand-written loop over `obj[key]` / `result[key]` runs every key through
 * one property site, so V8's inline caches see as many shapes as the object has
 * fields and degrade to megamorphic (dictionary) access - measured ~10M ops/s
 * for six mixed fields. Zod compiles one straight-line function per shape with
 * a distinct property site per key, so the same object parses at ~35M ops/s.
 *
 * This module emits that straight-line parser. Every property read/write in the
 * generated code has its own site and its own key, so each one stays
 * monomorphic. The parser returns the parsed object, or null after recording
 * where it stopped in the state object it was given: VldObject resumes its
 * interpreter exactly there, so fields that already ran never run twice and a
 * child's error is reported instead of the child being run again.
 *
 * `new Function` is optional: when it is blocked (CSP, MV3, edge runtimes)
 * `buildObjectParser` returns null and VldObject keeps using the interpreter.
 */
export type ObjectSimpleMode =
  | 'string'
  | 'number'
  | 'boolean'
  | 'bigint'
  | 'symbol'
  | 'null'
  | 'undefinedValue'
  | 'literal'
  | 'passthrough';

/** A required field that the fast path checks inline. */
export interface ObjectCopyOp {
  readonly kind: 'copy';
  readonly key: string;
  readonly mode: ObjectSimpleMode;
  readonly literal?: unknown;
}

/** A `.optional()` field whose inner schema is simple. */
export interface ObjectOptionalOp {
  readonly kind: 'optional';
  readonly key: string;
  readonly mode: ObjectSimpleMode;
  readonly literal?: unknown;
}

/** A `.default()` field whose inner schema is simple. */
export interface ObjectDefaultOp {
  readonly kind: 'default';
  readonly key: string;
  readonly mode: ObjectSimpleMode;
  readonly literal?: unknown;
  readonly defaultValue: unknown;
}

/** Any other field: the child schema parses the value itself. */
export interface ObjectGenericOp {
  readonly kind: 'generic';
  readonly key: string;
  readonly parse: (value: unknown) => unknown;
}

export type ObjectParserOp = ObjectCopyOp | ObjectOptionalOp | ObjectDefaultOp | ObjectGenericOp;

/**
 * Where the last run stopped.
 *
 * `data` is the partially built result, so the interpreter resumes after the
 * failing field instead of re-running the fields that already passed (a
 * transform with a side effect must not run twice). `error` is the exception a
 * child schema threw: that field already ran, so its issues are reported from
 * the error rather than by running it again.
 *
 * A parser owns one state object and parsing is synchronous, so the record is
 * read immediately after a rejected run; a nested schema keeps its own state,
 * and only the outer parser's record is read.
 */
export interface ObjectParserState {
  index: number;
  data: Record<string, unknown>;
  error: unknown;
}

export type ObjectParser = (
  value: Record<string, unknown>,
  state: ObjectParserState
) => Record<string, unknown> | null;

export const createParserState = (): ObjectParserState => ({ index: 0, data: {}, error: null });

/** Keys that can be written as `.key` in generated source. */
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;
const property = (target: string, key: string): string =>
  IDENTIFIER.test(key) ? `${target}.${key}` : `${target}[${JSON.stringify(key)}]`;

/** Code that records the failing field and rejects the input. */
const reject = (index: number, error = 'null'): string =>
  `S.index=${index};S.data=out;S.error=${error};return null;`;

/**
 * The condition under which `variable` is NOT of the mode's type, or null for a
 * mode the inline path cannot express (the caller then falls back).
 */
function typeFailure(mode: ObjectSimpleMode, variable: string): string | null {
  switch (mode) {
    case 'string':
      return `typeof ${variable} !== "string"`;
    case 'number':
      // `v - v !== 0` rejects NaN and +/-Infinity, matching Number.isFinite.
      return `typeof ${variable} !== "number" || ${variable} - ${variable} !== 0`;
    case 'boolean':
      return `typeof ${variable} !== "boolean"`;
    case 'bigint':
      return `typeof ${variable} !== "bigint"`;
    case 'symbol':
      return `typeof ${variable} !== "symbol"`;
    case 'null':
      return `${variable} !== null`;
    default:
      return null;
  }
}

/**
 * Build the parser for `ops`, or null when code generation is unavailable or a
 * mode cannot be expressed inline. Values (literals, defaults) and child
 * parsers are passed as arguments rather than embedded in the source, so keys
 * and values never need escaping.
 */
export function buildObjectParser(ops: readonly ObjectParserOp[]): ObjectParser | null {
  const values: unknown[] = [];
  const children: Array<(value: unknown) => unknown> = [];
  const lines: string[] = [];

  for (let i = 0; i < ops.length; i++) {
    const op = ops[i]!;
    const variable = `v${i}`;
    const read = property('o', op.key);
    const write = property('out', op.key);
    const present = `${JSON.stringify(op.key)} in o`;

    if (op.kind === 'generic') {
      const child = children.length;
      children.push(op.parse);
      lines.push(
        `try{${variable}=G[${child}](${read});` +
          `if(${variable}!==undefined||${present})${write}=${variable};}` +
          `catch(e){${reject(i, 'e')}}`
      );
      continue;
    }

    let assigned = variable;
    let failed: string | null;
    switch (op.mode) {
      case 'literal': {
        const literal = values.length;
        values.push(op.literal);
        failed = `${variable}!==V[${literal}]`;
        assigned = `V[${literal}]`;
        break;
      }
      case 'undefinedValue':
        failed = `${variable}!==undefined||!hasOwn.call(o,${JSON.stringify(op.key)})`;
        break;
      case 'passthrough':
        failed = `!hasOwn.call(o,${JSON.stringify(op.key)})`;
        break;
      default:
        failed = typeFailure(op.mode, variable);
        break;
    }

    // A mode the inline path cannot express (only reachable through a mutated
    // schema): hand the whole shape back to the interpreter.
    if (failed === null) return null;

    lines.push(`${variable}=${read};`);

    if (op.kind === 'copy') {
      lines.push(`if(${failed}){${reject(i)}}${write}=${assigned};`);
      continue;
    }

    if (op.kind === 'optional') {
      // An absent optional field stays absent; an explicit undefined stays
      // undefined - the same presence rules the interpreter uses.
      lines.push(
        `if(${variable}!==undefined){if(${failed}){${reject(i)}}${write}=${assigned};}` +
          `else if(${present})${write}=undefined;`
      );
      continue;
    }

    const fallback = values.length;
    values.push(op.defaultValue);
    lines.push(
      `if(${variable}===undefined)${write}=typeof V[${fallback}]==="function"?V[${fallback}]():V[${fallback}];` +
        `else{if(${failed}){${reject(i)}}${write}=${assigned};}`
    );
  }

  const declared = ops.map((_, i) => `v${i}`).join(',');
  const source =
    '"use strict";var hasOwn=Object.prototype.hasOwnProperty;' +
    `return function(o,S){var out={};var ${declared};` +
    `${lines.join('')}return out;};`;

  try {
    // eslint-disable-next-line no-new-func
    return new Function('V', 'G', source)(values, children) as ObjectParser;
  } catch {
    return null;
  }
}
