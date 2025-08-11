import { VldBase, ParseResult } from './base';

/**
 * Validator that accepts unknown values
 */
export class VldUnknown extends VldBase<unknown, unknown> {
  /**
   * Create a new unknown validator
   */
  static create(): VldUnknown {
    return new VldUnknown();
  }
  
  /**
   * Parse unknown value (always succeeds)
   */
  parse(value: unknown): unknown {
    return value;
  }
  
  /**
   * Safely parse unknown value (always succeeds)
   */
  safeParse(value: unknown): ParseResult<unknown> {
    return { success: true, data: value };
  }
}