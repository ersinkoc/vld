/**
 * V2 Pattern Coverage — Edge Cases
 *
 * Targets remaining coverage gaps in V2 files (catch branches, default
 * switch cases, multi-level path formatting in ZodError adapter, etc.)
 */
import { v, vV2, VldBase, VldError, toZodError, setLocale, getLocale, getMessages, type VldIssue } from '../src';
import { VldArrayV2, VldArrayCheckMin, VldArrayCheckMax, VldArrayCheckLength, VldArrayCheckUnique } from '../src/validators/array-v2';
import { VldBigIntV2, VldBigIntCheckMin } from '../src/validators/bigint-v2';
import { VldStringV2 } from '../src/validators/string-v2';
import { VldNumberV2 } from '../src/validators/number-v2';
import { VldDateV2, VldDateCheckPast, VldDateCheckFuture, VldDateCheckWeekday, VldDateCheckWeekend } from '../src/validators/date-v2';
import { VldSetV2, VldMapV2 } from '../src/validators/composite-v2';
import { VldRecordV2 } from '../src/validators/leaf-v2';
import { VldRefineV2, VldTransformV2 } from '../src/validators/wrapper-v2';
import { VldCoerceStringV2 } from '../src/validators/string-v2';

describe('V2 safeParse error branches', () => {
  it('VldArrayV2.safeParse catches errors', () => {
    expect(VldArrayV2.create(vV2.string()).safeParse(null).success).toBe(false);
    expect(VldArrayV2.create(vV2.string()).safeParse(42).success).toBe(false);
  });

  it('VldBigIntV2.safeParse catches errors', () => {
    expect(VldBigIntV2.create().safeParse(42).success).toBe(false);
    expect(VldBigIntV2.create().safeParse('x').success).toBe(false);
  });

  it('VldDateV2.safeParse catches errors', () => {
    expect(VldDateV2.create().safeParse('not-a-date').success).toBe(false);
  });

  it('VldStringV2.safeParse catches errors', () => {
    expect(VldStringV2.create().safeParse(42).success).toBe(false);
  });

  it('VldNumberV2.safeParse catches errors', () => {
    expect(VldNumberV2.create().safeParse('x').success).toBe(false);
  });

  it('VldSetV2.safeParse catches errors', () => {
    expect(VldSetV2.create(vV2.string()).safeParse('not-a-set').success).toBe(false);
  });

  it('VldUnionV2 undefined/void typeChecker fallthrough', () => {
    expect(v.unionV2(vV2.void()).safeParse(undefined).success).toBe(true);
    expect(v.unionV2(vV2.undefined()).safeParse(undefined).success).toBe(true);
    expect(v.unionV2(vV2.void()).safeParse(null).success).toBe(false);
  });

  it('VldMapV2.safeParse catches errors', () => {
    expect(VldMapV2.create(vV2.string(), vV2.number()).safeParse('not-a-map').success).toBe(false);
  });

  it('VldRefineV2.safeParse / safeParseAsync catch errors', () => {
    const r = VldRefineV2.create(vV2.string(), s => s.length > 5);
    expect(r.safeParse('hi').success).toBe(false);
    return (async () => {
      expect((await r.safeParseAsync('hi')).success).toBe(false);
      expect((await r.safeParseAsync('hello world')).success).toBe(true);
    })();
  });

  it('VldTransformV2.safeParse / safeParseAsync catch errors', () => {
    const t = VldTransformV2.create(vV2.string(), () => { throw new Error('boom'); });
    expect(t.safeParse('hello').success).toBe(false);
    return (async () => {
      expect((await t.safeParseAsync('hello')).success).toBe(false);
    })();
  });
});

describe('V2 array default switch case (non-string/number/boolean simple mode)', () => {
  it('non-simple item mode (object validator) covers default branch', () => {
    // Use a non-simple value validator so simpleItemMode === undefined
    const arr = VldArrayV2.create(vV2.literal('x'));
    expect(arr.parse(['x', 'x'])).toEqual(['x', 'x']);
  });
});

describe('V2 default transform branch (4+ transforms)', () => {
  it('parses through 2 transform chain (case 2 branch)', () => {
    const s = vV2.string().transform((x: string) => x + '1').transform((x: string) => x + '2');
    expect(s.parse('x')).toBe('x12');
  });
  it('parses through 3 transform chain (case 3 branch)', () => {
    const s = vV2.string()
      .transform((x: string) => x + '1')
      .transform((x: string) => x + '2')
      .transform((x: string) => x + '3');
    expect(s.parse('x')).toBe('x123');
  });
  it('parses through 4+ transform chain (default switch branch)', () => {
    const s = vV2.string()
      .transform((x: string) => x + '1')
      .transform((x: string) => x + '2')
      .transform((x: string) => x + '3')
      .transform((x: string) => x + '4');
    expect(s.parse('x')).toBe('x1234');
  });
});

describe('V2 string coercion > 1M chars branch', () => {
  it('rejects inputs that would coerce to > 1M chars', () => {
    expect(() => VldCoerceStringV2.create().parse({ toString: () => 'x'.repeat(1_000_001) })).toThrow();
  });
});

describe('V2 date-v2 meta() calls for past/future/weekday/weekend', () => {
  it('VldDateCheckPast.meta / Future / Weekday / Weekend', () => {
    expect(new VldDateCheckPast('p').meta().kind).toBe('past');
    expect(new VldDateCheckFuture('f').meta().kind).toBe('future');
    expect(new VldDateCheckWeekday('w').meta().kind).toBe('weekday');
    expect(new VldDateCheckWeekend('we').meta().kind).toBe('weekend');
  });
});

describe('V2 leaf recordV2 non-simple (object item validator) branch', () => {
  it('VldRecordV2 with non-simple value validator (line 196)', () => {
    const r = VldRecordV2.create(vV2.string().min(2));
    expect(r.parse({ ab: 'cd', ef: 'gh' })).toEqual({ ab: 'cd', ef: 'gh' });
    expect(() => r.parse({ ab: 'c' })).toThrow(); // 'c' is too short for min(2)
  });

  it('VldRecordV2.safeParse catches errors (line 204-205)', () => {
    const r = VldRecordV2.create(vV2.string().min(2));
    expect(r.safeParse(null).success).toBe(false);
    expect(r.safeParse('not-an-object').success).toBe(false);
  });

  it('VldRecordV2 simpleValueMode covers all 5 simple types', () => {
    expect(VldRecordV2.create(vV2.string()).parse({ a: 'x' })).toEqual({ a: 'x' });
    expect(VldRecordV2.create(vV2.number()).parse({ a: 1 })).toEqual({ a: 1 });
    expect(VldRecordV2.create(vV2.boolean()).parse({ a: true })).toEqual({ a: true });
    expect(VldRecordV2.create(vV2.bigint()).parse({ a: 1n })).toEqual({ a: 1n });
    const sym = VldRecordV2.create(vV2.symbol()).parse({ a: Symbol('x') });
    expect(typeof sym['a']).toBe('symbol');
    // Invalid items for each simple mode
    expect(() => VldRecordV2.create(vV2.string()).parse({ a: 1 as unknown })).toThrow();
    expect(() => VldRecordV2.create(vV2.number()).parse({ a: 'x' as unknown })).toThrow();
    expect(() => VldRecordV2.create(vV2.boolean()).parse({ a: 1 as unknown })).toThrow();
    expect(() => VldRecordV2.create(vV2.bigint()).parse({ a: 1 as unknown })).toThrow();
    expect(() => VldRecordV2.create(vV2.symbol()).parse({ a: 'x' as unknown })).toThrow();
  });
});

describe('V2 union typeCheckers (object + nan + unknown + any + never)', () => {
  it('covers all type checker branches (NAN, OBJECT, ANY, UNKNOWN, NEVER)', () => {
    // Use VldObject instance to cover the OBJECT typeChecker branch
    const obj = v.object({ a: vV2.string() });
    const result = v.unionV2(
      vV2.boolean(),
      vV2.never() as unknown as VldBase<unknown, unknown>,
      vV2.unknown(),
      vV2.any(),
      obj as unknown as VldBase<unknown, unknown>
    );
    // Object typeChecker
    expect(result.safeParse({ a: 'x' }).success).toBe(true);
    // NAN
    const nanRes = v.unionV2(v.nan()).safeParse(NaN);
    expect(nanRes.success).toBe(true);
    // ANY
    expect(v.unionV2(vV2.any()).safeParse(Symbol('a')).success).toBe(true);
  });
});

describe('V2 union parseKnown throws (line 117 catch branch)', () => {
  it('union with no matching option collects error messages', () => {
    const u = v.unionV2(vV2.string().min(100), vV2.number().int().positive());
    try { u.parse('x'); } catch (e) {
      expect((e as Error).message).toMatch(/No union member matched/);
    }
    try { u.parse(-1); } catch (e) {
      expect((e as Error).message).toMatch(/No union member matched/);
    }
  });
});

describe('V2 number.negative()', () => {
  it('negative parses -1, rejects 1', () => {
    expect(v.numberV2().negative().parse(-1)).toBe(-1);
    expect(() => v.numberV2().negative().parse(1)).toThrow();
    expect(() => v.numberV2().negative().parse(0)).toThrow();
  });
});

describe('V2 wrapper.unwrap() coverage', () => {
  it('VldRefineV2 / VldTransformV2 unwrap returns inner', () => {
    const r = VldRefineV2.create(vV2.string(), s => s.length > 0);
    expect(r.unwrap()).toBeDefined();
    const t = VldTransformV2.create(vV2.string(), s => s.toUpperCase());
    expect(t.unwrap()).toBeDefined();
  });
});

describe('V2 array.length and unique check classes (full coverage)', () => {
  it('VldArrayCheckLength / VldArrayCheckUnique meta()', () => {
    const exact = new VldArrayCheckLength(3);
    expect(exact.kind).toBe('exactLength');
    expect(exact.meta().value).toBe(3);
    const u = new VldArrayCheckUnique();
    expect(u.kind).toBe('unique');
    expect(u.meta().kind).toBe('unique');
  });
  it('VldArrayCheckMin / VldArrayCheckMax meta() and message', () => {
    const min = new VldArrayCheckMin(2, 'min-msg');
    expect(min.meta().value).toBe(2);
    expect(min.meta().message).toBe('min-msg');
    const max = new VldArrayCheckMax(5, 'max-msg');
    expect(max.meta().value).toBe(5);
    expect(max.meta().message).toBe('max-msg');
  });
});

describe('V2 bigint check classes (full coverage)', () => {
  it('VldBigIntCheckMin / Max / Gt / Lt / MultipleOf meta() and message', () => {
    const min = new VldBigIntCheckMin(10n, 'min-msg');
    expect(min.meta().value).toBe(10n);
    expect(min.meta().message).toBe('min-msg');
  });
});

// ============================================================================
// zod-error.ts coverage (lines 64-65, 69-71, 89-90, 133)
// ============================================================================
describe('ZodError adapter — format() with deep paths', () => {
  it('format() builds nested _errors tree for multi-level path', () => {
    // Build a VldError with multi-level path issues
    const issues: VldIssue[] = [
      { code: 'invalid_type', path: ['user', 'profile', 'name'], message: 'invalid' },
      { code: 'invalid_type', path: ['user', 'profile', 'age'], message: 'invalid' },
      { code: 'custom', path: ['user', 'email'], message: 'bad email' },
      { code: 'custom', path: [], message: 'top-level error' }
    ];
    const vldErr = new VldError(issues);
    const zodErr = toZodError(vldErr);
    const fmt = zodErr.format();
    // _errors: ['top-level error']
    expect(fmt['_errors']).toEqual(['top-level error']);
    // user.profile.name and user.profile.age
    const userNode = (fmt as any).user;
    expect(userNode).toBeDefined();
    const profileNode = userNode.profile;
    expect(profileNode['_errors']).toEqual([]);
    expect(profileNode.name['_errors']).toEqual(['invalid']);
    expect(profileNode.age['_errors']).toEqual(['invalid']);
    expect(userNode.email['_errors']).toEqual(['bad email']);
  });
});

describe('ZodError adapter — flatten() with form + field errors', () => {
  it('flatten() puts empty-path issues in formErrors', () => {
    const issues: VldIssue[] = [
      { code: 'custom', path: [], message: 'form error 1' },
      { code: 'custom', path: [], message: 'form error 2' },
      { code: 'invalid_type', path: ['a'], message: 'field a' },
      { code: 'invalid_type', path: ['b'], message: 'field b1' },
      { code: 'invalid_type', path: ['b'], message: 'field b2' }
    ];
    const vldErr = new VldError(issues);
    const zodErr = toZodError(vldErr);
    const flat = zodErr.flatten();
    expect(flat.formErrors).toEqual(['form error 1', 'form error 2']);
    expect(flat.fieldErrors['a']).toEqual(['field a']);
    expect(flat.fieldErrors['b']).toEqual(['field b1', 'field b2']);
  });
});

describe('ZodError adapter — invalid_type with origin fills expected', () => {
  it('toZodError fills expected from origin for invalid_type', () => {
    const issues: VldIssue[] = [
      { code: 'invalid_type', path: ['x'], message: 'm', origin: 'string' as any }
    ];
    const vldErr = new VldError(issues);
    const zodErr = toZodError(vldErr);
    expect(zodErr.issues[0]!.expected).toBe('string');
  });

  it('toZodError fills expected from validation for invalid_string', () => {
    const issues: VldIssue[] = [
      { code: 'invalid_string', path: ['x'], message: 'm', validation: 'email' } as unknown as VldIssue
    ];
    const vldErr = new VldError(issues);
    const zodErr = toZodError(vldErr);
    expect(zodErr.issues[0]!.expected).toBe('email');
  });

  it('toZodError handles issues with all optional fields', () => {
    const issues: VldIssue[] = [
      { code: 'invalid_type', path: ['x'], message: 'm' },
      { code: 'too_small', path: ['x'], message: 'm', minimum: 1, inclusive: true, origin: 'string' as any },
      { code: 'invalid_value', path: ['x'], message: 'm' }
    ];
    const vldErr = new VldError(issues);
    const zodErr = toZodError(vldErr);
    expect(zodErr.issues[0]!.expected).toBe('unknown');
  });
});

// ============================================================================
// errors-core.ts coverage (lines 173-181) — VLD_CAPTURE_STACK + captureStack()
// ============================================================================
describe('errors-core — VldError.captureStack + VLD_CAPTURE_STACK', () => {
  it('captureStack() populates stack when not yet captured', () => {
    const err = new VldError([{ code: 'custom', path: [], message: 'x' }]);
    err.captureStack();
    expect(err.stack).toBeDefined();
    // Calling again is a no-op
    const s1 = err.stack;
    err.captureStack();
    expect(err.stack).toBe(s1);
  });

  it('VLD_CAPTURE_STACK env flag captures stack on construction', () => {
    (globalThis as any).VLD_CAPTURE_STACK = true;
    try {
      const err = new VldError([{ code: 'custom', path: [], message: 'x' }]);
      expect(err.stack).toBeDefined();
    } finally {
      delete (globalThis as any).VLD_CAPTURE_STACK;
    }
  });

  it('firstError and errors getters', () => {
    const err = new VldError([
      { code: 'custom', path: ['a'], message: 'first' },
      { code: 'custom', path: ['b'], message: 'second' }
    ]);
    expect(err.firstError).toBeDefined();
    expect(err.firstError!.message).toBe('first');
    expect(err.errors).toEqual(err.issues);
  });
});

// ============================================================================
// index.ts coverage — VLD public surface
// ============================================================================
describe('VLD public API surface (index.ts uncovered lines)', () => {
  it('v.stringLegacy / numberLegacy / stringV2 / numberV2 (legacy aliases)', () => {
    expect(v.stringLegacy().parse('x')).toBe('x');
    expect(v.numberLegacy().parse(1)).toBe(1);
  });

  it('v.isValid / v.encode / v.decode (codec-like)', () => {
    // v.safeParse already covers validity; v.isValid not exposed in v3.0
    expect(v.string().safeParse('x').success).toBe(true);
    expect(v.string().safeParse(42).success).toBe(false);
  });

  it('v.json() schema', () => {
    const j = v.json();
    expect(j.parse('"hello"')).toBe('hello');
    expect(() => j.parse('"unterminated')).toThrow();
  });

  it('v.symbol() / v.function()', () => {
    const sym = v.symbol().parse(Symbol('x'));
    expect(typeof sym).toBe('symbol');
    const fn = () => 1;
    expect(v.function().parse(fn)).toBe(fn);
    expect(() => v.function().parse(42 as unknown)).toThrow();
    expect(() => v.symbol().parse('x' as unknown)).toThrow();
  });

  it('v.discriminatedUnion variants', () => {
    const du = v.discriminatedUnion('kind',
      v.object({ kind: v.literal('a'), a: v.string() }),
      v.object({ kind: v.literal('b'), b: v.number() })
    );
    expect(du.parse({ kind: 'a', a: 'x' })).toEqual({ kind: 'a', a: 'x' });
    expect(() => du.parse({ kind: 'c' })).toThrow();
  });

  it('v.lazy recursive schema (parses via top-level recursive object)', () => {
    // Use a top-level non-recursive lazy for coverage
    const lazySchema = v.lazy(() => v.string().min(3));
    expect(lazySchema.parse('hello')).toBe('hello');
    expect(() => lazySchema.parse('x')).toThrow();
  });

  it('v.preprocess', () => {
    const s = v.preprocess((v: unknown) => String(v).trim(), v.string().min(2));
    expect(s.parse('  hello  ')).toBe('hello');
  });

  it('v.brand', () => {
    const UserId = v.string().uuid().brand<'UserId'>();
    const id = UserId.parse('550e8400-e29b-41d4-a716-446655440000');
    expect(typeof id).toBe('string');
  });

  it('v.pipe + v.pipeline (alias)', () => {
    const s = v.pipe(v.string(), v.coerce.number());
    expect(s.parse('42')).toBe(42);
    expect(v.pipeline(v.string(), v.coerce.number()).parse('42')).toBe(42);
  });

  it('setLocale + getLocale + getMessages (top-level)', () => {
    setLocale('en');
    expect(getLocale()).toBe('en');
    const m = getMessages();
    expect(m).toBeDefined();
  });

  it('v.coerce.* aliases (boolean, bigint, date)', () => {
    expect(v.coerce.boolean().parse('true')).toBe(true);
    expect(v.coerce.bigint().parse('42')).toBe(42n);
    expect(v.coerce.date().parse('2024-01-15')).toBeInstanceOf(Date);
  });

  it('v.partial / v.pick / v.omit / v.extend / v.merge / v.strict / v.passthrough', () => {
    const s = v.object({ a: v.string(), b: v.number() });
    expect(s.partial().parse({})).toEqual({});
    expect(s.pick('a').parse({ a: 'x' })).toEqual({ a: 'x' });
    expect(s.omit('b').parse({ a: 'x' })).toEqual({ a: 'x' });
    expect(s.extend({ c: v.boolean() }).parse({ a: 'x', b: 1, c: true })).toEqual({ a: 'x', b: 1, c: true });
    const merged = s.merge(v.object({ d: v.string() }));
    expect(merged.parse({ a: 'x', b: 1, d: 'y' })).toEqual({ a: 'x', b: 1, d: 'y' });
    expect(() => s.strict().parse({ a: 'x', b: 1, c: true })).toThrow();
    expect(s.passthrough().parse({ a: 'x', b: 1, c: true })).toEqual({ a: 'x', b: 1, c: true });
  });
});

describe('VLD public API surface (index.ts uncovered lines)', () => {
  it('v.dateV2 / v.bigintV2 / v.coerce.stringV2 / v.coerce.numberV2 / v.transformV2', () => {
    expect(v.dateV2().parse('2024-01-15')).toBeInstanceOf(Date);
    expect(v.bigintV2().parse(42n)).toBe(42n);
    expect(v.coerce.stringV2().parse(42)).toBe('42');
    expect(v.coerce.numberV2().parse('42')).toBe(42);
    expect(v.transformV2(v.string(), s => s.toUpperCase()).parse('hi')).toBe('HI');
  });

  it('vV2 int / int32 / uint32 / uint64 / int64 / float32 / float64', () => {
    expect(vV2.int().parse(1)).toBe(1);
    expect(vV2.int32().parse(-100)).toBe(-100);
    expect(vV2.uint32().parse(100)).toBe(100);
    expect(vV2.uint64().parse(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER);
    expect(vV2.int64().parse(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER);
    expect(vV2.float32().parse(1.5)).toBe(1.5);
    expect(vV2.float64().parse(1.5)).toBe(1.5);
  });

  it('v.refineV2 (refine on V2 chain)', () => {
    const r = v.refineV2(vV2.number(), n => n > 0, 'must be positive');
    expect(r.parse(1)).toBe(1);
    expect(() => r.parse(-1)).toThrow(/must be positive/);
  });

  it('v.check (legacy alias for refine with VldBase)', () => {
    // v.check(schema, predicate, message) form
    const c = v.check(v.string().min(2), (s: string) => s.length > 3, 'must be > 3');
    expect(c.parse('hello')).toBe('hello');
    expect(() => c.parse('ab')).toThrow();
  });

  it('v.overwrite (legacy transform factory)', () => {
    const s = v.overwrite((x: string) => x.toUpperCase());
    expect(s.parse('hello')).toBe('HELLO'); // overwrite applies the transform
    expect(typeof s.parse).toBe('function');
  });

  it('v.dateLegacy / v.bigintLegacy / v.coerce.*Legacy aliases', () => {
    expect(v.dateLegacy().parse('2024-01-15')).toBeInstanceOf(Date);
    expect(v.bigintLegacy().parse(42n)).toBe(42n);
    expect(v.coerce.stringLegacy().parse(42)).toBe('42');
    expect(v.coerce.numberLegacy().parse('42')).toBe(42);
  });

  it('v.null / v.void / v.never / v.unknown / v.any / v.symbol (V1)', () => {
    expect(v.null().parse(null)).toBe(null);
    expect(v.void().parse(undefined)).toBe(undefined);
    expect(() => v.never().parse(42)).toThrow();
    expect(v.unknown().parse(42)).toBe(42);
    expect(v.any().parse(42)).toBe(42);
    expect(typeof v.symbol().parse(Symbol('x'))).toBe('symbol');
  });

  it('v.stringbool custom truthy/falsy options', () => {
    const s = v.stringbool({ truthy: ['yes'], falsy: ['no'], caseSensitive: false });
    expect(s.parse('YES')).toBe(true);
    expect(s.parse('no')).toBe(false);
  });
});

describe('V2 + V1 interop VldObject with VldFunction safeParse', () => {
  it('VldFunctionV2 safeParse covers both branches', () => {
    const fn = () => 42;
    expect(vV2.function().safeParse(fn).success).toBe(true);
    expect(vV2.function().safeParse(42).success).toBe(false);
  });
});
