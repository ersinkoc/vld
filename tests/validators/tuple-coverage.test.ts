import { v } from '../../src';

describe('VldTuple optimized paths', () => {
  it('should parse primitive tuple items through the simple fast path', () => {
    const schema = v.tuple(v.string(), v.number(), v.boolean());

    expect(schema.parse(['hello', 123, true])).toEqual(['hello', 123, true]);
    expect(schema.safeParse(['hello', Number.NaN, true]).success).toBe(false);
    expect(schema.safeParse(['hello', 123, 'true']).success).toBe(false);
  });

  it('should parse literal tuple items through the simple fast path', () => {
    const schema = v.tuple(v.literal('point'), v.number(), v.number());

    expect(schema.parse(['point', 10, 20])).toEqual(['point', 10, 20]);
    expect(schema.safeParse(['line', 10, 20]).success).toBe(false);
  });

  it('should parse scalar tuple items through simple fast paths', () => {
    const token = Symbol('token');
    const value = { nested: true };
    const schema = v.tuple(
      v.bigint(),
      v.symbol(),
      v.null(),
      v.undefined(),
      v.void(),
      v.any(),
      v.unknown()
    );

    expect(schema.parse([1n, token, null, undefined, undefined, value, value])).toEqual([
      1n,
      token,
      null,
      undefined,
      undefined,
      value,
      value
    ]);
    expect(schema.safeParse([1, token, null, undefined, undefined, value, value]).success).toBe(false);
    expect(schema.safeParse([1n, 'token', null, undefined, undefined, value, value]).success).toBe(false);
    expect(schema.safeParse([1n, token, undefined, undefined, undefined, value, value]).success).toBe(false);
    expect(schema.safeParse([1n, token, null, null, undefined, value, value]).success).toBe(false);
    expect(schema.safeParse([1n, token, null, undefined, null, value, value]).success).toBe(false);
  });

  it('should expose the known-array tuple parser for nested object fields', () => {
    const tuple = v.tuple(v.string(), v.number());
    const schema = v.object({ pair: tuple });

    expect((tuple as any).parseKnownTuple(['x', 1])).toEqual(['x', 1]);
    expect(schema.parse({ pair: ['x', 1] })).toEqual({ pair: ['x', 1] });
    expect(schema.safeParse({ pair: ['x', '1'] }).success).toBe(false);
  });

  it('reports per-position issues for every optimized mode (Zod paths)', () => {
    const schema = v.tuple(v.string());
    expect((schema as any).getSimpleItemMode({ isSimple: true, validatorType: 'unsupported' }, 'unsupported')).toBeUndefined();
    // The optimized paths re-collect through the item schema, so each failing
    // position carries an issue with the item's own code, path and expected.
    const r = v.tuple([v.string(), v.number(), v.boolean(), v.bigint(), v.symbol()]).safeParse([1, 'x', 'y', 'z', 1]);
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.map((i: any) => [i.code, i.path, i.expected])).toEqual([
        ['invalid_type', [0], 'string'],
        ['invalid_type', [1], 'number'],
        ['invalid_type', [2], 'boolean'],
        ['invalid_type', [3], 'bigint'],
        ['invalid_type', [4], 'symbol'],
      ]);
    }
  });
});
