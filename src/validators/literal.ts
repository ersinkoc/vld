import { VldBase, ParseResult } from './base';
import { getMessages } from '../locales';

/**
 * Immutable literal validator for exact value matching
 */
export class VldLiteral<T extends string | number | boolean | null | undefined> extends VldBase<T, T> {
  /**
   * Private constructor to enforce immutability
   */
  private constructor(
    private readonly literal: T,
    private readonly errorMessage?: string
  ) {
    super();
  }
  
  /**
   * Create a new literal validator
   */
  static create<T extends string | number | boolean | null | undefined>(literal: T): VldLiteral<T> {
    return new VldLiteral(literal);
  }
  
  /**
   * Parse and validate a literal value
   */
  parse(value: unknown): T {
    if (value !== this.literal) {
      throw new Error(
        this.errorMessage || 
        getMessages().literalExpected(JSON.stringify(this.literal), JSON.stringify(value))
      );
    }
    return this.literal;
  }
  
  /**
   * Safely parse and validate a literal value
   */
  safeParse(value: unknown): ParseResult<T> {
    if (value === this.literal) {
      return { success: true, data: this.literal };
    }
    return { 
      success: false, 
      error: new Error(
        this.errorMessage || 
        getMessages().literalExpected(JSON.stringify(this.literal), JSON.stringify(value))
      )
    };
  }
}