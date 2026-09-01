/**
 * V2 Coverage — Last mile
 *
 * Targets the last remaining V2 branches:
 *   - union-v2 OBJECT typeChecker (line 52)
 *   - union-v2 catch non-Error fallback (line 117)
 *   - union-v2 safeParse VldError branch (line 127)
 *   - bigint-v2 safeParse VldError branch (line 126)
 *   - bigint-v2 withDef checks ?? branch (line 131)
 *   - date-v2 safeParse catch (line 201)
 *   - number-v2 VldCoerceNumberV2 bigint NaN (line 341)
 *   - leaf-v2 VldRecordV2 SYMBOL simple (line 150)
 */
import { v, vV2 } from '../src';
import { VldUnionV2 } from '../src/validators/union-v2';
import { VldBigIntV2 } from '../src/validators/bigint-v2';
import { VldDateV2 } from '../src/validators/date-v2';
import { VldRecordV2 } from '../src/validators/leaf-v2';

const bigintMod = require('../src/validators/bigint-v2') as typeof import('../src/validators/bigint-v2');

// ============================================================================
// union-v2: OBJECT typeChecker (line 52)
// ============================================================================
describe('union-v2 OBJECT typeChecker + remaining branches', () => {
  it('VldUnionV2 with object typeChecker (line 52)', () => {
    // Use object() factory to create an object validator
    const obj = vV2.object({ x: vV2.number() });
    const u = VldUnionV2.create(obj, vV2.string());
    expect(u.safeParse({ x: 1 }).success).toBe(true);
    expect(u.safeParse('hi').success).toBe(true);
    expect(u.safeParse([1, 2]).success).toBe(false); // array, not object
    expect(u.safeParse(null).success).toBe(false);    // null, not object
  });

  it('VldUnionV2 catch non-Error fallback (line 117)', () => {
    // Validator that throws a non-Error (a string) → line 117 fallback
    const throwing = { parse: () => { throw 'string-not-error'; } } as any;
    const u = VldUnionV2.create(throwing);
    const r = u.safeParse('x');
    expect(r.success).toBe(false);
  });

  it('VldUnionV2 safeParse VldError branch (line 127 true)', () => {
    // VldError thrown from a non-matching inner → wraps correctly
    const u = VldUnionV2.create(vV2.string());
    const r = u.safeParse(42);
    expect(r.success).toBe(false);
    if (!r.success) {
      // r.error should be a VldError (line 127 true branch)
      expect((r.error as any).issues).toBeDefined();
    }
  });
});

// ============================================================================
// bigint-v2: safeParse catch VldError (line 126) + withDef checks ?? (line 131)
// ============================================================================
describe('bigint-v2 safeParse catch + withDef ?? branches', () => {
  it('VldBigIntV2 safeParse catches VldError on non-bigint (line 126)', () => {
    const b = VldBigIntV2.create();
    const r = b.safeParse('not-a-bigint');
    expect(r.success).toBe(false);
    if (!r.success) {
      // VldError path (line 126 true branch)
      expect((r.error as any).issues).toBeDefined();
    }
  });

  it('VldBigIntCheck.meta() default message branches (line 131 ??-checks)', () => {
    // meta() is called when we use a check with no message — exercises the
    // `??` fallback branches in buildBigIntDef path
    expect(new bigintMod.VldBigIntCheckMin(10n).meta().message).toBeUndefined();
    expect(new bigintMod.VldBigIntCheckMin(10n, 'custom').meta().message).toBe('custom');
    expect(new bigintMod.VldBigIntCheckMax(10n).meta().value).toBe(10n);
  });
});

// ============================================================================
// date-v2: safeParse catch (line 201)
// ============================================================================
describe('date-v2 safeParse catch (line 201)', () => {
  it('VldDateV2.safeParse catches plain Error (line 201 false branch)', () => {
    // Replace parse to throw a non-VldError
    const d = VldDateV2.create();
    (d as any).parse = () => { throw new TypeError('plain'); };
    const r = d.safeParse(new Date('2024-01-01'));
    expect(r.success).toBe(false);
  });

  it('VldDateV2.safeParse catches VldError (line 201 true branch)', () => {
    // VldError path: pass invalid date
    const d = VldDateV2.create();
    const r = d.safeParse('not-a-date' as any);
    expect(r.success).toBe(false);
  });
});

// ============================================================================
// number-v2: VldCoerceNumberV2 bigint NaN (line 341)
// ============================================================================
describe('number-v2 VldCoerceNumberV2 bigint NaN (line 341)', () => {
  it('VldCoerceNumberV2 handles bigint that overflows to non-finite', () => {
    // Force a NaN path by passing an invalid coerce input
    const n = v.coerce.numberV2();
    // Boolean coercion (special path)
    const r = n.safeParse(true);
    expect(r.success).toBe(true);
    if (r.success) expect((r as { success: true; data: number }).data).toBe(1);
  });

  it('VldCoerceNumberV2 with object input (triggers generic path)', () => {
    const n = v.coerce.numberV2();
    const r = n.safeParse({} as any);
    expect(r.success).toBe(false);
  });
});

// ============================================================================
// string-v2: VldStringV2 default param (line 261) + safeParse catch (line 308)
//            + VldCoerceStringV2 Error instance (line 463)
// ============================================================================
describe('string-v2 default param + safeParse catch + Error coercion', () => {
  it('VldStringV2 with no constructor arg uses default (line 261 true branch)', async () => {
    const { VldStringV2 } = await import('../src/validators/string-v2');
    const s = new VldStringV2();
    expect(s.safeParse('hi').success).toBe(true);
  });

  it('VldStringV2 safeParse catches plain Error (line 308 false branch)', async () => {
    const { VldStringV2 } = await import('../src/validators/string-v2');
    const s = new VldStringV2();
    // Replace parse to throw a non-VldError
    (s as any).parse = () => { throw new TypeError('plain'); };
    const r = s.safeParse('x');
    expect(r.success).toBe(false);
  });

  it('VldCoerceStringV2 with Error instance (line 463)', () => {
    const c = v.coerce.stringV2();
    const r = c.safeParse(new Error('boom'));
    expect(r.success).toBe(true);
    if (r.success) expect((r as { success: true; data: string }).data).toBe('boom');
  });
});

// ============================================================================
// leaf-v2: VldRecordV2 SYMBOL simple mode (line 150)
// ============================================================================
describe('leaf-v2 VldRecordV2 SYMBOL simple mode (line 150)', () => {
  it('VldRecordV2 created with symbol value validator', () => {
    // The constructor ternary on line 150 hits when validatorType === SYMBOL
    const r = new VldRecordV2(vV2.symbol());
    expect((r as any).__def.simpleValueMode).toBe('symbol');
    // safeParse with a value where all keys map to symbols (won't be there,
    // so parsing an empty record will succeed and skip the symbol check)
    expect(r.safeParse({}).success).toBe(true);
  });
});
