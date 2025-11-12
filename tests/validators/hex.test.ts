import { describe, it, expect } from '@jest/globals';
import { VldHex } from '../../src/validators/hex';

describe('VldHex', () => {
  describe('Basic Validation', () => {
    it('should validate hexadecimal strings', () => {
      const validator = VldHex.create();
      
      expect(validator.isValid('48656c6c6f')).toBe(true); // "Hello"
      expect(validator.isValid('deadbeef')).toBe(true);
      expect(validator.isValid('DEADBEEF')).toBe(true);
      expect(validator.isValid('123456789abcdefAB00F')).toBe(true); // Should be 20 chars (even)
      expect(validator.isValid('00')).toBe(true);
      expect(validator.isValid('FF')).toBe(true);
    });

    it('should reject non-string values', () => {
      const validator = VldHex.create();
      
      expect(validator.safeParse(123).success).toBe(false);
      expect(validator.safeParse(null).success).toBe(false);
      expect(validator.safeParse(undefined).success).toBe(false);
      expect(validator.safeParse([]).success).toBe(false);
      expect(validator.safeParse({}).success).toBe(false);
      expect(validator.safeParse(true).success).toBe(false);
    });

    it('should reject invalid hexadecimal strings', () => {
      const validator = VldHex.create();

      expect(validator.safeParse('Hello').success).toBe(false); // Contains non-hex chars
      expect(validator.safeParse('123g').success).toBe(false); // Contains 'g'
      expect(validator.safeParse('12 34').success).toBe(false); // Contains space
      // BUG-008 FIX: Empty strings are now valid (consistent with base64 validator)
      expect(validator.safeParse('').success).toBe(true); // Empty string (represents 0 bytes)
      expect(validator.safeParse('12345').success).toBe(false); // Odd length
    });

    it('should handle parse method', () => {
      const validator = VldHex.create();
      const validHex = 'deadbeef';
      
      expect(validator.parse(validHex)).toBe(validHex);
      expect(() => validator.parse('invalid')).toThrow();
      expect(() => validator.parse('123')).toThrow(); // Odd length
    });
  });

  describe('Lowercase Mode', () => {
    it('should normalize to lowercase when enabled', () => {
      const validator = VldHex.create().lowercaseMode();
      
      expect(validator.parse('DEADBEEF')).toBe('deadbeef');
      expect(validator.parse('DeAdBeEf')).toBe('deadbeef');
      expect(validator.parse('123ABC')).toBe('123abc');
      expect(validator.parse('abcd')).toBe('abcd'); // Already lowercase
    });

    it('should preserve case when lowercase mode disabled', () => {
      const validator = VldHex.create();
      
      expect(validator.parse('DEADBEEF')).toBe('DEADBEEF');
      expect(validator.parse('DeAdBeEf')).toBe('DeAdBeEf');
      expect(validator.parse('deadbeef')).toBe('deadbeef');
    });

    it('should use lowercase mode via constructor', () => {
      const validator = VldHex.create(true);
      
      expect(validator.parse('DEADBEEF')).toBe('deadbeef');
      expect(validator.parse('123ABC')).toBe('123abc');
    });
  });

  describe('Static Factory Methods', () => {
    it('should create standard hex validator', () => {
      const validator = VldHex.create();
      expect(validator.isValid('deadbeef')).toBe(true);
      expect(validator.parse('DEADBEEF')).toBe('DEADBEEF');
    });

    it('should create lowercase hex validator via parameter', () => {
      const validator = VldHex.create(true);
      expect(validator.isValid('deadbeef')).toBe(true);
      expect(validator.parse('DEADBEEF')).toBe('deadbeef');
    });

    it('should test constructor default parameter branch', () => {
      const standardValidator = VldHex.create(false); // Explicit false
      const lowercaseValidator = VldHex.create(true); // Explicit true
      
      expect(standardValidator.parse('DEADBEEF')).toBe('DEADBEEF');
      expect(lowercaseValidator.parse('DEADBEEF')).toBe('deadbeef');
    });
  });

  describe('Length Requirements', () => {
    it('should enforce even length (full bytes)', () => {
      const validator = VldHex.create();
      
      expect(validator.isValid('ab')).toBe(true); // 1 byte
      expect(validator.isValid('abcd')).toBe(true); // 2 bytes
      expect(validator.isValid('abcdef')).toBe(true); // 3 bytes
      
      expect(validator.safeParse('a').success).toBe(false); // Half byte
      expect(validator.safeParse('abc').success).toBe(false); // 1.5 bytes
      expect(validator.safeParse('abcde').success).toBe(false); // 2.5 bytes
    });

    it('should handle zero-length strings (empty hex)', () => {
      const validator = VldHex.create();
      // BUG-008 FIX: Empty strings are now valid (consistent with base64 validator)
      expect(validator.safeParse('').success).toBe(true);
      expect(validator.parse('')).toBe('');
    });
  });

  describe('Error Messages', () => {
    it('should provide correct error message for non-string', () => {
      const validator = VldHex.create();
      const result = validator.safeParse(123);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Expected string');
      }
    });

    it('should provide correct error message for invalid hex', () => {
      const validator = VldHex.create();
      
      const invalidCharsResult = validator.safeParse('xyz');
      expect(invalidCharsResult.success).toBe(false);
      if (!invalidCharsResult.success) {
        expect(invalidCharsResult.error.message).toContain('Invalid hex');
      }

      const oddLengthResult = validator.safeParse('abc');
      expect(oddLengthResult.success).toBe(false);
      if (!oddLengthResult.success) {
        expect(oddLengthResult.error.message).toContain('Invalid hex');
      }
    });
  });

  describe('Integration with Other Validators', () => {
    it('should work with optional', () => {
      const validator = VldHex.create().optional();
      
      expect(validator.isValid(undefined)).toBe(true);
      expect(validator.isValid('deadbeef')).toBe(true);
      expect(validator.isValid('invalid')).toBe(false);
    });

    it('should work with nullable', () => {
      const validator = VldHex.create().nullable();
      
      expect(validator.isValid(null)).toBe(true);
      expect(validator.isValid('deadbeef')).toBe(true);
      expect(validator.isValid('invalid')).toBe(false);
    });

    it('should work with default', () => {
      const defaultValue = 'deadbeef';
      const validator = VldHex.create().default(defaultValue);
      
      expect(validator.parse('abcd')).toBe('abcd');
      expect(validator.parse(undefined)).toBe(defaultValue);
    });

    it('should work with transform', () => {
      const validator = VldHex.create().transform(value => value.toUpperCase());
      
      expect(validator.parse('deadbeef')).toBe('DEADBEEF');
      expect(validator.parse('ABCD')).toBe('ABCD');
    });

    it('should work with refine', () => {
      const validator = VldHex.create().refine(
        value => value.length >= 8,
        'Hex string must be at least 8 characters'
      );
      
      expect(validator.isValid('deadbeef')).toBe(true);
      expect(validator.safeParse('abcd').success).toBe(false);
    });
  });

  describe('Real-world Use Cases', () => {
    it('should validate cryptographic hashes', () => {
      const validator = VldHex.create();
      
      // SHA-256 hash (64 chars)
      expect(validator.isValid('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')).toBe(true);
      
      // MD5 hash (32 chars)
      expect(validator.isValid('d41d8cd98f00b204e9800998ecf8427e')).toBe(true);
      
      // SHA-1 hash (40 chars)
      expect(validator.isValid('da39a3ee5e6b4b0d3255bfef95601890afd80709')).toBe(true);
    });

    it('should validate MAC addresses', () => {
      const validator = VldHex.create().refine(
        value => value.length === 12,
        'MAC address must be 12 hex characters'
      );
      
      expect(validator.isValid('001122334455')).toBe(true);
      expect(validator.isValid('AABBCCDDEEFF')).toBe(true);
      expect(validator.safeParse('00112233').success).toBe(false); // Too short
    });

    it('should validate color codes', () => {
      const validator = VldHex.create().refine(
        value => value.length === 6,
        'Color code must be 6 hex characters'
      );
      
      expect(validator.isValid('FF0000')).toBe(true); // Red
      expect(validator.isValid('00FF00')).toBe(true); // Green
      expect(validator.isValid('0000FF')).toBe(true); // Blue
      expect(validator.isValid('FFFFFF')).toBe(true); // White
      expect(validator.isValid('000000')).toBe(true); // Black
    });

    it('should validate binary data representations', () => {
      const validator = VldHex.create();
      
      // PNG file signature
      expect(validator.isValid('89504E470D0A1A0A')).toBe(true);
      
      // JPEG file signature
      expect(validator.isValid('FFD8FFE0')).toBe(true);
      
      // Random binary data
      expect(validator.isValid('0102030405060708090a0b0c0d0e0f10')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle minimum valid length', () => {
      const validator = VldHex.create();
      expect(validator.isValid('00')).toBe(true);
      expect(validator.isValid('FF')).toBe(true);
      expect(validator.isValid('aB')).toBe(true);
    });

    it('should handle all valid hex characters', () => {
      const validator = VldHex.create();
      
      // All digits
      expect(validator.isValid('0123456789')).toBe(true);
      
      // All lowercase letters
      expect(validator.isValid('abcdef')).toBe(true);
      
      // All uppercase letters
      expect(validator.isValid('ABCDEF')).toBe(true);
      
      // Mixed case
      expect(validator.isValid('0a1B2c3D4e5F')).toBe(true);
    });

    it('should handle boundary characters correctly', () => {
      const validator = VldHex.create();
      
      // Just before valid range
      expect(validator.safeParse('/').success).toBe(false); // ASCII 47, before '0'
      expect(validator.safeParse('@').success).toBe(false); // ASCII 64, before 'A'
      expect(validator.safeParse('`').success).toBe(false); // ASCII 96, before 'a'
      
      // Just after valid range
      expect(validator.safeParse(':').success).toBe(false); // ASCII 58, after '9'
      expect(validator.safeParse('[').success).toBe(false); // ASCII 91, after 'Z'
      expect(validator.safeParse('{').success).toBe(false); // ASCII 123, after 'z'
    });

    it('should maintain immutability when chaining', () => {
      const original = VldHex.create();
      const lowercase = original.lowercaseMode();
      
      // Original should preserve case
      expect(original.parse('DEADBEEF')).toBe('DEADBEEF');
      
      // Lowercase should normalize
      expect(lowercase.parse('DEADBEEF')).toBe('deadbeef');
    });

    it('should handle very long hex strings', () => {
      const validator = VldHex.create();
      
      // 1024 characters (512 bytes)
      const longHex = '0123456789abcdef'.repeat(64);
      expect(validator.isValid(longHex)).toBe(true);
      
      // Ensure it maintains even length requirement
      const oddLongHex = '0123456789abcdef'.repeat(64) + '0';
      expect(validator.safeParse(oddLongHex).success).toBe(false);
    });
  });

  describe('Method Chaining', () => {
    it('should preserve validator state through chaining', () => {
      const validator = VldHex.create()
        .lowercaseMode()
        .refine(value => value.length === 8, 'Must be exactly 8 characters');
      
      expect(validator.parse('DEADBEEF')).toBe('deadbeef');
      expect(validator.safeParse('abcd').success).toBe(false); // Wrong length
      expect(validator.safeParse('xyz12345').success).toBe(false); // Invalid chars
    });

    it('should handle multiple transformations', () => {
      const validator = VldHex.create(true)
        .transform(value => value.toUpperCase()) // This overrides lowercase
        .refine(value => value === value.toUpperCase(), 'Must be uppercase');
      
      // The transform overrides the lowercase normalization
      expect(validator.parse('deadbeef')).toBe('DEADBEEF');
    });
  });

  describe('Performance Edge Cases', () => {
    it('should handle repeated patterns efficiently', () => {
      const validator = VldHex.create();
      
      // Repeated pattern
      expect(validator.isValid('abab'.repeat(100))).toBe(true);
      
      // All same character
      expect(validator.isValid('aa'.repeat(100))).toBe(true);
      expect(validator.isValid('FF'.repeat(100))).toBe(true);
    });
  });
});