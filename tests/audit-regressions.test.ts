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
import { VldCodec } from '../src/validators/codec';
import { createEmitter, createEventBus } from '../src/compat/emitter';
import { tryCatch, tryCatchAsync } from '../src/compat/result';
import { definePlugin, createVldKernel } from '../src/kernel';
import { createLogger } from '../src/logger';
import { supportsColor, pigment, strip } from '../src/pigment';
import { setLocaleAsync, setLocale, getLocale, registerLocale } from '../src/locales/lazy';
import { de } from '../src/locales/de';
import { stringToInt, epochSecondsToDate, epochMillisToDate, numberToBigInt, isoDatetimeToDate, stringToURL } from '../src/codecs/index';
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
