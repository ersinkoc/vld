import { VldBase, ParseResult, VLD_VALIDATOR_TYPES, ValidatorType, type ErrorParam, resolveErrorMessage } from './base';
import { getMessages } from '../locales/runtime';
import { isValidIPv6 } from '../utils/ip-validation';
import { VldError } from '../errors-core';

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

interface StringJSONSchemaHints {
  minLength?: number;
  maxLength?: number;
  exactLength?: number;
  format?: string;
  pattern?: string;
}

/**
 * Configuration for string validator
 */
interface StringValidatorConfig {
  readonly checks: ReadonlyArray<StringCheck>;
  readonly transforms: ReadonlyArray<StringTransform>;
  readonly errorMessage: string | undefined;
  readonly validatorType?: ValidatorType;
  readonly jsonSchema: StringJSONSchemaHints | undefined;
}

/**
 * Pre-compiled validator function type
 */
type CompiledStringValidator = (value: string) => { success: true; value: string } | { success: false; error: string };

function createStringError(message: string): VldError {
  return new VldError([{ code: 'invalid_string', path: [], message }]);
}

/**
 * Immutable string validator with chainable methods
 * Features pre-compiled validation functions for maximum performance
 */
export class VldString extends VldBase<string, string> {
  protected readonly config: StringValidatorConfig;
  private readonly _checks: ReadonlyArray<StringCheck>;
  private readonly _transforms: ReadonlyArray<StringTransform>;
  private readonly _isSimple: boolean;
  // Cache for pre-compiled validation function
  private _compiledValidator: CompiledStringValidator | null = null;

  /**
   * Protected constructor to allow extension while maintaining immutability
   */
  protected constructor(config?: Partial<StringValidatorConfig>) {
    // Use config.validatorType if provided (for coercion validators), otherwise default to STRING
    super(config?.validatorType || VLD_VALIDATOR_TYPES.STRING);
    this.config = {
      checks: config?.checks || [],
      transforms: config?.transforms || [],
      errorMessage: config?.errorMessage,
      jsonSchema: config?.jsonSchema
    };
    this._checks = this.config.checks;
    this._transforms = this.config.transforms;
    this._isSimple = this._checks.length === 0 && this._transforms.length === 0;
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
          return (value: string) => ({ success: true, value: transforms[0]!(value) });
        case 2:
          return (value: string) => ({ success: true, value: transforms[1]!(transforms[0]!(value)) });
        case 3:
          return (value: string) => ({ success: true, value: transforms[2]!(transforms[1]!(transforms[0]!(value))) });
        default:
          return (value: string) => {
            let result = value;
            for (let i = 0; i < transforms.length; i++) {
              result = transforms[i]!(result);
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
            if (!checks[0]!(value)) return { success: false, error: errorMessage };
            return { success: true, value };
          };
        case 2:
          return (value: string) => {
            if (!checks[0]!(value) || !checks[1]!(value)) return { success: false, error: errorMessage };
            return { success: true, value };
          };
        case 3:
          return (value: string) => {
            if (!checks[0]!(value) || !checks[1]!(value) || !checks[2]!(value)) return { success: false, error: errorMessage };
            return { success: true, value };
          };
        default:
          return (value: string) => {
            for (let i = 0; i < checks.length; i++) {
              if (!checks[i]!(value)) return { success: false, error: errorMessage };
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
        result = transforms[i]!(result);
      }

      // Apply checks
      for (let i = 0; i < checks.length; i++) {
        if (!checks[i]!(result)) return { success: false, error: errorMessage };
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
   * Returns true if this is a simple string validator with no transforms or checks
   * Used by VldObject for optimized fast-path dispatch
   */
  get isSimple(): boolean {
    return this._isSimple;
  }
  
  /**
   * Create a new string validator
   */
  static create(): VldString {
    return new VldString();
  }
  
  /**
   * Parse and validate a string value without allocating intermediate result objects.
   */
  parse(value: unknown): string {
    if (typeof value !== 'string') {
      throw new Error(this.config.errorMessage || getMessages().invalidString);
    }

    if (this._isSimple) {
      return value;
    }

    return this.parseKnownString(value);
  }

  /**
   * Parse a value that has already passed the string type guard.
   * @internal Used by object validators to avoid duplicate hot-path checks.
   */
  parseKnownString(value: string): string {
    if (this._isSimple) {
      return value;
    }

    const transforms = this._transforms;
    const checks = this._checks;
    let result = value;

    switch (transforms.length) {
      case 0:
        break;
      case 1:
        result = transforms[0]!(result);
        break;
      case 2:
        result = transforms[1]!(transforms[0]!(result));
        break;
      case 3:
        result = transforms[2]!(transforms[1]!(transforms[0]!(result)));
        break;
      default:
        for (let i = 0; i < transforms.length; i++) {
          result = transforms[i]!(result);
        }
        break;
    }

    switch (checks.length) {
      case 0:
        return result;
      case 1:
        if (checks[0]!(result)) return result;
        break;
      case 2:
        if (checks[0]!(result) && checks[1]!(result)) return result;
        break;
      case 3:
        if (checks[0]!(result) && checks[1]!(result) && checks[2]!(result)) return result;
        break;
      default:
        for (let i = 0; i < checks.length; i++) {
          if (!checks[i]!(result)) {
            throw new Error(this.config.errorMessage || getMessages().invalidString);
          }
        }
        return result;
    }

    throw new Error(this.config.errorMessage || getMessages().invalidString);
  }
  
  /**
   * Safely parse and validate a string value
   */
  safeParse(value: unknown): ParseResult<string> {
    if (typeof value !== 'string') {
      return {
        success: false,
        error: createStringError(this.config.errorMessage || getMessages().invalidString)
      };
    }

    if (this._isSimple) {
      return { success: true, data: value };
    }

    try {
      const result = this._getCompiledValidator()(value);
      if (!result.success) {
        return { success: false, error: createStringError(result.error) };
      }
      return { success: true, data: result.value };
    } catch (error) {
      return { success: false, error: createStringError((error as Error).message) };
    }
  }
  
  /**
   * Create a new validator with minimum length constraint
   */
  min(length: number, message?: ErrorParam): VldString {
    return new VldString({
      checks: [...this.config.checks, (v: string) => v.length >= length],
      transforms: this.config.transforms,
      errorMessage: resolveErrorMessage(message, getMessages().stringMin(length)),
      jsonSchema: { ...this.config.jsonSchema, minLength: length }
    });
  }
  
  /**
   * Create a new validator with maximum length constraint
   */
  max(length: number, message?: ErrorParam): VldString {
    return new VldString({
      checks: [...this.config.checks, (v: string) => v.length <= length],
      transforms: this.config.transforms,
      errorMessage: resolveErrorMessage(message, getMessages().stringMax(length)),
      jsonSchema: { ...this.config.jsonSchema, maxLength: length }
    });
  }
  
  /**
   * Create a new validator with exact length constraint
   */
  length(length: number, message?: ErrorParam): VldString {
    return new VldString({
      checks: [...this.config.checks, (v: string) => v.length === length],
      transforms: this.config.transforms,
      errorMessage: resolveErrorMessage(message, getMessages().stringLength(length)),
      jsonSchema: { ...this.config.jsonSchema, exactLength: length }
    });
  }
  
  /**
   * Create a new validator that checks for valid email format
   */
  email(message?: ErrorParam): VldString {
    return new VldString({
      checks: [...this.config.checks, (v: string) => REGEX_PATTERNS.email.test(v)],
      transforms: this.config.transforms,
      errorMessage: resolveErrorMessage(message, getMessages().stringEmail),
      jsonSchema: { ...this.config.jsonSchema, format: 'email' }
    });
  }
  
  /**
   * Create a new validator that checks for valid URL format
   */
  url(message?: ErrorParam): VldString {
    return new VldString({
      checks: [...this.config.checks, (v: string) => REGEX_PATTERNS.url.test(v)],
      transforms: this.config.transforms,
      errorMessage: resolveErrorMessage(message, getMessages().stringUrl),
      jsonSchema: { ...this.config.jsonSchema, format: 'uri' }
    });
  }
  
  /**
   * Create a new validator that checks for valid UUID format
   */
  uuid(message?: ErrorParam): VldString {
    return new VldString({
      checks: [...this.config.checks, (v: string) => REGEX_PATTERNS.uuid.test(v)],
      transforms: this.config.transforms,
      errorMessage: resolveErrorMessage(message, getMessages().stringUuid),
      jsonSchema: { ...this.config.jsonSchema, format: 'uuid' }
    });
  }
  
  /**
   * Create a new validator with regex pattern matching
   */
  regex(pattern: RegExp, message?: ErrorParam): VldString {
    return new VldString({
      checks: [...this.config.checks, (v: string) => pattern.test(v)],
      transforms: this.config.transforms,
      errorMessage: resolveErrorMessage(message, getMessages().stringRegex),
      jsonSchema: { ...this.config.jsonSchema, pattern: pattern.source }
    });
  }
  
  /**
   * Create a new validator that trims whitespace
   */
  trim(): VldString {
    return new VldString({
      checks: this.config.checks,
      transforms: [...this.config.transforms, (v: string) => v.trim()],
      errorMessage: this.config.errorMessage,
      jsonSchema: this.config.jsonSchema
    });
  }
  
  /**
   * Create a new validator that converts to lowercase
   */
  toLowerCase(): VldString {
    return new VldString({
      checks: this.config.checks,
      transforms: [...this.config.transforms, (v: string) => v.toLowerCase()],
      errorMessage: this.config.errorMessage,
      jsonSchema: this.config.jsonSchema
    });
  }
  
  /**
   * Create a new validator that converts to uppercase
   */
  toUpperCase(): VldString {
    return new VldString({
      checks: this.config.checks,
      transforms: [...this.config.transforms, (v: string) => v.toUpperCase()],
      errorMessage: this.config.errorMessage,
      jsonSchema: this.config.jsonSchema
    });
  }
  
  /**
   * Create a new validator that checks if string starts with a substring
   */
  startsWith(str: string, message?: ErrorParam): VldString {
    return new VldString({
      checks: [...this.config.checks, (v: string) => v.startsWith(str)],
      transforms: this.config.transforms,
      errorMessage: resolveErrorMessage(message, getMessages().stringStartsWith(str)),
      jsonSchema: this.config.jsonSchema
    });
  }
  
  /**
   * Create a new validator that checks if string ends with a substring
   */
  endsWith(str: string, message?: ErrorParam): VldString {
    return new VldString({
      checks: [...this.config.checks, (v: string) => v.endsWith(str)],
      transforms: this.config.transforms,
      errorMessage: resolveErrorMessage(message, getMessages().stringEndsWith(str)),
      jsonSchema: this.config.jsonSchema
    });
  }
  
  /**
   * Create a new validator that checks if string includes a substring
   */
  includes(str: string, message?: ErrorParam): VldString {
    return new VldString({
      checks: [...this.config.checks, (v: string) => v.includes(str)],
      transforms: this.config.transforms,
      errorMessage: resolveErrorMessage(message, getMessages().stringIncludes(str)),
      jsonSchema: this.config.jsonSchema
    });
  }
  
  /**
   * Create a new validator that checks for valid IP address (v4 or v6)
   */
  ip(message?: ErrorParam): VldString {
    return new VldString({
      checks: [...this.config.checks, (v: string) => {
        // Prevent ReDoS: Check length before regex
        if (v.length > 100) return false;
        return REGEX_PATTERNS.ipv4.test(v) || isValidIPv6(v);
      }],
      transforms: this.config.transforms,
      errorMessage: resolveErrorMessage(message, getMessages().stringIp),
      jsonSchema: { ...this.config.jsonSchema, format: 'ip' }
    });
  }
  
  /**
   * Create a new validator that checks for valid IPv4 address
   */
  ipv4(message?: ErrorParam): VldString {
    return new VldString({
      checks: [...this.config.checks, (v: string) => REGEX_PATTERNS.ipv4.test(v)],
      transforms: this.config.transforms,
      errorMessage: resolveErrorMessage(message, getMessages().stringIpv4),
      jsonSchema: { ...this.config.jsonSchema, format: 'ipv4' }
    });
  }
  
  /**
   * Create a new validator that checks for valid IPv6 address
   */
  ipv6(message?: ErrorParam): VldString {
    return new VldString({
      checks: [...this.config.checks, (v: string) => {
        // Use safe IPv6 validation to prevent ReDoS attacks
        return isValidIPv6(v);
      }],
      transforms: this.config.transforms,
      errorMessage: resolveErrorMessage(message, getMessages().stringIpv6),
      jsonSchema: { ...this.config.jsonSchema, format: 'ipv6' }
    });
  }
  
  /**
   * Create a new validator that ensures string is not empty
   */
  nonempty(message?: ErrorParam): VldString {
    return new VldString({
      checks: [...this.config.checks, (v: string) => v.length > 0],
      transforms: this.config.transforms,
      errorMessage: resolveErrorMessage(message, getMessages().stringEmpty),
      jsonSchema: { ...this.config.jsonSchema, minLength: Math.max(this.config.jsonSchema?.minLength || 0, 1) }
    });
  }
}
