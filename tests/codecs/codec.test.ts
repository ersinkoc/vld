import { describe, it, expect } from '@jest/globals';
import { v } from '../../src/index';
import {
  base64ToUint8Array,
  uint8ArrayToBase64,
  hexToUint8Array,
  uint8ArrayToHex,
  stringToUint8Array,
  uint8ArrayToString
} from '../../src/utils/codec-utils';

describe('VldCodec', () => {
  describe('Basic codec functionality', () => {
    it('should create a simple string to number codec', () => {
      const stringToNumber = v.codec(
        v.string(),
        v.number(),
        {
          decode: (str: string) => parseInt(str, 10),
          encode: (num: number) => num.toString()
        }
      );
      
      // Test decode (parse)
      expect(stringToNumber.parse('123')).toBe(123);
      const parseResult = stringToNumber.safeParse('456');
      expect(parseResult.success).toBe(true);
      if (parseResult.success) {
        expect(parseResult.data).toBe(456);
      }
      
      // Test encode
      expect(stringToNumber.encode(789)).toBe('789');
      const encodeResult = stringToNumber.safeEncode(999);
      expect(encodeResult.success).toBe(true);
      if (encodeResult.success) {
        expect(encodeResult.data).toBe('999');
      }
    });
    
    it('should validate input before decoding', () => {
      const codec = v.codec(
        v.string().min(3),
        v.number(),
        {
          decode: (str: string) => parseInt(str, 10),
          encode: (num: number) => num.toString()
        }
      );
      
      const result = codec.safeParse('12');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('at least 3 characters');
      }
    });
    
    it('should validate output after decoding', () => {
      const codec = v.codec(
        v.string(),
        v.number().positive(),
        {
          decode: (str: string) => parseInt(str, 10),
          encode: (num: number) => num.toString()
        }
      );
      
      const result = codec.safeParse('-5');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('positive');
      }
    });
  });
  
  describe('Base64 codec', () => {
    it('should encode and decode base64 to Uint8Array', () => {
      const base64Codec = v.codec(
        v.base64(),
        v.uint8Array(),
        {
          decode: base64ToUint8Array,
          encode: uint8ArrayToBase64
        }
      );
      
      // Test decode
      const base64String = 'SGVsbG8gV29ybGQ='; // "Hello World"
      const decoded = base64Codec.parse(base64String);
      expect(decoded).toBeInstanceOf(Uint8Array);
      expect(uint8ArrayToString(decoded)).toBe('Hello World');
      
      // Test encode
      const bytes = stringToUint8Array('Hello VLD');
      const encoded = base64Codec.encode(bytes);
      expect(encoded).toBe(uint8ArrayToBase64(bytes));
      
      // Round trip
      const original = 'VGVzdCBTdHJpbmc=';
      const roundTrip = base64Codec.encode(base64Codec.parse(original));
      expect(roundTrip).toBe(original);
    });
    
    it('should reject invalid base64 strings', () => {
      const base64Codec = v.codec(
        v.base64(),
        v.uint8Array(),
        {
          decode: base64ToUint8Array,
          encode: uint8ArrayToBase64
        }
      );
      
      const result = base64Codec.safeParse('Not@Base64!');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Invalid base64');
      }
    });
  });
  
  describe('Hex codec', () => {
    it('should encode and decode hex to Uint8Array', () => {
      const hexCodec = v.codec(
        v.hex(),
        v.uint8Array(),
        {
          decode: hexToUint8Array,
          encode: uint8ArrayToHex
        }
      );
      
      // Test decode
      const hexString = '48656c6c6f'; // "Hello"
      const decoded = hexCodec.parse(hexString);
      expect(decoded).toBeInstanceOf(Uint8Array);
      expect(uint8ArrayToString(decoded)).toBe('Hello');
      
      // Test encode
      const bytes = stringToUint8Array('VLD');
      const encoded = hexCodec.encode(bytes);
      expect(encoded).toBe(uint8ArrayToHex(bytes));
      
      // Round trip
      const original = 'deadbeef';
      const roundTrip = hexCodec.encode(hexCodec.parse(original));
      expect(roundTrip).toBe(original);
    });
    
    it('should handle lowercase hex mode', () => {
      const hexCodec = v.codec(
        v.hex().lowercaseMode(),
        v.uint8Array(),
        {
          decode: hexToUint8Array,
          encode: (bytes) => uint8ArrayToHex(bytes).toLowerCase()
        }
      );
      
      const hexString = 'ABCDEF';
      const decoded = hexCodec.parse(hexString);
      const encoded = hexCodec.encode(decoded);
      expect(encoded).toBe('abcdef');
    });
    
    it('should reject invalid hex strings', () => {
      const hexCodec = v.codec(
        v.hex(),
        v.uint8Array(),
        {
          decode: hexToUint8Array,
          encode: uint8ArrayToHex
        }
      );
      
      // Invalid characters
      let result = hexCodec.safeParse('xyz123');
      expect(result.success).toBe(false);
      
      // Odd length
      result = hexCodec.safeParse('abc');
      expect(result.success).toBe(false);
    });
  });
  
  describe('Complex codec transformations', () => {
    it('should handle JSON encoding through base64', () => {
      const userSchema = v.object({
        name: v.string(),
        age: v.number()
      });
      
      const base64JsonCodec = v.codec(
        v.base64(),
        userSchema,
        {
          decode: (base64: string) => {
            const jsonString = uint8ArrayToString(base64ToUint8Array(base64));
            return JSON.parse(jsonString);
          },
          encode: (data: any) => {
            const jsonString = JSON.stringify(data);
            return uint8ArrayToBase64(stringToUint8Array(jsonString));
          }
        }
      );
      
      const user = { name: 'John', age: 30 };
      const encoded = base64JsonCodec.encode(user);
      const decoded = base64JsonCodec.parse(encoded);
      
      expect(decoded).toEqual(user);
    });
    
    it('should handle nested codec transformations', () => {
      // First codec: string to hex
      const stringToHex = v.codec(
        v.string(),
        v.hex(),
        {
          decode: (str: string) => uint8ArrayToHex(stringToUint8Array(str)),
          encode: (hex: string) => uint8ArrayToString(hexToUint8Array(hex))
        }
      );
      
      // Test the codec
      const original = 'Hello';
      const hex = stringToHex.parse(original);
      expect(hex).toBe('48656c6c6f');
      
      const backToString = stringToHex.encode(hex);
      expect(backToString).toBe(original);
    });
  });
  
  describe('Async codec operations', () => {
    it('should support async decode operations', async () => {
      const asyncCodec = v.codec(
        v.string(),
        v.number(),
        {
          decode: async (str: string) => {
            // Simulate async operation
            await new Promise(resolve => setTimeout(resolve, 10));
            return parseInt(str, 10);
          },
          encode: (num: number) => num.toString()
        }
      );
      
      const result = await asyncCodec.parseAsync('123');
      expect(result).toBe(123);
      
      const safeResult = await asyncCodec.safeParseAsync('456');
      expect(safeResult.success).toBe(true);
      if (safeResult.success) {
        expect(safeResult.data).toBe(456);
      }
    });
    
    it('should support async encode operations', async () => {
      const asyncCodec = v.codec(
        v.string(),
        v.number(),
        {
          decode: (str: string) => parseInt(str, 10),
          encode: async (num: number) => {
            // Simulate async operation
            await new Promise(resolve => setTimeout(resolve, 10));
            return num.toString();
          }
        }
      );
      
      const result = await asyncCodec.encodeAsync(789);
      expect(result).toBe('789');
      
      const safeResult = await asyncCodec.safeEncodeAsync(999);
      expect(safeResult.success).toBe(true);
      if (safeResult.success) {
        expect(safeResult.data).toBe('999');
      }
    });
    
    it('should error when using sync methods with async transforms', () => {
      const asyncCodec = v.codec(
        v.string(),
        v.number(),
        {
          decode: async (str: string) => parseInt(str, 10),
          encode: (num: number) => num.toString()
        }
      );
      
      expect(() => asyncCodec.parse('123')).toThrow('Async codec operations');
    });

    it('should error when using sync encode with async encode transform', () => {
      const asyncCodec = v.codec(
        v.string(),
        v.number(),
        {
          decode: (str: string) => parseInt(str, 10),
          encode: async (num: number) => num.toString()
        }
      );
      
      const result = asyncCodec.safeEncode(123);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Async codec operations');
      }
    });

    it('should handle async parseAsync errors with invalid input', async () => {
      const asyncCodec = v.codec(
        v.string().min(5), // Require at least 5 characters
        v.number(),
        {
          decode: async (str: string) => parseInt(str, 10),
          encode: (num: number) => num.toString()
        }
      );
      
      // This should fail input validation before reaching decode
      const result = await asyncCodec.safeParseAsync('123'); // Only 3 characters
      expect(result.success).toBe(false);
    });

    it('should handle async parseAsync errors from decode function', async () => {
      const asyncCodec = v.codec(
        v.string(),
        v.number(),
        {
          decode: async () => {
            throw new Error('Async decode failed');
          },
          encode: (num: number) => num.toString()
        }
      );
      
      const result = await asyncCodec.safeParseAsync('123');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Failed to decode');
      }
    });

    it('should handle async encodeAsync errors with invalid output', async () => {
      const asyncCodec = v.codec(
        v.string(),
        v.number().positive(), // Require positive numbers
        {
          decode: (str: string) => parseInt(str, 10),
          encode: async (num: number) => num.toString()
        }
      );
      
      // This should fail output validation before reaching encode
      const result = await asyncCodec.safeEncodeAsync(-5); // Negative number
      expect(result.success).toBe(false);
    });

    it('should handle async encodeAsync errors from encode function', async () => {
      const asyncCodec = v.codec(
        v.string(),
        v.number(),
        {
          decode: (str: string) => parseInt(str, 10),
          encode: async () => {
            throw new Error('Async encode failed');
          }
        }
      );
      
      const result = await asyncCodec.safeEncodeAsync(123);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Failed to encode');
      }
    });

    it('should handle parseAsync that throws errors', async () => {
      const asyncCodec = v.codec(
        v.string(),
        v.number(),
        {
          decode: async () => {
            throw new Error('Parse error');
          },
          encode: (num: number) => num.toString()
        }
      );
      
      await expect(asyncCodec.parseAsync('123')).rejects.toThrow();
    });

    it('should handle encodeAsync that throws errors', async () => {
      const asyncCodec = v.codec(
        v.string(),
        v.number(),
        {
          decode: (str: string) => parseInt(str, 10),
          encode: async () => {
            throw new Error('Encode error');
          }
        }
      );
      
      await expect(asyncCodec.encodeAsync(123)).rejects.toThrow();
    });
  });
  
  describe('Error handling', () => {
    it('should handle decode errors gracefully', () => {
      const codec = v.codec(
        v.string(),
        v.number(),
        {
          decode: () => {
            throw new Error('Decode failed');
          },
          encode: (num: number) => num.toString()
        }
      );
      
      const result = codec.safeParse('123');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Failed to decode');
      }
    });
    
    it('should handle encode errors gracefully', () => {
      const codec = v.codec(
        v.string(),
        v.number(),
        {
          decode: (str: string) => parseInt(str, 10),
          encode: () => {
            throw new Error('Encode failed');
          }
        }
      );
      
      const result = codec.safeEncode(123);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Failed to encode');
      }
    });

    it('should handle VldError from decode function', () => {
      const { VldError, createIssue } = require('../../src/errors');
      
      const codec = v.codec(
        v.string(),
        v.number(),
        {
          decode: () => {
            throw new VldError([createIssue('custom', [], 'Custom decode error')]);
          },
          encode: (num: number) => num.toString()
        }
      );
      
      const result = codec.safeParse('123');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Custom decode error');
      }
    });

    it('should handle VldError from encode function', () => {
      const { VldError, createIssue } = require('../../src/errors');
      
      const codec = v.codec(
        v.string(),
        v.number(),
        {
          decode: (str: string) => parseInt(str, 10),
          encode: () => {
            throw new VldError([createIssue('custom', [], 'Custom encode error')]);
          }
        }
      );
      
      const result = codec.safeEncode(123);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Custom encode error');
      }
    });

    it('should handle sync encode with output validation failure', () => {
      const codec = v.codec(
        v.string(),
        v.number().positive(), // Require positive numbers
        {
          decode: (str: string) => parseInt(str, 10),
          encode: (num: number) => num.toString()
        }
      );
      
      const result = codec.safeEncode(-5); // Negative number should fail validation
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('positive');
      }
    });

    it('should handle sync encode errors and throw in encode method', () => {
      const codec = v.codec(
        v.string(),
        v.number(),
        {
          decode: (str: string) => parseInt(str, 10),
          encode: () => {
            throw new Error('Encode failed');
          }
        }
      );
      
      expect(() => codec.encode(123)).toThrow();
    });

    it('should handle async VldError from decode function', async () => {
      const { VldError, createIssue } = require('../../src/errors');
      
      const asyncCodec = v.codec(
        v.string(),
        v.number(),
        {
          decode: async () => {
            throw new VldError([createIssue('custom', [], 'Custom async decode error')]);
          },
          encode: (num: number) => num.toString()
        }
      );
      
      const result = await asyncCodec.safeParseAsync('123');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Custom async decode error');
      }
    });

    it('should handle async VldError from encode function', async () => {
      const { VldError, createIssue } = require('../../src/errors');
      
      const asyncCodec = v.codec(
        v.string(),
        v.number(),
        {
          decode: (str: string) => parseInt(str, 10),
          encode: async () => {
            throw new VldError([createIssue('custom', [], 'Custom async encode error')]);
          }
        }
      );
      
      const result = await asyncCodec.safeEncodeAsync(123);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Custom async encode error');
      }
    });
  });
});