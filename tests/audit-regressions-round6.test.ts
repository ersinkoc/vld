import { isMultipleOf } from '../src/validators/number';
import { toJSONSchema } from '../src';
import { fromJSONSchema } from '../src/utils/json-schema';
import { intersectionSide } from '../src/validators/intersection';
import { VldError } from '../src/errors-core';
/**
 * Regression tests for audit round 6 (findings F219+). Each block names the finding it protects;
 * expected values were taken from Zod 4.6.5.
 */
import { describe, it, expect } from '@jest/globals';
import { v } from '../src';

describe('F219: omitted trailing tuple items follow the optin/optout ladder', () => {
  const Dflt = () => v.string().default('d');

  it('fills omitted default, prefault and catch items', () => {
    expect(v.tuple([v.string(), Dflt()]).parse(['a'])).toEqual(['a', 'd']);
    expect(v.tuple([v.string(), v.number().prefault(3)]).parse(['a'])).toEqual(['a', 3]);
    expect(v.tuple([v.string().catch('c'), v.number().catch(1)]).parse([])).toEqual(['c', 1]);
    expect(v.tuple([Dflt(), v.string().default('e')]).parse([])).toEqual(['d', 'e']);
    expect(v.tuple([v.string(), Dflt()]).parse(['a', undefined])).toEqual(['a', 'd']);
  });

  it('recognises defaults reached through wrappers, pipes and unions', () => {
    const wrapped = [
      Dflt().optional(),
      Dflt().readonly(),
      Dflt().nullable(),
      Dflt().nullish(),
      Dflt().refine(() => true),
      Dflt().superRefine(() => undefined),
      Dflt().brand<'B'>(),
      Dflt().meta({ note: 'x' }),
      Dflt().catch('c'),
      Dflt().transform(value => value + '!'),
      Dflt().pipe(v.any()),
      v.union([Dflt(), v.number()])
    ] as const;
    const expected = ['d', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd!', 'd', 'd'];
    wrapped.forEach((item, index) => {
      expect(v.tuple([v.string(), item as any]).parse(['a'])).toEqual(['a', expected[index]]);
    });
    // a transform that maps the omitted optional value is applied to the omitted slot
    expect(v.tuple([v.string(), v.string().optional().transform(value => value ?? 'T')]).parse(['a'])).toEqual(['a', 'T']);
  });

  it('keeps plain optional tails omitted and requires everything else', () => {
    expect(v.tuple([v.string(), v.string().optional()]).parse(['a'])).toEqual(['a']);
    expect(v.tuple([v.string(), v.string().exactOptional()]).parse(['a'])).toEqual(['a']);
    expect(v.tuple([v.string(), Dflt(), v.string().optional()]).parse(['a'])).toEqual(['a', 'd']);
    expect(v.tuple([v.string(), v.string().optional(), Dflt()]).parse(['a'])).toEqual(['a', undefined, 'd']);
    // an omitted optional item whose check fails ends the output instead of failing the tuple
    expect(v.tuple([v.string(), v.string().optional().refine(() => false)]).parse(['a'])).toEqual(['a']);
    // an item produced from the omitted slot that is `undefined` is dropped only for optional-out items
    expect(v.tuple([v.string(), v.string().optional().transform(() => undefined)]).parse(['a'])).toEqual(['a', undefined]);
    expect(v.tuple([v.string(), v.string().optional().catch('c')]).parse(['a'])).toEqual(['a']);
    // a default that is rejected by a later check, inside an optional-out tail, also ends the output
    expect(v.tuple([v.string(), Dflt().optional().refine(() => false)]).parse(['a'])).toEqual(['a']);
    // an omitted slot that yields undefined from an optional-out item is trimmed; an explicit undefined stays
    const trimmed = v.tuple([v.string(), Dflt().optional().pipe(v.string().transform(() => undefined).optional())]);
    expect(trimmed.parse(['a'])).toEqual(['a']);
    expect(trimmed.parse(['a', undefined])).toHaveLength(2);
    for (const required of [v.string().nullable(), v.any(), v.unknown(), v.undefined(), v.union([v.string(), v.undefined()])]) {
      const schema = v.tuple([v.string(), required as any] as any);
      const result = schema.safeParse(['a']);
      expect(result.success).toBe(false);
      expect(result.success ? '' : result.error.issues[0]!.code).toBe('too_small');
    }
    expect(v.tuple([v.string(), Dflt()]).safeParse(['a', 'b', 'c']).success).toBe(false);
    expect(v.tuple([v.string(), Dflt()]).safeParse([]).success).toBe(false);
  });

  it('reports a failing omitted required slot and a failing default-bearing item', () => {
    const failing = v.tuple([v.string(), Dflt().refine(() => false)]);
    const result = failing.safeParse(['a']);
    expect(result.success).toBe(false);
    expect(() => failing.parse(['a'])).toThrow(/index 1/);
    expect(() => v.tuple([v.string(), v.string().default('d').refine(() => false)]).parse(['a'])).toThrow();
    // a schema that needs the async path still reports that from the sync parser
    const asyncOnly = v.tuple([v.string(), Dflt().refine(async () => true)]);
    expect(asyncOnly.safeParse(['a']).success).toBe(false);
  });

  it('applies the same rules in parseAsync, including rest tuples', async () => {
    await expect(v.tuple([v.string(), Dflt()]).parseAsync(['a'])).resolves.toEqual(['a', 'd']);
    await expect(v.tuple([v.string(), v.string().optional()]).parseAsync(['a'])).resolves.toEqual(['a']);
    await expect(v.tuple([v.string(), v.string().optional().refine(async () => false)]).parseAsync(['a'])).resolves.toEqual(['a']);
    await expect(v.tuple([v.string(), v.string().optional(), Dflt()]).parseAsync(['a'])).resolves.toEqual(['a', undefined, 'd']);
    await expect(v.tuple([v.string(), Dflt().optional().refine(async () => false)]).parseAsync(['a'])).resolves.toEqual(['a']);
    await expect(v.tuple([v.string(), Dflt().refine(async () => false)]).parseAsync(['a'])).rejects.toThrow(/index 1|Array item/);
    await expect(v.tuple([v.string(), Dflt()]).parseAsync([])).rejects.toThrow();

    // with a rest schema Zod performs no arity check: omitted items are run with undefined
    const withRest = v.tuple([v.string(), Dflt()], v.number());
    expect(withRest.parse(['a'])).toEqual(['a', 'd']);
    expect(withRest.parse(['a', 'b', 1, 2])).toEqual(['a', 'b', 1, 2]);
    await expect(withRest.parseAsync(['a'])).resolves.toEqual(['a', 'd']);
    expect(v.tuple([v.any()], v.number()).parse([])).toEqual([undefined]);
    expect(v.tuple([v.string()], v.number()).safeParse([]).success).toBe(false);
  });

  it('does not share state between parses', () => {
    const schema = v.tuple([v.string(), Dflt()]);
    const first = schema.parse(['a']);
    const second = schema.parse(['b']);
    expect(first).toEqual(['a', 'd']);
    expect(second).toEqual(['b', 'd']);
    expect(first).not.toBe(second);
  });
});

describe('F220: compiled parse returns what the runtime parser returns', () => {
  it('strips unknown keys from objects, nested objects, arrays and unions', () => {
    const source = { a: 'x', extra: 1 };
    const schema = v.object({ a: v.string() });
    const compiled = v.compile(schema);
    expect(compiled.parse(source)).toEqual({ a: 'x' });
    expect(compiled.parse(source)).not.toBe(source);
    expect(compiled.safeParse(source)).toEqual({ success: true, data: { a: 'x' } });
    expect(v.compile(v.array(v.object({ a: v.number() }))).parse([{ a: 1, b: 2 }])).toEqual([{ a: 1 }]);
    expect(v.compile(v.object({ inner: v.object({ a: v.string() }) })).parse({ inner: { a: 'x', z: 1 }, top: 2 })).toEqual({ inner: { a: 'x' } });
    expect(v.compile(v.union([v.object({ a: v.string() }), v.number()]) as any).parse({ a: 'x', e: 1 })).toEqual({ a: 'x' });
    // still rejects what the runtime rejects, and validate() keeps its verdict
    expect(compiled.safeParse({ a: 1 }).success).toBe(false);
    expect(v.validate(compiled, source)).toBe(true);
    expect(v.validate(compiled, { a: 1 })).toBe(false);
  });

  it('drops dangerous keys from compiled records and keeps primitive schemas on the fast path', () => {
    const record = v.compile(v.record(v.string(), v.number()));
    expect(record.parse(JSON.parse('{"a":1,"__proto__":2}'))).toEqual({ a: 1 });
    expect(v.compile(v.string().min(2)).parse('ab')).toBe('ab');
    expect(v.compile(v.array(v.number())).parse([1, 2])).toEqual([1, 2]);
  });
});

describe('F221: compiled regex checks are independent of earlier calls', () => {
  it('gives the same answer every time for /g and /y regexes', () => {
    for (const regex of [/^a/g, /a/g, /b/y, /^a/gi]) {
      const compiled = v.compile(v.string().regex(regex));
      const runtime = v.string().regex(regex);
      for (const input of ['a', 'ab', 'b', 'xa']) {
        const expected = runtime.safeParse(input).success;
        for (let call = 0; call < 4; call++) {
          expect(v.validate(compiled, input)).toBe(expected);
          expect(compiled.safeParse(input).success).toBe(expected);
        }
      }
    }
    const email = v.compile(v.string().email());
    expect([1, 2, 3].map(() => v.validate(email, 'a@b.co'))).toEqual([true, true, true]);
  });
});

describe('F222: compiled date schemas accept what v.date() accepts', () => {
  it('coerces numbers and date strings like the runtime and keeps union option order', () => {
    const compiled = v.compile(v.date());
    for (const input of [0, 1700000000000, '2024-01-01']) expect(v.validate(compiled, input)).toBe(true);
    for (const input of ['not a date', NaN, true, null, undefined, {}, new Date(NaN)]) expect(v.validate(compiled, input)).toBe(false);
    expect(v.validate(compiled, new Date(5))).toBe(true);
    expect(compiled.parse(5)).toEqual(new Date(5));
    const union = v.compile(v.union([v.date(), v.any()]));
    expect(union.parse(5)).toEqual(new Date(5));
    expect(v.compile(v.array(v.union([v.date(), v.any()]))).parse([2])).toEqual([new Date(2)]);
    expect(v.compile(v.object({ d: v.date() })).parse({ d: '2024-01-01' }).d).toEqual(new Date('2024-01-01'));
  });
});

describe('F223: compiled tuples follow the runtime arity rules', () => {
  it('compiles only exact-arity tuples of required items', () => {
    const exact = v.compile(v.tuple([v.string(), v.number()]));
    expect(v.validate(exact, ['a', 1])).toBe(true);
    expect(v.validate(exact, ['a'])).toBe(false);
    expect(v.validate(exact, ['a', 1, 2])).toBe(false);
    expect((exact as any)._zod?.bag?.validator).toBeInstanceOf(Function);
    expect(v.compile(v.object({ t: v.tuple([v.string()]) })).parse({ t: ['x'] })).toEqual({ t: ['x'] });
  });

  it('defers tuples with a rest schema or omittable items to the runtime', () => {
    const cases: Array<[any, unknown]> = [
      [v.tuple([v.any()], v.number()), []],
      [v.tuple([v.string()], v.number()), ['a', 1]],
      [v.tuple([v.string(), v.union([v.string().optional(), v.number()])]), ['a']],
      [v.tuple([v.string(), v.string().default('d')]), ['a']],
      [v.tuple([v.string(), v.string().optional()]), ['a']]
    ];
    for (const [schema, input] of cases) {
      const compiled = v.compile(schema);
      expect(v.validate(compiled, input)).toBe(schema.safeParse(input).success);
      expect(compiled.safeParse(input)).toEqual(schema.safeParse(input));
    }
  });
});

describe('F224: literal(NaN) members match NaN in the object, tuple, set and map fast paths', () => {
  it('accepts NaN and still rejects other values', () => {
    const nan = Number.NaN;
    expect(v.object({ a: v.literal(nan) }).parse({ a: nan })).toEqual({ a: nan });
    expect(v.object({ a: v.literal(nan), b: v.string(), c: v.number() }).safeParse({ a: nan, b: 'x', c: 1 }).success).toBe(true);
    expect(v.object({ a: v.literal(nan) }).strict().safeParse({ a: nan }).success).toBe(true);
    expect(v.object({ a: v.literal(nan) }).safeParse({ a: 1 }).success).toBe(false);
    expect(v.tuple([v.literal(nan)]).parse([nan])).toEqual([nan]);
    expect(v.tuple([v.literal(nan)]).safeParse([0]).success).toBe(false);
    expect(v.set(v.literal(nan)).parse(new Set([nan])).has(nan)).toBe(true);
    expect(v.set(v.literal(nan)).safeParse(new Set([1])).success).toBe(false);
    expect(v.map(v.literal(nan), v.string()).parse(new Map([[nan, 'x']])).get(nan)).toBe('x');
    expect(v.map(v.string(), v.literal(nan)).parse(new Map([['k', nan]])).get('k')).toBeNaN();
    expect(v.map(v.string(), v.literal(nan)).safeParse(new Map([['k', 2]])).success).toBe(false);
  });
});

describe('F225: stringV2().date() validates the calendar like string().date()', () => {
  it('rejects impossible days and keeps valid dates', () => {
    const v2 = v.stringV2().date();
    const v1 = v.string().date();
    for (const input of ['2023-02-29', '2024-02-30', '2024-04-31', '2100-02-29', '2024-06-31', '2024-13-01', '2024-1-1', '']) {
      expect(v2.safeParse(input).success).toBe(false);
      expect(v1.safeParse(input).success).toBe(false);
    }
    for (const input of ['2024-02-29', '2000-02-29', '2024-04-30', '2024-12-31']) {
      expect(v2.parse(input)).toBe(input);
    }
    const custom = v.stringV2().date('bad date').safeParse('2023-02-29');
    expect(custom.success ? '' : custom.error.issues[0]!.message).toBe('bad date');
  });
});

describe('F226-F232: toJSONSchema', () => {
  const json = (schema: any, options: any = {}): any => toJSONSchema(schema, { unrepresentable: 'any', ...options });

  it('F226 prefault is transparent', () => {
    expect(json(v.string().min(2).prefault('xx'))).toMatchObject({ type: 'string', minLength: 2 });
    expect(json(v.object({ a: v.number().prefault(1) })).properties.a).toMatchObject({ type: 'number' });
    expect(json(v.array(v.string().prefault('x'))).items).toMatchObject({ type: 'string' });
    expect(json(v.string().prefault('x').optional())).toMatchObject({ type: 'string' });
  });

  it('F227 nullable/nullish of null has no duplicate type entries', () => {
    expect(json(v.null().nullable()).type).toBe('null');
    expect(json(v.null().nullish()).type).toBe('null');
    expect(json(v.object({ a: v.null().nullable() })).properties.a.type).toBe('null');
    expect(json(v.string().nullable()).type).toEqual(['string', 'null']);
    expect(json(v.string().nullable().nullable()).type).toEqual(['string', 'null']);
  });

  it('F228 required follows the optionality ladder', () => {
    const shape = (field: any) => v.object({ a: field, z: v.string() });
    for (const field of [
      v.string().optional().readonly(),
      v.string().optional().brand<'B'>(),
      v.string().optional().meta({ title: 't' }),
      v.string().optional().refine(() => true),
      v.string().optional().nullable(),
      v.union([v.string(), v.number().optional()])
    ]) {
      expect(json(shape(field)).required).toEqual(['z']);
    }
    expect(json(shape(v.string().optional())).required).toEqual(['z']);
    expect(json(shape(v.string())).required).toEqual(['a', 'z']);
    expect(json(shape(v.string().default('x')), { io: 'output' }).required).toEqual(['a', 'z']);
    expect(json(shape(v.string().default('x')), { io: 'input' }).required).toEqual(['z']);
    // Zod: a catch field stays required on the declared input type
    expect(json(shape(v.string().catch('x')), { io: 'input' }).required).toEqual(['a', 'z']);
    // V2 wrappers are recognised too
    expect(json(shape(v.optionalV2(v.string()))).required).toEqual(['z']);
    expect(json(shape(v.refineV2(v.optionalV2(v.string()), () => true))).required).toEqual(['z']);
    expect(json(shape(v.unionV2(v.string(), v.number().optional()))).required).toEqual(['z']);
  });

  it('F229 tuple minItems excludes omittable trailing items', () => {
    expect(json(v.tuple([v.string(), v.number().optional()])).minItems).toBe(1);
    // a defaulted item is omittable on the input side only (it always produces a value on output)
    expect(json(v.tuple([v.string(), v.number().default(1)]), { io: 'input' }).minItems).toBe(1);
    expect(json(v.tuple([v.string(), v.number().default(1)]), { io: 'output' }).minItems).toBe(2);
    expect(json(v.tuple([v.string().optional(), v.number().optional()])).minItems).toBeUndefined();
    expect(json(v.tuple([v.string(), v.number().optional(), v.boolean()])).minItems).toBe(3);
    expect(json(v.tuple([v.string(), v.number()])).minItems).toBe(2);
  });

  it('F230 xor is a oneOf', () => {
    expect(json(v.xor([v.string(), v.number()]))).toMatchObject({ oneOf: [{ type: 'string' }, { type: 'number' }] });
    expect(json(v.object({ a: v.xor([v.string(), v.boolean()]) })).properties.a.oneOf).toHaveLength(2);
  });

  it('F231 lazy resolves and recursion becomes a ', () => {
    expect(json(v.object({ a: v.lazy(() => v.number().min(1)) })).properties.a).toMatchObject({ type: 'number', minimum: 1 });
    const node: any = v.object({ value: v.string(), children: v.array(v.lazy(() => node)) });
    expect(JSON.stringify(json(node))).toContain('');
  });

  it('F232 refine/superRefine keep an array schema', () => {
    expect(json(v.array(v.string()).refine(() => true))).toMatchObject({ type: 'array', items: { type: 'string' } });
    expect(json(v.array(v.number()).superRefine(() => undefined))).toMatchObject({ type: 'array', items: { type: 'number' } });
    expect(json(v.string().min(2).refine(() => true))).toMatchObject({ type: 'string', minLength: 2 });
    expect(v.array(v.string()).refine(() => true).unwrap()).toBeDefined();
  });
});

describe('F233: multipleOf with a decimal step is exact at any magnitude', () => {
  it('accepts large exact multiples and rejects real non-multiples', () => {
    for (const [value, step] of [[1e15, 0.1], [3e15, 0.1], [-1e15, 0.1], [1e15, 0.01], [1e15 + 2, 0.2], [44376467992409.7, 0.05], [1e-7, 1e-8], [0.3, 0.1], [4.35, 0.01]] as Array<[number, number]>) {
      expect(isMultipleOf(value, step)).toBe(true);
    }
    for (const [value, step] of [[1e15 + 0.125, 0.2], [0.35, 0.1], [1.5e-7, 1e-7], [7.25, 0.5]] as Array<[number, number]>) {
      expect(isMultipleOf(value, step)).toBe(false);
    }
    expect(v.number().multipleOf(0.1).safeParse(1e15).success).toBe(true);
    expect(v.numberV2().multipleOf(0.1).safeParse(-3e15).success).toBe(true);
    const failure = v.number().multipleOf(0.1).safeParse(0.35);
    expect(failure.success ? '' : failure.error.issues[0]!.code).toBe('not_multiple_of');
  });

  it('never throws for non-finite values or a zero step', () => {
    for (const [value, step] of [[Infinity, 0.1], [-Infinity, 0.1], [NaN, 0.1], [1e15, 0], [0.5, 0]] as Array<[number, number]>) {
      expect(isMultipleOf(value, step)).toBe(false);
    }
  });
});

describe('F234: record key sets are derived through unions and wrappers', () => {
  const keySchemas: Array<[string, () => any]> = [
    ['union of literals', () => v.union([v.literal('a'), v.literal('b')])],
    ['union of enum and literal', () => v.union([v.enum(['a']), v.literal('b')])],
    ['nested union', () => v.union([v.union([v.literal('a')]), v.literal('b')])],
    ['readonly enum', () => v.enum(['a', 'b']).readonly()],
    ['optional enum', () => v.enum(['a', 'b']).optional()],
    ['nullable enum', () => v.enum(['a', 'b']).nullable()],
    ['default enum', () => v.enum(['a', 'b']).default('a')],
    ['catch enum', () => v.enum(['a', 'b']).catch('a')],
    ['brand enum', () => v.enum(['a', 'b']).brand<'B'>()],
    ['refine enum', () => v.enum(['a', 'b']).refine(() => true)],
    ['superRefine enum', () => v.enum(['a', 'b']).superRefine(() => undefined)],
    ['pipe enum', () => v.enum(['a', 'b']).pipe(v.string())],
    ['literal array', () => v.literal(['a', 'b'])],
    ['meta enum', () => v.enum(['a', 'b']).meta({ title: 'k' })]
  ];

  it('requires every key and rejects unknown ones', async () => {
    for (const [, key] of keySchemas) {
      const schema = v.record(key(), v.number());
      expect(schema.safeParse({}).success).toBe(false);
      expect(schema.safeParse({ a: 1 }).success).toBe(false);
      expect(schema.parse({ a: 1, b: 2 })).toEqual({ a: 1, b: 2 });
      expect(schema.safeParse({ a: 1, b: 2, c: 3 }).success).toBe(false);
      expect((await schema.safeParseAsync({ a: 1 })).success).toBe(false);
      expect((await schema.safeParseAsync({ a: 1, b: 2, c: 3 })).success).toBe(false);
      expect(await schema.parseAsync({ a: 1, b: 2 })).toEqual({ a: 1, b: 2 });
      // partialRecord keeps keys optional
      expect(v.partialRecord(key(), v.number()).safeParse({ a: 1 }).success).toBe(true);
    }
  });

  it('keeps open key schemas open and does not remap unknown keys through catch', () => {
    expect(v.record(v.union([v.literal('a'), v.string()]), v.number()).safeParse({ x: 1 }).success).toBe(true);
    expect(v.record(v.string(), v.number()).safeParse({}).success).toBe(true);
    expect(v.record(v.enum(['a', 'b']).catch('a'), v.number()).safeParse({ a: 1, b: 2, c: 3 }).success).toBe(false);
    expect(v.record(v.union([v.literal(1), v.literal(2)]), v.string()).parse({ 1: 'x', 2: 'y' })).toEqual({ 1: 'x', 2: 'y' });
    const unrecognized = v.record(v.union([v.literal('a'), v.literal('b')]), v.number()).safeParse({ a: 1, b: 2, c: 3 });
    expect(unrecognized.success ? [] : unrecognized.error.issues.map(issue => issue.code)).toEqual(['unrecognized_keys']);
  });
});

describe('F235: literalV2 matches NaN like v.literal', () => {
  it('uses SameValueZero', () => {
    expect(v.literalV2(Number.NaN).parse(Number.NaN)).toBeNaN();
    expect(v.literalV2(Number.NaN).safeParse(1).success).toBe(false);
    expect(v.literalV2(0).safeParse(-0).success).toBe(true);
    expect(v.literalV2('a').safeParse('b').success).toBe(false);
    expect(() => v.literalV2(Number.NaN).parse('NaN')).toThrow();
    expect(v.object({ a: v.literalV2(Number.NaN) }).safeParse({ a: Number.NaN }).success).toBe(true);
    expect(v.tuple([v.literalV2(Number.NaN)]).safeParse([Number.NaN]).success).toBe(true);
  });
});

describe('F234: a key the key schema rejects is an invalid key, an unlisted key is unrecognized', () => {
  it('keeps the two issue kinds apart', async () => {
    const schema = v.record(v.enum(['a', 'b']).refine(() => false), v.number());
    const sync = schema.safeParse({ a: 1 });
    expect(sync.success ? [] : sync.error.issues.map(issue => issue.code)).toEqual(['invalid_key']);
    const async_ = await schema.safeParseAsync({ a: 1, c: 2 });
    // a is rejected by the key schema, b is a missing required key, c is not in the key set
    expect(async_.success ? [] : async_.error.issues.map(issue => issue.code).sort()).toEqual(['invalid_key', 'invalid_type', 'unrecognized_keys']);
  });
});

describe('F234: V2 key schemas define key sets too', () => {
  it('treats enumV2, literalV2, unionV2 and V2 wrappers as finite key sets', () => {
    const keys: any[] = [v.enumV2(['a', 'b']), v.unionV2(v.literalV2('a'), v.literalV2('b')), v.optionalV2(v.enum(['a', 'b'])), v.refineV2(v.enum(['a', 'b']), () => true), v.nullishV2(v.enumV2(['a', 'b']))];
    for (const key of keys) {
      const schema = v.record(key, v.number());
      expect(schema.safeParse({}).success).toBe(false);
      expect(schema.safeParse({ a: 1, b: 2 }).success).toBe(true);
      expect(schema.safeParse({ a: 1, b: 2, c: 3 }).success).toBe(false);
    }
    const single = v.record(v.literalV2('a'), v.number());
    expect(single.safeParse({ a: 1 }).success).toBe(true);
    expect(single.safeParse({}).success).toBe(false);
  });

  it('keeps a record exhaustive when only some union options are finite', () => {
    const open = v.record(v.union([v.literal('a'), v.string().min(2)]), v.number());
    expect(open.safeParse({ a: 1, zz: 2 }).success).toBe(true);
    expect(open.safeParse({}).success).toBe(true);
  });
});

describe('F236: nested discriminated unions may repeat an outer tag', () => {
  const shapes = () => v.discriminatedUnion('type', [
    v.discriminatedUnion('kind', [
      v.object({ type: v.literal('shape'), kind: v.literal('circle'), r: v.number() }),
      v.object({ type: v.literal('shape'), kind: v.literal('square'), s: v.number() })
    ]),
    v.object({ type: v.literal('text'), body: v.string() })
  ]);

  it('routes through both discriminators', async () => {
    const schema = shapes();
    expect(schema.parse({ type: 'shape', kind: 'circle', r: 1 })).toEqual({ type: 'shape', kind: 'circle', r: 1 });
    expect(schema.safeParse({ type: 'shape', kind: 'square', s: 2 }).success).toBe(true);
    expect(schema.safeParse({ type: 'shape', kind: 'circle', s: 2 }).success).toBe(false);
    expect(schema.safeParse({ type: 'shape', kind: 'triangle' }).success).toBe(false);
    expect(schema.safeParse({ type: 'text', body: 'x' }).success).toBe(true);
    expect(schema.safeParse({ type: 'other' }).success).toBe(false);
    expect((await schema.safeParseAsync({ type: 'shape', kind: 'square', s: 2 })).success).toBe(true);
  });

  it('still rejects a tag repeated across outer options and tolerates a repeat inside one option', () => {
    expect(() => v.discriminatedUnion('t', [v.object({ t: v.literal('a') }), v.object({ t: v.literal('a') })])).toThrow(/Duplicate discriminator/);
    expect(() => v.discriminatedUnion('t', [
      v.object({ t: v.literal('a') }),
      v.discriminatedUnion('k', [v.object({ t: v.literal('a'), k: v.literal(1) })])
    ])).toThrow(/Duplicate discriminator/);
    expect(() => v.discriminatedUnion('t', [v.object({ t: v.union([v.literal('a'), v.literal('a')]) }), v.object({ t: v.literal('b') })])).not.toThrow();
  });
});

describe('F237: an intersection reports an unrecognized key only when both sides reject it', () => {
  const strictA = () => v.object({ a: v.number() }).strict();
  const strictB = () => v.object({ b: v.number() }).strict();

  it('accepts the union of the keys of strict sides', async () => {
    const schema = v.intersection(strictA(), strictB());
    expect(schema.parse({ a: 1, b: 2 })).toEqual({ a: 1, b: 2 });
    expect(schema.safeParse({ a: 1 }).success).toBe(false);
    expect(schema.safeParse({ a: 1, b: 2, c: 3 }).success).toBe(false);
    expect((await schema.safeParseAsync({ a: 1, b: 2 })).success).toBe(true);
    expect((await schema.safeParseAsync({ a: 1, b: 2, c: 3 })).success).toBe(false);
    await expect(schema.parseAsync({ a: 1, b: 2 })).resolves.toEqual({ a: 1, b: 2 });
    const failure = schema.safeParse({ a: 1, b: 2, c: 3 });
    expect(failure.success ? [] : failure.error.issues.map(issue => issue.code)).toEqual(['unrecognized_keys']);
  });

  it('works with strip / passthrough partners, nesting and other failures', () => {
    expect(v.intersection(strictA(), v.object({ b: v.number() })).parse({ a: 1, b: 2, extra: 9 })).toEqual({ a: 1, b: 2 });
    expect(v.intersection(strictA(), v.object({ b: v.number() }).passthrough()).parse({ a: 1, b: 2, extra: 9 })).toEqual({ a: 1, b: 2, extra: 9 });
    const three = v.intersection(v.intersection(strictA(), strictB()), v.object({ c: v.number() }).strict());
    expect(three.parse({ a: 1, b: 2, c: 3 })).toEqual({ a: 1, b: 2, c: 3 });
    expect(three.safeParse({ a: 1, b: 2, c: 3, d: 4 }).success).toBe(false);
    expect(v.intersection(strictA(), strictB()).safeParse({ a: 'x', b: 2 }).success).toBe(false);
    expect(() => v.intersection(strictA(), strictB()).parse({ a: 'x', b: 2 })).toThrow();
    expect(v.object({ o: v.intersection(strictA(), strictB()) }).parse({ o: { a: 1, b: 2 } })).toEqual({ o: { a: 1, b: 2 } });
  });

  it('applies to the V2 intersection too', () => {
    const schema = v.intersectionV2(strictA(), strictB());
    expect(schema.parse({ a: 1, b: 2 })).toEqual({ a: 1, b: 2 });
    expect(schema.safeParse({ a: 1, b: 2, c: 3 }).success).toBe(false);
    expect(schema.safeParse({ a: 1 }).success).toBe(false);
  });
});

describe('F238: union / xor / discriminatedUnion outputs keep their member types', () => {
  type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? ([A] extends [never] ? false : true) : false) : false;
  const assertType = <_T extends true>(): void => undefined;

  it('infers the union of the member outputs (compile-time) and still validates', () => {
    const u = v.union([v.string(), v.number()]);
    const x = v.xor([v.string(), v.number()]);
    const d = v.discriminatedUnion('t', [
      v.object({ t: v.literal('a'), x: v.string() }),
      v.object({ t: v.literal('b'), y: v.number() }),
    ]);
    assertType<Same<v.infer<typeof u>, string | number>>();
    assertType<Same<v.infer<typeof x>, string | number>>();
    assertType<Same<v.infer<typeof d>, { t: 'a'; x: string } | { t: 'b'; y: number }>>();
    expect(u.parse('a')).toBe('a');
    expect(x.parse(1)).toBe(1);
    expect(d.parse({ t: 'b', y: 2 })).toEqual({ t: 'b', y: 2 });
  });

  it('lets unions nest inside tuples, unions and discriminated unions without casts', () => {
    const tuple = v.tuple([v.string(), v.union([v.string(), v.number()])]);
    const nested = v.union([v.union([v.string(), v.number()]), v.boolean()]);
    const du = v.discriminatedUnion('type', [
      v.discriminatedUnion('kind', [v.object({ type: v.literal('s'), kind: v.literal('c') })]),
      v.object({ type: v.literal('t') }),
    ]);
    assertType<Same<v.infer<typeof tuple>, [string, string | number]>>();
    assertType<Same<v.infer<typeof nested>, string | number | boolean>>();
    expect(tuple.parse(['a', 1])).toEqual(['a', 1]);
    expect(nested.parse(true)).toBe(true);
    expect(du.parse({ type: 's', kind: 'c' })).toEqual({ type: 's', kind: 'c' });
  });

  it('compiles a union schema', () => {
    const compiled = v.compile(v.union([v.string(), v.number()]));
    const value: string | number = compiled.parse('x');
    expect(value).toBe('x');
  });
});

describe('F237/F234/F233: reconciliation and key-set edge branches', () => {
  it('reconciles a key owned by either side (sync, async, v2), in both orientations', async () => {
    const strictA = () => v.object({ a: v.number() }).strict();
    const looseAB = () => v.object({ a: v.number(), b: v.number() });
    const input = { a: 1, b: 2 };
    const left = v.intersection(looseAB(), strictA());
    const right = v.intersection(strictA(), looseAB());
    expect(left.parse(input)).toEqual(input);
    expect(right.parse(input)).toEqual(input);
    expect(await left.parseAsync(input)).toEqual(input);
    expect(await right.parseAsync(input)).toEqual(input);
    expect(v.intersectionV2(looseAB(), strictA()).parse(input)).toEqual(input);
    expect(v.intersectionV2(strictA(), looseAB()).parse(input)).toEqual(input);
  });

  it('treats a path-less, key-less unrecognized_keys issue as keyed by nothing', () => {
    const side = intersectionSide({ success: false, error: new VldError([{ code: 'unrecognized_keys', message: 'x' } as never]) });
    expect(side.ok).toBe(false);
    expect(side.ok ? undefined : side.keys).toEqual([]);
  });

  it('record without a key schema, and with an empty union as key schema', async () => {
    const plain = v.record(v.number());
    expect(plain.parse({ a: 1 })).toEqual({ a: 1 });
    expect(await plain.parseAsync({ a: 1 })).toEqual({ a: 1 });
    const emptyKeys = v.record(v.union([] as never), v.number());
    expect(emptyKeys.safeParse({ a: 1 }).success).toBe(false);
  });

  it('isMultipleOf compares exponent forms of huge and tiny decimals exactly', () => {
    expect(isMultipleOf(1e21, 0.5)).toBe(true);
    expect(isMultipleOf(1e21, 1e-7)).toBe(true);
    expect(isMultipleOf(2 ** 60, 1024)).toBe(true);
    expect(isMultipleOf(2 ** 60 + 2 ** 10, 3)).toBe(false);
  });
});

describe('F239: trailing optional tuple items are optional elements of the inferred type', () => {
  type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
  const assertType = <_T extends true>(): void => undefined;

  it('infers [string, number?] for a trailing optional item and accepts the short tuple', () => {
    const t = v.tuple([v.string(), v.number().optional()]);
    assertType<Same<v.infer<typeof t>, [string, (number | undefined)?]>>();
    const short: v.infer<typeof t> = t.parse(['x']);
    expect(short).toEqual(['x']);
  });

  it('keeps required, defaulted, any, undefined and non-trailing optional items required', () => {
    const required = v.tuple([v.string(), v.number()]);
    const defaulted = v.tuple([v.string(), v.number().default(1)]);
    const anyItem = v.tuple([v.string(), v.any()]);
    const undef = v.tuple([v.string(), v.undefined()]);
    const middle = v.tuple([v.number().optional(), v.string()]);
    assertType<Same<v.infer<typeof required>, [string, number]>>();
    assertType<Same<v.infer<typeof defaulted>, [string, number]>>();
    assertType<Same<v.infer<typeof anyItem>, [string, any]>>();
    assertType<Same<v.infer<typeof undef>, [string, undefined]>>();
    assertType<Same<v.infer<typeof middle>, [number | undefined, string]>>();
    expect(middle.parse([undefined, 's'])).toEqual([undefined, 's']);
  });

  it('handles nullish, V2 wrappers and rest items', () => {
    const nullish = v.tuple([v.string(), v.number().nullish()]);
    const v2 = v.tuple([v.string(), v.optionalV2(v.number())]);
    const rest = v.tuple([v.string(), v.number().optional()]).rest(v.boolean());
    assertType<Same<v.infer<typeof nullish>, [string, (number | null | undefined)?]>>();
    assertType<Same<v.infer<typeof v2>, [string, (number | undefined)?]>>();
    assertType<Same<v.infer<typeof rest>, [string, (number | undefined)?, ...boolean[]]>>();
    expect(nullish.parse(['x'])).toEqual(['x']);
    expect(v2.parse(['x'])).toEqual(['x']);
  });
});

describe('F240-F245: fromJSONSchema follows JSON Schema semantics', () => {
  const ok = (schema: unknown, input: unknown) => fromJSONSchema(schema as never).safeParse(input).success;

  it('F240: boolean subschemas accept everything or nothing', () => {
    expect(ok({ anyOf: [false, { type: 'null' }] }, 1)).toBe(false);
    expect(ok({ anyOf: [false, { type: 'null' }] }, null)).toBe(true);
    expect(ok({ allOf: [{ type: 'number' }, false] }, 1)).toBe(false);
    expect(ok({ type: 'array', items: false }, [])).toBe(true);
    expect(ok({ type: 'array', items: false }, [1])).toBe(false);
    expect(ok({ type: 'object', properties: { a: false } }, { a: 1 })).toBe(false);
    expect(ok({ type: 'object', properties: { a: false } }, {})).toBe(true);
    expect(ok({ type: 'array', items: [{ type: 'string' }, false] }, ['a', 1])).toBe(false);
    expect(ok({ anyOf: [true, { type: 'null' }] }, 1)).toBe(true);
  });

  it('F241: oneOf requires exactly one matching branch', () => {
    const schema = { oneOf: [{ type: 'number' }, { type: 'integer' }] };
    expect(ok(schema, 1)).toBe(false);
    expect(ok(schema, 1.5)).toBe(true);
    expect(ok({ oneOf: [{}, { type: 'null' }] }, null)).toBe(false);
    expect(ok({ oneOf: [{ type: 'number' }, { type: 'string' }] }, 'a')).toBe(true);
    expect(ok({ anyOf: [{ type: 'number' }, { type: 'integer' }] }, 1)).toBe(true);
  });

  it('F242: not negates the schema and composes with sibling keywords', () => {
    expect(ok({ not: { type: 'string' } }, 'a')).toBe(false);
    expect(ok({ not: { type: 'string' } }, 1)).toBe(true);
    expect(ok({ not: {} }, 1)).toBe(false);
    expect(ok({ type: 'number', not: { type: 'number', minimum: 5 } }, 6)).toBe(false);
    expect(ok({ type: 'number', not: { type: 'number', minimum: 5 } }, 1)).toBe(true);
    expect(ok({ type: 'number', not: { type: 'number', minimum: 5 } }, 'a')).toBe(false);
    expect(ok({ not: { not: { type: 'null' } } }, null)).toBe(true);
    expect(ok({ not: { not: { type: 'null' } } }, 1)).toBe(false);
    expect(ok({ type: 'object', properties: { a: { not: { const: 1 } } } }, { a: 2 })).toBe(true);
    expect(ok({ default: 'x', not: { type: 'null' } }, 'y')).toBe(true);
  });

  it('F243: const and enum compare arrays and objects structurally', () => {
    expect(ok({ const: { a: 1, b: 2 } }, { b: 2, a: 1 })).toBe(true);
    expect(ok({ const: { a: 1 } }, { a: 2 })).toBe(false);
    expect(ok({ const: [1, 2] }, [1, 2])).toBe(true);
    expect(ok({ const: [1, 2] }, [2, 1])).toBe(false);
    expect(ok({ const: [] }, {})).toBe(false);
    expect(ok({ enum: [null, { a: [1, { b: 2 }] }] }, { a: [1, { b: 2 }] })).toBe(true);
    expect(ok({ enum: [null, { a: [1, { b: 2 }] }] }, { a: [1, { b: 3 }] })).toBe(false);
    expect(ok({ enum: [{ a: 1 }, [1]] }, 1)).toBe(false);
    expect(ok({ const: { a: 1 } }, null)).toBe(false);
    expect(ok({ const: { a: 1 } }, { a: 1, b: 2 })).toBe(false);
    expect(ok({ const: { a: 1 } }, {})).toBe(false);
    expect(ok({ const: { a: 1, b: 2 } }, { a: 1, c: 2 })).toBe(false);
    expect(ok({ const: [1, 2] }, [1])).toBe(false);
    expect(ok({ const: [1] }, 1)).toBe(false);
  });

  it('F244: propertyNames also applies when properties are listed or extras are forbidden', () => {
    const withProps = { type: 'object', properties: { a: { type: 'number' } }, propertyNames: { pattern: '^[ab]$' } };
    expect(ok(withProps, { a: 1 })).toBe(true);
    expect(ok(withProps, { a: 1, c: 2 })).toBe(false);
    expect(ok({ type: 'object', additionalProperties: false, propertyNames: { pattern: '^[ab]$' } }, { a: 1 })).toBe(false);
    expect(ok({ type: 'object', additionalProperties: false, propertyNames: { pattern: '^[ab]$' } }, {})).toBe(true);
    expect(ok({ type: 'object', properties: { a: {} }, propertyNames: false }, { a: 1 })).toBe(false);
    expect(ok({ type: 'object', properties: { a: {} }, propertyNames: true }, { a: 1 })).toBe(true);
    expect(ok({ type: ['object', 'null'], properties: { a: {} }, propertyNames: { pattern: '^a$' } }, null)).toBe(true);
    const issue = fromJSONSchema(withProps as never).safeParse({ c: 1 });
    expect(issue.success ? [] : issue.error.issues.map(i => [i.code, i.path])).toEqual([['invalid_key', ['c']]]);
  });

  it('F245: uniqueItems is structural, on the input items, and covers tuples', () => {
    expect(ok({ type: 'array', items: [{ type: 'number' }, { type: 'number' }], uniqueItems: true }, [1, 1])).toBe(false);
    expect(ok({ type: 'array', items: [{ type: 'number' }, { type: 'number' }], uniqueItems: true }, [1, 2])).toBe(true);
    expect(ok({ type: 'array', items: [{ type: 'number' }], additionalItems: { type: 'number' }, uniqueItems: true }, [1, 2, 2])).toBe(false);
    expect(ok({ type: 'array', items: { type: 'object' }, uniqueItems: true }, [{ a: 1 }, { a: 2 }])).toBe(true);
    expect(ok({ type: 'array', items: { type: 'object' }, uniqueItems: true }, [{ a: 1, b: 2 }, { b: 2, a: 1 }])).toBe(false);
    expect(ok({ type: 'array', items: {}, uniqueItems: true }, [[1], [1]])).toBe(false);
    expect(ok({ type: 'array', items: {}, uniqueItems: true }, [])).toBe(true);
    expect(ok({ type: 'array', items: {}, uniqueItems: true }, 'abc')).toBe(false);
    expect(ok({ type: 'array', items: {}, uniqueItems: true }, [1, [1]])).toBe(true);
    expect(ok({ type: 'array', items: {}, uniqueItems: true }, [{ a: 1 }, { a: 1, b: 2 }])).toBe(true);
    expect(ok({ type: 'array', items: {}, uniqueItems: true }, [[1], { 0: 1 }])).toBe(true);
    expect(ok({ type: 'array', items: {}, uniqueItems: true }, [{ a: 1 }, { b: 1 }])).toBe(true);
  });
});

describe('F246: fromJSONSchema resolves local $ref pointers', () => {
  const ok = (schema: unknown, input: unknown) => fromJSONSchema(schema as never).safeParse(input).success;

  it('resolves $defs, definitions and nested pointers', () => {
    expect(ok({ $defs: { n: { type: 'number' } }, type: 'object', properties: { a: { $ref: '#/$defs/n' } } }, { a: 'x' })).toBe(false);
    expect(ok({ $defs: { n: { type: 'number' } }, type: 'object', properties: { a: { $ref: '#/$defs/n' } } }, { a: 1 })).toBe(true);
    expect(ok({ definitions: { n: { type: 'number' } }, type: 'object', properties: { a: { $ref: '#/definitions/n' } } }, { a: 'x' })).toBe(false);
    expect(ok({ type: 'object', properties: { a: { type: 'string' }, b: { $ref: '#/properties/a' } } }, { b: 1 })).toBe(false);
    expect(ok({ $defs: { 'a/b': { type: 'string' } }, type: 'array', items: { $ref: '#/$defs/a~1b' } }, [1])).toBe(false);
    expect(ok({ $defs: { 'a b': { type: 'string' } }, type: 'array', items: { $ref: '#/$defs/a%20b' } }, ['x'])).toBe(true);
    expect(ok({ $defs: { t: true, f: false }, type: 'object', properties: { a: { $ref: '#/$defs/t' }, b: { $ref: '#/$defs/f' } } }, { b: 1 })).toBe(false);
  });

  it('supports recursion through # and $defs, and chained refs', () => {
    const tree = { type: 'object', properties: { v: { type: 'number' }, next: { $ref: '#' } }, required: ['v'] };
    expect(ok(tree, { v: 1, next: { v: 1, next: { v: 'x' } } })).toBe(false);
    expect(ok(tree, { v: 1, next: { v: 1, next: { v: 2 } } })).toBe(true);
    const chain = { $defs: { a: { $ref: '#/$defs/b' }, b: { type: 'integer' } }, type: 'array', items: { $ref: '#/$defs/a' } };
    expect(ok(chain, [1.5])).toBe(false);
    expect(ok(chain, [1])).toBe(true);
    const mutual = { $defs: { a: { type: 'object', properties: { b: { $ref: '#/$defs/b' } } }, b: { type: 'object', properties: { a: { $ref: '#/$defs/a' } } } }, $ref: '#/$defs/a' };
    expect(ok(mutual, { b: { a: { b: {} } } })).toBe(true);
    expect(ok(mutual, { b: { a: { b: { a: 1 } } } })).toBe(false);
  });

  it('leaves dangling and external refs permissive', () => {
    expect(ok({ type: 'object', properties: { a: { $ref: '#/$defs/missing' } } }, { a: 1 })).toBe(true);
    expect(ok({ type: 'object', properties: { a: { $ref: '#/type/x' } } }, { a: 1 })).toBe(true);
    expect(ok({ $ref: '#foo' }, 1)).toBe(true);
    expect(ok({ $defs: { s: 1 }, $ref: '#/$defs/s' }, 1)).toBe(true);
    expect(ok({ type: 'object', properties: { a: { $ref: 'https://example.com/s.json' } } }, { a: 1 })).toBe(true);
  });
});

describe('F247: dictionary schemas honour required and do not turn propertyNames into required keys', () => {
  const ok = (schema: unknown, input: unknown) => fromJSONSchema(schema as never).safeParse(input).success;

  it('keeps enumerated propertyNames optional', () => {
    const schema = { type: 'object', additionalProperties: { type: 'number' }, propertyNames: { enum: ['a', 'b'] } };
    expect(ok(schema, {})).toBe(true);
    expect(ok(schema, { a: 1 })).toBe(true);
    expect(ok(schema, { a: 1, b: 2 })).toBe(true);
    expect(ok(schema, { c: 1 })).toBe(false);
    expect(ok(schema, { a: 'x' })).toBe(false);
  });

  it('enforces required for property-less objects, dictionaries and closed objects', () => {
    expect(ok({ type: 'object', additionalProperties: { type: 'number' }, required: ['a'] }, {})).toBe(false);
    expect(ok({ type: 'object', additionalProperties: { type: 'number' }, required: ['a'] }, { a: 1 })).toBe(true);
    expect(ok({ type: 'object', additionalProperties: { type: 'number' }, required: ['a'] }, { b: 1 })).toBe(false);
    expect(ok({ type: 'object', required: ['a'] }, {})).toBe(false);
    expect(ok({ type: 'object', required: ['a'] }, { a: null })).toBe(true);
    expect(ok({ type: 'object', required: [] }, {})).toBe(true);
    expect(ok({ type: 'object', additionalProperties: false, required: ['a'] }, {})).toBe(false);
    expect(ok({ type: 'object', propertyNames: { pattern: '^k' }, additionalProperties: { type: 'number' }, required: ['k1'] }, { k1: 1 })).toBe(true);
    expect(ok({ type: 'object', propertyNames: { pattern: '^k' }, additionalProperties: { type: 'number' }, required: ['k1'] }, { k2: 1 })).toBe(false);
    expect(ok({ type: 'object', required: ['a'] }, 'not an object')).toBe(false);
    const missing = fromJSONSchema({ type: 'object', required: ['a', 'b'] } as never).safeParse({ a: 1 });
    expect(missing.success ? [] : missing.error.issues.map(i => [i.code, i.path])).toEqual([['invalid_type', ['b']]]);
  });
});
