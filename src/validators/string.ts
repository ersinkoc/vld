import { VldBase, ParseResult, VLD_VALIDATOR_TYPES, ValidatorType, type ErrorParam, resolveErrorMessage } from './base';
import { getMessages } from '../locales/runtime';
import { isValidIPv6 } from '../utils/ip-validation';
import { VldError, getTypeName, createInvalidTypeIssue, type VldIssue } from '../errors-core';

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
  uuidv4: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  uuidv6: /^[0-9a-f]{8}-[0-9a-f]{4}-6[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  uuidv7: /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  emoji: /^(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F)(?:\u200D(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F))*$/u,
  base64: /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/,
  base64url: /^[A-Za-z0-9_-]*$/,
  jwt: /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/,
  nanoid: /^[A-Za-z0-9_-]{21}$/,
  cuid: /^c[^\s-]{8,}$/i,
  cuid2: /^[0-9a-z]+$/,
  ulid: /^[0-9A-HJKMNP-TV-Z]{26}$/,
  cidrv4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:3[0-2]|[12]?[0-9])$/,
  cidrv6: /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\/(?:12[0-8]|1[01][0-9]|[1-9]?[0-9])$|^::(?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}\/(?:12[0-8]|1[01][0-9]|[1-9]?[0-9])$|^(?:[0-9a-fA-F]{1,4}:){1,7}:\/(?:12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,
  e164: /^\+[1-9]\d{1,14}$/,
  xid: /^[A-HJKMNP-TV-Z0-9]{20}$/,
  guid: /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i,
  ksuid: /^[0-9A-Za-z]{27}$/,
  isoDate: /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/,
  isoTime: /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?$/,
  isoDateTime: /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?Z?$/,
  isoDuration: /^-?P(?!$)(?:\d+(?:\.\d+)?Y)?(?:\d+(?:\.\d+)?M)?(?:\d+(?:\.\d+)?W)?(?:\d+(?:\.\d+)?D)?(?:T(?=\d)(?:\d+(?:\.\d+)?H)?(?:\d+(?:\.\d+)?M)?(?:\d+(?:\.\d+)?S)?)?$/,
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
 * Metadata for a single string constraint, enabling Zod 4-compatible issues.
 */
interface StringCheckMeta {
  readonly kind: 'min' | 'max' | 'length' | 'format' | 'regex' | 'other';
  readonly value?: number;
  readonly format?: string;
  readonly pattern?: string;
  readonly message: string | undefined;
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
  readonly checkMetas: ReadonlyArray<StringCheckMeta> | undefined;
}

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
  private readonly _checkMetas: ReadonlyArray<StringCheckMeta> | undefined;

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
      jsonSchema: config?.jsonSchema,
      checkMetas: config?.checkMetas
    };
    this._checks = this.config.checks;
    this._transforms = this.config.transforms;
    this._isSimple = this._checks.length === 0 && this._transforms.length === 0;
    this._checkMetas = this.config.checkMetas;
  }

  /**
   * Create a new string validator
   */
  static create(): VldString {
    return new VldString();
  }

  /**
   * Returns true if this is a simple string validator with no transforms or checks
   * Used by VldObject for optimized fast-path dispatch
   */
  get isSimple(): boolean {
    return this._isSimple;
  }

  /**
   * Build the Zod 4-compatible VldIssue for a failed check at the given index.
   */
  private _createCheckIssue(meta: StringCheckMeta): VldIssue {
    switch (meta.kind) {
      case 'min':
        return {
          code: 'too_small',
          path: [],
          origin: 'string',
          minimum: meta.value!,
          inclusive: true,
          message: meta.message || `Too small: expected string to have >=${meta.value} characters`,
        };
      case 'max':
        return {
          code: 'too_big',
          path: [],
          origin: 'string',
          maximum: meta.value!,
          inclusive: true,
          message: meta.message || `Too big: expected string to have <=${meta.value} characters`,
        };
      case 'length':
        return {
          code: 'too_big',
          path: [],
          origin: 'string',
          exact: meta.value!,
          message: meta.message || `Too big: expected string to have exactly ${meta.value} characters`,
        };
      case 'format': {
        const issue: VldIssue = {
          code: 'invalid_format',
          path: [],
          origin: 'string',
          format: meta.format!,
          message: meta.message || `Invalid ${meta.format}`,
        };
        if (meta.pattern !== undefined) issue.pattern = meta.pattern;
        return issue;
      }
      case 'regex': {
        const issue: VldIssue = {
          code: 'invalid_format',
          path: [],
          origin: 'string',
          format: 'regex',
          message: meta.message || 'Invalid string: does not match pattern',
        };
        if (meta.pattern !== undefined) issue.pattern = meta.pattern;
        return issue;
      }
      default:
        return {
          code: 'custom',
          path: [],
          message: meta.message || 'Invalid string',
        };
    }
  }

  /**
   * Run all checks against a known string and return the first failing meta, or null.
   */
  private _runChecks(result: string): StringCheckMeta | null {
    const checks = this._checks;
    const metas = this._checkMetas;
    for (let i = 0; i < checks.length; i++) {
      if (!checks[i]!(result)) return metas?.[i] ?? this._fallbackMeta();
    }
    return null;
  }

  private _fallbackMeta(): StringCheckMeta {
    return { kind: 'other', message: this.config.errorMessage };
  }
  
  /**
   * Parse and validate a string value without allocating intermediate result objects.
   */
  parse(value: unknown): string {
    if (typeof value !== 'string') {
      throw new VldError([createInvalidTypeIssue('string', getTypeName(value), this.config.errorMessage)]);
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

    const failedMeta = this._runChecks(result);
    if (failedMeta) {
      throw new VldError([this._createCheckIssue(failedMeta)]);
    }
    return result;
  }
  
  /**
   * Safely parse and validate a string value
   */
  safeParse(value: unknown): ParseResult<string> {
    if (typeof value !== 'string') {
      return {
        success: false,
        error: new VldError([createInvalidTypeIssue('string', getTypeName(value), this.config.errorMessage)])
      };
    }

    if (this._isSimple) {
      return { success: true, data: value };
    }

    try {
      const result = this.parseKnownString(value);
      return { success: true, data: result };
    } catch (error) {
      if (error instanceof VldError) {
        return { success: false, error };
      }
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
      jsonSchema: { ...this.config.jsonSchema, minLength: length },
      checkMetas: [...(this.config.checkMetas ?? []), { kind: 'min', value: length, message: resolveErrorMessage(message, getMessages().stringMin(length)) }]
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
      jsonSchema: { ...this.config.jsonSchema, maxLength: length },
      checkMetas: [...(this.config.checkMetas ?? []), { kind: 'max', value: length, message: resolveErrorMessage(message, getMessages().stringMax(length)) }]
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
      jsonSchema: { ...this.config.jsonSchema, exactLength: length },
      checkMetas: [...(this.config.checkMetas ?? []), { kind: 'length', value: length, message: resolveErrorMessage(message, getMessages().stringLength(length)) }]
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
      jsonSchema: { ...this.config.jsonSchema, format: 'email' },
      checkMetas: [...(this.config.checkMetas ?? []), { kind: 'format', format: 'email', message: resolveErrorMessage(message, getMessages().stringEmail) }]
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
      jsonSchema: { ...this.config.jsonSchema, format: 'uri' },
      checkMetas: [...(this.config.checkMetas ?? []), { kind: 'format', format: 'url', message: resolveErrorMessage(message, getMessages().stringUrl) }]
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
      jsonSchema: { ...this.config.jsonSchema, format: 'uuid' },
      checkMetas: [...(this.config.checkMetas ?? []), { kind: 'format', format: 'uuid', message: resolveErrorMessage(message, getMessages().stringUuid) }]
    });
  }

  private format(pattern: RegExp, formatName: string, message?: ErrorParam): VldString {
    return new VldString({
      checks: [...this.config.checks, (value: string) => pattern.test(value)],
      transforms: this.config.transforms,
      errorMessage: resolveErrorMessage(message, `Invalid ${formatName}`),
      jsonSchema: { ...this.config.jsonSchema, format: formatName, pattern: pattern.source },
      checkMetas: [...(this.config.checkMetas ?? []), { kind: 'format', format: formatName, pattern: pattern.source, message: resolveErrorMessage(message, `Invalid ${formatName}`) }]
    });
  }

  uuidv4(message?: ErrorParam): VldString { return this.format(REGEX_PATTERNS.uuidv4, 'uuid', message); }
  uuidv6(message?: ErrorParam): VldString { return this.format(REGEX_PATTERNS.uuidv6, 'uuid', message); }
  uuidv7(message?: ErrorParam): VldString { return this.format(REGEX_PATTERNS.uuidv7, 'uuid', message); }
  emoji(message?: ErrorParam): VldString { return this.format(REGEX_PATTERNS.emoji, 'emoji', message); }
  base64(message?: ErrorParam): VldString { return this.format(REGEX_PATTERNS.base64, 'base64', message); }
  base64url(message?: ErrorParam): VldString { return this.format(REGEX_PATTERNS.base64url, 'base64url', message); }
  jwt(message?: ErrorParam): VldString { return this.format(REGEX_PATTERNS.jwt, 'jwt', message); }
  nanoid(message?: ErrorParam): VldString { return this.format(REGEX_PATTERNS.nanoid, 'nanoid', message); }
  cuid(message?: ErrorParam): VldString { return this.format(REGEX_PATTERNS.cuid, 'cuid', message); }
  cuid2(message?: ErrorParam): VldString { return this.format(REGEX_PATTERNS.cuid2, 'cuid2', message); }
  ulid(message?: ErrorParam): VldString { return this.format(REGEX_PATTERNS.ulid, 'ulid', message); }
  cidrv4(message?: ErrorParam): VldString { return this.format(REGEX_PATTERNS.cidrv4, 'cidrv4', message); }
  cidrv6(message?: ErrorParam): VldString { return this.format(REGEX_PATTERNS.cidrv6, 'cidrv6', message); }
  e164(message?: ErrorParam): VldString { return this.format(REGEX_PATTERNS.e164, 'e164', message); }
  xid(message?: ErrorParam): VldString { return this.format(REGEX_PATTERNS.xid, 'xid', message); }
  guid(message?: ErrorParam): VldString { return this.format(REGEX_PATTERNS.guid, 'guid', message); }
  ksuid(message?: ErrorParam): VldString { return this.format(REGEX_PATTERNS.ksuid, 'ksuid', message); }
  date(message?: ErrorParam): VldString { return this.format(REGEX_PATTERNS.isoDate, 'date', message); }
  time(message?: ErrorParam): VldString { return this.format(REGEX_PATTERNS.isoTime, 'time', message); }
  datetime(message?: ErrorParam): VldString { return this.format(REGEX_PATTERNS.isoDateTime, 'datetime', message); }
  duration(message?: ErrorParam): VldString { return this.format(REGEX_PATTERNS.isoDuration, 'duration', message); }
  
  /**
   * Create a new validator with regex pattern matching
   */
  regex(pattern: RegExp, message?: ErrorParam): VldString {
    return new VldString({
      checks: [...this.config.checks, (v: string) => pattern.test(v)],
      transforms: this.config.transforms,
      errorMessage: resolveErrorMessage(message, getMessages().stringRegex),
      jsonSchema: { ...this.config.jsonSchema, pattern: pattern.source },
      checkMetas: [...(this.config.checkMetas ?? []), { kind: 'regex', pattern: pattern.source, message: resolveErrorMessage(message, getMessages().stringRegex) }]
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

  lowercase(): VldString {
    return this.toLowerCase();
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

  uppercase(): VldString {
    return this.toUpperCase();
  }

  normalize(form?: 'NFC' | 'NFD' | 'NFKC' | 'NFKD'): VldString {
    return new VldString({
      checks: this.config.checks,
      transforms: [...this.config.transforms, (value: string) => value.normalize(form)],
      errorMessage: this.config.errorMessage,
      jsonSchema: this.config.jsonSchema
    });
  }

  slugify(): VldString {
    return new VldString({
      checks: this.config.checks,
      transforms: [...this.config.transforms, (value: string) => value
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '')],
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
      jsonSchema: { ...this.config.jsonSchema, format: 'ip' },
      checkMetas: [...(this.config.checkMetas ?? []), { kind: 'format', format: 'ip', message: resolveErrorMessage(message, getMessages().stringIp) }]
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
      jsonSchema: { ...this.config.jsonSchema, format: 'ipv4' },
      checkMetas: [...(this.config.checkMetas ?? []), { kind: 'format', format: 'ipv4', message: resolveErrorMessage(message, getMessages().stringIpv4) }]
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
      jsonSchema: { ...this.config.jsonSchema, format: 'ipv6' },
      checkMetas: [...(this.config.checkMetas ?? []), { kind: 'format', format: 'ipv6', message: resolveErrorMessage(message, getMessages().stringIpv6) }]
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
      jsonSchema: { ...this.config.jsonSchema, minLength: Math.max(this.config.jsonSchema?.minLength || 0, 1) },
      checkMetas: [...(this.config.checkMetas ?? []), { kind: 'min', value: 1, message: resolveErrorMessage(message, getMessages().stringEmpty) }]
    });
  }
}
