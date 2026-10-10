import { VldBase, ParseResult, VLD_VALIDATOR_TYPES, ValidatorType, type ErrorParam, resolveErrorMessage } from './base';
import { getMessages } from '../locales/runtime';
import { VldError, getTypeName, createInvalidTypeIssue, type VldIssue } from '../errors-core';

/**
 * Type for number validation check functions
 */
type NumberCheck = (value: number) => boolean;

/** Largest finite IEEE 754 single-precision value. */
export const FLOAT32_MAX = 3.4028234663852886e38;

function decimalPlaces(n: number): number {
  const match = /(?:\.(\d+))?(?:e([+-]\d+))?$/i.exec(String(n));
  const fraction = match?.[1]?.length ?? 0;
  const exponent = match?.[2] ? Number(match[2]) : 0;
  return Math.max(0, fraction - exponent);
}

/**
 * `value` is a multiple of `step`. Decimal steps such as 0.1 are not exactly
 * representable in binary, so `2.3 % 0.1` is not ~0; those are compared in
 * scaled integer space (like Zod's floatSafeRemainder).
 * @internal
 */
export function isMultipleOf(value: number, step: number): boolean {
  const remainder = Math.abs(value % step);
  if (remainder < Number.EPSILON || Math.abs(remainder - Math.abs(step)) < Number.EPSILON) {
    return true;
  }
  if (Number.isInteger(step)) {
    return false;
  }
  const places = Math.max(decimalPlaces(value), decimalPlaces(step));
  const scale = 10 ** places;
  const scaledValue = Math.round(value * scale);
  const scaledStep = Math.round(step * scale);
  // The scaled doubles are exact integers only while |scaled| * 2^-52 stays well below 0.5 (2^50 leaves a wide margin).
  if (Math.abs(scaledValue) <= 2 ** 50 && Math.abs(scaledStep) <= 2 ** 50) {
    return scaledStep !== 0 && scaledValue % scaledStep === 0;
  }
  // Larger scaled values are no longer exact doubles: compare the shortest decimal forms exactly.
  const bigValue = scaleDecimal(value, places);
  const bigStep = scaleDecimal(step, places);
  return bigValue !== undefined && bigStep !== undefined && bigStep !== 0n && bigValue % bigStep === 0n;
}

/** `n` (its shortest decimal form) times 10^places as an exact BigInt; undefined for non-finite numbers. */
function scaleDecimal(n: number, places: number): bigint | undefined {
  const match = /^(-?)(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i.exec(String(n));
  if (!match) return undefined;
  const fraction = match[3] ?? '';
  const shift = places - fraction.length + (match[4] ? Number(match[4]) : 0);
  const digits = BigInt(match[2]! + fraction) * 10n ** BigInt(Math.max(shift, 0));
  return match[1] ? -digits : digits;
}
type NumberFastCheckMode = 'none' | 'positive' | 'positive-int' | undefined;

/**
 * Metadata for a single number constraint, enabling Zod 4-compatible issues.
 */
interface NumberCheckMeta {
  readonly kind: 'min' | 'max' | 'int' | 'gt' | 'lt' | 'multiple_of' | 'finite' | 'safe' | 'bounded' | 'other';
  readonly value?: number;
  readonly inclusive?: boolean;
  readonly message: string | undefined;
  /** `bounded` (uint32, int64, float32, ...): the range and integer flag of the format. */
  readonly minimum?: number;
  readonly maximum?: number;
  readonly integer?: boolean;
}

interface NumberJSONSchemaHints {
  type?: 'number' | 'integer';
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;
}

/**
 * Configuration for number validator
 */
interface NumberValidatorConfig {
  readonly checks: ReadonlyArray<NumberCheck>;
  readonly errorMessage: string | undefined;
  readonly validatorType?: ValidatorType;
  readonly jsonSchema: NumberJSONSchemaHints | undefined;
  readonly checkMetas: ReadonlyArray<NumberCheckMeta> | undefined;
}

/**
 * Immutable number validator with chainable methods
 */
export class VldNumber extends VldBase<number, number> {
  protected readonly config: NumberValidatorConfig;
  private readonly _checks: ReadonlyArray<NumberCheck>;
  private readonly _isSimple: boolean;
  private readonly _fastCheckMode: NumberFastCheckMode;
  private readonly _checkMetas: ReadonlyArray<NumberCheckMeta> | undefined;

  /**
   * Protected constructor to allow extension while maintaining immutability
   */
  protected constructor(config?: Partial<NumberValidatorConfig>) {
    super(config?.validatorType || VLD_VALIDATOR_TYPES.NUMBER);
    this.config = {
      checks: config?.checks || [],
      errorMessage: config?.errorMessage,
      jsonSchema: config?.jsonSchema,
      checkMetas: config?.checkMetas
    };
    this._checks = this.config.checks;
    this._isSimple = this._checks.length === 0;
    this._fastCheckMode = this.detectFastCheckMode();
    this._checkMetas = this.config.checkMetas;
  }

  /**
   * Build a sibling validator with `config`, keeping the concrete subclass
   * (e.g. v.coerce.*) so every chain method preserves coercion.
   */
  protected derive(config: Partial<NumberValidatorConfig>): this {
    return new (this.constructor as new (config: Partial<NumberValidatorConfig>) => this)(config);
  }

  private detectFastCheckMode(): NumberFastCheckMode {
    if (this._checks.length === 0) {
      return 'none';
    }
    // Decide from the per-check metadata, not the JSON Schema hints: hints
    // such as type 'integer' are also set by safe()/int32()/..., which would
    // otherwise let positive() skip those checks entirely.
    const metas = this.config.checkMetas;
    if (metas === undefined) {
      // Internal construction without metadata: fall back to the hints.
      const schema = this.config.jsonSchema;
      if (schema?.exclusiveMinimum !== 0) return undefined;
      if (this._checks.length === 1 && schema.type !== 'integer') return 'positive';
      if (this._checks.length === 2 && schema.type === 'integer') return 'positive-int';
      return undefined;
    }
    if (metas.length !== this._checks.length) {
      return undefined;
    }
    const isPositive = (m: NumberCheckMeta) => m.kind === 'gt' && m.value === 0;
    if (metas.length === 1 && isPositive(metas[0]!)) {
      return 'positive';
    }
    if (metas.length === 2 && metas.some(isPositive) && metas.some(m => m.kind === 'int')) {
      return 'positive-int';
    }
    return undefined;
  }

  /**
   * Returns true if this validator has custom checks (min, max, positive, etc.)
   * Used by VldObject for optimized fast-path dispatch
   */
  get hasCustomChecks(): boolean {
    return !this._isSimple;
  }

  /**
   * Returns true if this is a simple number validator with no custom checks
   * Used by VldObject for optimized fast-path dispatch
   */
  get isSimple(): boolean {
    return this._isSimple;
  }

  get minValue(): number | null {
    return this.config.jsonSchema?.minimum ?? this.config.jsonSchema?.exclusiveMinimum ?? null;
  }

  get maxValue(): number | null {
    return this.config.jsonSchema?.maximum ?? this.config.jsonSchema?.exclusiveMaximum ?? null;
  }

  get isInt(): boolean {
    return this.config.jsonSchema?.type === 'integer';
  }

  get isFinite(): boolean {
    return true;
  }

  get format(): string | null {
    return (this.config.jsonSchema as any)?.format ?? null;
  }
  
  /**
   * Create a new number validator
   */
  static create(): VldNumber {
    return new VldNumber();
  }
  
  /**
   * Parse and validate a number value
   * Zod 4 behavior: Infinity and NaN are rejected by default (they are not valid numbers).
   */
  parse(value: unknown): number {
    // Zod 4 rejects Infinity, -Infinity, and NaN for z.number()
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new VldError([createInvalidTypeIssue('number', getTypeName(value), this._typeMessage(value))]);
    }

    switch (this._fastCheckMode) {
      case 'none':
        return value;
      case 'positive':
        if (value > 0) return value;
        throw new VldError([this._createCheckIssue('gt', 0, this.config.errorMessage)]);
      case 'positive-int':
        if (value > 0 && Number.isSafeInteger(value)) return value;
        throw new VldError([this._positiveIntIssue(value)]);
    }

    return this.parseKnownNumber(value);
  }

  /**
   * Message for an invalid_type issue. A non-number gets the type message, not
   * the last check's message (min/max/...); NaN / Infinity keep the configured
   * message, which is what finite() reports.
   */
  private _typeMessage(value: unknown): string | undefined {
    return typeof value === 'number' ? this.config.errorMessage : undefined;
  }

  /**
   * Build the Zod 4-compatible VldIssue for a failed number check.
   */
  private _createCheckIssue(kind: string, value: number | undefined, message: string | undefined): VldIssue {
    switch (kind) {
      case 'min':
        return { code: 'too_small', path: [], origin: 'number', minimum: value!, inclusive: true, message: message || `Too small: expected number to be >=${value}` };
      case 'max':
        return { code: 'too_big', path: [], origin: 'number', maximum: value!, inclusive: true, message: message || `Too big: expected number to be <=${value}` };
      case 'gt':
        return { code: 'too_small', path: [], origin: 'number', minimum: value!, inclusive: false, message: message || `Too small: expected number to be >${value}` };
      case 'lt':
        return { code: 'too_big', path: [], origin: 'number', maximum: value!, inclusive: false, message: message || `Too big: expected number to be <${value}` };
      case 'int':
        return { code: 'invalid_type', path: [], expected: 'int', received: 'number', message: message || 'Invalid input: expected int, received number' };
      case 'multiple_of':
        return { code: 'not_multiple_of', path: [], origin: 'number', divisor: value!, message: message || `Invalid number: must be a multiple of ${value}` };
      default:
        return { code: 'custom', path: [], message: message || 'Invalid number' };
    }
  }

  /**
   * Issue for a failed positive()+int() fast path: a non-positive value is
   * too_small (not an int error), each with its own check's message.
   */
  private _positiveIntIssue(value: number): VldIssue {
    const kind = value > 0 ? 'int' : 'gt';
    const meta = this._checkMetas?.find(m => m.kind === kind);
    if (kind === 'int') return this._intIssue(value, meta ? meta.message : this.config.errorMessage);
    return this._createCheckIssue(kind, 0, meta ? meta.message : this.config.errorMessage);
  }

  private _issueForFailedMeta(meta: NumberCheckMeta, value: number): VldIssue {
    if (meta.kind === 'bounded') return this._boundedIssue(meta, value);
    return meta.kind === 'int' ? this._intIssue(value, meta.message) : this._createCheckIssue(meta.kind, meta.value, meta.message);
  }

  /** Numeric formats fail as Zod's do: not an int, below the range, or above it. */
  private _boundedIssue(meta: NumberCheckMeta, value: number): VldIssue {
    if (meta.integer && !Number.isInteger(value)) return this._createCheckIssue('int', undefined, meta.message);
    if (meta.minimum !== undefined && value < meta.minimum) return this._createCheckIssue('min', meta.minimum, meta.message);
    return this._createCheckIssue('max', meta.maximum, meta.message);
  }

  /** int() failure: an integer outside the safe range is too_big / too_small (Zod). */
  private _intIssue(value: number, message: string | undefined): VldIssue {
    if (Number.isInteger(value)) {
      const tooBig = value > 0;
      const bound = tooBig ? Number.MAX_SAFE_INTEGER : Number.MIN_SAFE_INTEGER;
      return {
        code: tooBig ? 'too_big' : 'too_small',
        path: [],
        origin: 'int',
        ...(tooBig ? { maximum: bound } : { minimum: bound }),
        inclusive: true,
        note: 'Integers must be within the safe integer range.',
        message: message || `${tooBig ? 'Too big' : 'Too small'}: expected int to be ${tooBig ? '<=' : '>='}${bound}`
      };
    }
    return this._createCheckIssue('int', undefined, message);
  }

  /**
   * Run all checks against a known number and return the index of the first failing check, or -1.
   */
  /**
   * JSON Schema hints for int() / safe(): an integer within the safe range
   * (as Zod emits), keeping any narrower bound set earlier in the chain.
   */
  private _safeIntegerHints(): NumberJSONSchemaHints {
    const hints = this.config.jsonSchema;
    return {
      ...hints,
      type: 'integer',
      minimum: Math.max(hints?.minimum ?? Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER),
      maximum: Math.min(hints?.maximum ?? Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)
    };
  }

  /**
   * Metas for the checks already present. Checks added without a meta (e.g.
   * finite(), between()) leave the list missing; pad it with fallback metas so
   * a new meta lands at its own check's index instead of an earlier one.
   */
  private _metasForExistingChecks(): ReadonlyArray<NumberCheckMeta> {
    return this.config.checkMetas ?? this.config.checks.map(() => ({ kind: 'other' as const, message: this.config.errorMessage }));
  }

  private _findFailingCheck(value: number): NumberCheckMeta | null {
    const checks = this._checks;
    const metas = this._checkMetas;
    for (let i = 0; i < checks.length; i++) {
      if (!checks[i]!(value)) return metas?.[i] ?? { kind: 'other', message: this.config.errorMessage };
    }
    return null;
  }

  /**
   * Parse a value that has already passed the number type guard.
   * @internal Used by object validators to avoid duplicate hot-path checks.
   */
  parseKnownNumber(value: number): number {
    switch (this._fastCheckMode) {
      case 'none':
        return value;
      case 'positive':
        if (value > 0) return value;
        throw new VldError([this._createCheckIssue('gt', 0, this.config.errorMessage)]);
      case 'positive-int':
        if (value > 0 && Number.isSafeInteger(value)) return value;
        throw new VldError([this._positiveIntIssue(value)]);
    }

    const failedMeta = this._findFailingCheck(value);
    if (failedMeta) {
      throw new VldError([this._issueForFailedMeta(failedMeta, value)]);
    }
    return value;
  }

  /**
   * Safely parse and validate a number value
   */
  safeParse(value: unknown): ParseResult<number> {
    // Zod 4 rejects Infinity, -Infinity, and NaN for z.number()
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return { success: false, error: new VldError([createInvalidTypeIssue('number', getTypeName(value), this._typeMessage(value))]) };
    }

    try {
      const failedMeta = this._findFailingCheck(value);
      if (failedMeta) {
        return { success: false, error: new VldError([this._issueForFailedMeta(failedMeta, value)]) };
      }
    } catch (error) {
      if (error instanceof VldError) return { success: false, error };
      return { success: false, error: new VldError([{ code: 'custom', path: [], message: (error as Error).message }]) };
    }

    return { success: true, data: value };
  }
  
  /**
   * Create a new validator with minimum value constraint
   */
  min(value: number, message?: ErrorParam): VldNumber {
    return this.derive({
      checks: [...this.config.checks, (v: number) => v >= value],
      errorMessage: resolveErrorMessage(message, getMessages().numberMin(value)),
      jsonSchema: { ...this.config.jsonSchema, minimum: value },
      checkMetas: [...this._metasForExistingChecks(), { kind: 'min', value, inclusive: true, message: resolveErrorMessage(message, getMessages().numberMin(value)) }]
    });
  }
  
  /**
   * Create a new validator with maximum value constraint
   */
  max(value: number, message?: ErrorParam): VldNumber {
    return this.derive({
      checks: [...this.config.checks, (v: number) => v <= value],
      errorMessage: resolveErrorMessage(message, getMessages().numberMax(value)),
      jsonSchema: { ...this.config.jsonSchema, maximum: value },
      checkMetas: [...this._metasForExistingChecks(), { kind: 'max', value, inclusive: true, message: resolveErrorMessage(message, getMessages().numberMax(value)) }]
    });
  }
  
  /**
   * Create a new validator that checks for integer values
   */
  int(message?: ErrorParam): VldNumber {
    return this.derive({
      // Safe range, as Zod: 2 ** 60 is an integer but not one a number can represent exactly.
      checks: [...this.config.checks, (v: number) => Number.isSafeInteger(v)],
      errorMessage: resolveErrorMessage(message, getMessages().numberInt),
      jsonSchema: this._safeIntegerHints(),
      checkMetas: [...this._metasForExistingChecks(), { kind: 'int', message: resolveErrorMessage(message, getMessages().numberInt) }]
    });
  }
  
  /**
   * Create a new validator that checks for positive values
   */
  positive(message?: ErrorParam): VldNumber {
    return this.derive({
      checks: [...this.config.checks, (v: number) => v > 0],
      errorMessage: resolveErrorMessage(message, getMessages().numberPositive),
      jsonSchema: { ...this.config.jsonSchema, exclusiveMinimum: 0 },
      checkMetas: [...this._metasForExistingChecks(), { kind: 'gt', value: 0, inclusive: false, message: resolveErrorMessage(message, getMessages().numberPositive) }]
    });
  }
  
  /**
   * Create a new validator that checks for negative values
   */
  negative(message?: ErrorParam): VldNumber {
    return this.derive({
      checks: [...this.config.checks, (v: number) => v < 0],
      errorMessage: resolveErrorMessage(message, getMessages().numberNegative),
      jsonSchema: { ...this.config.jsonSchema, exclusiveMaximum: 0 },
      checkMetas: [...this._metasForExistingChecks(), { kind: 'lt', value: 0, inclusive: false, message: resolveErrorMessage(message, getMessages().numberNegative) }]
    });
  }
  
  /**
   * Create a new validator that checks for non-negative values
   */
  nonnegative(message?: ErrorParam): VldNumber {
    return this.derive({
      checks: [...this.config.checks, (v: number) => v >= 0],
      errorMessage: resolveErrorMessage(message, getMessages().numberNonnegative),
      jsonSchema: { ...this.config.jsonSchema, minimum: 0 },
      checkMetas: [...this._metasForExistingChecks(), { kind: 'min', value: 0, inclusive: true, message: resolveErrorMessage(message, getMessages().numberNonnegative) }]
    });
  }
  
  /**
   * Create a new validator that checks for non-positive values
   */
  nonpositive(message?: ErrorParam): VldNumber {
    return this.derive({
      checks: [...this.config.checks, (v: number) => v <= 0],
      errorMessage: resolveErrorMessage(message, getMessages().numberNonpositive),
      jsonSchema: { ...this.config.jsonSchema, maximum: 0 },
      checkMetas: [...this._metasForExistingChecks(), { kind: 'max', value: 0, inclusive: true, message: resolveErrorMessage(message, getMessages().numberNonpositive) }]
    });
  }
  
  /**
   * Create a new validator that checks for finite values
   */
  finite(message?: ErrorParam): VldNumber {
    return this.derive({
      checks: [...this.config.checks, (v: number) => Number.isFinite(v)],
      errorMessage: resolveErrorMessage(message, getMessages().numberFinite),
      jsonSchema: this.config.jsonSchema,
      checkMetas: [...this._metasForExistingChecks(), { kind: 'other', message: resolveErrorMessage(message, getMessages().numberFinite) }]
    });
  }
  
  /**
   * Create a new validator that checks for safe integer values
   */
  safe(message?: ErrorParam): VldNumber {
    return this.derive({
      checks: [...this.config.checks, (v: number) => Number.isSafeInteger(v)],
      errorMessage: resolveErrorMessage(message, getMessages().numberSafe),
      jsonSchema: this._safeIntegerHints(),
      checkMetas: [...this._metasForExistingChecks(), { kind: 'int', message: resolveErrorMessage(message, getMessages().numberSafe) }]
    });
  }
  
  /**
   * Create a new validator that checks if value is multiple of another
   */
  multipleOf(value: number, message?: ErrorParam): VldNumber {
    return this.derive({
      checks: [...this.config.checks, (v: number) => {
        return isMultipleOf(v, value);
      }],
      errorMessage: resolveErrorMessage(message, getMessages().numberMultipleOf(value)),
      jsonSchema: { ...this.config.jsonSchema, multipleOf: value },
      checkMetas: [...this._metasForExistingChecks(), { kind: 'multiple_of', value, message: resolveErrorMessage(message, getMessages().numberMultipleOf(value)) }]
    });
  }
  
  /**
   * Alias for multipleOf
   */
  step(value: number, message?: ErrorParam): VldNumber {
    return this.multipleOf(value, message);
  }
  
  /**
   * Create a new validator with a range constraint
   */
  between(min: number, max: number, message?: ErrorParam): VldNumber {
    return this.derive({
      checks: [...this.config.checks, (v: number) => v >= min && v <= max],
      errorMessage: resolveErrorMessage(message, `Number must be between ${min} and ${max}`),
      jsonSchema: { ...this.config.jsonSchema, minimum: min, maximum: max },
      checkMetas: [...this._metasForExistingChecks(), { kind: 'other', message: resolveErrorMessage(message, `Number must be between ${min} and ${max}`) }]
    });
  }
  
  /**
   * Create a new validator that checks for even numbers
   * BUG-011 FIX: Require integers for even/odd validation (more mathematically correct)
   */
  even(message?: ErrorParam): VldNumber {
    return this.derive({
      checks: [...this.config.checks, (v: number) => {
        // Even/odd only makes sense for integers
        if (!Number.isInteger(v)) {
          return false;
        }
        return v % 2 === 0;
      }],
      errorMessage: resolveErrorMessage(message, 'Number must be even'),
      jsonSchema: { ...this.config.jsonSchema, type: 'integer', multipleOf: 2 },
      checkMetas: [...this._metasForExistingChecks(), { kind: 'other', message: resolveErrorMessage(message, 'Number must be even') }]
    });
  }

  /**
   * Create a new validator that checks for odd numbers
   * BUG-011 FIX: Require integers for even/odd validation (more mathematically correct)
   */
  odd(message?: ErrorParam): VldNumber {
    return this.derive({
      checks: [...this.config.checks, (v: number) => {
        // Even/odd only makes sense for integers
        if (!Number.isInteger(v)) {
          return false;
        }
        return v % 2 !== 0;
      }],
      errorMessage: resolveErrorMessage(message, 'Number must be odd'),
      jsonSchema: { ...this.config.jsonSchema, type: 'integer' },
      checkMetas: [...this._metasForExistingChecks(), { kind: 'other', message: resolveErrorMessage(message, 'Number must be odd') }]
    });
  }

  /**
   * Create a new validator with strict greater than constraint
   * Zod 4 API parity - strictly greater than (not equal to)
   */
  gt(value: number, message?: ErrorParam): VldNumber {
    return this.derive({
      checks: [...this.config.checks, (v: number) => v > value],
      errorMessage: resolveErrorMessage(message, `Number must be greater than ${value}`),
      jsonSchema: { ...this.config.jsonSchema, exclusiveMinimum: value },
      checkMetas: [...this._metasForExistingChecks(), { kind: 'gt', value, inclusive: false, message: resolveErrorMessage(message, `Number must be greater than ${value}`) }]
    });
  }

  /**
   * Create a new validator with strict less than constraint
   * Zod 4 API parity - strictly less than (not equal to)
   */
  lt(value: number, message?: ErrorParam): VldNumber {
    return this.derive({
      checks: [...this.config.checks, (v: number) => v < value],
      errorMessage: resolveErrorMessage(message, `Number must be less than ${value}`),
      jsonSchema: { ...this.config.jsonSchema, exclusiveMaximum: value },
      checkMetas: [...this._metasForExistingChecks(), { kind: 'lt', value, inclusive: false, message: resolveErrorMessage(message, `Number must be less than ${value}`) }]
    });
  }

  /**
   * Create a new validator with greater than or equal constraint
   * Zod 4 API parity - alias for min()
   */
  gte(value: number, message?: ErrorParam): VldNumber {
    return this.min(value, message);
  }

  /**
   * Create a new validator with less than or equal constraint
   * Zod 4 API parity - alias for max()
   */
  lte(value: number, message?: ErrorParam): VldNumber {
    return this.max(value, message);
  }

  /**
   * Create a validator for unsigned 32-bit integers
   * Range: 0 to 4,294,967,295
   */
  uint32(message?: ErrorParam): VldNumber {
    return this.derive({
      checks: [...this.config.checks, (v: number) => Number.isSafeInteger(v) && v >= 0 && v <= 4294967295],
      errorMessage: resolveErrorMessage(message, 'Expected an unsigned 32-bit integer'),
      jsonSchema: { ...this.config.jsonSchema, type: 'integer', minimum: 0, maximum: 4294967295 },
      checkMetas: [...this._metasForExistingChecks(), { kind: 'bounded', minimum: 0, maximum: 4294967295, integer: true, message: resolveErrorMessage(message, 'Expected an unsigned 32-bit integer') }]
    });
  }

  /**
   * Create a validator for unsigned 64-bit integers
   * Range: 0 to 2^53-1 (safe integer limit)
   */
  uint64(message?: ErrorParam): VldNumber {
    return this.derive({
      checks: [...this.config.checks, (v: number) => Number.isSafeInteger(v) && v >= 0],
      errorMessage: resolveErrorMessage(message, 'Expected an unsigned 64-bit integer'),
      jsonSchema: { ...this.config.jsonSchema, type: 'integer', minimum: 0 },
      checkMetas: [...this._metasForExistingChecks(), { kind: 'bounded', minimum: 0, maximum: Number.MAX_SAFE_INTEGER, integer: true, message: resolveErrorMessage(message, 'Expected an unsigned 64-bit integer') }]
    });
  }

  /**
   * Create a validator for signed 32-bit integers
   * Range: -2,147,483,648 to 2,147,483,647
   */
  int32(message?: ErrorParam): VldNumber {
    return this.derive({
      checks: [...this.config.checks, (v: number) => Number.isSafeInteger(v) && v >= -2147483648 && v <= 2147483647],
      errorMessage: resolveErrorMessage(message, 'Expected a signed 32-bit integer'),
      jsonSchema: { ...this.config.jsonSchema, type: 'integer', minimum: -2147483648, maximum: 2147483647 },
      checkMetas: [...this._metasForExistingChecks(), { kind: 'bounded', minimum: -2147483648, maximum: 2147483647, integer: true, message: resolveErrorMessage(message, 'Expected a signed 32-bit integer') }]
    });
  }

  /**
   * Create a validator for signed 64-bit integers
   * Range: -(2^53-1) to 2^53-1 (safe integer limit)
   */
  int64(message?: ErrorParam): VldNumber {
    return this.derive({
      checks: [...this.config.checks, (v: number) => Number.isSafeInteger(v)],
      errorMessage: resolveErrorMessage(message, 'Expected a signed 64-bit integer'),
      jsonSchema: { ...this.config.jsonSchema, type: 'integer' },
      checkMetas: [...this._metasForExistingChecks(), { kind: 'bounded', minimum: Number.MIN_SAFE_INTEGER, maximum: Number.MAX_SAFE_INTEGER, integer: true, message: resolveErrorMessage(message, 'Expected a signed 64-bit integer') }]
    });
  }

  /**
   * Create a validator for 32-bit floats (IEEE 754 single precision)
   * Range: -3.4e38 to 3.4e38, precision ~7 decimal digits
   */
  float32(message?: ErrorParam): VldNumber {
    return this.derive({
      checks: [...this.config.checks, (v: number) => Number.isFinite(v) && Math.abs(v) <= FLOAT32_MAX],
      errorMessage: resolveErrorMessage(message, 'Expected a 32-bit float'),
      jsonSchema: { ...this.config.jsonSchema, minimum: -FLOAT32_MAX, maximum: FLOAT32_MAX },
      checkMetas: [...this._metasForExistingChecks(), { kind: 'bounded', minimum: -FLOAT32_MAX, maximum: FLOAT32_MAX, message: resolveErrorMessage(message, 'Expected a 32-bit float') }]
    });
  }

  /**
   * Create a validator for 64-bit floats (IEEE 754 double precision)
   * Alias for standard number validation
   */
  float64(message?: ErrorParam): VldNumber {
    return this.derive({
      checks: [...this.config.checks, (v: number) => Number.isFinite(v)],
      errorMessage: resolveErrorMessage(message, 'Expected a 64-bit float'),
      jsonSchema: this.config.jsonSchema,
      checkMetas: [...this._metasForExistingChecks(), { kind: 'other', message: resolveErrorMessage(message, 'Expected a 64-bit float') }]
    });
  }
}
