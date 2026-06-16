import { VldBigInt } from '../validators/bigint';
import { ParseResult, VLD_VALIDATOR_TYPES } from '../validators/base';
import { getMessages } from '../locales/runtime';

/**
 * BigInt coercion validator that attempts to convert values to bigint
 */
export class VldCoerceBigInt extends VldBigInt {
  protected constructor(config?: any) {
    super({ ...config, validatorType: VLD_VALIDATOR_TYPES.COERCE_BIGINT });
  }
  
  /**
   * Create a new coerce bigint validator
   */
  static override create(): VldCoerceBigInt {
    return new VldCoerceBigInt();
  }
  
  // Override all chain methods to return VldCoerceBigInt instances
  override min(value: bigint, message?: string): VldCoerceBigInt {
    return new VldCoerceBigInt({
      checks: [...this.config.checks, (v: bigint) => v >= value],
      errorMessage: message || `BigInt must be at least ${value}`
    });
  }
  
  override max(value: bigint, message?: string): VldCoerceBigInt {
    return new VldCoerceBigInt({
      checks: [...this.config.checks, (v: bigint) => v <= value],
      errorMessage: message || `BigInt must be at most ${value}`
    });
  }
  
  override positive(message?: string): VldCoerceBigInt {
    return new VldCoerceBigInt({
      checks: [...this.config.checks, (v: bigint) => v > 0n],
      errorMessage: message || 'BigInt must be positive'
    });
  }
  
  override negative(message?: string): VldCoerceBigInt {
    return new VldCoerceBigInt({
      checks: [...this.config.checks, (v: bigint) => v < 0n],
      errorMessage: message || 'BigInt must be negative'
    });
  }
  
  override nonnegative(message?: string): VldCoerceBigInt {
    return new VldCoerceBigInt({
      checks: [...this.config.checks, (v: bigint) => v >= 0n],
      errorMessage: message || 'BigInt must be non-negative'
    });
  }
  
  override nonpositive(message?: string): VldCoerceBigInt {
    return new VldCoerceBigInt({
      checks: [...this.config.checks, (v: bigint) => v <= 0n],
      errorMessage: message || 'BigInt must be non-positive'
    });
  }
  
  /**
   * Parse and coerce a value to bigint
   */
  override parse(value: unknown): bigint {
    // If it's already a bigint, use parent validation directly
    if (typeof value === 'bigint') {
      return super.parse(value);
    }
    
    // Handle string values
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') {
        throw new Error(getMessages().coercionFailed('bigint', value));
      }
      try {
        const coerced = BigInt(trimmed);
        return super.parse(coerced);
      } catch {
        throw new Error(getMessages().coercionFailed('bigint', value));
      }
    }
    
    // Handle number values (must be integer)
    if (typeof value === 'number') {
      if (!Number.isInteger(value)) {
        throw new Error(getMessages().coercionFailed('bigint', value));
      }
      const coerced = BigInt(value);
      return super.parse(coerced);
    }
    
    // Handle null and undefined
    if (value === null || value === undefined) {
      throw new Error(getMessages().coercionFailed('bigint', value));
    }
    
    // Try to coerce other values
    try {
      const coerced = BigInt(value as any);
      return super.parse(coerced);
    } catch {
      throw new Error(getMessages().coercionFailed('bigint', value));
    }
  }
  
  /**
   * Safely parse and coerce a value to bigint
   */
  override safeParse(value: unknown): ParseResult<bigint> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}