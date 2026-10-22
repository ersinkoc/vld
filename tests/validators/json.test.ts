/**
 * Tests for v.json() - JSON-compatible value validation (Zod's z.json())
 */

import { v } from '../../src';

describe('v.json()', () => {
  describe('without schema', () => {
    const jsonValidator = v.json();

    it('accepts JSON-compatible primitive values unchanged (Zod)', () => {
      // Zod: strings are JSON-compatible values, they are NOT parsed.
      expect(jsonValidator.parse('{"key":"value"}')).toBe('{"key":"value"}');
      expect(jsonValidator.parse('"hello"')).toBe('"hello"');
      expect(jsonValidator.parse('not json')).toBe('not json');
      expect(jsonValidator.parse(123)).toBe(123);
      expect(jsonValidator.parse(true)).toBe(true);
      expect(jsonValidator.parse(null)).toBe(null);
    });

    it('accepts arrays and plain objects, recursively', () => {
      expect(jsonValidator.parse({ key: 'value' })).toEqual({ key: 'value' });
      expect(jsonValidator.parse([1, 2, 3])).toEqual([1, 2, 3]);
      expect(jsonValidator.parse({ a: [true, null, { b: ['x'] }] })).toEqual({ a: [true, null, { b: ['x'] }] });
      expect(jsonValidator.parse(Object.create(null))).toBeDefined();
      expect(jsonValidator.parse([])).toEqual([]);
    });

    it('rejects non-JSON values with invalid_union (Zod)', () => {
      for (const bad of [undefined, () => {}, Symbol('s'), 10n, new Date(), new Map(), /x/]) {
        const result = jsonValidator.safeParse(bad);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]).toEqual(expect.objectContaining({ code: 'invalid_union' }));
        }
      }
    });

    it('rejects non-finite numbers and nested non-JSON values', () => {
      expect(jsonValidator.safeParse(NaN).success).toBe(false);
      expect(jsonValidator.safeParse(Infinity).success).toBe(false);
      expect(jsonValidator.safeParse({ a: [() => {}] }).success).toBe(false);
      expect(jsonValidator.safeParse([undefined]).success).toBe(false);
    });
  });

  describe('with schema validation', () => {
    it('validates a JSON value against the schema', () => {
      const userSchema = v.object({
        name: v.string(),
        age: v.int().min(0)
      });

      const jsonValidator = v.json(userSchema);

      expect(jsonValidator.parse({ name: 'John', age: 30 })).toEqual({ name: 'John', age: 30 });
      expect(() => jsonValidator.parse({ name: 'John' })).toThrow();
      expect(() => jsonValidator.parse({ name: 'John', age: 'thirty' })).toThrow();
    });

    it('works with array schemas', () => {
      const numberArraySchema = v.array(v.int());
      const jsonValidator = v.json(numberArraySchema);

      expect(jsonValidator.parse([1, 2, 3])).toEqual([1, 2, 3]);
      expect(() => jsonValidator.parse([1, 2, 'three'])).toThrow();
    });

    it('works with union schemas', () => {
      const schema = v.union(v.string(), v.int());
      const jsonValidator = v.json(schema);

      expect(jsonValidator.parse('hello')).toBe('hello');
      expect(jsonValidator.parse(42)).toBe(42);
      expect(() => jsonValidator.parse(true)).toThrow();
    });
  });

  describe('withSchema method', () => {
    it('adds a schema to an existing validator', () => {
      const jsonValidator = v.json();
      const withSchema = jsonValidator.withSchema(v.object({
        id: v.int(),
        active: v.boolean()
      }));

      expect(withSchema.parse({ id: 123, active: true })).toEqual({ id: 123, active: true });
      expect(() => withSchema.parse({ id: 'not an int', active: true })).toThrow();
    });
  });

  describe('method chaining', () => {
    it('works with optional', () => {
      const optionalJson = v.json().optional();
      expect(optionalJson.parse({ key: 'value' })).toEqual({ key: 'value' });
      expect(optionalJson.parse(undefined)).toBe(undefined);
    });

    it('works with nullable', () => {
      const nullableJson = v.json().nullable();
      expect(nullableJson.parse({ key: 'value' })).toEqual({ key: 'value' });
      expect(nullableJson.parse(null)).toBe(null);
    });

    it('works with refine', () => {
      const nonEmptyJson = v.json().refine(
        (val) => {
          if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
            return Object.keys(val).length > 0;
          }
          return true;
        },
        'JSON must not be empty object'
      );

      expect(nonEmptyJson.parse({ key: 'value' })).toEqual({ key: 'value' });
      expect(() => nonEmptyJson.parse({})).toThrow();
    });

    it('works with transform', () => {
      const uppercaseJson = v.json().transform((val) => {
        if (typeof val === 'string') {
          return val.toUpperCase();
        }
        return val;
      });

      const result = uppercaseJson.safeParse('hello');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('HELLO');
      }
    });
  });

  describe('safeParse', () => {
    const jsonValidator = v.json();

    it('returns success for JSON-compatible values', () => {
      const result = jsonValidator.safeParse({ test: true });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ test: true });
      }
    });

    it('returns failure with invalid_union for non-JSON values', () => {
      const result = jsonValidator.safeParse(undefined);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]!.code).toBe('invalid_union');
      }
    });
  });

  describe('integration with other validators', () => {
    it('works in object schemas', () => {
      const configSchema = v.object({
        metadata: v.json(v.object({
          version: v.string(),
          enabled: v.boolean()
        }))
      });

      const result = configSchema.safeParse({
        metadata: { version: '1.0.0', enabled: true }
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.metadata).toEqual({ version: '1.0.0', enabled: true });
      }
    });

    it('works in arrays', () => {
      const jsonArray = v.array(v.json(v.int()));

      const result = jsonArray.safeParse([1, 2, 3]);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([1, 2, 3]);
      }
    });
  });

  describe('complex use cases', () => {
    it('validates deeply nested JSON structures', () => {
      const schema = v.object({
        users: v.array(v.object({
          id: v.int(),
          name: v.string(),
          tags: v.array(v.string())
        }))
      });

      const jsonValidator = v.json(schema);

      const input = {
        users: [
          { id: 1, name: 'Alice', tags: ['admin', 'user'] },
          { id: 2, name: 'Bob', tags: ['user'] }
        ]
      };

      expect(jsonValidator.parse(input)).toEqual(input);
    });
  });

  describe('error shape', () => {
    it('lists every union option in the invalid_union issue (Zod)', () => {
      const jsonValidator = v.json();
      const result = jsonValidator.safeParse(undefined);

      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues[0] as any;
        expect(issue.errors).toHaveLength(6);
        expect(issue.errors.map((optionIssues: any[]) => optionIssues[0].expected)).toEqual([
          'string', 'number', 'boolean', 'null', 'array', 'record'
        ]);
      }
    });

    it('includes schema validation errors', () => {
      const schema = v.object({
        name: v.string(),
        count: v.number()
      });

      const jsonValidator = v.json(schema);
      const result = jsonValidator.safeParse({ name: 'test' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBeTruthy();
      }
    });
  });
});
