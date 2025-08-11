import { describe, it, expect } from '@jest/globals';
import { v, Infer } from '../src/index';

describe('VLD Test Suite', () => {
  
  describe('String Validation', () => {
    it('validates strings', () => {
      const schema = v.string();
      expect(schema.parse('hello')).toBe('hello');
      expect(schema.safeParse('test')).toEqual({ success: true, data: 'test' });
      expect(schema.safeParse(123)).toEqual({ 
        success: false, 
        error: expect.any(Error) 
      });
    });

    it('validates min length', () => {
      const schema = v.string().min(3);
      expect(schema.parse('abc')).toBe('abc');
      expect(() => schema.parse('ab')).toThrow();
    });

    it('validates max length', () => {
      const schema = v.string().max(3);
      expect(schema.parse('abc')).toBe('abc');
      expect(() => schema.parse('abcd')).toThrow();
    });

    it('validates exact length', () => {
      const schema = v.string().length(3);
      expect(schema.parse('abc')).toBe('abc');
      expect(() => schema.parse('ab')).toThrow();
    });

    it('validates email', () => {
      const schema = v.string().email();
      expect(schema.parse('test@example.com')).toBe('test@example.com');
      expect(() => schema.parse('invalid')).toThrow();
    });

    it('validates URL', () => {
      const schema = v.string().url();
      expect(schema.parse('https://example.com')).toBe('https://example.com');
      expect(() => schema.parse('not-a-url')).toThrow();
    });

    it('validates UUID', () => {
      const schema = v.string().uuid();
      expect(schema.parse('550e8400-e29b-41d4-a716-446655440000')).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(() => schema.parse('not-a-uuid')).toThrow();
    });

    it('validates IP addresses', () => {
      const ipv4Schema = v.string().ipv4();
      expect(ipv4Schema.parse('192.168.1.1')).toBe('192.168.1.1');
      expect(() => ipv4Schema.parse('256.1.1.1')).toThrow();

      const ipv6Schema = v.string().ipv6();
      expect(ipv6Schema.parse('2001:db8::8a2e:370:7334')).toBe('2001:db8::8a2e:370:7334');
      expect(() => ipv6Schema.parse('not-ipv6')).toThrow();

      const ipSchema = v.string().ip();
      expect(ipSchema.parse('192.168.1.1')).toBe('192.168.1.1');
      expect(ipSchema.parse('2001:db8::8a2e:370:7334')).toBe('2001:db8::8a2e:370:7334');
    });

    it('validates regex patterns', () => {
      const schema = v.string().regex(/^[A-Z]{3}$/);
      expect(schema.parse('ABC')).toBe('ABC');
      expect(() => schema.parse('abc')).toThrow();
    });

    it('validates startsWith', () => {
      const schema = v.string().startsWith('hello');
      expect(schema.parse('hello world')).toBe('hello world');
      expect(() => schema.parse('world')).toThrow();
    });

    it('validates endsWith', () => {
      const schema = v.string().endsWith('world');
      expect(schema.parse('hello world')).toBe('hello world');
      expect(() => schema.parse('hello')).toThrow();
    });

    it('validates includes', () => {
      const schema = v.string().includes('test');
      expect(schema.parse('this is a test')).toBe('this is a test');
      expect(() => schema.parse('no match')).toThrow();
    });

    it('validates nonempty', () => {
      const schema = v.string().nonempty();
      expect(schema.parse('a')).toBe('a');
      expect(() => schema.parse('')).toThrow();
    });

    it('applies transformations', () => {
      const trimSchema = v.string().trim();
      expect(trimSchema.parse('  hello  ')).toBe('hello');

      const lowerSchema = v.string().toLowerCase();
      expect(lowerSchema.parse('HELLO')).toBe('hello');

      const upperSchema = v.string().toUpperCase();
      expect(upperSchema.parse('hello')).toBe('HELLO');
    });

    it('chains validations', () => {
      const schema = v.string().min(5).max(10).email();
      expect(schema.parse('a@b.co')).toBe('a@b.co');
      expect(() => schema.parse('a@b')).toThrow(); // too short (less than 5 chars)
      expect(() => schema.parse('verylongemail@example.com')).toThrow(); // too long
    });
  });

  describe('Number Validation', () => {
    it('validates numbers', () => {
      const schema = v.number();
      expect(schema.parse(123)).toBe(123);
      expect(schema.parse(0)).toBe(0);
      expect(schema.parse(-123)).toBe(-123);
      expect(schema.parse(123.456)).toBe(123.456);
      expect(() => schema.parse('123')).toThrow();
      expect(() => schema.parse(NaN)).toThrow();
    });

    it('validates min', () => {
      const schema = v.number().min(5);
      expect(schema.parse(5)).toBe(5);
      expect(schema.parse(10)).toBe(10);
      expect(() => schema.parse(4)).toThrow();
    });

    it('validates max', () => {
      const schema = v.number().max(5);
      expect(schema.parse(5)).toBe(5);
      expect(schema.parse(0)).toBe(0);
      expect(() => schema.parse(6)).toThrow();
    });

    it('validates int', () => {
      const schema = v.number().int();
      expect(schema.parse(123)).toBe(123);
      expect(() => schema.parse(123.456)).toThrow();
    });

    it('validates positive', () => {
      const schema = v.number().positive();
      expect(schema.parse(1)).toBe(1);
      expect(() => schema.parse(0)).toThrow();
      expect(() => schema.parse(-1)).toThrow();
    });

    it('validates negative', () => {
      const schema = v.number().negative();
      expect(schema.parse(-1)).toBe(-1);
      expect(() => schema.parse(0)).toThrow();
      expect(() => schema.parse(1)).toThrow();
    });

    it('validates nonnegative', () => {
      const schema = v.number().nonnegative();
      expect(schema.parse(0)).toBe(0);
      expect(schema.parse(1)).toBe(1);
      expect(() => schema.parse(-1)).toThrow();
    });

    it('validates nonpositive', () => {
      const schema = v.number().nonpositive();
      expect(schema.parse(0)).toBe(0);
      expect(schema.parse(-1)).toBe(-1);
      expect(() => schema.parse(1)).toThrow();
    });

    it('validates finite', () => {
      const schema = v.number().finite();
      expect(schema.parse(123)).toBe(123);
      expect(() => schema.parse(Infinity)).toThrow();
      expect(() => schema.parse(-Infinity)).toThrow();
    });

    it('validates safe', () => {
      const schema = v.number().safe();
      expect(schema.parse(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER);
      expect(() => schema.parse(Number.MAX_SAFE_INTEGER + 1)).toThrow();
    });

    it('validates multipleOf', () => {
      const schema = v.number().multipleOf(5);
      expect(schema.parse(10)).toBe(10);
      expect(schema.parse(0)).toBe(0);
      expect(() => schema.parse(7)).toThrow();
    });

    it('validates step', () => {
      const schema = v.number().step(0.1);
      expect(schema.parse(0.1)).toBe(0.1);
      expect(schema.parse(0.2)).toBe(0.2);
      expect(() => schema.parse(0.15)).toThrow();
    });
  });

  describe('Boolean Validation', () => {
    it('validates booleans', () => {
      const schema = v.boolean();
      expect(schema.parse(true)).toBe(true);
      expect(schema.parse(false)).toBe(false);
      expect(() => schema.parse('true')).toThrow();
      expect(() => schema.parse(1)).toThrow();
    });
  });

  describe('Array Validation', () => {
    it('validates arrays', () => {
      const schema = v.array(v.string());
      expect(schema.parse(['a', 'b'])).toEqual(['a', 'b']);
      expect(schema.parse([])).toEqual([]);
      expect(() => schema.parse('not array')).toThrow();
      expect(() => schema.parse([1, 2])).toThrow();
    });

    it('validates min length', () => {
      const schema = v.array(v.number()).min(2);
      expect(schema.parse([1, 2])).toEqual([1, 2]);
      expect(() => schema.parse([1])).toThrow();
    });

    it('validates max length', () => {
      const schema = v.array(v.number()).max(2);
      expect(schema.parse([1, 2])).toEqual([1, 2]);
      expect(() => schema.parse([1, 2, 3])).toThrow();
    });

    it('validates exact length', () => {
      const schema = v.array(v.number()).length(2);
      expect(schema.parse([1, 2])).toEqual([1, 2]);
      expect(() => schema.parse([1])).toThrow();
      expect(() => schema.parse([1, 2, 3])).toThrow();
    });

    it('validates nonempty', () => {
      const schema = v.array(v.number()).nonempty();
      expect(schema.parse([1])).toEqual([1]);
      expect(() => schema.parse([])).toThrow();
    });
  });

  describe('Object Validation', () => {
    it('validates objects', () => {
      const schema = v.object({
        name: v.string(),
        age: v.number()
      });
      
      expect(schema.parse({ name: 'John', age: 30 })).toEqual({ name: 'John', age: 30 });
      expect(() => schema.parse({ name: 'John' })).toThrow();
      expect(() => schema.parse({ name: 'John', age: '30' })).toThrow();
    });

    it('handles partial objects', () => {
      const schema = v.object({
        name: v.string(),
        age: v.number()
      }).partial();
      
      expect(schema.parse({})).toEqual({});
      expect(schema.parse({ name: 'John' })).toEqual({ name: 'John' });
      expect(schema.parse({ age: 30 })).toEqual({ age: 30 });
    });

    it('handles strict objects', () => {
      const schema = v.object({
        name: v.string()
      }).strict();
      
      expect(schema.parse({ name: 'John' })).toEqual({ name: 'John' });
      expect(() => schema.parse({ name: 'John', extra: 'field' })).toThrow();
    });
  });

  describe('Optional and Nullable', () => {
    it('handles optional', () => {
      const schema = v.optional(v.string());
      expect(schema.parse('hello')).toBe('hello');
      expect(schema.parse(undefined)).toBe(undefined);
      expect(() => schema.parse(null)).toThrow();
    });

    it('handles nullable', () => {
      const schema = v.nullable(v.string());
      expect(schema.parse('hello')).toBe('hello');
      expect(schema.parse(null)).toBe(null);
      expect(() => schema.parse(undefined)).toThrow();
    });
  });

  describe('Union Validation', () => {
    it('validates unions', () => {
      const schema = v.union(v.string(), v.number());
      expect(schema.parse('hello')).toBe('hello');
      expect(schema.parse(123)).toBe(123);
      expect(() => schema.parse(true)).toThrow();
    });
  });

  describe('Literal Validation', () => {
    it('validates literals', () => {
      const schema = v.literal('hello');
      expect(schema.parse('hello')).toBe('hello');
      expect(() => schema.parse('world')).toThrow();

      const numSchema = v.literal(42);
      expect(numSchema.parse(42)).toBe(42);
      expect(() => numSchema.parse(43)).toThrow();
    });
  });

  describe('Enum Validation', () => {
    it('validates enums', () => {
      const schema = v.enum('red', 'green', 'blue');
      expect(schema.parse('red')).toBe('red');
      expect(schema.parse('green')).toBe('green');
      expect(() => schema.parse('yellow')).toThrow();
    });
  });

  describe('Date Validation', () => {
    it('validates dates', () => {
      const schema = v.date();
      const now = new Date();
      expect(schema.parse(now)).toEqual(now);
      expect(schema.parse('2024-01-01')).toEqual(new Date('2024-01-01'));
      expect(() => schema.parse('invalid')).toThrow();
    });

    it('validates min date', () => {
      const minDate = new Date('2024-01-01');
      const schema = v.date().min(minDate);
      expect(schema.parse(new Date('2024-06-01'))).toEqual(new Date('2024-06-01'));
      expect(() => schema.parse(new Date('2023-12-31'))).toThrow();
    });

    it('validates max date', () => {
      const maxDate = new Date('2024-12-31');
      const schema = v.date().max(maxDate);
      expect(schema.parse(new Date('2024-06-01'))).toEqual(new Date('2024-06-01'));
      expect(() => schema.parse(new Date('2025-01-01'))).toThrow();
    });
  });

  describe('Any, Unknown, Void, Never', () => {
    it('validates any', () => {
      const schema = v.any();
      expect(schema.parse('hello')).toBe('hello');
      expect(schema.parse(123)).toBe(123);
      expect(schema.parse(null)).toBe(null);
    });

    it('validates unknown', () => {
      const schema = v.unknown();
      expect(schema.parse('hello')).toBe('hello');
      expect(schema.parse(123)).toBe(123);
      expect(schema.parse(null)).toBe(null);
    });

    it('validates void', () => {
      const schema = v.void();
      expect(schema.parse(undefined)).toBe(undefined);
      expect(() => schema.parse(null)).toThrow();
      expect(() => schema.parse('')).toThrow();
    });

    it('validates never', () => {
      const schema = v.never();
      expect(() => schema.parse('anything')).toThrow();
      expect(() => schema.parse(null)).toThrow();
      expect(() => schema.parse(undefined)).toThrow();
    });
  });

  describe('Type Inference', () => {
    it('infers types correctly', () => {
      const stringSchema = v.string();
      type StringType = Infer<typeof stringSchema>;
      const str: StringType = 'hello';
      expect(str).toBe('hello');

      const objectSchema = v.object({
        name: v.string(),
        age: v.number()
      });
      type ObjectType = Infer<typeof objectSchema>;
      const obj: ObjectType = { name: 'John', age: 30 };
      expect(obj).toEqual({ name: 'John', age: 30 });

      const arraySchema = v.array(v.number());
      type ArrayType = Infer<typeof arraySchema>;
      const arr: ArrayType = [1, 2, 3];
      expect(arr).toEqual([1, 2, 3]);
    });
  });

  describe('Error Messages', () => {
    it('provides custom error messages', () => {
      const schema = v.string().min(5, 'Too short!');
      const result = schema.safeParse('abc') as { success: false; error: Error };
      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Too short!');
    });
  });

  describe('Complex Scenarios', () => {
    it('validates nested objects', () => {
      const schema = v.object({
        user: v.object({
          name: v.string(),
          email: v.string().email(),
          age: v.number().min(18)
        }),
        posts: v.array(v.object({
          title: v.string(),
          content: v.string(),
          likes: v.number()
        }))
      });

      const data = {
        user: {
          name: 'John',
          email: 'john@example.com',
          age: 25
        },
        posts: [
          { title: 'Hello', content: 'World', likes: 10 },
          { title: 'Test', content: 'Post', likes: 5 }
        ]
      };

      expect(schema.parse(data)).toEqual(data);
    });

    it('validates complex unions', () => {
      const schema = v.union(
        v.object({ type: v.literal('text'), content: v.string() }),
        v.object({ type: v.literal('number'), value: v.number() }),
        v.object({ type: v.literal('boolean'), flag: v.boolean() })
      );

      expect(schema.parse({ type: 'text', content: 'hello' })).toEqual({ type: 'text', content: 'hello' });
      expect(schema.parse({ type: 'number', value: 42 })).toEqual({ type: 'number', value: 42 });
      expect(schema.parse({ type: 'boolean', flag: true })).toEqual({ type: 'boolean', flag: true });
    });
  });
});