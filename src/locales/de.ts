import { LocaleMessages } from './types';

export const de: LocaleMessages = {
  // String validation messages
  invalidString: 'Ungültiger String',
  stringMin: (min: number) => `String muss mindestens ${min} Zeichen lang sein`,
  stringMax: (max: number) => `String darf höchstens ${max} Zeichen lang sein`,
  stringLength: (length: number) => `String muss genau ${length} Zeichen lang sein`,
  stringEmail: 'Ungültige E-Mail-Adresse',
  stringUrl: 'Ungültige URL',
  stringUuid: 'Ungültige UUID',
  stringRegex: 'Ungültiges Format',
  stringStartsWith: (prefix: string) => `String muss mit "${prefix}" beginnen`,
  stringEndsWith: (suffix: string) => `String muss mit "${suffix}" enden`,
  stringIncludes: (substring: string) => `String muss "${substring}" enthalten`,
  stringIp: 'Ungültige IP-Adresse',
  stringIpv4: 'Ungültige IPv4-Adresse',
  stringIpv6: 'Ungültige IPv6-Adresse',
  stringEmpty: 'String darf nicht leer sein',

  // Number validation messages
  invalidNumber: 'Ungültige Nummer',
  numberMin: (min: number) => `Nummer muss mindestens ${min} betragen`,
  numberMax: (max: number) => `Nummer darf höchstens ${max} betragen`,
  numberInt: 'Nummer muss eine ganze Zahl sein',
  numberPositive: 'Nummer muss positiv sein',
  numberNegative: 'Nummer muss negativ sein',
  numberNonnegative: 'Nummer darf nicht negativ sein',
  numberNonpositive: 'Nummer darf nicht positiv sein',
  numberFinite: 'Nummer muss endlich sein',
  numberSafe: 'Nummer muss eine sichere ganze Zahl sein',
  numberMultipleOf: (value: number) => `Nummer muss ein Vielfaches von ${value} sein`,

  // Boolean validation messages
  invalidBoolean: 'Ungültiger Boolean-Wert',

  // Date validation messages
  invalidDate: 'Ungültiges Datum',
  dateMin: (date: Date) => `Datum muss nach ${date.toISOString()} liegen`,
  dateMax: (date: Date) => `Datum muss vor ${date.toISOString()} liegen`,

  // Object validation messages
  invalidObject: 'Ungültiges Objekt',
  unexpectedKeys: (keys: string[]) => `Unerwartete Schlüssel: ${keys.join(', ')}`,

  // Array validation messages
  invalidArray: 'Ungültiges Array',
  arrayMin: (min: number) => `Array muss mindestens ${min} Elemente haben`,
  arrayMax: (max: number) => `Array darf höchstens ${max} Elemente haben`,
  arrayLength: (length: number) => `Array muss genau ${length} Elemente haben`,
  arrayEmpty: 'Array darf nicht leer sein',
  arrayItem: (index: number, error: string) => `Ungültiges Element bei Index ${index}: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `Ungültiges Feld "${field}": ${error}`,

  // Union validation messages
  unionNoMatch: (errors: string[]) => `Kein Union-Mitglied passte: ${errors.join(', ')}`,

  // Intersection validation messages
  intersectionError: (error: string) => `Intersection-Validierung fehlgeschlagen: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `Erwartet ${expected}, erhalten ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `Erwartet einer von [${values.join(', ')}], erhalten ${received}`,

  // Special type validation messages
  expectedUndefined: 'Undefined erwartet',
  neverType: 'Never-Typ kann nicht geparst werden',

  // New advanced type validation messages
  invalidBigint: 'Ungültiger Bigint',
  invalidSymbol: 'Ungültiges Symbol',
  invalidTuple: 'Ungültiges Tupel',
  tupleLength: (expected: number, received: number) => `Tupel muss genau ${expected} Elemente haben, ${received} erhalten`,
  invalidRecord: 'Ungültiger Datensatz',
  invalidSet: 'Ungültiges Set',
  invalidMap: 'Ungültige Map',
  
  // Transformation and refinement messages
  transformError: (error: string) => `Transformation fehlgeschlagen: ${error}`,
  refinementError: (error: string) => `Verfeinerung fehlgeschlagen: ${error}`,
  customValidationError: (error: string) => `Benutzerdefinierte Validierung fehlgeschlagen: ${error}`,
  
  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `Kann ${JSON.stringify(value)} nicht zu ${type} konvertieren`,
  
  // Codec messages
  codecDecodeFailed: 'Failed to decode value',
  codecEncodeFailed: 'Failed to encode value',
  codecAsyncNotSupported: 'Async codec operations require using parseAsync/encodeAsync methods',
  
  // Base64/Hex messages
  invalidBase64: 'Invalid base64 string',
  invalidHex: 'Invalid hexadecimal string',
  
  // Uint8Array messages
  expectedUint8Array: 'Expected Uint8Array',
  uint8ArrayMinLength: 'Uint8Array must have at least {min} bytes',
  uint8ArrayMaxLength: 'Uint8Array must have at most {max} bytes',
  uint8ArrayExactLength: 'Uint8Array must have exactly {length} bytes',
  
  // Generic type error messages
  expectedString: 'Expected string'
};