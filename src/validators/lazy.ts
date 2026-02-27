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
 *
 * MEMORY OPTIMIZATION: Uses WeakRef for the cached schema to allow garbage collection
 * when the validator is no longer in use. This prevents memory leaks in long-running
 * applications with dynamically created schemas.
 */
export class VldLazy<TInput, TOutput> extends VldBase<TInput, TOutput> {
  // Use WeakRef to allow garbage collection of the cached schema
  private _cachedSchemaRef: WeakRef<VldBase<TInput, TOutput>> | null = null;
  // Keep a strong reference flag to prevent GC during active use
  private _strongRef: VldBase<TInput, TOutput> | null = null;

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
   * Uses WeakRef to allow garbage collection when validator is not in use
   */
  private _getSchema(): VldBase<TInput, TOutput> {
    // Check if we have a strong reference first (active use)
    if (this._strongRef) {
      return this._strongRef;
    }

    // Try to get from WeakRef
    if (this._cachedSchemaRef) {
      const cached = this._cachedSchemaRef.deref();
      if (cached) {
        // Restore strong reference for active use
        this._strongRef = cached;
        return cached;
      }
    }

    // Create new schema
    const schema = this._schemaGetter();
    this._cachedSchemaRef = new WeakRef(schema);
    this._strongRef = schema;

    // Clear strong reference after a tick to allow GC
    // This keeps the schema alive during synchronous operations
    // but allows it to be collected if the validator is discarded
    Promise.resolve().then(() => {
      this._strongRef = null;
    });

    return schema;
  }

  /**
   * Get the inner schema (unwrap)
   * Returns a strong reference that will keep the schema alive
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
