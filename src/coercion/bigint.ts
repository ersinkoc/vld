import { VldBigInt } from '../validators/bigint';
import { ParseResult, VLD_VALIDATOR_TYPES, ensureVldError } from '../validators/base';
import { getMessages } from '../locales/runtime';
import { VldError, createInvalidTypeIssue, getTypeName } from '../errors-core';

/** Zod: a value that does not coerce fails the type check (invalid_type). */
function coercionError(value: unknown, received: string): VldError {
  return new VldError([createInvalidTypeIssue('bigint', received, getMessages().coercionFailed('bigint', value))]);
}

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
  
  // Chain methods are inherited (they keep the subclass via derive());
  // these overrides only narrow the return type.
  override min(value: bigint, message?: string): VldCoerceBigInt {
    return super.min(value, message) as VldCoerceBigInt;
  }
  
  override max(value: bigint, message?: string): VldCoerceBigInt {
    return super.max(value, message) as VldCoerceBigInt;
  }
  
  override positive(message?: string): VldCoerceBigInt {
    return super.positive(message) as VldCoerceBigInt;
  }
  
  override negative(message?: string): VldCoerceBigInt {
    return super.negative(message) as VldCoerceBigInt;
  }
  
  override nonnegative(message?: string): VldCoerceBigInt {
    return super.nonnegative(message) as VldCoerceBigInt;
  }
  
  override nonpositive(message?: string): VldCoerceBigInt {
    return super.nonpositive(message) as VldCoerceBigInt;
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
        throw coercionError(value, 'string');
      }
      let coerced: bigint;
      try {
        coerced = BigInt(trimmed);
      } catch {
        throw coercionError(value, 'string');
      }
      return super.parse(coerced);
    }
    
    // Handle number values (must be integer)
    if (typeof value === 'number') {
      if (!Number.isInteger(value)) {
        throw coercionError(value, getTypeName(value));
      }
      const coerced = BigInt(value);
      return super.parse(coerced);
    }
    
    // Handle null and undefined
    if (value === null || value === undefined) {
      throw coercionError(value, getTypeName(value));
    }

    // Try to coerce other values
    let coerced: bigint;
    try {
      coerced = BigInt(value as any);
    } catch {
      throw coercionError(value, getTypeName(value));
    }
    return super.parse(coerced);
  }
  
  /**
   * Safely parse and coerce a value to bigint
   */
  override safeParse(value: unknown): ParseResult<bigint> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: ensureVldError(error) };
    }
  }
}