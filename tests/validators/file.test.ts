/**
 * Tests for v.file() - file validation
 * Note: File API is only available in browsers, so we use mocks for testing
 */

import { v } from '../../src';

// Mock File class for Node.js environment
class MockFile implements File {
  readonly name: string;
  readonly lastModified: number;
  readonly webkitRelativePath: string;

  constructor(
    public readonly size: number,
    public readonly type: string,
    name: string = 'test.txt'
  ) {
    this.name = name;
    this.lastModified = Date.now();
    this.webkitRelativePath = '';
  }

  slice(): Blob {
    throw new Error('Method not implemented in mock');
  }

  async bytes(): Promise<Uint8Array> {
    throw new Error('Method not implemented in mock');
  }

  stream(): ReadableStream<Uint8Array> {
    throw new Error('Method not implemented in mock');
  }

  text(): Promise<string> {
    throw new Error('Method not implemented in mock');
  }

  arrayBuffer(): Promise<ArrayBuffer> {
    throw new Error('Method not implemented in mock');
  }
}

// Mock global File if not available
if (typeof File === 'undefined') {
  (global as any).File = MockFile;
}

describe('v.file()', () => {
  describe('basic file validation', () => {
    it('should accept File objects', () => {
      const schema = v.file();
      const file = new MockFile(1024, 'text/plain', 'test.txt');

      expect(schema.parse(file)).toBe(file);
    });

    it('should accept plain objects with size and type for Node.js compatibility', () => {
      const schema = v.file();
      const fileObj = { size: 1024, type: 'text/plain', name: 'test.txt' };

      expect(schema.parse(fileObj)).toEqual(fileObj);
    });

    it('should reject non-file values', () => {
      const schema = v.file();

      expect(() => schema.parse('not a file')).toThrow();
      expect(() => schema.parse(123)).toThrow();
      expect(() => schema.parse(null)).toThrow();
      expect(() => schema.parse(undefined)).toThrow();
      expect(() => schema.parse({})).toThrow(); // Missing size and type
    });
  });

  describe('file size validation', () => {
    it('should validate minimum file size', () => {
      const schema = v.file().min(1024);

      const validFile = new MockFile(1024, 'text/plain');
      const invalidFile = new MockFile(512, 'text/plain');

      expect(schema.parse(validFile)).toBe(validFile);
      expect(() => schema.parse(invalidFile)).toThrow(/at least 1024 bytes/);
    });

    it('should validate maximum file size', () => {
      const schema = v.file().max(1048576); // 1MB

      const validFile = new MockFile(1048576, 'text/plain');
      const invalidFile = new MockFile(2097152, 'text/plain'); // 2MB

      expect(schema.parse(validFile)).toBe(validFile);
      expect(() => schema.parse(invalidFile)).toThrow(/not exceed 1048576 bytes/);
    });

    it('should validate both min and max size', () => {
      const schema = v.file().size(1024, 1048576);

      const validFile = new MockFile(512000, 'text/plain');
      const tooSmall = new MockFile(512, 'text/plain');
      const tooLarge = new MockFile(2097152, 'text/plain');

      expect(schema.parse(validFile)).toBe(validFile);
      expect(() => schema.parse(tooSmall)).toThrow(/at least 1024 bytes/);
      expect(() => schema.parse(tooLarge)).toThrow(/not exceed 1048576 bytes/);
    });

    it('should support custom error messages for size validation', () => {
      const schema = v.file().min(1024, 'File too small!');
      const file = new MockFile(512, 'text/plain');

      expect(() => schema.parse(file)).toThrow('File too small!');
    });
  });

  describe('MIME type validation', () => {
    it('should validate single MIME type', () => {
      const schema = v.file().mime('image/jpeg');

      const validFile = new MockFile(1024, 'image/jpeg');
      const invalidFile = new MockFile(1024, 'image/png');

      expect(schema.parse(validFile)).toBe(validFile);
      expect(() => schema.parse(invalidFile)).toThrow(/Invalid file type/);
    });

    it('should validate multiple MIME types', () => {
      const schema = v.file().mime(['image/jpeg', 'image/png', 'image/gif']);

      const validJpeg = new MockFile(1024, 'image/jpeg');
      const validPng = new MockFile(1024, 'image/png');
      const invalidPdf = new MockFile(1024, 'application/pdf');

      expect(schema.parse(validJpeg)).toBe(validJpeg);
      expect(schema.parse(validPng)).toBe(validPng);
      expect(() => schema.parse(invalidPdf)).toThrow(/Invalid file type/);
    });

    it('should support custom error messages for MIME validation', () => {
      const schema = v.file().mime(['image/jpeg'], 'Only JPEG files allowed!');
      const file = new MockFile(1024, 'image/png');

      expect(() => schema.parse(file)).toThrow('Only JPEG files allowed!');
    });
  });

  describe('combined validation', () => {
    it('should validate both size and MIME type', () => {
      const schema = v.file()
        .min(1024)
        .max(10485760)
        .mime(['image/jpeg', 'image/png']);

      const validFile = new MockFile(512000, 'image/jpeg');
      const wrongSize = new MockFile(512, 'image/jpeg');
      const wrongType = new MockFile(512000, 'application/pdf');

      expect(schema.parse(validFile)).toBe(validFile);
      expect(() => schema.parse(wrongSize)).toThrow(/at least 1024 bytes/);
      expect(() => schema.parse(wrongType)).toThrow(/Invalid file type/);
    });
  });

  describe('method chaining', () => {
    it('should work with optional', () => {
      const schema = v.file().optional();
      const file = new MockFile(1024, 'text/plain');

      expect(schema.parse(file)).toBe(file);
      expect(schema.parse(undefined)).toBe(undefined);
    });

    it('should work with nullable', () => {
      const schema = v.file().nullable();
      const file = new MockFile(1024, 'text/plain');

      expect(schema.parse(file)).toBe(file);
      expect(schema.parse(null)).toBe(null);
    });

    it('should work with refine', () => {
      const schema = v.file().refine(
        (file) => (file.name ?? '').endsWith('.jpg'),
        'Only .jpg files allowed'
      );
      const validFile = new MockFile(1024, 'image/jpeg', 'photo.jpg');
      const invalidFile = new MockFile(1024, 'image/jpeg', 'photo.png');

      expect(schema.parse(validFile)).toBe(validFile);
      expect(() => schema.parse(invalidFile)).toThrow('Only .jpg files allowed');
    });

    it('should work with transform', () => {
      const schema = v.file().transform((file) => ({
        size: file.size,
        type: file.type,
        name: file.name
      }));

      const file = new MockFile(1024, 'text/plain', 'test.txt');
      const result = schema.safeParse(file);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          size: 1024,
          type: 'text/plain',
          name: 'test.txt'
        });
      }
    });
  });

  describe('safeParse', () => {
    it('should return success for valid files', () => {
      const schema = v.file().min(1024);
      const file = new MockFile(2048, 'text/plain');

      const result = schema.safeParse(file);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(file);
      }
    });

    it('should return failure for invalid files', () => {
      const schema = v.file().min(1024);
      const file = new MockFile(512, 'text/plain');

      const result = schema.safeParse(file);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('at least 1024 bytes');
      }
    });
  });

  describe('immutability', () => {
    it('should maintain immutability when chaining', () => {
      const base = v.file();
      const withMin = base.min(1024);
      const withMax = base.max(1048576);
      const withMime = base.mime('image/jpeg');

      const smallFile = new MockFile(512, 'text/plain');
      const largeFile = new MockFile(2097152, 'text/plain');
      const wrongType = new MockFile(1024, 'application/pdf');
      const validFile = new MockFile(1024, 'text/plain');
      const validJpeg = new MockFile(1024, 'image/jpeg');

      // Base should accept any file
      expect(base.parse(smallFile)).toBe(smallFile);
      expect(base.parse(largeFile)).toBe(largeFile);

      // withMin should reject small files
      expect(() => withMin.parse(smallFile)).toThrow();
      expect(withMin.parse(validFile)).toBe(validFile);

      // withMax should reject large files
      expect(() => withMax.parse(largeFile)).toThrow();
      expect(withMax.parse(validFile)).toBe(validFile);

      // withMime should reject wrong types
      expect(() => withMime.parse(wrongType)).toThrow();
      expect(() => withMime.parse(validFile)).toThrow(); // text/plain should be rejected
      expect(withMime.parse(validJpeg)).toBe(validJpeg); // image/jpeg should be accepted
    });
  });

  describe('integration with other validators', () => {
    it('should work in object schemas', () => {
      const schema = v.object({
        avatar: v.file().mime(['image/jpeg', 'image/png']).max(5242880) // 5MB
      });

      const validFile = new MockFile(1024, 'image/jpeg', 'avatar.jpg');
      const tooLarge = new MockFile(10485760, 'image/jpeg', 'huge.jpg');
      const wrongType = new MockFile(1024, 'application/pdf', 'doc.pdf');

      expect(schema.parse({ avatar: validFile })).toEqual({ avatar: validFile });
      expect(() => schema.parse({ avatar: tooLarge })).toThrow();
      expect(() => schema.parse({ avatar: wrongType })).toThrow();
    });

    it('should work in arrays', () => {
      const schema = v.array(
        v.file().mime(['image/jpeg', 'image/png']).max(1048576)
      );

      const file1 = new MockFile(1024, 'image/jpeg', 'photo1.jpg');
      const file2 = new MockFile(2048, 'image/png', 'photo2.png');
      const tooLarge = new MockFile(2097152, 'image/jpeg', 'huge.jpg');

      expect(schema.parse([file1, file2])).toEqual([file1, file2]);
      expect(() => schema.parse([file1, tooLarge])).toThrow();
    });
  });

  describe('real-world use cases', () => {
    it('should validate profile picture upload', () => {
      const profilePicSchema = v.file()
        .mime(['image/jpeg', 'image/png', 'image/webp'])
        .min(1024) // At least 1KB
        .max(5242880); // At most 5MB

      const validPic = new MockFile(256000, 'image/jpeg', 'profile.jpg');
      const tooSmall = new MockFile(512, 'image/jpeg', 'tiny.jpg');
      const tooLarge = new MockFile(10485760, 'image/jpeg', 'huge.jpg');
      const wrongFormat = new MockFile(256000, 'image/gif', 'animated.gif');

      expect(profilePicSchema.parse(validPic)).toBe(validPic);
      expect(() => profilePicSchema.parse(tooSmall)).toThrow(/at least 1024 bytes/);
      expect(() => profilePicSchema.parse(tooLarge)).toThrow(/not exceed 5242880 bytes/);
      expect(() => profilePicSchema.parse(wrongFormat)).toThrow(/Invalid file type/);
    });

    it('should validate document upload', () => {
      const documentSchema = v.file()
        .mime(['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
        .max(10485760); // 10MB max

      const validPdf = new MockFile(512000, 'application/pdf', 'document.pdf');
      const validDoc = new MockFile(256000, 'application/msword', 'document.doc');
      const wrongType = new MockFile(512000, 'image/jpeg', 'photo.jpg');

      expect(documentSchema.parse(validPdf)).toBe(validPdf);
      expect(documentSchema.parse(validDoc)).toBe(validDoc);
      expect(() => documentSchema.parse(wrongType)).toThrow(/Invalid file type/);
    });
  });

  describe('edge cases', () => {
    it('should handle zero-size files', () => {
      const schema = v.file();
      const emptyFile = new MockFile(0, 'text/plain', 'empty.txt');

      expect(schema.parse(emptyFile)).toBe(emptyFile);
    });

    it('should handle files with no MIME type', () => {
      const schema = v.file();
      const noMimeFile = new MockFile(1024, '', 'unknown');

      expect(schema.parse(noMimeFile)).toBe(noMimeFile);
    });

    it('should handle very large file sizes', () => {
      const schema = v.file().max(1073741824); // 1GB
      const largeFile = new MockFile(1073741824, 'application/octet-stream', 'large.bin');

      expect(schema.parse(largeFile)).toBe(largeFile);
    });
  });
});
