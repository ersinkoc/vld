/**
 * Coverage tests for VldArray validator
 * These tests target specific uncovered lines in array.ts
 */

import { v } from '../../src';
import { VldArray } from '../../src/validators/array';

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

    it('should stringify nested null and undefined values during uniqueness checks', () => {
      const schema = v.array(v.any()).unique();

      expect(schema.safeParse([{ value: null }, { value: undefined }]).success).toBe(true);
      expect(schema.safeParse([{ value: null }, { value: null }]).success).toBe(false);
      expect(schema.safeParse([{ value: undefined }, { value: undefined }]).success).toBe(false);
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

    it('should reuse cached object keys for repeated object references', () => {
      const schema = v.array(v.any()).unique();
      const shared = { id: 1 };

      const result = schema.safeParse([shared, shared]);
      expect(result.success).toBe(false);
    });

    it('should fall back to a safe representation when stable stringify fails', () => {
      const schema = v.array(v.any()).unique();
      const value = Object.defineProperty({}, 'unstable', {
        enumerable: true,
        get() {
          throw new Error('unreadable property');
        }
      });

      expect(schema.safeParse([value]).success).toBe(true);
    });
  });

  describe('Array validation', () => {
    it('should use the boolean item fast path', () => {
      const schema = v.array(v.boolean());

      expect(schema.parse([true, false])).toEqual([true, false]);
      expect(schema.safeParse([true, 'false']).success).toBe(false);
    });

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

    it('should use custom messages for length constraints', () => {
      expect(() => v.array(v.string()).length(2, 'Need exactly two').parse(['a'])).toThrow('Need exactly two');
      expect(() => v.array(v.string()).min(2, 'Need at least two').parse(['a'])).toThrow('Need at least two');
      expect(() => v.array(v.string()).max(1, 'Need at most one').parse(['a', 'b'])).toThrow('Need at most one');
    });

    it('should fall back to locale messages when internal length configs have no error message', () => {
      const exact = new (VldArray as any)({ itemValidator: v.string(), exactLength: 2 }) as VldArray<string>;
      const min = new (VldArray as any)({ itemValidator: v.string(), minLength: 2 }) as VldArray<string>;
      const max = new (VldArray as any)({ itemValidator: v.string(), maxLength: 1 }) as VldArray<string>;

      expect(() => exact.parseKnownArray(['a'])).toThrow('Array must have exactly 2 items');
      expect(() => min.parseKnownArray(['a'])).toThrow('Array must have at least 2 items');
      expect(() => max.parseKnownArray(['a', 'b'])).toThrow('Array must have at most 1 items');
    });

    it('should validate non-empty arrays', () => {
      const schema = v.array(v.string()).nonempty();

      expect(schema.safeParse([]).success).toBe(false);
      expect(schema.safeParse(['a']).success).toBe(true);
    });

    it('should stringify non-Error item parse failures', () => {
      const throwingValidator = {
        parse() {
          throw 'plain item failure';
        },
        safeParse() {
          return { success: false, error: new Error('plain item failure') };
        }
      };
      const schema = v.array(throwingValidator as any);

      expect(() => schema.parse(['value'])).toThrow('plain item failure');
      expect(schema.safeParse(['value']).success).toBe(false);
    });
  });
});
