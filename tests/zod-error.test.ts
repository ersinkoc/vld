/**
 * ZodError compatibility tests
 *
 * Verifies VLD's ZodLikeError provides the same shape and helpers that
 * Zod users expect, enabling true drop-in replacement.
 */
import { v, toZodError, toZodSafeResult, ZodLikeError } from '../src';

describe('ZodError compatibility', () => {
  it('toZodError returns ZodLikeError with name=ZodError', () => {
    const r = v.object({ a: v.string() }).safeParse({ a: 1 });
    expect(r.success).toBe(false);
    if (!r.success) {
      const zErr = toZodError(r.error);
      expect(zErr).toBeInstanceOf(ZodLikeError);
      expect(zErr.name).toBe('ZodError');
    }
  });

  it('issues array is preserved with code/path/message', () => {
    const r = v.object({ a: v.string() }).safeParse({ a: 1 });
    expect(r.success).toBe(false);
    if (!r.success) {
      const zErr = toZodError(r.error);
      expect(Array.isArray(zErr.issues)).toBe(true);
      expect(zErr.issues.length).toBe(1);
      const firstIssue = zErr.issues[0]!;
      expect(firstIssue.code).toBe('invalid_type');
      expect(firstIssue.path).toEqual(['a']);
      expect(typeof firstIssue.message).toBe('string');
    }
  });

  it('format() returns a tree of _errors arrays', () => {
    const r = v.object({ a: v.string() }).safeParse({ a: 1 });
    expect(r.success).toBe(false);
    if (!r.success) {
      const fmt = toZodError(r.error).format();
      expect(fmt).toHaveProperty('_errors');
      expect(Array.isArray((fmt as any)._errors)).toBe(true);
    }
  });

  it('flatten() returns {formErrors, fieldErrors}', () => {
    const r = v.object({ a: v.string(), b: v.number() }).safeParse({ a: 1, b: 'x' });
    expect(r.success).toBe(false);
    if (!r.success) {
      const flat = toZodError(r.error).flatten();
      expect(flat).toHaveProperty('formErrors');
      expect(flat).toHaveProperty('fieldErrors');
      expect(Array.isArray(flat.formErrors)).toBe(true);
      expect(typeof flat.fieldErrors).toBe('object');
    }
  });

  it('toZodSafeResult converts {success, data, error} to Zod shape', () => {
    const r = v.object({ a: v.string() }).safeParse({ a: 1 });
    const converted = toZodSafeResult(r);
    expect(converted.success).toBe(false);
    if (!converted.success) {
      expect(converted.error.name).toBe('ZodError');
      expect(converted.error.issues.length).toBeGreaterThan(0);
    }
  });

  it('toZodSafeResult preserves success path', () => {
    const r = v.string().safeParse('hello');
    const converted = toZodSafeResult(r);
    expect(converted.success).toBe(true);
    if (converted.success) {
      expect(converted.data).toBe('hello');
    }
  });

  it('ZodLikeError.errors getter alias of issues', () => {
    const zErr = new ZodLikeError([{ code: 'custom', path: [], message: 'x' }]);
    expect(zErr.errors).toBe(zErr.issues);
  });

  it('ZodLikeError extends Error and is throwable', () => {
    const zErr = new ZodLikeError([]);
    expect(zErr).toBeInstanceOf(Error);
    expect(() => { throw zErr; }).toThrow(ZodLikeError);
  });
});
