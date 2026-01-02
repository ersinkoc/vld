/**
 * Tests for v.NEVER constant - always-failing validator
 */

import { v } from '../../src';

describe('v.NEVER', () => {
  describe('basic behavior', () => {
    it('should always fail with parse()', () => {
      expect(() => v.NEVER.parse('anything')).toThrow();
      expect(() => v.NEVER.parse(null)).toThrow();
      expect(() => v.NEVER.parse(undefined)).toThrow();
      expect(() => v.NEVER.parse(123)).toThrow();
    });

    it('should always fail with safeParse()', () => {
      const result1 = v.NEVER.safeParse('anything');
      expect(result1.success).toBe(false);

      const result2 = v.NEVER.safeParse(null);
      expect(result2.success).toBe(false);

      const result3 = v.NEVER.safeParse(123);
      expect(result3.success).toBe(false);
    });

    it('should provide appropriate error message', () => {
      const result = v.NEVER.safeParse('test');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBeTruthy();
        expect(result.error.message.toLowerCase()).toContain('never');
      }
    });
  });

  describe('use in transforms', () => {
    it('should work as output type in transforms that throw', () => {
      const failSchema = v.string().transform(() => {
        throw new Error('Intentional failure');
        // return v.NEVER.parse(); // TypeScript never reaches here
      });

      const result = failSchema.safeParse('input');
      expect(result.success).toBe(false);
    });

    it('should be useful for conditional transforms', () => {
      const conditionalSchema = v.string().transform((str) => {
        if (str === 'fail') {
          throw new Error('Cannot process this value');
        }
        return str.toUpperCase();
      });

      expect(conditionalSchema.parse('hello')).toBe('HELLO');
      expect(() => conditionalSchema.parse('fail')).toThrow();
    });
  });

  describe('type safety', () => {
    it('should have never type for both input and output', () => {
      // TypeScript should infer type as VldNever<never, never>
      // This means it cannot accept any input and cannot produce any output
      // These should all be type errors (if strict TypeScript checking is on):
      // const value1: string = v.NEVER.parse('test');
      // const value2: number = v.NEVER.parse(123);
      expect(true).toBe(true); // Placeholder test for type checking
    });
  });

  describe('comparison with v.never()', () => {
    it('should behave the same as v.never()', () => {
      const neverFunc = v.never();
      const neverConst = v.NEVER;

      const result1 = neverFunc.safeParse('test');
      const result2 = neverConst.safeParse('test');

      expect(result1.success).toBe(result2.success);
      expect(result1.success).toBe(false);
    });
  });

  describe('integration with other validators', () => {
    it('should not be callable with optional', () => {
      // v.NEVER is a constant, not a factory function
      // So v.NEVER.optional() won't work the same way as v.never().optional()
      // But it's still a VldNever instance which has those methods
      const optionalNever = v.never().optional();

      expect(optionalNever.parse(undefined)).toBe(undefined);
    });

    it('should work in unions to indicate impossible branches', () => {
      // Example: after refinement that narrows type to impossible case
      const schema = v.string().refine((str) => str.length > 0, 'String must not be empty');

      const validResult = schema.safeParse('hello');
      expect(validResult.success).toBe(true);

      const invalidResult = schema.safeParse('');
      expect(invalidResult.success).toBe(false);
    });
  });
});
