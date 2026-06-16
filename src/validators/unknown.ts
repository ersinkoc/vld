import { VldBase, ParseResult, VLD_VALIDATOR_TYPES } from './base';

/**
 * Validator that accepts unknown values
 */
export class VldUnknown extends VldBase<unknown, unknown> {
  private constructor() {
    super(VLD_VALIDATOR_TYPES.UNKNOWN);
  }

  /**
   * Create a new unknown validator
   */
  static create(): VldUnknown {
    return new VldUnknown();
  }

  /**
   * Returns true because unknown accepts every input without checks.
   * Used by composite validators for passthrough fast paths.
   */
  get isSimple(): boolean {
    return true;
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
