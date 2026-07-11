import { VldBase, ParseResult, VLD_VALIDATOR_TYPES } from './base';
import { getMessages } from '../locales/runtime';
import { VldError } from '../errors-core';

function createLiteralError(message: string): VldError {
  return new VldError([{ code: 'invalid_literal', path: [], message }]);
}

function stringifyLiteral(value: unknown): string {
  const serialized = JSON.stringify(value, (_key, item) => typeof item === 'bigint' ? item.toString() : item);
  return serialized === undefined ? String(value) : serialized;
}

/**
 * Immutable literal validator for exact value matching
 */
export type LiteralValue = string | number | bigint | boolean | null | undefined;

export class VldLiteral<T extends LiteralValue> extends VldBase<T, T> {
  /**
   * Private constructor to enforce immutability
   */
  private constructor(
    private readonly _values: readonly T[],
    private readonly errorMessage?: string
  ) {
    super(VLD_VALIDATOR_TYPES.LITERAL);
  }

  /**
   * Get the literal value
   */
  get literal(): T {
    return this._values[0]!;
  }

  get values(): readonly T[] {
    return this._values;
  }

  get isSimple(): boolean {
    return this._values.length === 1;
  }

  private get expectedDisplay(): string {
    const expected = this._values.length === 1 ? this._values[0] : this._values;
    return stringifyLiteral(expected);
  }
  
  /**
   * Create a new literal validator
   */
  static create<T extends LiteralValue>(literal: T | readonly T[]): VldLiteral<T> {
    const values = Array.isArray(literal) ? literal : [literal];
    if (values.length === 0) {
      throw new Error('Cannot create literal schema with no valid values');
    }
    return new VldLiteral(values as readonly T[]);
  }
  
  /**
   * Parse and validate a literal value
   */
  parse(value: unknown): T {
    if (!this._values.includes(value as T)) {
      throw new Error(
        this.errorMessage ||
        getMessages().literalExpected(this.expectedDisplay, stringifyLiteral(value))
      );
    }
    return value as T;
  }

  /**
   * Safely parse and validate a literal value
   */
  safeParse(value: unknown): ParseResult<T> {
    if (this._values.includes(value as T)) {
      return { success: true, data: value as T };
    }
    return {
      success: false,
      error: createLiteralError(
        this.errorMessage ||
        getMessages().literalExpected(this.expectedDisplay, stringifyLiteral(value))
      )
    };
  }
}
