import { v, Infer, VldBase } from '../../src';

describe('.apply() method', () => {
  describe('basic functionality', () => {
    it('should apply an external function to transform the validator', () => {
      const withLength = (schema: VldBase<unknown, string>) => schema.transform((s) => s.length);
      const lengthSchema = v.string().apply(withLength);

      const result = lengthSchema.safeParse('hello');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(5);
      }
    });

    it('should allow chaining with other methods after apply', () => {
      const withTrim = (schema: VldBase<unknown, string>) => schema.transform((s) => s.trim());
      const schema = v.string().apply(withTrim);

      const result = schema.safeParse('  hello  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('hello');
      }
    });

    it('should work with refinements', () => {
      const withMinLength = (minLength: number) => (schema: VldBase<unknown, string>) =>
        schema.refine((s) => s.length >= minLength, `Must be at least ${minLength} characters`);

      const schema = v.string().apply(withMinLength(5));

      expect(schema.safeParse('hello').success).toBe(true);
      expect(schema.safeParse('hi').success).toBe(false);
    });

    it('should work with complex transformations', () => {
      const toUpperAndLength = (schema: VldBase<unknown, string>) =>
        schema.transform((s) => ({ upper: s.toUpperCase(), length: s.length }));

      const schema = v.string().apply(toUpperAndLength);

      const result = schema.safeParse('hello');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ upper: 'HELLO', length: 5 });
      }
    });

    it('should preserve the original validation', () => {
      const identity = <T extends VldBase<unknown, string>>(schema: T) => schema;
      const schema = v.string().email().apply(identity);

      expect(schema.safeParse('test@example.com').success).toBe(true);
      expect(schema.safeParse('not-an-email').success).toBe(false);
    });
  });

  describe('type inference', () => {
    it('should correctly infer the transformed type', () => {
      const toNumber = (schema: VldBase<unknown, string>) => schema.transform((s) => parseInt(s, 10));
      const schema = v.string().apply(toNumber);

      type Inferred = Infer<typeof schema>;
      const value: Inferred = 42;
      expect(typeof value).toBe('number');
    });
  });

  describe('composability', () => {
    it('should allow composing multiple apply calls', () => {
      const addPrefix = (prefix: string) => (schema: VldBase<unknown, string>) =>
        schema.transform((s) => `${prefix}${s}`);

      const addSuffix = (suffix: string) => (schema: VldBase<unknown, string>) =>
        schema.transform((s) => `${s}${suffix}`);

      const schema = v
        .string()
        .apply(addPrefix('['))
        .apply(addSuffix(']'));

      const result = schema.safeParse('hello');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('[hello]');
      }
    });
  });
});
