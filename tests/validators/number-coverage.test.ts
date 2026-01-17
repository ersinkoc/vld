/**
 * Coverage tests for VldNumber validator
 * These tests target specific uncovered lines in number.ts
 */

import { v } from '../../src';

describe('VldNumber Coverage Tests', () => {
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
