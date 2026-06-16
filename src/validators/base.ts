import { globalRegistry } from '../registry';
import type { SchemaRegistry } from '../registry';

/**
 * Base result type for validation
 */
export type ParseResult<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: Error };

export interface StandardTypedV1<Input = unknown, Output = Input> {
  readonly '~standard': StandardTypedV1Props<Input, Output>;
}

export interface StandardTypedV1Props<Input = unknown, Output = Input> {
  readonly version: 1;
  readonly vendor: string;
  readonly types?: StandardTypedV1Types<Input, Output> | undefined;
}

export interface StandardTypedV1Types<Input = unknown, Output = Input> {
  readonly input: Input;
  readonly output: Output;
}

export interface StandardSchemaV1<Input = unknown, Output = Input> extends StandardTypedV1<Input, Output> {
  readonly '~standard': StandardSchemaV1Props<Input, Output>;
}

export interface StandardSchemaV1Props<Input = unknown, Output = Input> extends StandardTypedV1Props<Input, Output> {
  readonly validate: (
    value: unknown,
    options?: StandardSchemaV1Options | undefined
  ) => StandardSchemaV1Result<Output> | Promise<StandardSchemaV1Result<Output>>;
}

export interface StandardSchemaV1Options {
  readonly libraryOptions?: Record<string, unknown> | undefined;
}

export type StandardSchemaV1Result<Output> =
  | StandardSchemaV1SuccessResult<Output>
  | StandardSchemaV1FailureResult;

export interface StandardSchemaV1SuccessResult<Output> {
  readonly value: Output;
  readonly issues?: undefined;
}

export interface StandardSchemaV1FailureResult {
  readonly issues: ReadonlyArray<StandardSchemaV1Issue>;
}

export interface StandardSchemaV1Issue {
  readonly message: string;
  readonly path?: ReadonlyArray<PropertyKey | StandardSchemaV1PathSegment> | undefined;
}

export interface StandardSchemaV1PathSegment {
  readonly key: PropertyKey;
}

/**
 * Validator type constants for O(1) dispatch
 * Used by VldObject to replace instanceof chains with Map lookups
 */
export const VLD_VALIDATOR_TYPES = {
  // Primitives
  STRING: 'string',
  STRING_FORMAT: 'stringFormat',
  STRING_BOOL: 'stringBool',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  DATE: 'date',
  BIGINT: 'bigint',
  UNDEFINED: 'undefined',
  NULL: 'null',
  UNKNOWN: 'unknown',
  ANY: 'any',
  VOID: 'void',
  NEVER: 'never',
  SYMBOL: 'symbol',
  NAN: 'nan',
  HEX: 'hex',
  BASE64: 'base64',
  UINT8_ARRAY: 'uint8Array',

  // Coercion
  COERCE_STRING: 'coerceString',
  COERCE_NUMBER: 'coerceNumber',
  COERCE_BOOLEAN: 'coerceBoolean',
  COERCE_DATE: 'coerceDate',
  COERCE_BIGINT: 'coerceBigint',

  // Composite
  OBJECT: 'object',
  ARRAY: 'array',
  TUPLE: 'tuple',
  SET: 'set',
  MAP: 'map',
  RECORD: 'record',

  // Union types
  UNION: 'union',
  DISCRIMINATED_UNION: 'discriminatedUnion',
  INTERSECTION: 'intersection',
  XOR: 'xor',

  // Values
  ENUM: 'enum',
  LITERAL: 'literal',

  // Special validators
  LAZY: 'lazy',
  CUSTOM: 'custom',
  FUNCTION: 'function',
  FILE: 'file',
  JSON: 'json',
  TEMPLATE_LITERAL: 'templateLiteral',
  PROMISE: 'promise',

  // Wrapper/Modifier validators
  OPTIONAL: 'optional',
  NULLABLE: 'nullable',
  NULLISH: 'nullish',
  EXACT_OPTIONAL: 'exactOptional',
  DEFAULT: 'default',
  CATCH: 'catch',
  REFINE: 'refine',
  TRANSFORM: 'transform',
  PIPE: 'pipe',
  PREPROCESS: 'preprocess',
  SUPER_REFINE: 'superRefine',
  BRAND: 'brand',
  READONLY: 'readonly',
  META: 'meta',
  PREFAULT: 'prefault',
  PREFault: 'prefault',

  // Codec
  CODEC: 'codec',
} as const;

export type ValidatorType = typeof VLD_VALIDATOR_TYPES[keyof typeof VLD_VALIDATOR_TYPES];

/**
 * Context for superRefine - allows adding multiple issues
 */
export interface SuperRefineContext {
  addIssue(issue: { message: string; code?: string }): void;
  path: (string | number)[];
}

export type ErrorMap = (issue: { code?: string; input?: unknown; path?: (string | number)[] }) => string | undefined;
export type ErrorParam = string | { error?: string | ErrorMap; message?: string };

export function resolveErrorMessage(error: ErrorParam | undefined, fallback: string): string {
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error?.error === 'string') {
    return error.error;
  }
  if (typeof error?.error === 'function') {
    return error.error({}) || fallback;
  }
  if (typeof error?.message === 'string') {
    return error.message;
  }
  return fallback;
}

function isPromiseLike<T = unknown>(value: unknown): value is PromiseLike<T> {
  return value !== null &&
    (typeof value === 'object' || typeof value === 'function') &&
    typeof (value as { then?: unknown }).then === 'function';
}

type SimpleWrappedMode = 'string' | 'number' | 'boolean' | 'bigint' | 'symbol' | undefined;

function getSimpleWrappedMode(baseValidator: VldBase<unknown, unknown>): SimpleWrappedMode {
  if ((baseValidator as { isSimple?: boolean }).isSimple !== true) {
    return undefined;
  }

  switch (baseValidator.validatorType) {
    case VLD_VALIDATOR_TYPES.STRING:
      return 'string';
    case VLD_VALIDATOR_TYPES.NUMBER:
      return 'number';
    case VLD_VALIDATOR_TYPES.BOOLEAN:
      return 'boolean';
    case VLD_VALIDATOR_TYPES.BIGINT:
      return 'bigint';
    case VLD_VALIDATOR_TYPES.SYMBOL:
      return 'symbol';
    default:
      return undefined;
  }
}

function parseSimpleWrappedValue<TOutput>(mode: SimpleWrappedMode, value: unknown): TOutput | undefined {
  switch (mode) {
    case 'string':
      return typeof value === 'string' ? value as TOutput : undefined;
    case 'number':
      return typeof value === 'number' && !isNaN(value) ? value as TOutput : undefined;
    case 'boolean':
      return typeof value === 'boolean' ? value as TOutput : undefined;
    case 'bigint':
      return typeof value === 'bigint' ? value as TOutput : undefined;
    case 'symbol':
      return typeof value === 'symbol' ? value as TOutput : undefined;
    default:
      return undefined;
  }
}

/**
 * Abstract base class for all validators
 * Implements immutable pattern to prevent memory leaks and race conditions
 */
export abstract class VldBase<TInput, TOutput = TInput> {
  /**
   * Runtime type identifier for O(1) dispatch
   * Used by VldObject instead of instanceof chains
   */
  readonly validatorType: ValidatorType;

  /**
   * Constructor with runtime type identifier
   * @param validatorType The runtime type identifier
   */
  constructor(validatorType: ValidatorType = 'unknown') {
    this.validatorType = validatorType;
  }

  get '~standard'(): StandardSchemaV1Props<unknown, TOutput> {
    return {
      version: 1,
      vendor: 'vld',
      validate: (value: unknown): StandardSchemaV1Result<TOutput> => {
        const result = this.safeParse(value);
        if (result.success) {
          return { value: result.data };
        }
        return { issues: [{ message: result.error.message }] };
      },
      types: undefined as unknown as StandardTypedV1Types<unknown, TOutput>
    };
  }

  /**
   * Parse and validate a value, throwing an error if invalid
   * @param value The value to validate
   * @returns The validated value
   * @throws {Error} If validation fails
   */
  abstract parse(value: unknown): TOutput;
  
  /**
   * Safely parse and validate a value, returning a result object
   * @param value The value to validate
   * @returns A result object with either success and data, or failure and error
   */
  abstract safeParse(value: unknown): ParseResult<TOutput>;

  async parseAsync(value: unknown): Promise<TOutput> {
    return this.parse(value);
  }

  async safeParseAsync(value: unknown): Promise<ParseResult<TOutput>> {
    try {
      return { success: true, data: await this.parseAsync(value) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
  
  /**
   * Check if a value is valid according to this validator
   * @param value The value to check
   * @returns True if valid, false otherwise
   */
  isValid(value: unknown): boolean {
    return this.safeParse(value).success;
  }
  
  /**
   * Parse a value or return a default if validation fails
   * BUG-NEW-017 FIX: Validate default value to ensure type safety
   * @param value The value to validate
   * @param defaultValue The default value to return on failure
   * @returns The validated value or default
   */
  parseOrDefault(value: unknown, defaultValue: TOutput): TOutput {
    const result = this.safeParse(value);
    if (result.success) {
      return result.data;
    }

    // Validate the default value to ensure it's actually valid
    const defaultResult = this.safeParse(defaultValue);
    if (!defaultResult.success) {
      throw new Error(`Invalid default value provided: ${defaultResult.error.message}`);
    }

    return defaultResult.data;
  }
  
  /**
   * Create a new validator that refines this one with a custom predicate
   * @param predicate The refinement predicate
   * @param message Optional custom error message
   * @returns A new refined validator
   */
  refine<TRefined extends TOutput>(
    predicate: (value: TOutput) => value is TRefined,
    message?: string
  ): VldRefine<TInput, TOutput, TRefined>;
  refine(
    predicate: (value: TOutput) => boolean | Promise<boolean>,
    message?: string
  ): VldRefine<TInput, TOutput, TOutput>;
  refine(
    predicate: (value: TOutput) => boolean | Promise<boolean>,
    message?: string
  ): VldRefine<TInput, TOutput, TOutput> {
    return new VldRefine(this, predicate, message);
  }

  /**
   * Advanced refinement with context for adding multiple issues
   * @param refinement The refinement function with context
   * @returns A new super refined validator
   */
  superRefine(
    refinement: (value: TOutput, ctx: SuperRefineContext) => void | Promise<void>
  ): VldSuperRefine<TInput, TOutput> {
    return new VldSuperRefine(this, refinement);
  }

  /**
   * Create a new validator that transforms the output
   * @param transformer The transformation function
   * @returns A new transformed validator
   */
  transform<TTransformed>(
    transformer: (value: TOutput) => TTransformed | Promise<TTransformed>
  ): VldTransform<TInput, TOutput, TTransformed> {
    return new VldTransform(this, transformer);
  }
  
  /**
   * Create a new validator with a default value for undefined inputs
   * @param defaultValue The default value
   * @returns A new validator with default
   */
  default(defaultValue: TOutput): VldDefault<TInput, TOutput> {
    return new VldDefault(this, defaultValue);
  }
  
  /**
   * Create a new validator that catches errors and returns a fallback
   * @param fallbackValue The fallback value
   * @returns A new validator with catch
   */
  catch(fallbackValue: TOutput): VldCatch<TInput, TOutput> {
    return new VldCatch(this, fallbackValue);
  }
  
  /**
   * Make this validator optional (allows undefined)
   * @returns A new optional validator
   */
  optional(): VldOptional<TInput, TOutput> {
    return new VldOptional(this);
  }
  
  /**
   * Make this validator nullable (allows null)
   * @returns A new nullable validator
   */
  nullable(): VldNullable<TInput, TOutput> {
    return new VldNullable(this);
  }
  
  /**
   * Make this validator nullish (allows null or undefined)
   * @returns A new nullish validator
   */
  nullish(): VldNullish<TInput, TOutput> {
    return new VldNullish(this);
  }

  /**
   * Make this validator exactly optional - allows undefined but not missing
   * Unlike .optional() which treats missing as undefined, exactOptional()
   * requires the key to be present but allows undefined as a value
   * Zod 4 API parity
   * @returns A new exact optional validator
   */
  exactOptional(): VldExactOptional<TInput, TOutput> {
    return new VldExactOptional(this);
  }

  /**
   * Pipe the output of this validator into another validator
   * @param next The next validator to pipe into
   * @returns A new piped validator
   */
  pipe<TNextOutput>(next: VldBase<TOutput, TNextOutput>): VldPipe<TInput, TOutput, TNextOutput> {
    return new VldPipe(this, next);
  }

  /**
   * Create a new validator that returns readonly output
   * Zod 4 API parity - marks output as readonly for TypeScript
   * @returns A new readonly validator
   */
  readonly(): VldReadonly<TInput, TOutput> {
    return new VldReadonly(this);
  }

  /**
   * Brand the output type with a unique brand for nominal typing
   * Zod 4 API parity - prevents accidental assignment of similarly typed values
   * @returns A new branded validator
   * @example
   * const userIdSchema = v.string().brand<'UserId'>();
   * const productIdSchema = v.string().brand<'ProductId'>();
   *
   * let userId: UserId = userIdSchema.parse('abc');
   * let productId: ProductId = productIdSchema.parse('xyz');
   *
   * userId = productId; // TypeScript error: types are incompatible
   */
  brand<TBrand extends string>(): VldBrand<TInput, TOutput, TBrand> {
    return new VldBrand(this);
  }

  /**
   * Apply an external function to transform this validator
   * Zod 4 API parity - allows external function chaining
   * @param fn External function that takes this validator and returns a new validator
   * @returns The result of applying the function to this validator
   * @example
   * const withLength = (schema: VldBase<unknown, string>) => schema.transform(s => s.length);
   * const lengthSchema = v.string().apply(withLength); // validates string, returns number
   */
  apply<TNewOutput>(fn: (schema: this) => VldBase<TInput, TNewOutput>): VldBase<TInput, TNewOutput> {
    return fn(this);
  }

  /**
   * Create a new validator that refines this one with a custom predicate
   * Alias for refine() - check() is the Zod 4 API name
   * @param predicate The refinement predicate
   * @param message Optional custom error message
   * @returns A new refined validator
   */
  check<TRefined extends TOutput>(
    predicate: (value: TOutput) => value is TRefined,
    message?: string
  ): VldRefine<TInput, TOutput, TRefined>;
  check(
    predicate: (value: TOutput) => boolean | Promise<boolean>,
    message?: string
  ): VldRefine<TInput, TOutput, TOutput>;
  check(
    predicate: (value: TOutput) => boolean | Promise<boolean>,
    message?: string
  ): VldRefine<TInput, TOutput, TOutput> {
    return new VldRefine(this, predicate, message);
  }

  /**
   * Get metadata for this schema
   * Zod 4 API parity - allows attaching OpenAPI/JSON Schema metadata
   * @returns Metadata object or undefined
   */
  meta(): SchemaMetadata | undefined;

  /**
   * Set metadata for this schema
   * Zod 4 API parity - allows attaching OpenAPI/JSON Schema metadata
   * @param data Metadata to attach
   * @returns A new validator with the metadata
   */
  meta(data: Partial<SchemaMetadata>): VldMeta<TInput, TOutput>;

  /**
   * Get or set metadata for this schema
   */
  meta(data?: Partial<SchemaMetadata>): SchemaMetadata | undefined | VldMeta<TInput, TOutput> {
    if (data === undefined) {
      return globalRegistry.get(this as unknown as VldBase<unknown, unknown>);
    }
    const schema = new VldMeta(this, data);
    globalRegistry.add(schema as unknown as VldBase<unknown, unknown>, data);
    return schema;
  }

  /**
   * Register this schema in a metadata registry and return the same instance.
   * This mirrors Zod 4's registry convenience API without changing validator
   * immutability.
   */
  register<TMetadata extends Record<string, unknown>>(
    targetRegistry: SchemaRegistry<TMetadata>,
    metadata: TMetadata
  ): this {
    targetRegistry.add(this, metadata);
    return this;
  }

  /**
   * Add a description to this schema
   * Zod 4 API parity - convenience method for .meta({ description: ... })
   * @param description The description to add
   * @returns A new validator with the description
   */
  describe(description: string): VldMeta<TInput, TOutput> {
    return this.meta({ description }) as VldMeta<TInput, TOutput>;
  }
}

/**
 * Schema metadata interface for OpenAPI/JSON Schema compatibility
 */
export interface SchemaMetadata {
  id?: string;
  title?: string;
  description?: string;
  examples?: unknown[];
  default?: unknown;
  deprecated?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  [key: string]: unknown;
}

/**
 * Metadata validator - wraps a schema with metadata
 */
export class VldMeta<TInput, TOutput> extends VldBase<TInput, TOutput> {
  constructor(
    private readonly baseValidator: VldBase<TInput, TOutput>,
    private readonly metadata: Partial<SchemaMetadata>
  ) {
    super(VLD_VALIDATOR_TYPES.META);
  }

  parse(value: unknown): TOutput {
    return this.baseValidator.parse(value);
  }

  safeParse(value: unknown): ParseResult<TOutput> {
    return this.baseValidator.safeParse(value);
  }

  /**
   * Get the metadata
   */
  getMeta(): Readonly<Partial<SchemaMetadata>> {
    return { ...this.metadata };
  }

  override meta(): SchemaMetadata | undefined;
  override meta(data: Partial<SchemaMetadata>): VldMeta<TInput, TOutput>;
  override meta(data?: Partial<SchemaMetadata>): SchemaMetadata | undefined | VldMeta<TInput, TOutput> {
    if (data === undefined) {
      return { ...this.metadata, ...globalRegistry.get(this as unknown as VldBase<unknown, unknown>) };
    }

    const schema = new VldMeta(this.baseValidator, { ...this.metadata, ...data });
    globalRegistry.add(schema as unknown as VldBase<unknown, unknown>, schema.getMeta() as SchemaMetadata);
    return schema;
  }

  override describe(description: string): VldMeta<TInput, TOutput> {
    return this.meta({ description });
  }
}

/**
 * Readonly validator - marks output as readonly
 */
export class VldReadonly<TInput, TOutput> extends VldBase<TInput, Readonly<TOutput>> {
  constructor(private readonly baseValidator: VldBase<TInput, TOutput>) {
    super(VLD_VALIDATOR_TYPES.READONLY);
  }

  parse(value: unknown): Readonly<TOutput> {
    return this.baseValidator.parse(value);
  }

  safeParse(value: unknown): ParseResult<Readonly<TOutput>> {
    const result = this.baseValidator.safeParse(value);
    if (result.success) {
      return { success: true, data: result.data as Readonly<TOutput> };
    }
    return { success: false, error: result.error };
  }
}

/**
 * Brand validator - adds a unique brand to the output type for nominal typing
 * Uses TypeScript's branded types pattern to prevent accidental assignment
 */
export class VldBrand<TInput, TOutput, TBrand extends string> extends VldBase<
  TInput,
  TOutput & { readonly __brand: TBrand }
> {
  constructor(
    private readonly baseValidator: VldBase<TInput, TOutput>
  ) {
    super(VLD_VALIDATOR_TYPES.BRAND);
  }

  parse(value: unknown): TOutput & { readonly __brand: TBrand } {
    return this.baseValidator.parse(value) as TOutput & {
      readonly __brand: TBrand;
    };
  }

  safeParse(value: unknown): ParseResult<TOutput & { readonly __brand: TBrand }> {
    const result = this.baseValidator.safeParse(value);
    if (result.success) {
      return {
        success: true,
        data: result.data as TOutput & { readonly __brand: TBrand }
      };
    }
    return { success: false, error: result.error };
  }
}

/**
 * Refine validator - adds custom validation
 */
export class VldRefine<TInput, TBase, TOutput extends TBase = TBase> extends VldBase<TInput, TOutput> {
  constructor(
    private readonly baseValidator: VldBase<TInput, TBase>,
    private readonly predicate: (value: TBase) => boolean | Promise<boolean>,
    private readonly customMessage?: string
  ) {
    super(VLD_VALIDATOR_TYPES.REFINE);
  }
  
  parse(value: unknown): TOutput {
    const baseResult = this.baseValidator.parse(value);

    const passed = this.predicate(baseResult);
    if (isPromiseLike(passed)) {
      throw new Error('Use parseAsync for async refinements');
    }

    if (!passed) {
      throw new Error(this.customMessage || 'Refinement check failed');
    }
    
    return baseResult as TOutput;
  }
  
  safeParse(value: unknown): ParseResult<TOutput> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  override async parseAsync(value: unknown): Promise<TOutput> {
    const baseResult = await this.baseValidator.parseAsync(value);
    if (!await this.predicate(baseResult)) {
      throw new Error(this.customMessage || 'Refinement check failed');
    }
    return baseResult as TOutput;
  }
}

/**
 * Transform validator - transforms data after validation
 */
export class VldTransform<TInput, TBase, TOutput> extends VldBase<TInput, TOutput> {
  constructor(
    private readonly baseValidator: VldBase<TInput, TBase>,
    private readonly transformer: (value: TBase) => TOutput | Promise<TOutput>
  ) {
    super(VLD_VALIDATOR_TYPES.TRANSFORM);
  }
  
  parse(value: unknown): TOutput {
    const baseResult = this.baseValidator.parse(value);
    
    try {
      const transformed = this.transformer(baseResult);
      if (isPromiseLike(transformed)) {
        throw new Error('Use parseAsync for async transforms');
      }
      return transformed;
    } catch (error) {
      throw new Error(`Transform failed: ${(error as Error).message}`);
    }
  }
  
  safeParse(value: unknown): ParseResult<TOutput> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  override async parseAsync(value: unknown): Promise<TOutput> {
    const baseResult = await this.baseValidator.parseAsync(value);
    try {
      return await this.transformer(baseResult);
    } catch (error) {
      throw new Error(`Transform failed: ${(error as Error).message}`);
    }
  }
}

/**
 * Default validator - provides default value for undefined
 * Note: Does not validate the default value at construction time.
 * Use .prefault() to validate the default value at parse time.
 */
export class VldDefault<TInput, TOutput> extends VldBase<TInput | undefined, TOutput> {
  constructor(
    private readonly baseValidator: VldBase<TInput, TOutput>,
    private readonly defaultValue: TOutput
  ) {
    super(VLD_VALIDATOR_TYPES.DEFAULT);
  }

  parse(value: unknown): TOutput {
    if (value === undefined) {
      return this.defaultValue;
    }
    return this.baseValidator.parse(value);
  }

  safeParse(value: unknown): ParseResult<TOutput> {
    if (value === undefined) {
      return { success: true, data: this.defaultValue };
    }
    return this.baseValidator.safeParse(value);
  }

  /**
   * Pre-parse default - validates the default value instead of returning it directly
   * This is useful when the default value needs to be validated against the schema
   */
  prefault(): VldPrefault<TInput, TOutput> {
    // Return a new validator that validates the default value when parse(undefined) is called
    return new VldPrefault(this.baseValidator, this.defaultValue);
  }
}

/**
 * Prefault validator - validates the default value instead of returning it directly
 */
export class VldPrefault<TInput, TOutput> extends VldBase<TInput | undefined, TOutput> {
  constructor(
    private readonly baseValidator: VldBase<TInput, TOutput>,
    private readonly defaultValue: TOutput
  ) {
    super(VLD_VALIDATOR_TYPES.PREFAULT);
  }

  parse(value: unknown): TOutput {
    if (value === undefined) {
      // Validate the default value through the base validator
      return this.baseValidator.parse(this.defaultValue as unknown);
    }
    return this.baseValidator.parse(value);
  }

  safeParse(value: unknown): ParseResult<TOutput> {
    if (value === undefined) {
      return this.baseValidator.safeParse(this.defaultValue as unknown);
    }
    return this.baseValidator.safeParse(value);
  }

  /**
   * Calling prefault multiple times should be safe - return self
   */
  prefault(): VldPrefault<TInput, TOutput> {
    return this;
  }
}

/**
 * Catch validator - provides fallback value on validation error
 * BUG-NPM-003 FIX: Validate fallback value at construction time
 */
export class VldCatch<TInput, TOutput> extends VldBase<TInput, TOutput> {
  private readonly simpleMode: SimpleWrappedMode;

  constructor(
    private readonly baseValidator: VldBase<TInput, TOutput>,
    private readonly fallbackValue: TOutput
  ) {
    super(VLD_VALIDATOR_TYPES.CATCH);
    this.simpleMode = getSimpleWrappedMode(baseValidator as unknown as VldBase<unknown, unknown>);
    // BUG-NPM-003 FIX: Validate the fallback value to ensure type safety
    const validation = baseValidator.safeParse(fallbackValue);
    if (!validation.success) {
      throw new Error(`Invalid fallback value: ${validation.error.message}`);
    }
  }
  
  parse(value: unknown): TOutput {
    const simpleValue = parseSimpleWrappedValue<TOutput>(this.simpleMode, value);
    if (simpleValue !== undefined) {
      return simpleValue;
    }
    if (this.simpleMode !== undefined) {
      return this.fallbackValue;
    }

    try {
      return this.baseValidator.parse(value);
    } catch {
      return this.fallbackValue;
    }
  }
  
  safeParse(value: unknown): ParseResult<TOutput> {
    const simpleValue = parseSimpleWrappedValue<TOutput>(this.simpleMode, value);
    if (simpleValue !== undefined) {
      return { success: true, data: simpleValue };
    }
    if (this.simpleMode !== undefined) {
      return { success: true, data: this.fallbackValue };
    }

    const result = this.baseValidator.safeParse(value);
    if (result.success) {
      return result;
    }
    return { success: true, data: this.fallbackValue };
  }
}

/**
 * Optional validator - allows undefined
 */
export class VldOptional<TInput, TOutput> extends VldBase<TInput | undefined, TOutput | undefined> {
  private readonly simpleMode: SimpleWrappedMode;

  constructor(private readonly baseValidator: VldBase<TInput, TOutput>) {
    super(VLD_VALIDATOR_TYPES.OPTIONAL);
    this.simpleMode = getSimpleWrappedMode(baseValidator as unknown as VldBase<unknown, unknown>);
  }

  private parseSimpleValue(value: unknown): TOutput | undefined {
    return parseSimpleWrappedValue(this.simpleMode, value);
  }

  static create<TInput, TOutput>(baseValidator: VldBase<TInput, TOutput>): VldOptional<TInput, TOutput> {
    return new VldOptional(baseValidator);
  }

  parse(value: unknown): TOutput | undefined {
    if (value === undefined) {
      return undefined;
    }
    const simpleValue = this.parseSimpleValue(value);
    if (simpleValue !== undefined) {
      return simpleValue;
    }
    return this.baseValidator.parse(value);
  }

  safeParse(value: unknown): ParseResult<TOutput | undefined> {
    if (value === undefined) {
      return { success: true, data: undefined };
    }
    const simpleValue = this.parseSimpleValue(value);
    if (simpleValue !== undefined) {
      return { success: true, data: simpleValue };
    }
    return this.baseValidator.safeParse(value);
  }

  unwrap(): VldBase<TInput, TOutput> {
    return this.baseValidator;
  }
}

/**
 * Exact optional validator - allows undefined but requires key presence
 * Unlike Optional which treats missing as undefined, ExactOptional
 * requires the key to be present (not missing from object) but allows undefined
 * Zod 4 API parity
 */
export class VldExactOptional<TInput, TOutput> extends VldBase<TInput | undefined, TOutput | undefined> {
  private readonly simpleMode: SimpleWrappedMode;

  constructor(private readonly baseValidator: VldBase<TInput, TOutput>) {
    super(VLD_VALIDATOR_TYPES.EXACT_OPTIONAL);
    this.simpleMode = getSimpleWrappedMode(baseValidator as unknown as VldBase<unknown, unknown>);
  }

  static create<TInput, TOutput>(baseValidator: VldBase<TInput, TOutput>): VldExactOptional<TInput, TOutput> {
    return new VldExactOptional(baseValidator);
  }

  parse(value: unknown): TOutput | undefined {
    if (value === undefined) {
      return undefined;
    }
    const simpleValue = parseSimpleWrappedValue<TOutput>(this.simpleMode, value);
    if (simpleValue !== undefined) {
      return simpleValue;
    }
    return this.baseValidator.parse(value);
  }

  safeParse(value: unknown): ParseResult<TOutput | undefined> {
    // Unlike regular optional, undefined is explicitly valid
    // but we still validate through the base validator
    if (value === undefined) {
      return { success: true, data: undefined };
    }
    const simpleValue = parseSimpleWrappedValue<TOutput>(this.simpleMode, value);
    if (simpleValue !== undefined) {
      return { success: true, data: simpleValue };
    }
    return this.baseValidator.safeParse(value);
  }

  unwrap(): VldBase<TInput, TOutput> {
    return this.baseValidator;
  }
}

/**
 * Nullable validator - allows null
 */
export class VldNullable<TInput, TOutput> extends VldBase<TInput | null, TOutput | null> {
  private readonly simpleMode: SimpleWrappedMode;

  constructor(private readonly baseValidator: VldBase<TInput, TOutput>) {
    super(VLD_VALIDATOR_TYPES.NULLABLE);
    this.simpleMode = getSimpleWrappedMode(baseValidator as unknown as VldBase<unknown, unknown>);
  }

  static create<TInput, TOutput>(baseValidator: VldBase<TInput, TOutput>): VldNullable<TInput, TOutput> {
    return new VldNullable(baseValidator);
  }

  parse(value: unknown): TOutput | null {
    if (value === null) {
      return null;
    }
    const simpleValue = parseSimpleWrappedValue<TOutput>(this.simpleMode, value);
    if (simpleValue !== undefined) {
      return simpleValue;
    }
    return this.baseValidator.parse(value);
  }

  safeParse(value: unknown): ParseResult<TOutput | null> {
    if (value === null) {
      return { success: true, data: null };
    }
    const simpleValue = parseSimpleWrappedValue<TOutput>(this.simpleMode, value);
    if (simpleValue !== undefined) {
      return { success: true, data: simpleValue };
    }
    return this.baseValidator.safeParse(value);
  }

  unwrap(): VldBase<TInput, TOutput> {
    return this.baseValidator;
  }
}

/**
 * Nullish validator - allows null or undefined
 */
export class VldNullish<TInput, TOutput> extends VldBase<TInput | null | undefined, TOutput | null | undefined> {
  private readonly simpleMode: SimpleWrappedMode;

  constructor(private readonly baseValidator: VldBase<TInput, TOutput>) {
    super(VLD_VALIDATOR_TYPES.NULLISH);
    this.simpleMode = getSimpleWrappedMode(baseValidator as unknown as VldBase<unknown, unknown>);
  }

  static create<TInput, TOutput>(baseValidator: VldBase<TInput, TOutput>): VldNullish<TInput, TOutput> {
    return new VldNullish(baseValidator);
  }

  parse(value: unknown): TOutput | null | undefined {
    if (value === null || value === undefined) {
      return value as null | undefined;
    }
    const simpleValue = parseSimpleWrappedValue<TOutput>(this.simpleMode, value);
    if (simpleValue !== undefined) {
      return simpleValue;
    }
    return this.baseValidator.parse(value);
  }

  safeParse(value: unknown): ParseResult<TOutput | null | undefined> {
    if (value === null || value === undefined) {
      return { success: true, data: value as null | undefined };
    }
    const simpleValue = parseSimpleWrappedValue<TOutput>(this.simpleMode, value);
    if (simpleValue !== undefined) {
      return { success: true, data: simpleValue };
    }
    return this.baseValidator.safeParse(value);
  }

  unwrap(): VldBase<TInput, TOutput> {
    return this.baseValidator;
  }
}

/**
 * Pipe validator - chains validators, passing output of one to the next
 */
export class VldPipe<TInput, TIntermediate, TOutput> extends VldBase<TInput, TOutput> {
  constructor(
    private readonly first: VldBase<TInput, TIntermediate>,
    private readonly second: VldBase<TIntermediate, TOutput>
  ) {
    super(VLD_VALIDATOR_TYPES.PIPE);
  }

  parse(value: unknown): TOutput {
    const intermediateResult = this.first.parse(value);
    return this.second.parse(intermediateResult);
  }

  safeParse(value: unknown): ParseResult<TOutput> {
    const firstResult = this.first.safeParse(value);
    if (!firstResult.success) {
      return { success: false, error: firstResult.error };
    }
    return this.second.safeParse(firstResult.data);
  }
}

/**
 * SuperRefine validator - advanced refinement with context
 */
export class VldSuperRefine<TInput, TOutput> extends VldBase<TInput, TOutput> {
  constructor(
    private readonly _inner: VldBase<TInput, TOutput>,
    private readonly _refinement: (value: TOutput, ctx: SuperRefineContext) => void | Promise<void>
  ) {
    super(VLD_VALIDATOR_TYPES.SUPER_REFINE);
  }

  parse(value: unknown): TOutput {
    const result = this._inner.parse(value);

    const issues: { message: string; code?: string }[] = [];
    const ctx: SuperRefineContext = {
      addIssue: (issue) => issues.push(issue),
      path: []
    };

    const maybePromise = this._refinement(result, ctx);
    if (maybePromise instanceof Promise) {
      throw new Error('Use parseAsync for async refinements');
    }

    if (issues.length > 0) {
      throw new Error(issues.map(i => i.message).join('; '));
    }

    return result;
  }

  safeParse(value: unknown): ParseResult<TOutput> {
    const result = this._inner.safeParse(value);
    if (!result.success) return { success: false, error: result.error };

    const issues: { message: string; code?: string }[] = [];
    const ctx: SuperRefineContext = {
      addIssue: (issue) => issues.push(issue),
      path: []
    };

    const maybePromise = this._refinement(result.data, ctx);
    if (maybePromise instanceof Promise) {
      throw new Error('Use safeParseAsync for async refinements');
    }

    if (issues.length > 0) {
      return {
        success: false,
        error: new Error(issues.map(i => i.message).join('; '))
      };
    }

    return result;
  }

  override async parseAsync(value: unknown): Promise<TOutput> {
    const result = await this._inner.parseAsync(value);

    const issues: { message: string; code?: string }[] = [];
    const ctx: SuperRefineContext = {
      addIssue: (issue) => issues.push(issue),
      path: []
    };

    await this._refinement(result, ctx);

    if (issues.length > 0) {
      throw new Error(issues.map(i => i.message).join('; '));
    }

    return result;
  }

  override async safeParseAsync(value: unknown): Promise<ParseResult<TOutput>> {
    try {
      return { success: true, data: await this.parseAsync(value) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}

/**
 * Preprocess validator - transforms input before validation
 */
export class VldPreprocess<TInput, TOutput> extends VldBase<unknown, TOutput> {
  constructor(
    private readonly _preprocessor: (input: unknown) => unknown,
    private readonly _schema: VldBase<TInput, TOutput>
  ) {
    super(VLD_VALIDATOR_TYPES.PREPROCESS);
  }

  static create<TInput, TOutput>(
    preprocessor: (input: unknown) => unknown,
    schema: VldBase<TInput, TOutput>
  ): VldPreprocess<TInput, TOutput> {
    return new VldPreprocess(preprocessor, schema);
  }

  parse(value: unknown): TOutput {
    const preprocessed = this._preprocessor(value);
    return this._schema.parse(preprocessed);
  }

  safeParse(value: unknown): ParseResult<TOutput> {
    try {
      const preprocessed = this._preprocessor(value);
      return this._schema.safeParse(preprocessed);
    } catch (error) {
      return {
        success: false,
        error: error as Error
      };
    }
  }
}
