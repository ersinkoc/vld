import { VldBase, ParseResult, VLD_VALIDATOR_TYPES, ValidatorType, type ErrorParam, resolveErrorMessage } from './base';
import { getMessages } from '../locales/runtime';
import { VldError } from '../errors-core';

/**
 * Type for number validation check functions
 */
type NumberCheck = (value: number) => boolean;
type NumberFastCheckMode = 'none' | 'positive' | 'positive-int' | undefined;

function createNumberError(message: string): VldError {
  return new VldError([{ code: 'invalid_number', path: [], message }]);
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
}

/**
 * Immutable number validator with chainable methods
 */
export class VldNumber extends VldBase<number, number> {
  protected readonly config: NumberValidatorConfig;
  private readonly _checks: ReadonlyArray<NumberCheck>;
  private readonly _isSimple: boolean;
  private readonly _fastCheckMode: NumberFastCheckMode;

  /**
   * Protected constructor to allow extension while maintaining immutability
   */
  protected constructor(config?: Partial<NumberValidatorConfig>) {
    super(config?.validatorType || VLD_VALIDATOR_TYPES.NUMBER);
    this.config = {
      checks: config?.checks || [],
      errorMessage: config?.errorMessage,
      jsonSchema: config?.jsonSchema
    };
    this._checks = this.config.checks;
    this._isSimple = this._checks.length === 0;
    this._fastCheckMode = this.detectFastCheckMode();
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
   */
  parse(value: unknown): number {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error(this.config.errorMessage || getMessages().invalidNumber);
    }

    switch (this._fastCheckMode) {
      case 'none':
        return value;
      case 'positive':
        if (value > 0) return value;
        throw new Error(this.config.errorMessage || getMessages().invalidNumber);
      case 'positive-int':
        if (value > 0 && Number.isInteger(value)) return value;
        throw new Error(this.config.errorMessage || getMessages().invalidNumber);
    }

    return this.parseKnownNumber(value);
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
        throw new Error(this.config.errorMessage || getMessages().invalidNumber);
      case 'positive-int':
        if (value > 0 && Number.isInteger(value)) return value;
        throw new Error(this.config.errorMessage || getMessages().invalidNumber);
    }

    const checks = this._checks;
    switch (checks.length) {
      case 1:
        if (checks[0]!(value)) return value;
        break;
      case 2:
        if (checks[0]!(value) && checks[1]!(value)) return value;
        break;
      case 3:
        if (checks[0]!(value) && checks[1]!(value) && checks[2]!(value)) return value;
        break;
      default:
        for (let i = 0; i < checks.length; i++) {
          if (!checks[i]!(value)) {
            throw new Error(this.config.errorMessage || getMessages().invalidNumber);
          }
        }
        return value;
    }

    throw new Error(this.config.errorMessage || getMessages().invalidNumber);
  }

  private passesChecks(value: number): boolean {
    switch (this._fastCheckMode) {
      case 'none':
        return true;
      case 'positive':
        return value > 0;
      case 'positive-int':
        return value > 0 && Number.isInteger(value);
    }

    const checks = this._checks;
    switch (checks.length) {
      case 1:
        return checks[0]!(value);
      case 2:
        return checks[0]!(value) && checks[1]!(value);
      case 3:
        return checks[0]!(value) && checks[1]!(value) && checks[2]!(value);
      default:
        for (let i = 0; i < checks.length; i++) {
          if (!checks[i]!(value)) {
            return false;
          }
        }
        return true;
      }
    }
  
  /**
   * Safely parse and validate a number value
   */
  safeParse(value: unknown): ParseResult<number> {
    try {
      if (typeof value !== 'number' || isNaN(value) || !this.passesChecks(value)) {
        return { success: false, error: createNumberError(this.config.errorMessage || getMessages().invalidNumber) };
      }
      return { success: true, data: value };
    } catch (error) {
      return { success: false, error: createNumberError((error as Error).message) };
    }
  }
  
  /**
   * Create a new validator with minimum value constraint
   */
  min(value: number, message?: ErrorParam): VldNumber {
    return new VldNumber({
      checks: [...this.config.checks, (v: number) => v >= value],
      errorMessage: resolveErrorMessage(message, getMessages().numberMin(value)),
      jsonSchema: { ...this.config.jsonSchema, minimum: value }
    });
  }
  
  /**
   * Create a new validator with maximum value constraint
   */
  max(value: number, message?: ErrorParam): VldNumber {
    return new VldNumber({
      checks: [...this.config.checks, (v: number) => v <= value],
      errorMessage: resolveErrorMessage(message, getMessages().numberMax(value)),
      jsonSchema: { ...this.config.jsonSchema, maximum: value }
    });
  }
  
  /**
   * Create a new validator that checks for integer values
   */
  int(message?: ErrorParam): VldNumber {
    return new VldNumber({
      checks: [...this.config.checks, (v: number) => Number.isInteger(v)],
      errorMessage: resolveErrorMessage(message, getMessages().numberInt),
      jsonSchema: { ...this.config.jsonSchema, type: 'integer' }
    });
  }
  
  /**
   * Create a new validator that checks for positive values
   */
  positive(message?: ErrorParam): VldNumber {
    return new VldNumber({
      checks: [...this.config.checks, (v: number) => v > 0],
      errorMessage: resolveErrorMessage(message, getMessages().numberPositive),
      jsonSchema: { ...this.config.jsonSchema, exclusiveMinimum: 0 }
    });
  }
  
  /**
   * Create a new validator that checks for negative values
   */
  negative(message?: ErrorParam): VldNumber {
    return new VldNumber({
      checks: [...this.config.checks, (v: number) => v < 0],
      errorMessage: resolveErrorMessage(message, getMessages().numberNegative),
      jsonSchema: { ...this.config.jsonSchema, exclusiveMaximum: 0 }
    });
  }
  
  /**
   * Create a new validator that checks for non-negative values
   */
  nonnegative(message?: ErrorParam): VldNumber {
    return new VldNumber({
      checks: [...this.config.checks, (v: number) => v >= 0],
      errorMessage: resolveErrorMessage(message, getMessages().numberNonnegative),
      jsonSchema: { ...this.config.jsonSchema, minimum: 0 }
    });
  }
  
  /**
   * Create a new validator that checks for non-positive values
   */
  nonpositive(message?: ErrorParam): VldNumber {
    return new VldNumber({
      checks: [...this.config.checks, (v: number) => v <= 0],
      errorMessage: resolveErrorMessage(message, getMessages().numberNonpositive),
      jsonSchema: { ...this.config.jsonSchema, maximum: 0 }
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
      jsonSchema: { ...this.config.jsonSchema, exclusiveMinimum: value }
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
      jsonSchema: { ...this.config.jsonSchema, exclusiveMaximum: value }
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
