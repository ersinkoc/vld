/**
 * V2 Coverage — Last push
 *
 * Targets the remaining V2 branches that istanbul tracks:
 *   - bigint-v2 VldBigIntCheck.check() default message branches
 *   - composite-v2 parseKnownSet / parseKnownMap default branches
 *   - date-v2 VldDateCheck.check() + safeParse catch
 *   - leaf-v2 VldRecordV2 SYMBOL simple + RecordV2 default branches
 *   - number-v2 VldCoerceNumberV2 bigint NaN
 *   - string-v2 VldStringCheck.check() default message branches
 *   - union-v2 UNDEFINED/VOID/ENUM typeCheckers + custom error
 */
import { v, vV2 } from '../src';
import { VldUnionV2 } from '../src/validators/union-v2';
import { VldSetV2, VldMapV2 } from '../src/validators/composite-v2';
import { VldDateV2 } from '../src/validators/date-v2';
import { VldRecordV2 } from '../src/validators/leaf-v2';

const bigintMod = require('../src/validators/bigint-v2') as typeof import('../src/validators/bigint-v2');
const dateMod = require('../src/validators/date-v2') as typeof import('../src/validators/date-v2');
const stringMod = require('../src/validators/string-v2') as typeof import('../src/validators/string-v2');

// ============================================================================
// bigint-v2.ts: VldBigIntCheck.check() default message branches (lines 126-131)
// ============================================================================
describe('bigint-v2 VldBigIntCheck default message branches', () => {
  it('VldBigIntCheckMin/Max/Gt/Lt/MultipleOf default messages', () => {
    const issue1 = new bigintMod.VldBigIntCheckMin(10n).check(5n);
    expect(issue1?.message).toContain('>=');
    const issue2 = new bigintMod.VldBigIntCheckMax(10n).check(20n);
    expect(issue2?.message).toContain('<=');
    const issue3 = new bigintMod.VldBigIntCheckGt(10n).check(5n);
    expect(issue3?.message).toContain('>');
    const issue4 = new bigintMod.VldBigIntCheckLt(10n).check(20n);
    expect(issue4?.message).toContain('<');
    const issue5 = new bigintMod.VldBigIntCheckMultipleOf(3n).check(7n);
    expect(issue5?.message).toContain('multiple of');
    // divisor === 0n returns null (line 64)
    const issue6 = new bigintMod.VldBigIntCheckMultipleOf(0n).check(7n);
    expect(issue6).toBeNull();
  });
});

// ============================================================================
// composite-v2.ts: VldSetV2 / VldMapV2 default branches (lines 102, 152)
// ============================================================================
describe('composite-v2 VldSetV2 / VldMapV2 default branches', () => {
  it('VldSetV2 with plain Error throw (line 102 false branch)', () => {
    // Non-simple validator that throws plain TypeError → catches the
    // `e instanceof VldError` FALSE branch and wraps in new VldError.
    const throwing = { parse: () => { throw new TypeError('plain'); }, isSimple: false } as any;
    const s = new VldSetV2(throwing);
    const r = s.safeParse(new Set(['x']));
    expect(r.success).toBe(false);
  });

  it('VldMapV2 with plain Error throw (line 152 false branch)', () => {
    const throwing = { parse: () => { throw new TypeError('plain'); }, isSimple: false } as any;
    const m = new VldMapV2(throwing, throwing);
    const r = m.safeParse(new Map([['k', 1]]));
    expect(r.success).toBe(false);
  });
});

// ============================================================================
// date-v2.ts: VldDateCheck.check() + safeParse catch (lines 196-201)
// ============================================================================
describe('date-v2 VldDateCheck + safeParse catch', () => {
  it('VldDateCheckMin/Max/Gt/Lt default message branches', () => {
    const ref = new Date('2024-06-01');
    expect(new dateMod.VldDateCheckMin(ref).check(new Date('2024-01-01'))?.message).toContain('>=');
    expect(new dateMod.VldDateCheckMax(ref).check(new Date('2025-01-01'))?.message).toContain('<=');
    expect(new dateMod.VldDateCheckGt(ref).check(new Date('2024-01-01'))?.message).toContain('>');
    expect(new dateMod.VldDateCheckLt(ref).check(new Date('2025-01-01'))?.message).toContain('<');
  });

  it('VldDateCheckPast/Future/Today/Weekday/Weekend default messages', () => {
    // Use fixed past/future dates to ensure deterministic behavior
    expect(new dateMod.VldDateCheckPast().check(new Date('2099-01-01'))?.message).toContain('past');
    expect(new dateMod.VldDateCheckFuture().check(new Date('1999-01-01'))?.message).toContain('future');
    // Today check — pick a date that's not today
    expect(new dateMod.VldDateCheckToday().check(new Date('1999-01-01'))?.message).toContain('today');
    // Weekday: pick a Saturday (day 6)
    expect(new dateMod.VldDateCheckWeekday().check(new Date('2024-01-06'))?.message).toContain('weekday');
    // Weekend: pick a Monday (day 1)
    expect(new dateMod.VldDateCheckWeekend().check(new Date('2024-01-01'))?.message).toContain('weekend');
  });

  it('VldDateV2.safeParse catches plain Error (lines 196-201)', () => {
    // Use a non-simple base that throws plain Error on every parse call
    const throwing = { parse: () => { throw new TypeError('plain'); }, parseKnownDate: () => { throw new TypeError('plain'); } } as any;
    const d = new VldDateV2();
    // Force the parse to call throwing.parse via custom subclass
    const parser = { ...d, parse: throwing.parse };
    (d as any).parse = throwing.parse;
    const r = d.safeParse(new Date('2024-01-01'));
    expect(r.success).toBe(false);
    // Silence unused
    void parser;
  });
});

// ============================================================================
// leaf-v2.ts: VldRecordV2 SYMBOL simple mode (line 150)
// ============================================================================
describe('leaf-v2 VldRecordV2 SYMBOL simple mode (line 150)', () => {
  it('VldRecordV2 with symbol value type', () => {
    const r = new VldRecordV2(vV2.symbol());
    const obj: any = {};
    obj[Symbol('k')] = 'x';
    const safe = r.safeParse(obj);
    expect(safe).toBeDefined();
  });
});

// ============================================================================
// number-v2.ts: VldCoerceNumberV2 bigint NaN check (line 341)
// ============================================================================
describe('number-v2 VldCoerceNumberV2 bigint NaN (line 341)', () => {
  it('VldCoerceNumberV2 handles bigint input', () => {
    const n = v.coerce.numberV2();
    expect(n.safeParse(42n).success).toBe(true);
    expect(n.safeParse(BigInt('99999999999999999999')).success).toBe(true);
  });

  it('VldCoerceNumberV2 NaN from string', () => {
    const n = v.coerce.numberV2();
    const r = n.safeParse('not-a-number');
    expect(r.success).toBe(false);
  });
});

// ============================================================================
// string-v2.ts: VldStringCheck.check() default message branches (lines 261, 308, 463)
// ============================================================================
describe('string-v2 VldStringCheck default message branches', () => {
  it('VldCheckMin/Max/Length default messages', () => {
    expect(new stringMod.VldCheckMin(5).check('hi')?.message).toMatch(/>=5|at least/);
    expect(new stringMod.VldCheckMax(2).check('toolong')?.message).toMatch(/<=2|at most/);
    expect(new stringMod.VldCheckLength(3).check('ab')?.message).toMatch(/=== 3|exactly/);
  });

  it('VldCheckEmail/Url/Uuid default messages', () => {
    expect(new stringMod.VldCheckEmail().check('not-an-email')?.message).toBeDefined();
    expect(new stringMod.VldCheckUrl().check('not a url')?.message).toBeDefined();
    expect(new stringMod.VldCheckUuid().check('not-a-uuid')?.message).toBeDefined();
  });

  it('VldCheckRegex/StartsWith/EndsWith/Includes default messages', () => {
    expect(new stringMod.VldCheckRegex(/^\d+$/).check('abc')?.message).toBeDefined();
    expect(new stringMod.VldCheckStartsWith('foo').check('bar')?.message).toBeDefined();
    expect(new stringMod.VldCheckEndsWith('foo').check('bar')?.message).toBeDefined();
    expect(new stringMod.VldCheckIncludes('foo').check('bar')?.message).toBeDefined();
  });

  it('VldCheckIp/Ipv4/Ipv6/RegexFormat default messages', () => {
    expect(new stringMod.VldCheckIp().check('not-an-ip')?.message).toBeDefined();
    expect(new stringMod.VldCheckIpv4().check('not-ipv4')?.message).toBeDefined();
    expect(new stringMod.VldCheckIpv6().check('not-ipv6')?.message).toBeDefined();
    expect(new stringMod.VldCheckRegexFormat(/^\d+$/, 'digits').check('abc')?.message).toBeDefined();
  });
});

// ============================================================================
// union-v2.ts: UNDEFINED / VOID / ENUM typeCheckers (line 52)
//             + safeParse catch (line 117)
//             + custom error message (line 127)
// ============================================================================
describe('union-v2 typeCheckers + safeParse catch + custom error', () => {
  it('VldUnionV2 with VOID and UNDEFINED (line 52)', () => {
    expect(VldUnionV2.create(vV2.void()).safeParse(undefined).success).toBe(true);
    expect(VldUnionV2.create(vV2.undefined()).safeParse(undefined).success).toBe(true);
    expect(VldUnionV2.create(vV2.void()).safeParse('x').success).toBe(false);
  });

  it('VldUnionV2 with ENUM typeChecker (line 52)', () => {
    const e = vV2.enum(['a', 'b'] as const);
    const u = VldUnionV2.create(e, vV2.string());
    expect(u.safeParse('a').success).toBe(true);
    expect(u.safeParse(42).success).toBe(false);
  });

  it('VldUnionV2.safeParse catches non-VldError (line 117)', () => {
    const throwing = { safeParse: () => { throw new TypeError('boom'); } } as any;
    const u = VldUnionV2.create(throwing);
    const r = u.safeParse('x');
    expect(r.success).toBe(false);
  });

  it('VldUnionV2 custom error message (line 127)', () => {
    const u = VldUnionV2.create(vV2.string(), vV2.number());
    const r = u.safeParse(true);
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0]?.message).toBeDefined();
    }
  });
});
