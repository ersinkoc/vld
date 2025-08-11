import { VldBigInt } from '../validators/bigint';
import { ParseResult } from '../validators/base';
import { getMessages } from '../locales';

/**
 * BigInt coercion validator that attempts to convert values to bigint
 */
export class VldCoerceBigInt extends VldBigInt {
  protected constructor(config?: any) {
    super(config);
  }
  
  /**
   * Create a new coerce bigint validator
   */
  static create(): VldCoerceBigInt {
    return new VldCoerceBigInt();
  }
  
  // Override all chain methods to return VldCoerceBigInt instances
  min(value: bigint, message?: string): VldCoerceBigInt {
    return new VldCoerceBigInt({
      checks: [...this.config.checks, (v: bigint) => v >= value],
      errorMessage: message || `BigInt must be at least ${value}`
    });
  }
  
  max(value: bigint, message?: string): VldCoerceBigInt {
    return new VldCoerceBigInt({
      checks: [...this.config.checks, (v: bigint) => v <= value],
      errorMessage: message || `BigInt must be at most ${value}`
    });
  }
  
  positive(message?: string): VldCoerceBigInt {
    return new VldCoerceBigInt({
      checks: [...this.config.checks, (v: bigint) => v > 0n],
      errorMessage: message || 'BigInt must be positive'
    });
  }
  
  negative(message?: string): VldCoerceBigInt {
    return new VldCoerceBigInt({
      checks: [...this.config.checks, (v: bigint) => v < 0n],
      errorMessage: message || 'BigInt must be negative'
    });
  }
  
  nonnegative(message?: string): VldCoerceBigInt {
    return new VldCoerceBigInt({
      checks: [...this.config.checks, (v: bigint) => v >= 0n],
      errorMessage: message || 'BigInt must be non-negative'
    });
  }
  
  nonpositive(message?: string): VldCoerceBigInt {
    return new VldCoerceBigInt({
      checks: [...this.config.checks, (v: bigint) => v <= 0n],
      errorMessage: message || 'BigInt must be non-positive'
    });
  }
  
  /**
   * Parse and coerce a value to bigint
   */
  parse(value: unknown): bigint {
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
  safeParse(value: unknown): ParseResult<bigint> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}