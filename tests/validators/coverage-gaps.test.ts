/**
 * Coverage-gap tests — exercises pre-existing uncovered branches so the
 * global 100% branch coverage threshold is met. None of these tests
 * exercise new behaviour; they just touch code paths that were missed
 * by the existing suite.
 */

import { vV2, VldError } from '../../src/index';

describe('coverage gaps', () => {
  describe('V2 record with symbol value', () => {
    test('vV2.record(vV2.symbol()) accepts', () => {
      const s = vV2.record(vV2.symbol());
      const a = Symbol('a');
      const b = Symbol('b');
      expect(s.safeParse({ a, b }).success).toBe(true);
    });

    test('vV2.record(vV2.symbol()) rejects non-symbol value', () => {
      const s = vV2.record(vV2.symbol());
      expect(s.safeParse({ a: 'not a symbol' }).success).toBe(false);
    });
  });

  describe('V2 safeParse non-VldError exception path', () => {
    test('vV2.bigint() safeParse wraps non-VldError throws', () => {
      const s = vV2.bigint();
      const r = s.safeParse('not a bigint');
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error).toBeInstanceOf(VldError);
      }
    });

    test('vV2.union() safeParse wraps non-VldError throws', () => {
      const s = vV2.union(vV2.string(), vV2.number());
      const r = s.safeParse(true);
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error).toBeInstanceOf(VldError);
      }
    });
  });

  describe('V2 errorMessage propagation (def.errorMessage ?? this.__def.errorMessage)', () => {
    test('vV2.bigint() withDef passes errorMessage', () => {
      const s = vV2.bigint().min(10n, 'must be at least 10');
      const r = s.safeParse(5n);
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.message).toContain('must be at least 10');
      }
    });

    test('vV2.date() withDef passes errorMessage', () => {
      const s = vV2.date().min(new Date('2024-01-01'), 'too early');
      const r = s.safeParse(new Date('2020-01-01'));
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.message).toContain('too early');
      }
    });
  });

  describe('V2 string coercion from Error', () => {
    test('vV2.coerce.string() with Error instance', () => {
      const s = vV2.coerce.string();
      const err = new Error('boom');
      const r = s.safeParse(err);
      expect(r.success).toBe(true);
      if (r.success) {
        expect(r.data).toBe('boom');
      }
    });
  });

  describe('zod-error received fallback (zod-error.ts:137)', () => {
    test('toZodError with raw.expected set fills received as "unknown"', async () => {
      // To hit the `raw.expected ? "unknown" : undefined` true branch, we need
      // a raw issue with `expected` but no `received` and code=invalid_type.
      const e = new VldError([{
        code: 'invalid_type',
        path: [],
        message: 'bad',
        expected: 'string' as any
      }]);
      const { toZodError } = await import('../../src/zod-error');
      const z = toZodError(e);
      const issue = z.issues[0] as any;
      expect(issue.received).toBe('unknown');
    });

    test('toZodError with neither expected nor received leaves received undefined', async () => {
      // Hits the `: undefined` branch
      const e = new VldError([{ code: 'invalid_type', path: [], message: 'bad' }]);
      const { toZodError } = await import('../../src/zod-error');
      const z = toZodError(e);
      const issue = z.issues[0] as any;
      expect(issue.received).toBeUndefined();
    });
  });
});
