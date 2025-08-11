import { VldBase, ParseResult } from './base';
import { getMessages } from '../locales';

/**
 * Validator that never succeeds
 */
export class VldNever extends VldBase<never, never> {
  /**
   * Create a new never validator
   */
  static create(): VldNever {
    return new VldNever();
  }
  
  /**
   * Parse never value (always fails)
   */
  parse(_value: unknown): never {
    throw new Error(getMessages().neverType);
  }
  
  /**
   * Safely parse never value (always fails)
   */
  safeParse(_value: unknown): ParseResult<never> {
    return { 
      success: false, 
      error: new Error(getMessages().neverType) 
    };
  }
}