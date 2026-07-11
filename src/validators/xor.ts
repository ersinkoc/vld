/**
 * VldXor - Exclusive union validator
 * Part of Zod 4 API parity implementation
 * Ensures exactly one schema in the union matches
 */

import { VldBase, VLD_VALIDATOR_TYPES } from './base';
import type { ParseResult } from './base';

/**
 * XOR validator - ensures exactly one option matches
 * Unlike regular union which allows multiple matches, XOR requires exactly one
 */
export class VldXor<Options extends readonly VldBase<any, any>[]> extends VldBase<unknown, Options[number] extends VldBase<any, infer T> ? T : never> {
  constructor(private readonly _options: Options) {
    super(VLD_VALIDATOR_TYPES.XOR);
  }

  static create<Options extends readonly VldBase<any, any>[]>(
    options: Options
  ): VldXor<Options> {
    return new VldXor(options);
  }

  parse(value: unknown): Options[number] extends VldBase<any, infer T> ? T : never {
    const result = this.safeParse(value);
    if (!result.success) {
      throw result.error;
    }
    return result.data;
  }

  safeParse(value: unknown): ParseResult<Options[number] extends VldBase<any, infer T> ? T : never> {
    let matchCount = 0;
    let lastSuccess: ParseResult<any> | null = null;

    for (const option of this._options) {
      const result = option.safeParse(value);
      if (result.success) {
        matchCount++;
        lastSuccess = result;
        if (matchCount > 1) {
          // Early exit if more than one match
          break;
        }
      }
    }

    if (matchCount === 0) {
      return {
        success: false,
        error: new Error('No schema matched in XOR union')
      };
    }

    if (matchCount > 1) {
      return {
        success: false,
        error: new Error(
          `Input matches ${matchCount} schemas in XOR union, but exactly one is required`
        )
      };
    }

    return lastSuccess!;
  }

  /**
   * Get all options
   */
  getOptions(): Options {
    return this._options;
  }
}
