import { describe, it, expect } from '@jest/globals';
import { VldNumber } from '../../src/validators/number';

describe('VldNumber - Comprehensive Tests', () => {
  describe('Basic Validation', () => {
    it('should validate number values', () => {
      const validator = VldNumber.create();
      expect(validator.parse(0)).toBe(0);
      expect(validator.parse(123)).toBe(123);
      expect(validator.parse(-456)).toBe(-456);
      expect(validator.parse(3.14)).toBe(3.14);
      expect(validator.parse(-0.001)).toBe(-0.001);
      expect(validator.parse(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER);
      expect(validator.parse(Number.MIN_SAFE_INTEGER)).toBe(Number.MIN_SAFE_INTEGER);
    });

    it('should reject non-number values', () => {
      const validator = VldNumber.create();
      expect(() => validator.parse('123')).toThrow();
      expect(() => validator.parse(true)).toThrow();
      expect(() => validator.parse(null)).toThrow();
      expect(() => validator.parse(undefined)).toThrow();
      expect(() => validator.parse([])).toThrow();
      expect(() => validator.parse({})).toThrow();
      expect(() => validator.parse(NaN)).toThrow();
    });

    it('should handle safeParse correctly', () => {
      const validator = VldNumber.create();
      const success = validator.safeParse(42);
      expect(success.success).toBe(true);
      if (success.success) {
        expect(success.data).toBe(42);
      }

      const failure = validator.safeParse('42');
      expect(failure.success).toBe(false);
      if (!failure.success) {
        expect(failure.error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Range Validations', () => {
    it('should validate minimum value', () => {
      const validator = VldNumber.create().min(10);
      expect(validator.parse(10)).toBe(10);
      expect(validator.parse(11)).toBe(11);
      expect(validator.parse(100)).toBe(100);
      expect(() => validator.parse(9)).toThrow();
      expect(() => validator.parse(0)).toThrow();
      expect(() => validator.parse(-10)).toThrow();
    });

    it('should validate maximum value', () => {
      const validator = VldNumber.create().max(10);
      expect(validator.parse(10)).toBe(10);
      expect(validator.parse(9)).toBe(9);
      expect(validator.parse(0)).toBe(0);
      expect(validator.parse(-100)).toBe(-100);
      expect(() => validator.parse(11)).toThrow();
      expect(() => validator.parse(100)).toThrow();
    });

    it('should validate between range', () => {
      const validator = VldNumber.create().between(10, 20);
      expect(validator.parse(10)).toBe(10);
      expect(validator.parse(15)).toBe(15);
      expect(validator.parse(20)).toBe(20);
      expect(() => validator.parse(9)).toThrow();
      expect(() => validator.parse(21)).toThrow();
    });

    it('should chain range validations', () => {
      const validator = VldNumber.create().min(0).max(100);
      expect(validator.parse(0)).toBe(0);
      expect(validator.parse(50)).toBe(50);
      expect(validator.parse(100)).toBe(100);
      expect(() => validator.parse(-1)).toThrow();
      expect(() => validator.parse(101)).toThrow();
    });
  });

  describe('Type Validations', () => {
    it('should validate integers', () => {
      const validator = VldNumber.create().int();
      expect(validator.parse(0)).toBe(0);
      expect(validator.parse(123)).toBe(123);
      expect(validator.parse(-456)).toBe(-456);
      expect(() => validator.parse(3.14)).toThrow();
      expect(() => validator.parse(0.5)).toThrow();
      expect(() => validator.parse(-0.001)).toThrow();
    });

    it('should validate finite numbers', () => {
      const validator = VldNumber.create().finite();
      expect(validator.parse(123)).toBe(123);
      expect(validator.parse(0)).toBe(0);
      expect(() => validator.parse(Infinity)).toThrow();
      expect(() => validator.parse(-Infinity)).toThrow();
    });

    it('should validate safe integers', () => {
      const validator = VldNumber.create().safe();
      expect(validator.parse(0)).toBe(0);
      expect(validator.parse(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER);
      expect(validator.parse(Number.MIN_SAFE_INTEGER)).toBe(Number.MIN_SAFE_INTEGER);
      expect(() => validator.parse(Number.MAX_SAFE_INTEGER + 1)).toThrow();
      expect(() => validator.parse(3.14)).toThrow(); // Not an integer
    });
  });

  describe('Sign Validations', () => {
    it('should validate positive numbers', () => {
      const validator = VldNumber.create().positive();
      expect(validator.parse(1)).toBe(1);
      expect(validator.parse(0.001)).toBe(0.001);
      expect(validator.parse(1000)).toBe(1000);
      expect(() => validator.parse(0)).toThrow();
      expect(() => validator.parse(-1)).toThrow();
      expect(() => validator.parse(-0.001)).toThrow();
    });

    it('should validate negative numbers', () => {
      const validator = VldNumber.create().negative();
      expect(validator.parse(-1)).toBe(-1);
      expect(validator.parse(-0.001)).toBe(-0.001);
      expect(validator.parse(-1000)).toBe(-1000);
      expect(() => validator.parse(0)).toThrow();
      expect(() => validator.parse(1)).toThrow();
      expect(() => validator.parse(0.001)).toThrow();
    });

    it('should validate non-negative numbers', () => {
      const validator = VldNumber.create().nonnegative();
      expect(validator.parse(0)).toBe(0);
      expect(validator.parse(1)).toBe(1);
      expect(validator.parse(0.001)).toBe(0.001);
      expect(validator.parse(1000)).toBe(1000);
      expect(() => validator.parse(-1)).toThrow();
      expect(() => validator.parse(-0.001)).toThrow();
    });

    it('should validate non-positive numbers', () => {
      const validator = VldNumber.create().nonpositive();
      expect(validator.parse(0)).toBe(0);
      expect(validator.parse(-1)).toBe(-1);
      expect(validator.parse(-0.001)).toBe(-0.001);
      expect(validator.parse(-1000)).toBe(-1000);
      expect(() => validator.parse(1)).toThrow();
      expect(() => validator.parse(0.001)).toThrow();
    });
  });

  describe('Multiple/Step Validations', () => {
    it('should validate multipleOf', () => {
      const validator = VldNumber.create().multipleOf(5);
      expect(validator.parse(0)).toBe(0);
      expect(validator.parse(5)).toBe(5);
      expect(validator.parse(10)).toBe(10);
      expect(validator.parse(-15)).toBe(-15);
      expect(() => validator.parse(3)).toThrow();
      expect(() => validator.parse(7)).toThrow();
      expect(() => validator.parse(5.5)).toThrow();
    });

    it('should validate step (alias for multipleOf)', () => {
      const validator = VldNumber.create().step(0.5);
      expect(validator.parse(0)).toBe(0);
      expect(validator.parse(0.5)).toBe(0.5);
      expect(validator.parse(1)).toBe(1);
      expect(validator.parse(1.5)).toBe(1.5);
      expect(() => validator.parse(0.3)).toThrow();
      expect(() => validator.parse(1.7)).toThrow();
    });

    it('should validate even numbers', () => {
      const validator = VldNumber.create().even();
      expect(validator.parse(0)).toBe(0);
      expect(validator.parse(2)).toBe(2);
      expect(validator.parse(-4)).toBe(-4);
      expect(validator.parse(100)).toBe(100);
      expect(() => validator.parse(1)).toThrow();
      expect(() => validator.parse(3)).toThrow();
      expect(() => validator.parse(-5)).toThrow();
    });

    it('should validate odd numbers', () => {
      const validator = VldNumber.create().odd();
      expect(validator.parse(1)).toBe(1);
      expect(validator.parse(3)).toBe(3);
      expect(validator.parse(-5)).toBe(-5);
      expect(validator.parse(101)).toBe(101);
      expect(() => validator.parse(0)).toThrow();
      expect(() => validator.parse(2)).toThrow();
      expect(() => validator.parse(-4)).toThrow();
    });
  });

  describe('Complex Chains', () => {
    it('should handle multiple validations', () => {
      const validator = VldNumber.create()
        .min(0)
        .max(100)
        .int();
      
      expect(validator.parse(0)).toBe(0);
      expect(validator.parse(50)).toBe(50);
      expect(validator.parse(100)).toBe(100);
      expect(() => validator.parse(-1)).toThrow();
      expect(() => validator.parse(101)).toThrow();
      expect(() => validator.parse(50.5)).toThrow();
    });

    it('should validate positive integers', () => {
      const validator = VldNumber.create()
        .positive()
        .int();
      
      expect(validator.parse(1)).toBe(1);
      expect(validator.parse(100)).toBe(100);
      expect(() => validator.parse(0)).toThrow();
      expect(() => validator.parse(-1)).toThrow();
      expect(() => validator.parse(1.5)).toThrow();
    });

    it('should validate safe positive integers', () => {
      const validator = VldNumber.create()
        .positive()
        .safe();
      
      expect(validator.parse(1)).toBe(1);
      expect(validator.parse(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER);
      expect(() => validator.parse(0)).toThrow();
      expect(() => validator.parse(-1)).toThrow();
      expect(() => validator.parse(1.5)).toThrow();
    });
  });

  describe('Custom Error Messages', () => {
    it('should use custom error messages', () => {
      const validator = VldNumber.create().min(10, 'Must be at least 10');
      expect(() => validator.parse(9)).toThrow('Must be at least 10');
    });

    it('should use custom messages for type validators', () => {
      const validator = VldNumber.create().int('Must be an integer');
      expect(() => validator.parse(3.14)).toThrow('Must be an integer');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero correctly', () => {
      const validator = VldNumber.create();
      expect(validator.parse(0)).toBe(0);
      expect(validator.parse(-0)).toBe(-0);
      expect(Object.is(validator.parse(-0), -0)).toBe(true);
    });

    it('should handle very small numbers', () => {
      const validator = VldNumber.create();
      expect(validator.parse(Number.EPSILON)).toBe(Number.EPSILON);
      expect(validator.parse(Number.MIN_VALUE)).toBe(Number.MIN_VALUE);
    });

    it('should handle very large numbers', () => {
      const validator = VldNumber.create();
      expect(validator.parse(Number.MAX_VALUE)).toBe(Number.MAX_VALUE);
      expect(validator.parse(1e308)).toBe(1e308);
    });

    it('should handle special float values', () => {
      const validator = VldNumber.create();
      expect(validator.parse(0.1 + 0.2)).toBeCloseTo(0.3, 10);
      expect(validator.parse(Math.PI)).toBe(Math.PI);
      expect(validator.parse(Math.E)).toBe(Math.E);
    });
  });

  describe('Immutability', () => {
    it('should not mutate validator on chaining', () => {
      const base = VldNumber.create();
      const min10 = base.min(10);
      const max10 = base.max(10);
      const int = base.int();
      
      expect(base.parse(-100)).toBe(-100);
      expect(base.parse(3.14)).toBe(3.14);
      
      expect(() => min10.parse(5)).toThrow();
      expect(min10.parse(15)).toBe(15);
      
      expect(() => max10.parse(15)).toThrow();
      expect(max10.parse(5)).toBe(5);
      
      expect(() => int.parse(3.14)).toThrow();
      expect(int.parse(3)).toBe(3);
    });
  });
});