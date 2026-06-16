/**
 * Coverage tests for VldPromise validator
 */

import { v } from '../../src';

describe('VldPromise Coverage Tests', () => {
  describe('parse()', () => {
    it('should parse a valid Promise resolving to string', async () => {
      const schema = v.promise(v.string());
      const result = await schema.parse(Promise.resolve('hello'));
      expect(result).toBe('hello');
    });

    it('should parse a valid Promise resolving to number', async () => {
      const schema = v.promise(v.number());
      const result = await schema.parse(Promise.resolve(42));
      expect(result).toBe(42);
    });

    it('should parse a valid Promise resolving to object', async () => {
      const schema = v.promise(v.object({ name: v.string() }));
      const result = await schema.parse(Promise.resolve({ name: 'John' }));
      expect(result).toEqual({ name: 'John' });
    });

    it('should throw for non-Promise non-thenable input', async () => {
      const schema = v.promise(v.string());
      // Plain object without then method - this will be rejected
      await expect(schema.parse({ hello: 'world' })).rejects.toThrow('Expected a Promise value');
    });

    it('should throw when inner schema validation fails', async () => {
      const schema = v.promise(v.string());
      const invalidPromise = Promise.resolve(123);
      await expect(schema.parse(invalidPromise)).rejects.toThrow();
    });

    it('should parse thenable (Promise-like object)', async () => {
      const schema = v.promise(v.string());
      const thenable = {
        then: (resolve: (val: string) => void) => {
          resolve('hello');
        }
      };
      const result = await schema.parse(thenable);
      expect(result).toBe('hello');
    });

    it('should use sync inner parse when async parse is unavailable', async () => {
      const syncOnlySchema = {
        parse: (value: unknown) => String(value),
        safeParse: (value: unknown) => ({ success: true as const, data: String(value) })
      };
      const schema = v.promise(syncOnlySchema as any);

      await expect(schema.parse(Promise.resolve(123))).resolves.toBe('123');
    });
  });

  describe('safeParse()', () => {
    it('should return success for valid Promise resolving to string', async () => {
      const schema = v.promise(v.string());
      const result = await schema.safeParse(Promise.resolve('hello'));
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('hello');
      }
    });

    it('should return success for valid Promise resolving to number', async () => {
      const schema = v.promise(v.number());
      const result = await schema.safeParse(Promise.resolve(42));
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(42);
      }
    });

    it('should return success for valid Promise resolving to object', async () => {
      const schema = v.promise(v.object({ name: v.string() }));
      const result = await schema.safeParse(Promise.resolve({ name: 'John' }));
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ name: 'John' });
      }
    });

    it('should return failure for non-Promise string input', async () => {
      const schema = v.promise(v.string());
      const result = await schema.safeParse('not a promise');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Expected a Promise value');
      }
    });

    it('should return failure for null input', async () => {
      const schema = v.promise(v.string());
      const result = await schema.safeParse(null);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Expected a Promise value');
      }
    });

    it('should return failure for non-promise object input', async () => {
      const schema = v.promise(v.string());
      // Plain object without then method
      const result = await schema.safeParse({ hello: 'world' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Expected a Promise value');
      }
    });

    it('should return failure when inner validation fails', async () => {
      const schema = v.promise(v.string());
      const result = await schema.safeParse(Promise.resolve(123));
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it('should return failure with Error instance when inner validation fails', async () => {
      const schema = v.promise(v.string());
      const result = await schema.safeParse(Promise.resolve(123));
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(Error);
      }
    });

    it('should return failure with string error when inner validation throws string', async () => {
      // Create a validator that throws a string
      const throwingSchema = {
        parse: () => { throw 'string error'; },
        safeParse: () => ({ success: false as const, error: new Error('string error') })
      };
      const schema = v.promise(throwingSchema as any);
      const result = await schema.safeParse(Promise.resolve('test'));
      // The parse throws 'string error', which is caught and converted to Error
      expect(result.success).toBe(false);
    });

    it('should use sync inner safeParse when async safeParse is unavailable', async () => {
      const syncOnlySchema = {
        parse: (value: unknown) => String(value),
        safeParse: (value: unknown) => ({ success: true as const, data: String(value) })
      };
      const schema = v.promise(syncOnlySchema as any);

      await expect(schema.safeParse(Promise.resolve(123))).resolves.toEqual({
        success: true,
        data: '123'
      });
    });

    it('should convert thrown non-Error inner safeParse failures into Error instances', async () => {
      const throwingSchema = {
        parse: (value: unknown) => value,
        safeParse: () => {
          throw 'string failure';
        }
      };
      const schema = v.promise(throwingSchema as any);
      const result = await schema.safeParse(Promise.resolve('test'));

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error.message).toBe('string failure');
      }
    });

    it('should preserve Error instances thrown while resolving promises', async () => {
      const schema = v.promise(v.string());
      const result = await schema.safeParse(Promise.reject(new Error('promise failed')));

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error.message).toBe('promise failed');
      }
    });

    it('should return success for thenable (Promise-like object)', async () => {
      const schema = v.promise(v.string());
      const thenable = {
        then: (resolve: (val: string) => void) => {
          resolve('hello');
        }
      };
      const result = await schema.safeParse(thenable);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('hello');
      }
    });
  });

  describe('_isThenable()', () => {
    it('should return true for native Promise', () => {
      const schema = v.promise(v.string());
      expect((schema as any)._isThenable(Promise.resolve('test'))).toBe(true);
    });

    it('should return true for thenable object', () => {
      const schema = v.promise(v.string());
      const thenable = { then: () => {} };
      expect((schema as any)._isThenable(thenable)).toBe(true);
    });

    it('should return false for null', () => {
      const schema = v.promise(v.string());
      // null is not thenable
      const result = (schema as any)._isThenable(null);
      expect(result).toBe(false);
    });

    it('should return false for number', () => {
      const schema = v.promise(v.string());
      expect((schema as any)._isThenable(42)).toBe(false);
    });

    it('should return false for plain string', () => {
      const schema = v.promise(v.string());
      expect((schema as any)._isThenable('hello')).toBe(false);
    });

    it('should return false for plain number', () => {
      const schema = v.promise(v.string());
      expect((schema as any)._isThenable(42)).toBe(false);
    });

    it('should return false for object without then method', () => {
      const schema = v.promise(v.string());
      expect((schema as any)._isThenable({ hello: 'world' })).toBe(false);
    });
  });

  describe('factory function', () => {
    it('should create VldPromise instance', () => {
      const schema = v.promise(v.string());
      expect(schema).toBeInstanceOf(Object);
    });

    it('should expose runtime type metadata and unwrap the inner schema', () => {
      const inner = v.string();
      const schema = v.promise(inner);

      expect(schema.validatorType).toBe('promise');
      expect(schema.unwrap()).toBe(inner);
    });

    it('should validate resolved values through async inner schemas', async () => {
      const schema = v.promise(v.string().refine(async value => value.startsWith('v')));

      await expect(schema.parseAsync(Promise.resolve('vld'))).resolves.toBe('vld');
      await expect(schema.safeParseAsync(Promise.resolve('zod'))).resolves.toMatchObject({ success: false });
    });

    it('should support Standard Schema async validation', async () => {
      const schema = v.promise(v.string());

      await expect(schema['~standard'].validate(Promise.resolve('vld'))).resolves.toEqual({ value: 'vld' });
      await expect(schema['~standard'].validate('vld')).resolves.toMatchObject({
        issues: [{ message: 'Expected a Promise value' }]
      });
    });
  });
});
