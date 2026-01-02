/**
 * VldDiscriminatedUnion - Fast union validation using discriminator field
 * Part of Zod 4 API parity implementation
 * Provides O(1) lookup performance by using a discriminator key
 */

import { VldBase } from './base';
import { VldObject } from './object';
import { VldLiteral } from './literal';
import { VldEnum } from './enum';
import type { ParseResult } from './base';

/**
 * Extract literal values from a schema
 */
function extractLiteralValues(schema: VldBase<unknown, any>): unknown[] {
  if (schema instanceof VldLiteral) {
    const value = (schema as any).literal;
    return [value];
  }
  if (schema instanceof VldEnum) {
    return (schema as any).values as unknown[];
  }
  throw new Error('Discriminator must be a literal or enum schema');
}

/**
 * Discriminated union validator - validates union based on discriminator key
 * Much faster than regular union when you have a discriminator field
 */
export class VldDiscriminatedUnion<K extends string, Options extends VldBase<any, any>[]>
  extends VldBase<unknown, Options[number] extends VldBase<any, infer T> ? T : never> {

  private readonly _discriminatorMap: Map<unknown, VldBase<any, any>>;

  constructor(
    private readonly _discriminator: K,
    private readonly _options: Options
  ) {
    super();

    // Build discriminator map for O(1) lookup
    this._discriminatorMap = new Map();

    for (const option of _options) {
      if (!(option instanceof VldObject)) {
        throw new Error('All options in a discriminated union must be objects');
      }

      const discriminatorSchema = (option as any).config?.shape?.[this._discriminator];
      if (!discriminatorSchema) {
        throw new Error(`Missing discriminator key "${this._discriminator}" in one of the options`);
      }

      const values = extractLiteralValues(discriminatorSchema);

      for (const value of values) {
        if (this._discriminatorMap.has(value)) {
          throw new Error(`Duplicate discriminator value "${String(value)}" found in discriminated union`);
        }
        this._discriminatorMap.set(value, option);
      }
    }
  }

  static create<K extends string, Options extends VldBase<any, any>[]>(
    discriminator: K,
    options: Options
  ): VldDiscriminatedUnion<K, Options> {
    return new VldDiscriminatedUnion(discriminator, options);
  }

  parse(value: unknown): Options[number] extends VldBase<any, infer T> ? T : never {
    const result = this.safeParse(value);
    if (!result.success) {
      throw result.error;
    }
    return result.data;
  }

  safeParse(value: unknown): ParseResult<Options[number] extends VldBase<any, infer T> ? T : never> {
    // Check if input is an object
    if (typeof value !== 'object' || value === null) {
      return {
        success: false,
        error: new Error(
          `Expected object, received ${value === null ? 'null' : typeof value}`
        )
      };
    }

    // Get discriminator value
    const discriminatorValue = (value as any)[this._discriminator];

    // Look up matching schema
    const matchedSchema = this._discriminatorMap.get(discriminatorValue);

    if (!matchedSchema) {
      const validValues = Array.from(this._discriminatorMap.keys());
      return {
        success: false,
        error: new Error(
          `Invalid discriminator value for "${this._discriminator}". ` +
          `Expected one of: ${JSON.stringify(validValues)}, ` +
          `received: ${JSON.stringify(discriminatorValue)}`
        )
      };
    }

    // Validate against matched schema
    return matchedSchema.safeParse(value) as ParseResult<Options[number] extends VldBase<any, infer T> ? T : never>;
  }

  /**
   * Get the discriminator key
   */
  getDiscriminator(): K {
    return this._discriminator;
  }

  /**
   * Get all options
   */
  getOptions(): Options {
    return this._options;
  }
}
