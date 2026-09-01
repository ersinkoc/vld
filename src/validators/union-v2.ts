/**
 * VldUnionV2 — single-def union validator.
 * The legacy VldUnion has 5 own properties (validators, errorMessage,
 * typeCheckers, simpleModes, simpleValues). V2 collapses them into a
 * single `__def`, reducing per-instance shape size and letting V8 use
 * a more uniform hidden class.
 *
 * Public API mirrors VldUnion 1:1. Exposed via v.unionV2().
 */
import { VldBase, VLD_VALIDATOR_TYPES, type ParseResult } from './base';
import { VldError } from '../errors-core';
import { getMessages } from '../locales/runtime';

type SimpleUnionMode = 'string' | 'number' | 'boolean' | 'bigint' | 'symbol' | 'null' | 'undefined' | 'literal' | 'passthrough' | undefined;

export interface VldUnionDef {
  readonly type: 'union';
  readonly validators: ReadonlyArray<VldBase<any, any>>;
  readonly typeCheckers: ReadonlyArray<(value: unknown) => boolean>;
  readonly simpleModes: ReadonlyArray<SimpleUnionMode>;
  readonly simpleValues: ReadonlyArray<unknown>;
  readonly errorMessage?: string | undefined;
}

function createSimpleMode(v: VldBase<any, any>): SimpleUnionMode {
  if ((v as { isSimple?: boolean }).isSimple !== true) return undefined;
  switch (v.validatorType) {
    case VLD_VALIDATOR_TYPES.STRING: return 'string';
    case VLD_VALIDATOR_TYPES.NUMBER: return 'number';
    case VLD_VALIDATOR_TYPES.BOOLEAN: return 'boolean';
    case VLD_VALIDATOR_TYPES.BIGINT: return 'bigint';
    case VLD_VALIDATOR_TYPES.SYMBOL: return 'symbol';
    case VLD_VALIDATOR_TYPES.NULL: return 'null';
    case VLD_VALIDATOR_TYPES.UNDEFINED:
    case VLD_VALIDATOR_TYPES.VOID: return 'undefined';
    case VLD_VALIDATOR_TYPES.LITERAL: return 'literal';
    case VLD_VALIDATOR_TYPES.ANY:
    case VLD_VALIDATOR_TYPES.UNKNOWN: return 'passthrough';
    default: return undefined;
  }
}

function createTypeChecker(v: VldBase<any, any>): (value: unknown) => boolean {
  switch (v.validatorType) {
    case VLD_VALIDATOR_TYPES.STRING: return (x) => typeof x === 'string';
    case VLD_VALIDATOR_TYPES.NUMBER: return (x) => typeof x === 'number' && !isNaN(x);
    case VLD_VALIDATOR_TYPES.BOOLEAN: return (x) => typeof x === 'boolean';
    case VLD_VALIDATOR_TYPES.BIGINT: return (x) => typeof x === 'bigint';
    case VLD_VALIDATOR_TYPES.SYMBOL: return (x) => typeof x === 'symbol';
    case VLD_VALIDATOR_TYPES.NAN: return (x) => typeof x === 'number' && Number.isNaN(x);
    case VLD_VALIDATOR_TYPES.ARRAY: return Array.isArray;
    case VLD_VALIDATOR_TYPES.OBJECT: return (x) => typeof x === 'object' && x !== null && !Array.isArray(x);
    case VLD_VALIDATOR_TYPES.NULL: return (x) => x === null;
    case VLD_VALIDATOR_TYPES.UNDEFINED:
    case VLD_VALIDATOR_TYPES.VOID: return (x) => x === undefined;
    case VLD_VALIDATOR_TYPES.ENUM: return (x) => typeof x === 'string' || typeof x === 'number';
    case VLD_VALIDATOR_TYPES.LITERAL: {
      const literal = (v as { literal?: unknown }).literal;
      return (x) => x === literal;
    }
    case VLD_VALIDATOR_TYPES.NEVER: return () => false;
    case VLD_VALIDATOR_TYPES.ANY:
    case VLD_VALIDATOR_TYPES.UNKNOWN: return () => true;
    default: return () => true;
  }
}

function buildDef(validators: ReadonlyArray<VldBase<any, any>>, errorMessage?: string): VldUnionDef {
  const typeCheckers = validators.map(createTypeChecker);
  const simpleModes = validators.map(createSimpleMode);
  const simpleValues = validators.map((v, i) =>
    simpleModes[i] === 'literal' ? (v as { literal?: unknown }).literal : undefined
  );
  return { type: 'union', validators, typeCheckers, simpleModes, simpleValues, errorMessage };
}

export class VldUnionV2<T extends readonly VldBase<any, any>[]> extends VldBase<
  T[number] extends VldBase<any, infer U> ? U : never,
  T[number] extends VldBase<any, infer U> ? U : never
> {
  readonly __def: VldUnionDef;

  constructor(validators: T, errorMessage?: string) {
    super(VLD_VALIDATOR_TYPES.UNION);
    this.__def = buildDef(validators, errorMessage);
  }

  static create<T extends readonly VldBase<any, any>[]>(...validators: T): VldUnionV2<T> {
    return new VldUnionV2(validators);
  }

  get options(): T { return this.__def.validators as unknown as T; }

  parse(value: unknown): T[number] extends VldBase<any, infer U> ? U : never {
    const errors: string[] = [];
    const { validators, typeCheckers, simpleModes, simpleValues } = this.__def;

    for (let i = 0; i < validators.length; i++) {
      const validator = validators[i]!;
      const typeChecker = typeCheckers[i];
      if (typeChecker && !typeChecker(value)) continue;

      const simpleMode = simpleModes[i];
      if (simpleMode !== undefined) {
        switch (simpleMode) {
          case 'string': case 'number': case 'boolean': case 'bigint': case 'symbol':
          case 'passthrough': return value as any;
          case 'null': return null as any;
          case 'undefined': return undefined as any;
          case 'literal': return simpleValues[i] as any;
        }
      }

      try {
        return validator.parse(value);
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
    }

    throw new Error(this.__def.errorMessage || getMessages().unionNoMatch(errors));
  }

  safeParse(value: unknown): ParseResult<T[number] extends VldBase<any, infer U> ? U : never> {
    try { return { success: true, data: this.parse(value) }; }
    catch (e) {
      return { success: false, error: e instanceof VldError ? e : new VldError([{ code: 'custom', path: [], message: (e as Error).message }]) };
    }
  }
}
