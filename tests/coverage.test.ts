import { describe, it, expect } from '@jest/globals';
import { v, VldBase, VldString, VldNumber, VldBoolean, VldArray, VldObject, VldOptional, VldNullable, VldUnion, VldLiteral, VldEnum, VldDate, VldAny, VldUnknown, VldVoid, VldNever } from '../src/index';

describe('Full Coverage Tests', () => {
  
  describe('Number safeParse edge cases', () => {
    it('covers number safeParse error branch', () => {
      const schema = v.number().positive();
      const result = schema.safeParse(-5);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect((result as any).error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Array edge cases', () => {
    it('covers array min error path', () => {
      const schema = v.array(v.string()).min(3);
      const result = schema.safeParse(['a', 'b']);
      expect(result.success).toBe(false);
    });

    it('covers array max error path', () => {
      const schema = v.array(v.string()).max(1);
      const result = schema.safeParse(['a', 'b']);
      expect(result.success).toBe(false);
    });

    it('covers array length error path', () => {
      const schema = v.array(v.string()).length(2);
      const result = schema.safeParse(['a']);
      expect(result.success).toBe(false);
    });
  });

  describe('Object edge cases', () => {
    it('covers object partial with all undefined', () => {
      const schema = v.object({
        name: v.string(),
        age: v.number()
      }).partial();
      
      const result = schema.parse({ name: undefined, age: undefined });
      expect(result).toEqual({ name: undefined, age: undefined });
    });

    it('covers object strict error path', () => {
      const schema = v.object({
        name: v.string()
      }).strict();
      
      const result = schema.safeParse({ name: 'John', extra: 'field' });
      expect(result.success).toBe(false);
    });
  });

  describe('Optional edge cases', () => {
    it('covers optional parse with undefined', () => {
      const schema = v.optional(v.string());
      const result = schema.parse(undefined);
      expect(result).toBe(undefined);
    });

    it('covers optional safeParse with undefined', () => {
      const schema = v.optional(v.string());
      const result = schema.safeParse(undefined);
      expect(result).toEqual({ success: true, data: undefined });
    });
  });

  describe('Nullable edge cases', () => {
    it('covers nullable parse with null', () => {
      const schema = v.nullable(v.string());
      const result = schema.parse(null);
      expect(result).toBe(null);
    });

    it('covers nullable safeParse with null', () => {
      const schema = v.nullable(v.string());
      const result = schema.safeParse(null);
      expect(result).toEqual({ success: true, data: null });
    });
  });

  describe('Union edge cases', () => {
    it('covers union parse error with all validators failing', () => {
      const schema = v.union(v.string(), v.number());
      expect(() => schema.parse(true)).toThrow(/No union member matched/);
    });

    it('covers union safeParse error', () => {
      const schema = v.union(v.string(), v.number());
      const result = schema.safeParse(true);
      expect(result.success).toBe(false);
    });
  });

  describe('Literal edge cases', () => {
    it('covers literal parse error', () => {
      const schema = v.literal('hello');
      expect(() => schema.parse('world')).toThrow(/Expected "hello"/);
    });

    it('covers literal safeParse success', () => {
      const schema = v.literal('hello');
      const result = schema.safeParse('hello');
      expect(result).toEqual({ success: true, data: 'hello' });
    });

    it('covers literal safeParse error', () => {
      const schema = v.literal('hello');
      const result = schema.safeParse('world');
      expect(result.success).toBe(false);
    });
  });

  describe('Enum edge cases', () => {
    it('covers enum parse error', () => {
      const schema = v.enum('red', 'green', 'blue');
      expect(() => schema.parse('yellow')).toThrow(/Expected one of/);
    });

    it('covers enum safeParse success', () => {
      const schema = v.enum('red', 'green', 'blue');
      const result = schema.safeParse('red');
      expect(result).toEqual({ success: true, data: 'red' });
    });

    it('covers enum safeParse error', () => {
      const schema = v.enum('red', 'green', 'blue');
      const result = schema.safeParse('yellow');
      expect(result.success).toBe(false);
    });
  });

  describe('Date edge cases', () => {
    it('covers date parse from string', () => {
      const schema = v.date();
      const result = schema.parse('2024-01-01');
      expect(result).toEqual(new Date('2024-01-01'));
    });

    it('covers date parse from number', () => {
      const schema = v.date();
      const timestamp = Date.now();
      const result = schema.parse(timestamp);
      expect(result).toEqual(new Date(timestamp));
    });

    it('covers date parse invalid type', () => {
      const schema = v.date();
      expect(() => schema.parse(true)).toThrow(/Invalid date/);
    });

    it('covers date parse invalid date string', () => {
      const schema = v.date();
      expect(() => schema.parse('not-a-date')).toThrow(/Invalid date/);
    });

    it('covers date safeParse error', () => {
      const schema = v.date();
      const result = schema.safeParse('invalid');
      expect(result.success).toBe(false);
    });

    it('covers date min check failure', () => {
      const minDate = new Date('2024-01-01');
      const schema = v.date().min(minDate);
      expect(() => schema.parse(new Date('2023-12-31'))).toThrow(/Date must be after/);
    });

    it('covers date max check failure', () => {
      const maxDate = new Date('2024-12-31');
      const schema = v.date().max(maxDate);
      expect(() => schema.parse(new Date('2025-01-01'))).toThrow(/Date must be before/);
    });
  });

  describe('Any edge cases', () => {
    it('covers any parse', () => {
      const schema = v.any();
      expect(schema.parse('anything')).toBe('anything');
      expect(schema.parse(123)).toBe(123);
      expect(schema.parse(null)).toBe(null);
    });

    it('covers any safeParse', () => {
      const schema = v.any();
      const result = schema.safeParse('anything');
      expect(result).toEqual({ success: true, data: 'anything' });
    });
  });

  describe('Unknown edge cases', () => {
    it('covers unknown parse', () => {
      const schema = v.unknown();
      expect(schema.parse('anything')).toBe('anything');
      expect(schema.parse(123)).toBe(123);
      expect(schema.parse(null)).toBe(null);
    });

    it('covers unknown safeParse', () => {
      const schema = v.unknown();
      const result = schema.safeParse('anything');
      expect(result).toEqual({ success: true, data: 'anything' });
    });
  });

  describe('Void edge cases', () => {
    it('covers void parse error', () => {
      const schema = v.void();
      expect(() => schema.parse(null)).toThrow(/Expected undefined/);
    });

    it('covers void safeParse success', () => {
      const schema = v.void();
      const result = schema.safeParse(undefined);
      expect(result).toEqual({ success: true, data: undefined });
    });

    it('covers void safeParse error', () => {
      const schema = v.void();
      const result = schema.safeParse('something');
      expect(result.success).toBe(false);
    });
  });

  describe('Never edge cases', () => {
    it('covers never parse', () => {
      const schema = v.never();
      expect(() => schema.parse('anything')).toThrow(/Never type cannot be parsed/);
    });

    it('covers never safeParse', () => {
      const schema = v.never();
      const result = schema.safeParse('anything');
      expect(result).toEqual({ success: false, error: expect.any(Error) });
    });
  });

  describe('VldBase abstract class', () => {
    it('is abstract and cannot be instantiated directly', () => {
      // VldBase is abstract, so this test just confirms the classes extend it properly
      expect(new VldString()).toBeInstanceOf(VldBase);
      expect(new VldNumber()).toBeInstanceOf(VldBase);
      expect(new VldBoolean()).toBeInstanceOf(VldBase);
    });
  });

  describe('Error message branches', () => {
    it('covers all custom error messages', () => {
      // String validators
      expect(() => v.string().min(5).parse('abc')).toThrow(/at least 5/);
      expect(() => v.string().max(3).parse('abcd')).toThrow(/at most 3/);
      expect(() => v.string().length(3).parse('ab')).toThrow(/exactly 3/);
      expect(() => v.string().email().parse('invalid')).toThrow(/Invalid email/);
      expect(() => v.string().url().parse('invalid')).toThrow(/Invalid URL/);
      expect(() => v.string().uuid().parse('invalid')).toThrow(/Invalid UUID/);
      expect(() => v.string().regex(/test/).parse('invalid')).toThrow(/Invalid format/);
      expect(() => v.string().startsWith('hello').parse('world')).toThrow(/must start with/);
      expect(() => v.string().endsWith('world').parse('hello')).toThrow(/must end with/);
      expect(() => v.string().includes('test').parse('hello')).toThrow(/must include/);
      expect(() => v.string().ip().parse('invalid')).toThrow(/Invalid IP/);
      expect(() => v.string().ipv4().parse('invalid')).toThrow(/Invalid IPv4/);
      expect(() => v.string().ipv6().parse('invalid')).toThrow(/Invalid IPv6/);
      expect(() => v.string().nonempty().parse('')).toThrow(/must not be empty/);

      // Number validators
      expect(() => v.number().min(5).parse(3)).toThrow(/at least 5/);
      expect(() => v.number().max(5).parse(10)).toThrow(/at most 5/);
      expect(() => v.number().int().parse(3.14)).toThrow(/must be an integer/);
      expect(() => v.number().positive().parse(0)).toThrow(/must be positive/);
      expect(() => v.number().negative().parse(0)).toThrow(/must be negative/);
      expect(() => v.number().nonnegative().parse(-1)).toThrow(/must be non-negative/);
      expect(() => v.number().nonpositive().parse(1)).toThrow(/must be non-positive/);
      expect(() => v.number().finite().parse(Infinity)).toThrow(/must be finite/);
      expect(() => v.number().safe().parse(Number.MAX_SAFE_INTEGER + 1)).toThrow(/must be a safe integer/);
      expect(() => v.number().multipleOf(5).parse(3)).toThrow(/multiple of 5/);
    });
  });

  describe('Transform branches', () => {
    it('covers string transformations', () => {
      expect(v.string().trim().parse('  hello  ')).toBe('hello');
      expect(v.string().toLowerCase().parse('HELLO')).toBe('hello');
      expect(v.string().toUpperCase().parse('hello')).toBe('HELLO');
    });
  });

  describe('Exports', () => {
    it('exports all expected classes', () => {
      expect(VldBase).toBeDefined();
      expect(VldString).toBeDefined();
      expect(VldNumber).toBeDefined();
      expect(VldBoolean).toBeDefined();
      expect(VldArray).toBeDefined();
      expect(VldObject).toBeDefined();
      expect(VldOptional).toBeDefined();
      expect(VldNullable).toBeDefined();
      expect(VldUnion).toBeDefined();
      expect(VldLiteral).toBeDefined();
      expect(VldEnum).toBeDefined();
      expect(VldDate).toBeDefined();
      expect(VldAny).toBeDefined();
      expect(VldUnknown).toBeDefined();
      expect(VldVoid).toBeDefined();
      expect(VldNever).toBeDefined();
    });
  });

  describe('Remaining coverage', () => {
    it('covers boolean safeParse', () => {
      const schema = v.boolean();
      const successResult = schema.safeParse(true);
      expect(successResult).toEqual({ success: true, data: true });
      
      const errorResult = schema.safeParse('not boolean');
      expect(errorResult).toEqual({ success: false, error: expect.any(Error) });
    });

    it('covers object parse with null', () => {
      const schema = v.object({ name: v.string() });
      expect(() => schema.parse(null)).toThrow(/Invalid object/);
    });

    it('covers object parse with array', () => {
      const schema = v.object({ name: v.string() });
      expect(() => schema.parse([])).toThrow(/Invalid object/);
    });

    it('covers optional safeParse with value', () => {
      const schema = v.optional(v.string());
      const result = schema.safeParse('hello');
      expect(result).toEqual({ success: true, data: 'hello' });
    });

    it('covers nullable safeParse with value', () => {
      const schema = v.nullable(v.string());
      const result = schema.safeParse('hello');
      expect(result).toEqual({ success: true, data: 'hello' });
    });
  });
});