export type Locale = 
  | 'en' | 'tr' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ru' | 'ja' | 'ko' | 'zh' | 'ar' | 'hi' | 'nl' | 'pl'
  // Major European Languages  
  | 'da' | 'sv' | 'no' | 'fi' | 'is' | 'cs' | 'sk' | 'hu' | 'ro' | 'bg' | 'hr' | 'sl' | 'lv' | 'lt' | 'et'
  | 'el' | 'mk' | 'sq' | 'sr' | 'bs' | 'me' | 'mt' | 'ga' | 'cy' | 'eu' | 'ca'
  // Major Asian Languages
  | 'th' | 'vi' | 'id' | 'ms' | 'tl' | 'bn' | 'ur' | 'fa' | 'he' | 'ka' | 'am' | 'hy' | 'az' | 'kk' | 'ky'
  | 'uz' | 'tg' | 'mn' | 'my' | 'km' | 'lo' | 'si' | 'ta' | 'te' | 'ml' | 'kn' | 'gu' | 'pa' | 'or' | 'as'
  | 'ne' | 'mr' | 'sd' | 'dv'
  // African Languages
  | 'sw' | 'am' | 'ha' | 'yo' | 'ig' | 'zu' | 'xh' | 'af' | 'st' | 'tn' | 'ts' | 've' | 'nr' | 'ss'
  // American Languages  
  | 'pt-BR' | 'es-MX' | 'es-AR' | 'fr-CA' | 'qu' | 'gn' | 'ay';

export interface LocaleMessages {
  // String validation messages
  invalidString: string;
  stringMin: (min: number) => string;
  stringMax: (max: number) => string;
  stringLength: (length: number) => string;
  stringEmail: string;
  stringUrl: string;
  stringUuid: string;
  stringRegex: string;
  stringStartsWith: (prefix: string) => string;
  stringEndsWith: (suffix: string) => string;
  stringIncludes: (substring: string) => string;
  stringIp: string;
  stringIpv4: string;
  stringIpv6: string;
  stringEmpty: string;

  // Number validation messages  
  invalidNumber: string;
  numberMin: (min: number) => string;
  numberMax: (max: number) => string;
  numberInt: string;
  numberPositive: string;
  numberNegative: string;
  numberNonnegative: string;
  numberNonpositive: string;
  numberFinite: string;
  numberSafe: string;
  numberMultipleOf: (value: number) => string;

  // Boolean validation messages
  invalidBoolean: string;

  // Date validation messages
  invalidDate: string;
  dateMin: (date: Date) => string;
  dateMax: (date: Date) => string;

  // Object validation messages
  invalidObject: string;
  unexpectedKeys: (keys: string[]) => string;

  // Array validation messages
  invalidArray: string;
  arrayMin: (min: number) => string;
  arrayMax: (max: number) => string;
  arrayLength: (length: number) => string;
  arrayEmpty: string;
  arrayItem: (index: number, error: string) => string;

  // Object field validation
  objectField: (field: string, error: string) => string;

  // Union validation messages
  unionNoMatch: (errors: string[]) => string;

  // Intersection validation messages
  intersectionError: (error: string) => string;

  // Literal validation messages
  literalExpected: (expected: string, received: string) => string;

  // Enum validation messages
  enumExpected: (values: any[], received: string) => string;

  // Special type validation messages
  expectedUndefined: string;
  neverType: string;

  // New advanced type validation messages
  invalidBigint: string;
  invalidSymbol: string;
  invalidTuple: string;
  tupleLength: (expected: number, received: number) => string;
  invalidRecord: string;
  invalidSet: string;
  invalidMap: string;
  
  // Transformation and refinement messages
  transformError: (error: string) => string;
  refinementError: (error: string) => string;
  customValidationError: (error: string) => string;
  
  // Coercion messages
  coercionFailed: (type: string, value: unknown) => string;
  
  // Codec messages
  codecDecodeFailed: string;
  codecEncodeFailed: string;
  codecAsyncNotSupported: string;
  
  // Base64/Hex messages
  invalidBase64: string;
  invalidHex: string;
  
  // Uint8Array messages
  expectedUint8Array: string;
  uint8ArrayMinLength: (min: number) => string;
  uint8ArrayMaxLength: (max: number) => string;
  uint8ArrayExactLength: (length: number) => string;

  // Generic type error messages
  expectedString: string;
  stringExpected: (received: string, expected: string) => string;
  stringBoolExpected: (validValues: string, received: string) => string;
  invalidJson: string;
  stringPatternInvalid: string;

  // File validation messages
  invalidFile: string;
  fileNotSupported: string;
  fileMinSize: (min: number) => string;
  fileMaxSize: (max: number) => string;
  fileMimeType: (allowed: string[]) => string;

  // Function validation messages
  invalidFunction: string;

  // CIDR validation messages
  stringCidrv4: string;
  stringCidrv6: string;

  // Safe extend validation messages
  safeExtendOverlap: (keys: string[]) => string;
}