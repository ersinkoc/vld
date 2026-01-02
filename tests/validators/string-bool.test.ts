/**
 * Tests for v.stringbool() - flexible boolean parsing
 */

import { v } from '../../src';

describe('v.stringbool()', () => {
  describe('default behavior', () => {
    const stringBoolValidator = v.stringbool();

    it('should accept default truthy values', () => {
      expect(stringBoolValidator.parse('true')).toBe(true);
      expect(stringBoolValidator.parse('TRUE')).toBe(true);
      expect(stringBoolValidator.parse('1')).toBe(true);
      expect(stringBoolValidator.parse('yes')).toBe(true);
      expect(stringBoolValidator.parse('YES')).toBe(true);
      expect(stringBoolValidator.parse('on')).toBe(true);
      expect(stringBoolValidator.parse('ON')).toBe(true);
      expect(stringBoolValidator.parse('y')).toBe(true);
      expect(stringBoolValidator.parse('Y')).toBe(true);
      expect(stringBoolValidator.parse('enabled')).toBe(true);
      expect(stringBoolValidator.parse('ENABLED')).toBe(true);
    });

    it('should accept default falsy values', () => {
      expect(stringBoolValidator.parse('false')).toBe(false);
      expect(stringBoolValidator.parse('FALSE')).toBe(false);
      expect(stringBoolValidator.parse('0')).toBe(false);
      expect(stringBoolValidator.parse('no')).toBe(false);
      expect(stringBoolValidator.parse('NO')).toBe(false);
      expect(stringBoolValidator.parse('off')).toBe(false);
      expect(stringBoolValidator.parse('OFF')).toBe(false);
      expect(stringBoolValidator.parse('n')).toBe(false);
      expect(stringBoolValidator.parse('N')).toBe(false);
      expect(stringBoolValidator.parse('disabled')).toBe(false);
      expect(stringBoolValidator.parse('DISABLED')).toBe(false);
    });

    it('should accept actual boolean values', () => {
      expect(stringBoolValidator.parse(true)).toBe(true);
      expect(stringBoolValidator.parse(false)).toBe(false);
    });

    it('should reject invalid string values', () => {
      expect(() => stringBoolValidator.parse('maybe')).toThrow();
      expect(() => stringBoolValidator.parse('invalid')).toThrow();
      expect(() => stringBoolValidator.parse('2')).toThrow();
    });

    it('should reject non-string, non-boolean values', () => {
      expect(() => stringBoolValidator.parse(123)).toThrow();
      expect(() => stringBoolValidator.parse(null)).toThrow();
      expect(() => stringBoolValidator.parse(undefined)).toThrow();
      expect(() => stringBoolValidator.parse({})).toThrow();
    });
  });

  describe('with custom truthy/falsy sets', () => {
    it('should use custom truthy values', () => {
      const customValidator = v.stringbool({
        truthy: ['active', 'open']
      });

      expect(customValidator.parse('active')).toBe(true);
      expect(customValidator.parse('open')).toBe(true);
      expect(() => customValidator.parse('true')).toThrow(); // Default truthy values not available
    });

    it('should use custom falsy values', () => {
      const customValidator = v.stringbool({
        falsy: ['inactive', 'closed']
      });

      expect(customValidator.parse('inactive')).toBe(false);
      expect(customValidator.parse('closed')).toBe(false);
      expect(() => customValidator.parse('false')).toThrow(); // Default falsy values not available
    });

    it('should work with both custom truthy and falsy', () => {
      const customValidator = v.stringbool({
        truthy: ['start', 'begin'],
        falsy: ['stop', 'end']
      });

      expect(customValidator.parse('start')).toBe(true);
      expect(customValidator.parse('begin')).toBe(true);
      expect(customValidator.parse('stop')).toBe(false);
      expect(customValidator.parse('end')).toBe(false);
    });
  });

  describe('case sensitivity', () => {
    it('should be case-insensitive by default', () => {
      const validator = v.stringbool();

      expect(validator.parse('TRUE')).toBe(true);
      expect(validator.parse('True')).toBe(true);
      expect(validator.parse('true')).toBe(true);
      expect(validator.parse('FALSE')).toBe(false);
      expect(validator.parse('False')).toBe(false);
      expect(validator.parse('false')).toBe(false);
    });

    it('should support case-sensitive matching', () => {
      const caseSensitiveValidator = v.stringbool({ caseSensitive: true });

      expect(caseSensitiveValidator.parse('true')).toBe(true);
      expect(() => caseSensitiveValidator.parse('TRUE')).toThrow();
      expect(() => caseSensitiveValidator.parse('True')).toThrow();
    });
  });

  describe('safeParse', () => {
    const validator = v.stringbool();

    it('should return success for valid values', () => {
      const trueResult = validator.safeParse('true');
      expect(trueResult.success).toBe(true);
      if (trueResult.success) {
        expect(trueResult.data).toBe(true);
      }

      const falseResult = validator.safeParse('false');
      expect(falseResult.success).toBe(true);
      if (falseResult.success) {
        expect(falseResult.data).toBe(false);
      }
    });

    it('should return failure for invalid values', () => {
      const result = validator.safeParse('invalid');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error.message).toContain('Invalid boolean string');
      }
    });
  });

  describe('method chaining', () => {
    it('should work with optional', () => {
      const optionalStringBool = v.stringbool().optional();
      expect(optionalStringBool.safeParse('true').success).toBe(true);
      expect(optionalStringBool.safeParse(undefined).success).toBe(true);
    });

    it('should work with nullable', () => {
      const nullableStringBool = v.stringbool().nullable();
      expect(nullableStringBool.safeParse('false').success).toBe(true);
      expect(nullableStringBool.safeParse(null).success).toBe(true);
    });

    it('should work with refine', () => {
      const onlyTruthy = v.stringbool().refine((val) => val === true, 'Only true values allowed');
      expect(onlyTruthy.safeParse('true').success).toBe(true);
      expect(onlyTruthy.safeParse('false').success).toBe(false);
    });

    it('should work with transform', () => {
      const invertedBool = v.stringbool().transform((val) => !val);
      const result = invertedBool.safeParse('true');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }
    });
  });

  describe('chaining methods', () => {
    const validator = v.stringbool();

    it('should support withTruthy()', () => {
      const customTruthy = validator.withTruthy(['affirmative']);
      expect(customTruthy.parse('affirmative')).toBe(true);
      expect(() => customTruthy.parse('true')).toThrow();
    });

    it('should support withFalsy()', () => {
      const customFalsy = validator.withFalsy(['negative']);
      expect(customFalsy.parse('negative')).toBe(false);
      expect(() => customFalsy.parse('false')).toThrow();
    });

    it('should support caseSensitive()', () => {
      const caseSensitive = validator.caseSensitive();
      expect(caseSensitive.parse('true')).toBe(true);
      expect(() => caseSensitive.parse('TRUE')).toThrow();
    });

    it('should support caseInsensitive()', () => {
      const caseInsensitive = v.stringbool({ caseSensitive: true }).caseInsensitive();
      expect(caseInsensitive.parse('TRUE')).toBe(true);
      expect(caseInsensitive.parse('true')).toBe(true);
    });
  });

  describe('integration with other validators', () => {
    it('should work in object schemas', () => {
      const configSchema = v.object({
        debugMode: v.stringbool(),
        loggingEnabled: v.stringbool()
      });

      const result = configSchema.safeParse({
        debugMode: 'true',
        loggingEnabled: 'yes'
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.debugMode).toBe(true);
        expect(result.data.loggingEnabled).toBe(true);
      }
    });

    it('should work in arrays', () => {
      const flagsSchema = v.array(v.stringbool());

      const result = flagsSchema.safeParse(['true', 'false', 'yes', 'no']);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([true, false, true, false]);
      }
    });
  });

  describe('error messages', () => {
    it('should provide descriptive error for invalid value', () => {
      const validator = v.stringbool();
      const result = validator.safeParse('maybe');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Invalid boolean string');
        expect(result.error.message).toContain('maybe');
      }
    });

    it('should list valid values in error message', () => {
      const customValidator = v.stringbool({
        truthy: ['start'],
        falsy: ['stop']
      });

      const result = customValidator.safeParse('invalid');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('start');
        expect(result.error.message).toContain('stop');
      }
    });
  });

  describe('edge cases', () => {
    it('should handle empty strings', () => {
      const validator = v.stringbool();
      expect(() => validator.parse('')).toThrow();
    });

    it('should handle whitespace', () => {
      const validator = v.stringbool();
      expect(() => validator.parse(' true ')).toThrow(); // Whitespace not trimmed
    });

    it('should work with only truthy values defined', () => {
      const onlyTruthy = v.stringbool({ truthy: ['yes'] });
      expect(onlyTruthy.parse('yes')).toBe(true);
      // Falls back to default falsy values
      expect(onlyTruthy.parse('no')).toBe(false);
    });

    it('should work with only falsy values defined', () => {
      const onlyFalsy = v.stringbool({ falsy: ['no'] });
      expect(onlyFalsy.parse('no')).toBe(false);
      // Falls back to default truthy values
      expect(onlyFalsy.parse('yes')).toBe(true);
    });
  });
});
