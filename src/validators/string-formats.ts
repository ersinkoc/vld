/**
 * Top-level string format validators
 * Part of Zod 4 API parity implementation
 * Provides convenient validators for common string formats
 */

import { VldBase, VLD_VALIDATOR_TYPES } from './base';
import { getMessages } from '../locales/runtime';
import { isValidIPv6 } from '../utils/ip-validation';
import { VldError, getTypeName, createInvalidTypeIssue, type VldIssue } from '../errors-core';
import type { ParseResult } from './base';

export type UUIDVersion = 'v1' | 'v2' | 'v3' | 'v4' | 'v5' | 'v6' | 'v7' | 'v8';

export interface URLFormatOptions {
  hostname?: RegExp;
  normalize?: boolean;
  protocol?: RegExp;
}

export interface ISOTimeOptions {
  precision?: number | null;
}

export interface ISODateTimeOptions extends ISOTimeOptions {
  local?: boolean;
  offset?: boolean;
}

const DATE_SOURCE = '(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))';

function testRegex(pattern: RegExp, value: string): boolean {
  pattern.lastIndex = 0;
  return pattern.test(value);
}

function fixedBase64(bodyLength: number, padding: '' | '=' | '=='): RegExp {
  return new RegExp(`^[A-Za-z0-9+/]{${bodyLength}}${padding}$`);
}

function fixedBase64Url(length: number): RegExp {
  return new RegExp(`^[A-Za-z0-9_-]{${length}}$`);
}

function timeSource(options: ISOTimeOptions): string {
  const hoursAndMinutes = '(?:[01]\\d|2[0-3]):[0-5]\\d';
  if (typeof options.precision !== 'number') {
    return `${hoursAndMinutes}(?::[0-5]\\d(?:\\.\\d+)?)?`;
  }
  if (options.precision === -1) return hoursAndMinutes;
  if (options.precision === 0) return `${hoursAndMinutes}:[0-5]\\d`;
  return `${hoursAndMinutes}:[0-5]\\d\\.\\d{${options.precision}}`;
}

function uuidRegex(version?: number): RegExp {
  if (version === undefined) {
    return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;
  }
  return new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`);
}

function timeRegex(options: ISOTimeOptions = {}): RegExp {
  return new RegExp(`^${timeSource(options)}$`);
}

function dateTimeRegex(options: ISODateTimeOptions = {}): RegExp {
  const timezoneParts = ['Z'];
  if (options.local) timezoneParts.push('');
  if (options.offset) timezoneParts.push('([+-](?:[01]\\d|2[0-3]):[0-5]\\d)');
  return new RegExp(`^${DATE_SOURCE}T${timeSource(options)}(?:${timezoneParts.join('|')})$`);
}

function stringRegex(options?: { minimum?: number; maximum?: number }): RegExp {
  const body = options
    ? `[\\s\\S]{${options.minimum ?? 0},${options.maximum ?? ''}}`
    : '[\\s\\S]*';
  return new RegExp(`^${body}$`);
}

function macRegex(delimiter = ':'): RegExp {
  const escapedDelimiter = delimiter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(
    `^(?:[0-9A-F]{2}${escapedDelimiter}){5}[0-9A-F]{2}$|^(?:[0-9a-f]{2}${escapedDelimiter}){5}[0-9a-f]{2}$`
  );
}

type StaticRegexName =
  | 'base64' | 'base64url' | 'bigint' | 'boolean' | 'browserEmail' | 'cidrv4' | 'cidrv6'
  | 'creditCard' | 'cuid' | 'cuid2' | 'date' | 'domain' | 'duration' | 'e164' | 'email' | 'extendedDuration'
  | 'guid' | 'hex' | 'hostname' | 'html5Email' | 'httpProtocol' | 'httpUrl' | 'idnEmail'
  | 'integer' | 'ipv4' | 'ipv6' | 'jwt' | 'ksuid' | 'lowercase' | 'md5' | 'md5_base64'
  | 'md5_base64url' | 'md5_hex' | 'nanoid' | 'null' | 'number' | 'rfc5322Email'
  | 'sha1' | 'sha1_base64' | 'sha1_base64url' | 'sha1_hex' | 'sha256' | 'sha256_base64'
  | 'sha256_base64url' | 'sha256_hex' | 'sha384' | 'sha384_base64' | 'sha384_base64url'
  | 'sha384_hex' | 'sha512' | 'sha512_base64' | 'sha512_base64url' | 'sha512_hex'
  | 'ulid' | 'undefined' | 'unicodeEmail' | 'uppercase' | 'uuid4' | 'uuid6' | 'uuid7' | 'xid';

export type RegexNamespace = Readonly<Record<StaticRegexName, RegExp> & {
  datetime: typeof dateTimeRegex;
  emoji: () => RegExp;
  mac: typeof macRegex;
  string: typeof stringRegex;
  time: typeof timeRegex;
  uuid: typeof uuidRegex;
}>;

/** Public regex helpers matching the current Zod 4 namespace. */
const REGEXES: RegexNamespace = {
  cuid: /^[cC][0-9a-z]{6,}$/,
  cuid2: /^[0-9a-z]+$/,
  ulid: /^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/,
  xid: /^[0-9a-vA-V]{20}$/,
  ksuid: /^[A-Za-z0-9]{27}$/,
  nanoid: /^[a-zA-Z0-9_-]{21}$/,
  duration: /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/,
  extendedDuration: /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/,
  guid: /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/,
  creditCard: /^\d(?:[ -]?\d){11,18}$/,
  uuid: uuidRegex,
  uuid4: uuidRegex(4),
  uuid6: uuidRegex(6),
  uuid7: uuidRegex(7),
  email: /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+.-]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9-]*\.)+[A-Za-z]{2,}$/,
  html5Email: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  // Keep the official Zod 4.4.3 RFC 5322 source byte-for-byte for differential parity.
  // eslint-disable-next-line no-useless-escape
  rfc5322Email: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}))$/,
  unicodeEmail: /^[^\s@"]{1,64}@[^\s@]{1,255}$/u,
  idnEmail: /^[^\s@"]{1,64}@[^\s@]{1,255}$/u,
  browserEmail: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  emoji: () => /^(\p{Extended_Pictographic}|\p{Emoji_Component})+$/u,
  ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/,
  ipv6: /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/,
  mac: macRegex,
  cidrv4: /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/,
  cidrv6: /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,
  base64: /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/,
  base64url: /^[A-Za-z0-9_-]*$/,
  hostname: /^(?=.{1,253}\.?$)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[-0-9a-zA-Z]{0,61}[0-9a-zA-Z])?)*\.?$/,
  domain: /^([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
  httpProtocol: /^https?$/,
  e164: /^\+[1-9]\d{6,14}$/,
  date: new RegExp(`^${DATE_SOURCE}$`),
  time: timeRegex,
  datetime: dateTimeRegex,
  string: stringRegex,
  bigint: /^-?\d+n?$/,
  integer: /^-?\d+$/,
  number: /^-?\d+(?:\.\d+)?$/,
  boolean: /^(?:true|false)$/i,
  null: /^null$/i,
  undefined: /^undefined$/i,
  lowercase: /^[^A-Z]*$/,
  uppercase: /^[^a-z]*$/,
  hex: /^[0-9a-fA-F]*$/,
  md5_hex: /^[0-9a-fA-F]{32}$/,
  md5_base64: fixedBase64(22, '=='),
  md5_base64url: fixedBase64Url(22),
  sha1_hex: /^[0-9a-fA-F]{40}$/,
  sha1_base64: fixedBase64(27, '='),
  sha1_base64url: fixedBase64Url(27),
  sha256_hex: /^[0-9a-fA-F]{64}$/,
  sha256_base64: fixedBase64(43, '='),
  sha256_base64url: fixedBase64Url(43),
  sha384_hex: /^[0-9a-fA-F]{96}$/,
  sha384_base64: fixedBase64(64, ''),
  sha384_base64url: fixedBase64Url(64),
  sha512_hex: /^[0-9a-fA-F]{128}$/,
  sha512_base64: fixedBase64(86, '=='),
  sha512_base64url: fixedBase64Url(86),
  jwt: /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/,
  httpUrl: /^https?:\/\/[^\s/$.?#].[^\s]*$/,
  md5: /^[a-f0-9]{32}$/i,
  sha1: /^[a-f0-9]{40}$/i,
  sha256: /^[a-f0-9]{64}$/i,
  sha384: /^[a-f0-9]{96}$/i,
  sha512: /^[a-f0-9]{128}$/i
} as const;

/** Generic string format validator. */
export class VldStringFormat extends VldBase<unknown, string> {
  public constructor(
    public readonly _format: string,
    public readonly _validator: (value: string) => boolean,
    public readonly _errorMessage?: string,
    private readonly _normalize: (value: string) => string = value => value,
    private readonly _patternSource?: string
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

  parse(value: unknown): string {
    if (typeof value !== 'string') {
      throw new VldError([createInvalidTypeIssue('string', getTypeName(value), getMessages().invalidString)]);
    }
    if (!this._validator(value)) throw this._createFormatIssue();
    return this._normalize(value);
  }

  safeParse(value: unknown): ParseResult<string> {
    if (typeof value !== 'string') {
      return { success: false, error: new VldError([createInvalidTypeIssue('string', getTypeName(value), getMessages().invalidString)]) };
    }
    if (!this._validator(value)) {
      return { success: false, error: this._createFormatIssue() };
    }
    return { success: true, data: this._normalize(value) };
  }
}

export const email = (options?: { pattern?: RegExp }): VldStringFormat => {
  const pattern = options?.pattern ?? REGEXES.email;
  return VldStringFormat.create('email', value => testRegex(pattern, value), undefined, undefined, pattern.source);
};

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
    options.normalize ? value => new URL(value).href : undefined
  );
};

export const uuid = (options?: { version?: UUIDVersion }): VldStringFormat => {
  const version = options?.version === undefined ? undefined : Number(options.version.slice(1));
  const pattern = uuidRegex(version);
  return VldStringFormat.create('uuid', value => testRegex(pattern, value));
};

export const uuidv4 = (): VldStringFormat => VldStringFormat.create('uuid', value => testRegex(REGEXES.uuid4, value));
export const uuidv6 = (): VldStringFormat => VldStringFormat.create('uuid', value => testRegex(REGEXES.uuid6, value));
export const uuidv7 = (): VldStringFormat => VldStringFormat.create('uuid', value => testRegex(REGEXES.uuid7, value));
export const hostname = (): VldStringFormat => VldStringFormat.create('hostname', value => testRegex(REGEXES.hostname, value));
export const emoji = (): VldStringFormat => VldStringFormat.create('emoji', value => testRegex(REGEXES.emoji(), value));
export const base64 = (): VldStringFormat => VldStringFormat.create('base64', value => testRegex(REGEXES.base64, value));
export const base64url = (): VldStringFormat => VldStringFormat.create('base64url', value => testRegex(REGEXES.base64url, value));
export const hex = (): VldStringFormat => VldStringFormat.create('hex', value => testRegex(REGEXES.hex, value));
export const jwt = (): VldStringFormat => VldStringFormat.create('jwt', value => testRegex(REGEXES.jwt, value));
export const nanoid = (): VldStringFormat => VldStringFormat.create('nanoid', value => testRegex(REGEXES.nanoid, value));
export const cuid = (): VldStringFormat => VldStringFormat.create('cuid', value => testRegex(REGEXES.cuid, value));
export const cuid2 = (): VldStringFormat => VldStringFormat.create('cuid2', value => testRegex(REGEXES.cuid2, value));
export const ulid = (): VldStringFormat => VldStringFormat.create('ulid', value => testRegex(REGEXES.ulid, value));
export const ipv4 = (): VldStringFormat => VldStringFormat.create('ipv4', value => testRegex(REGEXES.ipv4, value));
export const ipv6 = (): VldStringFormat => VldStringFormat.create('ipv6', value => testRegex(REGEXES.ipv6, value));
export const mac = (options?: { delimiter?: string }): VldStringFormat => {
  const pattern = REGEXES.mac(options?.delimiter);
  return VldStringFormat.create('mac', value => testRegex(pattern, value));
};
export const cidrv4 = (): VldStringFormat => VldStringFormat.create('cidrv4', value => testRegex(REGEXES.cidrv4, value));
export const cidrv6 = (): VldStringFormat => VldStringFormat.create('cidrv6', value => {
  const separator = value.lastIndexOf('/');
  if (separator <= 0) return false;
  const prefix = Number(value.slice(separator + 1));
  return Number.isInteger(prefix) && prefix >= 0 && prefix <= 128 && isValidIPv6(value.slice(0, separator));
});
export const e164 = (): VldStringFormat => VldStringFormat.create('e164', value => testRegex(REGEXES.e164, value));
export const xid = (): VldStringFormat => VldStringFormat.create('xid', value => testRegex(REGEXES.xid, value));
export const guid = (): VldStringFormat => VldStringFormat.create('guid', value => testRegex(REGEXES.guid, value));
export const httpUrl = (): VldStringFormat => VldStringFormat.create('httpUrl', value => testRegex(REGEXES.httpUrl, value));
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

export const iso = {
  ZodISODate: VldStringFormat,
  ZodISODateTime: VldStringFormat,
  ZodISODuration: VldStringFormat,
  ZodISOTime: VldStringFormat,
  date: () => VldStringFormat.create('date', value => testRegex(REGEXES.date, value)),
  time: (options: ISOTimeOptions = {}) => {
    const pattern = REGEXES.time(options);
    return VldStringFormat.create('time', value => testRegex(pattern, value));
  },
  datetime: (options: ISODateTimeOptions = {}) => {
    const pattern = REGEXES.datetime(options);
    return VldStringFormat.create('datetime', value => testRegex(pattern, value));
  },
  dateTime: (options: ISODateTimeOptions = { local: true }) => {
    const pattern = REGEXES.datetime(options);
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

export { REGEXES as regexes };
