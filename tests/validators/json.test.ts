/**
 * Tests for v.json() - JSON value validation
 */

import { v } from '../../src';

describe('v.json()', () => {
  describe('without schema', () => {
    const jsonValidator = v.json();

    it('should accept valid JSON strings', () => {
      expect(jsonValidator.parse('{"key":"value"}')).toEqual({ key: 'value' });
      expect(jsonValidator.parse('["a","b","c"]')).toEqual(['a', 'b', 'c']);
      expect(jsonValidator.parse('"hello"')).toBe('hello');
      expect(jsonValidator.parse('123')).toBe(123);
      expect(jsonValidator.parse('true')).toBe(true);
      expect(jsonValidator.parse('null')).toBe(null);
      expect(jsonValidator.parse('{}')).toEqual({});
      expect(jsonValidator.parse('[]')).toEqual([]);
    });

    it('should reject invalid JSON strings', () => {
      expect(() => jsonValidator.parse('{"invalid": }')).toThrow();
      expect(() => jsonValidator.parse('not json')).toThrow();
      expect(() => jsonValidator.parse('{\'single\': \'quotes\'}')).toThrow();
    });

    it('should accept already-parsed values', () => {
      expect(jsonValidator.parse({ key: 'value' })).toEqual({ key: 'value' });
      expect(jsonValidator.parse([1, 2, 3])).toEqual([1, 2, 3]);
      // Strings are assumed to be JSON that needs parsing, so plain strings are rejected
      expect(() => jsonValidator.parse('string')).toThrow();
      expect(jsonValidator.parse(42)).toBe(42);
      expect(jsonValidator.parse(true)).toBe(true);
      expect(jsonValidator.parse(null)).toBe(null);
    });
  });

  describe('with schema validation', () => {
    it('should validate parsed JSON against schema', () => {
      const userSchema = v.object({
        name: v.string(),
        age: v.int().min(0)
      });

      const jsonValidator = v.json(userSchema);

      const validJson = '{"name":"John","age":30}';
      expect(jsonValidator.parse(validJson)).toEqual({ name: 'John', age: 30 });
    });

    it('should reject when parsed JSON does not match schema', () => {
      const userSchema = v.object({
        name: v.string(),
        age: v.number()
      });

      const jsonValidator = v.json(userSchema);

      // Missing required field
      expect(() => jsonValidator.parse('{"name":"John"}')).toThrow();

      // Wrong type
      expect(() => jsonValidator.parse('{"name":"John","age":"thirty"}')).toThrow();
    });

    it('should work with array schemas', () => {
      const numberArraySchema = v.array(v.int());
      const jsonValidator = v.json(numberArraySchema);

      expect(jsonValidator.parse('[1,2,3]')).toEqual([1, 2, 3]);
      expect(() => jsonValidator.parse('[1,2,"three"]')).toThrow();
    });

    it('should work with union schemas', () => {
      const schema = v.union(v.string(), v.int());
      const jsonValidator = v.json(schema);

      expect(jsonValidator.parse('"hello"')).toBe('hello');
      expect(jsonValidator.parse('42')).toBe(42);
      expect(() => jsonValidator.parse('true')).toThrow();
    });
  });

  describe('withSchema method', () => {
    it('should add schema to existing validator', () => {
      const jsonValidator = v.json();
      const withSchema = jsonValidator.withSchema(v.object({
        id: v.int(),
        active: v.boolean()
      }));

      expect(withSchema.parse('{"id":123,"active":true}')).toEqual({ id: 123, active: true });
      expect(() => withSchema.parse('{"id":"not an int","active":true}')).toThrow();
    });
  });

  describe('method chaining', () => {
    it('should work with optional', () => {
      const optionalJson = v.json().optional();
      expect(optionalJson.parse('{"key":"value"}')).toEqual({ key: 'value' });
      expect(optionalJson.parse(undefined)).toBe(undefined);
    });

    it('should work with nullable', () => {
      const nullableJson = v.json().nullable();
      expect(nullableJson.parse('{"key":"value"}')).toEqual({ key: 'value' });
      expect(nullableJson.parse(null)).toBe(null);
    });

    it('should work with refine', () => {
      const nonEmptyJson = v.json().refine(
        (val) => {
          if (typeof val === 'object' && val !== null) {
            return Object.keys(val).length > 0;
          }
          return true;
        },
        'JSON must not be empty object'
      );

      expect(nonEmptyJson.parse('{"key":"value"}')).toEqual({ key: 'value' });
      expect(() => nonEmptyJson.parse('{}')).toThrow();
    });

    it('should work with transform', () => {
      const uppercaseJson = v.json().transform((val) => {
        if (typeof val === 'string') {
          return val.toUpperCase();
        }
        return val;
      });

      const result = uppercaseJson.safeParse('"hello"');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('HELLO');
      }
    });
  });

  describe('safeParse', () => {
    const jsonValidator = v.json();

    it('should return success for valid JSON', () => {
      const result = jsonValidator.safeParse('{"test": true}');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ test: true });
      }
    });

    it('should return failure for invalid JSON', () => {
      const result = jsonValidator.safeParse('{"invalid": }');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(Error);
      }
    });
  });

  describe('integration with other validators', () => {
    it('should work in object schemas', () => {
      const configSchema = v.object({
        metadata: v.json(v.object({
          version: v.string(),
          enabled: v.boolean()
        }))
      });

      const result = configSchema.safeParse({
        metadata: '{"version":"1.0.0","enabled":true}'
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.metadata).toEqual({ version: '1.0.0', enabled: true });
      }
    });

    it('should work in arrays', () => {
      const jsonArray = v.array(v.json(v.int()));

      const result = jsonArray.safeParse(['1', '2', '3']);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([1, 2, 3]);
      }
    });
  });

  describe('complex use cases', () => {
    it('should validate nested JSON structures', () => {
      const schema = v.object({
        users: v.array(v.object({
          id: v.int(),
          name: v.string(),
          tags: v.array(v.string())
        }))
      });

      const jsonValidator = v.json(schema);

      const input = JSON.stringify({
        users: [
          { id: 1, name: 'Alice', tags: ['admin', 'user'] },
          { id: 2, name: 'Bob', tags: ['user'] }
        ]
      });

      const result = jsonValidator.parse(input);
      expect(result).toEqual({
        users: [
          { id: 1, name: 'Alice', tags: ['admin', 'user'] },
          { id: 2, name: 'Bob', tags: ['user'] }
        ]
      });
    });

    it('should handle JSON with special characters', () => {
      const jsonValidator = v.json();

      const withSpecialChars = '{"message":"Hello\\nWorld\\t!"}';
      expect(jsonValidator.parse(withSpecialChars)).toEqual({
        message: 'Hello\nWorld\t!'
      });
    });

    it('should handle Unicode in JSON', () => {
      const jsonValidator = v.json();

      const unicodeJson = '{"text":"Hello 世界 🌍"}';
      expect(jsonValidator.parse(unicodeJson)).toEqual({
        text: 'Hello 世界 🌍'
      });
    });
  });

  describe('error messages', () => {
    it('should provide descriptive error for invalid JSON', () => {
      const jsonValidator = v.json();
      const result = jsonValidator.safeParse('not valid json');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('JSON');
      }
    });

    it('should include schema validation errors', () => {
      const schema = v.object({
        name: v.string(),
        count: v.number()
      });

      const jsonValidator = v.json(schema);
      const result = jsonValidator.safeParse('{"name":"test"}');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBeTruthy();
      }
    });
  });
});
