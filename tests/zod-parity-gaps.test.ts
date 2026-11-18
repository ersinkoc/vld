/**
 * Zod 4.6 API-surface gaps that users hit when swapping imports:
 *
 * - `z.email()`, `z.uuid()`, ... are string schemas in Zod, so every ZodString
 *   method chains onto them (`z.email().min(5).trim()`).
 * - `z.tuple([...]).partial()`.
 * - `z.string().readonly().unwrap()` and `z.json().unwrap()`.
 * - `z.function({ input, output })` with `.input()`, `.output()`,
 *   `.implement()` and `.implementAsync()`.
 *
 * Each case is asserted against the installed zod so the behavior cannot drift,
 * plus the generated object parser's acceptance and fallback contracts.
 */

import { core, v } from '../src';
import * as zod from 'zod';
import { buildObjectParser } from '../src/validators/object-jit';

const accepts = (schema: { safeParse(value: unknown): { success: boolean } }, value: unknown): boolean =>
  schema.safeParse(value).success;

describe('string format chaining', () => {
  it('applies length checks after the format check, like zod', () => {
    const vldSchema = v.email().min(10);
    const zodSchema = zod.email().min(10);

    expect(accepts(vldSchema, 'a@b.co')).toBe(accepts(zodSchema, 'a@b.co'));
    expect(vldSchema.safeParse('a@b.co').success).toBe(false);
    expect(vldSchema.safeParse('user@example.com').success).toBe(true);
    expect(accepts(vldSchema, 'not-an-email-at-all')).toBe(false);
  });

  it('reports too_small / too_big with zod metadata', () => {
    const short = v.email().min(20).safeParse('a@b.co');
    expect(short.success).toBe(false);
    if (!short.success) {
      expect(short.error.issues[0]).toMatchObject({ code: 'too_small', origin: 'string', minimum: 20, inclusive: true });
    }

    const long = v.email().max(8).safeParse('user@example.com');
    expect(long.success).toBe(false);
    if (!long.success) {
      expect(long.error.issues[0]).toMatchObject({ code: 'too_big', maximum: 8, inclusive: true });
    }
  });

  it('enforces an exact length from both sides', () => {
    const schema = v.uuid().length(36);
    expect(schema.safeParse('123e4567-e89b-12d3-a456-426614174000').success).toBe(true);

    // A uuid is always 36 chars, so a longer exact length must fail as too_small.
    const shorter = v.uuid().length(40).safeParse('123e4567-e89b-12d3-a456-426614174000');
    expect(shorter.success).toBe(false);
    if (!shorter.success) {
      expect(shorter.error.issues[0]).toMatchObject({ code: 'too_small', exact: 40 });
    }

    const longer = v.email().length(4).safeParse('user@example.com');
    expect(longer.success).toBe(false);
    if (!longer.success) {
      expect(longer.error.issues[0]).toMatchObject({ code: 'too_big', exact: 4 });
    }
  });

  it('supports nonempty, regex, affixes and includes', () => {
    expect(v.email().nonempty().safeParse('a@b.co').success).toBe(true);
    expect(v.string().safeParse('').success).toBe(true);

    const regex = v.base64().regex(/^[0-9]+$/);
    expect(regex.safeParse('1234').success).toBe(true);
    const regexed = regex.safeParse('zzzz');
    expect(regexed.success).toBe(false);
    if (!regexed.success) expect(regexed.error.issues[0]).toMatchObject({ code: 'invalid_format', format: 'regex' });

    const url = v.url().startsWith('https://');
    expect(url.safeParse('https://example.com').success).toBe(true);
    const notHttps = url.safeParse('http://example.com');
    expect(notHttps.success).toBe(false);
    if (!notHttps.success) expect(notHttps.error.issues[0]).toMatchObject({ code: 'invalid_format', format: 'starts_with' });

    const ends = v.url().endsWith('.dev');
    expect(ends.safeParse('https://vld.oxog.dev').success).toBe(true);
    const notDev = ends.safeParse('https://vld.oxog.com');
    expect(notDev.success).toBe(false);
    if (!notDev.success) expect(notDev.error.issues[0]).toMatchObject({ format: 'ends_with' });

    const includes = v.email().includes('@example', { position: 0 });
    expect(includes.safeParse('user@example.com').success).toBe(true);
    const notIncluded = includes.safeParse('user@other.com');
    expect(notIncluded.success).toBe(false);
    if (!notIncluded.success) expect(notIncluded.error.issues[0]).toMatchObject({ format: 'includes' });
  });

  it('distinguishes lowercase/uppercase checks from case transforms', () => {
    expect(v.email().lowercase().safeParse('a@b.co').success).toBe(true);
    const notLower = v.email().lowercase().safeParse('A@B.CO');
    expect(notLower.success).toBe(false);
    if (!notLower.success) expect(notLower.error.issues[0]).toMatchObject({ format: 'lowercase' });

    expect(v.email().uppercase().safeParse('A@B.CO').success).toBe(true);
    const notUpper = v.email().uppercase().safeParse('a@b.co');
    expect(notUpper.success).toBe(false);
    if (!notUpper.success) expect(notUpper.error.issues[0]).toMatchObject({ format: 'uppercase' });

    // Transforms run after the format check, so the raw input must be a valid
    // email before trimming - exactly zod's ordering.
    expect(v.email().toLowerCase().parse('User@Example.com')).toBe('user@example.com');
    expect(v.email().toUpperCase().parse('user@example.com')).toBe('USER@EXAMPLE.COM');
    expect(v.email().trim().parse('user@example.com')).toBe('user@example.com');
    expect(v.string().min(1).trim().parse('  padded  ')).toBe('padded');
  });

  it('normalizes and slugifies chained formats', () => {
    expect(v.email().normalize('NFC').parse('User@X.io')).toBe('User@X.io');
    expect(v.email().slugify().parse('Hello@World.dev')).toBe('helloworlddev');
    expect(v.string().normalize('NFC').parse('e\u0301')).toBe('\u00e9');
    expect(v.string().slugify().parse('Hello, World!')).toBe('hello-world');
  });

  it('covers the passing side of each chained check', () => {
    expect(v.email().max(40).parse('a@b.co')).toBe('a@b.co');
    expect(v.base64().nonempty().safeParse('').success).toBe(false);
    expect(v.email().includes('@example.com').parse('user@example.com')).toBe('user@example.com');

    // A transform that throws a non-VldError is reported as a custom issue.
    const broken = v.email().normalize('BOGUS' as unknown as 'NFC').safeParse('a@b.co');
    expect(broken.success).toBe(false);
    if (!broken.success) expect(broken.error.issues[0]!.code).toBe('custom');
  });

  it('reports a non-string input as invalid_type before chained checks', () => {
    const result = v.email().min(3).safeParse(42);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]).toMatchObject({ code: 'invalid_type', expected: 'string' });
  });
});

describe('tuple.partial()', () => {
  it('accepts any prefix of the tuple and rejects wrong element types', () => {
    const vldTuple = v.tuple([v.string(), v.number()]).partial();
    const zodTuple = zod.tuple([zod.string(), zod.number()]).partial();

    for (const value of [[], ['a'], ['a', 1], [1], ['a', 'b'], ['a', 1, 2]]) {
      expect(accepts(vldTuple, value)).toBe(accepts(zodTuple, value));
    }
    expect(vldTuple.parse([])).toEqual([]);
    expect(vldTuple.parse(['a'])).toEqual(['a']);
    expect(vldTuple.parse(['a', 1])).toEqual(['a', 1]);
  });

  it('keeps a rest schema', () => {
    const schema = v.tuple([v.string()], v.number()).partial();
    expect(schema.parse([])).toEqual([]);
    expect(schema.parse(['a', 1, 2])).toEqual(['a', 1, 2]);
    expect(() => schema.parse(['a', 'b'])).toThrow();
    expect(schema.safeParse(['a', 'b']).success).toBe(false);
  });

  it('reports a non-validation error from an item as a tuple failure', () => {
    const boom = v.tuple([v.string().transform((): string => { throw new Error('boom'); })]);
    const result = boom.safeParse(['x']);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]!.message).toContain('Transform failed');
  });
});

describe('readonly() / json() unwrap', () => {
  it('returns the wrapped schema, like zod', () => {
    const inner = v.string();
    const readonlySchema = inner.readonly();
    expect(readonlySchema.unwrap()).toBe(inner);
    expect(readonlySchema.unwrap().parse('x')).toBe('x');
    expect(Object.isFrozen(readonlySchema.parse('x'))).toBe(accepts(zod.string().readonly(), 'x'));
  });

  it('json().unwrap() returns the attached schema, else the json schema itself', () => {
    const plain = v.json();
    expect(plain.unwrap()).toBe(plain);

    const attached = v.string();
    expect(v.json().withSchema(attached).unwrap()).toBe(attached);
    expect(accepts(v.json(), { a: [1, 'b', null, true] })).toBe(true);
  });
});

describe('z.function({ input, output })', () => {
  it('exposes the argument tuple and the return schema', () => {
    const schema = v.function({ input: [v.string(), v.number()], output: v.number() });

    expect(schema.input().safeParse(['a', 1]).success).toBe(true);
    expect(schema.input().safeParse([1, 'a']).success).toBe(false);
    expect(schema.output().safeParse(3).success).toBe(true);
    expect(schema.output().safeParse('3').success).toBe(false);
  });

  it('returns the function schema itself when no input/output was given', () => {
    const schema = v.function();
    expect(schema.input()).toBe(schema);
    expect(schema.output()).toBe(schema);
    expect(zod.function().input().safeParse([]).success).toBe(false);
  });

  it('implement() validates arguments and the return value', () => {
    const schema = v.function({ input: [v.string(), v.number()], output: v.number() });
    const addLength = schema.implement((text: string, extra: number) => text.length + extra);

    expect(addLength('ab', 3)).toBe(5);
    expect(() => addLength(1 as unknown as string, 3)).toThrow();
    expect(() => schema.implement(() => 'nope' as unknown as number)('a', 1)).toThrow();
  });

  it('implement() passes transformed arguments to the function', () => {
    const schema = v.function({ input: [v.string().trim().toUpperCase()] });
    const echo = schema.implement((text: string) => text);
    expect(echo('  ok  ')).toBe('OK');
  });

  it('implement() without input/output returns the raw result', () => {
    const schema = v.function();
    const echo = schema.implement((value: unknown) => value);
    expect(echo({ a: 1 })).toEqual({ a: 1 });
  });

  it('accepts params through the core-style _function entry point', () => {
    const withParams = (v as unknown as { _function: (params: unknown) => any })._function({ input: [v.string()] });
    expect(withParams.input().safeParse(['a']).success).toBe(true);

    const noParams = (v as unknown as { _function: () => any })._function();
    expect(typeof noParams.parse(() => 1)).toBe('function');
  });

  it('implementAsync() awaits the function and validates its result', async () => {
    const schema = v.function({ input: [v.string()], output: v.number() });
    const asyncLength = schema.implementAsync(async (text: string) => text.length);
    await expect(asyncLength('abcd')).resolves.toBe(4);
    await expect(schema.implementAsync(async () => 'nope' as unknown as number)('a')).rejects.toThrow();

    const bare = v.function().implementAsync(async () => 'raw');
    await expect(bare()).resolves.toBe('raw');
  });
});

describe('generated object parser', () => {
  it('parses every simple primitive mode', () => {
    const symbol = Symbol('s');
    const schema = v.object({
      s: v.string(),
      n: v.number(),
      b: v.boolean(),
      bi: v.bigint(),
      sy: v.symbol(),
      nu: v.null(),
      un: v.undefined(),
      li: v.literal('active'),
      an: v.any(),
    });

    expect(schema.parse({ s: 'x', n: 1, b: true, bi: 1n, sy: symbol, nu: null, un: undefined, li: 'active', an: { deep: 1 } }))
      .toEqual({ s: 'x', n: 1, b: true, bi: 1n, sy: symbol, nu: null, un: undefined, li: 'active', an: { deep: 1 } });
  });

  it('rejects with the interpreter issues, not the generated parser', () => {
    const schema = v.object({ name: v.string(), age: v.number() });
    const result = schema.safeParse({ name: 'Ada', age: 'old' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]).toMatchObject({ code: 'invalid_type', path: ['age'], expected: 'number' });
    }
    expect(() => schema.parse({ name: 1, age: 2 })).toThrow(/name/);
  });

  it('handles optional, default, literal and generic fields together', () => {
    const schema = v.object({
      host: v.string().default('localhost'),
      port: v.number().int().min(1).default(8080),
      debug: v.boolean().optional(),
      list: v.array(v.string()).optional(),
      profile: v.object({ id: v.number() }),
    });

    expect(schema.parse({ profile: { id: 1 } })).toEqual({ host: 'localhost', port: 8080, profile: { id: 1 } });
    expect(schema.parse({ host: 'example.com', port: 443, debug: false, list: ['a'], profile: { id: 2 } }))
      .toEqual({ host: 'example.com', port: 443, debug: false, list: ['a'], profile: { id: 2 } });
    expect(schema.safeParse({ profile: { id: 'x' } }).success).toBe(false);
  });

  it('resolves function defaults per parse', () => {
    const schema = v.object({ id: v.string().default(() => `generated-${Math.random()}`) });
    const first = schema.parse({}).id;
    const second = schema.parse({}).id;

    expect(first.startsWith('generated-')).toBe(true);
    expect(typeof second).toBe('string');
  });

  it('keeps absent optionals absent and explicit undefined present', () => {
    const schema = v.object({ a: v.string().optional() });
    expect(Object.prototype.hasOwnProperty.call(schema.parse({}), 'a')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(schema.parse({ a: undefined }), 'a')).toBe(true);
  });

  it('supports non-identifier keys', () => {
    const schema = v.object({ 'a b': v.string(), 'c-d': v.number().optional() });
    expect(schema.parse({ 'a b': 'x', 'c-d': 2 })).toEqual({ 'a b': 'x', 'c-d': 2 });
    expect(schema.safeParse({ 'a b': 1 }).success).toBe(false);
  });

  it('falls back to the interpreter for strict / passthrough / catchall objects', () => {
    const strict = v.object({ a: v.string() }).strict();
    expect(strict.safeParse({ a: 'x', b: 1 }).success).toBe(false);
    expect(strict.parse({ a: 'x' })).toEqual({ a: 'x' });

    const loose = v.object({ a: v.string() }).passthrough();
    expect(loose.parse({ a: 'x', b: 1 })).toEqual({ a: 'x', b: 1 });

    const catchall = v.object({ a: v.string() }).catchall(v.number());
    expect(catchall.parse({ a: 'x', b: 1 })).toEqual({ a: 'x', b: 1 });
    expect(catchall.safeParse({ a: 'x', b: 'no' }).success).toBe(false);
  });

  it('keeps a __proto__ shape key as an own data property', () => {
    const schema = v.object({ ['__proto__']: v.string() });
    const parsed = schema.parse(JSON.parse('{"__proto__":"value"}'));

    expect(Object.getPrototypeOf(parsed)).toBe(Object.prototype);
    expect(Object.prototype.hasOwnProperty.call(parsed, '__proto__')).toBe(true);
  });

  it('uses the interpreter when code generation is unavailable', () => {
    const schema = v.object({ a: v.string(), b: v.number().default(2) });
    const RealFunction = globalThis.Function;
    try {
      (globalThis as unknown as { Function: unknown }).Function = function blocked() {
        throw new EvalError('new Function is blocked by CSP');
      };
      expect(schema.parse({ a: 'x' })).toEqual({ a: 'x', b: 2 });
      expect(schema.safeParse({ a: 1 }).success).toBe(false);
    } finally {
      (globalThis as unknown as { Function: unknown }).Function = RealFunction;
    }
  });

  it('refuses to generate a parser for a mode it cannot express inline', () => {
    expect(buildObjectParser([{ kind: 'copy', key: 'a', mode: 'bogus' as never }])).toBeNull();
  });

  it('covers the interpreter\'s known-value paths for non-simple leaves', () => {
    // A bool / bigint / file leaf with checks is not a simple field, so the
    // interpreter validates it through parseCheckedField's known-value helpers.
    const schema = v.object({
      flag: v.boolean().true(),
      big: v.bigint().min(0n),
      upload: v.file(),
    });
    const file = { size: 3, type: 'text/plain' };
    expect(schema.parse({ flag: true, big: 5n, upload: file })).toEqual({ flag: true, big: 5n, upload: file });
    expect(schema.safeParse({ flag: false, big: 5n, upload: file }).success).toBe(false);
    expect(schema.safeParse({ flag: true, big: -1n, upload: file }).success).toBe(false);
    expect(schema.safeParse({ flag: true, big: 5n, upload: 1 }).success).toBe(false);
  });

  it('covers the interpreter paths when code generation is blocked', () => {
    const RealFunction = globalThis.Function;
    try {
      (globalThis as unknown as { Function: unknown }).Function = function blocked() {
        throw new EvalError('new Function is blocked by CSP');
      };

      const symbol = Symbol('s');
      const simple = v.object({
        s: v.string(), n: v.number(), b: v.boolean(), bi: v.bigint(),
        sy: v.symbol(), nu: v.null(), un: v.undefined(), li: v.literal('x'), an: v.any(),
      });
      const value = { s: 'a', n: 1, b: true, bi: 2n, sy: symbol, nu: null, un: undefined, li: 'x', an: { deep: true } };
      expect(simple.parse(value)).toEqual(value);
      expect(simple.safeParse({ ...value, b: 'no' }).success).toBe(false);
      expect(simple.safeParse({ ...value, li: 'y' }).success).toBe(false);
      expect(simple.safeParse({ ...value, nu: 0 }).success).toBe(false);
      const { an: _omitted, ...withoutAny } = value;
      expect(simple.safeParse(withoutAny).success).toBe(false);

      // The hand-unrolled two- and three-field simple shapes.
      const pair = v.object({ name: v.string(), age: v.number() });
      expect(pair.parse({ name: 'Ada', age: 36 })).toEqual({ name: 'Ada', age: 36 });
      expect(pair.safeParse({ name: 'Ada', age: 'x' }).success).toBe(false);
      const triple = v.object({ kind: v.literal('a'), name: v.string(), age: v.number() });
      expect(triple.parse({ kind: 'a', name: 'Ada', age: 36 })).toEqual({ kind: 'a', name: 'Ada', age: 36 });

      // trusted-key literal skipping on both interpreter loops.
      expect(triple.parseTrustedKnownObject({ kind: 'a', name: 'Ada', age: 36 }, 'kind')).toEqual({ kind: 'a', name: 'Ada', age: 36 });
      expect(triple.safeParse({ kind: 'a', name: 'Ada', age: 36 }).success).toBe(true);

      // Trusted-key literal skipping in the interpreter loop (not the
      // all-simple unrolled shape).
      const checked = v.object({ kind: v.literal('a'), name: v.string().min(2) });
      expect(checked.parseTrustedKnownObject({ kind: 'a', name: 'ok' }, 'kind')).toEqual({ kind: 'a', name: 'ok' });

      // The known-object entry points without a generated parser.
      const known = v.object({ kind: v.literal('a'), name: v.string() });
      expect(known.parseKnownObject({ kind: 'a', name: 'ok' })).toEqual({ kind: 'a', name: 'ok' });
      expect(() => known.parseKnownObject({ kind: 'a', name: 1 })).toThrow();
      expect(() => triple.parseTrustedKnownObject({ kind: 'a', name: 1, age: 36 }, 'kind')).toThrow();
      // A boolean leaf with a check reaches parseCheckedField's known path.
      const flags = v.object({ flag: v.boolean().true() });
      expect(flags.parse({ flag: true })).toEqual({ flag: true });
      expect(flags.safeParse({ flag: false }).success).toBe(false);
    } finally {
      (globalThis as unknown as { Function: unknown }).Function = RealFunction;
    }
  });

  it('reports failures from the internal known-object entry points', () => {
    const schema = v.object({ kind: v.literal('a'), name: v.string() }) as unknown as {
      parseKnownObject(value: unknown): unknown;
      parseTrustedKnownObject(value: unknown, trustedKey: string): unknown;
    };

    expect(() => schema.parseKnownObject({ kind: 'a', name: 1 })).toThrow();
    expect(() => schema.parseTrustedKnownObject({ kind: 'a', name: 1 }, 'kind')).toThrow();
    expect(schema.parseTrustedKnownObject({ kind: 'a', name: 'ok' }, 'kind')).toEqual({ kind: 'a', name: 'ok' });
  });

  it('generates parsers that agree with the runtime parser on shared shapes', () => {
    const zodSchema = zod.object({ a: zod.string(), b: zod.number().default(1), c: zod.boolean().optional() });
    const vldSchema = v.object({ a: v.string(), b: v.number().default(1), c: v.boolean().optional() });

    for (const value of [{ a: 'x' }, { a: 'x', b: 2, c: true }, { a: 1 }, { a: 'x', c: 'no' }]) {
      const vldResult = vldSchema.safeParse(value);
      const zodResult = zodSchema.safeParse(value);
      expect(vldResult.success).toBe(zodResult.success);
      if (vldResult.success && zodResult.success) expect(vldResult.data).toEqual(zodResult.data);
    }
  });
});

/**
 * `v.core` must carry Zod's whole `z.core` surface. The root form is lazy (an
 * object of getters), so these assertions also cover resolving each name on
 * first read rather than at import time.
 */
describe('v.core surface', () => {
  const zodCore = (zod as unknown as { core: Record<string, unknown> }).core;
  const coreSurface = v.core as unknown as Record<string, unknown>;

  it('exposes every zod core name with a defined value', () => {
    const keys = Object.keys(zodCore);
    expect(keys.length).toBeGreaterThan(300);
    expect(keys.filter((key) => !(key in v.core))).toEqual([]);
    expect(keys.filter((key) => coreSurface[key] === undefined)).toEqual([]);
  });

  it('is the same object as the named core export', () => {
    expect(v.core).toBe(core);
  });

  it('resolves helpers on first read', () => {
    const min = coreSurface['_min'] as (value: number, params?: unknown) => never;
    const max = coreSurface['_max'] as (value: Date) => never;
    const toDotPath = coreSurface['toDotPath'] as (path: unknown[]) => string;
    expect(accepts(min(3), 2)).toBe(false);
    expect(accepts(min(3), 4)).toBe(true);
    expect(accepts(max(new Date(2000, 0, 1)), new Date(1999, 0, 1))).toBe(true);
    expect(toDotPath(['a', 0, 'b-c'])).toBe('a[0]["b-c"]');
    expect(coreSurface['$ZodString']).toBe((v as unknown as Record<string, unknown>)['ZodString']);
  });
});
