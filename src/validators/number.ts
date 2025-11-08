import { VldBase, ParseResult } from './base';
import { getMessages } from '../locales';

/**
 * Type for number validation check functions
 */
type NumberCheck = (value: number) => boolean;

/**
 * Configuration for number validator
 */
interface NumberValidatorConfig {
  readonly checks: ReadonlyArray<NumberCheck>;
  readonly errorMessage?: string;
}

/**
 * Immutable number validator with chainable methods
 */
export class VldNumber extends VldBase<number, number> {
  protected readonly config: NumberValidatorConfig;
  
  /**
   * Protected constructor to allow extension while maintaining immutability
   */
  protected constructor(config?: Partial<NumberValidatorConfig>) {
    super();
    this.config = {
      checks: config?.checks || [],
      errorMessage: config?.errorMessage
    };
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
    
    // Apply all checks
    for (const check of this.config.checks) {
      if (!check(value)) {
        throw new Error(this.config.errorMessage || getMessages().invalidNumber);
      }
    }
    
    return value;
  }
  
  /**
   * Safely parse and validate a number value
   */
  safeParse(value: unknown): ParseResult<number> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
  
  /**
   * Create a new validator with minimum value constraint
   */
  min(value: number, message?: string): VldNumber {
    return new VldNumber({
      checks: [...this.config.checks, (v: number) => v >= value],
      errorMessage: message || getMessages().numberMin(value)
    });
  }
  
  /**
   * Create a new validator with maximum value constraint
   */
  max(value: number, message?: string): VldNumber {
    return new VldNumber({
      checks: [...this.config.checks, (v: number) => v <= value],
      errorMessage: message || getMessages().numberMax(value)
    });
  }
  
  /**
   * Create a new validator that checks for integer values
   */
  int(message?: string): VldNumber {
    return new VldNumber({
      checks: [...this.config.checks, (v: number) => Number.isInteger(v)],
      errorMessage: message || getMessages().numberInt
    });
  }
  
  /**
   * Create a new validator that checks for positive values
   */
  positive(message?: string): VldNumber {
    return new VldNumber({
      checks: [...this.config.checks, (v: number) => v > 0],
      errorMessage: message || getMessages().numberPositive
    });
  }
  
  /**
   * Create a new validator that checks for negative values
   */
  negative(message?: string): VldNumber {
    return new VldNumber({
      checks: [...this.config.checks, (v: number) => v < 0],
      errorMessage: message || getMessages().numberNegative
    });
  }
  
  /**
   * Create a new validator that checks for non-negative values
   */
  nonnegative(message?: string): VldNumber {
    return new VldNumber({
      checks: [...this.config.checks, (v: number) => v >= 0],
      errorMessage: message || getMessages().numberNonnegative
    });
  }
  
  /**
   * Create a new validator that checks for non-positive values
   */
  nonpositive(message?: string): VldNumber {
    return new VldNumber({
      checks: [...this.config.checks, (v: number) => v <= 0],
      errorMessage: message || getMessages().numberNonpositive
    });
  }
  
  /**
   * Create a new validator that checks for finite values
   */
  finite(message?: string): VldNumber {
    return new VldNumber({
      checks: [...this.config.checks, (v: number) => Number.isFinite(v)],
      errorMessage: message || getMessages().numberFinite
    });
  }
  
  /**
   * Create a new validator that checks for safe integer values
   */
  safe(message?: string): VldNumber {
    return new VldNumber({
      checks: [...this.config.checks, (v: number) => Number.isSafeInteger(v)],
      errorMessage: message || getMessages().numberSafe
    });
  }
  
  /**
   * Create a new validator that checks if value is multiple of another
   */
  multipleOf(value: number, message?: string): VldNumber {
    return new VldNumber({
      checks: [...this.config.checks, (v: number) => {
        // Use epsilon comparison for floating point precision
        const remainder = Math.abs(v % value);
        return remainder < Number.EPSILON || Math.abs(remainder - Math.abs(value)) < Number.EPSILON;
      }],
      errorMessage: message || getMessages().numberMultipleOf(value)
    });
  }
  
  /**
   * Alias for multipleOf
   */
  step(value: number, message?: string): VldNumber {
    return this.multipleOf(value, message);
  }
  
  /**
   * Create a new validator with a range constraint
   */
  between(min: number, max: number, message?: string): VldNumber {
    return new VldNumber({
      checks: [...this.config.checks, (v: number) => v >= min && v <= max],
      errorMessage: message || `Number must be between ${min} and ${max}`
    });
  }
  
  /**
   * Create a new validator that checks for even numbers
   */
  even(message?: string): VldNumber {
    return new VldNumber({
      checks: [...this.config.checks, (v: number) => {
        // Use epsilon comparison for floating point precision
        const remainder = Math.abs(v % 2);
        return remainder < Number.EPSILON || Math.abs(remainder - 2) < Number.EPSILON;
      }],
      errorMessage: message || 'Number must be even'
    });
  }
  
  /**
   * Create a new validator that checks for odd numbers
   */
  odd(message?: string): VldNumber {
    return new VldNumber({
      checks: [...this.config.checks, (v: number) => {
        // Use epsilon comparison for floating point precision
        const remainder = Math.abs(v % 2);
        const isEven = remainder < Number.EPSILON || Math.abs(remainder - 2) < Number.EPSILON;
        return !isEven;
      }],
      errorMessage: message || 'Number must be odd'
    });
  }
}