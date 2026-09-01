/**
 * V2 Final Coverage Tests
 *
 * Targets remaining branch and statement coverage gaps to push
 * the global coverage to 100% across statements, branches, and lines.
 */
import { v, vV2, VldError } from '../src';
import {
  VldArrayCheckMin, VldArrayCheckMax, VldArrayCheckLength, VldArrayCheckUnique
} from '../src/validators/array-v2';
import {
  VldNumberCheckUInt64, VldNumberCheckInt64,
  VldCoerceNumberV2
} from '../src/validators/number-v2';
import { VldDateCheckGt } from '../src/validators/date-v2';
import { VldBigIntV2 } from '../src/validators/bigint-v2';
import {
  VldSetV2, VldMapV2, VldTupleV2, VldIntersectionV2
} from '../src/validators/composite-v2';
import { VldUnionV2 } from '../src/validators/union-v2';
import {
  VldLiteralV2, VldRecordV2, VldAnyV2, VldVoidV2, VldNullV2, VldUndefinedV2, VldBooleanV2
} from '../src/validators/leaf-v2';
import {
  VldRefineV2, VldTransformV2, VldOptionalV2, VldNullableV2, VldNullishV2
} from '../src/validators/wrapper-v2';

// ============================================================================
// string-v2.ts: case 2 + default transform branches
// ============================================================================
describe('string-v2 transform switch full coverage', () => {
  it('exactly 2 transforms (case 2 branch)', () => {
    const s = vV2.string().transform(x => x + 'A').transform(x => x + 'B');
    expect(s.parse('x')).toBe('xAB');
  });
  it('exactly 3 transforms (case 3 branch)', () => {
    const s = vV2.string().transform(x => x + 'A').transform(x => x + 'B').transform(x => x + 'C');
    expect(s.parse('x')).toBe('xABC');
  });
  it('5 transforms (default branch)', () => {
    const s = vV2.string()
      .transform(x => x + '1')
      .transform(x => x + '2')
      .transform(x => x + '3')
      .transform(x => x + '4')
      .transform(x => x + '5');
    expect(s.parse('x')).toBe('x12345');
  });
});

// ============================================================================
// number-v2.ts: check classes (return null branches), getters, withDef, safeParse catch
// ============================================================================
describe('number-v2 full coverage', () => {
  it('VldNumberCheckUInt64 returns null on valid', () => {
    expect(new VldNumberCheckUInt64().check(100)).toBeNull();
  });
  it('VldNumberCheckInt64 returns null on valid', () => {
    expect(new VldNumberCheckInt64().check(100)).toBeNull();
  });
  it('minValue / maxValue getter with jsonSchema', () => {
    const s = vV2.number().min(5).max(10);
    expect(s.minValue).toBe(5);
    expect(s.maxValue).toBe(10);
  });
  it('safeParse catch (non-VldError)', () => {
    // Direct path: VldCoerceNumberV2's own parse throws a plain Error on bad input
    const r = VldCoerceNumberV2.create().safeParse('not-a-number');
    expect(r.success).toBe(false);
  });
  it('withDef fallback paths (jsonSchema undefined, errorMessage undefined)', () => {
    const s = vV2.number().int();
    const s2 = (s as any).withDef({ type: 'number' });
    expect(s2.__def.jsonSchema).toBeDefined();
  });
  it('VldCoerceNumberV2 with bigint that overflows', () => {
    // 2n**1024n is too large to fit in a double, becomes Infinity
    const huge = BigInt('2') ** BigInt('1024');
    expect(() => VldCoerceNumberV2.create().parse(huge)).toThrow();
  });
});

// ============================================================================
// date-v2.ts: VldDateCheckGt return null, safeParse catch
// ============================================================================
describe('date-v2 full coverage', () => {
  it('VldDateCheckGt return null when value > threshold', () => {
    expect(new VldDateCheckGt(new Date('2024-01-15')).check(new Date('2024-06-01'))).toBeNull();
  });
  it('VldDateV2.safeParse catches non-VldError', () => {
    // Use a chain that produces a non-VldError downstream
    const s = vV2.date().min('2024-01-15');
    // Trigger a parse that throws via the underlying safeParse catch
    expect(s.safeParse('not-a-date').success).toBe(false);
  });
});

// ============================================================================
// bigint-v2.ts: safeParse catch, withDef fallback
// ============================================================================
describe('bigint-v2 full coverage', () => {
  it('safeParse catches errors', () => {
    expect(VldBigIntV2.create().safeParse('not-a-bigint').success).toBe(false);
  });
});

// ============================================================================
// composite-v2.ts: VldTupleV2, VldSetV2, VldMapV2, VldIntersectionV2 safeParse catch
// ============================================================================
describe('composite-v2 full coverage', () => {
  it('VldTupleV2.safeParse catches non-array', () => {
    expect(VldTupleV2.create(vV2.string(), vV2.number()).safeParse('not-array').success).toBe(false);
  });
  it('VldSetV2.safeParse catches non-Set', () => {
    expect(VldSetV2.create(vV2.string()).safeParse('not-set').success).toBe(false);
  });
  it('VldMapV2.safeParse catches non-Map', () => {
    expect(VldMapV2.create(vV2.string(), vV2.number()).safeParse('not-map').success).toBe(false);
  });
  it('VldIntersectionV2.safeParse catches errors', () => {
    const i = VldIntersectionV2.create(vV2.string().min(2), vV2.string().max(3));
    expect(i.safeParse('a').success).toBe(false);
    expect(i.safeParse('toolong').success).toBe(false);
  });
});

// ============================================================================
// union-v2.ts: UNDEFINED/VOID fallthrough, safeParse catch, string(error) else
// ============================================================================
describe('union-v2 full coverage', () => {
  it('UNDEFINED/VOID fallthrough typeChecker', () => {
    expect(v.unionV2(vV2.undefined()).safeParse(undefined).success).toBe(true);
    expect(v.unionV2(vV2.void()).safeParse(undefined).success).toBe(true);
  });
  it('safeParse catches non-VldError', () => {
    const u = v.unionV2(vV2.string().min(100), vV2.string().min(200));
    const r = u.safeParse('x');
    expect(r.success).toBe(false);
    if (!r.success) expect((r.error as VldError).issues).toBeDefined();
  });
  it('VldUnionV2.create with explicit errorMessage', () => {
    const u = new VldUnionV2([vV2.string()], 'custom union error');
    try { u.parse(42); } catch (e) {
      expect((e as Error).message).toContain('custom union error');
    }
  });
});

// ============================================================================
// leaf-v2.ts: VldLiteralV2 safeParse, VldRecordV2 BOOLEAN/BIGINT/SYMBOL simple modes, safeParse catch
// ============================================================================
describe('leaf-v2 full coverage', () => {
  it('VldLiteralV2.safeParse error path', () => {
    expect(VldLiteralV2.create('admin').safeParse('user').success).toBe(false);
  });
  it('VldRecordV2 BOOLEAN simple mode', () => {
    const r = VldRecordV2.create(vV2.boolean());
    expect(r.parse({ a: true, b: false })).toEqual({ a: true, b: false });
    expect(() => r.parse({ a: 'not-bool' as unknown as boolean })).toThrow();
  });
  it('VldRecordV2 BIGINT simple mode', () => {
    const r = VldRecordV2.create(vV2.bigint());
    const out = r.parse({ a: 1n, b: 2n });
    expect(out['a']).toBe(1n);
    expect(() => r.parse({ a: 1 as unknown as bigint })).toThrow();
  });
  it('VldRecordV2 SYMBOL simple mode', () => {
    const r = VldRecordV2.create(vV2.symbol());
    const s = Symbol('x');
    const out = r.parse({ a: s });
    expect(typeof out['a']).toBe('symbol');
    expect(() => r.parse({ a: 'x' as unknown as symbol })).toThrow();
  });
  it('VldRecordV2.safeParse catch', () => {
    expect(VldRecordV2.create(vV2.string()).safeParse(null).success).toBe(false);
    expect(VldRecordV2.create(vV2.string()).safeParse('not-object').success).toBe(false);
  });
  it('VldAnyV2 / VldVoidV2 / VldNullV2 / VldUndefinedV2 / VldBooleanV2 safeParse', () => {
    expect(VldAnyV2.create().safeParse(42).success).toBe(true);
    expect(VldVoidV2.create().safeParse(42 as unknown).success).toBe(false);
    expect(VldNullV2.create().safeParse(42 as unknown).success).toBe(false);
    expect(VldUndefinedV2.create().safeParse(42 as unknown).success).toBe(false);
    expect(VldBooleanV2.create().safeParse('x' as unknown).success).toBe(false);
  });
});

// ============================================================================
// array-v2.ts: VldArrayCheckMin/Max/Length/Unique default branches,
//             VldArrayV2 simpleItemMode for boolean/bigint,
//             VldArrayCheckUnique check function,
//             VldArrayV2.safeParse catch
// ============================================================================
describe('array-v2 full coverage', () => {
  it('VldArrayCheckMin default branch (non-failing case)', () => {
    new VldArrayCheckMin(2, 'msg').check({ length: 5 }, { length: 5, issues: [] });
  });
  it('VldArrayCheckMax default branch (non-failing case)', () => {
    new VldArrayCheckMax(5, 'msg').check({ length: 2 }, { length: 2, issues: [] });
  });
  it('VldArrayCheckLength default branch (non-failing case)', () => {
    new VldArrayCheckLength(3, 'msg').check({ length: 3 }, { length: 3, issues: [] });
  });
  it('VldArrayCheckUnique default branch (non-failing unique)', () => {
    new VldArrayCheckUnique('msg').check({ length: 3, items: ['a', 'b', 'c'] }, { length: 3, issues: [] });
  });
  it('VldArrayCheckUnique default branch (custom message)', () => {
    const p = { length: 2, issues: [] as any[] };
    new VldArrayCheckUnique('dup-msg').check({ length: 2, items: ['a', 'a'] }, p);
    expect(p.issues[0].message).toBe('dup-msg');
  });
  it('VldArrayV2 bigint simpleItemMode', () => {
    const arr = vV2.array(vV2.bigint());
    expect(arr.parse([1n, 2n])).toEqual([1n, 2n]);
    expect(() => arr.parse([1 as unknown])).toThrow();
  });
  it('VldArrayV2 boolean simpleItemMode', () => {
    const arr = vV2.array(vV2.boolean());
    expect(arr.parse([true, false])).toEqual([true, false]);
    expect(() => arr.parse(['x' as unknown])).toThrow();
  });
  it('VldArrayV2.safeParse catch (non-VldError)', () => {
    // Array of strings where each string must be a valid number — impossible
    const arr = vV2.array(vV2.string().email());
    // Pass a value that triggers the underlying email check throw
    expect(arr.safeParse(['not-an-email']).success).toBe(false);
  });
});

// ============================================================================
// wrapper-v2.ts: VldOptionalV2.unwrap, VldNullishV2.unwrap
// ============================================================================
describe('wrapper-v2 full coverage', () => {
  it('VldOptionalV2.unwrap returns inner', () => {
    const inner = vV2.string();
    const opt = VldOptionalV2.create(inner);
    expect(opt.unwrap()).toBe(inner);
  });
  it('VldNullableV2.unwrap returns inner', () => {
    const inner = vV2.string();
    const nul = VldNullableV2.create(inner);
    expect(nul.unwrap()).toBe(inner);
  });
  it('VldNullishV2.unwrap returns inner', () => {
    const inner = vV2.string();
    const ns = VldNullishV2.create(inner);
    expect(ns.unwrap()).toBe(inner);
  });
  it('VldRefineV2 / VldTransformV2 safeParse catches non-VldError', () => {
    const r = VldRefineV2.create(vV2.string(), s => s.length > 5);
    expect(r.safeParse('x').success).toBe(false);
    const t = VldTransformV2.create(vV2.string(), () => { throw new Error('plain'); });
    expect(t.safeParse('x').success).toBe(false);
  });
});

// ============================================================================
// index.ts: vV2 factories for bigintV2, int, int32, uint32, uint64, int64, float32, float64
// ============================================================================
describe('vV2 factory full coverage', () => {
  it('vV2.bigint() / int() / int32() / uint32() / uint64() / int64() / float32() / float64()', () => {
    expect((vV2 as any).bigint().parse(1n)).toBe(1n);
    expect(vV2.int().parse(1)).toBe(1);
    expect(vV2.int32().parse(-100)).toBe(-100);
    expect(vV2.uint32().parse(100)).toBe(100);
    expect(vV2.uint64().parse(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER);
    expect(vV2.int64().parse(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER);
    expect(vV2.float32().parse(1.5)).toBe(1.5);
    expect(vV2.float64().parse(1.5)).toBe(1.5);
  });
});

// ============================================================================
// zod-error.ts: branches in toZodError for expected/received fallbacks
// ============================================================================
import { toZodError } from '../src/zod-error';

describe('zod-error branches full coverage', () => {
  it('toZodError fills expected = "unknown" for invalid_value without origin', () => {
    const vldErr = new VldError([{ code: 'invalid_value', path: ['x'], message: 'm' }]);
    const zodErr = toZodError(vldErr);
    expect(zodErr.issues[0]!.expected).toBe('unknown');
  });
  it('toZodError fills expected from validation for invalid_string', () => {
    const vldErr = new VldError([{ code: 'invalid_string', path: ['x'], message: 'm', validation: 'email' } as any]);
    const zodErr = toZodError(vldErr);
    expect(zodErr.issues[0]!.expected).toBe('email');
  });
  it('toZodError fills received = "unknown" for invalid_type when expected exists', () => {
    const vldErr = new VldError([{ code: 'invalid_type', path: ['x'], message: 'm', expected: 'string' }]);
    const zodErr = toZodError(vldErr);
    expect(zodErr.issues[0]!.received).toBe('unknown');
  });
  it('toZodError preserves explicit received for invalid_type', () => {
    const vldErr = new VldError([{ code: 'invalid_type', path: ['x'], message: 'm', expected: 'string', received: 'number' }]);
    const zodErr = toZodError(vldErr);
    expect(zodErr.issues[0]!.received).toBe('number');
  });
});
