/**
 * Coverage tests for VldRecord and VldLooseRecord validators
 * These tests target specific uncovered lines in record.ts
 */

import { v } from '../../src';

describe('VldRecord Coverage Tests', () => {
  describe('VldLooseRecord', () => {
    describe('parse() invalid type error', () => {
      it('should throw on non-object input', () => {
        // Create a loose record that skips invalid values
        const schema = v.record(v.string()).loose();

        expect(() => schema.parse(null)).toThrow();
        expect(() => schema.parse(undefined)).toThrow();
        expect(() => schema.parse([1, 2, 3])).toThrow();
        expect(() => schema.parse('string')).toThrow();
        expect(() => schema.parse(123)).toThrow();
      });
    });

    describe('safeParse()', () => {
      it('should return success with data on valid input', () => {
        const schema = v.record(v.number()).loose();

        const result = schema.safeParse({ a: 1, b: 2 });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual({ a: 1, b: 2 });
        }
      });

      it('should return failure on invalid input type', () => {
        const schema = v.record(v.string()).loose();

        const result = schema.safeParse(null);
        expect(result.success).toBe(false);
      });
    });

    describe('partial()', () => {
      it('should create a partial variant', () => {
        const schema = v.record(v.string()).loose() as any;
        const partial = schema.partial();

        // Partial should allow undefined values
        const result = partial.safeParse({ a: 'hello', b: undefined });
        expect(result.success).toBe(true);
      });
    });

    describe('loose() on already loose record', () => {
      it('should return self when calling loose() on loose record', () => {
        const looseSchema = v.record(v.string()).loose() as any;
        const stillLoose = looseSchema.loose();

        // Should be the same instance or equivalent
        expect(stillLoose.safeParse({ a: 'test' }).success).toBe(true);
      });

      it('should expose the wrapped value schema metadata', () => {
        const valueSchema = v.string();
        const looseSchema = v.record(valueSchema).loose() as any;

        expect(looseSchema.valueSchema).toBe(valueSchema);
      });
    });

    describe('dangerous key filtering', () => {
      it('should skip dangerous keys in loose record', () => {
        const schema = v.record(v.string()).loose();

        const input = {
          safe: 'value',
          __proto__: 'dangerous',
          constructor: 'also dangerous'
        };

        const result = schema.parse(input);
        expect(result['safe']).toBe('value');
        expect(Object.keys(result)).not.toContain('__proto__');
        expect(Object.keys(result)).not.toContain('constructor');
      });
    });

    describe('skip invalid values', () => {
      it('should skip values that fail validation in loose mode', () => {
        const schema = v.record(v.number()).loose();

        const input = {
          valid: 123,
          invalid: 'not a number',
          anotherValid: 456
        };

        const result = schema.parse(input);
        expect(result['valid']).toBe(123);
        expect(result['anotherValid']).toBe(456);
        expect(Object.keys(result)).not.toContain('invalid');
      });
    });
  });

  describe('VldRecord (strict)', () => {
    describe('parse() basic validation', () => {
      it('should validate strict records', () => {
        const schema = v.record(v.string());

        const result = schema.safeParse({ a: 'hello', b: 'world' });
        expect(result.success).toBe(true);
      });
    });

    describe('simple value mode helpers', () => {
      it('should expose expected simple value errors for all optimized modes', () => {
        const helpers = [
          { schema: v.record(v.string()), message: 'Invalid string' },
          { schema: v.record(v.number()), message: 'Invalid number' },
          { schema: v.record(v.boolean()), message: 'Invalid boolean' },
          { schema: v.record(v.bigint()), message: 'Invalid bigint' },
          { schema: v.record(v.symbol()), message: 'Invalid symbol' },
          { schema: v.record(v.undefined()), message: 'Expected undefined' }
        ];

        for (const { schema, message } of helpers) {
          expect((schema as any).getSimpleValueError('received')).toBe(message);
        }

        expect((v.record(v.null()) as any).getSimpleValueError(undefined)).toBe('Expected null, received undefined');
        expect((v.record(v.string()) as any).getSimpleValueMode({ isSimple: true, validatorType: 'unsupported' })).toBeUndefined();
        expect((v.record(v.array(v.string())) as any).getSimpleValueError('received')).toBe('Invalid record');
      });
    });
  });
});
