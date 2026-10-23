import { v } from '../src/index';

const V: any = v;

/** A schema stub whose parse paths throw plain Errors (never a VldError). */
function plainThrower(message = 'plain boom'): any {
  const err = new Error(message);
  return {
    parse: () => { throw err; },
    safeParse: () => { throw err; },
    parseAsync: async () => { throw err; },
    safeParseAsync: async () => { throw err; }
  };
}

/** A stub whose safeParse fails with a plain Error carrying no issues. */
function failingPlainError(): any {
  return {
    safeParse: () => ({ success: false, error: new Error('no issues here') }),
    parse: () => { throw new Error('no issues here'); }
  };
}

describe('branch coverage - meta padding across mixed-check chains', () => {
  it('aligns meta indices when a meta-less check precedes a meta-bearing one', () => {
    // email() adds a check without a meta; min() pads the list through the
    // fallback metas when it appends its own meta (construction covers it).
    const schema = V.string().email().min(15, 'short!');
    // a valid email that passes min reports success...
    expect(schema.safeParse('someone@example.com').success).toBe(true);
    // ...and a valid-but-short email fails with min's own message
    const result = schema.safeParse('a@b.co');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i: any) => i.message === 'short!')).toBe(true);
    }
  });
});

describe('branch coverage - custom messages, option objects and V2 plain-error wraps', () => {
  it('array length() custom messages flow through every failure path', () => {
    // oversize gate (throwArrayTooBig) with the custom message
    const oversize = V.array(V.string()).length(2, 'two!');
    let thrown: any = null;
    try { oversize.parse(['a', 'b', 'c']); } catch (e) { thrown = e; }
    expect(thrown.issues[0].message).toBe('two!');

    // collection-mode exact-length undersize keeps the custom message
    const undersize = V.array(V.string()).length(2, 'two!');
    const collected = undersize.safeParse([1]);
    expect(collected.success).toBe(false);
    if (!collected.success) {
      expect(collected.error.issues.some((i: any) => i.message === 'two!')).toBe(true);
    }

    // collection-mode min undersize keeps the custom message
    const minCustom = V.array(V.string()).min(5, 'five!');
    const minResult = minCustom.safeParse([1, 'a']);
    expect(minResult.success).toBe(false);
    if (!minResult.success) {
      expect(minResult.error.issues.some((i: any) => i.message === 'five!')).toBe(true);
    }
  });

  it('string length custom messages cover the V1 and V2 check fallbacks', () => {
    const v1 = V.string().length(5, 'five!');
    const r1 = v1.safeParse('ab');
    expect(r1.success).toBe(false);
    if (!r1.success) expect(r1.error.issues[0].message).toBe('five!');

    const v2 = V.stringV2().length(5, 'five!');
    const r2 = v2.safeParse('ab');
    expect(r2.success).toBe(false);
    if (!r2.success) expect(r2.error.issues[0].message).toBe('five!');
  });

  it('stringV2 int bound custom messages report the configured text', () => {
    const over = V.numberV2().int('int bound');
    const r1 = over.safeParse(1e308 * 10);
    expect(r1.success).toBe(false);
    if (!r1.success) expect(r1.error.issues[0].message).toBe('int bound');

    const under = V.numberV2().int('int bound');
    const r2 = under.safeParse(-1e308 * 10);
    expect(r2.success).toBe(false);
    if (!r2.success) expect(r2.error.issues[0].message).toBe('int bound');
  });

  it('url() hostname/protocol options are detected and enforced', () => {
    const schema = V.string().url({ hostname: /^example\.com$/ });
    expect(schema.safeParse('https://example.com/x').success).toBe(true);
    expect(schema.safeParse('https://evil.com/x').success).toBe(false);

    const proto = V.string().url({ protocol: /^https$/ });
    expect(proto.safeParse('https://example.com').success).toBe(true);
    expect(proto.safeParse('ftp://example.com').success).toBe(false);
  });

  it('jwt() detects the { alg } option form', () => {
    const good = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.sig';
    const schema = V.string().jwt({ alg: 'HS256' });
    expect(schema.safeParse(good).success).toBe(true);
    expect(schema.safeParse('eyJhbGciOiJub25lIn0..sig').success).toBe(false);
  });

  it('arrayV2 exact length reports too_small and too_big for both sides', () => {
    const short = V.arrayV2(V.string()).length(2);
    expect(short.safeParse(['a']).success).toBe(false);
    expect(short.safeParse(['a', 'b', 'c']).success).toBe(false);
  });

  it('union error collection reads literal values through the literal fallback', () => {
    const schema = V.union([V.literal('a'), V.string().min(10)]);
    const result = schema.safeParse(5);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]).toEqual(expect.objectContaining({ code: 'invalid_union' }));
    }
  });

  it('template literals fall back to the generic pattern for unlisted types', () => {
    const schema = V.templateLiteral('id-', V.any());
    expect(schema.parse('id-anything')).toBe('id-anything');
  });

  it('tuple trailing optional slots that accept undefined succeed', () => {
    const schema = V.tuple([V.string(), V.string().optional()]);
    expect(schema.parse(['a'])).toEqual(['a']);
  });

  it('container V2 safeParse wraps plain Errors from members as custom issues', () => {
    const cases: Array<[string, () => any, unknown]> = [
      ['arrayV2', () => V.arrayV2(plainThrower()), ['x']],
      ['tupleV2', () => V.tupleV2([plainThrower()]), ['x']],
      ['setV2', () => V.setV2(plainThrower()), new Set(['x'])],
      ['mapV2', () => V.mapV2(plainThrower(), V.string()), new Map([[1, 'x']])],
      ['unionV2', () => V.unionV2(plainThrower(), V.number()), 'x'],
      ['intersectionV2', () => V.intersectionV2(plainThrower(), V.string()), 'x']
    ];
    for (const [name, build, input] of cases) {
      const result = build().safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        // the plain error surfaces as a custom issue (some containers also
        // surface their own plumbing messages - the wrap is what matters)
        expect(result.error.issues[0]).toEqual(expect.objectContaining({ code: 'custom' }));
        expect(result.error.issues[0].message.length).toBeGreaterThan(0);
      }
      void name;
    }
  });

  it('leaf V2 safeParse wraps plain Errors thrown by refinements', async () => {
    const boom = (): never => { throw new Error('refine boom'); };
    const schemas = [
      V.stringV2().refine(boom as any),
      V.numberV2().refine(boom as any),
      V.bigintV2().refine(boom as any),
      V.dateV2().refine(boom as any)
    ];
    for (const schema of schemas) {
      const input = schema === schemas[2] ? 1n : schema === schemas[3] ? new Date() : schema === schemas[1] ? 1 : 'x';
      const result = schema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]).toEqual(expect.objectContaining({ code: 'custom', message: 'refine boom' }));
      }
    }
    // the same through the async path for one of them
    const asyncResult = await V.stringV2().refine(boom as any).safeParseAsync('x');
    expect(asyncResult.success).toBe(false);
  });

  it('recordV2 simple modes include symbol and unknown validators', () => {
    expect(V.recordV2(V.symbol()).safeParse({ a: Symbol('s') }).success).toBe(true);
    expect(V.recordV2(V.string().email()).safeParse({ a: 'x@y.co' }).success).toBe(true);
  });

  it('instanceof().properties() degrades gracefully for issue-less failures', () => {
    const schema = V.instanceof(Date).properties({ getTime: failingPlainError() });
    const result = schema.safeParse(new Date(0));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]).toEqual(expect.objectContaining({ code: 'custom' }));
    }
  });

  it('unkeyed record collection skips dangerous raw keys and passing siblings', () => {
    // a passing sibling keeps collecting (the !item.success false side) while
    // a dangerous raw key is skipped entirely
    const mixed = V.record(V.string()).safeParse({ good: 'ok', bad: 1, constructor: 'skipme' } as any);
    expect(mixed.success).toBe(false);
    if (!mixed.success) {
      expect(mixed.error.issues.every((i: any) => i.path[0] === 'bad')).toBe(true);
    }
  });

  it('set and map collectors stop at a passing lower bound while a member fails', () => {
    const setResult = V.set(V.string()).min(1).safeParse(new Set([1]));
    expect(setResult.success).toBe(false);
    if (!setResult.success) {
      expect(setResult.error.issues.some((i: any) => i.code === 'invalid_type')).toBe(true);
      expect(setResult.error.issues.some((i: any) => i.code === 'too_small')).toBe(false);
    }

    const mapResult = V.map(V.string(), V.string()).min(1).safeParse(new Map<any, any>([['a', 1]]));
    expect(mapResult.success).toBe(false);
    if (!mapResult.success) {
      expect(mapResult.error.issues.some((i: any) => i.code === 'invalid_type')).toBe(true);
      expect(mapResult.error.issues.some((i: any) => i.code === 'too_small')).toBe(false);
    }
  });

  it('coerce.stringV2 stringifies an Error with an empty message through toString', () => {
    expect(V.coerce.stringV2().parse(new Error(''))).toBe('Error');
  });
});

describe('v.compile CSP fallback', () => {
  it('degrades to the runtime parser when new Function is blocked', () => {
    const RealFunction = globalThis.Function;
    const blocked = function (..._args: unknown[]) {
      throw new EvalError('Code generation from strings disallowed for this context');
    };
    (blocked as any).prototype = RealFunction.prototype;
    (globalThis as any).Function = blocked;
    try {
      const compiled = V.compile(V.object({ a: V.string(), b: V.array(V.number()).max(2) }));
      // same verdicts as the runtime parser: valid input parses,
      // invalid input reports the full issue set
      expect(compiled.parse({ a: 'x', b: [1, 2] })).toEqual({ a: 'x', b: [1, 2] });
      const rejected = compiled.safeParse({ a: 'x', b: [1, 2, 3] });
      expect(rejected.success).toBe(false);
      if (!rejected.success) {
        expect(rejected.error.issues[0]).toEqual(expect.objectContaining({ code: 'too_big' }));
      }
      expect(compiled.validate({ a: 'x', b: [] })).toBe(true);
      expect(compiled.validate({ a: 1, b: [] })).toBe(false);
    } finally {
      (globalThis as any).Function = RealFunction;
    }
    // outside the block, compilation works as before
    const normal = V.compile(V.object({ a: V.string() }));
    expect(normal.parse({ a: 'ok' })).toEqual({ a: 'ok' });
  });
});
