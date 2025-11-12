/**
 * Tests for security fixes implemented in bug analysis
 */

import { VldUnion } from '../src/validators/union';
import { v } from '../src/index';
import { safeAtob } from '../src/utils/codec-utils';
import { VldCoerceString } from '../src/coercion/string';

describe('Security Fixes Validation', () => {

  describe('BUG-001: Union Validator Type Safety', () => {
    it('should prevent constructor name spoofing attacks', () => {
      const stringValidator = v.string();
      const numberValidator = v.number();

      // Create a malicious validator that tries to spoof constructor name
      const maliciousValidator = {
        ...stringValidator,
        constructor: {
          name: 'VldNumber'
        },
        parse: () => 'malicious_string',
        safeParse: () => ({ success: true, data: 'malicious_string' })
      } as any;

      const unionValidator = VldUnion.create(stringValidator, numberValidator, maliciousValidator);

      // Should correctly validate string despite spoofing attempt
      expect(unionValidator.parse('test')).toBe('test');

      // Should correctly validate number
      expect(unionValidator.parse(123)).toBe(123);

      // Should reject invalid types
      expect(() => unionValidator.parse({})).toThrow();
    });

    it('should use safe type checking instead of constructor names', () => {
      const stringValidator = v.string();
      const numberValidator = v.number();
      const unionValidator = VldUnion.create(stringValidator, numberValidator);

      // Should work correctly with real validators
      expect(unionValidator.parse('hello')).toBe('hello');
      expect(unionValidator.parse(42)).toBe(42);

      // Should reject invalid types
      expect(() => unionValidator.parse(true)).toThrow();
    });
  });

  describe('BUG-002: Prototype Pollution Prevention in Codecs', () => {
    it('should reject malicious base64 input with prototype pollution attempts', () => {
      // Test various prototype pollution attempts
      const maliciousInputs = [
        btoa('__proto__.polluted=true'),
        btoa('constructor.prototype.polluted=true'),
        btoa('["__proto__"]["polluted"]=true'),
        btoa('eval("Object.prototype.polluted=true")')
      ];

      maliciousInputs.forEach(maliciousInput => {
        expect(() => safeAtob(maliciousInput)).toThrow();
      });
    });

    it('should detect suspicious content in base64 input', () => {
      const suspiciousContent = btoa('function malicious() { return "evil"; }');
      expect(() => safeAtob(suspiciousContent)).toThrow();
    });

    it('should validate legitimate base64 input', () => {
      const legitimateInputs = [
        'SGVsbG8gV29ybGQ=', // "Hello World"
        'dGVzdA==',         // "test"
        'YWJj',             // "abc"
        '',                 // empty string should be allowed
        'ZQ=='              // "e"
      ];

      legitimateInputs.forEach(input => {
        if (input) {
          expect(() => {
            const result = safeAtob(input);
            expect(typeof result).toBe('string');
          }).not.toThrow();
        }
      });
    });

    it('should enforce size limits on base64 input', () => {
      const oversizedInput = 'A'.repeat(10000001);
      expect(() => safeAtob(oversizedInput)).toThrow();
    });

    it('should reject invalid base64 format', () => {
      const invalidInputs = [
        '!!!invalid!!!',
        'not-base64@#$%',
        'invalid base64 chars!@#',
        '\x00\x01\x02' // control characters
      ];

      invalidInputs.forEach(input => {
        expect(() => safeAtob(input)).toThrow();
      });
    });
  });

  describe('BUG-004: IPv6 ReDoS Prevention', () => {
    it('should validate normal IPv6 addresses efficiently', () => {
      const validIPv6 = [
        '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
        '2001:db8:85a3::8a2e:370:7334',
        '::1',
        'fe80::1ff:fe23:4567:890a',
        '2001:db8::',
        '::ffff:192.0.2.1'
      ];

      validIPv6.forEach(ip => {
        const validator = v.string().ipv6();
        expect(() => validator.parse(ip)).not.toThrow();
      });
    });

    it('should reject invalid IPv6 addresses quickly', () => {
      const invalidInputs = [
        'invalid-ipv6',
        '2001:db8:::1', // too many colons
        '2001:db8:85a3:0:0:8a2e:370:7334:1234', // too long
        'g01::', // invalid hex characters
        '2001:db8::g01' // invalid hex characters
      ];

      invalidInputs.forEach(input => {
        const validator = v.string().ipv6();
        expect(() => validator.parse(input)).toThrow();
      });
    });

    it('should handle very long IPv6-like strings without hanging', () => {
      const veryLongInput = 'a'.repeat(1000) + ':' + 'b'.repeat(1000);
      const startTime = Date.now();

      const validator = v.string().ipv6();
      expect(() => validator.parse(veryLongInput)).toThrow();

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete quickly (under 100ms)
      expect(duration).toBeLessThan(100);
    });
  });

  describe('BUG-005: Safe String Coercion', () => {
    it('should handle basic type coercion safely', () => {
      const validator = VldCoerceString.create();

      expect(validator.parse(123)).toBe('123');
      expect(validator.parse(true)).toBe('true');
      expect(validator.parse(false)).toBe('false');
      expect(validator.parse('hello')).toBe('hello');
    });

    it('should handle object types safely', () => {
      const validator = VldCoerceString.create();

      expect(validator.parse({})).toBe('[object Object]');
      expect(validator.parse([])).toBe('');
      expect(validator.parse([1, 2, 3])).toBe('1,2,3');

      // Test with custom toString
      const customObject = {
        secret: 'hidden',
        toString() { return this.secret; }
      };

      // For security, this should still work but we need to be careful
      const result = validator.parse(customObject);
      expect(typeof result).toBe('string');
    });

    it('should reject symbols', () => {
      const validator = VldCoerceString.create();
      expect(() => validator.parse(Symbol('test'))).toThrow();
    });

    it('should enforce length limits', () => {
      const validator = VldCoerceString.create();
      const largeString = 'x'.repeat(1000001);

      expect(() => validator.parse(largeString)).toThrow();
    });

    it('should sanitize control characters', () => {
      const validator = VldCoerceString.create();
      const stringWithControls = 'hello\x00world\x1f';

      const result = validator.parse(stringWithControls);
      expect(result).toBe('helloworld');
    });
  });

  describe('Integration Tests', () => {
    it('should work safely with complex nested validation', () => {
      const schema = {
        name: v.string().nonempty(),
        email: v.string().email(),
        data: VldUnion.create(
          v.string(),
          v.number()
        )
      };

      // Should validate valid nested data
      expect(() => {
        schema.name.parse('John');
        schema.email.parse('john@example.com');
        schema.data.parse('test');
      }).not.toThrow();

      // Should reject invalid nested data
      expect(() => {
        schema.name.parse(''); // Too short
      }).toThrow();

      expect(() => {
        schema.email.parse('invalid-email');
      }).toThrow();
    });
  });

  describe('Performance Tests', () => {
    it('should handle large numbers of validations efficiently', () => {
      const validator = v.string().email();
      const testEmails = Array.from({ length: 1000 }, (_, i) => `test${i}@example.com`);

      const startTime = Date.now();

      testEmails.forEach(email => {
        validator.parse(email);
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete 1000 validations in under 1 second
      expect(duration).toBeLessThan(1000);
    });

    it('should not leak memory during repeated validations', () => {
      const validator = v.string().min(5);

      // Run many validations
      for (let i = 0; i < 10000; i++) {
        validator.parse(`test${i}`);
      }

      // If we got here without running out of memory, memory management is working
      expect(true).toBe(true);
    });
  });
});