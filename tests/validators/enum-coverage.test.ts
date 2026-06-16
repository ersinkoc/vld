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

    it('should use the Set-backed lookup path for larger enums', () => {
      const schema = v.enum('draft', 'queued', 'running', 'done', 'failed', 'cancelled', 'archived');

      expect(schema.parse('archived')).toBe('archived');
      expect(schema.safeParse('running')).toEqual({ success: true, data: 'running' });
      expect(schema.safeParse('missing').success).toBe(false);
    });

    it('should cover the unrolled lookup paths for medium-sized enums', () => {
      expect(v.enum('only').parse('only')).toBe('only');
      expect(v.enum('a', 'b').parse('b')).toBe('b');
      expect(v.enum('a', 'b', 'c').parse('c')).toBe('c');
      expect(v.enum('a', 'b', 'c', 'd').parse('d')).toBe('d');
      expect(v.enum('a', 'b', 'c', 'd', 'e').parse('e')).toBe('e');
      expect(v.enum('a', 'b', 'c', 'd', 'e', 'f').parse('f')).toBe('f');
    });

    it('should reject invalid strings through every unrolled parse path', () => {
      expect(() => v.enum('only').parse('missing')).toThrow();
      expect(() => v.enum('a', 'b').parse('missing')).toThrow();
      expect(() => v.enum('a', 'b', 'c').parse('missing')).toThrow();
      expect(() => v.enum('a', 'b', 'c', 'd').parse('missing')).toThrow();
      expect(() => v.enum('a', 'b', 'c', 'd', 'e').parse('missing')).toThrow();
      expect(() => v.enum('a', 'b', 'c', 'd', 'e', 'f').parse('missing')).toThrow();
      expect(() => v.enum('a', 'b', 'c', 'd', 'e', 'f', 'g').parse('missing')).toThrow();
    });

    it('should cover the unrolled safeParse success and failure paths', () => {
      expect(v.enum('only').safeParse('only')).toEqual({ success: true, data: 'only' });
      expect(v.enum('only').safeParse('missing').success).toBe(false);

      expect(v.enum('a', 'b').safeParse('b')).toEqual({ success: true, data: 'b' });
      expect(v.enum('a', 'b').safeParse('missing').success).toBe(false);

      expect(v.enum('a', 'b', 'c').safeParse('c')).toEqual({ success: true, data: 'c' });
      expect(v.enum('a', 'b', 'c').safeParse('missing').success).toBe(false);

      expect(v.enum('a', 'b', 'c', 'd').safeParse('d')).toEqual({ success: true, data: 'd' });
      expect(v.enum('a', 'b', 'c', 'd').safeParse('missing').success).toBe(false);

      expect(v.enum('a', 'b', 'c', 'd', 'e').safeParse('e')).toEqual({ success: true, data: 'e' });
      expect(v.enum('a', 'b', 'c', 'd', 'e').safeParse('missing').success).toBe(false);

      expect(v.enum('a', 'b', 'c', 'd', 'e', 'f').safeParse('f')).toEqual({ success: true, data: 'f' });
      expect(v.enum('a', 'b', 'c', 'd', 'e', 'f').safeParse('missing').success).toBe(false);
    });

    it('should cover enum exclusion and extraction helpers', () => {
      const schema = v.enum('red', 'green', 'blue');

      expect(schema.exclude('red').parse('green')).toBe('green');
      expect(() => schema.exclude('red', 'green', 'blue')).toThrow('Cannot exclude all enum values');
      expect(schema.extract('blue').parse('blue')).toBe('blue');
      expect(() => schema.extract('yellow')).toThrow('Cannot extract non-existent enum values');
    });
  });
});
