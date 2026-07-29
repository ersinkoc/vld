import { VldBase, ParseResult, VLD_VALIDATOR_TYPES, ValidatorType } from './base';
import { VldError, getTypeName, createInvalidTypeIssue } from '../errors-core';

/**
 * Immutable boolean validator
 */
export class VldBoolean extends VldBase<boolean, boolean> {
  private readonly errorMessage: string | undefined;

  /**
   * Protected constructor to allow extension while maintaining immutability
   */
  protected constructor(errorMessage?: string, validatorType?: ValidatorType) {
    super(validatorType || VLD_VALIDATOR_TYPES.BOOLEAN);
    this.errorMessage = errorMessage;
  }

  /**
   * Returns true if this is a simple boolean validator with no custom checks
   * Used by VldObject for optimized fast-path dispatch
   */
  get isSimple(): boolean {
    return true;
  }
  
  /**
   * Create a new boolean validator
   */
  static create(): VldBoolean {
    return new VldBoolean();
  }
  
  /**
   * Parse and validate a boolean value
   */
  parse(value: unknown): boolean {
    if (typeof value !== 'boolean') {
      throw new VldError([createInvalidTypeIssue('boolean', getTypeName(value), this.errorMessage)]);
    }
    return value;
  }

  /**
   * Parse a value that has already passed the boolean type guard.
   * @internal Used by object validators to avoid duplicate hot-path checks.
   */
  parseKnownBoolean(value: boolean): boolean {
    return value;
  }
  
  /**
   * Safely parse and validate a boolean value
   */
  safeParse(value: unknown): ParseResult<boolean> {
    if (typeof value === 'boolean') {
      return { success: true, data: value };
    }
    return { 
      success: false, 
      error: new VldError([createInvalidTypeIssue('boolean', getTypeName(value), this.errorMessage)])
    };
  }
  
  /**
   * Create a new validator that only accepts true
   */
  true(message?: string): VldBoolean {
    return new VldTrue(message || 'Value must be true');
  }
  
  /**
   * Create a new validator that only accepts false
   */
  false(message?: string): VldBoolean {
    return new VldFalse(message || 'Value must be false');
  }
}

/**
 * Validator that only accepts true
 */
class VldTrue extends VldBoolean {
  constructor(private readonly message: string) {
    super(message);
  }

  override get isSimple(): boolean {
    return false;
  }

  override parse(value: unknown): boolean {
    if (value !== true) {
      throw new VldError([{ code: 'custom', path: [], message: this.message }]);
    }
    return true;
  }

  override parseKnownBoolean(value: boolean): boolean {
    if (value !== true) {
      throw new VldError([{ code: 'custom', path: [], message: this.message }]);
    }
    return true;
  }

  // BUG-003 FIX: Override safeParse to ensure true validation
  override safeParse(value: unknown): ParseResult<boolean> {
    if (value !== true) {
      return {
        success: false,
        error: new VldError([{ code: 'custom', path: [], message: this.message }])
      };
    }
    return { success: true, data: true };
  }
}

/**
 * Validator that only accepts false
 */
class VldFalse extends VldBoolean {
  constructor(private readonly message: string) {
    super(message);
  }

  override get isSimple(): boolean {
    return false;
  }

  override parse(value: unknown): boolean {
    if (value !== false) {
      throw new VldError([{ code: 'custom', path: [], message: this.message }]);
    }
    return false;
  }

  override parseKnownBoolean(value: boolean): boolean {
    if (value !== false) {
      throw new VldError([{ code: 'custom', path: [], message: this.message }]);
    }
    return false;
  }

  // BUG-003 FIX: Override safeParse to ensure false validation
  override safeParse(value: unknown): ParseResult<boolean> {
    if (value !== false) {
      return {
        success: false,
        error: new VldError([{ code: 'custom', path: [], message: this.message }])
      };
    }
    return { success: true, data: false };
  }
}
