import { VldBase, ParseResult } from './base';
import { getMessages } from '../locales';

/**
 * Type for bigint validation check functions
 */
type BigIntCheck = (value: bigint) => boolean;

/**
 * Configuration for bigint validator
 */
interface BigIntValidatorConfig {
  readonly checks: ReadonlyArray<BigIntCheck>;
  readonly errorMessage?: string;
}

/**
 * Immutable bigint validator
 */
export class VldBigInt extends VldBase<bigint, bigint> {
  protected readonly config: BigIntValidatorConfig;
  
  /**
   * Protected constructor to allow extension while maintaining immutability
   */
  protected constructor(config?: Partial<BigIntValidatorConfig>) {
    super();
    this.config = {
      checks: config?.checks || [],
      errorMessage: config?.errorMessage
    };
  }
  
  /**
   * Create a new bigint validator
   */
  static create(): VldBigInt {
    return new VldBigInt();
  }
  
  /**
   * Parse and validate a bigint value
   */
  parse(value: unknown): bigint {
    if (typeof value !== 'bigint') {
      throw new Error(this.config.errorMessage || getMessages().invalidBigint);
    }
    
    // Apply all checks
    for (const check of this.config.checks) {
      if (!check(value)) {
        throw new Error(this.config.errorMessage || getMessages().invalidBigint);
      }
    }
    
    return value;
  }
  
  /**
   * Safely parse and validate a bigint value
   */
  safeParse(value: unknown): ParseResult<bigint> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
  
  /**
   * Create a new validator with minimum value constraint
   */
  min(value: bigint, message?: string): VldBigInt {
    return new VldBigInt({
      checks: [...this.config.checks, (v: bigint) => v >= value],
      errorMessage: message || `BigInt must be at least ${value}`
    });
  }
  
  /**
   * Create a new validator with maximum value constraint
   */
  max(value: bigint, message?: string): VldBigInt {
    return new VldBigInt({
      checks: [...this.config.checks, (v: bigint) => v <= value],
      errorMessage: message || `BigInt must be at most ${value}`
    });
  }
  
  /**
   * Create a new validator that checks for positive values
   */
  positive(message?: string): VldBigInt {
    return new VldBigInt({
      checks: [...this.config.checks, (v: bigint) => v > 0n],
      errorMessage: message || 'BigInt must be positive'
    });
  }
  
  /**
   * Create a new validator that checks for negative values
   */
  negative(message?: string): VldBigInt {
    return new VldBigInt({
      checks: [...this.config.checks, (v: bigint) => v < 0n],
      errorMessage: message || 'BigInt must be negative'
    });
  }
  
  /**
   * Create a new validator that checks for non-negative values
   */
  nonnegative(message?: string): VldBigInt {
    return new VldBigInt({
      checks: [...this.config.checks, (v: bigint) => v >= 0n],
      errorMessage: message || 'BigInt must be non-negative'
    });
  }
  
  /**
   * Create a new validator that checks for non-positive values
   */
  nonpositive(message?: string): VldBigInt {
    return new VldBigInt({
      checks: [...this.config.checks, (v: bigint) => v <= 0n],
      errorMessage: message || 'BigInt must be non-positive'
    });
  }

  /**
   * Create a new validator with strict greater than constraint
   * Zod 4 API parity - strictly greater than (not equal to)
   */
  gt(value: bigint | number, message?: string): VldBigInt {
    const compareValue = typeof value === 'bigint' ? value : BigInt(value);
    return new VldBigInt({
      checks: [...this.config.checks, (v: bigint) => v > compareValue],
      errorMessage: message || `BigInt must be greater than ${compareValue}`
    });
  }

  /**
   * Create a new validator with strict less than constraint
   * Zod 4 API parity - strictly less than (not equal to)
   */
  lt(value: bigint | number, message?: string): VldBigInt {
    const compareValue = typeof value === 'bigint' ? value : BigInt(value);
    return new VldBigInt({
      checks: [...this.config.checks, (v: bigint) => v < compareValue],
      errorMessage: message || `BigInt must be less than ${compareValue}`
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