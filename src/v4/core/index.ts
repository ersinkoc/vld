export * from '../../index';
export {
  core as default,
  core,
  util,
  ZodIssueCode
} from '../../index';
export { VldError as $ZodError, VldError as $ZodRealError } from '../../errors';
export {
  VldBase as $ZodType,
  VldCatch as $ZodCatch,
  VldDefault as $ZodDefault,
  VldNullable as $ZodNullable,
  VldOptional as $ZodOptional,
  VldPipe as $ZodPipe,
  VldPrefault as $ZodPrefault,
  VldReadonly as $ZodReadonly,
  VldTransform as $ZodTransform
} from '../../validators/base';
export { VldString as $ZodString } from '../../validators/string';
export { VldNumber as $ZodNumber } from '../../validators/number';
export { VldBoolean as $ZodBoolean } from '../../validators/boolean';
export { VldBigInt as $ZodBigInt } from '../../validators/bigint';
export { VldSymbol as $ZodSymbol } from '../../validators/symbol';
export { VldUndefined as $ZodUndefined } from '../../validators/undefined';
export { VldNull as $ZodNull } from '../../validators/null';
export { VldAny as $ZodAny } from '../../validators/any';
export { VldUnknown as $ZodUnknown } from '../../validators/unknown';
export { VldNever as $ZodNever } from '../../validators/never';
export { VldVoid as $ZodVoid } from '../../validators/void';
export { VldDate as $ZodDate } from '../../validators/date';
export { VldArray as $ZodArray } from '../../validators/array';
export { VldObject as $ZodObject } from '../../validators/object';
export { VldUnion as $ZodUnion } from '../../validators/union';
export { VldIntersection as $ZodIntersection } from '../../validators/intersection';
export { VldTuple as $ZodTuple } from '../../validators/tuple';
export { VldRecord as $ZodRecord } from '../../validators/record';
export { VldMap as $ZodMap } from '../../validators/map';
export { VldSet as $ZodSet } from '../../validators/set';
export { VldEnum as $ZodEnum } from '../../validators/enum';
export { VldLiteral as $ZodLiteral } from '../../validators/literal';
export { VldFile as $ZodFile } from '../../validators/file';
export { VldLazy as $ZodLazy } from '../../validators/lazy';
export { VldPromise as $ZodPromise } from '../../validators/promise';
export { VldCustom as $ZodCustom } from '../../validators/custom';
export {
  VldBase64 as $ZodBase64,
  VldBase64 as $ZodBase64URL
} from '../../validators/base64';
export { VldCodec as $ZodCodec } from '../../validators/codec';
export { VldDiscriminatedUnion as $ZodDiscriminatedUnion } from '../../validators/discriminated-union';
export { VldFunction as $ZodFunction } from '../../validators/function';
export { VldJson as $ZodSuccess } from '../../validators/json';
export { VldNan as $ZodNaN } from '../../validators/nan';
export { VldTemplateLiteral as $ZodTemplateLiteral } from '../../validators/template-literal';
export { VldXor as $ZodXor } from '../../validators/xor';
export { VldExactOptional as $ZodExactOptional, VldPreprocess as $ZodPreprocess, VldRefine as $ZodNonOptional } from '../../validators/base';
export {
  VldStringFormat as $ZodBigIntFormat,
  VldStringFormat as $ZodCIDRv4,
  VldStringFormat as $ZodCIDRv6,
  VldStringFormat as $ZodCUID,
  VldStringFormat as $ZodCUID2,
  VldStringFormat as $ZodCustomStringFormat,
  VldStringFormat as $ZodE164,
  VldStringFormat as $ZodEmail,
  VldStringFormat as $ZodEmoji,
  VldStringFormat as $ZodGUID,
  VldStringFormat as $ZodIPv4,
  VldStringFormat as $ZodIPv6,
  VldStringFormat as $ZodISODate,
  VldStringFormat as $ZodISODateTime,
  VldStringFormat as $ZodISODuration,
  VldStringFormat as $ZodISOTime,
  VldStringFormat as $ZodJWT,
  VldStringFormat as $ZodKSUID,
  VldStringFormat as $ZodMAC,
  VldStringFormat as $ZodNanoID,
  VldStringFormat as $ZodNumberFormat,
  VldStringFormat as $ZodStringFormat,
  VldStringFormat as $ZodULID,
  VldStringFormat as $ZodURL,
  VldStringFormat as $ZodUUID,
  VldStringFormat as $ZodXID
} from '../../validators/string-formats';
export { registry as $ZodRegistry } from '../../registry';

import * as root from '../../index';
import type { VldBase } from '../../validators/base';

type AnySchema = VldBase<any, any>;
type Params = string | { message?: string; error?: string };

const messageFromParams = (params?: Params): string | undefined =>
  typeof params === 'string' ? params : params?.message || params?.error;

const hasClassArg = (args: unknown[]): boolean => typeof args[0] === 'function' && args.length > 1;

const schemaArg = (args: unknown[], directIndex = 0): AnySchema =>
  args[hasClassArg(args) ? directIndex + 1 : directIndex] as AnySchema;

const valueArg = <T>(args: unknown[], directIndex = 0): T =>
  args[hasClassArg(args) ? directIndex + 1 : directIndex] as T;

const schemaArrayArg = (args: unknown[], directIndex = 0): AnySchema[] => {
  const value = valueArg<unknown>(args, directIndex);
  return Array.isArray(value) ? value as AnySchema[] : args.slice(directIndex) as AnySchema[];
};

const unsupportedCoreFactory = (name: string) => (): never => {
  throw new Error(`${name} is an internal Zod core compatibility placeholder`);
};

export class $ZodAsyncError extends Error {}
export class $ZodEncodeError extends Error {}
export class $ZodCheck {}
export class $ZodCheckBigIntFormat extends $ZodCheck {}
export class $ZodCheckEndsWith extends $ZodCheck {}
export class $ZodCheckGreaterThan extends $ZodCheck {}
export class $ZodCheckIncludes extends $ZodCheck {}
export class $ZodCheckLengthEquals extends $ZodCheck {}
export class $ZodCheckLessThan extends $ZodCheck {}
export class $ZodCheckLowerCase extends $ZodCheck {}
export class $ZodCheckMaxLength extends $ZodCheck {}
export class $ZodCheckMaxSize extends $ZodCheck {}
export class $ZodCheckMimeType extends $ZodCheck {}
export class $ZodCheckMinLength extends $ZodCheck {}
export class $ZodCheckMinSize extends $ZodCheck {}
export class $ZodCheckMultipleOf extends $ZodCheck {}
export class $ZodCheckNumberFormat extends $ZodCheck {}
export class $ZodCheckOverwrite extends $ZodCheck {}
export class $ZodCheckProperty extends $ZodCheck {}
export class $ZodCheckRegex extends $ZodCheck {}
export class $ZodCheckSizeEquals extends $ZodCheck {}
export class $ZodCheckStartsWith extends $ZodCheck {}
export class $ZodCheckStringFormat extends $ZodCheck {}
export class $ZodCheckUpperCase extends $ZodCheck {}
export const $ZodObjectJIT = root.ZodObject;
export class Doc {}
export const JSONSchema = {};
export class JSONSchemaGenerator {}
export const globalConfig = {};
export const version = { major: 4, minor: 4, patch: 3 };
export const $constructor = (name: string, initializer?: (instance: unknown, def: unknown) => void) =>
  class {
    constructor(def?: unknown) {
      Object.defineProperty(this, '_zod', { value: { def }, enumerable: false });
      initializer?.(this, def);
    }
    static displayName = name;
  };

export const _parse = root.parse;
export const _default = (...args: unknown[]) => {
  const schema = schemaArg(args) as VldBase<any, any>;
  const defaultValue = valueArg<any>(args, 1);
  return schema.default(typeof defaultValue === 'function' ? defaultValue() : defaultValue);
};
export const _safeParse = root.safeParse;
export const _parseAsync = root.parseAsync;
export const _safeParseAsync = root.safeParseAsync;
export const _encode = root.encode;
export const _safeEncode = root.safeEncode;
export const _decode = root.decode;
export const _safeDecode = root.safeDecode;
export const _encodeAsync = root.encodeAsync;
export const _safeEncodeAsync = root.safeEncodeAsync;
export const _decodeAsync = root.decodeAsync;
export const _safeDecodeAsync = root.safeDecodeAsync;

export const _string = (..._args: unknown[]) => root.string();
export const _number = (..._args: unknown[]) => root.number();
export const _boolean = (..._args: unknown[]) => root.boolean();
export const _bigint = (..._args: unknown[]) => root.bigint();
export const _symbol = (..._args: unknown[]) => root.symbol();
export const _undefined = (..._args: unknown[]) => root.undefined();
export const _null = (..._args: unknown[]) => root.null();
export const _any = (..._args: unknown[]) => root.any();
export const _unknown = (..._args: unknown[]) => root.unknown();
export const _never = (..._args: unknown[]) => root.never();
export const _void = (..._args: unknown[]) => root.void();
export const _date = (..._args: unknown[]) => root.date();
export const _array = (...args: unknown[]) => root.array(schemaArg(args));
export const _object = (...args: unknown[]) => root.object(valueArg<Record<string, AnySchema>>(args));
export const _union = (...args: unknown[]) => root.union(...schemaArrayArg(args));
export const _intersection = (...args: unknown[]) => root.intersection(schemaArg(args), schemaArg(args, 1));
export const _tuple = (...args: unknown[]) => root.tuple(...schemaArrayArg(args));
export const _record = (...args: unknown[]) => root.record(schemaArg(args, hasClassArg(args) ? 1 : 0));
export const _map = (...args: unknown[]) => root.map(schemaArg(args), schemaArg(args, 1));
export const _set = (...args: unknown[]) => root.set(schemaArg(args));
export const _enum = (...args: unknown[]) => {
  const values = valueArg<unknown>(args);
  if (Array.isArray(values)) {
    return root.enum(...values as [string | number, ...(string | number)[]]);
  }
  return root.nativeEnum(values as Record<string, string | number>);
};
export const _nativeEnum = (...args: unknown[]) => root.nativeEnum(valueArg<Record<string, string | number>>(args));
export const _literal = (...args: unknown[]) => root.literal(valueArg<any>(args));
export const _file = (..._args: unknown[]) => root.file();
export const _lazy = (...args: unknown[]) => root.lazy(valueArg<() => AnySchema>(args));
export const _promise = (...args: unknown[]) => root.promise(schemaArg(args));
export const _optional = (...args: unknown[]) => root.optional(schemaArg(args));
export const _nullable = (...args: unknown[]) => root.nullable(schemaArg(args));
export const _nonoptional = (...args: unknown[]) => root.nonoptional(schemaArg(args));
export const _readonly = (...args: unknown[]) => root.readonly(schemaArg(args));
export const _templateLiteral = (...args: unknown[]) => root.templateLiteral(...schemaArrayArg(args));
export const _stringbool = (...args: unknown[]) => root.stringbool(valueArg<any>(args));
export const _nan = (..._args: unknown[]) => root.nan();

export const _email = root.email;
export const _guid = root.guid;
export const _uuid = root.uuid;
export const _uuidv4 = root.uuidv4;
export const _uuidv6 = root.uuidv6;
export const _uuidv7 = root.uuidv7;
export const _url = root.url;
export const _emoji = root.emoji;
export const _nanoid = root.nanoid;
export const _cuid = root.cuid;
export const _cuid2 = root.cuid2;
export const _ulid = root.ulid;
export const _xid = root.xid;
export const _ksuid = root.ksuid;
export const _ipv4 = root.ipv4;
export const _ipv6 = root.ipv6;
export const _cidrv4 = root.cidrv4;
export const _cidrv6 = root.cidrv6;
export const _base64 = root.base64;
export const _base64url = root.base64url;
export const _e164 = root.e164;
export const _jwt = root.jwt;
export const _isoDateTime = root.iso.dateTime;
export const _isoDate = root.iso.date;
export const _isoTime = root.iso.time;
export const _isoDuration = root.iso.duration;
export const _mac = root.mac;
export const _mime = root.mime;
export const _stringFormat = root.stringFormat;

export const _min = (value: number, params?: Params) => root.number().min(value, messageFromParams(params));
export const _max = (value: number, params?: Params) => root.number().max(value, messageFromParams(params));
export const _gt = (value: number, params?: Params) => root.number().gt(value, messageFromParams(params));
export const _gte = (value: number, params?: Params) => root.number().gte(value, messageFromParams(params));
export const _lt = (value: number, params?: Params) => root.number().lt(value, messageFromParams(params));
export const _lte = (value: number, params?: Params) => root.number().lte(value, messageFromParams(params));
export const _int = root.int;
export const _int32 = root.int32;
export const _uint32 = root.uint32;
export const _int64 = root.int64;
export const _uint64 = root.uint64;
export const _float32 = root.float32;
export const _float64 = root.float64;
export const _positive = root.positive;
export const _negative = root.negative;
export const _nonpositive = root.nonpositive;
export const _nonnegative = root.nonnegative;
export const _multipleOf = root.multipleOf;

export const _minLength = root.minLength;
export const _maxLength = root.maxLength;
export const _length = root.length;
export const _size = root.size;
export const _minSize = root.minSize;
export const _maxSize = root.maxSize;
export const _regex = root.regex;
export const _startsWith = root.startsWith;
export const _endsWith = root.endsWith;
export const _includes = root.includes;
export const _lowercase = root.lowercase;
export const _uppercase = root.uppercase;
export const _trim = root.trim;
export const _normalize = root.normalize;
export const _slugify = root.slugify;
export const _toLowerCase = root.toLowerCase;
export const _toUpperCase = root.toUpperCase;

export const _check = (...args: unknown[]) => root.check(valueArg<any>(args));
export const _custom = (...args: unknown[]) => root.custom(valueArg<any>(args));
export const _refine = (...args: unknown[]) => root.refine(valueArg<any>(args), valueArg<any>(args, 1));
export const _superRefine = (...args: unknown[]) => root.superRefine(schemaArg(args), valueArg<any>(args, 1));
export const _transform = (...args: unknown[]) => root.transform(valueArg<any>(args));
export const _overwrite = (...args: unknown[]) => root.overwrite(valueArg<any>(args));
export const _pipe = (...args: unknown[]) => root.pipe(schemaArg(args), schemaArg(args, 1));
export const _catch = (...args: unknown[]) => root.catch(schemaArg(args), valueArg<any>(args, 1));
export const _success = (...args: unknown[]) => root.success(valueArg<any>(args));
export const _property = (...args: unknown[]) => root.property(valueArg<any>(args), schemaArg(args, 1), valueArg<any>(args, 2));
export const _coercedString = root.coerce.string;
export const _coercedNumber = root.coerce.number;
export const _coercedBoolean = root.coerce.boolean;
export const _coercedBigint = root.coerce.bigint;
export const _coercedDate = root.coerce.date;
export const _codec = (...args: unknown[]) => root.codec(schemaArg(args), schemaArg(args, 1), valueArg<any>(args, 2));
export const _function = (..._args: unknown[]) => root.function();
export const _discriminatedUnion = (...args: unknown[]) => root.discriminatedUnion(valueArg<any>(args), ...schemaArrayArg(args, 1));
export const _xor = (...args: unknown[]) => root.xor(...schemaArrayArg(args));

export const createToJSONSchemaMethod = () => root.toJSONSchema;
export const createStandardJSONSchemaMethod = () => root.toJSONSchema;
export const extractDefs = () => ({});
export const finalize = (schema: unknown) => schema;
export const initializeContext = () => ({});
export const process = (schema: unknown) => schema;
export const toDotPath = (path: readonly (string | number)[]) => path.map(String).join('.');
export const isValidBase64 = (value: string) => root.base64().safeParse(value).success;
export const isValidBase64URL = (value: string) => root.base64url().safeParse(value).success;
export const isValidJWT = (value: string) => root.jwt().safeParse(value).success;
export const _checkInternal = unsupportedCoreFactory('_checkInternal');
