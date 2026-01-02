import { VldBase, ParseResult } from './base';
import { getMessages } from '../locales';

/**
 * File validation check types
 */
type FileCheck =
  | { type: 'min'; value: number; message?: string }
  | { type: 'max'; value: number; message?: string }
  | { type: 'mime'; value: string[]; message?: string };

/**
 * File representation for validation
 * In browsers: File object
 * In Node.js: Object with size and type properties
 */
export type VldFileValue = File | { size: number; type: string; name?: string };

/**
 * Immutable file validator for file uploads
 * Supports size and MIME type validation
 */
export class VldFile extends VldBase<unknown, VldFileValue> {
  private constructor(
    private readonly checks: readonly FileCheck[] = []
  ) {
    super();
  }

  /**
   * Create a new file validator
   */
  static create(): VldFile {
    return new VldFile();
  }

  /**
   * Parse and validate a file value
   */
  parse(value: unknown): VldFileValue {
    // Check if File API is supported
    const FileSupported = typeof File !== 'undefined';

    if (!FileSupported) {
      throw new Error(getMessages().fileNotSupported || 'File API not supported in this environment');
    }

    // Check if value is a File object
    if (!(value instanceof File)) {
      // Allow plain object with size and type for Node.js compatibility
      if (
        typeof value === 'object' &&
        value !== null &&
        'size' in value &&
        'type' in value
      ) {
        const fileObj = value as { size: number; type: string; name?: string };
        return this.runChecks(fileObj);
      }

      throw new Error(getMessages().invalidFile || 'Expected a File object');
    }

    return this.runChecks(value);
  }

  /**
   * Run all validation checks on the file
   */
  private runChecks(file: VldFileValue): VldFileValue {
    const msgs = getMessages();

    for (const check of this.checks) {
      switch (check.type) {
        case 'min':
          if (file.size < check.value) {
            throw new Error(
              check.message ||
              (msgs.fileMinSize?.(check.value) || `File size must be at least ${check.value} bytes`)
            );
          }
          break;

        case 'max':
          if (file.size > check.value) {
            throw new Error(
              check.message ||
              (msgs.fileMaxSize?.(check.value) || `File size must not exceed ${check.value} bytes`)
            );
          }
          break;

        case 'mime':
          if (!check.value.includes(file.type)) {
            throw new Error(
              check.message ||
              (msgs.fileMimeType?.(check.value) || `Invalid file type. Expected: ${check.value.join(', ')}`)
            );
          }
          break;
      }
    }

    return file;
  }

  /**
   * Safely parse and validate a file value
   */
  safeParse(value: unknown): ParseResult<VldFileValue> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Set minimum file size in bytes
   */
  min(bytes: number, message?: string): VldFile {
    return new VldFile([...this.checks, { type: 'min', value: bytes, message }]);
  }

  /**
   * Set maximum file size in bytes
   */
  max(bytes: number, message?: string): VldFile {
    return new VldFile([...this.checks, { type: 'max', value: bytes, message }]);
  }

  /**
   * Set allowed MIME types
   */
  mime(types: string | string[], message?: string): VldFile {
    const typeArray = Array.isArray(types) ? types : [types];
    return new VldFile([...this.checks, { type: 'mime', value: typeArray, message }]);
  }

  /**
   * Set both minimum and maximum file size
   */
  size(min: number, max: number, message?: string): VldFile {
    return this.min(min, message).max(max, message);
  }
}

/**
 * Helper function to create file validators
 * Usage: v.file().min(1024).max(10485760).mime(['image/jpeg', 'image/png'])
 */
export function file(): VldFile {
  return VldFile.create();
}
