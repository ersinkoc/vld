/**
 * Tests for VldUndefined validator
 */

import { v } from '../../src';

describe('VldUndefined', () => {
  describe('basic validation', () => {
    it('should accept undefined', () => {
      const schema = v.undefined();
      expect(schema.parse(undefined)).toBe(undefined);
    });

    it('should reject null', () => {
      const schema = v.undefined();
      expect(() => schema.parse(null)).toThrow();
    });

    it('should reject other types', () => {
      const schema = v.undefined();
      expect(() => schema.parse('undefined')).toThrow();
      expect(() => schema.parse(0)).toThrow();
      expect(() => schema.parse(false)).toThrow();
      expect(() => schema.parse({})).toThrow();
    });
  });

  describe('safeParse', () => {
    it('should return success for undefined', () => {
      const schema = v.undefined();
      const result = schema.safeParse(undefined);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(undefined);
      }
    });

    it('should return error for non-undefined values', () => {
      const schema = v.undefined();
      const result = schema.safeParse(null);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Expected undefined');
      }
    });
  });

  describe('type inference', () => {
    it('should infer correct type', () => {
      const schema = v.undefined();
      type Inferred = typeof schema extends { parse: (input: unknown) => infer T } ? T : never;
      const value: Inferred = undefined;
      expect(value).toBe(undefined);
    });
  });

  describe('chaining', () => {
    it('should work with optional', () => {
      const schema = v.undefined().optional();
      expect(schema.parse(undefined)).toBe(undefined);
      expect(() => schema.parse(null)).toThrow();
    });

    it('should work with nullable', () => {
      const schema = v.undefined().nullable();
      expect(schema.parse(undefined)).toBe(undefined);
      expect(schema.parse(null)).toBe(null);
    });

    it('should work with default', () => {
      const schema = v.undefined().default(undefined);
      expect(schema.parse(undefined)).toBe(undefined);
      expect(schema.parse(undefined as any)).toBe(undefined);
    });
  });
});
