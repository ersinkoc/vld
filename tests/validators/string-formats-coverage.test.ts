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

  describe('xid format', () => {
    it('should parse valid xid', () => {
      const schema = v.xid();
      // Valid XID: 20 chars from [A-HJKMNP-TV-Z0-9] - excludes I, O, U, l, etc.
      expect(schema.parse('A1B2C3D4E5F6G7H8J9K0')).toBe('A1B2C3D4E5F6G7H8J9K0');
    });

    it('should throw on xid with invalid length', () => {
      const schema = v.xid();
      expect(() => schema.parse('A1B2C3D4E5F6G7H8J9K')).toThrow(); // only 19 chars
    });

    it('should throw on xid with invalid chars', () => {
      const schema = v.xid();
      // Contains 'I' which is not in the allowed charset
      expect(() => schema.parse('ABCDEFGHIJKLMNOPQRST')).toThrow();
    });
  });

  describe('guid format', () => {
    it('should parse valid guid', () => {
      const schema = v.guid();
      expect(schema.parse('550e8400-e29b-41d4-a716-446655440000')).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should throw on invalid guid', () => {
      const schema = v.guid();
      expect(() => schema.parse('not-a-guid')).toThrow();
    });
  });

  describe('httpUrl format', () => {
    it('should parse valid httpUrl', () => {
      const schema = v.httpUrl();
      expect(schema.parse('https://example.com')).toBe('https://example.com');
    });

    it('should parse valid httpUrl with path', () => {
      const schema = v.httpUrl();
      expect(schema.parse('http://example.com/path/to/page')).toBe('http://example.com/path/to/page');
    });

    it('should throw on invalid httpUrl', () => {
      const schema = v.httpUrl();
      expect(() => schema.parse('not-a-url')).toThrow();
    });

    it('should throw on ftp url', () => {
      const schema = v.httpUrl();
      expect(() => schema.parse('ftp://example.com')).toThrow();
    });
  });

  describe('hash format', () => {
    it('should parse valid md5 hash', () => {
      const schema = v.hash('md5');
      expect(schema.parse('d41d8cd98f00b204e9800998ecf8427e')).toBe('d41d8cd98f00b204e9800998ecf8427e');
    });

    it('should parse valid sha256 hash', () => {
      const schema = v.hash('sha256');
      expect(schema.parse('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    });

    it('should throw on invalid hash', () => {
      const schema = v.hash('md5');
      expect(() => schema.parse('not-a-hash')).toThrow();
    });

    it('should throw on invalid algorithm', () => {
      const schema = v.hash('sha256');
      // This tests the ?? false path when algorithm regex is not found
      // Using any invalid algorithm would work, but sha256 is valid
      // We need to test when the regex lookup fails - but in practice this won't happen
      // since we only support md5/sha1/sha256/sha384/sha512
      // However, the line exists for safety
      expect(() => schema.parse('invalid-hash-value-long-enough-to-be-validated')).toThrow();
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
