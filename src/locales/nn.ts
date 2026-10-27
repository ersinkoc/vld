import { LocaleMessages } from './types';

// Norwegian Nynorsk (ported 2026-10-27)
export const nn: LocaleMessages = {
  // String validation messages
  invalidString: 'Ugyldig streng',
  stringMin: (min: number) => `Strengen må ha minst ${min} teikn`,
  stringMax: (max: number) => `Strengen må ha høgst ${max} teikn`,
  stringLength: (length: number) => `Strengen må ha nøyaktig ${length} teikn`,
  stringEmail: 'Ugyldig e-postadresse',
  stringUrl: 'Ugyldig URL',
  stringUuid: 'Ugyldig UUID',
  stringRegex: 'Ugyldig format',
  stringStartsWith: (prefix: string) => `Strengen må byrja med "${prefix}"`,
  stringEndsWith: (suffix: string) => `Strengen må slutta med "${suffix}"`,
  stringIncludes: (substring: string) => `Strengen må innehalda "${substring}"`,
  stringIp: 'Ugyldig IP-adresse',
  stringIpv4: 'Ugyldig IPv4-adresse',
  stringIpv6: 'Ugyldig IPv6-adresse',
  stringEmpty: 'Strengen kan ikkje vera tom',

  // Number validation messages
  invalidNumber: 'Ugyldig tal',
  numberMin: (min: number) => `Talet må vera minst ${min}`,
  numberMax: (max: number) => `Talet må vera høgst ${max}`,
  numberInt: 'Talet må vera eit heiltal',
  numberPositive: 'Talet må vera positivt',
  numberNegative: 'Talet må vera negativt',
  numberNonnegative: 'Talet kan ikkje vera negativt',
  numberNonpositive: 'Talet kan ikkje vera positivt',
  numberFinite: 'Talet må vera endelig',
  numberSafe: 'Talet må vera eit trygt heiltal',
  numberMultipleOf: (value: number) => `Talet må vera eit multiplum av ${value}`,

  // Boolean validation messages
  invalidBoolean: 'Ugyldig boolsk verdi',

  // Date validation messages
  invalidDate: 'Ugyldig dato',
  dateMin: (date: Date) => `Datoen må vera etter ${date.toISOString()}`,
  dateMax: (date: Date) => `Datoen må vera før ${date.toISOString()}`,

  // Object validation messages
  invalidObject: 'Ugyldig objekt',
  unexpectedKeys: (keys: string[]) => `Uventa nøklar: ${keys.join(', ')}`,
  requiredField: (field: string) => `Obligatorisk felt "${field}" manglar`,

  // Array validation messages
  invalidArray: 'Ugyldig matrise',
  arrayMin: (min: number) => `Matrisa må ha minst ${min} element`,
  arrayMax: (max: number) => `Matrisa må ha høgst ${max} element`,
  arrayLength: (length: number) => `Matrisa må ha nøyaktig ${length} element`,
  arrayEmpty: 'Matrisa kan ikkje vera tom',
  arrayItem: (index: number, error: string) => `Ugyldig element på indeks ${index}: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `Ugyldig felt "${field}": ${error}`,

  // Union validation messages
  unionNoMatch: () => `Ugyldig inndata`,

  // Intersection validation messages
  intersectionError: (error: string) => `Feil ved validering av snitt: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `Forventa ${expected}, fekk ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `Forventa ein av [${values.join(', ')}], fekk ${received}`,

  // Special type validation messages
  expectedUndefined: 'Forventa undefined',
  neverType: 'Typen never kan ikkja tolkast',

  // New advanced type validation messages
  invalidBigint: 'Ugyldig bigint',
  invalidSymbol: 'Ugyldig symbol',
  invalidTuple: 'Ugyldig tuppel',
  tupleLength: (expected: number, received: number) => `Tuppelen må ha nøyaktig ${expected} element, fekk ${received}`,
  invalidRecord: 'Ugyldig post',
  invalidSet: 'Ugyldig sett',
  invalidMap: 'Ugyldig kart',

  // Transformation and refinement messages
  transformError: (error: string) => `Transformeringsfeil: ${error}`,
  refinementError: (error: string) => `Finpussingsfeil: ${error}`,
  customValidationError: (error: string) => `Sjølvvalideringsfeil: ${error}`,

  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `Kan ikkje konvertera ${JSON.stringify(value)} til ${type}`,

  // Codec messages
  codecDecodeFailed: 'Klarte ikkje dekoda verdien',
  codecEncodeFailed: 'Klarte ikkje koda verdien',
  codecAsyncNotSupported: 'Asynkrone kodek-operasjonar krev metodenane parseAsync/encodeAsync',

  // Base64/Hex messages
  invalidBase64: 'Ugyldig base64-streng',
  invalidHex: 'Ugyldig heksadesimal streng',

  // Uint8Array messages
  expectedUint8Array: 'Forventa Uint8Array',
  uint8ArrayMinLength: (min: number) => `Uint8Array må ha minst ${min} byte`,
  uint8ArrayMaxLength: (max: number) => `Uint8Array må ha høgst ${max} byte`,
  uint8ArrayExactLength: (length: number) => `Uint8Array må ha nøyaktig ${length} byte`,

  // Generic type error messages
  expectedString: 'Forventa streng',
  stringExpected: (received: string, expected: string) => `Forventa ${expected}, fekk ${received}`,
  stringBoolExpected: (validValues: string, received: string) => `Ugyldig boolsk streng. Forventa ein av: ${validValues}, fekk "${received}"`,
  invalidJson: 'Ugyldig JSON',
  stringPatternInvalid: 'Strengen samsvarar ikkje med det påkravde mønsteret',

  // File validation messages
  invalidFile: 'Forventa eit File-objekt',
  fileNotSupported: 'File-APIet er ikkje støtta i dette miljøet',
  fileMinSize: (min: number) => `Filstorleiken må vera minst ${min} byte`,
  fileMaxSize: (max: number) => `Filstorleiken kan ikkje overstiga ${max} byte`,
  fileMimeType: (allowed: string[]) => `Ugyldig filtype. Forventa: ${allowed.join(', ')}`,

  // Function validation messages
  invalidFunction: 'Forventa ein funksjon',

  // CIDR validation messages
  stringCidrv4: 'Ugyldig IPv4 CIDR-blokk',
  stringCidrv6: 'Ugyldig IPv6 CIDR-blokk',

  // Safe extend validation messages
  safeExtendOverlap: (keys: string[]) => `Kan ikkje overskriva eksisterande nøklar: ${keys.join(', ')}. Bruk extend() viss du vil overskriva dei.`,
};
