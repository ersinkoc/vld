import { VldBase, ParseResult } from './base';
import { getMessages } from '../locales';

/**
 * Immutable record validator for key-value pairs
 */
export class VldRecord<T> extends VldBase<unknown, Record<string, T>> {
  /**
   * Private constructor to enforce immutability
   */
  private constructor(
    private readonly valueValidator: VldBase<unknown, T>,
    private readonly errorMessage?: string
  ) {
    super();
  }
  
  /**
   * Create a new record validator
   */
  static create<T>(valueValidator: VldBase<unknown, T>): VldRecord<T> {
    return new VldRecord(valueValidator);
  }
  
  /**
   * Parse and validate a record value
   */
  parse(value: unknown): Record<string, T> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new Error(this.errorMessage || getMessages().invalidRecord);
    }
    
    const result: Record<string, T> = {};
    const obj = value as Record<string, unknown>;
    
    for (const [key, val] of Object.entries(obj)) {
      try {
        result[key] = this.valueValidator.parse(val);
      } catch (error) {
        throw new Error(getMessages().objectField(key, (error as Error).message));
      }
    }
    
    return result;
  }
  
  /**
   * Safely parse and validate a record value
   */
  safeParse(value: unknown): ParseResult<Record<string, T>> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}