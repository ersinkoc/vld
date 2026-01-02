/**
 * Tests for .pipe() method
 * Tests schema chaining functionality
 */

import { v } from '../../src';

describe('VldPipe', () => {
  describe('basic chaining', () => {
    it('should chain string to number via transform', () => {
      const stringToLength = v.string().transform((s: string) => s.length);
      const schema = v.string().pipe(stringToLength);

      const result = schema.safeParse('hello');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(5);
      }
    });

    it('should fail if first validator fails', () => {
      const stringToLength = v.string().transform((s: string) => s.length);
      const schema = v.string().min(10).pipe(stringToLength);

      const result = schema.safeParse('short');
      expect(result.success).toBe(false);
    });

    it('should fail if second validator fails', () => {
      const stringToInt = v.string().transform((s: string) => parseInt(s, 10));
      const maxThree = v.number().max(3);
      const lengthSchema = stringToInt.pipe(maxThree);

      const result = lengthSchema.safeParse('hello world');
      expect(result.success).toBe(false);
    });
  });

  describe('complex transformations', () => {
    it('should chain string to length', () => {
      const toLength = v.string().transform((s: string) => s.length);
      const schema = v.string().pipe(toLength);

      const result = schema.safeParse('hello');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(5);
      }
    });

    it('should validate and transform in sequence', () => {
      const toLowerCase = v.string().transform((email: string) => email.toLowerCase());
      const emailSchema = v.string().email().pipe(toLowerCase);

      const result = emailSchema.safeParse('User@Example.COM');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('user@example.com');
      }
    });
  });

  describe('with refinements', () => {
    it('should work with refine after pipe', () => {
      const toLength = v.string().transform((s: string) => s.length);
      const schema = v.string().pipe(toLength).refine((n: unknown) => typeof n === 'number' && n > 0);

      const result = schema.safeParse('hello');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(5);
      }
    });

    it('should fail refinement', () => {
      const toLength = v.string().transform((s: string) => s.length);
      const schema = v.string().pipe(toLength).refine((n: unknown) => typeof n === 'number' && n <= 5);

      const result = schema.safeParse('hello world');
      expect(result.success).toBe(false);
    });
  });

  describe('type safety', () => {
    it('should maintain type inference through pipe', () => {
      const toLength = v.string().transform((s: string) => s.length);
      const schema = v.string().pipe(toLength);

      type Inferred = typeof schema extends { parse: (input: unknown) => infer T } ? T : never;
      const value: Inferred = 5;
      expect(typeof value).toBe('number');
    });
  });

  describe('error handling', () => {
    it('should return error from first validator', () => {
      const toLength = v.string().transform((s: string) => s.length);
      const schema = v.string().min(10).pipe(toLength);

      const result = schema.safeParse('short');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBeDefined();
      }
    });

    it('should return error from second validator', () => {
      const toInt = v.string().transform((s: string) => parseInt(s, 10));
      const min100 = v.number().min(100);
      const schema = v.string().pipe(toInt).pipe(min100);

      const result = schema.safeParse('5');
      expect(result.success).toBe(false);
    });
  });

  describe('with object validation', () => {
    it('should pipe object through transformation', () => {
      const userSchema = v.object({
        name: v.string(),
        age: v.number()
      });

      const toFormatted = userSchema.transform((user: { name: string; age: number }) => ({
        displayName: user.name.toUpperCase(),
        isAdult: user.age >= 18
      }));

      const schema = userSchema.pipe(toFormatted);

      const result = schema.safeParse({ name: 'john', age: 25 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as any).displayName).toBe('JOHN');
        expect((result.data as any).isAdult).toBe(true);
      }
    });
  });

  describe('parse method', () => {
    it('should throw on invalid input', () => {
      const toLength = v.string().transform((s: string) => s.length);
      const schema = v.string().min(5).pipe(toLength);

      expect(() => schema.parse('abc')).toThrow();
    });

    it('should return transformed value on valid input', () => {
      const toUpper = v.string().transform((s: string) => s.toUpperCase());
      const schema = v.string().pipe(toUpper);

      const result = schema.parse('hello');
      expect(result).toBe('HELLO');
    });
  });
});
