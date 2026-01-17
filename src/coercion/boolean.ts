import { VldBoolean } from '../validators/boolean';
import { ParseResult } from '../validators/base';
import { getMessages } from '../locales';

/**
 * Boolean coercion validator that attempts to convert values to booleans
 */
export class VldCoerceBoolean extends VldBoolean {
  /**
   * Create a new coerce boolean validator
   */
  static create(): VldCoerceBoolean {
    return new VldCoerceBoolean();
  }
  
  /**
   * Parse and coerce a value to boolean
   */
  parse(value: unknown): boolean {
    // Handle string values
    if (typeof value === 'string') {
      const lower = value.toLowerCase().trim();
      if (lower === 'true' || lower === '1' || lower === 'yes' || lower === 'on') {
        return true;
      }
      if (lower === 'false' || lower === '0' || lower === 'no' || lower === 'off') {
        return false;
      }
      throw new Error(getMessages().coercionFailed('boolean', value));
    }

    // Handle number values
    if (typeof value === 'number') {
      if (value === 1) return true;
      if (value === 0) return false;
      throw new Error(getMessages().coercionFailed('boolean', value));
    }

    // Handle null and undefined
    if (value === null || value === undefined) {
      throw new Error(getMessages().coercionFailed('boolean', value));
    }

    // Handle actual boolean values
    if (typeof value === 'boolean') {
      return value;
    }

    // Reject all other unsupported types (objects, arrays, etc.)
    throw new Error(getMessages().coercionFailed('boolean', value));
  }
  
  /**
   * Safely parse and coerce a value to boolean
   */
  safeParse(value: unknown): ParseResult<boolean> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}