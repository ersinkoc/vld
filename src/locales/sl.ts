import { LocaleMessages } from './types';

// Slovenian (ported 2026-10-27)
export const sl: LocaleMessages = {
  // String validation messages
  invalidString: 'Neveljaven niz',
  stringMin: (min: number) => `Niz mora imeti vsaj ${min} znakov`,
  stringMax: (max: number) => `Niz mora imeti največ ${max} znakov`,
  stringLength: (length: number) => `Niz mora imeti točno ${length} znakov`,
  stringEmail: 'Neveljaven e-poštni naslov',
  stringUrl: 'Neveljaven URL',
  stringUuid: 'Neveljaven UUID',
  stringRegex: 'Neveljavna oblika',
  stringStartsWith: (prefix: string) => `Niz se mora začeti z "${prefix}"`,
  stringEndsWith: (suffix: string) => `Niz se mora končati z "${suffix}"`,
  stringIncludes: (substring: string) => `Niz mora vsebovati "${substring}"`,
  stringIp: 'Neveljaven IP naslov',
  stringIpv4: 'Neveljaven IPv4 naslov',
  stringIpv6: 'Neveljaven IPv6 naslov',
  stringEmpty: 'Niz ne sme biti prazen',

  // Number validation messages
  invalidNumber: 'Neveljavno število',
  numberMin: (min: number) => `Število mora biti vsaj ${min}`,
  numberMax: (max: number) => `Število mora biti največ ${max}`,
  numberInt: 'Število mora biti celo',
  numberPositive: 'Število mora biti pozitivno',
  numberNegative: 'Število mora biti negativno',
  numberNonnegative: 'Število ne sme biti negativno',
  numberNonpositive: 'Število ne sme biti pozitivno',
  numberFinite: 'Število mora biti končno',
  numberSafe: 'Število mora biti varno celo število',
  numberMultipleOf: (value: number) => `Število mora biti večkratnik števila ${value}`,

  // Boolean validation messages
  invalidBoolean: 'Neveljavna logična vrednost',

  // Date validation messages
  invalidDate: 'Neveljaven datum',
  dateMin: (date: Date) => `Datum mora biti po ${date.toISOString()}`,
  dateMax: (date: Date) => `Datum mora biti pred ${date.toISOString()}`,

  // Object validation messages
  invalidObject: 'Neveljaven objekt',
  unexpectedKeys: (keys: string[]) => `Nepričakovani ključi: ${keys.join(', ')}`,
  requiredField: (field: string) => `Obvezno polje "${field}" manjka`,

  // Array validation messages
  invalidArray: 'Neveljavno polje',
  arrayMin: (min: number) => `Polje mora imeti vsaj ${min} elementov`,
  arrayMax: (max: number) => `Polje mora imeti največ ${max} elementov`,
  arrayLength: (length: number) => `Polje mora imeti točno ${length} elementov`,
  arrayEmpty: 'Polje ne sme biti prazno',
  arrayItem: (index: number, error: string) => `Neveljaven element na indeksu ${index}: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `Neveljavno polje "${field}": ${error}`,

  // Union validation messages
  unionNoMatch: () => `Neveljaven vnos`,

  // Intersection validation messages
  intersectionError: (error: string) => `Napaka pri preverjanju preseka: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `Pričakovano ${expected}, prejeto ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `Pričakovano eno izmed [${values.join(', ')}], prejeto ${received}`,

  // Special type validation messages
  expectedUndefined: 'Pričakovano undefined',
  neverType: 'Tipa never ni mogoče razčleniti',

  // New advanced type validation messages
  invalidBigint: 'Neveljaven bigint',
  invalidSymbol: 'Neveljaven symbol',
  invalidTuple: 'Neveljavna terka',
  tupleLength: (expected: number, received: number) => `Terka mora imeti točno ${expected} elementov, prejetih ${received}`,
  invalidRecord: 'Neveljaven zapis',
  invalidSet: 'Neveljavna množica',
  invalidMap: 'Neveljaven zemljevid',

  // Transformation and refinement messages
  transformError: (error: string) => `Napaka pri preoblikovanju: ${error}`,
  refinementError: (error: string) => `Napaka pri natančnejšem preverjanju: ${error}`,
  customValidationError: (error: string) => `Napaka preverjanja po meri: ${error}`,

  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `${JSON.stringify(value)} ni mogoče pretvoriti v ${type}`,

  // Codec messages
  codecDecodeFailed: 'Dekodiranje vrednosti ni uspelo',
  codecEncodeFailed: 'Kodiranje vrednosti ni uspelo',
  codecAsyncNotSupported: 'Asinhrona operacija kodeka zahteva metodi parseAsync/encodeAsync',

  // Base64/Hex messages
  invalidBase64: 'Neveljaven base64 niz',
  invalidHex: 'Neveljaven šestnajstiški niz',

  // Uint8Array messages
  expectedUint8Array: 'Pričakovan Uint8Array',
  uint8ArrayMinLength: (min: number) => `Uint8Array mora imeti vsaj ${min} bajtov`,
  uint8ArrayMaxLength: (max: number) => `Uint8Array mora imeti največ ${max} bajtov`,
  uint8ArrayExactLength: (length: number) => `Uint8Array mora imeti točno ${length} bajtov`,

  // Generic type error messages
  expectedString: 'Pričakovan niz',
  stringExpected: (received: string, expected: string) => `Pričakovano ${expected}, prejeto ${received}`,
  stringBoolExpected: (validValues: string, received: string) => `Neveljaven logični niz. Pričakovano eno izmed: ${validValues}, prejeto "${received}"`,
  invalidJson: 'Neveljaven JSON',
  stringPatternInvalid: 'Niz ne ustreza zahtevanemu vzorcu',

  // File validation messages
  invalidFile: 'Pričakovan objekt File',
  fileNotSupported: 'File API v tem okolju ni podprt',
  fileMinSize: (min: number) => `Velikost datoteke mora biti vsaj ${min} bajtov`,
  fileMaxSize: (max: number) => `Velikost datoteke ne sme presegati ${max} bajtov`,
  fileMimeType: (allowed: string[]) => `Neveljavna vrsta datoteke. Pričakovano: ${allowed.join(', ')}`,

  // Function validation messages
  invalidFunction: 'Pričakovana funkcija',

  // CIDR validation messages
  stringCidrv4: 'Neveljaven blok CIDR IPv4',
  stringCidrv6: 'Neveljaven blok CIDR IPv6',

  // Safe extend validation messages
  safeExtendOverlap: (keys: string[]) => `Obstoječih ključev ni mogoče prepisati: ${keys.join(', ')}. Uporabite extend(), če jih želite prepisati.`,
};
