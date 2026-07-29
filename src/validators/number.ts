import { VldBase, ParseResult, VLD_VALIDATOR_TYPES, ValidatorType, type ErrorParam, resolveErrorMessage } from './base';
import { getMessages } from '../locales/runtime';
import { VldError, getTypeName, createInvalidTypeIssue, type VldIssue } from '../errors-core';

/**
 * Type for number validation check functions
 */
type NumberCheck = (value: number) => boolean;
type NumberFastCheckMode = 'none' | 'positive' | 'positive-int' | undefined;

/**
 * Metadata for a single number constraint, enabling Zod 4-compatible issues.
 */
interface NumberCheckMeta {
  readonly kind: 'min' | 'max' | 'int' | 'gt' | 'lt' | 'multiple_of' | 'finite' | 'safe' | 'other';
  readonly value?: number;
  readonly inclusive?: boolean;
  readonly message: string | undefined;
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

  private detectFastCheckMode(): NumberFastCheckMode {
    const schema = this.config.jsonSchema;
    if (this._checks.length === 0) {
      return 'none';
    }
    if (
      this._checks.length === 1 &&
      schema?.exclusiveMinimum === 0 &&
      schema.type !== 'integer'
    ) {
      return 'positive';
    }
    if (
      this._checks.length === 2 &&
      schema?.exclusiveMinimum === 0 &&
      schema.type === 'integer'
    ) {
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
      throw new VldError([createInvalidTypeIssue('number', getTypeName(value), this.config.errorMessage)]);
    }

    switch (this._fastCheckMode) {
      case 'none':
        return value;
      case 'positive':
        if (value > 0) return value;
        throw new VldError([this._createCheckIssue('gt', 0, this.config.errorMessage)]);
      case 'positive-int':
        if (value > 0 && Number.isInteger(value)) return value;
        throw new VldError([this._createCheckIssue('int', undefined, this.config.errorMessage)]);
    }

    return this.parseKnownNumber(value);
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
      default:
        return { code: 'custom', path: [], message: message || 'Invalid number' };
    }
  }

  /**
   * Run all checks against a known number and return the index of the first failing check, or -1.
   */
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
        if (value > 0 && Number.isInteger(value)) return value;
        throw new VldError([this._createCheckIssue('int', undefined, this.config.errorMessage)]);
    }

    const failedMeta = this._findFailingCheck(value);
    if (failedMeta) {
      throw new VldError([this._createCheckIssue(failedMeta.kind, failedMeta.value, failedMeta.message)]);
    }
    return value;
  }

  /**
   * Safely parse and validate a number value
   */
  safeParse(value: unknown): ParseResult<number> {
    // Zod 4 rejects Infinity, -Infinity, and NaN for z.number()
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return { success: false, error: new VldError([createInvalidTypeIssue('number', getTypeName(value), this.config.errorMessage)]) };
    }

    try {
      const failedMeta = this._findFailingCheck(value);
      if (failedMeta) {
        return { success: false, error: new VldError([this._createCheckIssue(failedMeta.kind, failedMeta.value, failedMeta.message)]) };
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
    return new VldNumber({
      checks: [...this.config.checks, (v: number) => v >= value],
      errorMessage: resolveErrorMessage(message, getMessages().numberMin(value)),
      jsonSchema: { ...this.config.jsonSchema, minimum: value },
      checkMetas: [...(this.config.checkMetas ?? []), { kind: 'min', value, inclusive: true, message: resolveErrorMessage(message, getMessages().numberMin(value)) }]
    });
  }
  
  /**
   * Create a new validator with maximum value constraint
   */
  max(value: number, message?: ErrorParam): VldNumber {
    return new VldNumber({
      checks: [...this.config.checks, (v: number) => v <= value],
      errorMessage: resolveErrorMessage(message, getMessages().numberMax(value)),
      jsonSchema: { ...this.config.jsonSchema, maximum: value },
      checkMetas: [...(this.config.checkMetas ?? []), { kind: 'max', value, inclusive: true, message: resolveErrorMessage(message, getMessages().numberMax(value)) }]
    });
  }
  
  /**
   * Create a new validator that checks for integer values
   */
  int(message?: ErrorParam): VldNumber {
    return new VldNumber({
      checks: [...this.config.checks, (v: number) => Number.isInteger(v)],
      errorMessage: resolveErrorMessage(message, getMessages().numberInt),
      jsonSchema: { ...this.config.jsonSchema, type: 'integer' },
      checkMetas: [...(this.config.checkMetas ?? []), { kind: 'int', message: resolveErrorMessage(message, getMessages().numberInt) }]
    });
  }
  
  /**
   * Create a new validator that checks for positive values
   */
  positive(message?: ErrorParam): VldNumber {
    return new VldNumber({
      checks: [...this.config.checks, (v: number) => v > 0],
      errorMessage: resolveErrorMessage(message, getMessages().numberPositive),
      jsonSchema: { ...this.config.jsonSchema, exclusiveMinimum: 0 },
      checkMetas: [...(this.config.checkMetas ?? []), { kind: 'gt', value: 0, inclusive: false, message: resolveErrorMessage(message, getMessages().numberPositive) }]
    });
  }
  
  /**
   * Create a new validator that checks for negative values
   */
  negative(message?: ErrorParam): VldNumber {
    return new VldNumber({
      checks: [...this.config.checks, (v: number) => v < 0],
      errorMessage: resolveErrorMessage(message, getMessages().numberNegative),
      jsonSchema: { ...this.config.jsonSchema, exclusiveMaximum: 0 },
      checkMetas: [...(this.config.checkMetas ?? []), { kind: 'lt', value: 0, inclusive: false, message: resolveErrorMessage(message, getMessages().numberNegative) }]
    });
  }
  
  /**
   * Create a new validator that checks for non-negative values
   */
  nonnegative(message?: ErrorParam): VldNumber {
    return new VldNumber({
      checks: [...this.config.checks, (v: number) => v >= 0],
      errorMessage: resolveErrorMessage(message, getMessages().numberNonnegative),
      jsonSchema: { ...this.config.jsonSchema, minimum: 0 },
      checkMetas: [...(this.config.checkMetas ?? []), { kind: 'min', value: 0, inclusive: true, message: resolveErrorMessage(message, getMessages().numberNonnegative) }]
    });
  }
  
  /**
   * Create a new validator that checks for non-positive values
   */
  nonpositive(message?: ErrorParam): VldNumber {
    return new VldNumber({
      checks: [...this.config.checks, (v: number) => v <= 0],
      errorMessage: resolveErrorMessage(message, getMessages().numberNonpositive),
      jsonSchema: { ...this.config.jsonSchema, maximum: 0 },
      checkMetas: [...(this.config.checkMetas ?? []), { kind: 'max', value: 0, inclusive: true, message: resolveErrorMessage(message, getMessages().numberNonpositive) }]
    });
  }
  
  /**
   * Create a new validator that checks for finite values
   */
  finite(message?: ErrorParam): VldNumber {
    return new VldNumber({
      checks: [...this.config.checks, (v: number) => Number.isFinite(v)],
      errorMessage: resolveErrorMessage(message, getMessages().numberFinite),
      jsonSchema: this.config.jsonSchema
    });
  }
  
  /**
   * Create a new validator that checks for safe integer values
   */
  safe(message?: ErrorParam): VldNumber {
    return new VldNumber({
      checks: [...this.config.checks, (v: number) => Number.isSafeInteger(v)],
      errorMessage: resolveErrorMessage(message, getMessages().numberSafe),
      jsonSchema: { ...this.config.jsonSchema, type: 'integer' }
    });
  }
  
  /**
   * Create a new validator that checks if value is multiple of another
   */
  multipleOf(value: number, message?: ErrorParam): VldNumber {
    return new VldNumber({
      checks: [...this.config.checks, (v: number) => {
        // Use epsilon comparison for floating point precision
        const remainder = Math.abs(v % value);
        return remainder < Number.EPSILON || Math.abs(remainder - Math.abs(value)) < Number.EPSILON;
      }],
      errorMessage: resolveErrorMessage(message, getMessages().numberMultipleOf(value)),
      jsonSchema: { ...this.config.jsonSchema, multipleOf: value }
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
    return new VldNumber({
      checks: [...this.config.checks, (v: number) => v >= min && v <= max],
      errorMessage: resolveErrorMessage(message, `Number must be between ${min} and ${max}`),
      jsonSchema: { ...this.config.jsonSchema, minimum: min, maximum: max }
    });
  }
  
  /**
   * Create a new validator that checks for even numbers
   * BUG-011 FIX: Require integers for even/odd validation (more mathematically correct)
   */
  even(message?: ErrorParam): VldNumber {
    return new VldNumber({
      checks: [...this.config.checks, (v: number) => {
        // Even/odd only makes sense for integers
        if (!Number.isInteger(v)) {
          return false;
        }
        return v % 2 === 0;
      }],
      errorMessage: resolveErrorMessage(message, 'Number must be even'),
      jsonSchema: { ...this.config.jsonSchema, type: 'integer', multipleOf: 2 }
    });
  }

  /**
   * Create a new validator that checks for odd numbers
   * BUG-011 FIX: Require integers for even/odd validation (more mathematically correct)
   */
  odd(message?: ErrorParam): VldNumber {
    return new VldNumber({
      checks: [...this.config.checks, (v: number) => {
        // Even/odd only makes sense for integers
        if (!Number.isInteger(v)) {
          return false;
        }
        return v % 2 !== 0;
      }],
      errorMessage: resolveErrorMessage(message, 'Number must be odd'),
      jsonSchema: { ...this.config.jsonSchema, type: 'integer' }
    });
  }

  /**
   * Create a new validator with strict greater than constraint
   * Zod 4 API parity - strictly greater than (not equal to)
   */
  gt(value: number, message?: ErrorParam): VldNumber {
    return new VldNumber({
      checks: [...this.config.checks, (v: number) => v > value],
      errorMessage: resolveErrorMessage(message, `Number must be greater than ${value}`),
      jsonSchema: { ...this.config.jsonSchema, exclusiveMinimum: value },
      checkMetas: [...(this.config.checkMetas ?? []), { kind: 'gt', value, inclusive: false, message: resolveErrorMessage(message, `Number must be greater than ${value}`) }]
    });
  }

  /**
   * Create a new validator with strict less than constraint
   * Zod 4 API parity - strictly less than (not equal to)
   */
  lt(value: number, message?: ErrorParam): VldNumber {
    return new VldNumber({
      checks: [...this.config.checks, (v: number) => v < value],
      errorMessage: resolveErrorMessage(message, `Number must be less than ${value}`),
      jsonSchema: { ...this.config.jsonSchema, exclusiveMaximum: value },
      checkMetas: [...(this.config.checkMetas ?? []), { kind: 'lt', value, inclusive: false, message: resolveErrorMessage(message, `Number must be less than ${value}`) }]
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
    return new VldNumber({
      checks: [...this.config.checks, (v: number) => Number.isSafeInteger(v) && v >= 0 && v <= 4294967295],
      errorMessage: resolveErrorMessage(message, 'Expected an unsigned 32-bit integer'),
      jsonSchema: { ...this.config.jsonSchema, type: 'integer', minimum: 0, maximum: 4294967295 }
    });
  }

  /**
   * Create a validator for unsigned 64-bit integers
   * Range: 0 to 2^53-1 (safe integer limit)
   */
  uint64(message?: ErrorParam): VldNumber {
    return new VldNumber({
      checks: [...this.config.checks, (v: number) => Number.isSafeInteger(v) && v >= 0],
      errorMessage: resolveErrorMessage(message, 'Expected an unsigned 64-bit integer'),
      jsonSchema: { ...this.config.jsonSchema, type: 'integer', minimum: 0 }
    });
  }

  /**
   * Create a validator for signed 32-bit integers
   * Range: -2,147,483,648 to 2,147,483,647
   */
  int32(message?: ErrorParam): VldNumber {
    return new VldNumber({
      checks: [...this.config.checks, (v: number) => Number.isSafeInteger(v) && v >= -2147483648 && v <= 2147483647],
      errorMessage: resolveErrorMessage(message, 'Expected a signed 32-bit integer'),
      jsonSchema: { ...this.config.jsonSchema, type: 'integer', minimum: -2147483648, maximum: 2147483647 }
    });
  }

  /**
   * Create a validator for signed 64-bit integers
   * Range: -(2^53-1) to 2^53-1 (safe integer limit)
   */
  int64(message?: ErrorParam): VldNumber {
    return new VldNumber({
      checks: [...this.config.checks, (v: number) => Number.isSafeInteger(v)],
      errorMessage: resolveErrorMessage(message, 'Expected a signed 64-bit integer'),
      jsonSchema: { ...this.config.jsonSchema, type: 'integer' }
    });
  }

  /**
   * Create a validator for 32-bit floats (IEEE 754 single precision)
   * Range: -3.4e38 to 3.4e38, precision ~7 decimal digits
   */
  float32(message?: ErrorParam): VldNumber {
    return new VldNumber({
      checks: [...this.config.checks, (v: number) => Number.isFinite(v) && Math.abs(v) <= 3.4e38],
      errorMessage: resolveErrorMessage(message, 'Expected a 32-bit float'),
      jsonSchema: { ...this.config.jsonSchema, minimum: -3.4e38, maximum: 3.4e38 }
    });
  }

  /**
   * Create a validator for 64-bit floats (IEEE 754 double precision)
   * Alias for standard number validation
   */
  float64(message?: ErrorParam): VldNumber {
    return new VldNumber({
      checks: [...this.config.checks, (v: number) => Number.isFinite(v)],
      errorMessage: resolveErrorMessage(message, 'Expected a 64-bit float'),
      jsonSchema: this.config.jsonSchema
    });
  }
}
