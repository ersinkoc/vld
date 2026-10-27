import { LocaleMessages } from './types';

// Icelandic (ported 2026-10-27)
export const is: LocaleMessages = {
  // String validation messages
  invalidString: 'Ógildur strengur',
  stringMin: (min: number) => `Strengur verður að vera að minnsta kosti ${min} stafir`,
  stringMax: (max: number) => `Strengur verður að vera að hámarki ${max} stafir`,
  stringLength: (length: number) => `Strengur verður að vera nákvæmlega ${length} stafir`,
  stringEmail: 'Ógilt netfang',
  stringUrl: 'Ógild URL',
  stringUuid: 'Ógilt UUID',
  stringRegex: 'Ógilt snið',
  stringStartsWith: (prefix: string) => `Strengur verður að byrja á "${prefix}"`,
  stringEndsWith: (suffix: string) => `Strengur verður að enda á "${suffix}"`,
  stringIncludes: (substring: string) => `Strengur verður að innihalda "${substring}"`,
  stringIp: 'Ógild IP-tala',
  stringIpv4: 'Ógild IPv4-tala',
  stringIpv6: 'Ógild IPv6-tala',
  stringEmpty: 'Strengur má ekki vera tómur',

  // Number validation messages
  invalidNumber: 'Ógild tala',
  numberMin: (min: number) => `Talan verður að vera að minnsta kosti ${min}`,
  numberMax: (max: number) => `Talan verður að vera að hámarki ${max}`,
  numberInt: 'Talan verður að vera heiltala',
  numberPositive: 'Talan verður að vera jákvæð',
  numberNegative: 'Talan verður að vera neikvæð',
  numberNonnegative: 'Talan má ekki vera neikvæð',
  numberNonpositive: 'Talan má ekki vera jákvæð',
  numberFinite: 'Talan verður að vera endanleg',
  numberSafe: 'Talan verður að vera örugg heiltala',
  numberMultipleOf: (value: number) => `Talan verður að vera margfeldi af ${value}`,

  // Boolean validation messages
  invalidBoolean: 'Ógild boolegildi',

  // Date validation messages
  invalidDate: 'Ógild dagsetning',
  dateMin: (date: Date) => `Dagsetningin verður að vera eftir ${date.toISOString()}`,
  dateMax: (date: Date) => `Dagsetningin verður að vera fyrir ${date.toISOString()}`,

  // Object validation messages
  invalidObject: 'Ógilt hlutur',
  unexpectedKeys: (keys: string[]) => `Óvæntar lyklar: ${keys.join(', ')}`,
  requiredField: (field: string) => `Skyldusvæðið "${field}" vantar`,

  // Array validation messages
  invalidArray: 'Ógild fylki',
  arrayMin: (min: number) => `Fylkið verður að innihalda að minnsta kosti ${min} stök`,
  arrayMax: (max: number) => `Fylkið verður að innihalda að hámarki ${max} stök`,
  arrayLength: (length: number) => `Fylkið verður að innihalda nákvæmlega ${length} stök`,
  arrayEmpty: 'Fylkið má ekki vera tómt',
  arrayItem: (index: number, error: string) => `Ógilt stak á vísi ${index}: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `Ógilt svæði "${field}": ${error}`,

  // Union validation messages
  unionNoMatch: () => `Ógilt inntak`,

  // Intersection validation messages
  intersectionError: (error: string) => `Villa við staðfestingu sniðmengis: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `Búist var við ${expected}, fékk ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `Búist var við einu af [${values.join(', ')}], fékk ${received}`,

  // Special type validation messages
  expectedUndefined: 'Búist var við undefined',
  neverType: 'Gerðinni never er ekki hægt að þátta',

  // New advanced type validation messages
  invalidBigint: 'Ógilt bigint',
  invalidSymbol: 'Ógilt symbol',
  invalidTuple: 'Ógild tupull',
  tupleLength: (expected: number, received: number) => `Tupull verður að innihalda nákvæmlega ${expected} stök, ${received} fengust`,
  invalidRecord: 'Ógild skrá',
  invalidSet: 'Ógilt mengi',
  invalidMap: 'Ógilt kort',

  // Transformation and refinement messages
  transformError: (error: string) => `Umbreytingarvilla: ${error}`,
  refinementError: (error: string) => `Þáttunarvilla: ${error}`,
  customValidationError: (error: string) => `Sérsniðin staðfesting Villa: ${error}`,

  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `Get ekki breytt ${JSON.stringify(value)} í ${type}`,

  // Codec messages
  codecDecodeFailed: 'Mistókst að afkóða gildið',
  codecEncodeFailed: 'Mistókst að kóða gildið',
  codecAsyncNotSupported: 'Ósamstilltar kodekaaðgerðir krefjast parseAsync/encodeAsync aðferðanna',

  // Base64/Hex messages
  invalidBase64: 'Ógildur base64-strengur',
  invalidHex: 'Ógildur hexadecimal-strengur',

  // Uint8Array messages
  expectedUint8Array: 'Búist var við Uint8Array',
  uint8ArrayMinLength: (min: number) => `Uint8Array verður að innihalda að minnsta kosti ${min} bæti`,
  uint8ArrayMaxLength: (max: number) => `Uint8Array verður að innihalda að hámarki ${max} bæti`,
  uint8ArrayExactLength: (length: number) => `Uint8Array verður að innihalda nákvæmlega ${length} bæti`,

  // Generic type error messages
  expectedString: 'Búist var við streng',
  stringExpected: (received: string, expected: string) => `Búist var við ${expected}, fékk ${received}`,
  stringBoolExpected: (validValues: string, received: string) => `Ógildur boole-strengur. Búist var við einu af: ${validValues}, fékk "${received}"`,
  invalidJson: 'Ógilt JSON',
  stringPatternInvalid: 'Strengurinn passar ekki við nauðsynlega uppbyggingu',

  // File validation messages
  invalidFile: 'Búist var við File-hlut',
  fileNotSupported: 'File API er ekki stutt í þessu umhverfi',
  fileMinSize: (min: number) => `Skráarstærð verður að vera að minnsta kosti ${min} bæti`,
  fileMaxSize: (max: number) => `Skráarstærð má ekki fara yfir ${max} bæti`,
  fileMimeType: (allowed: string[]) => `Ógild skráargerð. Búist var við: ${allowed.join(', ')}`,

  // Function validation messages
  invalidFunction: 'Búist var við falli',

  // CIDR validation messages
  stringCidrv4: 'Ógilt IPv4 CIDR-blok',
  stringCidrv6: 'Ógilt IPv6 CIDR-blok',

  // Safe extend validation messages
  safeExtendOverlap: (keys: string[]) => `Get ekki skrifað yfir fyrirliggjandi lykla: ${keys.join(', ')}. Notaðu extend() ef þú vilt skrifa yfir þá.`,
};
