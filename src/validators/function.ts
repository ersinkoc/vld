import { VldBase, ParseResult, VLD_VALIDATOR_TYPES } from './base';
import { getMessages } from '../locales/runtime';
import { VldError } from '../errors-core';

type AnyFunction = (...args: any[]) => any;

function createFunctionError(message: string): VldError {
  return new VldError([{ code: 'invalid_type', path: [], message }]);
}

/**
 * Immutable function validator
 * Validates that a value is a function
 */
export class VldFunction extends VldBase<unknown, AnyFunction> {
  private constructor() {
    super(VLD_VALIDATOR_TYPES.FUNCTION);
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
  parse(value: unknown): AnyFunction {
    if (typeof value !== 'function') {
      throw new Error(
        getMessages().invalidFunction || 'Expected a function'
      );
    }

    return value as AnyFunction;
  }

  /**
   * Parse a value that has already passed the function type guard.
   * @internal Used by object validators to avoid duplicate hot-path checks.
   */
  parseKnownFunction(value: AnyFunction): AnyFunction {
    return value;
  }

  /**
   * Safely parse and validate a function value
   */
  safeParse(value: unknown): ParseResult<AnyFunction> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: createFunctionError((error as Error).message) };
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
