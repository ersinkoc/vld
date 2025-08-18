import { VldString } from '../validators/string';
import { ParseResult } from '../validators/base';
import { getMessages } from '../locales';

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
    return new VldCoerceString({
      checks: [...this.config.checks, (v: string) => /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(v)],
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
    const ipv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
    return new VldCoerceString({
      checks: [...this.config.checks, (v: string) => ipv4.test(v) || ipv6.test(v)],
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
    const ipv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
    return new VldCoerceString({
      checks: [...this.config.checks, (v: string) => ipv6.test(v)],
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
    // If it's already a string, use parent validation directly
    if (typeof value === 'string') {
      return super.parse(value);
    }
    
    // Handle null and undefined explicitly
    if (value === null || value === undefined) {
      throw new Error(getMessages().coercionFailed('string', value));
    }
    
    // Coerce to string
    const coerced = String(value);
    
    // Use parent validation with coerced value
    return super.parse(coerced);
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