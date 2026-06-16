/**
 * Coverage tests for VldNumber validator
 * These tests target specific uncovered lines in number.ts
 */

import { v } from '../../src';
import { VldNumber } from '../../src/validators/number';

describe('VldNumber Coverage Tests', () => {
  describe('uint32()', () => {
    it('should accept valid unsigned 32-bit integers', () => {
      const schema = v.number().uint32();

      expect(schema.safeParse(0).success).toBe(true);
      expect(schema.safeParse(1).success).toBe(true);
      expect(schema.safeParse(2147483647).success).toBe(true);
      expect(schema.safeParse(4294967295).success).toBe(true);
      expect(schema.safeParse(4294967296).success).toBe(false);
      expect(schema.safeParse(-1).success).toBe(false);
    });

    it('should reject non-integers', () => {
      const schema = v.number().uint32();
      expect(schema.safeParse(1.5).success).toBe(false);
    });
  });

  describe('uint64()', () => {
    it('should accept valid unsigned 64-bit integers', () => {
      const schema = v.number().uint64();

      expect(schema.safeParse(0).success).toBe(true);
      expect(schema.safeParse(1).success).toBe(true);
      expect(schema.safeParse(Number.MAX_SAFE_INTEGER).success).toBe(true);
      expect(schema.safeParse(-1).success).toBe(false);
      expect(schema.safeParse(1.5).success).toBe(false);
    });
  });

  describe('int32()', () => {
    it('should accept valid signed 32-bit integers', () => {
      const schema = v.number().int32();

      expect(schema.safeParse(-2147483648).success).toBe(true);
      expect(schema.safeParse(-1).success).toBe(true);
      expect(schema.safeParse(0).success).toBe(true);
      expect(schema.safeParse(1).success).toBe(true);
      expect(schema.safeParse(2147483647).success).toBe(true);
      expect(schema.safeParse(-2147483649).success).toBe(false);
      expect(schema.safeParse(2147483648).success).toBe(false);
    });
  });

  describe('int64()', () => {
    it('should accept valid signed 64-bit integers', () => {
      const schema = v.number().int64();

      expect(schema.safeParse(-Number.MAX_SAFE_INTEGER).success).toBe(true);
      expect(schema.safeParse(0).success).toBe(true);
      expect(schema.safeParse(Number.MAX_SAFE_INTEGER).success).toBe(true);
      expect(schema.safeParse(1.5).success).toBe(false);
    });
  });

  describe('float32()', () => {
    it('should accept valid 32-bit floats', () => {
      const schema = v.number().float32();

      expect(schema.safeParse(0).success).toBe(true);
      expect(schema.safeParse(-1).success).toBe(true);
      expect(schema.safeParse(1.5).success).toBe(true);
      expect(schema.safeParse(3.4e38).success).toBe(true);
      expect(schema.safeParse(-3.4e38).success).toBe(true);
      expect(schema.safeParse(3.5e38).success).toBe(false);
      expect(schema.safeParse(Infinity).success).toBe(false);
      expect(schema.safeParse(NaN).success).toBe(false);
    });
  });

  describe('float64()', () => {
    it('should accept valid 64-bit floats', () => {
      const schema = v.number().float64();

      expect(schema.safeParse(0).success).toBe(true);
      expect(schema.safeParse(-1).success).toBe(true);
      expect(schema.safeParse(1.5).success).toBe(true);
      expect(schema.safeParse(1e308).success).toBe(true);
      expect(schema.safeParse(Infinity).success).toBe(false);
      expect(schema.safeParse(NaN).success).toBe(false);
    });
  });

  describe('even() with non-integers', () => {
    it('should reject non-integers in even check', () => {
      const schema = v.number().even();

      // Non-integer should fail even check
      expect(schema.safeParse(4.5).success).toBe(false);
      expect(schema.safeParse(2.1).success).toBe(false);

      // Integer should pass
      expect(schema.safeParse(4).success).toBe(true);
      expect(schema.safeParse(2).success).toBe(true);
    });
  });

  describe('odd() with non-integers', () => {
    it('should reject non-integers in odd check', () => {
      const schema = v.number().odd();

      // Non-integer should fail odd check
      expect(schema.safeParse(3.5).success).toBe(false);
      expect(schema.safeParse(5.1).success).toBe(false);

      // Integer should pass
      expect(schema.safeParse(3).success).toBe(true);
      expect(schema.safeParse(5).success).toBe(true);
    });
  });

  describe('gt() strict greater than', () => {
    it('should validate strict greater than', () => {
      const schema = v.number().gt(10);

      expect(schema.safeParse(11).success).toBe(true);
      expect(schema.safeParse(10).success).toBe(false);
      expect(schema.safeParse(9).success).toBe(false);
    });

    it('should use custom message', () => {
      const schema = v.number().gt(10, 'Must be more than 10');
      const result = schema.safeParse(5);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Must be more than 10');
      }
    });
  });

  describe('generic check execution paths', () => {
    it('should preserve custom messages for positive fast-path parse failures', () => {
      const positive = v.number().positive('Need positive');
      const positiveInt = v.number().positive('Need positive integer').int('Need positive integer');

      expect(() => positive.parse(0)).toThrow('Need positive');
      expect(() => positive.parseKnownNumber(0)).toThrow('Need positive');
      expect(() => positiveInt.parse(1.5)).toThrow('Need positive integer');
      expect(() => positiveInt.parseKnownNumber(1.5)).toThrow('Need positive integer');
    });

    it('should fall back to locale messages for internal fast-path failures without custom messages', () => {
      const positive = new (VldNumber as any)({
        checks: [(value: number) => value > 0],
        jsonSchema: { exclusiveMinimum: 0 }
      }) as VldNumber;
      const positiveInt = new (VldNumber as any)({
        checks: [(value: number) => value > 0, (value: number) => Number.isInteger(value)],
        jsonSchema: { exclusiveMinimum: 0, type: 'integer' }
      }) as VldNumber;

      expect(() => positive.parse(0)).toThrow('Invalid number');
      expect(() => positive.parseKnownNumber(0)).toThrow('Invalid number');
      expect(() => positiveInt.parse(1.5)).toThrow('Invalid number');
      expect(() => positiveInt.parseKnownNumber(1.5)).toThrow('Invalid number');
    });

    it('should use default messages for parseKnownNumber check failures', () => {
      expect(() => v.number().min(2).parseKnownNumber(1)).toThrow('Number must be at least 2');
      expect(() => v.number().min(0).max(10).int().parseKnownNumber(1.5)).toThrow('Number must be an integer');
    });

    it('should fall back to locale messages for internal generic check failures without custom messages', () => {
      const oneCheck = new (VldNumber as any)({
        checks: [(value: number) => value > 0]
      }) as VldNumber;
      const manyChecks = new (VldNumber as any)({
        checks: [
          (value: number) => value >= 0,
          (value: number) => value <= 10,
          (value: number) => Number.isInteger(value),
          (value: number) => value % 2 === 0
        ]
      }) as VldNumber;

      expect(() => oneCheck.parseKnownNumber(0)).toThrow('Invalid number');
      expect(() => manyChecks.parseKnownNumber(3)).toThrow('Invalid number');
    });

    it('should preserve custom messages in the many-check failure path', () => {
      const schema = v.number()
        .min(0, 'Composite number failure')
        .max(10, 'Composite number failure')
        .int('Composite number failure')
        .multipleOf(2, 'Composite number failure');

      expect(() => schema.parseKnownNumber(3)).toThrow('Composite number failure');
    });

    it('should apply positive checks through the multi-check path', () => {
      const schema = v.number().positive().max(10);

      expect(schema.parseKnownNumber(5)).toBe(5);
      expect(schema.safeParse(0).success).toBe(false);
      expect(schema.safeParse(11).success).toBe(false);
    });

    it('should convert thrown check failures into safeParse errors', () => {
      const schema = v.number().min(0);
      (schema as any)._checks = [() => {
        throw new Error('check exploded');
      }];

      const result = schema.safeParse(1);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('check exploded');
      }
    });
  });

  describe('lt() strict less than', () => {
    it('should validate strict less than', () => {
      const schema = v.number().lt(10);

      expect(schema.safeParse(9).success).toBe(true);
      expect(schema.safeParse(10).success).toBe(false);
      expect(schema.safeParse(11).success).toBe(false);
    });

    it('should use custom message', () => {
      const schema = v.number().lt(10, 'Must be less than 10');
      const result = schema.safeParse(15);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Must be less than 10');
      }
    });
  });

  describe('gte() greater than or equal (alias for min)', () => {
    it('should validate greater than or equal', () => {
      const schema = v.number().gte(10);

      expect(schema.safeParse(11).success).toBe(true);
      expect(schema.safeParse(10).success).toBe(true);
      expect(schema.safeParse(9).success).toBe(false);
    });
  });

  describe('lte() less than or equal (alias for max)', () => {
    it('should validate less than or equal', () => {
      const schema = v.number().lte(10);

      expect(schema.safeParse(9).success).toBe(true);
      expect(schema.safeParse(10).success).toBe(true);
      expect(schema.safeParse(11).success).toBe(false);
    });
  });
});
