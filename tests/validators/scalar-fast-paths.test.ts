import { v } from '../../src';

describe('Scalar validator fast paths', () => {
  it('should parse bigint constraints through fast modes', () => {
    expect(v.bigint().parseKnownBigInt(1n)).toBe(1n);
    expect(v.bigint().positive().parseKnownBigInt(1n)).toBe(1n);
    expect(v.bigint().negative().parseKnownBigInt(-1n)).toBe(-1n);
    expect(v.bigint().nonnegative().parseKnownBigInt(0n)).toBe(0n);
    expect(v.bigint().nonpositive().parseKnownBigInt(0n)).toBe(0n);

    expect(v.bigint().positive().safeParse(0n).success).toBe(false);
    expect(v.bigint().negative().safeParse(0n).success).toBe(false);
    expect(v.bigint().safeParse(1).success).toBe(false);
  });

  it('should apply bigint checks through the generic multi-check path', () => {
    const positiveBounded = v.bigint().positive().max(10n);
    const negativeBounded = v.bigint().negative().min(-10n);
    const nonnegativeBounded = v.bigint().nonnegative().max(10n);
    const nonpositiveBounded = v.bigint().nonpositive().min(-10n);

    expect(positiveBounded.parseKnownBigInt(5n)).toBe(5n);
    expect(negativeBounded.parseKnownBigInt(-5n)).toBe(-5n);
    expect(nonnegativeBounded.parseKnownBigInt(0n)).toBe(0n);
    expect(nonpositiveBounded.parseKnownBigInt(0n)).toBe(0n);

    expect(positiveBounded.safeParse(0n).success).toBe(false);
    expect(negativeBounded.safeParse(0n).success).toBe(false);
    expect(nonnegativeBounded.safeParse(-1n).success).toBe(false);
    expect(nonpositiveBounded.safeParse(1n).success).toBe(false);

    expect(v.bigint().gt(1n).parseKnownBigInt(2n)).toBe(2n);
    expect(v.bigint().lt(3n).parseKnownBigInt(2n)).toBe(2n);
    expect(v.bigint().gte(2n).parseKnownBigInt(2n)).toBe(2n);
    expect(v.bigint().lte(2n).parseKnownBigInt(2n)).toBe(2n);
  });

  it('should parse known Date instances without changing output identity', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    const schema = v.date();

    expect(schema.parseKnownDate(now)).toBe(now);
    expect(schema.safeParse(now)).toEqual({ success: true, data: now });
    expect(schema.safeParse(new Date('invalid')).success).toBe(false);
  });

  it('should use known scalar parsers for object fields', () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    const schema = v.object({
      count: v.bigint().positive(),
      createdAt: v.date()
    });

    expect(schema.parse({ count: 1n, createdAt })).toEqual({ count: 1n, createdAt });
    expect(schema.safeParse({ count: 0n, createdAt }).success).toBe(false);
    expect(schema.safeParse({ count: 1n, createdAt: new Date('invalid') }).success).toBe(false);
  });

  it('should parse known constrained boolean values without losing checks', () => {
    const trueOnly = v.boolean().true();
    const falseOnly = v.boolean().false();

    expect(v.boolean().parseKnownBoolean(false)).toBe(false);
    expect((trueOnly as any).isSimple).toBe(false);
    expect((falseOnly as any).isSimple).toBe(false);
    expect(trueOnly.parseKnownBoolean(true)).toBe(true);
    expect(() => trueOnly.parseKnownBoolean(false)).toThrow('Value must be true');
    expect(falseOnly.parseKnownBoolean(false)).toBe(false);
    expect(() => falseOnly.parseKnownBoolean(true)).toThrow('Value must be false');
  });

  it('should preserve symbol identity through the known symbol object path', () => {
    const token = Symbol('token');
    const schema = v.object({ token: v.symbol() });

    expect(v.symbol().parseKnownSymbol(token)).toBe(token);
    expect(schema.parse({ token })).toEqual({ token });
    expect(schema.safeParse({ token: 'token' }).success).toBe(false);
  });

  it('should parse primitive scalar object fields through simple fast paths', () => {
    const token = Symbol('token');
    const schema = v.object({
      id: v.bigint(),
      token: v.symbol(),
      nil: v.null(),
      undef: v.undefined(),
      empty: v.void()
    });

    const payload = {
      id: 1n,
      token,
      nil: null,
      undef: undefined,
      empty: undefined
    };

    expect(schema.parse(payload)).toEqual(payload);
    expect(schema.safeParse(payload)).toEqual({ success: true, data: payload });
    expect(schema.safeParse({ ...payload, id: 1 }).success).toBe(false);
    expect(schema.safeParse({ ...payload, token: 'token' }).success).toBe(false);
    expect(schema.safeParse({ ...payload, nil: undefined }).success).toBe(false);
    expect(schema.safeParse({ ...payload, undef: null }).success).toBe(false);
    expect(schema.safeParse({ ...payload, empty: null }).success).toBe(false);
  });

  it('should expose precise runtime types for any and unknown validators', () => {
    expect(v.any().validatorType).toBe('any');
    expect(v.unknown().validatorType).toBe('unknown');
  });

  it('should pass any and unknown fields through object fast paths unchanged', () => {
    const payload = { nested: true };
    const schema = v.object({
      anyValue: v.any(),
      unknownValue: v.unknown()
    });

    expect(schema.parse({ anyValue: payload, unknownValue: payload })).toEqual({
      anyValue: payload,
      unknownValue: payload
    });
    expect(schema.safeParse({ anyValue: undefined, unknownValue: null })).toEqual({
      success: true,
      data: {
        anyValue: undefined,
        unknownValue: null
      }
    });

    expect(v.any().safeParse(payload)).toEqual({ success: true, data: payload });
    expect(v.unknown().safeParse(payload)).toEqual({ success: true, data: payload });
  });

  it('should pass any and unknown fields through non-simple object paths unchanged', () => {
    const payload = { nested: true };
    const strictSchema = v.object({
      anyValue: v.any(),
      unknownValue: v.unknown()
    }).strict();
    const customSafeParseSchema = v.object({
      anyValue: v.any(),
      customValue: v.custom({ parse: value => value })
    });

    expect(strictSchema.parse({ anyValue: payload, unknownValue: payload })).toEqual({
      anyValue: payload,
      unknownValue: payload
    });
    expect(customSafeParseSchema.safeParse({ anyValue: payload, customValue: 'ok' })).toEqual({
      success: true,
      data: {
        anyValue: payload,
        customValue: 'ok'
      }
    });
  });

  it('should expose precise runtime types for json, file, and function validators', () => {
    expect(v.json().validatorType).toBe('json');
    expect(v.file().validatorType).toBe('file');
    expect(v.function().validatorType).toBe('function');
  });

  it('should preserve function identity through the known function object path', () => {
    const handler = () => 'ok';
    const schema = v.object({ handler: v.function() });

    expect(v.function().parseKnownFunction(handler)).toBe(handler);
    expect(schema.parse({ handler })).toEqual({ handler });
    expect(schema.safeParse({ handler: 'not-a-function' }).success).toBe(false);
  });

  it('should expose precise runtime types for wrapper validators', () => {
    expect(v.string().optional().validatorType).toBe('optional');
    expect(v.string().exactOptional().validatorType).toBe('exactOptional');
    expect(v.string().nullable().validatorType).toBe('nullable');
    expect(v.string().nullish().validatorType).toBe('nullish');
    expect(v.string().default('fallback').validatorType).toBe('default');
    expect(v.string().default('fallback').prefault().validatorType).toBe('prefault');
    expect(v.string().catch('fallback').validatorType).toBe('catch');
    expect(v.string().readonly().validatorType).toBe('readonly');
    expect(v.string().brand<'Token'>().validatorType).toBe('brand');
    expect(v.string().refine(value => value.length > 0).validatorType).toBe('refine');
    expect(v.string().transform(value => value.length).validatorType).toBe('transform');
    expect(v.string().pipe(v.number()).validatorType).toBe('pipe');
    expect(v.string().superRefine(() => undefined).validatorType).toBe('superRefine');
    expect(v.preprocess(value => value, v.string()).validatorType).toBe('preprocess');
    expect(v.string().meta({ description: 'Token' }).validatorType).toBe('meta');
  });

  it('should parse simple exactOptional, nullable, and nullish values without changing semantics', () => {
    const exactOptional = v.string().exactOptional();
    const nullable = v.number().nullable();
    const nullish = v.boolean().nullish();
    const caught = v.string().catch('fallback');

    expect(exactOptional.parse('token')).toBe('token');
    expect(exactOptional.parse(undefined)).toBeUndefined();
    expect(exactOptional.safeParse(123).success).toBe(false);

    expect(nullable.parse(42)).toBe(42);
    expect(nullable.parse(null)).toBeNull();
    expect(nullable.safeParse(Number.NaN).success).toBe(false);

    expect(nullish.parse(true)).toBe(true);
    expect(nullish.parse(null)).toBeNull();
    expect(nullish.parse(undefined)).toBeUndefined();
    expect(nullish.safeParse('true').success).toBe(false);

    expect(caught.parse('token')).toBe('token');
    expect(caught.parse(123)).toBe('fallback');
    expect(caught.safeParse(123)).toEqual({ success: true, data: 'fallback' });
  });

  it('should expose precise runtime types for special validators', () => {
    expect(v.email().validatorType).toBe('stringFormat');
    expect(v.stringbool().validatorType).toBe('stringBool');
    expect(v.lazy(() => v.string()).validatorType).toBe('lazy');
    expect(v.custom({ parse: value => value }).validatorType).toBe('custom');
    expect(v.intersection(v.object({ a: v.string() }), v.object({ b: v.number() })).validatorType).toBe('intersection');
    expect(v.xor(v.string(), v.number()).validatorType).toBe('xor');
    expect(v.templateLiteral('id-', v.number()).validatorType).toBe('templateLiteral');
    expect(v.promise(v.string()).validatorType).toBe('promise');
    expect(v.base64Bytes().validatorType).toBe('base64');
    expect(v.hexBytes().validatorType).toBe('hex');
    expect(v.uint8Array().validatorType).toBe('uint8Array');
    expect(v.codec(v.string(), v.number(), {
      decode: value => Number(value),
      encode: value => String(value)
    }).validatorType).toBe('codec');
  });

  it('should keep optimized string format and stringbool behavior stable', () => {
    const email = v.email();
    const stringBool = v.stringbool();
    const caseSensitive = v.stringbool({ truthy: ['YES'], falsy: ['NO'], caseSensitive: true });

    expect(email.parse('dev@example.com')).toBe('dev@example.com');
    expect(email.safeParse('invalid').success).toBe(false);
    expect(email.safeParse(123).success).toBe(false);

    expect(stringBool.parse('YES')).toBe(true);
    expect(stringBool.parse('disabled')).toBe(false);
    expect(stringBool.parse(true)).toBe(true);
    expect(stringBool.safeParse('maybe').success).toBe(false);

    expect(caseSensitive.parse('YES')).toBe(true);
    expect(caseSensitive.safeParse('yes').success).toBe(false);
  });
});
