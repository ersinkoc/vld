/**
 * Tests to cover remaining coverage gaps
 * This file targets specific uncovered lines to reach 100% coverage
 */

// ============================================
// Pigment Coverage (line 33)
// ============================================
import { pigment, supportsColor } from '../src/pigment';

describe('Pigment Coverage', () => {
  test('supportsColor returns boolean based on environment', () => {
    const result = supportsColor();
    expect(typeof result).toBe('boolean');
  });

  test('pigment handles non-color environment', () => {
    const result = pigment.red('test');
    expect(result).toContain('test');
  });
});

// ============================================
// Codec Utils Coverage (lines 170, 174, 223, 235, 240-243)
// ============================================
import {
  base64ToUint8Array,
  uint8ArrayToBase64,
  hexToUint8Array,
  uint8ArrayToHex,
  stringToUint8Array,
  uint8ArrayToString,
} from '../src/utils/codec-utils';

describe('Codec Utils Coverage', () => {
  test('base64ToUint8Array with invalid base64', () => {
    expect(() => base64ToUint8Array('!!invalid!!')).toThrow();
  });

  test('hexToUint8Array with invalid hex', () => {
    // 'abc' is valid hex (pads to '0abc'), 'ghij' contains invalid chars
    expect(() => hexToUint8Array('ghij')).toThrow();
    expect(() => hexToUint8Array('xyz')).toThrow();
  });

  test('uint8ArrayToString with empty array', () => {
    const result = uint8ArrayToString(new Uint8Array(0));
    expect(result).toBe('');
  });

  test('stringToUint8Array with empty string', () => {
    const result = stringToUint8Array('');
    expect(result).toEqual(new Uint8Array(0));
  });

  test('uint8ArrayToHex with various inputs', () => {
    expect(uint8ArrayToHex(new Uint8Array([0, 255]))).toBe('00ff');
    expect(uint8ArrayToHex(new Uint8Array([]))).toBe('');
  });

  test('uint8ArrayToBase64 with various inputs', () => {
    expect(uint8ArrayToBase64(new Uint8Array([]))).toBe('');
    expect(uint8ArrayToBase64(new Uint8Array([72, 101, 108, 108, 111]))).toBe('SGVsbG8=');
  });
});

// ============================================
// Deep Merge Coverage (line 43)
// ============================================
import { deepMerge } from '../src/utils/deep-merge';

describe('Deep Merge Coverage', () => {
  test('deepMerge with null prototype object', () => {
    const obj = Object.create(null);
    obj.a = 1;
    const result = deepMerge({} as Record<string, unknown>, obj as Record<string, unknown>);
    expect((result as Record<string, unknown>).a).toBe(1);
  });

  test('deepMerge with undefined values', () => {
    const result = deepMerge({ a: 1 }, { a: undefined });
    expect(result.a).toBe(undefined);
  });
});

// ============================================
// IP Validation Coverage (line 106)
// ============================================
import { isValidIPv6 } from '../src/utils/ip-validation';

describe('IP Validation Coverage', () => {
  test('isValidIPv6 edge cases', () => {
    expect(isValidIPv6('::ffff:192.168.1.1')).toBe(true);
    expect(isValidIPv6('fe80::1%eth0')).toBe(true);
    expect(isValidIPv6(':::')).toBe(false);
    expect(isValidIPv6('')).toBe(false);
  });
});

// ============================================
// Array Validator Coverage (line 151)
// ============================================
import { v } from '../src/index';

describe('Array Validator Coverage', () => {
  test('array with non-JSON-serializable items', () => {
    const schema = v.array(v.any());
    const circular: Record<string, unknown> = { a: 1 };
    circular.self = circular;
    const result = schema.safeParse([circular]);
    expect(result.success).toBe(true);
  });
});

// ============================================
// File Validator Coverage (line 45)
// ============================================
describe('File Validator Coverage', () => {
  test('file validator with non-File object', () => {
    const schema = v.file();
    expect(() => schema.parse({ name: 'test.txt', size: 100 })).toThrow();
  });
});

// ============================================
// Number Validator Coverage (line 52)
// ============================================
describe('Number Validator Coverage', () => {
  test('number validator with NaN', () => {
    const schema = v.number();
    expect(() => schema.parse(NaN)).toThrow();
  });

  test('number validator with Infinity', () => {
    const schema = v.number().finite();
    expect(() => schema.parse(Infinity)).toThrow();
    expect(() => schema.parse(-Infinity)).toThrow();
  });
});

// ============================================
// Object Validator Coverage (line 441)
// ============================================
describe('Object Validator Coverage', () => {
  test('object with catchall and extra keys', () => {
    const schema = v.object({
      name: v.string(),
    }).catchall(v.number());

    const result = schema.parse({
      name: 'test',
      extra1: 1,
      extra2: 2,
    });

    expect(result.name).toBe('test');
    expect((result as Record<string, unknown>).extra1).toBe(1);
    expect((result as Record<string, unknown>).extra2).toBe(2);
  });
});

// ============================================
// String Validator Coverage (lines 90, 258)
// ============================================
describe('String Validator Coverage', () => {
  test('string with regex pattern', () => {
    // Test regex without global flag (no state issues)
    const schema = v.string().regex(/^[a-z]+$/);
    expect(schema.parse('test')).toBe('test');
    expect(schema.parse('hello')).toBe('hello');
  });

  test('string length with exact length', () => {
    const schema = v.string().length(5);
    expect(schema.parse('hello')).toBe('hello');
    expect(() => schema.parse('hi')).toThrow();
    expect(() => schema.parse('hello world')).toThrow();
  });
});

// ============================================
// String Formats Coverage (line 160)
// ============================================
import * as stringFormats from '../src/validators/string-formats';

describe('String Formats Coverage', () => {
  test('stringFormat with custom validator function', () => {
    const schema = stringFormats.stringFormat('custom', (val) => val.startsWith('X'));
    expect(schema.parse('Xtest')).toBe('Xtest');
    expect(() => schema.parse('test')).toThrow();
  });

  test('stringFormat with regex', () => {
    const schema = stringFormats.stringFormat('pattern', /^[A-Z]+$/);
    expect(schema.parse('ABC')).toBe('ABC');
    expect(() => schema.parse('abc')).toThrow();
  });
});

// ============================================
// Codecs Index Coverage (lines 168, 186, 190-193, 360)
// ============================================
import {
  stringToNumber,
  stringToInt,
  isoDatetimeToDate,
  epochSecondsToDate,
  base64Json,
} from '../src/codecs';

describe('Codecs Coverage', () => {
  test('stringToNumber with invalid string', () => {
    const codec = stringToNumber;
    const result = codec.safeParse('not-a-number');
    expect(result.success).toBe(false);
  });

  test('stringToInt with non-numeric string', () => {
    const codec = stringToInt;
    const result = codec.safeParse('not-a-number');
    expect(result.success).toBe(false);
  });

  test('isoDatetimeToDate with invalid date', () => {
    const codec = isoDatetimeToDate;
    const result = codec.safeParse('not-a-date');
    expect(result.success).toBe(false);
  });

  test('epochSecondsToDate encoding', () => {
    const codec = epochSecondsToDate;
    const date = new Date('2023-01-01T00:00:00Z');
    const encoded = codec.encode(date);
    expect(typeof encoded).toBe('number');
  });

  test('base64Json with invalid JSON', () => {
    const codec = base64Json();
    const invalidBase64 = Buffer.from('not-valid-json').toString('base64');
    const result = codec.safeParse(invalidBase64);
    expect(result.success).toBe(false);
  });
});

// ============================================
// Errors Coverage (lines 258, 270, 276)
// ============================================
import { VldError, treeifyError, prettifyError, flattenError } from '../src/errors';

describe('Errors Coverage', () => {
  test('treeifyError with nested errors', () => {
    const error = new VldError([
      { path: ['user', 'name'], message: 'Required', code: 'custom' as const },
      { path: ['user', 'age'], message: 'Must be number', code: 'invalid_type' as const },
    ]);
    const tree = treeifyError(error);
    expect(tree).toBeDefined();
  });

  test('prettifyError with various options', () => {
    const error = new VldError([
      { path: ['field'], message: 'Error message', code: 'custom' as const },
    ]);
    const pretty = prettifyError(error, { colored: false });
    expect(pretty).toContain('field');
    expect(pretty).toContain('Error message');
  });

  test('flattenError with deep path', () => {
    const error = new VldError([
      { path: ['a', 'b', 'c', 'd'], message: 'Deep error', code: 'custom' as const },
    ]);
    const flat = flattenError(error);
    // flattenError uses only the first path segment as field name
    expect(flat.fieldErrors['a']).toBeDefined();
    expect(flat.fieldErrors['a']).toContain('Deep error');
  });
});

// ============================================
// Base64 Validator Coverage (line 15)
// ============================================
describe('Base64 Validator Coverage', () => {
  test('base64 with invalid input type', () => {
    const schema = v.base64Bytes();
    expect(() => schema.parse(123)).toThrow();
    expect(() => schema.parse(null)).toThrow();
  });
});

// ============================================
// Hex Validator Coverage (line 14)
// ============================================
describe('Hex Validator Coverage', () => {
  test('hex with invalid input type', () => {
    const schema = v.hexBytes();
    expect(() => schema.parse(123)).toThrow();
    expect(() => schema.parse(null)).toThrow();
  });
});

// ============================================
// BigInt Validator Coverage (lines 52, 159-168)
// ============================================
describe('BigInt Validator Coverage', () => {
  test('bigint with various constraints', () => {
    const schema = v.bigint().min(BigInt(0)).max(BigInt(100));
    expect(schema.parse(BigInt(50))).toBe(BigInt(50));
    expect(() => schema.parse(BigInt(-1))).toThrow();
    expect(() => schema.parse(BigInt(101))).toThrow();
  });

  test('bigint positive and negative', () => {
    const posSchema = v.bigint().positive();
    const negSchema = v.bigint().negative();
    expect(posSchema.parse(BigInt(1))).toBe(BigInt(1));
    expect(negSchema.parse(BigInt(-1))).toBe(BigInt(-1));
  });
});

// ============================================
// Function Validator Coverage (line 26)
// ============================================
describe('Function Validator Coverage', () => {
  test('function validator with arrow function', () => {
    const schema = v.function();
    const fn = () => 'test';
    expect(schema.parse(fn)).toBe(fn);
  });

  test('function validator with non-function', () => {
    const schema = v.function();
    expect(() => schema.parse('not a function')).toThrow();
    expect(() => schema.parse({})).toThrow();
  });
});

// ============================================
// Lazy Locale Coverage (lines 39, 42, 102-104, 120)
// ============================================
import {
  setLocaleAsync,
  setLocale,
  getLocale,
  getMessages,
  isLocaleLoaded,
  isLocaleSupported,
  getSupportedLocales,
  preloadLocales,
  getMessagesForLocale,
} from '../src/locales/lazy';

describe('Lazy Locale Coverage', () => {
  test('setLocaleAsync with unsupported locale', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    await setLocaleAsync('unsupported' as any);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test('setLocale with unloaded locale throws', () => {
    expect(() => setLocale('xyz' as any)).toThrow();
  });

  test('getLocale returns current locale', () => {
    const locale = getLocale();
    expect(typeof locale).toBe('string');
  });

  test('getMessages returns locale messages', () => {
    const messages = getMessages();
    expect(messages).toBeDefined();
    expect(typeof messages.invalidString).toBe('string');
  });

  test('isLocaleLoaded checks if locale is preloaded', () => {
    expect(isLocaleLoaded('en')).toBe(true);
    expect(isLocaleLoaded('xyz' as any)).toBe(false);
  });

  test('isLocaleSupported checks if locale can be loaded', () => {
    expect(isLocaleSupported('en')).toBe(true);
    expect(isLocaleSupported('tr')).toBe(true);
    expect(isLocaleSupported('xyz' as any)).toBe(false);
  });

  test('getSupportedLocales returns all supported locales', () => {
    const locales = getSupportedLocales();
    expect(locales).toContain('en');
    expect(locales).toContain('tr');
    expect(locales.length).toBeGreaterThan(10);
  });

  test('preloadLocales loads multiple locales', async () => {
    await preloadLocales(['de', 'fr']);
    expect(isLocaleLoaded('de')).toBe(true);
    expect(isLocaleLoaded('fr')).toBe(true);
  });

  test('preloadLocales handles unsupported locale silently', async () => {
    await preloadLocales(['xyz' as any]);
    expect(isLocaleLoaded('xyz' as any)).toBe(false);
  });

  test('getMessagesForLocale returns English fallback for unloaded locale', () => {
    const messages = getMessagesForLocale('xyz' as any);
    expect(messages).toBeDefined();
    expect(messages.invalidString).toBe('Invalid string');
  });
});

// ============================================
// More Codecs Coverage
// ============================================
import {
  stringToURL,
  stringToHttpURL,
  jwtPayload,
  stringToBoolean,
} from '../src/codecs';

describe('More Codecs Coverage', () => {
  test('stringToURL with invalid URL', () => {
    const codec = stringToURL;
    const result = codec.safeParse('not-a-url');
    expect(result.success).toBe(false);
  });

  test('stringToHttpURL with invalid protocol', () => {
    const codec = stringToHttpURL;
    const result = codec.safeParse('ftp://example.com');
    expect(result.success).toBe(false);
  });

  test('jwtPayload with invalid JWT', () => {
    const codec = jwtPayload();
    const result = codec.safeParse('not.a.jwt');
    expect(result.success).toBe(false);
  });

  test('jwtPayload encoding throws', () => {
    const codec = jwtPayload();
    expect(() => codec.encode({})).toThrow();
  });

  test('stringToBoolean with invalid string', () => {
    const codec = stringToBoolean;
    const result = codec.safeParse('maybe');
    expect(result.success).toBe(false);
  });
});

// ============================================
// More Codec Utils Coverage
// ============================================
import { safeAtob, safeBtoa } from '../src/utils/codec-utils';

describe('More Codec Utils Coverage', () => {
  test('safeAtob with valid base64', () => {
    const result = safeAtob('SGVsbG8=');
    expect(result).toBe('Hello');
  });

  test('safeBtoa with valid string', () => {
    const result = safeBtoa('Hello');
    expect(result).toBe('SGVsbG8=');
  });

  test('safeAtob with invalid padding', () => {
    expect(() => safeAtob('SGVsbG8===')).toThrow();
  });

  test('safeAtob with null throws', () => {
    expect(() => safeAtob(null as any)).toThrow();
  });

  test('safeAtob with non-string throws', () => {
    expect(() => safeAtob(123 as any)).toThrow();
  });
});

// ============================================
// More String Validator Coverage
// ============================================
describe('More String Validator Coverage', () => {
  test('string startsWith and endsWith', () => {
    const schema = v.string().startsWith('Hello').endsWith('World');
    expect(schema.parse('Hello World')).toBe('Hello World');
    expect(() => schema.parse('Hi World')).toThrow();
    expect(() => schema.parse('Hello there')).toThrow();
  });

  test('string includes', () => {
    const schema = v.string().includes('test');
    expect(schema.parse('this is a test')).toBe('this is a test');
    expect(() => schema.parse('hello')).toThrow();
  });

  test('string trim', () => {
    const schema = v.string().trim();
    expect(schema.parse('  hello  ')).toBe('hello');
  });

  test('string toLowerCase and toUpperCase', () => {
    const lowerSchema = v.string().toLowerCase();
    const upperSchema = v.string().toUpperCase();
    expect(lowerSchema.parse('HELLO')).toBe('hello');
    expect(upperSchema.parse('hello')).toBe('HELLO');
  });
});

// ============================================
// More Errors Coverage
// ============================================
import { prettifyErrorColored, prettifyErrorPlain, createIssue, getValueType, VldError as VldErr } from '../src/errors';

describe('More Errors Coverage', () => {
  test('prettifyErrorColored returns colored output', () => {
    const error = new VldErr([
      { path: [], message: 'Test error', code: 'custom' as const },
    ]);
    const pretty = prettifyErrorColored(error);
    expect(pretty).toContain('Test error');
  });

  test('prettifyErrorPlain returns plain output', () => {
    const error = new VldErr([
      { path: [], message: 'Test error', code: 'custom' as const },
    ]);
    const pretty = prettifyErrorPlain(error);
    expect(pretty).toContain('Test error');
  });

  test('prettifyError with includeCode and includeDetails', () => {
    const error = new VldErr([
      { path: ['field'], message: 'Test', code: 'invalid_type' as const, expected: 'string', received: 'number' },
    ]);
    const pretty = prettifyError(error, { colored: false, includeCode: true, includeDetails: true });
    expect(pretty).toContain('[invalid_type]');
    expect(pretty).toContain('expected: string');
    expect(pretty).toContain('received: number');
  });

  test('createIssue creates proper issue', () => {
    const issue = createIssue('custom' as const, ['a', 'b'], 'Test message');
    expect(issue.code).toBe('custom');
    expect(issue.path).toEqual(['a', 'b']);
    expect(issue.message).toBe('Test message');
  });

  test('getValueType returns correct types', () => {
    expect(getValueType(null)).toBe('null');
    expect(getValueType(undefined)).toBe('undefined');
    expect(getValueType([])).toBe('array');
    expect(getValueType(new Date())).toBe('date');
    expect(getValueType('string')).toBe('string');
    expect(getValueType(123)).toBe('number');
    expect(getValueType({})).toBe('object');
  });

  test('VldError toJSON and fromJSON', () => {
    const error = new VldErr([
      { path: ['a'], message: 'Test', code: 'custom' as const },
    ]);
    const json = error.toJSON();
    expect(json.name).toBe('VldError');
    expect(json.code).toBe('VLD_VALIDATION_ERROR');

    const restored = VldErr.fromJSON(json);
    expect(restored.issues[0].message).toBe('Test');
  });

  test('VldError.isVldError checks correctly', () => {
    const error = new VldErr([{ path: [], message: 'Test', code: 'custom' as const }]);
    expect(VldErr.isVldError(error)).toBe(true);
    expect(VldErr.isVldError(new Error('test'))).toBe(false);
    expect(VldErr.isVldError(null)).toBe(false);
  });

  test('treeifyError with array index in path', () => {
    const error = new VldErr([
      { path: [0, 'name'], message: 'Required', code: 'custom' as const },
      { path: [1], message: 'Invalid', code: 'custom' as const },
    ]);
    const tree = treeifyError(error);
    expect(tree.items).toBeDefined();
    expect(tree.items![0]).toBeDefined();
    expect(tree.items![1]).toBeDefined();
  });
});

// ============================================
// More Object Validator Coverage
// ============================================
describe('More Object Validator Coverage', () => {
  test('object passthrough mode', () => {
    const schema = v.object({ name: v.string() }).passthrough();
    const result = schema.parse({ name: 'test', extra: 'value' });
    expect(result.name).toBe('test');
    expect((result as any).extra).toBe('value');
  });

  test('object strict mode', () => {
    const schema = v.object({ name: v.string() }).strict();
    expect(() => schema.parse({ name: 'test', extra: 'value' })).toThrow();
  });

  test('object with optional keys', () => {
    const schema = v.object({
      name: v.string(),
      age: v.number().optional(),
    });
    const result = schema.parse({ name: 'test' });
    expect(result.name).toBe('test');
    expect(result.age).toBeUndefined();
  });
});

// ============================================
// More Pigment Coverage
// ============================================
import { createTheme, vldTheme, strip, pigment as p } from '../src/pigment';

describe('More Pigment Coverage', () => {
  test('createTheme creates custom theme', () => {
    const theme = createTheme({ error: (t) => `[ERROR] ${t}` });
    expect(theme.error('test')).toBe('[ERROR] test');
    expect(theme.success).toBe(vldTheme.success);
  });

  test('strip removes ANSI codes', () => {
    const colored = '\x1b[31mred\x1b[0m';
    expect(strip(colored)).toBe('red');
  });

  test('pigment.reset returns text unchanged', () => {
    expect(p.reset('hello')).toBe('hello');
  });

  test('pigment.combine creates combined styles', () => {
    const combined = p.combine(p.codes.bold, p.codes.red);
    const result = combined('test');
    expect(result).toContain('test');
  });

  test('pigment various style functions', () => {
    expect(p.dim('test')).toContain('test');
    expect(p.italic('test')).toContain('test');
    expect(p.underline('test')).toContain('test');
    expect(p.inverse('test')).toContain('test');
    expect(p.hidden('test')).toContain('test');
    expect(p.strikethrough('test')).toContain('test');
    expect(p.black('test')).toContain('test');
    expect(p.magenta('test')).toContain('test');
    expect(p.cyan('test')).toContain('test');
    expect(p.white('test')).toContain('test');
    expect(p.grey('test')).toContain('test');
    expect(p.brightRed('test')).toContain('test');
    expect(p.brightGreen('test')).toContain('test');
    expect(p.brightYellow('test')).toContain('test');
    expect(p.brightBlue('test')).toContain('test');
    expect(p.brightMagenta('test')).toContain('test');
    expect(p.brightCyan('test')).toContain('test');
    expect(p.brightWhite('test')).toContain('test');
    expect(p.bgBlack('test')).toContain('test');
    expect(p.bgRed('test')).toContain('test');
    expect(p.bgGreen('test')).toContain('test');
    expect(p.bgYellow('test')).toContain('test');
    expect(p.bgBlue('test')).toContain('test');
    expect(p.bgMagenta('test')).toContain('test');
    expect(p.bgCyan('test')).toContain('test');
    expect(p.bgWhite('test')).toContain('test');
  });

  test('pigment color functions with empty string', () => {
    expect(p.red('')).toBe('');
    expect(p.green('')).toBe('');
  });
});

// ============================================
// Additional IP Validation Coverage
// ============================================
describe('Additional IP Validation Coverage', () => {
  test('ip validator with very long string', () => {
    const schema = v.string().ip();
    // String > 100 characters should fail the check
    expect(() => schema.parse('a'.repeat(101))).toThrow();
  });
});

// ============================================
// Additional deepMerge Coverage
// ============================================
import { isPlainObject, deepFreeze } from '../src/utils/deep-merge';

describe('Additional Deep Merge Coverage', () => {
  test('isPlainObject with various types', () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({ a: 1 })).toBe(true);
    expect(isPlainObject(null)).toBe(false);
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject(new Date())).toBe(false);
    expect(isPlainObject(Object.create(null))).toBe(false);
  });

  test('deepMerge with prototype pollution attempt', () => {
    const target: Record<string, unknown> = { a: 1 };
    // This should be filtered out - using Object.assign to create an object with __proto__ key
    const source: Record<string, unknown> = Object.assign(Object.create(null), {
      b: 2
    });
    Object.defineProperty(source, '__proto__', { value: { malicious: true }, enumerable: true });
    const result = deepMerge(target, source);
    expect(result.a).toBe(1);
    expect(result.b).toBe(2);
    expect((result as any).malicious).toBeUndefined();
  });

  test('deepFreeze with circular reference', () => {
    const obj: Record<string, unknown> = { a: 1 };
    obj.self = obj;
    const frozen = deepFreeze(obj);
    expect(Object.isFrozen(frozen)).toBe(true);
  });

  test('deepFreeze with already frozen object', () => {
    const obj = Object.freeze({ a: 1 });
    const result = deepFreeze(obj);
    expect(result).toBe(obj);
  });
});

// ============================================
// Additional String Check Coverage (line 90, 258)
// ============================================
describe('Additional String Coverage', () => {
  test('string with custom check and custom message', () => {
    const schema = v.string().refine((s) => s.length > 5, 'Must be longer than 5');
    expect(() => schema.parse('hi')).toThrow('Must be longer than 5');
  });

  test('string regex with failing match', () => {
    const schema = v.string().regex(/^[A-Z]+$/);
    expect(() => schema.parse('lowercase')).toThrow();
  });
});

// ============================================
// Additional Codec Coverage
// ============================================
import { uriComponent, jsonCodec, base64ToBytes, hexToBytes, utf8ToBytes, bytesToUtf8 } from '../src/codecs';

describe('Additional Codec Coverage', () => {
  test('uriComponent with invalid encoded string', () => {
    const codec = uriComponent;
    const result = codec.safeParse('%ZZ'); // Invalid percent encoding
    expect(result.success).toBe(false);
  });

  test('jsonCodec parse and stringify', () => {
    const codec = jsonCodec();
    const result = codec.parse('{"a":1}');
    expect(result).toEqual({ a: 1 });
    const encoded = codec.encode({ b: 2 });
    expect(encoded).toBe('{"b":2}');
  });

  test('jsonCodec with invalid JSON', () => {
    const codec = jsonCodec();
    const result = codec.safeParse('not json');
    expect(result.success).toBe(false);
  });

  test('base64ToBytes encoding', () => {
    const codec = base64ToBytes;
    const encoded = codec.encode(new Uint8Array([72, 101, 108, 108, 111]));
    expect(encoded).toBe('SGVsbG8=');
  });

  test('hexToBytes encoding', () => {
    const codec = hexToBytes;
    const encoded = codec.encode(new Uint8Array([255, 0]));
    expect(encoded).toBe('ff00');
  });

  test('utf8ToBytes round trip', () => {
    const codec = utf8ToBytes;
    const bytes = codec.parse('Hello');
    expect(bytes).toBeInstanceOf(Uint8Array);
    const str = codec.encode(bytes);
    expect(str).toBe('Hello');
  });

  test('bytesToUtf8 round trip', () => {
    const codec = bytesToUtf8;
    const str = codec.parse(new Uint8Array([72, 101, 108, 108, 111]));
    expect(str).toBe('Hello');
    const bytes = codec.encode('World');
    expect(bytes).toBeInstanceOf(Uint8Array);
  });
});

// ============================================
// Additional Lazy Locale Coverage
// ============================================
describe('Additional Lazy Locale Coverage', () => {
  test('setLocaleAsync loads Turkish locale', async () => {
    await setLocaleAsync('tr');
    expect(isLocaleLoaded('tr')).toBe(true);
    expect(getLocale()).toBe('tr');
  });

  test('setLocaleAsync with already loaded locale', async () => {
    // First load
    await setLocaleAsync('es');
    expect(isLocaleLoaded('es')).toBe(true);
    // Second load should reuse cached
    await setLocaleAsync('es');
    expect(getLocale()).toBe('es');
  });

  test('setLocaleAsync back to English', async () => {
    await setLocaleAsync('en');
    expect(getLocale()).toBe('en');
  });
});

// ============================================
// Additional Array Coverage (line 151)
// ============================================
describe('Additional Array Coverage', () => {
  test('array with complex unique items', () => {
    const schema = v.array(v.object({ id: v.number() })).unique();
    const result = schema.parse([{ id: 1 }, { id: 2 }]);
    expect(result.length).toBe(2);
  });
});
