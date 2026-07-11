/**
 * VLD - Fast, Type-Safe Validation Library
 * Zero dependencies, blazing fast performance
 *
 * This is the new modular implementation with:
 * - Immutable validators (no memory leaks)
 * - Secure deepMerge (no prototype pollution)
 * - TypeScript strict mode support
 * - Better performance through pooling and memoization
 * - Plugin system for extensibility
 * - Event system for validation lifecycle hooks
 * - Result pattern for functional error handling
 * - Colored console output for better debugging
 * - Debug logging system
 */

// Import base class
import { VldBase, configureSchemaCompositionFactories, resolveErrorMessage, type ErrorParam, type ParseResult, type SchemaMetadata, type SuperRefineContext } from './validators/base';
import type { Infer, Input, Output } from './validators';
import { globalRegistry } from './registry';

// Import validators
import { VldString } from './validators/string';
import { VldNumber } from './validators/number';
import { VldBoolean } from './validators/boolean';
import { VldDate } from './validators/date';
import { VldStringBool } from './validators/string-bool';
import { VldArray } from './validators/array';
import { VldObject } from './validators/object';
import { VldUnion } from './validators/union';
import { VldLiteral, type LiteralValue } from './validators/literal';
import { VldBigInt } from './validators/bigint';
import { VldSymbol } from './validators/symbol';
import { VldTuple } from './validators/tuple';
import { VldRecord } from './validators/record';
import { VldSet } from './validators/set';
import { VldMap } from './validators/map';
import { VldEnum } from './validators/enum';
import { VldIntersection } from './validators/intersection';
import { VldAny } from './validators/any';
import { VldUnknown } from './validators/unknown';
import { VldVoid } from './validators/void';
import { VldNever } from './validators/never';
import { VldNull } from './validators/null';
import { VldUndefined } from './validators/undefined';
import { VldNan } from './validators/nan';
import { VldLazy } from './validators/lazy';
import { VldDiscriminatedUnion } from './validators/discriminated-union';
import { VldXor } from './validators/xor';
import { VldJson } from './validators/json';
import { VldTemplateLiteral, templateLiteral as createTemplateLiteral } from './validators/template-literal';
import { VldCustom, custom as customFn, type CustomValidatorOptions } from './validators/custom';
import { VldFile, file as fileFn } from './validators/file';
import { VldFunction, functionValidator as functionFn } from './validators/function';
import {
  VldBrand,
  VldCatch,
  VldDefault,
  VldExactOptional,
  VldMeta,
  VldNullable,
  VldNullish,
  VldOptional,
  VldPipe,
  VldPrefault,
  VldPreprocess,
  VldReadonly,
  VldRefine,
  VldTransform
} from './validators/base';
import { VldCodec } from './validators/codec';
import { VldBase64 } from './validators/base64';
import { VldHex } from './validators/hex';
import { VldUint8Array } from './validators/uint8array';
import { VldPromise, promise as vldPromise } from './validators/promise';
import { map as mapResult } from './compat/result';
import type { Result } from './compat/result';
import * as localeNamespace from './locales';

// Import coercion validators
import { VldCoerceString } from './coercion/string';
import { VldCoerceNumber } from './coercion/number';
import { VldCoerceBoolean } from './coercion/boolean';
import { VldCoerceDate } from './coercion/date';
import { VldCoerceBigInt } from './coercion/bigint';
import {
  VldError as VldErrorClass,
  flattenError as flattenErrorFn,
  prettifyError as prettifyErrorFn,
  treeifyError as treeifyErrorFn
} from './errors';
import { fromJSONSchema as fromJSONSchemaFn, toJSONSchema as toJSONSchemaFn } from './utils/json-schema';

// Import string format validators
import * as stringFormats from './validators/string-formats';

type NativeEnumLike = Record<string, string | number>;
type Constructor<T = unknown> = abstract new (...args: any[]) => T;
type RefinementMessage = string | { error?: string; message?: string };
type GlobalConfig = { customError?: unknown; errorMap?: unknown; locale?: unknown; [key: string]: unknown };
type SharedGlobalState = { config: GlobalConfig; errorMap?: unknown };

const GLOBAL_STATE_KEY = Symbol.for('@oxog/vld/global-state');
const globalStateHost = globalThis as unknown as Record<symbol, SharedGlobalState | undefined>;
const sharedGlobalState = globalStateHost[GLOBAL_STATE_KEY] ??= { config: {} };

function configure(config?: GlobalConfig): GlobalConfig {
  if (config === undefined) {
    return { ...sharedGlobalState.config };
  }
  sharedGlobalState.config = { ...sharedGlobalState.config, ...config };
  if ('customError' in config) {
    sharedGlobalState.errorMap = config.customError;
  } else if ('errorMap' in config) {
    sharedGlobalState.errorMap = config.errorMap;
  }
  return { ...sharedGlobalState.config };
}

function setGlobalErrorMap(errorMap: unknown): void {
  sharedGlobalState.errorMap = errorMap;
  sharedGlobalState.config = { ...sharedGlobalState.config, errorMap };
}

function getGlobalErrorMap(): unknown {
  return sharedGlobalState.errorMap;
}

function enumValuesFromNativeEnum(enumObject: NativeEnumLike): [string | number, ...(string | number)[]] {
  const values = Object.keys(enumObject)
    .filter(key => !/^\d+$/.test(key))
    .map(key => enumObject[key])
    .filter((value): value is string | number => typeof value === 'string' || typeof value === 'number');

  const uniqueValues = Array.from(new Set(values));
  if (uniqueValues.length === 0) {
    throw new Error('nativeEnum requires at least one string or number value');
  }
  return uniqueValues as [string | number, ...(string | number)[]];
}

export interface FormattedError {
  _errors: string[];
  [key: string]: FormattedError | string[];
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function addFormattedIssue(root: FormattedError, path: (string | number)[], message: string): void {
  let current = root;
  for (const segment of path) {
    const key = String(segment);
    const next = current[key];
    if (!next || Array.isArray(next)) {
      current[key] = { _errors: [] };
    }
    current = current[key] as FormattedError;
  }
  current._errors.push(message);
}

function messageFromRefinementParam(param: RefinementMessage | undefined): string | undefined {
  return param === undefined ? undefined : resolveErrorMessage(param, 'Refinement check failed');
}

function cloneSchema<T extends VldBase<any, any>>(schema: T): T {
  return schema;
}

function createTransform<I = unknown, O = I>(
  transformer: (input: I, ctx?: SuperRefineContext) => O | Promise<O>
): VldBase<I, Awaited<O>> {
  return customFn<Awaited<O>>({
    parse: (value: unknown) => {
      const transformed = transformer(value as I, { addIssue: () => undefined, path: [] });
      if (transformed !== null && typeof transformed === 'object' && typeof (transformed as { then?: unknown }).then === 'function') {
        throw new Error('Use parseAsync for async transforms');
      }
      return transformed as Awaited<O>;
    },
    parseAsync: async (value: unknown): Promise<Awaited<O>> => {
      const transformed = await Promise.resolve(transformer(value as I, { addIssue: () => undefined, path: [] }));
      return transformed as Awaited<O>;
    }
  }) as VldBase<I, Awaited<O>>;
}

function createRefinement<T = unknown>(
  predicate: (value: T) => boolean | Promise<boolean>,
  message?: RefinementMessage
): VldBase<unknown, T> {
  return customFn<T>({
    parse: (value: unknown) => {
      const passed = predicate(value as T);
      if (passed !== null && typeof passed === 'object' && typeof (passed as { then?: unknown }).then === 'function') {
        throw new Error('Use parseAsync for async refinements');
      }
      if (!passed) {
        throw new Error(messageFromRefinementParam(message) || 'Refinement check failed');
      }
      return value as T;
    },
    parseAsync: async (value: unknown) => {
      if (!await predicate(value as T)) {
        throw new Error(messageFromRefinementParam(message) || 'Refinement check failed');
      }
      return value as T;
    }
  });
}

function createSuperRefinement<T = unknown>(
  refinement: (value: T, ctx: SuperRefineContext) => void | Promise<void>
): VldBase<unknown, T> {
  return VldUnknown.create().superRefine(refinement as (value: unknown, ctx: SuperRefineContext) => void | Promise<void>) as VldBase<unknown, T>;
}

function propertyCheck<K extends string, T>(
  property: K,
  schema: VldBase<unknown, T>,
  message?: RefinementMessage
): VldBase<unknown, { [P in K]: T }> {
  return customFn<{ [P in K]: T }>({
    parse: (value: unknown) => {
      if (typeof value !== 'object' || value === null || !(property in value)) {
        throw new Error(messageFromRefinementParam(message) || `Expected object with property "${property}"`);
      }
      const result = schema.safeParse((value as Record<string, unknown>)[property]);
      if (!result.success) {
        throw new Error(messageFromRefinementParam(message) || result.error.message);
      }
      return value as { [P in K]: T };
    }
  });
}

function getParsedType(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (Number.isNaN(value)) return 'nan';
  return typeof value;
}

export const TimePrecision = {
  Any: null,
  Minute: -1,
  Second: 0,
  Millisecond: 3,
  Microsecond: 6
} as const;

export const ZodFirstPartyTypeKind = {} as const;
export const $brand = Symbol.for('vld_brand');
export const $input = Symbol.for('VldInput');
export const $output = Symbol.for('VldOutput');

export const ZodIssueCode = {
  invalid_type: 'invalid_type',
  too_big: 'too_big',
  too_small: 'too_small',
  invalid_format: 'invalid_format',
  not_multiple_of: 'not_multiple_of',
  unrecognized_keys: 'unrecognized_keys',
  invalid_union: 'invalid_union',
  invalid_key: 'invalid_key',
  invalid_element: 'invalid_element',
  invalid_value: 'invalid_value',
  custom: 'custom'
} as const;

export const util = {
  getParsedType,
  propertyKeyTypes: new Set(['string', 'number', 'symbol']),
  primitiveTypes: new Set(['string', 'number', 'bigint', 'boolean', 'symbol', 'undefined', 'null']),
  assert: (condition: unknown, message = 'Assertion failed'): asserts condition => {
    if (!condition) {
      throw new Error(message);
    }
  },
  assertNever: (value: never): never => {
    throw new Error(`Unexpected value: ${String(value)}`);
  },
  joinValues: (values: readonly unknown[], separator = ' | '): string => values.map(value => JSON.stringify(value)).join(separator),
  jsonStringifyReplacer: (_key: string, value: unknown): unknown =>
    typeof value === 'bigint' ? value.toString() : value,
  nullish: (value: unknown): value is null | undefined => value === null || value === undefined,
  cached: <T>(getter: () => T): (() => T) => {
    let initialized = false;
    let value: T;
    return () => {
      if (!initialized) {
        value = getter();
        initialized = true;
      }
      return value;
    };
  }
} as const;

export const core = {
  util,
  regexes: stringFormats.regexes,
  locales: localeNamespace,
  NEVER: VldNever.create(),
  TimePrecision,
  ZodIssueCode,
  globalRegistry,
  config: configure,
  getErrorMap: getGlobalErrorMap,
  setErrorMap: setGlobalErrorMap,
  parse: <T>(schema: VldBase<unknown, T>, value: unknown): T => schema.parse(value),
  safeParse: <T>(schema: VldBase<unknown, T>, value: unknown): ParseResult<T> => schema.safeParse(value),
  parseAsync: <T>(schema: VldBase<unknown, T>, value: unknown): Promise<T> => schema.parseAsync(value),
  safeParseAsync: <T>(schema: VldBase<unknown, T>, value: unknown): Promise<ParseResult<T>> => schema.safeParseAsync(value)
} as const;

// Re-export types
export type {
  ParseResult,
  StandardSchemaV1,
  StandardSchemaV1FailureResult,
  StandardSchemaV1Issue,
  StandardSchemaV1Options,
  StandardSchemaV1PathSegment,
  StandardSchemaV1Props,
  StandardSchemaV1Result,
  StandardSchemaV1SuccessResult,
  StandardTypedV1,
  StandardTypedV1Props,
  StandardTypedV1Types
} from './validators/base';
export type { Infer, Input, Output } from './validators';

// Re-export base classes for extension
export { VldBase } from './validators/base';
export { VldIntersection } from './validators/intersection';
export { VldMeta, type SchemaMetadata } from './validators/base';
export {
  VldBase as ZodType,
  VldAny as ZodAny,
  VldArray as ZodArray,
  VldBigInt as ZodBigInt,
  VldBigInt as ZodBigIntFormat,
  VldBoolean as ZodBoolean,
  VldBrand as ZodBranded,
  VldCatch as ZodCatch,
  VldCodec as ZodCodec,
  VldCustom as ZodCustom,
  VldCustom as ZodSuccess,
  VldDate as ZodDate,
  VldDefault as ZodDefault,
  VldDiscriminatedUnion as ZodDiscriminatedUnion,
  VldEnum as ZodEnum,
  VldExactOptional as ZodExactOptional,
  VldFile as ZodFile,
  VldFunction as ZodFunction,
  VldIntersection as ZodIntersection,
  VldJson as ZodJSON,
  VldLazy as ZodLazy,
  VldLiteral as ZodLiteral,
  VldMap as ZodMap,
  VldMeta as ZodMeta,
  VldNan as ZodNaN,
  VldNever as ZodNever,
  VldNull as ZodNull,
  VldNullable as ZodNullable,
  VldNumber as ZodNumber,
  VldNumber as ZodNumberFormat,
  VldObject as ZodObject,
  VldOptional as ZodOptional,
  VldPipe as ZodPipe,
  VldPrefault as ZodPrefault,
  VldPreprocess as ZodPreprocess,
  VldPromise as ZodPromise,
  VldReadonly as ZodReadonly,
  VldRecord as ZodRecord,
  VldRefine as ZodNonOptional,
  VldSet as ZodSet,
  VldString as ZodString,
  VldSymbol as ZodSymbol,
  VldTemplateLiteral as ZodTemplateLiteral,
  VldTuple as ZodTuple,
  VldTransform as ZodTransform,
  VldUndefined as ZodUndefined,
  VldUnion as ZodUnion,
  VldUnknown as ZodUnknown,
  VldVoid as ZodVoid,
  VldXor as ZodXor
};
export {
  VldStringFormat as ZodBase64,
  VldStringFormat as ZodBase64URL,
  VldStringFormat as ZodCIDRv4,
  VldStringFormat as ZodCIDRv6,
  VldStringFormat as ZodCUID,
  VldStringFormat as ZodCUID2,
  VldStringFormat as ZodCustomStringFormat,
  VldStringFormat as ZodE164,
  VldStringFormat as ZodEmail,
  VldStringFormat as ZodEmoji,
  VldStringFormat as ZodGUID,
  VldStringFormat as ZodIPv4,
  VldStringFormat as ZodIPv6,
  VldStringFormat as ZodISODate,
  VldStringFormat as ZodISODateTime,
  VldStringFormat as ZodISODuration,
  VldStringFormat as ZodISOTime,
  VldStringFormat as ZodJWT,
  VldStringFormat as ZodKSUID,
  VldStringFormat as ZodMAC,
  VldStringFormat as ZodNanoID,
  VldStringFormat as ZodStringFormat,
  VldStringFormat as ZodULID,
  VldStringFormat as ZodURL,
  VldStringFormat as ZodUUID,
  VldStringFormat as ZodXID
} from './validators/string-formats';
export {
  VldError as ZodError,
  VldError as ZodRealError
} from './errors';
export {
  registry,
  globalRegistry,
  type SchemaRegistry
} from './registry';

// Re-export locale functionality
export {
  setLocale,
  setLocaleAsync,
  registerLocale,
  getLocale,
  getMessages,
  isLocaleLoaded,
  getSupportedLocales,
  isLocaleSupported,
  type Locale
} from './locales';

// Re-export error formatting utilities
export {
  VldError,
  VldIssue,
  VldErrorCode,
  VldErrorTree,
  VldFlattenedError,
  VldErrorJSON,
  treeifyError,
  prettifyError,
  prettifyErrorColored,
  prettifyErrorPlain,
  flattenError,
  type PrettifyOptions
} from './errors';

// Re-export codec utilities
export { 
  base64ToUint8Array,
  uint8ArrayToBase64,
  uint8ArrayToBase64Url,
  hexToUint8Array,
  uint8ArrayToHex,
  stringToUint8Array,
  uint8ArrayToString
} from './utils/codec-utils';

// Re-export codec types
export type { CodecTransform } from './validators/codec';

// Re-export predefined codecs
export {
  invertCodec,
  // String conversion codecs
  stringToNumber,
  stringToInt,
  stringToBigInt,
  numberToBigInt,
  stringToBoolean,
  
  // Date conversion codecs  
  isoDatetimeToDate,
  epochSecondsToDate,
  epochMillisToDate,
  
  // JSON codec
  jsonCodec,
  
  // URL codecs
  stringToURL,
  stringToHttpURL,
  uriComponent,
  
  // Byte conversion codecs
  base64ToBytes,
  base64UrlToBytes,
  base64urlToBytes,
  hexToBytes,
  hexLowerToBytes,
  utf8ToBytes,
  bytesToUtf8,
  
  // Complex codecs
  base64Json,
  jwtPayload
} from './codecs';

type AnySchema = VldBase<any, any>;
type EnumValue = string | number;
type ShapeSchema = { parse(value: unknown): any };
type SchemaOutput<T extends ShapeSchema> = ReturnType<T['parse']>;
type ObjectOutput<T extends Record<string, ShapeSchema>> = {
  [K in keyof T as undefined extends SchemaOutput<T[K]> ? never : K]: SchemaOutput<T[K]>;
} & {
  [K in keyof T as undefined extends SchemaOutput<T[K]> ? K : never]?: SchemaOutput<T[K]>;
};

function objectFactory<const T extends Record<string, ShapeSchema> = Record<never, never>>(
  shape?: T
): VldObject<ObjectOutput<T>> {
  return VldObject.create((shape || {}) as any) as VldObject<ObjectOutput<T>>;
}

function strictObjectFactory<const T extends Record<string, ShapeSchema>>(
  shape: T
): VldObject<ObjectOutput<T>> {
  return objectFactory(shape).strict();
}

function looseObjectFactory<const T extends Record<string, ShapeSchema>>(
  shape: T
): VldObject<ObjectOutput<T>> {
  return objectFactory(shape).passthrough();
}

function tupleFactory<const T extends readonly AnySchema[], TRest extends AnySchema>(
  items: T,
  rest: TRest,
  params?: unknown
): VldTuple<T, TRest>;
function tupleFactory<const T extends readonly AnySchema[]>(items: T, params?: string | Record<string, unknown>): VldTuple<T>;
function tupleFactory<const T extends readonly AnySchema[]>(...items: T): VldTuple<T>;
function tupleFactory(...args: unknown[]): any {
  const items = Array.isArray(args[0]) ? args[0] : args.filter((item): item is AnySchema => item instanceof VldBase);
  const tuple = VldTuple.create(...items);
  return Array.isArray(args[0]) && args[1] instanceof VldBase ? tuple.rest(args[1]) : tuple;
}

function unionFactory<const T extends readonly AnySchema[]>(options: T, params?: unknown): VldUnion<T>;
function unionFactory<const T extends readonly AnySchema[]>(...options: T): VldUnion<T>;
function unionFactory(...args: unknown[]): VldUnion<readonly AnySchema[]> {
  const options = Array.isArray(args[0]) ? args[0] : args.filter((item): item is AnySchema => item instanceof VldBase);
  return VldUnion.create(...options);
}

function xorFactory<const T extends readonly AnySchema[]>(options: T, params?: unknown): VldXor<T>;
function xorFactory<const T extends readonly AnySchema[]>(...options: T): VldXor<T>;
function xorFactory(...args: unknown[]): VldXor<readonly AnySchema[]> {
  const options = Array.isArray(args[0]) ? args[0] : args.filter((item): item is AnySchema => item instanceof VldBase);
  return VldXor.create(options);
}

function discriminatedUnionFactory<K extends string, const T extends readonly AnySchema[]>(
  discriminator: K,
  options: T,
  params?: unknown
): VldDiscriminatedUnion<K, T>;
function discriminatedUnionFactory<K extends string, const T extends readonly AnySchema[]>(
  discriminator: K,
  ...options: T
): VldDiscriminatedUnion<K, T>;
function discriminatedUnionFactory(
  discriminator: string,
  ...args: unknown[]
): VldDiscriminatedUnion<string, readonly AnySchema[]> {
  const options = Array.isArray(args[0]) ? args[0] : args.filter((item): item is AnySchema => item instanceof VldBase);
  return VldDiscriminatedUnion.create(discriminator, options);
}

function recordFactory<V>(value: VldBase<unknown, V>): VldRecord<V>;
function recordFactory<K extends PropertyKey, V>(
  key: VldBase<unknown, K>,
  value: VldBase<unknown, V>,
  params?: unknown
): VldRecord<V, K>;
function recordFactory<K extends PropertyKey, V>(
  first: VldBase<unknown, K | V>,
  second?: VldBase<unknown, V>
): any {
  return second === undefined
    ? VldRecord.create(first)
    : VldRecord.create(second, first as VldBase<unknown, K>);
}

function partialRecordFactory<V>(value: VldBase<unknown, V>): VldRecord<V | undefined>;
function partialRecordFactory<K extends PropertyKey, V>(
  key: VldBase<unknown, K>,
  value: VldBase<unknown, V>,
  params?: unknown
): VldRecord<V | undefined, K>;
function partialRecordFactory<K extends PropertyKey, V>(
  first: VldBase<unknown, K | V>,
  second?: VldBase<unknown, V>
): VldRecord<V | undefined, K> | VldRecord<K | V | undefined> {
  return second === undefined
    ? VldRecord.create(first).partial()
    : VldRecord.create(second, first as VldBase<unknown, K>).partial();
}

function looseRecordFactory<V>(value: VldBase<unknown, V>): VldBase<unknown, Record<string, V>>;
function looseRecordFactory<K extends PropertyKey, V>(
  key: VldBase<unknown, K>,
  value: VldBase<unknown, V>,
  params?: unknown
): VldBase<unknown, Record<K, V>>;
function looseRecordFactory<K extends PropertyKey, V>(
  first: VldBase<unknown, K | V>,
  second?: VldBase<unknown, V>
): VldBase<unknown, Record<K, V>> | VldBase<unknown, Record<string, K | V>> {
  return second === undefined
    ? VldRecord.create(first).loose()
    : VldRecord.create(second, first as VldBase<unknown, K>).loose();
}

function literalFactory<const T extends readonly LiteralValue[]>(values: T, params?: unknown): VldLiteral<T[number]>;
function literalFactory<const T extends LiteralValue>(value: T, params?: unknown): VldLiteral<T>;
function literalFactory(value: LiteralValue | readonly LiteralValue[]): VldLiteral<LiteralValue> {
  return VldLiteral.create(value);
}

function enumFactoryCompat<const T extends readonly [EnumValue, ...EnumValue[]]>(values: T, params?: unknown): VldEnum<T>;
function enumFactoryCompat<const T extends readonly [EnumValue, ...EnumValue[]]>(...values: T): VldEnum<T>;
function enumFactoryCompat<T extends NativeEnumLike>(entries: T, params?: unknown): VldEnum<any>;
function enumFactoryCompat(...args: unknown[]): VldEnum<any> {
  const first = args[0];
  const values = Array.isArray(first)
    ? first
    : first !== null && typeof first === 'object'
      ? enumValuesFromNativeEnum(first as NativeEnumLike)
      : args.filter((item): item is EnumValue => typeof item === 'string' || typeof item === 'number');
  return VldEnum.create(values as [EnumValue, ...EnumValue[]]);
}

configureSchemaCompositionFactories({
  array: schema => VldArray.create(schema),
  union: (left, right) => VldUnion.create(left, right) as any,
  intersection: (left, right) => VldIntersection.create(left, right) as any,
  toJSONSchema: (schema, options) => toJSONSchemaFn(schema, options as any)
});

/**
 * Main API object with factory methods for all validators
 */
export const v = {
  // Primitive validators
  string: () => VldString.create(),
  number: () => VldNumber.create(),
  int: () => VldNumber.create().int(),
  int32: () => VldNumber.create().int().min(-2147483648).max(2147483647),
  uint32: () => VldNumber.create().uint32(),
  uint64: () => VldNumber.create().uint64(),
  int64: () => VldNumber.create().int64(),
  float32: () => VldNumber.create().float32(),
  float64: () => VldNumber.create().float64(),
  boolean: () => VldBoolean.create(),
  date: () => VldDate.create(),
  bigint: () => VldBigInt.create(),
  symbol: () => VldSymbol.create(),
  stringbool: (options?: { truthy?: readonly string[]; falsy?: readonly string[]; caseSensitive?: boolean }) =>
    VldStringBool.create(options),
  
  // Complex validators
  array: <T>(item: VldBase<unknown, T>) => VldArray.create(item),
  object: objectFactory,
  strictObject: strictObjectFactory,
  looseObject: looseObjectFactory,
  tuple: tupleFactory,
  record: recordFactory,
  partialRecord: partialRecordFactory,
  looseRecord: looseRecordFactory,
  set: <T>(item: VldBase<unknown, T>) => VldSet.create(item),
  map: <K, V>(key: VldBase<unknown, K>, value: VldBase<unknown, V>) => VldMap.create(key, value),
  
  // Union and intersection
  union: unionFactory,
  intersection: <A, B>(first: VldBase<unknown, A>, second: VldBase<unknown, B>) =>
    VldIntersection.create(first, second),
  discriminatedUnion: discriminatedUnionFactory,
  xor: xorFactory,
  keyof: <T extends Record<string, any>>(schema: VldObject<T>) => schema.keyof(),
  
  // Literal and enum
  literal: literalFactory,
  enum: enumFactoryCompat,
  nativeEnum: <T extends NativeEnumLike>(enumObject: T) => VldEnum.create(enumValuesFromNativeEnum(enumObject) as any),
  
  // Special validators
  any: () => VldAny.create(),
  unknown: () => VldUnknown.create(),
  void: () => VldVoid.create(),
  never: () => VldNever.create(),
  null: () => VldNull.create(),
  undefined: () => VldUndefined.create(),
  nan: () => VldNan.create(),

  // NEVER constant - Zod 4 API parity for use in transforms
  NEVER: VldNever.create(),
  TimePrecision,
  ZodIssueCode,
  ZodFirstPartyTypeKind,
  
  // Utility validators
  optional: <T>(validator: VldBase<unknown, T>) => VldOptional.create(validator),
  nullable: <T>(validator: VldBase<unknown, T>) => VldNullable.create(validator),
  nullish: <T>(validator: VldBase<unknown, T>) => VldNullish.create(validator),
  exactOptional: <T>(validator: VldBase<unknown, T>) => VldExactOptional.create(validator),
  nonoptional: <T>(validator: VldBase<unknown, T | undefined>, message?: RefinementMessage) =>
    validator.refine((value): value is Exclude<T, undefined> => value !== undefined, messageFromRefinementParam(message)),
  catch: <T>(validator: VldBase<unknown, T>, fallbackValue: T) => validator.catch(fallbackValue),
  prefault: <TInput, TOutput>(validator: VldBase<TInput, TOutput>, defaultValue: TInput | (() => TInput)) =>
    validator.prefault(defaultValue),
  readonly: <T>(validator: VldBase<unknown, T>) => validator.readonly(),
  pipe: <TInput, TIntermediate, TOutput>(
    first: VldBase<TInput, TIntermediate>,
    second: VldBase<any, TOutput>
  ) => first.pipe(second),
  clone: <T extends VldBase<any, any>>(schema: T) => cloneSchema(schema),
  describe: <TInput, TOutput>(
    schemaOrDescription: VldBase<TInput, TOutput> | string,
    description?: string
  ) => schemaOrDescription instanceof VldBase
    ? schemaOrDescription.describe(description || '')
    : VldUnknown.create().describe(schemaOrDescription),
  meta: <TInput, TOutput>(
    schemaOrMetadata: VldBase<TInput, TOutput> | Partial<SchemaMetadata>,
    metadata?: Partial<SchemaMetadata>
  ) => schemaOrMetadata instanceof VldBase
    ? schemaOrMetadata.meta(metadata || {})
    : VldUnknown.create().meta(schemaOrMetadata),
  transform: <TInput = unknown, TOutput = TInput>(
    schemaOrTransformer: VldBase<unknown, TInput> | ((value: TInput, ctx?: SuperRefineContext) => TOutput | Promise<TOutput>),
    transformer?: (value: TInput) => TOutput | Promise<TOutput>
  ) => schemaOrTransformer instanceof VldBase
    ? schemaOrTransformer.transform(transformer || ((value: TInput) => value as unknown as TOutput))
    : createTransform(schemaOrTransformer),
  overwrite: <T>(transformer: (value: T) => T) => createTransform(transformer),
  refine: <T = unknown>(
    schemaOrPredicate: VldBase<unknown, T> | ((value: T) => boolean | Promise<boolean>),
    predicateOrMessage?: ((value: T) => boolean | Promise<boolean>) | RefinementMessage,
    message?: RefinementMessage
  ) => schemaOrPredicate instanceof VldBase
    ? schemaOrPredicate.refine(predicateOrMessage as (value: T) => boolean | Promise<boolean>, messageFromRefinementParam(message))
    : createRefinement(schemaOrPredicate, predicateOrMessage as RefinementMessage | undefined),
  check: <T = unknown>(
    schemaOrPredicate: VldBase<unknown, T> | ((value: T) => boolean | Promise<boolean>),
    predicateOrMessage?: ((value: T) => boolean | Promise<boolean>) | RefinementMessage,
    message?: RefinementMessage
  ) => schemaOrPredicate instanceof VldBase
    ? schemaOrPredicate.check(predicateOrMessage as (value: T) => boolean | Promise<boolean>, messageFromRefinementParam(message))
    : createRefinement(schemaOrPredicate, predicateOrMessage as RefinementMessage | undefined),
  superRefine: <T = unknown>(
    schemaOrRefinement: VldBase<unknown, T> | ((value: T, ctx: SuperRefineContext) => void | Promise<void>),
    refinement?: (value: T, ctx: SuperRefineContext) => void | Promise<void>
  ) => schemaOrRefinement instanceof VldBase
    ? schemaOrRefinement.superRefine(refinement || (() => undefined))
    : createSuperRefinement(schemaOrRefinement),
  property: propertyCheck,
  instanceof: <T>(constructor: Constructor<T>, message?: RefinementMessage) =>
    customFn<T>({
      parse: (value: unknown) => {
        if (!(value instanceof constructor)) {
          throw new Error(messageFromRefinementParam(message) || `Expected instance of ${constructor.name || 'provided constructor'}`);
        }
        return value;
      }
    }),
  config: configure,
  setErrorMap: setGlobalErrorMap,
  getErrorMap: getGlobalErrorMap,
  core,
  util,
  locales: localeNamespace,

  // Recursive schemas
  lazy: <T>(schemaGetter: () => VldBase<unknown, T>) => VldLazy.create(schemaGetter),

  // JSON validator
  json: <T = unknown>(schema?: VldBase<unknown, T>) => VldJson.create(schema),

  // Custom validator for type-safe user-defined schemas
  custom: <TOutput = unknown>(
    options: CustomValidatorOptions<TOutput>
  ) => customFn<TOutput>(options),

  // File validator for file uploads
  file: () => fileFn(),

  // Function validator for function validation
  function: () => functionFn(),

  // Preprocessing
  preprocess: <TInput, TOutput>(
    preprocessor: (input: unknown) => unknown,
    schema: VldBase<TInput, TOutput>
  ) => VldPreprocess.create(preprocessor, schema),

  // Coercion API
  coerce: {
    string: () => VldCoerceString.create(),
    number: () => VldCoerceNumber.create(),
    boolean: () => VldCoerceBoolean.create(),
    date: () => VldCoerceDate.create(),
    bigint: () => VldCoerceBigInt.create(),
  },

  // String format validators (Zod 4 parity)
  email: (options?: { pattern?: RegExp }) => stringFormats.email(options),
  url: () => VldString.create().url(),
  uuid: (options?: { version?: 'v4' | 'v6' | 'v7' }) => stringFormats.uuid(options),
  uuidv4: () => stringFormats.uuidv4(),
  uuidv6: () => stringFormats.uuidv6(),
  uuidv7: () => stringFormats.uuidv7(),
  hostname: () => stringFormats.hostname(),
  emoji: () => stringFormats.emoji(),
  base64: () => stringFormats.base64(),
  base64url: () => stringFormats.base64url(),
  hex: () => stringFormats.hex(),
  jwt: () => stringFormats.jwt(),
  nanoid: () => stringFormats.nanoid(),
  cuid: () => stringFormats.cuid(),
  cuid2: () => stringFormats.cuid2(),
  ulid: () => stringFormats.ulid(),
  ipv4: () => stringFormats.ipv4(),
  ipv6: () => stringFormats.ipv6(),
  mac: () => stringFormats.mac(),
  cidrv4: () => stringFormats.cidrv4(),
  cidrv6: () => stringFormats.cidrv6(),
  e164: () => stringFormats.e164(),
  hash: (algorithm: 'md5' | 'sha1' | 'sha256' | 'sha384' | 'sha512') =>
    stringFormats.hash(algorithm),
  iso: {
    date: () => stringFormats.iso.date(),
    time: () => stringFormats.iso.time(),
    dateTime: () => stringFormats.iso.dateTime(),
    duration: () => stringFormats.iso.duration(),
  },
  stringFormat: (name: string, validator: ((val: string) => boolean) | RegExp) =>
    stringFormats.stringFormat(name, validator),
  minLength: (value: number, message?: ErrorParam) => VldString.create().min(value, message),
  maxLength: (value: number, message?: ErrorParam) => VldString.create().max(value, message),
  length: (value: number, message?: ErrorParam) => VldString.create().length(value, message),
  regex: (pattern: RegExp, message?: ErrorParam) => VldString.create().regex(pattern, message),
  startsWith: (value: string, message?: ErrorParam) => VldString.create().startsWith(value, message),
  endsWith: (value: string, message?: ErrorParam) => VldString.create().endsWith(value, message),
  includes: (value: string, message?: ErrorParam) => VldString.create().includes(value, message),
  trim: () => VldString.create().trim(),
  toLowerCase: () => VldString.create().toLowerCase(),
  lowercase: () => VldString.create().toLowerCase(),
  toUpperCase: () => VldString.create().toUpperCase(),
  uppercase: () => VldString.create().toUpperCase(),
  gt: (value: number, message?: ErrorParam) => VldNumber.create().gt(value, message),
  gte: (value: number, message?: ErrorParam) => VldNumber.create().gte(value, message),
  lt: (value: number, message?: ErrorParam) => VldNumber.create().lt(value, message),
  lte: (value: number, message?: ErrorParam) => VldNumber.create().lte(value, message),
  positive: (message?: ErrorParam) => VldNumber.create().positive(message),
  negative: (message?: ErrorParam) => VldNumber.create().negative(message),
  nonnegative: (message?: ErrorParam) => VldNumber.create().nonnegative(message),
  nonpositive: (message?: ErrorParam) => VldNumber.create().nonpositive(message),
  multipleOf: (value: number, message?: ErrorParam) => VldNumber.create().multipleOf(value, message),
  minSize: (value: number, message?: ErrorParam) => VldString.create().min(value, message),
  maxSize: (value: number, message?: ErrorParam) => VldString.create().max(value, message),
  size: (value: number, message?: ErrorParam) => VldString.create().length(value, message),
  normalize: (form?: 'NFC' | 'NFD' | 'NFKC' | 'NFKD' | (string & {})) => VldString.create().transform(value => value.normalize(form)),
  slugify: () => VldString.create().transform(value => value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')),
  mime: (types: string | string[], message?: string) => VldFile.create().mime(types, message),

  // Zod v4 parity string formats
  xid: () => stringFormats.xid(),
  guid: () => stringFormats.guid(),
  httpUrl: () => stringFormats.httpUrl(),
  ksuid: () => stringFormats.ksuid(),
  regexes: stringFormats.regexes,

  // Template literal validator
  templateLiteral: (...components: (VldBase<any, any> | string)[]) => createTemplateLiteral(...components),

  // Codec validators (binary data validators)
  base64Bytes: () => VldBase64.create(),
  hexBytes: () => VldHex.create(),
  uint8Array: () => VldUint8Array.create(),
  
  // Codec factory
  codec: <TInput, TOutput>(
    inputValidator: VldBase<unknown, TInput>,
    outputValidator: VldBase<unknown, TOutput>,
    transform: {
      decode: (value: TInput) => TOutput | Promise<TOutput>;
      encode: (value: TOutput) => TInput | Promise<TInput>;
    }
  ) => VldCodec.create(inputValidator, outputValidator, transform),
  invertCodec: <TInput, TOutput>(codec: VldCodec<TInput, TOutput>) => codec.invert(),

  // Promise validator (Zod v4 parity)
  promise: <T>(inner: VldBase<unknown, T>) => vldPromise(inner),

  // Root parse helpers (Zod v4 parity)
  parse: <T>(schema: VldBase<unknown, T>, value: unknown): T => schema.parse(value),
  safeParse: <T>(schema: VldBase<unknown, T>, value: unknown): ParseResult<T> => schema.safeParse(value),
  parseAsync: <T>(schema: VldBase<unknown, T>, value: unknown): Promise<T> => schema.parseAsync(value),
  safeParseAsync: <T>(schema: VldBase<unknown, T>, value: unknown): Promise<ParseResult<T>> => schema.safeParseAsync(value),
  decode: <T>(schema: VldBase<unknown, T>, value: unknown): T => schema.parse(value),
  safeDecode: <T>(schema: VldBase<unknown, T>, value: unknown): ParseResult<T> => schema.safeParse(value),
  decodeAsync: <T>(schema: VldBase<unknown, T>, value: unknown): Promise<T> => schema.parseAsync(value),
  safeDecodeAsync: <T>(schema: VldBase<unknown, T>, value: unknown): Promise<ParseResult<T>> => schema.safeParseAsync(value),
  encode: <TInput, TOutput>(schema: VldBase<TInput, TOutput>, value: TOutput): TInput =>
    schema.encode(value),
  safeEncode: <TInput, TOutput>(schema: VldBase<TInput, TOutput>, value: TOutput): ParseResult<TInput> =>
    schema.safeEncode(value),
  encodeAsync: <TInput, TOutput>(schema: VldBase<TInput, TOutput>, value: TOutput): Promise<TInput> =>
    schema.encodeAsync(value),
  safeEncodeAsync: <TInput, TOutput>(schema: VldBase<TInput, TOutput>, value: TOutput): Promise<ParseResult<TInput>> =>
    schema.safeEncodeAsync(value),
  formatError: (error: Error): FormattedError => {
    const formatted: FormattedError = { _errors: [] };
    if (error instanceof VldErrorClass) {
      for (const issue of error.issues) {
        addFormattedIssue(formatted, issue.path, issue.message);
      }
      return formatted;
    }
    formatted._errors.push(toErrorMessage(error));
    return formatted;
  },
  treeifyError: treeifyErrorFn,
  prettifyError: prettifyErrorFn,
  flattenError: flattenErrorFn,
  toJSONSchema: toJSONSchemaFn,
  fromJSONSchema: fromJSONSchemaFn
};

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace v {
  export type infer<T extends VldBase<any, any>> = Infer<T>;
  export type input<T extends VldBase<any, any>> = Input<T>;
  export type output<T extends VldBase<any, any>> = Output<T>;
}

/**
 * Zod-compatible namespace alias.
 */
export const z = v;

/**
 * Zod-compatible root-level factory aliases.
 *
 * VLD's primary API remains `v.*`, but Zod exposes most factories directly
 * from the package root. Re-exporting these aliases makes migration less
 * intrusive without changing existing behavior.
 */
export const {
  string,
  number,
  int,
  int32,
  uint32,
  uint64,
  int64,
  float32,
  float64,
  boolean,
  date,
  bigint,
  symbol,
  stringbool,
  array,
  object,
  strictObject,
  looseObject,
  tuple,
  record,
  partialRecord,
  looseRecord,
  set,
  union,
  intersection,
  discriminatedUnion,
  xor,
  keyof,
  literal,
  nativeEnum,
  any,
  unknown,
  nan,
  optional,
  nullable,
  nullish,
  exactOptional,
  nonoptional,
  readonly,
  pipe,
  clone,
  describe,
  meta,
  transform,
  overwrite,
  refine,
  check,
  superRefine,
  property,
  config,
  setErrorMap,
  getErrorMap,
  locales,
  lazy,
  json,
  custom,
  file,
  preprocess,
  coerce,
  email,
  url,
  uuid,
  uuidv4,
  uuidv6,
  uuidv7,
  hostname,
  emoji,
  base64,
  base64url,
  hex,
  jwt,
  nanoid,
  cuid,
  cuid2,
  ulid,
  ipv4,
  ipv6,
  mac,
  cidrv4,
  cidrv6,
  e164,
  hash,
  iso,
  stringFormat,
  normalize,
  slugify,
  mime,
  xid,
  guid,
  httpUrl,
  ksuid,
  regexes,
  templateLiteral,
  base64Bytes,
  hexBytes,
  uint8Array,
  codec,
  promise,
  prefault,
  parse,
  safeParse,
  parseAsync,
  safeParseAsync,
  decode,
  safeDecode,
  decodeAsync,
  safeDecodeAsync,
  encode,
  safeEncode,
  encodeAsync,
  safeEncodeAsync,
  formatError,
  NEVER
} = v;

const catchFactory = v.catch;
const enumFactory = v.enum;
const functionFactory = v.function;
const instanceOfFactory = v.instanceof;
const mapFactory = v.map;
const neverFactory = v.never;
const nullFactory = v.null;
const undefinedFactory = v.undefined;
const voidFactory = v.void;
const defaultFactory = v;
const zodStringFactory = VldString;

export {
  catchFactory as catch,
  defaultFactory as _default,
  enumFactory as enum,
  functionFactory as function,
  functionFactory as _function,
  instanceOfFactory as instanceof,
  mapFactory as mapSchema,
  neverFactory as never,
  nullFactory as null,
  undefinedFactory as undefined,
  voidFactory as void,
  zodStringFactory as _ZodString
};

export function map<K, V>(key: VldBase<unknown, K>, value: VldBase<unknown, V>): VldMap<K, V>;
export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E>;
export function map(first: unknown, second: unknown): unknown {
  if (first instanceof VldBase && second instanceof VldBase) {
    return v.map(first, second);
  }
  return mapResult(first as never, second as never);
}

export const minLength = (value: number, message?: ErrorParam): VldString => v.string().min(value, message);
export const maxLength = (value: number, message?: ErrorParam): VldString => v.string().max(value, message);
export const length = (value: number, message?: ErrorParam): VldString => v.string().length(value, message);
export const regex = (pattern: RegExp, message?: ErrorParam): VldString => v.string().regex(pattern, message);
export const startsWith = (value: string, message?: ErrorParam): VldString => v.string().startsWith(value, message);
export const endsWith = (value: string, message?: ErrorParam): VldString => v.string().endsWith(value, message);
export const includes = (value: string, message?: ErrorParam): VldString => v.string().includes(value, message);
export const trim = (): VldString => v.string().trim();
export const toLowerCase = (): VldString => v.string().toLowerCase();
export const lowercase = toLowerCase;
export const toUpperCase = (): VldString => v.string().toUpperCase();
export const uppercase = toUpperCase;
export const gt = (value: number, message?: ErrorParam): VldNumber => v.number().gt(value, message);
export const gte = (value: number, message?: ErrorParam): VldNumber => v.number().gte(value, message);
export const lt = (value: number, message?: ErrorParam): VldNumber => v.number().lt(value, message);
export const lte = (value: number, message?: ErrorParam): VldNumber => v.number().lte(value, message);
export const positive = (message?: ErrorParam): VldNumber => v.number().positive(message);
export const negative = (message?: ErrorParam): VldNumber => v.number().negative(message);
export const nonnegative = (message?: ErrorParam): VldNumber => v.number().nonnegative(message);
export const nonpositive = (message?: ErrorParam): VldNumber => v.number().nonpositive(message);
export const multipleOf = (value: number, message?: ErrorParam): VldNumber => v.number().multipleOf(value, message);
export const minSize = minLength;
export const maxSize = maxLength;
export const size = length;

// ============================================
// Result Pattern (v1.5+ features)
// ============================================

export type { Result, VldResult } from './compat/result';

export {
  Ok,
  Err,
  success,
  failure,
  isOk,
  isErr,
  isResult,
  unwrap,
  unwrapOr,
  mapErr,
  flatMap,
  match,
  tryCatch,
  tryCatchAsync,
  all,
  fromNullable,
  ResultUtils
} from './compat/result';

// ============================================
// Event Emitter (v1.5+ features)
// ============================================

export {
  // Types
  type EventMap,
  type EventHandler,
  type ListenerOptions,
  type Emitter,
  // Factory functions
  createEmitter,
  createEventBus,
  withEmitter
} from './compat/emitter';

// ============================================
// VLD Events (v1.5+ features)
// ============================================

export type {
  VldEvents,
  VldEventPayload,
  ParseStartEvent,
  ParseSuccessEvent,
  ParseErrorEvent,
  FieldValidationEvent,
  TransformEvent,
  PluginRegisteredEvent,
  LocaleChangedEvent,
  DebugEvent,
  MetricsEvent
} from './events';

// ============================================
// Plugin System (v1.5+ features)
// ============================================

export {
  // Kernel
  createVldKernel,
  getVldKernel,
  resetVldKernel,
  usePlugin,
  definePlugin,
  // Types
  type VldContext,
  type VldPlugin,
  type VldKernelInstance,
  type VldKernelOptions,
  type ValidatorFactory,
  type TransformFactory,
  type CodecFactory,
  type HookContext,
  type PluginBuilder,
  type PluginMeta,
  type PluginHooks
} from './kernel';

// ============================================
// Logger (v1.5+ features)
// ============================================

export {
  // Logger
  createLogger,
  initLogger,
  getLogger,
  setLogLevel,
  enableDebug,
  disableLogging,
  createNoOpLogger,
  // Types
  type Logger,
  type LoggerOptions,
  type LogLevel,
  type LogEntry,
  type LogHandler
} from './logger';

// ============================================
// Pigment - Colored Output (v1.5+ features)
// ============================================

export {
  pigment,
  supportsColor,
  bold,
  dim,
  italic,
  underline,
  red,
  green,
  yellow,
  blue,
  magenta,
  cyan,
  white,
  gray,
  grey,
  strip,
  vldTheme,
  createTheme,
  type Theme
} from './pigment';

// ============================================
// JSON Schema Support (v2.1+ features)
// ============================================

export {
  toJSONSchema,
  fromJSONSchema,
  type JSONSchemaDefinition,
  type ToJSONSchemaOptions
} from './utils/json-schema';

// For backward compatibility during migration
export default v;
