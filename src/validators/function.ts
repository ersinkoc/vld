import { VldBase, ParseResult } from './base';
import { getMessages } from '../locales';

/**
 * Immutable function validator
 * Validates that a value is a function
 */
export class VldFunction extends VldBase<unknown, Function> {
  private constructor() {
    super();
  }

  /**
   * Create a new function validator
   */
  static create(): VldFunction {
    return new VldFunction();
  }

  /**
   * Parse and validate a function value
   */
  parse(value: unknown): Function {
    if (typeof value !== 'function') {
      throw new Error(
        getMessages().invalidFunction || 'Expected a function'
      );
    }

    return value as Function;
  }

  /**
   * Safely parse and validate a function value
   */
  safeParse(value: unknown): ParseResult<Function> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}

/**
 * Helper function to create function validators
 * Usage: v.function()
 */
export function functionValidator(): VldFunction {
  return VldFunction.create();
}
