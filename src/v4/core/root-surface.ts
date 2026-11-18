/**
 * Root `v.core`: every name Zod exposes on `z.core`.
 *
 * Zod publishes its core as a separate subpath. VLD also puts it on the root
 * namespace, and the root entry has to stay tree-shakeable, so this module is a
 * plain object of **getters**: nothing is imported eagerly, nothing runs at
 * module scope, and every name is resolved from the root `v` namespace only when
 * it is read. A bundle that never touches `v.core` drops this module and
 * everything it references (`npm run verify:bundle` measures that).
 */
import { v } from '../../index';

type AnyApi = Record<string, any>;

/** Root exports the helpers below resolve (kept explicit so access stays static). */
interface HelperApi {
  bigint: () => any;
  date: () => any;
  number: () => any;
  base64: () => any;
  base64url: () => any;
  ipv6: () => any;
  cidrv6: () => any;
  creditCard: () => any;
  iban: () => any;
  jwt: (options?: unknown) => any;
  ZodType: new () => object;
  ZodLazy: new () => { unwrap(): unknown };
  toJSONSchema: unknown;
}

/**
 * Zod internals VLD does not model, kept as documented placeholders so the
 * parity contract (name present, value defined) holds without pretending the
 * behavior exists:
 *
 * - `$ZodCheck*` (19 names): marker classes, all the single `ZodCheck` below.
 *   VLD models checks as validator methods instead of standalone check objects.
 * - `$ZodAsyncError` / `$ZodEncodeError`: `Error` subclasses narrowed to
 *   `ZodErrorLike`; taking `Error` as the type would publish
 *   `captureStackTrace`/`prepareStackTrace` and drag `NodeJS.CallSite` into
 *   every consumer's type check.
 * - `$ZodCyclicError`, `isBackEdge`: throwing stubs (VLD resolves cycles lazily
 *   and never needs to detect a back edge).
 * - `Doc`, `JSONSchema`, `JSONSchemaGenerator`, `globalConfig`, `version`,
 *   `URL_BAD_FORMAT`, `URL_UNPARSEABLE`, `$constructor`, `base64Charset`,
 *   `base64urlCharset`: data and constant placeholders. `version` tracks the
 *   parity baseline (`zod@4.6.7`), not whichever copy a consumer installed.
 * - `initializeContext`, `extractDefs`, `process`, `processSchema`, `finalize`:
 *   pass-throughs; VLD renders JSON Schema straight through `toJSONSchema`.
 */
export interface ZodErrorLike {
  new (message?: string): { name: string; message: string; stack?: string };
}
class ZodCheck {}
const ZodAsyncError = class extends Error {} as unknown as ZodErrorLike;
const ZodEncodeError = class extends Error {} as unknown as ZodErrorLike;
class EmptyDoc {}
const EMPTY_JSON_SCHEMA: Record<string, never> = Object.freeze({});
const GLOBAL_CONFIG: Record<string, never> = Object.freeze({});
const VERSION = { major: 4, minor: 6, patch: 7 };
const URL_BAD_FORMAT = 1;
const URL_UNPARSEABLE = 2;
// Zod publishes these as the patterns its base64 formats use, not as alphabets.
const BASE64_CHARSET = /^[0-9a-zA-Z+/]*={0,2}$/;
const BASE64URL_CHARSET = /^[A-Za-z0-9_-]*$/;

const unsupported = (name: string) => (): never => {
  throw new Error(`${name} is an internal Zod core compatibility placeholder`);
};

const constructorShim = (name: string, initializer?: (instance: unknown, def: unknown) => void) =>
  class {
    constructor(def?: unknown) {
      Object.defineProperty(this, '_zod', { value: { def }, enumerable: false });
      initializer?.(this, def);
    }
    static displayName = name;
  };

const api = () => v as unknown as HelperApi;

type Bound = number | bigint | Date;
type Params = string | { message?: string; error?: string };

/** Zod's bound checks apply to number, bigint and Date alike. */
const bound = (value: Bound, kind: 'min' | 'max' | 'gt' | 'lt', params?: Params): unknown => {
  const source = api();
  const message = typeof params === 'string' ? params : params?.message || params?.error;
  if (typeof value === 'bigint') return source.bigint()[kind](value, message);
  if (value instanceof Date) return source.date()[kind](value, message);
  return source.number()[kind](value, message);
};

const min = (value: Bound, params?: Params) => bound(value, 'min', params);
const max = (value: Bound, params?: Params) => bound(value, 'max', params);
const gt = (value: Bound, params?: Params) => bound(value, 'gt', params);
const lt = (value: Bound, params?: Params) => bound(value, 'lt', params);
const toJSONSchemaMethod = () => api().toJSONSchema;

/** Zod's JSON Schema pipeline entry points; VLD renders through `toJSONSchema`
 * directly and has no context/definition pass, so these are pass-throughs. */
const initializeContext = () => ({});
const extractDefs = () => ({});
const processSchema = (schema: unknown) => schema;
const process = (schema: unknown) => schema;
const finalize = (schema: unknown) => schema;

/** Zod's path rendering: indices and non-identifier keys use brackets. */
const toDotPath = (path: readonly unknown[]): string => {
  const segments: string[] = [];
  for (const raw of path) {
    const segment = typeof raw === 'object' && raw !== null ? (raw as { key: PropertyKey }).key : raw;
    if (typeof segment === 'number') segments.push(`[${segment}]`);
    else if (typeof segment === 'symbol') segments.push(`[${JSON.stringify(String(segment))}]`);
    else if (/[^\w$]/.test(String(segment))) segments.push(`[${JSON.stringify(segment)}]`);
    else {
      if (segments.length) segments.push('.');
      segments.push(String(segment));
    }
  }
  return segments.join('');
};

const isPlainRecord = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== 'object' || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

/** Zod's intersection merge: equal values, plain records and equal-length arrays. */
const mergeValues = (
  a: unknown,
  b: unknown
): { valid: true; data: unknown } | { valid: false; mergeErrorPath: (string | number)[] } => {
  if (a === b) return { valid: true, data: a };
  if (a instanceof Date && b instanceof Date && +a === +b) return { valid: true, data: a };
  if (isPlainRecord(a) && isPlainRecord(b)) {
    const merged: Record<string, unknown> = { ...a, ...b };
    delete merged['__proto__'];
    for (const key of Object.keys(a)) {
      if (key === '__proto__' || !Object.prototype.hasOwnProperty.call(b, key)) continue;
      const shared = mergeValues(a[key], b[key]);
      if (!shared.valid) return { valid: false, mergeErrorPath: [key, ...shared.mergeErrorPath] };
      merged[key] = shared.data;
    }
    return { valid: true, data: merged };
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

/** A schema's Standard Schema property bag. */
const standardProps = (schema: unknown): object => {
  const target = schema as { '~standard'?: unknown; safeParse?: (value: unknown) => any };
  if (target?.['~standard'] && typeof target['~standard'] === 'object') return target['~standard'] as object;
  if (typeof target?.safeParse !== 'function') throw new TypeError('standardProps expects a VLD schema');
  return {
    validate: (value: unknown) => {
      const result = target.safeParse!(value);
      return result.success
        ? { value: result.data }
        : { issues: [{ message: result.error?.message ?? 'Invalid input' }] };
    },
    vendor: 'vld',
    version: 1
  };
};

const HTTP_PROTOCOL_SOURCE = /^https?$/.source;

const canParseURL = (input: string): boolean => {
  try {
    const Url = URL as unknown as { canParse?: (value: string) => boolean };
    if (typeof Url.canParse === 'function') return Url.canParse(input);
    new URL(input);
    return true;
  } catch {
    return false;
  }
};

const parseURLObject = (trimmed: string, def: { normalize?: unknown; protocol?: RegExp } = {}): URL | number => {
  if (!def.normalize && def.protocol?.source === HTTP_PROTOCOL_SOURCE && !/^https?:\/\//i.test(trimmed)) {
    return URL_BAD_FORMAT;
  }
  try {
    return new URL(trimmed);
  } catch {
    return URL_UNPARSEABLE;
  }
};

const validateURL = (
  trimmed: string,
  def: { normalize?: unknown; hostname?: RegExp; protocol?: RegExp } = {}
): URL | boolean | number =>
  'normalize' in def || 'hostname' in def || 'protocol' in def
    ? parseURLObject(trimmed, def)
    : canParseURL(trimmed) || URL_UNPARSEABLE;

const urlHostnameOk = (url: URL, hostname: RegExp): boolean => {
  hostname.lastIndex = 0;
  return hostname.test(url.hostname);
};

const urlProtocolOk = (url: URL, protocol: RegExp): boolean => {
  protocol.lastIndex = 0;
  const value = url.protocol.endsWith(':') ? url.protocol.slice(0, -1) : url.protocol;
  return protocol.test(value);
};

const stripTabAndNewline = (value: string): string => value.replace(/[\t\n\r]/g, '');

const isValidBase64 = (value: string): boolean => api().base64().safeParse(value).success;
const isValidBase64URL = (value: string): boolean => api().base64url().safeParse(value).success;
const isValidIPv6 = (value: string): boolean => api().ipv6().safeParse(value).success;
const isValidCIDRv6 = (value: string): boolean => api().cidrv6().safeParse(value).success;
const isValidCreditCard = (value: string): boolean => api().creditCard().safeParse(value).success;
const isValidIBAN = (value: string): boolean => api().iban().safeParse(value).success;
const isValidJWT = (value: string, algorithm: string | null = null): boolean =>
  api().jwt(algorithm ? { alg: algorithm } : undefined).safeParse(value).success;

/** Zod's JSON Schema escape hatch for values it cannot represent. */
const handleUnrepresentable = (
  schema: unknown,
  ctx: { unrepresentable?: unknown },
  json: Record<string, unknown>,
  params: { path: (string | number)[] },
  message: string
): boolean => {
  const behavior =
    typeof ctx.unrepresentable === 'function'
      ? (ctx.unrepresentable as (info: unknown) => unknown)({ zodSchema: schema, path: params.path, message })
      : ctx.unrepresentable;
  if (behavior === 'any') return false;
  if (behavior === undefined || behavior === 'throw') throw new Error(message);
  Object.assign(json, behavior as Record<string, unknown>);
  return true;
};

/** True only when the schema graph leads from the schema back to itself. */
const isRecursiveSchema = (schema: unknown): boolean => {
  const source = api();
  const Type = source.ZodType;
  if (!Type || !(schema instanceof Type)) return false;

  /** Schemas reachable from `node` in one or two property steps. */
  const childrenOf = (node: object): unknown[] => {
    const Lazy = source.ZodLazy;
    if (Lazy && node instanceof Lazy) {
      // A throwing getter means the target is still being defined; the caller
      // counts that as a cycle, as the `v4/core` helper and Zod do.
      return [(node as unknown as { unwrap(): unknown }).unwrap()];
    }
    const out: unknown[] = [];
    const collect = (value: unknown, depth: number): void => {
      if (!value || typeof value !== 'object' || depth > 2) return;
      if (value instanceof (Type as unknown as new () => object)) {
        out.push(value);
        return;
      }
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

  const onStack = new Set<object>();
  const done = new Set<object>();
  const visit = (node: object): boolean => {
    if (onStack.has(node)) return true;
    if (done.has(node)) return false;
    onStack.add(node);
    let children: unknown[];
    try {
      children = childrenOf(node);
    } catch {
      // A getter that throws while its target is still being defined means the
      // schema is part of its own graph (Zod and the `v4/core` helper agree).
      return true;
    }
    for (const child of children) {
      if (visit(child as object)) return true;
    }
    onStack.delete(node);
    done.add(node);
    return false;
  };
  return visit(schema as object);
};


/**
 * Zod call-shape adapters for the `_*` factories.
 *
 * Zod's core factories accept an optional leading class argument
 * (`_array($ZodArray, schema)`); the root factories take the schema directly.
 * These adapters normalize that optional class so `v.core._array` behaves like
 * `v4/core._array` in both call forms. Each one still reaches its factory
 * through a static `v.*` access, so an unused `v.core` stays tree-shakeable.
 */
type Any = any;
type CoreArgs = unknown[];
const hasClassArg = (args: CoreArgs): boolean => typeof args[0] === 'function' && args.length > 1;
const schemaArg = (args: CoreArgs, index = 0): Any => args[hasClassArg(args) ? index + 1 : index];
const valueArg = <T>(args: CoreArgs, index = 0): T => args[hasClassArg(args) ? index + 1 : index] as T;
const schemaArrayArg = (args: CoreArgs, index = 0): Any[] => {
  const value = valueArg<unknown>(args, index);
  return Array.isArray(value) ? (value as Any[]) : (args.slice(index) as Any[]);
};

const adapterDefault = (...args: CoreArgs) => (schemaArg(args) as Any).default(valueArg(args, 1));
const adapterString = () => (v as unknown as AnyApi)['string']();
const adapterNumber = () => (v as unknown as AnyApi)['number']();
const adapterBoolean = () => (v as unknown as AnyApi)['boolean']();
const adapterBigint = () => (v as unknown as AnyApi)['bigint']();
const adapterSymbol = () => (v as unknown as AnyApi)['symbol']();
const adapterUndefined = () => (v as unknown as AnyApi)['undefined']();
const adapterNull = () => (v as unknown as AnyApi)['null']();
const adapterAny = () => (v as unknown as AnyApi)['any']();
const adapterUnknown = () => (v as unknown as AnyApi)['unknown']();
const adapterNever = () => (v as unknown as AnyApi)['never']();
const adapterVoid = () => (v as unknown as AnyApi)['void']();
const adapterDate = () => (v as unknown as AnyApi)['date']();
const adapterFile = () => (v as unknown as AnyApi)['file']();
const adapterNan = () => (v as unknown as AnyApi)['nan']();
const adapterArray = (...args: CoreArgs) => (v as unknown as AnyApi)['array'](schemaArg(args));
const adapterUnion = (...args: CoreArgs) => (v as unknown as AnyApi)['union'](...schemaArrayArg(args));
const adapterIntersection = (...args: CoreArgs) =>
  (v as unknown as AnyApi)['intersection'](schemaArg(args), schemaArg(args, 1));
const adapterTuple = (...args: CoreArgs) => {
  const rest = valueArg<unknown>(args, 1);
  const items = schemaArrayArg(args);
  const tuple = (v as unknown as AnyApi)['tuple'];
  return rest && typeof (rest as Any).safeParse === 'function' ? tuple(items, rest) : tuple(...items);
};
const adapterRecord = (...args: CoreArgs) => (v as unknown as AnyApi)['record'](schemaArg(args), schemaArg(args, 1));
const adapterMap = (...args: CoreArgs) => (v as unknown as AnyApi)['map'](schemaArg(args), schemaArg(args, 1));
const adapterSet = (...args: CoreArgs) => (v as unknown as AnyApi)['set'](schemaArg(args));
const adapterEnum = (...args: CoreArgs) => {
  const values = valueArg<unknown>(args);
  const api = v as unknown as AnyApi;
  return Array.isArray(values) ? api['enum'](...(values as Any[])) : api['nativeEnum'](values);
};
const adapterNativeEnum = (...args: CoreArgs) => (v as unknown as AnyApi)['nativeEnum'](valueArg(args));
const adapterLiteral = (...args: CoreArgs) => (v as unknown as AnyApi)['literal'](valueArg(args));
const adapterLazy = (...args: CoreArgs) => (v as unknown as AnyApi)['lazy'](valueArg(args));
const adapterPromise = (...args: CoreArgs) => (v as unknown as AnyApi)['promise'](schemaArg(args));
const adapterOptional = (...args: CoreArgs) => (v as unknown as AnyApi)['optional'](schemaArg(args));
const adapterNullable = (...args: CoreArgs) => (v as unknown as AnyApi)['nullable'](schemaArg(args));
const adapterNonOptional = (...args: CoreArgs) => (v as unknown as AnyApi)['nonoptional'](schemaArg(args));
const adapterReadonly = (...args: CoreArgs) => (v as unknown as AnyApi)['readonly'](schemaArg(args));
const adapterTemplateLiteral = (...args: CoreArgs) =>
  (v as unknown as AnyApi)['templateLiteral'](...schemaArrayArg(args));
const adapterStringbool = (...args: CoreArgs) => {
  // Zod: `_stringbool(Classes, params)` - a leading class map is not options.
  const first = args[0] as Record<string, unknown> | undefined;
  const isClassMap =
    args.length > 1 && !!first && typeof first === 'object' && ('Codec' in first || 'Boolean' in first || 'String' in first);
  return (v as unknown as AnyApi)['stringbool'](isClassMap ? args[1] : args[0]);
};
const adapterCheck = (...args: CoreArgs) => {
  // Zod: the callback pushes issues into a payload instead of returning a flag.
  const run = valueArg<(payload: { value: unknown; issues: Any[] }) => unknown>(args);
  return (v as unknown as AnyApi)['superRefine']((value: unknown, ctx: Any) => {
    const payload = { value, issues: [] as Any[] };
    run(payload);
    for (const issue of payload.issues) ctx.addIssue({ ...issue, message: issue?.['message'] ?? 'Invalid input' });
  });
};
const adapterCustom = (...args: CoreArgs) =>
  (v as unknown as AnyApi)['custom'](valueArg(args), valueArg(args, 1));
const adapterRefine = (...args: CoreArgs) =>
  (v as unknown as AnyApi)['refine'](valueArg(args), valueArg(args, 1));
const adapterSuperRefine = (...args: CoreArgs) =>
  (v as unknown as AnyApi)['superRefine'](schemaArg(args), valueArg(args, 1));
const adapterTransform = (...args: CoreArgs) => (v as unknown as AnyApi)['transform'](valueArg(args));
const adapterOverwrite = (...args: CoreArgs) => (v as unknown as AnyApi)['overwrite'](valueArg(args));
const adapterPipe = (...args: CoreArgs) => (v as unknown as AnyApi)['pipe'](schemaArg(args), schemaArg(args, 1));
const adapterCatch = (...args: CoreArgs) =>
  (v as unknown as AnyApi)['catch'](schemaArg(args), valueArg(args, 1));
const adapterSuccess = (...args: CoreArgs) => (v as unknown as AnyApi)['success'](valueArg(args));
const adapterProperty = (...args: CoreArgs) =>
  (v as unknown as AnyApi)['property'](valueArg(args), schemaArg(args, 1), valueArg(args, 2));
const adapterDiscriminatedUnion = (...args: CoreArgs) =>
  (v as unknown as AnyApi)['discriminatedUnion'](valueArg(args), ...schemaArrayArg(args, 1));
const adapterXor = (...args: CoreArgs) => (v as unknown as AnyApi)['xor'](...schemaArrayArg(args));
const adapterCreditCard = (...args: CoreArgs) => (v as unknown as AnyApi)['creditCard'](valueArg(args));
const adapterIban = (...args: CoreArgs) => (v as unknown as AnyApi)['iban'](valueArg(args));

/**
 * Zod's `z.core` surface for `v.core`.
 *
 * Getters keep this module side-effect free: a consumer that never reads a core
 * name drops the object and the validators it points at. Each getter spells out
 * its own static `v` access (`(v as unknown as AnyApi)['string']`); routing them
 * through one lookup helper would read as less repetition but turn every access
 * dynamic, which makes bundlers keep the whole namespace.
 */
export const rootCoreSurface = {
  get "util"() {
    return (v as unknown as AnyApi)['util'];
  },
  get "toZod"() {
    return (v as unknown as AnyApi)['toZod'];
  },
  get "regexes"() {
    return (v as unknown as AnyApi)['regexes'];
  },
  get "locales"() {
    return (v as unknown as AnyApi)['locales'];
  },
  get "toJSONSchema"() {
    return (v as unknown as AnyApi)['toJSONSchema'];
  },
  get "JSONSchemaGenerator"() {
    return EmptyDoc;
  },
  get "JSONSchema"() {
    return EMPTY_JSON_SCHEMA;
  },
  get "NEVER"() {
    return (v as unknown as AnyApi)['NEVER'];
  },
  get "$brand"() {
    return (v as unknown as AnyApi)['$brand'];
  },
  get "$ZodAsyncError"() {
    return ZodAsyncError;
  },
  get "$ZodEncodeError"() {
    return ZodEncodeError;
  },
  get "globalConfig"() {
    return GLOBAL_CONFIG;
  },
  get "$constructor"() {
    return constructorShim;
  },
  get "config"() {
    return (v as unknown as AnyApi)['config'];
  },
  get "_parse"() {
    return (v as unknown as AnyApi)['parse'];
  },
  get "parse"() {
    return (v as unknown as AnyApi)['parse'];
  },
  get "_parseAsync"() {
    return (v as unknown as AnyApi)['parseAsync'];
  },
  get "parseAsync"() {
    return (v as unknown as AnyApi)['parseAsync'];
  },
  get "_safeParse"() {
    return (v as unknown as AnyApi)['safeParse'];
  },
  get "safeParse"() {
    return (v as unknown as AnyApi)['safeParse'];
  },
  get "_safeParseAsync"() {
    return (v as unknown as AnyApi)['safeParseAsync'];
  },
  get "safeParseAsync"() {
    return (v as unknown as AnyApi)['safeParseAsync'];
  },
  get "validate"() {
    return (v as unknown as AnyApi)['validate'];
  },
  get "validateAsync"() {
    return (v as unknown as AnyApi)['validateAsync'];
  },
  get "_encode"() {
    return (v as unknown as AnyApi)['encode'];
  },
  get "encode"() {
    return (v as unknown as AnyApi)['encode'];
  },
  get "_decode"() {
    return (v as unknown as AnyApi)['decode'];
  },
  get "decode"() {
    return (v as unknown as AnyApi)['decode'];
  },
  get "_encodeAsync"() {
    return (v as unknown as AnyApi)['encodeAsync'];
  },
  get "encodeAsync"() {
    return (v as unknown as AnyApi)['encodeAsync'];
  },
  get "_decodeAsync"() {
    return (v as unknown as AnyApi)['decodeAsync'];
  },
  get "decodeAsync"() {
    return (v as unknown as AnyApi)['decodeAsync'];
  },
  get "_safeEncode"() {
    return (v as unknown as AnyApi)['safeEncode'];
  },
  get "safeEncode"() {
    return (v as unknown as AnyApi)['safeEncode'];
  },
  get "_safeDecode"() {
    return (v as unknown as AnyApi)['safeDecode'];
  },
  get "safeDecode"() {
    return (v as unknown as AnyApi)['safeDecode'];
  },
  get "_safeEncodeAsync"() {
    return (v as unknown as AnyApi)['safeEncodeAsync'];
  },
  get "safeEncodeAsync"() {
    return (v as unknown as AnyApi)['safeEncodeAsync'];
  },
  get "_safeDecodeAsync"() {
    return (v as unknown as AnyApi)['safeDecodeAsync'];
  },
  get "safeDecodeAsync"() {
    return (v as unknown as AnyApi)['safeDecodeAsync'];
  },
  get "$ZodError"() {
    return (v as unknown as AnyApi)['ZodError'];
  },
  get "$ZodRealError"() {
    return (v as unknown as AnyApi)['ZodError'];
  },
  get "flattenError"() {
    return (v as unknown as AnyApi)['flattenError'];
  },
  get "formatError"() {
    return (v as unknown as AnyApi)['formatError'];
  },
  get "treeifyError"() {
    return (v as unknown as AnyApi)['treeifyError'];
  },
  get "toDotPath"() {
    return toDotPath;
  },
  get "prettifyError"() {
    return (v as unknown as AnyApi)['prettifyError'];
  },
  get "$ZodType"() {
    return (v as unknown as AnyApi)['ZodType'];
  },
  get "clone"() {
    return (v as unknown as AnyApi)['clone'];
  },
  get "$ZodString"() {
    return (v as unknown as AnyApi)['ZodString'];
  },
  get "$ZodStringFormat"() {
    return (v as unknown as AnyApi)['ZodStringFormat'];
  },
  get "$ZodGUID"() {
    return (v as unknown as AnyApi)['ZodGUID'];
  },
  get "$ZodUUID"() {
    return (v as unknown as AnyApi)['ZodUUID'];
  },
  get "$ZodEmail"() {
    return (v as unknown as AnyApi)['ZodEmail'];
  },
  get "URL_BAD_FORMAT"() {
    return URL_BAD_FORMAT;
  },
  get "URL_UNPARSEABLE"() {
    return URL_UNPARSEABLE;
  },
  get "$ZodURL"() {
    return (v as unknown as AnyApi)['ZodURL'];
  },
  get "$ZodEmoji"() {
    return (v as unknown as AnyApi)['ZodEmoji'];
  },
  get "$ZodNanoID"() {
    return (v as unknown as AnyApi)['ZodNanoID'];
  },
  get "$ZodCUID"() {
    return (v as unknown as AnyApi)['ZodCUID'];
  },
  get "$ZodCUID2"() {
    return (v as unknown as AnyApi)['ZodCUID2'];
  },
  get "$ZodULID"() {
    return (v as unknown as AnyApi)['ZodULID'];
  },
  get "$ZodXID"() {
    return (v as unknown as AnyApi)['ZodXID'];
  },
  get "$ZodKSUID"() {
    return (v as unknown as AnyApi)['ZodKSUID'];
  },
  get "$ZodISODateTime"() {
    return (v as unknown as AnyApi)['ZodISODateTime'];
  },
  get "$ZodISODate"() {
    return (v as unknown as AnyApi)['ZodISODate'];
  },
  get "$ZodISOTime"() {
    return (v as unknown as AnyApi)['ZodISOTime'];
  },
  get "$ZodISODuration"() {
    return (v as unknown as AnyApi)['ZodISODuration'];
  },
  get "$ZodIPv4"() {
    return (v as unknown as AnyApi)['ZodIPv4'];
  },
  get "$ZodIPv6"() {
    return (v as unknown as AnyApi)['ZodIPv6'];
  },
  get "$ZodMAC"() {
    return (v as unknown as AnyApi)['ZodMAC'];
  },
  get "$ZodCIDRv4"() {
    return (v as unknown as AnyApi)['ZodCIDRv4'];
  },
  get "$ZodCIDRv6"() {
    return (v as unknown as AnyApi)['ZodCIDRv6'];
  },
  get "base64Charset"() {
    return BASE64_CHARSET;
  },
  get "$ZodBase64"() {
    return (v as unknown as AnyApi)['ZodBase64'];
  },
  get "base64urlCharset"() {
    return BASE64URL_CHARSET;
  },
  get "$ZodBase64URL"() {
    return (v as unknown as AnyApi)['ZodBase64URL'];
  },
  get "$ZodE164"() {
    return (v as unknown as AnyApi)['ZodE164'];
  },
  get "$ZodCreditCard"() {
    return (v as unknown as AnyApi)['ZodStringFormat'];
  },
  get "$ZodIBAN"() {
    return (v as unknown as AnyApi)['ZodStringFormat'];
  },
  get "$ZodJWT"() {
    return (v as unknown as AnyApi)['ZodJWT'];
  },
  get "$ZodCustomStringFormat"() {
    return (v as unknown as AnyApi)['ZodCustomStringFormat'];
  },
  get "$ZodNumber"() {
    return (v as unknown as AnyApi)['ZodNumber'];
  },
  get "$ZodNumberFormat"() {
    return (v as unknown as AnyApi)['ZodNumberFormat'];
  },
  get "$ZodBoolean"() {
    return (v as unknown as AnyApi)['ZodBoolean'];
  },
  get "$ZodBigInt"() {
    return (v as unknown as AnyApi)['ZodBigInt'];
  },
  get "$ZodBigIntFormat"() {
    return (v as unknown as AnyApi)['ZodBigIntFormat'];
  },
  get "$ZodSymbol"() {
    return (v as unknown as AnyApi)['ZodSymbol'];
  },
  get "$ZodUndefined"() {
    return (v as unknown as AnyApi)['ZodUndefined'];
  },
  get "$ZodNull"() {
    return (v as unknown as AnyApi)['ZodNull'];
  },
  get "$ZodAny"() {
    return (v as unknown as AnyApi)['ZodAny'];
  },
  get "$ZodUnknown"() {
    return (v as unknown as AnyApi)['ZodUnknown'];
  },
  get "$ZodNever"() {
    return (v as unknown as AnyApi)['ZodNever'];
  },
  get "$ZodVoid"() {
    return (v as unknown as AnyApi)['ZodVoid'];
  },
  get "$ZodDate"() {
    return (v as unknown as AnyApi)['ZodDate'];
  },
  get "$ZodArray"() {
    return (v as unknown as AnyApi)['ZodArray'];
  },
  get "$ZodObject"() {
    return (v as unknown as AnyApi)['ZodObject'];
  },
  get "$ZodObjectJIT"() {
    return (v as unknown as AnyApi)['ZodObject'];
  },
  get "$ZodUnion"() {
    return (v as unknown as AnyApi)['ZodUnion'];
  },
  get "$ZodXor"() {
    return (v as unknown as AnyApi)['ZodXor'];
  },
  get "$ZodDiscriminatedUnion"() {
    return (v as unknown as AnyApi)['ZodDiscriminatedUnion'];
  },
  get "$ZodIntersection"() {
    return (v as unknown as AnyApi)['ZodIntersection'];
  },
  get "$ZodTuple"() {
    return (v as unknown as AnyApi)['ZodTuple'];
  },
  get "$ZodRecord"() {
    return (v as unknown as AnyApi)['ZodRecord'];
  },
  get "$ZodMap"() {
    return (v as unknown as AnyApi)['ZodMap'];
  },
  get "$ZodSet"() {
    return (v as unknown as AnyApi)['ZodSet'];
  },
  get "$ZodEnum"() {
    return (v as unknown as AnyApi)['ZodEnum'];
  },
  get "$ZodLiteral"() {
    return (v as unknown as AnyApi)['ZodLiteral'];
  },
  get "$ZodFile"() {
    return (v as unknown as AnyApi)['ZodFile'];
  },
  get "$ZodTransform"() {
    return (v as unknown as AnyApi)['ZodTransform'];
  },
  get "$ZodOptional"() {
    return (v as unknown as AnyApi)['ZodOptional'];
  },
  get "$ZodExactOptional"() {
    return (v as unknown as AnyApi)['ZodExactOptional'];
  },
  get "$ZodNullable"() {
    return (v as unknown as AnyApi)['ZodNullable'];
  },
  get "$ZodDefault"() {
    return (v as unknown as AnyApi)['ZodDefault'];
  },
  get "$ZodPrefault"() {
    return (v as unknown as AnyApi)['ZodPrefault'];
  },
  get "$ZodNonOptional"() {
    return (v as unknown as AnyApi)['ZodNonOptional'];
  },
  get "$ZodSuccess"() {
    return (v as unknown as AnyApi)['ZodSuccess'];
  },
  get "$ZodCatch"() {
    return (v as unknown as AnyApi)['ZodCatch'];
  },
  get "$ZodNaN"() {
    return (v as unknown as AnyApi)['ZodNaN'];
  },
  get "$ZodPipe"() {
    return (v as unknown as AnyApi)['ZodPipe'];
  },
  get "$ZodCodec"() {
    return (v as unknown as AnyApi)['ZodCodec'];
  },
  get "$ZodPreprocess"() {
    return (v as unknown as AnyApi)['ZodPreprocess'];
  },
  get "$ZodReadonly"() {
    return (v as unknown as AnyApi)['ZodReadonly'];
  },
  get "$ZodTemplateLiteral"() {
    return (v as unknown as AnyApi)['ZodTemplateLiteral'];
  },
  get "$ZodFunction"() {
    return (v as unknown as AnyApi)['ZodFunction'];
  },
  get "$ZodPromise"() {
    return (v as unknown as AnyApi)['ZodPromise'];
  },
  get "$ZodLazy"() {
    return (v as unknown as AnyApi)['ZodLazy'];
  },
  get "$ZodCustom"() {
    return (v as unknown as AnyApi)['ZodCustom'];
  },
  get "standardProps"() {
    return standardProps;
  },
  get "canParseURL"() {
    return canParseURL;
  },
  get "validateURL"() {
    return validateURL;
  },
  get "parseURLObject"() {
    return parseURLObject;
  },
  get "stripTabAndNewline"() {
    return stripTabAndNewline;
  },
  get "urlHostnameOk"() {
    return urlHostnameOk;
  },
  get "urlProtocolOk"() {
    return urlProtocolOk;
  },
  get "isValidIPv6"() {
    return isValidIPv6;
  },
  get "isValidCIDRv6"() {
    return isValidCIDRv6;
  },
  get "isValidBase64"() {
    return isValidBase64;
  },
  get "isValidBase64URL"() {
    return isValidBase64URL;
  },
  get "isValidCreditCard"() {
    return isValidCreditCard;
  },
  get "isValidIBAN"() {
    return isValidIBAN;
  },
  get "isValidJWT"() {
    return isValidJWT;
  },
  get "getDiscriminatedOption"() {
    return (v as unknown as AnyApi)['getDiscriminatedOption'];
  },
  get "mergeValues"() {
    return mergeValues;
  },
  get "$ZodCyclicError"() {
    return unsupported('$ZodCyclicError');
  },
  get "isRecursiveSchema"() {
    return isRecursiveSchema;
  },
  get "memoizer"() {
    return (v as unknown as AnyApi)['memoizer'];
  },
  get "isBackEdge"() {
    return unsupported('isBackEdge');
  },
  get "$ZodCheck"() {
    return ZodCheck;
  },
  get "$ZodCheckLessThan"() {
    return ZodCheck;
  },
  get "$ZodCheckGreaterThan"() {
    return ZodCheck;
  },
  get "$ZodCheckMultipleOf"() {
    return ZodCheck;
  },
  get "$ZodCheckNumberFormat"() {
    return ZodCheck;
  },
  get "$ZodCheckBigIntFormat"() {
    return ZodCheck;
  },
  get "$ZodCheckMaxSize"() {
    return ZodCheck;
  },
  get "$ZodCheckMinSize"() {
    return ZodCheck;
  },
  get "$ZodCheckSizeEquals"() {
    return ZodCheck;
  },
  get "$ZodCheckMaxLength"() {
    return ZodCheck;
  },
  get "$ZodCheckMinLength"() {
    return ZodCheck;
  },
  get "$ZodCheckLengthEquals"() {
    return ZodCheck;
  },
  get "$ZodCheckStringFormat"() {
    return ZodCheck;
  },
  get "$ZodCheckRegex"() {
    return ZodCheck;
  },
  get "$ZodCheckLowerCase"() {
    return ZodCheck;
  },
  get "$ZodCheckUpperCase"() {
    return ZodCheck;
  },
  get "$ZodCheckIncludes"() {
    return ZodCheck;
  },
  get "$ZodCheckStartsWith"() {
    return ZodCheck;
  },
  get "$ZodCheckEndsWith"() {
    return ZodCheck;
  },
  get "$ZodCheckProperty"() {
    return ZodCheck;
  },
  get "$ZodCheckProperties"() {
    return ZodCheck;
  },
  get "$ZodCheckMimeType"() {
    return ZodCheck;
  },
  get "$ZodCheckOverwrite"() {
    return ZodCheck;
  },
  get "version"() {
    return VERSION;
  },
  get "$output"() {
    return (v as unknown as AnyApi)['$output'];
  },
  get "$input"() {
    return (v as unknown as AnyApi)['$input'];
  },
  get "$ZodRegistry"() {
    return (v as unknown as AnyApi)['registry'];
  },
  get "globalRegistry"() {
    return (v as unknown as AnyApi)['globalRegistry'];
  },
  get "registry"() {
    return (v as unknown as AnyApi)['registry'];
  },
  get "Doc"() {
    return EmptyDoc;
  },
  get "INVALID"() {
    return (v as unknown as AnyApi)['INVALID'];
  },
  get "ZodCompileAsyncError"() {
    return (v as unknown as AnyApi)['ZodCompileAsyncError'];
  },
  get "ZodCompileUnsupportedError"() {
    return (v as unknown as AnyApi)['ZodCompileUnsupportedError'];
  },
  get "compile"() {
    return (v as unknown as AnyApi)['compile'];
  },
  get "withParser"() {
    return (v as unknown as AnyApi)['withParser'];
  },
  get "compileFn"() {
    return (v as unknown as AnyApi)['compile'];
  },
  get "TimePrecision"() {
    return (v as unknown as AnyApi)['TimePrecision'];
  },
  get "_string"() {
    return adapterString;
  },
  get "_coercedString"() {
    return (v as unknown as AnyApi)['coerce']['string'];
  },
  get "_email"() {
    return (v as unknown as AnyApi)['email'];
  },
  get "_guid"() {
    return (v as unknown as AnyApi)['guid'];
  },
  get "_uuid"() {
    return (v as unknown as AnyApi)['uuid'];
  },
  get "_uuidv4"() {
    return (v as unknown as AnyApi)['uuidv4'];
  },
  get "_uuidv6"() {
    return (v as unknown as AnyApi)['uuidv6'];
  },
  get "_uuidv7"() {
    return (v as unknown as AnyApi)['uuidv7'];
  },
  get "_url"() {
    return (v as unknown as AnyApi)['url'];
  },
  get "_emoji"() {
    return (v as unknown as AnyApi)['emoji'];
  },
  get "_nanoid"() {
    return (v as unknown as AnyApi)['nanoid'];
  },
  get "_cuid"() {
    return (v as unknown as AnyApi)['cuid'];
  },
  get "_cuid2"() {
    return (v as unknown as AnyApi)['cuid2'];
  },
  get "_ulid"() {
    return (v as unknown as AnyApi)['ulid'];
  },
  get "_xid"() {
    return (v as unknown as AnyApi)['xid'];
  },
  get "_ksuid"() {
    return (v as unknown as AnyApi)['ksuid'];
  },
  get "_ipv4"() {
    return (v as unknown as AnyApi)['ipv4'];
  },
  get "_ipv6"() {
    return (v as unknown as AnyApi)['ipv6'];
  },
  get "_mac"() {
    return (v as unknown as AnyApi)['mac'];
  },
  get "_cidrv4"() {
    return (v as unknown as AnyApi)['cidrv4'];
  },
  get "_cidrv6"() {
    return (v as unknown as AnyApi)['cidrv6'];
  },
  get "_base64"() {
    return (v as unknown as AnyApi)['base64'];
  },
  get "_base64url"() {
    return (v as unknown as AnyApi)['base64url'];
  },
  get "_e164"() {
    return (v as unknown as AnyApi)['e164'];
  },
  get "_creditCard"() {
    return adapterCreditCard;
  },
  get "_iban"() {
    return adapterIban;
  },
  get "_jwt"() {
    return (v as unknown as AnyApi)['jwt'];
  },
  get "_isoDateTime"() {
    return (v as unknown as AnyApi)['iso']['dateTime'];
  },
  get "_isoDate"() {
    return (v as unknown as AnyApi)['iso']['date'];
  },
  get "_isoTime"() {
    return (v as unknown as AnyApi)['iso']['time'];
  },
  get "_isoDuration"() {
    return (v as unknown as AnyApi)['iso']['duration'];
  },
  get "_number"() {
    return adapterNumber;
  },
  get "_coercedNumber"() {
    return (v as unknown as AnyApi)['coerce']['number'];
  },
  get "_int"() {
    return (v as unknown as AnyApi)['int'];
  },
  get "_float32"() {
    return (v as unknown as AnyApi)['float32'];
  },
  get "_float64"() {
    return (v as unknown as AnyApi)['float64'];
  },
  get "_int32"() {
    return (v as unknown as AnyApi)['int32'];
  },
  get "_uint32"() {
    return (v as unknown as AnyApi)['uint32'];
  },
  get "_boolean"() {
    return adapterBoolean;
  },
  get "_coercedBoolean"() {
    return (v as unknown as AnyApi)['coerce']['boolean'];
  },
  get "_bigint"() {
    return adapterBigint;
  },
  get "_coercedBigint"() {
    return (v as unknown as AnyApi)['coerce']['bigint'];
  },
  get "_int64"() {
    return (v as unknown as AnyApi)['int64'];
  },
  get "_uint64"() {
    return (v as unknown as AnyApi)['uint64'];
  },
  get "_symbol"() {
    return adapterSymbol;
  },
  get "_undefined"() {
    return adapterUndefined;
  },
  get "_null"() {
    return adapterNull;
  },
  get "_any"() {
    return adapterAny;
  },
  get "_unknown"() {
    return adapterUnknown;
  },
  get "_never"() {
    return adapterNever;
  },
  get "_void"() {
    return adapterVoid;
  },
  get "_date"() {
    return adapterDate;
  },
  get "_coercedDate"() {
    return (v as unknown as AnyApi)['coerce']['date'];
  },
  get "_nan"() {
    return adapterNan;
  },
  get "_lt"() {
    return lt;
  },
  get "_lte"() {
    return max;
  },
  get "_max"() {
    return max;
  },
  get "_gt"() {
    return gt;
  },
  get "_gte"() {
    return min;
  },
  get "_min"() {
    return min;
  },
  get "_positive"() {
    return (v as unknown as AnyApi)['positive'];
  },
  get "_negative"() {
    return (v as unknown as AnyApi)['negative'];
  },
  get "_nonpositive"() {
    return (v as unknown as AnyApi)['nonpositive'];
  },
  get "_nonnegative"() {
    return (v as unknown as AnyApi)['nonnegative'];
  },
  get "_multipleOf"() {
    return (v as unknown as AnyApi)['multipleOf'];
  },
  get "_maxSize"() {
    return (v as unknown as AnyApi)['maxSize'];
  },
  get "_minSize"() {
    return (v as unknown as AnyApi)['minSize'];
  },
  get "_size"() {
    return (v as unknown as AnyApi)['size'];
  },
  get "_maxLength"() {
    return (v as unknown as AnyApi)['maxLength'];
  },
  get "_minLength"() {
    return (v as unknown as AnyApi)['minLength'];
  },
  get "_length"() {
    return (v as unknown as AnyApi)['length'];
  },
  get "_regex"() {
    return (v as unknown as AnyApi)['regex'];
  },
  get "_lowercase"() {
    return (v as unknown as AnyApi)['lowercase'];
  },
  get "_uppercase"() {
    return (v as unknown as AnyApi)['uppercase'];
  },
  get "_includes"() {
    return (v as unknown as AnyApi)['includes'];
  },
  get "_startsWith"() {
    return (v as unknown as AnyApi)['startsWith'];
  },
  get "_endsWith"() {
    return (v as unknown as AnyApi)['endsWith'];
  },
  get "_property"() {
    return adapterProperty;
  },
  get "_properties"() {
    return (v as unknown as AnyApi)['properties'];
  },
  get "_mime"() {
    return (v as unknown as AnyApi)['mime'];
  },
  get "_overwrite"() {
    return adapterOverwrite;
  },
  get "_normalize"() {
    return (v as unknown as AnyApi)['normalize'];
  },
  get "_trim"() {
    return (v as unknown as AnyApi)['trim'];
  },
  get "_toLowerCase"() {
    return (v as unknown as AnyApi)['toLowerCase'];
  },
  get "_toUpperCase"() {
    return (v as unknown as AnyApi)['toUpperCase'];
  },
  get "_slugify"() {
    return (v as unknown as AnyApi)['slugify'];
  },
  get "_array"() {
    return adapterArray;
  },
  get "_union"() {
    return adapterUnion;
  },
  get "_xor"() {
    return adapterXor;
  },
  get "_discriminatedUnion"() {
    return adapterDiscriminatedUnion;
  },
  get "_intersection"() {
    return adapterIntersection;
  },
  get "_tuple"() {
    return adapterTuple;
  },
  get "_record"() {
    return adapterRecord;
  },
  get "_map"() {
    return adapterMap;
  },
  get "_set"() {
    return adapterSet;
  },
  get "_enum"() {
    return adapterEnum;
  },
  get "_nativeEnum"() {
    return adapterNativeEnum;
  },
  get "_literal"() {
    return adapterLiteral;
  },
  get "_file"() {
    return adapterFile;
  },
  get "_transform"() {
    return adapterTransform;
  },
  get "_optional"() {
    return adapterOptional;
  },
  get "_nullable"() {
    return adapterNullable;
  },
  get "_default"() {
    return adapterDefault;
  },
  get "_nonoptional"() {
    return adapterNonOptional;
  },
  get "_success"() {
    return adapterSuccess;
  },
  get "_catch"() {
    return adapterCatch;
  },
  get "_pipe"() {
    return adapterPipe;
  },
  get "_readonly"() {
    return adapterReadonly;
  },
  get "_templateLiteral"() {
    return adapterTemplateLiteral;
  },
  get "_lazy"() {
    return adapterLazy;
  },
  get "_promise"() {
    return adapterPromise;
  },
  get "_custom"() {
    return adapterCustom;
  },
  get "_refine"() {
    return adapterRefine;
  },
  get "_superRefine"() {
    return adapterSuperRefine;
  },
  get "_check"() {
    return adapterCheck;
  },
  get "describe"() {
    return (v as unknown as AnyApi)['describe'];
  },
  get "meta"() {
    return (v as unknown as AnyApi)['meta'];
  },
  get "_stringbool"() {
    return adapterStringbool;
  },
  get "_stringFormat"() {
    return (v as unknown as AnyApi)['stringFormat'];
  },
  get "createToJSONSchemaMethod"() {
    return toJSONSchemaMethod;
  },
  get "createStandardJSONSchemaMethod"() {
    return toJSONSchemaMethod;
  },
  get "initializeContext"() {
    return initializeContext;
  },
  get "handleUnrepresentable"() {
    return handleUnrepresentable;
  },
  get "processSchema"() {
    return processSchema;
  },
  get "process"() {
    return process;
  },
  get "extractDefs"() {
    return extractDefs;
  },
  get "finalize"() {
    return finalize;
  },
} as const;

export type RootCoreSurface = typeof rootCoreSurface;
