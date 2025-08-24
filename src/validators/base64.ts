import { VldBase, ParseResult } from './base';
import { VldError, createIssue } from '../errors';
import { getMessages } from '../locales';

/**
 * Base64 string validator
 */
export class VldBase64 extends VldBase<string, string> {
  private static readonly BASE64_REGEX = /^[A-Za-z0-9+/]*={0,2}$/;
  private static readonly BASE64_URL_REGEX = /^[A-Za-z0-9_-]*={0,2}$/;
  
  private readonly urlSafe: boolean;
  
  constructor(urlSafe = false) {
    super();
    this.urlSafe = urlSafe;
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
    
    // Check if it's a valid base64 string
    const regex = this.urlSafe ? VldBase64.BASE64_URL_REGEX : VldBase64.BASE64_REGEX;
    
    // Check basic format
    if (!regex.test(value)) {
      return {
        success: false,
        error: new VldError([
          createIssue('custom', [], getMessages().invalidBase64)
        ])
      };
    }
    
    // Check length is multiple of 4 (after padding)
    if (value.length % 4 !== 0) {
      return {
        success: false,
        error: new VldError([
          createIssue('custom', [], getMessages().invalidBase64)
        ])
      };
    }
    
    return { success: true, data: value };
  }
  
  /**
   * Create a URL-safe base64 validator
   */
  urlSafeMode(): VldBase64 {
    return new VldBase64(true);
  }
  
  static create(urlSafe = false): VldBase64 {
    return new VldBase64(urlSafe);
  }
}