import { VldBase, ParseResult, VLD_VALIDATOR_TYPES, ValidatorType } from './base';
import { getMessages } from '../locales/runtime';
import { VldError } from '../errors-core';

/**
 * Type for bigint validation check functions
 */
type BigIntCheck = (value: bigint) => boolean;

function createBigIntError(message: string): VldError {
  return new VldError([{ code: 'invalid_type', path: [], message }]);
}

interface BigIntJSONSchemaHints {
  readonly minimum?: bigint;
  readonly maximum?: bigint;
  readonly exclusiveMinimum?: bigint;
  readonly exclusiveMaximum?: bigint;
}

/**
 * Configuration for bigint validator
 */
interface BigIntValidatorConfig {
  readonly checks: ReadonlyArray<BigIntCheck>;
  readonly errorMessage: string | undefined;
  readonly validatorType?: ValidatorType;
  readonly jsonSchema: BigIntJSONSchemaHints | undefined;
}

type BigIntFastCheckMode =
  | 'none'
  | 'positive'
  | 'negative'
  | 'nonnegative'
  | 'nonpositive'
  | undefined;

/**
 * Immutable bigint validator
 */
export class VldBigInt extends VldBase<bigint, bigint> {
  protected readonly config: BigIntValidatorConfig;
  private readonly _checks: ReadonlyArray<BigIntCheck>;
  private readonly _fastCheckMode: BigIntFastCheckMode;

  /**
   * Protected constructor to allow extension while maintaining immutability
   */
  protected constructor(config?: Partial<BigIntValidatorConfig>) {
    super(config?.validatorType || VLD_VALIDATOR_TYPES.BIGINT);
    this.config = {
      checks: config?.checks || [],
      errorMessage: config?.errorMessage,
      jsonSchema: config?.jsonSchema
    };
    this._checks = this.config.checks;
    this._fastCheckMode = this.detectFastCheckMode();
  }

  get jsonSchema(): BigIntJSONSchemaHints | undefined {
    return this.config.jsonSchema;
  }

  get isSimple(): boolean {
    return this._checks.length === 0;
  }
  
  /**
   * Create a new bigint validator
   */
  static create(): VldBigInt {
    return new VldBigInt();
  }

  private detectFastCheckMode(): BigIntFastCheckMode {
    if (this._checks.length === 0) {
      return 'none';
    }

    if (this._checks.length !== 1) {
      return undefined;
    }

    const schema = this.config.jsonSchema;
    if (schema?.exclusiveMinimum === 0n && schema.minimum === undefined && schema.maximum === undefined) {
      return 'positive';
    }
    if (schema?.exclusiveMaximum === 0n && schema.minimum === undefined && schema.maximum === undefined) {
      return 'negative';
    }
    if (schema?.minimum === 0n && schema.maximum === undefined && schema.exclusiveMaximum === undefined) {
      return 'nonnegative';
    }
    if (schema?.maximum === 0n && schema.minimum === undefined && schema.exclusiveMinimum === undefined) {
      return 'nonpositive';
    }

    return undefined;
  }

  private getValidationError(): Error {
    return new Error(this.config.errorMessage || getMessages().invalidBigint);
  }
  
  /**
   * Parse and validate a bigint value
   */
  parse(value: unknown): bigint {
    if (typeof value !== 'bigint') {
      throw this.getValidationError();
    }

    return this.parseKnownBigInt(value);
  }

  /**
   * Parse a value that has already passed the bigint type guard.
   * @internal Used by object validators to avoid duplicate hot-path checks.
   */
  parseKnownBigInt(value: bigint): bigint {
    switch (this._fastCheckMode) {
      case 'none':
        return value;
      case 'positive':
        if (value > 0n) return value;
        throw this.getValidationError();
      case 'negative':
        if (value < 0n) return value;
        throw this.getValidationError();
      case 'nonnegative':
        if (value >= 0n) return value;
        throw this.getValidationError();
      case 'nonpositive':
        if (value <= 0n) return value;
        throw this.getValidationError();
    }

    // Apply all checks
    for (const check of this._checks) {
      if (!check(value)) {
        throw this.getValidationError();
      }
    }
    
    return value;
  }
  
  /**
   * Safely parse and validate a bigint value
   */
  safeParse(value: unknown): ParseResult<bigint> {
    if (typeof value !== 'bigint') {
      return { success: false, error: createBigIntError(this.getValidationError().message) };
    }

    try {
      return { success: true, data: this.parseKnownBigInt(value) };
    } catch (error) {
      return { success: false, error: createBigIntError((error as Error).message) };
    }
  }
  
  /**
   * Create a new validator with minimum value constraint
   */
  min(value: bigint, message?: string): VldBigInt {
    return new VldBigInt({
      ...this.config,
      checks: [...this.config.checks, (v: bigint) => v >= value],
      errorMessage: message || `BigInt must be at least ${value}`,
      jsonSchema: { ...this.config.jsonSchema, minimum: value }
    });
  }
  
  /**
   * Create a new validator with maximum value constraint
   */
  max(value: bigint, message?: string): VldBigInt {
    return new VldBigInt({
      ...this.config,
      checks: [...this.config.checks, (v: bigint) => v <= value],
      errorMessage: message || `BigInt must be at most ${value}`,
      jsonSchema: { ...this.config.jsonSchema, maximum: value }
    });
  }
  
  /**
   * Create a new validator that checks for positive values
   */
  positive(message?: string): VldBigInt {
    return new VldBigInt({
      ...this.config,
      checks: [...this.config.checks, (v: bigint) => v > 0n],
      errorMessage: message || 'BigInt must be positive',
      jsonSchema: { ...this.config.jsonSchema, exclusiveMinimum: 0n }
    });
  }
  
  /**
   * Create a new validator that checks for negative values
   */
  negative(message?: string): VldBigInt {
    return new VldBigInt({
      ...this.config,
      checks: [...this.config.checks, (v: bigint) => v < 0n],
      errorMessage: message || 'BigInt must be negative',
      jsonSchema: { ...this.config.jsonSchema, exclusiveMaximum: 0n }
    });
  }
  
  /**
   * Create a new validator that checks for non-negative values
   */
  nonnegative(message?: string): VldBigInt {
    return new VldBigInt({
      ...this.config,
      checks: [...this.config.checks, (v: bigint) => v >= 0n],
      errorMessage: message || 'BigInt must be non-negative',
      jsonSchema: { ...this.config.jsonSchema, minimum: 0n }
    });
  }
  
  /**
   * Create a new validator that checks for non-positive values
   */
  nonpositive(message?: string): VldBigInt {
    return new VldBigInt({
      ...this.config,
      checks: [...this.config.checks, (v: bigint) => v <= 0n],
      errorMessage: message || 'BigInt must be non-positive',
      jsonSchema: { ...this.config.jsonSchema, maximum: 0n }
    });
  }

  /**
   * Create a new validator with strict greater than constraint
   * Zod 4 API parity - strictly greater than (not equal to)
   */
  gt(value: bigint | number, message?: string): VldBigInt {
    const compareValue = typeof value === 'bigint' ? value : BigInt(value);
    return new VldBigInt({
      ...this.config,
      checks: [...this.config.checks, (v: bigint) => v > compareValue],
      errorMessage: message || `BigInt must be greater than ${compareValue}`,
      jsonSchema: { ...this.config.jsonSchema, exclusiveMinimum: compareValue }
    });
  }

  /**
   * Create a new validator with strict less than constraint
   * Zod 4 API parity - strictly less than (not equal to)
   */
  lt(value: bigint | number, message?: string): VldBigInt {
    const compareValue = typeof value === 'bigint' ? value : BigInt(value);
    return new VldBigInt({
      ...this.config,
      checks: [...this.config.checks, (v: bigint) => v < compareValue],
      errorMessage: message || `BigInt must be less than ${compareValue}`,
      jsonSchema: { ...this.config.jsonSchema, exclusiveMaximum: compareValue }
    });
  }

  /**
   * Create a new validator with greater than or equal constraint
   * Zod 4 API parity - alias for min()
   */
  gte(value: bigint | number, message?: string): VldBigInt {
    const compareValue = typeof value === 'bigint' ? value : BigInt(value);
    return this.min(compareValue, message);
  }

  /**
   * Create a new validator with less than or equal constraint
   * Zod 4 API parity - alias for max()
   */
  lte(value: bigint | number, message?: string): VldBigInt {
    const compareValue = typeof value === 'bigint' ? value : BigInt(value);
    return this.max(compareValue, message);
  }
}
