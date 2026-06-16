import { VldDate } from '../validators/date';
import { ParseResult, VLD_VALIDATOR_TYPES } from '../validators/base';
import { getMessages } from '../locales/runtime';

/**
 * Date coercion validator that attempts to convert values to dates
 */
export class VldCoerceDate extends VldDate {
  /**
   * Create a new coerce date validator
   */
  static override create(): VldCoerceDate {
    return new VldCoerceDate();
  }

  constructor() {
    super({ validatorType: VLD_VALIDATOR_TYPES.COERCE_DATE });
  }
  
  /**
   * Parse and coerce a value to date
   */
  override parse(value: unknown): Date {
    try {
      if (value instanceof Date) {
        return super.parse(value);
      }

      const date = new Date(value as any);
      if (isNaN(date.getTime())) {
        throw new Error(getMessages().coercionFailed('date', value));
      }
      return super.parse(date);
    } catch (error) {
      if ((error as Error).message.includes('Cannot coerce')) {
        throw error;
      }
      throw new Error(getMessages().coercionFailed('date', value));
    }
  }
  
  /**
   * Safely parse and coerce a value to date
   */
  override safeParse(value: unknown): ParseResult<Date> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}
