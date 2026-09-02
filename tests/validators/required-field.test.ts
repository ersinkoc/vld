/**
 * Regression tests for the "required field" bug fixed in 3.0.2.
 *
 * Before 3.0.2, `v.object({ a: v.any() })` with `{}` would silently
 * succeed and return `{}` because the passthrough SimpleFieldMode
 * didn't check for missing keys. The same bug applied to `v.unknown()`
 * and `v.undefined()`, and propagated into nested objects and
 * discriminated unions via `parseTrustedKnownObject`.
 *
 * These tests assert that all required fields, regardless of type,
 * are now properly enforced.
 *
 * Bug fix: 3.0.1 -> 3.0.2
 *   - src/validators/object.ts: added hasOwnProperty checks to
 *     passthrough and undefinedValue cases in both parseSimpleObjectValue
 *     and parseObjectValue, plus the safeParse slow path.
 *   - src/locales/types.ts + 32 locale files: added requiredField message.
 */

import { v } from '../../src/index';

describe('required field enforcement (bug fix 3.0.1 -> 3.0.2)', () => {
  describe('plain object — passthrough (any/unknown) and undefinedValue modes', () => {
    test('object({a: any()}) with {} rejects (required any missing)', () => {
      const s = v.object({ a: v.any() });
      const r = s.safeParse({});
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues[0]!.path).toEqual(['a']);
        expect(r.error.issues[0]!.message).toMatch(/required|missing/i);
      }
    });

    test('object({a: unknown()}) with {} rejects (required unknown missing)', () => {
      const s = v.object({ a: v.unknown() });
      const r = s.safeParse({});
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues[0]!.path).toEqual(['a']);
      }
    });

    test('object({a: undefined()}) with {} rejects (required undefined missing)', () => {
      const s = v.object({ a: v.undefined() });
      const r = s.safeParse({});
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues[0]!.path).toEqual(['a']);
      }
    });

    test('object({a: any()}) with {a: undefined} accepts (key present, any accepts undefined)', () => {
      const s = v.object({ a: v.any() });
      expect(s.safeParse({ a: undefined }).success).toBe(true);
    });

    test('object({a: any()}) with {a: 42} accepts', () => {
      const s = v.object({ a: v.any() });
      expect(s.safeParse({ a: 42 }).success).toBe(true);
    });

    test('object({a: any().optional()}) with {} accepts (optional)', () => {
      const s = v.object({ a: v.any().optional() });
      expect(s.safeParse({}).success).toBe(true);
    });

    test('object({a: undefined()}) with {a: undefined} accepts (key present with undefined value)', () => {
      const s = v.object({ a: v.undefined() });
      expect(s.safeParse({ a: undefined }).success).toBe(true);
    });

    test('object({a: undefined()}) with {a: "x"} rejects (must be undefined, not other)', () => {
      const s = v.object({ a: v.undefined() });
      expect(s.safeParse({ a: 'x' }).success).toBe(false);
    });
  });

  describe('mixed fields', () => {
    test('object({a: any(), b: string()}) with {b: "x"} rejects (a missing)', () => {
      const s = v.object({ a: v.any(), b: v.string() });
      const r = s.safeParse({ b: 'x' });
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues[0]!.path).toEqual(['a']);
      }
    });

    test('object({a: any(), b: string()}) with {a: 1, b: "x"} accepts', () => {
      const s = v.object({ a: v.any(), b: v.string() });
      expect(s.safeParse({ a: 1, b: 'x' }).success).toBe(true);
    });
  });

  describe('nested object', () => {
    test('object({a: object({b: any()})}) with {a: {}} rejects (inner b missing)', () => {
      const s = v.object({ a: v.object({ b: v.any() }) });
      const r = s.safeParse({ a: {} });
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues[0]!.path).toEqual(['a', 'b']);
      }
    });

    test('object({a: object({b: any()})}) with {a: {b: 1}} accepts', () => {
      const s = v.object({ a: v.object({ b: v.any() }) });
      expect(s.safeParse({ a: { b: 1 } }).success).toBe(true);
    });
  });

  describe('discriminated union (parseTrustedKnownObject path)', () => {
    test('matched arm with required any missing rejects', () => {
      const s = v.discriminatedUnion('type', [
        v.object({ type: v.literal('x'), data: v.any() })
      ]);
      const r = s.safeParse({ type: 'x' });
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues[0]!.path).toEqual(['data']);
      }
    });

    test('matched arm with all required fields present accepts', () => {
      const s = v.discriminatedUnion('type', [
        v.object({ type: v.literal('x'), data: v.any() })
      ]);
      expect(s.safeParse({ type: 'x', data: 42 }).success).toBe(true);
    });
  });

  describe('exhaustive — every SimpleFieldMode exercises the required check', () => {
    // These are the modes the bug affected. Each one goes through a slightly
    // different code path, so we need a separate test per mode.
    const modes = [
      ['any()', v.any()],
      ['unknown()', v.unknown()],
      ['undefined()', v.undefined()]
    ] as const;

    for (const [label, validator] of modes) {
      test(`parse() (not safeParse) rejects missing required ${label}`, () => {
        const s = v.object({ x: validator });
        expect(() => s.parse({})).toThrow();
      });

      test(`parse() accepts present ${label} field (regardless of value)`, () => {
        const s = v.object({ x: validator });
        // For any/unknown/undefined the value can be anything (incl. undefined)
        const r = s.parse({ x: undefined });
        expect(r).toEqual({ x: undefined });
      });
    }
  });

  describe('slow path coverage (parseObjectValue, triggered by .strict() / complex validator mix)', () => {
    // The fast path (parseSimpleObjectValue) is taken when every field is
    // a simple mode. To exercise parseObjectValue we either set .strict() or
    // mix a simple field with a complex one (e.g. an array of any).
    test('object({a: any()}).strict() with {} rejects (slow path passthrough)', () => {
      const s = v.object({ a: v.any() }).strict();
      const r = s.safeParse({});
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues[0]!.path).toEqual(['a']);
      }
    });

    test('object({a: unknown()}).strict() with {} rejects (slow path passthrough)', () => {
      const s = v.object({ a: v.unknown() }).strict();
      const r = s.safeParse({});
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues[0]!.path).toEqual(['a']);
      }
    });

    test('object({a: undefined()}).strict() with {} rejects (slow path undefinedValue)', () => {
      const s = v.object({ a: v.undefined() }).strict();
      const r = s.safeParse({});
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues[0]!.path).toEqual(['a']);
      }
    });

    test('mixed simple + complex: {a: any(), b: array(string())} with {} rejects for a', () => {
      const s = v.object({ a: v.any(), b: v.array(v.string()) });
      const r = s.safeParse({});
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues[0]!.path).toEqual(['a']);
      }
    });

    test('mixed simple + complex: {a: unknown(), b: array(string())} with {} rejects for a', () => {
      const s = v.object({ a: v.unknown(), b: v.array(v.string()) });
      const r = s.safeParse({});
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues[0]!.path).toEqual(['a']);
      }
    });

    test('mixed simple + complex: {a: undefined(), b: array(string())} with {} rejects for a', () => {
      const s = v.object({ a: v.undefined(), b: v.array(v.string()) });
      const r = s.safeParse({});
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues[0]!.path).toEqual(['a']);
      }
    });
  });
});
