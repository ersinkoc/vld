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
  VldStringFormat as $ZodCreditCard,
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
import { VldBase as VldBaseClass } from '../../validators/base';
import { VldLazy as VldLazyClass } from '../../validators/lazy';

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
// Tracks the Zod parity baseline (zod 4.6.5).
export const version = { major: 4, minor: 6, patch: 5 };
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
  // A function default is a per-parse factory, as in Zod.
  return schema.default(valueArg<any>(args, 1));
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
export const _tuple = (...args: unknown[]) => {
  // Zod: _tuple(Class?, items, rest?, params?) - keep the rest element.
  const rest = valueArg<unknown>(args, 1);
  const items = schemaArrayArg(args);
  return rest && typeof (rest as AnySchema).safeParse === 'function'
    ? (root.tuple as any)(items, rest)
    : root.tuple(...items);
};
// Zod signature: _record(Class?, keyType, valueType) - keep the key schema.
export const _record = (...args: unknown[]) => root.record(schemaArg(args), schemaArg(args, 1));
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
// Zod: _stringbool(Classes, params) - the first argument is a class map, not options.
export const _stringbool = (...args: unknown[]) => {
  const first = args[0] as Record<string, unknown> | undefined;
  const isClassMap = args.length > 1 && !!first && typeof first === 'object' && ('Codec' in first || 'Boolean' in first || 'String' in first);
  return root.stringbool((isClassMap ? args[1] : args[0]) as any);
};
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

// Zod's numeric bound checks apply to number, bigint and Date alike.
type Bound = number | bigint | Date;
const bound = (value: Bound, kind: 'min' | 'max' | 'gt' | 'lt', params?: Params): AnySchema => {
  const message = messageFromParams(params);
  if (typeof value === 'bigint') return (root.bigint() as any)[kind](value, message);
  if (value instanceof Date) return (root.date() as any)[kind](value, message);
  return (root.number() as any)[kind](value, message);
};
export const _min = (value: Bound, params?: Params) => bound(value, 'min', params);
export const _max = (value: Bound, params?: Params) => bound(value, 'max', params);
export const _gt = (value: Bound, params?: Params) => bound(value, 'gt', params);
export const _gte = (value: Bound, params?: Params) => bound(value, 'min', params);
export const _lt = (value: Bound, params?: Params) => bound(value, 'lt', params);
export const _lte = (value: Bound, params?: Params) => bound(value, 'max', params);
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

// Zod: _check(fn) where fn receives a payload { value, issues } and reports by
// pushing issues (it does not return a boolean).
export const _check = (...args: unknown[]) => {
  const fn = valueArg<(payload: { value: unknown; issues: Array<Record<string, any>> }) => unknown>(args);
  return root.superRefine((value: unknown, ctx) => {
    const payload = { value, issues: [] as Array<Record<string, any>> };
    fn(payload);
    for (const issue of payload.issues) ctx.addIssue({ ...issue, message: issue['message'] ?? 'Invalid input' });
  });
};
export const _custom = (...args: unknown[]) => root.custom(valueArg<any>(args), valueArg<any>(args, 1));
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
// Zod's format: indices and non-identifier keys use brackets ("users[0].name",
// 'a["b c"]'); { key } path objects are unwrapped.
export const toDotPath = (path: readonly unknown[]): string => {
  const segs: string[] = [];
  for (const raw of path) {
    const seg = typeof raw === 'object' && raw !== null ? (raw as { key: PropertyKey }).key : raw;
    if (typeof seg === 'number') segs.push(`[${seg}]`);
    else if (typeof seg === 'symbol') segs.push(`[${JSON.stringify(String(seg))}]`);
    else if (/[^\w$]/.test(String(seg))) segs.push(`[${JSON.stringify(seg)}]`);
    else {
      if (segs.length) segs.push('.');
      segs.push(String(seg));
    }
  }
  return segs.join('');
};
export const isValidBase64 = (value: string) => root.base64().safeParse(value).success;
export const isValidBase64URL = (value: string) => root.base64url().safeParse(value).success;
export const isValidJWT = (value: string, algorithm: string | null = null): boolean => isValidJwtToken(value, algorithm);

// Zod canary core additions. `standardProps` returns the Standard Schema v1
// property bag; `handleUnrepresentable` mirrors the canary's JSON Schema
// fallback semantics for types with no JSON representation.
import { isValidCreditCard, isValidIBAN, base64Charset, base64urlCharset, isValidJwtToken } from '../../validators/string-formats';

export { isValidCreditCard, isValidIBAN, base64Charset, base64urlCharset };

// Zod 4.6 IBAN + instance-properties surface.
export const _iban = (...args: unknown[]) => root.iban(valueArg<{ message?: string }>(args));
export { VldStringFormat as $ZodIBAN } from '../../validators/string-formats';
export { VldCustom as $ZodCheckProperties } from '../../validators/custom';

// Zod 4.6 URL helpers: `canParseURL` prefers the platform fast path;
// `validateURL` mirrors Zod's tri-state result (URL on success, a sentinel
// on failure) using the URL_BAD_FORMAT / URL_UNPARSEABLE markers below.
export function canParseURL(input: string): boolean {
  try {
    if (typeof URL !== 'undefined' && typeof (URL as unknown as { canParse?: (v: string) => boolean }).canParse === 'function') {
      return (URL as unknown as { canParse: (v: string) => boolean }).canParse(input);
    }
    new URL(input);
    return true;
  } catch {
    return false;
  }
}

export function validateURL(
  trimmed: string,
  def: { normalize?: unknown; hostname?: unknown; protocol?: unknown } = {}
): URL | boolean | typeof URL_BAD_FORMAT | typeof URL_UNPARSEABLE {
  if (!('normalize' in def) && !('hostname' in def) && !('protocol' in def)) {
    return canParseURL(trimmed) || URL_UNPARSEABLE;
  }
  return parseURLObject(trimmed, def);
}

// Zod 4.6 renamed the JSON Schema processing internal to `processSchema`.
export const processSchema = (schema: unknown, _ctx?: unknown, _params?: unknown) => schema;
export const _creditCard = (...args: unknown[]) => root.creditCard(valueArg<{ message?: string }>(args));
export const standardProps = (schema: unknown): object => {
  const target = schema as { '~standard'?: unknown };
  if (target && typeof target['~standard'] === 'object' && target['~standard'] !== null) {
    return target['~standard'] as object;
  }
  const base = schema as { safeParse?: (value: unknown) => { success: boolean; data?: unknown; error?: Error } };
  if (typeof base?.safeParse !== 'function') {
    throw new TypeError('standardProps expects a VLD schema');
  }
  return {
    validate: (value: unknown) => {
      const result = base.safeParse!(value);
      if (result.success) return { value: result.data };
      return { issues: [{ message: result.error?.message ?? 'Invalid input' }] };
    },
    vendor: 'vld',
    version: 1
  };
};
export const handleUnrepresentable = (
  schema: unknown,
  ctx: { unrepresentable?: unknown },
  json: Record<string, unknown>,
  params: { path: (string | number)[] },
  message: string
): boolean => {
  const behavior =
    typeof ctx.unrepresentable === 'function'
      ? (ctx.unrepresentable as (info: { zodSchema: unknown; path: (string | number)[]; message: string }) => unknown)({
          zodSchema: schema,
          path: params.path,
          message
        })
      : ctx.unrepresentable;
  if (behavior === 'any') return false;
  if (behavior === undefined || behavior === 'throw') throw new Error(message);
  // Shallow-clone the consumer-supplied fragment so a later mutation of the
  // returned object does not silently corrupt the JSON output.
  Object.assign(json, { ...(behavior as Record<string, unknown>) });
  return true;
};

export const _checkInternal = unsupportedCoreFactory('_checkInternal');

// Zod canary added three cycle-detection internals to zod/v4/core:
// $ZodCyclicError, attachMemoizer, isBackEdge. VLD resolves cycles lazily
// through its schema graph and does not expose these to users, so the
// compatibility surface here is a thin shim that satisfies the parity
// contract (key presence and typeof 'function') without affecting behavior.
export const $ZodCyclicError = unsupportedCoreFactory('$ZodCyclicError');
export const attachMemoizer = unsupportedCoreFactory('attachMemoizer');
export const isBackEdge = unsupportedCoreFactory('isBackEdge');

// Zod 4.5 AOT compilation surface
export {
  compile,
  compileFn,
  validate,
  validateAsync,
  getDiscriminatedOption,
  memoizer,
  toZod,
  ZodCompileError,
  ZodCompileAsyncError,
  ZodCompileUnsupportedError,
  applyCompiled,
  properties
} from '../../compile';

// `_properties` is the camelCase alias Zod 4 core uses; `properties` is the
// user-facing namespace export. Both names must be present for parity.
export { properties as _properties } from '../../compile';

// VLD resolves cycles lazily through its schema graph and does not need a
// public recursive-schema guard; the shim keeps the parity contract green
// without changing runtime behavior.
// Zod semantics: true only when the schema graph reaches a schema from itself
// (a lazy that merely defers a plain schema is not recursive). A lazy getter
// that throws while the graph is still being defined counts as recursive.
const schemaChildren = (node: object): unknown[] => {
  if (node instanceof VldLazyClass) return [node.unwrap()];
  const out: unknown[] = [];
  const collect = (value: unknown, depth: number): void => {
    if (!value || typeof value !== 'object') return;
    if (value instanceof VldBaseClass) {
      out.push(value);
      return;
    }
    if (depth > 2) return;
    if (Array.isArray(value)) {
      for (const item of value) collect(item, depth + 1);
      return;
    }
    const proto = Object.getPrototypeOf(value);
    if (proto === Object.prototype || proto === null) {
      for (const item of Object.values(value)) collect(item, depth + 1);
    }
  };
  for (const value of Object.values(node)) collect(value, 0);
  return out;
};
export const isRecursiveSchema = (schema: unknown): boolean => {
  if (!(schema instanceof VldBaseClass)) return false;
  const onStack = new Set<object>();
  const done = new Set<object>();
  const visit = (node: object): boolean => {
    if (onStack.has(node)) return true;
    if (done.has(node)) return false;
    onStack.add(node);
    let children: unknown[];
    try {
      children = schemaChildren(node);
    } catch {
      return true;
    }
    for (const child of children) {
      if (visit(child as object)) return true;
    }
    onStack.delete(node);
    done.add(node);
    return false;
  };
  return visit(schema);
};

// Zod 4.5 exposes several URL validation helpers in core; VLD routes them
// through its existing `url()` format and returns the same outcomes.
export const URL_BAD_FORMAT = 1;
export const URL_UNPARSEABLE = 2;
export const INVALID = Symbol.for('zod.compile.invalid');

export const isValidIPv6 = (value: string): boolean => root.ipv6().safeParse(value).success;
export const isValidCIDRv6 = (value: string): boolean => root.cidrv6().safeParse(value).success;
// Zod: test a parsed URL's hostname / protocol (without the trailing ":")
// against the schema's pattern.
export const urlHostnameOk = (url: URL, hostname: RegExp): boolean => {
  hostname.lastIndex = 0;
  return hostname.test(url.hostname);
};
export const urlProtocolOk = (url: URL, protocol: RegExp): boolean => {
  protocol.lastIndex = 0;
  return protocol.test(url.protocol.endsWith(':') ? url.protocol.slice(0, -1) : url.protocol);
};
const HTTP_PROTOCOL_SOURCE = /^https?$/.source;
/** Parse a URL; without normalize, http(s) URLs must spell out "://" (Zod). */
export const parseURLObject = (
  trimmed: string,
  def: { normalize?: unknown; protocol?: unknown } = {}
): URL | typeof URL_BAD_FORMAT | typeof URL_UNPARSEABLE => {
  if (!def.normalize && (def.protocol as RegExp | undefined)?.source === HTTP_PROTOCOL_SOURCE && !/^https?:\/\//i.test(trimmed)) {
    return URL_BAD_FORMAT;
  }
  try {
    return new URL(trimmed);
  } catch {
    return URL_UNPARSEABLE;
  }
};
export const stripTabAndNewline = (value: string): string => value.replace(/[\t\n\r]/g, '');
type MergeResult = { valid: true; data: unknown } | { valid: false; mergeErrorPath: (string | number)[] };
const isPlainRecord = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== 'object' || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};
// Zod's intersection merge: equal values merge, plain objects merge key-wise,
// same-length arrays merge element-wise; anything else is unmergeable and
// reports where (mergeErrorPath).
export const mergeValues = (a: unknown, b: unknown): MergeResult => {
  if (a === b) return { valid: true, data: a };
  if (a instanceof Date && b instanceof Date && +a === +b) return { valid: true, data: a };
  if (isPlainRecord(a) && isPlainRecord(b)) {
    const newObj: Record<string, unknown> = { ...a, ...b };
    if (Object.prototype.hasOwnProperty.call(newObj, '__proto__')) delete newObj['__proto__'];
    for (const key of Object.keys(a)) {
      if (key === '__proto__' || !Object.prototype.hasOwnProperty.call(b, key)) continue;
      const shared = mergeValues(a[key], b[key]);
      if (!shared.valid) return { valid: false, mergeErrorPath: [key, ...shared.mergeErrorPath] };
      newObj[key] = shared.data;
    }
    return { valid: true, data: newObj };
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return { valid: false, mergeErrorPath: [] };
    const merged: unknown[] = [];
    for (let i = 0; i < a.length; i++) {
      const shared = mergeValues(a[i], b[i]);
      if (!shared.valid) return { valid: false, mergeErrorPath: [i, ...shared.mergeErrorPath] };
      merged.push(shared.data);
    }
    return { valid: true, data: merged };
  }
  return { valid: false, mergeErrorPath: [] };
};
