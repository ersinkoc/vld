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
  });
  
  describe('VldCoerceDate - Edge cases', () => {
    const validator = v.coerce.date();
    
    it('should handle invalid date coercion', () => {
      // Test that invalid objects throw an error
      const obj = {};
      expect(() => validator.parse(obj)).toThrow('Cannot coerce {} to date');
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
  });
});