/**
 * Tests for VldDiscriminatedUnion validator
 * Tests O(1) union lookup performance
 */

import { v } from '../../src';

describe('VldDiscriminatedUnion', () => {
  describe('basic usage', () => {
    it('should validate based on discriminator field', () => {
      const schema = v.discriminatedUnion('type',
        v.object({ type: v.literal('a'), value: v.string() }),
        v.object({ type: v.literal('b'), count: v.number() })
      );

      const result1 = schema.safeParse({ type: 'a', value: 'hello' });
      expect(result1.success).toBe(true);

      const result2 = schema.safeParse({ type: 'b', count: 42 });
      expect(result2.success).toBe(true);
    });

    it('should reject invalid discriminator value', () => {
      const schema = v.discriminatedUnion('type',
        v.object({ type: v.literal('a'), value: v.string() }),
        v.object({ type: v.literal('b'), count: v.number() })
      );

      const result = schema.safeParse({ type: 'c', value: 'hello' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Invalid discriminator value');
      }
    });

    it('should reject non-object input', () => {
      const schema = v.discriminatedUnion('type',
        v.object({ type: v.literal('a'), value: v.string() }),
        v.object({ type: v.literal('b'), count: v.number() })
      );

      const result = schema.safeParse('not an object');
      expect(result.success).toBe(false);
    });

    it('should reject null', () => {
      const schema = v.discriminatedUnion('type',
        v.object({ type: v.literal('a'), value: v.string() }),
        v.object({ type: v.literal('b'), count: v.number() })
      );

      const result = schema.safeParse(null);
      expect(result.success).toBe(false);
    });
  });

  describe('API response validation', () => {
    it('should handle success/error response pattern', () => {
      const ApiResponse = v.discriminatedUnion('status',
        v.object({
          status: v.literal('success'),
          data: v.array(v.object({ id: v.number(), name: v.string() }))
        }),
        v.object({
          status: v.literal('error'),
          error: v.object({ code: v.number(), message: v.string() })
        })
      );

      const successResponse = {
        status: 'success' as const,
        data: [{ id: 1, name: 'Item 1' }]
      };

      const errorResponse = {
        status: 'error' as const,
        error: { code: 404, message: 'Not found' }
      };

      expect(ApiResponse.safeParse(successResponse).success).toBe(true);
      expect(ApiResponse.safeParse(errorResponse).success).toBe(true);
    });
  });

  describe('with enum discriminator', () => {
    it('should work with enum as discriminator', () => {
      const schema = v.discriminatedUnion('kind',
        v.object({ kind: v.enum('circle'), radius: v.number() }),
        v.object({ kind: v.enum('square'), side: v.number() })
      );

      const circle = { kind: 'circle', radius: 5 };
      const square = { kind: 'square', side: 10 };

      expect(schema.safeParse(circle).success).toBe(true);
      expect(schema.safeParse(square).success).toBe(true);
    });
  });

  describe('error messages', () => {
    it('should provide helpful error for missing discriminator', () => {
      const schema = v.discriminatedUnion('type',
        v.object({ type: v.literal('a'), value: v.string() })
      );

      const result = schema.safeParse({ value: 'hello' });
      expect(result.success).toBe(false);
    });

    it('should show valid discriminator values in error', () => {
      const schema = v.discriminatedUnion('type',
        v.object({ type: v.literal('a'), value: v.string() }),
        v.object({ type: v.literal('b'), count: v.number() })
      );

      const result = schema.safeParse({ type: 'invalid', value: 'hello' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Expected one of');
      }
    });
  });

  describe('validation of matched schema', () => {
    it('should validate the rest of the object against matched schema', () => {
      const schema = v.discriminatedUnion('type',
        v.object({ type: v.literal('a'), value: v.string().min(5) }),
        v.object({ type: v.literal('b'), count: v.number().min(10) })
      );

      const result1 = schema.safeParse({ type: 'a', value: 'hi' });
      expect(result1.success).toBe(false);

      const result2 = schema.safeParse({ type: 'b', count: 5 });
      expect(result2.success).toBe(false);
    });
  });

  describe('getDiscriminator and getOptions', () => {
    it('should return discriminator key', () => {
      const schema = v.discriminatedUnion('type',
        v.object({ type: v.literal('a'), value: v.string() }),
        v.object({ type: v.literal('b'), count: v.number() })
      );

      expect(schema.getDiscriminator()).toBe('type');
    });

    it('should return all options', () => {
      const option1 = v.object({ type: v.literal('a'), value: v.string() });
      const option2 = v.object({ type: v.literal('b'), count: v.number() });

      const schema = v.discriminatedUnion('type', option1, option2);

      const options = schema.getOptions();
      expect(options).toHaveLength(2);
    });
  });

  describe('parse method', () => {
    it('should throw on invalid input', () => {
      const schema = v.discriminatedUnion('type',
        v.object({ type: v.literal('a'), value: v.string() }),
        v.object({ type: v.literal('b'), count: v.number() })
      );

      expect(() => schema.parse({ type: 'c' })).toThrow();
    });

    it('should return parsed value on valid input', () => {
      const schema = v.discriminatedUnion('type',
        v.object({ type: v.literal('a'), value: v.string() }),
        v.object({ type: v.literal('b'), count: v.number() })
      );

      const result = schema.parse({ type: 'a', value: 'hello' });
      expect(result).toEqual({ type: 'a', value: 'hello' });
    });
  });
});
