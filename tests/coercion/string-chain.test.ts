import { v } from '../../src/index';

describe('VldCoerceString - Chain Methods Coverage', () => {
  describe('All chain methods should return VldCoerceString instances', () => {
    it('should handle all validation chain methods', () => {
      const validator = v.coerce.string();
      
      // Test all chain methods maintain coercion capability
      const minValidator = validator.min(5);
      expect(minValidator.parse(12345)).toBe('12345');
      expect(() => minValidator.parse(12)).toThrow();
      
      const maxValidator = validator.max(5);
      expect(maxValidator.parse(12345)).toBe('12345');
      expect(() => maxValidator.parse('123456')).toThrow();
      
      const lengthValidator = validator.length(3);
      expect(lengthValidator.parse(123)).toBe('123');
      expect(() => lengthValidator.parse(12)).toThrow();
      
      const emailValidator = validator.email();
      expect(() => emailValidator.parse(123)).toThrow();
      expect(emailValidator.parse('test@example.com')).toBe('test@example.com');
      
      const urlValidator = validator.url();
      expect(() => urlValidator.parse(123)).toThrow();
      expect(urlValidator.parse('https://example.com')).toBe('https://example.com');
      
      const uuidValidator = validator.uuid();
      expect(() => uuidValidator.parse(123)).toThrow();
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      expect(uuidValidator.parse(validUuid)).toBe(validUuid);
      
      const regexValidator = validator.regex(/^\d+$/);
      expect(regexValidator.parse(123)).toBe('123');
      expect(() => regexValidator.parse('abc')).toThrow();
      
      const startsWithValidator = validator.startsWith('hello');
      expect(startsWithValidator.parse('hello world')).toBe('hello world');
      expect(() => startsWithValidator.parse('world')).toThrow();
      
      const endsWithValidator = validator.endsWith('world');
      expect(endsWithValidator.parse('hello world')).toBe('hello world');
      expect(() => endsWithValidator.parse('hello')).toThrow();
      
      const includesValidator = validator.includes('test');
      expect(includesValidator.parse('testing')).toBe('testing');
      expect(() => includesValidator.parse('hello')).toThrow();
      
      const ipValidator = validator.ip();
      expect(ipValidator.parse('192.168.1.1')).toBe('192.168.1.1');
      expect(ipValidator.parse('2001:db8::1')).toBe('2001:db8::1');
      expect(() => ipValidator.parse('invalid')).toThrow();
      
      const ipv4Validator = validator.ipv4();
      expect(ipv4Validator.parse('192.168.1.1')).toBe('192.168.1.1');
      expect(() => ipv4Validator.parse('2001:db8::1')).toThrow();
      
      const ipv6Validator = validator.ipv6();
      expect(ipv6Validator.parse('2001:db8::1')).toBe('2001:db8::1');
      expect(() => ipv6Validator.parse('192.168.1.1')).toThrow();
      
      const nonemptyValidator = validator.nonempty();
      expect(nonemptyValidator.parse(123)).toBe('123');
      expect(() => nonemptyValidator.parse('')).toThrow();
    });
    
    it('should handle transformation chain methods', () => {
      const validator = v.coerce.string();
      
      const trimValidator = validator.trim();
      expect(trimValidator.parse('  hello  ')).toBe('hello');
      expect(trimValidator.parse(123)).toBe('123');
      
      const lowerValidator = validator.toLowerCase();
      expect(lowerValidator.parse('HELLO')).toBe('hello');
      expect(lowerValidator.parse(123)).toBe('123');
      
      const upperValidator = validator.toUpperCase();
      expect(upperValidator.parse('hello')).toBe('HELLO');
      expect(upperValidator.parse(123)).toBe('123');
    });
    
    it('should handle complex chains', () => {
      const validator = v.coerce.string()
        .trim()
        .toLowerCase()
        .min(3)
        .max(10)
        .startsWith('hello');
      
      expect(validator.parse('  HELLO  ')).toBe('hello');
      expect(() => validator.parse('  HI  ')).toThrow(); // Too short after trim
      expect(() => validator.parse('  GOODBYE  ')).toThrow(); // Doesn't start with hello
    });
    
    it('should handle custom error messages', () => {
      const validator = v.coerce.string().min(5, 'Too short!');
      
      try {
        validator.parse('ab');
      } catch (error: any) {
        expect(error.message).toBe('Too short!');
      }
    });
  });
});