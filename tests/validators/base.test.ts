import { describe, it, expect } from '@jest/globals';
import { VldString } from '../../src/validators/string';
import { VldNumber } from '../../src/validators/number';

describe('VldBase and Utility Validators', () => {
  describe('VldBase Methods', () => {
    it('should provide isValid method', () => {
      const validator = VldString.create();
      expect(validator.isValid('test')).toBe(true);
      expect(validator.isValid(123)).toBe(false);
    });

    it('should provide parseOrDefault method', () => {
      const validator = VldString.create();
      expect(validator.parseOrDefault('test', 'default')).toBe('test');
      expect(validator.parseOrDefault(123, 'default')).toBe('default');
    });
  });

  describe('VldRefine', () => {
    it('should refine with custom validation', () => {
      const validator = VldString.create()
        .refine((val) => val.length > 5);
      
      expect(validator.parse('hello world')).toBe('hello world');
      expect(() => validator.parse('hello')).toThrow();
    });

    it('should use custom error message', () => {
      const validator = VldNumber.create()
        .refine((val) => val % 2 === 0, 'Must be even');
      
      expect(validator.parse(4)).toBe(4);
      expect(() => validator.parse(3)).toThrow('Must be even');
    });

    it('should work with type guards', () => {
      const isPositive = (val: number): val is number => val > 0;
      const validator = VldNumber.create()
        .refine(isPositive);
      
      expect(validator.parse(5)).toBe(5);
      expect(() => validator.parse(-5)).toThrow();
    });

    it('should handle safeParse', () => {
      const validator = VldString.create()
        .refine((val) => val.includes('@'));
      
      const success = validator.safeParse('test@example.com');
      expect(success.success).toBe(true);
      
      const failure = validator.safeParse('test');
      expect(failure.success).toBe(false);
    });
  });

  describe('VldTransform', () => {
    it('should transform values after validation', () => {
      const validator = VldString.create()
        .transform((val) => val.toUpperCase());
      
      expect(validator.parse('hello')).toBe('HELLO');
    });

    it('should chain transformations', () => {
      const validator = VldNumber.create()
        .transform((val) => val * 2)
        .transform((val) => val + 1);
      
      expect(validator.parse(5)).toBe(11); // (5 * 2) + 1
    });

    it('should handle transform errors', () => {
      const validator = VldString.create()
        .transform((val) => {
          if (val === 'error') throw new Error('Transform error');
          return val;
        });
      
      expect(validator.parse('test')).toBe('test');
      expect(() => validator.parse('error')).toThrow('Transform failed');
    });

    it('should handle safeParse', () => {
      const validator = VldNumber.create()
        .transform((val) => val.toString());
      
      const success = validator.safeParse(42);
      expect(success.success).toBe(true);
      if (success.success) {
        expect(success.data).toBe('42');
      }
    });
  });

  describe('VldDefault', () => {
    it('should provide default for undefined', () => {
      const validator = VldString.create().default('default value');
      
      expect(validator.parse(undefined)).toBe('default value');
      expect(validator.parse('test')).toBe('test');
    });

    it('should not use default for null', () => {
      const validator = VldNumber.create().default(42);
      
      expect(validator.parse(undefined)).toBe(42);
      expect(() => validator.parse(null)).toThrow();
    });

    it('should handle safeParse', () => {
      const validator = VldString.create().default('default');
      
      const undefinedResult = validator.safeParse(undefined);
      expect(undefinedResult.success).toBe(true);
      if (undefinedResult.success) {
        expect(undefinedResult.data).toBe('default');
      }
      
      const valueResult = validator.safeParse('value');
      expect(valueResult.success).toBe(true);
      if (valueResult.success) {
        expect(valueResult.data).toBe('value');
      }
    });
  });

  describe('VldCatch', () => {
    it('should catch validation errors and return fallback', () => {
      const validator = VldString.create()
        .min(5)
        .catch('fallback');
      
      expect(validator.parse('hello')).toBe('hello');
      expect(validator.parse('hi')).toBe('fallback');
      expect(validator.parse(123)).toBe('fallback');
    });

    it('should always succeed with safeParse', () => {
      // BUG-NPM-003 FIX: Use valid fallback value (must be positive)
      const validator = VldNumber.create()
        .positive()
        .catch(1);
      
      const success = validator.safeParse(5);
      expect(success.success).toBe(true);
      if (success.success) {
        expect(success.data).toBe(5);
      }
      
      const fallback = validator.safeParse(-5);
      expect(fallback.success).toBe(true);
      if (fallback.success) {
        expect(fallback.data).toBe(1);
      }
    });
  });

  describe('VldOptional', () => {
    it('should allow undefined', () => {
      const validator = VldString.create().optional();
      
      expect(validator.parse(undefined)).toBe(undefined);
      expect(validator.parse('test')).toBe('test');
    });

    it('should not allow null', () => {
      const validator = VldNumber.create().optional();
      
      expect(validator.parse(undefined)).toBe(undefined);
      expect(validator.parse(42)).toBe(42);
      expect(() => validator.parse(null)).toThrow();
    });

    it('should handle safeParse', () => {
      const validator = VldString.create().optional();
      
      const undefinedResult = validator.safeParse(undefined);
      expect(undefinedResult.success).toBe(true);
      if (undefinedResult.success) {
        expect(undefinedResult.data).toBe(undefined);
      }
      
      const valueResult = validator.safeParse('value');
      expect(valueResult.success).toBe(true);
      if (valueResult.success) {
        expect(valueResult.data).toBe('value');
      }
      
      const nullResult = validator.safeParse(null);
      expect(nullResult.success).toBe(false);
    });
  });

  describe('VldNullable', () => {
    it('should allow null', () => {
      const validator = VldString.create().nullable();
      
      expect(validator.parse(null)).toBe(null);
      expect(validator.parse('test')).toBe('test');
    });

    it('should not allow undefined', () => {
      const validator = VldNumber.create().nullable();
      
      expect(validator.parse(null)).toBe(null);
      expect(validator.parse(42)).toBe(42);
      expect(() => validator.parse(undefined)).toThrow();
    });

    it('should handle safeParse', () => {
      const validator = VldString.create().nullable();
      
      const nullResult = validator.safeParse(null);
      expect(nullResult.success).toBe(true);
      if (nullResult.success) {
        expect(nullResult.data).toBe(null);
      }
      
      const valueResult = validator.safeParse('value');
      expect(valueResult.success).toBe(true);
      if (valueResult.success) {
        expect(valueResult.data).toBe('value');
      }
      
      const undefinedResult = validator.safeParse(undefined);
      expect(undefinedResult.success).toBe(false);
    });
  });

  describe('VldNullish', () => {
    it('should allow null and undefined', () => {
      const validator = VldString.create().nullish();
      
      expect(validator.parse(null)).toBe(null);
      expect(validator.parse(undefined)).toBe(undefined);
      expect(validator.parse('test')).toBe('test');
    });

    it('should handle safeParse', () => {
      const validator = VldNumber.create().nullish();
      
      const nullResult = validator.safeParse(null);
      expect(nullResult.success).toBe(true);
      if (nullResult.success) {
        expect(nullResult.data).toBe(null);
      }
      
      const undefinedResult = validator.safeParse(undefined);
      expect(undefinedResult.success).toBe(true);
      if (undefinedResult.success) {
        expect(undefinedResult.data).toBe(undefined);
      }
      
      const valueResult = validator.safeParse(42);
      expect(valueResult.success).toBe(true);
      if (valueResult.success) {
        expect(valueResult.data).toBe(42);
      }
    });
  });

  describe('Chaining Multiple Utilities', () => {
    it('should chain optional with default', () => {
      const validator = VldString.create()
        .optional()
        .default('default');
      
      expect(validator.parse(undefined)).toBe('default');
      expect(validator.parse('test')).toBe('test');
    });

    it('should chain transform with refine', () => {
      const validator = VldNumber.create()
        .transform((val) => val * 2)
        .refine((val) => val > 10);
      
      expect(validator.parse(6)).toBe(12); // 6 * 2 = 12 > 10 ✓
      expect(() => validator.parse(4)).toThrow(); // 4 * 2 = 8 < 10 ✗
    });

    it('should chain nullable with catch', () => {
      const validator = VldString.create()
        .min(3)
        .nullable()
        .catch('fallback');
      
      expect(validator.parse('test')).toBe('test');
      expect(validator.parse(null)).toBe(null);
      expect(validator.parse('ab')).toBe('fallback');
    });
  });
});