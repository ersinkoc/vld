import { VldBase, ParseResult } from './base';
import { getMessages } from '../locales';

/**
 * Immutable JSON validator that validates and parses JSON strings
 * Accepts both strings (which are parsed) and already-parsed objects
 */
export class VldJson<T = unknown> extends VldBase<unknown, T> {
  private constructor(
    private readonly schema?: VldBase<unknown, T>
  ) {
    super();
  }

  /**
   * Create a new JSON validator
   */
  static create<T = unknown>(schema?: VldBase<unknown, T>): VldJson<T> {
    return new VldJson(schema);
  }

  /**
   * Parse and validate a JSON value
   */
  parse(value: unknown): T {
    let parsed: unknown;

    // If it's a string, try to parse it as JSON first
    if (typeof value === 'string') {
      try {
        parsed = JSON.parse(value);
      } catch (e) {
        throw new Error(getMessages().invalidJson);
      }
    } else {
      // Not a string - assume it's already parsed
      parsed = value;
    }

    // If we have a schema, validate against it
    if (this.schema) {
      return this.schema.parse(parsed);
    }

    // No schema - just return the parsed value
    return parsed as T;
  }

  /**
   * Safely parse and validate a JSON value
   */
  safeParse(value: unknown): ParseResult<T> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return {
        success: false,
        error: error as Error
      };
    }
  }

  /**
   * Create a new JSON validator with a schema for validation
   */
  withSchema<U>(schema: VldBase<unknown, U>): VldJson<U> {
    return new VldJson(schema);
  }
}
