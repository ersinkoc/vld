import { VldBase, ParseResult } from './base';
import { getMessages } from '../locales';

/**
 * Immutable symbol validator
 */
export class VldSymbol extends VldBase<symbol, symbol> {
  private readonly errorMessage?: string;
  
  /**
   * Private constructor to enforce immutability
   */
  private constructor(errorMessage?: string) {
    super();
    this.errorMessage = errorMessage;
  }
  
  /**
   * Create a new symbol validator
   */
  static create(): VldSymbol {
    return new VldSymbol();
  }
  
  /**
   * Parse and validate a symbol value
   */
  parse(value: unknown): symbol {
    if (typeof value !== 'symbol') {
      throw new Error(this.errorMessage || getMessages().invalidSymbol);
    }
    return value;
  }
  
  /**
   * Safely parse and validate a symbol value
   */
  safeParse(value: unknown): ParseResult<symbol> {
    if (typeof value === 'symbol') {
      return { success: true, data: value };
    }
    return { 
      success: false, 
      error: new Error(this.errorMessage || getMessages().invalidSymbol) 
    };
  }
}