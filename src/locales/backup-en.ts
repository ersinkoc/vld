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

  // Intersection validation messages
  intersectionError: (error: string) => `Intersection validation failed: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `Expected ${expected}, got ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `Expected one of [${values.join(', ')}], got ${received}`,

  // Special type validation messages
  expectedUndefined: 'Expected undefined',
  neverType: 'Never type cannot be parsed',

  // New advanced type validation messages
  invalidBigint: 'Invalid bigint',
  invalidSymbol: 'Invalid symbol',
  invalidTuple: 'Invalid tuple',
  tupleLength: (expected: number, received: number) => `Tuple must have exactly ${expected} elements, got ${received}`,
  invalidRecord: 'Invalid record',
  invalidSet: 'Invalid set',
  invalidMap: 'Invalid map',
  
  // Transformation and refinement messages
  transformError: (error: string) => `Transform failed: ${error}`,
  refinementError: (error: string) => `Refinement failed: ${error}`,
  customValidationError: (error: string) => `Custom validation failed: ${error}`,
  
  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `Cannot coerce ${JSON.stringify(value)} to ${type}`,
  
  // Codec messages
  codecDecodeFailed: 'Failed to decode value',
  codecEncodeFailed: 'Failed to encode value',
  codecAsyncNotSupported: 'Async codec operations require using parseAsync/encodeAsync methods',
  
  // Base64/Hex messages
  invalidBase64: 'Invalid base64 string',
  invalidHex: 'Invalid hexadecimal string',
  
  // Uint8Array messages
  expectedUint8Array: 'Expected Uint8Array',
  uint8ArrayMinLength: (min: number) => `Uint8Array must have at least ${min} bytes`,
  uint8ArrayMaxLength: (max: number) => `Uint8Array must have at most ${max} bytes`,
  uint8ArrayExactLength: (length: number) => `Uint8Array must have exactly ${length} bytes`,
  
  // Generic type error messages
  expectedString: 'Expected string',
  stringExpected: (received: string, expected: string) => `Expected ${expected}, got ${received}`,
  stringBoolExpected: (validValues: string, received: string) => `Invalid boolean string. Expected one of: ${validValues}, got "${received}"`,
  invalidJson: 'Invalid JSON',
  stringPatternInvalid: 'String does not match the required pattern',

  // File validation messages
  invalidFile: 'Expected a File object',
  fileNotSupported: 'File API not supported in this environment',
  fileMinSize: (min: number) => `File size must be at least ${min} bytes`,
  fileMaxSize: (max: number) => `File size must not exceed ${max} bytes`,
  fileMimeType: (allowed: string[]) => `Invalid file type. Expected: ${allowed.join(', ')}`,

  // Function validation messages
  invalidFunction: 'Expected a function',

  // CIDR validation messages
  stringCidrv4: 'Invalid IPv4 CIDR block',
  stringCidrv6: 'Invalid IPv6 CIDR block',

  // Safe extend validation messages
  safeExtendOverlap: (keys: string[]) => `Cannot override existing keys: ${keys.join(', ')}. Use extend() if you want to override.`
};