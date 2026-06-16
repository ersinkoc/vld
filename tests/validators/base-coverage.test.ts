/**
 * Coverage tests for base.ts wrapper validators
 * These tests target specific uncovered lines
 */

import { v } from '../../src';
import { resolveErrorMessage, VldExactOptional } from '../../src/validators/base';

describe('Base Validators Coverage Tests', () => {
  describe('VldReadonly', () => {
    it('should return failure result on safeParse failure path', () => {
      const schema = v.object({ name: v.string() }).readonly();

      const result = schema.safeParse({ name: 123 });

      expect(result.success).toBe(false);
    });

    it('should return success on valid input', () => {
      const schema = v.object({ name: v.string() }).readonly();

      const result = schema.safeParse({ name: 'John' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('John');
      }
    });
  });

  describe('VldDefault with undefined', () => {
    it('should pass through non-undefined values in safeParse', () => {
      const schema = v.string().default('default');

      const result = schema.safeParse('actual');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('actual');
      }
    });

    it('should use default value for undefined in safeParse', () => {
      const schema = v.string().default('default');

      const result = schema.safeParse(undefined);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('default');
      }
    });
  });

  describe('VldOptional - unwrap()', () => {
    it('should return the base validator when unwrapped', () => {
      const baseSchema = v.string();
      const optionalSchema = baseSchema.optional();

      const unwrapped = optionalSchema.unwrap();

      // The unwrapped schema should be the original string validator
      expect(unwrapped.safeParse('test').success).toBe(true);
      expect(unwrapped.safeParse(undefined).success).toBe(false);
    });
  });

  describe('VldNullable - unwrap()', () => {
    it('should return the base validator when unwrapped', () => {
      const baseSchema = v.string();
      const nullableSchema = baseSchema.nullable();

      const unwrapped = nullableSchema.unwrap();

      // The unwrapped schema should be the original string validator
      expect(unwrapped.safeParse('test').success).toBe(true);
      expect(unwrapped.safeParse(null).success).toBe(false);
    });
  });

  describe('VldNullish - unwrap()', () => {
    it('should return the base validator when unwrapped', () => {
      const baseSchema = v.string();
      const nullishSchema = baseSchema.nullish();

      const unwrapped = nullishSchema.unwrap();

      // The unwrapped schema should be the original string validator
      expect(unwrapped.safeParse('test').success).toBe(true);
      expect(unwrapped.safeParse(null).success).toBe(false);
      expect(unwrapped.safeParse(undefined).success).toBe(false);
    });
  });

  describe('VldSuperRefine', () => {
    it('should return success result when no issues added', () => {
      const schema = v.string().superRefine((_val, _ctx) => {
        // No issues added - should pass
      });

      const result = schema.safeParse('valid');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('valid');
      }
    });

    it('should return failure result when issues added', () => {
      const schema = v.string().superRefine((_val, ctx) => {
        ctx.addIssue({ message: 'Custom error', code: 'custom' });
      });

      const result = schema.safeParse('test');

      expect(result.success).toBe(false);
    });
  });

  describe('VldPreprocess', () => {
    it('should catch preprocessor errors in safeParse', () => {
      const schema = v.preprocess((_val) => {
        throw new Error('Preprocessor failed');
      }, v.string());

      const result = schema.safeParse('test');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Preprocessor failed');
      }
    });

    it('should pass preprocessed value to schema', () => {
      const schema = v.preprocess((val) => {
        return String(val).toUpperCase();
      }, v.string());

      const result = schema.safeParse('hello');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('HELLO');
      }
    });
  });

  describe('VldMeta', () => {
    it('should parse value through inner validator', () => {
      const schema = v.string().describe('A name field');
      const result = schema.parse('John');
      expect(result).toBe('John');
    });

    it('should safeParse value through inner validator', () => {
      const schema = v.string().describe('A name field');
      const result = schema.safeParse('John');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('John');
      }
    });

    it('should safeParse failure through inner validator', () => {
      const schema = v.string().describe('A name field');
      const result = schema.safeParse(123);
      expect(result.success).toBe(false);
    });

    it('should get metadata from described schema', () => {
      const schema = v.string().describe('A name field');
      const meta = (schema as any).getMeta();
      expect(meta.description).toBe('A name field');
    });
  });

  describe('VldExactOptional', () => {
    it('should parse when value is undefined', () => {
      const schema = v.object({
        name: v.string().exactOptional()
      });

      const result = schema.parse({ name: undefined });
      expect(result.name).toBeUndefined();
    });

    it('should parse when value is provided', () => {
      const schema = v.object({
        name: v.string().exactOptional()
      });

      const result = schema.parse({ name: 'John' });
      expect(result.name).toBe('John');
    });

    it('should fail when value fails inner validation', () => {
      const schema = v.object({
        name: v.string().exactOptional()
      });

      // Pass an invalid value type for the field
      expect(() => schema.parse({ name: 123 })).toThrow();
    });

    it('should unwrap to base validator', () => {
      const schema = v.string().exactOptional();
      const unwrapped = (schema as any).unwrap();
      expect(unwrapped.safeParse('test').success).toBe(true);
    });

    it('should support static creation and primitive fast paths', () => {
      const stringSchema = VldExactOptional.create(v.string());
      const bigintSchema = VldExactOptional.create(v.bigint());
      const symbolSchema = VldExactOptional.create(v.symbol());
      const token = Symbol('token');

      expect(stringSchema.safeParse(undefined)).toEqual({ success: true, data: undefined });
      expect(stringSchema.safeParse('test')).toEqual({ success: true, data: 'test' });
      expect(bigintSchema.safeParse('nope').success).toBe(false);
      expect(symbolSchema.safeParse('nope').success).toBe(false);
      expect(bigintSchema.safeParse(1n)).toEqual({ success: true, data: 1n });
      expect(symbolSchema.safeParse(token)).toEqual({ success: true, data: token });
    });
  });

  describe('meta() and describe()', () => {
    it('should call describe() on string validator', () => {
      const schema = v.string().describe('A test description');
      const result = schema.parse('hello');
      expect(result).toBe('hello');
    });

    it('should call describe() on number validator', () => {
      const schema = v.number().describe('A number');
      const result = schema.parse(42);
      expect(result).toBe(42);
    });

    it('should call meta() with object on object validator', () => {
      const schema = v.object({
        name: v.string()
      }).meta({ title: 'User', description: 'A user object' });

      const result = schema.parse({ name: 'John' });
      expect(result.name).toBe('John');
    });

    it('should call meta() without args returns undefined', () => {
      const schema = v.string();
      const result = (schema as any).meta();
      expect(result).toBeUndefined();
    });

    it('should merge metadata and support describe on metadata validators', () => {
      const schema = v.string()
        .meta({ title: 'Name' })
        .describe('Display name')
        .meta({ examples: ['Ada'] });

      expect(schema.parse('Ada')).toBe('Ada');
      expect((schema as any).getMeta()).toEqual({
        title: 'Name',
        description: 'Display name',
        examples: ['Ada']
      });
      expect((schema as any).meta()).toEqual({
        title: 'Name',
        description: 'Display name',
        examples: ['Ada']
      });
    });
  });

  describe('shared wrapper edge paths', () => {
    it('should resolve function-based error maps with fallback support', () => {
      expect(resolveErrorMessage({ error: () => 'mapped' }, 'fallback')).toBe('mapped');
      expect(resolveErrorMessage({ error: () => undefined }, 'fallback')).toBe('fallback');
    });

    it('should route check() through the refine implementation', () => {
      const schema = v.string().check(value => value.startsWith('ok'), 'Must start with ok');

      expect(schema.parse('ok-value')).toBe('ok-value');
      expect(schema.safeParse('bad-value').success).toBe(false);
    });

    it('should reject async refinements from synchronous parse paths', async () => {
      const schema = v.string().refine(async () => true);

      expect(() => schema.parse('value')).toThrow('Use parseAsync for async refinements');
      expect(schema.safeParse('value').success).toBe(false);
      await expect(schema.parseAsync('value')).resolves.toBe('value');
    });

    it('should reject async transforms from synchronous parse paths', async () => {
      const schema = v.string().transform(async value => value.toUpperCase());
      const rejectingSchema = v.string().transform(async () => {
        throw new Error('async transform failed');
      });

      expect(() => schema.parse('value')).toThrow('Transform failed');
      expect(() => schema.parse('value')).toThrow('Use parseAsync for async transforms');
      expect(schema.safeParse('value').success).toBe(false);
      await expect(schema.parseAsync('value')).resolves.toBe('VALUE');
      await expect(rejectingSchema.parseAsync('value')).rejects.toThrow('Transform failed: async transform failed');
    });

    it('should keep brand safeParse success and failure paths intact', () => {
      const schema = v.string().brand<'UserId'>();

      expect(schema.parse('usr_1')).toBe('usr_1');
      expect(schema.safeParse('usr_1')).toEqual({ success: true, data: 'usr_1' });
      expect(schema.safeParse(123).success).toBe(false);
    });
  });
});
