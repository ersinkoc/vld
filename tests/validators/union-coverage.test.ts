/**
 * Coverage tests for VldUnion validator
 * These tests target specific uncovered type checker paths
 */

import { v } from '../../src';
import { VldBase, VLD_VALIDATOR_TYPES } from '../../src/validators/base';

class ThrowingFallbackValidator extends VldBase<unknown, never> {
  constructor(private readonly thrown: unknown) {
    super('throwingFallback' as any);
  }

  parse(): never {
    throw this.thrown;
  }

  safeParse() {
    return { success: false as const, error: new Error(String(this.thrown)) };
  }
}

describe('VldUnion Coverage Tests', () => {
  describe('Type checker inference', () => {
    it('should use array type checker', () => {
      // Union with array validator should use Array.isArray check
      const schema = v.union(v.string(), v.array(v.number()));

      expect(schema.safeParse([1, 2, 3]).success).toBe(true);
      expect(schema.safeParse('hello').success).toBe(true);
      expect(schema.safeParse(123).success).toBe(false);
    });

    it('should use object type checker', () => {
      // Union with object validator should use object type check
      const schema = v.union(v.string(), v.object({ name: v.string() }));

      expect(schema.safeParse({ name: 'John' }).success).toBe(true);
      expect(schema.safeParse('hello').success).toBe(true);
      expect(schema.safeParse(123).success).toBe(false);
    });

    it('should use null type checker', () => {
      const schema = v.union(v.string(), v.null());

      expect(schema.safeParse(null).success).toBe(true);
      expect(schema.safeParse('hello').success).toBe(true);
      expect(schema.safeParse(123).success).toBe(false);
    });

    it('should use undefined type checker', () => {
      const schema = v.union(v.string(), v.undefined());

      expect(schema.safeParse(undefined).success).toBe(true);
      expect(schema.safeParse('hello').success).toBe(true);
      expect(schema.safeParse(123).success).toBe(false);
    });

    it('should use boolean type checker', () => {
      const schema = v.union(v.string(), v.boolean());

      expect(schema.safeParse(true).success).toBe(true);
      expect(schema.safeParse(false).success).toBe(true);
      expect(schema.safeParse('hello').success).toBe(true);
      expect(schema.safeParse(123).success).toBe(false);
    });

    it('should use number type checker', () => {
      const schema = v.union(v.string(), v.number());

      expect(schema.safeParse(123).success).toBe(true);
      expect(schema.safeParse('hello').success).toBe(true);
      expect(schema.safeParse(true).success).toBe(false);
    });

    it('should use bigint and symbol type checkers', () => {
      const token = Symbol('token');
      const schema = v.union(v.bigint(), v.symbol());

      expect(schema.safeParse(123n).success).toBe(true);
      expect(schema.safeParse(token).success).toBe(true);
      expect(schema.safeParse(123).success).toBe(false);
    });

    it('should use NaN type checker', () => {
      const schema = v.union(v.nan(), v.string());

      expect(schema.safeParse(Number.NaN).success).toBe(true);
      expect(schema.safeParse('hello').success).toBe(true);
      expect(schema.safeParse(123).success).toBe(false);
    });

    it('should use enum type checker', () => {
      const schema = v.union(v.enum('draft', 'published'), v.boolean());

      expect(schema.safeParse('draft').success).toBe(true);
      expect(schema.safeParse(true).success).toBe(true);
      expect(schema.safeParse(null).success).toBe(false);
    });

    it('should use exact literal type checker', () => {
      const schema = v.union(v.literal(true), v.literal('yes'));

      expect(schema.safeParse(true).success).toBe(true);
      expect(schema.safeParse('yes').success).toBe(true);
      expect(schema.safeParse(false).success).toBe(false);
    });

    it('should use never type checker', () => {
      const schema = v.union(v.never() as any, v.string());

      expect(schema.safeParse('hello').success).toBe(true);
      expect(schema.safeParse(123).success).toBe(false);
      expect(() => schema.parse(123)).toThrow();
      expect((schema as any).createTypeChecker({ validatorType: VLD_VALIDATOR_TYPES.NEVER })('anything')).toBe(false);
    });
  });

  describe('Error collection in safeParse', () => {
    it('should collect errors from all validators when all fail', () => {
      const schema = v.union(
        v.string().min(10),
        v.number().positive()
      );

      const result = schema.safeParse(-5);

      expect(result.success).toBe(false);
      if (!result.success) {
        // Error should mention failure reasons
        expect(result.error.message).toBeDefined();
      }
    });

    it('should skip validators based on type check', () => {
      // With type checkers, some validators are skipped entirely
      const schema = v.union(
        v.string().email(),
        v.number().int()
      );

      // Number input should skip string validator due to type check
      const result = schema.safeParse(42);
      expect(result.success).toBe(true);
    });
  });

  describe('Union with multiple options', () => {
    it('should find first matching validator', () => {
      const schema = v.union(
        v.string(),
        v.number(),
        v.boolean()
      );

      expect(schema.safeParse('test').success).toBe(true);
      expect(schema.safeParse(42).success).toBe(true);
      expect(schema.safeParse(true).success).toBe(true);
      expect(schema.safeParse(null).success).toBe(false);
    });

    it('should keep constrained validators on the full parse path', () => {
      const schema = v.union(v.string().min(3), v.number().positive());

      expect(schema.parse('abcd')).toBe('abcd');
      expect(schema.parse(12)).toBe(12);
      expect(schema.safeParse('a').success).toBe(false);
      expect(schema.safeParse(-1).success).toBe(false);
    });

    it('should parse simple primitive and literal unions without changing outputs', () => {
      const token = Symbol('token');
      const bigint = v.bigint();
      const symbol = v.symbol();
      const nil = v.null();
      const undef = v.undefined();
      const voidSchema = v.void();
      const literal = v.literal('fixed');
      const schema = v.union(
        v.string(),
        v.number(),
        v.boolean(),
        bigint,
        symbol,
        nil,
        undef,
        voidSchema,
        literal
      );

      expect((bigint as any).isSimple).toBe(true);
      expect((bigint.positive() as any).isSimple).toBe(false);
      expect((symbol as any).isSimple).toBe(true);
      expect((nil as any).isSimple).toBe(true);
      expect((undef as any).isSimple).toBe(true);
      expect((voidSchema as any).isSimple).toBe(true);
      expect((literal as any).isSimple).toBe(true);
      expect(schema.parse('text')).toBe('text');
      expect(schema.parse(42)).toBe(42);
      expect(schema.parse(false)).toBe(false);
      expect(schema.parse(10n)).toBe(10n);
      expect(schema.parse(token)).toBe(token);
      expect(schema.parse(null)).toBeNull();
      expect(schema.parse(undefined)).toBeUndefined();
      expect(schema.safeParse('fixed')).toEqual({ success: true, data: 'fixed' });
    });

    it('should pass any and unknown union branches through without generic parsing', () => {
      const payload = { nested: true };
      const anyUnion = v.union(v.any(), v.string());
      const unknownUnion = v.union(v.unknown(), v.string());

      expect(anyUnion.parse(payload)).toBe(payload);
      expect(anyUnion.safeParse(payload)).toEqual({ success: true, data: payload });
      expect(unknownUnion.parse(payload)).toBe(payload);
      expect(unknownUnion.safeParse(payload)).toEqual({ success: true, data: payload });
    });

    it('should expose fallback helper behavior for unknown simple modes', () => {
      const schema = v.union(v.string()) as any;
      const fakeSimpleValidator = {
        validatorType: 'customSimple',
        isSimple: true,
        literal: 'ignored'
      };

      expect(schema.createSimpleMode(fakeSimpleValidator)).toBeUndefined();
      expect(schema.parseSimpleValue(undefined, 0, 'value')).toBeUndefined();
    });

    it('should stringify non-Error parse failures in parse and safeParse', () => {
      const schema = v.union(
        new ThrowingFallbackValidator('plain failure') as any,
        new ThrowingFallbackValidator(12345) as any
      );

      expect(() => schema.parse('value')).toThrow('plain failure');
      const result = schema.safeParse('value');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('12345');
      }
    });
  });
});
