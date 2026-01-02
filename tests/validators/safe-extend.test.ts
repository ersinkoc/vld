import { v, Infer } from '../../src';

describe('.safeExtend() method', () => {
  describe('basic functionality', () => {
    it('should extend an object schema with new keys', () => {
      const base = v.object({ name: v.string() });
      const extended = base.safeExtend({ age: v.number() });

      const result = extended.safeParse({ name: 'John', age: 30 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ name: 'John', age: 30 });
      }
    });

    it('should throw error when trying to override existing keys', () => {
      const base = v.object({ name: v.string(), email: v.string() });

      expect(() => {
        base.safeExtend({ name: v.number() });
      }).toThrow('safeExtend: Cannot override existing keys: name');
    });

    it('should throw error with all overlapping keys listed', () => {
      const base = v.object({ name: v.string(), email: v.string(), age: v.number() });

      expect(() => {
        base.safeExtend({ name: v.number(), email: v.number() });
      }).toThrow(/name.*email|email.*name/);
    });

    it('should work with multiple new keys', () => {
      const base = v.object({ id: v.number() });
      const extended = base.safeExtend({
        name: v.string(),
        email: v.string(),
        age: v.number()
      });

      const result = extended.safeParse({
        id: 1,
        name: 'John',
        email: 'john@example.com',
        age: 30
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          id: 1,
          name: 'John',
          email: 'john@example.com',
          age: 30
        });
      }
    });
  });

  describe('validation behavior', () => {
    it('should validate both base and extended fields', () => {
      const base = v.object({ name: v.string().min(2) });
      const extended = base.safeExtend({ age: v.number().positive() });

      // Invalid base field
      expect(extended.safeParse({ name: 'J', age: 30 }).success).toBe(false);

      // Invalid extended field
      expect(extended.safeParse({ name: 'John', age: -5 }).success).toBe(false);

      // Valid
      expect(extended.safeParse({ name: 'John', age: 30 }).success).toBe(true);
    });

    it('should fail if required fields are missing', () => {
      const base = v.object({ name: v.string() });
      const extended = base.safeExtend({ age: v.number() });

      expect(extended.safeParse({ name: 'John' }).success).toBe(false);
      expect(extended.safeParse({ age: 30 }).success).toBe(false);
    });
  });

  describe('type inference', () => {
    it('should correctly infer the extended type', () => {
      const base = v.object({ name: v.string() });
      const extended = base.safeExtend({ age: v.number() });

      type Inferred = Infer<typeof extended>;

      // TypeScript compile-time check
      const value: Inferred = { name: 'John', age: 30 };
      expect(value.name).toBe('John');
      expect(value.age).toBe(30);
    });
  });

  describe('comparison with extend()', () => {
    it('should behave like extend() when there are no overlapping keys', () => {
      const base = v.object({ name: v.string() });

      const extendedSafe = base.safeExtend({ age: v.number() });
      const extendedNormal = base.extend({ age: v.number() });

      const testData = { name: 'John', age: 30 };

      const safeResult = extendedSafe.safeParse(testData);
      const normalResult = extendedNormal.safeParse(testData);

      expect(safeResult.success).toBe(normalResult.success);
      if (safeResult.success && normalResult.success) {
        expect(safeResult.data).toEqual(normalResult.data);
      }
    });

    it('should throw where extend() would silently override', () => {
      const base = v.object({ name: v.string() });

      // extend() allows override
      expect(() => base.extend({ name: v.number() })).not.toThrow();

      // safeExtend() throws
      expect(() => base.safeExtend({ name: v.number() })).toThrow();
    });
  });

  describe('chaining', () => {
    it('should allow chaining multiple safeExtend calls', () => {
      const base = v.object({ id: v.number() });
      const extended = base
        .safeExtend({ name: v.string() })
        .safeExtend({ email: v.string() })
        .safeExtend({ age: v.number() });

      const result = extended.safeParse({
        id: 1,
        name: 'John',
        email: 'john@example.com',
        age: 30
      });

      expect(result.success).toBe(true);
    });

    it('should throw if later safeExtend tries to override previous extension', () => {
      const base = v.object({ id: v.number() });
      const extended = base.safeExtend({ name: v.string() });

      expect(() => {
        extended.safeExtend({ name: v.number() });
      }).toThrow('safeExtend: Cannot override existing keys: name');
    });
  });
});
