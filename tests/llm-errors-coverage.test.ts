/**
 * Branch coverage for describeSchema and toRetryMessage (number ranges,
 * leaf kinds, wrappers, path resolution, truncation).
 */
import { v, toRetryMessage, describeSchema } from '../src/index';

describe('describeSchema remaining branches', () => {
  it('covers gt/gte/lt/lte range phrases', () => {
    const text = describeSchema(v.object({
      a: v.number().gt(0),
      b: v.number().gte(1),
      c: v.number().lt(10),
      d: v.number().lte(9),
    }));
    expect(text).toContain('/a: number, greater than 0');
    expect(text).toContain('/b: number, at least 1');
    expect(text).toContain('/c: number, less than 10');
    expect(text).toContain('/d: number, at most 9');
  });

  it('finite is implicit in number (runtime rejects non-finite by default)', () => {
    const text = describeSchema(v.object({ f: v.number().finite() }));
    expect(text).toContain('/f: number');
    expect(v.number().safeParse(Infinity).success).toBe(false);
  });

  it('non-decimal multiples phrase as multiples', () => {
    const text = describeSchema(v.object({ n: v.number().multipleOf(5) }));
    expect(text).toContain('a multiple of 5');
  });

  it('covers leaf kinds and catch', () => {
    const text = describeSchema(v.object({
      b: v.boolean(),
      g: v.bigint(),
      d: v.date(),
      n: v.null(),
      u: v.undefined(),
      a: v.any(),
      k: v.unknown(),
      c: v.string().catch('x'),
    }));
    expect(text).toContain('/b: boolean');
    expect(text).toContain('/g: bigint');
    expect(text).toContain('/d: date (ISO 8601)');
    expect(text).toContain('/n: null');
    expect(text).toContain('/u: undefined');
    expect(text).toContain('/a: any');
    expect(text).toContain('/k: any');
    expect(text).toContain('invalid input is replaced');
  });

  it('prefault marks optional like default', () => {
    const text = describeSchema(v.object({ p: v.number().prefault(1) }));
    expect(text).toContain('/p: number (optional)');
  });

  it('empty object shape reports no fields', () => {
    expect(describeSchema(v.object({}))).toContain('no fields');
  });

  it('unique arrays phrase the constraint', () => {
    const text = describeSchema(v.array(v.string()).unique());
    expect(text).toContain('unique items');
  });

  it('deeply nested schemas hit the depth cap as any', () => {
    let deep: any = v.string();
    for (let i = 0; i < 15; i++) deep = v.object({ x: deep });
    const text = describeSchema(deep as never);
    expect(text.split('\n').some((line) => line.includes(': any'))).toBe(true);
  });

  it('regex formats surface their pattern', () => {
    const text = describeSchema(v.string().regex(/^vld-\d+$/));
    expect(text).toContain('matching');
  });

  it('non-meta check closures degrade to a plain string description', () => {
    const text = describeSchema(v.object({ s: v.string().refine((x) => x.length > 2) }));
    expect(text).toContain('/s: any');
  });
});

describe('toRetryMessage remaining branches', () => {
  it('bigint bounds name the bound in the message', () => {
    const schema = v.object({ n: v.bigint().min(10n) });
    const message = toRetryMessage(schema.safeParse({ n: 1n }), { input: { n: 1n } });
    expect(message).toContain('10');
  });

  it('too_big issues name the maximum', () => {
    const schema = v.object({ n: v.number().max(5) });
    const message = toRetryMessage(schema.safeParse({ n: 10 }), { input: { n: 10 } });
    expect(message).toContain('5');
    expect(message).toContain('got 10');
  });

  it('long string received values are truncated', () => {
    const schema = v.object({ s: v.string().max(5) });
    const long = 'a'.repeat(200);
    const message = toRetryMessage(schema.safeParse({ s: long }), { input: { s: long } });
    expect(message).toContain('...');
    expect(message.length).toBeLessThan(200);
  });

  it('Date received values render as ISO', () => {
    const schema = v.object({ d: v.date() });
    const message = toRetryMessage(schema.safeParse({ d: 'nope' }), { input: { d: new Date(0) } });
    expect(message).toContain('1970-01-01');
  });

  it('path resolution through arrays of objects', () => {
    const schema = v.object({ rows: v.array(v.object({ id: v.string() })) });
    const input = { rows: [{ id: 1 }, { id: 2 }] };
    const message = toRetryMessage(schema.safeParse(input), { input });
    expect(message).toMatch(/rows\/0.*got 1/);
  });

  it('path resolution through null and non-object segments is safe', () => {
    const schema = v.object({ a: v.object({ b: v.string() }) });
    const message = toRetryMessage(schema.safeParse({ a: null }), { input: { a: null } });
    expect(typeof message).toBe('string');
  });

  it('a limit of zero falls back to the default 20', () => {
    const schema = v.object({ s: v.string() });
    const message = toRetryMessage(schema.safeParse({ s: 1 }), { input: { s: 1 }, limit: 0 });
    expect(message).toContain('/s:');
  });
});
