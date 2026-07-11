import { fromJSONSchema, registry, v } from '../src';

describe('Zod composition compatibility', () => {
  const dateCodec = v.codec(v.string(), v.date(), {
    decode: value => new Date(value),
    encode: value => value.toISOString()
  });

  test('exposes compositional schema instance methods', async () => {
    expect(v.string().array().parse(['a', 'b'])).toEqual(['a', 'b']);
    expect(v.string().or(v.number()).parse(1)).toBe(1);
    expect(v.object({ a: v.string() }).and(v.object({ b: v.number() })).parse({ a: 'x', b: 1 })).toEqual({ a: 'x', b: 1 });
    expect(v.string().optional().nonoptional().safeParse(undefined).success).toBe(false);
    expect(() => v.string().optional().nonoptional('required').parse(undefined)).toThrow('required');
    expect(v.string().overwrite(value => value.toUpperCase()).parse('x')).toBe('X');

    const checked = v.string().with(
      payload => {
        if (payload.value.length < 2) payload.issues.push({ message: 'too short' });
        if (payload.value === 'empty') payload.issues.push({});
      },
      { _zod: { check: payload => { if (payload.value === 'xx') payload.issues.push({ code: 'custom' }); } } },
      {}
    );
    expect(() => checked.parse('x')).toThrow('too short');
    expect(() => checked.parse('xx')).toThrow('Custom check failed');
    expect(() => checked.parse('empty')).toThrow('Custom check failed');
    expect(checked.parse('okay')).toBe('okay');

    const asyncChecked = v.string().with(async payload => {
      if (payload.value === 'bad') payload.issues.push({ message: 'async bad' });
    });
    await expect(asyncChecked.safeParseAsync('bad')).resolves.toMatchObject({ success: false });
    await expect(asyncChecked.parseAsync('good')).resolves.toBe('good');

    const described = v.string().describe('A value');
    expect(described.description).toBe('A value');
    expect(v.string().description).toBeUndefined();
    expect(v.string().toJSONSchema()).toMatchObject({ type: 'string' });
    expect(v.object({ value: v.string() }).loose().parse({ value: 'x', extra: 1 })).toEqual({ value: 'x', extra: 1 });
    expect(v.object({ value: v.string() }).loose().strip().parse({ value: 'x', extra: 1 })).toEqual({ value: 'x' });
  });

  test('exposes current string format and transform instance methods', () => {
    const cases: Array<[ReturnType<typeof v.string>, string]> = [
      [v.string().uuidv4(), '550e8400-e29b-41d4-a716-446655440000'],
      [v.string().uuidv6(), '1ef21d2f-6c2e-6a10-9234-123456789abc'],
      [v.string().uuidv7(), '01890f13-7cc2-7f9a-9234-123456789abc'],
      [v.string().emoji(), '\u{1F600}'],
      [v.string().base64(), 'SGVsbG8='],
      [v.string().base64url(), 'SGVsbG8'],
      [v.string().jwt(), 'abc.def.ghi'],
      [v.string().nanoid(), 'V1StGXR8_Z5jdHi6B-myT'],
      [v.string().cuid(), 'clh123456789'],
      [v.string().cuid2(), 'abc123'],
      [v.string().ulid(), '01ARZ3NDEKTSV4RRFFQ69G5FAV'],
      [v.string().cidrv4(), '192.168.1.0/24'],
      [v.string().cidrv6(), '2001:0db8:85a3:0000:0000:8a2e:0370:7334/64'],
      [v.string().e164(), '+14155552671'],
      [v.string().xid(), 'A1B2C3D4E5F6G7H8J9K0'],
      [v.string().guid(), '550e8400-e29b-41d4-a716-446655440000'],
      [v.string().ksuid(), '0o5Fs0EELR0fUjHjbCnEtdUwQe3'],
      [v.string().date(), '2026-07-10'],
      [v.string().time(), '12:30:00'],
      [v.string().datetime(), '2026-07-10T12:30:00Z'],
      [v.string().duration(), 'P1DT12H']
    ];

    for (const [schema, value] of cases) {
      expect(schema.parse(value)).toBe(value);
    }
    expect(() => v.string().uuidv4({ error: 'bad uuid' }).parse('bad')).toThrow('bad uuid');
    expect(v.string().lowercase().parse('ABC')).toBe('abc');
    expect(v.string().uppercase().parse('abc')).toBe('ABC');
    expect(v.string().normalize('NFC').parse('e\u0301')).toBe('\u00e9');
    expect(v.string().normalize().parse('\u00e9')).toBe('\u00e9');
    expect(v.string().slugify().parse(' Hello, New_World! ')).toBe('hello-new-world');
  });

  test('encodes codecs nested in objects, arrays, and tuples', () => {
    const schema = v.object({
      createdAt: dateCodec,
      dates: v.array(dateCodec),
      history: v.tuple([dateCodec], dateCodec)
    });
    const first = new Date('2026-01-01T00:00:00.000Z');
    const second = new Date('2026-02-01T00:00:00.000Z');
    const output = { createdAt: first, dates: [second], history: [first, second] as [Date, ...Date[]] };
    const encoded = {
      createdAt: first.toISOString(),
      dates: [second.toISOString()],
      history: [first.toISOString(), second.toISOString()]
    };

    expect(schema.encode(output)).toEqual(encoded);
    expect(v.encode(schema, output)).toEqual(encoded);
    expect(schema.parse(encoded)).toEqual(output);
    expect(schema.safeEncode(output)).toEqual({ success: true, data: encoded });
  });

  test('supports safe and async nested encoding', async () => {
    const asyncCodec = v.codec(v.string(), v.number(), {
      decode: async value => Number(value),
      encode: async value => String(value)
    });
    const schema = v.object({ values: v.array(asyncCodec), pair: v.tuple([asyncCodec], asyncCodec) });
    const output = { values: [1, 2], pair: [3, 4] as [number, ...number[]] };
    const encoded = { values: ['1', '2'], pair: ['3', '4'] };

    await expect(schema.encodeAsync(output)).resolves.toEqual(encoded);
    await expect(v.encodeAsync(schema, output)).resolves.toEqual(encoded);
    await expect(schema.safeEncodeAsync(output)).resolves.toEqual({ success: true, data: encoded });
    await expect(schema.safeEncodeAsync({ values: ['bad'] as any, pair: [3, 4] } as any)).resolves.toMatchObject({ success: false });
  });

  test('applies object encode modes and prototype protection', async () => {
    const passthrough = v.object({ value: dateCodec }).passthrough();
    const input = JSON.parse('{"value":"2026-01-01T00:00:00.000Z","extra":1,"__proto__":{"admin":true}}');
    const parsed = passthrough.parse(input);
    const encoded = passthrough.encode(parsed as any) as Record<string, unknown>;
    expect(encoded['extra']).toBe(1);
    expect(Object.prototype.hasOwnProperty.call(encoded, '__proto__')).toBe(false);
    const direct = JSON.parse('{"extra":1,"__proto__":{"admin":true}}') as Record<string, unknown>;
    direct['value'] = new Date('2026-01-01T00:00:00.000Z');
    expect(Object.prototype.hasOwnProperty.call(passthrough.encode(direct as any), '__proto__')).toBe(false);
    await expect(passthrough.encodeAsync(direct as any)).resolves.toMatchObject({ extra: 1 });

    const caught = v.object({ value: dateCodec }).catchall(dateCodec);
    const date = new Date('2026-03-01T00:00:00.000Z');
    expect(caught.encode({ value: date, extra: date } as any)).toEqual({
      value: date.toISOString(),
      extra: date.toISOString()
    });
    await expect(caught.encodeAsync({ value: date, extra: date } as any)).resolves.toEqual({
      value: date.toISOString(),
      extra: date.toISOString()
    });

    expect(v.object({ value: v.string() }).strict().safeEncode({ value: 'x', extra: 1 } as any).success).toBe(false);
    await expect(v.object({ value: v.string() }).strict().safeEncodeAsync({ value: 'x', extra: 1 } as any)).resolves.toMatchObject({ success: false });
    expect(v.object({ value: v.string() }).safeEncode(null as any).success).toBe(false);
    await expect(v.object({ value: v.string() }).safeEncodeAsync([] as any)).resolves.toMatchObject({ success: false });

    const optional = v.object({ value: v.string().optional() });
    expect(optional.encode({} as any)).toEqual({});
    expect(optional.encode({ value: undefined })).toEqual({ value: undefined });
    await expect(optional.encodeAsync({} as any)).resolves.toEqual({});
    await expect(optional.encodeAsync({ value: undefined })).resolves.toEqual({ value: undefined });
    expect(v.object({ value: v.string() }).encode({ value: 'x', extra: 1 } as any)).toEqual({ value: 'x' });
    await expect(v.object({ value: v.string() }).encodeAsync({ value: 'x', extra: 1 } as any)).resolves.toEqual({ value: 'x' });
  });

  test('validates collection and tuple constraints while encoding', async () => {
    const exact = v.array(dateCodec).length(1);
    const min = v.array(dateCodec).min(2);
    const max = v.array(dateCodec).max(1);
    const unique = v.array(v.string()).unique();
    const date = new Date(0);

    expect(exact.element).toBe(dateCodec);
    expect(exact.unwrap()).toBe(dateCodec);

    expect(exact.safeEncode([]).success).toBe(false);
    expect(min.safeEncode([date]).success).toBe(false);
    expect(max.safeEncode([date, date]).success).toBe(false);
    expect(unique.safeEncode(['x', 'x']).success).toBe(false);
    expect(exact.safeEncode(null as any).success).toBe(false);
    expect(v.array(dateCodec).safeEncode(null as any).success).toBe(false);
    await expect(exact.safeEncodeAsync([date])).resolves.toEqual({ success: true, data: [date.toISOString()] });
    await expect(exact.safeEncodeAsync([])).resolves.toMatchObject({ success: false });

    const fixed = v.tuple([dateCodec]);
    const rest = fixed.rest(dateCodec);
    expect(fixed.safeEncode([] as any).success).toBe(false);
    expect(fixed.safeEncode(null as any).success).toBe(false);
    expect(fixed.encode([date])).toEqual([date.toISOString()]);
    await expect(fixed.encodeAsync([date])).resolves.toEqual([date.toISOString()]);
    expect(rest.parse([date.toISOString(), date.toISOString()])).toEqual([date, date]);
    expect(rest.safeParse([]).success).toBe(false);
    expect(rest.safeParse([date.toISOString(), 'bad']).success).toBe(false);
    await expect(rest.safeEncodeAsync([date, date] as any)).resolves.toEqual({
      success: true,
      data: [date.toISOString(), date.toISOString()]
    });
    await expect(rest.safeEncodeAsync([] as any)).resolves.toMatchObject({ success: false });
    await expect(rest.safeEncodeAsync(null as any)).resolves.toMatchObject({ success: false });
  });

  test('normalizes boolean and non-JSON fromJSONSchema inputs', () => {
    expect(fromJSONSchema(true).parse('anything')).toBe('anything');
    expect(fromJSONSchema(false).safeParse('anything').success).toBe(false);

    const docs = registry<Record<string, unknown>>();
    const schema = fromJSONSchema({ type: 'string', title: 'Name' }, { registry: docs, defaultTarget: 'draft-7' });
    expect(docs.get(schema)).toMatchObject({ title: 'Name' });

    const cyclic: any = { type: 'object' };
    cyclic.self = cyclic;
    expect(() => fromJSONSchema(cyclic)).toThrow('not valid JSON');
    expect(() => fromJSONSchema({ type: 'string', default: 1n } as any)).toThrow('not valid JSON');
  });
});
