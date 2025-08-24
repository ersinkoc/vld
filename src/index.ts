/**
 * VLD - Fast, Type-Safe Validation Library
 * Zero dependencies, blazing fast performance
 * 
 * This is the new modular implementation with:
 * - Immutable validators (no memory leaks)
 * - Secure deepMerge (no prototype pollution)
 * - TypeScript strict mode support
 * - Better performance through pooling and memoization
 */

// Import base class
import { VldBase } from './validators/base';

// Import validators
import { VldString } from './validators/string';
import { VldNumber } from './validators/number';
import { VldBoolean } from './validators/boolean';
import { VldDate } from './validators/date';
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

// Re-export types
export type { ParseResult } from './validators/base';
export type { Infer } from './validators';

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
  treeifyError, 
  prettifyError, 
  flattenError 
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
  boolean: () => VldBoolean.create(),
  date: () => VldDate.create(),
  bigint: () => VldBigInt.create(),
  symbol: () => VldSymbol.create(),
  
  // Complex validators
  array: <T>(item: VldBase<unknown, T>) => VldArray.create(item),
  object: <T extends Record<string, any>>(shape: { [K in keyof T]: VldBase<unknown, T[K]> }) => 
    VldObject.create(shape),
  tuple: <T extends readonly VldBase<any, any>[]>(...items: T) => VldTuple.create(...items),
  record: <T>(value: VldBase<unknown, T>) => VldRecord.create(value),
  set: <T>(item: VldBase<unknown, T>) => VldSet.create(item),
  map: <K, V>(key: VldBase<unknown, K>, value: VldBase<unknown, V>) => VldMap.create(key, value),
  
  // Union and intersection
  union: <T extends readonly VldBase<any, any>[]>(...validators: T) => 
    VldUnion.create(...validators),
  intersection: <A, B>(first: VldBase<unknown, A>, second: VldBase<unknown, B>) => 
    VldIntersection.create(first, second),
  
  // Literal and enum
  literal: <T extends string | number | boolean | null | undefined>(value: T) => 
    VldLiteral.create(value),
  enum: <T extends readonly [string, ...string[]]>(...values: T) => VldEnum.create(values as any),
  
  // Special validators
  any: () => VldAny.create(),
  unknown: () => VldUnknown.create(),
  void: () => VldVoid.create(),
  never: () => VldNever.create(),
  
  // Utility validators
  optional: <T>(validator: VldBase<unknown, T>) => VldOptional.create(validator),
  nullable: <T>(validator: VldBase<unknown, T>) => VldNullable.create(validator),
  nullish: <T>(validator: VldBase<unknown, T>) => VldNullish.create(validator),
  
  // Coercion API
  coerce: {
    string: () => VldCoerceString.create(),
    number: () => VldCoerceNumber.create(),
    boolean: () => VldCoerceBoolean.create(),
    date: () => VldCoerceDate.create(),
    bigint: () => VldCoerceBigInt.create(),
  },
  
  // Codec validators
  base64: () => VldBase64.create(),
  hex: () => VldHex.create(),
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

// For backward compatibility during migration
export default v;