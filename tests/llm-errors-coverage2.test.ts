/**
 * Final branch coverage: string length meta, format variants, the money
 * phrase in toRetryMessage, and the describeSchema cycle fallback.
 */
import { v, toRetryMessage, describeSchema } from '../src/index';

describe('llm-errors final branches', () => {
  it('string length() meta phrases as exactly N', () => {
    const text = describeSchema(v.string().length(4));
    expect(text).toContain('exactly 4 characters');
  });

  it('url and uuid formats phrase themselves', () => {
    const text = describeSchema(v.object({ u: v.string().url(), id: v.string().uuid() }));
    expect(text).toContain('/u: string, URL');
    expect(text).toContain('/id: string, UUID');
  });

  it('starts_with/ends_with/includes formats do not crash and add nothing', () => {
    const text = describeSchema(
      v.object({ p: v.string().startsWith('vld-'), s: v.string().endsWith('.txt') })
    );
    expect(text).toContain('/p: string');
    expect(text).toContain('/s: string');
  });

  it('a format meta with a pattern surfaces the pattern', () => {
    const text = describeSchema(v.string().time());
    expect(text).toContain('matching');
  });

  it('a bare named format phrases itself', () => {
    const text = describeSchema(v.string().email());
    expect(text).toContain('email address');
  });

  it('toRetryMessage phrases decimal-place bounds for number origins', () => {
    // Construct an issue whose too_small bound is 0.01 with number origin
    // by using a number().min(0.01) schema: the money phrasing path.
    const schema = v.object({ price: v.number().min(0.01) });
    const input = { price: 0.001 };
    const message = toRetryMessage(schema.safeParse(input), { input });
    expect(message).toContain('rounded to 2 decimal places');
  });

  it('toRetryMessage default branch passes the message through stripped', () => {
    const schema = v.object({ s: v.string() });
    const input = { s: 1 };
    const message = toRetryMessage(schema.safeParse(input), { input });
    expect(message).toMatch(/^\/s: /);
    expect(message).not.toContain('Invalid field');
  });

  it('describeSchema guards against null/schema-shaped input', () => {
    expect(describeSchema(null as never)).toContain(': any');
    expect(describeSchema(undefined as never)).toContain(': any');
  });
});

  it('bare named formats (lowercase) phrase themselves', () => {
    const text = describeSchema(v.string().lowercase());
    expect(text).toContain('lowercase format');
  });

  it('cyclic literal values stringify safely', () => {
    const cyclic: any = {}; cyclic.self = cyclic;
    const text = describeSchema(v.literal([cyclic]) as never);
    expect(text).toContain('exactly');
  });

  it('positive/negative phrase greater/less than', () => {
    const text = describeSchema(v.object({ p: v.number().positive(), n: v.number().negative() }));
    expect(text).toContain('/p: number, greater than 0');
    expect(text).toContain('/n: number, less than 0');
  });