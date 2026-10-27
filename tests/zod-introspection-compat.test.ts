/**
 * Zod v4 core introspection compatibility (`_zod`) and ZodError parity.
 *
 * Ecosystem libraries duck-type vld schemas through `_zod.def` /
 * `_zod.traits` (e.g. @hookform/resolvers reads `error._zod.traits.has
 * ("$ZodError")`); these tests pin that surface and the Zod-parity
 * `ZodError.message` JSON format.
 */
import { v, VldError } from '../src/index';
import { itemShape as itemShapeViaTuple } from '../src/validators/tuple';
import { VldTupleV2 } from '../src/validators/composite-v2';
import { VldOptionalV2 } from '../src/validators/wrapper-v2';
import { VldStringV2 } from '../src/validators/string-v2';

describe('schema _zod introspection (Zod v4 core compatibility)', () => {
  it('exposes def.type for every mapped validator kind', () => {
    const cases: Array<[any, string]> = [
      [v.string(), 'string'],
      [v.number(), 'number'],
      [v.boolean(), 'boolean'],
      [v.bigint(), 'bigint'],
      [v.symbol(), 'symbol'],
      [v.undefined(), 'undefined'],
      [v.null(), 'null'],
      [v.void(), 'void'],
      [v.any(), 'any'],
      [v.unknown(), 'unknown'],
      [v.nan(), 'nan'],
      [v.date(), 'date'],
      [v.file(), 'file'],
      [v.function(), 'function'],
      [v.templateLiteral(['a', 'b']), 'template_literal'],
      [v.promise(v.string()), 'promise'],
      [v.custom<unknown>(() => true), 'custom'],
      [v.enum(['a', 'b']), 'enum'],
      [v.literal('x'), 'literal'],
      [v.array(v.string()), 'array'],
      [v.set(v.string()), 'set'],
      [v.map(v.string(), v.number()), 'map'],
      [v.record(v.string(), v.number()), 'record'],
      [v.union([v.string(), v.number()]), 'union'],
      [v.intersection(v.object({ a: v.string() }), v.object({ b: v.number() })), 'intersection'],
      [v.tuple([v.string(), v.number()]), 'tuple'],
      [v.object({ a: v.string() }), 'object'],
      [v.lazy(() => v.string()), 'lazy'],
      [v.string().optional(), 'optional'],
      [v.string().nullable(), 'nullable'],
      [v.string().nullish(), 'nullish'],
      [v.string().default('x'), 'default'],
      [v.string().catch('x'), 'catch'],
      [v.string().readonly(), 'readonly'],
      [v.string().prefault('x'), 'prefault'],
      [v.string().transform(s => s), 'transform'],
      [v.string().refine(() => true), 'refinement'],
      [v.pipe(v.string(), v.string().email()), 'pipe']
    ];
    for (const [schema, expected] of cases) {
      expect(schema._zod.def.type).toBe(expected);
    }
  });

  it('maps coercing factories to the coerced base type with a coerce flag', () => {
    expect(v.coerce.string()._zod.def.type).toBe('string');
    expect(v.coerce.string()._zod.def.coerce).toBe(true);
    expect(v.coerce.number()._zod.def.type).toBe('number');
    expect(v.coerce.boolean()._zod.def.type).toBe('boolean');
    expect(v.coerce.date()._zod.def.type).toBe('date');
    expect(v.coerce.bigint()._zod.def.type).toBe('bigint');
  });

  it('carries type-specific def fields ecosystems walk', () => {
    const objectSchema = v.object({ a: v.string() });
    expect(objectSchema._zod.def.shape.a).toBe(objectSchema.shape.a);

    const arraySchema = v.array(v.string());
    expect(arraySchema._zod.def.element).toBe(arraySchema.element);

    const setSchema = v.set(v.string());
    expect(setSchema._zod.def.value).toBe(setSchema.itemSchema);

    const mapSchema = v.map(v.string(), v.number());
    expect(mapSchema._zod.def.keyType).toBe(mapSchema.keyType);
    expect(mapSchema._zod.def.valueType).toBe(mapSchema.valueType);

    const recordSchema = v.record(v.string(), v.number());
    expect(recordSchema._zod.def.keyType).toBeDefined();
    expect(recordSchema._zod.def.valueType).toBeDefined();

    const unionSchema = v.union([v.string(), v.number()]);
    expect(unionSchema._zod.def.options).toBe(unionSchema.options);

    const enumSchema = v.enum(['a', 'b']);
    expect(enumSchema._zod.def.values).toEqual(['a', 'b']);

    const literalSchema = v.literal('x');
    expect(literalSchema._zod.def.values).toEqual(['x']);
  });

  it('exposes traits, version and bag like Zod core', () => {
    const objectSchema = v.object({ a: v.string() });
    const traits = objectSchema._zod.traits as Set<string>;
    expect(traits.has('ZodObject')).toBe(true);
    expect(traits.has('$ZodObject')).toBe(true);
    expect(traits.has('ZodType')).toBe(true);
    expect(traits.has('$ZodType')).toBe(true);
    expect(objectSchema._zod.version).toEqual({ major: 4, minor: 6, patch: 7 });
    expect(typeof objectSchema._zod.bag).toBe('object');
  });


  it('carries innerType for wrapper schemas across both validator generations', () => {
    const optional = v.string().optional();
    expect(optional._zod.def.innerType).toBeDefined();
    const nullable = v.string().nullable();
    expect(nullable._zod.def.innerType).toBeDefined();
    const withDefault = v.string().default('x');
    expect(withDefault._zod.def.innerType).toBeDefined();
  });

  it('exposes tuple items, set value, map/record key and value schemas, and union discriminators', () => {
    const setSchema = v.set(v.string());
    expect(setSchema._zod.def.value).toBe(setSchema.itemSchema);

    const mapSchema = v.map(v.string(), v.number());
    expect(mapSchema._zod.def.keyType).toBe(mapSchema.keyType);
    expect(mapSchema._zod.def.valueType).toBe(mapSchema.valueType);

    const recordSchema = v.record(v.string(), v.number());
    expect(recordSchema._zod.def.valueType).toBe(recordSchema.valueType);

    const discriminated = v.discriminatedUnion('kind', [
      v.object({ kind: v.literal('a') }),
      v.object({ kind: v.literal('b') })
    ]);
    expect(discriminated._zod.def.discriminator).toBeDefined();
  });




  it('keeps the tuple.ts re-export of itemShape live', () => {
    expect(typeof itemShapeViaTuple).toBe('function');
    expect(itemShapeViaTuple(v.string()).optout).toBe(false);
  });

  it('covers custom exact-length messages on arrays (merged composition code)', () => {
    const schema = v.array(v.string()).length(2, 'exactly two');
    expect(schema.safeParse(['a']).success).toBe(false);
    if (!schema.safeParse(['a']).success) {
      const failed = schema.safeParse(['a']);
      expect(failed.success).toBe(false);
      if (!failed.success) {
        expect(failed.error.issues[0]!.message).toBe('exactly two');
      }
    }
    expect(v.array(v.string()).length(2).safeParse(['a', 'b']).success).toBe(true);
    expect(v.array(v.string()).length(2).safeParse(['a', 'b', 'c']).success).toBe(false);
  });


  it('covers default and custom exact-length/min messages on both bound sides', () => {
    expect(v.array(v.string()).length(2).safeParse(['a']).success).toBe(false);
    expect(v.array(v.string()).length(2, 'exactly').safeParse(['a', 'b', 'c']).success).toBe(false);
    expect(v.array(v.string()).min(2).safeParse(['a']).success).toBe(false);
    expect(v.array(v.string()).min(2, 'need').safeParse(['a']).success).toBe(false);
  });

  it('covers the V2 literal fallback in union type checkers', () => {
    const schema = v.union([v.literalV2 ? v.literalV2('a') : v.literal('a'), v.string()]);
    expect(schema.safeParse('a').success).toBe(true);
    expect(schema.safeParse(3).success).toBe(false);
  });

  it('covers the V2 fallback paths of the compat shim', () => {
                const tuple = VldTupleV2.create ? VldTupleV2.create(VldStringV2.create()) : (null as any);
    expect(tuple._zod.def.items).toBeDefined();
    const optional = VldOptionalV2.create ? VldOptionalV2.create(VldStringV2.create()) : new VldOptionalV2(VldStringV2.create());
    expect(optional._zod.def.innerType).toBeDefined();
  });

  it('memoizes the compat object per schema instance', () => {
    const schema = v.string();
    expect(schema._zod).toBe(schema._zod);
    expect(v.string()._zod).not.toBe(schema._zod);
  });

  it('keeps the legacy _def-style top-level keys working', () => {
    const schema = v.string();
    expect(schema._zod.typeName).toBe('ZodString');
    expect(schema._def).toBeDefined();
    expect(schema.def).toBeDefined();
  });
});

describe('VldError Zod parity', () => {
  it('duck-types as a Zod v4 error via _zod.traits', () => {
    try {
      v.object({ a: v.string() }).parse({});
      throw new Error('expected validation failure');
    } catch (error) {
      const zod = (error as VldError)._zod;
      expect(zod.traits.has('ZodError')).toBe(true);
      expect(zod.traits.has('$ZodError')).toBe(true);
      expect(zod.constr).toBe(VldError);
      expect(zod.def.type).toBe('error');
    }
  });

  it('reports the Zod class name', () => {
    const error = new VldError([{ code: 'custom', path: [], message: 'm' }]);
    expect(error.name).toBe('ZodError');
    expect(error.constructor.name).toBe('ZodError');
    expect(error).toBeInstanceOf(VldError);
    expect(VldError.isVldError(error)).toBe(true);
  });

  it('pretty-prints issues in the message like Zod', () => {
    const error = new VldError([{ code: 'custom', path: ['a'], message: 'first' }]);
    expect(JSON.parse(error.message)).toEqual([{ code: 'custom', path: ['a'], message: 'first' }]);
  });

  it('serializes BigInt issue values as strings in the message', () => {
    const error = new VldError([
      { code: 'too_small', path: [], message: 'm', minimum: 10n, maximum: 20n, values: [1n] } as any
    ]);
    const parsed = JSON.parse(error.message);
    expect(parsed[0].minimum).toBe('10');
    expect(parsed[0].maximum).toBe('20');
    expect(parsed[0].values).toEqual(['1']);
  });

  it('falls back to a summary for unserializable issue payloads', () => {
    const cyclic: any = { code: 'custom', path: [], message: 'cyclic' };
    cyclic.self = cyclic;
    const single = new VldError([cyclic]);
    expect(single.message).toBe('cyclic');
    const multi = new VldError([cyclic, { code: 'custom', path: [], message: 'other' }]);
    expect(multi.message).toBe('2 validation errors');
  });

  it('honors an explicit custom message over the JSON format', () => {
    const error = new VldError([{ code: 'custom', path: [], message: 'm' }], 'override');
    expect(error.message).toBe('override');
  });

  it('serializes BigInt through toJSON as before', () => {
    const big = new VldError([
      { code: 'too_small', path: [], message: 'm', minimum: 10n, maximum: 20n, exact: 3n, values: [1n] } as any
    ]);
    expect(JSON.parse(JSON.stringify(big)).issues[0]).toMatchObject({
      minimum: '10',
      maximum: '20',
      exact: '3',
      values: ['1']
    });
  });
});

describe('composition methods stay wired after the base merge', () => {
  it('.array(), .or(), .and() and .toJSONSchema() work from any schema', () => {
    expect(v.string().array().safeParse(['a']).success).toBe(true);
    expect(v.string().or(v.number()).safeParse(3).success).toBe(true);
    const merged = v.object({ a: v.string() }).and(v.object({ b: v.number() }));
    expect(merged.safeParse({ a: 'x', b: 1 }).success).toBe(true);
    expect(v.string().email().toJSONSchema()).toMatchObject({ type: 'string', format: 'email' });
  });
});
