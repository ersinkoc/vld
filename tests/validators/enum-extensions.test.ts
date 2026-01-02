/**
 * Tests for VldEnum extensions - .exclude() and .extract()
 */

import { v } from '../../src';

describe('VldEnum Extensions', () => {
  describe('.exclude()', () => {
    const colorEnum = v.enum('red', 'green', 'blue', 'yellow', 'purple');

    it('should exclude specified values', () => {
      const primaryColors = colorEnum.exclude('yellow', 'purple');

      expect(primaryColors.parse('red')).toBe('red');
      expect(primaryColors.parse('green')).toBe('green');
      expect(primaryColors.parse('blue')).toBe('blue');
      expect(() => primaryColors.parse('yellow')).toThrow();
      expect(() => primaryColors.parse('purple')).toThrow();
    });

    it('should throw error when trying to exclude all values', () => {
      const smallEnum = v.enum('a', 'b');

      expect(() => smallEnum.exclude('a', 'b')).toThrow();
    });

    it('should work with single value exclusion', () => {
      const colors = v.enum('red', 'green', 'blue');
      const noRed = colors.exclude('red');

      expect(() => noRed.parse('red')).toThrow();
      expect(noRed.parse('green')).toBe('green');
      expect(noRed.parse('blue')).toBe('blue');
    });

    it('should maintain immutability', () => {
      const original = v.enum('a', 'b', 'c');
      const excluded = original.exclude('b');

      // Original should still accept 'b'
      expect(original.parse('b')).toBe('b');
      // Excluded should reject 'b'
      expect(() => excluded.parse('b')).toThrow();
    });

    it('should work with method chaining', () => {
      const statusEnum = v.enum('pending', 'active', 'completed', 'cancelled');
      const activeStatuses = statusEnum.exclude('cancelled');

      const optionalActive = activeStatuses.optional();

      expect(optionalActive.parse('pending')).toBe('pending');
      expect(optionalActive.parse(undefined)).toBe(undefined);
      expect(() => optionalActive.parse('cancelled')).toThrow();
    });

    it('should work with refine', () => {
      const fruits = v.enum('apple', 'banana', 'orange');
      const nonCitrus = fruits.exclude('orange').refine(
        (fruit) => fruit.length > 5,
        'Must be longer than 5 characters'
      );

      expect(nonCitrus.parse('banana')).toBe('banana');
      expect(() => nonCitrus.parse('apple')).toThrow();
      expect(() => nonCitrus.parse('orange')).toThrow();
    });
  });

  describe('.extract()', () => {
    const colorEnum = v.enum('red', 'green', 'blue', 'yellow', 'purple');

    it('should extract specified values', () => {
      const primaryColors = colorEnum.extract('red', 'green', 'blue');

      expect(primaryColors.parse('red')).toBe('red');
      expect(primaryColors.parse('green')).toBe('green');
      expect(primaryColors.parse('blue')).toBe('blue');
      expect(() => primaryColors.parse('yellow')).toThrow();
      expect(() => primaryColors.parse('purple')).toThrow();
    });

    it('should throw error when extracting non-existent values', () => {
      const smallEnum = v.enum('a', 'b');

      expect(() => smallEnum.extract('c')).toThrow();
    });

    it('should work with single value extraction', () => {
      const colors = v.enum('red', 'green', 'blue');
      const onlyRed = colors.extract('red');

      expect(onlyRed.parse('red')).toBe('red');
      expect(() => onlyRed.parse('green')).toThrow();
      expect(() => onlyRed.parse('blue')).toThrow();
    });

    it('should maintain immutability', () => {
      const original = v.enum('a', 'b', 'c');
      const extracted = original.extract('a', 'b');

      // Original should still accept 'c'
      expect(original.parse('c')).toBe('c');
      // Extracted should reject 'c'
      expect(() => extracted.parse('c')).toThrow();
    });

    it('should work with method chaining', () => {
      const statusEnum = v.enum('pending', 'active', 'completed', 'cancelled');
      const activeStatuses = statusEnum.extract('pending', 'active');

      const optionalActive = activeStatuses.optional();

      expect(optionalActive.parse('pending')).toBe('pending');
      expect(optionalActive.parse(undefined)).toBe(undefined);
      expect(() => optionalActive.parse('completed')).toThrow();
    });

    it('should work with transform', () => {
      const statusEnum = v.enum('pending', 'active', 'completed');
      const uppercaseStatus = statusEnum.extract('active').transform((s) => s.toUpperCase());

      const result = uppercaseStatus.safeParse('active');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('ACTIVE');
      }
    });
  });

  describe('integration tests', () => {
    it('should work with chained exclude and extract', () => {
      const colors = v.enum('red', 'green', 'blue', 'yellow', 'orange', 'purple');

      // First exclude some, then extract others
      const noYellowNoBlue = colors.exclude('yellow');
      const onlyRedGreen = noYellowNoBlue.extract('red', 'green');

      expect(onlyRedGreen.parse('red')).toBe('red');
      expect(onlyRedGreen.parse('green')).toBe('green');
      expect(() => onlyRedGreen.parse('blue')).toThrow();
      expect(() => onlyRedGreen.parse('yellow')).toThrow();
    });

    it('should work in object schemas', () => {
      const statusEnum = v.enum('pending', 'processing', 'completed', 'failed');
      const activeStatuses = statusEnum.exclude('failed');

      const schema = v.object({
        status: activeStatuses,
        timestamp: v.number()
      });

      const result = schema.safeParse({
        status: 'processing',
        timestamp: Date.now()
      });

      expect(result.success).toBe(true);

      const failedResult = schema.safeParse({
        status: 'failed',
        timestamp: Date.now()
      });

      expect(failedResult.success).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle empty exclude', () => {
      const colors = v.enum('red', 'green', 'blue');
      const noExclude = colors.exclude();

      expect(noExclude.parse('red')).toBe('red');
      expect(noExclude.parse('green')).toBe('green');
      expect(noExclude.parse('blue')).toBe('blue');
    });

    it('should handle extracting all values', () => {
      const colors = v.enum('red', 'green');
      const allColors = colors.extract('red', 'green');

      expect(allColors.parse('red')).toBe('red');
      expect(allColors.parse('green')).toBe('green');
    });

    it('should provide descriptive error messages', () => {
      const colors = v.enum('red', 'green', 'blue');
      const onlyRedGreen = colors.extract('red', 'green');

      const result = onlyRedGreen.safeParse('blue');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBeTruthy();
      }
    });
  });
});
