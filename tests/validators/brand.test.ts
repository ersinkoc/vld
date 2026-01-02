/**
 * Tests for .brand() - nominal typing via branded types
 */

import { v } from '../../src';

describe('.brand()', () => {
  describe('basic branding', () => {
    it('should create branded string types', () => {
      const userIdSchema = v.string().brand<'UserId'>();

      const userId = userIdSchema.parse('user-123');

      // The value should still be a string at runtime
      expect(typeof userId).toBe('string');
      expect(userId).toBe('user-123');
    });

    it('should create branded number types', () => {
      const celsiusSchema = v.number().brand<'Celsius'>();
      const fahrenheitSchema = v.number().brand<'Fahrenheit'>();

      const celsius = celsiusSchema.parse(25);
      const fahrenheit = fahrenheitSchema.parse(77);

      expect(celsius).toBe(25);
      expect(fahrenheit).toBe(77);

      // These have different types in TypeScript - prevents accidental assignment
    });

    it('should work with objects', () => {
      const userSchema = v.object({
        id: v.string().brand<'UserId'>(),
        name: v.string()
      });

      const user = userSchema.parse({ id: '123', name: 'John' });

      expect(user.id).toBe('123');
      expect(user.name).toBe('John');
    });
  });

  describe('method chaining with brand', () => {
    it('should work with optional', () => {
      const optionalUserId = v.string().brand<'UserId'>().optional();

      const userId1 = optionalUserId.parse('user-123');
      expect(userId1).toBe('user-123');

      const userId2 = optionalUserId.parse(undefined);
      expect(userId2).toBe(undefined);
    });

    it('should work with nullable', () => {
      const nullableUserId = v.string().brand<'UserId'>().nullable();

      const userId1 = nullableUserId.parse('user-123');
      expect(userId1).toBe('user-123');

      const userId2 = nullableUserId.parse(null);
      expect(userId2).toBe(null);
    });

    it('should work with refine', () => {
      const userIdSchema = v.string()
        .brand<'UserId'>()
        .refine((id) => id.startsWith('user-'), 'UserId must start with "user-"');

      const validUserId = userIdSchema.parse('user-123');
      expect(validUserId).toBe('user-123');

      expect(() => userIdSchema.parse('invalid')).toThrow();
    });

    it('should work with transform', () => {
      const uppercaseUserId = v.string()
        .brand<'UserId'>()
        .transform((id) => id.toUpperCase());

      const result = uppercaseUserId.safeParse('user-123');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('USER-123');
      }
    });

    it('should work with readonly', () => {
      const readonlyUserId = v.string().brand<'UserId'>().readonly();

      const userId = readonlyUserId.parse('user-123');
      expect(userId).toBe('user-123');
    });
  });

  describe('safeParse', () => {
    it('should return success for valid branded values', () => {
      const userIdSchema = v.string().brand<'UserId'>();

      const result = userIdSchema.safeParse('user-123');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('user-123');
      }
    });

    it('should return failure for invalid values', () => {
      const userIdSchema = v.string().brand<'UserId'>();

      const result = userIdSchema.safeParse(123);

      expect(result.success).toBe(false);
    });
  });

  describe('integration with other validators', () => {
    it('should work in object schemas', () => {
      const schema = v.object({
        userId: v.string().brand<'UserId'>(),
        productId: v.string().brand<'ProductId'>()
      });

      const result = schema.safeParse({
        userId: 'user-123',
        productId: 'prod-456'
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe('user-123');
        expect(result.data.productId).toBe('prod-456');
      }
    });

    it('should work in arrays', () => {
      const userIdsSchema = v.array(v.string().brand<'UserId'>());

      const result = userIdsSchema.safeParse(['user-1', 'user-2', 'user-3']);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(['user-1', 'user-2', 'user-3']);
      }
    });

    it('should work with union types', () => {
      const schema = v.union(
        v.string().brand<'UserId'>(),
        v.int().brand<'NumericId'>()
      );

      expect(schema.parse('user-123')).toBe('user-123');
      expect(schema.parse(12345)).toBe(12345);
    });
  });

  describe('complex use cases', () => {
    it('should prevent accidental assignment between different brands', () => {
      const userIdSchema = v.string().brand<'UserId'>();
      const productIdSchema = v.string().brand<'ProductId'>();

      const userId = userIdSchema.parse('user-123');
      const productId = productIdSchema.parse('prod-456');

      // At runtime, they're both strings
      expect(typeof userId).toBe('string');
      expect(typeof productId).toBe('string');

      // But TypeScript sees them as different types preventing accidental assignment
    });

    it('should work with branded email addresses', () => {
      const emailSchema = v.string().brand<'EmailAddress'>().refine(
        (email) => email.includes('@'),
        'Invalid email address'
      );

      const validEmail = emailSchema.parse('user@example.com');
      expect(validEmail).toBe('user@example.com');

      expect(() => emailSchema.parse('not-an-email')).toThrow();
    });

    it('should work with branded currency amounts', () => {
      const usdSchema = v.number().min(0).brand<'USD'>();
      const eurSchema = v.number().min(0).brand<'EUR'>();

      const usdAmount = usdSchema.parse(100);
      const eurAmount = eurSchema.parse(85);

      expect(usdAmount).toBe(100);
      expect(eurAmount).toBe(85);

      // TypeScript prevents accidental mixing of different currency types
    });
  });

  describe('brand with complex validators', () => {
    it('should work with branded objects', () => {
      const userSchema = v.object({
        id: v.string(),
        name: v.string()
      }).brand<'ValidUser'>();

      const user = userSchema.parse({ id: '123', name: 'John' });

      expect(user).toEqual({ id: '123', name: 'John' });
    });

    it('should work with branded arrays', () => {
      const coordinatesSchema = v.tuple(v.number(), v.number()).brand<'Coordinates'>();

      const coords = coordinatesSchema.parse([10, 20]);

      expect(coords).toEqual([10, 20]);
    });
  });
});
