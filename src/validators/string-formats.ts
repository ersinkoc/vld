/**
 * Top-level string format validators
 * Part of Zod 4 API parity implementation
 * Provides convenient validators for common string formats
 */

import { VldBase } from './base';
import { VldString } from './string';
import type { ParseResult } from './base';

/**
 * Pre-compiled regex patterns for performance
 */
const REGEXES = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  uuidv4: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  uuidv6: /^[0-9a-f]{8}-[0-9a-f]{4}-6[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  uuidv7: /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  hostname: /^(?=.{1,253}$)(?:(?!-)[a-zA-Z0-9-]{1,63}(?<!-)\.)+[a-zA-Z]{2,63}$/,
  emoji: /^(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F)(?:\u200D(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F))*$/u,
  base64: /^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/,
  base64url: /^[A-Za-z0-9_-]*$/,
  hex: /^[0-9a-fA-F]*$/,
  jwt: /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/,
  nanoid: /^[A-Za-z0-9_-]{21}$/,
  cuid: /^c[^\s-]{8,}$/i,
  cuid2: /^[0-9a-z]+$/,
  ulid: /^[0-9A-HJKMNP-TV-Z]{26}$/,
  ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  ipv6: /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
  mac: /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/,
  cidrv4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:3[0-2]|[12]?[0-9])$/,
  cidrv6: /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\/(?:12[0-8]|1[01][0-9]|[1-9]?[0-9])$|^::(?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}\/(?:12[0-8]|1[01][0-9]|[1-9]?[0-9])$|^(?:[0-9a-fA-F]{1,4}:){1,7}:\/(?:12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,
  e164: /^\+[1-9]\d{1,14}$/,
  isoDate: /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/,
  isoTime: /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?$/,
  isoDateTime: /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?Z?$/,
  md5: /^[a-f0-9]{32}$/i,
  sha1: /^[a-f0-9]{40}$/i,
  sha256: /^[a-f0-9]{64}$/i,
  sha384: /^[a-f0-9]{96}$/i,
  sha512: /^[a-f0-9]{128}$/i,
} as const;

/**
 * Generic string format validator
 */
class VldStringFormat extends VldBase<unknown, string> {
  public constructor(
    public readonly _format: string,
    public readonly _validator: (val: string) => boolean,
    public readonly _errorMessage?: string
  ) {
    super();
  }

  static create(
    format: string,
    validator: (val: string) => boolean,
    errorMessage?: string
  ): VldStringFormat {
    return new VldStringFormat(format, validator, errorMessage);
  }

  parse(value: unknown): string {
    const result = VldString.create().parse(value);

    if (!this._validator(result)) {
      throw new Error(
        this._errorMessage || `Invalid ${this._format} format`
      );
    }

    return result;
  }

  safeParse(value: unknown): ParseResult<string> {
    const stringResult = VldString.create().safeParse(value);
    if (!stringResult.success) {
      return stringResult;
    }

    if (!this._validator(stringResult.data)) {
      return {
        success: false,
        error: new Error(
          this._errorMessage || `Invalid ${this._format} format`
        )
      };
    }

    return { success: true, data: stringResult.data };
  }
}

/**
 * Top-level string format validators
 */
export const email = (options?: { pattern?: RegExp }): VldStringFormat =>
  VldStringFormat.create('email', (val) => (options?.pattern ?? REGEXES.email).test(val));

export const uuid = (options?: { version?: 'v4' | 'v6' | 'v7' }): VldStringFormat => {
  const pattern = options?.version ? REGEXES[`uuid${options.version}`] : REGEXES.uuid;
  return VldStringFormat.create('uuid', (val) => pattern.test(val));
};

export const uuidv4 = (): VldStringFormat =>
  VldStringFormat.create('uuid', (val) => REGEXES.uuidv4.test(val));

export const hostname = (): VldStringFormat =>
  VldStringFormat.create('hostname', (val) => REGEXES.hostname.test(val));

export const emoji = (): VldStringFormat =>
  VldStringFormat.create('emoji', (val) => REGEXES.emoji.test(val));

export const base64 = (): VldStringFormat =>
  VldStringFormat.create('base64', (val) => REGEXES.base64.test(val));

export const base64url = (): VldStringFormat =>
  VldStringFormat.create('base64url', (val) => REGEXES.base64url.test(val));

export const hex = (): VldStringFormat =>
  VldStringFormat.create('hex', (val) => REGEXES.hex.test(val));

export const jwt = (): VldStringFormat =>
  VldStringFormat.create('jwt', (val) => REGEXES.jwt.test(val));

export const nanoid = (): VldStringFormat =>
  VldStringFormat.create('nanoid', (val) => REGEXES.nanoid.test(val));

export const cuid = (): VldStringFormat =>
  VldStringFormat.create('cuid', (val) => REGEXES.cuid.test(val));

export const cuid2 = (): VldStringFormat =>
  VldStringFormat.create('cuid2', (val) => REGEXES.cuid2.test(val));

export const ulid = (): VldStringFormat =>
  VldStringFormat.create('ulid', (val) => REGEXES.ulid.test(val));

export const ipv4 = (): VldStringFormat =>
  VldStringFormat.create('ipv4', (val) => REGEXES.ipv4.test(val));

export const ipv6 = (): VldStringFormat =>
  VldStringFormat.create('ipv6', (val) => REGEXES.ipv6.test(val));

export const mac = (): VldStringFormat =>
  VldStringFormat.create('mac', (val) => REGEXES.mac.test(val));

export const cidrv4 = (): VldStringFormat =>
  VldStringFormat.create('cidrv4', (val) => REGEXES.cidrv4.test(val));

export const cidrv6 = (): VldStringFormat =>
  VldStringFormat.create('cidrv6', (val) => REGEXES.cidrv6.test(val));

export const e164 = (): VldStringFormat =>
  VldStringFormat.create('e164', (val) => REGEXES.e164.test(val));

export const hash = (algorithm: 'md5' | 'sha1' | 'sha256' | 'sha384' | 'sha512'): VldStringFormat =>
  VldStringFormat.create('hash', (val) => (REGEXES as any)[algorithm]?.test(val) ?? false, `Invalid ${algorithm} hash`);

/**
 * ISO date/time validators
 */
export const iso = {
  date: () => VldStringFormat.create('date', (val) => REGEXES.isoDate.test(val)),
  time: () => VldStringFormat.create('time', (val) => REGEXES.isoTime.test(val)),
  dateTime: (_options?: { offset?: boolean }) =>
    VldStringFormat.create('datetime', (val) => REGEXES.isoDateTime.test(val)),
  duration: () => VldStringFormat.create('duration', (val) => /^P/.test(val)),
};

/**
 * Custom format validator
 */
export const stringFormat = (
  name: string,
  validator: ((val: string) => boolean) | RegExp
): VldStringFormat => {
  const fn = validator instanceof RegExp ? (val: string) => validator.test(val) : validator;
  return VldStringFormat.create(name, fn);
};

// Export regexes for external use
export { REGEXES as regexes };
