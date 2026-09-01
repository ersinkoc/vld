/**
 * VldStringV2 — OPTIMIZED: check classes return Issue | null (no per-call
 * payload allocation), hot path uses early-return, isSimple is precomputed.
 *
 * Same public API as the legacy VldString.
 */
import { VldBase, VLD_VALIDATOR_TYPES, type ErrorParam, type ParseResult } from './base';
import { VldError, createInvalidTypeIssue, getTypeName, type VldIssue } from '../errors-core';
import { getMessages } from '../locales/runtime';
import { isValidIPv6 } from '../utils/ip-validation';
import { resolveErrorMessage } from './base';

// --------------------------------------------------------------------------
// Check hierarchy — each check returns Issue | null directly (no payload
// allocation). This is the key performance fix over the previous version.
// --------------------------------------------------------------------------

export abstract class VldStringCheck {
  abstract readonly kind: string;
  abstract check(value: string): VldIssue | null;
  abstract meta(): Record<string, any>;
}

export class VldCheckMin extends VldStringCheck {
  readonly kind = 'min';
  constructor(readonly length: number, private _msg?: string) { super(); }
  get message() { return this._msg; }
  check(value: string): VldIssue | null {
    if (value.length < this.length) {
      return { code: 'too_small', path: [], origin: 'string', minimum: this.length, inclusive: true,
        message: this._msg || `Too small: expected string to have >=${this.length} characters` };
    }
    return null;
  }
  meta() { return { kind: 'min', value: this.length, message: this._msg }; }
}

export class VldCheckMax extends VldStringCheck {
  readonly kind = 'max';
  constructor(readonly length: number, private _msg?: string) { super(); }
  get message() { return this._msg; }
  check(value: string): VldIssue | null {
    if (value.length > this.length) {
      return { code: 'too_big', path: [], origin: 'string', maximum: this.length, inclusive: true,
        message: this._msg || `Too big: expected string to have <=${this.length} characters` };
    }
    return null;
  }
  meta() { return { kind: 'max', value: this.length, message: this._msg }; }
}

export class VldCheckLength extends VldStringCheck {
  readonly kind = 'length';
  constructor(readonly length: number, private _msg?: string) { super(); }
  get message() { return this._msg; }
  check(value: string): VldIssue | null {
    if (value.length !== this.length) {
      return { code: 'too_big', path: [], origin: 'string', exact: this.length,
        message: this._msg || `Too big: expected string to have exactly ${this.length} characters` };
    }
    return null;
  }
  meta() { return { kind: 'length', value: this.length, message: this._msg }; }
}

export class VldCheckEmail extends VldStringCheck {
  readonly kind = 'format';
  private static RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  constructor(private _msg?: string) { super(); }
  get message() { return this._msg; }
  check(value: string): VldIssue | null {
    if (!VldCheckEmail.RE.test(value)) {
      return { code: 'invalid_format', path: [], origin: 'string', format: 'email',
        message: this._msg || 'Invalid email' };
    }
    return null;
  }
  meta() { return { kind: 'format', format: 'email', message: this._msg }; }
}

export class VldCheckUrl extends VldStringCheck {
  readonly kind = 'format';
  private static RE = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;
  constructor(private _msg?: string) { super(); }
  get message() { return this._msg; }
  check(value: string): VldIssue | null {
    if (!VldCheckUrl.RE.test(value)) {
      return { code: 'invalid_format', path: [], origin: 'string', format: 'url',
        message: this._msg || 'Invalid url' };
    }
    return null;
  }
  meta() { return { kind: 'format', format: 'url', message: this._msg }; }
}

export class VldCheckUuid extends VldStringCheck {
  readonly kind = 'format';
  private static RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  constructor(private _msg?: string) { super(); }
  get message() { return this._msg; }
  check(value: string): VldIssue | null {
    if (!VldCheckUuid.RE.test(value)) {
      return { code: 'invalid_format', path: [], origin: 'string', format: 'uuid',
        message: this._msg || 'Invalid uuid' };
    }
    return null;
  }
  meta() { return { kind: 'format', format: 'uuid', message: this._msg }; }
}

export class VldCheckRegex extends VldStringCheck {
  readonly kind = 'regex';
  constructor(readonly pattern: RegExp, private _msg?: string) { super(); }
  get message() { return this._msg; }
  check(value: string): VldIssue | null {
    if (!this.pattern.test(value)) {
      return { code: 'invalid_format', path: [], origin: 'string', format: 'regex', pattern: this.pattern.source,
        message: this._msg || 'Invalid string: does not match pattern' };
    }
    return null;
  }
  meta() { return { kind: 'regex', pattern: this.pattern.source, message: this._msg }; }
}

export class VldCheckStartsWith extends VldStringCheck {
  readonly kind = 'startsWith';
  constructor(readonly prefix: string, private _msg?: string) { super(); }
  get message() { return this._msg; }
  check(value: string): VldIssue | null {
    if (!value.startsWith(this.prefix)) {
      return { code: 'invalid_string', path: [], 
        message: this._msg || `Invalid string: must start with "${this.prefix}"` };
    }
    return null;
  }
  meta() { return { kind: 'startsWith', value: this.prefix, message: this._msg }; }
}

export class VldCheckEndsWith extends VldStringCheck {
  readonly kind = 'endsWith';
  constructor(readonly suffix: string, private _msg?: string) { super(); }
  get message() { return this._msg; }
  check(value: string): VldIssue | null {
    if (!value.endsWith(this.suffix)) {
      return { code: 'invalid_string', path: [], 
        message: this._msg || `Invalid string: must end with "${this.suffix}"` };
    }
    return null;
  }
  meta() { return { kind: 'endsWith', value: this.suffix, message: this._msg }; }
}

export class VldCheckIncludes extends VldStringCheck {
  readonly kind = 'includes';
  constructor(readonly substring: string, private _msg?: string) { super(); }
  get message() { return this._msg; }
  check(value: string): VldIssue | null {
    if (!value.includes(this.substring)) {
      return { code: 'invalid_string', path: [], 
        message: this._msg || `Invalid string: must include "${this.substring}"` };
    }
    return null;
  }
  meta() { return { kind: 'includes', value: this.substring, message: this._msg }; }
}

export class VldCheckRegexFormat extends VldStringCheck {
  readonly kind = 'format';
  constructor(readonly pattern: RegExp, readonly formatName: string, private _msg?: string) { super(); }
  get message() { return this._msg; }
  check(value: string): VldIssue | null {
    if (!this.pattern.test(value)) {
      return { code: 'invalid_format', path: [], origin: 'string', format: this.formatName, pattern: this.pattern.source,
        message: this._msg || `Invalid ${this.formatName}` };
    }
    return null;
  }
  meta() { return { kind: 'format', format: this.formatName, pattern: this.pattern.source, message: this._msg }; }
}

export class VldCheckIp extends VldStringCheck {
  readonly kind = 'format';
  private static V4 = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  constructor(private _msg?: string) { super(); }
  get message() { return this._msg; }
  check(value: string): VldIssue | null {
    if (value.length > 100 || !(VldCheckIp.V4.test(value) || isValidIPv6(value))) {
      return { code: 'invalid_format', path: [], origin: 'string', format: 'ip',
        message: this._msg || 'Invalid ip' };
    }
    return null;
  }
  meta() { return { kind: 'format', format: 'ip', message: this._msg }; }
}

export class VldCheckIpv4 extends VldStringCheck {
  readonly kind = 'format';
  private static RE = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  constructor(private _msg?: string) { super(); }
  get message() { return this._msg; }
  check(value: string): VldIssue | null {
    if (!VldCheckIpv4.RE.test(value)) {
      return { code: 'invalid_format', path: [], origin: 'string', format: 'ipv4', message: this._msg || 'Invalid ipv4' };
    }
    return null;
  }
  meta() { return { kind: 'format', format: 'ipv4', message: this._msg }; }
}

export class VldCheckIpv6 extends VldStringCheck {
  readonly kind = 'format';
  constructor(private _msg?: string) { super(); }
  get message() { return this._msg; }
  check(value: string): VldIssue | null {
    if (!isValidIPv6(value)) {
      return { code: 'invalid_format', path: [], origin: 'string', format: 'ipv6', message: this._msg || 'Invalid ipv6' };
    }
    return null;
  }
  meta() { return { kind: 'format', format: 'ipv6', message: this._msg }; }
}

// --------------------------------------------------------------------------
// Def shape — precomputes isSimple for hot-path branching
// --------------------------------------------------------------------------

export interface VldStringDef {
  readonly type: 'string';
  readonly checks: ReadonlyArray<VldStringCheck>;
  readonly transforms: ReadonlyArray<(v: string) => string>;
  readonly jsonSchema?: { minLength?: number; maxLength?: number; format?: string; pattern?: string } | undefined;
  readonly errorMessage?: string | undefined;
  readonly isSimple: boolean;
}

const EMPTY_STRING_DEF: VldStringDef = Object.freeze({
  type: 'string',
  checks: Object.freeze([]) as ReadonlyArray<VldStringCheck>,
  transforms: Object.freeze([]) as ReadonlyArray<(v: string) => string>,
  isSimple: true,
});

function buildDef(checks: ReadonlyArray<VldStringCheck>, transforms: ReadonlyArray<(v: string) => string>, jsonSchema: VldStringDef['jsonSchema'], errorMessage: string | undefined): VldStringDef {
  return Object.freeze({
    type: 'string' as const,
    checks,
    transforms,
    jsonSchema,
    errorMessage,
    isSimple: checks.length === 0 && transforms.length === 0,
  });
}

// --------------------------------------------------------------------------
// VldStringV2 — public class with optimized hot path
// --------------------------------------------------------------------------

export class VldStringV2 extends VldBase<string, string> {
  readonly __def: VldStringDef;

  constructor(def: VldStringDef = EMPTY_STRING_DEF) {
    super(VLD_VALIDATOR_TYPES.STRING);
    this.__def = def;
  }

  static create(): VldStringV2 {
    return new VldStringV2(EMPTY_STRING_DEF);
  }

  // Public discriminators used by VldObject / VldArray fast-path dispatch
  get isSimple(): boolean { return this.__def.isSimple; }
  get minLength(): number | null { return this.__def.jsonSchema?.minLength ?? null; }
  get maxLength(): number | null { return this.__def.jsonSchema?.maxLength ?? null; }
  get getFormat(): string | null { return this.__def.jsonSchema?.format ?? null; }
  get isCoercion(): boolean { return this.validatorType === VLD_VALIDATOR_TYPES.COERCE_STRING; }

  parse(value: unknown): string {
    if (typeof value !== 'string') {
      throw new VldError([createInvalidTypeIssue('string', getTypeName(value), this.__def.errorMessage)]);
    }
    if (this.__def.isSimple) return value;
    return this.parseKnownString(value);
  }

  /** Hot path — early-return, no payload allocation. */
  parseKnownString(value: string): string {
    const def = this.__def;
    const transforms = def.transforms;
    let result = value;
    switch (transforms.length) {
      case 0: break;
      case 1: result = transforms[0]!(result); break;
      case 2: result = transforms[1]!(transforms[0]!(result)); break;
      case 3: result = transforms[2]!(transforms[1]!(transforms[0]!(result))); break;
      default:
        for (let i = 0; i < transforms.length; i++) result = transforms[i]!(result);
    }
    const checks = def.checks;
    for (let i = 0; i < checks.length; i++) {
      const issue = checks[i]!.check(result);
      if (issue !== null) throw new VldError([issue]);
    }
    return result;
  }

  safeParse(value: unknown): ParseResult<string> {
    try { return { success: true, data: this.parse(value) }; }
    catch (error) { return { success: false, error: error instanceof VldError ? error : new VldError([{ code: 'custom', path: [], message: String(error) }]) }; }
  }

  protected withDef(def: Partial<VldStringDef> & { type: 'string' }): VldStringV2 {
    const merged = buildDef(
      def.checks ?? this.__def.checks,
      def.transforms ?? this.__def.transforms,
      def.jsonSchema ?? this.__def.jsonSchema,
      def.errorMessage ?? this.__def.errorMessage
    );
    return new (this.constructor as any)(merged);
  }

  min(length: number, message?: ErrorParam): VldStringV2 {
    return this.withDef({
      type: 'string',
      checks: [...this.__def.checks, new VldCheckMin(length, resolveErrorMessage(message, getMessages().stringMin(length)))],
      jsonSchema: { ...this.__def.jsonSchema, minLength: length },
      errorMessage: resolveErrorMessage(message, getMessages().stringMin(length)),
    });
  }
  max(length: number, message?: ErrorParam): VldStringV2 {
    return this.withDef({
      type: 'string',
      checks: [...this.__def.checks, new VldCheckMax(length, resolveErrorMessage(message, getMessages().stringMax(length)))],
      jsonSchema: { ...this.__def.jsonSchema, maxLength: length },
      errorMessage: resolveErrorMessage(message, getMessages().stringMax(length)),
    });
  }
  length(length: number, message?: ErrorParam): VldStringV2 {
    return this.withDef({
      type: 'string',
      checks: [...this.__def.checks, new VldCheckLength(length, resolveErrorMessage(message, getMessages().stringLength(length)))],
      jsonSchema: { ...this.__def.jsonSchema, exactLength: length } as any,
      errorMessage: resolveErrorMessage(message, getMessages().stringLength(length)),
    });
  }
  email(message?: ErrorParam): VldStringV2 {
    return this.withDef({
      type: 'string',
      checks: [...this.__def.checks, new VldCheckEmail(resolveErrorMessage(message, getMessages().stringEmail))],
      jsonSchema: { ...this.__def.jsonSchema, format: 'email' },
      errorMessage: resolveErrorMessage(message, getMessages().stringEmail),
    });
  }
  url(message?: ErrorParam): VldStringV2 {
    return this.withDef({
      type: 'string',
      checks: [...this.__def.checks, new VldCheckUrl(resolveErrorMessage(message, getMessages().stringUrl))],
      jsonSchema: { ...this.__def.jsonSchema, format: 'uri' },
      errorMessage: resolveErrorMessage(message, getMessages().stringUrl),
    });
  }
  uuid(message?: ErrorParam): VldStringV2 {
    return this.withDef({
      type: 'string',
      checks: [...this.__def.checks, new VldCheckUuid(resolveErrorMessage(message, getMessages().stringUuid))],
      jsonSchema: { ...this.__def.jsonSchema, format: 'uuid' },
      errorMessage: resolveErrorMessage(message, getMessages().stringUuid),
    });
  }
  regex(pattern: RegExp, message?: ErrorParam): VldStringV2 {
    return this.withDef({
      type: 'string',
      checks: [...this.__def.checks, new VldCheckRegex(pattern, resolveErrorMessage(message, getMessages().stringRegex))],
      jsonSchema: { ...this.__def.jsonSchema, pattern: pattern.source },
      errorMessage: resolveErrorMessage(message, getMessages().stringRegex),
    });
  }
  trim(): VldStringV2 {
    return this.withDef({ type: 'string', transforms: [...this.__def.transforms, (v) => v.trim()] });
  }
  toLowerCase(): VldStringV2 { return this.withDef({ type: 'string', transforms: [...this.__def.transforms, (v) => v.toLowerCase()] }); }
  lowercase(): VldStringV2 { return this.toLowerCase(); }
  toUpperCase(): VldStringV2 { return this.withDef({ type: 'string', transforms: [...this.__def.transforms, (v) => v.toUpperCase()] }); }
  uppercase(): VldStringV2 { return this.toUpperCase(); }
  normalize(form?: 'NFC' | 'NFD' | 'NFKC' | 'NFKD'): VldStringV2 {
    return this.withDef({ type: 'string', transforms: [...this.__def.transforms, (v) => v.normalize(form)] });
  }
  slugify(): VldStringV2 {
    return this.withDef({ type: 'string', transforms: [...this.__def.transforms, (v) => v.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')] });
  }
  startsWith(str: string, message?: ErrorParam): VldStringV2 {
    return this.withDef({ type: 'string', checks: [...this.__def.checks, new VldCheckStartsWith(str, resolveErrorMessage(message, getMessages().stringStartsWith(str)))], errorMessage: resolveErrorMessage(message, getMessages().stringStartsWith(str)) });
  }
  endsWith(str: string, message?: ErrorParam): VldStringV2 {
    return this.withDef({ type: 'string', checks: [...this.__def.checks, new VldCheckEndsWith(str, resolveErrorMessage(message, getMessages().stringEndsWith(str)))], errorMessage: resolveErrorMessage(message, getMessages().stringEndsWith(str)) });
  }
  includes(str: string, message?: ErrorParam): VldStringV2 {
    return this.withDef({ type: 'string', checks: [...this.__def.checks, new VldCheckIncludes(str, resolveErrorMessage(message, getMessages().stringIncludes(str)))], errorMessage: resolveErrorMessage(message, getMessages().stringIncludes(str)) });
  }
  ip(message?: ErrorParam): VldStringV2 {
    return this.withDef({ type: 'string', checks: [...this.__def.checks, new VldCheckIp(resolveErrorMessage(message, getMessages().stringIp))], jsonSchema: { ...this.__def.jsonSchema, format: 'ip' }, errorMessage: resolveErrorMessage(message, getMessages().stringIp) });
  }
  ipv4(message?: ErrorParam): VldStringV2 {
    return this.withDef({ type: 'string', checks: [...this.__def.checks, new VldCheckIpv4(resolveErrorMessage(message, getMessages().stringIpv4))], jsonSchema: { ...this.__def.jsonSchema, format: 'ipv4' }, errorMessage: resolveErrorMessage(message, getMessages().stringIpv4) });
  }
  ipv6(message?: ErrorParam): VldStringV2 {
    return this.withDef({ type: 'string', checks: [...this.__def.checks, new VldCheckIpv6(resolveErrorMessage(message, getMessages().stringIpv6))], jsonSchema: { ...this.__def.jsonSchema, format: 'ipv6' }, errorMessage: resolveErrorMessage(message, getMessages().stringIpv6) });
  }
  nonempty(message?: ErrorParam): VldStringV2 {
    return this.withDef({ type: 'string', checks: [...this.__def.checks, new VldCheckMin(1, resolveErrorMessage(message, getMessages().stringEmpty))], jsonSchema: { ...this.__def.jsonSchema, minLength: Math.max(this.__def.jsonSchema?.minLength || 0, 1) }, errorMessage: resolveErrorMessage(message, getMessages().stringEmpty) });
  }
  private addFormat(pattern: RegExp, formatName: string, message?: ErrorParam): VldStringV2 {
    return this.withDef({ type: 'string', checks: [...this.__def.checks, new VldCheckRegexFormat(pattern, formatName, resolveErrorMessage(message, `Invalid ${formatName}`))], jsonSchema: { ...this.__def.jsonSchema, format: formatName, pattern: pattern.source } as any, errorMessage: resolveErrorMessage(message, `Invalid ${formatName}`) });
  }
  uuidv4(message?: ErrorParam): VldStringV2 { return this.addFormat(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, 'uuid', message); }
  uuidv6(message?: ErrorParam): VldStringV2 { return this.addFormat(/^[0-9a-f]{8}-[0-9a-f]{4}-6[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, 'uuid', message); }
  uuidv7(message?: ErrorParam): VldStringV2 { return this.addFormat(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, 'uuid', message); }
  emoji(message?: ErrorParam): VldStringV2 { return this.addFormat(/^(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F)(?:\u200D(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F))*$/u, 'emoji', message); }
  base64(message?: ErrorParam): VldStringV2 { return this.addFormat(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/, 'base64', message); }
  base64url(message?: ErrorParam): VldStringV2 { return this.addFormat(/^[A-Za-z0-9_-]*$/, 'base64url', message); }
  jwt(message?: ErrorParam): VldStringV2 { return this.addFormat(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/, 'jwt', message); }
  nanoid(message?: ErrorParam): VldStringV2 { return this.addFormat(/^[A-Za-z0-9_-]{21}$/, 'nanoid', message); }
  cuid(message?: ErrorParam): VldStringV2 { return this.addFormat(/^c[^\s-]{8,}$/i, 'cuid', message); }
  cuid2(message?: ErrorParam): VldStringV2 { return this.addFormat(/^[0-9a-z]+$/, 'cuid2', message); }
  ulid(message?: ErrorParam): VldStringV2 { return this.addFormat(/^[0-9A-HJKMNP-TV-Z]{26}$/, 'ulid', message); }
  cidrv4(message?: ErrorParam): VldStringV2 { return this.addFormat(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:3[0-2]|[12]?[0-9])$/, 'cidrv4', message); }
  cidrv6(message?: ErrorParam): VldStringV2 { return this.addFormat(/^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\/(?:12[0-8]|1[01][0-9]|[1-9]?[0-9])$|^::(?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}\/(?:12[0-8]|1[01][0-9]|[1-9]?[0-9])$|^(?:[0-9a-fA-F]{1,4}:){1,7}:\/(?:12[0-8]|1[01][0-9]|[1-9]?[0-9])$/, 'cidrv6', message); }
  e164(message?: ErrorParam): VldStringV2 { return this.addFormat(/^\+[1-9]\d{1,14}$/, 'e164', message); }
  xid(message?: ErrorParam): VldStringV2 { return this.addFormat(/^[A-HJKMNP-TV-Z0-9]{20}$/, 'xid', message); }
  guid(message?: ErrorParam): VldStringV2 { return this.addFormat(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i, 'guid', message); }
  ksuid(message?: ErrorParam): VldStringV2 { return this.addFormat(/^[0-9A-Za-z]{27}$/, 'ksuid', message); }
  date(message?: ErrorParam): VldStringV2 { return this.addFormat(/^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/, 'date', message); }
  time(message?: ErrorParam): VldStringV2 { return this.addFormat(/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?$/, 'time', message); }
  datetime(message?: ErrorParam): VldStringV2 { return this.addFormat(/^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?Z?$/, 'datetime', message); }
  duration(message?: ErrorParam): VldStringV2 { return this.addFormat(/^-?P(?!$)(?:\d+(?:\.\d+)?Y)?(?:\d+(?:\.\d+)?M)?(?:\d+(?:\.\d+)?W)?(?:\d+(?:\.\d+)?D)?(?:T(?=\d)(?:\d+(?:\.\d+)?H)?(?:\d+(?:\.\d+)?M)?(?:\d+(?:\.\d+)?S)?)?$/, 'duration', message); }
}

// --------------------------------------------------------------------------
// VldCoerceStringV2
// --------------------------------------------------------------------------

export class VldCoerceStringV2 extends VldStringV2 {
  constructor(def: VldStringDef = EMPTY_STRING_DEF) {
    super(def);
    (this as any).validatorType = VLD_VALIDATOR_TYPES.COERCE_STRING;
  }

  static override create(): VldCoerceStringV2 {
    return new VldCoerceStringV2();
  }

  override parse(value: unknown): string {
    let coerced: string;
    if (typeof value === 'string') coerced = value;
    else if (typeof value === 'number') coerced = String(value);
    else if (typeof value === 'boolean') coerced = value ? 'true' : 'false';
    else if (typeof value === 'bigint') coerced = value.toString();
    else if (typeof value === 'symbol') coerced = String(value);
    else if (value === null || value === undefined) {
      throw new Error(getMessages().coercionFailed('string', value));
    } else if (value instanceof Date) coerced = value.toISOString();
    else if (Array.isArray(value)) coerced = value.join(',');
    else if (value instanceof RegExp) coerced = value.toString();
    else if (value instanceof Error) coerced = value.message || value.toString();
    else coerced = String(value);

    if (coerced.length > 1000000) {
      throw new Error(getMessages().coercionFailed('string', value));
    }
    // eslint-disable-next-line no-control-regex
    const sanitized = coerced.replace(/[\x00-\x1F\x7F]/g, '');
    return super.parse(sanitized);
  }
}
