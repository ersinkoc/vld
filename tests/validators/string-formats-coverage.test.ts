/**
 * Coverage tests for VldStringFormat validator
 * These tests target specific uncovered lines in string-formats.ts
 */

import { v } from '../../src';

describe('VldStringFormat Coverage Tests', () => {
  describe('parse() with invalid format', () => {
    it('should throw on invalid email format via parse', () => {
      const schema = v.string().email();

      expect(() => schema.parse('not-an-email')).toThrow();
    });

    it('should throw on invalid uuid format via parse', () => {
      const schema = v.string().uuid();

      expect(() => schema.parse('not-a-uuid')).toThrow();
    });

    it('should throw on invalid url format via parse', () => {
      const schema = v.string().url();

      expect(() => schema.parse('not-a-url')).toThrow();
    });

    it('should throw on invalid ip format via parse', () => {
      const schema = v.string().ip();

      expect(() => schema.parse('not-an-ip')).toThrow();
    });
  });

  describe('custom validation with refine', () => {
    it('should validate with custom refine', () => {
      const schema = v.string().refine((val: string) => val.startsWith('prefix_'), 'Must start with prefix_');

      expect(schema.parse('prefix_value')).toBe('prefix_value');
      expect(() => schema.parse('invalid')).toThrow('Must start with prefix_');
    });
  });
});
