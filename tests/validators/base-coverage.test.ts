/**
 * Coverage tests for base.ts wrapper validators
 * These tests target specific uncovered lines
 */

import { v } from '../../src';

describe('Base Validators Coverage Tests', () => {
  describe('VldReadonly', () => {
    it('should return failure result on safeParse failure path', () => {
      const schema = v.object({ name: v.string() }).readonly();

      const result = schema.safeParse({ name: 123 });

      expect(result.success).toBe(false);
    });

    it('should return success on valid input', () => {
      const schema = v.object({ name: v.string() }).readonly();

      const result = schema.safeParse({ name: 'John' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('John');
      }
    });
  });

  describe('VldDefault with undefined', () => {
    it('should pass through non-undefined values in safeParse', () => {
      const schema = v.string().default('default');

      const result = schema.safeParse('actual');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('actual');
      }
    });

    it('should use default value for undefined in safeParse', () => {
      const schema = v.string().default('default');

      const result = schema.safeParse(undefined);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('default');
      }
    });
  });

  describe('VldOptional - unwrap()', () => {
    it('should return the base validator when unwrapped', () => {
      const baseSchema = v.string();
      const optionalSchema = baseSchema.optional();

      const unwrapped = optionalSchema.unwrap();

      // The unwrapped schema should be the original string validator
      expect(unwrapped.safeParse('test').success).toBe(true);
      expect(unwrapped.safeParse(undefined).success).toBe(false);
    });
  });

  describe('VldNullable - unwrap()', () => {
    it('should return the base validator when unwrapped', () => {
      const baseSchema = v.string();
      const nullableSchema = baseSchema.nullable();

      const unwrapped = nullableSchema.unwrap();

      // The unwrapped schema should be the original string validator
      expect(unwrapped.safeParse('test').success).toBe(true);
      expect(unwrapped.safeParse(null).success).toBe(false);
    });
  });

  describe('VldNullish - unwrap()', () => {
    it('should return the base validator when unwrapped', () => {
      const baseSchema = v.string();
      const nullishSchema = baseSchema.nullish();

      const unwrapped = nullishSchema.unwrap();

      // The unwrapped schema should be the original string validator
      expect(unwrapped.safeParse('test').success).toBe(true);
      expect(unwrapped.safeParse(null).success).toBe(false);
      expect(unwrapped.safeParse(undefined).success).toBe(false);
    });
  });

  describe('VldSuperRefine', () => {
    it('should return success result when no issues added', () => {
      const schema = v.string().superRefine((_val, _ctx) => {
        // No issues added - should pass
      });

      const result = schema.safeParse('valid');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('valid');
      }
    });

    it('should return failure result when issues added', () => {
      const schema = v.string().superRefine((_val, ctx) => {
        ctx.addIssue({ message: 'Custom error', code: 'custom' });
      });

      const result = schema.safeParse('test');

      expect(result.success).toBe(false);
    });
  });

  describe('VldPreprocess', () => {
    it('should catch preprocessor errors in safeParse', () => {
      const schema = v.preprocess((_val) => {
        throw new Error('Preprocessor failed');
      }, v.string());

      const result = schema.safeParse('test');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Preprocessor failed');
      }
    });

    it('should pass preprocessed value to schema', () => {
      const schema = v.preprocess((val) => {
        return String(val).toUpperCase();
      }, v.string());

      const result = schema.safeParse('hello');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('HELLO');
      }
    });
  });
});
