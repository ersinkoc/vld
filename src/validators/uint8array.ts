import { VldBase, ParseResult } from './base';
import { VldError, createIssue } from '../errors';
import { getMessages } from '../locales';

/**
 * Uint8Array validator
 */
export class VldUint8Array extends VldBase<Uint8Array, Uint8Array> {
  private minLength?: number;
  private maxLength?: number;
  private exactLength?: number;
  
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
    if (this.exactLength !== undefined && value.length !== this.exactLength) {
      return {
        success: false,
        error: new VldError([
          createIssue('custom', [], getMessages().uint8ArrayExactLength.replace('{length}', this.exactLength.toString()))
        ])
      };
    }
    
    // Check minimum length
    if (this.minLength !== undefined && value.length < this.minLength) {
      return {
        success: false,
        error: new VldError([
          createIssue('custom', [], getMessages().uint8ArrayMinLength.replace('{min}', this.minLength.toString()))
        ])
      };
    }
    
    // Check maximum length
    if (this.maxLength !== undefined && value.length > this.maxLength) {
      return {
        success: false,
        error: new VldError([
          createIssue('custom', [], getMessages().uint8ArrayMaxLength.replace('{max}', this.maxLength.toString()))
        ])
      };
    }
    
    return { success: true, data: value };
  }
  
  /**
   * Set minimum byte length
   */
  min(length: number): VldUint8Array {
    const validator = new VldUint8Array();
    validator.minLength = length;
    validator.maxLength = this.maxLength;
    validator.exactLength = this.exactLength;
    return validator;
  }
  
  /**
   * Set maximum byte length
   */
  max(length: number): VldUint8Array {
    const validator = new VldUint8Array();
    validator.minLength = this.minLength;
    validator.maxLength = length;
    validator.exactLength = this.exactLength;
    return validator;
  }
  
  /**
   * Set exact byte length
   */
  length(length: number): VldUint8Array {
    const validator = new VldUint8Array();
    validator.minLength = this.minLength;
    validator.maxLength = this.maxLength;
    validator.exactLength = length;
    return validator;
  }
  
  static create(): VldUint8Array {
    return new VldUint8Array();
  }
}