import { VldNumber } from '../validators/number';
import { ParseResult } from '../validators/base';
import { getMessages } from '../locales';

/**
 * Number coercion validator that attempts to convert values to numbers
 */
export class VldCoerceNumber extends VldNumber {
  protected constructor(config?: any) {
    super(config);
  }
  
  /**
   * Create a new coerce number validator
   */
  static create(): VldCoerceNumber {
    return new VldCoerceNumber();
  }
  
  // Override all chain methods to return VldCoerceNumber instances
  min(value: number, message?: string): VldCoerceNumber {
    return new VldCoerceNumber({
      checks: [...this.config.checks, (v: number) => v >= value],
      errorMessage: message || getMessages().numberMin(value)
    });
  }
  
  max(value: number, message?: string): VldCoerceNumber {
    return new VldCoerceNumber({
      checks: [...this.config.checks, (v: number) => v <= value],
      errorMessage: message || getMessages().numberMax(value)
    });
  }
  
  int(message?: string): VldCoerceNumber {
    return new VldCoerceNumber({
      checks: [...this.config.checks, (v: number) => Number.isInteger(v)],
      errorMessage: message || getMessages().numberInt
    });
  }
  
  positive(message?: string): VldCoerceNumber {
    return new VldCoerceNumber({
      checks: [...this.config.checks, (v: number) => v > 0],
      errorMessage: message || getMessages().numberPositive
    });
  }
  
  negative(message?: string): VldCoerceNumber {
    return new VldCoerceNumber({
      checks: [...this.config.checks, (v: number) => v < 0],
      errorMessage: message || getMessages().numberNegative
    });
  }
  
  nonnegative(message?: string): VldCoerceNumber {
    return new VldCoerceNumber({
      checks: [...this.config.checks, (v: number) => v >= 0],
      errorMessage: message || getMessages().numberNonnegative
    });
  }
  
  nonpositive(message?: string): VldCoerceNumber {
    return new VldCoerceNumber({
      checks: [...this.config.checks, (v: number) => v <= 0],
      errorMessage: message || getMessages().numberNonpositive
    });
  }
  
  finite(message?: string): VldCoerceNumber {
    return new VldCoerceNumber({
      checks: [...this.config.checks, (v: number) => Number.isFinite(v)],
      errorMessage: message || getMessages().numberFinite
    });
  }
  
  safe(message?: string): VldCoerceNumber {
    return new VldCoerceNumber({
      checks: [...this.config.checks, (v: number) => Number.isSafeInteger(v)],
      errorMessage: message || getMessages().numberSafe
    });
  }
  
  multipleOf(value: number, message?: string): VldCoerceNumber {
    return new VldCoerceNumber({
      checks: [...this.config.checks, (v: number) => v % value === 0],
      errorMessage: message || getMessages().numberMultipleOf(value)
    });
  }
  
  step(value: number, message?: string): VldCoerceNumber {
    return this.multipleOf(value, message);
  }
  
  between(min: number, max: number, message?: string): VldCoerceNumber {
    return new VldCoerceNumber({
      checks: [...this.config.checks, (v: number) => v >= min && v <= max],
      errorMessage: message || `Number must be between ${min} and ${max}`
    });
  }
  
  even(message?: string): VldCoerceNumber {
    return new VldCoerceNumber({
      checks: [...this.config.checks, (v: number) => v % 2 === 0],
      errorMessage: message || 'Number must be even'
    });
  }
  
  odd(message?: string): VldCoerceNumber {
    return new VldCoerceNumber({
      checks: [...this.config.checks, (v: number) => v % 2 !== 0],
      errorMessage: message || 'Number must be odd'
    });
  }
  
  /**
   * Parse and coerce a value to number
   */
  parse(value: unknown): number {
    // If it's already a valid number, use parent validation directly
    if (typeof value === 'number' && !isNaN(value)) {
      return super.parse(value);
    }
    
    let coerced: number;
    
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') {
        throw new Error(getMessages().coercionFailed('number', value));
      }
      coerced = Number(trimmed);
      if (isNaN(coerced)) {
        throw new Error(getMessages().coercionFailed('number', value));
      }
    } else if (typeof value === 'boolean') {
      coerced = value ? 1 : 0;
    } else if (value === null || value === undefined) {
      throw new Error(getMessages().coercionFailed('number', value));
    } else {
      coerced = Number(value);
      if (isNaN(coerced)) {
        throw new Error(getMessages().coercionFailed('number', value));
      }
    }
    
    // Use parent validation with coerced value
    return super.parse(coerced);
  }
  
  /**
   * Safely parse and coerce a value to number
   */
  safeParse(value: unknown): ParseResult<number> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}