import { VldDate } from '../validators/date';
import { ParseResult } from '../validators/base';
import { getMessages } from '../locales';

/**
 * Date coercion validator that attempts to convert values to dates
 */
export class VldCoerceDate extends VldDate {
  /**
   * Create a new coerce date validator
   */
  static create(): VldCoerceDate {
    return new VldCoerceDate();
  }
  
  /**
   * Parse and coerce a value to date
   */
  parse(value: unknown): Date {
    try {
      // Handle string and number values
      if (typeof value === 'string' || typeof value === 'number') {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          throw new Error(getMessages().coercionFailed('date', value));
        }
        return super.parse(date);
      }
      
      // Handle null and undefined
      if (value === null || value === undefined) {
        throw new Error(getMessages().coercionFailed('date', value));
      }
      
      // Use parent validation for actual dates
      return super.parse(value);
    } catch (error) {
      if ((error as Error).message.includes('coercionFailed')) {
        throw error;
      }
      throw new Error(getMessages().coercionFailed('date', value));
    }
  }
  
  /**
   * Safely parse and coerce a value to date
   */
  safeParse(value: unknown): ParseResult<Date> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}