import { VldBase, ParseResult } from './base';
import { getMessages } from '../locales';
import { isValidIPv6 } from '../utils/ip-validation';

/**
 * Ultra-fast email validation using simplified regex for maximum performance
 */
const FAST_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Pre-compiled regex patterns for common validations
 * Optimized to prevent ReDoS attacks
 */
const REGEX_PATTERNS = {
  email: FAST_EMAIL_REGEX, // Use simplified fast regex
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/,  // Fixed unnecessary escapes
  ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  // Simplified IPv6 regex to prevent ReDoS - splits into multiple checks for performance
  ipv6Basic: /^[0-9a-fA-F:]+$/,
};

// BUG-NEW-001 FIX: IPv6 validation moved to shared utility (src/utils/ip-validation.ts)
// to eliminate code duplication between string.ts and coercion/string.ts

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
 * Pre-compiled validator function type
 */
type CompiledStringValidator = (value: string) => { success: true; value: string } | { success: false; error: string };

/**
 * Immutable string validator with chainable methods
 * Features pre-compiled validation functions for maximum performance
 */
export class VldString extends VldBase<string, string> {
  protected readonly config: StringValidatorConfig;
  // Cache for pre-compiled validation function
  private _compiledValidator: CompiledStringValidator | null = null;

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
   * Compile all transforms and checks into a single optimized function
   * This eliminates loop overhead and enables better JIT optimization
   */
  private _compileValidator(): CompiledStringValidator {
    const transforms = this.config.transforms;
    const checks = this.config.checks;
    const errorMessage = this.config.errorMessage || getMessages().invalidString;

    // Fast path: no transforms or checks
    if (transforms.length === 0 && checks.length === 0) {
      return (value: string) => ({ success: true, value });
    }

    // Fast path: only transforms, no checks
    if (checks.length === 0) {
      switch (transforms.length) {
        case 1:
          return (value: string) => ({ success: true, value: transforms[0](value) });
        case 2:
          return (value: string) => ({ success: true, value: transforms[1](transforms[0](value)) });
        case 3:
          return (value: string) => ({ success: true, value: transforms[2](transforms[1](transforms[0](value))) });
        default:
          return (value: string) => {
            let result = value;
            for (let i = 0; i < transforms.length; i++) {
              result = transforms[i](result);
            }
            return { success: true, value: result };
          };
      }
    }

    // Fast path: only checks, no transforms
    if (transforms.length === 0) {
      switch (checks.length) {
        case 1:
          return (value: string) => {
            if (!checks[0](value)) return { success: false, error: errorMessage };
            return { success: true, value };
          };
        case 2:
          return (value: string) => {
            if (!checks[0](value) || !checks[1](value)) return { success: false, error: errorMessage };
            return { success: true, value };
          };
        case 3:
          return (value: string) => {
            if (!checks[0](value) || !checks[1](value) || !checks[2](value)) return { success: false, error: errorMessage };
            return { success: true, value };
          };
        default:
          return (value: string) => {
            for (let i = 0; i < checks.length; i++) {
              if (!checks[i](value)) return { success: false, error: errorMessage };
            }
            return { success: true, value };
          };
      }
    }

    // General case: both transforms and checks
    return (value: string) => {
      let result = value;

      // Apply transforms
      for (let i = 0; i < transforms.length; i++) {
        result = transforms[i](result);
      }

      // Apply checks
      for (let i = 0; i < checks.length; i++) {
        if (!checks[i](result)) return { success: false, error: errorMessage };
      }

      return { success: true, value: result };
    };
  }

  /**
   * Get the cached compiled validator, creating it if necessary
   */
  private _getCompiledValidator(): CompiledStringValidator {
    if (!this._compiledValidator) {
      this._compiledValidator = this._compileValidator();
    }
    return this._compiledValidator;
  }
  
  /**
   * Create a new string validator
   */
  static create(): VldString {
    return new VldString();
  }
  
  /**
   * Parse and validate a string value - ultra-optimized with pre-compiled validator
   */
  parse(value: unknown): string {
    if (typeof value !== 'string') {
      throw new Error(this.config.errorMessage || getMessages().invalidString);
    }

    // Use pre-compiled validator for maximum performance
    const result = this._getCompiledValidator()(value);

    if (!result.success) {
      throw new Error(result.error);
    }

    return result.value;
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
      checks: [...this.config.checks, (v: string) => {
        // Prevent ReDoS: Check length before regex
        if (v.length > 100) return false;
        return REGEX_PATTERNS.ipv4.test(v) || isValidIPv6(v);
      }],
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
      checks: [...this.config.checks, (v: string) => {
        // Use safe IPv6 validation to prevent ReDoS attacks
        return isValidIPv6(v);
      }],
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