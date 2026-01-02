/**
 * Tests for v.function() - function validation
 */

import { v } from '../../src';

describe('v.function()', () => {
  describe('basic function validation', () => {
    it('should accept function values', () => {
      const schema = v.function();
      const func = () => {};

      expect(schema.parse(func)).toBe(func);
    });

    it('should accept arrow functions', () => {
      const schema = v.function();
      const arrowFunc = () => 'test';
      const arrowFuncWithParams = (a: number, b: number) => a + b;

      expect(schema.parse(arrowFunc)).toBe(arrowFunc);
      expect(schema.parse(arrowFuncWithParams)).toBe(arrowFuncWithParams);
    });

    it('should accept async functions', () => {
      const schema = v.function();
      const asyncFunc = async () => {};

      expect(schema.parse(asyncFunc)).toBe(asyncFunc);
    });

    it('should reject non-function values', () => {
      const schema = v.function();

      expect(() => schema.parse('not a function')).toThrow();
      expect(() => schema.parse(123)).toThrow();
      expect(() => schema.parse(null)).toThrow();
      expect(() => schema.parse(undefined)).toThrow();
      expect(() => schema.parse({})).toThrow();
      expect(() => schema.parse([])).toThrow();
    });
  });

  describe('method chaining', () => {
    it('should work with optional', () => {
      const schema = v.function().optional();
      const func = () => {};

      expect(schema.parse(func)).toBe(func);
      expect(schema.parse(undefined)).toBe(undefined);
    });

    it('should work with nullable', () => {
      const schema = v.function().nullable();
      const func = () => {};

      expect(schema.parse(func)).toBe(func);
      expect(schema.parse(null)).toBe(null);
    });

    it('should work with refine', () => {
      const schema = v.function().refine(
        (func) => func.length >= 1,
        'Function must accept at least one parameter'
      );
      const validFunc = (a: string) => a;
      const invalidFunc = () => {};

      expect(schema.parse(validFunc)).toBe(validFunc);
      expect(() => schema.parse(invalidFunc)).toThrow('Function must accept at least one parameter');
    });

    it('should work with transform', () => {
      const schema = v.function().transform((func) => func.name);
      const func = function myFunc() {};

      const result = schema.safeParse(func);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('myFunc');
      }
    });
  });

  describe('safeParse', () => {
    it('should return success for valid functions', () => {
      const schema = v.function();
      const func = () => {};

      const result = schema.safeParse(func);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(func);
      }
    });

    it('should return failure for non-function values', () => {
      const schema = v.function();

      const result = schema.safeParse('not a function');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('function');
      }
    });
  });

  describe('immutability', () => {
    it('should maintain immutability when chaining', () => {
      const base = v.function();
      const optional = base.optional();
      const refined = optional.refine(
        (func) => (func ? func.length > 0 : false),
        'Function must have parameters'
      );

      const func = () => {};
      const funcWithParams = (a: string) => a;

      // Base should reject undefined
      expect(() => base.parse(undefined)).toThrow();

      // Optional should accept undefined
      expect(optional.parse(undefined)).toBe(undefined);
      expect(optional.parse(func)).toBe(func);

      // Refined should reject functions without parameters
      expect(() => refined.parse(func)).toThrow();
      expect(refined.parse(funcWithParams)).toBe(funcWithParams);
    });
  });

  describe('integration with other validators', () => {
    it('should work in object schemas', () => {
      const schema = v.object({
        callback: v.function()
      });

      const callback = () => {};
      expect(schema.parse({ callback })).toEqual({ callback });
      expect(() => schema.parse({ callback: 'not a function' })).toThrow();
    });

    it('should work in arrays', () => {
      const schema = v.array(v.function());

      const func1 = () => {};
      const func2 = () => {};

      expect(schema.parse([func1, func2])).toEqual([func1, func2]);
      expect(() => schema.parse([func1, 'not a function'])).toThrow();
    });

    it('should work in unions', () => {
      const schema = v.union(v.function(), v.string());

      const func = () => {};
      expect(schema.parse(func)).toBe(func);
      expect(schema.parse('test')).toBe('test');
      expect(() => schema.parse(123)).toThrow();
    });
  });

  describe('real-world use cases', () => {
    it('should validate callback functions', () => {
      const schema = v.object({
        onSuccess: v.function().optional(),
        onError: v.function().optional()
      });

      const onSuccess = () => {};
      const onError = () => {};

      expect(schema.parse({ onSuccess, onError })).toEqual({
        onSuccess,
        onError
      });

      expect(schema.parse({})).toEqual({});
    });

    it('should validate event handlers', () => {
      const schema = v.record(v.function());

      const handlers = {
        onClick: () => {},
        onChange: () => {}
      };

      expect(schema.parse(handlers)).toEqual(handlers);
      expect(() => schema.parse({ onClick: 'not a function' })).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle class constructors', () => {
      const schema = v.function();

      class MyClass {}

      // Class constructors are functions
      expect(schema.parse(MyClass)).toBe(MyClass);
    });

    it('should handle bound functions', () => {
      const schema = v.function();

      const obj = { value: 42 };
      const boundFunc = function(this: typeof obj) { return this.value; }.bind(obj);

      expect(schema.parse(boundFunc)).toBe(boundFunc);
    });

    it('should handle generator functions', () => {
      const schema = v.function();

      function* generatorFunc() {
        yield 1;
        yield 2;
      }

      expect(schema.parse(generatorFunc)).toBe(generatorFunc);
    });
  });
});
