/**
 * Coverage tests for VldEnum validator
 * These tests target specific uncovered lines in enum.ts
 */

import { v } from '../../src';

describe('VldEnum Coverage Tests', () => {
  describe('parse() with non-string values', () => {
    it('should throw on number input via parse', () => {
      const schema = v.enum('a', 'b', 'c');

      expect(() => schema.parse(123)).toThrow();
    });

    it('should throw on boolean input via parse', () => {
      const schema = v.enum('true', 'false');

      // Boolean true is not the same as string 'true'
      expect(() => schema.parse(true)).toThrow();
    });

    it('should throw on object input via parse', () => {
      const schema = v.enum('a', 'b');

      expect(() => schema.parse({ value: 'a' })).toThrow();
    });

    it('should throw on null input via parse', () => {
      const schema = v.enum('a', 'b');

      expect(() => schema.parse(null)).toThrow();
    });
  });

  describe('safeParse() with non-string values', () => {
    it('should fail on number input via safeParse', () => {
      const schema = v.enum('a', 'b', 'c');

      const result = schema.safeParse(123);
      expect(result.success).toBe(false);
    });

    it('should fail on boolean input via safeParse', () => {
      const schema = v.enum('true', 'false');

      const result = schema.safeParse(false);
      expect(result.success).toBe(false);
    });

    it('should fail on array input via safeParse', () => {
      const schema = v.enum('a', 'b');

      const result = schema.safeParse(['a']);
      expect(result.success).toBe(false);
    });

    it('should fail on undefined input via safeParse', () => {
      const schema = v.enum('a', 'b');

      const result = schema.safeParse(undefined);
      expect(result.success).toBe(false);
    });
  });

  describe('Valid enum usage', () => {
    it('should accept valid enum values', () => {
      const schema = v.enum('red', 'green', 'blue');

      expect(schema.parse('red')).toBe('red');
      expect(schema.parse('green')).toBe('green');
      expect(schema.parse('blue')).toBe('blue');
    });

    it('should reject unknown string values', () => {
      const schema = v.enum('red', 'green', 'blue');

      expect(() => schema.parse('yellow')).toThrow();
    });
  });
});
