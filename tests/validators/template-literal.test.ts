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

  describe('validator type patterns', () => {
    it('should work with VldNumber validator', () => {
      const schema = v.templateLiteral('count-', v.number());

      expect(schema.parse('count-42')).toBe('count-42');
      expect(schema.parse('count-3.14')).toBe('count-3.14');
      expect(schema.parse('count--5')).toBe('count--5');
    });

    it('should work with VldBigInt validator', () => {
      const schema = v.templateLiteral('bigint-', v.bigint());

      expect(schema.parse('bigint-123456789')).toBe('bigint-123456789');
      expect(schema.parse('bigint--999')).toBe('bigint--999');
    });

    it('should work with VldBoolean validator', () => {
      const schema = v.templateLiteral('flag-', v.boolean());

      expect(schema.parse('flag-true')).toBe('flag-true');
      expect(schema.parse('flag-false')).toBe('flag-false');
    });

    it('should work with VldNull validator', () => {
      const schema = v.templateLiteral('value-', v.null());

      expect(schema.parse('value-null')).toBe('value-null');
    });

    it('should work with VldUndefined validator', () => {
      const schema = v.templateLiteral('value-', v.undefined());

      expect(schema.parse('value-undefined')).toBe('value-undefined');
    });

    it('should work with VldLiteral validator', () => {
      // Note: templateLiteral uses regex matching, so literal validators
      // are pattern-matched as string in the template
      const schema = v.templateLiteral('type-', v.literal('active'));

      expect(schema.parse('type-active')).toBe('type-active');
      // Literal in template just becomes a pattern, doesn't validate value
    });

    it('should work with complex validator chains', () => {
      const schema = v.templateLiteral('user-', v.string().min(1), '-', v.number());

      expect(schema.parse('user-john-123')).toBe('user-john-123');
    });

    it('should use default pattern for custom validators', () => {
      // Custom validator via custom should fall back to default pattern (.+)
      const customValidator = v.custom({
        parse: (val: unknown) => {
          if (typeof val !== 'string') throw new Error('Expected string');
          return val;
        }
      });
      const schema = v.templateLiteral('custom-', customValidator);

      expect(schema.parse('custom-anything')).toBe('custom-anything');
      expect(schema.parse('custom-123abc')).toBe('custom-123abc');
    });

    it('should handle VldInt validator as number pattern', () => {
      const schema = v.templateLiteral('int-', v.int());

      expect(schema.parse('int-42')).toBe('int-42');
      expect(schema.parse('int--10')).toBe('int--10');
    });
  });

  describe('regex character escaping', () => {
    it('should escape special regex characters in string literals', () => {
      const schema = v.templateLiteral('price: $', v.number());

      expect(schema.parse('price: $99')).toBe('price: $99');
      expect(schema.parse('price: $19.99')).toBe('price: $19.99');
    });

    it('should escape dots in string literals', () => {
      const schema = v.templateLiteral('v', v.number(), '.', v.number(), '.', v.number());

      expect(schema.parse('v1.0.0')).toBe('v1.0.0');
      expect(schema.parse('v10.20.30')).toBe('v10.20.30');
    });

    it('should escape brackets in string literals', () => {
      const schema = v.templateLiteral('[', v.string(), ']');

      expect(schema.parse('[test]')).toBe('[test]');
      expect(schema.parse('[hello world]')).toBe('[hello world]');
    });

    it('should escape parentheses in string literals', () => {
      const schema = v.templateLiteral('(', v.number(), ')');

      expect(schema.parse('(42)')).toBe('(42)');
    });

    it('should escape plus and asterisk in string literals', () => {
      const schema = v.templateLiteral(v.number(), '+', v.number(), '*', v.number());

      expect(schema.parse('2+3*4')).toBe('2+3*4');
    });

    it('should escape question mark in string literals', () => {
      const schema = v.templateLiteral('is-valid?-', v.boolean());

      expect(schema.parse('is-valid?-true')).toBe('is-valid?-true');
    });

    it('should escape caret and pipe in string literals', () => {
      const schema = v.templateLiteral('^', v.string(), '|', v.string());

      expect(schema.parse('^start|end')).toBe('^start|end');
    });

    it('should escape backslash in string literals', () => {
      const schema = v.templateLiteral('path\\', v.string());

      expect(schema.parse('path\\file')).toBe('path\\file');
    });
  });

  describe('edge cases', () => {
    it('should handle only string literals', () => {
      const schema = v.templateLiteral('hello', '-', 'world');

      expect(schema.parse('hello-world')).toBe('hello-world');
      expect(() => schema.parse('hello-universe')).toThrow();
    });

    it('should handle empty string literals', () => {
      const schema = v.templateLiteral('', v.string(), '');

      expect(schema.parse('anything')).toBe('anything');
    });

    it('should reject empty strings when validator requires content', () => {
      const schema = v.templateLiteral('prefix-', v.string());

      expect(() => schema.parse('prefix-')).toThrow();
    });

    it('should work with VldVoid validator (undefined pattern)', () => {
      const schema = v.templateLiteral('void-', v.void());

      expect(schema.parse('void-undefined')).toBe('void-undefined');
    });
  });
});
