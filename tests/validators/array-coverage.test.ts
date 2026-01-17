/**
 * Coverage tests for VldArray validator
 * These tests target specific uncovered lines in array.ts
 */

import { v } from '../../src';

describe('VldArray Coverage Tests', () => {
  describe('stableStringify edge cases', () => {
    it('should handle max depth exceeded in unique check', () => {
      const schema = v.array(v.any()).unique();

      // Create a deeply nested object that exceeds MAX_DEPTH (100)
      let deepObject: any = { value: 'bottom' };
      for (let i = 0; i < 110; i++) {
        deepObject = { nested: deepObject };
      }

      // This should trigger the max depth check in stableStringify
      // The fallback "[Max Depth Exceeded]" string should be used
      const result = schema.safeParse([deepObject]);

      // Should still work (just with the fallback string)
      expect(result.success).toBe(true);
    });

    it('should handle circular references in unique check', () => {
      const schema = v.array(v.any()).unique();

      // Create an object with circular reference
      const circular: any = { name: 'test' };
      circular.self = circular;

      // This should handle the circular reference gracefully
      const result = schema.safeParse([circular]);

      expect(result.success).toBe(true);
    });

    it('should detect non-unique deeply nested objects', () => {
      const schema = v.array(v.any()).unique();

      const obj1 = { a: { b: { c: 1 } } };
      const obj2 = { a: { b: { c: 1 } } }; // Same structure

      const result = schema.safeParse([obj1, obj2]);

      expect(result.success).toBe(false);
    });

    it('should allow unique deeply nested objects', () => {
      const schema = v.array(v.any()).unique();

      const obj1 = { a: { b: { c: 1 } } };
      const obj2 = { a: { b: { c: 2 } } }; // Different value

      const result = schema.safeParse([obj1, obj2]);

      expect(result.success).toBe(true);
    });

    it('should handle arrays with null values', () => {
      const schema = v.array(v.any()).unique();

      const result = schema.safeParse([null, 'test', null]);

      expect(result.success).toBe(false); // Duplicate nulls
    });

    it('should handle arrays with undefined values', () => {
      const schema = v.array(v.any()).unique();

      const result = schema.safeParse([undefined, 'test']);

      expect(result.success).toBe(true);
    });

    it('should handle arrays with bigint values', () => {
      const schema = v.array(v.any()).unique();

      // BigInt values can be compared directly
      const result = schema.safeParse([BigInt(123), BigInt(456)]);
      expect(result.success).toBe(true);
    });

    it('should detect duplicate bigint values', () => {
      const schema = v.array(v.any()).unique();

      // Same BigInt values should be detected as duplicates
      const result = schema.safeParse([BigInt(123), BigInt(123)]);
      expect(result.success).toBe(false);
    });
  });

  describe('Array validation', () => {
    it('should validate minimum length', () => {
      const schema = v.array(v.string()).min(2);

      expect(schema.safeParse(['a']).success).toBe(false);
      expect(schema.safeParse(['a', 'b']).success).toBe(true);
    });

    it('should validate maximum length', () => {
      const schema = v.array(v.string()).max(2);

      expect(schema.safeParse(['a', 'b', 'c']).success).toBe(false);
      expect(schema.safeParse(['a', 'b']).success).toBe(true);
    });

    it('should validate exact length', () => {
      const schema = v.array(v.string()).length(2);

      expect(schema.safeParse(['a']).success).toBe(false);
      expect(schema.safeParse(['a', 'b', 'c']).success).toBe(false);
      expect(schema.safeParse(['a', 'b']).success).toBe(true);
    });

    it('should validate non-empty arrays', () => {
      const schema = v.array(v.string()).nonempty();

      expect(schema.safeParse([]).success).toBe(false);
      expect(schema.safeParse(['a']).success).toBe(true);
    });
  });
});
