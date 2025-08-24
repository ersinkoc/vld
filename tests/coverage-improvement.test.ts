import { v, VldBase } from '../src';

describe('Coverage Improvement Tests', () => {
  describe('Object Validator - Uncovered Paths', () => {
    it('should handle fast-path validation for VldDate with invalid values', () => {
      const schema = v.object({
        date: v.date()
      });

      // Test the VldDate fast path with invalid input
      expect(() => schema.parse({ date: 'invalid-date' })).toThrow();
      expect(() => schema.parse({ date: null })).toThrow();
      expect(() => schema.parse({ date: undefined })).toThrow();
    });

    it('should handle fast-path validation for VldBoolean', () => {
      const schema = v.object({
        flag: v.boolean()
      });

      // This should hit the fast path for boolean validation
      const result = schema.parse({ flag: true });
      expect(result).toEqual({ flag: true });

      expect(() => schema.parse({ flag: 'true' })).toThrow();
      expect(() => schema.parse({ flag: 1 })).toThrow();
    });

    it('should handle complex nested validators in object', () => {
      const schema = v.object({
        nested: v.object({
          array: v.array(v.string()),
          union: v.union(v.string(), v.number())
        })
      });

      const validData = {
        nested: {
          array: ['test'],
          union: 42
        }
      };

      const result = schema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should handle VldOptional baseValidator access in required()', () => {
      const schema = v.object({
        optionalField: v.string().optional(),
        requiredField: v.number()
      });

      // Make all fields required
      const requiredSchema = schema.required();
      
      // Should reject undefined for previously optional field
      expect(() => requiredSchema.parse({ 
        requiredField: 42 
      })).toThrow();

      // Should accept when all fields are present
      const result = requiredSchema.parse({
        optionalField: 'test',
        requiredField: 42
      });
      expect(result).toEqual({
        optionalField: 'test',
        requiredField: 42
      });
    });
  });

  describe('Union Validator - Type Checker Coverage', () => {
    it('should use type checkers for VldNull', () => {
      const schema = v.union(v.literal(null), v.string());
      
      const result1 = schema.parse(null);
      expect(result1).toBe(null);
      
      const result2 = schema.parse('test');
      expect(result2).toBe('test');
    });

    it('should use type checkers for VldUndefined', () => {
      const schema = v.union(v.void(), v.number());
      
      const result1 = schema.parse(undefined);
      expect(result1).toBe(undefined);
      
      const result2 = schema.parse(42);
      expect(result2).toBe(42);
    });

    it('should use type checkers for VldSymbol', () => {
      const sym = Symbol('test');
      const schema = v.union(v.symbol(), v.string());
      
      const result1 = schema.parse(sym);
      expect(result1).toBe(sym);
      
      const result2 = schema.parse('test');
      expect(result2).toBe('test');
    });

    it('should handle unknown validator types in union', () => {
      const customValidator = v.string().refine(s => s.length > 5);
      const schema = v.union(customValidator, v.number());
      
      const result1 = schema.parse('long-string');
      expect(result1).toBe('long-string');
      
      const result2 = schema.parse(42);
      expect(result2).toBe(42);
      
      expect(() => schema.parse('short')).toThrow();
    });
  });

  describe('Index.ts - Uncovered Lines', () => {
    it('should have VldBase available', () => {
      // This covers the VldBase export
      expect(VldBase).toBeDefined();
      expect(typeof VldBase).toBe('function');
    });

    it('should handle complex validator chains', () => {
      // Cover the remaining index.ts lines
      const schema = v.object({
        id: v.string().uuid(),
        data: v.union(
          v.object({ type: v.literal('text'), content: v.string() }),
          v.object({ type: v.literal('number'), value: v.number() })
        )
      });

      const result = schema.parse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        data: { type: 'text', content: 'hello' }
      });

      expect(result).toBeDefined();
    });
  });

  describe('Bigint Validator - Uncovered Branch', () => {
    it('should handle min validation branch', () => {
      const schema = v.bigint().min(10n);
      
      expect(() => schema.parse(5n)).toThrow();
      expect(schema.parse(10n)).toBe(10n);
      expect(schema.parse(15n)).toBe(15n);
    });
  });

  describe('Number Validator - Uncovered Branch', () => {
    it('should handle min validation branch', () => {
      const schema = v.number().min(10);
      
      expect(() => schema.parse(5)).toThrow();
      expect(schema.parse(10)).toBe(10);
      expect(schema.parse(15)).toBe(15);
    });
  });

  describe('String Validator - Uncovered Branch', () => {
    it('should handle IPv4 validation branch', () => {
      const schema = v.string().ipv4();
      
      expect(schema.parse('192.168.1.1')).toBe('192.168.1.1');
      expect(() => schema.parse('not-an-ip')).toThrow();
    });
  });

  describe('Date Validator - Uncovered Branch', () => {
    it('should handle max validation branch', () => {
      const maxDate = new Date('2024-01-01');
      const schema = v.date().max(maxDate);
      
      expect(() => schema.parse(new Date('2024-02-01'))).toThrow();
      expect(schema.parse(new Date('2023-12-01'))).toEqual(new Date('2023-12-01'));
    });
  });

  describe('Array Validator - Uncovered Line', () => {
    it('should handle unique validation properly', () => {
      const schema = v.array(v.number()).unique();
      
      expect(() => schema.parse([1, 2, 2, 3])).toThrow();
      expect(schema.parse([1, 2, 3])).toEqual([1, 2, 3]);
    });
  });

  describe('Intersection Validator - Uncovered Line', () => {
    it('should handle second validator failure', () => {
      const schema = v.intersection(
        v.object({ a: v.string() }),
        v.object({ b: v.number() })
      );
      
      expect(() => schema.parse({ a: 'test' })).toThrow();
      expect(() => schema.parse({ b: 42 })).toThrow();
      expect(schema.parse({ a: 'test', b: 42 })).toEqual({ a: 'test', b: 42 });
    });
  });

  describe('Base Validators - Uncovered Lines', () => {
    it('should handle VldAny parse', () => {
      const schema = v.any();
      expect(schema.parse(null)).toBe(null);
      expect(schema.parse(undefined)).toBe(undefined);
      expect(schema.parse(42)).toBe(42);
      expect(schema.parse('test')).toBe('test');
      expect(schema.parse({})).toEqual({});
    });

    it('should handle VldUnknown parse', () => {
      const schema = v.unknown();
      expect(schema.parse(null)).toBe(null);
      expect(schema.parse(undefined)).toBe(undefined);
      expect(schema.parse(42)).toBe(42);
      expect(schema.parse('test')).toBe('test');
      expect(schema.parse({})).toEqual({});
    });
  });
});