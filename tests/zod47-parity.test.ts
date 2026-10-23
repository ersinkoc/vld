import { v, VldError } from '../src/index';

const V: any = v;

describe('Zod 4.6.7 container and JSON Schema parity additions', () => {
  it('array collector appends the exact-length and min lower bounds after element issues', () => {
    const exact = V.array(V.string()).length(3).safeParse([1]);
    expect(exact.success).toBe(false);
    if (!exact.success) {
      const codes = exact.error.issues.map((i: any) => [i.code, i.path.join('.')]);
      expect(codes).toContainEqual(['too_small', '']);
      expect(codes).toContainEqual(['invalid_type', '0']);
    }
    const min = V.array(V.string()).min(5).safeParse([1, 'a']);
    expect(min.success).toBe(false);
    if (!min.success) {
      expect(min.error.issues.some((i: any) => i.code === 'too_small' && i.minimum === 5)).toBe(true);
    }
  });

  it('set collector reports a failing lower bound alongside member issues (sync and async)', async () => {
    const schema = V.set(V.string()).min(2);
    const sync = schema.safeParse(new Set([1]));
    expect(sync.success).toBe(false);
    if (!sync.success) {
      expect(sync.error.issues.some((i: any) => i.code === 'invalid_type')).toBe(true);
      expect(sync.error.issues.some((i: any) => i.code === 'too_small' && i.minimum === 2)).toBe(true);
    }
    const asyncResult = await schema.safeParseAsync(new Set([1]));
    expect(asyncResult.success).toBe(false);
  });

  it('map collector reports a failing lower bound and prefixes symbol keys like Zod', () => {
    const schema = V.map(V.string(), V.string()).min(2);
    const sym = Symbol('k');
    const result = schema.safeParse(new Map<any, any>([['a', 1], [sym, 'x']]));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]).toEqual(expect.objectContaining({ code: 'invalid_type', path: ['a'] }));
      // symbol keys keep their segment in the path at runtime (Zod prefixIssues)
      expect(result.error.issues.some((i: any) => i.path[0] === sym)).toBe(true);
    }
    const lower = V.map(V.string(), V.string()).min(3).safeParse(new Map<any, any>([['a', 1]]));
    expect(lower.success).toBe(false);
  });

  it('map gates upper bounds before entries in the async path', async () => {
    const schema = V.map(V.string(), V.string()).max(1);
    const result = await schema.safeParseAsync(new Map<any, any>([['a', 1], ['b', 'x']]));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toHaveLength(1);
      expect(result.error.issues[0]).toEqual(expect.objectContaining({ code: 'too_big' }));
    }
  });

  it('record collector exercises numeric retry, key transform rejection, non-enumerable and dangerous keys', () => {
    const numeric = V.record(V.number(), V.string()).safeParse({ 1: 'a' });
    expect(numeric.success).toBe(true);

    // a key schema that transforms the key into a non-property-key
    const transformKey = V.record(
      V.string().transform(() => ({}) as unknown as string),
      V.string()
    );
    const transformed = transformKey.safeParse({ a: 'x' });
    expect(transformed.success).toBe(false);
    if (!transformed.success) {
      expect(transformed.error.issues[0]).toEqual(expect.objectContaining({ code: 'invalid_key', origin: 'record' }));
    }

    // non-enumerable and dangerous keys are skipped even in collection mode
    const obj: any = { a: 'x' };
    Object.defineProperty(obj, 'hidden', { value: 'y', enumerable: false });
    const skipped = V.record(V.string(), V.string()).safeParse(obj);
    expect(skipped.success).toBe(true);
  });

  it('record reports a key-schema-rejected missing exhaustive key and unrecognized keys together', async () => {
    const schema = V.record(V.enum(['a', 'b']).refine(() => false), V.number());
    const result = await schema.safeParseAsync({ c: 1 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const codes = result.error.issues.map((i: any) => i.code).sort();
      expect(codes).toEqual(['invalid_key', 'invalid_key', 'unrecognized_keys']);
    }
  });

  it('record collector skips guarded keys and retries numeric strings while collecting', () => {
    // numeric-string key retry inside collection mode (record of numbers keyed by "1")
    const numericFail = V.record(V.number(), V.string()).safeParse({ 1: 1 });
    expect(numericFail.success).toBe(false);

    // a dangerous raw key is skipped while another entry fails
    const withProto: any = { a: 1 };
    Object.defineProperty(withProto, '__proto__', { value: 'x', enumerable: true });
    const guarded = V.record(V.string(), V.string()).safeParse({ a: 1 });
    expect(guarded.success).toBe(false);
    if (!guarded.success) {
      expect(guarded.error.issues[0]).toEqual(expect.objectContaining({ code: 'invalid_type', path: ['a'] }));
    }
  });

  it('record fast path reports a key-schema-rejected missing exhaustive key (sync)', () => {
    const schema = V.record(V.enum(['a', 'b']).refine(() => false), V.number());
    const result = schema.safeParse({ a: 1 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((i: any) => i.code)).toEqual(['invalid_key', 'invalid_key']);
    }
  });

  it('record fast path reports missing exhaustive keys against an empty object', () => {
    const schema = V.record(V.enum(['a', 'b']).refine(() => false), V.number());
    const result = schema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((i: any) => i.code)).toEqual(['invalid_key', 'invalid_key']);
    }
  });

  it('record collector skips non-enumerable keys while collecting a failing sibling', () => {
    const obj: any = { a: 1 };
    Object.defineProperty(obj, 'ghost', { value: 'ok', enumerable: false });
    const result = V.record(V.string(), V.string()).safeParse(obj);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toHaveLength(1);
      expect(result.error.issues[0]).toEqual(expect.objectContaining({ code: 'invalid_type', path: ['a'] }));
    }
  });

  it('record collector separates unrecognized keys, dangerous keys and transformed dangerous keys', () => {
    // an unlisted key rides along while a listed key's value fails (collection mode)
    const withUnrecognized = V.record(V.enum(['a', 'b']), V.number()).safeParse({ a: 'bad', c: 1 });
    expect(withUnrecognized.success).toBe(false);
    if (!withUnrecognized.success) {
      const codes = withUnrecognized.error.issues.map((i: any) => i.code);
      expect(codes).toContain('invalid_type');
      expect(codes).toContain('unrecognized_keys');
    }

    // a dangerous raw key is skipped inside collection mode
    const dangerous = V.record(V.string(), V.string()).safeParse({ a: 1, constructor: 'x' } as any);
    expect(dangerous.success).toBe(false);
    if (!dangerous.success) {
      expect(dangerous.error.issues.every((i: any) => i.path[0] === 'a')).toBe(true);
    }

    // a key transform producing a dangerous output key is skipped in collection mode
    const transformed = V.record(
      V.string().transform((key: string) => (key === 'k' ? '__proto__' : key)),
      V.string()
    ).safeParse({ k: 'x', a: 1 });
    expect(transformed.success).toBe(false);

    // exhaustive keys missing while a present value fails: value issues for the missing ones
    const missingValue = V.record(V.enum(['a', 'b']), V.number()).safeParse({ c: 1 });
    expect(missingValue.success).toBe(false);
    if (!missingValue.success) {
      // Zod reports the missing exhaustive keys and the unrecognized key together
      const paths = missingValue.error.issues.map((i: any) => [i.code, i.path[0]]);
      expect(paths).toEqual([['invalid_type', 'a'], ['invalid_type', 'b'], ['unrecognized_keys', undefined]]);
    }
  });

  it('intersection keeps a VldError and wraps plain errors thrown while re-parsing a reconciled side', async () => {
    // safeParse fails with an unrecognized-keys-only error so the side is
    // reconcilable; parse then throws, exercising the re-parse fallback.
    const explosiveVld = (error: unknown): any => ({
      safeParse: () => ({ success: false, error: new VldError([{ code: 'unrecognized_keys' as const, path: [], keys: ['b'], message: 'extra' }]) }),
      safeParseAsync: async () => ({ success: false, error: new VldError([{ code: 'unrecognized_keys' as const, path: [], keys: ['b'], message: 'extra' }]) }),
      parse: () => { throw error; },
      parseAsync: async () => { throw error; }
    });
    const vldFailure = V.intersection(explosiveVld(new VldError([{ code: 'custom', path: [], message: 'boom' }])) as any, V.object({ a: V.string() }));
    const rejectedVld = vldFailure.safeParse({ a: 'x', b: 1 });
    expect(rejectedVld.success).toBe(false);

    const plainFailure = V.intersection(explosiveVld(new Error('plain boom')) as any, V.object({ a: V.string() }));
    const rejectedPlain = plainFailure.safeParse({ a: 'x', b: 1 });
    expect(rejectedPlain.success).toBe(false);
    if (!rejectedPlain.success) {
      expect(rejectedPlain.error.issues[0]).toEqual(expect.objectContaining({ code: 'invalid_type' }));
    }

    const asyncVld = V.intersection(explosiveVld(new VldError([{ code: 'custom', path: [], message: 'boom' }])) as any, V.object({ a: V.string() }));
    expect((await asyncVld.safeParseAsync({ a: 'x', b: 1 })).success).toBe(false);
    const asyncPlain = V.intersection(explosiveVld(new Error('plain boom')) as any, V.object({ a: V.string() }));
    expect((await asyncPlain.safeParseAsync({ a: 'x', b: 1 })).success).toBe(false);
  });

  it('intersection surfaces failing sides and unrecognized-key reconciliation in both parse paths', async () => {
    // both sides fail: their issues are concatenated (Zod)
    const both = V.intersection(V.string().min(5), V.string().max(2)).safeParse('xxx');
    expect(both.success).toBe(false);
    if (!both.success) {
      expect(both.error.issues.map((i: any) => i.code)).toEqual(['too_small', 'too_big']);
    }

    // unrecognized-keys reconciliation succeeds through parseAsync
    const reconciled = V.intersection(
      V.object({ a: V.string() }).strict(),
      V.object({ b: V.number() }).strict()
    );
    await expect(reconciled.parseAsync({ a: 'x', b: 1 })).resolves.toEqual({ a: 'x', b: 1 });

    // a failing re-parse in the reconciliation path keeps its VldError (sync and async)
    const failing = V.intersection(
      V.object({ a: V.string() }).strict(),
      V.object({ b: V.number() }).strict()
    );
    const failed = await failing.safeParseAsync({ a: 1, b: 2 });
    expect(failed.success).toBe(false);
    expect(failing.safeParse({ a: 1, b: 2 }).success).toBe(false);

    // both sides fail structurally in the async path too (Zod concatenation)
    const bothAsync = await V.intersection(V.string().min(5), V.string().max(2)).safeParseAsync('xxx');
    expect(bothAsync.success).toBe(false);
    if (!bothAsync.success) {
      expect(bothAsync.error.issues.map((i: any) => i.code)).toEqual(['too_small', 'too_big']);
    }

    // unmergeable primitive outputs keep the wrapped message error
    const unmergeable = V.intersection(V.object({ a: V.string() }), V.array(V.string()));
    const rejected = unmergeable.safeParse('not-an-object' as any);
    expect(rejected.success).toBe(false);
  });
});
