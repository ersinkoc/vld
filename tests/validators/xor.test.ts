/**
 * Tests for VldXor validator
 * Tests exclusive union functionality
 */

import { v } from '../../src';

describe('VldXor', () => {
  describe('basic usage', () => {
    it('should accept when exactly one schema matches', () => {
      const schema = v.xor(
        v.string(),
        v.number()
      );

      expect(schema.safeParse('hello').success).toBe(true);
      expect(schema.safeParse(42).success).toBe(true);
    });

    it('should reject when no schema matches', () => {
      const schema = v.xor(
        v.string(),
        v.number()
      );

      const result = schema.safeParse(true);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('No schema matched');
      }
    });

    it('should reject when multiple schemas match', () => {
      // String and string.min(1) - both will match for non-empty strings
      const schema = v.xor(
        v.string(),
        v.string().min(1)
      );

      const result = schema.safeParse('hello');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('matches 2 schemas');
      }
    });
  });

  describe('with objects', () => {
    it('should handle mutually exclusive object shapes', () => {
      const schema = v.xor(
        v.object({ type: v.literal('a'), value: v.string() }),
        v.object({ type: v.literal('b'), count: v.number() })
      );

      const result1 = schema.safeParse({ type: 'a', value: 'hello' });
      expect(result1.success).toBe(true);

      const result2 = schema.safeParse({ type: 'b', count: 42 });
      expect(result2.success).toBe(true);
    });

    it('should reject if input matches multiple object schemas', () => {
      const schema = v.xor(
        v.object({ name: v.string() }),
        v.object({ name: v.string(), age: v.number() })
      );

      // This matches both schemas
      const result = schema.safeParse({ name: 'John', age: 30 });
      expect(result.success).toBe(false);
    });
  });

  describe('with primitives', () => {
    it('should work with disjoint primitive types', () => {
      const schema = v.xor(
        v.string(),
        v.boolean(),
        v.number()
      );

      expect(schema.safeParse('hello').success).toBe(true);
      expect(schema.safeParse(true).success).toBe(true);
      expect(schema.safeParse(42).success).toBe(true);
      expect(schema.safeParse(null).success).toBe(false);
    });
  });

  describe('with literals', () => {
    it('should work with literal values', () => {
      const schema = v.xor(
        v.literal('red'),
        v.literal('green'),
        v.literal('blue')
      );

      expect(schema.safeParse('red').success).toBe(true);
      expect(schema.safeParse('green').success).toBe(true);
      expect(schema.safeParse('blue').success).toBe(true);
      expect(schema.safeParse('yellow').success).toBe(false);
    });
  });

  describe('error messages', () => {
    it('should provide clear error when no match', () => {
      const schema = v.xor(
        v.string(),
        v.number()
      );

      const result = schema.safeParse(true);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('No schema matched');
      }
    });

    it('should show count when multiple matches', () => {
      const schema = v.xor(
        v.string(),
        v.string().email()
      );

      const result = schema.safeParse('test@example.com');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('matches 2 schemas');
      }
    });
  });

  describe('getOptions', () => {
    it('should return all options', () => {
      const option1 = v.string();
      const option2 = v.number();

      const schema = v.xor(option1, option2);

      const options = schema.getOptions();
      expect(options).toHaveLength(2);
      expect(options[0]).toBe(option1);
      expect(options[1]).toBe(option2);
    });
  });

  describe('parse method', () => {
    it('should throw when no match', () => {
      const schema = v.xor(
        v.string(),
        v.number()
      );

      expect(() => schema.parse(true)).toThrow();
    });

    it('should throw when multiple matches', () => {
      const schema = v.xor(
        v.string(),
        v.string()
      );

      expect(() => schema.parse('hello')).toThrow();
    });

    it('should return value when exactly one matches', () => {
      const schema = v.xor(
        v.string(),
        v.number()
      );

      const result = schema.parse('hello');
      expect(result).toBe('hello');
    });
  });

  describe('minimum options validation', () => {
    it('should require at least 2 options', () => {
      expect(() => v.xor(v.string())).toThrow();
    });
  });

  describe('complex scenarios', () => {
    it('should handle email vs phone number', () => {
      const ContactMethod = v.xor(
        v.object({ type: v.literal('email'), address: v.string().email() }),
        v.object({ type: v.literal('phone'), number: v.string() })
      );

      const email = { type: 'email' as const, address: 'user@example.com' };
      const phone = { type: 'phone' as const, number: '+1234567890' };

      expect(ContactMethod.safeParse(email).success).toBe(true);
      expect(ContactMethod.safeParse(phone).success).toBe(true);
    });

    it('should work with refinements', () => {
      const schema = v.xor(
        v.number().refine((n) => n > 0, 'Must be positive'),
        v.number().refine((n) => n < 0, 'Must be negative')
      );

      expect(schema.safeParse(5).success).toBe(true);
      expect(schema.safeParse(-5).success).toBe(true);
      expect(schema.safeParse(0).success).toBe(false);
    });
  });
});
