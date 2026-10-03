import { VldDate } from '../validators/date';
import { ParseResult, VLD_VALIDATOR_TYPES, ensureVldError } from '../validators/base';
import { getMessages } from '../locales/runtime';
import { VldError, createInvalidTypeIssue } from '../errors-core';

/** Zod: a value that does not coerce fails the type check (invalid_type). */
function coercionError(value: unknown, received: string): VldError {
  return new VldError([createInvalidTypeIssue('date', received, getMessages().coercionFailed('date', value))]);
}

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

  constructor(config?: any) {
    // Accepts a config so chain methods (min/max/...) keep the coerce subclass.
    super({ ...config, validatorType: VLD_VALIDATOR_TYPES.COERCE_DATE });
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
        throw coercionError(value, 'Invalid Date');
      }
      return super.parse(date);
    } catch (error) {
      // A coerced date that fails a check (min, max, refine) keeps its issue;
      // only a value that is not a usable date is a coercion failure.
      if (error instanceof VldError && error.issues[0]?.code !== 'invalid_type') {
        throw error;
      }
      if ((error as Error).message.includes('Cannot coerce')) {
        throw error;
      }
      throw coercionError(value, 'Invalid Date');
    }
  }
  
  /**
   * Safely parse and coerce a value to date
   */
  override safeParse(value: unknown): ParseResult<Date> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: ensureVldError(error) };
    }
  }
}
