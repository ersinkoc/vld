/**
 * Coverage tests for intersection.ts
 * These tests target specific uncovered error paths
 */

import { v } from '../../src';

describe('Intersection Coverage Tests', () => {
  describe('Primitive intersection errors', () => {
    it('should throw when primitive values are not identical', () => {
      // Using transforms to make both validators parse successfully but return different primitives
      const validatorA = v.string().transform(() => 'a');
      const validatorB = v.string().transform(() => 'b');

      const schema = v.intersection(validatorA, validatorB);

      // Both validators parse the string, but return different primitives
      expect(() => schema.parse('test')).toThrow('Values must be identical');
    });

    it('should work when primitive values are identical', () => {
      // Same literal should work
      const schema = v.intersection(
        v.literal('same'),
        v.literal('same')
      );

      expect(schema.parse('same')).toBe('same');
    });

    it('should work when transforms return identical primitives', () => {
      const validatorA = v.string().transform(() => 42);
      const validatorB = v.string().transform(() => 42);

      const schema = v.intersection(validatorA, validatorB);

      expect(schema.parse('test')).toBe(42);
    });
  });

  describe('Object-primitive mismatch', () => {
    it('should throw when one validator returns object and other returns primitive', () => {
      // Use transforms to make both validators parse successfully but return different types
      const objectValidator = v.string().transform((s) => ({ value: s }));
      const primitiveValidator = v.string().transform((s) => s.toUpperCase());

      const schema = v.intersection(objectValidator, primitiveValidator);

      // One returns object, one returns string - mismatch
      expect(() => schema.parse('test')).toThrow('Cannot create intersection');
    });

    it('should throw when intersecting object and primitive validators', () => {
      // Create a custom validator that returns a primitive
      const primitiveValidator = v.number();

      // Create an object validator
      const objectValidator = v.object({ name: v.string() });

      // This intersection should fail because one produces object, one produces primitive
      const schema = v.intersection(objectValidator, primitiveValidator as any);

      // Will throw because the value doesn't match both validators
      expect(() => schema.parse({ name: 'test' })).toThrow();
    });
  });

  describe('Valid object intersections', () => {
    it('should merge two objects', () => {
      const personSchema = v.object({ name: v.string() });
      const employeeSchema = v.object({ role: v.string() });

      const schema = v.intersection(personSchema, employeeSchema);

      const result = schema.parse({ name: 'John', role: 'Developer' });
      expect(result.name).toBe('John');
      expect(result.role).toBe('Developer');
    });

    it('should handle safeParse correctly', () => {
      const personSchema = v.object({ name: v.string() });
      const employeeSchema = v.object({ role: v.string() });

      const schema = v.intersection(personSchema, employeeSchema);

      const result = schema.safeParse({ name: 'John', role: 'Developer' });
      expect(result.success).toBe(true);
    });

    it('should fail safeParse on invalid input', () => {
      const personSchema = v.object({ name: v.string() });
      const employeeSchema = v.object({ role: v.string() });

      const schema = v.intersection(personSchema, employeeSchema);

      const result = schema.safeParse({ name: 'John' }); // Missing role
      expect(result.success).toBe(false);
    });
  });
});
