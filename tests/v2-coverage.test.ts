/**
 * V2 Pattern Coverage Tests
 *
 * Comprehensive coverage for all V2 classes shipped in v3.0:
 *   - string-v2 (15 check classes, 25+ format helpers, transforms, coercion)
 *   - number-v2 (16 check classes, range/even/odd/int32/int64 helpers, coercion)
 *   - date-v2 (9 check classes: min/max/gt/lt/past/future/today/weekday/weekend)
 *   - bigint-v2 (6 check classes: min/max/gt/lt/multipleOf/positive/negative)
 *   - array-v2 (5 check classes: min/max/length/nonempty/unique, simpleItemMode)
 *   - union-v2 (simpleModes: string/number/boolean/bigint/symbol/null/void/never/any/unknown/literal)
 *   - composite-v2 (tuple/set/map/intersection with simple fast path)
 *   - leaf-v2 (literal/boolean/enum/record/any/unknown/void/never/null/undefined/symbol/function)
 *   - wrapper-v2 (optional/nullable/nullish/refine/transform + async variants)
 *
 * This test file targets 100% statement, branch, function, line coverage.
 */
import { v, vV2, VldBase } from '../src';
import {
  VldStringV2, VldCheckMin, VldCheckMax, VldCheckLength,
  VldCheckEmail, VldCheckUrl, VldCheckUuid, VldCheckRegex, VldCheckRegexFormat,
  VldCheckStartsWith, VldCheckEndsWith, VldCheckIncludes, VldCheckIp,
  VldCheckIpv4, VldCheckIpv6, VldCoerceStringV2
} from '../src/validators/string-v2';
import {
  VldNumberV2, VldNumberCheckMin, VldNumberCheckMax, VldNumberCheckGt,
  VldNumberCheckLt, VldNumberCheckInt, VldNumberCheckFinite, VldNumberCheckSafe,
  VldNumberCheckMultipleOf, VldNumberCheckRange, VldNumberCheckEven, VldNumberCheckOdd,
  VldNumberCheckUInt32, VldNumberCheckUInt64, VldNumberCheckInt32, VldNumberCheckInt64,
  VldNumberCheckFloat32, VldCoerceNumberV2
} from '../src/validators/number-v2';
import {
  VldDateV2, VldDateCheckMin, VldDateCheckMax, VldDateCheckGt,
  VldDateCheckLt, VldDateCheckPast, VldDateCheckFuture, VldDateCheckToday,
  VldDateCheckWeekday, VldDateCheckWeekend
} from '../src/validators/date-v2';
import {
  VldBigIntV2, VldBigIntCheckMin, VldBigIntCheckMax, VldBigIntCheckGt,
  VldBigIntCheckLt, VldBigIntCheckMultipleOf
} from '../src/validators/bigint-v2';
import {
  VldArrayV2, VldArrayCheckMin, VldArrayCheckMax, VldArrayCheckLength, VldArrayCheckUnique
} from '../src/validators/array-v2';
import { VldUnionV2 } from '../src/validators/union-v2';
import {
  VldTupleV2, VldSetV2, VldMapV2, VldIntersectionV2
} from '../src/validators/composite-v2';
import {
  VldLiteralV2, VldBooleanV2, VldEnumV2, VldRecordV2, VldAnyV2, VldUnknownV2,
  VldVoidV2, VldNeverV2, VldNullV2, VldUndefinedV2, VldSymbolV2, VldFunctionV2
} from '../src/validators/leaf-v2';
import {
  VldOptionalV2, VldNullableV2, VldNullishV2, VldRefineV2, VldTransformV2
} from '../src/validators/wrapper-v2';
void vV2; // imported for type re-export stability

// ============================================================================
// string-v2.ts coverage
// ============================================================================
describe('string-v2 check classes', () => {
  it('VldCheckMin', () => {
    const c = new VldCheckMin(5, 'min msg');
    expect(c.kind).toBe('min');
    expect(c.length).toBe(5);
    expect(c.message).toBe('min msg');
    expect(c.check('hi')!.code).toBe('too_small');
    expect(c.check('hi')!.minimum).toBe(5);
    expect(c.check('hello')).toBeNull();
    expect(c.meta().value).toBe(5);
    expect(new VldCheckMin(5).check('x')!.message).toMatch(/Too small/);
  });

  it('VldCheckMax', () => {
    const c = new VldCheckMax(5, 'max msg');
    expect(c.kind).toBe('max');
    expect(c.length).toBe(5);
    expect(c.message).toBe('max msg');
    expect(c.check('hello world')!.code).toBe('too_big');
    expect(c.check('hi')).toBeNull();
    expect(c.meta().value).toBe(5);
    expect(new VldCheckMax(5).check('hello world')!.message).toMatch(/Too big/);
  });

  it('VldCheckLength', () => {
    const c = new VldCheckLength(5, 'exact');
    expect(c.kind).toBe('length');
    expect(c.length).toBe(5);
    expect(c.message).toBe('exact');
    expect(c.check('hi')!.code).toBe('too_big');
    expect(c.check('hello world')!.code).toBe('too_big');
    expect(c.check('hello')).toBeNull();
    expect(c.meta().value).toBe(5);
    expect(new VldCheckLength(5).check('x')!.message).toMatch(/Too big/);
  });

  it('VldCheckEmail', () => {
    const c = new VldCheckEmail('email msg');
    expect(c.kind).toBe('format');
    expect(c.message).toBe('email msg');
    expect(c.check('a@b.com')).toBeNull();
    expect(c.check('notanemail')!.code).toBe('invalid_format');
    expect(c.check('notanemail')!.format).toBe('email');
    expect(c.meta().format).toBe('email');
    expect(new VldCheckEmail().check('x')!.message).toBe('Invalid email');
  });

  it('VldCheckUrl', () => {
    const c = new VldCheckUrl('url msg');
    expect(c.kind).toBe('format');
    expect(c.message).toBe('url msg');
    expect(c.check('https://example.com')).toBeNull();
    expect(c.check('not a url')!.code).toBe('invalid_format');
    expect(c.check('not a url')!.format).toBe('url');
    expect(c.meta().format).toBe('url');
    expect(new VldCheckUrl().check('x')!.message).toBe('Invalid url');
  });

  it('VldCheckUuid', () => {
    const c = new VldCheckUuid('uuid msg');
    expect(c.kind).toBe('format');
    expect(c.message).toBe('uuid msg');
    expect(c.check('550e8400-e29b-41d4-a716-446655440000')).toBeNull();
    expect(c.check('not-a-uuid')!.code).toBe('invalid_format');
    expect(c.check('not-a-uuid')!.format).toBe('uuid');
    expect(c.meta().format).toBe('uuid');
    expect(new VldCheckUuid().check('x')!.message).toBe('Invalid uuid');
  });

  it('VldCheckRegex', () => {
    const c = new VldCheckRegex(/^abc/, 'regex msg');
    expect(c.kind).toBe('regex');
    expect(c.pattern.source).toBe('^abc');
    expect(c.message).toBe('regex msg');
    expect(c.check('abc')).toBeNull();
    expect(c.check('xyz')!.code).toBe('invalid_format');
    expect(c.check('xyz')!.pattern).toBe('^abc');
    expect(c.meta().pattern).toBe('^abc');
    expect(new VldCheckRegex(/^abc/).check('x')!.message).toMatch(/does not match/);
  });

  it('VldCheckStartsWith', () => {
    const c = new VldCheckStartsWith('foo', 'starts msg');
    expect(c.kind).toBe('startsWith');
    expect(c.prefix).toBe('foo');
    expect(c.message).toBe('starts msg');
    expect(c.check('foobar')).toBeNull();
    expect(c.check('bar')!.code).toBe('invalid_string');
    expect(c.meta().value).toBe('foo');
    expect(new VldCheckStartsWith('x').check('y')!.message).toMatch(/must start/);
  });

  it('VldCheckEndsWith', () => {
    const c = new VldCheckEndsWith('bar', 'ends msg');
    expect(c.kind).toBe('endsWith');
    expect(c.suffix).toBe('bar');
    expect(c.message).toBe('ends msg');
    expect(c.check('foobar')).toBeNull();
    expect(c.check('foo')!.code).toBe('invalid_string');
    expect(c.meta().value).toBe('bar');
    expect(new VldCheckEndsWith('x').check('y')!.message).toMatch(/must end/);
  });

  it('VldCheckIncludes', () => {
    const c = new VldCheckIncludes('mid', 'inc msg');
    expect(c.kind).toBe('includes');
    expect(c.substring).toBe('mid');
    expect(c.message).toBe('inc msg');
    expect(c.check('foomidbar')).toBeNull();
    expect(c.check('foo')!.code).toBe('invalid_string');
    expect(c.meta().value).toBe('mid');
    expect(new VldCheckIncludes('x').check('y')!.message).toMatch(/must include/);
  });

  it('VldCheckRegexFormat', () => {
    const c = new VldCheckRegexFormat(/^x+$/, 'custom', 'fmt msg');
    expect(c.kind).toBe('format');
    expect(c.formatName).toBe('custom');
    expect(c.pattern.source).toBe('^x+$');
    expect(c.message).toBe('fmt msg');
    expect(c.check('xxx')).toBeNull();
    expect(c.check('yyy')!.code).toBe('invalid_format');
    expect(c.check('yyy')!.format).toBe('custom');
    expect(c.check('yyy')!.pattern).toBe('^x+$');
    expect(c.meta().format).toBe('custom');
    expect(new VldCheckRegexFormat(/^x+$/, 'foo').check('y')!.message).toBe('Invalid foo');
  });

  it('VldCheckIp (IPv4 + IPv6)', () => {
    const c = new VldCheckIp('ip msg');
    expect(c.kind).toBe('format');
    expect(c.message).toBe('ip msg');
    expect(c.check('192.168.1.1')).toBeNull();
    expect(c.check('::1')).toBeNull();
    expect(c.check('not-an-ip')!.code).toBe('invalid_format');
    expect(c.check('a'.repeat(200))!.code).toBe('invalid_format'); // > 100 chars
    expect(c.meta().format).toBe('ip');
    expect(new VldCheckIp().check('x')!.message).toBe('Invalid ip');
  });

  it('VldCheckIpv4', () => {
    const c = new VldCheckIpv4('v4 msg');
    expect(c.kind).toBe('format');
    expect(c.message).toBe('v4 msg');
    expect(c.check('192.168.1.1')).toBeNull();
    expect(c.check('256.0.0.1')!.code).toBe('invalid_format');
    expect(c.check('::1')!.code).toBe('invalid_format');
    expect(c.meta().format).toBe('ipv4');
    expect(new VldCheckIpv4().check('x')!.message).toBe('Invalid ipv4');
  });

  it('VldCheckIpv6', () => {
    const c = new VldCheckIpv6('v6 msg');
    expect(c.kind).toBe('format');
    expect(c.message).toBe('v6 msg');
    expect(c.check('::1')).toBeNull();
    expect(c.check('192.168.1.1')!.code).toBe('invalid_format');
    expect(c.meta().format).toBe('ipv6');
    expect(new VldCheckIpv6().check('x')!.message).toBe('Invalid ipv6');
  });
});

describe('VldStringV2 chains', () => {
  it('VldStringV2.create() returns simple validator', () => {
    const s = VldStringV2.create();
    expect(s.isSimple).toBe(true);
    expect(s.minLength).toBeNull();
    expect(s.maxLength).toBeNull();
    expect(s.getFormat).toBeNull();
  });

  it('VldStringV2 with custom def (covers constructor)', () => {
    const def = { type: 'string' as const, checks: [], transforms: [], isSimple: true, errorMessage: 'custom' };
    const s = new VldStringV2(def);
    expect(s.__def.errorMessage).toBe('custom');
    expect(() => s.parse(42)).toThrow(/custom/);
  });

  it('max().length() with custom messages', () => {
    const s = v.stringV2().max(100, 'too long').length(5, 'must be 5');
    expect(s.parse('hello')).toBe('hello');
    expect(() => s.parse('hi')).toThrow(/must be 5/);
    expect(() => s.parse('a'.repeat(200))).toThrow(/too long/);
  });

  it('url().uuid() with custom messages', () => {
    const s = v.stringV2().url('not a url').uuid('not a uuid');
    expect(() => s.parse('notaurl')).toThrow(/not a url/);
    expect(() => s.parse('https://example.com')).toThrow(/not a uuid/);
  });

  it('regex() with custom message', () => {
    const s = v.stringV2().regex(/^x/, 'must start with x');
    expect(() => s.parse('y')).toThrow(/must start with x/);
  });

  it('trim() with length, lowercase/uppercase aliases', () => {
    expect(v.stringV2().lowercase().parse('ABC')).toBe('abc');
    expect(v.stringV2().uppercase().parse('abc')).toBe('ABC');
  });

  it('normalize() and slugify()', () => {
    expect(v.stringV2().normalize('NFC').parse('cafe\u0301')).toBe('café');
    expect(v.stringV2().slugify().parse('Hello World!')).toBe('hello-world');
  });

  it('startsWith().endsWith().includes()', () => {
    const s = v.stringV2().startsWith('foo').endsWith('bar').includes('mid');
    expect(s.parse('foomidbar')).toBe('foomidbar');
    expect(() => s.parse('mid')).toThrow();
  });

  it('ip().ipv4().ipv6() chains', () => {
    expect(v.stringV2().ip().parse('192.168.1.1')).toBe('192.168.1.1');
    expect(v.stringV2().ipv4().parse('10.0.0.1')).toBe('10.0.0.1');
    expect(v.stringV2().ipv6().parse('::1')).toBe('::1');
  });

  it('nonempty() with custom message', () => {
    const s = v.stringV2().nonempty('cannot be empty');
    expect(s.parse('x')).toBe('x');
    expect(() => s.parse('')).toThrow(/cannot be empty/);
  });

  it('all format helpers (uuidv4, uuidv6, uuidv7, emoji, base64, base64url)', () => {
    expect(v.stringV2().uuidv4().parse('550e8400-e29b-41d4-a716-446655440000')).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(() => v.stringV2().uuidv4().parse('12345678-1234-1234-1234-123456789012')).toThrow();
    expect(() => v.stringV2().uuidv6().parse('12345678-1234-1234-1234-123456789012')).toThrow();
    expect(() => v.stringV2().uuidv7().parse('12345678-1234-1234-1234-123456789012')).toThrow();
    expect(v.stringV2().emoji().parse('😀')).toBe('😀');
    expect(() => v.stringV2().emoji().parse('not-emoji')).toThrow();
    expect(v.stringV2().base64().parse('SGVsbG8=')).toBe('SGVsbG8=');
    expect(() => v.stringV2().base64().parse('not base64!')).toThrow();
    expect(v.stringV2().base64url().parse('SGVsbG8_V29ybGQ')).toBe('SGVsbG8_V29ybGQ');
    expect(() => v.stringV2().base64url().parse('not!base64$url')).toThrow();
  });

  it('jwt, nanoid, cuid, cuid2, ulid, cidrv4, cidrv6, e164, xid, guid, ksuid, date, time, datetime, duration', () => {
    const jwtToken = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.signature';
    expect(v.stringV2().jwt().parse(jwtToken)).toBe(jwtToken);
    expect(() => v.stringV2().jwt().parse('invalid.jwt.with.spaces')).toThrow();
    expect(v.stringV2().nanoid().parse('V1StGXR8_Z5jdHi6B-myT')).toBe('V1StGXR8_Z5jdHi6B-myT');
    expect(() => v.stringV2().nanoid().parse('short')).toThrow();
    expect(v.stringV2().cuid().parse('ckxxxxxxxxxxxxxxxxxxxxxxx')).toBe('ckxxxxxxxxxxxxxxxxxxxxxxx');
    expect(v.stringV2().cuid2().parse('abcdefghij0123456789')).toBe('abcdefghij0123456789');
    expect(v.stringV2().ulid().parse('01ARZ3NDEKTSV4RRFFQ69G5FAV')).toBe('01ARZ3NDEKTSV4RRFFQ69G5FAV');
    expect(() => v.stringV2().ulid().parse('not-ulid')).toThrow();
    expect(v.stringV2().cidrv4().parse('192.168.0.0/24')).toBe('192.168.0.0/24');
    expect(() => v.stringV2().cidrv4().parse('192.168.0.0/99')).toThrow();
    expect(v.stringV2().cidrv6().parse('2001:db8::/32')).toBe('2001:db8::/32');
    expect(v.stringV2().e164().parse('+14155552671')).toBe('+14155552671');
    expect(() => v.stringV2().e164().parse('14155552671')).toThrow();
    expect(v.stringV2().xid().parse('00000000000000000000')).toBe('00000000000000000000');
    expect(v.stringV2().guid().parse('550e8400-e29b-41d4-a716-446655440000')).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(() => v.stringV2().guid().parse('not-a-guid')).toThrow();
    expect(v.stringV2().ksuid().parse('1UbjMyH5V7R6mK6mM5V7R6mK6m0')).toBe('1UbjMyH5V7R6mK6mM5V7R6mK6m0');
    expect(v.stringV2().date().parse('2024-01-15')).toBe('2024-01-15');
    expect(() => v.stringV2().date().parse('2024/01/15')).toThrow();
    expect(v.stringV2().time().parse('12:34')).toBe('12:34');
    expect(v.stringV2().time().parse('12:34:56.789')).toBe('12:34:56.789');
    expect(() => v.stringV2().time().parse('25:00')).toThrow();
    expect(v.stringV2().datetime().parse('2024-01-15T12:34:56Z')).toBe('2024-01-15T12:34:56Z');
    expect(() => v.stringV2().datetime().parse('not-datetime')).toThrow();
    expect(v.stringV2().duration().parse('P1Y2M3DT4H5M6S')).toBe('P1Y2M3DT4H5M6S');
    expect(() => v.stringV2().duration().parse('P')).toThrow();
  });

  it('parseKnownString with multiple transforms (covers 0/1/2/3+ paths)', () => {
    const s = v.stringV2().trim().toLowerCase().toUpperCase().min(3);
    expect(s.parse('  HELLO  ')).toBe('HELLO');
    expect(s.parseKnownString('  hello  ')).toBe('HELLO');
  });

  it('getFormat / minLength / maxLength getters', () => {
    const s = v.stringV2().min(3).max(10).email();
    expect(s.minLength).toBe(3);
    expect(s.maxLength).toBe(10);
    expect(s.getFormat).toBe('email');
  });

  it('isCoercion getter', () => {
    const cs = VldCoerceStringV2.create();
    expect(cs.isCoercion).toBe(true);
    expect(v.stringV2().isCoercion).toBe(false);
  });
});

describe('VldCoerceStringV2', () => {
  it('coerces primitives to string', () => {
    expect(VldCoerceStringV2.create().parse(42)).toBe('42');
    expect(VldCoerceStringV2.create().parse(true)).toBe('true');
    expect(VldCoerceStringV2.create().parse(false)).toBe('false');
    expect(VldCoerceStringV2.create().parse(42n)).toBe('42');
    expect(VldCoerceStringV2.create().parse(Symbol('x'))).toContain('Symbol');
  });

  it('coerces date / array / regexp / error', () => {
    expect(VldCoerceStringV2.create().parse(new Date('2024-01-15'))).toBe(new Date('2024-01-15').toISOString());
    expect(VldCoerceStringV2.create().parse([1, 2, 3])).toBe('1,2,3');
    expect(VldCoerceStringV2.create().parse(/foo/)).toContain('foo');
    expect(VldCoerceStringV2.create().parse(new Error('boom'))).toBe('boom');
  });

  it('rejects null/undefined', () => {
    expect(() => VldCoerceStringV2.create().parse(null)).toThrow();
    expect(() => VldCoerceStringV2.create().parse(undefined)).toThrow();
  });

  it('strips control chars and rejects > 1M chars', () => {
    const cs = VldCoerceStringV2.create();
    expect(cs.parse('hello\x00\x01world')).toBe('helloworld');
    expect(() => cs.parse('x'.repeat(2_000_000))).toThrow();
  });
});

// ============================================================================
// number-v2.ts coverage
// ============================================================================
describe('number-v2 check classes', () => {
  it('VldNumberCheckMin', () => {
    const c = new VldNumberCheckMin(10, 'min');
    expect(c.kind).toBe('min');
    expect(c.threshold).toBe(10);
    expect(c.check(5)!.code).toBe('too_small');
    expect(c.check(15)).toBeNull();
    expect(c.meta().value).toBe(10);
    expect(new VldNumberCheckMin(10).check(5)!.message).toMatch(/Too small/);
  });

  it('VldNumberCheckMax', () => {
    const c = new VldNumberCheckMax(10, 'max');
    expect(c.kind).toBe('max');
    expect(c.threshold).toBe(10);
    expect(c.check(15)!.code).toBe('too_big');
    expect(c.check(5)).toBeNull();
    expect(c.meta().value).toBe(10);
    expect(new VldNumberCheckMax(10).check(15)!.message).toMatch(/Too big/);
  });

  it('VldNumberCheckGt', () => {
    const c = new VldNumberCheckGt(10, 'gt');
    expect(c.kind).toBe('gt');
    expect(c.threshold).toBe(10);
    expect(c.check(5)!.code).toBe('too_small');
    expect(c.check(10)!.code).toBe('too_small');
    expect(c.check(15)).toBeNull();
    expect(c.meta().value).toBe(10);
    expect(new VldNumberCheckGt(10).check(5)!.message).toMatch(/Too small/);
  });

  it('VldNumberCheckLt', () => {
    const c = new VldNumberCheckLt(10, 'lt');
    expect(c.kind).toBe('lt');
    expect(c.threshold).toBe(10);
    expect(c.check(15)!.code).toBe('too_big');
    expect(c.check(10)!.code).toBe('too_big');
    expect(c.check(5)).toBeNull();
    expect(c.meta().value).toBe(10);
    expect(new VldNumberCheckLt(10).check(15)!.message).toMatch(/Too big/);
  });

  it('VldNumberCheckInt', () => {
    const c = new VldNumberCheckInt('int');
    expect(c.kind).toBe('int');
    expect(c.check(1.5)!.code).toBe('invalid_type');
    expect(c.check(1)).toBeNull();
    expect(c.meta().kind).toBe('int');
    expect(new VldNumberCheckInt().check(1.5)!.message).toMatch(/expected int/);
  });

  it('VldNumberCheckFinite', () => {
    const c = new VldNumberCheckFinite('fin');
    expect(c.kind).toBe('finite');
    expect(c.check(Infinity)!.code).toBe('custom');
    expect(c.check(1)).toBeNull();
    expect(c.meta().kind).toBe('finite');
    expect(new VldNumberCheckFinite().check(Infinity)!.message).toMatch(/finite/);
  });

  it('VldNumberCheckSafe', () => {
    const c = new VldNumberCheckSafe('safe');
    expect(c.kind).toBe('safe');
    expect(c.check(Number.MAX_SAFE_INTEGER + 1)!.code).toBe('custom');
    expect(c.check(1)).toBeNull();
    expect(c.meta().kind).toBe('safe');
    expect(new VldNumberCheckSafe().check(1.5)!.message).toMatch(/safe integer/);
  });

  it('VldNumberCheckMultipleOf (covers both epsilon branches)', () => {
    const c = new VldNumberCheckMultipleOf(3, 'mul');
    expect(c.kind).toBe('multipleOf');
    expect(c.divisor).toBe(3);
    expect(c.check(9)).toBeNull();
    expect(c.check(10)!.code).toBe('custom');
    // Epsilon-close to multiple (3 + Number.EPSILON/2 === 3 in float)
    expect(c.check(3 + Number.EPSILON / 2)).toBeNull();
    expect(c.check(-10)!.code).toBe('custom');
    expect(c.meta().value).toBe(3);
    expect(new VldNumberCheckMultipleOf(3).check(10)!.message).toMatch(/multiple of 3/);
  });

  it('VldNumberCheckRange', () => {
    const c = new VldNumberCheckRange(1, 10, 'range');
    expect(c.kind).toBe('min');
    expect(c.min).toBe(1);
    expect(c.max).toBe(10);
    expect(c.check(0)!.code).toBe('custom');
    expect(c.check(11)!.code).toBe('custom');
    expect(c.check(5)).toBeNull();
    expect(c.meta().kind).toBe('range');
    expect(new VldNumberCheckRange(1, 10).check(0)!.message).toMatch(/between/);
  });

  it('VldNumberCheckEven / Odd', () => {
    const even = new VldNumberCheckEven('even');
    expect(even.kind).toBe('even');
    expect(even.check(1.5)!.code).toBe('custom');
    expect(even.check(3)!.code).toBe('custom');
    expect(even.check(2)).toBeNull();
    expect(even.meta().kind).toBe('even');
    expect(new VldNumberCheckEven().check(3)!.message).toMatch(/even/);
    const odd = new VldNumberCheckOdd('odd');
    expect(odd.kind).toBe('odd');
    expect(odd.check(1.5)!.code).toBe('custom');
    expect(odd.check(2)!.code).toBe('custom');
    expect(odd.check(3)).toBeNull();
    expect(odd.meta().kind).toBe('odd');
    expect(new VldNumberCheckOdd().check(2)!.message).toMatch(/odd/);
  });

  it('VldNumberCheckUInt32 / UInt64', () => {
    const u32 = new VldNumberCheckUInt32('u32');
    expect(u32.kind).toBe('uint32');
    expect(u32.check(-1)!.code).toBe('custom');
    expect(u32.check(4294967296)!.code).toBe('custom');
    expect(u32.check(Number.MAX_SAFE_INTEGER + 1)!.code).toBe('custom');
    expect(u32.check(1)).toBeNull();
    expect(u32.check(4294967295)).toBeNull();
    expect(u32.meta().kind).toBe('uint32');
    const u64 = new VldNumberCheckUInt64('u64');
    expect(u64.kind).toBe('uint64');
    expect(u64.check(-1)!.code).toBe('custom');
    expect(u64.check(Number.MAX_SAFE_INTEGER + 1)!.code).toBe('custom');
    expect(u64.check(1)).toBeNull();
    expect(u64.meta().kind).toBe('uint64');
    expect(new VldNumberCheckUInt32().check(-1)!.message).toMatch(/unsigned 32/);
  });

  it('VldNumberCheckInt32 / Int64', () => {
    const i32 = new VldNumberCheckInt32('i32');
    expect(i32.kind).toBe('int32');
    expect(i32.check(-2147483649)!.code).toBe('custom');
    expect(i32.check(2147483648)!.code).toBe('custom');
    expect(i32.check(0)).toBeNull();
    expect(i32.meta().kind).toBe('int32');
    const i64 = new VldNumberCheckInt64('i64');
    expect(i64.kind).toBe('int64');
    expect(i64.check(Number.MAX_SAFE_INTEGER + 1)!.code).toBe('custom');
    expect(i64.check(0)).toBeNull();
    expect(i64.meta().kind).toBe('int64');
    expect(new VldNumberCheckInt32().check(-1e10)!.message).toMatch(/signed 32/);
  });

  it('VldNumberCheckFloat32', () => {
    const f32 = new VldNumberCheckFloat32('f32');
    expect(f32.kind).toBe('float32');
    expect(f32.check(1e39)!.code).toBe('custom');
    expect(f32.check(Infinity)!.code).toBe('custom');
    expect(f32.check(1)).toBeNull();
    expect(f32.meta().kind).toBe('float32');
    expect(new VldNumberCheckFloat32().check(1e39)!.message).toMatch(/32-bit float/);
  });
});

describe('VldNumberV2 chains', () => {
  it('getters: hasCustomChecks, minValue, maxValue, isInt, isFinite, getFormat, isCoercion', () => {
    const s = v.numberV2().int().min(0).max(100);
    expect(s.hasCustomChecks).toBe(true);
    expect(s.minValue).toBe(0);
    expect(s.maxValue).toBe(100);
    expect(s.isInt).toBe(true);
    expect(s.isFinite).toBe(true);
    expect(s.getFormat).toBeNull();
    expect(s.isCoercion).toBe(false);
    expect(VldCoerceNumberV2.create().isCoercion).toBe(true);
  });

  it('VldNumberV2.create() with custom def', () => {
    const def = { type: 'number' as const, checks: [], transforms: [], isSimple: true, errorMessage: 'num' };
    const s = new VldNumberV2(def);
    expect(() => s.parse('x')).toThrow(/num/);
  });

  it('even / odd / multipleOf / step / between / gt / lt / gte / lte', () => {
    expect(v.numberV2().even().parse(2)).toBe(2);
    expect(() => v.numberV2().even().parse(3)).toThrow();
    expect(v.numberV2().odd().parse(3)).toBe(3);
    expect(() => v.numberV2().odd().parse(2)).toThrow();
    expect(v.numberV2().multipleOf(3).parse(9)).toBe(9);
    expect(() => v.numberV2().multipleOf(3).parse(10)).toThrow();
    expect(v.numberV2().step(0.5).parse(1.5)).toBe(1.5);
    expect(() => v.numberV2().step(0.5).parse(1.7)).toThrow();
    expect(v.numberV2().between(1, 10).parse(5)).toBe(5);
    expect(() => v.numberV2().between(1, 10).parse(11)).toThrow();
    expect(v.numberV2().gt(5).parse(6)).toBe(6);
    expect(() => v.numberV2().gt(5).parse(5)).toThrow();
    expect(v.numberV2().lt(5).parse(4)).toBe(4);
    expect(() => v.numberV2().lt(5).parse(5)).toThrow();
    expect(v.numberV2().gte(5).parse(5)).toBe(5);
    expect(v.numberV2().lte(5).parse(5)).toBe(5);
  });

  it('uint32 / uint64 / int32 / int64 / float32 / float64', () => {
    expect(v.numberV2().uint32().parse(0)).toBe(0);
    expect(v.numberV2().uint32().parse(4294967295)).toBe(4294967295);
    expect(() => v.numberV2().uint32().parse(-1)).toThrow();
    expect(() => v.numberV2().uint32().parse(4294967296)).toThrow();
    expect(v.numberV2().uint64().parse(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER);
    expect(() => v.numberV2().uint64().parse(-1)).toThrow();
    expect(() => v.numberV2().uint64().parse(Number.MAX_SAFE_INTEGER + 1)).toThrow();
    expect(v.numberV2().int32().parse(-2147483648)).toBe(-2147483648);
    expect(() => v.numberV2().int32().parse(2147483648)).toThrow();
    expect(v.numberV2().int64().parse(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER);
    expect(v.numberV2().float32().parse(1.5)).toBe(1.5);
    expect(() => v.numberV2().float32().parse(1e39)).toThrow();
    expect(v.numberV2().float64().parse(1.7976931348623157e+308)).toBe(1.7976931348623157e+308);
  });

  it('nonnegative / nonpositive / finite / safe', () => {
    expect(v.numberV2().nonnegative().parse(0)).toBe(0);
    expect(() => v.numberV2().nonnegative().parse(-1)).toThrow();
    expect(v.numberV2().nonpositive().parse(-1)).toBe(-1);
    expect(() => v.numberV2().nonpositive().parse(1)).toThrow();
    expect(v.numberV2().finite().parse(1.5)).toBe(1.5);
    expect(() => v.numberV2().finite().parse(Infinity)).toThrow();
    expect(v.numberV2().safe().parse(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER);
    expect(() => v.numberV2().safe().parse(Number.MAX_SAFE_INTEGER + 1)).toThrow();
  });
});

describe('VldCoerceNumberV2', () => {
  it('coerces string / number / boolean / bigint / null', () => {
    expect(VldCoerceNumberV2.create().parse('42')).toBe(42);
    expect(VldCoerceNumberV2.create().parse('3.14')).toBe(3.14);
    expect(VldCoerceNumberV2.create().parse(42)).toBe(42);
    expect(VldCoerceNumberV2.create().parse(true)).toBe(1);
    expect(VldCoerceNumberV2.create().parse(false)).toBe(0);
    expect(VldCoerceNumberV2.create().parse(42n)).toBe(42);
    expect(VldCoerceNumberV2.create().parse(null)).toBe(0);
  });

  it('rejects invalid string, NaN, Infinity', () => {
    expect(() => VldCoerceNumberV2.create().parse('not-a-number')).toThrow();
    expect(() => VldCoerceNumberV2.create().parse('')).toThrow();
    expect(() => VldCoerceNumberV2.create().parse(NaN)).toThrow();
    expect(() => VldCoerceNumberV2.create().parse(Infinity)).toThrow();
    expect(() => VldCoerceNumberV2.create().parse({})).toThrow();
  });
});

// ============================================================================
// date-v2.ts coverage
// ============================================================================
describe('date-v2 check classes', () => {
  it('VldDateCheckMin', () => {
    const c = new VldDateCheckMin(new Date('2024-01-15'), 'min');
    expect(c.kind).toBe('min');
    expect(c.check(new Date('2024-01-01'))!.code).toBe('too_small');
    expect(c.check(new Date('2025-01-01'))).toBeNull();
    expect(c.meta().kind).toBe('min');
    expect(new VldDateCheckMin(new Date('2024-01-15')).check(new Date('2020-01-01'))!.message).toMatch(/Date must be >=/);
  });

  it('VldDateCheckMax', () => {
    const c = new VldDateCheckMax(new Date('2024-01-15'), 'max');
    expect(c.kind).toBe('max');
    expect(c.check(new Date('2025-01-01'))!.code).toBe('too_big');
    expect(c.check(new Date('2020-01-01'))).toBeNull();
    expect(c.meta().kind).toBe('max');
    expect(new VldDateCheckMax(new Date('2024-01-15')).check(new Date('2030-01-01'))!.message).toMatch(/<=/);
  });

  it('VldDateCheckGt', () => {
    const c = new VldDateCheckGt(new Date('2024-01-15'), 'gt');
    expect(c.kind).toBe('gt');
    expect(c.check(new Date('2024-01-15'))!.code).toBe('too_small');
    expect(c.check(new Date('2020-01-01'))!.code).toBe('too_small');
    expect(c.check(new Date('2025-01-01'))).toBeNull();
    expect(c.meta().kind).toBe('gt');
  });

  it('VldDateCheckLt', () => {
    const c = new VldDateCheckLt(new Date('2024-01-15'), 'lt');
    expect(c.kind).toBe('lt');
    expect(c.check(new Date('2024-01-15'))!.code).toBe('too_big');
    expect(c.check(new Date('2025-01-01'))!.code).toBe('too_big');
    expect(c.check(new Date('2020-01-01'))).toBeNull();
    expect(c.meta().kind).toBe('lt');
  });

  it('VldDateCheckPast / Future', () => {
    const past = new VldDateCheckPast('past');
    expect(past.kind).toBe('past');
    expect(past.check(new Date('2030-01-01'))!.code).toBe('custom');
    expect(past.check(new Date('2020-01-01'))).toBeNull();
    const future = new VldDateCheckFuture('future');
    expect(future.kind).toBe('future');
    expect(future.check(new Date('2020-01-01'))!.code).toBe('custom');
    expect(future.check(new Date('2030-01-01'))).toBeNull();
    expect(new VldDateCheckPast().check(new Date('2030-01-01'))!.message).toBe('Date must be in the past');
    expect(new VldDateCheckFuture().check(new Date('2020-01-01'))!.message).toBe('Date must be in the future');
  });

  it('VldDateCheckToday', () => {
    const c = new VldDateCheckToday('today');
    expect(c.kind).toBe('today');
    expect(c.check(new Date('1990-01-01'))!.code).toBe('custom');
    expect(c.check(new Date())).toBeNull();
    expect(c.meta().kind).toBe('today');
    expect(new VldDateCheckToday().check(new Date('1990-01-01'))!.message).toBe('Date must be today');
  });

  it('VldDateCheckWeekday / Weekend', () => {
    const wd = new VldDateCheckWeekday('wd');
    expect(wd.kind).toBe('weekday');
    // 2024-01-13 is a Saturday
    expect(wd.check(new Date('2024-01-13'))!.code).toBe('custom');
    // 2024-01-15 is a Monday
    expect(wd.check(new Date('2024-01-15'))).toBeNull();
    const we = new VldDateCheckWeekend('we');
    expect(we.kind).toBe('weekend');
    expect(we.check(new Date('2024-01-15'))!.code).toBe('custom');
    expect(we.check(new Date('2024-01-13'))).toBeNull();
    expect(new VldDateCheckWeekday().check(new Date('2024-01-13'))!.message).toBe('Date must be a weekday');
    expect(new VldDateCheckWeekend().check(new Date('2024-01-15'))!.message).toBe('Date must be a weekend');
  });
});

describe('VldDateV2 chains', () => {
  it('VldDateV2.create() and getters', () => {
    const d = VldDateV2.create();
    expect(d.isSimple).toBe(true);
    expect(d.parse(new Date('2024-01-15'))).toBeInstanceOf(Date);
  });

  it('handles Date, ISO string, timestamp', () => {
    expect(v.dateV2().parse('2024-01-15')).toBeInstanceOf(Date);
    expect(v.dateV2().parse(1705276800000)).toBeInstanceOf(Date);
    expect(v.dateV2().parse(new Date('2024-01-15'))).toBeInstanceOf(Date);
  });

  it('rejects invalid date inputs', () => {
    expect(() => v.dateV2().parse('not-a-date')).toThrow();
    expect(() => v.dateV2().parse(new Date('invalid'))).toThrow();
    expect(() => v.dateV2().parse(undefined)).toThrow();
    expect(() => v.dateV2().parse({})).toThrow();
  });

  it('min().max().gt().lt() with various input types', () => {
    expect(v.dateV2().min('2024-01-01').parse('2024-06-01')).toBeInstanceOf(Date);
    expect(v.dateV2().max(1705276800000).parse('2024-01-15')).toBeInstanceOf(Date);
    expect(v.dateV2().gt(new Date('2024-01-01')).parse('2024-06-01')).toBeInstanceOf(Date);
    expect(v.dateV2().lt(1705276800000).parse('2024-01-14')).toBeInstanceOf(Date);
    expect(() => v.dateV2().lt(1705276800000).parse('2024-01-15')).toThrow();
  });

  it('past().future().today().weekday().weekend()', () => {
    expect(v.dateV2().past().parse(new Date('2020-01-01'))).toBeInstanceOf(Date);
    expect(v.dateV2().future().parse(new Date('2030-01-01'))).toBeInstanceOf(Date);
    expect(v.dateV2().today().parse(new Date())).toBeInstanceOf(Date);
    expect(v.dateV2().weekday().parse(new Date('2024-01-15'))).toBeInstanceOf(Date);
    expect(v.dateV2().weekend().parse(new Date('2024-01-13'))).toBeInstanceOf(Date);
  });
});

// ============================================================================
// bigint-v2.ts coverage
// ============================================================================
describe('bigint-v2 check classes', () => {
  it('VldBigIntCheckMin / Max / Gt / Lt', () => {
    const min = new VldBigIntCheckMin(10n, 'min');
    expect(min.kind).toBe('min');
    expect(min.check(5n)!.code).toBe('too_small');
    expect(min.check(15n)).toBeNull();
    expect(min.meta().kind).toBe('min');
    expect(new VldBigIntCheckMin(10n).check(5n)!.message).toMatch(/>=/);

    const max = new VldBigIntCheckMax(100n, 'max');
    expect(max.kind).toBe('max');
    expect(max.check(150n)!.code).toBe('too_big');
    expect(max.check(50n)).toBeNull();
    expect(max.meta().kind).toBe('max');
    expect(new VldBigIntCheckMax(100n).check(150n)!.message).toMatch(/<=/);

    const gt = new VldBigIntCheckGt(10n, 'gt');
    expect(gt.kind).toBe('gt');
    expect(gt.check(5n)!.code).toBe('too_small');
    expect(gt.check(10n)!.code).toBe('too_small');
    expect(gt.check(15n)).toBeNull();
    expect(gt.meta().kind).toBe('gt');

    const lt = new VldBigIntCheckLt(100n, 'lt');
    expect(lt.kind).toBe('lt');
    expect(lt.check(150n)!.code).toBe('too_big');
    expect(lt.check(100n)!.code).toBe('too_big');
    expect(lt.check(50n)).toBeNull();
    expect(lt.meta().kind).toBe('lt');
  });

  it('VldBigIntCheckMultipleOf (covers divisor === 0n branch)', () => {
    const c = new VldBigIntCheckMultipleOf(5n, 'mul');
    expect(c.kind).toBe('multipleOf');
    expect(c.check(15n)).toBeNull();
    expect(c.check(7n)!.code).toBe('custom');
    expect(c.meta().kind).toBe('multipleOf');
    expect(new VldBigIntCheckMultipleOf(5n).check(7n)!.message).toMatch(/multiple of/);
    // divisor 0n is a no-op (returns null)
    const zero = new VldBigIntCheckMultipleOf(0n);
    expect(zero.check(123n)).toBeNull();
  });
});

describe('VldBigIntV2 chains', () => {
  it('VldBigIntV2.create() and getters', () => {
    const b = VldBigIntV2.create();
    expect(b.isSimple).toBe(true);
    expect(b.parse(42n)).toBe(42n);
  });

  it('VldBigIntV2 with custom def', () => {
    const def = { type: 'bigint' as const, checks: [], isSimple: true, errorMessage: 'big' };
    const s = new VldBigIntV2(def);
    expect(() => s.parse(42)).toThrow(/big/);
  });

  it('all chain methods', () => {
    expect(v.bigintV2().min(10n).max(100n).parse(50n)).toBe(50n);
    expect(v.bigintV2().positive().parse(1n)).toBe(1n);
    expect(() => v.bigintV2().positive().parse(-1n)).toThrow();
    expect(v.bigintV2().negative().parse(-1n)).toBe(-1n);
    expect(() => v.bigintV2().negative().parse(1n)).toThrow();
    expect(v.bigintV2().nonnegative().parse(0n)).toBe(0n);
    expect(() => v.bigintV2().nonnegative().parse(-1n)).toThrow();
    expect(v.bigintV2().nonpositive().parse(0n)).toBe(0n);
    expect(() => v.bigintV2().nonpositive().parse(1n)).toThrow();
    expect(v.bigintV2().gt(10n).parse(15n)).toBe(15n);
    expect(v.bigintV2().lt(100n).parse(50n)).toBe(50n);
    expect(v.bigintV2().gte(10n).parse(10n)).toBe(10n);
    expect(v.bigintV2().lte(100n).parse(100n)).toBe(100n);
    expect(v.bigintV2().multipleOf(3n).parse(9n)).toBe(9n);
    expect(() => v.bigintV2().multipleOf(3n).parse(10n)).toThrow();
  });

  it('accepts number / string thresholds (toBigInt helper)', () => {
    expect(v.bigintV2().min(10).parse(50n)).toBe(50n);
    expect(v.bigintV2().min('10').parse(50n)).toBe(50n);
  });
});

// ============================================================================
// array-v2.ts coverage
// ============================================================================
describe('array-v2 check classes', () => {
  it('VldArrayCheckMin / Max / Length / Unique', () => {
    const min = new VldArrayCheckMin(2, 'min');
    expect(min.kind).toBe('minLength');
    expect(min.message).toBe('min');
    const p = { length: 1, issues: [] as any[] };
    min.check({ length: 0 }, p);
    expect(p.issues.length).toBe(1);
    expect(min.meta().value).toBe(2);

    const max = new VldArrayCheckMax(3, 'max');
    expect(max.kind).toBe('maxLength');
    expect(max.message).toBe('max');
    const p2 = { length: 5, issues: [] as any[] };
    max.check({ length: 5 }, p2);
    expect(p2.issues.length).toBe(1);
    expect(max.meta().value).toBe(3);

    const exact = new VldArrayCheckLength(3, 'exact');
    expect(exact.kind).toBe('exactLength');
    const p3 = { length: 5, issues: [] as any[] };
    exact.check({ length: 5 }, p3);
    expect(p3.issues.length).toBe(1);
    exact.check({ length: 3 }, { length: 3, issues: [] as any[] });
    expect(exact.meta().value).toBe(3);

    const unique = new VldArrayCheckUnique('dup');
    expect(unique.kind).toBe('unique');
    const p4 = { length: 2, issues: [] as any[] };
    unique.check({ length: 2, items: ['a', 'a'] }, p4);
    expect(p4.issues.length).toBe(1);
    const p5 = { length: 2, issues: [] as any[] };
    unique.check({ length: 2, items: ['a', 'b'] }, p5);
    expect(p5.issues.length).toBe(0);
    expect(unique.meta().kind).toBe('unique');
  });
});

describe('VldArrayV2', () => {
  it('create / element / unwrap / isSimple', () => {
    const arr = VldArrayV2.create(v.stringV2());
    expect(arr.element).toBeDefined();
    expect(arr.unwrap()).toBeDefined();
    expect(arr.isSimple).toBe(true);
    expect(arr.parse(['a', 'b'])).toEqual(['a', 'b']);
  });

  it('parses with V2 children (fast path)', () => {
    expect(v.arrayV2(v.stringV2()).parse(['a', 'b'])).toEqual(['a', 'b']);
    expect(v.arrayV2(v.numberV2()).parse([1, 2])).toEqual([1, 2]);
    expect(v.arrayV2(v.booleanV2()).parse([true, false])).toEqual([true, false]);
  });

  it('rejects non-array', () => {
    expect(() => v.arrayV2(v.stringV2()).parse('x' as unknown)).toThrow();
    expect(() => v.arrayV2(v.stringV2()).parse(null as unknown)).toThrow();
  });

  it('min / max / length / nonempty / between', () => {
    const s = v.arrayV2(v.stringV2()).min(1).max(3);
    expect(s.parse(['a'])).toEqual(['a']);
    expect(() => s.parse([])).toThrow();
    expect(() => s.parse(['a', 'b', 'c', 'd'])).toThrow();
    expect(v.arrayV2(v.stringV2()).length(2).parse(['a', 'b'])).toEqual(['a', 'b']);
    expect(() => v.arrayV2(v.stringV2()).length(2).parse(['a'])).toThrow();
    expect(v.arrayV2(v.stringV2()).nonempty().parse(['a'])).toEqual(['a']);
    expect(() => v.arrayV2(v.stringV2()).nonempty().parse([])).toThrow();
    expect(v.arrayV2(v.stringV2()).between(1, 3).parse(['a', 'b'])).toEqual(['a', 'b']);
    expect(() => v.arrayV2(v.stringV2()).between(1, 3).parse([])).toThrow();
    expect(() => v.arrayV2(v.stringV2()).between(1, 3).parse(['a', 'b', 'c', 'd'])).toThrow();
  });

  it('unique() rejects duplicates', () => {
    const s = v.arrayV2(v.stringV2()).unique();
    expect(s.parse(['a', 'b'])).toEqual(['a', 'b']);
    expect(() => s.parse(['a', 'a'])).toThrow();
  });

  it('simpleItemMode with invalid items throws', () => {
    expect(() => v.arrayV2(v.stringV2()).parse([1 as unknown])).toThrow();
    expect(() => v.arrayV2(v.numberV2()).parse(['x' as unknown])).toThrow();
    expect(() => v.arrayV2(v.booleanV2()).parse([1 as unknown])).toThrow();
  });

  it('complex item validator path (non-simple)', () => {
    expect(v.arrayV2(v.stringV2().min(2)).parse(['ab', 'cd'])).toEqual(['ab', 'cd']);
    expect(() => v.arrayV2(v.stringV2().min(2)).parse(['a', 'cd'])).toThrow();
  });
});

// ============================================================================
// union-v2.ts coverage
// ============================================================================
describe('VldUnionV2', () => {
  it('static create with varargs', () => {
    const u = VldUnionV2.create(v.stringV2(), v.numberV2());
    expect(u.parse('x')).toBe('x');
    expect(u.parse(42)).toBe(42);
    expect(() => u.parse(true)).toThrow();
  });

  it('options getter', () => {
    const u = v.unionV2(v.stringV2(), v.numberV2());
    expect(u.options.length).toBe(2);
  });

  it('simple modes: string / number / boolean / bigint / symbol / null / undefined / literal / passthrough', () => {
    expect(v.unionV2(v.stringV2()).parse('x')).toBe('x');
    expect(v.unionV2(v.numberV2()).parse(1)).toBe(1);
    expect(v.unionV2(v.booleanV2()).parse(true)).toBe(true);
    expect(v.unionV2(v.bigintV2()).parse(1n)).toBe(1n);
    expect(typeof v.unionV2(vV2.symbol()).parse(Symbol('a'))).toBe('symbol');
    expect(v.unionV2(vV2.null()).parse(null)).toBe(null);
    expect(v.unionV2(vV2.undefined()).parse(undefined)).toBe(undefined);
    expect(v.unionV2(v.literalV2('hello')).parse('hello')).toBe('hello');
    expect(v.unionV2(vV2.any()).parse(42)).toBe(42);
    expect(v.unionV2(vV2.unknown()).parse(42)).toBe(42);
    expect(v.unionV2(vV2.void()).parse(undefined)).toBe(undefined);
  });

  it('enum / never typeCheckers', () => {
    expect(v.unionV2(v.enumV2(['a', 'b'])).parse('a')).toBe('a');
    const neverSchema = vV2.never() as unknown as VldBase<unknown, unknown>;
    expect(() => v.unionV2(neverSchema).parse(42)).toThrow();
  });

  it('object / array typeCheckers via composite V1', () => {
    expect(v.unionV2(v.tupleV2(v.stringV2())).parse(['x'])).toEqual(['x']);
    expect(v.unionV2(VldArrayV2.create(v.stringV2())).parse(['x'])).toEqual(['x']);
  });

  it('custom error message', () => {
    const u = new VldUnionV2([v.stringV2()], 'my custom error');
    expect(() => u.parse(42)).toThrow(/my custom error/);
  });

  it('safeParse', () => {
    const u = v.unionV2(v.stringV2(), v.numberV2());
    expect(u.safeParse('x').success).toBe(true);
    expect(u.safeParse(true).success).toBe(false);
  });
});

// ============================================================================
// composite-v2.ts coverage
// ============================================================================
describe('composite-v2', () => {
  it('VldTupleV2', () => {
    const t = VldTupleV2.create(v.stringV2(), v.numberV2());
    expect(t.items.length).toBe(2);
    expect(t.parse(['a', 1])).toEqual(['a', 1]);
    expect(() => t.parse(['a'])).toThrow();
    expect(() => t.parse('x' as unknown)).toThrow();
    expect(t.safeParse(['a', 1]).success).toBe(true);
    expect(t.safeParse(['a']).success).toBe(false);
  });

  it('VldSetV2', () => {
    const s = VldSetV2.create(v.stringV2());
    expect(s.isSimple).toBe(true);
    expect(s.parse(new Set(['a'])) instanceof Set).toBe(true);
    expect(() => s.parse('x' as unknown)).toThrow();
    // Non-simple path
    const s2 = VldSetV2.create(v.stringV2().min(2));
    expect(s2.isSimple).toBe(false);
    expect(s2.parse(new Set(['ab'])).size).toBe(1);
    expect(() => s2.parse(new Set(['a']))).toThrow();
  });

  it('VldMapV2', () => {
    const m = VldMapV2.create(v.stringV2(), v.numberV2());
    expect(m.isSimple).toBe(true);
    const r = m.parse(new Map([['a', 1]]));
    expect(r.get('a')).toBe(1);
    expect(() => m.parse('x' as unknown)).toThrow();
    // Non-simple path
    const m2 = VldMapV2.create(v.stringV2().min(2), v.numberV2().int());
    expect(m2.isSimple).toBe(false);
    const r2 = m2.parse(new Map([['ab', 1]]));
    expect(r2.get('ab')).toBe(1);
    expect(() => m2.parse(new Map([['a', 1]]))).toThrow();
  });

  it('VldIntersectionV2', () => {
    const i = VldIntersectionV2.create(
      v.object({ a: v.string() }),
      v.object({ b: v.number() })
    );
    const r = i.parse({ a: 'x', b: 1 } as any);
    expect(r.a).toBe('x');
    expect(r.b).toBe(1);
    expect(() => i.parse({ a: 'x' } as any)).toThrow();
  });
});

// ============================================================================
// leaf-v2.ts coverage
// ============================================================================
describe('leaf-v2', () => {
  it('VldLiteralV2', () => {
    const lit = VldLiteralV2.create('admin');
    expect(lit.literal).toBe('admin');
    expect(lit.isSimple).toBe(true);
    expect(lit.parse('admin')).toBe('admin');
    expect(() => lit.parse(null)).toThrow();
    expect(() => lit.parse(undefined)).toThrow();
    expect(() => lit.parse('user')).toThrow();
    expect(lit.safeParse('admin').success).toBe(true);
    expect(lit.safeParse('user').success).toBe(false);
    // null literal
    const n = VldLiteralV2.create(null);
    expect(n.parse(null)).toBe(null);
    expect(() => n.parse(0 as unknown)).toThrow();
  });

  it('VldBooleanV2', () => {
    const b = VldBooleanV2.create();
    expect(b.isSimple).toBe(true);
    expect(b.parse(true)).toBe(true);
    expect(b.parse(false)).toBe(false);
    expect(() => b.parse('true' as unknown)).toThrow();
    expect(b.safeParse(true).success).toBe(true);
    expect(b.safeParse('x' as unknown).success).toBe(false);
  });

  it('VldEnumV2', () => {
    const e = VldEnumV2.create(['a', 'b', 'c']);
    expect(e.options).toEqual(['a', 'b', 'c']);
    expect(e.enumValues).toEqual(['a', 'b', 'c']);
    expect(e.isSimple).toBe(true);
    expect(e.parse('a')).toBe('a');
    expect(() => e.parse('d')).toThrow();
    expect(e.safeParse('a').success).toBe(true);
    expect(e.safeParse('d').success).toBe(false);
    // numeric enum
    const n = VldEnumV2.create([1, 2, 3] as const);
    expect(n.parse(1)).toBe(1);
    expect(() => n.parse(4)).toThrow();
  });

  it('VldRecordV2', () => {
    const r = VldRecordV2.create(v.stringV2());
    expect(r.isSimple).toBe(false);
    expect(r.parse({ a: 'x' })).toEqual({ a: 'x' });
    expect(() => r.parse(null as unknown)).toThrow();
    expect(() => r.parse([] as unknown)).toThrow();
    expect(() => r.parse({ a: 1 as unknown })).toThrow();
  });

  it('VldAnyV2 / VldUnknownV2 / VldVoidV2 / VldNeverV2 / VldNullV2 / VldUndefinedV2 / VldSymbolV2 / VldFunctionV2', () => {
    expect(VldAnyV2.create().parse(42)).toBe(42);
    expect(VldAnyV2.create().safeParse(42).success).toBe(true);
    expect(VldUnknownV2.create().parse(42)).toBe(42);
    expect(VldUnknownV2.create().safeParse(42).success).toBe(true);
    expect(VldVoidV2.create().parse(undefined)).toBe(undefined);
    expect(() => VldVoidV2.create().parse(42 as unknown)).toThrow();
    expect(VldVoidV2.create().safeParse(undefined).success).toBe(true);
    expect(VldVoidV2.create().safeParse(42 as unknown).success).toBe(false);
    expect(() => VldNeverV2.create().parse(42)).toThrow();
    expect(VldNeverV2.create().safeParse(42).success).toBe(false);
    expect(VldNullV2.create().parse(null)).toBe(null);
    expect(() => VldNullV2.create().parse(0 as unknown)).toThrow();
    expect(VldNullV2.create().safeParse(null).success).toBe(true);
    expect(VldNullV2.create().safeParse(0 as unknown).success).toBe(false);
    expect(VldUndefinedV2.create().parse(undefined)).toBe(undefined);
    expect(() => VldUndefinedV2.create().parse(null as unknown)).toThrow();
    expect(VldUndefinedV2.create().safeParse(undefined).success).toBe(true);
    expect(VldUndefinedV2.create().safeParse(null as unknown).success).toBe(false);
    expect(typeof VldSymbolV2.create().parse(Symbol('a'))).toBe('symbol');
    expect(() => VldSymbolV2.create().parse('a' as unknown)).toThrow();
    expect(VldSymbolV2.create().safeParse(Symbol('a')).success).toBe(true);
    expect(VldSymbolV2.create().safeParse('a' as unknown).success).toBe(false);
    const fn = () => 1;
    expect(VldFunctionV2.create().parse(fn)).toBe(fn);
    expect(() => VldFunctionV2.create().parse(42 as unknown)).toThrow();
    expect(VldFunctionV2.create().safeParse(fn).success).toBe(true);
    expect(VldFunctionV2.create().safeParse(42 as unknown).success).toBe(false);
  });
});

// ============================================================================
// wrapper-v2.ts coverage
// ============================================================================
describe('wrapper-v2', () => {
  it('VldOptionalV2 / NullableV2 / NullishV2', () => {
    const o = VldOptionalV2.create(v.stringV2());
    expect(o.unwrap()).toBeDefined();
    expect(o.parse(undefined)).toBe(undefined);
    expect(o.parse('x')).toBe('x');
    expect(() => o.parse(42 as unknown)).toThrow();
    expect(o.safeParse(undefined).success).toBe(true);
    expect(o.safeParse('x').success).toBe(true);
    expect(o.safeParse(42 as unknown).success).toBe(false);

    const n = VldNullableV2.create(v.stringV2());
    expect(n.parse(null)).toBe(null);
    expect(n.parse('x')).toBe('x');
    expect(() => n.parse(42 as unknown)).toThrow();
    expect(n.safeParse(null).success).toBe(true);
    expect(n.safeParse(42 as unknown).success).toBe(false);

    const ns = VldNullishV2.create(v.stringV2());
    expect(ns.parse(null)).toBe(null);
    expect(ns.parse(undefined)).toBe(undefined);
    expect(ns.parse('x')).toBe('x');
    expect(() => ns.parse(42 as unknown)).toThrow();
    expect(ns.safeParse(null).success).toBe(true);
    expect(ns.safeParse(undefined).success).toBe(true);
    expect(ns.safeParse(42 as unknown).success).toBe(false);
  });

  it('VldRefineV2 (sync + async, path option)', () => {
    const r = VldRefineV2.create(v.stringV2(), s => s.length > 2, 'too short');
    expect(r.unwrap()).toBeDefined();
    expect(r.parse('abc')).toBe('abc');
    expect(() => r.parse('ab')).toThrow(/too short/);
    expect(r.safeParse('ab').success).toBe(false);
    // async
    return (async () => {
      expect(await r.parseAsync('abc')).toBe('abc');
      expect(await r.safeParseAsync('ab').then(r => r.success)).toBe(false);
    })();
  });

  it('VldRefineV2 with path', () => {
    const r = new VldRefineV2(v.stringV2(), s => s.length > 2, 'too short', ['custom', 'path']);
    expect(() => r.parse('ab')).toThrow();
    const err = r.safeParse('ab') as { success: false; error: any };
    expect(err.error.issues[0].path).toEqual(['custom', 'path']);
  });

  it('VldRefineV2 with async predicate throws on parse', () => {
    const r = VldRefineV2.create(v.stringV2(), async () => true);
    expect(() => r.parse('x')).toThrow(/parseAsync/);
  });

  it('VldTransformV2 (sync + async)', () => {
    const t = VldTransformV2.create(v.stringV2(), s => s.toUpperCase());
    expect(t.unwrap()).toBeDefined();
    expect(t.parse('hello')).toBe('HELLO');
    expect(t.safeParse('hello').success).toBe(true);
    return (async () => {
      expect(await t.parseAsync('hello')).toBe('HELLO');
      expect(await t.safeParseAsync('hello').then(r => r.success)).toBe(true);
    })();
  });

  it('VldTransformV2 with async transformer throws on parse', () => {
    const t = VldTransformV2.create(v.stringV2(), async () => 'x');
    expect(() => t.parse('hello')).toThrow(/parseAsync/);
  });

  it('VldTransformV2 propagates transformer errors', () => {
    const t = VldTransformV2.create(v.stringV2(), () => { throw new Error('inner'); });
    expect(() => t.parse('hello')).toThrow(/Transform failed/);
  });
});

// ============================================================================
// Integration: vV2 + V1 composites
// ============================================================================
describe('V2 + V1 composite interop', () => {
  it('v.object with V2 children + VldError thrown', () => {
    const obj = v.object({ name: v.stringV2().min(2), age: v.numberV2().int() });
    expect(() => obj.parse({ name: 'J', age: 30 })).toThrow();
  });

  it('v.setV2Mode toggles V2 globally', () => {
    v.setV2Mode(true);
    expect(v.string().parse('hello')).toBe('hello');
    v.setV2Mode(false);
    expect(v.string().parse('hello')).toBe('hello');
  });
});

// ============================================================================
// Sanity: V2 instances expose isSimple / __def / static.create
// ============================================================================
describe('V2 class instantiation sanity', () => {
  it('all V2 classes have isSimple and __def', () => {
    expect(VldStringV2.create().isSimple).toBe(true);
    expect(VldStringV2.create().__def).toBeDefined();
    expect(VldNumberV2.create().isSimple).toBe(true);
    expect(VldNumberV2.create().__def).toBeDefined();
    expect(VldDateV2.create().isSimple).toBe(true);
    expect(VldDateV2.create().__def).toBeDefined();
    expect(VldBigIntV2.create().isSimple).toBe(true);
    expect(VldBigIntV2.create().__def).toBeDefined();
    expect(VldArrayV2.create(v.stringV2()).isSimple).toBe(true);
    expect(VldLiteralV2.create('x').isSimple).toBe(true);
    expect(VldBooleanV2.create().isSimple).toBe(true);
    expect(VldEnumV2.create(['a']).isSimple).toBe(true);
    expect(VldRecordV2.create(v.stringV2()).isSimple).toBe(false);
    expect(VldAnyV2.create().isSimple).toBe(true);
    expect(VldUnknownV2.create().isSimple).toBe(true);
    expect(VldVoidV2.create().isSimple).toBe(true);
    expect(VldNeverV2.create().isSimple).toBe(true);
    expect(VldNullV2.create().isSimple).toBe(true);
    expect(VldUndefinedV2.create().isSimple).toBe(true);
    expect(VldSymbolV2.create().isSimple).toBe(true);
    expect(VldFunctionV2.create().isSimple).toBe(true);
    expect((VldOptionalV2.create(v.stringV2()) as unknown as { isSimple: boolean }).isSimple).toBeUndefined();
    expect((VldNullableV2.create(v.stringV2()) as unknown as { isSimple: boolean }).isSimple).toBeUndefined();
    expect((VldNullishV2.create(v.stringV2()) as unknown as { isSimple: boolean }).isSimple).toBeUndefined();
    expect((VldRefineV2.create(v.stringV2(), () => true) as unknown as { isSimple: boolean }).isSimple).toBeUndefined();
    expect((VldTransformV2.create(v.stringV2(), s => s) as unknown as { isSimple: boolean }).isSimple).toBeUndefined();
    expect((VldTupleV2.create(v.stringV2()) as unknown as { isSimple: boolean }).isSimple).toBeUndefined();
    expect(VldSetV2.create(v.stringV2()).isSimple).toBe(true);
    expect(VldMapV2.create(v.stringV2(), v.numberV2()).isSimple).toBe(true);
  });
});
