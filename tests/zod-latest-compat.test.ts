import { VldBase, VldError, v } from '../src';

describe('latest Zod 4.4.3 compatibility', () => {
  test('accepts current array-based factory signatures and keeps VLD rest signatures', () => {
    expect(v.union([v.string(), v.number()], { error: 'ignored compatibility params' }).parse(1)).toBe(1);
    expect(v.union(v.string(), v.number()).parse('ok')).toBe('ok');
    expect(v.tuple([v.string(), v.number()], { error: 'ignored compatibility params' }).parse(['x', 1])).toEqual(['x', 1]);
    expect(v.tuple(v.string(), v.number()).parse(['x', 1])).toEqual(['x', 1]);
    expect(v.xor([v.string(), v.number()], { error: 'ignored compatibility params' }).parse(1)).toBe(1);
    expect(v.xor(v.string(), v.number()).parse('x')).toBe('x');
    expect(v.xor([]).safeParse('x').success).toBe(false);
  });

  test('accepts current discriminated union signature and multiple literal values', () => {
    const options = [
      v.object({ kind: v.literal(['a', 'alpha']), value: v.string() }),
      v.object({ kind: v.literal('b'), value: v.number() })
    ] as const;

    expect(v.discriminatedUnion('kind', options, { error: 'ignored' }).parse({ kind: 'alpha', value: 'x' })).toEqual({
      kind: 'alpha',
      value: 'x'
    });
    expect(v.discriminatedUnion('kind', ...options).parse({ kind: 'b', value: 1 })).toEqual({
      kind: 'b',
      value: 1
    });
    expect(v.literal(1n).safeParse(2n).success).toBe(false);
    expect(v.literal([1n, 2n]).parse(2n)).toBe(2n);
    expect(v.literal('only').safeParse('other').success).toBe(false);
    expect(v.literal(['a', 'b']).safeParse('other').success).toBe(false);
    expect(() => v.literal([])).toThrow('no valid values');
    expect(v.literal(undefined).safeParse('x').success).toBe(false);
  });

  test('accepts enum arrays, enum-like objects, and legacy rest values', () => {
    expect(v.enum(['a', 'b'], { error: 'ignored' }).parse('b')).toBe('b');
    expect(v.enum('a', 'b').parse('a')).toBe('a');
    expect((v.enum as any)('a', 1, false).parse(1)).toBe(1);
    expect(v.enum({ A: 0, B: 1 } as const).parse(1)).toBe(1);
  });

  test('supports empty object schemas', () => {
    expect(v.object().parse({ anything: true })).toEqual({});
  });

  test('supports transformed record keys and structured invalid_key issues', () => {
    const schema = v.record(v.string().transform(key => key.toUpperCase()), v.number());
    expect(schema.keySchema).toBeDefined();
    expect(schema.parse({ foo: 1 })).toEqual({ FOO: 1 });

    const invalid = v.record(v.string().min(2), v.number()).safeParse({ x: 1 });
    expect(invalid.success).toBe(false);
    if (!invalid.success) {
      expect(invalid.error).toBeInstanceOf(VldError);
      expect((invalid.error as VldError).issues[0]?.code).toBe('invalid_key');
    }
  });

  test('record key parsing skips unsafe and non-enumerable properties and supports symbols', () => {
    const symbol = Symbol('key');
    const input: Record<PropertyKey, unknown> = { visible: 1 };
    input[symbol] = 2;
    Object.defineProperty(input, 'hidden', { value: 3, enumerable: false });
    Object.defineProperty(input, '__proto__', { value: 4, enumerable: true });

    const schema = v.record(v.union([v.string(), v.symbol()]), v.number());
    const output = schema.parse(input) as Record<PropertyKey, number>;
    expect(output['visible']).toBe(1);
    expect(output[symbol]).toBe(2);
    expect(Object.prototype.hasOwnProperty.call(output, 'hidden')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(output, '__proto__')).toBe(false);
  });

  test('rejects non-property-key transforms and invalid record values', () => {
    const invalidKeySchema = v.custom<any>({ parse: () => ({ invalid: true }) }) as VldBase<unknown, any>;
    const invalidKey = v.record(invalidKeySchema, v.number()).safeParse({ x: 1 });
    expect(invalidKey.success).toBe(false);
    if (!invalidKey.success) {
      expect((invalidKey.error as VldError).issues[0]?.code).toBe('invalid_key');
    }

    expect(v.record(v.string(), v.number()).safeParse({ x: 'bad' }).success).toBe(false);
    expect(v.record(v.string().transform(() => '__proto__'), v.number()).parse({ x: 1 })).toEqual({});
  });

  test('loose keyed records transform valid keys and omit invalid entries', () => {
    const input = { ok: 1, bad: 'x' } as Record<string, unknown>;
    Object.defineProperty(input, 'hidden', { value: 2, enumerable: false });
    const schema = v.looseRecord(v.string().min(2).transform(key => key.toUpperCase()), v.number());

    expect(schema.parse(input)).toEqual({ OK: 1 });
    expect(v.looseRecord(v.string().min(3), v.number()).parse({ x: 1 })).toEqual({});
    expect(v.looseRecord(v.string().transform(() => '__proto__'), v.number()).parse({ ok: 1 })).toEqual({});

    const invalidOutputKey = v.custom<any>({ parse: () => ({}) }) as VldBase<unknown, any>;
    expect(v.looseRecord(invalidOutputKey, v.number()).parse({ ok: 1 })).toEqual({});
    expect(v.looseRecord(v.number()).parse({ ok: 1, bad: 'x' })).toEqual({ ok: 1 });
    expect(v.partialRecord(v.number()).parse({ ok: undefined })).toEqual({ ok: undefined });
    expect(v.partialRecord(v.string(), v.number()).parse({ ok: undefined })).toEqual({ ok: undefined });
  });

  test('clones constant defaults and evaluates factory defaults', () => {
    const defaults = [
      v.array(v.number()).default([1]),
      v.map(v.string(), v.number()).default(new Map([['x', 1]])),
      v.set(v.number()).default(new Set([1])),
      v.object({ x: v.number() }).default({ x: 1 })
    ];

    for (const schema of defaults) {
      expect(schema.parse(undefined)).not.toBe(schema.parse(undefined));
    }

    const nullPrototype = Object.create(null) as { x: number };
    nullPrototype.x = 1;
    const nullPrototypeSchema = v.any().default(nullPrototype);
    expect(nullPrototypeSchema.parse(undefined)).not.toBe(nullPrototype);

    const date = new Date(0);
    expect(v.date().default(date).parse(undefined)).toBe(date);
    expect(v.number().default(() => 42).safeParse(undefined)).toEqual({ success: true, data: 42 });
  });

  test('supports direct prefaults and wrapper unwrapping', () => {
    const schema = v.string().trim().prefault(' value ');
    expect(schema.parse(undefined)).toBe('value');
    expect(schema.safeParse(undefined)).toEqual({ success: true, data: 'value' });
    expect(schema.unwrap().parse(' x ')).toBe('x');
    expect(schema.prefault()).toBe(schema);
    expect(schema.prefault(' next ').parse(undefined)).toBe('next');

    const defaulted = v.string().default('value');
    expect(defaulted.unwrap()).toBe(defaulted.removeDefault());
    expect(defaulted.prefault().parse(undefined)).toBe('value');
    expect(defaulted.prefault(' next ').parse(undefined)).toBe(' next ');
    expect(v.prefault(v.string().trim(), () => ' root ').parse(undefined)).toBe('root');
  });

  test('exposes the full per-schema encode/decode family', async () => {
    const schema = v.string();
    expect(schema.decode('x')).toBe('x');
    expect(schema.safeDecode('x')).toEqual({ success: true, data: 'x' });
    expect(schema.safeDecode(1 as any).success).toBe(false);
    expect(await schema.decodeAsync('x')).toBe('x');
    expect(await schema.safeDecodeAsync('x')).toEqual({ success: true, data: 'x' });
    expect(schema.encode('x')).toBe('x');
    expect(schema.safeEncode('x')).toEqual({ success: true, data: 'x' });
    expect(schema.safeEncode(1 as any).success).toBe(false);
    expect(await schema.encodeAsync('x')).toBe('x');
    expect(await schema.safeEncodeAsync('x')).toEqual({ success: true, data: 'x' });
    expect(await schema.safeEncodeAsync(1 as any)).toMatchObject({ success: false });
    expect(await schema.spa('x')).toEqual({ success: true, data: 'x' });
    expect(schema.isOptional()).toBe(false);
    expect(schema.optional().isOptional()).toBe(true);
    expect(schema.isNullable()).toBe(false);
    expect(schema.nullable().isNullable()).toBe(true);
    expect(schema.clone()).toBe(schema);
  });
});
