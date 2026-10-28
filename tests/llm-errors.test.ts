/**
 * Tests for the LLM-oriented error tooling: toRetryMessage (the string to
 * send back to a model in a retry loop) and describeSchema (the constraints
 * to put in the prompt that asks for the first attempt).
 */
import { v, toRetryMessage, describeSchema, VldError } from '../src/index';

describe('toRetryMessage', () => {
  it('names enum vocabularies and recovers the received value from the input', () => {
    const schema = v.object({ office: v.enum(['HAM', 'LYO']) });
    const input = { office: 'HH' };
    const message = toRetryMessage(schema.safeParse(input), { input });
    expect(message).toContain('one of "HAM", "LYO"');
    expect(message).toContain('got "HH"');
    expect(message).toMatch(/^\/office:/);
  });

  it('works without an input option (message-only clauses)', () => {
    const schema = v.object({ office: v.enum(['HAM', 'LYO']) });
    const message = toRetryMessage(schema.safeParse({ office: 'HH' }));
    expect(message).toContain('one of "HAM", "LYO"');
    expect(message).not.toContain('got "HH"');
  });

  it('accepts a VldError directly and a thrown value', () => {
    const schema = v.enum(['A', 'B']);
    let thrown: VldError | undefined;
    try { schema.parse('C'); } catch (error) { thrown = error as VldError; }
    expect(thrown).toBeInstanceOf(VldError);
    expect(toRetryMessage(thrown)).toContain('one of "A", "B"');
    expect(toRetryMessage(new Error('unrelated'))).toBe('');
    expect(toRetryMessage(undefined)).toBe('');
    expect(toRetryMessage({})).toBe('');
  });

  it('resolves array-element paths to the offending item', () => {
    const schema = v.object({ tags: v.array(v.string().min(2)) });
    const input = { tags: ['ok', 'x', 'also-ok'] };
    const message = toRetryMessage(schema.safeParse(input), { input });
    expect(message).toMatch(/^\/tags\/1:/);
    expect(message).toContain('got "x"');
  });

  it('suppresses container values a model cannot act on', () => {
    const schema = v.object({ meta: v.object({ a: v.string() }) });
    const input = { meta: { a: 1, b: 2, c: 3 } };
    const message = toRetryMessage(schema.safeParse(input), { input });
    expect(message).not.toContain('got {"a"');
    expect(message).not.toContain('b":2');
  });

  it('limits lines and reports the remainder', () => {
    const shape: Record<string, ReturnType<typeof v.string>> = {};
    for (let i = 0; i < 25; i++) shape['f' + i] = v.string();
    const schema = v.object(shape);
    const input: Record<string, unknown> = {};
    for (let i = 0; i < 25; i++) input['f' + i] = i; // all invalid
    const message = toRetryMessage(schema.safeParse(input), { input, limit: 5 });
    const lines = message.split('\n');
    expect(lines).toHaveLength(6);
    expect(lines[5]).toBe('and 20 more');
  });

  it('does not stutter the received value when the message already names it', () => {
    const schema = v.enum(['PAID', 'PENDING']);
    const message = toRetryMessage(schema.safeParse('PAID?'), { input: 'PAID?' });
    expect(message.match(/got /g)?.length).toBeLessThanOrEqual(1);
  });

  it('phrases 0.01 multiples as decimal places', () => {
    const schema = v.object({ amount: v.number().multipleOf(0.01) });
    const input = { amount: 10.333 };
    const message = toRetryMessage(schema.safeParse(input), { input });
    expect(message).toContain('multiple of 0.01');
  });

  it('names unrecognized keys with a removal instruction', () => {
    const schema = v.object({ a: v.string() }).strict();
    const input = { a: 'x', rogue: 1 };
    const message = toRetryMessage(schema.safeParse(input), { input });
    expect(message).toContain('rogue');
    expect(message).toContain('remove or move');
  });

  it('strips the object-field wrapper (path already locates the issue)', () => {
    const schema = v.object({ note: v.string().min(2) });
    const input = { note: 'x' };
    const message = toRetryMessage(schema.safeParse(input), { input });
    expect(message).not.toContain('Invalid field');
  });

  it('returns empty string for a success result', () => {
    const schema = v.string();
    expect(toRetryMessage(schema.safeParse('ok'))).toBe('');
  });
});

describe('describeSchema', () => {
  it('lists enum vocabularies verbatim (the measured case)', () => {
    const text = describeSchema(v.object({ status: v.enum(['PAID', 'PENDING', 'FAILED']) }));
    expect(text).toContain('one of "PAID", "PENDING", "FAILED"');
  });

  it('describes string bounds and formats', () => {
    const text = describeSchema(
      v.object({ email: v.string().email(), slug: v.string().min(3).max(20) })
    );
    expect(text).toContain('/email: string, email address');
    expect(text).toContain('/slug: string, at least 3 characters, at most 20 characters');
  });

  it('describes number ranges, integers, and money decimals', () => {
    const text = describeSchema(
      v.object({ age: v.number().int().min(0).max(150), price: v.number().multipleOf(0.01) })
    );
    expect(text).toContain('/age: number, at least 0 and at most 150, integer');
    expect(text).toContain('/price: number, rounded to 2 decimal places');
  });

  it('describes arrays with bounds and element constraints', () => {
    const text = describeSchema(v.object({ tags: v.array(v.string().min(2)).min(1).max(5) }));
    expect(text).toContain('/tags: array of at least 1, at most 5');
    expect(text).toContain('/tags/*: string, at least 2 characters');
  });

  it('describes tuples positionally', () => {
    const text = describeSchema(v.tuple([v.string(), v.number().int()]));
    expect(text).toContain('tuple of 2 items');
    expect(text).toContain('/0: string');
    expect(text).toContain('/1: number, integer');
  });

  it('marks optional and default fields', () => {
    const text = describeSchema(
      v.object({ a: v.string().optional(), b: v.number().default(42) })
    );
    expect(text).toContain('/a: string');
    expect(text).toContain('/b: number (optional)');
  });

  it('renders literals exactly', () => {
    const text = describeSchema(v.object({ mode: v.literal('strict') }));
    expect(text).toContain('exactly "strict"');
  });

  it('renders un-walkable kinds as any rather than guessing', () => {
    const text = describeSchema(v.object({ r: v.record(v.string()), p: v.string().transform((s) => s) }));
    expect(text).toContain('/r: any');
    expect(text).toContain('/p: any');
  });

  it('summarizes unions by count with the first shape shown', () => {
    const text = describeSchema(v.union([v.object({ a: v.string() }), v.object({ b: v.number() })]));
    expect(text).toContain('one of 2 shapes');
    expect(text).toContain('/a: string');
  });

  it('caps output and reports the remainder', () => {
    const shape: Record<string, ReturnType<typeof v.string>> = {};
    for (let i = 0; i < 40; i++) shape['f' + i] = v.string();
    const text = describeSchema(v.object(shape));
    const lines = text.split('\n');
    expect(lines).toHaveLength(31);
    expect(lines[30]).toContain('more constraints');
  });

  it('dates render as ISO 8601', () => {
    const text = describeSchema(v.object({ at: v.date() }));
    expect(text).toContain('/at: date (ISO 8601)');
  });
});
