/**
 * Coverage tests for discriminated-union.ts
 * These tests target specific uncovered error paths
 */

import { v } from '../../src';

describe('Discriminated Union Coverage Tests', () => {
  describe('Constructor validation errors', () => {
    it('should throw when discriminator is not literal or enum', () => {
      const invalidOption = v.object({
        type: v.string(), // Not a literal, just a string
        name: v.string()
      });

      expect(() => {
        v.discriminatedUnion('type', invalidOption);
      }).toThrow('Discriminator must be a literal or enum schema');
    });

    it('should throw when option is not an object', () => {
      expect(() => {
        // Try to create with a string validator instead of object
        v.discriminatedUnion('type', v.string() as any);
      }).toThrow('All options in a discriminated union must be objects');
    });

    it('should throw when discriminator key is missing from option', () => {
      const optionWithoutDiscriminator = v.object({
        name: v.string()
        // Missing 'type' field
      });

      expect(() => {
        v.discriminatedUnion('type', optionWithoutDiscriminator);
      }).toThrow('Missing discriminator key "type" in one of the options');
    });

    it('should throw when duplicate discriminator values exist', () => {
      const option1 = v.object({
        type: v.literal('user'),
        name: v.string()
      });

      const option2 = v.object({
        type: v.literal('user'), // Duplicate 'user' value
        email: v.string()
      });

      expect(() => {
        v.discriminatedUnion('type', option1, option2);
      }).toThrow('Duplicate discriminator value "user" found in discriminated union');
    });
  });

  describe('Valid discriminated union', () => {
    it('should work with literal discriminators', () => {
      const userSchema = v.object({
        type: v.literal('user'),
        name: v.string()
      });

      const adminSchema = v.object({
        type: v.literal('admin'),
        permissions: v.array(v.string())
      });

      const schema = v.discriminatedUnion('type', userSchema, adminSchema);

      expect(schema.safeParse({ type: 'user', name: 'John' }).success).toBe(true);
      expect(schema.safeParse({ type: 'admin', permissions: ['read', 'write'] }).success).toBe(true);
    });

    it('should work with enum discriminators', () => {
      const successSchema = v.object({
        status: v.enum('ok', 'success'),
        data: v.string()
      });

      const errorSchema = v.object({
        status: v.literal('error'),
        message: v.string()
      });

      const schema = v.discriminatedUnion('status', successSchema, errorSchema);

      expect(schema.safeParse({ status: 'ok', data: 'result' }).success).toBe(true);
      expect(schema.safeParse({ status: 'success', data: 'result' }).success).toBe(true);
      expect(schema.safeParse({ status: 'error', message: 'failed' }).success).toBe(true);
    });

    it('should reject non-object input', () => {
      const schema = v.discriminatedUnion('type',
        v.object({ type: v.literal('a'), val: v.number() })
      );

      const result = schema.safeParse('not an object');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Expected object');
      }
    });

    it('should reject null input', () => {
      const schema = v.discriminatedUnion('type',
        v.object({ type: v.literal('a'), val: v.number() })
      );

      const result = schema.safeParse(null);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('null');
      }
    });

    it('should reject unknown discriminator value', () => {
      const schema = v.discriminatedUnion('type',
        v.object({ type: v.literal('a'), val: v.number() }),
        v.object({ type: v.literal('b'), val: v.string() })
      );

      const result = schema.safeParse({ type: 'c', val: 123 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Invalid discriminator value');
      }
    });
  });

  describe('Helper methods', () => {
    it('should return discriminator key', () => {
      const schema = v.discriminatedUnion('type',
        v.object({ type: v.literal('a'), val: v.number() })
      );

      expect(schema.getDiscriminator()).toBe('type');
    });

    it('should return options', () => {
      const option1 = v.object({ type: v.literal('a'), val: v.number() });
      const schema = v.discriminatedUnion('type', option1);

      const options = schema.getOptions();
      expect(options.length).toBe(1);
    });
  });
});
