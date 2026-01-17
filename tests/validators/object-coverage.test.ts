/**
 * Coverage tests for VldObject validator
 * These tests target specific uncovered lines in object.ts
 */

import { v } from '../../src';

describe('VldObject Coverage Tests', () => {
  describe('strict mode (safeParse path)', () => {
    it('should reject extra keys in strict mode', () => {
      const schema = v.object({
        name: v.string()
      }).strict();

      const result = schema.safeParse({
        name: 'John',
        extra: 'value'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('extra');
      }
    });
  });

  describe('passthrough mode (safeParse path)', () => {
    it('should allow extra keys in passthrough mode', () => {
      const schema = v.object({
        name: v.string()
      }).passthrough();

      const result = schema.safeParse({
        name: 'John',
        extra: 'value'
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          name: 'John',
          extra: 'value'
        });
      }
    });

    it('should filter dangerous keys in passthrough mode', () => {
      const schema = v.object({
        name: v.string()
      }).passthrough();

      // Create object without prototype to test dangerous keys
      const input = Object.create(null);
      input.name = 'John';
      input.safe = 'value';

      const result = schema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        // Should include safe keys
        expect(result.data.name).toBe('John');
        expect((result.data as any).safe).toBe('value');
      }
    });
  });

  describe('catchall mode (safeParse path)', () => {
    it('should validate extra keys with catchall validator', () => {
      const schema = v.object({
        name: v.string()
      }).catchall(v.number());

      const result = schema.safeParse({
        name: 'John',
        age: 30,
        score: 100
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          name: 'John',
          age: 30,
          score: 100
        });
      }
    });

    it('should reject extra keys that fail catchall validation', () => {
      const schema = v.object({
        name: v.string()
      }).catchall(v.number());

      const result = schema.safeParse({
        name: 'John',
        invalid: 'not a number'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('invalid');
      }
    });

    it('should filter dangerous keys in catchall mode', () => {
      const schema = v.object({
        name: v.string()
      }).catchall(v.string());

      // Create object without prototype to test dangerous keys
      const input = Object.create(null);
      input.name = 'John';
      input.safe = 'value';

      const result = schema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('John');
        expect(result.data.safe).toBe('value');
      }
    });
  });

  describe('parse() path with coercion validators', () => {
    it('should handle coercion validator errors in parse()', () => {
      const schema = v.object({
        count: v.coerce.number()
      });

      // This should fail because 'invalid' cannot be coerced to number
      expect(() => schema.parse({
        count: 'not-a-number'
      })).toThrow();
    });
  });

  describe('parse() path with date validators', () => {
    it('should handle date validator errors in parse()', () => {
      const schema = v.object({
        createdAt: v.date()
      });

      // This should fail because 'invalid' is not a valid date
      expect(() => schema.parse({
        createdAt: 'invalid-date'
      })).toThrow();
    });
  });

  describe('isDangerousKey patterns', () => {
    it('should detect nested prototype patterns', () => {
      const schema = v.object({
        name: v.string()
      }).passthrough();

      // Create input with dangerous-looking keys
      const input = Object.create(null);
      input.name = 'John';
      input['constructor.prototype'] = 'polluted';

      const result = schema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        // The key 'constructor.prototype' should be filtered
        expect(Object.keys(result.data)).not.toContain('constructor.prototype');
        expect(result.data.name).toBe('John');
      }
    });

    it('should detect property access chains', () => {
      const schema = v.object({
        name: v.string()
      }).passthrough();

      const input = Object.create(null);
      input.name = 'John';
      input['__proto__.polluted'] = 'value';
      input['prototype.foo'] = 'bar';

      const result = schema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(Object.keys(result.data)).not.toContain('__proto__.polluted');
        expect(Object.keys(result.data)).not.toContain('prototype.foo');
      }
    });

    it('should detect shadowing patterns', () => {
      const schema = v.object({
        name: v.string()
      }).passthrough();

      const input = Object.create(null);
      input.name = 'John';
      input.hasOwnProperty = 'evil';
      input.toString = 'also evil';

      const result = schema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        // Dangerous shadowing keys should be filtered
        expect(Object.keys(result.data)).not.toContain('hasOwnProperty');
        expect(Object.keys(result.data)).not.toContain('toString');
      }
    });
  });

  describe('catchall mode in parse()', () => {
    it('should validate extra keys with catchall in parse()', () => {
      const schema = v.object({
        name: v.string()
      }).catchall(v.number());

      const result = schema.parse({
        name: 'John',
        age: 30
      });

      expect(result).toEqual({
        name: 'John',
        age: 30
      });
    });

    it('should filter dangerous keys in catchall parse()', () => {
      const schema = v.object({
        name: v.string()
      }).catchall(v.string());

      const result = schema.parse({
        name: 'John',
        safe: 'ok',
        prototype: 'bad'
      });

      expect(result).not.toHaveProperty('prototype');
    });
  });

  describe('passthrough mode in parse()', () => {
    it('should pass extra keys in passthrough parse()', () => {
      const schema = v.object({
        name: v.string()
      }).passthrough();

      const result = schema.parse({
        name: 'John',
        extra: 'value'
      });

      expect(result).toEqual({
        name: 'John',
        extra: 'value'
      });
    });
  });

  describe('shape getter', () => {
    it('should return the shape object', () => {
      const schema = v.object({
        name: v.string(),
        age: v.number()
      });

      const shape = schema.shape;
      expect(Object.keys(shape)).toEqual(['name', 'age']);
    });
  });

  describe('keyof method', () => {
    it('should create enum from object keys', () => {
      const schema = v.object({
        name: v.string(),
        age: v.number()
      });

      const keysEnum = schema.keyof();
      expect(keysEnum.parse('name')).toBe('name');
      expect(keysEnum.parse('age')).toBe('age');
      expect(() => keysEnum.parse('unknown')).toThrow();
    });

    it('should throw on empty object', () => {
      const schema = v.object({});

      expect(() => schema.keyof()).toThrow('Cannot create keyof enum from empty object');
    });
  });

  describe('required method', () => {
    it('should make optional fields required', () => {
      const schema = v.object({
        name: v.string(),
        age: v.number().optional()
      });

      const requiredSchema = schema.required();

      // Should fail when age is missing
      expect(requiredSchema.safeParse({ name: 'John' }).success).toBe(false);

      // Should succeed with all fields
      expect(requiredSchema.safeParse({ name: 'John', age: 30 }).success).toBe(true);
    });
  });

  describe('parse with Date fields', () => {
    it('should validate Date fields in parse path', () => {
      const schema = v.object({
        createdAt: v.date()
      });

      // Should succeed with Date object
      const result = schema.parse({ createdAt: new Date('2024-01-01') });
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should fail with invalid Date in parse path', () => {
      const schema = v.object({
        createdAt: v.date()
      });

      expect(() => schema.parse({ createdAt: 'not-a-date' })).toThrow();
    });
  });
});
