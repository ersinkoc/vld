import { describe, it, expect } from '@jest/globals';
import { VldUint8Array } from '../../src/validators/uint8array';

describe('VldUint8Array', () => {
  describe('Basic Validation', () => {
    it('should validate Uint8Array values', () => {
      const validator = VldUint8Array.create();
      const bytes = new Uint8Array([1, 2, 3, 4, 5]);
      
      expect(validator.parse(bytes)).toEqual(bytes);
      expect(validator.isValid(bytes)).toBe(true);
    });

    it('should reject non-Uint8Array values', () => {
      const validator = VldUint8Array.create();
      
      expect(validator.safeParse('not-bytes').success).toBe(false);
      expect(validator.safeParse(123).success).toBe(false);
      expect(validator.safeParse([1, 2, 3]).success).toBe(false);
      expect(validator.safeParse(new ArrayBuffer(10)).success).toBe(false);
      expect(validator.safeParse(new Int8Array([1, 2, 3])).success).toBe(false);
      expect(validator.safeParse(null).success).toBe(false);
      expect(validator.safeParse(undefined).success).toBe(false);
    });

    it('should handle empty Uint8Array', () => {
      const validator = VldUint8Array.create();
      const emptyBytes = new Uint8Array(0);
      
      expect(validator.parse(emptyBytes)).toEqual(emptyBytes);
      expect(validator.isValid(emptyBytes)).toBe(true);
    });
  });

  describe('Length Constraints', () => {
    it('should validate minimum length', () => {
      const validator = VldUint8Array.create().min(3);
      
      // Valid cases
      expect(validator.parse(new Uint8Array([1, 2, 3]))).toEqual(new Uint8Array([1, 2, 3]));
      expect(validator.parse(new Uint8Array([1, 2, 3, 4]))).toEqual(new Uint8Array([1, 2, 3, 4]));
      
      // Invalid cases
      expect(validator.safeParse(new Uint8Array([1, 2])).success).toBe(false);
      expect(validator.safeParse(new Uint8Array([1])).success).toBe(false);
      expect(validator.safeParse(new Uint8Array(0)).success).toBe(false);
    });

    it('should validate maximum length', () => {
      const validator = VldUint8Array.create().max(3);
      
      // Valid cases
      expect(validator.parse(new Uint8Array([1, 2, 3]))).toEqual(new Uint8Array([1, 2, 3]));
      expect(validator.parse(new Uint8Array([1, 2]))).toEqual(new Uint8Array([1, 2]));
      expect(validator.parse(new Uint8Array(0))).toEqual(new Uint8Array(0));
      
      // Invalid cases
      expect(validator.safeParse(new Uint8Array([1, 2, 3, 4])).success).toBe(false);
      expect(validator.safeParse(new Uint8Array([1, 2, 3, 4, 5])).success).toBe(false);
    });

    it('should validate exact length', () => {
      const validator = VldUint8Array.create().length(4);
      
      // Valid case
      expect(validator.parse(new Uint8Array([1, 2, 3, 4]))).toEqual(new Uint8Array([1, 2, 3, 4]));
      
      // Invalid cases
      expect(validator.safeParse(new Uint8Array([1, 2, 3])).success).toBe(false);
      expect(validator.safeParse(new Uint8Array([1, 2, 3, 4, 5])).success).toBe(false);
      expect(validator.safeParse(new Uint8Array(0)).success).toBe(false);
    });

    it('should handle combined length constraints', () => {
      const validator = VldUint8Array.create().min(2).max(5);
      
      // Valid cases
      expect(validator.isValid(new Uint8Array([1, 2]))).toBe(true);
      expect(validator.isValid(new Uint8Array([1, 2, 3]))).toBe(true);
      expect(validator.isValid(new Uint8Array([1, 2, 3, 4]))).toBe(true);
      expect(validator.isValid(new Uint8Array([1, 2, 3, 4, 5]))).toBe(true);
      
      // Invalid cases
      expect(validator.isValid(new Uint8Array([1]))).toBe(false);
      expect(validator.isValid(new Uint8Array(0))).toBe(false);
      expect(validator.isValid(new Uint8Array([1, 2, 3, 4, 5, 6]))).toBe(false);
    });
  });

  describe('Error Messages', () => {
    it('should provide correct error message for wrong type', () => {
      const validator = VldUint8Array.create();
      const result = validator.safeParse('not-bytes');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Expected Uint8Array');
      }
    });

    it('should provide correct error message for min length', () => {
      const validator = VldUint8Array.create().min(5);
      const result = validator.safeParse(new Uint8Array([1, 2, 3]));
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('at least 5 bytes');
      }
    });

    it('should provide correct error message for max length', () => {
      const validator = VldUint8Array.create().max(2);
      const result = validator.safeParse(new Uint8Array([1, 2, 3, 4, 5]));
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('at most 2 bytes');
      }
    });

    it('should provide correct error message for exact length', () => {
      const validator = VldUint8Array.create().length(3);
      const result = validator.safeParse(new Uint8Array([1, 2, 3, 4, 5]));
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('exactly 3 bytes');
      }
    });
  });

  describe('Method Chaining', () => {
    it('should maintain immutability when chaining', () => {
      const original = VldUint8Array.create();
      const withMin = original.min(2);
      const withMax = withMin.max(5);
      const withLength = original.length(3);
      
      // Original should be unchanged
      expect(original.isValid(new Uint8Array([1]))).toBe(true);
      
      // Chained validators should have their constraints
      expect(withMin.isValid(new Uint8Array([1]))).toBe(false);
      expect(withMax.isValid(new Uint8Array([1, 2, 3, 4, 5, 6]))).toBe(false);
      expect(withLength.isValid(new Uint8Array([1, 2]))).toBe(false);
      expect(withLength.isValid(new Uint8Array([1, 2, 3]))).toBe(true);
    });

    it('should handle multiple constraint combinations', () => {
      // Min and max together
      const minMax = VldUint8Array.create().min(3).max(6);
      expect(minMax.isValid(new Uint8Array([1, 2]))).toBe(false);
      expect(minMax.isValid(new Uint8Array([1, 2, 3]))).toBe(true);
      expect(minMax.isValid(new Uint8Array([1, 2, 3, 4, 5, 6]))).toBe(true);
      expect(minMax.isValid(new Uint8Array([1, 2, 3, 4, 5, 6, 7]))).toBe(false);
      
      // Length overrides min/max
      const lengthOverride = VldUint8Array.create().min(2).max(10).length(5);
      expect(lengthOverride.isValid(new Uint8Array([1, 2, 3]))).toBe(false);
      expect(lengthOverride.isValid(new Uint8Array([1, 2, 3, 4, 5]))).toBe(true);
      expect(lengthOverride.isValid(new Uint8Array([1, 2, 3, 4, 5, 6, 7]))).toBe(false);
    });
  });

  describe('Integration with Other Validators', () => {
    it('should work with optional', () => {
      const validator = VldUint8Array.create().min(2).optional();
      
      expect(validator.isValid(undefined)).toBe(true);
      expect(validator.isValid(new Uint8Array([1, 2]))).toBe(true);
      expect(validator.isValid(new Uint8Array([1]))).toBe(false);
    });

    it('should work with nullable', () => {
      const validator = VldUint8Array.create().max(3).nullable();
      
      expect(validator.isValid(null)).toBe(true);
      expect(validator.isValid(new Uint8Array([1, 2, 3]))).toBe(true);
      expect(validator.isValid(new Uint8Array([1, 2, 3, 4]))).toBe(false);
    });

    it('should work with default', () => {
      const defaultBytes = new Uint8Array([0, 0, 0]);
      const validator = VldUint8Array.create().default(defaultBytes);
      
      expect(validator.parse(new Uint8Array([1, 2, 3]))).toEqual(new Uint8Array([1, 2, 3]));
      expect(validator.parse(undefined)).toEqual(defaultBytes);
    });

    it('should work with refine', () => {
      const validator = VldUint8Array.create().refine(
        bytes => bytes.length > 0 && bytes[0] === 0xFF,
        'First byte must be 0xFF'
      );
      
      expect(validator.isValid(new Uint8Array([0xFF, 0x00, 0x01]))).toBe(true);
      expect(validator.safeParse(new Uint8Array([0x00, 0xFF])).success).toBe(false);
      expect(validator.safeParse(new Uint8Array(0)).success).toBe(false);
    });

    it('should work with transform', () => {
      const validator = VldUint8Array.create().transform(bytes => 
        new Uint8Array(bytes.map(b => b + 1))
      );
      
      const input = new Uint8Array([1, 2, 3]);
      const result = validator.parse(input);
      expect(result).toEqual(new Uint8Array([2, 3, 4]));
    });
  });

  describe('Parse Method', () => {
    it('should return data directly on successful parse', () => {
      const validator = VldUint8Array.create();
      const bytes = new Uint8Array([1, 2, 3]);
      
      const result = validator.parse(bytes);
      expect(result).toBe(bytes); // Should return the same instance
    });

    it('should throw error on failed parse', () => {
      const validator = VldUint8Array.create().min(5);
      const shortBytes = new Uint8Array([1, 2, 3]);
      
      expect(() => validator.parse(shortBytes)).toThrow();
      
      try {
        validator.parse(shortBytes);
      } catch (error: any) {
        expect(error.issues).toBeDefined();
        expect(error.issues[0].message).toContain('at least 5 bytes');
      }
    });
  });

  describe('Real-world Use Cases', () => {
    it('should validate cryptographic keys', () => {
      // AES-256 key should be exactly 32 bytes
      const aes256KeyValidator = VldUint8Array.create().length(32);
      
      const validKey = new Uint8Array(32);
      crypto.getRandomValues(validKey);
      expect(aes256KeyValidator.isValid(validKey)).toBe(true);
      
      const shortKey = new Uint8Array(16);
      expect(aes256KeyValidator.isValid(shortKey)).toBe(false);
      
      const longKey = new Uint8Array(48);
      expect(aes256KeyValidator.isValid(longKey)).toBe(false);
    });

    it('should validate file headers', () => {
      // PNG file header validation
      const pngHeaderValidator = VldUint8Array.create()
        .length(8)
        .refine(
          bytes => bytes[0] === 0x89 && 
                   bytes[1] === 0x50 && 
                   bytes[2] === 0x4E && 
                   bytes[3] === 0x47,
          'Invalid PNG header'
        );
      
      const validPngHeader = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      expect(pngHeaderValidator.isValid(validPngHeader)).toBe(true);
      
      const invalidHeader = new Uint8Array([0x00, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      expect(pngHeaderValidator.isValid(invalidHeader)).toBe(false);
    });

    it('should validate network packet sizes', () => {
      // Ethernet frame: 64-1518 bytes
      const ethernetFrameValidator = VldUint8Array.create().min(64).max(1518);
      
      expect(ethernetFrameValidator.isValid(new Uint8Array(64))).toBe(true);
      expect(ethernetFrameValidator.isValid(new Uint8Array(1518))).toBe(true);
      expect(ethernetFrameValidator.isValid(new Uint8Array(63))).toBe(false);
      expect(ethernetFrameValidator.isValid(new Uint8Array(1519))).toBe(false);
    });

    it('should validate hash outputs', () => {
      // SHA-256 hash should be exactly 32 bytes
      const sha256Validator = VldUint8Array.create().length(32);
      
      // SHA-1 hash should be exactly 20 bytes  
      const sha1Validator = VldUint8Array.create().length(20);
      
      // MD5 hash should be exactly 16 bytes
      const md5Validator = VldUint8Array.create().length(16);
      
      expect(sha256Validator.isValid(new Uint8Array(32))).toBe(true);
      expect(sha256Validator.isValid(new Uint8Array(20))).toBe(false);
      
      expect(sha1Validator.isValid(new Uint8Array(20))).toBe(true);
      expect(sha1Validator.isValid(new Uint8Array(32))).toBe(false);
      
      expect(md5Validator.isValid(new Uint8Array(16))).toBe(true);
      expect(md5Validator.isValid(new Uint8Array(20))).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large arrays', () => {
      const validator = VldUint8Array.create().min(1000);
      const largeArray = new Uint8Array(10000);
      
      expect(validator.isValid(largeArray)).toBe(true);
      expect(validator.parse(largeArray)).toBe(largeArray);
    });

    it('should handle zero constraints', () => {
      const validator = VldUint8Array.create().min(0).max(0).length(0);
      const emptyArray = new Uint8Array(0);
      
      expect(validator.isValid(emptyArray)).toBe(true);
      expect(validator.isValid(new Uint8Array([1]))).toBe(false);
    });

    it('should handle all byte values', () => {
      const allBytesArray = new Uint8Array(256);
      for (let i = 0; i < 256; i++) {
        allBytesArray[i] = i;
      }
      
      const validator = VldUint8Array.create().length(256);
      expect(validator.isValid(allBytesArray)).toBe(true);
      
      // Verify all values are preserved
      const result = validator.parse(allBytesArray);
      for (let i = 0; i < 256; i++) {
        expect(result[i]).toBe(i);
      }
    });
  });
});