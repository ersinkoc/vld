import { VldBase, ParseResult } from './base';
import { VldError, createIssue } from '../errors';
import { getMessages } from '../locales';

/**
 * Configuration for Uint8Array validator
 * BUG-NEW-010 FIX: Use config object pattern for immutability
 */
interface Uint8ArrayValidatorConfig {
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly exactLength?: number;
}

/**
 * Uint8Array validator with immutable configuration
 * BUG-NEW-010 FIX: Refactored to follow immutability pattern
 */
export class VldUint8Array extends VldBase<Uint8Array, Uint8Array> {
  private readonly config: Uint8ArrayValidatorConfig;

  /**
   * Protected constructor to maintain immutability
   */
  protected constructor(config?: Uint8ArrayValidatorConfig) {
    super();
    this.config = config || {};
  }

  parse(value: unknown): Uint8Array {
    const result = this.safeParse(value);
    if (!result.success) {
      throw result.error;
    }
    return result.data;
  }

  safeParse(value: unknown): ParseResult<Uint8Array> {
    if (!(value instanceof Uint8Array)) {
      return {
        success: false,
        error: new VldError([
          createIssue('invalid_type', [], getMessages().expectedUint8Array)
        ])
      };
    }

    // Check exact length if specified
    if (this.config.exactLength !== undefined && value.length !== this.config.exactLength) {
      return {
        success: false,
        error: new VldError([
          createIssue('custom', [], getMessages().uint8ArrayExactLength(this.config.exactLength))
        ])
      };
    }

    // Check minimum length
    if (this.config.minLength !== undefined && value.length < this.config.minLength) {
      return {
        success: false,
        error: new VldError([
          createIssue('custom', [], getMessages().uint8ArrayMinLength(this.config.minLength))
        ])
      };
    }

    // Check maximum length
    if (this.config.maxLength !== undefined && value.length > this.config.maxLength) {
      return {
        success: false,
        error: new VldError([
          createIssue('custom', [], getMessages().uint8ArrayMaxLength(this.config.maxLength))
        ])
      };
    }

    return { success: true, data: value };
  }

  /**
   * Set minimum byte length
   * Returns new immutable validator instance
   */
  min(length: number): VldUint8Array {
    return new VldUint8Array({
      ...this.config,
      minLength: length
    });
  }

  /**
   * Set maximum byte length
   * Returns new immutable validator instance
   */
  max(length: number): VldUint8Array {
    return new VldUint8Array({
      ...this.config,
      maxLength: length
    });
  }

  /**
   * Set exact byte length
   * Returns new immutable validator instance
   * Clears min/max when setting exact length
   */
  length(length: number): VldUint8Array {
    return new VldUint8Array({
      exactLength: length,
      // Clear min/max when exact length is set
      minLength: undefined,
      maxLength: undefined
    });
  }

  static create(): VldUint8Array {
    return new VldUint8Array();
  }
}
