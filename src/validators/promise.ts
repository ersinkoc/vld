/**
 * Promise validator - validates Promise values
 * Validates that the resolved value matches the inner schema
 */

import { type ParseResult } from './base';

/**
 * Promise validator - validates Promise<T> where T matches inner schema
 * Zod 4 API parity - allows async validation with proper type inference
 *
 * Validates that the input is a Promise, and validates the resolved value
 * against the inner schema when parsed.
 *
 * Use parseAsync() or safeParseAsync() for proper async handling.
 */
export class VldPromise<T> {
  constructor(private readonly inner: { parse(value: unknown): T; safeParse(value: unknown): ParseResult<T> }) {
  }

  /**
   * Check if value is thenable (Promise-like)
   * Must be called BEFORE wrapping in Promise.resolve
   */
  private _isThenable(value: unknown): boolean {
    return value !== null && typeof (value as any).then === 'function';
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
    // Now we can safely await it
    const resolved = await Promise.resolve(value);
    return this.inner.parse(resolved);
  }

  /**
   * Safely parse and validate a Promise value asynchronously
   * @param value The Promise to validate
   * @returns A Promise resolving to ParseResult containing the validated value
   */
  async safeParse(value: unknown): Promise<ParseResult<T>> {
    // Check if value is thenable BEFORE wrapping in Promise.resolve
    if (!this._isThenable(value)) {
      return {
        success: false as const,
        error: new Error('Expected a Promise value')
      };
    }

    try {
      const resolved = await Promise.resolve(value);
      const validated = this.inner.parse(resolved);
      return {
        success: true as const,
        data: validated
      };
    } catch (err) {
      return {
        success: false as const,
        error: err instanceof Error ? err : new Error(String(err))
      };
    }
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
export function promise<T>(inner: { parse(value: unknown): T; safeParse(value: unknown): ParseResult<T> }): VldPromise<T> {
  return new VldPromise(inner);
}
