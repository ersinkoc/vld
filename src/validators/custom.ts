import { VldBase, ParseResult } from './base';

/**
 * Type-safe custom validator options
 */
export interface CustomValidatorOptions<TOutput> {
  /**
   * Parse function that validates and transforms input
   */
  parse: (value: unknown) => TOutput;

  /**
   * Optional safeParse implementation
   * If not provided, will use try-catch around parse()
   */
  safeParse?: (value: unknown) => ParseResult<TOutput>;
}

/**
 * Immutable custom validator for user-defined validation logic
 * Provides type safety while allowing complete control over validation
 */
export class VldCustom<TOutput = unknown> extends VldBase<unknown, TOutput> {
  private readonly _parseFn: (value: unknown) => TOutput;
  private readonly _safeParseFn: (value: unknown) => ParseResult<TOutput>;

  private constructor(options: CustomValidatorOptions<TOutput>) {
    super();
    this._parseFn = options.parse;
    this._safeParseFn = options.safeParse || ((value: unknown) => {
      try {
        return { success: true, data: this._parseFn(value) };
      } catch (error) {
        return { success: false, error: error as Error };
      }
    });
  }

  /**
   * Create a new custom validator
   */
  static create<TOutput>(
    options: CustomValidatorOptions<TOutput>
  ): VldCustom<TOutput> {
    return new VldCustom(options);
  }

  /**
   * Parse and validate using the custom parse function
   */
  parse(value: unknown): TOutput {
    return this._parseFn(value);
  }

  /**
   * Safely parse using the custom safeParse function or default implementation
   */
  safeParse(value: unknown): ParseResult<TOutput> {
    return this._safeParseFn(value);
  }
}

/**
 * Helper function to create custom validators
 * Usage: v.custom<number>({
 *   parse: (value) => {
 *     if (typeof value !== 'string') throw new Error('Expected string');
 *     return parseInt(value, 10);
 *   }
 * })
 */
export function custom<TOutput = unknown>(
  options: CustomValidatorOptions<TOutput>
): VldCustom<TOutput> {
  return VldCustom.create(options);
}
