import { VldString } from '../validators/string';
import { ParseResult } from '../validators/base';
import { getMessages } from '../locales';
import { isValidIPv6 } from '../utils/ip-validation';

// BUG-NEW-001 FIX: IPv6 validation moved to shared utility (src/utils/ip-validation.ts)
// to eliminate code duplication between string.ts and coercion/string.ts

/**
 * String coercion validator that attempts to convert values to strings
 */
export class VldCoerceString extends VldString {
  protected constructor(config?: any) {
    super(config);
  }
  
  /**
   * Create a new coerce string validator
   */
  static create(): VldCoerceString {
    return new VldCoerceString();
  }
  
  // Override all chain methods to return VldCoerceString instances
  min(length: number, message?: string): VldCoerceString {
    return new VldCoerceString({
      checks: [...this.config.checks, (v: string) => v.length >= length],
      transforms: this.config.transforms,
      errorMessage: message || getMessages().stringMin(length)
    });
  }
  
  max(length: number, message?: string): VldCoerceString {
    return new VldCoerceString({
      checks: [...this.config.checks, (v: string) => v.length <= length],
      transforms: this.config.transforms,
      errorMessage: message || getMessages().stringMax(length)
    });
  }
  
  length(length: number, message?: string): VldCoerceString {
    return new VldCoerceString({
      checks: [...this.config.checks, (v: string) => v.length === length],
      transforms: this.config.transforms,
      errorMessage: message || getMessages().stringLength(length)
    });
  }
  
  email(message?: string): VldCoerceString {
    // BUG-007 FIX: Use simpler, ReDoS-safe regex (consistent with VldString)
    const FAST_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return new VldCoerceString({
      checks: [...this.config.checks, (v: string) => FAST_EMAIL_REGEX.test(v)],
      transforms: this.config.transforms,
      errorMessage: message || getMessages().stringEmail
    });
  }
  
  url(message?: string): VldCoerceString {
    return new VldCoerceString({
      checks: [...this.config.checks, (v: string) => /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/.test(v)],
      transforms: this.config.transforms,
      errorMessage: message || getMessages().stringUrl
    });
  }
  
  uuid(message?: string): VldCoerceString {
    return new VldCoerceString({
      checks: [...this.config.checks, (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)],
      transforms: this.config.transforms,
      errorMessage: message || getMessages().stringUuid
    });
  }
  
  regex(pattern: RegExp, message?: string): VldCoerceString {
    return new VldCoerceString({
      checks: [...this.config.checks, (v: string) => pattern.test(v)],
      transforms: this.config.transforms,
      errorMessage: message || getMessages().stringRegex
    });
  }
  
  trim(): VldCoerceString {
    return new VldCoerceString({
      checks: this.config.checks,
      transforms: [...this.config.transforms, (v: string) => v.trim()],
      errorMessage: this.config.errorMessage
    });
  }
  
  toLowerCase(): VldCoerceString {
    return new VldCoerceString({
      checks: this.config.checks,
      transforms: [...this.config.transforms, (v: string) => v.toLowerCase()],
      errorMessage: this.config.errorMessage
    });
  }
  
  toUpperCase(): VldCoerceString {
    return new VldCoerceString({
      checks: this.config.checks,
      transforms: [...this.config.transforms, (v: string) => v.toUpperCase()],
      errorMessage: this.config.errorMessage
    });
  }
  
  startsWith(str: string, message?: string): VldCoerceString {
    return new VldCoerceString({
      checks: [...this.config.checks, (v: string) => v.startsWith(str)],
      transforms: this.config.transforms,
      errorMessage: message || getMessages().stringStartsWith(str)
    });
  }
  
  endsWith(str: string, message?: string): VldCoerceString {
    return new VldCoerceString({
      checks: [...this.config.checks, (v: string) => v.endsWith(str)],
      transforms: this.config.transforms,
      errorMessage: message || getMessages().stringEndsWith(str)
    });
  }
  
  includes(str: string, message?: string): VldCoerceString {
    return new VldCoerceString({
      checks: [...this.config.checks, (v: string) => v.includes(str)],
      transforms: this.config.transforms,
      errorMessage: message || getMessages().stringIncludes(str)
    });
  }
  
  ip(message?: string): VldCoerceString {
    const ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return new VldCoerceString({
      checks: [...this.config.checks, (v: string) => {
        // Prevent ReDoS: Check length before validation
        if (v.length > 100) return false;
        return ipv4.test(v) || isValidIPv6(v);
      }],
      transforms: this.config.transforms,
      errorMessage: message || getMessages().stringIp
    });
  }
  
  ipv4(message?: string): VldCoerceString {
    return new VldCoerceString({
      checks: [...this.config.checks, (v: string) => /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(v)],
      transforms: this.config.transforms,
      errorMessage: message || getMessages().stringIpv4
    });
  }
  
  ipv6(message?: string): VldCoerceString {
    return new VldCoerceString({
      checks: [...this.config.checks, (v: string) => {
        // Use safe IPv6 validation to prevent ReDoS attacks
        return isValidIPv6(v);
      }],
      transforms: this.config.transforms,
      errorMessage: message || getMessages().stringIpv6
    });
  }
  
  nonempty(message?: string): VldCoerceString {
    return new VldCoerceString({
      checks: [...this.config.checks, (v: string) => v.length > 0],
      transforms: this.config.transforms,
      errorMessage: message || getMessages().stringEmpty
    });
  }
  
  /**
   * Parse and coerce a value to string
   */
  parse(value: unknown): string {
    // If it's already a string, apply security controls first
    if (typeof value === 'string') {
      // Enforce length limits to prevent DoS
      if (value.length > 1000000) {
        throw new Error(getMessages().coercionFailed('string', value));
      }

      // Sanitize control characters for security
      // Remove characters that could cause issues in logs, databases, or UI
      // eslint-disable-next-line no-control-regex -- Intentional removal of control characters for security
      const sanitized = value.replace(/[\x00-\x1F\x7F]/g, '');

      // Use parent validation with sanitized string
      return super.parse(sanitized);
    }

    // Handle null and undefined explicitly
    if (value === null || value === undefined) {
      throw new Error(getMessages().coercionFailed('string', value));
    }

    // Safe type coercion with security measures
    let coerced: string;

    if (typeof value === 'number') {
      // Numbers: safe conversion
      coerced = String(value);
    } else if (typeof value === 'boolean') {
      // Booleans: safe conversion
      coerced = value ? 'true' : 'false';
    } else if (typeof value === 'bigint') {
      // BigInt: safe conversion
      coerced = value.toString();
    } else if (typeof value === 'symbol') {
      // Symbols: explicit error to prevent potential issues
      throw new Error(getMessages().coercionFailed('string', value));
    } else if (typeof value === 'object') {
      // Objects: only allow specific safe object types
      if (value instanceof Date) {
        // Dates: convert to ISO string
        coerced = value.toISOString();
      } else if (Array.isArray(value)) {
        // Arrays: convert to comma-separated string (original behavior)
        coerced = value.join(',');
      } else if (value instanceof RegExp) {
        // RegExp: convert to string representation
        coerced = value.toString();
      } else if (value instanceof Error) {
        // Errors: use message property (safe)
        coerced = value.message || value.toString();
      } else {
        // For plain objects, use the original String() behavior for backwards compatibility
        coerced = String(value);
      }
    } else {
      // Fallback for other types
      coerced = String(value);
    }

    // Apply security controls
    // Enforce length limits to prevent DoS
    if (coerced.length > 1000000) {
      throw new Error(getMessages().coercionFailed('string', value));
    }

    // Sanitize control characters for security
    // Remove characters that could cause issues in logs, databases, or UI
    // eslint-disable-next-line no-control-regex -- Intentional removal of control characters for security
    const sanitized = coerced.replace(/[\x00-\x1F\x7F]/g, '');

    // Use parent validation with sanitized value
    return super.parse(sanitized);
  }
  
  /**
   * Safely parse and coerce a value to string
   */
  safeParse(value: unknown): ParseResult<string> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}