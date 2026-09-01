/**
 * V2 leaf validators: VldLiteralV2, VldBooleanV2, VldEnumV2, VldRecordV2,
 * VldAnyV2, VldUnknownV2, VldVoidV2, VldNeverV2, VldNullV2, VldUndefinedV2,
 * VldSymbolV2, VldNullishV2, VldFunctionV2.
 */
import { VldBase, VLD_VALIDATOR_TYPES, type ParseResult } from './base';
import { VldError, createInvalidTypeIssue, getTypeName, type VldIssue } from '../errors-core';

// --------------------------------------------------------------------------
// VldLiteralV2
// --------------------------------------------------------------------------

export interface VldLiteralDef<T> {
  readonly type: 'literal';
  readonly value: T | undefined;
}

export class VldLiteralV2<T extends string | number | boolean | null | undefined> extends VldBase<T, T> {
  readonly __def: VldLiteralDef<T>;

  constructor(value: T) {
    super(VLD_VALIDATOR_TYPES.LITERAL);
    this.__def = Object.freeze({ type: 'literal', value }) as VldLiteralDef<T>;
  }

  static create<T extends string | number | boolean | null | undefined>(value: T): VldLiteralV2<T> {
    return new VldLiteralV2(value);
  }

  override parse(value: unknown): T {
    const expected = this.__def.value as T;
    if (value !== expected) {
      throw new VldError([{
        code: 'invalid_literal', path: [], expected: String(expected) as string, received: value === undefined ? 'undefined' : typeof value,
        message: `Invalid input: expected ${JSON.stringify(expected)}, received ${JSON.stringify(value)}`
      } as VldIssue]);
    }
    return expected;
  }

  override safeParse(value: unknown): ParseResult<T> {
    const expected = this.__def.value as T;
    if (value === expected) return { success: true, data: expected };
    return { success: false, error: new VldError([{ code: 'invalid_literal', path: [], expected: String(expected) as string, received: value === undefined ? 'undefined' : typeof value,
      message: `Invalid input: expected ${JSON.stringify(expected)}, received ${JSON.stringify(value)}` } as VldIssue]) };
  }

  get literal(): T { return this.__def.value as T; }
  get isSimple(): boolean { return true; }
}

// --------------------------------------------------------------------------
// VldBooleanV2
// --------------------------------------------------------------------------

export class VldBooleanV2 extends VldBase<boolean, boolean> {
  readonly __def: { type: 'boolean' };

  constructor() {
    super(VLD_VALIDATOR_TYPES.BOOLEAN);
    this.__def = Object.freeze({ type: 'boolean' });
  }

  static create(): VldBooleanV2 { return new VldBooleanV2(); }

  override parse(value: unknown): boolean {
    if (typeof value !== 'boolean') {
      throw new VldError([createInvalidTypeIssue('boolean', getTypeName(value), undefined)]);
    }
    return value;
  }

  override safeParse(value: unknown): ParseResult<boolean> {
    if (typeof value === 'boolean') return { success: true, data: value };
    return { success: false, error: new VldError([createInvalidTypeIssue('boolean', getTypeName(value), undefined)]) };
  }

  get isSimple(): boolean { return true; }
}

// --------------------------------------------------------------------------
// VldEnumV2
// --------------------------------------------------------------------------

export interface VldEnumDef<T extends readonly (string | number)[]> {
  readonly type: 'enum';
  readonly values: ReadonlyArray<T[number]>;
  readonly valuesSet: Set<T[number]>;
}

export class VldEnumV2<T extends readonly (string | number)[]> extends VldBase<T[number], T[number]> {
  readonly __def: VldEnumDef<T>;

  constructor(values: T) {
    super(VLD_VALIDATOR_TYPES.ENUM);
    this.__def = Object.freeze({
      type: 'enum',
      values: Object.freeze([...values]) as ReadonlyArray<T[number]>,
      valuesSet: new Set(values),
    });
  }

  static create<T extends readonly (string | number)[]>(values: T): VldEnumV2<T> {
    return new VldEnumV2(values);
  }

  override parse(value: unknown): T[number] {
    if (!this.__def.valuesSet.has(value as T[number])) {
      throw new VldError([{
        code: 'invalid_value', path: [], values: [...this.__def.values] as unknown[], received: typeof value,
        message: `Invalid enum value. Expected ${[...this.__def.values].join(' | ')}, received ${JSON.stringify(value)}`
      } as VldIssue]);
    }
    return value as T[number];
  }

  override safeParse(value: unknown): ParseResult<T[number]> {
    if (this.__def.valuesSet.has(value as T[number])) return { success: true, data: value as T[number] };
    return { success: false, error: new VldError([{
      code: 'invalid_value', path: [], values: [...this.__def.values] as unknown[], received: typeof value,
      message: `Invalid enum value. Expected ${[...this.__def.values].join(' | ')}, received ${JSON.stringify(value)}`
    } as VldIssue]) };
  }

  get options(): T[number][] { return [...this.__def.values] as T[number][]; }
  get enumValues(): T[number][] { return this.options; }
  get isSimple(): boolean { return true; }
}

// --------------------------------------------------------------------------
// VldRecordV2
// --------------------------------------------------------------------------

export interface VldRecordDef<T> {
  readonly type: 'record';
  readonly valueValidator: VldBase<unknown, T>;
  readonly simpleValueMode: 'string' | 'number' | 'boolean' | 'bigint' | 'symbol' | undefined;
}

export class VldRecordV2<T> extends VldBase<Record<string, T>, Record<string, T>> {
  readonly __def: VldRecordDef<T>;

  constructor(valueValidator: VldBase<unknown, T>) {
    super(VLD_VALIDATOR_TYPES.RECORD);
    const simpleMode = (valueValidator as any).isSimple === true
      ? ((valueValidator as any).validatorType === VLD_VALIDATOR_TYPES.STRING ? 'string'
        : (valueValidator as any).validatorType === VLD_VALIDATOR_TYPES.NUMBER ? 'number'
        : (valueValidator as any).validatorType === VLD_VALIDATOR_TYPES.BOOLEAN ? 'boolean'
        : (valueValidator as any).validatorType === VLD_VALIDATOR_TYPES.BIGINT ? 'bigint'
        : (valueValidator as any).validatorType === VLD_VALIDATOR_TYPES.SYMBOL ? 'symbol'
        : undefined) as 'string' | 'number' | 'boolean' | 'bigint' | 'symbol' | undefined
      : undefined;
    this.__def = Object.freeze({ type: 'record', valueValidator, simpleValueMode: simpleMode as 'string' | 'number' | 'boolean' | 'bigint' | 'symbol' | undefined });
  }

  static create<T>(valueValidator: VldBase<unknown, T>): VldRecordV2<T> {
    return new VldRecordV2(valueValidator);
  }

  override parse(value: unknown): Record<string, T> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new VldError([createInvalidTypeIssue('record', getTypeName(value), undefined)]);
    }
    return this.parseKnownRecord(value as Record<string, unknown>);
  }

  parseKnownRecord(value: Record<string, unknown>): Record<string, T> {
    const simpleMode = this.__def.simpleValueMode;
    const result: Record<string, T> = {};
    const keys = Object.keys(value);
    if (simpleMode !== undefined) {
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i]!;
        const v = value[k];
        switch (simpleMode) {
          case 'string':
            if (typeof v !== 'string') throw new Error(`Invalid field ${k}: expected string, received ${typeof v}`);
            result[k] = v as T; break;
          case 'number':
            if (typeof v !== 'number' || isNaN(v)) throw new Error(`Invalid field ${k}: expected number, received ${typeof v}`);
            result[k] = v as T; break;
          case 'boolean':
            if (typeof v !== 'boolean') throw new Error(`Invalid field ${k}: expected boolean, received ${typeof v}`);
            result[k] = v as T; break;
          case 'bigint':
            if (typeof v !== 'bigint') throw new Error(`Invalid field ${k}: expected bigint, received ${typeof v}`);
            result[k] = v as T; break;
          case 'symbol':
            if (typeof v !== 'symbol') throw new Error(`Invalid field ${k}: expected symbol, received ${typeof v}`);
            result[k] = v as T; break;
        }
      }
    } else {
      const validator = this.__def.valueValidator;
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i]!;
        result[k] = validator.parse(value[k]) as T;
      }
    }
    return result;
  }

  override safeParse(value: unknown): ParseResult<Record<string, T>> {
    try { return { success: true, data: this.parse(value) }; }
    catch (e) { return { success: false, error: e instanceof VldError ? e : new VldError([{ code: 'custom', path: [], message: String(e) }]) }; }
  }

  get isSimple(): boolean { return false; }
}

// --------------------------------------------------------------------------
// VldAnyV2 / VldUnknownV2 / VldVoidV2 / VldNeverV2 / VldNullV2 / VldUndefinedV2 / VldSymbolV2
// --------------------------------------------------------------------------

export class VldAnyV2 extends VldBase<any, any> {
  readonly __def: { type: 'any' };
  constructor() { super(VLD_VALIDATOR_TYPES.ANY); this.__def = Object.freeze({ type: 'any' }); }
  static create(): VldAnyV2 { return new VldAnyV2(); }
  override parse(value: unknown): any { return value; }
  override safeParse(value: unknown): ParseResult<any> { return { success: true, data: value as any }; }
  get isSimple(): boolean { return true; }
}

export class VldUnknownV2 extends VldBase<unknown, unknown> {
  readonly __def: { type: 'unknown' };
  constructor() { super(VLD_VALIDATOR_TYPES.UNKNOWN); this.__def = Object.freeze({ type: 'unknown' }); }
  static create(): VldUnknownV2 { return new VldUnknownV2(); }
  override parse(value: unknown): unknown { return value; }
  override safeParse(value: unknown): ParseResult<unknown> { return { success: true, data: value }; }
  get isSimple(): boolean { return true; }
}

export class VldVoidV2 extends VldBase<undefined, undefined> {
  readonly __def: { type: 'void' };
  constructor() { super(VLD_VALIDATOR_TYPES.VOID); this.__def = Object.freeze({ type: 'void' }); }
  static create(): VldVoidV2 { return new VldVoidV2(); }
  override parse(value: unknown): undefined {
    if (value !== undefined) {
      throw new VldError([createInvalidTypeIssue('void', getTypeName(value), undefined)]);
    }
    return undefined;
  }
  override safeParse(value: unknown): ParseResult<undefined> {
    if (value === undefined) return { success: true, data: undefined };
    return { success: false, error: new VldError([createInvalidTypeIssue('void', getTypeName(value), undefined)]) };
  }
  get isSimple(): boolean { return true; }
}

export class VldNeverV2 extends VldBase<never, never> {
  readonly __def: { type: 'never' };
  constructor() { super(VLD_VALIDATOR_TYPES.NEVER); this.__def = Object.freeze({ type: 'never' }); }
  static create(): VldNeverV2 { return new VldNeverV2(); }
  override parse(_value: unknown): never {
    throw new VldError([{ code: 'custom', path: [], message: 'No value can pass never validation' } as VldIssue]);
  }
  override safeParse(_value: unknown): ParseResult<never> {
    return { success: false, error: new VldError([{ code: 'custom', path: [], message: 'No value can pass never validation' } as VldIssue]) };
  }
  get isSimple(): boolean { return true; }
}

export class VldNullV2 extends VldBase<null, null> {
  readonly __def: { type: 'null' };
  constructor() { super(VLD_VALIDATOR_TYPES.NULL); this.__def = Object.freeze({ type: 'null' }); }
  static create(): VldNullV2 { return new VldNullV2(); }
  override parse(value: unknown): null {
    if (value !== null) {
      throw new VldError([createInvalidTypeIssue('null', getTypeName(value), undefined)]);
    }
    return null;
  }
  override safeParse(value: unknown): ParseResult<null> {
    if (value === null) return { success: true, data: null };
    return { success: false, error: new VldError([createInvalidTypeIssue('null', getTypeName(value), undefined)]) };
  }
  get isSimple(): boolean { return true; }
}

export class VldUndefinedV2 extends VldBase<undefined, undefined> {
  readonly __def: { type: 'undefined' };
  constructor() { super(VLD_VALIDATOR_TYPES.UNDEFINED); this.__def = Object.freeze({ type: 'undefined' }); }
  static create(): VldUndefinedV2 { return new VldUndefinedV2(); }
  override parse(value: unknown): undefined {
    if (value !== undefined) {
      throw new VldError([createInvalidTypeIssue('undefined', getTypeName(value), undefined)]);
    }
    return undefined;
  }
  override safeParse(value: unknown): ParseResult<undefined> {
    if (value === undefined) return { success: true, data: undefined };
    return { success: false, error: new VldError([createInvalidTypeIssue('undefined', getTypeName(value), undefined)]) };
  }
  get isSimple(): boolean { return true; }
}

export class VldSymbolV2 extends VldBase<symbol, symbol> {
  readonly __def: { type: 'symbol' };
  constructor() { super(VLD_VALIDATOR_TYPES.SYMBOL); this.__def = Object.freeze({ type: 'symbol' }); }
  static create(): VldSymbolV2 { return new VldSymbolV2(); }
  override parse(value: unknown): symbol {
    if (typeof value !== 'symbol') {
      throw new VldError([createInvalidTypeIssue('symbol', getTypeName(value), undefined)]);
    }
    return value;
  }
  override safeParse(value: unknown): ParseResult<symbol> {
    if (typeof value === 'symbol') return { success: true, data: value };
    return { success: false, error: new VldError([createInvalidTypeIssue('symbol', getTypeName(value), undefined)]) };
  }
  get isSimple(): boolean { return true; }
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export class VldFunctionV2 extends VldBase<Function, (...args: any[]) => any> {
  readonly __def: { type: 'function' };
  constructor() { super(VLD_VALIDATOR_TYPES.FUNCTION); this.__def = Object.freeze({ type: 'function' }); }
  static create(): VldFunctionV2 { return new VldFunctionV2(); }
  override parse(value: unknown): (...args: any[]) => any {
    if (typeof value !== 'function') {
      throw new VldError([createInvalidTypeIssue('function', getTypeName(value), undefined)]);
    }
    return value as (...args: any[]) => any;
  }
  override safeParse(value: unknown): ParseResult<(...args: any[]) => any> {
    if (typeof value === 'function') return { success: true, data: value as (...args: any[]) => any };
    return { success: false, error: new VldError([createInvalidTypeIssue('function', getTypeName(value), undefined)]) };
  }
  get isSimple(): boolean { return true; }
}
