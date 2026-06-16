import { VldBase, ParseResult, VLD_VALIDATOR_TYPES } from './base';
import { getMessages } from '../locales/runtime';
import { VldError } from '../errors-core';

/**
 * File validation check types
 */
type FileCheck =
  | { type: 'min'; value: number; message: string | undefined }
  | { type: 'max'; value: number; message: string | undefined }
  | { type: 'mime'; value: string[]; message: string | undefined };

function createFileError(message: string): VldError {
  return new VldError([{ code: 'invalid_type', path: [], message }]);
}

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
    super(VLD_VALIDATOR_TYPES.FILE);
  }

  /**
   * Create a new file validator
   */
  static create(): VldFile {
    return new VldFile();
  }

  private isFileLike(value: unknown): value is VldFileValue {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    if (typeof File !== 'undefined' && value instanceof File) {
      return true;
    }

    return 'size' in value && 'type' in value;
  }

  /**
   * Parse and validate a file value
   */
  parse(value: unknown): VldFileValue {
    if (this.isFileLike(value)) {
      return this.parseKnownFile(value);
    }

    if (typeof File === 'undefined') {
      throw new Error(getMessages().fileNotSupported || 'File API not supported in this environment');
    }

    throw new Error(getMessages().invalidFile || 'Expected a File object');
  }

  /**
   * Parse a value that has already passed the file-like type guard.
   * @internal Used by object validators to avoid duplicate hot-path checks.
   */
  parseKnownFile(value: VldFileValue): VldFileValue {
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
      return { success: false, error: createFileError((error as Error).message) };
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
