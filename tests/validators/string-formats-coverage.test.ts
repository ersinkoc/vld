/**
 * Coverage tests for VldStringFormat validator
 * These tests target specific uncovered lines in string-formats.ts
 */

import { v } from '../../src';

describe('VldStringFormat Coverage Tests', () => {
  describe('parse() with invalid format', () => {
    it('should throw on non-string values via parse', () => {
      const schema = v.email();

      expect(() => schema.parse(123)).toThrow('Invalid string');
    });

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

    it('should accept the current Zod XID alphabet and reject out-of-range chars', () => {
      const schema = v.xid();
      expect(schema.parse('ABCDEFGHIJKLMNOPQRST')).toBe('ABCDEFGHIJKLMNOPQRST');
      expect(() => schema.parse('WBCDEFGHIJKLMNOPQRST')).toThrow();
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

    it('should reject unknown hash algorithms defensively', () => {
      const schema = v.hash('unknown' as any);

      expect(() => schema.parse('d41d8cd98f00b204e9800998ecf8427e')).toThrow('Invalid unknown hash');
      expect(schema.safeParse('d41d8cd98f00b204e9800998ecf8427e').success).toBe(false);
    });
  });

  describe('current Zod nested format surface', () => {
    it('covers public regex factories and ISO precision branches', () => {
      expect(v.regexes.uuid().test('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(v.regexes.uuid(8).test('550e8400-e29b-81d4-a716-446655440000')).toBe(true);
      expect(v.regexes.time().test('12:30')).toBe(true);
      expect(v.regexes.time({ precision: -1 }).test('12:30')).toBe(true);
      expect(v.regexes.time({ precision: 3 }).test('12:30:45.123')).toBe(true);
      expect(v.regexes.datetime().test('2024-02-29T12:30Z')).toBe(true);
      expect(v.regexes.datetime({ local: true, precision: 0 }).test('2024-02-29T12:30:45')).toBe(true);
      expect(v.regexes.datetime({ offset: true }).test('2024-02-29T12:30+03:00')).toBe(true);
      expect(v.regexes.string().test('anything')).toBe(true);
      expect(v.regexes.string({}).test('')).toBe(true);
      expect(v.regexes.string({ minimum: 2 }).test('ab')).toBe(true);
      expect(v.regexes.string({ maximum: 3 }).test('abc')).toBe(true);
      expect(v.regexes.string({ minimum: 2, maximum: 3 }).test('ab')).toBe(true);
      expect(v.regexes.mac('-').test('00-1A-2B-3C-4D-5E')).toBe(true);
    });

    it('covers WHATWG URL failure, filters, and normalization paths', () => {
      expect(v.url().safeParse('not a URL').success).toBe(false);
      expect(v.url({ protocol: /^https$/ }).safeParse('http://example.com').success).toBe(false);
      expect(v.url({ hostname: /^example\\.com$/ }).safeParse('https://other.com').success).toBe(false);
      expect(v.url({ normalize: true }).safeParse('HTTP://EXAMPLE.COM:80/a/../b')).toEqual({
        success: true,
        data: 'http://example.com/b'
      });
      expect(v.url({ normalize: true }).parse('HTTP://EXAMPLE.COM:80/a/../b')).toBe('http://example.com/b');
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
