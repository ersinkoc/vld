/**
 * Promise validator - validates Promise values
 * Validates that the resolved value matches the inner schema
 */

import { VldBase, type ParseResult, type StandardSchemaV1Props, type StandardSchemaV1Result, type StandardTypedV1Types, VLD_VALIDATOR_TYPES, ensureVldError } from './base';

type PromiseInner<T> = {
  parse(value: unknown): T;
  safeParse(value: unknown): ParseResult<T>;
  parseAsync?(value: unknown): Promise<T>;
  safeParseAsync?(value: unknown): Promise<ParseResult<T>>;
};

/**
 * Promise validator - validates Promise<T> where T matches inner schema
 * Zod 4 API parity - allows async validation with proper type inference
 *
 * Validates that the input is a Promise, and validates the resolved value
 * against the inner schema when parsed.
 *
 * Use parseAsync() or safeParseAsync() for proper async handling.
 */
export class VldPromise<T> extends VldBase<unknown, Promise<T>> {
  constructor(private readonly inner: PromiseInner<T>) {
    super(VLD_VALIDATOR_TYPES.PROMISE);
  }

  override get '~standard'(): StandardSchemaV1Props<unknown, any> {
    return {
      version: 1,
      vendor: 'vld',
      validate: async (value: unknown): Promise<StandardSchemaV1Result<any>> => {
        const result = await this.safeParse(value);
        if (result.success) {
          return { value: result.data };
        }
        return { issues: [{ message: result.error.message }] };
      },
      types: undefined as unknown as StandardTypedV1Types<unknown, any>
    };
  }

  /**
   * Check if value is thenable (Promise-like)
   * Must be called BEFORE wrapping in Promise.resolve
   */
  private _isThenable(value: unknown): boolean {
    return value !== null && typeof (value as any).then === 'function';
  }

  unwrap(): PromiseInner<T> {
    return this.inner;
  }

  /**
   * Parse and validate a Promise value asynchronously
   * @param value The Promise to validate
   * @returns The validated value
   * @throws {Error} If validation fails when Promise resolves
   */
  async parse(value: unknown): Promise<T> {
    // Check if value is thenable BEFORE wrapping in Promise.resolve
    if (!this._isThenable(value)) {
      throw new Error('Expected a Promise value');
    }
    const resolved = await Promise.resolve(value);
    return this.inner.parseAsync ? this.inner.parseAsync(resolved) : this.inner.parse(resolved);
  }

  override parseAsync(value: unknown): Promise<Promise<T>> {
    return this.parse(value) as any;
  }

  /**
   * Safely parse and validate a Promise value asynchronously
   * @param value The Promise to validate
   * @returns A Promise resolving to ParseResult containing the validated value
   */
  safeParse(value: unknown): any {
    // Check if value is thenable BEFORE wrapping in Promise.resolve
    if (!this._isThenable(value)) {
      return Promise.resolve({
        success: false as const,
        error: ensureVldError('Expected a Promise value')
      });
    }

    return (async () => {
      try {
        const resolved = await Promise.resolve(value);
        if (this.inner.safeParseAsync) {
          return await this.inner.safeParseAsync(resolved);
        }

        const innerResult = this.inner.safeParse(resolved);
        if (!innerResult.success) {
          return innerResult;
        }

        return { success: true as const, data: innerResult.data };
      } catch (err) {
        return {
          success: false as const,
          error: ensureVldError(err)
        };
      }
    })();
  }

  override safeParseAsync(value: unknown): Promise<ParseResult<Promise<T>>> {
    return this.safeParse(value);
  }
}

/**
 * Create a Promise validator
 * @param inner The schema to validate the resolved value against
 * @returns A new Promise validator
 * @example
 * const promiseSchema = v.promise(v.string());
 * const result = await promiseSchema.parse(Promise.resolve("hello"));
 * // result is string
 */
export function promise<T>(inner: PromiseInner<T>): VldPromise<T> {
  return new VldPromise(inner);
}
