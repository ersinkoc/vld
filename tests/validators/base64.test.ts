import { describe, it, expect } from '@jest/globals';
import { VldBase64 } from '../../src/validators/base64';

describe('VldBase64', () => {
  describe('Basic Validation', () => {
    it('should validate standard base64 strings', () => {
      const validator = VldBase64.create();
      
      expect(validator.isValid('SGVsbG8gV29ybGQ=')).toBe(true); // "Hello World"
      expect(validator.isValid('VkxE')).toBe(true); // "VLD"
      expect(validator.isValid('')).toBe(true); // Empty string
      expect(validator.isValid('QQ==')).toBe(true); // "A"
    });

    it('should reject non-string values', () => {
      const validator = VldBase64.create();
      
      expect(validator.safeParse(123).success).toBe(false);
      expect(validator.safeParse(null).success).toBe(false);
      expect(validator.safeParse(undefined).success).toBe(false);
      expect(validator.safeParse([]).success).toBe(false);
      expect(validator.safeParse({}).success).toBe(false);
      expect(validator.safeParse(true).success).toBe(false);
    });

    it('should reject invalid base64 strings', () => {
      const validator = VldBase64.create();
      
      expect(validator.safeParse('Hello World!').success).toBe(false); // Contains spaces and !
      expect(validator.safeParse('SGVsbG8gV29ybGQ=@').success).toBe(false); // Contains @
      expect(validator.safeParse('SGVsbG8gV29ybGQ').success).toBe(false); // Wrong length (not multiple of 4)
      expect(validator.safeParse('SGVsbG8gV29ybGQ===').success).toBe(false); // Too many padding chars
    });

    it('should handle parse method', () => {
      const validator = VldBase64.create();
      const validBase64 = 'SGVsbG8gV29ybGQ=';
      
      expect(validator.parse(validBase64)).toBe(validBase64);
      expect(() => validator.parse('invalid base64!')).toThrow();
    });
  });

  describe('URL-Safe Mode', () => {
    it('should validate URL-safe base64 strings', () => {
      const validator = VldBase64.create().urlSafeMode();
      
      expect(validator.isValid('SGVsbG8gV29ybGQ=')).toBe(true); // With padding
      expect(validator.isValid('VLD_')).toBe(true); // Contains underscore (length 4)
      expect(validator.isValid('VLD-')).toBe(true); // Contains dash (length 4)
      expect(validator.isValid('VLD_test-123')).toBe(true); // Length 12 (multiple of 4)
    });

    it('should reject standard base64 chars in URL-safe mode', () => {
      const validator = VldBase64.create().urlSafeMode();
      
      expect(validator.safeParse('SGVsbG8+V29ybGQ=').success).toBe(false); // Contains +
      expect(validator.safeParse('SGVsbG8/V29ybGQ=').success).toBe(false); // Contains /
    });

    it('should use URL-safe regex correctly', () => {
      const validator = VldBase64.create(true); // Direct constructor usage
      
      expect(validator.isValid('test_123-abc')).toBe(true);
      expect(validator.safeParse('test+123/abc').success).toBe(false);
    });
  });

  describe('Static Factory Methods', () => {
    it('should create standard base64 validator', () => {
      const validator = VldBase64.create();
      expect(validator.isValid('SGVsbG8gV29ybGQ=')).toBe(true);
      expect(validator.safeParse('SGVsbG8_V29ybGQ=').success).toBe(false);
    });

    it('should create URL-safe base64 validator via parameter', () => {
      const validator = VldBase64.create(true);
      expect(validator.isValid('SGVsbG8_V29ybGQ=')).toBe(true); // Fixed length
      expect(validator.safeParse('SGVsbG8+V29ybGQ=').success).toBe(false);
    });

    it('should test constructor default parameter branch', () => {
      const standardValidator = VldBase64.create(false); // Explicit false
      const urlSafeValidator = VldBase64.create(true);   // Explicit true
      
      expect(standardValidator.isValid('SGVsbG8gV29ybGQ=')).toBe(true);
      expect(standardValidator.safeParse('SGVsbG8_V29ybGQ=').success).toBe(false);
      
      expect(urlSafeValidator.isValid('SGVsbG8_V29ybGQ=')).toBe(true);
      expect(urlSafeValidator.safeParse('SGVsbG8+V29ybGQ=').success).toBe(false);
    });
  });

  describe('Error Messages', () => {
    it('should provide correct error message for non-string', () => {
      const validator = VldBase64.create();
      const result = validator.safeParse(123);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Expected string');
      }
    });

    it('should provide correct error message for invalid base64', () => {
      const validator = VldBase64.create();
      
      const invalidFormatResult = validator.safeParse('invalid!@#');
      expect(invalidFormatResult.success).toBe(false);
      if (!invalidFormatResult.success) {
        expect(invalidFormatResult.error.message).toContain('Invalid base64');
      }

      const invalidLengthResult = validator.safeParse('SGVsbG8');
      expect(invalidLengthResult.success).toBe(false);
      if (!invalidLengthResult.success) {
        expect(invalidLengthResult.error.message).toContain('Invalid base64');
      }
    });
  });

  describe('Integration with Other Validators', () => {
    it('should work with optional', () => {
      const validator = VldBase64.create().optional();
      
      expect(validator.isValid(undefined)).toBe(true);
      expect(validator.isValid('SGVsbG8gV29ybGQ=')).toBe(true);
      expect(validator.isValid('invalid')).toBe(false);
    });

    it('should work with nullable', () => {
      const validator = VldBase64.create().nullable();
      
      expect(validator.isValid(null)).toBe(true);
      expect(validator.isValid('SGVsbG8gV29ybGQ=')).toBe(true);
      expect(validator.isValid('invalid')).toBe(false);
    });

    it('should work with default', () => {
      const defaultValue = 'VkxE';
      const validator = VldBase64.create().default(defaultValue);
      
      expect(validator.parse('SGVsbG8gV29ybGQ=')).toBe('SGVsbG8gV29ybGQ=');
      expect(validator.parse(undefined)).toBe(defaultValue);
    });

    it('should work with transform', () => {
      const validator = VldBase64.create().transform(value => value.replace(/=/g, ''));
      
      expect(validator.parse('SGVsbG8gV29ybGQ=')).toBe('SGVsbG8gV29ybGQ');
      expect(validator.parse('VkxE')).toBe('VkxE');
    });

    it('should work with refine', () => {
      const validator = VldBase64.create().refine(
        value => value.length >= 8,
        'Base64 string must be at least 8 characters'
      );
      
      expect(validator.isValid('SGVsbG8gV29ybGQ=')).toBe(true);
      expect(validator.safeParse('VkxE').success).toBe(false);
    });
  });

  describe('Real-world Use Cases', () => {
    it('should validate JWT tokens (base64url)', () => {
      const validator = VldBase64.create().urlSafeMode();
      
      // JWT header (length 36, needs padding to reach 36 which is multiple of 4)
      expect(validator.isValid('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')).toBe(true);
      
      // JWT payload (length 74, add padding to make it 76)
      expect(validator.isValid('eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ==')).toBe(true);
      
      // Should reject standard base64 padding in URL-safe mode
      expect(validator.safeParse('SGVsbG8+V29ybGQ=').success).toBe(false); // Contains +
    });

    it('should validate image data URIs (standard base64)', () => {
      const validator = VldBase64.create();
      
      // Sample base64 encoded data
      const imageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
      expect(validator.isValid(imageData)).toBe(true);
      
      // Should reject URL-safe characters in standard mode
      expect(validator.safeParse('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8_5-hHgAHggJ_PchI7wAAAABJRU5ErkJggg').success).toBe(false);
    });

    it('should validate API keys and tokens', () => {
      const validator = VldBase64.create();
      
      expect(validator.isValid('YWJjZGVmZ2hpams=')).toBe(true); // "abcdefghijk"
      expect(validator.isValid('dGVzdF9hcGlfa2V5XzEyMw==')).toBe(true); // "test_api_key_123"
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string', () => {
      const validator = VldBase64.create();
      expect(validator.isValid('')).toBe(true);
    });

    it('should handle single character (padded)', () => {
      const validator = VldBase64.create();
      expect(validator.isValid('QQ==')).toBe(true); // "A"
      expect(validator.safeParse('Q').success).toBe(false); // Wrong length
    });

    it('should handle maximum padding', () => {
      const validator = VldBase64.create();
      expect(validator.isValid('QQ==')).toBe(true); // 2 padding chars
      expect(validator.isValid('QWE=')).toBe(true); // 1 padding char
      expect(validator.safeParse('Q===').success).toBe(false); // 3 padding chars (invalid)
    });

    it('should handle case sensitivity correctly', () => {
      const validator = VldBase64.create();
      expect(validator.isValid('SGVsbG8gV29ybGQ=')).toBe(true); // Mixed case
      expect(validator.isValid('SGVSBG8GV29YBGQ=')).toBe(true); // Upper case
      expect(validator.isValid('sgvsbg8gv29ybgq=')).toBe(true); // Lower case
    });

    it('should maintain immutability when chaining', () => {
      const original = VldBase64.create();
      const urlSafe = original.urlSafeMode();
      
      // Original should still validate standard base64
      expect(original.isValid('SGVsbG8+V29ybGQ=')).toBe(true);
      
      // URL-safe should reject standard base64 characters
      expect(urlSafe.safeParse('SGVsbG8+V29ybGQ=').success).toBe(false);
    });
  });

  describe('Method Chaining', () => {
    it('should preserve validator state through chaining', () => {
      const validator = VldBase64.create()
        .urlSafeMode()
        .refine(value => value.length > 4, 'Too short');
      
      expect(validator.isValid('SGVsbG8gV29ybGQ=')).toBe(true); // Fixed length
      expect(validator.safeParse('test+abc').success).toBe(false); // Still URL-safe (contains +)
      expect(validator.safeParse('abcd').success).toBe(false); // Too short
    });
  });
});