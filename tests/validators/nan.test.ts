/**
 * Tests for VldNan validator
 */

import { v } from '../../src';

describe('VldNan', () => {
  describe('basic validation', () => {
    it('should accept NaN', () => {
      const schema = v.nan();
      expect(schema.parse(NaN)).toBeNaN();
    });

    it('should reject valid numbers', () => {
      const schema = v.nan();
      expect(() => schema.parse(0)).toThrow();
      expect(() => schema.parse(1)).toThrow();
      expect(() => schema.parse(-1)).toThrow();
      expect(() => schema.parse(1.5)).toThrow();
      expect(() => schema.parse(Infinity)).toThrow();
      expect(() => schema.parse(-Infinity)).toThrow();
    });

    it('should reject non-number types', () => {
      const schema = v.nan();
      expect(() => schema.parse('NaN')).toThrow();
      expect(() => schema.parse(null)).toThrow();
      expect(() => schema.parse(undefined)).toThrow();
      expect(() => schema.parse({})).toThrow();
      expect(() => schema.parse(false)).toThrow();
    });

    it('should use Number.isNaN for strict checking', () => {
      const schema = v.nan();
      // Number.isNaN only returns true for actual NaN
      expect(schema.parse(NaN)).toBeNaN();
      // unlike global isNaN(), which coerces values
      expect(() => schema.parse('NaN' as any)).toThrow();
    });
  });

  describe('safeParse', () => {
    it('should return success for NaN', () => {
      const schema = v.nan();
      const result = schema.safeParse(NaN);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNaN();
      }
    });

    it('should return error for non-NaN values', () => {
      const schema = v.nan();
      const result = schema.safeParse(42);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Expected NaN');
      }
    });
  });

  describe('type inference', () => {
    it('should infer number type', () => {
      const schema = v.nan();
      type Inferred = typeof schema extends { parse: (input: unknown) => infer T } ? T : never;
      const value: Inferred = NaN;
      expect(value).toBeNaN();
    });
  });

  describe('chaining', () => {
    it('should work with optional', () => {
      const schema = v.nan().optional();
      expect(schema.parse(NaN)).toBeNaN();
      expect(schema.parse(undefined)).toBe(undefined);
      expect(() => schema.parse(42)).toThrow();
    });

    it('should work with nullable', () => {
      const schema = v.nan().nullable();
      expect(schema.parse(NaN)).toBeNaN();
      expect(schema.parse(null)).toBe(null);
      expect(() => schema.parse(42)).toThrow();
    });

    it('should work with default', () => {
      const schema = v.nan().default(NaN);
      expect(schema.parse(undefined)).toBeNaN();
      expect(schema.parse(NaN)).toBeNaN();
    });

    it('should work with transform', () => {
      const schema = v.nan().transform(() => 'is-nan');
      expect(schema.parse(NaN)).toBe('is-nan');
    });
  });

  describe('edge cases', () => {
    it('should distinguish NaN from Infinity', () => {
      const schema = v.nan();
      expect(() => schema.parse(Infinity)).toThrow();
      expect(() => schema.parse(-Infinity)).toThrow();
    });

    it('should handle NaN constructed different ways', () => {
      const schema = v.nan();
      expect(schema.parse(NaN)).toBeNaN();
      expect(schema.parse(0 / 0)).toBeNaN();
      expect(schema.parse(Number('NaN'))).toBeNaN();
    });
  });
});
