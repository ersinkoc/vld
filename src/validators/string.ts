import { VldBase, ParseResult } from './base';
import { getMessages } from '../locales';

/**
 * Ultra-fast email validation using simplified regex for maximum performance
 */
const FAST_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Pre-compiled regex patterns for common validations
 */
const REGEX_PATTERNS = {
  email: FAST_EMAIL_REGEX, // Use simplified fast regex
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  url: /^https?:\/\/[^\s]+$/,  // Simplified for speed
  ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  ipv6: /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/,
};

/**
 * Type for string validation check functions
 */
type StringCheck = (value: string) => boolean;

/**
 * Type for string transformation functions
 */
type StringTransform = (value: string) => string;

/**
 * Configuration for string validator
 */
interface StringValidatorConfig {
  readonly checks: ReadonlyArray<StringCheck>;
  readonly transforms: ReadonlyArray<StringTransform>;
  readonly errorMessage?: string;
}

/**
 * Immutable string validator with chainable methods
 */
export class VldString extends VldBase<string, string> {
  protected readonly config: StringValidatorConfig;
  
  /**
   * Protected constructor to allow extension while maintaining immutability
   */
  protected constructor(config?: Partial<StringValidatorConfig>) {
    super();
    this.config = {
      checks: config?.checks || [],
      transforms: config?.transforms || [],
      errorMessage: config?.errorMessage
    };
  }
  
  /**
   * Create a new string validator
   */
  static create(): VldString {
    return new VldString();
  }
  
  /**
   * Parse and validate a string value - ultra-optimized
   */
  parse(value: unknown): string {
    if (typeof value !== 'string') {
      throw new Error(this.config.errorMessage || getMessages().invalidString);
    }
    
    let result = value;
    
    // Apply transformations with optimized loop
    const transformsLength = this.config.transforms.length;
    for (let i = 0; i < transformsLength; i++) {
      result = this.config.transforms[i](result);
    }
    
    // Apply checks with optimized loop and early termination
    const checksLength = this.config.checks.length;
    for (let i = 0; i < checksLength; i++) {
      if (!this.config.checks[i](result)) {
        throw new Error(this.config.errorMessage || getMessages().invalidString);
      }
    }
    
    return result;
  }
  
  /**
   * Safely parse and validate a string value
   */
  safeParse(value: unknown): ParseResult<string> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
  
  /**
   * Create a new validator with minimum length constraint
   */
  min(length: number, message?: string): VldString {
    return new VldString({
      checks: [...this.config.checks, (v: string) => v.length >= length],
      transforms: this.config.transforms,
      errorMessage: message || getMessages().stringMin(length)
    });
  }
  
  /**
   * Create a new validator with maximum length constraint
   */
  max(length: number, message?: string): VldString {
    return new VldString({
      checks: [...this.config.checks, (v: string) => v.length <= length],
      transforms: this.config.transforms,
      errorMessage: message || getMessages().stringMax(length)
    });
  }
  
  /**
   * Create a new validator with exact length constraint
   */
  length(length: number, message?: string): VldString {
    return new VldString({
      checks: [...this.config.checks, (v: string) => v.length === length],
      transforms: this.config.transforms,
      errorMessage: message || getMessages().stringLength(length)
    });
  }
  
  /**
   * Create a new validator that checks for valid email format
   */
  email(message?: string): VldString {
    return new VldString({
      checks: [...this.config.checks, (v: string) => REGEX_PATTERNS.email.test(v)],
      transforms: this.config.transforms,
      errorMessage: message || getMessages().stringEmail
    });
  }
  
  /**
   * Create a new validator that checks for valid URL format
   */
  url(message?: string): VldString {
    return new VldString({
      checks: [...this.config.checks, (v: string) => REGEX_PATTERNS.url.test(v)],
      transforms: this.config.transforms,
      errorMessage: message || getMessages().stringUrl
    });
  }
  
  /**
   * Create a new validator that checks for valid UUID format
   */
  uuid(message?: string): VldString {
    return new VldString({
      checks: [...this.config.checks, (v: string) => REGEX_PATTERNS.uuid.test(v)],
      transforms: this.config.transforms,
      errorMessage: message || getMessages().stringUuid
    });
  }
  
  /**
   * Create a new validator with regex pattern matching
   */
  regex(pattern: RegExp, message?: string): VldString {
    return new VldString({
      checks: [...this.config.checks, (v: string) => pattern.test(v)],
      transforms: this.config.transforms,
      errorMessage: message || getMessages().stringRegex
    });
  }
  
  /**
   * Create a new validator that trims whitespace
   */
  trim(): VldString {
    return new VldString({
      checks: this.config.checks,
      transforms: [...this.config.transforms, (v: string) => v.trim()],
      errorMessage: this.config.errorMessage
    });
  }
  
  /**
   * Create a new validator that converts to lowercase
   */
  toLowerCase(): VldString {
    return new VldString({
      checks: this.config.checks,
      transforms: [...this.config.transforms, (v: string) => v.toLowerCase()],
      errorMessage: this.config.errorMessage
    });
  }
  
  /**
   * Create a new validator that converts to uppercase
   */
  toUpperCase(): VldString {
    return new VldString({
      checks: this.config.checks,
      transforms: [...this.config.transforms, (v: string) => v.toUpperCase()],
      errorMessage: this.config.errorMessage
    });
  }
  
  /**
   * Create a new validator that checks if string starts with a substring
   */
  startsWith(str: string, message?: string): VldString {
    return new VldString({
      checks: [...this.config.checks, (v: string) => v.startsWith(str)],
      transforms: this.config.transforms,
      errorMessage: message || getMessages().stringStartsWith(str)
    });
  }
  
  /**
   * Create a new validator that checks if string ends with a substring
   */
  endsWith(str: string, message?: string): VldString {
    return new VldString({
      checks: [...this.config.checks, (v: string) => v.endsWith(str)],
      transforms: this.config.transforms,
      errorMessage: message || getMessages().stringEndsWith(str)
    });
  }
  
  /**
   * Create a new validator that checks if string includes a substring
   */
  includes(str: string, message?: string): VldString {
    return new VldString({
      checks: [...this.config.checks, (v: string) => v.includes(str)],
      transforms: this.config.transforms,
      errorMessage: message || getMessages().stringIncludes(str)
    });
  }
  
  /**
   * Create a new validator that checks for valid IP address (v4 or v6)
   */
  ip(message?: string): VldString {
    return new VldString({
      checks: [...this.config.checks, (v: string) => REGEX_PATTERNS.ipv4.test(v) || REGEX_PATTERNS.ipv6.test(v)],
      transforms: this.config.transforms,
      errorMessage: message || getMessages().stringIp
    });
  }
  
  /**
   * Create a new validator that checks for valid IPv4 address
   */
  ipv4(message?: string): VldString {
    return new VldString({
      checks: [...this.config.checks, (v: string) => REGEX_PATTERNS.ipv4.test(v)],
      transforms: this.config.transforms,
      errorMessage: message || getMessages().stringIpv4
    });
  }
  
  /**
   * Create a new validator that checks for valid IPv6 address
   */
  ipv6(message?: string): VldString {
    return new VldString({
      checks: [...this.config.checks, (v: string) => REGEX_PATTERNS.ipv6.test(v)],
      transforms: this.config.transforms,
      errorMessage: message || getMessages().stringIpv6
    });
  }
  
  /**
   * Create a new validator that ensures string is not empty
   */
  nonempty(message?: string): VldString {
    return new VldString({
      checks: [...this.config.checks, (v: string) => v.length > 0],
      transforms: this.config.transforms,
      errorMessage: message || getMessages().stringEmpty
    });
  }
}