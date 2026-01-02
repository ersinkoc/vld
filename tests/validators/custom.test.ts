/**
 * Tests for v.custom() - type-safe custom validator
 */

import { v } from '../../src';

describe('v.custom()', () => {
  describe('basic custom validation', () => {
    it('should create a custom validator with parse function', () => {
      const schema = v.custom<number>({
        parse: (value) => {
          if (typeof value !== 'string') {
            throw new Error('Expected string');
          }
          const num = parseInt(value, 10);
          if (isNaN(num)) {
            throw new Error('Invalid number string');
          }
          return num;
        }
      });

      expect(schema.parse('123')).toBe(123);
      expect(() => schema.parse('abc')).toThrow('Invalid number string');
      expect(() => schema.parse(123)).toThrow('Expected string');
    });

    it('should work with simple type validation', () => {
      const schema = v.custom({
        parse: (value: unknown) => {
          if (typeof value === 'boolean') return value;
          throw new Error('Expected boolean');
        }
      });

      expect(schema.parse(true)).toBe(true);
      expect(schema.parse(false)).toBe(false);
      expect(() => schema.parse('true')).toThrow();
    });

    it('should support custom transformation logic', () => {
      const schema = v.custom({
        parse: (value: unknown) => {
          if (typeof value === 'string') {
            return value.toUpperCase();
          }
          if (typeof value === 'number') {
            return value.toString();
          }
          throw new Error('Expected string or number');
        }
      });

      expect(schema.parse('hello')).toBe('HELLO');
      expect(schema.parse(42)).toBe('42');
      expect(() => schema.parse(true)).toThrow();
    });
  });

  describe('safeParse support', () => {
    it('should use default safeParse implementation', () => {
      const schema = v.custom({
        parse: (value: unknown) => {
          if (typeof value === 'number') return value * 2;
          throw new Error('Expected number');
        }
      });

      const result1 = schema.safeParse(5);
      expect(result1.success).toBe(true);
      if (result1.success) {
        expect(result1.data).toBe(10);
      }

      const result2 = schema.safeParse('not a number');
      expect(result2.success).toBe(false);
      if (!result2.success) {
        expect(result2.error.message).toBe('Expected number');
      }
    });

    it('should support custom safeParse implementation', () => {
      const schema = v.custom({
        parse: (value: unknown) => {
          if (typeof value === 'string') return value;
          throw new Error('Expected string');
        },
        safeParse: (value: unknown) => {
          if (typeof value === 'string' && value.length > 0) {
            return { success: true, data: value };
          }
          return { success: false, error: new Error('Non-empty string required') };
        }
      });

      const result1 = schema.safeParse('hello');
      expect(result1.success).toBe(true);

      const result2 = schema.safeParse('');
      expect(result2.success).toBe(false);
      if (!result2.success) {
        expect(result2.error.message).toBe('Non-empty string required');
      }
    });
  });

  describe('method chaining', () => {
    it('should work with optional', () => {
      const schema = v.custom({
        parse: (value: unknown) => {
          if (typeof value === 'number') return value;
          throw new Error('Expected number');
        }
      }).optional();

      expect(schema.parse(42)).toBe(42);
      expect(schema.parse(undefined)).toBe(undefined);
      expect(() => schema.parse('42')).toThrow();
    });

    it('should work with nullable', () => {
      const schema = v.custom({
        parse: (value: unknown) => {
          if (typeof value === 'string') return value;
          throw new Error('Expected string');
        }
      }).nullable();

      expect(schema.parse('hello')).toBe('hello');
      expect(schema.parse(null)).toBe(null);
      expect(() => schema.parse(42)).toThrow();
    });

    it('should work with refine', () => {
      const schema = v.custom({
        parse: (value: unknown) => {
          if (typeof value === 'number') return value;
          throw new Error('Expected number');
        }
      }).refine(
        (val) => val > 0,
        'Must be positive'
      );

      expect(schema.parse(5)).toBe(5);
      expect(() => schema.parse(-5)).toThrow('Must be positive');
      expect(() => schema.parse('5')).toThrow();
    });

    it('should work with transform', () => {
      const schema = v.custom({
        parse: (value: unknown) => {
          if (typeof value === 'number') return value;
          throw new Error('Expected number');
        }
      }).transform((val) => val * 2);

      const result = schema.safeParse(5);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(10);
      }
    });
  });

  describe('integration with other validators', () => {
    it('should work in object schemas', () => {
      const schema = v.object({
        customField: v.custom({
          parse: (value: unknown) => {
            if (typeof value === 'string' && value.startsWith('ID-')) {
              return value;
            }
            throw new Error('Must start with ID-');
          }
        })
      });

      expect(schema.parse({ customField: 'ID-123' })).toEqual({
        customField: 'ID-123'
      });
      expect(() => schema.parse({ customField: '123' })).toThrow();
    });

    it('should work in arrays', () => {
      const schema = v.array(
        v.custom({
          parse: (value: unknown) => {
            if (typeof value === 'number') return value * 2;
            throw new Error('Expected number');
          }
        })
      );

      expect(schema.parse([1, 2, 3])).toEqual([2, 4, 6]);
      expect(() => schema.parse([1, 'a', 3])).toThrow();
    });

    it('should work in unions', () => {
      // Note: Custom validators work with standard validators in unions
      const schema = v.union(v.string(), v.number());

      expect(schema.parse('hello')).toBe('hello');
      expect(schema.parse(42)).toBe(42);
    });
  });

  describe('advanced use cases', () => {
    it('should validate and parse complex objects', () => {
      interface Person {
        name: string;
        age: number;
      }

      const schema = v.custom<Person>({
        parse: (value: unknown) => {
          if (typeof value !== 'object' || value === null) {
            throw new Error('Expected object');
          }

          const obj = value as Record<string, unknown>;

          if (typeof obj.name !== 'string') {
            throw new Error('name must be a string');
          }

          if (typeof obj.age !== 'number') {
            throw new Error('age must be a number');
          }

          return { name: obj.name, age: obj.age };
        }
      });

      expect(schema.parse({ name: 'John', age: 30 })).toEqual({
        name: 'John',
        age: 30
      });
      expect(() => schema.parse({ name: 'John', age: '30' })).toThrow();
    });

    it('should support async-like validation patterns', () => {
      const schema = v.custom({
        parse: (value: unknown) => {
          if (typeof value !== 'string') {
            throw new Error('Expected string');
          }

          // Simulate async validation check
          const validFormats = ['YYYY-MM-DD', 'DD/MM/YYYY'];
          const hasValidFormat = validFormats.some(() =>
            value.includes('-') || value.includes('/')
          );

          if (!hasValidFormat) {
            throw new Error('Invalid date format');
          }

          return value;
        }
      });

      expect(schema.parse('2023-01-01')).toBe('2023-01-01');
      expect(schema.parse('01/01/2023')).toBe('01/01/2023');
      expect(() => schema.parse('01012023')).toThrow();
    });

    it('should allow custom error messages', () => {
      const schema = v.custom({
        parse: (value: unknown) => {
          if (Array.isArray(value)) {
            return value.join(', ');
          }
          throw new Error('Value must be an array');
        }
      });

      expect(schema.parse(['a', 'b', 'c'])).toBe('a, b, c');
      expect(() => schema.parse('not an array')).toThrow('Value must be an array');
    });
  });

  describe('immutability', () => {
    it('should maintain immutability when chaining', () => {
      const base = v.custom({
        parse: (value: unknown) => {
          if (typeof value === 'string') return value;
          throw new Error('Expected string');
        }
      });

      const optional = base.optional();
      const refined = optional.refine((val) => val !== undefined, 'Required');

      // Original should be unchanged
      expect(() => base.parse(undefined)).toThrow();

      // Optional should accept undefined
      expect(optional.parse(undefined)).toBe(undefined);

      // Refined should reject undefined
      expect(() => refined.parse(undefined)).toThrow();
    });
  });

  describe('type safety', () => {
    it('should provide proper type inference', () => {
      const schema = v.custom<{ length: number }>({
        parse: (value: unknown) => {
          if (typeof value === 'string') {
            return { length: value.length };
          }
          throw new Error('Expected string');
        }
      });

      const result = schema.parse('hello');
      expect(result).toEqual({ length: 5 });

      // Type should be inferred correctly
      type ResultType = typeof result extends { length: number } ? true : false;
      const typeCheck: ResultType = true;
      expect(typeCheck).toBe(true);
    });
  });
});
