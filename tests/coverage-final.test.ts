/**
 * Final coverage tests targeting remaining uncovered lines
 */

import { v } from '../src';
import {
  stringToURL,
  stringToHttpURL,
  jwtPayload
} from '../src/codecs/index';

describe('Final Coverage Tests', () => {
  describe('VldPrefault - non-undefined values (base.ts:375)', () => {
    it('should parse non-undefined value through prefault', () => {
      // .default() creates VldDefault, .prefault() creates VldPrefault
      const schema = v.string().default('fallback').prefault();

      // Test safeParse with an actual value (not undefined) through VldPrefault
      const result = schema.safeParse('actual-value');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('actual-value');
      }
    });

    it('should handle various non-undefined values through prefault', () => {
      // Use .prefault() to create VldPrefault instances
      const numSchema = v.number().default(0).prefault();
      const numResult = numSchema.safeParse(42);
      expect(numResult.success).toBe(true);
      if (numResult.success) {
        expect(numResult.data).toBe(42);
      }

      const boolSchema = v.boolean().default(false).prefault();
      const boolResult = boolSchema.safeParse(true);
      expect(boolResult.success).toBe(true);
      if (boolResult.success) {
        expect(boolResult.data).toBe(true);
      }
    });

    it('should handle undefined through prefault', () => {
      const schema = v.string().default('fallback').prefault();

      // Test safeParse with undefined - should return default value validated
      const result = schema.safeParse(undefined);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('fallback');
      }
    });
  });

  describe('VldSuperRefine - safeParse failure path (base.ts:572)', () => {
    it('should return failure when base validation fails in superRefine safeParse', () => {
      // Create a superRefine that would add issues, but base validation fails first
      const schema = v.string().superRefine((_val, _ctx) => {
        // This won't be called because base validation fails
      });

      // Pass a non-string to trigger base validation failure
      const result = schema.safeParse(123);
      expect(result.success).toBe(false);
    });
  });

  describe('Union object type checker (union.ts:68)', () => {
    it('should handle union with object type that accepts empty object', () => {
      // Use an empty object schema so safeParse({}) succeeds during type checker creation
      // This triggers line 68 which creates the object type checker function
      const objectSchema = v.object({});
      const schema = v.union(objectSchema);

      // Parse an empty object - this should use the object type checker
      const result = schema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should use object type checker with record schema', () => {
      // Record also accepts empty objects, so type checker is created
      const recordSchema = v.record(v.string());
      const schema = v.union(recordSchema);

      // Parse an object with the record union
      const result = schema.safeParse({ key: 'value' });
      expect(result.success).toBe(true);
    });

    it('should handle union with object type', () => {
      // Create a union where only object is accepted
      const objectSchema = v.object({ key: v.string() });
      const schema = v.union(objectSchema);

      // Parse an object - this should trigger the object type checker
      const result = schema.safeParse({ key: 'value' });
      expect(result.success).toBe(true);
    });

    it('should reject non-object in object-only union', () => {
      const objectSchema = v.object({ name: v.string() });
      const schema = v.union(objectSchema);

      // Array should fail
      expect(schema.safeParse([]).success).toBe(false);
      // Null should fail
      expect(schema.safeParse(null).success).toBe(false);
      // Primitive should fail
      expect(schema.safeParse('string').success).toBe(false);
    });
  });

  describe('Codec error paths (codecs/index.ts)', () => {
    it('should throw on invalid URL string (line 168)', () => {
      // Use parse method instead of decode
      expect(() => stringToURL.parse('not-a-valid-url')).toThrow();
    });

    it('should throw on invalid URL parse', () => {
      expect(() => stringToURL.parse('://missing-protocol')).toThrow();
    });

    it('should encode URL back to string', () => {
      const url = new URL('https://example.com/path');
      const encoded = stringToURL.encode(url);
      expect(encoded).toBe('https://example.com/path');
    });

    it('should throw on non-HTTP URL in stringToHttpURL (line 186)', () => {
      // FTP URL should be rejected even if it's a valid URL
      // The regex check will catch this before parsing
      expect(() => stringToHttpURL.parse('ftp://example.com')).toThrow();
    });

    it('should throw on invalid HTTP URL (lines 190-193)', () => {
      expect(() => stringToHttpURL.parse('not-a-url-at-all')).toThrow();
    });

    it('should accept valid HTTP URL', () => {
      const url = stringToHttpURL.parse('https://example.com');
      expect(url.protocol).toBe('https:');
    });

    it('should throw on JWT with wrong number of parts (line 360)', () => {
      const codec = jwtPayload();
      // The refine check catches invalid format first
      expect(() => codec.parse('only.twoparts')).toThrow('Invalid JWT format');
      expect(() => codec.parse('no-dots-here')).toThrow('Invalid JWT format');
      expect(() => codec.parse('too.many.parts.here')).toThrow('Invalid JWT format');
    });
  });

  describe('VldStringFormat parse() (string-formats.ts:70)', () => {
    it('should throw from VldStringFormat.parse() on invalid email', () => {
      // Use v.email() directly to create VldStringFormat (not v.string().email() which is VldString)
      const schema = v.email();

      expect(() => schema.parse('not-an-email')).toThrow();
    });

    it('should throw from VldStringFormat.parse() on invalid uuid', () => {
      const schema = v.uuid();

      expect(() => schema.parse('not-a-uuid')).toThrow();
    });

    it('should pass valid values through VldStringFormat.parse()', () => {
      const emailSchema = v.email();
      expect(emailSchema.parse('test@example.com')).toBe('test@example.com');

      const uuidSchema = v.uuid();
      expect(uuidSchema.parse('550e8400-e29b-41d4-a716-446655440000')).toBe('550e8400-e29b-41d4-a716-446655440000');
    });
  });

  describe('Array stableStringify error fallback (array.ts:151)', () => {
    it('should handle objects with throwing toString', () => {
      const schema = v.array(v.any()).unique();

      // Create object with throwing toJSON
      const problematic = {
        toJSON() {
          throw new Error('toJSON throws');
        }
      };

      // Should not crash, will use String() fallback
      const result = schema.safeParse([problematic]);
      expect(result.success).toBe(true);
    });

    it('should handle objects with custom valueOf that throws', () => {
      const schema = v.array(v.any()).unique();

      const obj = {
        valueOf() {
          throw new Error('valueOf throws');
        },
        toString() {
          return '[custom]';
        }
      };

      const result = schema.safeParse([obj]);
      expect(result.success).toBe(true);
    });
  });
});
