/**
 * Coverage tests for VldFile validator
 * These tests target specific uncovered lines in file.ts
 */

import { v } from '../../src';

// Mock File class for Node.js environment
class MockFile {
  name: string;
  size: number;
  type: string;

  constructor(parts: (string | ArrayBuffer)[], name: string, options?: { type?: string }) {
    this.name = name;
    this.size = parts.reduce((acc: number, part) => {
      if (typeof part === 'string') return acc + part.length;
      if (part instanceof ArrayBuffer) return acc + part.byteLength;
      return acc;
    }, 0);
    this.type = options?.type || '';
  }
}

// Set up global File if not available
if (typeof globalThis.File === 'undefined') {
  (globalThis as any).File = MockFile;
}

describe('VldFile Coverage Tests', () => {
  describe('parse() with File object', () => {
    it('should validate File instance', () => {
      const schema = v.file();

      const file = new File(['hello'], 'test.txt', { type: 'text/plain' });
      const result = schema.safeParse(file);

      expect(result.success).toBe(true);
    });

    it('should validate file with size constraint', () => {
      const schema = v.file().max(100);

      const file = new File(['hello'], 'test.txt', { type: 'text/plain' });
      const result = schema.safeParse(file);

      expect(result.success).toBe(true);
    });

    it('should reject file exceeding max size', () => {
      const schema = v.file().max(2);

      const file = new File(['hello world'], 'test.txt', { type: 'text/plain' });
      const result = schema.safeParse(file);

      expect(result.success).toBe(false);
    });
  });

  describe('parse() with plain object (Node.js compatibility)', () => {
    it('should accept plain object with size and type', () => {
      const schema = v.file();

      const fileObj = { size: 100, type: 'text/plain', name: 'test.txt' };
      const result = schema.safeParse(fileObj);

      expect(result.success).toBe(true);
    });

    it('should validate mime type constraint', () => {
      const schema = v.file().mime('image/png');

      const imageFile = { size: 100, type: 'image/png', name: 'image.png' };
      const textFile = { size: 100, type: 'text/plain', name: 'text.txt' };

      expect(schema.safeParse(imageFile).success).toBe(true);
      expect(schema.safeParse(textFile).success).toBe(false);
    });

    it('should validate multiple mime types', () => {
      const schema = v.file().mime(['image/png', 'image/jpeg']);

      const pngFile = { size: 100, type: 'image/png', name: 'image.png' };
      const jpegFile = { size: 100, type: 'image/jpeg', name: 'image.jpg' };
      const gifFile = { size: 100, type: 'image/gif', name: 'image.gif' };

      expect(schema.safeParse(pngFile).success).toBe(true);
      expect(schema.safeParse(jpegFile).success).toBe(true);
      expect(schema.safeParse(gifFile).success).toBe(false);
    });
  });

  describe('parse() with invalid input', () => {
    it('should reject string input', () => {
      const schema = v.file();

      expect(() => schema.parse('not a file')).toThrow();
    });

    it('should reject number input', () => {
      const schema = v.file();

      expect(() => schema.parse(123)).toThrow();
    });

    it('should reject object without required properties', () => {
      const schema = v.file();

      expect(() => schema.parse({ name: 'test.txt' })).toThrow();
    });
  });

  describe('safeParse() with invalid input', () => {
    it('should return failure for non-file values', () => {
      const schema = v.file();

      expect(schema.safeParse(null).success).toBe(false);
      expect(schema.safeParse(undefined).success).toBe(false);
      expect(schema.safeParse('string').success).toBe(false);
      expect(schema.safeParse(123).success).toBe(false);
    });
  });
});
