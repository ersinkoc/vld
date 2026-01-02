/**
 * Tests for v.templateLiteral() - template literal type validation
 */

import { v } from '../../src';

describe('v.templateLiteral()', () => {
  describe('basic template literals', () => {
    it('should validate simple string templates', () => {
      const schema = v.templateLiteral('user-', v.string());

      expect(schema.parse('user-john')).toBe('user-john');
      expect(schema.parse('user-admin')).toBe('user-admin');
    });

    it('should reject strings that dont match the template', () => {
      const schema = v.templateLiteral('user-', v.string());

      expect(() => schema.parse('admin')).toThrow();
      expect(() => schema.parse('user-')).toThrow();
    });

    it('should work with multiple components', () => {
      const schema = v.templateLiteral(v.string(), '@', v.string(), '.', v.string());

      expect(schema.parse('user@example.com')).toBe('user@example.com');
      expect(() => schema.parse('user@example')).toThrow();
    });
  });

  describe('with different validator types', () => {
    it('should work with number components', () => {
      const schema = v.templateLiteral('id-', v.string());

      expect(schema.parse('id-123')).toBe('id-123');
      expect(schema.parse('id-45.67')).toBe('id-45.67');
      expect(() => schema.parse('id-')).toThrow();
    });

    it('should work with literal values', () => {
      const schema = v.templateLiteral('http://', v.string());

      expect(schema.parse('http://example.com')).toBe('http://example.com');
      expect(() => schema.parse('https://example.com')).toThrow();
    });

    it('should work with boolean literals', () => {
      const schema = v.templateLiteral('true-', v.string());

      expect(schema.parse('true-active')).toBe('true-active');
      expect(() => schema.parse('false-active')).toThrow();
    });
  });

  describe('method chaining', () => {
    it('should work with optional', () => {
      const schema = v.templateLiteral('user-', v.string()).optional();

      expect(schema.parse('user-john')).toBe('user-john');
      expect(schema.parse(undefined)).toBe(undefined);
    });

    it('should work with nullable', () => {
      const schema = v.templateLiteral('user-', v.string()).nullable();

      expect(schema.parse('user-john')).toBe('user-john');
      expect(schema.parse(null)).toBe(null);
    });

    it('should work with refine', () => {
      const schema = v.templateLiteral('user-', v.string()).refine(
        (val) => val.length > 8,
        'Username must be at least 9 characters'
      );

      expect(schema.parse('user-johndoe')).toBe('user-johndoe');
      expect(() => schema.parse('user-joe')).toThrow();
    });

    it('should work with transform', () => {
      const schema = v.templateLiteral('user-', v.string()).transform((val) => val.toUpperCase());

      const result = schema.safeParse('user-john');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('USER-JOHN');
      }
    });
  });

  describe('integration with other validators', () => {
    it('should work in object schemas', () => {
      const schema = v.object({
        email: v.templateLiteral(v.string(), '@', v.string()),
        userId: v.templateLiteral('user-', v.int())
      });

      const result = schema.safeParse({
        email: 'john@example.com',
        userId: 'user-123'
      });

      expect(result.success).toBe(true);
    });

    it('should work in arrays', () => {
      const schema = v.array(v.templateLiteral('item-', v.number()));

      const result = schema.safeParse(['item-1', 'item-2', 'item-3']);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(['item-1', 'item-2', 'item-3']);
      }
    });
  });

  describe('complex use cases', () => {
    it('should validate email-like patterns', () => {
      const emailSchema = v.templateLiteral(v.string(), '@', v.string(), '.', 'com');

      expect(emailSchema.parse('user@example.com')).toBe('user@example.com');
      expect(() => emailSchema.parse('user@example.org')).toThrow();
    });

    it('should validate URL-like patterns', () => {
      const urlSchema = v.templateLiteral('https://', v.string());

      expect(urlSchema.parse('https://example.com')).toBe('https://example.com');
      expect(() => urlSchema.parse('http://example.com')).toThrow();
    });
  });

  describe('error messages', () => {
    it('should provide descriptive error for non-strings', () => {
      const schema = v.templateLiteral('user-', v.string());

      const result = schema.safeParse(123);
      expect(result.success).toBe(false);
    });

    it('should provide descriptive error for pattern mismatch', () => {
      const schema = v.templateLiteral('user-', v.string());

      const result = schema.safeParse('admin');
      expect(result.success).toBe(false);
    });
  });
});
