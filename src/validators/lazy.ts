/**
 * VldLazy - Lazy evaluation for recursive schemas
 * Part of Zod 4 API parity implementation
 * Allows schemas that reference themselves (e.g., tree structures, nested categories)
 */

import { VldBase } from './base';
import type { ParseResult } from './base';

/**
 * Lazy validator - defers schema evaluation until runtime
 * Essential for recursive and self-referencing types
 */
export class VldLazy<TInput, TOutput> extends VldBase<TInput, TOutput> {
  private _cachedSchema: VldBase<TInput, TOutput> | null = null;

  private constructor(
    private readonly _schemaGetter: () => VldBase<TInput, TOutput>
  ) {
    super();
  }

  static create<TInput, TOutput>(
    schemaGetter: () => VldBase<TInput, TOutput>
  ): VldLazy<TInput, TOutput> {
    return new VldLazy(schemaGetter);
  }

  /**
   * Get the actual schema, caching it after first retrieval
   */
  private _getSchema(): VldBase<TInput, TOutput> {
    if (!this._cachedSchema) {
      this._cachedSchema = this._schemaGetter();
    }
    return this._cachedSchema;
  }

  /**
   * Get the inner schema (unwrap)
   */
  unwrap(): VldBase<TInput, TOutput> {
    return this._getSchema();
  }

  parse(value: unknown): TOutput {
    return this._getSchema().parse(value);
  }

  safeParse(value: unknown): ParseResult<TOutput> {
    return this._getSchema().safeParse(value);
  }
}
