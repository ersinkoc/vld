import { VldBase, ParseResult, VLD_VALIDATOR_TYPES } from './base';
import { getMessages } from '../locales/runtime';
import { VldError } from '../errors-core';

/**
 * Validator that only accepts undefined
 */
export class VldVoid extends VldBase<void, void> {
  private constructor() {
    super(VLD_VALIDATOR_TYPES.VOID);
  }

  /**
   * Create a new void validator
   */
  static create(): VldVoid {
    return new VldVoid();
  }

  get isSimple(): boolean {
    return true;
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
      error: new VldError([{ code: 'invalid_type', path: [], message: getMessages().expectedUndefined }])
    };
  }
}
