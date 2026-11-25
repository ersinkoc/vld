/**
 * Zod 4 string-format regex sources and the low-level format helpers.
 *
 * Kept out of ./string-formats so a lean `v.string()` bundle never pulls the
 * format schema classes (see scripts/verify-bundle.cjs).
 */


export interface ISOTimeOptions {
  precision?: number | null;
}

export interface ISODateTimeOptions extends ISOTimeOptions {
  local?: boolean;
  offset?: boolean;
}

const DATE_SOURCE = '(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))';

export function testRegex(pattern: RegExp, value: string): boolean {
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

export function uuidRegex(version?: number): RegExp {
  if (version === undefined) {
    return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;
  }
  return new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`);
}

function timeRegex(options: ISOTimeOptions = {}): RegExp {
  return new RegExp(`^${timeSource(options)}$`);
}

/**
 * Zod's `iso.datetime` / `string().datetime` pattern: RFC 3339 needs seconds
 * wherever the time carries `Z` or an offset, so only the unqualified `local`
 * form may stop at minutes. (`regexes.datetime` keeps its lenient form.)
 */
export function isoDateTimeRegex(options: ISODateTimeOptions = {}): RegExp {
  const zones = ['Z'];
  if (options.offset) zones.push('([+-](?:[01]\\d|2[0-3]):[0-5]\\d)');
  const seconds = typeof options.precision === 'number' ? timeSource(options) : '(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?';
  const qualified = `${seconds}(?:${zones.join('|')})`;
  return new RegExp(`^${DATE_SOURCE}T(?:${options.local ? `${qualified}|${timeSource(options)}` : qualified})$`);
}

/** Zod params of `string().time()` / `.datetime()`: options merged with the message. */
export function isoFormatOptions<T extends object>(params: unknown): T | undefined {
  return typeof params === 'object' && params !== null ? (params as T) : undefined;
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
  | 'anyString' | 'base64' | 'base64url' | 'bigint' | 'boolean' | 'browserEmail' | 'cidrv4' | 'cidrv6'
  | 'creditCard' | 'currencyCode' | 'cuid' | 'cuid2' | 'date' | 'domain' | 'duration' | 'e164' | 'email' | 'extendedDuration'
  | 'guid' | 'hex' | 'hostname' | 'html5Email' | 'httpProtocol' | 'httpUrl' | 'iban' | 'idnEmail'
  | 'integer' | 'ipv4' | 'ipv6' | 'jwt' | 'ksuid' | 'lowercase' | 'md5' | 'md5_base64'
  | 'md5_base64url' | 'md5_hex' | 'nanoid' | 'null' | 'number' | 'rfc5322Email'
  | 'sha1' | 'sha1_base64' | 'sha1_base64url' | 'sha1_hex' | 'sha256' | 'sha256_base64'
  | 'sha256_base64url' | 'sha256_hex' | 'sha384' | 'sha384_base64' | 'sha384_base64url'
  | 'sha384_hex' | 'sha512' | 'sha512_base64' | 'sha512_base64url' | 'sha512_hex'
  | 'ulid' | 'undefined' | 'unicodeEmail' | 'uppercase' | 'uuid4' | 'uuid6' | 'uuid7' | 'xid';

export type RegexNamespace = Readonly<Record<StaticRegexName, RegExp> & {
  nanoidOfLength: (length: number) => RegExp;
  datetime: typeof isoDateTimeRegex;
  emoji: () => RegExp;
  mac: typeof macRegex;
  string: typeof stringRegex;
  time: typeof timeRegex;
  uuid: typeof uuidRegex;
}>;

/** Public regex helpers matching the current Zod 4 namespace. */
export const regexes: RegexNamespace = {
  cuid: /^[cC][0-9a-z]{6,}$/,
  cuid2: /^[0-9a-z]+$/,
  // First character is the top of a 48-bit timestamp, so it cannot exceed 7 (Zod 4.6 source).
  ulid: /^[0-7][0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{25}$/,
  xid: /^[0-9a-vA-V]{20}$/,
  ksuid: /^[A-Za-z0-9]{27}$/,
  nanoid: /^[a-zA-Z0-9_-]{21}$/,
  nanoidOfLength: (length: number) => new RegExp(`^[a-zA-Z0-9_-]{${length}}$`),
  duration: /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/,
  extendedDuration: /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/,
  guid: /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/,
  // Zod 4.6 IBAN electronic format: 2-letter country, check digits 02-98, 11-30 bban chars.
  // The ISO 7064 MOD 97-10 checksum is not expressible as a pattern and runs in code.
  iban: /^[A-Z]{2}(?!00|01|99)\d{2}[A-Z0-9]{11,30}$/,
  // Zod 4.6 additions to the regex namespace.
  currencyCode: /^(?:AED|AFN|ALL|AMD|AOA|ARS|AUD|AWG|AZN|BAM|BBD|BDT|BHD|BIF|BMD|BND|BOB|BOV|BRL|BSD|BTN|BWP|BYN|BZD|CAD|CDF|CHE|CHF|CHW|CLF|CLP|CNY|COP|COU|CRC|CUP|CVE|CZK|DJF|DKK|DOP|DZD|EGP|ERN|ETB|EUR|FJD|FKP|GBP|GEL|GHS|GIP|GMD|GNF|GTQ|GYD|HKD|HNL|HTG|HUF|IDR|ILS|INR|IQD|IRR|ISK|JMD|JOD|JPY|KES|KGS|KHR|KMF|KPW|KRW|KWD|KYD|KZT|LAK|LBP|LKR|LRD|LSL|LYD|MAD|MDL|MGA|MKD|MMK|MNT|MOP|MRU|MUR|MVR|MWK|MXN|MXV|MYR|MZN|NAD|NGN|NIO|NOK|NPR|NZD|OMR|PAB|PEN|PGK|PHP|PKR|PLN|PYG|QAR|RON|RSD|RUB|RWF|SAR|SBD|SCR|SDG|SEK|SGD|SHP|SLE|SOS|SRD|SSP|STN|SVC|SYP|SZL|THB|TJS|TMT|TND|TOP|TRY|TTD|TWD|TZS|UAH|UGX|USD|USN|UYI|UYU|UYW|UZS|VED|VES|VND|VUV|WST|XAD|XAF|XAG|XAU|XBA|XBB|XBC|XBD|XCD|XCG|XDR|XOF|XPD|XPF|XPT|XSU|XTS|XUA|XXX|YER|ZAR|ZMW|ZWG)$/,
  anyString: /^[\s\S]{0,}$/,
  creditCard: /^\d(?:[ -]?\d){11,18}$/,
  uuid: uuidRegex,
  uuid4: uuidRegex(4),
  uuid6: uuidRegex(6),
  uuid7: uuidRegex(7),
  // Zod 4.6's email rule without its `(?!\.)` / `(?!.*\.\.)` lookaheads: the
  // dot-atom local part rejects leading, trailing and consecutive dots by
  // structure, so accept/reject stays identical (checked against
  // z.string().email()) while the pattern costs less per call.
  email: /^((?:[A-Za-z0-9_'+-]+\.)*[A-Za-z0-9_'+-]*[A-Za-z0-9_+-])@([A-Za-z0-9][A-Za-z0-9-]*\.)+[A-Za-z]{2,}$/,
  html5Email: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  // Keep the official Zod 4.4.3 RFC 5322 source byte-for-byte for differential parity.
  // eslint-disable-next-line no-useless-escape
  rfc5322Email: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}))$/,
  unicodeEmail: /^[^\s@"]{1,64}@[^\s@]{1,255}$/u,
  idnEmail: /^[^\s@"]{1,64}@[^\s@]{1,255}$/u,
  browserEmail: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  // Zod 4.6 source byte-for-byte: the lookahead rejects component-only strings
  // (e.g. "123", U+25AB with a text VS) while keycaps and flags stay accepted.
  emoji: () => /^(?=[\s\S]*[\p{Extended_Pictographic}\p{Regional_Indicator}\u20E3])[\p{Extended_Pictographic}\p{Emoji_Component}]+$/u,
  ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/,
  ipv6: /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/,
  mac: macRegex,
  cidrv4: /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/,
  cidrv6: /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,
  base64: /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/,
  // Zod 4.6 base64url source: charset + mod-4 length (RFC 4648 unpadded).
  base64url: /^(?:[A-Za-z0-9_-]{4})*(?:[A-Za-z0-9_-]{2,3})?$/,
  hostname: /^(?=.{1,253}\.?$)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[-0-9a-zA-Z]{0,61}[0-9a-zA-Z])?)*\.?$/,
  domain: /^([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
  httpProtocol: /^https?$/,
  e164: /^\+[1-9]\d{6,14}$/,
  date: new RegExp(`^${DATE_SOURCE}$`),
  time: timeRegex,
  datetime: isoDateTimeRegex,
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

// Zod's isValidJWT: three segments, a JSON header with an `alg` (and
// typ "JWT" if present), and - when given - exactly the expected algorithm.
export const isValidJwtToken = (value: string, algorithm: string | null): boolean => {
  try {
    const parts = value.split('.');
    if (parts.length !== 3 || !parts[0]) return false;
    const base64 = parts[0].replace(/-/g, '+').replace(/_/g, '/');
    const header = JSON.parse(atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4)));
    if (typeof header !== 'object' || header === null) return false;
    if ('typ' in header && header.typ !== 'JWT') return false;
    if (!header.alg) return false;
    return !algorithm || header.alg === algorithm;
  } catch {
    return false;
  }
};
