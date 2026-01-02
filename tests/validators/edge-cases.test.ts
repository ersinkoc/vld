import { v } from '../../src/index';

describe('Validators - Edge Cases for 100% Coverage', () => {
  describe('VldEnum - safeParse', () => {
    it('should handle safeParse', () => {
      const validator = v.enum('red', 'green', 'blue');
      
      const valid = validator.safeParse('red');
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data).toBe('red');
      }
      
      const invalid = validator.safeParse('yellow');
      expect(invalid.success).toBe(false);
      if (!invalid.success) {
        expect(invalid.error).toBeInstanceOf(Error);
      }
    });
  });
  
  describe('VldLiteral - safeParse', () => {
    it('should handle safeParse', () => {
      const validator = v.literal('test');
      
      const valid = validator.safeParse('test');
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data).toBe('test');
      }
      
      const invalid = validator.safeParse('other');
      expect(invalid.success).toBe(false);
      if (!invalid.success) {
        expect(invalid.error).toBeInstanceOf(Error);
      }
    });
  });
  
  describe('VldSymbol - safeParse', () => {
    it('should handle safeParse', () => {
      const validator = v.symbol();
      const sym = Symbol('test');
      
      const valid = validator.safeParse(sym);
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data).toBe(sym);
      }
      
      const invalid = validator.safeParse('not a symbol');
      expect(invalid.success).toBe(false);
      if (!invalid.success) {
        expect(invalid.error).toBeInstanceOf(Error);
      }
    });
  });
  
  describe('VldVoid - safeParse', () => {
    it('should handle safeParse', () => {
      const validator = v.void();
      
      const valid = validator.safeParse(undefined);
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data).toBe(undefined);
      }
      
      const invalid = validator.safeParse(null);
      expect(invalid.success).toBe(false);
      if (!invalid.success) {
        expect(invalid.error).toBeInstanceOf(Error);
      }
    });
  });
  
  describe('VldUnknown - parse', () => {
    it('should parse any value', () => {
      const validator = v.unknown();
      
      expect(validator.parse('string')).toBe('string');
      expect(validator.parse(123)).toBe(123);
      expect(validator.parse(true)).toBe(true);
      expect(validator.parse(null)).toBe(null);
      expect(validator.parse(undefined)).toBe(undefined);
      expect(validator.parse({ a: 1 })).toEqual({ a: 1 });
    });
  });
  
  describe('VldRecord - safeParse', () => {
    it('should handle safeParse', () => {
      const validator = v.record(v.number());
      
      const valid = validator.safeParse({ a: 1, b: 2 });
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data).toEqual({ a: 1, b: 2 });
      }
      
      const invalid = validator.safeParse({ a: 'invalid' });
      expect(invalid.success).toBe(false);
      if (!invalid.success) {
        expect(invalid.error).toBeInstanceOf(Error);
      }
    });
  });
  
  describe('VldSet - safeParse', () => {
    it('should handle safeParse', () => {
      const validator = v.set(v.string());
      
      const valid = validator.safeParse(new Set(['a', 'b']));
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data).toEqual(new Set(['a', 'b']));
      }
      
      const invalid = validator.safeParse(new Set([1, 2]));
      expect(invalid.success).toBe(false);
      if (!invalid.success) {
        expect(invalid.error).toBeInstanceOf(Error);
      }
    });
    
    it('should handle empty sets', () => {
      const validator = v.set(v.string());
      const result = validator.parse(new Set());
      expect(result).toEqual(new Set());
    });
  });
  
  describe('VldMap - safeParse', () => {
    it('should handle safeParse', () => {
      const validator = v.map(v.string(), v.number());
      
      const valid = validator.safeParse(new Map([['a', 1], ['b', 2]]));
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data).toEqual(new Map([['a', 1], ['b', 2]]));
      }
      
      const invalid = validator.safeParse(new Map([[1, 'invalid']]));
      expect(invalid.success).toBe(false);
      if (!invalid.success) {
        expect(invalid.error).toBeInstanceOf(Error);
      }
    });
    
    it('should handle empty maps', () => {
      const validator = v.map(v.string(), v.number());
      const result = validator.parse(new Map());
      expect(result).toEqual(new Map());
    });
  });
  
  describe('VldTuple - safeParse', () => {
    it('should handle safeParse', () => {
      const validator = v.tuple(v.string(), v.number());
      
      const valid = validator.safeParse(['test', 123]);
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data).toEqual(['test', 123]);
      }
      
      const invalid = validator.safeParse(['test']);
      expect(invalid.success).toBe(false);
      if (!invalid.success) {
        expect(invalid.error).toBeInstanceOf(Error);
      }
    });
  });
  
  describe('VldIntersection - safeParse', () => {
    it('should handle safeParse', () => {
      const validator = v.intersection(
        v.object({ a: v.string() }),
        v.object({ b: v.number() })
      );
      
      const valid = validator.safeParse({ a: 'test', b: 123 });
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data).toEqual({ a: 'test', b: 123 });
      }
      
      const invalid = validator.safeParse({ a: 'test' });
      expect(invalid.success).toBe(false);
      if (!invalid.success) {
        expect(invalid.error).toBeInstanceOf(Error);
      }
    });
  });

  describe('VldIntersection - error cases', () => {
    it('should throw error for different primitive values', () => {
      const validator = v.intersection(v.literal('a'), v.literal('b'));

      expect(() => validator.parse('a')).toThrow('Intersection validation failed');
    });

    it('should throw error for object and primitive intersection', () => {
      const validator = v.intersection(
        v.object({ a: v.string() }),
        v.string()
      );

      expect(() => validator.parse({ a: 'test' })).toThrow('Intersection validation failed');
    });

    it('should throw error for primitive and object intersection', () => {
      const validator = v.intersection(
        v.number(),
        v.object({ value: v.number() })
      );

      expect(() => validator.parse(42)).toThrow('Intersection validation failed');
    });
  });

  describe('VldUnion - safeParse', () => {
    it('should handle safeParse', () => {
      const validator = v.union(v.string(), v.number());
      
      const valid = validator.safeParse('test');
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data).toBe('test');
      }
      
      const invalid = validator.safeParse(true);
      expect(invalid.success).toBe(false);
      if (!invalid.success) {
        expect(invalid.error).toBeInstanceOf(Error);
      }
    });
  });
  
  describe('VldBigInt - safeParse', () => {
    it('should handle safeParse', () => {
      const validator = v.bigint();
      
      const valid = validator.safeParse(123n);
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data).toBe(123n);
      }
      
      const invalid = validator.safeParse('not bigint');
      expect(invalid.success).toBe(false);
      if (!invalid.success) {
        expect(invalid.error).toBeInstanceOf(Error);
      }
    });
  });
  
  describe('VldAny - parse', () => {
    it('should parse any value', () => {
      const validator = v.any();
      
      expect(validator.parse('string')).toBe('string');
      expect(validator.parse(123)).toBe(123);
      expect(validator.parse(true)).toBe(true);
      expect(validator.parse(null)).toBe(null);
      expect(validator.parse(undefined)).toBe(undefined);
    });
  });
});