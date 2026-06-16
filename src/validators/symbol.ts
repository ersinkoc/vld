import { VldBase, ParseResult, VLD_VALIDATOR_TYPES } from './base';
import { getMessages } from '../locales/runtime';
import { VldError } from '../errors-core';

function createSymbolError(message: string): VldError {
  return new VldError([{ code: 'invalid_type', path: [], message }]);
}

/**
 * Immutable symbol validator
 */
export class VldSymbol extends VldBase<symbol, symbol> {
  private readonly errorMessage: string | undefined;
  
  /**
   * Private constructor to enforce immutability
   */
  private constructor(errorMessage?: string) {
    super(VLD_VALIDATOR_TYPES.SYMBOL);
    this.errorMessage = errorMessage;
  }
  
  /**
   * Create a new symbol validator
   */
  static create(): VldSymbol {
    return new VldSymbol();
  }

  get isSimple(): boolean {
    return true;
  }
  
  /**
   * Parse and validate a symbol value
   */
  parse(value: unknown): symbol {
    if (typeof value !== 'symbol') {
      throw new Error(this.errorMessage || getMessages().invalidSymbol);
    }
    return value;
  }

  /**
   * Parse a value that has already passed the symbol type guard.
   * @internal Used by object validators to avoid duplicate hot-path checks.
   */
  parseKnownSymbol(value: symbol): symbol {
    return value;
  }
  
  /**
   * Safely parse and validate a symbol value
   */
  safeParse(value: unknown): ParseResult<symbol> {
    if (typeof value === 'symbol') {
      return { success: true, data: value };
    }
    return { 
      success: false, 
      error: createSymbolError(this.errorMessage || getMessages().invalidSymbol)
    };
  }
}
