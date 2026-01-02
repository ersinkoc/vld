import { LocaleMessages } from './types';

export const sv: LocaleMessages = {
  // String validation messages
  invalidString: 'Ogiltig sträng',
  stringMin: (min: number) => `Sträng måste vara minst ${min} tecken lång`,
  stringMax: (max: number) => `Sträng får vara högst ${max} tecken lång`,
  stringLength: (length: number) => `Sträng måste vara exakt ${length} tecken lång`,
  stringEmail: 'Ogiltig e-postadress',
  stringUrl: 'Ogiltig URL',
  stringUuid: 'Ogiltig UUID',
  stringRegex: 'Ogiltigt format',
  stringStartsWith: (prefix: string) => `Sträng måste börja med "${prefix}"`,
  stringEndsWith: (suffix: string) => `Sträng måste sluta med "${suffix}"`,
  stringIncludes: (substring: string) => `Sträng måste innehålla "${substring}"`,
  stringIp: 'Ogiltig IP-adress',
  stringIpv4: 'Ogiltig IPv4-adress',
  stringIpv6: 'Ogiltig IPv6-adress',
  stringEmpty: 'Sträng får inte vara tom',

  // Number validation messages
  invalidNumber: 'Ogiltigt nummer',
  numberMin: (min: number) => `Nummer måste vara minst ${min}`,
  numberMax: (max: number) => `Nummer får vara högst ${max}`,
  numberInt: 'Nummer måste vara ett heltal',
  numberPositive: 'Nummer måste vara positivt',
  numberNegative: 'Nummer måste vara negativt',
  numberNonnegative: 'Nummer får inte vara negativt',
  numberNonpositive: 'Nummer får inte vara positivt',
  numberFinite: 'Nummer måste vara ändligt',
  numberSafe: 'Nummer måste vara ett säkert heltal',
  numberMultipleOf: (value: number) => `Nummer måste vara en multipel av ${value}`,

  // Boolean validation messages
  invalidBoolean: 'Ogiltigt boolean-värde',

  // Date validation messages
  invalidDate: 'Ogiltigt datum',
  dateMin: (date: Date) => `Datum måste vara efter ${date.toISOString()}`,
  dateMax: (date: Date) => `Datum måste vara före ${date.toISOString()}`,

  // Object validation messages
  invalidObject: 'Ogiltigt objekt',
  unexpectedKeys: (keys: string[]) => `Oväntade nycklar: ${keys.join(', ')}`,

  // Array validation messages
  invalidArray: 'Ogiltig array',
  arrayMin: (min: number) => `Array måste ha minst ${min} element`,
  arrayMax: (max: number) => `Array får ha högst ${max} element`,
  arrayLength: (length: number) => `Array måste ha exakt ${length} element`,
  arrayEmpty: 'Array får inte vara tom',
  arrayItem: (index: number, error: string) => `Ogiltigt element vid index ${index}: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `Ogiltigt fält "${field}": ${error}`,

  // Union validation messages
  unionNoMatch: (errors: string[]) => `Ingen union-medlem matchade: ${errors.join(', ')}`,

  // Intersection validation messages
  intersectionError: (error: string) => `Intersection validering misslyckades: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `Förväntade ${expected}, fick ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `Förväntade en av [${values.join(', ')}], fick ${received}`,

  // Special type validation messages
  expectedUndefined: 'Förväntade undefined',
  neverType: 'Never-typ kan inte parsas',

  // New advanced type validation messages
  invalidBigint: 'Ogiltig bigint',
  invalidSymbol: 'Ogiltig symbol',
  invalidTuple: 'Ogiltig tupel',
  tupleLength: (expected: number, received: number) => `Tupel måste ha exakt ${expected} element, fick ${received}`,
  invalidRecord: 'Ogiltig post',
  invalidSet: 'Ogiltig Set',
  invalidMap: 'Ogiltig Map',
  
  // Transformation and refinement messages
  transformError: (error: string) => `Transformation misslyckades: ${error}`,
  refinementError: (error: string) => `Förfining misslyckades: ${error}`,
  customValidationError: (error: string) => `Anpassad validering misslyckades: ${error}`,
  
  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `Kan inte konvertera ${JSON.stringify(value)} till ${type}`,
  
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
  stringExpected: (received: string, expected: string) => `Förväntade ${expected}, fick ${received}`,
  stringBoolExpected: (validValues: string, received: string) => `Ogiltig boolean sträng. En av följande förväntad: ${validValues}, fick: "${received}"`,
  invalidJson: 'Ogiltig JSON',
  stringPatternInvalid: 'Strängen matchar inte det krävda mönstret',

  // File validation messages
  invalidFile: 'Expected a File object',
  fileNotSupported: 'File API not supported in this environment',
  fileMinSize: (min: number) => `File size must be at least ${min} bytes`,
  fileMaxSize: (max: number) => `File size must not exceed ${max} bytes`,
  fileMimeType: (allowed: string[]) => `Invalid file type. Expected: ${allowed.join(", ")}`,
  // Function validation messages
  invalidFunction: 'En funktion förväntas',

  // CIDR validation messages
  stringCidrv4: 'Ogiltigt IPv4 CIDR-block',
  stringCidrv6: 'Ogiltigt IPv6 CIDR-block',

  // Safe extend validation messages
  safeExtendOverlap: (keys: string[]) => `Kan inte skriva över befintliga nycklar: ${keys.join(', ')}. Använd extend() för att skriva över.`
};
