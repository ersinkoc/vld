/**
 * Test cases for NPM Package Bug Analysis Fixes
 * Testing bugs discovered during comprehensive package analysis
 */

import { v } from '../src/index';
import { hexToUint8Array, uint8ArrayToHex } from '../src/utils/codec-utils';
import { isValidIPv6 } from '../src/utils/ip-validation';
import { base64Json, jwtPayload } from '../src/codecs';

describe('NPM Package Bug Fixes', () => {
  describe('BUG-NPM-002: VldDefault - Validate Default Value', () => {
    it('should throw error when default value violates validation rules', () => {
      // Default value "hi" violates min(5) constraint
      expect(() => {
        v.string().min(5).default("hi");
      }).toThrow('Invalid default value');
    });

    it('should throw error when default number violates max constraint', () => {
      expect(() => {
        v.number().max(10).default(20);
      }).toThrow('Invalid default value');
    });

    it('should throw error when default violates custom refine rules', () => {
      expect(() => {
        v.number().refine(n => n > 0, 'Must be positive').default(-5);
      }).toThrow('Invalid default value');
    });

    it('should accept valid default values', () => {
      const schema = v.string().min(5).default("hello");
      expect(schema.parse(undefined)).toBe("hello");
    });

    it('should validate default value with complex validators', () => {
      expect(() => {
        v.object({ name: v.string(), age: v.number() })
          .default({ name: 123, age: 25 } as any);
      }).toThrow('Invalid default value');
    });
  });

  describe('BUG-NPM-003: VldCatch - Validate Fallback Value', () => {
    it('should throw error when fallback value violates validation rules', () => {
      // Fallback value "no" violates min(5) constraint
      expect(() => {
        v.string().min(5).catch("no");
      }).toThrow('Invalid fallback value');
    });

    it('should throw error when fallback number violates constraints', () => {
      expect(() => {
        v.number().positive().catch(-10);
      }).toThrow('Invalid fallback value');
    });

    it('should throw error when fallback violates type constraints', () => {
      expect(() => {
        v.string().email().catch("not-an-email");
      }).toThrow('Invalid fallback value');
    });

    it('should accept valid fallback values', () => {
      const schema = v.string().min(5).catch("default");
      expect(schema.parse(123)).toBe("default");
    });

    it('should validate fallback with complex validators', () => {
      expect(() => {
        v.array(v.number()).min(2).catch([1] as any);
      }).toThrow('Invalid fallback value');
    });
  });

  describe('BUG-NPM-006: hexToUint8Array - Silent Data Corruption', () => {
    it('should throw error for invalid hex characters', () => {
      expect(() => hexToUint8Array('0z')).toThrow('Invalid hex string: contains non-hexadecimal characters');
      expect(() => hexToUint8Array('gg')).toThrow('Invalid hex string: contains non-hexadecimal characters');
      expect(() => hexToUint8Array('1g')).toThrow('Invalid hex string: contains non-hexadecimal characters');
    });

    it('should throw error for hex with non-hex characters anywhere', () => {
      expect(() => hexToUint8Array('12g4')).toThrow('Invalid hex string');
      expect(() => hexToUint8Array('abcx')).toThrow('Invalid hex string');
      expect(() => hexToUint8Array('00 11')).toThrow('Invalid hex string'); // space
    });

    it('should accept valid hex strings', () => {
      const result1 = hexToUint8Array('00');
      expect(result1).toEqual(new Uint8Array([0]));

      const result2 = hexToUint8Array('ff');
      expect(result2).toEqual(new Uint8Array([255]));

      const result3 = hexToUint8Array('0123456789abcdef');
      expect(result3.length).toBe(8);
    });

    it('should accept hex with 0x prefix', () => {
      const result = hexToUint8Array('0x1234');
      expect(result).toEqual(new Uint8Array([0x12, 0x34]));
    });

    it('should handle uppercase hex correctly', () => {
      const result = hexToUint8Array('ABCDEF');
      expect(result).toEqual(new Uint8Array([0xAB, 0xCD, 0xEF]));
    });

    it('should accept empty hex string', () => {
      const result = hexToUint8Array('');
      expect(result).toEqual(new Uint8Array([]));
    });

    it('should round-trip correctly after validation fix', () => {
      const original = new Uint8Array([1, 2, 3, 255, 0, 128]);
      const hex = uint8ArrayToHex(original);
      const result = hexToUint8Array(hex);
      expect(result).toEqual(original);
    });
  });

  describe('BUG-NPM-007: IPv6 Validation - Overly Permissive', () => {
    it('should reject double compression (multiple ::)', () => {
      expect(isValidIPv6('::1::')).toBe(false);
      expect(isValidIPv6('2001::db8::1')).toBe(false);
    });

    it('should reject too short invalid addresses', () => {
      expect(isValidIPv6('a:b')).toBe(false);
      expect(isValidIPv6('1:2:3')).toBe(false);
    });

    it('should reject invalid structure', () => {
      expect(isValidIPv6(':test:')).toBe(false);
      expect(isValidIPv6('test::')).toBe(false);
    });

    it('should reject too many groups (without compression)', () => {
      expect(isValidIPv6('1:2:3:4:5:6:7:8:9')).toBe(false);
    });

    it('should reject too many groups (with compression)', () => {
      // With ::, can have at most 7 non-empty groups
      expect(isValidIPv6('1:2:3:4:5:6:7:8::')).toBe(false);
    });

    it('should reject groups with more than 4 hex characters', () => {
      expect(isValidIPv6('12345::1')).toBe(false);
      expect(isValidIPv6('::abcde')).toBe(false);
    });

    it('should accept valid IPv6 addresses', () => {
      expect(isValidIPv6('::1')).toBe(true); // loopback
      expect(isValidIPv6('2001:db8::1')).toBe(true);
      expect(isValidIPv6('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true); // full
      expect(isValidIPv6('fe80::1ff:fe23:4567:890a')).toBe(true); // link-local
      expect(isValidIPv6('2001:db8::')).toBe(true); // trailing compression
      expect(isValidIPv6('::ffff:192.0.2.1')).toBe(true); // IPv4-mapped
    });

    it('should accept valid compressed addresses', () => {
      expect(isValidIPv6('::')).toBe(true); // all zeros
      expect(isValidIPv6('::1234')).toBe(true);
      expect(isValidIPv6('1234::')).toBe(true);
      expect(isValidIPv6('1234::5678')).toBe(true);
    });

    it('should handle v.string().ipv6() correctly with fixed validation', () => {
      const schema = v.string().ipv6();

      // Valid addresses
      expect(schema.safeParse('::1').success).toBe(true);
      expect(schema.safeParse('2001:db8::1').success).toBe(true);

      // Invalid addresses that were incorrectly accepted before
      expect(schema.safeParse('::1::').success).toBe(false);
      expect(schema.safeParse('a:b').success).toBe(false);
    });
  });

  describe('BUG-NPM-004: jwtPayload - Missing Error Handling', () => {
    it('should handle invalid JWT format gracefully', () => {
      const codec = jwtPayload();

      expect(() => codec.parse('invalid')).toThrow('Invalid JWT format');
      expect(() => codec.parse('one.two')).toThrow('Invalid JWT format');
    });

    it('should handle empty JWT payload', () => {
      const codec = jwtPayload();

      // JWT with empty payload - error is wrapped by codec error handling
      expect(() => codec.parse('header..signature')).toThrow();
    });

    it('should handle invalid base64 in JWT payload', () => {
      const codec = jwtPayload();

      // Invalid base64 characters
      expect(() => codec.parse('header.@@@.signature')).toThrow();
    });

    it('should handle invalid JSON in JWT payload', () => {
      const codec = jwtPayload();

      // Valid base64 but invalid JSON
      const invalidJson = btoa('{invalid json}');
      expect(() => codec.parse(`header.${invalidJson}.signature`)).toThrow();
    });

    it('should successfully parse valid JWT', () => {
      const codec = jwtPayload();
      const payload = { sub: '1234567890', name: 'John Doe', iat: 1516239022 };
      const payloadBase64 = btoa(JSON.stringify(payload));
      const jwt = `header.${payloadBase64}.signature`;

      const result = codec.parse(jwt);
      expect(result.sub).toBe('1234567890');
      expect(result.name).toBe('John Doe');
    });
  });

  describe('BUG-NPM-005: base64Json - Missing Error Handling', () => {
    it('should handle invalid JSON gracefully', () => {
      const codec = base64Json();

      // Valid base64 but invalid JSON - error is wrapped by codec error handling
      const invalidJson = btoa('{invalid json}');
      expect(() => codec.parse(invalidJson)).toThrow();
    });

    it('should handle invalid base64 format', () => {
      const codec = base64Json();

      expect(() => codec.parse('@@@@')).toThrow();
    });

    it('should successfully parse valid base64 JSON', () => {
      const codec = base64Json();
      const data = { message: 'hello', count: 42 };
      const encoded = codec.encode(data);
      const decoded = codec.parse(encoded);

      expect(decoded).toEqual(data);
    });

    it('should handle complex nested JSON', () => {
      const codec = base64Json();
      const data = {
        user: { name: 'Alice', age: 30 },
        items: [1, 2, 3],
        metadata: { created: '2024-01-01' }
      };

      const encoded = codec.encode(data);
      const decoded = codec.parse(encoded);

      expect(decoded).toEqual(data);
    });
  });

  describe('Integration Tests - All Fixes Working Together', () => {
    it('should handle complex validation with validated defaults', () => {
      const userSchema = v.object({
        name: v.string().min(2),
        age: v.number().positive(),
        email: v.string().email()
      });

      // Valid default
      const schemaWithDefault = userSchema.default({
        name: 'John',
        age: 25,
        email: 'john@example.com'
      });

      expect(schemaWithDefault.parse(undefined)).toEqual({
        name: 'John',
        age: 25,
        email: 'john@example.com'
      });

      // Invalid default should throw
      expect(() => {
        userSchema.default({
          name: 'J', // too short
          age: 25,
          email: 'john@example.com'
        });
      }).toThrow('Invalid default value');
    });

    it('should validate hex strings in data processing pipeline', () => {
      const hexSchema = v.string().refine(
        (s) => /^[0-9a-fA-F]+$/.test(s),
        'Must be valid hex'
      );

      // Should accept valid hex
      expect(hexSchema.parse('abcdef')).toBe('abcdef');

      // Should reject invalid hex
      expect(() => hexSchema.parse('xyz')).toThrow();

      // hexToUint8Array should also validate
      expect(() => hexToUint8Array('xyz')).toThrow('Invalid hex string');
    });

    it('should properly validate IPv6 in network address schemas', () => {
      const addressSchema = v.object({
        ip: v.string().ipv6(),
        port: v.number().positive()
      });

      // Valid IPv6
      expect(addressSchema.parse({
        ip: '::1',
        port: 8080
      })).toEqual({
        ip: '::1',
        port: 8080
      });

      // Invalid IPv6 (double compression) should now fail
      expect(() => addressSchema.parse({
        ip: '::1::',
        port: 8080
      })).toThrow();
    });
  });
});
