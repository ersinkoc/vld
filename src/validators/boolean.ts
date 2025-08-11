import { VldBase, ParseResult } from './base';
import { getMessages } from '../locales';

/**
 * Immutable boolean validator
 */
export class VldBoolean extends VldBase<boolean, boolean> {
  private readonly errorMessage?: string;
  
  /**
   * Protected constructor to allow extension while maintaining immutability
   */
  protected constructor(errorMessage?: string) {
    super();
    this.errorMessage = errorMessage;
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
      throw new Error(this.errorMessage || getMessages().invalidBoolean);
    }
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
      error: new Error(this.errorMessage || getMessages().invalidBoolean) 
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
  
  parse(value: unknown): boolean {
    const result = super.parse(value);
    if (result !== true) {
      throw new Error(this.message);
    }
    return result;
  }
}

/**
 * Validator that only accepts false
 */
class VldFalse extends VldBoolean {
  constructor(private readonly message: string) {
    super(message);
  }
  
  parse(value: unknown): boolean {
    const result = super.parse(value);
    if (result !== false) {
      throw new Error(this.message);
    }
    return result;
  }
}