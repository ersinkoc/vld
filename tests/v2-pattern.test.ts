/**
 * V2 Pattern Regression Tests
 *
 * These tests verify that the V2 validators (VldStringV2, VldNumberV2, etc.)
 * behave correctly across parse, safeParse, and chain methods, and that
 * V2 children interoperate with V1 composite validators.
 */
import { v, vV2 } from '../src';

describe('VldStringV2', () => {
  it('parses a simple string', () => {
    expect(v.stringV2().parse('hello')).toBe('hello');
  });

  it('rejects non-string with VldError', () => {
    expect(() => v.stringV2().parse(42)).toThrow();
  });

  it('min(1).email() chain', () => {
    expect(v.stringV2().min(1).email().parse('a@b.com')).toBe('a@b.com');
    expect(() => v.stringV2().min(1).email().parse('nope')).toThrow();
  });

  it('safeParse returns { success: true, data } for valid', () => {
    const r = v.stringV2().safeParse('hello');
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBe('hello');
  });

  it('safeParse returns { success: false, error } for invalid', () => {
    const r = v.stringV2().safeParse(42);
    expect(r.success).toBe(false);
  });

  it('transform().trim() chain', () => {
    expect(v.stringV2().trim().parse('  hi  ')).toBe('hi');
  });

  it('isSimple getter returns true for empty, false after chain', () => {
    expect(v.stringV2().isSimple).toBe(true);
    expect(v.stringV2().min(1).isSimple).toBe(false);
  });
});

describe('VldNumberV2', () => {
  it('parses a number', () => {
    expect(v.numberV2().parse(42)).toBe(42);
  });

  it('rejects NaN and Infinity (Zod 4 behavior)', () => {
    expect(() => v.numberV2().parse(NaN)).toThrow();
    expect(() => v.numberV2().parse(Infinity)).toThrow();
  });

  it('int().positive().min(1) chain', () => {
    expect(v.numberV2().int().positive().min(1).parse(5)).toBe(5);
    expect(() => v.numberV2().int().positive().min(1).parse(0)).toThrow();
    expect(() => v.numberV2().int().positive().min(1).parse(1.5)).toThrow();
  });

  it('between() range', () => {
    expect(v.numberV2().between(1, 10).parse(5)).toBe(5);
    expect(() => v.numberV2().between(1, 10).parse(11)).toThrow();
  });

  it('parseKnownNumber skips type check', () => {
    const s = v.numberV2().int().min(5);
    expect(s.parseKnownNumber(7)).toBe(7);
    expect(() => s.parseKnownNumber(4)).toThrow();
  });
});

describe('VldDateV2', () => {
  it('parses a Date', () => {
    const d = new Date('2024-01-15');
    expect(v.dateV2().parse(d).getTime()).toBe(d.getTime());
  });

  it('parses ISO string', () => {
    expect(v.dateV2().parse('2024-01-15')).toBeInstanceOf(Date);
  });

  it('rejects invalid string', () => {
    expect(() => v.dateV2().parse('not-a-date')).toThrow();
  });

  it('past() rejects future', () => {
    expect(() => v.dateV2().past().parse(new Date('2030-01-01'))).toThrow();
    expect(v.dateV2().past().parse(new Date('2020-01-01'))).toBeInstanceOf(Date);
  });
});

describe('VldBigIntV2', () => {
  it('parses a bigint', () => {
    expect(v.bigintV2().parse(42n)).toBe(42n);
  });

  it('rejects regular number', () => {
    expect(() => v.bigintV2().parse(42)).toThrow();
  });

  it('min().max() chain', () => {
    expect(v.bigintV2().min(10n).max(100n).parse(50n)).toBe(50n);
    expect(() => v.bigintV2().min(10n).max(100n).parse(5n)).toThrow();
  });
});

describe('VldArrayV2', () => {
  it('parses a simple array', () => {
    expect(v.arrayV2(v.stringV2()).parse(['a', 'b'])).toEqual(['a', 'b']);
  });

  it('rejects non-array', () => {
    expect(() => v.arrayV2(v.stringV2()).parse('x' as unknown)).toThrow();
  });

  it('min().max() chain', () => {
    const s = v.arrayV2(v.stringV2()).min(1).max(3);
    expect(s.parse(['a'])).toEqual(['a']);
    expect(() => s.parse([])).toThrow();
    expect(() => s.parse(['a', 'b', 'c', 'd'])).toThrow();
  });
});

describe('VldUnionV2', () => {
  it('matches first compatible option', () => {
    const u = v.unionV2(v.stringV2(), v.numberV2());
    expect(u.parse('x')).toBe('x');
    expect(u.parse(42)).toBe(42);
  });

  it('rejects when no option matches', () => {
    expect(() => v.unionV2(v.stringV2(), v.numberV2()).parse(true)).toThrow();
  });
});

describe('VldLiteralV2 / VldEnumV2 / VldBooleanV2', () => {
  it('literal exact match', () => {
    expect(v.literalV2('admin').parse('admin')).toBe('admin');
    expect(() => v.literalV2('admin').parse('user')).toThrow();
  });

  it('enum matches one of values', () => {
    const e = v.enumV2(['a', 'b', 'c']);
    expect(e.parse('a')).toBe('a');
    expect(() => e.parse('d')).toThrow();
  });

  it('boolean rejects non-boolean', () => {
    expect(v.booleanV2().parse(true)).toBe(true);
    expect(() => v.booleanV2().parse('true' as unknown)).toThrow();
  });
});

describe('VldOptionalV2 / VldNullableV2 / VldNullishV2', () => {
  it('optional accepts undefined', () => {
    expect(v.optionalV2(v.stringV2()).parse(undefined)).toBeUndefined();
    expect(v.optionalV2(v.stringV2()).parse('x')).toBe('x');
  });

  it('nullable accepts null', () => {
    expect(v.nullableV2(v.stringV2()).parse(null)).toBeNull();
    expect(() => v.nullableV2(v.stringV2()).parse(42 as unknown)).toThrow();
  });

  it('nullish accepts both null and undefined', () => {
    const n = v.nullishV2(v.stringV2());
    expect(n.parse(null)).toBeNull();
    expect(n.parse(undefined)).toBeUndefined();
  });
});

describe('VldRecordV2 / VldTupleV2 / VldSetV2 / VldMapV2 / VldIntersectionV2', () => {
  it('record parses plain object', () => {
    expect(v.recordV2(v.stringV2()).parse({ a: 'x', b: 'y' })).toEqual({ a: 'x', b: 'y' });
  });

  it('tuple positional', () => {
    const t = v.tupleV2(v.stringV2(), v.numberV2());
    expect(t.parse(['a', 1])).toEqual(['a', 1]);
  });

  it('set iterates and validates items', () => {
    const s = v.setV2(v.stringV2());
    const r = s.parse(new Set(['a', 'b']));
    expect(r.size).toBe(2);
  });

  it('map validates keys and values', () => {
    const m = v.mapV2(v.stringV2(), v.numberV2());
    const r = m.parse(new Map([['a', 1]]));
    expect(r.get('a')).toBe(1);
  });

  it('intersection merges results', () => {
    const i = v.intersectionV2(v.numberV2().int(), v.numberV2().positive());
    expect(i.safeParse(5).success).toBe(true);
    expect(i.safeParse(-1).success).toBe(false);
  });
});

describe('V2 interop with V1 composites', () => {
  it('v.object({a: v.stringV2()})', () => {
    const obj = v.object({ a: v.stringV2().email() });
    expect(obj.safeParse({ a: 'a@b.com' }).success).toBe(true);
  });

  it('v.array(v.numberV2().int())', () => {
    const arr = v.array(v.numberV2().int());
    expect(arr.safeParse([1, 2, 3]).success).toBe(true);
  });

  it('v.union with V2 children', () => {
    const u = v.union([v.stringV2(), v.numberV2()]);
    expect(u.safeParse('x').success).toBe(true);
  });
});

describe('vV2 drop-in factory', () => {
  it('vV2.string() returns V2', () => {
    expect(vV2.string().parse('x')).toBe('x');
  });

  it('vV2.object delegates to v.object (V1 composite with V2 children)', () => {
    // vV2 doesn't have object() — use v.object with vV2 children
    const obj = v.object({ a: vV2.string(), b: vV2.number() });
    expect(obj.safeParse({ a: 'x', b: 1 }).success).toBe(true);
  });

  it('vV2.tuple parses positional', () => {
    expect(vV2.tuple(vV2.string(), vV2.number()).parse(['a', 1])).toEqual(['a', 1]);
  });
});
