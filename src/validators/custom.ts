import { VldBase, ParseResult, VLD_VALIDATOR_TYPES, ensureVldError, type ErrorParam, resolveErrorMessage } from './base';

/**
 * Type-safe custom validator options
 */
export interface CustomValidatorOptions<TOutput> {
  /**
   * Parse function that validates and transforms input
   */
  parse: (value: unknown) => TOutput;

  /**
   * Optional async parse implementation
   * If not provided, async parsing delegates to parse()
   */
  parseAsync?: (value: unknown) => Promise<TOutput>;

  /**
   * Optional safeParse implementation
   * If not provided, will use try-catch around parse()
   */
  safeParse?: (value: unknown) => ParseResult<TOutput> | { success: true; data: TOutput } | { success: false; error: Error };

  /**
   * Optional async safeParse implementation
   * If not provided, will use try-catch around parseAsync()
   */
  safeParseAsync?: (value: unknown) => Promise<ParseResult<TOutput> | { success: true; data: TOutput } | { success: false; error: Error }>;
}

/**
 * Immutable custom validator for user-defined validation logic
 * Provides type safety while allowing complete control over validation
 */
export class VldCustom<TOutput = unknown> extends VldBase<unknown, TOutput> {
  private readonly _parseFn: (value: unknown) => TOutput;
  private readonly _parseAsyncFn: (value: unknown) => Promise<TOutput>;
  private readonly _safeParseFn: (value: unknown) => ParseResult<TOutput>;
  private readonly _safeParseAsyncFn: (value: unknown) => Promise<ParseResult<TOutput>>;

  private constructor(options: CustomValidatorOptions<TOutput>) {
    super(VLD_VALIDATOR_TYPES.CUSTOM);
    this._parseFn = options.parse;
    this._parseAsyncFn = options.parseAsync || ((value: unknown) => Promise.resolve(this._parseFn(value)));
    this._safeParseFn = options.safeParse
      ? (value: unknown) => {
          const res = options.safeParse!(value);
          if (res.success) return { success: true, data: res.data };
          return { success: false, error: ensureVldError(res.error) };
        }
      : (value: unknown) => {
          try {
            return { success: true, data: this._parseFn(value) };
          } catch (error) {
            return { success: false, error: ensureVldError(error) };
          }
        };
    this._safeParseAsyncFn = options.safeParseAsync
      ? async (value: unknown) => {
          const res = await options.safeParseAsync!(value);
          if (res.success) return { success: true, data: res.data };
          return { success: false, error: ensureVldError(res.error) };
        }
      : async (value: unknown) => {
          try {
            return { success: true, data: await this._parseAsyncFn(value) };
          } catch (error) {
            return { success: false, error: ensureVldError(error) };
          }
        };
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

  override async parseAsync(value: unknown): Promise<TOutput> {
    return this._parseAsyncFn(value);
  }

  override async safeParseAsync(value: unknown): Promise<ParseResult<TOutput>> {
    return this._safeParseAsyncFn(value);
  }
}

/**
 * Helper function to create custom validators
 * Supports:
 * - v.custom() -> accepts any
 * - v.custom((val) => boolean, "error message")
 * - v.custom({ parse: (val) => ... })
 */
export function custom<TOutput = unknown>(
  optionsOrPredicate?: CustomValidatorOptions<TOutput> | ((data: unknown) => boolean | Promise<boolean>),
  errorParam?: ErrorParam
): VldCustom<TOutput> {
  if (typeof optionsOrPredicate === 'function') {
    const predicate = optionsOrPredicate;
    return VldCustom.create<TOutput>({
      parse: (value: unknown) => {
        const passed = predicate(value);
        if (!passed) {
          throw ensureVldError(resolveErrorMessage(errorParam, 'Custom validation failed'));
        }
        return value as TOutput;
      }
    });
  }
  if (!optionsOrPredicate) {
    return VldCustom.create<TOutput>({
      parse: (value: unknown) => value as TOutput
    });
  }
  return VldCustom.create(optionsOrPredicate);
}
