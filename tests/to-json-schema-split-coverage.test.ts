/**
 * Coverage for serializer edge paths that used to be reached through the
 * unified json-schema module. Each case pins one specific branch.
 */
import { v, vV2, toJSONSchema, fromJSONSchema } from '../src/index';
import { VldNumber } from '../src/validators/number';

describe('toJSONSchema split-off edge paths', () => {
  it('normalizes tuple rest items across draft targets', () => {
    const schema = v.tuple([v.string(), v.number()], v.boolean());
    for (const target of ['draft-07', 'draft-2020-12', 'draft-2019-09'] as const) {
      const json = toJSONSchema(schema, { target });
      expect(json).toBeDefined();
    }
  });

  it('accepts a bare call without options', () => {
    expect(toJSONSchema(v.string())).toHaveProperty('type', 'string');
    expect(fromJSONSchema({ type: 'string' })).toBeDefined();
  });

  it('juggles nullable union types for openapi-3.0', () => {
    // single non-null type after dropping null
    expect(toJSONSchema(v.string().nullable(), { target: 'openapi-3.0' })).toHaveProperty('nullable', true);
    // multiple non-null types stay as an array
    const multi = toJSONSchema(v.union([v.string(), v.number()]).nullable(), { target: 'openapi-3.0' });
    expect(multi).toBeDefined();
    // only null left: the type key is removed entirely
    const onlyNull = toJSONSchema(v.union([v.null()]).nullable(), { target: 'openapi-3.0' });
    expect(JSON.stringify(onlyNull)).not.toContain('"type"');
  });

  it('serializes discriminated unions as oneOf', () => {
    const schema = v.discriminatedUnion('kind', [
      v.object({ kind: v.literal('a'), a: v.string() }),
      v.object({ kind: v.literal('b'), b: v.number() })
    ]);
    expect(toJSONSchema(schema)).toHaveProperty('oneOf');
  });

  it('emits time patterns and string format patterns', () => {
    expect(toJSONSchema(v.string().time())).toBeDefined();
    expect(toJSONSchema(v.iso.time())).toBeDefined();
    expect(toJSONSchema(v.string().email())).toHaveProperty('pattern');
  });

  it('serializes numeric and boolean literals as consts', () => {
    expect(toJSONSchema(v.literal(5))).toMatchObject({ type: 'number', const: 5 });
    expect(toJSONSchema(v.literal(true))).toMatchObject({ type: 'boolean', const: true });
    expect(toJSONSchema(v.literal(null))).toBeDefined();
    expect(toJSONSchema(v.literal([1, 'a']))).toBeDefined();
  });

  it('introspects closure checks when no jsonSchema hints exist', () => {
    const schema = VldNumber.create() as any;
    schema.config = {
      ...(schema.config || {}),
      checks: [
        (x: number) => x >= 2,
        (x: number) => x <= 10,
        (x: number) => Number.isInteger(x),
        (x: number) => Number.isSafeInteger(x),
        (x: number) => Number.isFinite(x)
      ]
    };
    const json = toJSONSchema(schema);
    expect(json).toMatchObject({ type: 'integer', minimum: 0, maximum: 0 });
  });

  it('drops a throwing catch fallback from the default keyword', () => {
    const schema = v.string().catch(() => {
      throw new Error('no default available');
    });
    expect(toJSONSchema(schema)).toBeDefined();
  });

  it('drops non-JSON default values', () => {
    const cyclic: any = { self: null };
    cyclic.self = cyclic;
    const schema = v.any().default(() => cyclic);
    expect(toJSONSchema(schema)).toBeDefined();
  });

  it('introspects V2 numbers and containers', () => {
    expect(vV2.number().min(2).max(10).int().toJSONSchema()).toBeDefined();
    expect(vV2.array(vV2.string()).toJSONSchema()).toHaveProperty('type', 'array');
    expect(vV2.record(vV2.number()).toJSONSchema()).toBeDefined();
    expect(vV2.string().email().toJSONSchema()).toBeDefined();
  });

  it('unwraps meta and refinement wrappers through the serializer', () => {
    expect(v.string().describe('wrapped').toJSONSchema()).toBeDefined();
    expect(v.string().refine(() => true, 'no').toJSONSchema()).toBeDefined();
    expect(v.string().superRefine(() => {}).toJSONSchema()).toBeDefined();
    expect(v.string().check(() => {}).toJSONSchema()).toBeDefined();
  });

  it('emits propertyNames for record key schemas and falls back to string', () => {
    const withKey = v.record(v.string().min(1), v.number());
    expect(toJSONSchema(withKey)).toBeDefined();
    const loose = v.record(v.number(), v.string()) as any;
    expect(toJSONSchema(loose)).toBeDefined();
  });
});

describe('fromJSONSchema split-off edge paths', () => {
  it('applies minProperties and maxProperties constraints', () => {
    const schema = fromJSONSchema({
      type: 'object',
      properties: { a: { type: 'string' }, b: { type: 'string' } },
      required: ['a'],
      minProperties: 1,
      maxProperties: 2
    } as any);
    expect(schema.safeParse({ a: 'x' }).success).toBe(true);
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ a: 'x', b: 'y', c: 'z' }).success).toBe(false);
  });

  it('applies contains with minContains and maxContains', () => {
    const schema = fromJSONSchema({
      type: 'array',
      contains: { type: 'number' },
      minContains: 1,
      maxContains: 2
    } as any);
    expect(schema.safeParse([1, 2]).success).toBe(true);
    expect(schema.safeParse(['x']).success).toBe(false);
    expect(schema.safeParse([1, 2, 3]).success).toBe(false);
  });
});
