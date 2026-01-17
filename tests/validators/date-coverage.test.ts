/**
 * Coverage tests for VldDate validator
 * These tests target specific uncovered lines in date.ts
 */

import { v } from '../../src';

describe('VldDate Coverage Tests', () => {
  describe('min() invalid date error', () => {
    it('should throw when min() receives invalid date string', () => {
      const schema = v.date();
      expect(() => schema.min('invalid-date-string')).toThrow('Invalid date provided to min()');
    });

    it('should throw when min() receives NaN timestamp', () => {
      const schema = v.date();
      expect(() => schema.min(NaN)).toThrow('Invalid date provided to min()');
    });
  });

  describe('max() invalid date error', () => {
    it('should throw when max() receives invalid date string', () => {
      const schema = v.date();
      expect(() => schema.max('not-a-valid-date')).toThrow('Invalid date provided to max()');
    });

    it('should throw when max() receives NaN timestamp', () => {
      const schema = v.date();
      expect(() => schema.max(NaN)).toThrow('Invalid date provided to max()');
    });
  });

  describe('gt() strict greater than', () => {
    it('should validate date strictly greater than', () => {
      const compareDate = new Date('2024-01-01');
      const schema = v.date().gt(compareDate);

      // Should fail when equal
      expect(schema.safeParse(new Date('2024-01-01')).success).toBe(false);

      // Should pass when greater
      expect(schema.safeParse(new Date('2024-01-02')).success).toBe(true);

      // Should fail when less
      expect(schema.safeParse(new Date('2023-12-31')).success).toBe(false);
    });

    it('should accept timestamp number', () => {
      const timestamp = Date.parse('2024-01-01');
      const schema = v.date().gt(timestamp);

      expect(schema.safeParse(new Date('2024-01-02')).success).toBe(true);
      expect(schema.safeParse(new Date('2024-01-01')).success).toBe(false);
    });

    it('should use custom message', () => {
      const schema = v.date().gt(new Date('2024-01-01'), 'Date must be after Jan 1');
      const result = schema.safeParse(new Date('2023-12-01'));

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Date must be after Jan 1');
      }
    });
  });

  describe('lt() strict less than', () => {
    it('should validate date strictly less than', () => {
      const compareDate = new Date('2024-01-01');
      const schema = v.date().lt(compareDate);

      // Should fail when equal
      expect(schema.safeParse(new Date('2024-01-01')).success).toBe(false);

      // Should fail when greater
      expect(schema.safeParse(new Date('2024-01-02')).success).toBe(false);

      // Should pass when less
      expect(schema.safeParse(new Date('2023-12-31')).success).toBe(true);
    });

    it('should accept timestamp number', () => {
      const timestamp = Date.parse('2024-01-01');
      const schema = v.date().lt(timestamp);

      expect(schema.safeParse(new Date('2023-12-31')).success).toBe(true);
      expect(schema.safeParse(new Date('2024-01-01')).success).toBe(false);
    });

    it('should use custom message', () => {
      const schema = v.date().lt(new Date('2024-01-01'), 'Date must be before Jan 1');
      const result = schema.safeParse(new Date('2024-06-01'));

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Date must be before Jan 1');
      }
    });
  });
});
