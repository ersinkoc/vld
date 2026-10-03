import { VldNumber } from '../validators/number';
import { ParseResult, VLD_VALIDATOR_TYPES, ensureVldError } from '../validators/base';
import { getMessages } from '../locales/runtime';
import { VldError, createInvalidTypeIssue } from '../errors-core';

/** Zod: a value that does not coerce fails the type check (invalid_type). */
function coercionError(value: unknown, received: string): VldError {
  return new VldError([createInvalidTypeIssue('number', received, getMessages().coercionFailed('number', value))]);
}

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
  
  // Chain methods are inherited (they keep the subclass via derive());
  // these overrides only narrow the return type.
  override min(value: number, message?: string): VldCoerceNumber {
    return super.min(value, message) as VldCoerceNumber;
  }
  
  override max(value: number, message?: string): VldCoerceNumber {
    return super.max(value, message) as VldCoerceNumber;
  }
  
  override int(message?: string): VldCoerceNumber {
    return super.int(message) as VldCoerceNumber;
  }
  
  override positive(message?: string): VldCoerceNumber {
    return super.positive(message) as VldCoerceNumber;
  }
  
  override negative(message?: string): VldCoerceNumber {
    return super.negative(message) as VldCoerceNumber;
  }
  
  override nonnegative(message?: string): VldCoerceNumber {
    return super.nonnegative(message) as VldCoerceNumber;
  }
  
  override nonpositive(message?: string): VldCoerceNumber {
    return super.nonpositive(message) as VldCoerceNumber;
  }
  
  override finite(message?: string): VldCoerceNumber {
    return super.finite(message) as VldCoerceNumber;
  }
  
  override safe(message?: string): VldCoerceNumber {
    return super.safe(message) as VldCoerceNumber;
  }
  
  override multipleOf(value: number, message?: string): VldCoerceNumber {
    return super.multipleOf(value, message) as VldCoerceNumber;
  }
  
  override step(value: number, message?: string): VldCoerceNumber {
    return super.step(value, message) as VldCoerceNumber;
  }
  
  override between(min: number, max: number, message?: string): VldCoerceNumber {
    return super.between(min, max, message) as VldCoerceNumber;
  }
  
  override even(message?: string): VldCoerceNumber {
    return super.even(message) as VldCoerceNumber;
  }
  
  override odd(message?: string): VldCoerceNumber {
    return super.odd(message) as VldCoerceNumber;
  }
  
  /**
   * Parse and coerce a value to number
   */
  override parse(value: unknown): number {
    // If it's already a valid number, use parent validation directly
    if (typeof value === 'number' && !isNaN(value)) {
      if (this.config.checks.length === 0 && Number.isFinite(value)) {
        return value;
      }
      return super.parse(value);
    }
    
    let coerced: number;
    try {
      coerced = Number(value);
    } catch {
      throw coercionError(value, 'NaN');
    }

    if (isNaN(coerced)) {
      throw coercionError(value, 'NaN');
    }
    
    if (this.config.checks.length === 0 && Number.isFinite(coerced)) {
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
      return { success: false, error: ensureVldError(error) };
    }
  }
}
