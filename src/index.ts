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
import { VldBase } from './validators/base';

// Import validators
import { VldString } from './validators/string';
import { VldNumber } from './validators/number';
import { VldBoolean } from './validators/boolean';
import { VldDate } from './validators/date';
import { VldStringBool } from './validators/string-bool';
import { VldArray } from './validators/array';
import { VldObject } from './validators/object';
import { VldUnion } from './validators/union';
import { VldLiteral } from './validators/literal';
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
import { templateLiteral } from './validators/template-literal';
import { custom as customFn, type CustomValidatorOptions } from './validators/custom';
import { file as fileFn } from './validators/file';
import { functionValidator as functionFn } from './validators/function';
import { VldPreprocess } from './validators/base';
import { VldOptional } from './validators/base';
import { VldNullable } from './validators/base';
import { VldNullish } from './validators/base';
import { VldCodec } from './validators/codec';
import { VldBase64 } from './validators/base64';
import { VldHex } from './validators/hex';
import { VldUint8Array } from './validators/uint8array';

// Import coercion validators
import { VldCoerceString } from './coercion/string';
import { VldCoerceNumber } from './coercion/number';
import { VldCoerceBoolean } from './coercion/boolean';
import { VldCoerceDate } from './coercion/date';
import { VldCoerceBigInt } from './coercion/bigint';

// Import string format validators
import * as stringFormats from './validators/string-formats';

// Re-export types
export type { ParseResult } from './validators/base';
export type { Infer, Input, Output } from './validators';

// Re-export base classes for extension
export { VldBase } from './validators/base';
export { VldIntersection } from './validators/intersection';

// Re-export locale functionality
export { setLocale, getLocale, getMessages, type Locale } from './locales';

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

/**
 * Main API object with factory methods for all validators
 */
export const v = {
  // Primitive validators
  string: () => VldString.create(),
  number: () => VldNumber.create(),
  int: () => VldNumber.create().int(),
  int32: () => VldNumber.create().int().min(-2147483648).max(2147483647),
  boolean: () => VldBoolean.create(),
  date: () => VldDate.create(),
  bigint: () => VldBigInt.create(),
  symbol: () => VldSymbol.create(),
  stringbool: (options?: { truthy?: readonly string[]; falsy?: readonly string[]; caseSensitive?: boolean }) =>
    VldStringBool.create(options),
  
  // Complex validators
  array: <T>(item: VldBase<unknown, T>) => VldArray.create(item),
  object: <T extends Record<string, any>>(shape: { [K in keyof T]: VldBase<unknown, T[K]> }) =>
    VldObject.create(shape),
  strictObject: <T extends Record<string, any>>(shape: { [K in keyof T]: VldBase<unknown, T[K]> }) =>
    VldObject.create(shape).strict(),
  looseObject: <T extends Record<string, any>>(shape: { [K in keyof T]: VldBase<unknown, T[K]> }) =>
    VldObject.create(shape).passthrough(),
  tuple: <T extends readonly VldBase<any, any>[]>(...items: T) => VldTuple.create(...items),
  record: <T>(value: VldBase<unknown, T>) => VldRecord.create(value),
  partialRecord: <T>(value: VldBase<unknown, T>) => VldRecord.create(value).partial(),
  looseRecord: <T>(value: VldBase<unknown, T>) => VldRecord.create(value).loose(),
  set: <T>(item: VldBase<unknown, T>) => VldSet.create(item),
  map: <K, V>(key: VldBase<unknown, K>, value: VldBase<unknown, V>) => VldMap.create(key, value),
  
  // Union and intersection
  union: <T extends readonly VldBase<any, any>[]>(...validators: T) =>
    VldUnion.create(...validators),
  intersection: <A, B>(first: VldBase<unknown, A>, second: VldBase<unknown, B>) =>
    VldIntersection.create(first, second),
  discriminatedUnion: <K extends string, T extends readonly VldBase<any, any>[]>(
    discriminator: K,
    ...options: T
  ) => VldDiscriminatedUnion.create(discriminator, [...options] as any),
  xor: <T extends readonly VldBase<any, any>[]>(...options: T) =>
    VldXor.create([...options] as any),
  
  // Literal and enum
  literal: <T extends string | number | boolean | null | undefined>(value: T) => 
    VldLiteral.create(value),
  enum: <T extends readonly [string, ...string[]]>(...values: T) => VldEnum.create(values as any),
  
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
  
  // Utility validators
  optional: <T>(validator: VldBase<unknown, T>) => VldOptional.create(validator),
  nullable: <T>(validator: VldBase<unknown, T>) => VldNullable.create(validator),
  nullish: <T>(validator: VldBase<unknown, T>) => VldNullish.create(validator),

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
  uuid: (options?: { version?: 'v4' | 'v6' | 'v7' }) => stringFormats.uuid(options),
  uuidv4: () => stringFormats.uuidv4(),
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

  // Template literal validator
  templateLiteral: (...components: (VldBase<any, any> | string)[]) => templateLiteral(...components),

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
  ) => VldCodec.create(inputValidator, outputValidator, transform)
};

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
  map,
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

// For backward compatibility during migration
export default v;