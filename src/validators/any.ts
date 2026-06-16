import { VldBase, ParseResult, VLD_VALIDATOR_TYPES } from './base';

/**
 * Validator that accepts any value
 */
export class VldAny extends VldBase<any, any> {
  private constructor() {
    super(VLD_VALIDATOR_TYPES.ANY);
  }

  /**
   * Create a new any validator
   */
  static create(): VldAny {
    return new VldAny();
  }

  /**
   * Returns true because any accepts every input without checks.
   * Used by composite validators for passthrough fast paths.
   */
  get isSimple(): boolean {
    return true;
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
