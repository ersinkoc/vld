import { describe, it, expect, jest } from '@jest/globals';
import {
  base64ToUint8Array,
  uint8ArrayToBase64,
  uint8ArrayToBase64Url,
  hexToUint8Array,
  uint8ArrayToHex,
  stringToUint8Array,
  uint8ArrayToString,
  isNodeEnvironment,
  safeAtob,
  safeBtoa
} from '../../src/utils/codec-utils';

describe('Codec Utilities', () => {
  describe('Base64 Utilities', () => {
    it('should convert base64 to Uint8Array', () => {
      const base64 = 'SGVsbG8gV29ybGQ='; // "Hello World"
      const result = base64ToUint8Array(base64);
      expect(result).toBeInstanceOf(Uint8Array);
      expect(uint8ArrayToString(result)).toBe('Hello World');
    });

    it('should handle URL-safe base64', () => {
      const base64Url = 'SGVsbG8gV29ybGQ'; // URL-safe, no padding
      const result = base64ToUint8Array(base64Url);
      expect(result).toBeInstanceOf(Uint8Array);
      expect(uint8ArrayToString(result)).toBe('Hello World');
    });

    it('should handle base64 with padding', () => {
      const base64 = 'SGVsbG8='; // "Hello"
      const result = base64ToUint8Array(base64);
      expect(uint8ArrayToString(result)).toBe('Hello');
    });

    it('should convert Uint8Array to base64', () => {
      const text = 'Hello World';
      const bytes = stringToUint8Array(text);
      const base64 = uint8ArrayToBase64(bytes);
      expect(base64).toBe('SGVsbG8gV29ybGQ=');
    });

    it('should convert Uint8Array to URL-safe base64', () => {
      const text = 'Hello World';
      const bytes = stringToUint8Array(text);
      const base64Url = uint8ArrayToBase64Url(bytes);
      expect(base64Url).toBe('SGVsbG8gV29ybGQ'); // No padding, URL-safe
    });

    it('should handle empty input', () => {
      const emptyBytes = new Uint8Array(0);
      const base64 = uint8ArrayToBase64(emptyBytes);
      expect(base64).toBe('');

      const result = base64ToUint8Array('');
      expect(result).toEqual(new Uint8Array(0));
    });
  });

  describe('Hex Utilities', () => {
    it('should convert hex to Uint8Array', () => {
      const hex = '48656c6c6f'; // "Hello"
      const result = hexToUint8Array(hex);
      expect(result).toBeInstanceOf(Uint8Array);
      expect(uint8ArrayToString(result)).toBe('Hello');
    });

    it('should handle uppercase hex', () => {
      const hex = '48656C6C6F'; // "Hello" in uppercase
      const result = hexToUint8Array(hex);
      expect(uint8ArrayToString(result)).toBe('Hello');
    });

    it('should handle hex with 0x prefix', () => {
      const hex = '0x48656c6c6f'; // "Hello" with prefix
      const result = hexToUint8Array(hex);
      expect(uint8ArrayToString(result)).toBe('Hello');
    });

    it('should pad odd-length hex', () => {
      const hex = 'a'; // Odd length
      const result = hexToUint8Array(hex);
      expect(result.length).toBe(1);
      expect(result[0]).toBe(10); // 0x0a
    });

    it('should convert Uint8Array to hex', () => {
      const text = 'Hello';
      const bytes = stringToUint8Array(text);
      const hex = uint8ArrayToHex(bytes);
      expect(hex).toBe('48656c6c6f');
    });

    it('should handle single byte values', () => {
      const bytes = new Uint8Array([0, 15, 255]);
      const hex = uint8ArrayToHex(bytes);
      expect(hex).toBe('000fff');
    });
  });

  describe('UTF-8 Utilities', () => {
    it('should convert string to Uint8Array', () => {
      const text = 'Hello 世界 🌍';
      const bytes = stringToUint8Array(text);
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBeGreaterThan(text.length); // Multi-byte characters
    });

    it('should convert Uint8Array to string', () => {
      const text = 'Hello 世界 🌍';
      const bytes = stringToUint8Array(text);
      const result = uint8ArrayToString(bytes);
      expect(result).toBe(text);
    });

    it('should handle empty string', () => {
      const bytes = stringToUint8Array('');
      expect(bytes.length).toBe(0);
      
      const text = uint8ArrayToString(new Uint8Array(0));
      expect(text).toBe('');
    });

    it('should handle ASCII text', () => {
      const text = 'Hello World 123!';
      const bytes = stringToUint8Array(text);
      expect(bytes.length).toBe(text.length); // ASCII is 1 byte per char
      
      const result = uint8ArrayToString(bytes);
      expect(result).toBe(text);
    });
  });

  describe('Environment Detection', () => {
    it('should detect Node.js environment correctly', () => {
      // In test environment, we're in Node.js
      const isNode = isNodeEnvironment();
      expect(typeof isNode).toBe('boolean');
    });

    it('should handle missing global process', () => {
      const originalProcess = globalThis.process;
      delete (globalThis as any).process;
      
      const isNode = isNodeEnvironment();
      expect(isNode).toBe(false);
      
      // Restore
      (globalThis as any).process = originalProcess;
    });

    it('should handle process without versions', () => {
      const originalProcess = globalThis.process;
      (globalThis as any).process = { versions: null };
      
      const isNode = isNodeEnvironment();
      expect(isNode).toBe(false);
      
      // Restore
      (globalThis as any).process = originalProcess;
    });
  });

  describe('Safe Base64 Functions', () => {
    it('should use native atob when available', () => {
      const base64 = 'SGVsbG8='; // "Hello"
      const result = safeAtob(base64);
      expect(result).toBe('Hello');
    });

    it('should use native btoa when available', () => {
      const text = 'Hello';
      const result = safeBtoa(text);
      expect(result).toBe('SGVsbG8=');
    });

    it('should handle Node.js fallback for atob', () => {
      const originalAtob = global.atob;
      delete (global as any).atob;
      
      // Mock Node.js environment
      const mockBuffer = {
        from: jest.fn().mockReturnValue({
          toString: jest.fn().mockReturnValue('Hello')
        })
      };
      (globalThis as any).Buffer = mockBuffer;
      (globalThis as any).process = { versions: { node: '16.0.0' } };
      
      const result = safeAtob('SGVsbG8=');
      expect(result).toBe('Hello');
      expect(mockBuffer.from).toHaveBeenCalledWith('SGVsbG8=', 'base64');
      
      // Restore
      (global as any).atob = originalAtob;
      delete (globalThis as any).Buffer;
    });

    it('should handle Node.js fallback for btoa', () => {
      const originalBtoa = global.btoa;
      delete (global as any).btoa;
      
      // Mock Node.js environment
      const mockBuffer = {
        from: jest.fn().mockReturnValue({
          toString: jest.fn().mockReturnValue('SGVsbG8=')
        })
      };
      (globalThis as any).Buffer = mockBuffer;
      (globalThis as any).process = { versions: { node: '16.0.0' } };
      
      const result = safeBtoa('Hello');
      expect(result).toBe('SGVsbG8=');
      expect(mockBuffer.from).toHaveBeenCalledWith('Hello', 'binary');
      
      // Restore
      (global as any).btoa = originalBtoa;
      delete (globalThis as any).Buffer;
    });

    it('should throw error when no base64 support available', () => {
      const originalAtob = global.atob;
      delete (global as any).atob;
      delete (globalThis as any).process;
      
      expect(() => safeAtob('SGVsbG8=')).toThrow('Base64 decoding not supported');
      
      // Restore
      (global as any).atob = originalAtob;
    });

    it('should throw error when no base64 encoding support available', () => {
      const originalBtoa = global.btoa;
      delete (global as any).btoa;
      delete (globalThis as any).process;
      
      expect(() => safeBtoa('Hello')).toThrow('Base64 encoding not supported');
      
      // Restore
      (global as any).btoa = originalBtoa;
    });
  });

  describe('Round-trip Tests', () => {
    it('should handle base64 round-trip conversions', () => {
      const originalText = 'Hello World! 🌍 测试 العربية русский';
      const bytes = stringToUint8Array(originalText);
      const base64 = uint8ArrayToBase64(bytes);
      const decodedBytes = base64ToUint8Array(base64);
      const finalText = uint8ArrayToString(decodedBytes);
      
      expect(finalText).toBe(originalText);
    });

    it('should handle hex round-trip conversions', () => {
      const originalText = 'Hello Hex! 123';
      const bytes = stringToUint8Array(originalText);
      const hex = uint8ArrayToHex(bytes);
      const decodedBytes = hexToUint8Array(hex);
      const finalText = uint8ArrayToString(decodedBytes);
      
      expect(finalText).toBe(originalText);
    });

    it('should handle base64url round-trip', () => {
      const originalText = 'URL Safe Base64!';
      const bytes = stringToUint8Array(originalText);
      const base64Url = uint8ArrayToBase64Url(bytes);
      const decodedBytes = base64ToUint8Array(base64Url);
      const finalText = uint8ArrayToString(decodedBytes);
      
      expect(finalText).toBe(originalText);
    });
  });

  describe('Edge Cases', () => {
    it('should handle binary data', () => {
      const binaryData = new Uint8Array([0, 1, 2, 255, 254, 253]);
      
      // Base64 round-trip
      const base64 = uint8ArrayToBase64(binaryData);
      const decodedBase64 = base64ToUint8Array(base64);
      expect(decodedBase64).toEqual(binaryData);
      
      // Hex round-trip
      const hex = uint8ArrayToHex(binaryData);
      const decodedHex = hexToUint8Array(hex);
      expect(decodedHex).toEqual(binaryData);
    });

    it('should handle large data', () => {
      const largeText = 'x'.repeat(10000);
      const bytes = stringToUint8Array(largeText);
      expect(bytes.length).toBe(10000);
      
      const base64 = uint8ArrayToBase64(bytes);
      const decoded = base64ToUint8Array(base64);
      const result = uint8ArrayToString(decoded);
      expect(result).toBe(largeText);
    });
  });
});