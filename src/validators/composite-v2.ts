/**
 * V2 composite validators: VldTupleV2, VldSetV2, VldMapV2, VldIntersectionV2.
 * Single-def pattern applied to remaining composite types.
 */
import { VldBase, VLD_VALIDATOR_TYPES, type ParseResult } from './base';
import { VldError, createInvalidTypeIssue, getTypeName } from '../errors-core';

// --------------------------------------------------------------------------
// VldTupleV2
// --------------------------------------------------------------------------

export interface VldTupleDef {
  readonly type: 'tuple';
  readonly validators: ReadonlyArray<VldBase<any, any>>;
  readonly validatorTypes: ReadonlyArray<string>;
}

export class VldTupleV2<T extends readonly VldBase<any, any>[]> extends VldBase<unknown[], unknown[]> {
  readonly __def: VldTupleDef;

  constructor(validators: T) {
    super(VLD_VALIDATOR_TYPES.TUPLE);
    this.__def = Object.freeze({
      type: 'tuple',
      validators: Object.freeze([...validators]) as ReadonlyArray<VldBase<any, any>>,
      validatorTypes: Object.freeze(validators.map(v => v.validatorType)) as ReadonlyArray<string>,
    });
  }

  static create<T extends readonly VldBase<any, any>[]>(...validators: T): VldTupleV2<T> {
    return new VldTupleV2(validators);
  }

  override parse(value: unknown): unknown[] {
    if (!Array.isArray(value)) {
      throw new VldError([createInvalidTypeIssue('tuple', getTypeName(value), undefined)]);
    }
    return this.parseKnownTuple(value);
  }

  parseKnownTuple(value: unknown[]): unknown[] {
    const validators = this.__def.validators;
    const len = validators.length;
    if (value.length < len) {
      throw new Error(`Tuple must have at least ${len} items, got ${value.length}`);
    }
    const result: unknown[] = new Array(len);
    for (let i = 0; i < len; i++) {
      result[i] = validators[i]!.parse(value[i]);
    }
    return result;
  }

  override safeParse(value: unknown): ParseResult<unknown[]> {
    try { return { success: true, data: this.parse(value) }; }
    catch (e) { return { success: false, error: e instanceof VldError ? e : new VldError([{ code: 'custom', path: [], message: String(e) }]) }; }
  }

  get items(): ReadonlyArray<VldBase<any, any>> { return this.__def.validators; }
}

// --------------------------------------------------------------------------
// VldSetV2
// --------------------------------------------------------------------------

export interface VldSetDef {
  readonly type: 'set';
  readonly valueValidator: VldBase<unknown, any>;
  readonly errorMessage?: string | undefined;
  readonly isSimple: boolean;
}

export class VldSetV2<T> extends VldBase<Set<T>, Set<T>> {
  readonly __def: VldSetDef;

  constructor(valueValidator: VldBase<unknown, T>, errorMessage?: string) {
    super(VLD_VALIDATOR_TYPES.SET);
    this.__def = Object.freeze({
      type: 'set',
      valueValidator: valueValidator as VldBase<unknown, any>,
      errorMessage,
      isSimple: (valueValidator as any).isSimple === true,
    });
  }

  static create<T>(valueValidator: VldBase<unknown, T>): VldSetV2<T> {
    return new VldSetV2(valueValidator);
  }

  override parse(value: unknown): Set<T> {
    if (!(value instanceof Set)) {
      throw new VldError([createInvalidTypeIssue('set', getTypeName(value), this.__def.errorMessage)]);
    }
    if (this.__def.isSimple) return value;
    const result = new Set<T>();
    for (const item of value) result.add(this.__def.valueValidator.parse(item) as T);
    return result;
  }

  override safeParse(value: unknown): ParseResult<Set<T>> {
    try { return { success: true, data: this.parse(value) }; }
    catch (e) { return { success: false, error: e instanceof VldError ? e : new VldError([{ code: 'custom', path: [], message: String(e) }]) }; }
  }

  get isSimple(): boolean { return this.__def.isSimple; }
}

// --------------------------------------------------------------------------
// VldMapV2
// --------------------------------------------------------------------------

export interface VldMapDef {
  readonly type: 'map';
  readonly keyValidator: VldBase<unknown, any>;
  readonly valueValidator: VldBase<unknown, any>;
  readonly isSimple: boolean;
}

export class VldMapV2<K, V> extends VldBase<Map<K, V>, Map<K, V>> {
  readonly __def: VldMapDef;

  constructor(keyValidator: VldBase<unknown, K>, valueValidator: VldBase<unknown, V>) {
    super(VLD_VALIDATOR_TYPES.MAP);
    const ks = (keyValidator as any).isSimple === true;
    const vs = (valueValidator as any).isSimple === true;
    this.__def = Object.freeze({
      type: 'map',
      keyValidator: keyValidator as VldBase<unknown, any>,
      valueValidator: valueValidator as VldBase<unknown, any>,
      isSimple: ks && vs,
    });
  }

  static create<K, V>(keyValidator: VldBase<unknown, K>, valueValidator: VldBase<unknown, V>): VldMapV2<K, V> {
    return new VldMapV2(keyValidator, valueValidator);
  }

  override parse(value: unknown): Map<K, V> {
    if (!(value instanceof Map)) {
      throw new VldError([createInvalidTypeIssue('map', getTypeName(value), undefined)]);
    }
    if (this.__def.isSimple) return value;
    const result = new Map<K, V>();
    for (const [k, v] of value) {
      result.set(this.__def.keyValidator.parse(k) as K, this.__def.valueValidator.parse(v) as V);
    }
    return result;
  }

  override safeParse(value: unknown): ParseResult<Map<K, V>> {
    try { return { success: true, data: this.parse(value) }; }
    catch (e) { return { success: false, error: e instanceof VldError ? e : new VldError([{ code: 'custom', path: [], message: String(e) }]) }; }
  }

  get isSimple(): boolean { return this.__def.isSimple; }
}

// --------------------------------------------------------------------------
// VldIntersectionV2
// --------------------------------------------------------------------------

export interface VldIntersectionDef {
  readonly type: 'intersection';
  readonly left: VldBase<any, any>;
  readonly right: VldBase<any, any>;
}

export class VldIntersectionV2<A, B> extends VldBase<A & B, A & B> {
  readonly __def: VldIntersectionDef;

  constructor(left: VldBase<any, A>, right: VldBase<any, B>) {
    super(VLD_VALIDATOR_TYPES.INTERSECTION);
    this.__def = Object.freeze({ type: 'intersection', left, right });
  }

  static create<A, B>(left: VldBase<any, A>, right: VldBase<any, B>): VldIntersectionV2<A, B> {
    return new VldIntersectionV2(left, right);
  }

  override parse(value: unknown): A & B {
    return { ...this.__def.left.parse(value), ...this.__def.right.parse(value) } as A & B;
  }

  override safeParse(value: unknown): ParseResult<A & B> {
    try { return { success: true, data: this.parse(value) }; }
    catch (e) { return { success: false, error: e instanceof VldError ? e : new VldError([{ code: 'custom', path: [], message: String(e) }]) }; }
  }
}
