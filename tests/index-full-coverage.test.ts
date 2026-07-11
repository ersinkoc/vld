/**
 * Full coverage test for src/index.ts — exercises every exported symbol,
 * factory method, and re-export alias to achieve 100% function coverage.
 *
 * The only file below 100% function coverage is src/index.ts at 76.45%.
 * All other files are already at 100% across all metrics.
 */

import * as vldModule from '../src/index';
import { v, z, core, util } from '../src/index';

// Zod alias re-exports
import {
  ZodType, ZodString, ZodNumber, ZodBoolean, ZodArray, ZodObject,
  ZodUnion, ZodLiteral, ZodEnum, ZodRecord, ZodTuple, ZodAny,
  ZodUnknown, ZodNull, ZodUndefined, ZodVoid, ZodNever, ZodDate,
  ZodBigInt, ZodSymbol, ZodSet, ZodMap, ZodLazy, ZodDiscriminatedUnion,
  ZodXor, ZodIntersection, ZodNullable, ZodOptional, ZodReadonly,
  ZodFunction, ZodFile, ZodCatch, ZodDefault, ZodPreprocess, ZodPrefault,
  ZodPromise, ZodTransform, ZodPipe, ZodNaN,
  ZodError, ZodRealError,
  ZodEmail, ZodURL, ZodUUID, ZodIPv4, ZodIPv6, ZodBase64, ZodJWT,
  ZodEmoji, ZodCUID, ZodCUID2, ZodULID, ZodNanoID, ZodMAC,
  ZodKSUID, ZodGUID, ZodXID, ZodE164, ZodISODate, ZodISODateTime,
  ZodISOTime, ZodISODuration, ZodCIDRv4, ZodCIDRv6, ZodStringFormat,
  ZodCustomStringFormat, ZodBase64URL,
  ZodBranded, ZodSuccess, ZodExactOptional, ZodJSON, ZodMeta,
  ZodNumberFormat, ZodNonOptional,
  ZodBigIntFormat, ZodCustom
} from '../src/index';
import {
  VldIntersection, VldMeta
} from '../src/index';

// Locale re-exports
import {
  setLocale, getLocale, getMessages, isLocaleSupported, getSupportedLocales, isLocaleLoaded
} from '../src/index';

// Result pattern re-exports
import {
  Ok, Err, success, failure, isOk, isErr, isResult,
  unwrap, unwrapOr, mapErr, flatMap, match, tryCatch,
  fromNullable, ResultUtils
} from '../src/index';

// Emitter re-exports
import { createEmitter, createEventBus, withEmitter } from '../src/index';

// Kernel re-exports
import { createVldKernel, getVldKernel, resetVldKernel, usePlugin, definePlugin } from '../src/index';

// Logger re-exports
import { createLogger, initLogger, getLogger, setLogLevel, enableDebug, disableLogging, createNoOpLogger } from '../src/index';

// Pigment re-exports
import {
  pigment, supportsColor, bold, dim, italic, underline,
  red, green, yellow, blue, magenta, cyan, white, gray,
  grey, strip, vldTheme, createTheme
} from '../src/index';

// JSON Schema re-exports
import { toJSONSchema, fromJSONSchema } from '../src/index';

// Error re-exports (values only, types imported separately if needed)
import {
  VldError,
  treeifyError, prettifyError, prettifyErrorColored,
  prettifyErrorPlain, flattenError
} from '../src/index';

// Codec util re-exports
import {
  base64ToUint8Array, uint8ArrayToBase64, uint8ArrayToBase64Url,
  hexToUint8Array, uint8ArrayToHex, stringToUint8Array, uint8ArrayToString
} from '../src/index';

// Codec function re-exports
import {
  invertCodec, stringToNumber, stringToInt, stringToBigInt,
  numberToBigInt, stringToBoolean,
  isoDatetimeToDate, epochSecondsToDate, epochMillisToDate,
  jsonCodec, stringToURL, stringToHttpURL, uriComponent,
  base64ToBytes, base64UrlToBytes, base64urlToBytes,
  hexToBytes, hexLowerToBytes, utf8ToBytes, bytesToUtf8,
  base64Json, jwtPayload
} from '../src/index';

// Standalone export functions
import {
  map, minLength, maxLength, length, regex, startsWith, endsWith,
  includes, trim, toLowerCase, toUpperCase, gt, gte, lt, lte,
  positive, negative, nonnegative, nonpositive, multipleOf
} from '../src/index';

describe('src/index.ts — Full Function Coverage', () => {
  // ========================================================
  // Section 1: v.* factory methods
  // ========================================================
  describe('v.* primitive factory methods', () => {
    it('should exercise all primitive factory methods', () => {
      expect(v.string().parse('hello')).toBe('hello');
      expect(v.number().parse(42)).toBe(42);
      expect(v.int().parse(5)).toBe(5);
      expect(v.int32().parse(100)).toBe(100);
      expect(v.uint32().parse(3000)).toBe(3000);
      // uint64 and int64 are number-based (not BigInt)
      expect(v.uint64().parse(123)).toBe(123);
      expect(v.int64().parse(456)).toBe(456);
      expect(v.int64().parse(-456)).toBe(-456);
      expect(v.float32().parse(1.5)).toBe(1.5);
      expect(v.float64().parse(2.5)).toBe(2.5);
      expect(v.boolean().parse(true)).toBe(true);
      expect(v.date().parse(new Date('2024-01-01'))).toBeTruthy();
      expect(v.bigint().parse(BigInt(789))).toEqual(BigInt(789));
      expect(typeof v.symbol().parse(Symbol('test'))).toBe('symbol');
    });

    it('should exercise stringbool with options', () => {
      const sb = v.stringbool({ truthy: ['yes'], falsy: ['no'], caseSensitive: true });
      expect(sb.parse('yes')).toBe(true);
      expect(sb.parse('no')).toBe(false);
    });
  });

  describe('v.* complex validator factories', () => {
    it('should exercise array/object/tuple/record factories', () => {
      const arr = v.array(v.string());
      expect(arr.parse(['a', 'b'])).toEqual(['a', 'b']);

      const obj = v.object({ name: v.string() });
      expect(obj.parse({ name: 'test' })).toEqual({ name: 'test' });

      const strict = v.strictObject({ a: v.number() });
      expect(() => strict.parse({ a: 1, b: 2 })).toThrow();

      const loose = v.looseObject({ a: v.number() });
      expect(loose.parse({ a: 1, b: 2 })).toEqual({ a: 1, b: 2 });

      const tup = v.tuple(v.string(), v.number());
      expect(tup.parse(['hello', 42])).toEqual(['hello', 42]);
    });

    it('should exercise record variants and collection factories', () => {
      const rec = v.record(v.string());
      expect(rec.parse({ x: 'a' })).toEqual({ x: 'a' });

      const prec = v.partialRecord(v.number());
      expect(prec.parse({ x: 5 })).toEqual({ x: 5 });

      const lrec = v.looseRecord(v.string());
      expect(lrec.parse({ a: 'x' })).toEqual({ a: 'x' });

      const s = v.set(v.number());
      expect(s.parse(new Set([1, 2, 3]))).toEqual(new Set([1, 2, 3]));

      const m = v.map(v.string(), v.number());
      expect(m.parse(new Map([['a', 1]]))).toEqual(new Map([['a', 1]]));
    });

    it('should exercise union/intersection/xor/discriminatedUnion', () => {
      const u = v.union(v.string(), v.number());
      expect(u.parse('hello')).toBe('hello');
      expect(u.parse(42)).toBe(42);

      const i = v.intersection(
        v.object({ a: v.string() }),
        v.object({ b: v.number() })
      );
      expect(i.parse({ a: 'x', b: 1 })).toEqual({ a: 'x', b: 1 });

      const xu = v.xor(v.string(), v.number());
      expect(xu.parse('hello')).toBe('hello');

      const du = v.discriminatedUnion('type', [
        v.object({ type: v.literal('a'), val: v.string() }),
        v.object({ type: v.literal('b'), val: v.number() })
      ]);
      expect(du.parse({ type: 'a', val: 'x' })).toEqual({ type: 'a', val: 'x' });
    });

    it('should exercise keyof', () => {
      const k = v.keyof(v.object({ a: v.string(), b: v.number() }));
      expect(k.parse('a')).toBe('a');
      expect(k.parse('b')).toBe('b');
    });

    it('should exercise literal and enum factories', () => {
      expect(v.literal('hello').parse('hello')).toBe('hello');
      expect(v.literal(42).parse(42)).toBe(42);
      expect(v.literal(true).parse(true)).toBe(true);
      expect(v.literal(null).parse(null)).toBeNull();

      const en = v.enum(['a', 'b', 'c'] as const);
      expect(en.parse('a')).toBe('a');

      // nativeEnum with object
      enum MyEnum { X = 'x', Y = 'y' }
      const nen = v.nativeEnum(MyEnum);
      expect(nen.parse('x')).toBe('x');
    });
  });

  describe('v.* special validator factories', () => {
    it('should exercise any/unknown/void/never/null/undefined/nan', () => {
      expect(v.any().parse(42)).toBe(42);
      expect(v.unknown().parse('anything')).toBe('anything');
      expect(v.void().parse(undefined)).toBeUndefined();
      expect(() => v.never().parse('anything')).toThrow();
      expect(v.null().parse(null)).toBeNull();
      expect(v.undefined().parse(undefined)).toBeUndefined();
      expect(Number.isNaN(v.nan().parse(NaN))).toBe(true);
    });

    it('should exercise optional/nullable/nullish/exactOptional', () => {
      expect(v.optional(v.string()).parse(undefined)).toBeUndefined();
      expect(v.optional(v.string()).parse('a')).toBe('a');
      expect(v.nullable(v.string()).parse(null)).toBeNull();
      expect(v.nullable(v.string()).parse('a')).toBe('a');
      expect(v.nullish(v.string()).parse(null)).toBeNull();
      expect(v.nullish(v.string()).parse(undefined)).toBeUndefined();
      expect(v.exactOptional(v.string()).parse(undefined)).toBeUndefined();
    });

    it('should exercise nonoptional/catch/prefault/readonly/pipe/clone/describe/meta', () => {
      expect(v.nonoptional(v.optional(v.string()), 'must be present').parse('a')).toBe('a');

      const catchSchema = v.catch(v.number(), 0);
      expect(catchSchema.parse(5)).toBe(5);
      const catchResult = catchSchema.safeParse('bad');
      if (catchResult.success) expect(catchResult.data).toBe(0);

      const pre = v.prefault(v.string(), 'default');
      expect(pre.parse('actual')).toBe('actual');

      expect(v.readonly(v.string()).parse('ro')).toBe('ro');

      // Use a pipe with string -> number via a transform
      const pipeSchema = v.pipe(v.string(), v.transform((s: string) => Number(s)));
      expect(pipeSchema.parse('42')).toBe(42);

      const orig = v.string();
      const cloned = v.clone(orig);
      expect(cloned.parse('hi')).toBe('hi');

      const desc = v.describe(v.string(), 'a string');
      expect(desc.parse('hi')).toBe('hi');

      const metaSchema = v.meta(v.string(), { description: 'test' });
      expect(metaSchema.parse('hi')).toBe('hi');
    });

    it('should exercise describe and meta with non-schema first arg', () => {
      // describe called with just a string (no schema)
      const descOnly = v.describe('just a description');
      expect(descOnly).toBeDefined();

      // meta called with just metadata
      const metaOnly = v.meta({ description: 'meta only' });
      expect(metaOnly).toBeDefined();
    });

    it('should exercise transform/overwrite', () => {
      // transform with schema + transformer
      expect(v.transform(v.string(), s => (s as string).toUpperCase()).parse('hi')).toBe('HI');
      // transform with just a function (no schema)
      const tFn = v.transform((s: string) => s + '!');
      expect(tFn).toBeDefined();
      // overwrite
      expect(v.overwrite((n: number) => n * 2).parse(5)).toBe(10);
    });

    it('should exercise refine/check/superRefine', () => {
      // refine as standalone function
      const r = v.refine((s: string) => s.length > 2, 'too short');
      expect(r.safeParse('a').success).toBe(false);
      // refine with schema
      const r2 = v.refine(v.string(), (s: unknown) => (s as string).length > 2, 'too short');
      expect(r2.parse('hello')).toBe('hello');
      // check as standalone
      const c = v.check((s: string) => s.length > 0, 'empty');
      expect(c.safeParse('').success).toBe(false);
      // check with schema
      const c2 = v.check(v.string(), (s: unknown) => (s as string).length > 0, 'empty');
      expect(c2.parse('x')).toBe('x');
      // superRefine standalone
      const sr = v.superRefine((val: string, ctx) => {
        if (val.length < 2) ctx.addIssue({ code: 'custom', message: 'too short' });
      });
      expect(sr.safeParse('x').success).toBe(false);
      // superRefine with schema
      const sr2 = v.superRefine(v.string(), (val, ctx) => {
        if (val.length < 2) ctx.addIssue({ code: 'custom', message: 'too short' });
      });
      expect(sr2.parse('hello')).toBe('hello');
    });
  });

  describe('v.* property/instanceof/lazy/json/custom/file/function/preprocess/promise/codec', () => {
    it('should exercise property, instanceof, lazy, json', () => {
      const pc = v.property('name', v.string());
      expect(pc.parse({ name: 'Alice' })).toEqual({ name: 'Alice' });

      const ic = v.instanceof(Date);
      expect(ic.parse(new Date())).toBeInstanceOf(Date);
      // also test instanceof failure path
      expect(() => ic.parse('not-a-date')).toThrow();

      const lz = v.lazy(() => v.string());
      expect(lz.parse('hi')).toBe('hi');

      const js = v.json();
      expect(js.parse('{"a":1}')).toEqual({ a: 1 });
      const js2 = v.json(v.object({ x: v.number() }));
      expect(js2.parse('{"x":5}')).toEqual({ x: 5 });
    });

    it('should exercise custom, file, function, preprocess', () => {
      const cu = v.custom<string>({
        parse: (val: unknown) => {
          if (typeof val !== 'string') throw new Error('not a string');
          return val;
        }
      });
      expect(cu.parse('test')).toBe('test');

      const f = v.file();
      expect(f.parse({ size: 100, type: 'text/plain' })).toBeDefined();

      const func = v.function();
      expect(func.parse(() => {})).toBeInstanceOf(Function);

      const pp = v.preprocess((x: unknown) => Number(x), v.number());
      expect(pp.parse('42')).toBe(42);
    });

    it('should exercise promise and codec', () => {
      const p = v.promise(v.string());
      expect(p).toBeDefined();

      const codec = v.codec(v.string(), v.number(), {
        decode: (s: string) => Number(s),
        encode: (n: number) => String(n),
      });
      expect(codec.parse('42')).toBe(42);
      const inverted = v.invertCodec(codec);
      expect(inverted).toBeDefined();
    });
  });

  // ========================================================
  // Section 2: v.* string format / coercion factories
  // ========================================================
  describe('v.* coercion factories', () => {
    it('should exercise all coerce methods', () => {
      expect(v.coerce.string().parse(42)).toBe('42');
      expect(v.coerce.number().parse('42')).toBe(42);
      expect(v.coerce.boolean().parse(1)).toBe(true);
      expect(v.coerce.date().parse('2024-01-01')).toBeInstanceOf(Date);
      expect(v.coerce.bigint().parse('42')).toEqual(BigInt(42));
    });
  });

  describe('v.* email/url/uuid and related factories', () => {
    it('should exercise basic format factories', () => {
      expect(v.email().parse('test@example.com')).toBe('test@example.com');
      expect(v.url().parse('https://example.com')).toBe('https://example.com');
      expect(v.uuid().parse('550e8400-e29b-41d4-a716-446655440000')).toBeTruthy();
      expect(v.uuidv4().parse('550e8400-e29b-41d4-a716-446655440000')).toBeTruthy();
      expect(v.hostname().parse('example.com')).toBe('example.com');
      expect(v.emoji().parse('😀')).toBe('😀');
      expect(v.base64().parse('SGVsbG8=')).toBe('SGVsbG8=');
      expect(v.base64url().parse('SGVsbG8')).toBe('SGVsbG8');
      expect(v.hex().parse('abcdef')).toBe('abcdef');
      expect(v.jwt().parse('eyJhbGciOiJIUzI1NiJ9.eyJ0ZXN0IjoiZGF0YSJ9.abc')).toBeTruthy();
    });

    it('should exercise more format factories', () => {
      expect(v.nanoid().parse('V1StGXR8_Z5jdHi6B-myT')).toBeTruthy();
      expect(v.cuid().parse('ckopqwooh000001la8mbi2jm9')).toBeTruthy();
      expect(v.cuid2().parse('z6n0h3jq4k5l7m8n9p0q1r2s')).toBeTruthy();
      expect(v.ulid().parse('01ARZ3NDEKTSV4RRFFQ69G5FAV')).toBeTruthy();
      expect(v.ipv4().parse('192.168.1.1')).toBe('192.168.1.1');
      expect(v.ipv6().parse('2001:0db8:0000:0000:0000:0000:0000:0001')).toBe('2001:0db8:0000:0000:0000:0000:0000:0001');
      expect(v.mac().parse('00:1b:63:84:45:e6')).toBe('00:1b:63:84:45:e6');
      expect(v.cidrv4().parse('192.168.1.0/24')).toBe('192.168.1.0/24');
      expect(v.cidrv6().parse('::1/128')).toBe('::1/128');
      expect(v.e164().parse('+12125551234')).toBe('+12125551234');
    });

    it('should exercise hash with all algorithms', () => {
      expect(v.hash('md5').parse('d41d8cd98f00b204e9800998ecf8427e')).toBeTruthy();
      expect(v.hash('sha1').parse('da39a3ee5e6b4b0d3255bfef95601890afd80709')).toBeTruthy();
      expect(v.hash('sha256').parse('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')).toBeTruthy();
      expect(v.hash('sha384').parse('38b060a751ac96384cd9327eb1b1e36a21fdb71114be07434c0cc7bf63f6e1da274edebfe76f65fbd51ad2f14898b95b')).toBeTruthy();
      expect(v.hash('sha512').parse('cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e')).toBeTruthy();
    });

    it('should exercise iso format factories', () => {
      expect(v.iso.date().parse('2024-01-01')).toBe('2024-01-01');
      expect(v.iso.time().parse('12:00:00')).toBe('12:00:00');
      expect(v.iso.dateTime().parse('2024-01-01T12:00:00Z')).toBeTruthy();
      expect(v.iso.duration().parse('P1Y2M3DT4H5M6S')).toBeTruthy();
    });

    it('should exercise mime, stringFormat, templateLiteral', () => {
      expect(v.mime('image/png').safeParse({ size: 100, type: 'image/png' }).success).toBe(true);

      const sf = v.stringFormat('custom', /^[a-z]+$/);
      expect(sf.parse('hello')).toBe('hello');

      const tl = v.templateLiteral('prefix-', v.string(), '-suffix');
      expect(tl.parse('prefix-hello-suffix')).toBe('prefix-hello-suffix');
    });
  });

  describe('v.* standalone string/number factories', () => {
    it('should exercise minLength/maxLength/length/regex/startsWith/endsWith/includes', () => {
      expect(v.minLength(3).parse('abc')).toBe('abc');
      expect(v.maxLength(5).parse('abc')).toBe('abc');
      expect(v.length(3).parse('abc')).toBe('abc');
      expect(v.regex(/^a/).parse('abc')).toBe('abc');
      expect(v.startsWith('a').parse('abc')).toBe('abc');
      expect(v.endsWith('c').parse('abc')).toBe('abc');
      expect(v.includes('b').parse('abc')).toBe('abc');
      expect(v.trim().parse(' abc ')).toBe('abc');
      expect(v.toLowerCase().parse('ABC')).toBe('abc');
      expect(v.lowercase().parse('ABC')).toBe('abc');
      expect(v.toUpperCase().parse('abc')).toBe('ABC');
      expect(v.uppercase().parse('abc')).toBe('ABC');
    });

    it('should exercise gt/gte/lt/lte/positive/negative/nonnegative/nonpositive/multipleOf', () => {
      expect(v.gt(5).parse(6)).toBe(6);
      expect(v.gte(5).parse(5)).toBe(5);
      expect(v.lt(5).parse(4)).toBe(4);
      expect(v.lte(5).parse(5)).toBe(5);
      expect(v.positive().parse(1)).toBe(1);
      expect(v.negative().parse(-1)).toBe(-1);
      expect(v.nonnegative().parse(0)).toBe(0);
      expect(v.nonpositive().parse(0)).toBe(0);
      expect(v.multipleOf(2).parse(4)).toBe(4);
    });

    it('should exercise minSize/maxSize/size/normalize/slugify', () => {
      expect(v.minSize(3).parse('abc')).toBe('abc');
      expect(v.maxSize(5).parse('abc')).toBe('abc');
      expect(v.size(3).parse('abc')).toBe('abc');
      expect(v.normalize().parse('cafe\u0301')).toBe('café');
      expect(v.normalize('NFC').parse('cafe\u0301')).toBe('café');
      expect(v.slugify().parse('Hello World!')).toBe('hello-world');
    });

    it('should exercise base64Bytes/hexBytes/uint8Array', () => {
      expect(v.base64Bytes().parse('SGVsbG8=')).toBeTruthy();
      expect(v.hexBytes().parse('aabbcc')).toBeTruthy();
      expect(v.uint8Array().parse(new Uint8Array([1, 2, 3]))).toBeTruthy();
    });

    it('should exercise xid/guid/httpUrl/ksuid', () => {
      // xid, guid, httpUrl, ksuid validators
      expect(v.xid().safeParse('ABC123DEF456GHJ789KM').success).toBe(true);
      expect(v.guid().safeParse('550e8400-e29b-41d4-a716-446655440000').success).toBe(true);
      expect(v.httpUrl().safeParse('http://example.com').success).toBe(true);
      expect(v.ksuid().safeParse('ABCDEFGHIJKLMNOPQRSTUVWXYZa').success).toBe(true);
    });
  });

  // ========================================================
  // Section 3: v.* root parse helpers
  // ========================================================
  describe('v.* root parse helpers', () => {
    it('should exercise parse, safeParse, parseAsync, safeParseAsync', async () => {
      const schema = v.string();
      expect(v.parse(schema, 'hello')).toBe('hello');
      const r = v.safeParse(schema, 'hello');
      expect(r.success).toBe(true);
      if (r.success) expect(r.data).toBe('hello');
      const rf = v.safeParse(schema, 42);
      expect(rf.success).toBe(false);
      await expect(v.parseAsync(schema, 'hello')).resolves.toBe('hello');
      const ra = await v.safeParseAsync(schema, 'hello');
      expect(ra.success).toBe(true);
    });

    it('should exercise decode family and encode family', () => {
      const schema = v.string();
      expect(v.decode(schema, 'hello')).toBe('hello');
      const sd = v.safeDecode(schema, 'hello');
      expect(sd.success).toBe(true);
      expect(v.encode(schema, 'hello')).toBe('hello');
      const se = v.safeEncode(schema, 'hello');
      expect(se.success).toBe(true);
    });

    it('should exercise async decode/encode', async () => {
      const schema = v.string();
      await expect(v.decodeAsync(schema, 'hello')).resolves.toBe('hello');
      const r1 = await v.safeDecodeAsync(schema, 'hello');
      expect(r1.success).toBe(true);
      await expect(v.encodeAsync(schema, 'hello')).resolves.toBe('hello');
      const r2 = await v.safeEncodeAsync(schema, 'hello');
      expect(r2.success).toBe(true);
    });

    it('should exercise formatError, treeifyError, prettifyError, flattenError', () => {
      // Get a VldError to test with
      const result = v.string().safeParse(42);
      expect(result.success).toBe(false);
      if (!result.success) {
        const formatted = v.formatError(result.error);
        expect(formatted._errors).toBeDefined();
        // Non-VldError path
        const other = v.formatError(new Error('custom'));
        expect(other._errors.length).toBeGreaterThanOrEqual(1);
        const vldErr = result.error as any;
        expect(v.treeifyError(vldErr)).toBeDefined();
        expect(v.prettifyError(vldErr)).toBeTruthy();
        expect(v.flattenError(vldErr)).toBeDefined();
      }
    });

    it('should exercise toJSONSchema and fromJSONSchema', () => {
      const jsonSchema = v.toJSONSchema(v.string());
      expect(jsonSchema).toBeDefined();
      if (jsonSchema) {
        const recovered = v.fromJSONSchema(jsonSchema);
        expect(recovered).toBeDefined();
      }
    });
  });

  // ========================================================
  // Section 4: core.* utilities
  // ========================================================
  describe('core.* utilities', () => {
    it('should exercise core.util methods', () => {
      expect(util.getParsedType(null)).toBe('null');
      expect(util.getParsedType([1, 2])).toBe('array');
      expect(util.getParsedType(NaN)).toBe('nan');
      expect(util.getParsedType('hello')).toBe('string');

      expect(util.joinValues(['a', 'b', 'c'])).toBe('"a" | "b" | "c"');
      expect(util.joinValues([1, 2], ', ')).toBe('1, 2');

      expect(util.jsonStringifyReplacer('key', 'value')).toBe('value');
      expect(util.jsonStringifyReplacer('key', BigInt(42))).toBe('42');

      expect(util.nullish(null)).toBe(true);
      expect(util.nullish(undefined)).toBe(true);
      expect(util.nullish('')).toBe(false);

      const cached = util.cached(() => 42);
      expect(cached()).toBe(42);
      expect(cached()).toBe(42);

      expect(() => util.assert(true)).not.toThrow();
      expect(() => util.assert(false)).toThrow();

      expect(() => util.assertNever('test' as never)).toThrow();
    });

    it('should exercise core.* methods', () => {
      const schema = v.string();
      expect(core.parse(schema, 'hello')).toBe('hello');
      const r = core.safeParse(schema, 'hello');
      expect(r.success).toBe(true);
      expect(core.util.primitiveTypes.has('string')).toBe(true);
      expect(core.util.propertyKeyTypes.has('string')).toBe(true);
    });
  });

  // ========================================================
  // Section 5: z alias
  // ========================================================
  describe('z alias', () => {
    it('should have z equal to v', () => {
      expect(z).toBe(v);
      expect(z.string().parse('hello')).toBe('hello');
      expect(z.number().parse(42)).toBe(42);
    });
  });

  // ========================================================
  // Section 6: Standalone top-level exports
  // ========================================================
  describe('standalone top-level function exports', () => {
    it('should exercise map (the VldBase overload)', () => {
      // VldBase overload — creates a VldMap
      const result1 = map(v.string(), v.number());
      expect(result1.parse(new Map([['a', 1]]))).toEqual(new Map([['a', 1]]));
    });

    it('should exercise map (the Result overload)', () => {
      // Result overload: map over Ok
      const okResult = Ok<string>('value');
      const mapped = map(okResult, (s: string) => s.length);
      expect(mapped).toBeDefined();
    });

    it('should exercise string shorthand exports', () => {
      expect(minLength(3).parse('abc')).toBe('abc');
      expect(maxLength(5).parse('abc')).toBe('abc');
      expect(length(3).parse('abc')).toBe('abc');
      expect(regex(/^a/).parse('abc')).toBe('abc');
      expect(startsWith('a').parse('abc')).toBe('abc');
      expect(endsWith('c').parse('abc')).toBe('abc');
      expect(includes('b').parse('abc')).toBe('abc');
      expect(trim().parse(' abc ')).toBe('abc');
      expect(toLowerCase().parse('ABC')).toBe('abc');
      expect(toUpperCase().parse('abc')).toBe('ABC');
    });

    it('should exercise number shorthand exports', () => {
      expect(gt(5).parse(6)).toBe(6);
      expect(gte(5).parse(5)).toBe(5);
      expect(lt(5).parse(4)).toBe(4);
      expect(lte(5).parse(5)).toBe(5);
      expect(positive().parse(1)).toBe(1);
      expect(negative().parse(-1)).toBe(-1);
      expect(nonnegative().parse(0)).toBe(0);
      expect(nonpositive().parse(0)).toBe(0);
      expect(multipleOf(2).parse(4)).toBe(4);
    });
  });

  // ========================================================
  // Section 7: Zod alias re-exports
  // ========================================================
  describe('Zod class alias re-exports', () => {
    it('should have all Zod aliases defined', () => {
      expect(ZodType).toBeDefined();
      expect(ZodString).toBeDefined();
      expect(ZodNumber).toBeDefined();
      expect(ZodBoolean).toBeDefined();
      expect(ZodArray).toBeDefined();
      expect(ZodObject).toBeDefined();
      expect(ZodUnion).toBeDefined();
      expect(ZodLiteral).toBeDefined();
      expect(ZodEnum).toBeDefined();
      expect(ZodRecord).toBeDefined();
      expect(ZodTuple).toBeDefined();
      expect(ZodAny).toBeDefined();
      expect(ZodUnknown).toBeDefined();
      expect(ZodNull).toBeDefined();
      expect(ZodUndefined).toBeDefined();
      expect(ZodVoid).toBeDefined();
      expect(ZodNever).toBeDefined();
      expect(ZodDate).toBeDefined();
      expect(ZodBigInt).toBeDefined();
      expect(ZodSymbol).toBeDefined();
      expect(ZodSet).toBeDefined();
      expect(ZodMap).toBeDefined();
      expect(ZodLazy).toBeDefined();
      expect(ZodDiscriminatedUnion).toBeDefined();
      expect(ZodXor).toBeDefined();
      expect(ZodIntersection).toBeDefined();
      expect(ZodNullable).toBeDefined();
      expect(ZodOptional).toBeDefined();
      expect(ZodReadonly).toBeDefined();
      expect(ZodFunction).toBeDefined();
      expect(ZodFile).toBeDefined();
      expect(ZodCatch).toBeDefined();
      expect(ZodDefault).toBeDefined();
      expect(ZodPreprocess).toBeDefined();
      expect(ZodPrefault).toBeDefined();
      expect(ZodPromise).toBeDefined();
      expect(ZodTransform).toBeDefined();
      expect(ZodPipe).toBeDefined();
      expect(ZodNaN).toBeDefined();
      // Verify relationship between aliases
      expect(ZodBigIntFormat).toBe(ZodBigInt);
      expect(ZodCustom).toBe(ZodSuccess);
      // Force module re-export binding resolution
      expect((vldModule as unknown as Record<string, unknown>)['ZodBigIntFormat']).toBeDefined();
      expect((vldModule as unknown as Record<string, unknown>)['ZodCustom']).toBeDefined();
      expect((vldModule as unknown as Record<string, unknown>)['ZodPipe']).toBeDefined();
      expect(ZodError).toBeDefined();
      expect(ZodRealError).toBeDefined();
    });

    it('should have all string format Zod aliases defined', () => {
      expect(ZodEmail).toBeDefined();
      expect(ZodURL).toBeDefined();
      expect(ZodUUID).toBeDefined();
      expect(ZodIPv4).toBeDefined();
      expect(ZodIPv6).toBeDefined();
      expect(ZodBase64).toBeDefined();
      expect(ZodJWT).toBeDefined();
      expect(ZodEmoji).toBeDefined();
      expect(ZodCUID).toBeDefined();
      expect(ZodCUID2).toBeDefined();
      expect(ZodULID).toBeDefined();
      expect(ZodNanoID).toBeDefined();
      expect(ZodMAC).toBeDefined();
      expect(ZodKSUID).toBeDefined();
      expect(ZodGUID).toBeDefined();
      expect(ZodXID).toBeDefined();
      expect(ZodE164).toBeDefined();
      expect(ZodISODate).toBeDefined();
      expect(ZodISODateTime).toBeDefined();
      expect(ZodISOTime).toBeDefined();
      expect(ZodISODuration).toBeDefined();
      expect(ZodCIDRv4).toBeDefined();
      expect(ZodCIDRv6).toBeDefined();
      expect(ZodStringFormat).toBeDefined();
      expect(ZodCustomStringFormat).toBeDefined();
      expect(ZodBase64URL).toBeDefined();
      // Additional Zod aliases that were missed
      expect(ZodBranded).toBeDefined();
      expect(ZodSuccess).toBeDefined();
      expect(ZodExactOptional).toBeDefined();
      expect(ZodJSON).toBeDefined();
      expect(ZodMeta).toBeDefined();
      expect(ZodNumberFormat).toBeDefined();
      expect(ZodNonOptional).toBeDefined();
      expect(ZodBigIntFormat).toBeDefined();
      expect(ZodCustom).toBeDefined();
      // VldIntersection and VldMeta direct exports
      expect(VldIntersection).toBeDefined();
      expect(VldMeta).toBeDefined();

      // Use ZodType as VldBase
      const schema: ZodType<string, string> = v.string();
      expect(schema.parse('hello')).toBe('hello');
    });
  });

  // ========================================================
  // Section 8: Re-exported locale functions
  // ========================================================
  describe('re-exported locale functions', () => {
    it('should exercise locale re-exports', () => {
      expect(typeof setLocale).toBe('function');
      expect(typeof getLocale).toBe('function');
      expect(typeof getMessages).toBe('function');
      expect(typeof isLocaleSupported).toBe('function');
      expect(typeof getSupportedLocales).toBe('function');

      const current = getLocale();
      expect(current).toBeTruthy();
      const msgs = getMessages();
      expect(msgs).toBeDefined();
      expect(isLocaleSupported('en')).toBe(true);
      expect(isLocaleLoaded('en')).toBe(true);
      expect(isLocaleLoaded('nonexistent' as any)).toBe(false);
      const locales = getSupportedLocales();
      expect(locales).toContain('en');
    });
  });

  // ========================================================
  // Section 9: Re-exported error utilities
  // ========================================================
  describe('re-exported error utilities', () => {
    it('should exercise error re-exports', () => {
      expect(VldError).toBeDefined();
      // VldIssue, VldErrorCode, VldErrorTree are types, not values
      // VldFlattenedError and VldErrorJSON are types, not values
      expect(typeof treeifyError).toBe('function');
      expect(typeof prettifyError).toBe('function');
      expect(typeof prettifyErrorColored).toBe('function');
      expect(typeof prettifyErrorPlain).toBe('function');
      expect(typeof flattenError).toBe('function');
    });
  });

  // ========================================================
  // Section 10: Re-exported codec utilities
  // ========================================================
  describe('re-exported codec utilities', () => {
    it('should exercise codec util re-exports', () => {
      expect(typeof base64ToUint8Array).toBe('function');
      expect(typeof uint8ArrayToBase64).toBe('function');
      expect(typeof uint8ArrayToBase64Url).toBe('function');
      expect(typeof hexToUint8Array).toBe('function');
      expect(typeof uint8ArrayToHex).toBe('function');
      expect(typeof stringToUint8Array).toBe('function');
      expect(typeof uint8ArrayToString).toBe('function');

      const bytes = stringToUint8Array('hello');
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(uint8ArrayToBase64(bytes)).toBe('aGVsbG8=');
      expect(uint8ArrayToHex(bytes)).toBe('68656c6c6f');
      expect(uint8ArrayToString(bytes)).toBe('hello');
      expect(base64ToUint8Array('aGVsbG8=')).toEqual(bytes);
      expect(hexToUint8Array('68656c6c6f')).toEqual(bytes);
    });
  });

  // ========================================================
  // Section 11: Re-exported codec functions
  // ========================================================
  describe('re-exported codec functions', () => {
    it('should exercise codec function re-exports', () => {
      // Codec instances (they are VldCodec objects, not bare functions)
      expect(typeof invertCodec).toBe('function');
      expect(stringToNumber).toBeDefined();
      expect(stringToInt).toBeDefined();
      expect(stringToBigInt).toBeDefined();
      expect(numberToBigInt).toBeDefined();
      expect(stringToBoolean).toBeDefined();
      expect(isoDatetimeToDate).toBeDefined();
      expect(epochSecondsToDate).toBeDefined();
      expect(epochMillisToDate).toBeDefined();
      expect(jsonCodec).toBeDefined();
      expect(stringToURL).toBeDefined();
      expect(stringToHttpURL).toBeDefined();
      expect(uriComponent).toBeDefined();
      expect(base64ToBytes).toBeDefined();
      expect(base64UrlToBytes).toBeDefined();
      expect(base64urlToBytes).toBeDefined();
      expect(hexToBytes).toBeDefined();
      expect(hexLowerToBytes).toBeDefined();
      expect(utf8ToBytes).toBeDefined();
      expect(bytesToUtf8).toBeDefined();
      expect(base64Json).toBeDefined();
      expect(jwtPayload).toBeDefined();

      // Exercise actual parsers
      expect(typeof stringToNumber.parse('42')).toBe('number');
      expect(typeof stringToInt.parse('42')).toBe('number');
      expect(typeof stringToBigInt.parse('42')).toBe('bigint');
      // numberToBigInt codec: input is number, output is bigint
      expect(typeof numberToBigInt.parse(42)).toBe('bigint');
      expect(typeof stringToBoolean.parse('true')).toBe('boolean');
      expect(isoDatetimeToDate.parse('2024-01-01T00:00:00Z')).toBeInstanceOf(Date);
      expect(epochSecondsToDate.parse(0)).toBeInstanceOf(Date);
      expect(epochMillisToDate.parse(0)).toBeInstanceOf(Date);
      expect(jsonCodec().parse('{"a":1}')).toEqual({ a: 1 });
      expect(stringToURL.parse('https://example.com')).toBeInstanceOf(URL);
      expect(stringToHttpURL.parse('http://example.com')).toBeInstanceOf(URL);
      expect(uriComponent.parse('hello%20world')).toBe('hello world');
      expect(base64ToBytes.parse('SGVsbG8=')).toBeTruthy();
      expect(base64UrlToBytes.parse('SGVsbG8')).toBeTruthy();
      expect(base64urlToBytes.parse('SGVsbG8')).toBeTruthy();
      expect(hexToBytes.parse('68656c6c6f')).toBeTruthy();
      expect(hexLowerToBytes.parse('68656c6c6f')).toBeTruthy();
      expect(utf8ToBytes.parse('hello')).toBeTruthy();
      expect(bytesToUtf8.parse(new Uint8Array([104, 101, 108, 108, 111]))).toBe('hello');
      expect(base64Json().parse('eyJhIjoxfQ==')).toBeTruthy();
      expect(jwtPayload().parse('header.eyJhIjoxfQ.signature')).toBeTruthy();
    });
  });

  // ========================================================
  // Section 12: Result pattern re-exports
  // ========================================================
  describe('re-exported result pattern functions', () => {
    it('should exercise result pattern re-exports', () => {
      const ok = Ok<string>('value');
      expect(ok).toBeDefined();
      expect(success('value')).toBeDefined();
      expect(isOk(ok)).toBe(true);
      expect(isErr(ok)).toBe(false);
      expect(isResult(ok)).toBe(true);

      const err = Err(new Error('fail'));
      expect(failure(new Error('fail'))).toBeDefined();
      expect(isOk(err)).toBe(false);
      expect(isErr(err)).toBe(true);

      expect(unwrap(ok)).toBe('value');
      expect(unwrapOr(err, 'default')).toBe('default');
      expect(mapErr(err, _e => new Error('mapped'))).toBeDefined();
      expect(flatMap(ok, (s: string) => Ok(s.length))).toBeDefined();
      expect(match(ok, { ok: (v: string) => v.length, err: (_e: Error) => 0 })).toBe(5);
      expect(tryCatch(() => 'ok')).toBeDefined();
      expect(fromNullable('value')).toBeDefined();
      expect(ResultUtils).toBeDefined();
    });
  });

  // ========================================================
  // Section 13: Emitter re-exports
  // ========================================================
  describe('re-exported emitter functions', () => {
    it('should exercise emitter re-exports', () => {
      const emitter = createEmitter<{ event: [] }>();
      expect(emitter).toBeDefined();
      const bus = createEventBus();
      expect(bus).toBeDefined();
      const enhanced = withEmitter<{ event: [] }>();
      expect(enhanced).toBeDefined();
    });
  });

  // ========================================================
  // Section 14: Kernel re-exports
  // ========================================================
  describe('re-exported kernel functions', () => {
    it('should exercise kernel re-exports', () => {
      const kernel = createVldKernel();
      expect(kernel).toBeDefined();
      const gk = getVldKernel();
      expect(gk).toBeDefined();
      expect(typeof usePlugin).toBe('function');
      expect(typeof definePlugin).toBe('function');
      expect(typeof resetVldKernel).toBe('function');
    });
  });

  // ========================================================
  // Section 15: Logger re-exports
  // ========================================================
  describe('re-exported logger functions', () => {
    it('should exercise logger re-exports', () => {
      const logger = createLogger();
      expect(logger).toBeDefined();
      const gl = getLogger();
      expect(gl).toBeDefined();
      expect(typeof initLogger).toBe('function');
      expect(typeof setLogLevel).toBe('function');
      expect(typeof enableDebug).toBe('function');
      expect(typeof disableLogging).toBe('function');
      expect(typeof createNoOpLogger).toBe('function');
    });
  });

  // ========================================================
  // Section 16: Pigment re-exports
  // ========================================================
  describe('re-exported pigment functions', () => {
    it('should exercise pigment re-exports', () => {
      expect(pigment).toBeDefined();
      expect(supportsColor).toBeDefined();
      expect(bold).toBeDefined();
      expect(dim).toBeDefined();
      expect(italic).toBeDefined();
      expect(underline).toBeDefined();
      expect(red).toBeDefined();
      expect(green).toBeDefined();
      expect(yellow).toBeDefined();
      expect(blue).toBeDefined();
      expect(magenta).toBeDefined();
      expect(cyan).toBeDefined();
      expect(white).toBeDefined();
      expect(gray).toBeDefined();
      expect(grey).toBeDefined();
      expect(strip).toBeDefined();
      expect(vldTheme).toBeDefined();
      expect(createTheme).toBeDefined();
    });
  });

  // ========================================================
  // Section 17: JSON Schema re-exports
  // ========================================================
  describe('re-exported JSON Schema functions', () => {
    it('should exercise JSON Schema re-exports', () => {
      expect(typeof toJSONSchema).toBe('function');
      expect(typeof fromJSONSchema).toBe('function');

      const js = toJSONSchema(v.string());
      expect(js).toBeDefined();
      if (js) {
        const recovered = fromJSONSchema(js);
        expect(recovered).toBeDefined();
      }
    });
  });

  // ========================================================
  // Section 18: Module-level access (vldModule namespace)
  // ========================================================
  describe('vldModule namespace', () => {
    it('should have v, z, core, util on the module', () => {
      expect(vldModule.v).toBeDefined();
      expect(vldModule.z).toBeDefined();
      expect(vldModule.core).toBeDefined();
      expect(vldModule.util).toBeDefined();
      expect(vldModule.VldBase).toBeDefined();
    });

    it('should have standalone exports on the module', () => {
      expect(vldModule.toJSONSchema).toBeDefined();
      expect(vldModule.fromJSONSchema).toBeDefined();
      expect(vldModule.pigment).toBeDefined();
      expect(vldModule.createVldKernel).toBeDefined();
      expect(vldModule.createEmitter).toBeDefined();
      expect(vldModule.createLogger).toBeDefined();
      expect(vldModule.Ok).toBeDefined();
      expect(vldModule.Err).toBeDefined();
    });

    it('should have the v namespace type exported', () => {
      const vInfer = vldModule.z;
      expect(vInfer).toBe(v);
    });
  });

  // ========================================================
  // Section 19: Catch-all for any remaining edge cases
  // ========================================================
  describe('edge case coverage', () => {
    it('should exercise v.instanceof with constructor that has no name', () => {
      // Anonymous class
      const AnonymousClass = class {};
      const ic = v.instanceof(AnonymousClass);
      expect(ic.safeParse({}).success).toBe(false);
    });

    it('should exercise v.enum with spread arguments', () => {
      // enumFactoryCompat with rest args
      const en = v.enum('x', 'y', 'z');
      expect(en.parse('x')).toBe('x');
      expect(en.parse('y')).toBe('y');
    });

    it('should exercise describe with non-VldBase values', () => {
      const result = v.describe('bare description');
      expect(result).toBeDefined();
    });
  });
});
