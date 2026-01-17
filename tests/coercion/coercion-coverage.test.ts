import { v } from '../../src/index';

describe('Coercion Validators - 100% Coverage', () => {
  describe('VldCoerceNumber - All methods', () => {
    const validator = v.coerce.number();
    
    it('should handle min validation', () => {
      const minValidator = validator.min(5);
      expect(minValidator.parse('10')).toBe(10);
      expect(() => minValidator.parse('2')).toThrow();
    });
    
    it('should handle max validation', () => {
      const maxValidator = validator.max(5);
      expect(maxValidator.parse('3')).toBe(3);
      expect(() => maxValidator.parse('10')).toThrow();
    });
    
    it('should handle int validation', () => {
      const intValidator = validator.int();
      expect(intValidator.parse('5')).toBe(5);
      expect(() => intValidator.parse('5.5')).toThrow();
    });
    
    it('should handle positive validation', () => {
      const positiveValidator = validator.positive();
      expect(positiveValidator.parse('5')).toBe(5);
      expect(() => positiveValidator.parse('-5')).toThrow();
    });
    
    it('should handle negative validation', () => {
      const negativeValidator = validator.negative();
      expect(negativeValidator.parse('-5')).toBe(-5);
      expect(() => negativeValidator.parse('5')).toThrow();
    });
    
    it('should handle nonnegative validation', () => {
      const nonnegativeValidator = validator.nonnegative();
      expect(nonnegativeValidator.parse('0')).toBe(0);
      expect(nonnegativeValidator.parse('5')).toBe(5);
      expect(() => nonnegativeValidator.parse('-5')).toThrow();
    });
    
    it('should handle nonpositive validation', () => {
      const nonpositiveValidator = validator.nonpositive();
      expect(nonpositiveValidator.parse('0')).toBe(0);
      expect(nonpositiveValidator.parse('-5')).toBe(-5);
      expect(() => nonpositiveValidator.parse('5')).toThrow();
    });
    
    it('should handle finite validation', () => {
      const finiteValidator = validator.finite();
      expect(finiteValidator.parse('5')).toBe(5);
      expect(() => finiteValidator.parse('Infinity')).toThrow();
    });
    
    it('should handle safe validation', () => {
      const safeValidator = validator.safe();
      expect(safeValidator.parse('5')).toBe(5);
      const unsafe = '9007199254740992'; // Number.MAX_SAFE_INTEGER + 1
      expect(() => safeValidator.parse(unsafe)).toThrow();
    });
    
    it('should handle multipleOf validation', () => {
      const multipleOfValidator = validator.multipleOf(3);
      expect(multipleOfValidator.parse('9')).toBe(9);
      expect(() => multipleOfValidator.parse('10')).toThrow();
    });
    
    it('should handle step validation', () => {
      const stepValidator = validator.step(5);
      expect(stepValidator.parse('10')).toBe(10);
      expect(() => stepValidator.parse('7')).toThrow();
    });
    
    it('should handle between validation', () => {
      const betweenValidator = validator.between(5, 10);
      expect(betweenValidator.parse('7')).toBe(7);
      expect(() => betweenValidator.parse('3')).toThrow();
      expect(() => betweenValidator.parse('15')).toThrow();
    });
    
    it('should handle even validation', () => {
      const evenValidator = validator.even();
      expect(evenValidator.parse('4')).toBe(4);
      expect(() => evenValidator.parse('5')).toThrow();
    });

    it('should handle odd validation', () => {
      const oddValidator = validator.odd();
      expect(oddValidator.parse('5')).toBe(5);
      expect(() => oddValidator.parse('4')).toThrow();
    });

    it('should reject non-integers for even validation', () => {
      // Line 111: non-integer returns false
      const evenValidator = validator.even();
      expect(() => evenValidator.parse('4.5')).toThrow();
    });

    it('should reject non-integers for odd validation', () => {
      // Line 124: non-integer returns false
      const oddValidator = validator.odd();
      expect(() => oddValidator.parse('5.5')).toThrow();
    });
    
    it('should handle NaN coercion', () => {
      expect(() => validator.parse(NaN)).toThrow();
    });
  });
  
  describe('VldCoerceBigInt - All methods', () => {
    const validator = v.coerce.bigint();

    it('should handle min validation', () => {
      const minValidator = validator.min(5n);
      expect(minValidator.parse('10')).toBe(10n);
      expect(() => minValidator.parse('2')).toThrow();
    });

    it('should handle max validation', () => {
      const maxValidator = validator.max(5n);
      expect(maxValidator.parse('3')).toBe(3n);
      expect(() => maxValidator.parse('10')).toThrow();
    });

    it('should handle positive validation', () => {
      const positiveValidator = validator.positive();
      expect(positiveValidator.parse('5')).toBe(5n);
      expect(() => positiveValidator.parse('-5')).toThrow();
      expect(() => positiveValidator.parse('0')).toThrow();
    });

    it('should handle negative validation', () => {
      const negativeValidator = validator.negative();
      expect(negativeValidator.parse('-5')).toBe(-5n);
      expect(() => negativeValidator.parse('5')).toThrow();
      expect(() => negativeValidator.parse('0')).toThrow();
    });

    it('should handle nonnegative validation', () => {
      const nonnegativeValidator = validator.nonnegative();
      expect(nonnegativeValidator.parse('0')).toBe(0n);
      expect(nonnegativeValidator.parse('5')).toBe(5n);
      expect(() => nonnegativeValidator.parse('-5')).toThrow();
    });

    it('should handle nonpositive validation', () => {
      const nonpositiveValidator = validator.nonpositive();
      expect(nonpositiveValidator.parse('0')).toBe(0n);
      expect(nonpositiveValidator.parse('-5')).toBe(-5n);
      expect(() => nonpositiveValidator.parse('5')).toThrow();
    });

    it('should handle empty string', () => {
      expect(() => validator.parse('')).toThrow();
    });

    it('should handle other value coercion', () => {
      // This tests the fallback coercion path
      const obj = { valueOf: () => 42 };
      expect(validator.parse(obj)).toBe(42n);
    });

    it('should throw when value cannot be converted to bigint', () => {
      // Symbols cannot be converted to BigInt - triggers line 105
      expect(() => validator.parse(Symbol('test'))).toThrow('Cannot coerce');
    });
  });
  
  describe('VldCoerceBoolean - Edge cases', () => {
    const validator = v.coerce.boolean();

    it('should handle edge case string values', () => {
      expect(validator.parse('TRUE')).toBe(true);
      expect(validator.parse('FALSE')).toBe(false);
      expect(validator.parse('Yes')).toBe(true);
      expect(validator.parse('No')).toBe(false);
      expect(validator.parse('ON')).toBe(true);
      expect(validator.parse('OFF')).toBe(false);
    });

    it('should throw for unsupported types like arrays', () => {
      // Line 51: throw for arrays/objects
      expect(() => validator.parse([1, 2, 3])).toThrow('Cannot coerce');
    });

    it('should throw for plain objects', () => {
      expect(() => validator.parse({ key: 'value' })).toThrow('Cannot coerce');
    });

    it('should handle actual boolean values', () => {
      expect(validator.parse(true)).toBe(true);
      expect(validator.parse(false)).toBe(false);
    });
  });
  
  describe('VldCoerceDate - Edge cases', () => {
    const validator = v.coerce.date();

    it('should handle invalid date coercion', () => {
      // Test that invalid objects throw an error
      const obj = {};
      expect(() => validator.parse(obj)).toThrow('Cannot coerce {} to date');
    });

    it('should handle null value', () => {
      expect(() => validator.parse(null)).toThrow('Cannot coerce');
    });

    it('should handle undefined value', () => {
      expect(() => validator.parse(undefined)).toThrow('Cannot coerce');
    });

    it('should handle valid Date objects', () => {
      const date = new Date('2024-01-15');
      expect(validator.parse(date)).toBeInstanceOf(Date);
    });
  });
  
  describe('VldCoerceString - All chain methods', () => {
    const validator = v.coerce.string();

    it('should handle nonempty with coercion', () => {
      const nonemptyValidator = validator.nonempty();
      expect(nonemptyValidator.parse(123)).toBe('123');
      // Empty string after coercion would throw
      const emptyObj = { toString: () => '' };
      expect(() => nonemptyValidator.parse(emptyObj)).toThrow();
    });

    it('should handle safeParse', () => {
      const result = validator.safeParse(null);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(Error);
      }
    });

    it('should coerce BigInt to string', () => {
      // Line 207: BigInt conversion path
      expect(validator.parse(BigInt(12345))).toBe('12345');
      expect(validator.parse(BigInt(-99999))).toBe('-99999');
    });

    it('should coerce Date to ISO string', () => {
      // Line 215: Date.toISOString() path
      const date = new Date('2024-01-15T10:30:00.000Z');
      expect(validator.parse(date)).toBe('2024-01-15T10:30:00.000Z');
    });

    it('should coerce RegExp to string', () => {
      // Line 221: RegExp.toString() path
      expect(validator.parse(/test/gi)).toBe('/test/gi');
      expect(validator.parse(/^hello$/)).toBe('/^hello$/');
    });

    it('should coerce Error to message', () => {
      // Line 224: Error.message path
      const error = new Error('Test error message');
      expect(validator.parse(error)).toBe('Test error message');
    });

    it('should coerce Error with empty message to toString', () => {
      // Line 224: Error.toString() fallback when message is empty
      const error = new Error('');
      expect(validator.parse(error)).toContain('Error');
    });

    it('should throw for Symbol', () => {
      // Symbols cause explicit error
      expect(() => validator.parse(Symbol('test'))).toThrow('Cannot coerce');
    });

    it('should handle plain objects', () => {
      // Line 227: Plain objects fallback
      const obj = { key: 'value' };
      expect(validator.parse(obj)).toBe('[object Object]');
    });

    it('should handle functions as fallback', () => {
      // Line 231: Fallback for other types
      const fn = function testFn() {};
      expect(validator.parse(fn)).toContain('function');
    });

    it('should throw when coerced value exceeds max length', () => {
      // Line 237: String too long (>1000000 chars)
      // Need to use a non-string value that coerces to a very long string
      // Arrays are joined with commas - need many elements to exceed 1M chars
      const largeArray = new Array(500001).fill('xx');
      expect(() => validator.parse(largeArray)).toThrow('Cannot coerce');
    });
  });

  describe('VldCoerceString - IP validation edge cases', () => {
    it('should reject IP-like strings that are too long', () => {
      // Line 136: v.length > 100 check in ip() method
      const ipValidator = v.coerce.string().ip();
      const longString = '192.168.1.1' + 'x'.repeat(100);
      expect(() => ipValidator.parse(longString)).toThrow();
    });

    it('should accept valid IPv4 address', () => {
      const ipValidator = v.coerce.string().ip();
      expect(ipValidator.parse('192.168.1.1')).toBe('192.168.1.1');
    });

    it('should accept valid IPv6 address', () => {
      const ipValidator = v.coerce.string().ip();
      expect(ipValidator.parse('::1')).toBe('::1');
    });
  });
});