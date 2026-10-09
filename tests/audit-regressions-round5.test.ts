/**
 * Regression tests for audit round 5 (findings F202+).
 * Each block pins one previously-proven defect so it cannot silently return.
 */
import { describe, it, expect, jest } from '@jest/globals';
import { v } from '../src/index';

describe('audit regressions round 5: validators/base wrappers', () => {
  const V: any = v;

  it('F203 .catch() accepts output-domain fallbacks for transform, pipe, preprocess and codec-like schemas', async () => {
    const lengthOrZero = V.string().transform((s: string) => s.length).catch(0);
    expect(lengthOrZero.parse(1)).toBe(0);
    expect(lengthOrZero.parse('abc')).toBe(3);
    expect(await lengthOrZero.parseAsync(1)).toBe(0);
    expect(V.string().pipe(V.coerce.number()).catch(7).parse('x')).toBe(7);
    // containers holding a transform are detected too
    expect(V.object({ n: V.string().transform((s: string) => s.length) }).catch({ n: 0 }).parse(1)).toEqual({ n: 0 });
    expect(V.array(V.string().transform((s: string) => s.length)).catch([]).parse(1)).toEqual([]);
    expect(V.union([V.number(), V.string().transform((s: string) => s.length)]).catch(-1).parse(null)).toBe(-1);
    expect(V.stringbool().catch(true).parse('nope')).toBe(true);
    // a self-referencing schema graph does not hang the detection
    const node: any = V.lazy(() => V.object({ next: node.nullable() }));
    expect(V.object({ next: V.lazy(() => node).nullable() }).catch({ next: null }).parse(1)).toEqual({ next: null });
  });

  it('F203 .catch() still rejects fallbacks that violate a same-domain schema', () => {
    expect(() => V.string().min(5).catch('no')).toThrow('Invalid fallback value');
    expect(() => V.object({ a: V.string() }).catch({ a: 1 })).toThrow('Invalid fallback value');
    expect(() => V.array(V.number()).min(2).catch([1])).toThrow('Invalid fallback value');
  });

  it('F204 parseAsync of refine/superRefine reports the same issues as parse', async () => {
    const codes = (r: any) => (r.success ? 'OK' : r.error.issues.map((i: any) => i.code).join('|'));
    const refined = V.string().min(5).refine((s: string) => String(s).includes('x'), 'no x');
    expect(codes(refined.safeParse('ab'))).toBe('too_small|custom');
    expect(codes(await refined.safeParseAsync('ab'))).toBe('too_small|custom');
    expect(codes(await refined.safeParseAsync('abx'))).toBe('too_small');
    expect(codes(await refined.safeParseAsync(5))).toBe('invalid_type');
    expect(await refined.parseAsync('abcdex')).toBe('abcdex');

    const asyncRefined = V.string().min(5).refine(async (s: string) => String(s).includes('x'), 'no x');
    expect(codes(await asyncRefined.safeParseAsync('ab'))).toBe('too_small|custom');

    const withIssue = V.string().min(5).superRefine((s: string, ctx: any) => {
      if (!String(s).includes('x')) ctx.addIssue({ code: 'custom', message: 'no x' });
    });
    expect(codes(withIssue.safeParse('ab'))).toBe('too_small|custom');
    expect(codes(await withIssue.safeParseAsync('ab'))).toBe('too_small|custom');
    expect(codes(await withIssue.safeParseAsync('abx'))).toBe('too_small');

    // a refinement that throws must not hide the original error
    const thrower = V.string().min(5).refine(() => { throw new Error('boom'); });
    expect(codes(await thrower.safeParseAsync('ab'))).toBe('too_small');
    const superThrower = V.string().min(5).superRefine(() => { throw new Error('boom'); });
    expect(codes(await superThrower.safeParseAsync('ab'))).toBe('too_small');
  });

  it('F204 refine `when` is honoured by parseAsync', async () => {
    const never = V.string().min(5).refine((s: string) => String(s).includes('x'), { message: 'no x', when: () => false });
    expect((await never.safeParseAsync('abcde')).success).toBe(true);
    expect((await never.safeParseAsync('ab')).success).toBe(false);
    expect((await never.safeParseAsync('ab')).error.issues.map((i: any) => i.code)).toEqual(['too_small']);
    const always = V.string().min(5).refine((s: string) => String(s).includes('x'), { message: 'no x', when: () => true });
    expect((await always.safeParseAsync('ab')).error.issues.map((i: any) => i.code)).toEqual(['too_small', 'custom']);
  });

  it('F205 superRefine fatal issues stop later refinements', async () => {
    const msgs = (r: any) => r.error.issues.map((i: any) => i.message);
    const fatal = V.string()
      .superRefine((_s: string, ctx: any) => ctx.addIssue({ code: 'custom', message: 'a', fatal: true }))
      .refine(() => false, 'b');
    expect(msgs(fatal.safeParse('s'))).toEqual(['a']);
    expect(msgs(await fatal.safeParseAsync('s'))).toEqual(['a']);
    const nonFatal = V.string()
      .superRefine((_s: string, ctx: any) => ctx.addIssue({ code: 'custom', message: 'a' }))
      .refine(() => false, 'b');
    expect(msgs(nonFatal.safeParse('s'))).toEqual(['a', 'b']);
    expect('fatal' in fatal.safeParse('s').error.issues[0]).toBe(false);
  });

  describe('F206-F207 encode direction through wrappers', () => {
    const makeCodec = (async: boolean) => V.codec(V.string(), V.number(), {
      decode: async ? async (s: string) => Number(s) : (s: string) => Number(s),
      encode: async ? async (n: number) => String(n) : (n: number) => String(n)
    });

    it('F206 encodeAsync / safeEncodeAsync run the encoder through every forwarding wrapper', async () => {
      for (const async of [false, true]) {
        const codec = makeCodec(async);
        const wrapped = [
          codec.optional(), codec.nullable(), codec.nullish(), codec.exactOptional(), codec.default(1),
          codec.readonly(), codec.meta({ a: 1 }), codec.brand(), V.lazy(() => codec), codec.optional().nullable()
        ];
        for (const schema of wrapped) {
          expect(await schema.encodeAsync(5)).toBe('5');
          expect(await schema.safeEncodeAsync(5)).toEqual({ success: true, data: '5' });
          expect((await schema.safeEncodeAsync('not a number')).success).toBe(false);
        }
        // the nullish family short-circuits its empty values before touching the codec
        expect(await codec.optional().encodeAsync(undefined)).toBeUndefined();
        expect(await codec.exactOptional().encodeAsync(undefined)).toBeUndefined();
        expect(await codec.nullable().encodeAsync(null)).toBeNull();
        expect(await codec.nullish().encodeAsync(null)).toBeNull();
        expect(await codec.nullish().encodeAsync(undefined)).toBeUndefined();
      }
      // plain schemas are unaffected
      expect(await V.string().optional().encodeAsync('a')).toBe('a');
    });

    it('F207 refine, superRefine, catch, prefault and pipe encode through the wrapped codec', async () => {
      for (const async of [false, true]) {
        const codec = makeCodec(async);
        const positive = codec.refine((n: number) => n > 0, 'neg');
        const checked = codec.superRefine((n: number, ctx: any) => { if (n < 0) ctx.addIssue({ code: 'custom', message: 'neg' }); });
        const piped = codec.pipe(V.number().min(0));
        const schemas = [positive, checked, codec.catch(0), codec.prefault('1'), piped, codec.refine((n: number) => n > 0).optional()];
        for (const schema of schemas) {
          expect(await schema.encodeAsync(5)).toBe('5');
          expect(await schema.safeEncodeAsync(5)).toEqual({ success: true, data: '5' });
        }
        // checks judge the value being encoded
        expect((await positive.safeEncodeAsync(-1)).error.issues[0].message).toBe('neg');
        expect((await checked.safeEncodeAsync(-1)).error.issues[0].message).toBe('neg');
        expect((await piped.safeEncodeAsync(-1)).success).toBe(false);
        // a value of the wrong type surfaces the base error (and a throwing/failing check is not appended twice)
        expect((await positive.safeEncodeAsync('x')).success).toBe(false);
        expect((await checked.safeEncodeAsync('x')).success).toBe(false);
      }
      const codec = makeCodec(false);
      expect(codec.refine((n: number) => n > 0).encode(5)).toBe('5');
      expect(codec.refine((n: number) => n > 0, { message: 'neg', when: () => false }).encode(-1)).toBe('-1');
      expect(() => codec.refine((n: number) => n > 0, 'neg').encode(-1)).toThrow('neg');
      expect(codec.refine((n: number) => n > 0, 'neg').safeEncode(-1).success).toBe(false);
      expect(() => codec.refine(async (n: number) => n > 0).encode(5)).toThrow('Use encodeAsync');
      expect(codec.superRefine(() => undefined).encode(5)).toBe('5');
      expect(() => codec.superRefine((n: number, ctx: any) => { if (n < 0) ctx.addIssue('neg'); }).encode(-1)).toThrow('neg');
      expect(() => codec.superRefine(async () => undefined).encode(5)).toThrow('Use encodeAsync');
      expect(codec.catch(0).encode(5)).toBe('5');
      expect(codec.catch(0).safeEncode(5)).toEqual({ success: true, data: '5' });
      expect(codec.prefault('1').encode(5)).toBe('5');
      expect(codec.prefault('1').safeEncode(5)).toEqual({ success: true, data: '5' });
      expect(codec.pipe(V.number().min(0)).encode(5)).toBe('5');
      expect(codec.pipe(V.number().min(0)).safeEncode(-5).success).toBe(false);
      // async refinements and `when` are honoured by encodeAsync
      expect(await codec.refine(async (n: number) => n > 0).encodeAsync(5)).toBe('5');
      expect((await codec.refine(async (n: number) => n > 0, 'neg').safeEncodeAsync(-1)).success).toBe(false);
      expect(await codec.refine((n: number) => n > 0, { message: 'neg', when: () => false }).encodeAsync(-1)).toBe('-1');
      // plain (non-codec) schemas keep reporting the base issue plus the refinement issue
      const plain = V.string().min(5).refine((s: string) => s.includes('x'), 'no x');
      expect(plain.safeEncode('ab').error.issues.map((i: any) => i.code)).toEqual(['too_small', 'custom']);
      expect((await plain.safeEncodeAsync('ab')).error.issues.map((i: any) => i.code)).toEqual(['too_small', 'custom']);
      const plainSuper = V.string().min(5).superRefine((s: string, ctx: any) => { if (!s.includes('x')) ctx.addIssue({ code: 'custom', message: 'no x' }); });
      expect(plainSuper.safeEncode('ab').error.issues.map((i: any) => i.code)).toEqual(['too_small', 'custom']);
      expect((await plainSuper.safeEncodeAsync('ab')).error.issues.map((i: any) => i.code)).toEqual(['too_small', 'custom']);
    });
  });
});

describe('audit regressions round 5: locales', () => {
  it('F208 lazy locale loaders ignore Object.prototype names', async () => {
    const lazy = await import('../src/locales/lazy');
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      for (const key of ['constructor', 'toString', 'hasOwnProperty', '__proto__']) {
        expect(lazy.isLocaleSupported(key as any)).toBe(false);
        await lazy.setLocaleAsync(key as any);
        expect(lazy.getLocale()).toBe('en');
        expect(Object.keys(lazy.getMessages()).length).toBeGreaterThan(0);
        expect(lazy.isLocaleLoaded(key as any)).toBe(false);
      }
      await lazy.preloadLocales(['constructor', 'toString'] as any);
      expect(lazy.isLocaleLoaded('constructor' as any)).toBe(false);
      expect(() => lazy.setLocale('constructor' as any)).toThrow('not preloaded');
      // real locales still load
      await lazy.setLocaleAsync('tr');
      expect(lazy.getLocale()).toBe('tr');
      expect(lazy.isLocaleSupported('tr')).toBe(true);
    } finally {
      warn.mockRestore();
      await lazy.setLocaleAsync('en');
    }
  });
});

describe('audit regressions round 5: utils', () => {
  it('F209 an IPv4 tail embedded in an IPv6 literal rejects leading-zero octets', () => {
    const V: any = v;
    for (const bad of ['::ffff:01.2.3.4', '::ffff:1.2.3.04', '::1.002.3.4', '64:ff9b::001.2.3.4', '::ffff:010.0.0.1', '::ffff:00.0.0.0']) {
      expect(V.string().ipv6().safeParse(bad).success).toBe(false);
      expect(V.stringV2().ipv6().safeParse(bad).success).toBe(false);
      expect(V.string().ip().safeParse(bad).success).toBe(false);
      expect(V.string().cidrv6().safeParse(`${bad}/64`).success).toBe(false);
    }
    for (const good of ['::ffff:1.2.3.4', '::ffff:0.0.0.0', '::ffff:255.255.255.255', '::ffff:100.199.200.249', '1:2:3:4:5:6:1.2.3.4']) {
      expect(V.string().ipv6().safeParse(good).success).toBe(true);
      expect(V.stringV2().ipv6().safeParse(good).success).toBe(true);
      expect(V.string().cidrv6().safeParse(`${good}/64`).success).toBe(true);
    }
  });
});

describe('audit regressions round 5: optional/nullish defaults and deepPartial', () => {
  const V: any = v;

  it('F212 optional()/nullish() hand undefined to a default reached through transparent wrappers', async () => {
    const inners: [string, any, unknown][] = [
      ['prefault', V.string().prefault('x'), 'x'],
      ['default.meta', V.string().default('x').meta({ a: 1 }), 'x'],
      ['default.describe', V.string().default('x').describe('d'), 'x'],
      ['default.refine', V.string().default('x').refine(() => true), 'x'],
      ['default.superRefine', V.string().default('x').superRefine(() => undefined), 'x'],
      ['default.readonly', V.string().default('x').readonly(), 'x'],
      ['default.brand', V.string().default('x').brand(), 'x'],
      ['default.catch', V.string().default('x').catch('c'), 'x'],
      ['default.transform', V.string().default('x').transform((s: string) => `${s}!`), 'x!'],
      ['default.pipe', V.string().default('x').pipe(V.string().min(1)), 'x'],
      ['default.nullable', V.string().default('x').nullable(), 'x'],
      ['default.optional', V.string().default('x').optional(), 'x'],
      ['default.nullish', V.string().default('x').nullish(), 'x'],
      ['union(default,nullish)', V.union([V.string().default('x'), V.number().nullish()]), 'x'],
    ];
    for (const [, inner, expected] of inners) {
      for (const outer of [inner.optional(), inner.nullish()]) {
        expect(outer.parse(undefined)).toBe(expected);
        expect(outer.safeParse(undefined)).toEqual({ success: true, data: expected });
        expect(await outer.parseAsync(undefined)).toBe(expected);
      }
    }
    expect(V.object({ a: V.object({ b: V.string() }).prefault({ b: 'x' }) }).partial().parse({})).toEqual({ a: { b: 'x' } });
    expect(V.object({ a: V.string().default('x').meta({ a: 1 }) }).partial().parse({})).toEqual({ a: 'x' });
  });

  it('F212 issues reported for undefined are dropped (value stays undefined); other inputs still fail', async () => {
    const failing = V.string().default('x').refine(() => false, 'no');
    for (const outer of [failing.optional(), failing.nullish()]) {
      expect(outer.parse(undefined)).toBeUndefined();
      expect(outer.safeParse(undefined)).toEqual({ success: true, data: undefined });
      expect(await outer.parseAsync(undefined)).toBeUndefined();
      expect(outer.safeParse('q').success).toBe(false);
    }
    expect(V.string().default('x').pipe(V.string().min(3)).optional().parse(undefined)).toBeUndefined();
    // "use parseAsync" is not swallowed
    const asyncInner = V.string().default('x').refine(async () => true);
    expect(() => asyncInner.optional().parse(undefined)).toThrow('parseAsync');
    expect(() => asyncInner.nullish().parse(undefined)).toThrow('parseAsync');
    expect(asyncInner.nullish().safeParse(undefined).success).toBe(false);
    expect(await asyncInner.optional().parseAsync(undefined)).toBe('x');
    // no default anywhere: undefined short-circuits, null stays valid for nullish
    expect(V.string().meta({ a: 1 }).optional().parse(undefined)).toBeUndefined();
    expect(V.string().refine(() => true).nullish().parse(undefined)).toBeUndefined();
    expect(V.string().default('x').nullish().parse(null)).toBeNull();
    expect(V.union([V.string(), V.number()]).optional().parse(undefined)).toBeUndefined();
    // the async nullish path keeps null / undefined / values intact
    expect(await V.string().default('x').nullish().parseAsync(null)).toBeNull();
    expect(await V.string().nullish().parseAsync(null)).toBeNull();
    expect(await V.string().nullish().parseAsync(undefined)).toBeUndefined();
    expect(await V.string().nullish().parseAsync('s')).toBe('s');
    expect(V.exactOptional(V.string().default('x')).parse(undefined)).toBeUndefined();
  });

  it('F213 deepPartial descends through brand()', () => {
    const schema = V.deepPartial(V.object({ a: V.object({ b: V.string() }).brand() }));
    expect(schema.safeParse({ a: {} }).success).toBe(true);
    expect(schema.safeParse({}).success).toBe(true);
    expect(schema.safeParse({ a: { b: 1 } }).success).toBe(false);
    expect(schema.shape.a.unwrap().validatorType).toBe('brand');
    const leaf = V.string().brand();
    expect(V.deepPartial(leaf)).toBe(leaf);
  });
});
