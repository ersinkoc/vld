import { LocaleMessages } from './types';

export const en: LocaleMessages = {
  // String validation messages
  invalidString: 'Invalid string',
  stringMin: (min: number) => `String must be at least ${min} characters`,
  stringMax: (max: number) => `String must be at most ${max} characters`,
  stringLength: (length: number) => `String must be exactly ${length} characters`,
  stringEmail: 'Invalid email address',
  stringUrl: 'Invalid URL',
  stringUuid: 'Invalid UUID',
  stringRegex: 'Invalid format',
  stringStartsWith: (prefix: string) => `String must start with "${prefix}"`,
  stringEndsWith: (suffix: string) => `String must end with "${suffix}"`,
  stringIncludes: (substring: string) => `String must include "${substring}"`,
  stringIp: 'Invalid IP address',
  stringIpv4: 'Invalid IPv4 address',
  stringIpv6: 'Invalid IPv6 address',
  stringEmpty: 'String must not be empty',

  // Number validation messages
  invalidNumber: 'Invalid number',
  numberMin: (min: number) => `Number must be at least ${min}`,
  numberMax: (max: number) => `Number must be at most ${max}`,
  numberInt: 'Number must be an integer',
  numberPositive: 'Number must be positive',
  numberNegative: 'Number must be negative',
  numberNonnegative: 'Number must be non-negative',
  numberNonpositive: 'Number must be non-positive',
  numberFinite: 'Number must be finite',
  numberSafe: 'Number must be a safe integer',
  numberMultipleOf: (value: number) => `Number must be a multiple of ${value}`,

  // Boolean validation messages
  invalidBoolean: 'Invalid boolean',

  // Date validation messages
  invalidDate: 'Invalid date',
  dateMin: (date: Date) => `Date must be after ${date.toISOString()}`,
  dateMax: (date: Date) => `Date must be before ${date.toISOString()}`,

  // Object validation messages
  invalidObject: 'Invalid object',
  unexpectedKeys: (keys: string[]) => `Unexpected keys: ${keys.join(', ')}`,

  // Array validation messages
  invalidArray: 'Invalid array',
  arrayMin: (min: number) => `Array must have at least ${min} items`,
  arrayMax: (max: number) => `Array must have at most ${max} items`,
  arrayLength: (length: number) => `Array must have exactly ${length} items`,
  arrayEmpty: 'Array must not be empty',
  arrayItem: (index: number, error: string) => `Invalid item at index ${index}: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `Invalid field "${field}": ${error}`,

  // Union validation messages
  unionNoMatch: (errors: string[]) => `No union member matched: ${errors.join(', ')}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `Expected ${expected}, got ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `Expected one of [${values.join(', ')}], got ${received}`,

  // Special type validation messages
  expectedUndefined: 'Expected undefined',
  neverType: 'Never type cannot be parsed'
};