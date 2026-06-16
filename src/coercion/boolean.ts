import { VldBoolean } from '../validators/boolean';
import { ParseResult, VLD_VALIDATOR_TYPES } from '../validators/base';

/**
 * Boolean coercion validator that attempts to convert values to booleans
 */
export class VldCoerceBoolean extends VldBoolean {
  /**
   * Create a new coerce boolean validator
   */
  static override create(): VldCoerceBoolean {
    return new VldCoerceBoolean();
  }

  constructor() {
    super(undefined, VLD_VALIDATOR_TYPES.COERCE_BOOLEAN);
  }
  
  /**
   * Parse and coerce a value to boolean
   */
  override parse(value: unknown): boolean {
    return Boolean(value);
  }
  
  /**
   * Safely parse and coerce a value to boolean
   */
  override safeParse(value: unknown): ParseResult<boolean> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}
