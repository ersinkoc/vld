import { describe, it, expect } from '@jest/globals';
import { VldString } from '../../src/validators/string';

describe('VldString - Comprehensive Tests', () => {
  describe('Basic Validation', () => {
    it('should validate string values', () => {
      const validator = VldString.create();
      expect(validator.parse('hello')).toBe('hello');
      expect(validator.parse('')).toBe('');
      expect(validator.parse('123')).toBe('123');
      expect(validator.parse('special!@#$%')).toBe('special!@#$%');
    });

    it('should reject non-string values', () => {
      const validator = VldString.create();
      expect(() => validator.parse(123)).toThrow();
      expect(() => validator.parse(true)).toThrow();
      expect(() => validator.parse(null)).toThrow();
      expect(() => validator.parse(undefined)).toThrow();
      expect(() => validator.parse([])).toThrow();
      expect(() => validator.parse({})).toThrow();
    });

    it('should handle safeParse correctly', () => {
      const validator = VldString.create();
      const success = validator.safeParse('test');
      expect(success.success).toBe(true);
      if (success.success) {
        expect(success.data).toBe('test');
      }

      const failure = validator.safeParse(123);
      expect(failure.success).toBe(false);
      if (!failure.success) {
        expect(failure.error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Length Validations', () => {
    it('should validate minimum length', () => {
      const validator = VldString.create().min(3);
      expect(validator.parse('abc')).toBe('abc');
      expect(validator.parse('abcd')).toBe('abcd');
      expect(() => validator.parse('ab')).toThrow();
      expect(() => validator.parse('')).toThrow();
    });

    it('should validate maximum length', () => {
      const validator = VldString.create().max(3);
      expect(validator.parse('abc')).toBe('abc');
      expect(validator.parse('ab')).toBe('ab');
      expect(validator.parse('')).toBe('');
      expect(() => validator.parse('abcd')).toThrow();
    });

    it('should validate exact length', () => {
      const validator = VldString.create().length(3);
      expect(validator.parse('abc')).toBe('abc');
      expect(() => validator.parse('ab')).toThrow();
      expect(() => validator.parse('abcd')).toThrow();
      expect(() => validator.parse('')).toThrow();
    });

    it('should validate nonempty', () => {
      const validator = VldString.create().nonempty();
      expect(validator.parse('a')).toBe('a');
      expect(validator.parse('test')).toBe('test');
      expect(() => validator.parse('')).toThrow();
    });

    it('should chain length validations', () => {
      const validator = VldString.create().min(2).max(5);
      expect(validator.parse('ab')).toBe('ab');
      expect(validator.parse('abcde')).toBe('abcde');
      expect(() => validator.parse('a')).toThrow();
      expect(() => validator.parse('abcdef')).toThrow();
    });
  });

  describe('Format Validations', () => {
    it('should validate email addresses', () => {
      const validator = VldString.create().email();
      expect(validator.parse('test@example.com')).toBe('test@example.com');
      expect(validator.parse('user.name@domain.co.uk')).toBe('user.name@domain.co.uk');
      expect(validator.parse('user+tag@example.org')).toBe('user+tag@example.org');
      
      expect(() => validator.parse('invalid')).toThrow();
      expect(() => validator.parse('@example.com')).toThrow();
      expect(() => validator.parse('user@')).toThrow();
      expect(() => validator.parse('user@.com')).toThrow();
      expect(() => validator.parse('user@domain')).toThrow();
    });

    it('should validate URLs', () => {
      const validator = VldString.create().url();
      expect(validator.parse('https://example.com')).toBe('https://example.com');
      expect(validator.parse('http://www.example.com')).toBe('http://www.example.com');
      expect(validator.parse('https://example.com/path?query=value')).toBe('https://example.com/path?query=value');
      
      expect(() => validator.parse('not-a-url')).toThrow();
      expect(() => validator.parse('ftp://example.com')).toThrow();
      expect(() => validator.parse('example.com')).toThrow();
      expect(() => validator.parse('//example.com')).toThrow();
    });

    it('should validate UUIDs', () => {
      const validator = VldString.create().uuid();
      expect(validator.parse('550e8400-e29b-41d4-a716-446655440000')).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(validator.parse('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe('6ba7b810-9dad-11d1-80b4-00c04fd430c8');
      
      expect(() => validator.parse('not-a-uuid')).toThrow();
      expect(() => validator.parse('550e8400-e29b-41d4-a716')).toThrow();
      expect(() => validator.parse('550e8400e29b41d4a716446655440000')).toThrow();
      expect(() => validator.parse('g50e8400-e29b-41d4-a716-446655440000')).toThrow();
    });

    it('should validate IPv4 addresses', () => {
      const validator = VldString.create().ipv4();
      expect(validator.parse('192.168.1.1')).toBe('192.168.1.1');
      expect(validator.parse('0.0.0.0')).toBe('0.0.0.0');
      expect(validator.parse('255.255.255.255')).toBe('255.255.255.255');
      expect(validator.parse('10.0.0.1')).toBe('10.0.0.1');
      
      expect(() => validator.parse('256.1.1.1')).toThrow();
      expect(() => validator.parse('1.1.1')).toThrow();
      expect(() => validator.parse('1.1.1.1.1')).toThrow();
      expect(() => validator.parse('a.b.c.d')).toThrow();
    });

    it('should validate IPv6 addresses', () => {
      const validator = VldString.create().ipv6();
      expect(validator.parse('2001:db8::8a2e:370:7334')).toBe('2001:db8::8a2e:370:7334');
      expect(validator.parse('::1')).toBe('::1');
      expect(validator.parse('fe80::1')).toBe('fe80::1');
      expect(validator.parse('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
      
      expect(() => validator.parse('not-ipv6')).toThrow();
      expect(() => validator.parse('192.168.1.1')).toThrow();
      expect(() => validator.parse('gggg::1')).toThrow();
    });

    it('should validate IP addresses (v4 or v6)', () => {
      const validator = VldString.create().ip();
      expect(validator.parse('192.168.1.1')).toBe('192.168.1.1');
      expect(validator.parse('2001:db8::8a2e:370:7334')).toBe('2001:db8::8a2e:370:7334');
      expect(validator.parse('::1')).toBe('::1');
      expect(validator.parse('10.0.0.1')).toBe('10.0.0.1');
      
      expect(() => validator.parse('not-an-ip')).toThrow();
      expect(() => validator.parse('999.999.999.999')).toThrow();
    });
  });

  describe('Pattern Matching', () => {
    it('should validate with regex patterns', () => {
      const validator = VldString.create().regex(/^[A-Z]{3}$/);
      expect(validator.parse('ABC')).toBe('ABC');
      expect(validator.parse('XYZ')).toBe('XYZ');
      expect(() => validator.parse('abc')).toThrow();
      expect(() => validator.parse('AB')).toThrow();
      expect(() => validator.parse('ABCD')).toThrow();
    });

    it('should validate startsWith', () => {
      const validator = VldString.create().startsWith('hello');
      expect(validator.parse('hello world')).toBe('hello world');
      expect(validator.parse('hello')).toBe('hello');
      expect(() => validator.parse('world hello')).toThrow();
      expect(() => validator.parse('HELLO')).toThrow();
    });

    it('should validate endsWith', () => {
      const validator = VldString.create().endsWith('world');
      expect(validator.parse('hello world')).toBe('hello world');
      expect(validator.parse('world')).toBe('world');
      expect(() => validator.parse('world hello')).toThrow();
      expect(() => validator.parse('WORLD')).toThrow();
    });

    it('should validate includes', () => {
      const validator = VldString.create().includes('test');
      expect(validator.parse('this is a test')).toBe('this is a test');
      expect(validator.parse('test')).toBe('test');
      expect(validator.parse('testing')).toBe('testing');
      expect(() => validator.parse('no match')).toThrow();
      expect(() => validator.parse('TEST')).toThrow();
    });
  });

  describe('Transformations', () => {
    it('should trim strings', () => {
      const validator = VldString.create().trim();
      expect(validator.parse('  hello  ')).toBe('hello');
      expect(validator.parse('\n\ttest\n\t')).toBe('test');
      expect(validator.parse('no trim needed')).toBe('no trim needed');
      expect(validator.parse('')).toBe('');
      expect(validator.parse('   ')).toBe('');
    });

    it('should convert to lowercase', () => {
      const validator = VldString.create().toLowerCase();
      expect(validator.parse('HELLO')).toBe('hello');
      expect(validator.parse('Hello World')).toBe('hello world');
      expect(validator.parse('123ABC')).toBe('123abc');
      expect(validator.parse('already lowercase')).toBe('already lowercase');
    });

    it('should convert to uppercase', () => {
      const validator = VldString.create().toUpperCase();
      expect(validator.parse('hello')).toBe('HELLO');
      expect(validator.parse('Hello World')).toBe('HELLO WORLD');
      expect(validator.parse('123abc')).toBe('123ABC');
      expect(validator.parse('ALREADY UPPERCASE')).toBe('ALREADY UPPERCASE');
    });

    it('should chain transformations', () => {
      const validator = VldString.create().trim().toLowerCase();
      expect(validator.parse('  HELLO WORLD  ')).toBe('hello world');
      expect(validator.parse('\tTEST\n')).toBe('test');
    });

    it('should apply transformations before validation', () => {
      const validator = VldString.create().trim().min(5);
      expect(validator.parse('  hello  ')).toBe('hello');
      expect(() => validator.parse('  hi  ')).toThrow(); // 'hi' after trim is too short
    });
  });

  describe('Complex Chains', () => {
    it('should handle multiple validations', () => {
      const validator = VldString.create()
        .min(5)
        .max(10)
        .regex(/^[a-z]+$/);
      
      expect(validator.parse('hello')).toBe('hello');
      expect(validator.parse('world')).toBe('world');
      expect(() => validator.parse('hi')).toThrow(); // too short
      expect(() => validator.parse('verylongword')).toThrow(); // too long
      expect(() => validator.parse('Hello')).toThrow(); // uppercase
      expect(() => validator.parse('hell0')).toThrow(); // contains number
    });

    it('should handle transformations with validations', () => {
      const validator = VldString.create()
        .trim()
        .toLowerCase()
        .email();
      
      expect(validator.parse('  TEST@EXAMPLE.COM  ')).toBe('test@example.com');
      expect(validator.parse('\tUser@Domain.ORG\n')).toBe('user@domain.org');
    });
  });

  describe('Custom Error Messages', () => {
    it('should use custom error messages', () => {
      const validator = VldString.create().min(3, 'Too short!');
      expect(() => validator.parse('ab')).toThrow('Too short!');
    });

    it('should use custom messages for format validators', () => {
      const validator = VldString.create().email('Invalid email format');
      expect(() => validator.parse('not-an-email')).toThrow('Invalid email format');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strings', () => {
      const validator = VldString.create();
      expect(validator.parse('')).toBe('');
    });

    it('should handle very long strings', () => {
      const validator = VldString.create();
      const longString = 'a'.repeat(10000);
      expect(validator.parse(longString)).toBe(longString);
    });

    it('should handle special characters', () => {
      const validator = VldString.create();
      const special = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
      expect(validator.parse(special)).toBe(special);
    });

    it('should handle unicode characters', () => {
      const validator = VldString.create();
      expect(validator.parse('你好世界')).toBe('你好世界');
      expect(validator.parse('🚀🔥💯')).toBe('🚀🔥💯');
      expect(validator.parse('Ñoño')).toBe('Ñoño');
    });
  });

  describe('Immutability', () => {
    it('should not mutate validator on chaining', () => {
      const base = VldString.create();
      const min3 = base.min(3);
      const min5 = base.min(5);
      
      expect(base.parse('')).toBe('');
      expect(() => min3.parse('ab')).toThrow();
      expect(() => min5.parse('abcd')).toThrow();
      expect(min3.parse('abc')).toBe('abc');
      expect(min5.parse('abcde')).toBe('abcde');
    });
  });
});