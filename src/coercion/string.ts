import { VldString } from '../validators/string';
import { ParseResult, VLD_VALIDATOR_TYPES, ensureVldError } from '../validators/base';
import { getMessages } from '../locales/runtime';

/**
 * String coercion validator that attempts to convert values to strings
 */
export class VldCoerceString extends VldString {
  protected constructor(config?: any) {
    // Pass COERCE_STRING type to base class instead of STRING
    super({ ...config, validatorType: VLD_VALIDATOR_TYPES.COERCE_STRING });
  }
  
  /**
   * Create a new coerce string validator
   */
  static override create(): VldCoerceString {
    return new VldCoerceString();
  }
  
  // Chain methods are inherited (they keep the subclass via derive());
  // these overrides only narrow the return type.
  override min(length: number, message?: string): VldCoerceString {
    return super.min(length, message) as VldCoerceString;
  }
  
  override max(length: number, message?: string): VldCoerceString {
    return super.max(length, message) as VldCoerceString;
  }
  
  override length(length: number, message?: string): VldCoerceString {
    return super.length(length, message) as VldCoerceString;
  }
  
  override email(message?: string): VldCoerceString {
    return super.email(message) as VldCoerceString;
  }
  
  override url(message?: string): VldCoerceString {
    return super.url(message) as VldCoerceString;
  }
  
  override uuid(message?: string): VldCoerceString {
    return super.uuid(message) as VldCoerceString;
  }
  
  override regex(pattern: RegExp, message?: string): VldCoerceString {
    return super.regex(pattern, message) as VldCoerceString;
  }
  
  override trim(): VldCoerceString {
    return super.trim() as VldCoerceString;
  }
  
  override toLowerCase(): VldCoerceString {
    return super.toLowerCase() as VldCoerceString;
  }
  
  override toUpperCase(): VldCoerceString {
    return super.toUpperCase() as VldCoerceString;
  }
  
  override startsWith(str: string, message?: string): VldCoerceString {
    return super.startsWith(str, message) as VldCoerceString;
  }
  
  override endsWith(str: string, message?: string): VldCoerceString {
    return super.endsWith(str, message) as VldCoerceString;
  }
  
  override includes(str: string, message?: string): VldCoerceString {
    return super.includes(str, message) as VldCoerceString;
  }
  
  override ip(message?: string): VldCoerceString {
    return super.ip(message) as VldCoerceString;
  }
  
  override ipv4(message?: string): VldCoerceString {
    return super.ipv4(message) as VldCoerceString;
  }
  
  override ipv6(message?: string): VldCoerceString {
    return super.ipv6(message) as VldCoerceString;
  }
  
  override nonempty(message?: string): VldCoerceString {
    return super.nonempty(message) as VldCoerceString;
  }
  
  /**
   * Parse and coerce a value to string
   */
  override parse(value: unknown): string {
    // If it's already a string, apply security controls first
    if (typeof value === 'string') {
      // Enforce length limits to prevent DoS
      if (value.length > 1000000) {
        throw new Error(getMessages().coercionFailed('string', value));
      }

      // Sanitize control characters for security (tab / LF / CR are content, not
      // control noise: stripping them would corrupt multi-line text)
      // eslint-disable-next-line no-control-regex -- Intentional removal of control characters for security
      const sanitized = value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

      // Use parent validation with sanitized string
      return super.parse(sanitized);
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
      // Symbols: String() matches Zod coercion semantics without throwing.
      coerced = String(value);
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

    // Sanitize control characters for security (tab / LF / CR are content, not
    // control noise: stripping them would corrupt multi-line text)
    // eslint-disable-next-line no-control-regex -- Intentional removal of control characters for security
    const sanitized = coerced.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Use parent validation with sanitized value
    return super.parse(sanitized);
  }
  
  /**
   * Safely parse and coerce a value to string
   */
  override safeParse(value: unknown): ParseResult<string> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: ensureVldError(error) };
    }
  }
}
