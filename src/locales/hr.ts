import { LocaleMessages } from './types';

// Croatian (ported 2026-10-27)
export const hr: LocaleMessages = {
  // String validation messages
  invalidString: 'Neispravan niz',
  stringMin: (min: number) => `Niz mora imati najmanje ${min} znakova`,
  stringMax: (max: number) => `Niz mora imati najviše ${max} znakova`,
  stringLength: (length: number) => `Niz mora imati točno ${length} znakova`,
  stringEmail: 'Neispravna adresa e-pošte',
  stringUrl: 'Neispravan URL',
  stringUuid: 'Neispravan UUID',
  stringRegex: 'Neispravan format',
  stringStartsWith: (prefix: string) => `Niz mora početi s "${prefix}"`,
  stringEndsWith: (suffix: string) => `Niz mora završiti s "${suffix}"`,
  stringIncludes: (substring: string) => `Niz mora sadržavati "${substring}"`,
  stringIp: 'Neispravna IP adresa',
  stringIpv4: 'Neispravna IPv4 adresa',
  stringIpv6: 'Neispravna IPv6 adresa',
  stringEmpty: 'Niz ne smije biti prazan',

  // Number validation messages
  invalidNumber: 'Neispravan broj',
  numberMin: (min: number) => `Broj mora biti najmanje ${min}`,
  numberMax: (max: number) => `Broj mora biti najviše ${max}`,
  numberInt: 'Broj mora biti cijeli',
  numberPositive: 'Broj mora biti pozitivan',
  numberNegative: 'Broj mora biti negativan',
  numberNonnegative: 'Broj ne smije biti negativan',
  numberNonpositive: 'Broj ne smije biti pozitivan',
  numberFinite: 'Broj mora biti konačan',
  numberSafe: 'Broj mora biti sigurni cijeli broj',
  numberMultipleOf: (value: number) => `Broj mora biti višekratnik broja ${value}`,

  // Boolean validation messages
  invalidBoolean: 'Neispravna booleova vrijednost',

  // Date validation messages
  invalidDate: 'Neispravan datum',
  dateMin: (date: Date) => `Datum mora biti nakon ${date.toISOString()}`,
  dateMax: (date: Date) => `Datum mora biti prije ${date.toISOString()}`,

  // Object validation messages
  invalidObject: 'Neispravan objekt',
  unexpectedKeys: (keys: string[]) => `Neočekivani ključevi: ${keys.join(', ')}`,
  requiredField: (field: string) => `Obavezno polje "${field}" nedostaje`,

  // Array validation messages
  invalidArray: 'Neispravan niz',
  arrayMin: (min: number) => `Niz mora imati najmanje ${min} elemenata`,
  arrayMax: (max: number) => `Niz mora imati najviše ${max} elemenata`,
  arrayLength: (length: number) => `Niz mora imati točno ${length} elemenata`,
  arrayEmpty: 'Niz ne smije biti prazan',
  arrayItem: (index: number, error: string) => `Neispravan element na indeksu ${index}: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `Neispravno polje "${field}": ${error}`,

  // Union validation messages
  unionNoMatch: () => `Neispravan unos`,

  // Intersection validation messages
  intersectionError: (error: string) => `Pogreška pri provjeri presjeka: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `Očekivano ${expected}, primljeno ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `Očekivano jedno od [${values.join(', ')}], primljeno ${received}`,

  // Special type validation messages
  expectedUndefined: 'Očekivano undefined',
  neverType: 'Tip never ne može se raščlaniti',

  // New advanced type validation messages
  invalidBigint: 'Neispravan bigint',
  invalidSymbol: 'Neispravan symbol',
  invalidTuple: 'Neispravna torka',
  tupleLength: (expected: number, received: number) => `Torka mora imati točno ${expected} elemenata, primljeno ${received}`,
  invalidRecord: 'Neispravan zapis',
  invalidSet: 'Neispravan skup',
  invalidMap: 'Neispravana mapa',

  // Transformation and refinement messages
  transformError: (error: string) => `Pogreška transformacije: ${error}`,
  refinementError: (error: string) => `Pogreška preciziranja: ${error}`,
  customValidationError: (error: string) => `Pogreška prilagođene provjere: ${error}`,

  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `Nije moguće pretvoriti ${JSON.stringify(value)} u ${type}`,

  // Codec messages
  codecDecodeFailed: 'Dekodiranje vrijednosti nije uspjelo',
  codecEncodeFailed: 'Kodiranje vrijednosti nije uspjelo',
  codecAsyncNotSupported: 'Asinkrone operacije kodeka zahtijevaju metode parseAsync/encodeAsync',

  // Base64/Hex messages
  invalidBase64: 'Neispravan base64 niz',
  invalidHex: 'Neispravan heksadecimalni niz',

  // Uint8Array messages
  expectedUint8Array: 'Očekivan Uint8Array',
  uint8ArrayMinLength: (min: number) => `Uint8Array mora imati najmanje ${min} bajtova`,
  uint8ArrayMaxLength: (max: number) => `Uint8Array mora imati najviše ${max} bajtova`,
  uint8ArrayExactLength: (length: number) => `Uint8Array mora imati točno ${length} bajtova`,

  // Generic type error messages
  expectedString: 'Očekivan niz',
  stringExpected: (received: string, expected: string) => `Očekivano ${expected}, primljeno ${received}`,
  stringBoolExpected: (validValues: string, received: string) => `Neispravan booleov niz. Očekivano jedno od: ${validValues}, primljeno "${received}"`,
  invalidJson: 'Neispravan JSON',
  stringPatternInvalid: 'Niz ne odgovara potrebnom uzorku',

  // File validation messages
  invalidFile: 'Očekivan objekt File',
  fileNotSupported: 'File API nije podržan u ovom okruženju',
  fileMinSize: (min: number) => `Veličina datoteke mora biti najmanje ${min} bajtova`,
  fileMaxSize: (max: number) => `Veličina datoteke ne smije premašiti ${max} bajtova`,
  fileMimeType: (allowed: string[]) => `Neispravna vrsta datoteke. Očekivano: ${allowed.join(', ')}`,

  // Function validation messages
  invalidFunction: 'Očekivana funkcija',

  // CIDR validation messages
  stringCidrv4: 'Neispravan CIDR blok IPv4',
  stringCidrv6: 'Neispravan CIDR blok IPv6',

  // Safe extend validation messages
  safeExtendOverlap: (keys: string[]) => `Postojeći ključevi ne mogu se prepisati: ${keys.join(', ')}. Koristite extend() ako ih želite prepisati.`,
};
