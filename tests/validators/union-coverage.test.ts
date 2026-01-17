/**
 * Coverage tests for VldUnion validator
 * These tests target specific uncovered type checker paths
 */

import { v } from '../../src';

describe('VldUnion Coverage Tests', () => {
  describe('Type checker inference', () => {
    it('should use array type checker', () => {
      // Union with array validator should use Array.isArray check
      const schema = v.union(v.string(), v.array(v.number()));

      expect(schema.safeParse([1, 2, 3]).success).toBe(true);
      expect(schema.safeParse('hello').success).toBe(true);
      expect(schema.safeParse(123).success).toBe(false);
    });

    it('should use object type checker', () => {
      // Union with object validator should use object type check
      const schema = v.union(v.string(), v.object({ name: v.string() }));

      expect(schema.safeParse({ name: 'John' }).success).toBe(true);
      expect(schema.safeParse('hello').success).toBe(true);
      expect(schema.safeParse(123).success).toBe(false);
    });

    it('should use null type checker', () => {
      const schema = v.union(v.string(), v.null());

      expect(schema.safeParse(null).success).toBe(true);
      expect(schema.safeParse('hello').success).toBe(true);
      expect(schema.safeParse(123).success).toBe(false);
    });

    it('should use undefined type checker', () => {
      const schema = v.union(v.string(), v.undefined());

      expect(schema.safeParse(undefined).success).toBe(true);
      expect(schema.safeParse('hello').success).toBe(true);
      expect(schema.safeParse(123).success).toBe(false);
    });

    it('should use boolean type checker', () => {
      const schema = v.union(v.string(), v.boolean());

      expect(schema.safeParse(true).success).toBe(true);
      expect(schema.safeParse(false).success).toBe(true);
      expect(schema.safeParse('hello').success).toBe(true);
      expect(schema.safeParse(123).success).toBe(false);
    });

    it('should use number type checker', () => {
      const schema = v.union(v.string(), v.number());

      expect(schema.safeParse(123).success).toBe(true);
      expect(schema.safeParse('hello').success).toBe(true);
      expect(schema.safeParse(true).success).toBe(false);
    });
  });

  describe('Error collection in safeParse', () => {
    it('should collect errors from all validators when all fail', () => {
      const schema = v.union(
        v.string().min(10),
        v.number().positive()
      );

      const result = schema.safeParse(-5);

      expect(result.success).toBe(false);
      if (!result.success) {
        // Error should mention failure reasons
        expect(result.error.message).toBeDefined();
      }
    });

    it('should skip validators based on type check', () => {
      // With type checkers, some validators are skipped entirely
      const schema = v.union(
        v.string().email(),
        v.number().int()
      );

      // Number input should skip string validator due to type check
      const result = schema.safeParse(42);
      expect(result.success).toBe(true);
    });
  });

  describe('Union with multiple options', () => {
    it('should find first matching validator', () => {
      const schema = v.union(
        v.string(),
        v.number(),
        v.boolean()
      );

      expect(schema.safeParse('test').success).toBe(true);
      expect(schema.safeParse(42).success).toBe(true);
      expect(schema.safeParse(true).success).toBe(true);
      expect(schema.safeParse(null).success).toBe(false);
    });
  });
});
