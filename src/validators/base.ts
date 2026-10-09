import { globalRegistry } from '../registry';
import type { SchemaRegistry } from '../registry';
import { VldError, type VldIssue } from '../errors-core';

/**
 * Base result type for validation
 */
export type ParseResult<T> =
  | { readonly success: true; readonly data: T; readonly error?: undefined }
  | { readonly success: false; readonly error: VldError; readonly data?: undefined };

export type SafeParseSuccess<T> = { readonly success: true; readonly data: T; readonly error?: undefined };
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type SafeParseError<_T = unknown> = { readonly success: false; readonly error: VldError; readonly data?: undefined };
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type SafeParseReturnType<_Input, Output> = SafeParseSuccess<Output> | SafeParseError<_Input>;

export function ensureVldError(error: unknown): VldError {
  if (error instanceof VldError) {
    return error;
  }
  const message = error instanceof Error ? error.message : String(error);
  return new VldError([{ code: 'custom', path: [], message }]);
}

/**
 * Shared invalid sentinel of the AOT compiler (src/compile.ts). Resolved
 * through the symbol registry so base.ts never imports compile.ts - that
 * cycle would break the CJS build.
 */
const COMPILE_INVALID_SYMBOL = Symbol.for('@oxog/vld/compile-invalid');

type LazyValidateCompiler = (schema: VldBase<any, any>) => ((input: unknown) => unknown) | null;

/**
 * Read the AOT compiler installed by src/compile.ts through the global
 * registry (see compile.ts for why this is not a direct import).
 */
function getLazyValidateCompiler(): LazyValidateCompiler | undefined {
  return (globalThis as unknown as Record<string, unknown> | undefined)?.[
    '@oxog/vld/lazy-validate-compiler'
  ] as LazyValidateCompiler | undefined;
}

/**
 * Build and memoize the compiled validator used by `.validate()` fast path.
 * Returns `null` (also memoized) when the schema cannot be lowered or when
 * `new Function` is unavailable (CSP) - callers then use the runtime parser.
 */
function buildLazyValidator(self: VldBase<any, any>): ((input: unknown) => unknown) | null {
  let fast: ((input: unknown) => unknown) | null = null;
  try {
    const compiler = getLazyValidateCompiler();
    const compiled = compiler ? compiler(self) : null;
    fast = compiled ?? null;
  } catch {
    fast = null;
  }
  Object.defineProperty(self, '__vldValidateFn', {
    value: fast,
    enumerable: false,
    configurable: true,
  });
  return fast;
}

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
 * Context for superRefine - allows adding multiple issues with path and code
 */
export interface SuperRefineContext {
  addIssue(issue: string | { message?: string; code?: string; path?: (string | number)[]; fatal?: boolean; [key: string]: any }): void;
  path: (string | number)[];
  /** The value being refined / transformed (Zod's `ctx.value`). */
  value?: unknown;
}

/**
 * Build the ctx handed to superRefine / transform / preprocess callbacks.
 * Accepts a bare message string and keeps extra issue fields (minimum,
 * origin, params, ...) as Zod does.
 * @internal
 */
export function createIssueContext(value: unknown): { ctx: SuperRefineContext; issues: VldIssue[] } {
  const issues: VldIssue[] = [];
  const ctx: SuperRefineContext = {
    addIssue: (issue) => {
      if (typeof issue === 'string') {
        issues.push({ code: 'custom', path: [], message: issue });
        return;
      }
      const extra: Record<string, unknown> = { ...issue };
      delete extra['fatal'];
      delete extra['input'];
      const stored = {
        ...extra,
        code: (issue.code as any) || 'custom',
        path: issue.path ? [...issue.path] : [],
        message: issue.message || 'Validation error'
      } as VldIssue;
      // Zod: a fatal issue stops every check that would run after it.
      if (issue.fatal === true) ABORTED_ISSUES.add(stored);
      issues.push(stored);
    },
    path: [],
    value
  };
  return { ctx, issues };
}

export interface CheckPayload<T> {
  value: T;
  issues: Array<{ message?: string; code?: string; path?: (string | number)[] }>;
  aborted?: boolean;
}

export type VldCheck<T> =
  | ((payload: CheckPayload<T>) => void | Promise<void>)
  | { _zod?: { check?: (payload: CheckPayload<T>) => void | Promise<void> } };

export type CustomErrorParams = {
  message?: string;
  path?: (string | number)[];
  params?: { [k: string]: any };
  fatal?: boolean;
};

export type ErrorMap = (issue: { code?: string; input?: unknown; path?: (string | number)[] }) => string | undefined;
export type ErrorParam =
  | string
  | CustomErrorParams
  | ((value: any) => CustomErrorParams | string)
  | { error?: string | ErrorMap; message?: string };

const FATAL_ISSUE_CODES = new Set(['invalid_type', 'invalid_union', 'invalid_key', 'invalid_element', 'unrecognized_keys', 'invalid_object', 'invalid_array', 'invalid_date']);
const CONTINUABLE_BASE_TYPES = new Set<string>(['string', 'number', 'bigint', 'boolean', 'date']);

/**
 * Zod keeps running refinements after non-fatal check failures (min, another
 * refine): the value had the right type, so the next check can still judge it.
 * Only for refine chains over a primitive without transforms, where the input
 * is exactly the value the refinement would have received. @internal
 */
export function canContinueAfter(schema: VldBase<any, any>, error: VldError): boolean {
  if (error.issues.length === 0 || error.issues.some(issue => FATAL_ISSUE_CODES.has(issue.code) || ABORTED_ISSUES.has(issue) || /Use (?:safeParseAsync|parseAsync) for async/.test(issue.message))) {
    return false;
  }
  let node: any = schema;
  while (node instanceof VldRefine || node instanceof VldSuperRefine) {
    node = node instanceof VldRefine ? node.baseValidator : node._inner;
  }
  return CONTINUABLE_BASE_TYPES.has(node?.validatorType) && !(node?._transforms?.length);
}

/** Issues of a refinement created with `abort: true` (Zod) or `fatal: true`: nothing after them runs. */
const ABORTED_ISSUES = new WeakSet<VldIssue>();

/** True when a failure only means "this schema needs parseAsync" (async refine / transform). @internal */
export function isAsyncRequiredError(error: VldError): boolean {
  return error.issues.some(issue => /Use (?:safeParseAsync|parseAsync) for async/.test(issue.message));
}

/** safeEncode() for wrappers that override encode(). @internal */
export function safeEncodeVia(schema: { encode(value: any): any }, value: unknown): ParseResult<any> {
  try {
    return { success: true, data: schema.encode(value) };
  } catch (error) {
    return { success: false, error: ensureVldError(error) };
  }
}

/** safeEncodeAsync() for wrappers that override encodeAsync(). @internal */
export async function safeEncodeAsyncVia(schema: { encodeAsync(value: any): Promise<any> }, value: unknown): Promise<ParseResult<any>> {
  try {
    return { success: true, data: await schema.encodeAsync(value) };
  } catch (error) {
    return { success: false, error: ensureVldError(error) };
  }
}

export function resolveErrorMessage(error: ErrorParam | undefined, fallback: string): string {
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'function') {
    const res = error(undefined);
    if (typeof res === 'string') return res;
    if (typeof res === 'object' && res?.message) return res.message;
    return fallback;
  }
  if (typeof error === 'object' && error !== null) {
    if (typeof (error as any).error === 'string') return (error as any).error;
    if (typeof (error as any).error === 'function') return (error as any).error({}) || fallback;
    if (typeof (error as any).message === 'string') return (error as any).message;
  }
  return fallback;
}

export function isPromiseLike<T = unknown>(value: unknown): value is PromiseLike<T> {
  return value !== null &&
    (typeof value === 'object' || typeof value === 'function') &&
    typeof (value as { then?: unknown }).then === 'function';
}

function shallowClone<T>(value: T): T {
  if (Array.isArray(value)) {
    return [...value] as T;
  }
  if (value instanceof Map) {
    return new Map(value) as T;
  }
  if (value instanceof Set) {
    return new Set(value) as T;
  }
  if (value !== null && typeof value === 'object') {
    const prototype = Object.getPrototypeOf(value);
    if (prototype === Object.prototype || prototype === null) {
      return { ...value } as T;
    }
  }
  return value;
}

type ValueOrFactory<T> = T | (() => T);

interface SchemaCompositionFactories {
  array<TInput, TOutput>(schema: VldBase<TInput, TOutput>): VldBase<unknown[], TOutput[]>;
  union<TInput, TOutput, TNext>(
    left: VldBase<TInput, TOutput>,
    right: VldBase<any, TNext>
  ): VldBase<unknown, TOutput | TNext>;
  intersection<TInput, TOutput, TNext>(
    left: VldBase<TInput, TOutput>,
    right: VldBase<any, TNext>
  ): VldBase<unknown, TOutput & TNext>;
  toJSONSchema(schema: VldBase<any, any>, options?: unknown): unknown;
}

let schemaCompositionFactories: SchemaCompositionFactories;

export function configureSchemaCompositionFactories(factories: SchemaCompositionFactories): void {
  schemaCompositionFactories = factories;
}

function resolveValue<T>(value: ValueOrFactory<T>): T {
  return typeof value === 'function'
    ? (value as () => T)()
    : shallowClone(value);
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
      return typeof value === 'number' && Number.isFinite(value) ? value as TOutput : undefined;
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

  get type(): string {
    return this.validatorType;
  }

  get _def(): any {
    return {
      typeName: 'Zod' + this.validatorType.charAt(0).toUpperCase() + this.validatorType.slice(1),
      ...((this as any).config || {})
    };
  }

  get def(): any {
    return this._def;
  }

  get _zod(): any {
    return this._def;
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
        // Full issue objects (code/path/expected/message), matching Zod's
        // Standard Schema surface - consumers may read more than `.message`.
        return { issues: result.error.issues };
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
      return { success: false, error: ensureVldError(error) };
    }
  }

  /** Strongly typed forward parse aliases from the Zod 4 codec API. */
  decode(value: TInput): TOutput {
    return this.parse(value);
  }

  safeDecode(value: TInput): ParseResult<TOutput> {
    return this.safeParse(value);
  }

  async decodeAsync(value: TInput): Promise<TOutput> {
    return this.parseAsync(value);
  }

  async safeDecodeAsync(value: TInput): Promise<ParseResult<TOutput>> {
    return this.safeParseAsync(value);
  }

  /**
   * Backward parse aliases. Primitive and validation-only schemas are
   * bidirectional; codecs override these methods with their inverse transform.
   */
  encode(value: TOutput): TInput {
    return this.parse(value) as unknown as TInput;
  }

  safeEncode(value: TOutput): ParseResult<TInput> {
    const result = this.safeParse(value);
    return result.success
      ? { success: true, data: result.data as unknown as TInput }
      : result;
  }

  async encodeAsync(value: TOutput): Promise<TInput> {
    return this.parseAsync(value) as unknown as Promise<TInput>;
  }

  async safeEncodeAsync(value: TOutput): Promise<ParseResult<TInput>> {
    const result = await this.safeParseAsync(value);
    return result.success
      ? { success: true, data: result.data as unknown as TInput }
      : result;
  }

  /** Zod's short alias for safeParseAsync. */
  spa(value: unknown): Promise<ParseResult<TOutput>> {
    return this.safeParseAsync(value);
  }

  /**
   * Zod 4.6 boolean validation. Returns `true` when the value is valid,
   * `false` otherwise, without allocating a result object or an error.
   * Short-circuits on the first failed check.
   *
   * Fast-path ladder (mirrors Zod 4.6):
   *  1. an explicitly compiled validator (z.compile / z.withParser),
   *  2. a lazily AOT-compiled validator, memoized on first call
   *     (skipped in CSP environments where `new Function` is blocked),
   *  3. the runtime safeParse, bound once so the call site stays stable.
   *
   * The hot path is a single memoized property read - never the `_zod`
   * getter, which allocates. Schemas whose validation is asynchronous
   * (z.promise) throw, matching Zod's $ZodAsyncError behavior; use
   * validateAsync for those.
   */
  validate(data: unknown): data is TInput {
    const memo = (this as any).__vldValidateFn;
    if (memo !== undefined) {
      if (memo !== null) {
        return memo(data) !== COMPILE_INVALID_SYMBOL;
      }
      return this.validateWithRuntimeParser(data);
    }
    return this.initValidate(data);
  }

  /**
   * Runtime fallback shared by the cold and hot paths. The bound safeParse
   * is memoized per schema so the call site stays stable for V8.
   */
  private validateWithRuntimeParser(data: unknown): boolean {
    let safe = (this as any).__vldSafeFn;
    if (safe === undefined) {
      safe = (this as any).__vldSafeFn = this.safeParse.bind(this);
    }
    return Boolean(safe(data).success);
  }

  /**
   * Cold path of `.validate()`: resolve the fastest validator available
   * (explicitly compiled, else lazily compiled), memoize it, and run it.
   */
  private initValidate(data: unknown): boolean {
    const self = this as any;
    const bag = self._zod?.bag;
    const compiled = bag?.validatorValidate ?? bag?.validator;
    if (compiled !== undefined) {
      Object.defineProperty(self, '__vldValidateFn', {
        value: compiled,
        enumerable: false,
        configurable: true,
      });
      return compiled(data) !== COMPILE_INVALID_SYMBOL;
    }
    const fast = buildLazyValidator(self);
    if (fast !== null) {
      return fast(data) !== COMPILE_INVALID_SYMBOL;
    }
    return this.validateWithRuntimeParser(data);
  }

  /** Zod 4.6 async boolean validation. */
  async validateAsync(data: unknown): Promise<boolean> {
    const memo = (this as any).__vldValidateFn;
    if (memo !== undefined && memo !== null) {
      return memo(data) !== COMPILE_INVALID_SYMBOL;
    }
    if (memo === undefined) {
      this.initValidate(data);
      const memoized = (this as any).__vldValidateFn;
      if (memoized !== undefined && memoized !== null) {
        return memoized(data) !== COMPILE_INVALID_SYMBOL;
      }
    }
    const result = await this.safeParseAsync(data);
    return result.success;
  }

  /** Compatibility helpers retained by Zod 4. */
  isOptional(): boolean {
    return this.safeParse(undefined).success;
  }

  isNullable(): boolean {
    return this.safeParse(null).success;
  }

  /** VLD validators are immutable, so cloning can safely share the instance. */
  clone(): this {
    return this;
  }
  
  /**
   * Check if a value is valid according to this validator
   * @param value The value to check
   * @returns True if valid, false otherwise
   */
  isValid(value: unknown): boolean {
    return this.validate(value);
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
    message?: ErrorParam | CustomErrorParams | ((val: TOutput) => CustomErrorParams | string)
  ): VldRefine<TInput, TOutput, TRefined>;
  refine(
    predicate: (value: TOutput) => boolean | Promise<boolean>,
    message?: ErrorParam | CustomErrorParams | ((val: TOutput) => CustomErrorParams | string)
  ): VldRefine<TInput, TOutput, TOutput>;
  refine(
    predicate: (value: TOutput) => boolean | Promise<boolean>,
    message?: ErrorParam | CustomErrorParams | ((val: TOutput) => CustomErrorParams | string)
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
    transformer: (value: TOutput, ctx: SuperRefineContext) => TTransformed | Promise<TTransformed>
): VldTransform<TInput, TOutput, TTransformed> {
    return new VldTransform(this, transformer);
  }
  
  /**
   * Create a new validator with a default value for undefined inputs
   * @param defaultValue The default value
   * @returns A new validator with default
   */
  default(defaultValue: ValueOrFactory<TOutput>): VldDefault<TInput, TOutput> {
    return new VldDefault(this, defaultValue);
  }

  /** Provide an input value before parsing when the input is undefined. */
  prefault(defaultValue: ValueOrFactory<TInput>): VldPrefault<TInput, TOutput> {
    return new VldPrefault(this, defaultValue);
  }

  nonoptional(message?: ErrorParam): VldRefine<TInput, TOutput, TOutput> {
    return new VldRefine(
      this,
      (value) => value !== undefined,
      resolveErrorMessage(message, 'Expected non-optional value'),
      { code: 'invalid_type', expected: 'nonoptional' }
    );
  }

  array(): VldBase<unknown[], TOutput[]> {
    return schemaCompositionFactories.array(this);
  }

  or<TNext>(option: VldBase<any, TNext>): VldBase<unknown, TOutput | TNext> {
    return schemaCompositionFactories.union(this, option);
  }

  and<TNext>(incoming: VldBase<any, TNext>): VldBase<unknown, TOutput & TNext> {
    return schemaCompositionFactories.intersection(this, incoming);
  }

  overwrite(transformer: (value: TOutput) => TOutput): VldTransform<TInput, TOutput, TOutput> {
    return new VldTransform(this, transformer);
  }

  with(...checks: VldCheck<TOutput>[]): VldSuperRefine<TInput, TOutput> {
    return new VldSuperRefine(this, (value, ctx) => {
      const payload: CheckPayload<TOutput> = { value, issues: [] };
      const pending: Promise<void>[] = [];
      for (const check of checks) {
        const run = typeof check === 'function' ? check : check._zod?.check;
        if (!run) {
          continue;
        }
        const result = run(payload);
        if (isPromiseLike(result)) {
          pending.push(Promise.resolve(result));
        }
      }
      const flush = (): void => {
        // Keep the pushed issue's path and extra fields (minimum, params, ...).
        for (const issue of payload.issues) {
          ctx.addIssue({ ...issue, message: issue.message || 'Custom check failed' });
        }
      };
      if (pending.length > 0) {
        return Promise.all(pending).then(flush);
      }
      flush();
      return undefined;
    });
  }

  toJSONSchema(options?: unknown): unknown {
    return schemaCompositionFactories.toJSONSchema(this, options);
  }
  
  /**
   * Create a new validator that catches errors and returns a fallback
   * @param fallbackValue The fallback value
   * @returns A new validator with catch
   */
  catch(fallbackValue: TOutput | ((ctx: CatchContext) => TOutput)): VldCatch<TInput, TOutput> {
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
  pipe<TNextOutput>(next: VldBase<any, TNextOutput>): VldPipe<TInput, TOutput, TNextOutput> {
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
  apply<TResult>(fn: (schema: this) => TResult): TResult {
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
    message?: ErrorParam | CustomErrorParams | ((val: TOutput) => CustomErrorParams | string)
  ): VldRefine<TInput, TOutput, TRefined>;
  check(
    predicate: (value: TOutput) => boolean | Promise<boolean>,
    message?: ErrorParam | CustomErrorParams | ((val: TOutput) => CustomErrorParams | string)
  ): VldRefine<TInput, TOutput, TOutput>;
  check(
    predicate: (value: TOutput) => boolean | Promise<boolean>,
    message?: ErrorParam | CustomErrorParams | ((val: TOutput) => CustomErrorParams | string)
  ): VldRefine<TInput, TOutput, TOutput> {
    // Zod's .check() also takes check schemas - z.minimum(5), z.minLength(2),
    // z.superRefine(...) - one or several; each validates the output value.
    if ((predicate as unknown) instanceof VldBase) {
      const checks = [predicate, message].filter((c): c is any => c instanceof VldBase) as VldBase<any, any>[];
      return this.superRefine((value, ctx) => {
        for (const checkSchema of checks) {
          const result = checkSchema.safeParse(value);
          if (!result.success) {
            for (const issue of result.error.issues) ctx.addIssue(issue);
          }
        }
      }) as unknown as VldRefine<TInput, TOutput, TOutput>;
    }
    return this.refine(predicate, message);
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
  meta(): SchemaMetadata | undefined;
  meta(data: Partial<SchemaMetadata>): VldMeta<TInput, TOutput>;
  meta(data?: Partial<SchemaMetadata>): SchemaMetadata | undefined | VldMeta<TInput, TOutput> {
    if (data === undefined) {
      return (
        globalRegistry.get(this as unknown as VldBase<unknown, unknown>) ??
        ((this as any).baseValidator?.meta?.()) ??
        ((this as any).schema?.meta?.()) ??
        ((this as any).inner?.meta?.())
      );
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

  get description(): string | undefined {
    return (
      this.meta()?.description ??
      ((this as any).baseValidator?.description) ??
      ((this as any).schema?.description) ??
      ((this as any).inner?.description)
    );
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

  // Async: the inner schema's parseAsync runs (async refinements / transforms).
  override async parseAsync(value: unknown): Promise<TOutput> {
    return this.baseValidator.parseAsync(value) as any;
  }

  // Encode through the wrapper, so a codec inside it runs its encoder.
  override encode(value: any): any {
    return this.baseValidator.encode(value as any);
  }

  override safeEncode(value: any): ParseResult<any> {
    return safeEncodeVia(this, value);
  }

  override async encodeAsync(value: any): Promise<any> {
    return this.baseValidator.encodeAsync(value as any);
  }

  override safeEncodeAsync(value: any): Promise<ParseResult<any>> {
    return safeEncodeAsyncVia(this, value);
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
    // Shallow freeze, as Zod's .readonly(): the type promise holds at runtime.
    return Object.freeze(this.baseValidator.parse(value));
  }

  // Encode through the wrapper, so a codec inside it runs its encoder.
  override encode(value: any): any {
    return this.baseValidator.encode(value as any);
  }

  override safeEncode(value: any): ParseResult<any> {
    return safeEncodeVia(this, value);
  }

  override async encodeAsync(value: any): Promise<any> {
    return this.baseValidator.encodeAsync(value as any);
  }

  override safeEncodeAsync(value: any): Promise<ParseResult<any>> {
    return safeEncodeAsyncVia(this, value);
  }

  safeParse(value: unknown): ParseResult<Readonly<TOutput>> {
    const result = this.baseValidator.safeParse(value);
    if (result.success) {
      return { success: true, data: Object.freeze(result.data) as Readonly<TOutput> };
    }
    return { success: false, error: result.error };
  }

  override async parseAsync(value: unknown): Promise<Readonly<TOutput>> {
    return Object.freeze(await this.baseValidator.parseAsync(value));
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

  // Async: the inner schema's parseAsync runs (async refinements / transforms).
  override async parseAsync(value: unknown): Promise<TOutput & { readonly __brand: TBrand }> {
    return this.baseValidator.parseAsync(value) as any;
  }

  // Encode through the wrapper, so a codec inside it runs its encoder.
  override encode(value: any): any {
    return this.baseValidator.encode(value as any);
  }

  override safeEncode(value: any): ParseResult<any> {
    return safeEncodeVia(this, value);
  }

  override async encodeAsync(value: any): Promise<any> {
    return this.baseValidator.encodeAsync(value as any);
  }

  override safeEncodeAsync(value: any): Promise<ParseResult<any>> {
    return safeEncodeAsyncVia(this, value);
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
 * Chain methods / read-only getters of concrete schemas that describe(),
 * meta() and brand() wrappers re-expose (Zod returns the same schema type
 * there): v.string().describe('id').min(3) keeps the description and adds the
 * check; v.object({...}).describe('x').extend({...}) and .shape keep working.
 */
const WRAPPER_FORWARDED_METHODS = [
  'base64', 'base64url', 'between', 'catchall', 'cidrv4', 'cidrv6', 'cuid', 'cuid2', 'date', 'datetime', 'deepPartial',
  'duration', 'e164', 'email', 'emoji', 'endsWith', 'even', 'exactPartial', 'exclude', 'extend', 'extract', 'finite',
  'float32', 'float64', 'future', 'gt', 'gte', 'guid', 'includes', 'int', 'int32', 'int64', 'ip', 'ipv4', 'ipv6', 'jwt',
  'keyof', 'ksuid', 'length', 'loose', 'lowercase', 'lt', 'lte', 'max', 'merge', 'mime', 'min', 'multipleOf', 'nanoid',
  'negative', 'nonempty', 'nonnegative', 'nonpositive', 'normalize', 'odd', 'omit', 'partial', 'passthrough', 'past',
  'pick', 'positive', 'regex', 'required', 'rest', 'size', 'slugify', 'startsWith', 'step', 'strict', 'strip', 'time',
  'toLowerCase', 'toUpperCase', 'today', 'trim', 'uint32', 'uint64', 'ulid', 'unique', 'uppercase', 'url', 'uuid',
  'uuidv4', 'uuidv6', 'uuidv7', 'weekday', 'weekend', 'xid'
] as const;
const WRAPPER_FORWARDED_GETTERS = [
  'element', 'enum', 'format', 'isFinite', 'isInt', 'itemSchema', 'items', 'keySchema', 'keyType', 'literal', 'maxDate',
  'maxLength', 'maxValue', 'minDate', 'minLength', 'minValue', 'options', 'shape', 'value', 'valueSchema', 'valueType', 'values'
] as const;

function forwardWrappedSchemaApi(cls: { prototype: object }, rewrap: (self: any, next: VldBase<any, any>) => unknown): void {
  const has = (name: string) => name in cls.prototype;
  for (const name of WRAPPER_FORWARDED_METHODS.filter(name => !has(name))) {
    Object.defineProperty(cls.prototype, name, {
      configurable: true,
      writable: true,
      value: function (this: any, ...args: unknown[]) {
        const method = this.baseValidator[name];
        if (typeof method !== 'function') {
          throw new TypeError(`${name} is not a function`);
        }
        const next = method.apply(this.baseValidator, args);
        return next instanceof VldBase ? rewrap(this, next) : next;
      }
    });
  }
  for (const name of WRAPPER_FORWARDED_GETTERS.filter(name => !has(name))) {
    Object.defineProperty(cls.prototype, name, {
      configurable: true,
      get(this: any) {
        return this.baseValidator[name];
      }
    });
  }
}

/**
 * Refine validator - adds custom validation
 */
export class VldRefine<TInput, TBase, TOutput extends TBase = TBase> extends VldBase<TInput, TOutput> {
  private readonly customMessage: ErrorParam | CustomErrorParams | ((val: TBase) => CustomErrorParams | string);
  private readonly refinePath?: (string | number)[];

  constructor(
    readonly baseValidator: VldBase<TInput, TBase>,
    private readonly predicate: (value: TBase) => boolean | Promise<boolean>,
    customMessage?: ErrorParam | CustomErrorParams | ((val: TBase) => CustomErrorParams | string),
    /** Built-in checks expressed as refinements report their own Zod issue (e.g. nonoptional). */
    private readonly issueFields?: Partial<VldIssue>
  ) {
    super(VLD_VALIDATOR_TYPES.REFINE);
    this.customMessage = customMessage ?? 'Refinement check failed';
    if (typeof customMessage === 'object' && customMessage !== null && 'path' in customMessage && Array.isArray(customMessage.path)) {
      this.refinePath = customMessage.path;
    }
  }

  private _createIssue(val: TBase): VldIssue {
    const issue = this._createRefineIssue(val);
    const result = this.issueFields ? { ...issue, ...this.issueFields } : issue;
    const options = this.customMessage as { abort?: unknown; fatal?: unknown } | null;
    if (typeof options === 'object' && options !== null && (options.abort === true || options.fatal === true)) {
      ABORTED_ISSUES.add(result);
    }
    return result;
  }

  /** Zod's `when`: decides from the payload (value + issues so far) whether this check runs. */
  private get _when(): ((payload: { value: unknown; issues: VldIssue[] }) => boolean) | undefined {
    const options = this.customMessage as { when?: unknown } | null;
    return typeof options === 'object' && options !== null && typeof options.when === 'function'
      ? options.when as (payload: { value: unknown; issues: VldIssue[] }) => boolean
      : undefined;
  }

  private _createRefineIssue(val: TBase): VldIssue {
    // Every issue gets its own path array: callers (and outer validators)
    // may mutate issue paths, which must never corrupt this schema.
    if (typeof this.customMessage === 'function') {
      const res = this.customMessage(val);
      if (typeof res === 'string') {
        return { code: 'custom', path: [...(this.refinePath ?? [])], message: res };
      }
      return {
        code: 'custom',
        path: [...(res?.path ?? this.refinePath ?? [])],
        message: res?.message ?? 'Refinement check failed'
      };
    }
    if (typeof this.customMessage === 'object' && this.customMessage !== null) {
      const msg = (this.customMessage as any).message ?? (this.customMessage as any).error;
      const path = [...((this.customMessage as any).path ?? this.refinePath ?? [])];
      // Zod calls an `error` function with the issue context and keeps `params`.
      const fromFn = typeof msg === 'function' ? msg({ code: 'custom', input: val, path }) : undefined;
      const resolvedMsg = typeof msg === 'function'
        ? (typeof fromFn === 'string' ? fromFn : fromFn?.message ?? 'Refinement check failed')
        : (typeof msg === 'string' ? msg : 'Refinement check failed');
      const issue: VldIssue = { code: 'custom', path, message: resolvedMsg };
      const params = (this.customMessage as any).params;
      if (params !== undefined) {
        issue.params = params;
      }
      return issue;
    }
    return {
      code: 'custom',
      path: [...(this.refinePath ?? [])],
      message: typeof this.customMessage === 'string' ? this.customMessage : 'Refinement check failed'
    };
  }

  parse(value: unknown): TOutput {
    let baseResult: TBase;
    try {
      baseResult = this.baseValidator.parse(value);
    } catch (error) {
      throw this.continueAfterBaseFailure(value, error);
    }

    const when = this._when;
    if (when !== undefined && !when({ value: baseResult, issues: [] })) {
      return baseResult as TOutput;
    }

    const passed = this.predicate(baseResult);
    if (isPromiseLike(passed)) {
      throw new Error('Use parseAsync for async refinements');
    }

    if (!passed) {
      throw new VldError([this._createIssue(baseResult)]);
    }

    return baseResult as TOutput;
  }

  /** Failure path: append this refinement's issue when Zod would still run it. */
  private continueAfterBaseFailure(value: unknown, error: unknown): unknown {
    const baseError = ensureVldError(error);
    const when = this._when;
    if (when !== undefined) {
      // An explicit `when` replaces the default "only after non-fatal issues" rule.
      if (isAsyncRequiredError(baseError) || !when({ value, issues: baseError.issues })) return error;
    } else if (!canContinueAfter(this.baseValidator, baseError)) {
      return error;
    }
    let passed: boolean | Promise<boolean>;
    try {
      passed = this.predicate(value as TBase);
    } catch {
      return error;
    }
    if (isPromiseLike(passed) || passed) return error;
    return new VldError([...baseError.issues, this._createIssue(value as TBase)]);
  }
  
  safeParse(value: unknown): ParseResult<TOutput> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: ensureVldError(error) };
    }
  }

  /**
   * Encode direction (Zod's backward pass): the check judges the value being
   * encoded, then the wrapped schema encodes it - so a codec underneath runs
   * its encoder instead of being decoded.
   */
  override encode(value: any): any {
    let encoded: unknown;
    try {
      encoded = this.baseValidator.encode(value);
    } catch (error) {
      throw this.continueAfterBaseFailure(value, error);
    }
    const when = this._when;
    if (when !== undefined && !when({ value, issues: [] })) return encoded;
    const passed = this.predicate(value);
    if (isPromiseLike(passed)) {
      throw new Error('Use encodeAsync for async refinements');
    }
    if (!passed) {
      throw new VldError([this._createIssue(value)]);
    }
    return encoded;
  }

  override safeEncode(value: any): ParseResult<any> {
    return safeEncodeVia(this, value);
  }

  override async encodeAsync(value: any): Promise<any> {
    let encoded: unknown;
    try {
      encoded = await this.baseValidator.encodeAsync(value);
    } catch (error) {
      throw await this.continueAfterBaseFailureAsync(value, error);
    }
    const when = this._when;
    if (when !== undefined && !when({ value, issues: [] })) return encoded;
    if (!await this.predicate(value)) {
      throw new VldError([this._createIssue(value)]);
    }
    return encoded;
  }

  override safeEncodeAsync(value: any): Promise<ParseResult<any>> {
    return safeEncodeAsyncVia(this, value);
  }

  override async parseAsync(value: unknown): Promise<TOutput> {
    let baseResult: TBase;
    try {
      baseResult = await this.baseValidator.parseAsync(value);
    } catch (error) {
      throw await this.continueAfterBaseFailureAsync(value, error);
    }
    const when = this._when;
    if (when !== undefined && !when({ value: baseResult, issues: [] })) {
      return baseResult as TOutput;
    }
    if (!await this.predicate(baseResult)) {
      throw new VldError([this._createIssue(baseResult)]);
    }
    return baseResult as TOutput;
  }

  /** Async twin of continueAfterBaseFailure: parse and parseAsync report the same issues. */
  private async continueAfterBaseFailureAsync(value: unknown, error: unknown): Promise<unknown> {
    const baseError = ensureVldError(error);
    const when = this._when;
    if (when !== undefined) {
      if (!when({ value, issues: baseError.issues })) return error;
    } else if (!canContinueAfter(this.baseValidator, baseError)) {
      return error;
    }
    let passed: boolean;
    try {
      passed = await this.predicate(value as TBase);
    } catch {
      return error;
    }
    if (passed) return error;
    return new VldError([...baseError.issues, this._createIssue(value as TBase)]);
  }

  override async safeParseAsync(value: unknown): Promise<ParseResult<TOutput>> {
    try {
      return { success: true, data: await this.parseAsync(value) };
    } catch (error) {
      return { success: false, error: ensureVldError(error) };
    }
  }

  private _wrap(nextBase: any): any {
    return new VldRefine(nextBase, this.predicate, this.customMessage, this.issueFields);
  }

  // Common constraint methods
  min(length: number | Date | bigint | any, message?: ErrorParam): this {
    return this._wrap((this.baseValidator as any).min?.(length, message) ?? this.baseValidator);
  }
  max(length: number | Date | bigint | any, message?: ErrorParam): this {
    return this._wrap((this.baseValidator as any).max?.(length, message) ?? this.baseValidator);
  }
  length(length: number, message?: ErrorParam): this {
    return this._wrap((this.baseValidator as any).length?.(length, message) ?? this.baseValidator);
  }
  email(message?: ErrorParam): this {
    return this._wrap((this.baseValidator as any).email?.(message) ?? this.baseValidator);
  }
  url(message?: ErrorParam): this {
    return this._wrap((this.baseValidator as any).url?.(message) ?? this.baseValidator);
  }
  uuid(message?: ErrorParam): this {
    return this._wrap((this.baseValidator as any).uuid?.(message) ?? this.baseValidator);
  }
  regex(pattern: RegExp, message?: ErrorParam): this {
    return this._wrap((this.baseValidator as any).regex?.(pattern, message) ?? this.baseValidator);
  }
  startsWith(str: string, message?: ErrorParam): this {
    return this._wrap((this.baseValidator as any).startsWith?.(str, message) ?? this.baseValidator);
  }
  endsWith(str: string, message?: ErrorParam): this {
    return this._wrap((this.baseValidator as any).endsWith?.(str, message) ?? this.baseValidator);
  }
  includes(str: string, message?: ErrorParam): this {
    return this._wrap((this.baseValidator as any).includes?.(str, message) ?? this.baseValidator);
  }
  ip(message?: ErrorParam): this {
    return this._wrap((this.baseValidator as any).ip?.(message) ?? this.baseValidator);
  }
  ipv4(message?: ErrorParam): this {
    return this._wrap((this.baseValidator as any).ipv4?.(message) ?? this.baseValidator);
  }
  ipv6(message?: ErrorParam): this {
    return this._wrap((this.baseValidator as any).ipv6?.(message) ?? this.baseValidator);
  }
  nonempty(message?: ErrorParam): this {
    return this._wrap((this.baseValidator as any).nonempty?.(message) ?? this.baseValidator);
  }
  trim(): this {
    return this._wrap((this.baseValidator as any).trim?.() ?? this.baseValidator);
  }
  toLowerCase(): this {
    return this._wrap((this.baseValidator as any).toLowerCase?.() ?? this.baseValidator);
  }
  lowercase(): this {
    return this.toLowerCase();
  }
  toUpperCase(): this {
    return this._wrap((this.baseValidator as any).toUpperCase?.() ?? this.baseValidator);
  }
  uppercase(): this {
    return this.toUpperCase();
  }

  // Number / BigInt methods
  positive(message?: ErrorParam): this {
    return this._wrap((this.baseValidator as any).positive?.(message) ?? this.baseValidator);
  }
  negative(message?: ErrorParam): this {
    return this._wrap((this.baseValidator as any).negative?.(message) ?? this.baseValidator);
  }
  nonnegative(message?: ErrorParam): this {
    return this._wrap((this.baseValidator as any).nonnegative?.(message) ?? this.baseValidator);
  }
  nonpositive(message?: ErrorParam): this {
    return this._wrap((this.baseValidator as any).nonpositive?.(message) ?? this.baseValidator);
  }
  int(message?: ErrorParam): this {
    return this._wrap((this.baseValidator as any).int?.(message) ?? this.baseValidator);
  }
  finite(message?: ErrorParam): this {
    return this._wrap((this.baseValidator as any).finite?.(message) ?? this.baseValidator);
  }
  safe(message?: ErrorParam): this {
    return this._wrap((this.baseValidator as any).safe?.(message) ?? this.baseValidator);
  }
  multipleOf(value: number, message?: ErrorParam): this {
    return this._wrap((this.baseValidator as any).multipleOf?.(value, message) ?? this.baseValidator);
  }
  step(value: number, message?: ErrorParam): this {
    return this._wrap((this.baseValidator as any).step?.(value, message) ?? this.baseValidator);
  }
  gt(value: any, message?: ErrorParam): this {
    return this._wrap((this.baseValidator as any).gt?.(value, message) ?? this.baseValidator);
  }
  gte(value: any, message?: ErrorParam): this {
    return this._wrap((this.baseValidator as any).gte?.(value, message) ?? this.baseValidator);
  }
  lt(value: any, message?: ErrorParam): this {
    return this._wrap((this.baseValidator as any).lt?.(value, message) ?? this.baseValidator);
  }
  lte(value: any, message?: ErrorParam): this {
    return this._wrap((this.baseValidator as any).lte?.(value, message) ?? this.baseValidator);
  }

  // Object methods
  extend<U extends Record<string, any>>(extension: { [K in keyof U]: VldBase<unknown, U[K]> }): any {
    return this._wrap((this.baseValidator as any).extend?.(extension) ?? this.baseValidator);
  }
  merge(other: any): any {
    return this._wrap((this.baseValidator as any).merge?.(other) ?? this.baseValidator);
  }
  pick<K extends keyof TOutput>(...keys: K[]): any {
    return this._wrap((this.baseValidator as any).pick?.(...keys) ?? this.baseValidator);
  }
  omit<K extends keyof TOutput>(...keys: K[]): any {
    return this._wrap((this.baseValidator as any).omit?.(...keys) ?? this.baseValidator);
  }
  partial(): any {
    return this._wrap((this.baseValidator as any).partial?.() ?? this.baseValidator);
  }
  required(): any {
    return this._wrap((this.baseValidator as any).required?.() ?? this.baseValidator);
  }
  strict(message?: ErrorParam): this {
    return this._wrap((this.baseValidator as any).strict?.(message) ?? this.baseValidator);
  }
  passthrough(): this {
    return this._wrap((this.baseValidator as any).passthrough?.() ?? this.baseValidator);
  }
  strip(): this {
    return this._wrap((this.baseValidator as any).strip?.() ?? this.baseValidator);
  }
  catchall(validator: any): this {
    return this._wrap((this.baseValidator as any).catchall?.(validator) ?? this.baseValidator);
  }
  get shape(): any {
    return (this.baseValidator as any).shape;
  }
  get keyof(): any {
    return (this.baseValidator as any).keyof;
  }

  // Array methods
  unwrap(): any {
    return (this.baseValidator as any).unwrap ? (this.baseValidator as any).unwrap() : this.baseValidator;
  }
  get element(): any {
    return (this.baseValidator as any).element;
  }
}

/**
 * Transform validator - transforms data after validation
 */
export class VldTransform<TInput, TBase, TOutput> extends VldBase<TInput, TOutput> {
  constructor(
    private readonly baseValidator: VldBase<TInput, TBase>,
    private readonly transformer: (value: TBase, ctx: SuperRefineContext) => TOutput | Promise<TOutput>
  ) {
    super(VLD_VALIDATOR_TYPES.TRANSFORM);
  }

  parse(value: unknown): TOutput {
    const baseResult = this.baseValidator.parse(value);
    const { ctx, issues } = createIssueContext(baseResult);
    let transformed: TOutput | Promise<TOutput>;
    try {
      transformed = this.transformer(baseResult, ctx);
      if (isPromiseLike(transformed)) {
        throw new Error('Use parseAsync for async transforms');
      }
    } catch (error) {
      throw new Error(`Transform failed: ${(error as Error).message}`);
    }
    // Issues reported through ctx.addIssue fail the parse (Zod semantics).
    if (issues.length > 0) {
      throw new VldError(issues, issues.map(i => i.message).join('; '));
    }
    return transformed;
  }

  safeParse(value: unknown): ParseResult<TOutput> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: ensureVldError(error) };
    }
  }

  override async parseAsync(value: unknown): Promise<TOutput> {
    const baseResult = await this.baseValidator.parseAsync(value);
    const { ctx, issues } = createIssueContext(baseResult);
    let transformed: TOutput;
    try {
      transformed = await this.transformer(baseResult, ctx);
    } catch (error) {
      throw new Error(`Transform failed: ${(error as Error).message}`);
    }
    if (issues.length > 0) {
      throw new VldError(issues, issues.map(i => i.message).join('; '));
    }
    return transformed;
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
    private readonly defaultValue: ValueOrFactory<TOutput>
  ) {
    super(VLD_VALIDATOR_TYPES.DEFAULT);
  }

  parse(value: unknown): TOutput {
    if (value === undefined) {
      return resolveValue(this.defaultValue);
    }
    return this.baseValidator.parse(value);
  }

  // Async: the inner schema's parseAsync runs (async refinements / transforms).
  override async parseAsync(value: unknown): Promise<TOutput> {
    return value === undefined ? resolveValue(this.defaultValue) : this.baseValidator.parseAsync(value) as any;
  }

  // Encode through the wrapper, so a codec inside it runs its encoder.
  override encode(value: any): any {
    return this.baseValidator.encode(value as any);
  }

  override safeEncode(value: any): ParseResult<any> {
    return safeEncodeVia(this, value);
  }

  override async encodeAsync(value: any): Promise<any> {
    return this.baseValidator.encodeAsync(value as any);
  }

  override safeEncodeAsync(value: any): Promise<ParseResult<any>> {
    return safeEncodeAsyncVia(this, value);
  }

  safeParse(value: unknown): ParseResult<TOutput> {
    if (value === undefined) {
      return { success: true, data: resolveValue(this.defaultValue) };
    }
    return this.baseValidator.safeParse(value);
  }

  /**
   * Pre-parse default - validates the default value instead of returning it directly
   * This is useful when the default value needs to be validated against the schema
   */
  override prefault(defaultValue?: ValueOrFactory<TInput>): VldPrefault<TInput, TOutput> {
    return new VldPrefault(
      this.baseValidator,
      defaultValue === undefined
        ? this.defaultValue as unknown as ValueOrFactory<TInput>
        : defaultValue
    );
  }


  unwrap(): VldBase<TInput, TOutput> {
    return this.baseValidator;
  }

  removeDefault(): VldBase<TInput, TOutput> {
    return this.baseValidator;
  }
}

/**
 * Prefault validator - validates the default value instead of returning it directly
 */
export class VldPrefault<TInput, TOutput> extends VldBase<TInput | undefined, TOutput> {
  constructor(
    private readonly baseValidator: VldBase<TInput, TOutput>,
    private readonly defaultValue: ValueOrFactory<TInput>
  ) {
    super(VLD_VALIDATOR_TYPES.PREFAULT);
  }

  parse(value: unknown): TOutput {
    if (value === undefined) {
      return this.baseValidator.parse(resolveValue(this.defaultValue));
    }
    return this.baseValidator.parse(value);
  }

  // Encode through the wrapper, so a codec inside it runs its encoder.
  override encode(value: any): any {
    return this.baseValidator.encode(value as any);
  }

  override safeEncode(value: any): ParseResult<any> {
    return safeEncodeVia(this, value);
  }

  override async encodeAsync(value: any): Promise<any> {
    return this.baseValidator.encodeAsync(value as any);
  }

  override safeEncodeAsync(value: any): Promise<ParseResult<any>> {
    return safeEncodeAsyncVia(this, value);
  }

  // Async: the inner schema's parseAsync runs (async refinements / transforms).
  override async parseAsync(value: unknown): Promise<TOutput> {
    return this.baseValidator.parseAsync(value === undefined ? resolveValue(this.defaultValue) : value) as any;
  }

  safeParse(value: unknown): ParseResult<TOutput> {
    if (value === undefined) {
      return this.baseValidator.safeParse(resolveValue(this.defaultValue));
    }
    return this.baseValidator.safeParse(value);
  }

  /**
   * Calling prefault multiple times should be safe - return self
   */
  override prefault(defaultValue?: ValueOrFactory<TInput>): VldPrefault<TInput, TOutput> {
    return defaultValue === undefined ? this : new VldPrefault(this.baseValidator, defaultValue);
  }

  unwrap(): VldBase<TInput, TOutput> {
    return this.baseValidator;
  }
}

/**
 * Catch validator - provides fallback value on validation error
 * BUG-NPM-003 FIX: Validate fallback value at construction time
 */
/** Context passed to a `.catch((ctx) => value)` fallback function (Zod's shape). */
export interface CatchContext {
  readonly error: VldError;
  readonly issues: VldIssue[];
  readonly input: unknown;
}

/** Validator types whose output is not an input-domain value. */
const OUTPUT_CHANGING_TYPES = new Set<string>([
  VLD_VALIDATOR_TYPES.TRANSFORM,
  VLD_VALIDATOR_TYPES.PIPE,
  VLD_VALIDATOR_TYPES.PREPROCESS,
  VLD_VALIDATOR_TYPES.CODEC,
  VLD_VALIDATOR_TYPES.STRING_BOOL
]);

/**
 * True when the schema (or any schema nested in it) turns its input into a
 * differently-typed output. A .catch() fallback is an output value, so it
 * cannot be checked by running it through such a schema's input pipeline.
 */
function changesOutputType(node: unknown, seen: Set<unknown> = new Set()): boolean {
  if (node === null || typeof node !== 'object' || seen.has(node)) return false;
  seen.add(node);
  if (node instanceof VldBase && OUTPUT_CHANGING_TYPES.has(node.validatorType)) return true;
  const isContainer = node instanceof VldBase || Array.isArray(node) || Object.getPrototypeOf(node) === Object.prototype;
  return isContainer && Object.values(node).some(child => changesOutputType(child, seen));
}

export class VldCatch<TInput, TOutput> extends VldBase<TInput, TOutput> {
  private readonly simpleMode: SimpleWrappedMode;
  private readonly fallbackFn: ((ctx: CatchContext) => TOutput) | undefined;

  constructor(
    private readonly baseValidator: VldBase<TInput, TOutput>,
    private readonly fallbackValue: TOutput | ((ctx: CatchContext) => TOutput)
  ) {
    super(VLD_VALIDATOR_TYPES.CATCH);
    this.simpleMode = getSimpleWrappedMode(baseValidator as unknown as VldBase<unknown, unknown>);
    // Like Zod, a function fallback is called per failure with the error
    // context - unless the schema itself validates functions.
    this.fallbackFn = typeof fallbackValue === 'function' && baseValidator.validatorType !== VLD_VALIDATOR_TYPES.FUNCTION
      ? fallbackValue as (ctx: CatchContext) => TOutput
      : undefined;
    if (this.fallbackFn === undefined && !changesOutputType(baseValidator)) {
      // BUG-NPM-003 FIX: Validate the fallback value to ensure type safety.
      // A schema with async refinements cannot be checked synchronously; its
      // fallback is accepted as given (it is only used by parseAsync then).
      let validation: ParseResult<TOutput>;
      try {
        validation = baseValidator.safeParse(fallbackValue);
      } catch (error) {
        validation = { success: false, error: ensureVldError(error) };
      }
      if (!validation.success && !isAsyncRequiredError(validation.error)) {
        throw new Error(`Invalid fallback value: ${validation.error.message}`);
      }
    }
  }

  // Encode through the wrapper, so a codec inside it runs its encoder.
  override encode(value: any): any {
    return this.baseValidator.encode(value as any);
  }

  override safeEncode(value: any): ParseResult<any> {
    return safeEncodeVia(this, value);
  }

  override async encodeAsync(value: any): Promise<any> {
    return this.baseValidator.encodeAsync(value as any);
  }

  override safeEncodeAsync(value: any): Promise<ParseResult<any>> {
    return safeEncodeAsyncVia(this, value);
  }

  // Async: the inner schema's parseAsync runs (async refinements / transforms).
  override async parseAsync(value: unknown): Promise<TOutput> {
    const result = await this.baseValidator.safeParseAsync(value);
    return result.success ? result.data : this.fallback(value, result.error);
  }

  private fallback(input: unknown, error?: unknown): TOutput {
    if (this.fallbackFn === undefined) {
      return this.fallbackValue as TOutput;
    }
    const failure = error === undefined
      ? (this.baseValidator.safeParse(input) as { error?: unknown }).error
      : error;
    const vldError = ensureVldError(failure);
    return this.fallbackFn({ error: vldError, issues: vldError.issues, input });
  }

  parse(value: unknown): TOutput {
    const simpleValue = parseSimpleWrappedValue<TOutput>(this.simpleMode, value);
    if (simpleValue !== undefined) {
      return simpleValue;
    }
    if (this.simpleMode !== undefined) {
      return this.fallback(value);
    }

    try {
      return this.baseValidator.parse(value);
    } catch (error) {
      return this.fallback(value, error);
    }
  }

  safeParse(value: unknown): ParseResult<TOutput> {
    const simpleValue = parseSimpleWrappedValue<TOutput>(this.simpleMode, value);
    if (simpleValue !== undefined) {
      return { success: true, data: simpleValue };
    }
    if (this.simpleMode !== undefined) {
      return { success: true, data: this.fallback(value) };
    }

    const result = this.baseValidator.safeParse(value);
    if (result.success) {
      return result;
    }
    return { success: true, data: this.fallback(value, result.error) };
  }
}

/**
 * True when `undefined` reaches a default / prefault through the transparent
 * wrappers around it (Zod's optin propagation), so an enclosing optional()
 * must hand `undefined` to the schema instead of short-circuiting it.
 */
function reachesDefault(schema: unknown): boolean {
  let node: any = schema;
  // Wrappers form an acyclic chain (schemas are immutable); anything that is not a known wrapper ends the walk.
  for (;;) {
    if (node instanceof VldDefault || node instanceof VldPrefault) return true;
    if (node instanceof VldPipe) {
      node = (node as any).first;
    } else if (node instanceof VldSuperRefine) {
      node = node._inner;
    } else if (
      node instanceof VldOptional || node instanceof VldNullable || node instanceof VldNullish ||
      node instanceof VldCatch || node instanceof VldRefine || node instanceof VldTransform ||
      node instanceof VldMeta || node instanceof VldReadonly || node instanceof VldBrand
    ) {
      node = (node as any).baseValidator;
    } else if (node.validatorType === VLD_VALIDATOR_TYPES.UNION && Array.isArray((node as any).validators)) {
      // Zod's union is optional-in when any option is; VldUnion lives in union.ts (which imports this file).
      return ((node as any).validators as unknown[]).some(reachesDefault);
    } else {
      return false;
    }
  }
}

/**
 * Zod's optional: when the input is `undefined` and the wrapped schema reports
 * issues for it, the issues are dropped and the value is simply `undefined`.
 * A failure that only means "use parseAsync" is kept.
 */
function settleUndefined<T>(result: ParseResult<T>): ParseResult<T | undefined> {
  if (result.success || isAsyncRequiredError(result.error)) return result;
  return { success: true, data: undefined };
}

/**
 * Optional validator - allows undefined
 */
export class VldOptional<TInput, TOutput> extends VldBase<TInput | undefined, TOutput | undefined> {
  private readonly simpleMode: SimpleWrappedMode;
  // Zod runs an inner default for `undefined` (`.default(x).optional()` yields x).
  private readonly defaultInside: boolean;

  constructor(private readonly baseValidator: VldBase<TInput, TOutput>) {
    super(VLD_VALIDATOR_TYPES.OPTIONAL);
    this.simpleMode = getSimpleWrappedMode(baseValidator as unknown as VldBase<unknown, unknown>);
    this.defaultInside = reachesDefault(baseValidator);
  }

  // Async: the inner schema's parseAsync runs (async refinements / transforms).
  override async parseAsync(value: unknown): Promise<TOutput | undefined> {
    if (value === undefined) {
      if (!this.defaultInside) return undefined;
      const result = await this.baseValidator.safeParseAsync(value);
      return result.success ? result.data : undefined;
    }
    return this.baseValidator.parseAsync(value) as any;
  }

  // Encode through the wrapper, so a codec inside it runs its encoder.
  override encode(value: any): any {
    return value === undefined ? undefined : this.baseValidator.encode(value as any);
  }

  override safeEncode(value: any): ParseResult<any> {
    return safeEncodeVia(this, value);
  }

  override async encodeAsync(value: any): Promise<any> {
    return value === undefined ? undefined : this.baseValidator.encodeAsync(value as any);
  }

  override safeEncodeAsync(value: any): Promise<ParseResult<any>> {
    return safeEncodeAsyncVia(this, value);
  }

  private parseSimpleValue(value: unknown): TOutput | undefined {
    return parseSimpleWrappedValue(this.simpleMode, value);
  }

  static create<TInput, TOutput>(baseValidator: VldBase<TInput, TOutput>): VldOptional<TInput, TOutput> {
    return new VldOptional(baseValidator);
  }

  parse(value: unknown): TOutput | undefined {
    if (value === undefined) {
      if (!this.defaultInside) return undefined;
      const settled = settleUndefined(this.baseValidator.safeParse(value));
      if (!settled.success) throw settled.error;
      return settled.data;
    }
    const simpleValue = this.parseSimpleValue(value);
    if (simpleValue !== undefined) {
      return simpleValue;
    }
    return this.baseValidator.parse(value);
  }

  safeParse(value: unknown): ParseResult<TOutput | undefined> {
    if (value === undefined) {
      return this.defaultInside ? settleUndefined(this.baseValidator.safeParse(value)) : { success: true, data: undefined };
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

  // Async: the inner schema's parseAsync runs (async refinements / transforms).
  override async parseAsync(value: unknown): Promise<TOutput | undefined> {
    return value === undefined ? undefined : this.baseValidator.parseAsync(value) as any;
  }

  // Encode through the wrapper, so a codec inside it runs its encoder.
  override encode(value: any): any {
    return value === undefined ? undefined : this.baseValidator.encode(value as any);
  }

  override safeEncode(value: any): ParseResult<any> {
    return safeEncodeVia(this, value);
  }

  override async encodeAsync(value: any): Promise<any> {
    return value === undefined ? undefined : this.baseValidator.encodeAsync(value as any);
  }

  override safeEncodeAsync(value: any): Promise<ParseResult<any>> {
    return safeEncodeAsyncVia(this, value);
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

  // Async: the inner schema's parseAsync runs (async refinements / transforms).
  override async parseAsync(value: unknown): Promise<TOutput | null> {
    return value === null ? null : this.baseValidator.parseAsync(value) as any;
  }

  // Encode through the wrapper, so a codec inside it runs its encoder.
  override encode(value: any): any {
    return value === null ? null : this.baseValidator.encode(value as any);
  }

  override safeEncode(value: any): ParseResult<any> {
    return safeEncodeVia(this, value);
  }

  override async encodeAsync(value: any): Promise<any> {
    return value === null ? null : this.baseValidator.encodeAsync(value as any);
  }

  override safeEncodeAsync(value: any): Promise<ParseResult<any>> {
    return safeEncodeAsyncVia(this, value);
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

  // As in VldOptional: `undefined` reaches an inner default.
  private readonly defaultInside: boolean;

  constructor(private readonly baseValidator: VldBase<TInput, TOutput>) {
    super(VLD_VALIDATOR_TYPES.NULLISH);
    this.simpleMode = getSimpleWrappedMode(baseValidator as unknown as VldBase<unknown, unknown>);
    this.defaultInside = reachesDefault(baseValidator);
  }

  // Async: the inner schema's parseAsync runs (async refinements / transforms).
  override async parseAsync(value: unknown): Promise<TOutput | null | undefined> {
    if (value === undefined && this.defaultInside) {
      const result = await this.baseValidator.safeParseAsync(value);
      return result.success ? result.data : undefined;
    }
    return value === null || value === undefined ? value as any : this.baseValidator.parseAsync(value) as any;
  }

  // Encode through the wrapper, so a codec inside it runs its encoder.
  override encode(value: any): any {
    return value === null || value === undefined ? value : this.baseValidator.encode(value as any);
  }

  override safeEncode(value: any): ParseResult<any> {
    return safeEncodeVia(this, value);
  }

  override async encodeAsync(value: any): Promise<any> {
    return value === null || value === undefined ? value : this.baseValidator.encodeAsync(value as any);
  }

  override safeEncodeAsync(value: any): Promise<ParseResult<any>> {
    return safeEncodeAsyncVia(this, value);
  }

  static create<TInput, TOutput>(baseValidator: VldBase<TInput, TOutput>): VldNullish<TInput, TOutput> {
    return new VldNullish(baseValidator);
  }

  parse(value: unknown): TOutput | null | undefined {
    if (value === undefined && this.defaultInside) {
      const settled = settleUndefined(this.baseValidator.safeParse(value));
      if (!settled.success) throw settled.error;
      return settled.data;
    }
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
    if (value === undefined && this.defaultInside) {
      return settleUndefined(this.baseValidator.safeParse(value));
    }
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
    private readonly second: VldBase<any, TOutput>
  ) {
    super(VLD_VALIDATOR_TYPES.PIPE);
  }

  parse(value: unknown): TOutput {
    const intermediateResult = this.first.parse(value);
    return this.second.parse(intermediateResult);
  }

  // Encode runs the pipe backwards: the output schema first, then the input schema.
  override encode(value: any): any {
    return this.first.encode(this.second.encode(value as any));
  }

  override safeEncode(value: any): ParseResult<any> {
    return safeEncodeVia(this, value);
  }

  override async encodeAsync(value: any): Promise<any> {
    return this.first.encodeAsync(await this.second.encodeAsync(value as any));
  }

  override safeEncodeAsync(value: any): Promise<ParseResult<any>> {
    return safeEncodeAsyncVia(this, value);
  }

  // Async: the inner schema's parseAsync runs (async refinements / transforms).
  override async parseAsync(value: unknown): Promise<TOutput> {
    return this.second.parseAsync(await this.first.parseAsync(value));
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
    readonly _inner: VldBase<TInput, TOutput>,
    private readonly _refinement: (value: TOutput, ctx: SuperRefineContext) => void | Promise<void>
  ) {
    super(VLD_VALIDATOR_TYPES.SUPER_REFINE);
  }

  parse(value: unknown): TOutput {
    let result: TOutput;
    try {
      result = this._inner.parse(value);
    } catch (error) {
      throw this.continueAfterInnerFailure(value, error);
    }

    const { ctx, issues } = createIssueContext(result);

    const maybePromise = this._refinement(result, ctx);
    if (maybePromise instanceof Promise) {
      throw new Error('Use parseAsync for async refinements');
    }

    if (issues.length > 0) {
      throw new VldError(issues, issues.map(i => i.message).join('; '));
    }

    return result;
  }

  /** Failure path: append this refinement's issues when Zod would still run it. */
  private continueAfterInnerFailure(value: unknown, error: unknown): unknown {
    const innerError = ensureVldError(error);
    if (!canContinueAfter(this._inner, innerError)) return error;
    const { ctx, issues } = createIssueContext(value);
    try {
      const maybePromise = this._refinement(value as TOutput, ctx);
      if (maybePromise instanceof Promise) {
        maybePromise.catch(() => undefined);
        return error;
      }
    } catch {
      return error;
    }
    return issues.length > 0 ? new VldError([...innerError.issues, ...issues]) : error;
  }

  safeParse(value: unknown): ParseResult<TOutput> {
    const result = this._inner.safeParse(value);
    if (!result.success) return { success: false, error: ensureVldError(this.continueAfterInnerFailure(value, result.error)) };

    const { ctx, issues } = createIssueContext(result.data);

    const maybePromise = this._refinement(result.data, ctx);
    if (maybePromise instanceof Promise) {
      throw new Error('Use safeParseAsync for async refinements');
    }

    if (issues.length > 0) {
      return {
        success: false,
        error: new VldError(issues, issues.map(i => i.message).join('; '))
      };
    }

    return result;
  }

  /** Encode direction: the refinement judges the value being encoded, then the inner schema encodes it. */
  override encode(value: any): any {
    let encoded: unknown;
    try {
      encoded = this._inner.encode(value);
    } catch (error) {
      throw this.continueAfterInnerFailure(value, error);
    }
    const { ctx, issues } = createIssueContext(value);
    const maybePromise = this._refinement(value, ctx);
    if (maybePromise instanceof Promise) {
      throw new Error('Use encodeAsync for async refinements');
    }
    if (issues.length > 0) {
      throw new VldError(issues, issues.map(i => i.message).join('; '));
    }
    return encoded;
  }

  override safeEncode(value: any): ParseResult<any> {
    return safeEncodeVia(this, value);
  }

  override async encodeAsync(value: any): Promise<any> {
    let encoded: unknown;
    try {
      encoded = await this._inner.encodeAsync(value);
    } catch (error) {
      throw await this.continueAfterInnerFailureAsync(value, error);
    }
    const { ctx, issues } = createIssueContext(value);
    await this._refinement(value, ctx);
    if (issues.length > 0) {
      throw new VldError(issues, issues.map(i => i.message).join('; '));
    }
    return encoded;
  }

  override safeEncodeAsync(value: any): Promise<ParseResult<any>> {
    return safeEncodeAsyncVia(this, value);
  }

  override async parseAsync(value: unknown): Promise<TOutput> {
    let result: TOutput;
    try {
      result = await this._inner.parseAsync(value);
    } catch (error) {
      throw await this.continueAfterInnerFailureAsync(value, error);
    }

    const { ctx, issues } = createIssueContext(result);

    await this._refinement(result, ctx);

    if (issues.length > 0) {
      throw new VldError(issues, issues.map(i => i.message).join('; '));
    }

    return result;
  }

  /** Async twin of continueAfterInnerFailure: parse and parseAsync report the same issues. */
  private async continueAfterInnerFailureAsync(value: unknown, error: unknown): Promise<unknown> {
    const innerError = ensureVldError(error);
    if (!canContinueAfter(this._inner, innerError)) return error;
    const { ctx, issues } = createIssueContext(value);
    try {
      await this._refinement(value as TOutput, ctx);
    } catch {
      return error;
    }
    return issues.length > 0 ? new VldError([...innerError.issues, ...issues]) : error;
  }

  override async safeParseAsync(value: unknown): Promise<ParseResult<TOutput>> {
    try {
      return { success: true, data: await this.parseAsync(value) };
    } catch (error) {
      return { success: false, error: ensureVldError(error) };
    }
  }

  private _wrap(nextInner: any): any {
    return new VldSuperRefine(nextInner, this._refinement);
  }

  // Common constraint methods
  min(length: number | Date | bigint | any, message?: ErrorParam): this {
    return this._wrap((this._inner as any).min?.(length, message) ?? this._inner);
  }
  max(length: number | Date | bigint | any, message?: ErrorParam): this {
    return this._wrap((this._inner as any).max?.(length, message) ?? this._inner);
  }
  length(length: number, message?: ErrorParam): this {
    return this._wrap((this._inner as any).length?.(length, message) ?? this._inner);
  }
  email(message?: ErrorParam): this {
    return this._wrap((this._inner as any).email?.(message) ?? this._inner);
  }
  url(message?: ErrorParam): this {
    return this._wrap((this._inner as any).url?.(message) ?? this._inner);
  }
  uuid(message?: ErrorParam): this {
    return this._wrap((this._inner as any).uuid?.(message) ?? this._inner);
  }
  regex(pattern: RegExp, message?: ErrorParam): this {
    return this._wrap((this._inner as any).regex?.(pattern, message) ?? this._inner);
  }
  startsWith(str: string, message?: ErrorParam): this {
    return this._wrap((this._inner as any).startsWith?.(str, message) ?? this._inner);
  }
  endsWith(str: string, message?: ErrorParam): this {
    return this._wrap((this._inner as any).endsWith?.(str, message) ?? this._inner);
  }
  includes(str: string, message?: ErrorParam): this {
    return this._wrap((this._inner as any).includes?.(str, message) ?? this._inner);
  }
  ip(message?: ErrorParam): this {
    return this._wrap((this._inner as any).ip?.(message) ?? this._inner);
  }
  ipv4(message?: ErrorParam): this {
    return this._wrap((this._inner as any).ipv4?.(message) ?? this._inner);
  }
  ipv6(message?: ErrorParam): this {
    return this._wrap((this._inner as any).ipv6?.(message) ?? this._inner);
  }
  nonempty(message?: ErrorParam): this {
    return this._wrap((this._inner as any).nonempty?.(message) ?? this._inner);
  }
  trim(): this {
    return this._wrap((this._inner as any).trim?.() ?? this._inner);
  }
  toLowerCase(): this {
    return this._wrap((this._inner as any).toLowerCase?.() ?? this._inner);
  }
  lowercase(): this {
    return this.toLowerCase();
  }
  toUpperCase(): this {
    return this._wrap((this._inner as any).toUpperCase?.() ?? this._inner);
  }
  uppercase(): this {
    return this.toUpperCase();
  }

  // Number / BigInt methods
  positive(message?: ErrorParam): this {
    return this._wrap((this._inner as any).positive?.(message) ?? this._inner);
  }
  negative(message?: ErrorParam): this {
    return this._wrap((this._inner as any).negative?.(message) ?? this._inner);
  }
  nonnegative(message?: ErrorParam): this {
    return this._wrap((this._inner as any).nonnegative?.(message) ?? this._inner);
  }
  nonpositive(message?: ErrorParam): this {
    return this._wrap((this._inner as any).nonpositive?.(message) ?? this._inner);
  }
  int(message?: ErrorParam): this {
    return this._wrap((this._inner as any).int?.(message) ?? this._inner);
  }
  finite(message?: ErrorParam): this {
    return this._wrap((this._inner as any).finite?.(message) ?? this._inner);
  }
  safe(message?: ErrorParam): this {
    return this._wrap((this._inner as any).safe?.(message) ?? this._inner);
  }
  multipleOf(value: number, message?: ErrorParam): this {
    return this._wrap((this._inner as any).multipleOf?.(value, message) ?? this._inner);
  }
  step(value: number, message?: ErrorParam): this {
    return this._wrap((this._inner as any).step?.(value, message) ?? this._inner);
  }
  gt(value: any, message?: ErrorParam): this {
    return this._wrap((this._inner as any).gt?.(value, message) ?? this._inner);
  }
  gte(value: any, message?: ErrorParam): this {
    return this._wrap((this._inner as any).gte?.(value, message) ?? this._inner);
  }
  lt(value: any, message?: ErrorParam): this {
    return this._wrap((this._inner as any).lt?.(value, message) ?? this._inner);
  }
  lte(value: any, message?: ErrorParam): this {
    return this._wrap((this._inner as any).lte?.(value, message) ?? this._inner);
  }

  // Object methods
  extend<U extends Record<string, any>>(extension: { [K in keyof U]: VldBase<unknown, U[K]> }): any {
    return this._wrap((this._inner as any).extend?.(extension) ?? this._inner);
  }
  merge(other: any): any {
    return this._wrap((this._inner as any).merge?.(other) ?? this._inner);
  }
  pick<K extends keyof TOutput>(...keys: K[]): any {
    return this._wrap((this._inner as any).pick?.(...keys) ?? this._inner);
  }
  omit<K extends keyof TOutput>(...keys: K[]): any {
    return this._wrap((this._inner as any).omit?.(...keys) ?? this._inner);
  }
  partial(): any {
    return this._wrap((this._inner as any).partial?.() ?? this._inner);
  }
  required(): any {
    return this._wrap((this._inner as any).required?.() ?? this._inner);
  }
  strict(message?: ErrorParam): this {
    return this._wrap((this._inner as any).strict?.(message) ?? this._inner);
  }
  passthrough(): this {
    return this._wrap((this._inner as any).passthrough?.() ?? this._inner);
  }
  strip(): this {
    return this._wrap((this._inner as any).strip?.() ?? this._inner);
  }
  catchall(validator: any): this {
    return this._wrap((this._inner as any).catchall?.(validator) ?? this._inner);
  }
  get shape(): any {
    return (this._inner as any).shape;
  }
  get keyof(): any {
    return (this._inner as any).keyof;
  }

  // Array methods
  unwrap(): any {
    return (this._inner as any).unwrap ? (this._inner as any).unwrap() : this._inner;
  }
  get element(): any {
    return (this._inner as any).element;
  }
}

/**
 * Preprocess validator - transforms input before validation
 */
export class VldPreprocess<TInput, TOutput> extends VldBase<unknown, TOutput> {
  constructor(
    private readonly _preprocessor: (input: unknown, ctx: SuperRefineContext) => unknown,
    private readonly _schema: VldBase<TInput, TOutput>
  ) {
    super(VLD_VALIDATOR_TYPES.PREPROCESS);
  }

  static create<TInput, TOutput>(
    preprocessor: (input: unknown, ctx: SuperRefineContext) => unknown,
    schema: VldBase<TInput, TOutput>
  ): VldPreprocess<TInput, TOutput> {
    return new VldPreprocess(preprocessor, schema);
  }

  // Async: the inner schema's parseAsync runs (async refinements / transforms).
  override async parseAsync(value: unknown): Promise<TOutput> {
    return this._schema.parseAsync(this.runPreprocessor(value));
  }

  parse(value: unknown): TOutput {
    return this._schema.parse(this.runPreprocessor(value));
  }

  /** Run the preprocessor; issues it reports through ctx.addIssue fail the parse. */
  private runPreprocessor(value: unknown): unknown {
    const { ctx, issues } = createIssueContext(value);
    const preprocessed = this._preprocessor(value, ctx);
    if (issues.length > 0) {
      throw new VldError(issues, issues.map(i => i.message).join('; '));
    }
    return preprocessed;
  }

  safeParse(value: unknown): ParseResult<TOutput> {
    try {
      const preprocessed = this.runPreprocessor(value);
      return this._schema.safeParse(preprocessed);
    } catch (error) {
      return {
        success: false,
        error: ensureVldError(error)
      };
    }
  }
}

forwardWrappedSchemaApi(VldMeta, (self, next) => {
  const schema = new VldMeta(next, self.metadata);
  globalRegistry.add(schema as unknown as VldBase<unknown, unknown>, schema.getMeta() as SchemaMetadata);
  return schema;
});
forwardWrappedSchemaApi(VldBrand, (_self, next) => new VldBrand(next));
