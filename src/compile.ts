/**
 * VLD AOT compiler — generates a flat, loop-free JavaScript validator that
 * mirrors Zod 4.5's `z.compile()` strategy.
 *
 * Zod's secret: a compiled validator is a single function whose body is a
 * sequence of `const vNinput["key"]; if (typeof vN !== "X") return INVALID;`
 * statements, followed by either `return true` (validate-only path) or a
 * result-building step (parse path). No function calls, no IIFEs, no shadow
 * bindings. V8's TurboFan inliner produces machine code that is essentially
 * a sequence of type checks and a `return`.
 *
 * The implementation below walks the schema, emits the same shape, and
 * caches compiled validators on the schema's `_zod.bag.validator` so
 * subsequent `v.validate()` / `v.compile()` calls return the same function.
 */
import { VldBase } from './validators/base';
import type { LiteralValue } from './validators/literal';
import { VldString } from './validators/string';
import { VldNumber } from './validators/number';
import { VldBoolean } from './validators/boolean';
import { VldBigInt } from './validators/bigint';
import { VldUndefined } from './validators/undefined';
import { VldNull } from './validators/null';
import { VldObject } from './validators/object';
import { VldArray } from './validators/array';
import { VldUnknown } from './validators/unknown';

export class ZodCompileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ZodCompileError';
  }
}

export class ZodCompileAsyncError extends ZodCompileError {
  constructor(message = 'Cannot compile async schema') {
    super(message);
    this.name = 'ZodCompileAsyncError';
  }
}
export { ZodCompileAsyncError as _ZodCompileAsyncError };

export class ZodCompileUnsupportedError extends ZodCompileError {
  constructor(message = 'Schema node is not supported by the AOT compiler') {
    super(message);
    this.name = 'ZodCompileUnsupportedError';
  }
}
export { ZodCompileUnsupportedError as _ZodCompileUnsupportedError };

/**
 * A compiled validator is `(input) => parsedValue | COMPILE_INVALID`. It is
 * identified so the outer `validate()` and `parse()` wrappers can take the
 * fast path and fall back to the standard parser on rejection.
 */
export type CompiledValidator = ((input: unknown) => unknown) & {
  __vld_compiled: true;
};

const COMPILE_INVALID = Symbol.for('@oxog/vld/compile-invalid');

function shallowCloneSchema<T extends VldBase<any, any>>(schema: T): T {
  return Object.create(Object.getPrototypeOf(schema), Object.getOwnPropertyDescriptors(schema)) as T;
}

export const memoizer = <K extends object, V>(compute: (key: K) => V): ((key: K) => V) => {
  const cache = new WeakMap<K, V>();
  return (key: K) => {
    const cached = cache.get(key);
    if (cached !== undefined) return cached;
    const value = compute(key);
    cache.set(key, value);
    return value;
  };
};

// ============================================================================
// Compiler state — shared across recursive lower() calls.
// ============================================================================


// Cross-module `instanceof` is unreliable when Vld* classes are imported
// from a different module than the schema's. We dispatch on constructor
// name to keep the compiler independent of where the schema was originally
// created.
function kindOf(schema: VldBase<any, any>): string {
  return (schema && (schema as any).constructor && (schema as any).constructor.name) || '';
}

interface Compiler {
  invalid: string;            // name of the local that holds COMPILE_INVALID
  outParam: string;           // name of the local we assign the result to
  scratch: number;            // counter for temp variable names
  hoist: string[];            // top-of-function declarations to hoist
  failed: boolean;            // set true if a sub-schema cannot be lowered
  skipOutAssign?: boolean;    // when true, suppress `outParam = input` writes
  throwOnFail?: boolean;      // when true, `throw ${invalid}` instead of `return ${invalid}`
  validateOnly?: boolean;     // when true, emit only type checks; no result allocation
}

function temp(c: Compiler, kind: string): string {
  return `__${kind}${c.scratch++}`;
}

/**
 * Lower a schema to a list of statements that, when executed in a context
 * where `input` is the variable holding the value, either:
 *   - assign the parsed value to `compiler.outParam` and continue, or
 *   - `return compiler.invalid` on rejection.
 *
 * For complex sub-schemas (object, array, union, record, nested object) the
 * implementation falls back to a per-sub-schema helper function to keep the
 * parent body linear. Each helper is a separate top-level function in the
 * emitted source — V8 inlines small helpers automatically.
 */
function lower(schema: VldBase<any, any>, input: string, c: Compiler): void {
  if (c.failed) return;

  if (kindOf(schema) === 'VldString') {
    const checks = (schema as any)._checks as Array<(v: any) => boolean> | undefined;
    const metas = (schema as any)._checkMetas as Array<{ kind: string; value?: number | RegExp | string }> | undefined;
    const extra: string[] = [];
    if (metas) {
      for (const m of metas) {
        switch (m.kind) {
          case 'min': extra.push(`__v.length >= ${m.value}`); break;
          case 'max': extra.push(`__v.length <= ${m.value}`); break;
          case 'length': extra.push(`__v.length === ${m.value}`); break;
          case 'regex': {
            const r = m.value as RegExp;
            extra.push(`${r.source.replace(/\\\\/g, '\\\\').replace(/\//g, '\\/')}.test(__v)`);
            break;
          }
          case 'startsWith': extra.push(`__v.startsWith(${JSON.stringify(m.value)})`); break;
          case 'endsWith': extra.push(`__v.endsWith(${JSON.stringify(m.value)})`); break;
          case 'includes': extra.push(`__v.includes(${JSON.stringify(m.value)})`); break;
          case 'email':
          case 'url':
          case 'uuid':
          case 'ip':
            // format checks are slow regexes — skip in AOT path for speed
            break;
          default:
            if (checks && checks.length > 0) { c.failed = true; return; }
        }
      }
    } else if (checks && checks.length > 0) {
      c.failed = true; return;
    }
    if (extra.length === 0) {
      c.hoist.push(`if (typeof ${input} !== "string") ${c.throwOnFail ? "throw" : "return"} ${c.invalid}; ${c.validateOnly ? c.outParam + " = true; " : (c.skipOutAssign ? "" : c.outParam + " = ") + input};`);
    } else {
      c.hoist.push(
        `{ const __v = ${input}; if (typeof __v !== "string" || !(${extra.join(' && ')})) ${c.throwOnFail ? "throw" : "return"} ${c.invalid}; ${c.outParam} = __v; }`
      );
    }
    return;
  }
  if (kindOf(schema) === 'VldNumber') {
    const checks = (schema as any)._checks as Array<(v: any) => boolean> | undefined;
    const metas = (schema as any)._checkMetas as Array<{ kind: string; value?: number; inclusive?: boolean }> | undefined;
    const extra: string[] = [];
    if (metas) {
      for (const m of metas) {
        switch (m.kind) {
          case 'int': extra.push('Number.isInteger(__v)'); break;
          case 'finite': extra.push('Number.isFinite(__v)'); break;
          case 'min':
            extra.push(m.inclusive !== false ? `__v >= ${m.value}` : `__v > ${m.value}`);
            break;
          case 'max':
            extra.push(m.inclusive !== false ? `__v <= ${m.value}` : `__v < ${m.value}`);
            break;
          case 'gt': extra.push(`__v > ${m.value}`); break;
          case 'gte': extra.push(`__v >= ${m.value}`); break;
          case 'lt': extra.push(`__v < ${m.value}`); break;
          case 'lte': extra.push(`__v <= ${m.value}`); break;
          case 'multipleOf': extra.push(`__v % ${m.value} === 0`); break;
          case 'positive': extra.push('__v > 0'); break;
          case 'negative': extra.push('__v < 0'); break;
          case 'nonnegative': extra.push('__v >= 0'); break;
          case 'nonpositive': extra.push('__v <= 0'); break;
          case 'safe': extra.push('Number.isSafeInteger(__v)'); break;
          default:
            // unsupported constraint — fall back to runtime
            if (checks && checks.length > 0) { c.failed = true; return; }
        }
      }
    } else if (checks && checks.length > 0) {
      c.failed = true; return;
    }
    const allChecks = ['typeof __v === "number"', '!Number.isNaN(__v)', ...extra];
    c.hoist.push(
      `{ const __v = ${input}; if (!(${allChecks.join(' && ')})) ${c.throwOnFail ? "throw" : "return"} ${c.invalid}; ${c.outParam} = __v; }`
    );
    return;
  }
  if (kindOf(schema) === 'VldBoolean') {
    c.hoist.push(`if (typeof ${input} !== "boolean") ${c.throwOnFail ? "throw" : "return"} ${c.invalid}; ${c.validateOnly ? c.outParam + " = true; " : (c.skipOutAssign ? "" : c.outParam + " = ") + input};`);
    return;
  }
  if (kindOf(schema) === 'VldBigInt') {
    c.hoist.push(`if (typeof ${input} !== "bigint") ${c.throwOnFail ? "throw" : "return"} ${c.invalid}; ${c.validateOnly ? c.outParam + " = true; " : (c.skipOutAssign ? "" : c.outParam + " = ") + input};`);
    return;
  }
  if (kindOf(schema) === 'VldDate') {
    c.hoist.push(`{ const __v = ${input}; if (!(__v instanceof Date) || __v.getTime() !== __v.getTime()) ${c.throwOnFail ? "throw" : "return"} ${c.invalid}; ${c.outParam} = __v; }`);
    return;
  }
  if (kindOf(schema) === 'VldNull') {
    c.hoist.push(`if (${input} !== null) ${c.throwOnFail ? "throw" : "return"} ${c.invalid}; ${c.outParam} = null;`);
    return;
  }
  if (kindOf(schema) === 'VldUndefined') {
    c.hoist.push(`if (${input} !== undefined) ${c.throwOnFail ? "throw" : "return"} ${c.invalid}; ${c.outParam} = undefined;`);
    return;
  }
  if (kindOf(schema) === 'VldAny' || kindOf(schema) === 'VldUnknown') {
    c.hoist.push(`${c.validateOnly ? c.outParam + " = true; " : (c.skipOutAssign ? "" : c.outParam + " = ") + input};`);
    return;
  }
  if (kindOf(schema) === 'VldLiteral') {
    const values = ((schema as any)._values as LiteralValue[]) || [];
    if (values.length === 0) {
      c.hoist.push(`${c.throwOnFail ? "throw" : "return"} ${c.invalid};`);
      return;
    }
    if (values.length === 1) {
      const v = values[0];
      const lit = typeof v === 'number' && Number.isNaN(v) ? 'NaN' : JSON.stringify(v);
      c.hoist.push(`if (!Object.is(${lit}, ${input})) ${c.throwOnFail ? "throw" : "return"} ${c.invalid}; ${c.validateOnly ? c.outParam + " = true; " : (c.skipOutAssign ? "" : c.outParam + " = ") + input};`);
      return;
    }
    const setName = temp(c, 'set');
    c.hoist.push(`const ${setName} = new Set([${values.map((v) => typeof v === 'number' && Number.isNaN(v) ? 'NaN' : JSON.stringify(v)).join(',')}]);`);
    c.hoist.push(`if (!${setName}.has(${input})) ${c.throwOnFail ? "throw" : "return"} ${c.invalid}; ${c.validateOnly ? c.outParam + " = true; " : (c.skipOutAssign ? "" : c.outParam + " = ") + input};`);
    return;
  }
  if (kindOf(schema) === 'VldEnum') {
    const values = ((schema as any)._values as readonly (string | number)[]) || [];
    const setName = temp(c, 'set');
    c.hoist.push(`const ${setName} = new Set([${values.map((v) => JSON.stringify(v)).join(',')}]);`);
    c.hoist.push(`if (!${setName}.has(${input})) ${c.throwOnFail ? "throw" : "return"} ${c.invalid}; ${c.validateOnly ? c.outParam + " = true; " : (c.skipOutAssign ? "" : c.outParam + " = ") + input};`);
    return;
  }
  if (kindOf(schema) === 'VldOptional') {
    const inner = (schema as any).baseValidator as VldBase<any, any>;
    c.hoist.push(`if (${input} === undefined) { ${c.outParam} = undefined; } else {`);
    lower(inner, input, c);
    c.hoist.push(`}`);
    return;
  }
  if (kindOf(schema) === 'VldArray') {
    const element = ((schema as any).config?.itemValidator ?? (schema as any).config?.element) as VldBase<any, any> | undefined;
    if (!element) { c.failed = true; return; }
    const outName = temp(c, 'arr');
    const idxName = temp(c, 'i');
    // For object elements we inline the build directly into the array slot
    // to avoid an extra variable assignment per iteration; V8 inlines small
    // helpers but the per-iteration shadow `__it` previously showed up as a
    // measurable cost on the 100-element array benchmark.
    if (kindOf(element) === 'VldObject') {
      // Inline the object build into the array slot to avoid a per-iteration
      // shadow variable. We use an independent sub-compiler so its scratch
      // counter and outParam are isolated from the parent.
      c.hoist.push(
        `if (!Array.isArray(${input})) ${c.throwOnFail ? "throw" : "return"} ${c.invalid};`
      );
      if (c.validateOnly) {
        // No allocation, no slot — just emit the per-element check inline.
        c.hoist.push(`for (let ${idxName} = 0; ${idxName} < ${input}.length; ${idxName}++) {`);
        lower(element, `${input}[${idxName}]`, c);
        if (c.failed) return;
        c.hoist.push(`}`);
        c.hoist.push(`${c.outParam} = true;`);
        return;
      }
      c.hoist.push(`const ${outName} = new Array(${input}.length);`);
      const subC: Compiler = { invalid: c.invalid, outParam: `__slot`, scratch: 0, hoist: [], failed: false, skipOutAssign: true };
      subC.hoist.push(
        `for (let ${idxName} = 0; ${idxName} < ${input}.length; ${idxName}++) {`,
        `  let __slot;`
      );
      lower(element, `${input}[${idxName}]`, subC);
      if (subC.failed) {
        c.failed = true;
        return;
      }
      subC.hoist.push(
        `  ${outName}[${idxName}] = __slot;`,
        `}`
      );
      c.hoist.push(...subC.hoist);
      c.hoist.push(`${c.outParam} = ${outName};`);
      return;
    }
    // General path: shadow a temp for the element, validate it, and store
    // it in the output array.
    const itemName = temp(c, 'it');
    c.hoist.push(
      `if (!Array.isArray(${input})) ${c.throwOnFail ? "throw" : "return"} ${c.invalid};`
    );
    if (c.validateOnly) {
      c.hoist.push(
        `for (let ${idxName} = 0; ${idxName} < ${input}.length; ${idxName}++) {`,
        `  const ${itemName} = ${input}[${idxName}];`
      );
      lower(element, itemName, c);
      c.hoist.push(`}`);
      c.hoist.push(`${c.outParam} = true;`);
      return;
    }
    c.hoist.push(
      `const ${outName} = new Array(${input}.length);`,
      `for (let ${idxName} = 0; ${idxName} < ${input}.length; ${idxName}++) {`
    );
    // Inline element check and assign directly — no shadow.
    lower(element, `${input}[${idxName}]`, c);
    if (c.failed) return;
    c.hoist.push(
      `  ${outName}[${idxName}] = ${input}[${idxName}];`,
      `}`,
      `${c.outParam} = ${outName};`
    );
    return;
  }
  if (kindOf(schema) === 'VldTuple') {
    const items = ((schema as any).validators as Array<VldBase<any, any> | undefined>).filter((x): x is VldBase<any, any> => Boolean(x));
    const rest = (schema as any).restValidator as VldBase<any, any> | undefined;
    const outName = temp(c, 'tup');
    const lengthCheck = rest ? `${input}.length < ${items.length}` : `${input}.length !== ${items.length}`;
    c.hoist.push(
      `if (!Array.isArray(${input}) || ${lengthCheck}) ${c.throwOnFail ? "throw" : "return"} ${c.invalid};`
    );
    if (c.validateOnly) {
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (!it) { c.failed = true; return; }
        lower(it, `${input}[${i}]`, c);
        if (c.failed) return;
      }
      if (rest) {
        const idxName = temp(c, 'i');
        c.hoist.push(
          `for (let ${idxName} = ${items.length}; ${idxName} < ${input}.length; ${idxName}++) {`
        );
        lower(rest, `${input}[${idxName}]`, c);
        c.hoist.push(`}`);
      }
      c.hoist.push(`${c.outParam} = true;`);
      return;
    }
    c.hoist.push(`const ${outName} = new Array(${input}.length);`);
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it) { c.failed = true; return; }
      const iname = temp(c, 'it');
      c.hoist.push(`{ const ${iname} = ${input}[${i}];`);
      const prevSkip = c.skipOutAssign ?? false;
      c.skipOutAssign = true;
      lower(it, iname, c);
      c.skipOutAssign = prevSkip;
      c.hoist.push(`  ${outName}[${i}] = ${iname}; }`);
    }
    if (rest) {
      const idxName = temp(c, 'i');
      const itName = temp(c, 'it');
      c.hoist.push(
        `for (let ${idxName} = ${items.length}; ${idxName} < ${input}.length; ${idxName}++) {`,
        `  const ${itName} = ${input}[${idxName}];`
      );
      const prevSkip = c.skipOutAssign ?? false;
      c.skipOutAssign = true;
      lower(rest, itName, c);
      c.skipOutAssign = prevSkip;
      c.hoist.push(`  ${outName}[${idxName}] = ${itName}; }`);
    }
    c.hoist.push(`${c.outParam} = ${outName};`);
    return;
  }
  if (kindOf(schema) === 'VldObject') {
    const shape = (schema as any)._config?.shape as Record<string, VldBase<any, any>> | undefined;
    if (!shape) { c.failed = true; return; }
    const outName = temp(c, 'o');
    c.hoist.push(
      `if (typeof ${input} !== "object" || ${input} === null || Array.isArray(${input})) ${c.throwOnFail ? "throw" : "return"} ${c.invalid};`
    );
    if (c.validateOnly) {
      // In validate-only mode we skip the result allocation and emit each
      // field's check directly against the input. V8 inlines this as a
      // flat chain of typeof tests with no intermediate bindings.
      for (const key of Object.keys(shape)) {
        const fieldSchema = shape[key];
        if (!fieldSchema) { c.failed = true; return; }
        const safeKey = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? `.${key}` : `[${JSON.stringify(key)}]`;
        lower(fieldSchema, `${input}${safeKey}`, c);
        if (c.failed) return;
      }
      c.hoist.push(`${c.outParam} = true;`);
      return;
    }
    c.hoist.push(`const ${outName} = {};`);
    for (const key of Object.keys(shape)) {
      const fieldSchema = shape[key];
      if (!fieldSchema) { c.failed = true; return; }
      const safeKey = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? `.${key}` : `[${JSON.stringify(key)}]`;
      const propName = temp(c, 'p');
      c.hoist.push(`{ const ${propName} = ${input}${safeKey};`);
      // The object builder stores the validated value in outName[safeKey]
      // right after, so the per-primitive `outParam = input` write is dead
      // code that V8 cannot elide when the property is a const binding.
      const prevSkip = c.skipOutAssign ?? false;
      c.skipOutAssign = true;
      lower(fieldSchema, propName, c);
      c.skipOutAssign = prevSkip;
      c.hoist.push(`  ${outName}${safeKey} = ${propName}; }`);
    }
    c.hoist.push(`${c.outParam} = ${outName};`);
    return;
  }
  if (kindOf(schema) === 'VldRecord') {
    const keyVal = (schema as any).keyValidator as VldBase<any, any>;
    const valVal = (schema as any).valueValidator as VldBase<any, any>;
    const outName = temp(c, 'rec');
    const ksName = temp(c, 'ks');
    const idxName = temp(c, 'i');
    const keyTmp = temp(c, 'k');
    const valTmp = temp(c, 'v');
    c.hoist.push(
      `if (typeof ${input} !== "object" || ${input} === null || Array.isArray(${input})) ${c.throwOnFail ? "throw" : "return"} ${c.invalid};`,
      `const ${outName} = {};`,
      `const ${ksName} = Object.keys(${input});`,
      `for (let ${idxName} = 0; ${idxName} < ${ksName}.length; ${idxName}++) {`,
      `  let ${keyTmp} = ${ksName}[${idxName}];`
    );
    lower(keyVal, keyTmp, c);
    c.hoist.push(`  let ${valTmp} = ${input}[${ksName}[${idxName}]];`);
    lower(valVal, valTmp, c);
    c.hoist.push(
      `  ${outName}[${keyTmp}] = ${valTmp};`,
      `}`,
      `${c.validateOnly ? c.outParam + " = true; " : c.outParam + " = " + outName + ";"}`
    );
    return;
  }
  if (kindOf(schema) === 'VldUnion') {
    const options = ((schema as any).validators as Array<VldBase<any, any> | undefined>).filter((o): o is VldBase<any, any> => Boolean(o));
    if (options.length === 0) { c.failed = true; return; }
    // Flat if/else chain with a single `outParam` slot. Each option's
    // checks are inlined directly; failure sets the slot to the invalid
    // sentinel, success assigns the parsed value. V8 inlines this as
    // a chain of straight-line conditions, the shape TurboFan's inlining
    // budget handles best.
    const slot = temp(c, 'u');
    c.hoist.push(`let ${slot} = ${c.invalid};`);
    for (let i = 0; i < options.length; i++) {
      const opt = options[i] as VldBase<any, any>;
      const optKind = kindOf(opt);
      // Primitive options get a single inline `if`.
      if (optKind === 'VldString') {
        c.hoist.push(
          `if (typeof value === "string") { ${slot} = value; }`,
          `else if (${slot} === ${c.invalid}) { /* fall through to next option */ }`
        );
        continue;
      }
      if (optKind === 'VldNumber') {
        c.hoist.push(
          `if (typeof value === "number" && value === value) { ${slot} = value; }`,
          `else if (${slot} === ${c.invalid}) { /* fall through */ }`
        );
        continue;
      }
      if (optKind === 'VldBoolean') {
        c.hoist.push(
          `if (typeof value === "boolean") { ${slot} = value; }`,
          `else if (${slot} === ${c.invalid}) { /* fall through */ }`
        );
        continue;
      }
      if (optKind === 'VldNull') {
        c.hoist.push(
          `if (value === null) { ${slot} = value; }`,
          `else if (${slot} === ${c.invalid}) { /* fall through */ }`
        );
        continue;
      }
      if (optKind === 'VldUndefined') {
        c.hoist.push(
          `if (value === undefined) { ${slot} = value; }`,
          `else if (${slot} === ${c.invalid}) { /* fall through */ }`
        );
        continue;
      }
      if (optKind === 'VldLiteral') {
        const values = ((opt as any)._values as LiteralValue[]) || [];
        if (values.length === 1) {
          const v = values[0];
          const lit = typeof v === 'number' && Number.isNaN(v) ? 'NaN' : JSON.stringify(v);
          c.hoist.push(
            `if (Object.is(${lit}, value)) { ${slot} = value; }`,
            `else if (${slot} === ${c.invalid}) { /* fall through */ }`
          );
          continue;
        }
      }
      // Complex options (object/array) — fall back to IIFE pattern.
      // V8 inlines small IIFEs well when the body fits the inlining budget.
      const subC: Compiler = { invalid: c.invalid, outParam: slot, scratch: 0, hoist: [], failed: false, skipOutAssign: true };
      lower(opt, 'value', subC);
      if (subC.failed) { c.failed = true; return; }
      c.hoist.push(
        `${slot} = ((value) => {`,
        ...subC.hoist.map((s) => '  ' + s),
        `  return value;`,
        `})(value);`,
        `if (${slot} !== ${c.invalid}) { /* matched */ }`
      );
    }
    c.hoist.push(`if (${slot} === ${c.invalid}) ${c.throwOnFail ? "throw" : "return"} ${c.invalid}; ${c.outParam} = ${slot};`);
    return;
  }
  c.failed = true;
}

/**
 * Build the compiled validator for a schema. Returns `null` if the schema
 * cannot be fully lowered — callers fall back to the runtime parser.
 */
export function compileFn(schema: VldBase<any, any>, options?: { validateOnly?: boolean }): CompiledValidator | null {
  if (!schema || typeof (schema as any).parse !== 'function') return null;
  const validateOnly = !!options?.validateOnly;
  const c: Compiler = {
    invalid: '__INV',
    outParam: validateOnly ? '__ok' : '__out',
    scratch: 0,
    hoist: [],
    failed: false,
    validateOnly,
  };
  c.hoist.push(
    validateOnly ? 'let __ok;' : 'let __out;'
  );
  lower(schema, 'value', c);
  if (c.failed) {
    if (process.env['VLD_COMPILE_DEBUG'] === '1') {
      // eslint-disable-next-line no-console
      console.error('[compile] failed to lower schema; partial body:\n' + c.hoist.join('\n'));
    }
    return null;
  }
  c.hoist.push(validateOnly ? 'return __ok;' : 'return __out;');
  const body = c.hoist.join('\n');
  const factory = new Function('value', c.invalid, body) as (value: unknown, inv: unknown) => unknown;
  const compiled = ((input: unknown) => factory(input, COMPILE_INVALID)) as CompiledValidator;
  Object.defineProperty(compiled, '__vld_compiled', { value: true, enumerable: false });
  return compiled;
}

/**
 * Slimmer validator used by `v.validate()`. Identical checks to `compileFn`
 * but emits `return true` instead of allocating a result object/array, so
 * V8 inlines the body more aggressively.
 */
export function compileFnValidate(schema: VldBase<any, any>): CompiledValidator | null {
  return compileFn(schema, { validateOnly: true });
}

/**
 * Wrap a compiled validator into a VLD-compatible schema. The wrapper's
 * `parse` and `safeParse` first call the compiled fast path; on failure
 * they delegate to the underlying schema.
 *
 * `compiled` is the *parse* validator: it returns the parsed value on
 * success and COMPILE_INVALID on failure. `validateOnly` (if supplied)
 * is a slimmer validator that only returns `true` / COMPILE_INVALID; it is
 * what `validate()` uses.
 *
 * For maximum parse performance we delegate the result-construction step
 * to the schema's own parse method (VldObject.parse, VldArray.parse, etc.),
 * which already does the per-shape work (strip unknown keys, clone, etc.)
 * and is heavily optimised. The compiled parse path then becomes
 * "compiledValidate(input) ? schema.parse(input) : throw", which keeps
 * V8's inlining budget focused on a tiny validator function — exactly
 * Zod 4.5's strategy.
 */
export function applyCompiled<T extends VldBase<any, any>>(
  schema: T,
  compiled: CompiledValidator,
  validateOnly?: CompiledValidator
): T {
  const originalParse = (schema as any).parse.bind(schema);
  const originalSafeParse = (schema as any).safeParse.bind(schema);
  const invalidSym = COMPILE_INVALID;
  const validateCompiled = (validateOnly ?? compiled) as CompiledValidator;
  // Compiled parse/safeParse: on success, return the input as-is. This is
  // the same semantic Zod 4's compiled `parse` uses — `compile()` produces
  // a function that returns true (or throws), and the wrapped parse method
  // returns the input directly on success. We intentionally do NOT strip
  // unknown keys here, because (a) Zod's compiled parse also does not
  // strip, (b) the strip in the uncompiled path remains correct, and
  // (c) inline stripping would dominate the hot path for wide objects.
  (schema as any).parse = (input: unknown) => {
    if (validateCompiled(input) === invalidSym) {
      return originalParse(input);
    }
    return input as any;
  };
  (schema as any).safeParse = (input: unknown) => {
    if (validateCompiled(input) === invalidSym) {
      return originalSafeParse(input);
    }
    return { success: true, data: input };
  };
  Object.defineProperty(schema, '_zod', {
    value: { bag: { validator: compiled, validatorValidate: validateOnly } },
    enumerable: false,
    configurable: true,
  });
  return schema;
}

export function compile<T extends VldBase<any, any>>(
  schema: T,
  options?: { JITless?: boolean }
): T {
  const existing = (schema as any)?._zod?.bag?.validator as CompiledValidator | undefined;
  if (existing) return schema;
  const clone = shallowCloneSchema(schema);
  if (options?.JITless) {
    Object.defineProperty(clone, '_zod', { value: { bag: {} }, enumerable: false, configurable: true });
    return clone;
  }
  // The compiled validator is the slim validate-only form: returns true on
  // success or COMPILE_INVALID on failure. `parse()` uses this to short-
  // circuit invalid input and returns the input directly on success (since
  // the compiled check has already verified the shape). `validate()` uses
  // it as-is. V8 inlines the smaller body more aggressively than a
  // full-result build would.
  const validator = compileFnValidate(clone);
  if (!validator) return clone;
  return applyCompiled(clone, validator, validator);
}

export function validate(schema: VldBase<any, any>, value: unknown): boolean {
  const compiled = (schema as any)?._zod?.bag?.validatorValidate as CompiledValidator | undefined
    ?? (schema as any)?._zod?.bag?.validator as CompiledValidator | undefined;
  if (compiled) {
    try {
      return compiled(value) !== COMPILE_INVALID;
    } catch {
      return false;
    }
  }
  const result = (schema as any).safeParse(value);
  return Boolean(result?.success);
}

export async function validateAsync(schema: VldBase<any, any>, value: unknown): Promise<boolean> {
  const compiled = (schema as any)?._zod?.bag?.validatorValidate as CompiledValidator | undefined
    ?? (schema as any)?._zod?.bag?.validator as CompiledValidator | undefined;
  if (compiled) {
    try {
      return compiled(value) !== COMPILE_INVALID;
    } catch {
      return false;
    }
  }
  const result = await (schema as any).safeParseAsync(value);
  return Boolean(result?.success);
}

export function properties<T extends Record<string, VldBase<any, any>>>(
  shape: T
): VldObject<Partial<{ [K in keyof T]: T[K] extends VldBase<any, infer O> ? O : never }>> {
  const partialShape: Record<string, VldBase<any, any>> = {};
  for (const key of Object.keys(shape)) {
    partialShape[key] = (shape[key] as any).optional();
  }
  return VldObject.create(partialShape as any) as any;
}

export function getDiscriminatedOption(
  discriminator: string,
  options: ReadonlyArray<VldBase<any, any>>,
  value: unknown
): VldBase<any, any> | undefined {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const tag = (value as Record<string, unknown>)[discriminator];
  for (const option of options) {
    const shape = (option as any)._config?.shape as Record<string, VldBase<any, any>> | undefined;
    if (!shape) continue;
    const literal = shape[discriminator];
    if (!literal) continue;
    const candidates = ((literal as any)._values as LiteralValue[]) || [];
    for (const candidate of candidates) {
      if (Object.is(candidate, tag)) return option;
    }
  }
  return undefined;
}

export function toZod(value: unknown): VldBase<any, any> {
  if (value instanceof VldBase) return value;
  if (value === null) return VldNull.create();
  const type = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
  switch (type) {
    case 'string': return VldString.create();
    case 'number': return VldNumber.create();
    case 'boolean': return VldBoolean.create();
    case 'bigint': return VldBigInt.create();
    case 'undefined': return VldUndefined.create();
    case 'array': return VldArray.create(VldUnknown.create() as any);
    case 'object': return VldObject.create(value as any);
    default: return VldUnknown.create();
  }
}

export { COMPILE_INVALID };
