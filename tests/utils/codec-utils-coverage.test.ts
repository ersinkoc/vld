/**
 * Coverage tests for codec-utils.ts
 * These tests target specific uncovered edge cases
 */

import {
  hexToUint8Array,
  stringToUint8Array,
  uint8ArrayToString,
  safeAtob
} from '../../src/utils/codec-utils';

describe('Codec Utils Coverage Tests', () => {
  describe('hexToUint8Array - large input protection', () => {
    it('should throw on extremely large hex string (DoS protection)', () => {
      // Create a hex string larger than 20 million characters
      const largeHex = 'a'.repeat(20000001);

      expect(() => hexToUint8Array(largeHex)).toThrow('Hex string is too large');
    });
  });

  describe('stringToUint8Array - large input protection', () => {
    it('should throw on extremely large string (DoS protection)', () => {
      // Create a string larger than 10 million characters
      const largeString = 'x'.repeat(10000001);

      expect(() => stringToUint8Array(largeString)).toThrow('String is too large');
    });
  });

  describe('uint8ArrayToString - large input protection', () => {
    it('should throw on extremely large byte array (DoS protection)', () => {
      // Create a byte array larger than 10 million bytes
      const largeBytes = new Uint8Array(10000001);

      expect(() => uint8ArrayToString(largeBytes)).toThrow('Byte array is too large');
    });
  });

  describe('safeAtob - input validation', () => {
    it('should throw on null input', () => {
      expect(() => safeAtob(null as any)).toThrow('Base64 input cannot be null or undefined');
    });

    it('should throw on undefined input', () => {
      expect(() => safeAtob(undefined as any)).toThrow('Base64 input cannot be null or undefined');
    });

    it('should throw on non-string input', () => {
      expect(() => safeAtob(123 as any)).toThrow('Base64 input must be a string');
      expect(() => safeAtob({} as any)).toThrow('Base64 input must be a string');
      expect(() => safeAtob([] as any)).toThrow('Base64 input must be a string');
    });

    it('should throw on invalid base64 padding (more than 2 equals)', () => {
      // Valid base64 can only have 0, 1, or 2 padding characters
      // The regex catches this as invalid format
      expect(() => safeAtob('abc===')).toThrow('Invalid base64 format');
    });

    it('should keep the defensive invalid-padding guard active', () => {
      const originalTest = RegExp.prototype.test;
      RegExp.prototype.test = function patchedTest(this: RegExp, value: string): boolean {
        if (this.source === '^[A-Za-z0-9+/]*={0,2}$') {
          return true;
        }
        if (this.source === '^={1,2}$') {
          return false;
        }
        return originalTest.call(this, value);
      };

      try {
        expect(() => safeAtob('abc===')).toThrow('Invalid base64 padding');
      } finally {
        RegExp.prototype.test = originalTest;
      }
    });

    it('should throw on base64 padding not at end', () => {
      // Padding in the middle is invalid
      expect(() => safeAtob('a=bc')).toThrow('Invalid base64 format');
    });

    it('should keep the defensive padding-position guard active', () => {
      const originalTest = RegExp.prototype.test;
      RegExp.prototype.test = function patchedTest(this: RegExp, value: string): boolean {
        if (this.source === '^[A-Za-z0-9+/]*={0,2}$' || this.source === '^={1,2}$') {
          return true;
        }
        return originalTest.call(this, value);
      };

      try {
        expect(() => safeAtob('a=bc')).toThrow('Base64 padding must be at the end');
      } finally {
        RegExp.prototype.test = originalTest;
      }
    });

    it('should throw on invalid base64 characters', () => {
      expect(() => safeAtob('hello!world')).toThrow('Invalid base64 format');
    });

    it('should decode valid base64', () => {
      const result = safeAtob('SGVsbG8=');
      expect(result).toBe('Hello');
    });

    it('should handle base64 with single padding', () => {
      // "a" in base64 requires single padding
      const result = safeAtob('YQ==');
      expect(result).toBe('a');
    });

    it('should handle base64 with double padding', () => {
      // "ab" in base64 requires single padding
      const result = safeAtob('YWI=');
      expect(result).toBe('ab');
    });

    it('should throw on extremely large base64 input', () => {
      const largeBase64 = 'A'.repeat(10000001);
      expect(() => safeAtob(largeBase64)).toThrow('Base64 input is too large');
    });

    it('should wrap native atob decode failures', () => {
      const originalAtob = global.atob;
      (global as any).atob = () => {
        throw new Error('native failure');
      };

      try {
        expect(() => safeAtob('SGVsbG8=')).toThrow('Failed to decode base64 data');
      } finally {
        (global as any).atob = originalAtob;
      }
    });

    it('should reject oversized decoded data in the Node fallback', () => {
      const originalAtob = global.atob;
      const originalBuffer = globalThis.Buffer;
      const originalProcess = globalThis.process;
      delete (global as any).atob;
      (globalThis as any).Buffer = {
        from: () => ({
          length: 5000001,
          toString: () => 'oversized'
        })
      };
      (globalThis as any).process = { versions: { node: '20.0.0' } };

      try {
        expect(() => safeAtob('SGVsbG8=')).toThrow('Failed to decode base64 data in Node.js environment');
      } finally {
        (global as any).atob = originalAtob;
        (globalThis as any).Buffer = originalBuffer;
        (globalThis as any).process = originalProcess;
      }
    });

    it('should normalize invalid base64 errors in the Node fallback', () => {
      const originalAtob = global.atob;
      const originalBuffer = globalThis.Buffer;
      const originalProcess = globalThis.process;
      delete (global as any).atob;
      (globalThis as any).Buffer = {
        from: () => {
          throw new Error('Invalid base64 payload');
        }
      };
      (globalThis as any).process = { versions: { node: '20.0.0' } };

      try {
        expect(() => safeAtob('SGVsbG8=')).toThrow('Invalid base64 format');
      } finally {
        (global as any).atob = originalAtob;
        (globalThis as any).Buffer = originalBuffer;
        (globalThis as any).process = originalProcess;
      }
    });

    it('should wrap generic Node fallback decode failures', () => {
      const originalAtob = global.atob;
      const originalBuffer = globalThis.Buffer;
      const originalProcess = globalThis.process;
      delete (global as any).atob;
      (globalThis as any).Buffer = {
        from: () => {
          throw new Error('decode failure');
        }
      };
      (globalThis as any).process = { versions: { node: '20.0.0' } };

      try {
        expect(() => safeAtob('SGVsbG8=')).toThrow('Failed to decode base64 data in Node.js environment');
      } finally {
        (global as any).atob = originalAtob;
        (globalThis as any).Buffer = originalBuffer;
        (globalThis as any).process = originalProcess;
      }
    });
  });
});
