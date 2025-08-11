import { describe, it, expect } from '@jest/globals';
import { VldCoerceString } from '../../src/coercion/string';
import { VldCoerceNumber } from '../../src/coercion/number';
import { VldCoerceBoolean } from '../../src/coercion/boolean';
import { VldCoerceDate } from '../../src/coercion/date';
import { VldCoerceBigInt } from '../../src/coercion/bigint';
import { VldObject } from '../../src/validators/object';

describe('Coercion Validators - Comprehensive Tests', () => {
  describe('VldCoerceString', () => {
    it('should coerce numbers to strings', () => {
      const validator = VldCoerceString.create();
      expect(validator.parse(123)).toBe('123');
      expect(validator.parse(0)).toBe('0');
      expect(validator.parse(-456)).toBe('-456');
      expect(validator.parse(3.14)).toBe('3.14');
    });

    it('should coerce booleans to strings', () => {
      const validator = VldCoerceString.create();
      expect(validator.parse(true)).toBe('true');
      expect(validator.parse(false)).toBe('false');
    });

    it('should pass through strings', () => {
      const validator = VldCoerceString.create();
      expect(validator.parse('hello')).toBe('hello');
      expect(validator.parse('')).toBe('');
    });

    it('should reject null and undefined', () => {
      const validator = VldCoerceString.create();
      expect(() => validator.parse(null)).toThrow();
      expect(() => validator.parse(undefined)).toThrow();
    });

    it('should coerce objects to strings', () => {
      const validator = VldCoerceString.create();
      expect(validator.parse({})).toBe('[object Object]');
      expect(validator.parse([])).toBe('');
      expect(validator.parse([1, 2, 3])).toBe('1,2,3');
    });

    it('should apply string validations after coercion', () => {
      const validator = VldCoerceString.create().min(5);
      expect(validator.parse('hello')).toBe('hello');
      expect(validator.parse(12345)).toBe('12345');
      expect(() => validator.parse(123)).toThrow(); // '123' is too short
    });

    it('should handle transformations', () => {
      const validator = VldCoerceString.create().trim().toUpperCase();
      expect(validator.parse('  hello  ')).toBe('HELLO');
      expect(validator.parse(123)).toBe('123');
    });

    it('should handle safeParse', () => {
      const validator = VldCoerceString.create();
      const result = validator.safeParse(42);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('42');
      }
    });
  });

  describe('VldCoerceNumber', () => {
    it('should coerce strings to numbers', () => {
      const validator = VldCoerceNumber.create();
      expect(validator.parse('123')).toBe(123);
      expect(validator.parse('0')).toBe(0);
      expect(validator.parse('-456')).toBe(-456);
      expect(validator.parse('3.14')).toBe(3.14);
      expect(validator.parse('  42  ')).toBe(42);
    });

    it('should coerce booleans to numbers', () => {
      const validator = VldCoerceNumber.create();
      expect(validator.parse(true)).toBe(1);
      expect(validator.parse(false)).toBe(0);
    });

    it('should pass through numbers', () => {
      const validator = VldCoerceNumber.create();
      expect(validator.parse(123)).toBe(123);
      expect(validator.parse(0)).toBe(0);
      expect(validator.parse(-456)).toBe(-456);
    });

    it('should reject invalid strings', () => {
      const validator = VldCoerceNumber.create();
      expect(() => validator.parse('not a number')).toThrow();
      expect(() => validator.parse('')).toThrow();
      expect(() => validator.parse('123abc')).toThrow();
    });

    it('should reject null and undefined', () => {
      const validator = VldCoerceNumber.create();
      expect(() => validator.parse(null)).toThrow();
      expect(() => validator.parse(undefined)).toThrow();
    });

    it('should apply number validations after coercion', () => {
      const validator = VldCoerceNumber.create().int();
      expect(validator.parse('42')).toBe(42);
      expect(() => validator.parse('3.14')).toThrow(); // Not an integer
    });

    it('should handle safeParse', () => {
      const validator = VldCoerceNumber.create();
      const success = validator.safeParse('42');
      expect(success.success).toBe(true);
      if (success.success) {
        expect(success.data).toBe(42);
      }

      const failure = validator.safeParse('not a number');
      expect(failure.success).toBe(false);
    });
  });

  describe('VldCoerceBoolean', () => {
    it('should coerce string values', () => {
      const validator = VldCoerceBoolean.create();
      
      // True values
      expect(validator.parse('true')).toBe(true);
      expect(validator.parse('TRUE')).toBe(true);
      expect(validator.parse('1')).toBe(true);
      expect(validator.parse('yes')).toBe(true);
      expect(validator.parse('YES')).toBe(true);
      expect(validator.parse('on')).toBe(true);
      expect(validator.parse('  true  ')).toBe(true);
      
      // False values
      expect(validator.parse('false')).toBe(false);
      expect(validator.parse('FALSE')).toBe(false);
      expect(validator.parse('0')).toBe(false);
      expect(validator.parse('no')).toBe(false);
      expect(validator.parse('NO')).toBe(false);
      expect(validator.parse('off')).toBe(false);
      expect(validator.parse('  false  ')).toBe(false);
    });

    it('should coerce number values', () => {
      const validator = VldCoerceBoolean.create();
      expect(validator.parse(1)).toBe(true);
      expect(validator.parse(0)).toBe(false);
      expect(() => validator.parse(2)).toThrow();
      expect(() => validator.parse(-1)).toThrow();
    });

    it('should pass through booleans', () => {
      const validator = VldCoerceBoolean.create();
      expect(validator.parse(true)).toBe(true);
      expect(validator.parse(false)).toBe(false);
    });

    it('should reject invalid strings', () => {
      const validator = VldCoerceBoolean.create();
      expect(() => validator.parse('maybe')).toThrow();
      expect(() => validator.parse('2')).toThrow();
      expect(() => validator.parse('')).toThrow();
    });

    it('should reject null and undefined', () => {
      const validator = VldCoerceBoolean.create();
      expect(() => validator.parse(null)).toThrow();
      expect(() => validator.parse(undefined)).toThrow();
    });

    it('should handle safeParse', () => {
      const validator = VldCoerceBoolean.create();
      const success = validator.safeParse('true');
      expect(success.success).toBe(true);
      if (success.success) {
        expect(success.data).toBe(true);
      }

      const failure = validator.safeParse('maybe');
      expect(failure.success).toBe(false);
    });
  });

  describe('VldCoerceDate', () => {
    it('should coerce strings to dates', () => {
      const validator = VldCoerceDate.create();
      
      const dateStr = '2023-06-15';
      const result = validator.parse(dateStr);
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toContain('2023-06-15');
      
      const isoStr = '2023-06-15T10:30:00Z';
      const isoResult = validator.parse(isoStr);
      expect(isoResult).toBeInstanceOf(Date);
    });

    it('should coerce numbers to dates', () => {
      const validator = VldCoerceDate.create();
      const timestamp = Date.now();
      const result = validator.parse(timestamp);
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBe(timestamp);
    });

    it('should pass through Date objects', () => {
      const validator = VldCoerceDate.create();
      const date = new Date();
      expect(validator.parse(date)).toBe(date);
    });

    it('should reject invalid date strings', () => {
      const validator = VldCoerceDate.create();
      expect(() => validator.parse('not a date')).toThrow();
      expect(() => validator.parse('2023-13-45')).toThrow(); // Invalid date
    });

    it('should reject null and undefined', () => {
      const validator = VldCoerceDate.create();
      expect(() => validator.parse(null)).toThrow();
      expect(() => validator.parse(undefined)).toThrow();
    });

    it('should apply date validations after coercion', () => {
      const validator = VldCoerceDate.create().min(new Date('2023-01-01'));
      const validDate = '2023-06-15';
      const invalidDate = '2022-06-15';
      
      expect(validator.parse(validDate)).toBeInstanceOf(Date);
      expect(() => validator.parse(invalidDate)).toThrow();
    });

    it('should handle safeParse', () => {
      const validator = VldCoerceDate.create();
      const success = validator.safeParse('2023-06-15');
      expect(success.success).toBe(true);
      if (success.success) {
        expect(success.data).toBeInstanceOf(Date);
      }

      const failure = validator.safeParse('not a date');
      expect(failure.success).toBe(false);
    });
  });

  describe('VldCoerceBigInt', () => {
    it('should coerce strings to bigints', () => {
      const validator = VldCoerceBigInt.create();
      expect(validator.parse('123')).toBe(123n);
      expect(validator.parse('0')).toBe(0n);
      expect(validator.parse('-456')).toBe(-456n);
      expect(validator.parse('  42  ')).toBe(42n);
      expect(validator.parse('999999999999999999999')).toBe(999999999999999999999n);
    });

    it('should coerce integers to bigints', () => {
      const validator = VldCoerceBigInt.create();
      expect(validator.parse(123)).toBe(123n);
      expect(validator.parse(0)).toBe(0n);
      expect(validator.parse(-456)).toBe(-456n);
    });

    it('should reject non-integer numbers', () => {
      const validator = VldCoerceBigInt.create();
      expect(() => validator.parse(3.14)).toThrow();
      expect(() => validator.parse(0.5)).toThrow();
    });

    it('should pass through bigints', () => {
      const validator = VldCoerceBigInt.create();
      expect(validator.parse(123n)).toBe(123n);
      expect(validator.parse(0n)).toBe(0n);
      expect(validator.parse(-456n)).toBe(-456n);
    });

    it('should reject invalid strings', () => {
      const validator = VldCoerceBigInt.create();
      expect(() => validator.parse('not a number')).toThrow();
      expect(() => validator.parse('')).toThrow();
      expect(() => validator.parse('123.45')).toThrow();
      expect(() => validator.parse('123abc')).toThrow();
    });

    it('should reject null and undefined', () => {
      const validator = VldCoerceBigInt.create();
      expect(() => validator.parse(null)).toThrow();
      expect(() => validator.parse(undefined)).toThrow();
    });

    it('should apply bigint validations after coercion', () => {
      const validator = VldCoerceBigInt.create().positive();
      expect(validator.parse('42')).toBe(42n);
      expect(() => validator.parse('-42')).toThrow();
      expect(() => validator.parse('0')).toThrow();
    });

    it('should handle very large numbers', () => {
      const validator = VldCoerceBigInt.create();
      const largeNum = '123456789012345678901234567890';
      expect(validator.parse(largeNum)).toBe(BigInt(largeNum));
    });

    it('should handle safeParse', () => {
      const validator = VldCoerceBigInt.create();
      const success = validator.safeParse('42');
      expect(success.success).toBe(true);
      if (success.success) {
        expect(success.data).toBe(42n);
      }

      const failure = validator.safeParse('not a number');
      expect(failure.success).toBe(false);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should preserve error messages from base validators', () => {
      const stringValidator = VldCoerceString.create().email('Must be valid email');
      expect(() => stringValidator.parse(123)).toThrow('Must be valid email');
      
      const numberValidator = VldCoerceNumber.create().min(10, 'Must be at least 10');
      expect(() => numberValidator.parse('5')).toThrow('Must be at least 10');
    });

    it('should handle complex coercion chains', () => {
      const validator = VldCoerceString.create()
        .trim()
        .toLowerCase()
        .email();
      
      expect(validator.parse('  TEST@EXAMPLE.COM  ')).toBe('test@example.com');
    });

    it('should handle nested coercion in objects', () => {
      const shape = {
        age: VldCoerceNumber.create(),
        active: VldCoerceBoolean.create()
      };
      const validator = VldObject.create(shape);
      
      const result = validator.parse({ age: '25', active: 'true' });
      expect(result).toEqual({ age: 25, active: true });
    });
  });
});