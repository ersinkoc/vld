/**
 * VldNumberV2 — OPTIMIZED: check returns Issue | null, no per-call payload.
 * Same public API as legacy VldNumber.
 */
import { VldBase, VLD_VALIDATOR_TYPES, type ErrorParam, type ParseResult } from './base';
import { VldError, createInvalidTypeIssue, getTypeName, type VldIssue } from '../errors-core';
import { getMessages } from '../locales/runtime';
import { resolveErrorMessage } from './base';

export abstract class VldNumberCheck {
  abstract readonly kind: 'min' | 'max' | 'gt' | 'lt' | 'int' | 'finite' | 'safe' | 'multipleOf' | 'positive' | 'negative' | 'nonnegative' | 'nonpositive' | 'even' | 'odd' | 'uint32' | 'uint64' | 'int32' | 'int64' | 'float32' | 'float64';
  abstract check(value: number): VldIssue | null;
  abstract meta(): Record<string, any>;
}

export class VldNumberCheckMin extends VldNumberCheck {
  readonly kind = 'min' as const;
  constructor(readonly threshold: number, private _msg?: string) { super(); }
  check(value: number): VldIssue | null {
    if (value < this.threshold) {
      return { code: 'too_small', path: [], origin: 'number', minimum: this.threshold, inclusive: true,
        message: this._msg || `Too small: expected number to be >=${this.threshold}` };
    }
    return null;
  }
  meta() { return { kind: 'min', value: this.threshold, inclusive: true, message: this._msg }; }
}

export class VldNumberCheckMax extends VldNumberCheck {
  readonly kind = 'max' as const;
  constructor(readonly threshold: number, private _msg?: string) { super(); }
  check(value: number): VldIssue | null {
    if (value > this.threshold) {
      return { code: 'too_big', path: [], origin: 'number', maximum: this.threshold, inclusive: true,
        message: this._msg || `Too big: expected number to be <=${this.threshold}` };
    }
    return null;
  }
  meta() { return { kind: 'max', value: this.threshold, inclusive: true, message: this._msg }; }
}

export class VldNumberCheckGt extends VldNumberCheck {
  readonly kind = 'gt' as const;
  constructor(readonly threshold: number, private _msg?: string) { super(); }
  check(value: number): VldIssue | null {
    if (value <= this.threshold) {
      return { code: 'too_small', path: [], origin: 'number', minimum: this.threshold, inclusive: false,
        message: this._msg || `Too small: expected number to be >${this.threshold}` };
    }
    return null;
  }
  meta() { return { kind: 'gt', value: this.threshold, inclusive: false, message: this._msg }; }
}

export class VldNumberCheckLt extends VldNumberCheck {
  readonly kind = 'lt' as const;
  constructor(readonly threshold: number, private _msg?: string) { super(); }
  check(value: number): VldIssue | null {
    if (value >= this.threshold) {
      return { code: 'too_big', path: [], origin: 'number', maximum: this.threshold, inclusive: false,
        message: this._msg || `Too big: expected number to be <${this.threshold}` };
    }
    return null;
  }
  meta() { return { kind: 'lt', value: this.threshold, inclusive: false, message: this._msg }; }
}

export class VldNumberCheckInt extends VldNumberCheck {
  readonly kind = 'int' as const;
  constructor(private _msg?: string) { super(); }
  check(value: number): VldIssue | null {
    if (!Number.isInteger(value)) {
      return { code: 'invalid_type', path: [], expected: 'int', received: 'number',
        message: this._msg || 'Invalid input: expected int, received number' };
    }
    return null;
  }
  meta() { return { kind: 'int', message: this._msg }; }
}

export class VldNumberCheckFinite extends VldNumberCheck {
  readonly kind = 'finite' as const;
  constructor(private _msg?: string) { super(); }
  check(value: number): VldIssue | null {
    if (!Number.isFinite(value)) {
      return { code: 'custom', path: [], message: this._msg || 'Number must be finite' };
    }
    return null;
  }
  meta() { return { kind: 'finite', message: this._msg }; }
}

export class VldNumberCheckSafe extends VldNumberCheck {
  readonly kind = 'safe' as const;
  constructor(private _msg?: string) { super(); }
  check(value: number): VldIssue | null {
    if (!Number.isSafeInteger(value)) {
      return { code: 'custom', path: [], message: this._msg || 'Number must be a safe integer' };
    }
    return null;
  }
  meta() { return { kind: 'safe', message: this._msg }; }
}

export class VldNumberCheckMultipleOf extends VldNumberCheck {
  readonly kind = 'multipleOf' as const;
  constructor(readonly divisor: number, private _msg?: string) { super(); }
  check(value: number): VldIssue | null {
    const remainder = Math.abs(value % this.divisor);
    if (!(remainder < Number.EPSILON || Math.abs(remainder - Math.abs(this.divisor)) < Number.EPSILON)) {
      return { code: 'custom', path: [], message: this._msg || `Number must be a multiple of ${this.divisor}` };
    }
    return null;
  }
  meta() { return { kind: 'multipleOf', value: this.divisor, message: this._msg }; }
}

export class VldNumberCheckRange extends VldNumberCheck {
  readonly kind = 'min' as const;
  constructor(readonly min: number, readonly max: number, private _msg?: string) { super(); }
  check(value: number): VldIssue | null {
    if (value < this.min || value > this.max) {
      return { code: 'custom', path: [], message: this._msg || `Number must be between ${this.min} and ${this.max}` };
    }
    return null;
  }
  meta() { return { kind: 'range', min: this.min, max: this.max, message: this._msg }; }
}

export class VldNumberCheckEven extends VldNumberCheck {
  readonly kind = 'even' as const;
  constructor(private _msg?: string) { super(); }
  check(value: number): VldIssue | null {
    if (!Number.isInteger(value) || value % 2 !== 0) {
      return { code: 'custom', path: [], message: this._msg || 'Number must be even' };
    }
    return null;
  }
  meta() { return { kind: 'even', message: this._msg }; }
}

export class VldNumberCheckOdd extends VldNumberCheck {
  readonly kind = 'odd' as const;
  constructor(private _msg?: string) { super(); }
  check(value: number): VldIssue | null {
    if (!Number.isInteger(value) || value % 2 === 0) {
      return { code: 'custom', path: [], message: this._msg || 'Number must be odd' };
    }
    return null;
  }
  meta() { return { kind: 'odd', message: this._msg }; }
}

export class VldNumberCheckUInt32 extends VldNumberCheck {
  readonly kind = 'uint32' as const;
  constructor(private _msg?: string) { super(); }
  check(value: number): VldIssue | null {
    if (!Number.isSafeInteger(value) || value < 0 || value > 4294967295) {
      return { code: 'custom', path: [], message: this._msg || 'Expected an unsigned 32-bit integer' };
    }
    return null;
  }
  meta() { return { kind: 'uint32', message: this._msg }; }
}

export class VldNumberCheckUInt64 extends VldNumberCheck {
  readonly kind = 'uint64' as const;
  constructor(private _msg?: string) { super(); }
  check(value: number): VldIssue | null {
    if (!Number.isSafeInteger(value) || value < 0) {
      return { code: 'custom', path: [], message: this._msg || 'Expected an unsigned 64-bit integer' };
    }
    return null;
  }
  meta() { return { kind: 'uint64', message: this._msg }; }
}

export class VldNumberCheckInt32 extends VldNumberCheck {
  readonly kind = 'int32' as const;
  constructor(private _msg?: string) { super(); }
  check(value: number): VldIssue | null {
    if (!Number.isSafeInteger(value) || value < -2147483648 || value > 2147483647) {
      return { code: 'custom', path: [], message: this._msg || 'Expected a signed 32-bit integer' };
    }
    return null;
  }
  meta() { return { kind: 'int32', message: this._msg }; }
}

export class VldNumberCheckInt64 extends VldNumberCheck {
  readonly kind = 'int64' as const;
  constructor(private _msg?: string) { super(); }
  check(value: number): VldIssue | null {
    if (!Number.isSafeInteger(value)) {
      return { code: 'custom', path: [], message: this._msg || 'Expected a signed 64-bit integer' };
    }
    return null;
  }
  meta() { return { kind: 'int64', message: this._msg }; }
}

export class VldNumberCheckFloat32 extends VldNumberCheck {
  readonly kind = 'float32' as const;
  constructor(private _msg?: string) { super(); }
  check(value: number): VldIssue | null {
    if (!Number.isFinite(value) || Math.abs(value) > 3.4e38) {
      return { code: 'custom', path: [], message: this._msg || 'Expected a 32-bit float' };
    }
    return null;
  }
  meta() { return { kind: 'float32', message: this._msg }; }
}

export interface VldNumberDef {
  readonly type: 'number';
  readonly checks: ReadonlyArray<VldNumberCheck>;
  readonly jsonSchema?: {
    minimum?: number; maximum?: number; exclusiveMinimum?: number; exclusiveMaximum?: number;
    type?: 'integer' | 'number'; multipleOf?: number; format?: string;
  } | undefined;
  readonly errorMessage?: string | undefined;
  readonly isSimple: boolean;
}

const EMPTY_NUMBER_DEF: VldNumberDef = Object.freeze({
  type: 'number',
  checks: Object.freeze([]) as ReadonlyArray<VldNumberCheck>,
  isSimple: true,
});

function buildNumberDef(checks: ReadonlyArray<VldNumberCheck>, jsonSchema: VldNumberDef['jsonSchema'], errorMessage: string | undefined): VldNumberDef {
  return Object.freeze({
    type: 'number' as const,
    checks,
    jsonSchema,
    errorMessage,
    isSimple: checks.length === 0,
  });
}

export class VldNumberV2 extends VldBase<number, number> {
  readonly __def: VldNumberDef;

  constructor(def: VldNumberDef = EMPTY_NUMBER_DEF) {
    super(VLD_VALIDATOR_TYPES.NUMBER);
    this.__def = def;
  }

  static create(): VldNumberV2 { return new VldNumberV2(); }

  get isSimple(): boolean { return this.__def.isSimple; }
  get hasCustomChecks(): boolean { return !this.isSimple; }
  get minValue(): number | null { const j = this.__def.jsonSchema; return j?.minimum ?? j?.exclusiveMinimum ?? null; }
  get maxValue(): number | null { const j = this.__def.jsonSchema; return j?.maximum ?? j?.exclusiveMaximum ?? null; }
  get isInt(): boolean { return this.__def.jsonSchema?.type === 'integer'; }
  get isFinite(): boolean { return true; }
  get getFormat(): string | null { return (this.__def.jsonSchema as any)?.format ?? null; }
  get isCoercion(): boolean { return this.validatorType === VLD_VALIDATOR_TYPES.COERCE_NUMBER; }

  parse(value: unknown): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new VldError([createInvalidTypeIssue('number', getTypeName(value), this.__def.errorMessage)]);
    }
    if (this.__def.isSimple) return value;
    return this.parseKnownNumber(value);
  }

  parseKnownNumber(value: number): number {
    const checks = this.__def.checks;
    for (let i = 0; i < checks.length; i++) {
      const issue = checks[i]!.check(value);
      if (issue !== null) throw new VldError([issue]);
    }
    return value;
  }

  safeParse(value: unknown): ParseResult<number> {
    try { return { success: true, data: this.parse(value) }; }
    catch (error) { return { success: false, error: error instanceof VldError ? error : new VldError([{ code: 'custom', path: [], message: String(error) }]) }; }
  }

  protected withDef(def: Partial<VldNumberDef> & { type: 'number' }): VldNumberV2 {
    const merged = buildNumberDef(
      def.checks ?? this.__def.checks,
      def.jsonSchema ?? this.__def.jsonSchema,
      def.errorMessage ?? this.__def.errorMessage
    );
    return new (this.constructor as any)(merged);
  }

  min(value: number, message?: ErrorParam): VldNumberV2 { return this.withDef({ type: 'number', checks: [...this.__def.checks, new VldNumberCheckMin(value, resolveErrorMessage(message, getMessages().numberMin(value)))], jsonSchema: { ...this.__def.jsonSchema, minimum: value }, errorMessage: resolveErrorMessage(message, getMessages().numberMin(value)) }); }
  max(value: number, message?: ErrorParam): VldNumberV2 { return this.withDef({ type: 'number', checks: [...this.__def.checks, new VldNumberCheckMax(value, resolveErrorMessage(message, getMessages().numberMax(value)))], jsonSchema: { ...this.__def.jsonSchema, maximum: value }, errorMessage: resolveErrorMessage(message, getMessages().numberMax(value)) }); }
  int(message?: ErrorParam): VldNumberV2 { return this.withDef({ type: 'number', checks: [...this.__def.checks, new VldNumberCheckInt(resolveErrorMessage(message, getMessages().numberInt))], jsonSchema: { ...this.__def.jsonSchema, type: 'integer' }, errorMessage: resolveErrorMessage(message, getMessages().numberInt) }); }
  positive(message?: ErrorParam): VldNumberV2 { return this.withDef({ type: 'number', checks: [...this.__def.checks, new VldNumberCheckGt(0, resolveErrorMessage(message, getMessages().numberPositive))], jsonSchema: { ...this.__def.jsonSchema, exclusiveMinimum: 0 }, errorMessage: resolveErrorMessage(message, getMessages().numberPositive) }); }
  negative(message?: ErrorParam): VldNumberV2 { return this.withDef({ type: 'number', checks: [...this.__def.checks, new VldNumberCheckLt(0, resolveErrorMessage(message, getMessages().numberNegative))], jsonSchema: { ...this.__def.jsonSchema, exclusiveMaximum: 0 }, errorMessage: resolveErrorMessage(message, getMessages().numberNegative) }); }
  nonnegative(message?: ErrorParam): VldNumberV2 { return this.withDef({ type: 'number', checks: [...this.__def.checks, new VldNumberCheckMin(0, resolveErrorMessage(message, getMessages().numberNonnegative))], jsonSchema: { ...this.__def.jsonSchema, minimum: 0 }, errorMessage: resolveErrorMessage(message, getMessages().numberNonnegative) }); }
  nonpositive(message?: ErrorParam): VldNumberV2 { return this.withDef({ type: 'number', checks: [...this.__def.checks, new VldNumberCheckMax(0, resolveErrorMessage(message, getMessages().numberNonpositive))], jsonSchema: { ...this.__def.jsonSchema, maximum: 0 }, errorMessage: resolveErrorMessage(message, getMessages().numberNonpositive) }); }
  finite(message?: ErrorParam): VldNumberV2 { return this.withDef({ type: 'number', checks: [...this.__def.checks, new VldNumberCheckFinite(resolveErrorMessage(message, getMessages().numberFinite))], errorMessage: resolveErrorMessage(message, getMessages().numberFinite) }); }
  safe(message?: ErrorParam): VldNumberV2 { return this.withDef({ type: 'number', checks: [...this.__def.checks, new VldNumberCheckSafe(resolveErrorMessage(message, getMessages().numberSafe))], jsonSchema: { ...this.__def.jsonSchema, type: 'integer' }, errorMessage: resolveErrorMessage(message, getMessages().numberSafe) }); }
  multipleOf(value: number, message?: ErrorParam): VldNumberV2 { return this.withDef({ type: 'number', checks: [...this.__def.checks, new VldNumberCheckMultipleOf(value, resolveErrorMessage(message, getMessages().numberMultipleOf(value)))], jsonSchema: { ...this.__def.jsonSchema, multipleOf: value }, errorMessage: resolveErrorMessage(message, getMessages().numberMultipleOf(value)) }); }
  step(value: number, message?: ErrorParam): VldNumberV2 { return this.multipleOf(value, message); }
  between(min: number, max: number, message?: ErrorParam): VldNumberV2 { return this.withDef({ type: 'number', checks: [...this.__def.checks, new VldNumberCheckRange(min, max, resolveErrorMessage(message, `Number must be between ${min} and ${max}`))], jsonSchema: { ...this.__def.jsonSchema, minimum: min, maximum: max }, errorMessage: resolveErrorMessage(message, `Number must be between ${min} and ${max}`) }); }
  even(message?: ErrorParam): VldNumberV2 { return this.withDef({ type: 'number', checks: [...this.__def.checks, new VldNumberCheckEven(resolveErrorMessage(message, 'Number must be even'))], jsonSchema: { ...this.__def.jsonSchema, type: 'integer', multipleOf: 2 }, errorMessage: resolveErrorMessage(message, 'Number must be even') }); }
  odd(message?: ErrorParam): VldNumberV2 { return this.withDef({ type: 'number', checks: [...this.__def.checks, new VldNumberCheckOdd(resolveErrorMessage(message, 'Number must be odd'))], jsonSchema: { ...this.__def.jsonSchema, type: 'integer' }, errorMessage: resolveErrorMessage(message, 'Number must be odd') }); }
  gt(value: number, message?: ErrorParam): VldNumberV2 { return this.withDef({ type: 'number', checks: [...this.__def.checks, new VldNumberCheckGt(value, resolveErrorMessage(message, `Number must be greater than ${value}`))], jsonSchema: { ...this.__def.jsonSchema, exclusiveMinimum: value }, errorMessage: resolveErrorMessage(message, `Number must be greater than ${value}`) }); }
  lt(value: number, message?: ErrorParam): VldNumberV2 { return this.withDef({ type: 'number', checks: [...this.__def.checks, new VldNumberCheckLt(value, resolveErrorMessage(message, `Number must be less than ${value}`))], jsonSchema: { ...this.__def.jsonSchema, exclusiveMaximum: value }, errorMessage: resolveErrorMessage(message, `Number must be less than ${value}`) }); }
  gte(value: number, message?: ErrorParam): VldNumberV2 { return this.min(value, message); }
  lte(value: number, message?: ErrorParam): VldNumberV2 { return this.max(value, message); }
  uint32(message?: ErrorParam): VldNumberV2 { return this.withDef({ type: 'number', checks: [...this.__def.checks, new VldNumberCheckUInt32(resolveErrorMessage(message, 'Expected an unsigned 32-bit integer'))], jsonSchema: { ...this.__def.jsonSchema, type: 'integer', minimum: 0, maximum: 4294967295 }, errorMessage: resolveErrorMessage(message, 'Expected an unsigned 32-bit integer') }); }
  uint64(message?: ErrorParam): VldNumberV2 { return this.withDef({ type: 'number', checks: [...this.__def.checks, new VldNumberCheckUInt64(resolveErrorMessage(message, 'Expected an unsigned 64-bit integer'))], jsonSchema: { ...this.__def.jsonSchema, type: 'integer', minimum: 0 }, errorMessage: resolveErrorMessage(message, 'Expected an unsigned 64-bit integer') }); }
  int32(message?: ErrorParam): VldNumberV2 { return this.withDef({ type: 'number', checks: [...this.__def.checks, new VldNumberCheckInt32(resolveErrorMessage(message, 'Expected a signed 32-bit integer'))], jsonSchema: { ...this.__def.jsonSchema, type: 'integer', minimum: -2147483648, maximum: 2147483647 }, errorMessage: resolveErrorMessage(message, 'Expected a signed 32-bit integer') }); }
  int64(message?: ErrorParam): VldNumberV2 { return this.withDef({ type: 'number', checks: [...this.__def.checks, new VldNumberCheckInt64(resolveErrorMessage(message, 'Expected a signed 64-bit integer'))], jsonSchema: { ...this.__def.jsonSchema, type: 'integer' }, errorMessage: resolveErrorMessage(message, 'Expected a signed 64-bit integer') }); }
  float32(message?: ErrorParam): VldNumberV2 { return this.withDef({ type: 'number', checks: [...this.__def.checks, new VldNumberCheckFloat32(resolveErrorMessage(message, 'Expected a 32-bit float'))], jsonSchema: { ...this.__def.jsonSchema, minimum: -3.4e38, maximum: 3.4e38 }, errorMessage: resolveErrorMessage(message, 'Expected a 32-bit float') }); }
  float64(message?: ErrorParam): VldNumberV2 { return this.withDef({ type: 'number', checks: [...this.__def.checks, new VldNumberCheckFinite(resolveErrorMessage(message, 'Expected a 64-bit float'))], errorMessage: resolveErrorMessage(message, 'Expected a 64-bit float') }); }
}

const EMPTY_COERCE_NUMBER_DEF: VldNumberDef = Object.freeze({
  type: 'number',
  checks: Object.freeze([]) as ReadonlyArray<VldNumberCheck>,
  isSimple: true,
});

export class VldCoerceNumberV2 extends VldNumberV2 {
  constructor(def: VldNumberDef = EMPTY_COERCE_NUMBER_DEF) {
    super(def);
    (this as any).validatorType = VLD_VALIDATOR_TYPES.COERCE_NUMBER;
  }

  static override create(): VldCoerceNumberV2 { return new VldCoerceNumberV2(); }

  override parse(value: unknown): number {
    let coerced: number;
    if (typeof value === 'number') coerced = value;
    else if (typeof value === 'string' && value.trim() !== '') {
      const n = Number(value);
      if (Number.isNaN(n)) throw new Error(getMessages().coercionFailed('number', value));
      coerced = n;
    } else if (typeof value === 'boolean') coerced = value ? 1 : 0;
    else if (typeof value === 'bigint') {
      // Number(bigint) either returns a finite number or throws RangeError;
      // it never returns NaN, so no NaN check is needed here.
      coerced = Number(value);
    } else if (value === null) coerced = 0;
    else throw new Error(getMessages().coercionFailed('number', value));

    if (!Number.isFinite(coerced)) {
      throw new Error(getMessages().coercionFailed('number', value));
    }
    return super.parse(coerced);
  }
}
