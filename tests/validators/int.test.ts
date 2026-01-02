/**
 * Tests for v.int() and v.int32() - top-level integer validators
 */

import { v } from '../../src';

describe('v.int()', () => {
  const intValidator = v.int();

  it('should accept integer values', () => {
    expect(intValidator.parse(0)).toBe(0);
    expect(intValidator.parse(1)).toBe(1);
    expect(intValidator.parse(-1)).toBe(-1);
    expect(intValidator.parse(100)).toBe(100);
    expect(intValidator.parse(-100)).toBe(-100);
    expect(intValidator.parse(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER);
    expect(intValidator.parse(Number.MIN_SAFE_INTEGER)).toBe(Number.MIN_SAFE_INTEGER);
  });

  it('should reject non-integer numbers', () => {
    expect(() => intValidator.parse(1.5)).toThrow();
    expect(() => intValidator.parse(-1.5)).toThrow();
    expect(() => intValidator.parse(0.1)).toThrow();
    expect(() => intValidator.parse(Math.PI)).toThrow();
  });

  it('should reject non-number values', () => {
    expect(() => intValidator.parse('123')).toThrow();
    expect(() => intValidator.parse(null)).toThrow();
    expect(() => intValidator.parse(undefined)).toThrow();
    expect(() => intValidator.parse({})).toThrow();
  });

  it('should reject NaN and Infinity', () => {
    expect(() => intValidator.parse(NaN)).toThrow();
    expect(() => intValidator.parse(Infinity)).toThrow();
    expect(() => intValidator.parse(-Infinity)).toThrow();
  });
});

describe('v.int32()', () => {
  const int32Validator = v.int32();

  // 32-bit signed integer range: -2,147,483,648 to 2,147,483,647
  const INT32_MIN = -2147483648;
  const INT32_MAX = 2147483647;

  it('should accept 32-bit integer values', () => {
    expect(int32Validator.parse(0)).toBe(0);
    expect(int32Validator.parse(1)).toBe(1);
    expect(int32Validator.parse(-1)).toBe(-1);
    expect(int32Validator.parse(100)).toBe(100);
    expect(int32Validator.parse(INT32_MIN)).toBe(INT32_MIN);
    expect(int32Validator.parse(INT32_MAX)).toBe(INT32_MAX);
  });

  it('should reject integers outside 32-bit range', () => {
    expect(() => int32Validator.parse(INT32_MIN - 1)).toThrow();
    expect(() => int32Validator.parse(INT32_MAX + 1)).toThrow();
    expect(() => int32Validator.parse(Number.MAX_SAFE_INTEGER)).toThrow();
    expect(() => int32Validator.parse(Number.MIN_SAFE_INTEGER)).toThrow();
  });

  it('should reject non-integer numbers', () => {
    expect(() => int32Validator.parse(1.5)).toThrow();
    expect(() => int32Validator.parse(-1.5)).toThrow();
  });

  it('should reject non-number values', () => {
    expect(() => int32Validator.parse('123')).toThrow();
    expect(() => int32Validator.parse(null)).toThrow();
    expect(() => int32Validator.parse(undefined)).toThrow();
  });
});

describe('int() method chaining', () => {
  it('should work with min()', () => {
    const positiveInt = v.int().min(0);
    expect(positiveInt.parse(0)).toBe(0);
    expect(positiveInt.parse(100)).toBe(100);
    expect(() => positiveInt.parse(-1)).toThrow();
  });

  it('should work with max()', () => {
    const smallInt = v.int().max(10);
    expect(smallInt.parse(10)).toBe(10);
    expect(smallInt.parse(0)).toBe(0);
    expect(() => smallInt.parse(11)).toThrow();
  });

  it('should work with min() and max() combined', () => {
    const rangeInt = v.int().min(1).max(100);
    expect(rangeInt.parse(1)).toBe(1);
    expect(rangeInt.parse(50)).toBe(50);
    expect(rangeInt.parse(100)).toBe(100);
    expect(() => rangeInt.parse(0)).toThrow();
    expect(() => rangeInt.parse(101)).toThrow();
  });

  it('should work with positive()', () => {
    const positiveInt = v.int().positive();
    expect(positiveInt.parse(1)).toBe(1);
    expect(positiveInt.parse(100)).toBe(100);
    expect(() => positiveInt.parse(0)).toThrow();
    expect(() => positiveInt.parse(-1)).toThrow();
  });

  it('should work with negative()', () => {
    const negativeInt = v.int().negative();
    expect(negativeInt.parse(-1)).toBe(-1);
    expect(negativeInt.parse(-100)).toBe(-100);
    expect(() => negativeInt.parse(0)).toThrow();
    expect(() => negativeInt.parse(1)).toThrow();
  });

  it('should work with nonnegative()', () => {
    const nonnegativeInt = v.int().nonnegative();
    expect(nonnegativeInt.parse(0)).toBe(0);
    expect(nonnegativeInt.parse(100)).toBe(100);
    expect(() => nonnegativeInt.parse(-1)).toThrow();
  });

  it('should work with optional', () => {
    const optionalInt = v.int().optional();
    expect(optionalInt.parse(123)).toBe(123);
    expect(optionalInt.parse(undefined)).toBe(undefined);
  });

  it('should work with nullable', () => {
    const nullableInt = v.int().nullable();
    expect(nullableInt.parse(123)).toBe(123);
    expect(nullableInt.parse(null)).toBe(null);
  });

  it('should work with refine', () => {
    const evenInt = v.int().refine((n) => n % 2 === 0, 'Must be even');
    expect(evenInt.parse(2)).toBe(2);
    expect(evenInt.parse(4)).toBe(4);
    expect(() => evenInt.parse(3)).toThrow();
  });

  it('should work with transform', () => {
    const doubledInt = v.int().transform((n) => n * 2);
    const result = doubledInt.safeParse(5);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(10);
    }
  });
});

describe('int32() method chaining', () => {
  it('should work with min()', () => {
    const positiveInt32 = v.int32().min(0);
    expect(positiveInt32.parse(0)).toBe(0);
    expect(positiveInt32.parse(1000)).toBe(1000);
    expect(() => positiveInt32.parse(-1)).toThrow();
  });

  it('should work with max()', () => {
    const smallInt32 = v.int32().max(100);
    expect(smallInt32.parse(100)).toBe(100);
    expect(smallInt32.parse(0)).toBe(0);
    expect(() => smallInt32.parse(101)).toThrow();
  });

  it('should work with optional', () => {
    const optionalInt32 = v.int32().optional();
    expect(optionalInt32.parse(12345)).toBe(12345);
    expect(optionalInt32.parse(undefined)).toBe(undefined);
  });
});

describe('integration with other validators', () => {
  it('should work in object schemas', () => {
    const schema = v.object({
      port: v.int().min(0).max(65535),
      count: v.int32().min(0)
    });

    const result = schema.safeParse({
      port: 8080,
      count: 42
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.port).toBe(8080);
      expect(result.data.count).toBe(42);
    }
  });

  it('should work in arrays', () => {
    const intArray = v.array(v.int());

    const result = intArray.safeParse([1, 2, 3, 4, 5]);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([1, 2, 3, 4, 5]);
    }
  });

  it('should reject array with non-integers', () => {
    const intArray = v.array(v.int());

    const result = intArray.safeParse([1, 2.5, 3]);

    expect(result.success).toBe(false);
  });
});

describe('error messages', () => {
  it('should provide appropriate error for non-integer', () => {
    const intValidator = v.int();
    const result = intValidator.safeParse(1.5);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('integer');
    }
  });

  it('should provide appropriate error for unsafe int32', () => {
    const int32Validator = v.int32();
    const result = int32Validator.safeParse(2147483648);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('at most');
    }
  });
});
