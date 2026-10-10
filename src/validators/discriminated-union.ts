/**
 * VldDiscriminatedUnion - Fast union validation using discriminator field
 * Part of Zod 4 API parity implementation
 * Provides O(1) lookup performance by using a discriminator key
 */

import {
  VldBase, VLD_VALIDATOR_TYPES, ensureVldError,
  VldMeta, VldReadonly, VldBrand, VldRefine, VldSuperRefine,
  VldOptional, VldExactOptional, VldNullable, VldNullish
} from './base';
import { VldObject } from './object';
import { VldLiteral } from './literal';
import { VldEnum } from './enum';
import { VldUnion, type UnionMemberOutput } from './union';
import { VldError, createInvalidTypeIssue, getTypeName, stringifyForMessage } from '../errors-core';
import type { ParseResult } from './base';

/** Inner schema of a wrapper that does not change which values are accepted. */
function innerOfWrapper(schema: VldBase<unknown, any>): VldBase<unknown, any> | undefined {
  if (
    schema instanceof VldMeta || schema instanceof VldReadonly || schema instanceof VldBrand ||
    schema instanceof VldRefine || schema instanceof VldOptional || schema instanceof VldExactOptional ||
    schema instanceof VldNullable || schema instanceof VldNullish
  ) {
    return (schema as any).baseValidator;
  }
  if (schema instanceof VldSuperRefine) {
    return (schema as any)._inner;
  }
  return undefined;
}

/**
 * Extract literal values from a discriminator schema: literals, enums, unions
 * of those, and their optional / nullable / described / branded wrappers.
 */
function extractLiteralValues(schema: VldBase<unknown, any>): unknown[] {
  if (schema instanceof VldLiteral) {
    return [...schema.values];
  }
  if (schema instanceof VldEnum) {
    return [...schema.values];
  }
  if (schema instanceof VldUnion) {
    return schema.options.flatMap((option: VldBase<unknown, any>) => extractLiteralValues(option));
  }
  const inner = innerOfWrapper(schema);
  if (inner) {
    const values = extractLiteralValues(inner);
    if (schema instanceof VldNullable || schema instanceof VldNullish) values.push(null);
    if (schema instanceof VldOptional || schema instanceof VldExactOptional || schema instanceof VldNullish) values.push(undefined);
    return values;
  }
  throw new Error('Discriminator must be a literal or enum schema');
}

/**
 * Discriminator values an option accepts: plain objects, nested discriminated
 * unions and wrapped (refined / described / branded) objects.
 */
function optionDiscriminatorValues(option: VldBase<unknown, any>, discriminator: string): unknown[] | undefined {
  if (option instanceof VldObject) {
    const discriminatorSchema = (option as any).config?.shape?.[discriminator];
    if (!discriminatorSchema) {
      throw new Error(`Missing discriminator key "${discriminator}" in one of the options`);
    }
    return extractLiteralValues(discriminatorSchema);
  }
  if (option instanceof VldDiscriminatedUnion) {
    return option.options.flatMap((nested: VldBase<unknown, any>) => optionDiscriminatorValues(nested, discriminator)!);
  }
  const inner = innerOfWrapper(option);
  return inner ? optionDiscriminatorValues(inner, discriminator) : undefined;
}

/**
 * Discriminated union validator - validates union based on discriminator key
 * Much faster than regular union when you have a discriminator field
 */
export class VldDiscriminatedUnion<K extends string, Options extends readonly VldBase<any, any>[]>
  extends VldBase<unknown, UnionMemberOutput<Options[number]>> {

  private readonly _discriminatorMap: Map<unknown, VldBase<unknown, any>>;
  private readonly _stringDiscriminatorMap: Record<string, VldBase<unknown, any>>;
  private readonly _validValues: unknown[];

  constructor(
    private readonly _discriminator: K,
    private readonly _options: Options
  ) {
    super(VLD_VALIDATOR_TYPES.DISCRIMINATED_UNION);

    // Build discriminator map for O(1) lookup
    this._discriminatorMap = new Map();
    this._stringDiscriminatorMap = Object.create(null) as Record<string, VldBase<unknown, any>>;

    for (const option of _options) {
      const values = optionDiscriminatorValues(option, this._discriminator);
      if (!values) {
        throw new Error('All options in a discriminated union must be objects');
      }

      // A nested discriminated union may repeat a tag it splits on a second discriminator: once per option.
      for (const value of new Set(values)) {
        if (this._discriminatorMap.has(value)) {
          throw new Error(`Duplicate discriminator value "${String(value)}" found in discriminated union`);
        }
        this._discriminatorMap.set(value, option);
        if (typeof value === 'string') {
          this._stringDiscriminatorMap[value] = option;
        }
      }
    }

    this._validValues = Array.from(this._discriminatorMap.keys());
  }

  get options(): Options {
    return this._options;
  }

  get discriminator(): K {
    return this._discriminator;
  }

  static create<K extends string, Options extends readonly VldBase<any, any>[]>(
    discriminator: K,
    options: Options
  ): VldDiscriminatedUnion<K, Options> {
    return new VldDiscriminatedUnion(discriminator, options);
  }

  parse(value: unknown): UnionMemberOutput<Options[number]> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw this.notObjectError(value);
    }

    const discriminatorValue = (value as Record<string, unknown>)[this._discriminator];
    const matchedSchema = typeof discriminatorValue === 'string'
      ? this._stringDiscriminatorMap[discriminatorValue]
      : this._discriminatorMap.get(discriminatorValue);

    if (!matchedSchema) {
      throw this.noMatchError(discriminatorValue);
    }

    return this.parseOption(matchedSchema, value as Record<string, unknown>) as UnionMemberOutput<Options[number]>;
  }

  private parseOption(option: VldBase<unknown, any>, value: Record<string, unknown>): unknown {
    return option instanceof VldObject
      ? option.parseTrustedKnownObject(value, this._discriminator)
      : option.parse(value);
  }

  private notObjectError(value: unknown): VldError {
    return new VldError([createInvalidTypeIssue(
      'object',
      getTypeName(value),
      `Expected object, received ${value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value}`
    )]);
  }

  /** Zod-shaped: invalid_union at the discriminator path. */
  private noMatchError(discriminatorValue: unknown): VldError {
    return new VldError([{
      code: 'invalid_union',
      path: [this._discriminator],
      message:
        `Invalid discriminator value for "${this._discriminator}". ` +
        `Expected one of: ${stringifyForMessage(this._validValues)}, ` +
        `received: ${stringifyForMessage(discriminatorValue)}`,
      errors: [],
      note: 'No matching discriminator',
      discriminator: this._discriminator
    }]);
  }

  safeParse(value: unknown): ParseResult<UnionMemberOutput<Options[number]>> {
    // Check if input is an object
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return { success: false, error: this.notObjectError(value) };
    }

    // Get discriminator value
    const discriminatorValue = (value as Record<string, unknown>)[this._discriminator];

    // Look up matching schema
    const matchedSchema = typeof discriminatorValue === 'string'
      ? this._stringDiscriminatorMap[discriminatorValue]
      : this._discriminatorMap.get(discriminatorValue);

    if (!matchedSchema) {
      return { success: false, error: this.noMatchError(discriminatorValue) };
    }

    try {
      return {
        success: true,
        data: this.parseOption(matchedSchema, value as Record<string, unknown>) as UnionMemberOutput<Options[number]>
      };
    } catch (error) {
      // Failure path only: re-run the option's own safeParse so issues keep
      // their codes and field paths instead of one flattened message.
      const detailed = matchedSchema.safeParse(value);
      return {
        success: false,
        error: detailed.success ? ensureVldError(error) : ensureVldError(detailed.error)
      };
    }
  }

  /** Async parse: the matched option runs its parseAsync. */
  override async parseAsync(value: unknown): Promise<UnionMemberOutput<Options[number]>> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw this.notObjectError(value);
    }
    const discriminatorValue = (value as Record<string, unknown>)[this._discriminator];
    const matchedSchema = typeof discriminatorValue === 'string'
      ? this._stringDiscriminatorMap[discriminatorValue]
      : this._discriminatorMap.get(discriminatorValue);
    if (!matchedSchema) {
      throw this.noMatchError(discriminatorValue);
    }
    return matchedSchema.parseAsync(value) as any;
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
