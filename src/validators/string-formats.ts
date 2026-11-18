/**
 * Top-level string format validators
 * Part of Zod 4 API parity implementation
 * Provides convenient validators for common string formats
 */

import { VldBase, VLD_VALIDATOR_TYPES, resolveErrorMessage, type ErrorParam } from './base';
import { codePointLength, hasExactLength, hasMaxLength, hasMinLength } from '../utils/string-length';
import { getMessages } from '../locales/runtime';
import { isValidCidrV6, isValidIPv6Address } from '../utils/ip-validation';
import { VldError, getTypeName, createInvalidTypeIssue, type VldIssue } from '../errors-core';
import type { ParseResult } from './base';

export type UUIDVersion = 'v1' | 'v2' | 'v3' | 'v4' | 'v5' | 'v6' | 'v7' | 'v8';

export interface URLFormatOptions {
  hostname?: RegExp;
  normalize?: boolean;
  protocol?: RegExp;
}

export {
  isValidJwtToken,
  isoDateTimeRegex,
  isoFormatOptions,
  regexes
} from './regexes';
export type { ISODateTimeOptions, ISOTimeOptions, RegexNamespace } from './regexes';

import {
  isoDateTimeRegex,
  isValidJwtToken,
  regexes as REGEXES,
  testRegex,
  uuidRegex,
  type ISODateTimeOptions,
  type ISOTimeOptions
} from './regexes';

/** A chained string constraint: the issue to report when `value` fails, else null. */
export type FormatCheck = (value: string) => VldIssue | null;
/** A chained string transform (trim, toLowerCase, ...). */
export type FormatTransform = (value: string) => string;

const NO_CHECKS: ReadonlyArray<FormatCheck> = [];
const NO_TRANSFORMS: ReadonlyArray<FormatTransform> = [];

function tooSmallIssue(minimum: number, message: string, exact?: number): VldIssue {
  return {
    code: 'too_small', path: [], origin: 'string', minimum, inclusive: true,
    ...(exact === undefined ? {} : { exact }), message
  };
}

function tooBigIssue(maximum: number, message: string, exact?: number): VldIssue {
  return {
    code: 'too_big', path: [], origin: 'string', maximum, inclusive: true,
    ...(exact === undefined ? {} : { exact }), message
  };
}

function formatCheckIssue(format: string, message: string, pattern?: string): VldIssue {
  const issue: VldIssue = { code: 'invalid_format', path: [], origin: 'string', format, message };
  if (pattern !== undefined) issue.pattern = pattern;
  return issue;
}

/**
 * Generic string format validator.
 *
 * Zod's `z.email()`, `z.uuid()` and friends are string schemas, so every
 * `ZodString` method chains onto them (`z.email().min(5).trim()`). The chained
 * constraints are kept as plain closures: the format check always runs first,
 * then the transforms, then the added checks - the same order VldString uses.
 */
export class VldStringFormat extends VldBase<unknown, string> {
  public constructor(
    public readonly _format: string,
    public readonly _validator: (value: string) => boolean,
    public readonly _errorMessage?: string,
    private readonly _normalize: (value: string) => string = value => value,
    private readonly _patternSource?: string,
    private readonly _checks: ReadonlyArray<FormatCheck> = NO_CHECKS,
    private readonly _transforms: ReadonlyArray<FormatTransform> = NO_TRANSFORMS
  ) {
    super(VLD_VALIDATOR_TYPES.STRING_FORMAT);
  }

  static create(
    format: string,
    validator: (value: string) => boolean,
    errorMessage?: string,
    normalize?: (value: string) => string,
    patternSource?: string
  ): VldStringFormat {
    return new VldStringFormat(format, validator, errorMessage, normalize, patternSource);
  }

  /**
   * @internal Re-create this format with the custom message carried by Zod-style
   * params (`'msg'`, `{ message }`, `{ error }`); other params leave it as is.
   */
  _withMessage(params: unknown): VldStringFormat {
    if (params === undefined || params === null) return this;
    const message = resolveErrorMessage(params as ErrorParam, '');
    return message
      ? new VldStringFormat(this._format, this._validator, message, this._normalize, this._patternSource, this._checks, this._transforms)
      : this;
  }

  private _withCheck(check: FormatCheck): VldStringFormat {
    return new VldStringFormat(
      this._format, this._validator, this._errorMessage, this._normalize, this._patternSource,
      [...this._checks, check], this._transforms
    );
  }

  private _withTransform(transform: FormatTransform): VldStringFormat {
    return new VldStringFormat(
      this._format, this._validator, this._errorMessage, this._normalize, this._patternSource,
      this._checks, [...this._transforms, transform]
    );
  }

  /** Zod: minimum length in code points. */
  min(length: number, message?: ErrorParam): VldStringFormat {
    const text = resolveErrorMessage(message, getMessages().stringMin(length));
    return this._withCheck(value => (hasMinLength(value, length) ? null : tooSmallIssue(length, text)));
  }

  /** Zod: maximum length in code points. */
  max(length: number, message?: ErrorParam): VldStringFormat {
    const text = resolveErrorMessage(message, getMessages().stringMax(length));
    return this._withCheck(value => (hasMaxLength(value, length) ? null : tooBigIssue(length, text)));
  }

  /** Zod: exact length in code points. */
  length(length: number, message?: ErrorParam): VldStringFormat {
    const text = resolveErrorMessage(message, getMessages().stringLength(length));
    return this._withCheck(value => {
      if (hasExactLength(value, length)) return null;
      return codePointLength(value) < length
        ? tooSmallIssue(length, text, length)
        : tooBigIssue(length, text, length);
    });
  }

  /** Zod: at least one character. */
  nonempty(message?: ErrorParam): VldStringFormat {
    const text = resolveErrorMessage(message, getMessages().stringEmpty);
    return this._withCheck(value => (value.length > 0 ? null : tooSmallIssue(1, text)));
  }

  regex(pattern: RegExp, message?: ErrorParam): VldStringFormat {
    const text = resolveErrorMessage(message, getMessages().stringRegex);
    const source = pattern.source;
    return this._withCheck(value => {
      // A /g or /y pattern keeps lastIndex between calls; reset it so the same
      // input always gets the same answer.
      pattern.lastIndex = 0;
      return pattern.test(value) ? null : formatCheckIssue('regex', text, source);
    });
  }

  startsWith(str: string, message?: ErrorParam): VldStringFormat {
    const text = resolveErrorMessage(message, getMessages().stringStartsWith(str));
    return this._withCheck(value => (value.startsWith(str) ? null : formatCheckIssue('starts_with', text)));
  }

  endsWith(str: string, message?: ErrorParam): VldStringFormat {
    const text = resolveErrorMessage(message, getMessages().stringEndsWith(str));
    return this._withCheck(value => (value.endsWith(str) ? null : formatCheckIssue('ends_with', text)));
  }

  includes(str: string, message?: ErrorParam | { position?: number; message?: string }): VldStringFormat {
    const position = typeof message === 'object' && message !== null && typeof (message as { position?: unknown }).position === 'number'
      ? (message as { position: number }).position
      : undefined;
    const text = resolveErrorMessage(message as ErrorParam, getMessages().stringIncludes(str));
    return this._withCheck(value => (value.includes(str, position) ? null : formatCheckIssue('includes', text)));
  }

  /** Zod: a check (invalid_format), unlike toLowerCase() which transforms. */
  lowercase(): VldStringFormat {
    return this._withCheck(value => (value === value.toLowerCase() ? null : formatCheckIssue('lowercase', 'Invalid lowercase')));
  }

  /** Zod: a check (invalid_format), unlike toUpperCase() which transforms. */
  uppercase(): VldStringFormat {
    return this._withCheck(value => (value === value.toUpperCase() ? null : formatCheckIssue('uppercase', 'Invalid uppercase')));
  }

  trim(): VldStringFormat {
    return this._withTransform(value => value.trim());
  }

  toLowerCase(): VldStringFormat {
    return this._withTransform(value => value.toLowerCase());
  }

  toUpperCase(): VldStringFormat {
    return this._withTransform(value => value.toUpperCase());
  }

  normalize(form?: 'NFC' | 'NFD' | 'NFKC' | 'NFKD'): VldStringFormat {
    return this._withTransform(value => value.normalize(form));
  }

  slugify(): VldStringFormat {
    return this._withTransform(value => value
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, ''));
  }

  private _createFormatIssue(): VldError {
    const issue: VldIssue = {
      code: 'invalid_format',
      path: [],
      origin: 'string',
      format: this._format,
      message: this._errorMessage || `Invalid ${this._format}`,
    };
    if (this._patternSource) issue.pattern = this._patternSource;
    return new VldError([issue]);
  }

  /**
   * Format check first, then the chained transforms, then the chained checks -
   * the same order VldString uses for its own chains.
   */
  private _applyChains(value: string): string {
    let result = value;
    const transforms = this._transforms;
    for (let i = 0; i < transforms.length; i++) {
      result = transforms[i]!(result);
    }
    const checks = this._checks;
    for (let i = 0; i < checks.length; i++) {
      const issue = checks[i]!(result);
      if (issue !== null) throw new VldError([issue]);
    }
    return this._normalize(result);
  }

  parse(value: unknown): string {
    if (typeof value !== 'string') {
      throw new VldError([createInvalidTypeIssue('string', getTypeName(value), getMessages().invalidString)]);
    }
    if (!this._validator(value)) throw this._createFormatIssue();
    if (this._checks.length === 0 && this._transforms.length === 0) return this._normalize(value);
    return this._applyChains(value);
  }

  safeParse(value: unknown): ParseResult<string> {
    if (typeof value !== 'string') {
      return { success: false, error: new VldError([createInvalidTypeIssue('string', getTypeName(value), getMessages().invalidString)]) };
    }
    if (!this._validator(value)) {
      return { success: false, error: this._createFormatIssue() };
    }
    if (this._checks.length === 0 && this._transforms.length === 0) {
      return { success: true, data: this._normalize(value) };
    }
    try {
      return { success: true, data: this._applyChains(value) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof VldError
          ? error
          : new VldError([{ code: 'custom', path: [], message: String((error as Error).message) }])
      };
    }
  }
}

export const email = (options?: { pattern?: RegExp }): VldStringFormat => {
  const pattern = options?.pattern ?? REGEXES.email;
  return VldStringFormat.create('email', value => testRegex(pattern, value), undefined, undefined, pattern.source);
};

// Zod returns an accepted URL trimmed and without ASCII tabs / newlines (which
// the URL parser ignores anyway), or its normalized href with `normalize`.
const cleanUrl = (value: string): string => value.trim().replace(/[\t\n\r]/g, '');

export const url = (options: URLFormatOptions = {}): VldStringFormat => {
  const parseUrl = (value: string): URL | undefined => {
    try {
      return new URL(value);
    } catch {
      return undefined;
    }
  };
  return VldStringFormat.create(
    'url',
    value => {
      const parsed = parseUrl(value);
      return parsed !== undefined
        && (!options.hostname || testRegex(options.hostname, parsed.hostname))
        && (!options.protocol || testRegex(options.protocol, parsed.protocol.slice(0, -1)));
    },
    undefined,
    options.normalize ? value => new URL(value).href : cleanUrl
  );
};

/**
 * string().url(): any URL the WHATWG parser accepts (Zod accepts every
 * scheme, including mailto:, ftp: and one-letter schemes).
 */
const parsesAsUrl = url()._validator;
export const isValidUrl = (value: string): boolean => parsesAsUrl(value);

export const uuid = (options?: { version?: UUIDVersion }): VldStringFormat => {
  const version = options?.version === undefined ? undefined : Number(options.version.slice(1));
  const pattern = uuidRegex(version);
  return VldStringFormat.create('uuid', value => testRegex(pattern, value), undefined, undefined, pattern.source);
};

export const uuidv4 = (): VldStringFormat => VldStringFormat.create('uuid', value => testRegex(REGEXES.uuid4, value));
export const uuidv6 = (): VldStringFormat => VldStringFormat.create('uuid', value => testRegex(REGEXES.uuid6, value));
export const uuidv7 = (): VldStringFormat => VldStringFormat.create('uuid', value => testRegex(REGEXES.uuid7, value));
export const hostname = (): VldStringFormat => VldStringFormat.create('hostname', value => testRegex(REGEXES.hostname, value));
export const emoji = (): VldStringFormat => VldStringFormat.create('emoji', value => testRegex(REGEXES.emoji(), value));
export const base64 = (): VldStringFormat => VldStringFormat.create('base64', value => testRegex(REGEXES.base64, value));
export const base64url = (): VldStringFormat => VldStringFormat.create('base64url', value => testRegex(REGEXES.base64url, value));
export const hex = (): VldStringFormat => VldStringFormat.create('hex', value => testRegex(REGEXES.hex, value));
export const jwt = (options?: { alg?: string }): VldStringFormat =>
  VldStringFormat.create('jwt', value => isValidJwtToken(value, options?.alg ?? null));
export const nanoid = (): VldStringFormat => VldStringFormat.create('nanoid', value => testRegex(REGEXES.nanoid, value));
export const cuid = (): VldStringFormat => VldStringFormat.create('cuid', value => testRegex(REGEXES.cuid, value));
export const cuid2 = (): VldStringFormat => VldStringFormat.create('cuid2', value => testRegex(REGEXES.cuid2, value));
export const ulid = (): VldStringFormat => VldStringFormat.create('ulid', value => testRegex(REGEXES.ulid, value));
export const ipv4 = (): VldStringFormat => VldStringFormat.create('ipv4', value => testRegex(REGEXES.ipv4, value), undefined, undefined, REGEXES.ipv4.source);
export const ipv6 = (): VldStringFormat => VldStringFormat.create('ipv6', isValidIPv6Address, undefined, undefined, '^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$');
export const mac = (options?: { delimiter?: string }): VldStringFormat => {
  const pattern = REGEXES.mac(options?.delimiter);
  return VldStringFormat.create('mac', value => testRegex(pattern, value));
};
export const cidrv4 = (): VldStringFormat => VldStringFormat.create('cidrv4', value => testRegex(REGEXES.cidrv4, value));
// Number('') / Number(' 64') / Number('1e2') / Number('0x40') all parse, so the
// prefix is matched as canonical digits instead.
export const cidrv6 = (): VldStringFormat => VldStringFormat.create('cidrv6', isValidCidrV6, undefined, undefined, '^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$');
export const e164 = (): VldStringFormat => VldStringFormat.create('e164', value => testRegex(REGEXES.e164, value));
export const xid = (): VldStringFormat => VldStringFormat.create('xid', value => testRegex(REGEXES.xid, value));
export const guid = (): VldStringFormat => VldStringFormat.create('guid', value => testRegex(REGEXES.guid, value));
// Zod's httpUrl: a URL with an http(s) protocol whose hostname is a domain
// name (a dotted name with a 2-63 letter TLD - not localhost or an IP).
const HTTP_URL_DOMAIN = /^(?=.{1,253}$)([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/;
export const httpUrl = (): VldStringFormat =>
  VldStringFormat.create('httpUrl', url({ protocol: /^https?$/, hostname: HTTP_URL_DOMAIN })._validator, undefined, cleanUrl);
export const ksuid = (): VldStringFormat => VldStringFormat.create('ksuid', value => testRegex(REGEXES.ksuid, value));

export const hash = (algorithm: 'md5' | 'sha1' | 'sha256' | 'sha384' | 'sha512'): VldStringFormat =>
  VldStringFormat.create(
    'hash',
    value => ((REGEXES as unknown) as Record<string, RegExp | undefined>)[algorithm]?.test(value) ?? false,
    `Invalid ${algorithm} hash`
  );

// Credit card validation: regex shape check plus Luhn checksum, matching the
// Zod canary contract. The regex is intentionally shape-only (length and
// separators); the Luhn check is not expressible as a pattern.
const CREDIT_CARD_SEPARATORS = /[ -]/g;

function isLuhnValid(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let value = digits.charCodeAt(i) - 48;
    if (double) {
      value *= 2;
      if (value > 9) value -= 9;
    }
    sum += value;
    double = !double;
  }
  return sum % 10 === 0;
}

export function isValidCreditCard(input: string): boolean {
  if (!REGEXES.creditCard.test(input)) return false;
  return isLuhnValid(input.replace(CREDIT_CARD_SEPARATORS, ''));
}

export const creditCard = (params?: { message?: string }): VldStringFormat =>
  VldStringFormat.create(
    'credit_card',
    isValidCreditCard,
    params?.message,
    undefined,
    REGEXES.creditCard.source
  );

// ISO 7064 MOD 97-10 checksum without BigInt, matching the Zod 4.6 contract.
function isIso7064Mod97(iban: string): boolean {
  let remainder = 0;
  const len = iban.length;
  // Rearranged form: BBAN first, then country + check digits.
  for (let i = 4; i < len; i++) {
    const code = iban.charCodeAt(i);
    remainder = (code >= 65 ? remainder * 100 + (code - 55) : remainder * 10 + (code - 48)) % 97;
  }
  for (let i = 0; i < 4; i++) {
    const code = iban.charCodeAt(i);
    remainder = (code >= 65 ? remainder * 100 + (code - 55) : remainder * 10 + (code - 48)) % 97;
  }
  return remainder === 1;
}

export function isValidIBAN(input: string): boolean {
  if (!REGEXES.iban.test(input)) return false;
  return isIso7064Mod97(input);
}

export const iban = (params?: { message?: string }): VldStringFormat =>
  VldStringFormat.create(
    'iban',
    isValidIBAN,
    params?.message,
    undefined,
    REGEXES.iban.source
  );

// Zod 4.6 currency-code format: ISO 4217 three-letter codes.
export const currencyCode = (params?: { message?: string }): VldStringFormat =>
  VldStringFormat.create(
    'currency_code',
    value => testRegex(REGEXES.currencyCode, value),
    params?.message,
    undefined,
    REGEXES.currencyCode.source
  );

/**
 * Zod 4.6 base64 charset regexes: the 4.6 base64 check validates the
 * character set with these patterns and enforces length/padding in code.
 */
export const base64Charset = /^[0-9a-zA-Z+/]*={0,2}$/;
export const base64urlCharset = /^[A-Za-z0-9_-]*$/;

export const iso = {
  ZodISODate: VldStringFormat,
  ZodISODateTime: VldStringFormat,
  ZodISODuration: VldStringFormat,
  ZodISOTime: VldStringFormat,
  date: () => VldStringFormat.create('date', value => testRegex(REGEXES.date, value), undefined, undefined, REGEXES.date.source),
  time: (options: ISOTimeOptions = {}) => {
    const pattern = REGEXES.time(options);
    return VldStringFormat.create('time', value => testRegex(pattern, value));
  },
  datetime: (options: ISODateTimeOptions = {}) => {
    const pattern = isoDateTimeRegex(options);
    return VldStringFormat.create('datetime', value => testRegex(pattern, value));
  },
  dateTime: (options: ISODateTimeOptions = { local: true }) => {
    const pattern = isoDateTimeRegex(options);
    return VldStringFormat.create('datetime', value => testRegex(pattern, value));
  },
  duration: () => VldStringFormat.create('duration', value => testRegex(REGEXES.duration, value))
} as const;

export const stringFormat = (
  name: string,
  validator: ((value: string) => boolean) | RegExp
): VldStringFormat => {
  const check = validator instanceof RegExp
    ? (value: string) => testRegex(validator, value)
    : validator;
  return VldStringFormat.create(name, check);
};

