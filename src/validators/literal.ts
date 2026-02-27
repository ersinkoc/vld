import { VldBase, ParseResult } from './base';
import { getMessages } from '../locales';

/**
 * Immutable literal validator for exact value matching
 */
export class VldLiteral<T extends string | number | boolean | null | undefined> extends VldBase<T, T> {
  /**
   * Private constructor to enforce immutability
   */
  private constructor(
    private readonly _literal: T,
    private readonly errorMessage?: string
  ) {
    super();
  }

  /**
   * Get the literal value
   */
  get literal(): T {
    return this._literal;
  }
  
  /**
   * Create a new literal validator
   */
  static create<T extends string | number | boolean | null | undefined>(literal: T): VldLiteral<T> {
    return new VldLiteral(literal);
  }
  
  /**
   * Parse and validate a literal value
   */
  parse(value: unknown): T {
    if (value !== this._literal) {
      throw new Error(
        this.errorMessage ||
        getMessages().literalExpected(JSON.stringify(this._literal), JSON.stringify(value))
      );
    }
    return this._literal;
  }

  /**
   * Safely parse and validate a literal value
   */
  safeParse(value: unknown): ParseResult<T> {
    if (value === this._literal) {
      return { success: true, data: this._literal };
    }
    return {
      success: false,
      error: new Error(
        this.errorMessage ||
        getMessages().literalExpected(JSON.stringify(this._literal), JSON.stringify(value))
      )
    };
  }
}