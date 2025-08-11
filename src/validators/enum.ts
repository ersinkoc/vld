import { VldBase, ParseResult } from './base';
import { getMessages } from '../locales';

/**
 * Immutable enum validator for string enum values
 */
export class VldEnum<T extends readonly [string, ...string[]]> extends VldBase<string, T[number]> {
  /**
   * Private constructor to enforce immutability
   */
  private constructor(
    private readonly values: T,
    private readonly errorMessage?: string
  ) {
    super();
  }
  
  /**
   * Create a new enum validator
   */
  static create<T extends readonly [string, ...string[]]>(values: T): VldEnum<T> {
    return new VldEnum(values);
  }
  
  /**
   * Parse and validate an enum value
   */
  parse(value: unknown): T[number] {
    if (!this.values.includes(value as string)) {
      throw new Error(
        this.errorMessage || 
        getMessages().enumExpected([...this.values], JSON.stringify(value))
      );
    }
    return value as T[number];
  }
  
  /**
   * Safely parse and validate an enum value
   */
  safeParse(value: unknown): ParseResult<T[number]> {
    if (this.values.includes(value as string)) {
      return { success: true, data: value as T[number] };
    }
    return { 
      success: false, 
      error: new Error(
        this.errorMessage || 
        getMessages().enumExpected([...this.values], JSON.stringify(value))
      )
    };
  }
}