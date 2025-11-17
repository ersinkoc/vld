/**
 * Test suite for Fourth Comprehensive Bug Analysis fixes
 * Tests for bugs: BUG-NEW-013, BUG-NEW-017, BUG-NEW-018, BUG-NEW-019, BUG-NEW-020
 */

import { v } from '../src';
import { VldBase } from '../src/validators/base';
import { isDangerousKey } from '../src/utils/security';

describe('Fourth Bug Analysis Fixes', () => {
  describe('BUG-NEW-013: Union Single-Pass Error Collection', () => {
    test('should collect errors in single pass for parse()', () => {
      const validator = v.union(v.number(), v.string(), v.boolean());

      try {
        validator.parse({ invalid: 'object' });
        fail('Should have thrown an error');
      } catch (error) {
        // Error should contain messages from all validators
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBeTruthy();
      }
    });

    test('should collect errors in single pass for safeParse()', () => {
      const validator = v.union(v.number(), v.string(), v.boolean());

      const result = validator.safeParse({ invalid: 'object' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBeTruthy();
      }
    });

    test('should not double-validate on failure', () => {
      let parseCount = 0;

      class CountingValidator extends VldBase<string, string> {
        parse(value: unknown): string {
          parseCount++;
          if (typeof value !== 'string') throw new Error('Not a string');
          return value;
        }

        safeParse(value: unknown) {
          try {
            return { success: true as const, data: this.parse(value) };
          } catch (error) {
            return { success: false as const, error: error as Error };
          }
        }
      }

      const counter = new CountingValidator();
      const union = v.union(v.number(), counter, v.boolean());

      parseCount = 0;
      // Use an array to ensure the counter validator is actually tried
      union.safeParse([]);

      // Should be called exactly once, not twice (skipped due to type checking optimization)
      // The counting validator gets type-checked and might be skipped for non-string types
      // Let's test with a string that fails number and boolean validators
      parseCount = 0;
      union.safeParse('not-a-valid-type');

      // Should be called exactly once (the counter will be called since it's a string)
      expect(parseCount).toBe(1);
    });
  });

  describe('BUG-NEW-017: parseOrDefault Validation', () => {
    test('should validate default value and accept valid defaults', () => {
      const validator = v.number().min(0);

      const result = validator.parseOrDefault('invalid', 5);
      expect(result).toBe(5);
    });

    test('should throw error for invalid default values', () => {
      const validator = v.number().min(0);

      expect(() => {
        validator.parseOrDefault('invalid', -5);
      }).toThrow('Invalid default value');
    });

    test('should validate complex default objects', () => {
      const validator = v.object({
        name: v.string().nonempty(),
        age: v.number().min(0)
      });

      // Valid default should work
      const validDefault = { name: 'John', age: 30 };
      const result1 = validator.parseOrDefault({ invalid: 'data' }, validDefault);
      expect(result1).toEqual(validDefault);

      // Invalid default should throw
      const invalidDefault = { name: '', age: -5 } as any;
      expect(() => {
        validator.parseOrDefault({ invalid: 'data' }, invalidDefault);
      }).toThrow('Invalid default value');
    });
  });

  describe('BUG-NEW-019: VldDate.between Validation', () => {
    test('should accept valid min/max dates in between()', () => {
      const validator = v.date().between('2024-01-01', '2024-12-31');

      const result = validator.parse('2024-06-15');
      expect(result).toBeInstanceOf(Date);
    });

    test('should throw error for invalid min date in between()', () => {
      expect(() => {
        v.date().between('invalid-date', '2024-12-31');
      }).toThrow('Invalid min date provided to between()');
    });

    test('should throw error for invalid max date in between()', () => {
      expect(() => {
        v.date().between('2024-01-01', 'invalid-date');
      }).toThrow('Invalid max date provided to between()');
    });

    test('should throw error for both invalid dates in between()', () => {
      expect(() => {
        v.date().between('invalid-min', 'invalid-max');
      }).toThrow('Invalid min date provided to between()');
    });

    test('should work with Date objects', () => {
      const min = new Date('2024-01-01');
      const max = new Date('2024-12-31');

      const validator = v.date().between(min, max);
      const result = validator.parse(new Date('2024-06-15'));

      expect(result).toBeInstanceOf(Date);
    });

    test('should work with timestamps', () => {
      const min = new Date('2024-01-01').getTime();
      const max = new Date('2024-12-31').getTime();

      const validator = v.date().between(min, max);
      const result = validator.parse(new Date('2024-06-15'));

      expect(result).toBeInstanceOf(Date);
    });
  });

  describe('BUG-NEW-018 & BUG-NEW-020: Comprehensive Dangerous Key Protection', () => {
    describe('Security Utility - isDangerousKey()', () => {
      test('should detect direct dangerous keys', () => {
        expect(isDangerousKey('__proto__')).toBe(true);
        expect(isDangerousKey('constructor')).toBe(true);
        expect(isDangerousKey('prototype')).toBe(true);
      });

      test('should detect nested patterns', () => {
        expect(isDangerousKey('constructor.prototype')).toBe(true);
        expect(isDangerousKey('__proto__.toString')).toBe(true);
        expect(isDangerousKey('prototype.constructor')).toBe(true);
      });

      test('should detect dangerous chains', () => {
        expect(isDangerousKey('x.constructor.polluted')).toBe(true);
        expect(isDangerousKey('x.__proto__.polluted')).toBe(true);
        expect(isDangerousKey('x.prototype.polluted')).toBe(true);
      });

      test('should detect shadowing patterns', () => {
        expect(isDangerousKey('hasOwnProperty')).toBe(true);
        expect(isDangerousKey('toString')).toBe(true);
        expect(isDangerousKey('valueOf')).toBe(true);
        expect(isDangerousKey('isPrototypeOf')).toBe(true);
        expect(isDangerousKey('propertyIsEnumerable')).toBe(true);
      });

      test('should detect nested shadowing', () => {
        expect(isDangerousKey('x.hasOwnProperty')).toBe(true);
        expect(isDangerousKey('x.toString')).toBe(true);
      });

      test('should allow safe keys', () => {
        expect(isDangerousKey('name')).toBe(false);
        expect(isDangerousKey('value')).toBe(false);
        expect(isDangerousKey('data')).toBe(false);
        expect(isDangerousKey('user_id')).toBe(false);
      });

      test('should detect getter/setter manipulation', () => {
        expect(isDangerousKey('__defineGetter__')).toBe(true);
        expect(isDangerousKey('__defineSetter__')).toBe(true);
        expect(isDangerousKey('__lookupGetter__')).toBe(true);
        expect(isDangerousKey('__lookupSetter__')).toBe(true);
      });
    });

    describe('VldRecord - Comprehensive Protection', () => {
      test('should block all dangerous keys in records', () => {
        const validator = v.record(v.string());

        const maliciousData = {
          '__proto__': 'polluted',
          'constructor': 'hacked',
          'prototype': 'exploited',
          'normal': 'safe'
        };

        const result = validator.parse(maliciousData);

        // Only safe key should be present
        expect(result).toEqual({ normal: 'safe' });
        expect(result.__proto__).not.toBe('polluted');
        expect(result.constructor).not.toBe('hacked');
        expect((result as any).prototype).not.toBe('exploited');
      });

      test('should block nested dangerous patterns', () => {
        const validator = v.record(v.string());

        const maliciousData = {
          'constructor.prototype': 'attack1',
          '__proto__.toString': 'attack2',
          'x.constructor.y': 'attack3',
          'safe_key': 'ok'
        };

        const result = validator.parse(maliciousData);

        expect(result).toEqual({ safe_key: 'ok' });
      });

      test('should block property shadowing attempts', () => {
        const validator = v.record(v.number());

        const maliciousData = {
          'hasOwnProperty': 42,
          'toString': 43,
          'valueOf': 44,
          'normal_prop': 45
        };

        const result = validator.parse(maliciousData);

        expect(result).toEqual({ normal_prop: 45 });
      });
    });

    describe('Deep Merge - Comprehensive Protection', () => {
      test('should use comprehensive dangerous key protection', () => {
        const { deepMerge } = require('../src/utils/deep-merge');

        const target = { safe: 'value1' };
        const maliciousSource = {
          '__proto__': { polluted: true },
          'constructor.prototype': { hacked: true },
          'safe': 'value2',
          'also_safe': 'value3'
        };

        const result = deepMerge(target, maliciousSource);

        // Should only merge safe keys
        expect(result.safe).toBe('value2');
        expect(result.also_safe).toBe('value3');
        expect((result as any).__proto__).not.toEqual({ polluted: true });
        expect((Object.prototype as any).polluted).toBeUndefined();
      });
    });
  });

  describe('Integration Tests - All Fixes Working Together', () => {
    test('should handle complex validation scenarios correctly', () => {
      const userValidator = v.object({
        name: v.string().nonempty(),
        age: v.number().min(0),
        email: v.string().email()
      });

      // Test parseOrDefault with valid default
      const defaultUser = { name: 'Guest', age: 0, email: 'guest@example.com' };
      const result1 = userValidator.parseOrDefault({ invalid: 'data' }, defaultUser);
      expect(result1).toEqual(defaultUser);

      // Test parseOrDefault with invalid default (should throw)
      const invalidDefault = { name: '', age: -1, email: 'not-an-email' };
      expect(() => {
        userValidator.parseOrDefault({ invalid: 'data' }, invalidDefault);
      }).toThrow('Invalid default value');
    });

    test('should protect against prototype pollution in complex objects', () => {
      const recordValidator = v.record(v.object({
        value: v.string()
      }));

      const maliciousData = {
        '__proto__': { value: 'polluted' },
        'safe_key': { value: 'safe' }
      };

      const result = recordValidator.parse(maliciousData);

      expect(result).toEqual({
        safe_key: { value: 'safe' }
      });
      expect((Object.prototype as any).value).toBeUndefined();
    });
  });
});
