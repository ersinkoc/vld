import { describe, expect, it } from '@jest/globals';
import {
  catch as catchSchema,
  check,
  clone,
  config,
  core,
  describe as describeSchema,
  fromJSONSchema,
  decode,
  encode,
  formatError,
  globalRegistry,
  email,
  endsWith,
  gt,
  includes,
  instanceof as instanceOf,
  isOk,
  keyof as keyofSchema,
  ksuid,
  length,
  locales,
  map,
  meta as metaSchema,
  mime,
  minLength,
  multipleOf,
  nan,
  nativeEnum,
  nonoptional,
  normalize,
  number,
  object,
  overwrite,
  parse,
  parseAsync,
  pipe,
  positive,
  property,
  readonly,
  refine,
  registry,
  regex,
  regexes,
  safeDecode,
  safeEncode,
  safeParse,
  safeParseAsync,
  slugify,
  setErrorMap,
  string,
  startsWith,
  superRefine,
  success,
  flattenError,
  prettifyError,
  toJSONSchema,
  transform,
  treeifyError,
  trim,
  util,
  v,
  url,
  uuidv6,
  uuidv7,
  z,
  ZodIssueCode,
  ZodString,
  ZodEmail,
  ZodError,
  ZodType,
  TimePrecision,
  ZodTemplateLiteral,
  VldError,
  $brand,
  $input,
  $output,
  _ZodString,
  _default,
  _function,
  enum as enumSchema,
  function as functionSchema,
  null as nullSchema,
  undefined as undefinedSchema,
  void as voidSchema,
  type Infer,
  type StandardSchemaV1
} from '../src/index';
import { invertCodec, stringToNumber } from '../src/codecs';

describe('Zod 4 parity additions', () => {
  it('exposes Zod-style root factory aliases alongside the v namespace', () => {
    expect(z).toBe(v);
    expect(string().parse('ok')).toBe('ok');
    expect(email().safeParse('test@example.com').success).toBe(true);
    expect(object({ id: string() }).parse({ id: 'usr_1' })).toEqual({ id: 'usr_1' });
    expect(map(string(), string()).parse(new Map([['key', 'value']]))).toEqual(new Map([['key', 'value']]));
    const mappedResult = map(success(1), value => value + 1);
    expect(isOk(mappedResult)).toBe(true);
    if (isOk(mappedResult)) {
      expect(mappedResult.data).toBe(2);
    }
    expect(url().parse('https://example.com')).toBe('https://example.com');
    expect(uuidv6().parse('1ef21d2f-6c2e-6a10-9234-123456789abc')).toBe('1ef21d2f-6c2e-6a10-9234-123456789abc');
    expect(uuidv7().parse('01890f13-7cc2-7f9a-9234-123456789abc')).toBe('01890f13-7cc2-7f9a-9234-123456789abc');
    expect(nan().parse(Number.NaN)).toBeNaN();
    expect(trim().parse('  ok  ')).toBe('ok');
    expect(minLength(2).parse('ok')).toBe('ok');
    expect(length(2).parse('ok')).toBe('ok');
    expect(regex(/^[a-z]+$/).parse('ok')).toBe('ok');
    expect(startsWith('o').parse('ok')).toBe('ok');
    expect(endsWith('k').parse('ok')).toBe('ok');
    expect(includes('o').parse('ok')).toBe('ok');
    expect(gt(1).parse(2)).toBe(2);
    expect(positive().parse(1)).toBe(1);
    expect(multipleOf(2).parse(4)).toBe(4);
    expect(z.minLength(2).parse('ok')).toBe('ok');
    expect(z.positive().parse(1)).toBe(1);
    expect(nativeEnum({ Draft: 'draft', Published: 'published' }).parse('draft')).toBe('draft');
    expect(z.nativeEnum({ 0: 'Up', 1: 'Down', Up: 0, Down: 1 }).parse(1)).toBe(1);
    expect(z.nativeEnum({ 0: 'Up', 1: 'Down', Up: 0, Down: 1 }).safeParse('Up').success).toBe(false);
    expect(enumSchema('red', 'blue').parse('red')).toBe('red');
    expect(functionSchema().parse(() => 'ok')()).toBe('ok');
    expect(nullSchema().parse(null)).toBeNull();
    expect(undefinedSchema().parse(undefined)).toBeUndefined();
    expect(voidSchema().parse(undefined)).toBeUndefined();
  });

  it('exposes Zod-style root schema composition and check helpers', async () => {
    expect(catchSchema(string(), 'fallback').parse(1)).toBe('fallback');
    expect(nonoptional(string().optional()).safeParse(undefined).success).toBe(false);
    expect(readonly(object({ id: string() })).parse({ id: 'a' })).toEqual({ id: 'a' });
    expect(pipe(string(), transform((value: string) => value.length)).parse('abcd')).toBe(4);
    expect(clone(string()).parse('ok')).toBe('ok');

    expect(describeSchema(string(), 'Display name').meta()).toMatchObject({ description: 'Display name' });
    expect(metaSchema(string(), { title: 'Name' }).meta()).toMatchObject({ title: 'Name' });

    expect(refine(string(), value => value.startsWith('v')).parse('vld')).toBe('vld');
    expect(() => refine((value: string) => value.startsWith('v'), 'Must start with v').parse('bad')).toThrow('Must start with v');
    expect(() => refine((value: string) => value.startsWith('v')).parse('bad')).toThrow('Refinement check failed');
    expect(() => refine(async (value: string) => value.startsWith('v')).parse('vld')).toThrow('Use parseAsync');
    await expect(refine(async (value: string) => value.startsWith('v')).parseAsync('vld')).resolves.toBe('vld');
    await expect(refine(async (value: string) => value.startsWith('v')).parseAsync('bad')).rejects.toThrow('Refinement check failed');
    await expect(refine(async (value: string) => value.startsWith('v'), { error: 'Async failed' }).safeParseAsync('bad')).resolves.toMatchObject({
      success: false
    });
    expect(check((value: string) => value.length > 2).parse('vld')).toBe('vld');
    expect(superRefine(string(), (value, ctx) => {
      if (!value.includes('-')) {
        ctx.addIssue({ message: 'Expected hyphen' });
      }
    }).safeParse('vld').success).toBe(false);

    class Example {}
    expect(instanceOf(Example).parse(new Example())).toBeInstanceOf(Example);
    expect(() => instanceOf(Example, { message: 'Expected Example' }).parse({})).toThrow('Expected Example');
    expect(() => instanceOf(class {}, undefined).parse({})).toThrow('Expected instance of provided constructor');
    expect(property('id', string()).safeParse({ id: 'usr_1' }).success).toBe(true);
    expect(() => property('id', string()).parse({})).toThrow('Expected object with property "id"');
    expect(() => property('id', string()).parse({ id: 1 })).toThrow('Invalid string');
    expect(() => property('id', string(), 'Missing id').parse({})).toThrow('Missing id');
    expect(() => property('id', string(), { error: 'Bad id' }).parse({ id: 1 })).toThrow('Bad id');
    expect(keyofSchema(object({ id: string(), name: string() })).parse('id')).toBe('id');
    expect(mime('image/png').safeParse({ size: 1, type: 'image/png' }).success).toBe(true);
    expect(normalize('NFKC').parse('\u212B')).toBe('\u00C5');
    expect(slugify().parse(' VLD Schema API! ')).toBe('vld-schema-api');
    expect(overwrite((value: string) => value.trim()).parse(' ok ')).toBe('ok');
    await expect(transform(async (value: string) => value.trim()).parseAsync(' ok ')).resolves.toBe('ok');
    expect(() => transform(async (value: string) => value.trim()).parse(' ok ')).toThrow('Use parseAsync');
    expect(v.prefault(string().min(2), 'ok').parse(undefined)).toBe('ok');
    expect(ksuid().parse('0o5Fs0EELR0fUjHjbCnEtdUwQe3')).toBe('0o5Fs0EELR0fUjHjbCnEtdUwQe3');
    expect(regexes.ksuid.test('0o5Fs0EELR0fUjHjbCnEtdUwQe3')).toBe(true);
    expect(locales.getLocale()).toBeDefined();
    setErrorMap(() => 'Custom');
    expect(config()).toMatchObject({ errorMap: expect.any(Function) });
    expect(config({ locale: 'en' })).toMatchObject({ locale: 'en' });
    const customError = () => 'Custom via config';
    expect(config({ customError })).toMatchObject({ customError });
    expect(v.getErrorMap()).toBe(customError);
    expect(core.parse(string(), 'ok')).toBe('ok');
    expect(core.safeParse(string(), 'ok')).toEqual({ success: true, data: 'ok' });
    await expect(core.parseAsync(string(), 'ok')).resolves.toBe('ok');
    await expect(core.safeParseAsync(string(), 1)).resolves.toMatchObject({ success: false });
    expect(core.regexes.ksuid.test('0o5Fs0EELR0fUjHjbCnEtdUwQe3')).toBe(true);
    expect(util.getParsedType([])).toBe('array');
    expect(util.getParsedType(null)).toBe('null');
    expect(util.getParsedType(Number.NaN)).toBe('nan');
    expect(util.nullish(undefined)).toBe(true);
    expect(util.joinValues(['a', 1])).toBe('"a" | 1');
    expect(JSON.stringify({ value: 1n }, util.jsonStringifyReplacer)).toBe('{"value":"1"}');
    const cachedValue = util.cached(() => Math.random());
    expect(cachedValue()).toBe(cachedValue());
    expect(() => util.assert(true)).not.toThrow();
    expect(() => util.assert(false, 'Nope')).toThrow('Nope');
    expect(() => util.assert(false)).toThrow('Assertion failed');
    expect(() => util.assertNever('unexpected' as never)).toThrow('Unexpected value');
    expect(z.core).toBe(core);
    expect(z.util).toBe(util);
    expect(TimePrecision.Millisecond).toBe(3);
    expect(ZodIssueCode.invalid_type).toBe('invalid_type');
    expect(ZodString).toBeDefined();
    expect(ZodEmail).toBeDefined();
    expect(ZodError).toBeDefined();
    expect(ZodType).toBeDefined();
    expect(ZodTemplateLiteral).toBeDefined();
    expect(typeof $brand).toBe('symbol');
    expect(typeof $input).toBe('symbol');
    expect(typeof $output).toBe('symbol');
    expect(_ZodString).toBe(ZodString);
    expect(_default).toBe(v);
    expect(_function().parse(() => 'ok')()).toBe('ok');
    expect(formatError(new VldError([
      { code: 'custom', path: ['user', 'email'], message: 'Invalid email' },
      { code: 'custom', path: ['user', 'name'], message: 'Missing name' }
    ]))).toEqual({
      _errors: [],
      user: {
        _errors: [],
        email: { _errors: ['Invalid email'] },
        name: { _errors: ['Missing name'] }
      }
    });
    expect(formatError({ message: 'Plain issue' } as Error)).toEqual({
      _errors: ['[object Object]']
    });
    expect(formatError(new Error('Plain issue'))).toEqual({
      _errors: ['Plain issue']
    });
  });

  it('exposes Zod-style root parse, decode, encode, and error formatting helpers', async () => {
    const schema = object({ id: string().min(2) });

    expect(parse(schema, { id: 'ab' })).toEqual({ id: 'ab' });
    expect(safeParse(schema, { id: 'a' }).success).toBe(false);
    await expect(parseAsync(schema, { id: 'ab' })).resolves.toEqual({ id: 'ab' });
    await expect(safeParseAsync(schema, { id: 'a' })).resolves.toMatchObject({ success: false });

    expect(decode(schema, { id: 'ab' })).toEqual({ id: 'ab' });
    expect(safeDecode(schema, { id: 'a' }).success).toBe(false);

    expect(decode(stringToNumber, '42')).toBe(42);
    expect(encode(stringToNumber, 42)).toBe('42');
    expect(safeEncode(stringToNumber, 42)).toEqual({ success: true, data: '42' });

    const asyncCodec = v.codec(string(), string(), {
      decode: async value => value.trim(),
      encode: async value => value.toUpperCase()
    });
    await expect(v.decodeAsync(asyncCodec, ' ok ')).resolves.toBe('ok');
    await expect(v.encodeAsync(asyncCodec, 'ok')).resolves.toBe('OK');

    const result = schema.safeParse({ id: 'a' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(formatError(result.error)).toEqual({
        _errors: ['Invalid field "id": String must be at least 2 characters']
      });
      expect(result.error).toBeInstanceOf(VldError);
      const vldError = result.error as VldError;
      expect(v.formatError(vldError)).toEqual(formatError(vldError));
      expect(v.treeifyError(vldError)).toEqual(treeifyError(vldError));
      expect(v.prettifyError(vldError)).toBe(prettifyError(vldError));
      expect(v.flattenError(vldError)).toEqual(flattenError(vldError));
    }
    expect(v.toJSONSchema(schema)).toEqual(toJSONSchema(schema));

    for (const primitiveResult of [
      string().safeParse(123),
      number().safeParse('123'),
      v.boolean().safeParse('true')
    ]) {
      expect(primitiveResult.success).toBe(false);
      if (!primitiveResult.success) {
        expect(primitiveResult.error).toBeInstanceOf(VldError);
        expect(v.treeifyError(primitiveResult.error as VldError)).toHaveProperty('errors');
        expect(v.prettifyError(primitiveResult.error as VldError)).toContain(primitiveResult.error.message);
        expect(v.flattenError(primitiveResult.error as VldError).formErrors).toContain(primitiveResult.error.message);
      }
    }

    for (const collectionResult of [
      v.array(v.string()).safeParse([1]),
      v.tuple(v.string(), v.number()).safeParse(['ok', 'bad']),
      v.record(v.number()).safeParse({ count: 'bad' }),
      v.set(v.string()).safeParse(new Set([1])),
      v.map(v.string(), v.number()).safeParse(new Map([['count', 'bad']]))
    ]) {
      expect(collectionResult.success).toBe(false);
      if (!collectionResult.success) {
        expect(collectionResult.error).toBeInstanceOf(VldError);
        expect(v.treeifyError(collectionResult.error as VldError)).toHaveProperty('errors');
        expect(v.prettifyError(collectionResult.error as VldError)).toContain(collectionResult.error.message);
        expect(v.flattenError(collectionResult.error as VldError).formErrors).toContain(collectionResult.error.message);
      }
    }

    for (const scalarResult of [
      v.date().safeParse('not-a-date'),
      v.bigint().safeParse(1),
      v.null().safeParse(undefined),
      v.undefined().safeParse(null),
      v.nan().safeParse(1),
      v.symbol().safeParse('symbol'),
      v.literal('ok').safeParse('bad'),
      v.never().safeParse('anything'),
      v.void().safeParse(null),
      v.function().safeParse('not a function'),
      v.file().safeParse(null),
      v.intersection(v.object({ a: v.string() }), v.object({ b: v.number() })).safeParse({ a: 'ok', b: 'bad' })
    ]) {
      expect(scalarResult.success).toBe(false);
      if (!scalarResult.success) {
        expect(scalarResult.error).toBeInstanceOf(VldError);
        expect(v.treeifyError(scalarResult.error as VldError)).toHaveProperty('errors');
        expect(v.prettifyError(scalarResult.error as VldError)).toContain(scalarResult.error.message);
        expect(v.flattenError(scalarResult.error as VldError).formErrors).toContain(scalarResult.error.message);
      }
    }
  });

  it('keeps v namespace compatibility helpers wired through their public branches', async () => {
    const customError = () => 'Custom via legacy errorMap';
    expect(v.config({ errorMap: customError })).toMatchObject({ errorMap: customError });
    expect(v.getErrorMap()).toBe(customError);

    expect(() => v.nativeEnum({})).toThrow('nativeEnum requires at least one string or number value');

    expect(v.uint32().parse(1)).toBe(1);
    expect(v.uint64().parse(1)).toBe(1);
    expect(v.int64().parse(1)).toBe(1);
    expect(v.float32().parse(1.5)).toBe(1.5);
    expect(v.float64().parse(1.5)).toBe(1.5);
    expect(v.exactOptional(v.string()).parse(undefined)).toBeUndefined();

    expect(v.transform(v.string()).parse('same')).toBe('same');
    expect(v.describe('Root description').meta()).toMatchObject({ description: 'Root description' });
    expect(v.describe(v.string()).meta()).toMatchObject({ description: '' });
    expect(v.meta({ title: 'Root metadata' }).meta()).toMatchObject({ title: 'Root metadata' });
    expect(v.meta(v.string()).meta()).toEqual({});
    expect(v.prefault(v.string(), () => 'lazy')).toBeDefined();
    expect(v.prefault(v.string(), () => 'lazy').parse(undefined)).toBe('lazy');
    expect(v.check(v.string(), value => value.startsWith('v')).parse('vld')).toBe('vld');
    expect(() => v.check((value: string) => value.startsWith('v')).parse('bad')).toThrow('Refinement check failed');
    expect(v.superRefine((value: string, ctx) => {
      if (value !== 'ok') {
        ctx.addIssue({ message: 'Expected ok' });
      }
    }).safeParse('bad').success).toBe(false);
    expect(v.superRefine(v.string()).parse('ok')).toBe('ok');

    expect(v.minLength(2).parse('ok')).toBe('ok');
    expect(v.maxLength(2).parse('ok')).toBe('ok');
    expect(v.length(2).parse('ok')).toBe('ok');
    expect(v.regex(/^ok$/).parse('ok')).toBe('ok');
    expect(v.startsWith('o').parse('ok')).toBe('ok');
    expect(v.endsWith('k').parse('ok')).toBe('ok');
    expect(v.includes('o').parse('ok')).toBe('ok');
    expect(v.trim().parse(' ok ')).toBe('ok');
    expect(v.toLowerCase().parse('OK')).toBe('ok');
    expect(v.lowercase().parse('OK')).toBe('ok');
    expect(v.toUpperCase().parse('ok')).toBe('OK');
    expect(v.uppercase().parse('ok')).toBe('OK');

    expect(v.gt(1).parse(2)).toBe(2);
    expect(v.gte(2).parse(2)).toBe(2);
    expect(v.lt(2).parse(1)).toBe(1);
    expect(v.lte(2).parse(2)).toBe(2);
    expect(v.negative().parse(-1)).toBe(-1);
    expect(v.nonnegative().parse(0)).toBe(0);
    expect(v.nonpositive().parse(0)).toBe(0);
    expect(v.multipleOf(2).parse(4)).toBe(4);
    expect(v.minSize(2).parse('ok')).toBe('ok');
    expect(v.maxSize(2).parse('ok')).toBe('ok');
    expect(v.size(2).parse('ok')).toBe('ok');

    expect(util.getParsedType('value')).toBe('string');

    await expect(v.safeDecodeAsync(v.string(), 'ok')).resolves.toEqual({ success: true, data: 'ok' });
    expect(v.encode(v.string(), 'ok')).toBe('ok');
    expect(v.safeEncode(v.string(), 'ok')).toEqual({ success: true, data: 'ok' });
    await expect(v.encodeAsync(v.string(), 'ok')).resolves.toBe('ok');
    await expect(v.safeEncodeAsync(v.string(), 'ok')).resolves.toEqual({ success: true, data: 'ok' });

    const asyncCodec = v.codec(v.string(), v.string(), {
      decode: async value => value.trim(),
      encode: async value => value.toUpperCase()
    });
    await expect(v.safeEncodeAsync(asyncCodec, 'ok')).resolves.toEqual({ success: true, data: 'OK' });
  });

  it('stores and reads typed metadata through custom registries', () => {
    const descriptions = registry<{ description: string }>();
    const schema = v.string();
    const schema2 = v.number();
    const metadata = { description: 'Display name' };

    descriptions.add(schema, metadata);
    metadata.description = 'Mutated outside registry';

    expect(descriptions.has(schema)).toBe(true);
    expect(descriptions.get(schema)).toEqual({ description: 'Display name' });
    expect(descriptions.add(schema2, { description: 'Age' })).toBe(schema2);
    expect(descriptions.remove(schema)).toBe(true);
    expect(descriptions.has(schema)).toBe(false);
    expect(descriptions.has(schema2)).toBe(true);

    descriptions.clear();
    expect(descriptions.has(schema2)).toBe(false);
    expect(descriptions.get(schema2)).toBeUndefined();
  });

  it('registers schemas through the Zod 4 style .register() convenience API', () => {
    const docs = registry<{ title: string; description: string }>();
    const schema = v.string().email();

    const returned = schema.register(docs, {
      title: 'Email',
      description: 'Contact email address'
    });

    expect(returned).toBe(schema);
    expect(docs.get(schema)).toEqual({
      title: 'Email',
      description: 'Contact email address'
    });
  });

  it('includes global registry metadata in JSON Schema output', () => {
    const schema = v.object({
      email: v.string().email(),
      displayName: v.string().min(1).optional()
    });

    globalRegistry.add(schema, {
      id: 'user_profile',
      title: 'User Profile',
      description: 'Public profile payload',
      examples: [{ email: 'test@example.com', displayName: 'Test User' }]
    });

    const json = toJSONSchema(schema);

    expect(json.$id).toBe('user_profile');
    expect(json.title).toBe('User Profile');
    expect(json.description).toBe('Public profile payload');
    expect(json.examples).toEqual([{ email: 'test@example.com', displayName: 'Test User' }]);
    expect(json.required).toEqual(['email']);
    expect(json.properties?.['email']).toEqual({ type: 'string', format: 'email' });
  });

  it('keeps .meta() and .describe() backward compatible while feeding JSON Schema', () => {
    const schema = v.string().describe('A stable public id').meta({
      title: 'Public ID',
      examples: ['usr_123']
    });

    expect(schema.meta()).toEqual({
      description: 'A stable public id',
      title: 'Public ID',
      examples: ['usr_123']
    });

    expect(toJSONSchema(schema)).toMatchObject({
      type: 'string',
      title: 'Public ID',
      description: 'A stable public id',
      examples: ['usr_123']
    });
  });

  it('supports Zod 4 style error params without breaking string messages', () => {
    expect(() => v.string().min(5, { error: 'Too short' }).parse('abc')).toThrow('Too short');
    expect(() => v.number().positive({ error: 'Must be positive' }).parse(-1)).toThrow('Must be positive');
    expect(() => v.string().email('Bad email').parse('nope')).toThrow('Bad email');
  });

  it('supports codec inversion through helper and v namespace', () => {
    const numberToString = invertCodec(stringToNumber);
    const numberToStringViaV = v.invertCodec(stringToNumber);

    expect(numberToString.parse(42)).toBe('42');
    expect(numberToString.encode('12')).toBe(12);
    expect(numberToStringViaV.parse(7)).toBe('7');
  });

  it('exposes v.infer as a type-level compatibility alias', () => {
    const schema = v.object({ id: v.string(), count: v.number() });
    const value: v.infer<typeof schema> = { id: 'a', count: 1 };
    const valueViaExport: Infer<typeof schema> = value;

    expect(valueViaExport).toEqual({ id: 'a', count: 1 });
  });

  it('implements Standard Schema V1 validation interop', () => {
    const schema = v.object({ id: v.string(), count: v.number().int() });
    const standard: StandardSchemaV1<unknown, { id: string; count: number }> = schema;
    type StandardOutput = NonNullable<typeof standard['~standard']['types']>['output'];
    const typedValue: StandardOutput = { id: 'a', count: 1 };

    expect(standard['~standard'].version).toBe(1);
    expect(standard['~standard'].vendor).toBe('vld');
    expect(standard['~standard'].validate(typedValue)).toEqual({
      value: { id: 'a', count: 1 }
    });
    expect(standard['~standard'].validate({ id: 'a', count: 1.5 })).toMatchObject({
      issues: [{ message: expect.stringContaining('count') }]
    });
  });

  it('converts JSON Schema back to immutable VLD schemas without require()', () => {
    const schema = fromJSONSchema({
      type: 'object',
      title: 'Payload',
      required: ['id'],
      properties: {
        id: { type: 'string', minLength: 2 },
        count: { type: 'integer', minimum: 0 },
        email: { type: 'string', format: 'email' }
      },
      additionalProperties: false
    });

    expect(schema.meta()).toEqual({ title: 'Payload' });
    expect(schema.parse({ id: 'ab' })).toEqual({ id: 'ab', count: undefined, email: undefined });
    expect(() => schema.parse({ id: 'a' })).toThrow();
    expect(() => schema.parse({ id: 'ab', extra: true })).toThrow();
  });

  it('supports recursive object getters without eager construction-time resolution', () => {
    let Category: any;
    Category = v.object({
      name: v.string(),
      get children() {
        return v.array(Category).optional();
      }
    });

    expect(Category.parse({
      name: 'root',
      children: [{ name: 'child', children: [{ name: 'leaf' }] }]
    })).toEqual({
      name: 'root',
      children: [{ name: 'child', children: [{ name: 'leaf', children: undefined }] }]
    });
  });

  it('supports async parse helpers on refinements, transforms, superRefine, and promises', async () => {
    const refined = v.string().refine(async (value) => value.startsWith('v'));
    await expect(refined.parseAsync('vld')).resolves.toBe('vld');
    await expect(refined.safeParseAsync('zod')).resolves.toMatchObject({ success: false });

    const transformed = v.string().transform(async (value) => value.length);
    await expect(transformed.parseAsync('vld')).resolves.toBe(3);

    const superRefined = v.number().superRefine(async (value, ctx) => {
      if (value < 10) {
        ctx.addIssue({ message: 'Too small' });
      }
    });
    await expect(superRefined.safeParseAsync(5)).resolves.toMatchObject({ success: false });
    await expect(superRefined.parseAsync(12)).resolves.toBe(12);

    const promised = v.promise(v.string().min(2));
    await expect(promised.parseAsync(Promise.resolve('ok'))).resolves.toBe('ok');
    await expect(promised.safeParseAsync(Promise.resolve('x'))).resolves.toMatchObject({ success: false });
  });

  it('emits concrete JSON Schema constraints for chained validators', () => {
    const schema = v.object({
      email: v.string().email().min(5).max(100),
      id: v.string().uuid(),
      code: v.string().regex(/^[A-Z]{3}$/),
      age: v.number().int().min(18).max(99),
      score: v.number().gt(0).lt(100).multipleOf(0.5),
      tags: v.array(v.string().min(2)).min(1).max(5).unique(),
      pair: v.array(v.number()).length(2)
    });

    const json = toJSONSchema(schema);

    expect(json.properties?.['email']).toMatchObject({
      type: 'string',
      format: 'email',
      minLength: 5,
      maxLength: 100
    });
    expect(json.properties?.['id']).toMatchObject({ type: 'string', format: 'uuid' });
    expect(json.properties?.['code']).toMatchObject({ type: 'string', pattern: '^[A-Z]{3}$' });
    expect(json.properties?.['age']).toMatchObject({
      type: 'integer',
      minimum: 18,
      maximum: 99
    });
    expect(json.properties?.['score']).toMatchObject({
      type: 'number',
      exclusiveMinimum: 0,
      exclusiveMaximum: 100,
      multipleOf: 0.5
    });
    expect(json.properties?.['tags']).toMatchObject({
      type: 'array',
      minItems: 1,
      maxItems: 5,
      uniqueItems: true
    });
    expect((json.properties?.['tags'] as any).items).toMatchObject({
      type: 'string',
      minLength: 2
    });
    expect(json.properties?.['pair']).toMatchObject({
      type: 'array',
      minItems: 2,
      maxItems: 2
    });
  });

  it('emits JSON Schema details for bigint, date, tuple, record, set, and map schemas', () => {
    const startsAt = new Date('2026-01-01T00:00:00.000Z');
    const endsAt = new Date('2026-12-31T23:59:59.000Z');
    const schema = v.object({
      count: v.bigint().gte(1n).lt(10n),
      startsAt: v.date().min(startsAt).max(endsAt),
      tuple: v.tuple(v.string().min(1), v.number().int()),
      record: v.record(v.string().uuid()),
      set: v.set(v.number().positive()),
      map: v.map(v.string(), v.number().nonnegative())
    });

    const json = toJSONSchema(schema);

    expect(json.properties?.['count']).toMatchObject({
      type: 'integer',
      minimum: 1,
      exclusiveMaximum: 10,
      'x-vld-minimum': '1',
      'x-vld-exclusiveMaximum': '10'
    });
    expect(json.properties?.['startsAt']).toMatchObject({
      type: 'string',
      format: 'date-time',
      formatMinimum: startsAt.toISOString(),
      formatMaximum: endsAt.toISOString()
    });
    expect(json.properties?.['tuple']).toMatchObject({
      type: 'array',
      minItems: 2,
      maxItems: 2
    });
    expect((json.properties?.['tuple'] as any).items[0]).toMatchObject({ type: 'string', minLength: 1 });
    expect((json.properties?.['tuple'] as any).items[1]).toMatchObject({ type: 'integer' });
    expect(json.properties?.['record']).toMatchObject({
      type: 'object',
      additionalProperties: { type: 'string', format: 'uuid' }
    });
    expect(json.properties?.['set']).toMatchObject({
      type: 'array',
      uniqueItems: true,
      'x-vld-type': 'set',
      items: { type: 'number', exclusiveMinimum: 0 }
    });
    expect(json.properties?.['map']).toMatchObject({
      type: 'array',
      'x-vld-type': 'map'
    });
    expect((json.properties?.['map'] as any).items.items).toEqual([
      { type: 'string' },
      { type: 'number', minimum: 0 }
    ]);
  });

  it('supports modern JSON Schema target aliases and OpenAPI 3.0 normalization', () => {
    const schema = v.object({
      pair: v.tuple(v.string(), v.number().gt(0)),
      maybeName: v.string().nullable()
    });

    const draft7 = toJSONSchema(schema, { target: 'draft-7' });
    expect(draft7.$schema).toBe('http://json-schema.org/draft-07/schema#');
    expect((draft7.properties?.['pair'] as any).items).toEqual([
      { type: 'string' },
      { type: 'number', exclusiveMinimum: 0 }
    ]);

    const draft2020 = toJSONSchema(schema, { target: 'draft-2020-12' });
    expect(draft2020.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
    expect((draft2020.properties?.['pair'] as any).prefixItems).toEqual([
      { type: 'string' },
      { type: 'number', exclusiveMinimum: 0 }
    ]);
    expect((draft2020.properties?.['pair'] as any).items).toBe(false);

    const openapi = toJSONSchema(schema, { target: 'openapi-3.0' });
    expect(openapi.$schema).toBeUndefined();
    expect(openapi.properties?.['maybeName']).toEqual({ type: 'string', nullable: true });
    expect((openapi.properties?.['pair'] as any).items[1]).toEqual({
      type: 'number',
      minimum: 0,
      exclusiveMinimum: true
    });
  });

  it('converts nullable and tuple JSON Schema variants back to VLD schemas', () => {
    const nullable = fromJSONSchema({ type: 'string', nullable: true });
    expect(nullable.parse('ok')).toBe('ok');
    expect(nullable.parse(null)).toBe(null);

    const tuple = fromJSONSchema({
      type: 'array',
      prefixItems: [{ type: 'string' }, { type: 'integer' }],
      minItems: 2,
      maxItems: 2
    });

    expect(tuple.parse(['id', 1])).toEqual(['id', 1]);
    expect(() => tuple.parse(['id', 'bad'])).toThrow();
    expect(() => tuple.parse(['id', 1, 2])).toThrow();
  });
});
