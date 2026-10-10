/**
 * VldXor - Exclusive union validator
 * Part of Zod 4 API parity implementation
 * Ensures exactly one schema in the union matches
 */

import { VldBase, VLD_VALIDATOR_TYPES } from './base';
import type { ParseResult } from './base';
import type { UnionMemberOutput } from './union';
import { VldError } from '../errors-core';

/**
 * XOR validator - ensures exactly one option matches
 * Unlike regular union which allows multiple matches, XOR requires exactly one
 */
export class VldXor<Options extends readonly VldBase<any, any>[]> extends VldBase<unknown, UnionMemberOutput<Options[number]>> {
  constructor(private readonly _options: Options) {
    super(VLD_VALIDATOR_TYPES.XOR);
  }

  static create<Options extends readonly VldBase<any, any>[]>(
    options: Options
  ): VldXor<Options> {
    return new VldXor(options);
  }

  parse(value: unknown): UnionMemberOutput<Options[number]> {
    const result = this.safeParse(value);
    if (!result.success) {
      throw result.error;
    }
    return result.data;
  }

  safeParse(value: unknown): ParseResult<UnionMemberOutput<Options[number]>> {
    let lastSuccess: ParseResult<any> | null = null;
    const matches: number[] = [];
    const optionIssues: VldError['issues'][] = [];

    for (let i = 0; i < this._options.length; i++) {
      const result = this._options[i]!.safeParse(value);
      if (result.success) {
        matches.push(i);
        lastSuccess = result;
      } else {
        optionIssues.push(result.error.issues);
      }
    }

    // Zod-shaped failures: one invalid_union issue with the option issues
    // (no match) or the matching option indices (more than one match).
    if (matches.length === 0) {
      return {
        success: false,
        error: new VldError([{ code: 'invalid_union', path: [], message: 'No schema matched in XOR union', errors: optionIssues }])
      };
    }

    if (matches.length > 1) {
      return {
        success: false,
        error: new VldError([{
          code: 'invalid_union',
          path: [],
          message: `Input matches ${matches.length} schemas in XOR union, but exactly one is required`,
          errors: [],
          inclusive: false,
          matches
        }])
      };
    }

    return lastSuccess!;
  }

  /** Async parse: exactly one option's parseAsync must succeed. */
  override async parseAsync(value: unknown): Promise<UnionMemberOutput<Options[number]>> {
    const results = [];
    for (const option of this._options) results.push(await option.safeParseAsync(value));
    const matches = results.flatMap((result, index) => (result.success ? [index] : []));
    if (matches.length === 1) return (results[matches[0]!] as { data: any }).data;
    throw new VldError([matches.length === 0
      ? { code: 'invalid_union', path: [], message: 'No schema matched in XOR union', errors: (results as Array<{ error: VldError }>).map(result => result.error.issues) }
      : { code: 'invalid_union', path: [], message: `Input matches ${matches.length} schemas in XOR union, but exactly one is required`, errors: [], inclusive: false, matches }]);
  }

  /**
   * Get all options
   */
  getOptions(): Options {
    return this._options;
  }
}
