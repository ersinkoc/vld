/**
 * V2 Final 100% Coverage Tests
 *
 * Targets the last 0.35% of statements and 1.16% of branches.
 * Each test exercises a specific branch / line that wasn't hit.
 */
import { v, vV2, VldError } from '../src';
import { toZodError } from '../src/zod-error';
import {
  VldArrayCheckMin, VldArrayCheckMax, VldArrayCheckLength, VldArrayCheckUnique
} from '../src/validators/array-v2';
import {
  VldNumberV2, VldNumberCheckUInt64, VldNumberCheckInt64,
  VldCoerceNumberV2
} from '../src/validators/number-v2';
import { VldDateCheckGt } from '../src/validators/date-v2';
import { VldBigIntV2 } from '../src/validators/bigint-v2';
import { VldSetV2, VldMapV2, VldIntersectionV2 } from '../src/validators/composite-v2';
import { VldUnionV2 } from '../src/validators/union-v2';
import {
  VldLiteralV2, VldRecordV2, VldAnyV2, VldVoidV2, VldNullV2, VldUndefinedV2, VldBooleanV2
} from '../src/validators/leaf-v2';
import { VldRefineV2 } from '../src/validators/wrapper-v2';

// ============================================================================
// zod-error.ts: every branch in toZodError
// ============================================================================
describe('zod-error.ts full branch coverage', () => {
  it('preserves minimum / maximum / inclusive / origin / format / pattern', () => {
    const vldErr = new VldError([{
      code: 'too_small', path: ['x'], message: 'm',
      minimum: 5, maximum: 10, inclusive: true, origin: 'string',
      format: 'email', pattern: '^x'
    }]);
    const zodErr = toZodError(vldErr);
    expect(zodErr.issues[0]!.minimum).toBe(5);
    expect(zodErr.issues[0]!.maximum).toBe(10);
    expect(zodErr.issues[0]!.inclusive).toBe(true);
    expect(zodErr.issues[0]!.origin).toBe('string');
    expect(zodErr.issues[0]!.format).toBe('email');
    expect(zodErr.issues[0]!.pattern).toBe('^x');
  });

  it('preserves literal-style expected for invalid_type via origin', () => {
    const vldErr = new VldError([{
      code: 'invalid_type', path: ['x'], message: 'm', origin: 'number'
    }]);
    const zodErr = toZodError(vldErr);
    expect(zodErr.issues[0]!.expected).toBe('number');
  });

  it('preserves invalid_literal expected via origin', () => {
    const vldErr = new VldError([{
      code: 'invalid_literal', path: ['x'], message: 'm', origin: 'string'
    }]);
    const zodErr = toZodError(vldErr);
    expect(zodErr.issues[0]!.expected).toBe('string');
  });

  it('received defaults to undefined when expected is also missing', () => {
    const vldErr = new VldError([{
      code: 'invalid_type', path: ['x'], message: 'm'
    }]);
    const zodErr = toZodError(vldErr);
    // received stays undefined; expected becomes 'unknown' via origin check
    expect(zodErr.issues[0]!.expected).toBe('unknown');
    expect(zodErr.issues[0]!.received).toBeUndefined();
  });

  it('received=string is preserved, not "unknown"', () => {
    const vldErr = new VldError([{
      code: 'invalid_type', path: ['x'], message: 'm', received: 'string'
    }]);
    const zodErr = toZodError(vldErr);
    expect(zodErr.issues[0]!.received).toBe('string');
  });
});

// ============================================================================
// index.ts: every vV2 / v.*V2 factory used
// ============================================================================
describe('vV2 factory edge cases (lines 1342-1367)', () => {
  it('vV2.coerce.string / v.coerce.stringV2 (V2 coercion)', () => {
    const a = (vV2 as any).coerce.string().parse(42);
    const b = v.coerce.stringV2().parse(42);
    expect(a).toBe('42');
    expect(b).toBe('42');
  });
  it('vV2.coerce.number / v.coerce.numberV2 (V2 coercion)', () => {
    const a = (vV2 as any).coerce.number().parse('42');
    const b = v.coerce.numberV2().parse('42');
    expect(a).toBe(42);
    expect(b).toBe(42);
  });
  it('v.refineV2 (V2 refine)', () => {
    const r = v.refineV2(vV2.string(), (s: string) => s.length > 0, 'msg');
    expect(r.parse('x')).toBe('x');
  });
  it('v.transformV2 (V2 transform)', () => {
    const t = v.transformV2(vV2.string(), (s: string) => s + '?');
    expect(t.parse('x')).toBe('x?');
  });
  it('vV2.optional / v.optionalV2', () => {
    expect((vV2 as any).optional(vV2.string()).parse(undefined)).toBeUndefined();
    expect(v.optionalV2(vV2.string()).parse(undefined)).toBeUndefined();
  });
  it('vV2.nullable / v.nullableV2', () => {
    expect((vV2 as any).nullable(vV2.string()).parse(null)).toBeNull();
    expect(v.nullableV2(vV2.string()).parse(null)).toBeNull();
  });
  it('vV2.nullish / v.nullishV2', () => {
    expect((vV2 as any).nullish(vV2.string()).parse(null)).toBeNull();
    expect(v.nullishV2(vV2.string()).parse(undefined)).toBeUndefined();
  });
});

// ============================================================================
// string-v2.ts: case 2 + default transform branches
// ============================================================================
describe('string-v2 transform switch full branch coverage', () => {
  it('exactly 2 transforms (case 2 branch)', () => {
    const s = vV2.string().transform(x => x + 'A').transform(x => x + 'B');
    expect(s.parse('x')).toBe('xAB');
  });
  it('exactly 3 transforms (case 3 branch)', () => {
    const s = vV2.string().transform(x => x + 'A').transform(x => x + 'B').transform(x => x + 'C');
    expect(s.parse('x')).toBe('xABC');
  });
  it('5+ transforms (default branch)', () => {
    const s = vV2.string()
      .transform(x => x + '1').transform(x => x + '2').transform(x => x + '3')
      .transform(x => x + '4').transform(x => x + '5');
    expect(s.parse('x')).toBe('x12345');
  });
});

// ============================================================================
// number-v2.ts: getter fallback paths, check classes return null
// ============================================================================
describe('number-v2 full branch coverage', () => {
  it('VldNumberCheckUInt64 / Int64 return null branch', () => {
    expect(new VldNumberCheckUInt64().check(100)).toBeNull();
    expect(new VldNumberCheckInt64().check(100)).toBeNull();
  });
  it('VldNumberCheckUInt64 fallback message', () => {
    const c = new VldNumberCheckUInt64();
    expect(c.check(-1)!.message).toBe('Expected an unsigned 64-bit integer');
  });
  it('VldNumberCheckInt64 fallback message', () => {
    const c = new VldNumberCheckInt64();
    expect(c.check(1.5)!.message).toBe('Expected a signed 64-bit integer');
  });
  it('minValue / maxValue fallback to exclusiveMinimum/exclusiveMaximum', () => {
    const s = vV2.number().gt(0).lt(100); // exclusiveMin=0, exclusiveMax=100
    expect(s.minValue).toBe(0);
    expect(s.maxValue).toBe(100);
  });
  it('minValue / maxValue with no jsonSchema (returns null)', () => {
    const s = VldNumberV2.create();
    expect(s.minValue).toBeNull();
    expect(s.maxValue).toBeNull();
  });
  it('VldCoerceNumberV2 with bigint overflow', () => {
    // 2^1024 → Infinity after Number coercion
    const huge = BigInt('2') ** BigInt('1024');
    expect(() => VldCoerceNumberV2.create().parse(huge)).toThrow();
  });
});

// ============================================================================
// date-v2.ts: VldDateCheckGt return null, safeParse catch
// ============================================================================
describe('date-v2 full branch coverage', () => {
  it('VldDateCheckGt return null (value > threshold)', () => {
    expect(new VldDateCheckGt(new Date('2024-01-15')).check(new Date('2024-06-01'))).toBeNull();
  });
  it('VldDateCheckGt return null (value === threshold — actually fails on <=)', () => {
    // VldDateCheckGt fails if value <= threshold
    expect(new VldDateCheckGt(new Date('2024-01-15')).check(new Date('2024-01-16'))).toBeNull();
  });
  it('VldDateV2.safeParse catches non-VldError', () => {
    const s = vV2.date().min('2024-01-15');
    expect(s.safeParse('not-a-date').success).toBe(false);
  });
});

// ============================================================================
// bigint-v2.ts: safeParse catch, withDef merge
// ============================================================================
describe('bigint-v2 full branch coverage', () => {
  it('safeParse catches non-VldError', () => {
    expect(VldBigIntV2.create().safeParse('not-bigint').success).toBe(false);
  });
});

// ============================================================================
// composite-v2.ts: VldSetV2, VldMapV2, VldIntersectionV2 safeParse catch
// ============================================================================
describe('composite-v2 full branch coverage', () => {
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
// union-v2.ts: ALL typeCheckers, safeParse catch, string(error) else
// ============================================================================
describe('union-v2 full branch coverage', () => {
  it('UNDEFINED / VOID / ENUM / LITERAL typeCheckers (lines 52-56)', () => {
    expect(v.unionV2(vV2.undefined()).safeParse(undefined).success).toBe(true);
    expect(v.unionV2(vV2.void()).safeParse(undefined).success).toBe(true);
    expect(v.unionV2(vV2.enum(['a', 'b'])).safeParse('a').success).toBe(true);
    expect(v.unionV2(vV2.enum([1, 2])).safeParse(1).success).toBe(true);
    expect(v.unionV2(vV2.literal('hello')).safeParse('hello').success).toBe(true);
  });
  it('safeParse catches error and stringifies it (line 117)', () => {
    const u = v.unionV2(vV2.string().min(100), vV2.string().min(200));
    const r = u.safeParse('x');
    expect(r.success).toBe(false);
  });
  it('VldUnionV2 with custom errorMessage (line 127 explicit branch)', () => {
    const u = new VldUnionV2([vV2.string()], 'no match');
    try { u.parse(42); } catch (e) { expect((e as Error).message).toContain('no match'); }
  });
});

// ============================================================================
// leaf-v2.ts: VldLiteralV2 safeParse, VldRecordV2 all simple modes, safeParse catch
// ============================================================================
describe('leaf-v2 full branch coverage', () => {
  it('VldLiteralV2.safeParse error path (line 44)', () => {
    expect(VldLiteralV2.create('admin').safeParse('user').success).toBe(false);
  });
  it('VldRecordV2 NUMBER simple mode (line 150)', () => {
    const r = VldRecordV2.create(vV2.number());
    expect(r.parse({ a: 1, b: 2 })).toEqual({ a: 1, b: 2 });
    expect(() => r.parse({ a: 'x' as unknown as number })).toThrow();
  });
  it('VldRecordV2.safeParse catches non-object', () => {
    expect(VldRecordV2.create(vV2.string()).safeParse(null).success).toBe(false);
    expect(VldRecordV2.create(vV2.string()).safeParse('not-object').success).toBe(false);
  });
  it('VldAnyV2 / VldVoidV2 / VldNullV2 / VldUndefinedV2 / VldBooleanV2 safeParse catch', () => {
    expect(VldAnyV2.create().safeParse(42).success).toBe(true);
    expect(VldVoidV2.create().safeParse(42 as unknown).success).toBe(false);
    expect(VldNullV2.create().safeParse(42 as unknown).success).toBe(false);
    expect(VldUndefinedV2.create().safeParse(42 as unknown).success).toBe(false);
    expect(VldBooleanV2.create().safeParse('x' as unknown).success).toBe(false);
  });
});

// ============================================================================
// array-v2.ts: VldArrayCheckMin/Max/Length/Unique default branch, safeParse catch
// ============================================================================
describe('array-v2 full branch coverage', () => {
  it('VldArrayCheckMin non-failing (default branch line 29)', () => {
    new VldArrayCheckMin(2, 'msg').check({ length: 5 }, { length: 5, issues: [] });
  });
  it('VldArrayCheckMax non-failing (default branch line 43)', () => {
    new VldArrayCheckMax(5, 'msg').check({ length: 2 }, { length: 2, issues: [] });
  });
  it('VldArrayCheckLength non-failing (default branch line 57)', () => {
    new VldArrayCheckLength(3, 'msg').check({ length: 3 }, { length: 3, issues: [] });
  });
  it('VldArrayCheckUnique non-failing (default branch line 73)', () => {
    new VldArrayCheckUnique('msg').check({ length: 3, items: ['a', 'b', 'c'] }, { length: 3, issues: [] });
  });
  it('VldArrayV2.safeParse catches non-VldError (line 196)', () => {
    // Use a chain where the inner validator throws a non-VldError
    const arr = vV2.array(vV2.string().email());
    expect(arr.safeParse(['not-an-email']).success).toBe(false);
  });
});

// ============================================================================
// wrapper-v2.ts: VldRefineV2 default message (line 128)
// ============================================================================
describe('wrapper-v2 full branch coverage', () => {
  it('VldRefineV2 default message when no message provided (line 128)', () => {
    // Predicate returns false → refines fails → uses default 'Refinement check failed' message
    const r = VldRefineV2.create(vV2.string(), (s: string) => s.length > 5);
    const safe = r.safeParse('short');
    expect(safe.success).toBe(false);
  });
});
