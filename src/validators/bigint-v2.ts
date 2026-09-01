/**
 * VldBigIntV2 — OPTIMIZED: check returns Issue | null.
 */
import { VldBase, VLD_VALIDATOR_TYPES, type ErrorParam, type ParseResult } from './base';
import { VldError, createInvalidTypeIssue, getTypeName, type VldIssue } from '../errors-core';

export abstract class VldBigIntCheck {
  abstract readonly kind: 'min' | 'max' | 'gt' | 'lt' | 'multipleOf' | 'positive' | 'negative' | 'nonnegative' | 'nonpositive';
  abstract check(value: bigint): VldIssue | null;
  abstract meta(): Record<string, any>;
}

function toBigInt(v: bigint | number | string): bigint { return typeof v === 'bigint' ? v : BigInt(v); }

export class VldBigIntCheckMin extends VldBigIntCheck {
  readonly kind = 'min' as const;
  private _threshold: bigint;
  constructor(threshold: bigint | number | string, private _msg?: string) { super(); this._threshold = toBigInt(threshold); }
  check(value: bigint): VldIssue | null {
    if (value < this._threshold) return { code: 'too_small', path: [], origin: 'bigint', message: this._msg || `BigInt must be >= ${this._threshold}` };
    return null;
  }
  meta() { return { kind: 'min', value: this._threshold, message: this._msg }; }
}

export class VldBigIntCheckMax extends VldBigIntCheck {
  readonly kind = 'max' as const;
  private _threshold: bigint;
  constructor(threshold: bigint | number | string, private _msg?: string) { super(); this._threshold = toBigInt(threshold); }
  check(value: bigint): VldIssue | null {
    if (value > this._threshold) return { code: 'too_big', path: [], origin: 'bigint', message: this._msg || `BigInt must be <= ${this._threshold}` };
    return null;
  }
  meta() { return { kind: 'max', value: this._threshold, message: this._msg }; }
}

export class VldBigIntCheckGt extends VldBigIntCheck {
  readonly kind = 'gt' as const;
  private _threshold: bigint;
  constructor(threshold: bigint | number | string, private _msg?: string) { super(); this._threshold = toBigInt(threshold); }
  check(value: bigint): VldIssue | null {
    if (value <= this._threshold) return { code: 'too_small', path: [], origin: 'bigint', message: this._msg || `BigInt must be > ${this._threshold}` };
    return null;
  }
  meta() { return { kind: 'gt', value: this._threshold, message: this._msg }; }
}

export class VldBigIntCheckLt extends VldBigIntCheck {
  readonly kind = 'lt' as const;
  private _threshold: bigint;
  constructor(threshold: bigint | number | string, private _msg?: string) { super(); this._threshold = toBigInt(threshold); }
  check(value: bigint): VldIssue | null {
    if (value >= this._threshold) return { code: 'too_big', path: [], origin: 'bigint', message: this._msg || `BigInt must be < ${this._threshold}` };
    return null;
  }
  meta() { return { kind: 'lt', value: this._threshold, message: this._msg }; }
}

export class VldBigIntCheckMultipleOf extends VldBigIntCheck {
  readonly kind = 'multipleOf' as const;
  private _divisor: bigint;
  constructor(divisor: bigint | number | string, private _msg?: string) { super(); this._divisor = toBigInt(divisor); }
  check(value: bigint): VldIssue | null {
    if (this._divisor === 0n) return null;
    if (value % this._divisor !== 0n) return { code: 'custom', path: [], message: this._msg || `BigInt must be a multiple of ${this._divisor}` };
    return null;
  }
  meta() { return { kind: 'multipleOf', value: this._divisor, message: this._msg }; }
}

export interface VldBigIntDef {
  readonly type: 'bigint';
  readonly checks: ReadonlyArray<VldBigIntCheck>;
  readonly jsonSchema?: { minimum?: string; maximum?: string; multipleOf?: string; format?: string } | undefined;
  readonly errorMessage?: string | undefined;
  readonly isSimple: boolean;
}

const EMPTY_BIGINT_DEF: VldBigIntDef = Object.freeze({
  type: 'bigint',
  checks: Object.freeze([]) as ReadonlyArray<VldBigIntCheck>,
  isSimple: true,
});

function buildBigIntDef(checks: ReadonlyArray<VldBigIntCheck>, jsonSchema: VldBigIntDef['jsonSchema'], errorMessage: string | undefined): VldBigIntDef {
  return Object.freeze({
    type: 'bigint' as const,
    checks,
    jsonSchema,
    errorMessage,
    isSimple: checks.length === 0,
  });
}

export class VldBigIntV2 extends VldBase<bigint, bigint> {
  readonly __def: VldBigIntDef;

  constructor(def: VldBigIntDef = EMPTY_BIGINT_DEF) {
    super(VLD_VALIDATOR_TYPES.BIGINT);
    this.__def = def;
  }

  static create(): VldBigIntV2 { return new VldBigIntV2(); }

  get isSimple(): boolean { return this.__def.isSimple; }

  parse(value: unknown): bigint {
    if (typeof value !== 'bigint') {
      throw new VldError([createInvalidTypeIssue('bigint', getTypeName(value), this.__def.errorMessage)]);
    }
    if (this.__def.isSimple) return value;
    return this.parseKnownBigInt(value);
  }

  parseKnownBigInt(value: bigint): bigint {
    const checks = this.__def.checks;
    for (let i = 0; i < checks.length; i++) {
      const issue = checks[i]!.check(value);
      if (issue !== null) throw new VldError([issue]);
    }
    return value;
  }

  safeParse(value: unknown): ParseResult<bigint> {
    try { return { success: true, data: this.parse(value) }; }
    catch (e) { return { success: false, error: e instanceof VldError ? e : new VldError([{ code: 'custom', path: [], message: String(e) }]) }; }
  }

  protected withDef(def: Partial<VldBigIntDef> & { type: 'bigint' }): VldBigIntV2 {
    const merged = buildBigIntDef(
      def.checks ?? this.__def.checks,
      def.jsonSchema ?? this.__def.jsonSchema,
      def.errorMessage ?? this.__def.errorMessage
    );
    return new (this.constructor as any)(merged);
  }

  min(value: bigint | number | string, message?: ErrorParam): VldBigIntV2 { const bn = toBigInt(value); return this.withDef({ type: 'bigint', checks: [...this.__def.checks, new VldBigIntCheckMin(value, message as string)], jsonSchema: { ...this.__def.jsonSchema, minimum: bn.toString() } }); }
  max(value: bigint | number | string, message?: ErrorParam): VldBigIntV2 { const bn = toBigInt(value); return this.withDef({ type: 'bigint', checks: [...this.__def.checks, new VldBigIntCheckMax(value, message as string)], jsonSchema: { ...this.__def.jsonSchema, maximum: bn.toString() } }); }
  positive(message?: ErrorParam): VldBigIntV2 { return this.withDef({ type: 'bigint', checks: [...this.__def.checks, new VldBigIntCheckGt(0n, message as string)] }); }
  negative(message?: ErrorParam): VldBigIntV2 { return this.withDef({ type: 'bigint', checks: [...this.__def.checks, new VldBigIntCheckLt(0n, message as string)] }); }
  nonnegative(message?: ErrorParam): VldBigIntV2 { return this.withDef({ type: 'bigint', checks: [...this.__def.checks, new VldBigIntCheckMin(0n, message as string)] }); }
  nonpositive(message?: ErrorParam): VldBigIntV2 { return this.withDef({ type: 'bigint', checks: [...this.__def.checks, new VldBigIntCheckMax(0n, message as string)] }); }
  gt(value: bigint | number | string, message?: ErrorParam): VldBigIntV2 { return this.withDef({ type: 'bigint', checks: [...this.__def.checks, new VldBigIntCheckGt(value, message as string)] }); }
  lt(value: bigint | number | string, message?: ErrorParam): VldBigIntV2 { return this.withDef({ type: 'bigint', checks: [...this.__def.checks, new VldBigIntCheckLt(value, message as string)] }); }
  gte(value: bigint | number | string, message?: ErrorParam): VldBigIntV2 { return this.min(value, message); }
  lte(value: bigint | number | string, message?: ErrorParam): VldBigIntV2 { return this.max(value, message); }
  multipleOf(divisor: bigint | number | string, message?: ErrorParam): VldBigIntV2 { const bn = toBigInt(divisor); return this.withDef({ type: 'bigint', checks: [...this.__def.checks, new VldBigIntCheckMultipleOf(divisor, message as string)], jsonSchema: { ...this.__def.jsonSchema, multipleOf: bn.toString() } }); }
}
