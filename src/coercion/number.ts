import { VldNumber } from '../validators/number';
import { ParseResult, VLD_VALIDATOR_TYPES } from '../validators/base';
import { getMessages } from '../locales/runtime';

/**
 * Number coercion validator that attempts to convert values to numbers
 */
export class VldCoerceNumber extends VldNumber {
  protected constructor(config?: any) {
    super({ ...config, validatorType: VLD_VALIDATOR_TYPES.COERCE_NUMBER });
  }
  
  /**
   * Create a new coerce number validator
   */
  static override create(): VldCoerceNumber {
    return new VldCoerceNumber();
  }
  
  // Override all chain methods to return VldCoerceNumber instances
  override min(value: number, message?: string): VldCoerceNumber {
    return new VldCoerceNumber({
      checks: [...this.config.checks, (v: number) => v >= value],
      errorMessage: message || getMessages().numberMin(value)
    });
  }
  
  override max(value: number, message?: string): VldCoerceNumber {
    return new VldCoerceNumber({
      checks: [...this.config.checks, (v: number) => v <= value],
      errorMessage: message || getMessages().numberMax(value)
    });
  }
  
  override int(message?: string): VldCoerceNumber {
    return new VldCoerceNumber({
      checks: [...this.config.checks, (v: number) => Number.isInteger(v)],
      errorMessage: message || getMessages().numberInt
    });
  }
  
  override positive(message?: string): VldCoerceNumber {
    return new VldCoerceNumber({
      checks: [...this.config.checks, (v: number) => v > 0],
      errorMessage: message || getMessages().numberPositive
    });
  }
  
  override negative(message?: string): VldCoerceNumber {
    return new VldCoerceNumber({
      checks: [...this.config.checks, (v: number) => v < 0],
      errorMessage: message || getMessages().numberNegative
    });
  }
  
  override nonnegative(message?: string): VldCoerceNumber {
    return new VldCoerceNumber({
      checks: [...this.config.checks, (v: number) => v >= 0],
      errorMessage: message || getMessages().numberNonnegative
    });
  }
  
  override nonpositive(message?: string): VldCoerceNumber {
    return new VldCoerceNumber({
      checks: [...this.config.checks, (v: number) => v <= 0],
      errorMessage: message || getMessages().numberNonpositive
    });
  }
  
  override finite(message?: string): VldCoerceNumber {
    return new VldCoerceNumber({
      checks: [...this.config.checks, (v: number) => Number.isFinite(v)],
      errorMessage: message || getMessages().numberFinite
    });
  }
  
  override safe(message?: string): VldCoerceNumber {
    return new VldCoerceNumber({
      checks: [...this.config.checks, (v: number) => Number.isSafeInteger(v)],
      errorMessage: message || getMessages().numberSafe
    });
  }
  
  override multipleOf(value: number, message?: string): VldCoerceNumber {
    return new VldCoerceNumber({
      checks: [...this.config.checks, (v: number) => {
        // BUG-004 FIX: Use epsilon comparison for floating point precision (consistent with VldNumber)
        const remainder = Math.abs(v % value);
        return remainder < Number.EPSILON || Math.abs(remainder - Math.abs(value)) < Number.EPSILON;
      }],
      errorMessage: message || getMessages().numberMultipleOf(value)
    });
  }
  
  override step(value: number, message?: string): VldCoerceNumber {
    return this.multipleOf(value, message);
  }
  
  override between(min: number, max: number, message?: string): VldCoerceNumber {
    return new VldCoerceNumber({
      checks: [...this.config.checks, (v: number) => v >= min && v <= max],
      errorMessage: message || `Number must be between ${min} and ${max}`
    });
  }
  
  override even(message?: string): VldCoerceNumber {
    // BUG-NEW-007 FIX: Add integer check before even/odd validation
    return new VldCoerceNumber({
      checks: [...this.config.checks, (v: number) => {
        if (!Number.isInteger(v)) {
          return false;
        }
        return v % 2 === 0;
      }],
      errorMessage: message || 'Number must be even'
    });
  }
  
  override odd(message?: string): VldCoerceNumber {
    // BUG-NEW-007 FIX: Add integer check before even/odd validation
    return new VldCoerceNumber({
      checks: [...this.config.checks, (v: number) => {
        if (!Number.isInteger(v)) {
          return false;
        }
        return v % 2 !== 0;
      }],
      errorMessage: message || 'Number must be odd'
    });
  }
  
  /**
   * Parse and coerce a value to number
   */
  override parse(value: unknown): number {
    // If it's already a valid number, use parent validation directly
    if (typeof value === 'number' && !isNaN(value)) {
      if (this.config.checks.length === 0) {
        return value;
      }
      return super.parse(value);
    }
    
    let coerced: number;
    try {
      coerced = Number(value);
    } catch {
      throw new Error(getMessages().coercionFailed('number', value));
    }

    if (isNaN(coerced)) {
      throw new Error(getMessages().coercionFailed('number', value));
    }
    
    if (this.config.checks.length === 0) {
      return coerced;
    }

    // Use parent validation with coerced value
    return super.parse(coerced);
  }
  
  /**
   * Safely parse and coerce a value to number
   */
  override safeParse(value: unknown): ParseResult<number> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}
