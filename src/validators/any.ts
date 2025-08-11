import { VldBase, ParseResult } from './base';

/**
 * Validator that accepts any value
 */
export class VldAny extends VldBase<any, any> {
  /**
   * Create a new any validator
   */
  static create(): VldAny {
    return new VldAny();
  }
  
  /**
   * Parse any value (always succeeds)
   */
  parse(value: unknown): any {
    return value;
  }
  
  /**
   * Safely parse any value (always succeeds)
   */
  safeParse(value: unknown): ParseResult<any> {
    return { success: true, data: value };
  }
}