import { VldBase, ParseResult, VLD_VALIDATOR_TYPES, ensureVldError } from './base';
import { VldError, createInvalidTypeIssue, getTypeName, type VldIssue } from '../errors-core';

/** Zod's json union options, in order: string, number, boolean, null, array, record. */
const JSON_OPTION_TYPES = ['string', 'number', 'boolean', 'null', 'array', 'record'] as const;

function isPlainObjectLike(value: unknown): boolean {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  // JSON.parse output is a plain object: Object.prototype or null prototype.
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function isJsonValue(value: unknown): boolean {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return true;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value);
  }
  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }
  if (isPlainObjectLike(value)) {
    return Object.values(value as Record<string, unknown>).every(isJsonValue);
  }
  return false;
}

/**
 * Immutable JSON validator: validates that a value is JSON-compatible
 * (the shapes JSON.parse can produce), matching Zod's `z.json()`.
 * Strings are NOT parsed; use a codec for that.
 */
export class VldJson<T = unknown> extends VldBase<unknown, T> {
  private constructor(
    private readonly schema?: VldBase<unknown, T>
  ) {
    super(VLD_VALIDATOR_TYPES.JSON);
  }

  /**
   * Create a new JSON validator
   */
  static create<T = unknown>(schema?: VldBase<unknown, T>): VldJson<T> {
    return new VldJson<T>(schema);
  }

  /**
   * Validate a JSON-compatible value
   */
  parse(value: unknown): T {
    if (!isJsonValue(value)) {
      // Zod reports one top-level invalid_union listing every option's
      // invalid_type issue, wherever in the value the failure occurred.
      throw new VldError([{
        code: 'invalid_union',
        path: [],
        errors: JSON_OPTION_TYPES.map(expected => [createInvalidTypeIssue(expected, getTypeName(value))]),
        message: 'Invalid input',
      } as VldIssue]);
    }

    if (this.schema) {
      return this.schema.parse(value);
    }

    return value as T;
  }

  /**
   * Safely validate a JSON-compatible value
   */
  safeParse(value: unknown): ParseResult<T> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return {
        success: false,
        error: ensureVldError(error)
      };
    }
  }

  /** Async parse: the value check is sync; a provided schema runs async. */
  override async parseAsync(value: unknown): Promise<T> {
    if (!isJsonValue(value)) {
      return this.parse(value);
    }
    if (this.schema) {
      return this.schema.parseAsync(value);
    }
    return value as T;
  }

  /**
   * Create a new JSON validator with a schema for validation
   */
  withSchema<U>(schema: VldBase<unknown, U>): VldJson<U> {
    return new VldJson(schema);
  }
}
