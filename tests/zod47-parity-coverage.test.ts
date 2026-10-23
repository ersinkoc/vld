import { v } from '../src/index';

const V: any = v;

describe('Zod 4.6.7 parity - coverage for required-presence, json async, refine and date paths', () => {
  it('required() enforces presence of defaulted fields through every parse path', async () => {
    const schema = V.object({ a: V.string().default('d'), b: V.string() });
    const required = schema.required();

    // sync parse path
    let thrown: any = null;
    try { required.parse({ b: 'x' }); } catch (e) { thrown = e; }
    expect(thrown).toBeInstanceOf(Error);
    expect(thrown.issues[0]).toEqual(expect.objectContaining({ code: 'invalid_type', path: ['a'], expected: 'nonoptional' }));

    // safeParse aggregation path
    const aggregated = required.safeParse({ b: 'x' });
    expect(aggregated.success).toBe(false);
    if (!aggregated.success) {
      expect(aggregated.error.issues[0]).toEqual(expect.objectContaining({ code: 'invalid_type', path: ['a'], expected: 'nonoptional' }));
    }

    // async path
    const asyncResult = await required.safeParseAsync({ b: 'x' });
    expect(asyncResult.success).toBe(false);
    if (!asyncResult.success) {
      expect(asyncResult.error.issues[0]).toEqual(expect.objectContaining({ code: 'invalid_type', path: ['a'] }));
    }

    // present keys still parse (the explicit undefined lets the default run)
    expect(required.parse({ a: undefined, b: 'x' })).toEqual({ a: 'd', b: 'x' });
    expect((await required.safeParseAsync({ a: 'keep', b: 'x' })).success).toBe(true);
  });

  it('required(mask) enforces presence only for the masked keys', () => {
    const schema = V.object({ a: V.string().default('da'), b: V.string().default('db') });
    const masked = schema.required({ a: true } as any);

    // 'a' is masked in: a missing key reports invalid_type
    const missingA = masked.safeParse({ b: 'x' });
    expect(missingA.success).toBe(false);
    if (!missingA.success) {
      expect(missingA.error.issues[0]).toEqual(expect.objectContaining({ path: ['a'] }));
    }

    // 'b' is masked out: an absent b keeps its default
    expect(masked.parse({ a: 'x' })).toEqual({ a: 'x', b: 'db' });
  });

  it('required() enforces presence of caught fields', () => {
    const schema = V.object({ c: V.string().catch('fallback') });
    const required = schema.required();

    expect(required.safeParse({}).success).toBe(false);
    expect(required.safeParse({ c: 'real' })).toEqual(expect.objectContaining({ success: true, data: { c: 'real' } }));
  });

  it('exactOptional keys missing from input are skipped in the aggregation path', () => {
    const schema = V.object({ opt: V.string().exactOptional(), req: V.string() });
    const result = schema.safeParse({ req: 'x' });
    expect(result).toEqual(expect.objectContaining({ success: true, data: { req: 'x' } }));

    // a failing sibling BEFORE the optional key forces the aggregation loop
    // to walk past the absent exactOptional key, which is skipped there
    const failing = V.object({ req: V.string(), opt: V.string().exactOptional() }).safeParse({ req: 123 });
    expect(failing.success).toBe(false);
    if (!failing.success) {
      expect(failing.error.issues.every((i: any) => i.path[0] === 'req')).toBe(true);
    }
  });

  it('json() parseAsync rejects non-JSON values, delegates to an async schema, and passes values through', async () => {
    const plain = V.json();
    await expect(plain.parseAsync(undefined)).rejects.toThrow();
    expect(await plain.parseAsync({ ok: [1, null] })).toEqual({ ok: [1, null] });
    expect(await plain.parseAsync('str')).toBe('str');

    // a schema-bearing json validator runs the inner schema asynchronously
    const asyncInner = V.object({ n: V.string().refine(async () => true) });
    const withSchema = V.json(asyncInner);
    expect(await withSchema.parseAsync({ n: 'x' })).toEqual({ n: 'x' });
    await expect(withSchema.parseAsync({ n: 5 })).rejects.toThrow();
  });

  it('standalone v.refine(fn) parses synchronously and fails with the given message', async () => {
    const nonEmpty = V.refine((s: string) => s.length > 0, 'empty');
    expect(nonEmpty.parse('ok')).toBe('ok');
    expect(() => nonEmpty.parse('')).toThrow('empty');
    await expect(nonEmpty.parseAsync('ok')).resolves.toBe('ok');
    await expect(nonEmpty.parseAsync('')).rejects.toThrow('empty');
  });

  it('parse() throws the invalid-type error for an Invalid Date instance', () => {
    let thrown: any = null;
    try { V.date().parse(new Date(NaN)); } catch (e) { thrown = e; }
    expect(thrown).toBeInstanceOf(Error);
    expect(thrown.issues[0]).toEqual(expect.objectContaining({ code: 'invalid_type', expected: 'date' }));
  });
});
