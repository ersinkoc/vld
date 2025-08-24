import { VldBase, ParseResult } from './base';
import { VldError, createIssue } from '../errors';
import { getMessages } from '../locales';

/**
 * Hexadecimal string validator
 */
export class VldHex extends VldBase<string, string> {
  private static readonly HEX_REGEX = /^[0-9a-fA-F]+$/;
  
  private readonly lowercase: boolean;
  
  constructor(lowercase = false) {
    super();
    this.lowercase = lowercase;
  }
  
  parse(value: unknown): string {
    const result = this.safeParse(value);
    if (!result.success) {
      throw result.error;
    }
    return result.data;
  }
  
  safeParse(value: unknown): ParseResult<string> {
    if (typeof value !== 'string') {
      return {
        success: false,
        error: new VldError([
          createIssue('invalid_type', [], getMessages().expectedString)
        ])
      };
    }
    
    // Check if it's a valid hex string
    if (!VldHex.HEX_REGEX.test(value)) {
      return {
        success: false,
        error: new VldError([
          createIssue('custom', [], getMessages().invalidHex)
        ])
      };
    }
    
    // Check if even length (full bytes)
    if (value.length % 2 !== 0) {
      return {
        success: false,
        error: new VldError([
          createIssue('custom', [], getMessages().invalidHex)
        ])
      };
    }
    
    // Normalize case if required
    const normalizedValue = this.lowercase ? value.toLowerCase() : value;
    
    return { success: true, data: normalizedValue };
  }
  
  /**
   * Require lowercase hex characters
   */
  lowercaseMode(): VldHex {
    return new VldHex(true);
  }
  
  static create(lowercase = false): VldHex {
    return new VldHex(lowercase);
  }
}