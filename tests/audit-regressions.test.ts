/**
 * Regression tests for the audit fix cycle (findings F01-F54).
 * Each block pins one previously-proven defect so it cannot silently return.
 */
import { describe, it, expect, afterEach } from '@jest/globals';
import { inspect } from 'node:util';
import { v, vV2 } from '../src/index';
import { VldError, treeifyError, flattenError, prettifyError } from '../src/errors';
import { toZodError } from '../src/zod-error';
import { VldNumber } from '../src/validators/number';
import { VldBigInt } from '../src/validators/bigint';
import { stringifyForMessage, nestIssues, expandNestedIssues } from '../src/errors-core';
import { codePointLength } from '../src/utils/string-length';
import { safeAtob } from '../src/utils/codec-utils';
import { VldCodec } from '../src/validators/codec';
import { createEmitter, createEventBus } from '../src/compat/emitter';
import { tryCatch, tryCatchAsync } from '../src/compat/result';
import { definePlugin, createVldKernel } from '../src/kernel';
import { createLogger } from '../src/logger';
import { supportsColor, pigment, strip } from '../src/pigment';
import { setLocaleAsync, setLocale, getLocale, registerLocale } from '../src/locales/lazy';
import { de } from '../src/locales/de';
import { stringToInt, epochSecondsToDate, epochMillisToDate, numberToBigInt, isoDatetimeToDate, stringToURL, base64Json } from '../src/codecs/index';
import * as v4 from '../src/v4';
import * as v4mini from '../src/v4-mini';
import * as core from '../src/v4/core';

const issuesOf = (r: any) => (r.success ? [] : r.error.issues);

// The AOT paths must agree with the interpreter.
function expectCompiledAgrees(make: () => any, input: unknown): void {
  const interp = make().safeParse(input).success;
  expect(make().validate(input)).toBe(interp);
  const compiled = v.compile(make());
  expect(v.validate(compiled, input)).toBe(interp);
  expect(compiled.safeParse(input).success).toBe(interp);
}

describe('audit regressions: object validator', () => {
  it('F01 keeps absent optional keys absent', () => {
    const s = v.object({ a: v.string(), b: v.string().optional() });
    expect(Object.keys(s.parse({ a: 'x' }))).toEqual(['a']);
    expect(Object.keys((s.safeParse({ a: 'x' }) as any).data)).toEqual(['a']);
    expect('b' in (s.parse({ a: 'x', b: undefined }) as any)).toBe(true);
    expect(s.partial().parse({})).toEqual({});
  });

  it('F02 strict().catchall() validates extra keys with the catchall', () => {
    const s = v.object({ id: v.number() }).strict().catchall(v.string());
    expect(s.safeParse({ id: 1, extra: 'ok' })).toEqual({ success: true, data: { id: 1, extra: 'ok' } });
    expect(s.safeParse({ id: 1, extra: 5 }).success).toBe(false);
  });

  it('F03 strict()/passthrough() replace an earlier catchall', () => {
    const base = v.object({}).catchall(v.string());
    expect(base.passthrough().parse({ n: 1 })).toEqual({ n: 1 });
    expect(issuesOf(base.strict().safeParse({ n: 1 })).map((i: any) => i.code)).toEqual(['unrecognized_keys']);
  });

  it('F04 merge() takes the argument unknown-key policy', () => {
    const A = v.object({ a: v.string() });
    const B = v.object({ b: v.string() });
    const input = { a: 'x', b: 'y', extra: 1 };
    expect(A.merge(B.strict()).safeParse(input).success).toBe(false);
    expect(A.merge(B.passthrough()).parse(input)).toEqual(input);
    expect(A.strict().merge(B).parse(input)).toEqual({ a: 'x', b: 'y' });
    expect(A.merge(B.catchall(v.number())).parse(input)).toEqual(input);
  });

  it('F05 required() undoes exactPartial()', () => {
    const s = v.object({ a: v.string() });
    expect(s.exactPartial().required().safeParse({}).success).toBe(false);
  });

  it('F06 a __proto__ shape key becomes an own property', () => {
    const nested = v.object({ ['__proto__']: v.object({ isAdmin: v.boolean() }), name: v.string() } as any);
    const input = JSON.parse('{"__proto__":{"isAdmin":true},"name":"n"}');
    for (const out of [nested.parse(input) as any, (nested.safeParse(input) as any).data]) {
      expect(Object.getPrototypeOf(out)).toBe(Object.prototype);
      expect(Object.prototype.hasOwnProperty.call(out, '__proto__')).toBe(true);
      expect(out.isAdmin).toBeUndefined();
    }
    const simple = v.object({ ['__proto__']: v.string() } as any);
    expect(Object.getOwnPropertyDescriptor(simple.parse(JSON.parse('{"__proto__":"x"}')), '__proto__')?.value).toBe('x');
  });

  it('F07/F08 nested issues keep full paths and are all collected', () => {
    const s = v.object({ addr: v.object({ street: v.string(), zip: v.string() }), id: v.number() });
    expect(issuesOf(s.safeParse({ addr: { street: 1, zip: 2 }, id: 'x' })).map((i: any) => i.path))
      .toEqual([['addr', 'street'], ['addr', 'zip'], ['id']]);
  });

  it('F09 container fast paths reject Infinity like v.number()', () => {
    expect(v.object({ n: v.number() }).safeParse({ n: Infinity }).success).toBe(false);
    expect(v.object({ s: v.string(), n: v.number() }).safeParse({ s: 'a', n: -Infinity }).success).toBe(false);
    expect(v.array(v.number()).safeParse([Infinity]).success).toBe(false);
    expect(v.tuple([v.number()]).safeParse([Infinity]).success).toBe(false);
    expect(v.set(v.number()).safeParse(new Set([Infinity])).success).toBe(false);
    expect(v.map(v.string(), v.number()).safeParse(new Map([['a', Infinity]])).success).toBe(false);
    expect(v.number().optional().safeParse(Infinity).success).toBe(false);
    expect(v.union([v.number(), v.string()]).safeParse(Infinity).success).toBe(false);
  });
});

describe('audit regressions: AOT compiler', () => {
  afterEach(() => {
    delete (globalThis as any).__auditPwned;
  });

  it('F10 never splices schema data into generated code', () => {
    (globalThis as any).__auditPwned = 0;
    const payload = '(globalThis.__auditPwned = 1, 0)';
    v.number().min(payload as any).validate(5);
    v.string().max(payload as any).validate('a');
    v.bigint().min(payload as any).validate(1n);
    v.fromJSONSchema({ type: 'object', properties: { a: { type: 'number', minimum: payload } } } as any).validate({ a: 1 });
    expect((globalThis as any).__auditPwned).toBe(0);
    expect(v.number().min(3).validate(2)).toBe(false);
    expect(v.bigint().max(5n).validate(6n)).toBe(false);
  });

  it('F11-F13 unions test their own input, honour option checks, and never overwrite a match', () => {
    expectCompiledAgrees(() => v.object({ a: v.union([v.string(), v.number()]) }), { a: 'x' });
    expectCompiledAgrees(() => v.array(v.union([v.array(v.string()), v.null()])), ['a']);
    expectCompiledAgrees(() => v.union([v.string().min(5), v.number().positive()]), 'a');
    expectCompiledAgrees(() => v.union([v.string(), v.object({ a: v.number() })]), 'hello');
    expectCompiledAgrees(() => v.union([v.boolean(), v.undefined(), v.literal('x'), v.object({ k: v.string() })]), undefined);
  });

  it('F14/F15 compiled numbers reject Infinity and dates keep their checks', () => {
    expectCompiledAgrees(() => v.number(), Infinity);
    expectCompiledAgrees(() => v.date().min(new Date('2020-01-01')), new Date('2000-01-01'));
  });

  it('F16 compiled parse applies defaults', () => {
    const s = v.compile(v.object({ role: v.string().default('user'), n: v.number() }));
    expect(s.parse({ n: 1 })).toEqual({ role: 'user', n: 1 });
    expect((v.compile(v.union([v.object({ d: v.string().default('x') }), v.null()]) as any) as any).parse({})).toEqual({ d: 'x' });
  });

  it('F17-F20 presence, literals and record keys match the interpreter', () => {
    expectCompiledAgrees(() => v.object({ a: v.unknown() }), {});
    expectCompiledAgrees(() => v.literal(0), -0);
    expectCompiledAgrees(() => v.literal(NaN), NaN);
    expectCompiledAgrees(() => v.literal(5n), 5n);
    expectCompiledAgrees(() => (v.literal as any)([null, 'a', true, undefined]), undefined);
    expectCompiledAgrees(() => (v.literal as any)(Symbol('s')), 's');
    expectCompiledAgrees(() => v.record(v.string(), v.number()), JSON.parse('{"__proto__":"x","b":2}'));
  });
});

describe('audit regressions: error formatting', () => {
  const mk = (path: any[], message = 'bad') => new VldError([{ code: 'custom', path, message }]);

  it('F21-F23 accumulators never resolve inherited keys', () => {
    for (const path of [['constructor'], ['toString'], ['__proto__'], [0, 'valueOf']]) {
      expect(() => treeifyError(mk(path))).not.toThrow();
      expect(() => flattenError(mk(path))).not.toThrow();
      expect(() => mk(path).flatten()).not.toThrow();
      expect(() => mk(path).format()).not.toThrow();
      expect(() => toZodError(mk(path)).format()).not.toThrow();
      expect(() => toZodError(mk(path)).flatten()).not.toThrow();
    }
    expect(mk(['_errors']).format()).toEqual({ _errors: ['bad'] });
    expect(toZodError(mk(['_errors'])).format()).toEqual({ _errors: ['bad'] });
    expect(Object.getPrototypeOf(treeifyError(mk(['__proto__'])).properties)).toBe(Object.prototype);
  });

  it('F24-F26 prettifyError quotes paths, sorts by depth and handles symbols', () => {
    const sym = Symbol('meta');
    const err = new VldError([
      { code: 'custom', path: ['a', 'b'], message: 'deep' },
      { code: 'custom', path: ['a.b'], message: 'dotted' },
      { code: 'custom', path: [sym as any], message: 'sym' },
      { code: 'custom', path: [], message: 'root' },
    ]);
    expect(prettifyError(err, { colored: false })).toBe(
      '✖ root\n✖ dotted\n  → at ["a.b"]\n✖ sym\n  → at ["Symbol(meta)"]\n✖ deep\n  → at a.b'
    );
    expect((treeifyError(err).properties as any)[sym].errors).toEqual(['sym']);
  });

  it('F27/F28 toZodError keeps keys/values/exact and JSON handles bigint', () => {
    const zi: any = toZodError(new VldError([{ code: 'unrecognized_keys', path: [], message: 'm', keys: ['b'], values: ['a'], exact: 2 }])).issues[0];
    expect([zi.keys, zi.values, zi.exact]).toEqual([['b'], ['a'], 2]);
    const big = new VldError([{ code: 'too_small', path: [], message: 'm', minimum: 10n as any, maximum: 20n as any, exact: 3n as any, values: [1n] }]);
    expect(JSON.parse(JSON.stringify(big)).issues[0]).toMatchObject({ minimum: '10', maximum: '20', exact: '3', values: ['1'] });
  });

  it('F52 errors can be inspected / logged', () => {
    const r: any = v.string().safeParse(1);
    expect(() => inspect(r.error)).not.toThrow();
    expect(() => inspect(toZodError(r.error))).not.toThrow();
    expect(r.error.errors).toBe(r.error.issues);
  });
});

describe('audit regressions: primitives', () => {
  it('F29 global/sticky regexes are stateless', () => {
    for (const s of [v.string().regex(/^abc/g), v.coerce.string().regex(/abc/y), vV2.string().regex(/abc/g)] as any[]) {
      expect([1, 2, 3].map(() => s.safeParse('abc').success)).toEqual([true, true, true]);
    }
  });

  it('F30 email rejection is linear time', () => {
    const input = 'a@' + 'a.'.repeat(20000) + ' ';
    const start = Date.now();
    for (const s of [v.string().email(), v.coerce.string().email(), vV2.string().email()] as any[]) {
      expect(s.safeParse(input).success).toBe(false);
    }
    expect(Date.now() - start).toBeLessThan(200);
    expect(v.string().email().safeParse('first.last@sub.example.org').success).toBe(true);
  });

  it('F31 positive() does not skip sibling checks', () => {
    expect(() => v.number().even().positive().parse(3)).toThrow();
    expect(() => v.number().safe().positive().parse(2 ** 60)).toThrow();
    expect(v.number().gt(0).lt(5).parse(3)).toBe(3);
    try {
      v.number().int().positive().parse(-5);
    } catch (e: any) {
      expect(e.issues[0].code).toBe('too_small');
    }
    const internal = new (VldNumber as any)({ checks: [() => true, () => true, () => true], jsonSchema: { exclusiveMinimum: 0 } });
    expect(internal.parse(1)).toBe(1);
  });

  it('F32-F34 float32 bound, short length code, decimal multipleOf', () => {
    expect(v.float32().safeParse(3.4028234663852886e38).success).toBe(true);
    expect(vV2.number().float32().safeParse(-3.4028234663852886e38).success).toBe(true);
    expect(issuesOf(v.string().length(5).safeParse('ab'))[0].code).toBe('too_small');
    for (const s of [v.number().multipleOf(0.1), v.coerce.number().multipleOf(0.1), vV2.number().multipleOf(0.1)] as any[]) {
      expect(s.safeParse(2.3).success).toBe(true);
      expect(s.safeParse(0.15).success).toBe(false);
    }
    expect(v.number().multipleOf(3).safeParse(1e20).success).toBe(false);
    expect(v.number().multipleOf(1e-7).safeParse(3e-7).success).toBe(true);
  });

  it('F42 nativeEnum drops negative and fractional reverse mappings', () => {
    enum Temp { Cold = -1, Hot = 1, Half = 0.5 }
    expect(v.nativeEnum(Temp).safeParse('Cold').success).toBe(false);
    expect(v.nativeEnum(Temp).safeParse(-1).success).toBe(true);
  });
});

describe('audit regressions: composition and async', () => {
  it('F43 promise rejects non-thenables without throwing', async () => {
    expect(() => v.promise(v.string()).safeParse(undefined)).not.toThrow();
    expect((await v.promise(v.string()).safeParseAsync(undefined)).success).toBe(false);
  });

  it('F44 unions accept every value of a multi-value literal', () => {
    const lit = (v.literal as any)(['a', 'b']);
    expect(v.union([lit, v.number()]).safeParse('b').success).toBe(true);
    expect((v as any).unionV2(lit, v.number()).safeParse('b').success).toBe(true);
  });

  it('F45 refine issues do not alias the stored path', () => {
    const s = v.string().refine((x) => x === 'ok', { message: 'no', path: ['p'] });
    (s.safeParse('x') as any).error.issues[0].path.push('mutated');
    expect((s.safeParse('x') as any).error.issues[0].path).toEqual(['p']);
    const fn = v.string().refine((x) => x === 'ok', () => 'msg');
    expect((fn.safeParse('x') as any).error.issues[0].path).toEqual([]);
  });

  it('F46 async custom predicates are awaited', async () => {
    const s = v.custom<string>(async (x) => typeof x === 'string' && x.length >= 3, 'too short');
    expect((await s.safeParseAsync('ab')).success).toBe(false);
    expect((await s.safeParseAsync('abcd')).success).toBe(true);
    expect(s.safeParse('abcd').success).toBe(false);
    const rejecting = v.custom(async () => { throw new Error('db down'); });
    expect(rejecting.safeParse('x').success).toBe(false);
    await new Promise((r) => setTimeout(r, 0));
    expect((await rejecting.safeParseAsync('x')).success).toBe(false);
  });

  it('F47 sync codec calls do not leak async rejections', () => {
    const codec = VldCodec.create(v.string(), v.number(), {
      decode: async () => { throw new Error('d'); },
      encode: async () => { throw new Error('e'); },
    } as any);
    expect(codec.safeParse('a').success).toBe(false);
    expect((codec as any).safeEncode(1).success).toBe(false);
  });

  it('F50/F51 codecs reject partial integers and fractional epochs', () => {
    expect(stringToInt.safeParse('12abc').success).toBe(false);
    expect(stringToInt.safeParse('-12').success).toBe(true);
    expect(epochSecondsToDate.safeParse(1.5).success).toBe(false);
    expect(epochMillisToDate.safeParse(1.9).success).toBe(false);
  });
});

describe('audit regressions: infrastructure', () => {
  it('F35 once/unsubscribe remove only their own registration', () => {
    const calls: string[] = [];
    const h = (p: string): void => { calls.push(p); };
    const e = createEmitter<{ ev: string }>();
    e.on('ev', h);
    const off = e.once('ev', h);
    e.emit('ev', 'a');
    off();
    e.emit('ev', 'b');
    expect(calls).toEqual(['a', 'a', 'b']);
    const bus = createEventBus<{ t: number }>();
    const a = bus.createScope();
    const b = bus.createScope();
    a.once('t', h as any);
    b.on('t', h as any);
    bus.emit('t', 1);
    a.dispose();
    expect(bus.listenerCount('t')).toBe(1);
    const e2 = createEmitter<{ x: number }>();
    const unsubscribe = e2.on('x', () => {});
    e2.removeAllListeners('x');
    expect(() => unsubscribe()).not.toThrow();
  });

  it('F36 async handler rejections are isolated', async () => {
    const logged: unknown[] = [];
    const orig = console.error;
    console.error = (...args: unknown[]) => { logged.push(args[1]); };
    try {
      const e = createEmitter<{ ev: number }>();
      e.on('ev', async () => { throw new Error('boom'); });
      e.emit('ev', 1);
      await new Promise((r) => setTimeout(r, 10));
      expect((logged[0] as Error).message).toBe('boom');
    } finally {
      console.error = orig;
    }
  });

  it('F37 built plugins do not share builder registries', () => {
    const b = definePlugin().name('p').validator('a', () => v.string() as any);
    const p1 = b.build();
    b.validator('b', () => v.number() as any);
    expect(Object.keys(p1.validators ?? {})).toEqual(['a']);
  });

  it('F38 child loggers inherit the current level', () => {
    const parent = createLogger({ level: 'warn', handler: () => {} } as any);
    parent.setLevel('debug');
    expect(parent.child('x').getLevel()).toBe('debug');
  });

  it('F39/F40 FORCE_COLOR=0 disables color and env is read per call', () => {
    const saved = { FORCE_COLOR: process.env['FORCE_COLOR'], NO_COLOR: process.env['NO_COLOR'] };
    try {
      delete process.env['NO_COLOR'];
      process.env['FORCE_COLOR'] = '0';
      expect(supportsColor()).toBe(false);
      process.env['FORCE_COLOR'] = '1';
      expect(pigment.red('x')).not.toBe('x');
      process.env['NO_COLOR'] = '1';
      expect(pigment.red('x')).toBe('x');
    } finally {
      for (const [k, val] of Object.entries(saved)) {
        if (val === undefined) delete process.env[k];
        else process.env[k] = val;
      }
    }
  });

  it('F41 tryCatch never throws for exotic thrown values', async () => {
    const nullProto = Object.create(null);
    const r: any = tryCatch(() => { throw nullProto; });
    expect(r.success).toBe(false);
    expect(r.error.message).toBe('[object Object]');
    expect(((await tryCatchAsync(async () => { throw nullProto; })) as any).success).toBe(false);
  });

  it('F48/F49 lazy locales: last request wins and fallback is real', async () => {
    const warn = console.warn;
    console.warn = () => {};
    try {
      registerLocale('de', de);
      await Promise.all([setLocaleAsync('ja'), setLocaleAsync('de')]);
      expect(getLocale()).toBe('de');
      const pending = setLocaleAsync('fr');
      setLocale('de');
      await pending;
      expect(getLocale()).toBe('de');
      await setLocaleAsync('xx' as any);
      expect(getLocale()).toBe('en');
    } finally {
      console.warn = warn;
      await setLocaleAsync('en');
    }
  });

  it('F53/F54 Zod v4 wrappers: per-parse default factories and _record key schema', () => {
    let n = 0;
    const d4 = v4._default(v4.number(), () => ++n) as any;
    const dm = v4mini._default(v4mini.number(), () => ++n) as any;
    const dc = (core._default as any)(core.$ZodDefault, core.number(), () => ++n);
    expect([d4.parse(undefined), d4.parse(undefined), dm.parse(undefined), dc.parse(undefined)]).toEqual([1, 2, 3, 4]);
    const rec = (core._record as any)(core.$ZodRecord, core.string().min(3), core.number());
    expect(rec.safeParse({ ab: 1 }).success).toBe(false);
    expect(rec.safeParse({ abc: 1 }).success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Round 2 (F55-F101)
// ---------------------------------------------------------------------------

describe('audit regressions round 2: JSON Schema', () => {
  const js = (schema: any, options?: any) => {
    const { $schema: _ignored, ...rest } = v.toJSONSchema(schema, options) as any;
    return rest;
  };

  it('F55 untyped {} accepts anything; string keywords still build a string', () => {
    expect(v.fromJSONSchema({}).safeParse(42).success).toBe(true);
    expect(v.fromJSONSchema({ minLength: 1 } as any).safeParse(5).success).toBe(false);
  });

  it('F56/F57 nullable and nullish keep keywords and the null branch', () => {
    expect(js(v.string().min(3).nullable())).toMatchObject({ type: ['string', 'null'], minLength: 3 });
    expect(js(v.literal('a').nullable())).toEqual({ anyOf: [{ type: 'string', const: 'a' }, { type: 'null' }] });
    expect(js(v.nullable(v.nullable(v.string()))).type).toEqual(['string', 'null']);
    expect(js(v.enum(['a', 'b']).nullish()).anyOf).toHaveLength(2);
    expect(js(v.union([v.string(), v.number()]).nullish()).anyOf[1]).toEqual({ type: 'null' });
  });

  it('F58/F59 literals: every value; undefined / bigint are unrepresentable', () => {
    expect(js((v.literal as any)(['a', 'b']))).toEqual({ type: 'string', enum: ['a', 'b'] });
    expect(js((v.literal as any)(['a', 1, null]))).toEqual({ enum: ['a', 1, null] });
    expect(() => js(v.literal(undefined))).toThrow('cannot be represented');
    expect(() => js(v.literal(5n))).toThrow('cannot be represented');
    expect(js(v.literal(5n), { unrepresentable: 'vld' })).toEqual({ type: 'integer', enum: ['5'] });
    expect(js(v.literal(undefined), { unrepresentable: 'vld' })).toEqual({ not: {} });
  });

  it('F60 draft-04 uses boolean exclusive bounds', () => {
    expect(js(v.number().gt(5).lt(10), { target: 'draft-04' })).toMatchObject({ minimum: 5, exclusiveMinimum: true, maximum: 10, exclusiveMaximum: true });
  });

  it('F61 tuples: rest element and closed tuples per draft', () => {
    const rest = js((v.tuple as any)([v.string()], v.number()));
    expect(rest).toMatchObject({ prefixItems: [{ type: 'string' }], items: { type: 'number' }, minItems: 1 });
    expect(rest.maxItems).toBeUndefined();
    expect(js(v.tuple([v.string()]), { target: 'draft-07' })).toMatchObject({ additionalItems: false, maxItems: 1 });
    expect(js((v.tuple as any)([v.string()], v.number()), { target: 'draft-07' }).additionalItems).toEqual({ type: 'number' });
  });

  it('F62 intersection / discriminated union / template literal are not {}', () => {
    expect(js(v.intersection(v.object({ a: v.string() }), v.object({ b: v.string() })))).toEqual({
      type: 'object', properties: { a: { type: 'string' }, b: { type: 'string' } }, required: ['a', 'b'], additionalProperties: false
    });
    expect(js(v.intersection(v.object({ a: v.string() }).passthrough(), v.object({ b: v.string() }))).additionalProperties).toBe(true);
    expect(js(v.intersection(v.string().min(2), v.string().max(4))).allOf).toHaveLength(2);
    expect(js(v.discriminatedUnion('t', [v.object({ t: v.literal('a') }), v.object({ t: v.literal('b') })])).oneOf).toHaveLength(2);
    expect(js((v as any).templateLiteral(['id-', v.number()]))).toMatchObject({ type: 'string' });
  });

  it('F63-F67 formats, io:input, propertyNames, custom metadata, affixes', () => {
    expect(js((v as any).iso.datetime()).format).toBe('date-time');
    expect(js(v.string().datetime()).format).toBe('date-time');
    const s = v.object({ name: v.string(), role: v.string().default('user') });
    expect(js(s, { io: 'input' })).toEqual({
      type: 'object', properties: { name: { type: 'string' }, role: { type: 'string', default: 'user' } }, required: ['name']
    });
    expect(js(s.strict(), { io: 'input' }).additionalProperties).toBe(false);
    expect(js(v.number().default(() => 3)).default).toBe(3);
    expect(js(v.bigint().default(1n), { unrepresentable: 'vld' }).default).toBeUndefined();
    expect(js(v.record(v.string().min(2), v.number())).propertyNames).toEqual({ type: 'string', minLength: 2 });
    expect(js((v.string() as any).meta({ title: 'T', 'x-order': 3 }))).toMatchObject({ title: 'T', 'x-order': 3 });
    expect(js(v.string().startsWith('a.b'))).toMatchObject({ format: 'starts_with', pattern: '^a\\.b.*' });
    expect(js(v.string().regex(/x$/).endsWith('.json').includes('@'))).toMatchObject({ pattern: 'x$', allOf: [{ pattern: '.*\\.json$' }, { pattern: '@' }] });
  });
});

describe('audit regressions round 2: strings and formats', () => {
  it('F68 transforms keep earlier check metadata', () => {
    expect(issuesOf(v.string().min(5).trim().safeParse('  ab  '))[0].code).toBe('too_small');
    for (const s of [v.string().min(3).toLowerCase(), v.string().min(3).toUpperCase(), v.string().min(3).normalize(), v.string().min(3).slugify()]) {
      expect(issuesOf(s.safeParse('a'))[0].code).toBe('too_small');
    }
  });

  it('F69-F72 uuid / xid / ulid / date / datetime sources', () => {
    expect(v.string().uuid().safeParse('017f22e2-79b0-7cc3-98c4-dc0c0c07398f').success).toBe(true);
    expect(v.coerce.string().uuid().safeParse('00000000-0000-0000-0000-000000000000').success).toBe(true);
    expect(vV2.string().uuid().safeParse('ffffffff-ffff-ffff-ffff-ffffffffffff').success).toBe(true);
    expect(v.string().xid().safeParse('9m4e2mr0ui3e8a215n4g').success).toBe(true);
    expect(v.string().ulid().safeParse('81ARZ3NDEKTSV4RRFFQ69G5FAV').success).toBe(false);
    expect(v.string().date().safeParse('2023-02-29').success).toBe(false);
    expect(v.string().datetime().safeParse('2020-01-01T10:00:00').success).toBe(false);
    expect(vV2.string().datetime().safeParse('2024-02-30T00:00:00Z').success).toBe(false);
    expect(vV2.string().xid().safeParse('9m4e2mr0ui3e8a215n4g').success).toBe(true);
    expect(vV2.string().ulid().safeParse('01ARZ3NDEKTSV4RRFFQ69G5FAV').success).toBe(true);
  });

  it('F73/F74 cidrv6 prefix and IPv6 structure', () => {
    expect((v as any).cidrv6().safeParse('2001:db8::1/064').success).toBe(false);
    expect(v.string().cidrv6().safeParse('2001:db8::1/64').success).toBe(true);
    expect(v.string().cidrv6().safeParse('2001:db8::1/1e2').success).toBe(false);
    expect(v.string().ipv6().safeParse(':1:2:3:4:5:6:7:8').success).toBe(false);
    expect(v.string().ipv6().safeParse('1:2:3:4:5:6:1.2.3.4').success).toBe(true);
    expect(v.string().ipv6().safeParse('::256.1.1.1').success).toBe(false);
    expect(v.string().ipv6().safeParse('abc:1.2.3.4').success).toBe(false);
    expect(v.string().ipv6().safeParse('1::2:').success).toBe(false);
  });

  it('F75-F78 legacy format sources, file sizes, V2 emoji/base64url, V2 error text', () => {
    expect(v.string().ipv4().safeParse('01.02.03.004').success).toBe(false);
    expect(vV2.string().ipv4().safeParse('01.2.3.4').success).toBe(false);
    expect(v.string().e164().safeParse('+12').success).toBe(false);
    expect(vV2.string().cidrv4().safeParse('1.2.3.4/8').success).toBe(true);
    expect(vV2.string().e164().safeParse('+14155552671').success).toBe(true);
    expect(v.string().duration().safeParse('P1W2D').success).toBe(false);
    expect(vV2.string().duration().safeParse('P1DT12H').success).toBe(true);
    expect(v.file().max(10).safeParse({ size: NaN, type: 'a' }).success).toBe(false);
    expect(v.file().safeParse({ size: 1, type: 'a' }).success).toBe(true);
    expect(vV2.string().emoji().safeParse('\u{1F44D}\u{1F3FD}').success).toBe(true);
    expect(vV2.string().base64url().safeParse('abcde').success).toBe(false);
    expect(issuesOf(vV2.coerce.number().safeParse('abc'))[0].message.startsWith('Error:')).toBe(false);
    expect(issuesOf(vV2.coerce.string().safeParse(null))[0].message.startsWith('Error:')).toBe(false);
  });
});

describe('audit regressions round 2: codecs', () => {
  it('F79-F81 numberToBigInt / isoDatetimeToDate / stringToURL', () => {
    expect((numberToBigInt as any).safeEncode(2n ** 60n).success).toBe(false);
    expect(isoDatetimeToDate.safeParse('2024-02-30T00:00:00Z').success).toBe(false);
    expect(isoDatetimeToDate.safeParse('2024-01-01T00:00:00.123456Z').success).toBe(true);
    expect(stringToURL.safeParse('http://localhost:3000').success).toBe(true);
  });

  it('F82 async codec paths validate inner schemas asynchronously', async () => {
    const codec = VldCodec.create(
      v.string().refine(async (s) => s.length > 0, 'empty') as any,
      v.number().refine(async (n) => n > 0, 'neg') as any,
      { decode: (s: string) => Number(s), encode: (n: number) => String(n) } as any
    );
    expect((await codec.safeParseAsync('5')).success).toBe(true);
    expect((await codec.safeParseAsync('-5')).success).toBe(false);
    expect((await codec.safeEncodeAsync(7)).success).toBe(true);
    expect((await codec.safeEncodeAsync(-7)).success).toBe(false);
  });
});

describe('audit regressions round 2: kernel, pigment, logger, v4', () => {
  it('F83 a failed install is rolled back', () => {
    const kernel = createVldKernel();
    let attempts = 0;
    const plugin: any = {
      name: 'flaky', version: '1', validators: { fv: () => v.string() },
      install: () => { attempts++; if (attempts === 1) throw new Error('boom'); },
    };
    expect(() => kernel.use(plugin)).toThrow('boom');
    expect(kernel.hasPlugin('flaky')).toBe(false);
    expect(kernel.getValidator('fv')).toBeUndefined();
    expect(() => kernel.use(plugin)).not.toThrow();
  });

  it('F84 remove() restores shadowed registrations', () => {
    const k = createVldKernel();
    const lit = (t: string) => () => v.literal(t) as any;
    k.registerValidator('email', lit('user'));
    k.use({ name: 'temp', version: '1', validators: { email: lit('temp') } } as any);
    k.remove('temp');
    expect((k.getValidator('email') as any).value).toBe('user');
    k.use({ name: 'C', version: '1', validators: { x: lit('C') }, transforms: { t: () => (x: unknown) => x }, codecs: { c: { decode: (x: unknown) => x } } } as any);
    k.use({ name: 'D', version: '1', validators: { x: lit('D') } } as any);
    k.use({ name: 'F', version: '1', validators: { other: lit('F') } } as any);
    k.remove('C');
    expect((k.getValidator('x') as any).value).toBe('D');
    expect(k.getTransform('t')).toBeUndefined();
    k.remove('D');
    expect(k.getValidator('x')).toBeUndefined();
  });

  it('F85/F86 strip() removes OSC; logger color follows the environment', () => {
    expect(strip('\u001b]8;;https://e.com\u0007click\u001b]8;;\u0007')).toBe('click');
    const saved = { FORCE_COLOR: process.env['FORCE_COLOR'], NO_COLOR: process.env['NO_COLOR'] };
    const out: string[] = [];
    const orig = console.warn;
    console.warn = (...a: unknown[]) => { out.push(a.map(String).join(' ')); };
    try {
      process.env['NO_COLOR'] = '1';
      createLogger({ level: 'info', timestamps: false } as any).warn('hello');
      expect(out.join('')).not.toContain('\u001b[');
    } finally {
      console.warn = orig;
      for (const [k, val] of Object.entries(saved)) {
        if (val === undefined) delete process.env[k];
        else process.env[k] = val;
      }
    }
  });

  it('F87-F90 v4-mini masks/bounds and v4/core isValidJWT', () => {
    const s = v4mini.object({ name: v4mini.string(), age: v4mini.number() });
    expect(() => v4mini.pick(s, { nmae: true })).toThrow('Unrecognized key: "nmae"');
    const part = (v4mini.partial as any)(v4mini.object({ a: v4mini.string(), b: v4mini.string() }), { a: true });
    expect(part.safeParse({ b: 'x' }).success).toBe(true);
    expect(part.safeParse({}).success).toBe(false);
    const req = (v4mini.required as any)(v4mini.object({ a: v4mini.string().optional(), b: v4mini.string().optional() }), { a: true });
    expect(req.safeParse({}).success).toBe(false);
    expect((v4mini.minimum(5n as any) as any).safeParse(7n).success).toBe(true);
    expect((v4mini.maximum(new Date('2030-01-01') as any) as any).safeParse(new Date('2031-01-01')).success).toBe(false);
    expect((core._gt(5n as any) as any).safeParse(5n).success).toBe(false);
    const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
    expect((core.isValidJWT as any)(`${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({})}.s`, 'RS256')).toBe(false);
    expect((core.isValidJWT as any)(`${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({})}.s`, 'RS256')).toBe(true);
  });
});

describe('audit regressions round 2: collections and composition', () => {
  it('F94/F95 tuple optional tail, numeric record keys', () => {
    expect(v.tuple([v.string(), v.number().optional()]).parse(['x'])).toEqual(['x']);
    expect(v.tuple([v.string(), v.number().optional()]).safeParse(['x', 1, 2]).success).toBe(false);
    expect(v.record(v.number(), v.string()).safeParse({ 1: 'one' }).success).toBe(true);
    expect(v.record(v.number(), v.string()).safeParse({ a: 'one' }).success).toBe(false);
  });

  it('F96 length / size issue codes', () => {
    expect(issuesOf(v.array(v.number()).length(1).safeParse([1, 2]))[0].code).toBe('too_big');
    expect(issuesOf((vV2 as any).array(vV2.number()).length(3).safeParse([1]))[0].code).toBe('too_small');
    expect(issuesOf(v.map(v.string(), v.number()).min(2).safeParse(new Map()))[0].code).toBe('too_small');
    expect(issuesOf(v.map(v.string(), v.number()).max(0).safeParse(new Map([['a', 1]])))[0].code).toBe('too_big');
    expect(issuesOf(v.set(v.number()).size(1).safeParse(new Set([1, 2])))[0].code).toBe('too_big');
    expect(issuesOf(v.set(v.number()).size(2).safeParse(new Set([1])))[0].code).toBe('too_small');
  });

  it('F97 unique() handles Dates, Maps, Sets, bigints and its message', () => {
    const u = v.array(v.any()).unique('dup');
    expect(u.safeParse([new Date(1), new Date(2)]).success).toBe(true);
    expect(u.safeParse([new Map([['a', 1]]), new Map([['a', 2]])]).success).toBe(true);
    expect(u.safeParse([new Set([1]), new Set([2])]).success).toBe(true);
    expect(u.safeParse([{ id: 1n }, { id: 2n }]).success).toBe(true);
    expect(issuesOf(u.safeParse([new Set([1]), new Set([1])]))[0].message).toContain('dup');
  });

  it('F98 catch((ctx) => value)', () => {
    const seen: any[] = [];
    const s = v.string().min(3).catch((ctx: any) => { seen.push(ctx); return 'fb'; });
    expect(s.parse('a')).toBe('fb');
    expect(s.safeParse(5)).toEqual({ success: true, data: 'fb' });
    expect(v.number().catch(() => -1).parse('x')).toBe(-1);
    expect(seen[0].issues.length).toBeGreaterThan(0);
    expect(() => v.string().min(5).catch('no')).toThrow('Invalid fallback value');
  });

  it('F99/F100 intersections merge arrays, Dates and nested arrays', () => {
    expect(v.intersection(v.array(v.string()), v.array(v.string())).safeParse(['a']).success).toBe(true);
    expect(v.intersection(v.array(v.string()), v.array(v.string()).transform((a) => [...a, 'x']) as any).safeParse(['a']).success).toBe(false);
    expect(v.intersection(v.date(), v.date()).safeParse(new Date(0)).success).toBe(true);
    const nested = v.intersection(v.object({ d: v.date() }), v.object({ d: v.date() }));
    expect((nested.safeParse({ d: new Date(5) }) as any).data.d.getTime()).toBe(5);
    const A = v.object({ tags: v.array(v.object({ a: v.string() }).passthrough()) });
    const B = v.object({ tags: v.array(v.object({ b: v.number() }).passthrough()), extra: v.string().optional() });
    expect((v.intersection(A, B).safeParse({ tags: [{ a: 'x', b: 1 }] }) as any).data).toEqual({ tags: [{ a: 'x', b: 1 }] });
    const P = v.object({}).passthrough();
    expect(Object.getPrototypeOf((v.intersection(P, P).safeParse(JSON.parse('{"__proto__":{"e":1}}')) as any).data)).toBe(Object.prototype);
    const R = v.any();
    const merged: any = (v.intersection(R, R).safeParse(JSON.parse('{"__proto__":{"e":1},"k":1}')) as any).data;
    expect(merged.k).toBe(1);
    expect(Object.getPrototypeOf(merged)).toBe(Object.prototype);
    expect(({} as any).e).toBeUndefined();
    const conflict = v.intersection(v.object({ n: v.array(v.number()) }), v.object({ n: v.array(v.number()).transform(() => [9, 9]) }) as any);
    expect((conflict.safeParse({ n: [1] }) as any).data).toEqual({ n: [9, 9] });
  });

  it('F101 refine error function gets the issue context and keeps params', () => {
    const s = v.number().refine((n) => n > 10, { error: (iss: any) => `got ${iss.input}`, params: { min: 10 } } as any);
    const issue = issuesOf(s.safeParse(3))[0];
    expect(issue.message).toBe('got 3');
    expect(issue.params).toEqual({ min: 10 });
    const objMsg = v.string().refine((x) => x === 'ok', { error: () => ({ message: 'obj' }) } as any);
    expect(issuesOf(objMsg.safeParse('no'))[0].message).toBe('obj');
    const noMsg = v.string().refine((x) => x === 'ok', { error: () => ({}) } as any);
    expect(issuesOf(noMsg.safeParse('no'))[0].message).toBe('Refinement check failed');
  });
});

// ---------------------------------------------------------------------------
// Round 3 (F102-F151)
// ---------------------------------------------------------------------------

describe('audit regressions round 3: primitives and messages', () => {
  it('F102 base64 filter only rejects code-shaped payloads', () => {
    const codec: any = base64Json(v.any());
    for (const value of [{ type: 'function' }, { model: 'prototype-2' }, { scope: 'data-retrieval' }]) {
      expect(codec.parse(codec.encode(value))).toEqual(value);
    }
    expect(() => safeAtob(btoa('function x() { return 1; }'))).toThrow();
    expect(() => safeAtob(btoa('<img src=x onerror=alert(1)>'))).toThrow();
  });

  it('F103 array constraints keep their own messages', () => {
    const m = (r: any) => issuesOf(r)[0].message;
    expect(m(v.array(v.number()).min(2).max(5).safeParse([1]))).toMatch(/least 2/);
    expect(m(v.array(v.number()).max(3, 'too many').min(1).safeParse([1, 2, 3, 4]))).toBe('too many');
    expect(m(v.array(v.number()).nonempty().safeParse('x'))).toBe('Invalid array');
    const enc: any = v.array(v.number()).min(2, 'need 2').max(3, 'max 3');
    expect(enc.safeEncode([1]).error.message).toContain('need 2');
    expect(enc.safeEncode([1, 2, 3, 4]).error.message).toContain('max 3');
    expect(enc.safeEncode('x').success).toBe(false);
    expect((v.array(v.number()).length(2) as any).safeEncode([1]).success).toBe(false);
  });

  it('F104-F107 V2 message prefix, unique, set/map elements, tuple extras, intersection', () => {
    const V: any = v;
    expect(issuesOf(V.arrayV2(v.number()).safeParse([1, 'x']))[0].message).toBe('Invalid item at index 1: Invalid number');
    expect(V.arrayV2(v.object({ a: v.number() })).unique().safeParse([{ a: 1 }, { a: 1 }]).success).toBe(false);
    expect(V.setV2(v.string()).safeParse(new Set([1])).success).toBe(false);
    expect(V.mapV2(v.string(), v.number()).safeParse(new Map([['a', 'x']])).success).toBe(false);
    expect(issuesOf(V.tupleV2(v.string()).safeParse(['a', 'b']))[0].message).toMatch(/at most 1/);
    expect(V.intersectionV2(v.string(), v.string()).parse('ab')).toBe('ab');
    expect(issuesOf(V.recordV2(v.number()).safeParse({ a: 'x' }))[0].message.startsWith('Error:')).toBe(false);
  });

  it('F114-F117 check metadata, type messages, bigint issues', () => {
    expect(issuesOf(v.string().startsWith('ab').min(10).safeParse('xyz'))[0].message).toMatch(/start with/);
    expect(issuesOf(v.number().multipleOf(5).min(10).safeParse(12))[0]).toMatchObject({ code: 'not_multiple_of', divisor: 5 });
    expect(issuesOf(v.number().min(10).safe().max(100).safeParse(5))[0]).toMatchObject({ code: 'too_small', minimum: 10 });
    expect(issuesOf(v.string().min(5).safeParse(123))[0].message).toBe('Invalid input: expected string, received number');
    expect(issuesOf(v.number().max(10).safeParse('x'))[0].message).toMatch(/expected number/);
    expect(issuesOf(v.string().length(3).safeParse('ab'))[0].code).toBe('too_small');
    const b = v.bigint();
    expect(issuesOf(b.min(5n).max(10n).safeParse(1n))[0]).toMatchObject({ code: 'too_small', minimum: 5n, message: 'BigInt must be at least 5' });
    expect(issuesOf(b.max(1n).safeParse(2n))[0].code).toBe('too_big');
    expect(issuesOf(b.gt(1n).safeParse(1n))[0].inclusive).toBe(false);
    expect(issuesOf(b.lt(1n).safeParse(1n))[0].code).toBe('too_big');
    expect(issuesOf(b.positive().safeParse(0n))[0].code).toBe('too_small');
    expect(issuesOf(b.negative().safeParse(0n))[0].code).toBe('too_big');
    expect(issuesOf(b.nonnegative().safeParse(-1n))[0].code).toBe('too_small');
    expect(issuesOf(b.nonpositive().safeParse(1n))[0].code).toBe('too_big');
    expect(issuesOf(b.multipleOf(5n).safeParse(7n))[0]).toMatchObject({ code: 'not_multiple_of', divisor: 5n });
    expect(() => b.max(1n).parse('x')).toThrow(VldError);
    expect(b.multipleOf(0n).safeParse(1n).success).toBe(false);
    const legacy = new (VldBigInt as any)({ checks: [(x: bigint) => x > 0n], errorMessage: 'legacy' });
    expect(issuesOf(legacy.safeParse(0n))[0].message).toBe('legacy');
    expect(issuesOf(new (VldBigInt as any)({ checks: [(x: bigint) => x > 0n] }).safeParse(0n))[0].code).toBe('invalid_type');
  });

  it('F118-F121 coercion keeps its class, rejects Infinity, keeps newlines, has a JSON schema', () => {
    const V: any = v;
    expect(V.coerce.number().int32().parse('42')).toBe(42);
    expect(V.coerce.bigint().multipleOf(5n).parse('10')).toBe(10n);
    expect(V.coerce.string().cuid2().safeParse(20200101).success).toBe(true);
    expect(V.coerce.date().min(new Date(0)).parse('2024-01-01')).toBeInstanceOf(Date);
    for (const m of ['min', 'max', 'length']) expect(V.coerce.string()[m](1).parse(5)).toBe('5');
    expect(V.coerce.string().email().safeParse(12).success).toBe(false);
    expect(V.coerce.string().url().safeParse('https://a.co').success).toBe(true);
    expect(V.coerce.string().uuid().safeParse(1).success).toBe(false);
    expect(V.coerce.string().regex(/^1/).parse(12)).toBe('12');
    expect(V.coerce.string().trim().toLowerCase().toUpperCase().parse(' a ')).toBe('A');
    expect(V.coerce.string().startsWith('1').endsWith('2').includes('1').parse(12)).toBe('12');
    expect(V.coerce.string().ip().ipv4().safeParse('1.2.3.4').success).toBe(true);
    expect(V.coerce.string().ipv6().nonempty().safeParse('::1').success).toBe(true);
    const n = V.coerce.number();
    for (const [m, arg, input] of [['min', 1, '2'], ['max', 5, '2'], ['int', undefined, '2'], ['positive', undefined, '2'], ['negative', undefined, '-2'],
      ['nonnegative', undefined, '0'], ['nonpositive', undefined, '0'], ['finite', undefined, '2'], ['safe', undefined, '2'], ['multipleOf', 2, '2'],
      ['step', 2, '2'], ['even', undefined, '2'], ['odd', undefined, '3']] as const) {
      expect(arg === undefined ? n[m]().parse(input) : n[m](arg).parse(input)).toBe(Number(input));
    }
    expect(n.between(1, 3).parse('2')).toBe(2);
    const bi = V.coerce.bigint();
    for (const m of ['min', 'max']) expect(bi[m](1n).parse('1')).toBe(1n);
    for (const [m, input] of [['positive', '1'], ['negative', '-1'], ['nonnegative', '0'], ['nonpositive', '0']] as const) expect(bi[m]().parse(input)).toBe(BigInt(input));
    expect(v.coerce.number().safeParse('Infinity').success).toBe(false);
    expect(v.coerce.number().safeParse(Infinity).success).toBe(false);
    expect(v.coerce.string().parse('a\nb\tc')).toBe('a\nb\tc');
    expect((v.toJSONSchema(V.coerce.number().min(5)) as any).minimum).toBe(5);
  });

  it('F122/F144 template literal component patterns and array form', () => {
    const V: any = v;
    expect(V.templateLiteral(v.enum(['red', 'blue']), '-car').safeParse('purple-car').success).toBe(false);
    expect(V.templateLiteral(v.union(v.literal('a'), v.literal('b')), '!').safeParse('b!').success).toBe(true);
    expect(V.templateLiteral('x', v.literal('y').optional()).safeParse('x').success).toBe(true);
    expect(V.templateLiteral('x', v.literal('y').nullable()).safeParse('xnull').success).toBe(true);
    expect(V.templateLiteral('x', v.literal('y').nullish()).safeParse('x').success).toBe(true);
    expect(V.templateLiteral('id-', v.string().max(3)).safeParse('id-toolong').success).toBe(false);
    expect(V.templateLiteral('n:', V.email()).safeParse('n:x').success).toBe(true);
    expect(V.templateLiteral('n:', V.email()).safeParse('n:').success).toBe(false);
    expect(V.templateLiteral(['id-', v.number()]).safeParse('zzz').success).toBe(false);
    expect(V.templateLiteral([1, '-', true]).safeParse('1-true').success).toBe(true);
  });

  it('F123/F149 int() is limited to safe integers', () => {
    expect(issuesOf(v.number().int().safeParse(2 ** 53))[0]).toMatchObject({ code: 'too_big', origin: 'int' });
    expect(issuesOf(v.number().int().safeParse(-(2 ** 60)))[0].code).toBe('too_small');
    expect(issuesOf(v.number().positive().int().safeParse(2 ** 60))[0].code).toBe('too_big');
    expect(issuesOf(v.number().int().safeParse(1.5))[0].code).toBe('invalid_type');
    expect(vV2.number().int().safeParse(2 ** 60).success).toBe(false);
    expect(vV2.number().int().safeParse(-(2 ** 60)).success).toBe(false);
    expect((v.toJSONSchema(v.number().min(5).int()) as any).minimum).toBe(5);
    const numeric = new (VldNumber as any)({ checks: [(x: number) => x > 0], checkMetas: [], jsonSchema: {} });
    expect(numeric.safeParse(-1).success).toBe(false);
  });

  it('F124 past/future/today read "now" at parse time', () => {
    const realNow = Date.now;
    const future = v.date().future();
    const past = v.date().past();
    const target = new Date(realNow() + 60_000);
    try {
      expect(future.safeParse(target).success).toBe(true);
      Date.now = () => realNow() + 120_000;
      expect(future.safeParse(target).success).toBe(false);
      expect(past.safeParse(target).success).toBe(true);
    } finally {
      Date.now = realNow;
    }
    expect(v.date().today().safeParse(new Date()).success).toBe(true);
  });

  it('F136 bigint inputs do not crash error messages', () => {
    expect(v.enum(['a']).safeParse(1n).success).toBe(false);
    expect(v.object({ t: v.literal('x') }).safeParse({ t: 1n }).success).toBe(false);
    expect(v.discriminatedUnion('t', [v.object({ t: v.literal('a') })]).safeParse({ t: 1n }).success).toBe(false);
    expect((v as any).literalV2('x').safeParse(1n).success).toBe(false);
    expect((v as any).enumV2(['a']).safeParse(1n).success).toBe(false);
    const cyclic: any = Object.create(null);
    cyclic.self = cyclic;
    expect(stringifyForMessage(cyclic)).toBe('[object Object]');
    expect(stringifyForMessage(1n)).toBe('"1n"');
    expect(stringifyForMessage(Symbol('s'))).toBe('Symbol(s)');
  });
});

describe('audit regressions round 3: composition', () => {
  it('F108/F109 transform / preprocess / superRefine context', async () => {
    const toNum = (v.string() as any).transform((s: string, ctx: any) => { if (s === 'x') ctx.addIssue('bad'); return s.length; });
    expect(issuesOf(toNum.safeParse('x'))[0].message).toBe('bad');
    expect(() => toNum.parse('x')).toThrow('bad');
    expect((await toNum.safeParseAsync('x')).success).toBe(false);
    expect(await toNum.parseAsync('ab')).toBe(2);
    const pre = (v as any).preprocess((val: any, ctx: any) => { if (val === 'bad') ctx.addIssue({ message: 'pre' }); return val; }, v.string());
    expect(issuesOf(pre.safeParse('bad'))[0].message).toBe('pre');
    expect(() => pre.parse('bad')).toThrow('pre');
    const extra = issuesOf(v.string().superRefine((_s, ctx: any) => ctx.addIssue({ code: 'too_small', minimum: 5, message: 'm', fatal: true })).safeParse('x'))[0];
    expect(extra).toMatchObject({ code: 'too_small', minimum: 5 });
    expect('fatal' in extra).toBe(false);
  });

  it('F110 readonly freezes output', async () => {
    expect(Object.isFrozen(v.object({ a: v.string() }).readonly().parse({ a: 'x' }))).toBe(true);
    expect(Object.isFrozen(await v.array(v.number()).readonly().parseAsync([1]))).toBe(true);
  });

  it('F111/F112 union and xor issue shapes', () => {
    const u = issuesOf(v.union(v.string(), v.number()).safeParse(true))[0];
    expect(u.code).toBe('invalid_union');
    expect(u.errors).toHaveLength(2);
    expect(() => v.union(v.string(), v.number()).parse(true)).toThrow(VldError);
    const c = v.union(v.custom((x) => { if (x !== 1) throw new Error('nope'); return true; }) as any, v.number().min(5));
    expect(issuesOf(c.safeParse(0))[0].errors).toHaveLength(2);
    const x = (v as any).xor([v.string(), v.string().min(1)]);
    expect(issuesOf(x.safeParse('ab'))[0]).toMatchObject({ code: 'invalid_union', inclusive: false, matches: [0, 1] });
    expect(issuesOf(x.safeParse(5))[0].errors).toHaveLength(2);
  });

  it('F113 discriminated union kinds and issues', () => {
    const u = v.discriminatedUnion('t', [
      v.object({ t: v.union(v.literal('a'), v.literal('b')) }),
      v.discriminatedUnion('t', [v.object({ t: v.literal('c') })]),
      v.object({ t: v.literal('d').nullable(), n: v.number() }).refine((o) => o.n > 0, 'n>0'),
      v.object({ t: v.literal('e').optional() }).describe('E'),
      v.object({ t: v.literal('f') }).superRefine(() => undefined),
    ]);
    expect(u.safeParse({ t: 'b' }).success).toBe(true);
    expect(u.safeParse({ t: 'c' }).success).toBe(true);
    expect(u.safeParse({ t: null, n: 1 }).success).toBe(true);
    expect(issuesOf(u.safeParse({ t: null, n: -1 }))[0].message).toContain('n>0');
    expect(u.safeParse({}).success).toBe(true);
    expect(issuesOf(u.safeParse({ t: 'zzz' }))[0]).toMatchObject({ code: 'invalid_union', path: ['t'] });
    expect(issuesOf(u.safeParse('x'))[0].code).toBe('invalid_type');
    expect(() => u.parse('x')).toThrow(VldError);
    expect(() => u.parse({ t: 'zzz' })).toThrow(VldError);
    expect(() => v.discriminatedUnion('t', [v.object({ t: v.string() })])).toThrow('Discriminator must be a literal or enum schema');
    expect(() => v.discriminatedUnion('t', [v.string() as any])).toThrow('must be objects');
    const plain = v.discriminatedUnion('t', [v.object({ t: v.literal('a'), s: v.string() })]);
    expect(issuesOf(plain.safeParse({ t: 'a', s: 1 }))[0].path).toEqual(['s']);
    const flaky = v.discriminatedUnion('t', [v.object({ t: v.literal('a'), s: v.string().transform(() => { calls++; if (calls === 1) throw new Error('once'); return 'ok'; }) })]);
    let calls = 0;
    expect(flaky.safeParse({ t: 'a', s: 'x' }).success).toBe(false);
  });

  it('F131 check() with check schemas', () => {
    const M: any = v4mini; const C: any = core;
    expect(M.number().check(M.minimum(5)).safeParse(3).success).toBe(false);
    expect(M.number().check(M.minimum(5), M.maximum(10)).safeParse(7).success).toBe(true);
    const pc = M.string().check(C._check((p: any) => { if (p.value.length < 3) p.issues.push({ code: 'custom', input: p.value }); }));
    expect(issuesOf(pc.safeParse('ab'))[0].message).toBe('Invalid input');
    expect(pc.safeParse('abc').success).toBe(true);
  });

  it('F134/F137 records: exhaustive enum keys, plain objects only', () => {
    expect(v.record(v.enum(['a', 'b']), v.string()).safeParse({ a: 'x' }).success).toBe(false);
    expect(v.record(v.enum(['a', 'b']), v.number().default(0)).parse({ a: 1 })).toEqual({ a: 1, b: 0 });
    expect(v.record(v.enum(['a', 'b']), v.string().optional()).parse({ a: 'x' })).toEqual({ a: 'x' });
    expect(v.partialRecord(v.enum(['a', 'b']), v.string()).safeParse({ a: 'x' }).success).toBe(true);
    expect(v.record(v.string(), v.number()).safeParse(new Date(0)).success).toBe(false);
    expect(v.object({ r: v.record(v.string(), v.number()) }).safeParse({ r: new Map() }).success).toBe(false);
    expect((v as any).recordV2(v.number()).safeParse(new Set()).success).toBe(false);
    // A literal key that is not a property key (null) is never required.
    expect(v.record(v.literal(null as any), v.number()).safeParse({}).success).toBe(true);
  });

  it('F135 object safeParse runs valid fields once', () => {
    let calls = 0;
    const s = v.object({ id: v.string().transform((x) => { calls++; return x; }), age: v.number() });
    expect(s.safeParse({ id: 'u', age: 'x' }).success).toBe(false);
    expect(calls).toBe(1);
    calls = 0;
    expect(v.object({ a: v.string().transform((x) => { calls++; return x; }) }).strict().safeParse({ a: 'x', b: 1 }).success).toBe(false);
    expect(calls).toBe(1);
  });

  it('F150 encode runs through wrappers', () => {
    const c = v.codec(v.string(), v.number(), { decode: (s: string) => Number(s), encode: (n: number) => String(n) });
    expect(c.optional().encode(4)).toBe('4');
    expect(c.optional().encode(undefined as any)).toBeUndefined();
    expect((c as any).exactOptional?.().encode?.(4) ?? '4').toBe('4');
    expect(c.nullable().encode(null as any)).toBeNull();
    expect(c.nullable().safeEncode(4)).toEqual({ success: true, data: '4' });
    expect(c.nullish().encode(4)).toBe('4');
    expect(c.default(1).encode(4)).toBe('4');
    expect(c.readonly().encode(4)).toBe('4');
    expect(c.brand<'X'>().encode(4 as any)).toBe('4');
    expect(c.describe('d').encode(4)).toBe('4');
    expect(v.lazy(() => c).encode(4)).toBe('4');
    expect(v.lazy(() => c).safeEncode(4)).toEqual({ success: true, data: '4' });
    expect(v.union(c, v.boolean()).encode(4)).toBe('4');
    expect(v.union(c, v.boolean()).safeEncode('x' as any).success).toBe(false);
    expect(() => v.union(c, v.boolean()).encode('x' as any)).toThrow(VldError);
    expect(c.optional().safeEncode('x' as any).success).toBe(false);
    expect(v.object({ a: c.optional() }).encode({ a: 4 })).toEqual({ a: '4' });
    expect((c as any).exactOptional().encode(undefined)).toBeUndefined();
    expect(c.nullish().encode(null as any)).toBeNull();
    expect(c.nullish().encode(undefined as any)).toBeUndefined();
    for (const wrapped of [c.describe('d'), c.readonly(), c.brand<'X'>(), c.default(1), (c as any).exactOptional(), c.nullish()]) {
      expect((wrapped as any).safeEncode(4)).toEqual({ success: true, data: '4' });
      expect((wrapped as any).safeEncode('x').success).toBe(false);
    }
  });

  it('number issue fallbacks for metadata-less construction', () => {
    const multiple = new (VldNumber as any)({ checks: [(x: number) => x % 3 === 0], checkMetas: [{ kind: 'multiple_of', value: 3, message: undefined }] });
    expect(issuesOf(multiple.safeParse(4))[0].message).toBe('Invalid number: must be a multiple of 3');
    const heuristic = new (VldNumber as any)({ checks: [(x: number) => x > 0, (x: number) => Number.isSafeInteger(x)], jsonSchema: { exclusiveMinimum: 0, type: 'integer' } });
    // parse() takes the positive()+int() fast path, which has no metadata here.
    expect(() => heuristic.parse(2 ** 60)).toThrow(`Too big: expected int to be <=${Number.MAX_SAFE_INTEGER}`);
    expect(() => heuristic.parse(1.5)).toThrow('Invalid input: expected int, received number');
    expect(() => heuristic.parse(-1)).toThrow(VldError);
    expect(issuesOf(v.number().int('whole').safeParse(2 ** 60))[0].message).toBe('whole');
    expect(issuesOf(v.number().positive('pos').int('whole').safeParse(2 ** 60))[0].message).toBe('whole');
    const bareInt = new (VldNumber as any)({ checks: [(x: number) => Number.isSafeInteger(x)], checkMetas: [{ kind: 'int', message: undefined }] });
    expect(issuesOf(bareInt.safeParse(2 ** 60))[0].message).toBe(`Too big: expected int to be <=${Number.MAX_SAFE_INTEGER}`);
    expect(issuesOf(bareInt.safeParse(-(2 ** 60)))[0].message).toBe(`Too small: expected int to be >=${Number.MIN_SAFE_INTEGER}`);
    // A metadata-less instance gets padded metas when a check is added.
    const padded = new (VldNumber as any)({ checks: [(x: number) => x > 0], errorMessage: 'legacy' }).max(10);
    expect(issuesOf(padded.safeParse(0))[0].message).toBe('legacy');
    expect(issuesOf(padded.safeParse(11))[0].code).toBe('too_big');
  });
});

describe('audit regressions round 3: infrastructure', () => {
  it('F125-F130 v4/core helpers', () => {
    const C: any = core;
    expect(C.version).toEqual({ major: 4, minor: 6, patch: 5 });
    expect(C.toDotPath(['users', 0, 'name', { key: 'k' }, 'a b', Symbol('s')])).toBe('users[0].name.k["a b"]["Symbol(s)"]');
    expect(C.mergeValues({ a: 1 }, { a: 2 })).toEqual({ valid: false, mergeErrorPath: ['a'] });
    expect(C.mergeValues([{ a: 1 }], [{ b: 2 }])).toEqual({ valid: true, data: [{ a: 1, b: 2 }] });
    expect(C.mergeValues([1], [2])).toEqual({ valid: false, mergeErrorPath: [0] });
    expect(C.mergeValues([1], [1, 2])).toEqual({ valid: false, mergeErrorPath: [] });
    expect(C.mergeValues(new Date(1), new Date(1)).valid).toBe(true);
    expect(C.mergeValues(JSON.parse('{"__proto__":{"x":1},"k":1}'), { k: 1 }).valid).toBe(true);
    expect(C.validateURL('http:example.com', { protocol: /^https?$/, normalize: false })).toBe(1);
    expect(C.validateURL('nope', {})).toBe(2);
    expect(C.validateURL('https://a.b', {})).toBe(true);
    expect(C.parseURLObject('::', { protocol: /x/ })).toBe(2);
    expect(C.urlHostnameOk(new URL('https://example.com'), /^example\.com$/)).toBe(true);
    expect(C.urlProtocolOk(new URL('https://example.com'), /^https$/)).toBe(true);
    expect(C._tuple(C.$ZodTuple, [C.string()], C.number()).safeParse(['a', 1, 2]).success).toBe(true);
    expect(C._tuple([C.string()]).safeParse(['a']).success).toBe(true);
    expect(C._stringbool({ Codec: 1, Boolean: 1, String: 1 }, { truthy: ['si'], falsy: ['no'] }).parse('si')).toBe(true);
    expect(C._stringbool({ truthy: ['y'], falsy: ['n'] }).parse('y')).toBe(true);
    expect(C._custom(C.$ZodCustom, () => false, 'my msg').safeParse(1).error.issues[0].message).toBe('my msg');
    const Node: any = v.object({ c: v.lazy(() => v.array(Node)) });
    expect(C.isRecursiveSchema(Node)).toBe(true);
    expect(C.isRecursiveSchema(v.lazy(() => v.string()))).toBe(false);
    expect(C.isRecursiveSchema(v.lazy(() => { throw new Error('x'); }))).toBe(true);
    expect(C.isRecursiveSchema(42)).toBe(false);
    const shared = v.string();
    expect(C.isRecursiveSchema(v.object({ a: shared, b: shared, c: v.tuple([v.number()]) }))).toBe(false);
  });

  it('F132 pigment re-opens the outer style after a nested reset', () => {
    const saved = process.env['FORCE_COLOR'];
    process.env['FORCE_COLOR'] = '1';
    try {
      expect(pigment.red('a' + pigment.bold('b') + 'c')).toBe('\x1b[31ma\x1b[1mb\x1b[0m\x1b[31mc\x1b[0m');
    } finally {
      if (saved === undefined) delete process.env['FORCE_COLOR'];
      else process.env['FORCE_COLOR'] = saved;
    }
  });

  it('F133 definePlugin object form; kernel rejects nameless plugins', () => {
    const plugin = definePlugin({ name: 'obj', version: '1', validators: { phone: () => v.string() } });
    const k = createVldKernel();
    k.use(plugin);
    expect(k.hasPlugin('obj')).toBe(true);
    expect(() => definePlugin({ version: '1' } as any)).toThrow('Plugin name is required');
    expect(() => k.use(definePlugin().name('b') as any)).toThrow('Invalid plugin');
  });

  it('F138-F143 fromJSONSchema keywords', () => {
    const f = (json: any) => (v as any).fromJSONSchema(json);
    expect(f({ type: 'string', format: 'date-time' }).safeParse('x').success).toBe(false);
    expect(f({ type: 'string', format: 'time' }).safeParse('10:00:00Z').success).toBe(true);
    for (const format of ['uri', 'uri-reference', 'uuid', 'guid', 'date', 'duration', 'hostname', 'ipv4', 'ipv6', 'mac', 'cidr', 'cidr-v6', 'base64', 'base64url', 'e164', 'credit_card', 'iban', 'jwt', 'emoji', 'nanoid', 'cuid', 'cuid2', 'ulid', 'xid', 'ksuid', 'email']) {
      expect(f({ type: 'string', format }).safeParse(42).success).toBe(false);
    }
    expect(f({ enum: [1, 'a', null] }).safeParse(null).success).toBe(true);
    expect(f({ enum: [null] }).safeParse(null).success).toBe(true);
    expect(f({ type: 'array', prefixItems: [{ type: 'string' }, { type: 'number' }], items: false }).safeParse([]).success).toBe(true);
    expect(f({ type: 'array', prefixItems: [{ type: 'string' }], items: { type: 'number' } }).safeParse(['a', 'x']).success).toBe(false);
    expect(f({ type: 'array', items: [{ type: 'string' }], additionalItems: true, maxItems: 1 }).safeParse(['a', 1]).success).toBe(false);
    expect(f({ type: 'object', properties: { n: { type: 'string' } }, additionalProperties: { type: 'number' } }).safeParse({ n: 'x', e: 'y' }).success).toBe(false);
    expect(f({ type: 'object', additionalProperties: { type: 'number' } }).safeParse({ a: 'x' }).success).toBe(false);
    expect(f({ type: 'object', additionalProperties: false }).safeParse({ a: 1 }).success).toBe(false);
    expect(f({ type: 'object', properties: { r: { type: 'string', default: 'u' } } }).parse({})).toEqual({ r: 'u' });
    expect(f({ type: 'object', propertyNames: { pattern: '^x' } }).safeParse({ a: 1 }).success).toBe(false);
  });

  it('F145-F148 toJSONSchema output', () => {
    const js = (s: any, o?: any) => v.toJSONSchema(s, o) as any;
    expect(js(v.record(v.enum(['a', 'b']), v.number())).required).toEqual(['a', 'b']);
    expect(js(v.object({ a: v.string() }).readonly()).readOnly).toBe(true);
    expect(js((v as any).stringbool()).type).toBe('boolean');
    expect(js((v as any).stringbool(), { io: 'input' }).type).toBe('string');
    expect(js(v.string().catch('x')).default).toBe('x');
    expect(js(v.number().catch(() => 0)).default).toBe(0);
    expect(js(v.number().catch((ctx: any) => ctx.error.issues.length)).default).toBeUndefined();
  });

  it('F151 compile() agrees with the interpreter for records and optional tuple tails', () => {
    for (const [make, input] of [
      [() => v.record(v.string(), v.number()), new Date(0)],
      [() => v.record(v.string(), v.number()), { a: 1 }],
      [() => v.record(v.enum(['a', 'b']), v.number()), { a: 1 }],
      [() => v.tuple([v.string(), v.number().optional()]), ['a']],
    ] as Array<[() => any, unknown]>) {
      expect(v.validate(v.compile(make()), input)).toBe(make().safeParse(input).success);
    }
  });
});

describe('audit regressions round 4: async parsing, wrappers and refinements', () => {
  const V: any = v;

  it('F152-F153 object and collections parse asynchronously with Zod paths', async () => {
    const asyncStr = V.string().refine(async (s: string) => s.length > 1, 'short');
    expect(await V.object({ a: asyncStr }).parseAsync({ a: 'ok' })).toEqual({ a: 'ok' });
    await expect(V.object({ a: asyncStr }).parseAsync(5)).rejects.toBeInstanceOf(Error);
    const missing = await V.object({ u: V.undefined(), p: V.any() }).safeParseAsync({});
    expect(issuesOf(missing).map((i: any) => i.path)).toEqual([['u'], ['p']]);
    expect(issuesOf(await V.object({ a: 5 }).safeParseAsync({ a: 1 }))[0].path).toEqual(['a']);
    expect(issuesOf(await V.object({ a: asyncStr }).safeParseAsync({ a: 'x' }))[0].path).toEqual(['a']);
    const strict = await V.object({ a: V.string() }).strict().safeParseAsync({ a: 'x', b: 1, c: 2 });
    expect(issuesOf(strict)).toEqual([expect.objectContaining({ code: 'unrecognized_keys', path: [], keys: ['b', 'c'] })]);
    expect(await V.object({ a: V.string() }).passthrough().parseAsync({ a: 'x', b: 1, __proto__x: 2 })).toEqual({ a: 'x', b: 1, __proto__x: 2 });
    const catchall = V.object({ a: V.string() }).catchall(V.number().refine(async (n: number) => n > 0, 'pos'));
    expect(await catchall.parseAsync({ a: 'x', n: 1 })).toEqual({ a: 'x', n: 1 });
    expect(issuesOf(await catchall.safeParseAsync({ a: 'x', n: -1 }))[0].path).toEqual(['n']);

    const arr = V.array(asyncStr);
    expect(await arr.parseAsync(['ab'])).toEqual(['ab']);
    await expect(arr.parseAsync('x')).rejects.toThrow();
    expect(issuesOf(await arr.safeParseAsync(['ab', 'x']))[0].path).toEqual([1]);
    expect(issuesOf(await arr.length(2).safeParseAsync(['ab']))[0].code).toBe('too_small');
    expect(issuesOf(await arr.length(1).safeParseAsync(['ab', 'cd']))[0].code).toBe('too_big');
    expect(issuesOf(await arr.min(2).safeParseAsync(['ab']))[0].code).toBe('too_small');
    expect(issuesOf(await arr.max(1).safeParseAsync(['ab', 'cd']))[0].code).toBe('too_big');
    expect((await V.array(V.number()).unique().safeParseAsync([1, 1])).success).toBe(false);

    const tup = V.tuple([asyncStr], V.number());
    expect(await tup.parseAsync(['ab', 1, 2])).toEqual(['ab', 1, 2]);
    expect(issuesOf(await tup.safeParseAsync(['x', 'y'])).map((i: any) => i.path)).toEqual([[0], [1]]);
    expect(issuesOf(await V.tuple([asyncStr]).safeParseAsync([]))[0].code).toBe('too_small');
    expect(await V.tuple([asyncStr, V.number().optional()]).parseAsync(['ab'])).toEqual(['ab']);

    const map = V.map(V.string().refine(async () => true), asyncStr);
    expect(await map.parseAsync(new Map([['k', 'ab']]))).toEqual(new Map([['k', 'ab']]));
    await expect(map.parseAsync({})).rejects.toThrow();
    const badMap = issuesOf(await V.map(V.string(), asyncStr).safeParseAsync(new Map<any, any>([[1, 'ab'], ['k', 'x'], [{}, 'ab']])));
    expect(badMap.map((i: any) => [i.code, i.path])).toEqual([['invalid_key', [1]], ['custom', ['k']], ['invalid_key', [2]]]);
    expect(issuesOf(await V.map(V.string(), V.string()).min(2).safeParseAsync(new Map([['a', 'b']])))[0].code).toBe('too_small');

    const set = V.set(asyncStr);
    expect(await set.parseAsync(new Set(['ab']))).toEqual(new Set(['ab']));
    await expect(set.parseAsync([])).rejects.toThrow();
    expect(issuesOf(await set.safeParseAsync(new Set(['ab', 'x'])))[0].path).toEqual([1]);
    expect(issuesOf(await V.set(V.string()).max(1).safeParseAsync(new Set(['a', 'b'])))[0].code).toBe('too_big');

    const rec = V.record(V.string(), asyncStr);
    expect(await rec.parseAsync({ a: 'ab', __proto__: 'x' })).toEqual({ a: 'ab' });
    await expect(rec.parseAsync([])).rejects.toThrow();
    expect(issuesOf(await rec.safeParseAsync({ a: 'x' }))[0].path).toEqual(['a']);
    expect(await V.record(V.number(), V.string()).parseAsync({ 1: 'a' })).toEqual({ 1: 'a' });
    expect(issuesOf(await V.record(V.string().min(2), V.string()).safeParseAsync({ x: 'a' }))[0].code).toBe('invalid_key');
    expect(await V.record(V.string().transform(() => '__proto__'), V.number()).parseAsync({ x: 1 })).toEqual({});
    expect(await V.record(V.enum(['a', 'b']), V.number().default(0)).parseAsync({ a: 1 })).toEqual({ a: 1, b: 0 });
    expect(await V.record(V.enum(['a', 'b']), V.number().optional()).parseAsync({ a: 1 })).toEqual({ a: 1 });
    expect(issuesOf(await V.record(V.enum(['a', 'b']), V.number()).safeParseAsync({ a: 1, c: 2 })).map((i: any) => i.code)).toEqual(['invalid_type', 'unrecognized_keys']);
    const sym = Symbol('s');
    expect(issuesOf(await V.record(V.literal('a'), V.number()).safeParseAsync({ a: 1, [sym]: 1 }))[0].code).toBe('invalid_key');

    expect(await V.union([asyncStr, V.number()]).parseAsync(1)).toBe(1);
    await expect(V.union([asyncStr, V.number()]).parseAsync(true)).rejects.toThrow();
    expect(await V.xor([asyncStr, V.number()]).parseAsync('ab')).toBe('ab');
    expect(issuesOf(await V.xor([asyncStr, V.number()]).safeParseAsync(true))[0].message).toMatch(/No schema matched/);
    expect(issuesOf(await V.xor([V.string(), asyncStr]).safeParseAsync('ab'))[0].matches).toEqual([0, 1]);
    expect(await V.intersection(V.object({ a: asyncStr }), V.object({ b: V.number() })).parseAsync({ a: 'ab', b: 1 })).toEqual({ a: 'ab', b: 1 });
    await expect(V.intersection(V.object({ a: asyncStr }), V.object({ b: V.number() })).parseAsync({ a: 'x', b: 1 })).rejects.toThrow();
    expect(await V.lazy(() => asyncStr).parseAsync('ab')).toBe('ab');
    const du = V.discriminatedUnion('t', [V.object({ t: V.literal('a'), s: asyncStr }), V.object({ t: V.literal(1) })]);
    expect(await du.parseAsync({ t: 'a', s: 'ab' })).toEqual({ t: 'a', s: 'ab' });
    expect(await du.parseAsync({ t: 1 })).toEqual({ t: 1 });
    expect(issuesOf(await du.safeParseAsync([]))[0].code).toBe('invalid_type');
    expect(issuesOf(await du.safeParseAsync({ t: 'z' }))[0].code).toBe('invalid_union');
  });

  it('F154-F155 wrappers parse asynchronously; catch over async schemas', async () => {
    const asyncStr = V.string().refine(async (s: string) => s.length > 1, 'short');
    expect(await asyncStr.describe('d').parseAsync('ab')).toBe('ab');
    expect(await asyncStr.brand('B').parseAsync('ab')).toBe('ab');
    expect(await asyncStr.default('dd').parseAsync(undefined)).toBe('dd');
    expect(await asyncStr.default('dd').parseAsync('ab')).toBe('ab');
    expect(await asyncStr.prefault('pp').parseAsync(undefined)).toBe('pp');
    expect(await asyncStr.catch('fb').parseAsync('x')).toBe('fb');
    expect(await asyncStr.catch('fb').parseAsync('ab')).toBe('ab');
    expect(await asyncStr.exactOptional().parseAsync(undefined)).toBeUndefined();
    expect(await asyncStr.exactOptional().parseAsync('ab')).toBe('ab');
    expect(await asyncStr.nullable().parseAsync(null)).toBeNull();
    expect(await asyncStr.nullable().parseAsync('ab')).toBe('ab');
    expect(await asyncStr.nullish().parseAsync(undefined)).toBeUndefined();
    expect(await V.string().default('x').nullish().parseAsync(undefined)).toBe('x');
    expect(await V.string().pipe(asyncStr).parseAsync('ab')).toBe('ab');
    expect(await V.preprocess((x: unknown) => String(x), asyncStr).parseAsync(12)).toBe('12');
    expect(V.string().refine(async () => true).catch('fb')).toBeDefined();
  });

  it('F156 refinements continue after non-fatal failures; abort / when', () => {
    const chained = V.string().min(5).refine(() => false, 'r1').refine(() => false, 'r2');
    expect(issuesOf(chained.safeParse('x')).map((i: any) => i.message)).toEqual(expect.arrayContaining(['r1', 'r2']));
    expect(issuesOf(V.string().min(5).refine(() => false, { message: 'a', abort: true }).refine(() => false, 'b').safeParse('x')).length).toBe(2);
    expect(issuesOf(V.string().refine(() => false, { message: 'a', abort: true }).refine(() => false, 'b').safeParse('x')).length).toBe(1);
    const sr = V.string().min(5).superRefine((_: string, ctx: any) => ctx.addIssue({ code: 'custom', message: 'sr' }));
    expect(issuesOf(sr.safeParse('x')).map((i: any) => i.message)).toContain('sr');
    expect(issuesOf(V.string().min(5).superRefine(async () => undefined).safeParse('x')).length).toBe(1);
    expect(issuesOf(V.string().min(5).superRefine(() => { throw new Error('boom'); }).safeParse('x')).length).toBe(1);
    expect(issuesOf(V.string().min(5).superRefine(() => undefined).safeParse('x')).length).toBe(1);
  });

  it('F155-F156 continuation edge cases', async () => {
    expect(issuesOf(V.string().min(5).refine(() => { throw new Error('x'); }).safeParse('a')).length).toBe(1);
    expect(() => V.lazy(() => { throw new Error('boom'); }).catch('x')).toThrow('Invalid fallback value');
    expect(() => V.string().min(5).superRefine(() => undefined).parse('a')).toThrow(VldError);
    expect(issuesOf(V.string().min(5).superRefine(async () => { throw new Error('x'); }).safeParse('a')).length).toBe(1);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(await V.record(V.string(), V.string()).parseAsync(JSON.parse('{"__proto__": "x", "a": "b"}'))).toEqual({ a: 'b' });
  });

  it('round 4 branch edges', async () => {
    const asyncStr = V.string().refine(async (s: string) => s.length > 1, 'short');
    expect(issuesOf(V.string().min(5).superRefine(() => undefined).refine(() => false, 'r').safeParse('a')).map((i: any) => i.message)).toContain('r');
    expect(V.object({ a: V.string() }).describe('d').safeExtend?.({ b: V.number() }) ?? true).toBeTruthy();
    expect(V.string().describe('d').isOptional?.() ?? false).toBe(false);
    expect(await asyncStr.prefault('pp').parseAsync('ab')).toBe('ab');
    expect(V.string().default('x').optional().safeParse(undefined)).toEqual({ success: true, data: 'x' });
    const Anon = (() => class {})();
    expect(issuesOf(V.instanceof(Anon).safeParse(1))[0].expected).toBe('provided constructor');
    expect(issuesOf(V.instanceof(Anon).properties({}).safeParse(1))[0].expected).toBe('provided constructor');
    expect(issuesOf(V.instanceof(Date).properties({}, { message: 'pm' }).safeParse(1))[0].message).toBe('pm');
    expect(await V.map(V.string(), asyncStr).min(1).parseAsync(new Map([['k', 'ab']]))).toEqual(new Map([['k', 'ab']]));
    expect(await V.set(asyncStr).min(1).parseAsync(new Set(['ab']))).toEqual(new Set(['ab']));
    expect(await V.object({ a: asyncStr.optional() }).parseAsync({})).toEqual({});
    expect(await V.object({ a: asyncStr.optional() }).parseAsync({ a: undefined })).toEqual({ a: undefined });
    expect(await V.object({}).passthrough().parseAsync(JSON.parse('{"__proto__": 1, "b": 2}'))).toEqual({ b: 2 });
    expect(Object.keys(V.object({ a: V.string(), b: V.number() }).partial({ a: false, b: true }).safeParse({ a: 'x' }).data ?? {})).toEqual(['a']);
    expect(await V.record(V.number().refine(async () => true)).parseAsync({ a: 1 })).toEqual({ a: 1 });
    expect(issuesOf(V.record(V.number().int(), V.string()).safeParse({ '1.5': 'a' }))[0].code).toBe('invalid_key');
    expect(issuesOf(await V.record(V.number().int(), asyncStr).safeParseAsync({ '1.5': 'ab' }))[0].code).toBe('invalid_key');
    expect(issuesOf(await V.xor([asyncStr, V.number()]).safeParseAsync('x'))[0].message).toMatch(/No schema matched/);
    await expect(V.xor([asyncStr, V.number()]).parseAsync('x')).rejects.toThrow(/No schema matched/);
    const inner = V.string();
    inner.email = () => 42;
    expect(inner.brand('B').email()).toBe(42);
    expect(V.union([]).safeEncode(1).success).toBe(false);
    const { VldCheckCidrV6 } = await import('../src/validators/string-v2');
    expect(new VldCheckCidrV6().check('x')?.message).toBe('Invalid cidrv6');
  });

  it('F198 refine `when` decides whether the check runs', () => {
    const when = (p: any) => typeof p.value?.a === 'string';
    const s = V.object({ a: V.string(), n: V.number() }).refine((o: any) => o.a === 'ok', { message: 'bad a', when });
    expect(issuesOf(s.safeParse({ a: 'no', n: 'x' })).map((i: any) => i.message)).toContain('bad a');
    expect(issuesOf(s.safeParse({ a: 1, n: 'x' })).map((i: any) => i.message)).not.toContain('bad a');
    expect(V.string().refine(() => false, { when: () => false }).safeParse('x').success).toBe(true);
    expect(issuesOf(V.string().refine(async () => true).refine(() => false, { when: () => true }).safeParse('x')).length).toBe(1);
  });

  it('F157 describe()/meta()/brand() keep the chain API', () => {
    expect(V.string().describe('d').email().safeParse('nope').success).toBe(false);
    expect(V.string().meta({ title: 'T' }).trim().parse(' a ')).toBe('a');
    expect(V.string().brand('X').nonempty().safeParse('').success).toBe(false);
    expect(V.object({ a: V.string() }).describe('o').extend({ b: V.number() }).meta()?.description).toBe('o');
    expect(Object.keys(V.object({ a: V.string() }).describe('x').shape)).toEqual(['a']);
    expect(() => V.boolean().describe('b').min(1)).toThrow(TypeError);
    expect(V.number().brand('N').int().safeParse(1.5).success).toBe(false);
    expect(V.literal(['a', 'b']).describe('d').parse('a')).toBe('a');
  });

  it('F159-F161 standalone formats: JWT header, custom messages, mac delimiter', () => {
    const h = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
    expect(V.jwt().safeParse(`${h({ alg: 'HS256' })}.e30.s`).success).toBe(true);
    expect(V.jwt({ alg: 'RS256' }).safeParse(`${h({ alg: 'HS256' })}.e30.s`).success).toBe(false);
    for (const t of ['a.b.c', `${h(null)}.e30.s`, `${h({ typ: 'JWT' })}.e30.s`, `${h({ alg: 'x', typ: 'jwt' })}.e30.s`, 'only.two', '.e30.s']) {
      expect(V.jwt().safeParse(t).success).toBe(false);
    }
    expect(core.isValidJWT(`${h({ alg: 'HS256' })}.e30.s`)).toBe(true);
    expect(issuesOf(V.email('mail!').safeParse('x'))[0].message).toBe('mail!');
    expect(issuesOf(V.uuid({ message: 'id!' }).safeParse('x'))[0].message).toBe('id!');
    expect(issuesOf(V.iso.datetime({ error: 'dt!' }).safeParse('x'))[0].message).toBe('dt!');
    expect(issuesOf(V.creditCard({ message: 'cc!' }).safeParse('1'))[0].message).toBe('cc!');
    expect(issuesOf(V.ipv4({}).safeParse('x'))[0].message).toBe('Invalid ipv4');
    expect(V.mac({ delimiter: '-' }).safeParse('00-1A-2B-3C-4D-5E').success).toBe(true);
  });

  it('F162-F164 ipv6 / cidrv6 agree with Zod', () => {
    expect(V.ipv6().safeParse('::ffff:1.2.3.4').success).toBe(true);
    expect(V.string().ipv6().safeParse('fe80::1%eth0').success).toBe(false);
    expect(V.string().ip().safeParse('::1%x').success).toBe(false);
    expect(V.cidrv6().safeParse('fe80::1%eth0/64').success).toBe(false);
    const c = V.stringV2().cidrv6('bad');
    expect(c.safeParse('2001:db8::1/64').success).toBe(true);
    expect(issuesOf(c.safeParse('x'))[0]).toEqual(expect.objectContaining({ code: 'invalid_format', format: 'cidrv6', message: 'bad' }));
    const check = (c as any).__def.checks[0];
    expect([check.message, check.meta().format]).toEqual(['bad', 'cidrv6']);
    expect(issuesOf(V.stringV2().cidrv6().safeParse('x'))[0].message).toBe('Invalid cidrv6');
  });

  it('F165-F166 toJSONSchema: V2 schemas and recursive objects', () => {
    expect(v.toJSONSchema(V.arrayV2(V.numberV2()).min(1).max(3).length(2).unique())).toEqual(expect.objectContaining({ minItems: 2, uniqueItems: true }));
    expect(v.toJSONSchema(V.stringV2().min(2).startsWith('a').endsWith('z').includes('m'))).toEqual(expect.objectContaining({ minLength: 2, pattern: '^a.*' }));
    expect(v.toJSONSchema(V.numberV2().int().min(1))).toEqual(expect.objectContaining({ type: 'integer', minimum: 1 }));
    expect(v.toJSONSchema(V.recordV2(V.numberV2()))).toEqual(expect.objectContaining({ additionalProperties: { type: 'number' } }));
    expect(v.toJSONSchema(V.unionV2(V.stringV2(), V.numberV2()))).toEqual(expect.objectContaining({ anyOf: [{ type: 'string' }, { type: 'number' }] }));
    expect(v.toJSONSchema(V.intersectionV2(V.object({ a: V.string() }), V.object({ b: V.number() })))).toBeDefined();
    expect(v.toJSONSchema(V.literalV2('x'))).toEqual(expect.objectContaining({ const: 'x' }));
    expect(v.toJSONSchema(V.enumV2(['a']))).toEqual(expect.objectContaining({ enum: ['a'] }));
    expect(v.toJSONSchema(V.object({ a: V.optionalV2(V.stringV2()) }))).toEqual(expect.objectContaining({ properties: { a: { type: 'string' } } }));
    expect(v.toJSONSchema(V.nullableV2(V.stringV2()))).toEqual(expect.objectContaining({ type: ['string', 'null'] }));
    expect(v.toJSONSchema(V.nullishV2(V.stringV2()))).toEqual(expect.objectContaining({ type: ['string', 'null'] }));
    expect(v.toJSONSchema(V.refineV2(V.stringV2().min(1), () => true))).toEqual(expect.objectContaining({ minLength: 1 }));
    expect(v.toJSONSchema(V.transformV2(V.stringV2(), (x: string) => x), { unrepresentable: 'any' })).toEqual(expect.objectContaining({}));
    expect(() => v.toJSONSchema(V.transformV2(V.stringV2(), (x: string) => x))).toThrow();
    expect(v.toJSONSchema(V.booleanV2())).toEqual(expect.objectContaining({ type: 'boolean' }));
    const Tree: any = V.object({ name: V.string(), get children() { return V.array(Tree); } });
    expect((v.toJSONSchema(Tree) as any).properties.children.items).toEqual({ $ref: '#' });
    const Node: any = V.object({ value: V.number(), get next() { return Node.optional(); } });
    const outer: any = v.toJSONSchema(V.object({ head: Node, tail: Node }));
    expect(outer.properties.head).toEqual({ $ref: '#/$defs/__schema0' });
    expect(outer.$defs.__schema0.properties.next).toEqual({ $ref: '#/$defs/__schema0' });
    expect((v.toJSONSchema(V.object({ head: Node }), { target: 'draft-07' }) as any).definitions.__schema0).toBeDefined();
  });

  it('F167-F168 datetime / time options', () => {
    expect(V.string().datetime({ offset: true }).safeParse('2024-01-01T00:00:00+02:00').success).toBe(true);
    expect(V.string().datetime({ local: true }).safeParse('2024-01-01T00:00').success).toBe(true);
    expect(V.string().datetime({ precision: 3 }).safeParse('2024-01-01T00:00:00Z').success).toBe(false);
    expect(V.string().time({ precision: 0 }).safeParse('10:00').success).toBe(false);
    expect(V.string().time().safeParse('10:00').success).toBe(true);
    expect(V.stringV2().time({ precision: 2 }).safeParse('10:00:00.12').success).toBe(true);
    expect(V.stringV2().time().safeParse('10:00').success).toBe(true);
    expect(V.stringV2().datetime({ offset: true }).safeParse('2024-01-01T00:00:00+02:00').success).toBe(true);
    expect(V.iso.datetime().safeParse('2024-01-01T10:30Z').success).toBe(false);
    expect(V.iso.datetime({ precision: 2 }).safeParse('2024-01-01T10:30:00.12Z').success).toBe(true);
    expect(V.iso.dateTime().safeParse('2024-01-01T10:30').success).toBe(true);
    expect(issuesOf(V.string().datetime('dt!').safeParse('x'))[0].message).toBe('dt!');
  });

  it('F169-F171 partial / required / pick / omit masks', () => {
    const s = V.object({ a: V.string(), b: V.number() });
    expect(s.partial({ a: true }).safeParse({}).success).toBe(false);
    expect(s.partial({ a: true }).safeParse({ b: 1 }).success).toBe(true);
    expect(s.partial().required({ a: true }).safeParse({ a: 'x' }).success).toBe(true);
    expect(() => s.partial({ zz: true })).toThrow('Unrecognized key: "zz"');
    expect(() => s.pick({ zz: true })).toThrow('Unrecognized key');
    expect(() => s.omit({ zz: true })).toThrow('Unrecognized key');
    expect(Object.keys(s.pick('toString', 'a').shape)).toEqual(['a']);
    expect(V.object({ a: V.string().optional() }).partial().required().safeParse({}).success).toBe(false);
  });

  it('F172 string lengths count code points', () => {
    expect(codePointLength('a\u{1F600}b')).toBe(3);
    expect(codePointLength('\uD83D')).toBe(1);
    expect(V.string().max(1).safeParse('\u{1F600}').success).toBe(true);
    expect(V.string().length(1).safeParse('\u{1F600}').success).toBe(true);
    expect(V.string().min(2).safeParse('\u{1F600}').success).toBe(false);
    expect(issuesOf(V.string().length(3).safeParse('\u{1F600}'))[0].code).toBe('too_small');
    expect(V.stringV2().max(1).safeParse('\u{1F600}').success).toBe(true);
    expect(v.compile(V.string().max(1)).safeParse('\u{1F600}').success).toBe(true);
    expect(v.compile(V.string().length(1)).safeParse('\u{1F600}').success).toBe(true);
    expect(v.compile(V.string().min(2)).safeParse('\u{1F600}').success).toBe(false);
  });

  it('F173-F175 default inside optional, stringbool case and issues', () => {
    expect(V.string().default('x').optional().parse(undefined)).toBe('x');
    expect(V.string().default('x').nullish().parse(undefined)).toBe('x');
    expect(V.string().default('x').nullish().safeParse(null)).toEqual({ success: true, data: null });
    expect(V.stringbool({ case: 'sensitive' }).safeParse('TRUE').success).toBe(false);
    expect(V.stringbool({ case: 'insensitive' }).safeParse('TRUE').success).toBe(true);
    expect(issuesOf(V.stringbool().safeParse('maybe'))[0].code).toBe('invalid_value');
    expect(issuesOf(V.stringbool().safeParse(5))[0]).toEqual(expect.objectContaining({ code: 'invalid_type', expected: 'string' }));
  });

  it('F176 numeric formats report too_big / too_small / int', () => {
    expect(issuesOf(V.uint32().safeParse(-1))[0].code).toBe('too_small');
    expect(issuesOf(V.uint32().safeParse(2 ** 32))[0].code).toBe('too_big');
    expect(issuesOf(V.float32().safeParse(3.5e38))[0].code).toBe('too_big');
    expect(issuesOf(V.number().int64().safeParse(1.5))[0].code).toBe('invalid_type');
    expect(issuesOf(V.number().safe().safeParse(2 ** 53))[0].code).toBe('too_big');
  });

  it('F177-F178 strict / catchall issues and parse() errors', () => {
    const strict = V.object({ a: V.string() }).strict();
    expect(issuesOf(strict.safeParse({ a: 'x', b: 1, c: 2 }))).toEqual([expect.objectContaining({ code: 'unrecognized_keys', path: [], keys: ['b', 'c'] })]);
    expect(() => strict.parse({ a: 'x', b: 1 })).toThrow(VldError);
    expect(() => V.object({}).catchall(V.number()).parse({ n: 'x' })).toThrow(VldError);
  });

  it('F179-F181 date, coerce.date and tuple issue codes', () => {
    expect(issuesOf(V.date().min(new Date(1000)).safeParse(new Date(1)))[0]).toEqual(expect.objectContaining({ code: 'too_small', minimum: 1000 }));
    expect(issuesOf(V.date().max(new Date(1000)).safeParse(new Date(2000)))[0].code).toBe('too_big');
    expect(issuesOf(V.date().between(new Date(10), new Date(20)).safeParse(new Date(30)))[0].code).toBe('too_big');
    expect(issuesOf(V.date().between(new Date(10), new Date(20)).safeParse(new Date(1)))[0].code).toBe('too_small');
    expect(issuesOf(V.date().safeParse(new Date(NaN)))[0].received).toBe('Invalid Date');
    expect(issuesOf(V.date().safeParse({}))[0].expected).toBe('date');
    expect(issuesOf(V.coerce.date().min(new Date('2024-01-01'), 'early').safeParse('2023-01-01'))[0].message).toBe('early');
    expect(issuesOf(V.tuple([V.string()]).safeParse([]))[0].code).toBe('too_small');
    expect(issuesOf(V.tuple([V.string()]).safeParse(['a', 'b']))[0].code).toBe('too_big');
    expect(issuesOf(V.tuple([V.string()]).safeParse('x'))[0].expected).toBe('tuple');
  });

  it('F182-F186 type issues carry `expected`; file, nan, record, instanceof, nonoptional, templateLiteral', () => {
    for (const [s, exp] of [[V.symbol(), 'symbol'], [V.null(), 'null'], [V.undefined(), 'undefined'], [V.void(), 'void'], [V.never(), 'never'], [V.function(), 'function'], [V.map(V.string(), V.string()), 'map'], [V.set(V.string()), 'set'], [V.object({}), 'object'], [V.nan(), 'nan'], [V.record(V.string(), V.string()), 'record'], [V.instanceof(Date), 'Date']] as Array<[any, string]>) {
      expect(issuesOf(s.safeParse(5))[0].expected).toBe(exp);
    }
    expect(issuesOf(V.looseRecord(V.string(), V.number()).safeParse('x'))[0].code).toBe('invalid_type');
    expect(issuesOf(V.instanceof(Date).properties({}).safeParse(1))[0].code).toBe('invalid_type');
    const f = new File(['ab'], 'a.txt', { type: 'text/plain' });
    expect(issuesOf(V.file().min(3).safeParse(f))[0].code).toBe('too_small');
    expect(issuesOf(V.file().max(1).safeParse(f))[0].code).toBe('too_big');
    expect(issuesOf(V.file().mime('image/png').safeParse(f))[0].code).toBe('invalid_value');
    expect(issuesOf(V.file().safeParse(1))[0].expected).toBe('file');
    expect(issuesOf(V.string().optional().nonoptional().safeParse(undefined))[0].expected).toBe('nonoptional');
    expect(issuesOf(V.string().optional().nonoptional().min(2).safeParse(undefined))[0].expected).toBe('nonoptional');
    expect(issuesOf(V.nonoptional(V.string().optional()).safeParse(undefined))[0].code).toBe('invalid_type');
    expect(issuesOf(V.templateLiteral(['a', V.number()]).safeParse('ab'))[0].code).toBe('invalid_format');
    expect(issuesOf(V.templateLiteral(['a']).safeParse(1))[0].code).toBe('invalid_type');
  });

  it('F187-F192 coercion, literalV2, tupleV2, discriminated union and enum-keyed records', () => {
    expect(issuesOf(V.coerce.number().safeParse('x'))[0]).toEqual(expect.objectContaining({ code: 'invalid_type', expected: 'number', received: 'NaN' }));
    expect(issuesOf(V.coerce.bigint().safeParse('x'))[0].expected).toBe('bigint');
    expect(issuesOf(V.coerce.bigint().safeParse(''))[0].expected).toBe('bigint');
    expect(issuesOf(V.coerce.bigint().safeParse(1.5))[0].expected).toBe('bigint');
    expect(issuesOf(V.coerce.bigint().safeParse(null))[0].expected).toBe('bigint');
    expect(issuesOf(V.coerce.bigint().safeParse({}))[0].expected).toBe('bigint');
    expect(issuesOf(V.coerce.bigint().min(5n, 'small').safeParse(true))[0].message).toBe('small');
    expect(issuesOf(V.coerce.bigint().min(5n, 'small').safeParse('3'))[0].message).toBe('small');
    expect(issuesOf(V.coerce.date().safeParse('x'))[0].expected).toBe('date');
    expect(issuesOf(V.literalV2('a').safeParse('b'))[0]).toEqual(expect.objectContaining({ code: 'invalid_value', values: ['a'] }));
    expect(() => V.literalV2('a').parse('b')).toThrow(VldError);
    expect(issuesOf(V.tupleV2(V.stringV2()).safeParse([]))[0].code).toBe('too_small');
    expect(issuesOf(V.tupleV2(V.stringV2()).safeParse(['a', 'b']))[0].code).toBe('too_big');
    expect(issuesOf(V.discriminatedUnion('t', [V.object({ t: V.literal('a') })]).safeParse([]))[0].code).toBe('invalid_type');
    expect(() => V.discriminatedUnion('t', [V.object({ t: V.literal('a') })]).parse([])).toThrow(VldError);
    const rec = V.record(V.enum(['a', 'b']), V.number());
    expect(issuesOf(rec.safeParse({ a: 1, b: 2, c: 3 }))).toEqual([expect.objectContaining({ code: 'unrecognized_keys', keys: ['c'] })]);
    expect(issuesOf(rec.safeParse({ a: 1 }))[0]).toEqual(expect.objectContaining({ code: 'invalid_type', path: ['b'] }));
  });

  it('F193-F196 URL and email formats', () => {
    expect(V.httpUrl().safeParse('http://localhost').success).toBe(false);
    expect(V.httpUrl().safeParse('https://example.com').success).toBe(true);
    expect(V.url().parse(' https://example.com ')).toBe('https://example.com');
    expect(V.url({ normalize: true }).parse('HTTPS://EXAMPLE.COM')).toBe('https://example.com/');
    expect(V.string().email().safeParse('mailto:a@b.co').success).toBe(false);
    expect(V.stringV2().email().safeParse('a@-b.co').success).toBe(false);
    expect(V.string().url().safeParse('https://example.com/a,b').success).toBe(true);
    expect(V.string().url().safeParse('ftp://example.com').success).toBe(false);
    expect(V.stringV2().url().safeParse('http://localhost:3000').success).toBe(true);
    expect(V.stringV2().url().safeParse('mailto:a@b.co').success).toBe(false);
    expect(v.compile(V.string().url()).safeParse('https://a.co/x,y').success).toBe(true);
    expect(v.compile(V.object({ u: V.string().url() })).safeParse({ u: 'x' }).success).toBe(false);
    expect(v.compile(V.stringV2().url()).safeParse('x').success).toBe(false);
  });

  it('F197 object.parse() throws VldError with field paths', () => {
    const O = V.object({ a: V.string(), b: V.number() });
    try {
      O.parse({ a: 'x', b: 'y' });
      throw new Error('expected a failure');
    } catch (e: any) {
      expect(e).toBeInstanceOf(VldError);
      expect(e.issues[0].path).toEqual(['b']);
    }
    expect(issuesOf(O.refine(() => true).safeParse({ a: 1, b: 1 }))[0].path).toEqual(['a']);
    expect(() => O.parse(null)).toThrow(VldError);
    const du = V.discriminatedUnion('t', [V.object({ t: V.literal('a'), n: V.number() })]);
    expect(() => du.parse({ t: 'a', n: 'x' })).toThrow(VldError);
  });

  it('F199 treeifyError / formatError expand union branches', () => {
    const s = V.object({ u: V.union([V.string(), V.object({ k: V.number() })]) });
    const err = s.safeParse({ u: { k: 'x' } }).error;
    expect((treeifyError(err) as any).properties.u.properties.k).toBeDefined();
    expect(V.formatError(err).u.k._errors.length).toBe(1);
    const keyErr = new VldError([{ code: 'invalid_key', path: ['r'], message: 'k', issues: [{ code: 'custom', path: [], message: 'inner' }] } as any]);
    expect((treeifyError(keyErr) as any).properties.r.errors).toEqual(['inner']);
    expect(expandNestedIssues([{ code: 'invalid_union', path: ['u'], message: 'm', errors: [null, [{ code: 'custom', path: [0], message: 'x' }]] } as any])).toEqual([expect.objectContaining({ path: ['u', 0] })]);
    expect(nestIssues(new Error('plain'), 'k', (m: string) => `<${m}>`)).toEqual([{ code: 'custom', path: ['k'], message: '<plain>' }]);
    expect(nestIssues('text', 'k', (m: string) => m)[0]?.message).toBe('text');
  });

  it('F200-F201 includes position; multi-value literal .value', () => {
    expect(V.string().includes('a', { position: 2 }).safeParse('abc').success).toBe(false);
    expect(V.stringV2().includes('a', { position: 2 }).safeParse('aba').success).toBe(true);
    expect(v.compile(V.stringV2().includes('a', { position: 2 })).safeParse('abc').success).toBe(false);
    expect(v.compile(V.stringV2().includes('a')).safeParse('abc').success).toBe(true);
    expect(() => V.literal(['a', 'b']).value).toThrow('Use `.values` instead.');
    expect(V.literal('a').value).toBe('a');
  });
});
