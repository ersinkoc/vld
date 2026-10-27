import { LocaleMessages } from './types';

// Hungarian (ported 2026-10-27)
export const hu: LocaleMessages = {
  // String validation messages
  invalidString: 'Érvénytelen karakterlánc',
  stringMin: (min: number) => `A karakterlánc legalább ${min} karakter hosszú legyen`,
  stringMax: (max: number) => `A karakterlánc legfeljebb ${max} karakter hosszú legyen`,
  stringLength: (length: number) => `A karakterlánc pontosan ${length} karakter hosszú legyen`,
  stringEmail: 'Érvénytelen e-mail cím',
  stringUrl: 'Érvénytelen URL',
  stringUuid: 'Érvénytelen UUID',
  stringRegex: 'Érvénytelen formátum',
  stringStartsWith: (prefix: string) => `A karakterlánc "${prefix}" előtaggal kezdődjön`,
  stringEndsWith: (suffix: string) => `A karakterlánc "${suffix}" utótaggal végződjön`,
  stringIncludes: (substring: string) => `A karakterlánc tartalmazza ezt: "${substring}"`,
  stringIp: 'Érvénytelen IP-cím',
  stringIpv4: 'Érvénytelen IPv4-cím',
  stringIpv6: 'Érvénytelen IPv6-cím',
  stringEmpty: 'A karakterlánc nem lehet üres',

  // Number validation messages
  invalidNumber: 'Érvénytelen szám',
  numberMin: (min: number) => `A szám legalább ${min} legyen`,
  numberMax: (max: number) => `A szám legfeljebb ${max} legyen`,
  numberInt: 'A szám egész legyen',
  numberPositive: 'A szám pozitív legyen',
  numberNegative: 'A szám negatív legyen',
  numberNonnegative: 'A szám nem lehet negatív',
  numberNonpositive: 'A szám nem lehet pozitív',
  numberFinite: 'A szám véges legyen',
  numberSafe: 'A szám biztonságos egész szám legyen',
  numberMultipleOf: (value: number) => `A szám a(z) ${value} többszöröse legyen`,

  // Boolean validation messages
  invalidBoolean: 'Érvénytelen logikai érték',

  // Date validation messages
  invalidDate: 'Érvénytelen dátum',
  dateMin: (date: Date) => `A dátum ${date.toISOString()} után legyen`,
  dateMax: (date: Date) => `A dátum ${date.toISOString()} előtt legyen`,

  // Object validation messages
  invalidObject: 'Érvénytelen objektum',
  unexpectedKeys: (keys: string[]) => `Váratlan kulcsok: ${keys.join(', ')}`,
  requiredField: (field: string) => `A kötelező "${field}" mező hiányzik`,

  // Array validation messages
  invalidArray: 'Érvénytelen tömb',
  arrayMin: (min: number) => `A tömb legalább ${min} elemet tartalmazzon`,
  arrayMax: (max: number) => `A tömb legfeljebb ${max} elemet tartalmazzon`,
  arrayLength: (length: number) => `A tömb pontosan ${length} elemet tartalmazzon`,
  arrayEmpty: 'A tömb nem lehet üres',
  arrayItem: (index: number, error: string) => `Érvénytelen elem a(z) ${index}. indexen: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `Érvénytelen "${field}" mező: ${error}`,

  // Union validation messages
  unionNoMatch: () => `Érvénytelen bemenet`,

  // Intersection validation messages
  intersectionError: (error: string) => `Metszet érvényesítési hiba: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `Várt: ${expected}, kapott: ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `Várt értékek egyike: [${values.join(', ')}], kapott: ${received}`,

  // Special type validation messages
  expectedUndefined: 'Várt érték: undefined',
  neverType: 'A never típus nem elemezhető',

  // New advanced type validation messages
  invalidBigint: 'Érvénytelen bigint',
  invalidSymbol: 'Érvénytelen symbol',
  invalidTuple: 'Érvénytelen tuple',
  tupleLength: (expected: number, received: number) => `A tuple pontosan ${expected} elemet tartalmazzon, kapott: ${received}`,
  invalidRecord: 'Érvénytelen rekord',
  invalidSet: 'Érvénytelen halmaz',
  invalidMap: 'Érvénytelen map',

  // Transformation and refinement messages
  transformError: (error: string) => `Transzformációs hiba: ${error}`,
  refinementError: (error: string) => `Finomítási hiba: ${error}`,
  customValidationError: (error: string) => `Egyéni érvényesítési hiba: ${error}`,

  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `A(z) ${JSON.stringify(value)} nem alakítható ${type} típussá`,

  // Codec messages
  codecDecodeFailed: 'Az érték dekódolása sikertelen',
  codecEncodeFailed: 'Az érték kódolása sikertelen',
  codecAsyncNotSupported: 'Az aszinkron kodekműveletek a parseAsync/encodeAsync metódusokat igénylik',

  // Base64/Hex messages
  invalidBase64: 'Érvénytelen base64 karakterlánc',
  invalidHex: 'Érvénytelen hexadecimális karakterlánc',

  // Uint8Array messages
  expectedUint8Array: 'Várt típus: Uint8Array',
  uint8ArrayMinLength: (min: number) => `A Uint8Array legalább ${min} bájtból álljon`,
  uint8ArrayMaxLength: (max: number) => `A Uint8Array legfeljebb ${max} bájtból álljon`,
  uint8ArrayExactLength: (length: number) => `A Uint8Array pontosan ${length} bájtból álljon`,

  // Generic type error messages
  expectedString: 'Várt típus: karakterlánc',
  stringExpected: (received: string, expected: string) => `Várt: ${expected}, kapott: ${received}`,
  stringBoolExpected: (validValues: string, received: string) => `Érvénytelen logikai karakterlánc. Várt értékek egyike: ${validValues}, kapott: "${received}"`,
  invalidJson: 'Érvénytelen JSON',
  stringPatternInvalid: 'A karakterlánc nem felel meg a követelményeknek',

  // File validation messages
  invalidFile: 'Várt típus: File objektum',
  fileNotSupported: 'A File API nem támogatott ebben a környezetben',
  fileMinSize: (min: number) => `A fájl mérete legalább ${min} bájt legyen`,
  fileMaxSize: (max: number) => `A fájl mérete ne haladja meg a(z) ${max} bájtot`,
  fileMimeType: (allowed: string[]) => `Érvénytelen fájltípus. Várt: ${allowed.join(', ')}`,

  // Function validation messages
  invalidFunction: 'Várt típus: függvény',

  // CIDR validation messages
  stringCidrv4: 'Érvénytelen IPv4 CIDR blokk',
  stringCidrv6: 'Érvénytelen IPv6 CIDR blokk',

  // Safe extend validation messages
  safeExtendOverlap: (keys: string[]) => `A meglévő kulcsok nem írhatók felül: ${keys.join(', ')}. Felülíráshoz használja az extend() metódust.`,
};
