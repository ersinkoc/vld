/**
 * Tests for VldNull validator
 */

import { v } from '../../src';

describe('VldNull', () => {
  describe('basic validation', () => {
    it('should accept null', () => {
      const schema = v.null();
      expect(schema.parse(null)).toBe(null);
    });

    it('should reject undefined', () => {
      const schema = v.null();
      expect(() => schema.parse(undefined)).toThrow();
    });

    it('should reject other types', () => {
      const schema = v.null();
      expect(() => schema.parse('null')).toThrow();
      expect(() => schema.parse(0)).toThrow();
      expect(() => schema.parse(false)).toThrow();
      expect(() => schema.parse({})).toThrow();
    });
  });

  describe('safeParse', () => {
    it('should return success for null', () => {
      const schema = v.null();
      const result = schema.safeParse(null);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(null);
      }
    });

    it('should return error for non-null values', () => {
      const schema = v.null();
      const result = schema.safeParse('null');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Expected null');
      }
    });
  });

  describe('type inference', () => {
    it('should infer correct type', () => {
      const schema = v.null();
      type Inferred = typeof schema extends { parse: (input: unknown) => infer T } ? T : never;
      const value: Inferred = null;
      expect(value).toBe(null);
    });
  });

  describe('chaining', () => {
    it('should work with optional', () => {
      const schema = v.null().optional();
      expect(schema.parse(null)).toBe(null);
      expect(schema.parse(undefined)).toBe(undefined);
      expect(() => schema.parse('null')).toThrow();
    });

    it('should work with nullable', () => {
      const schema = v.null().nullable();
      expect(schema.parse(null)).toBe(null);
      expect(() => schema.parse('null')).toThrow();
    });

    it('should work with default', () => {
      const schema = v.null().default(null);
      expect(schema.parse(undefined)).toBe(null);
      expect(schema.parse(null)).toBe(null);
    });
  });
});
