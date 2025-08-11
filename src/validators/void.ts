import { VldBase, ParseResult } from './base';
import { getMessages } from '../locales';

/**
 * Validator that only accepts undefined
 */
export class VldVoid extends VldBase<void, void> {
  /**
   * Create a new void validator
   */
  static create(): VldVoid {
    return new VldVoid();
  }
  
  /**
   * Parse void value (must be undefined)
   */
  parse(value: unknown): void {
    if (value !== undefined) {
      throw new Error(getMessages().expectedUndefined);
    }
    return undefined;
  }
  
  /**
   * Safely parse void value
   */
  safeParse(value: unknown): ParseResult<void> {
    if (value === undefined) {
      return { success: true, data: undefined };
    }
    return { 
      success: false, 
      error: new Error(getMessages().expectedUndefined) 
    };
  }
}