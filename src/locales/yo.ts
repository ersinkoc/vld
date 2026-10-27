import { LocaleMessages } from './types';

// Yoruba (ported 2026-10-27)
export const yo: LocaleMessages = {
  // String validation messages
  invalidString: 'Okun ti ko tọ',
  stringMin: (min: number) => `Okun gbọdọ ni o kere ju ${min} ohun kikọ`,
  stringMax: (max: number) => `Okun gbọdọ ni o pọ ju ${max} ohun kikọ lọ`,
  stringLength: (length: number) => `Okun gbọdọ ni ${length} ohun kikọ gangan`,
  stringEmail: 'Àdírẹsì imeeli ti ko tọ',
  stringUrl: 'URL ti ko tọ',
  stringUuid: 'UUID ti ko tọ',
  stringRegex: 'Fọọmuti ti ko tọ',
  stringStartsWith: (prefix: string) => `Okun gbọdọ bẹrẹ pẹlu "${prefix}"`,
  stringEndsWith: (suffix: string) => `Okun gbọdọ pari pẹlu "${suffix}"`,
  stringIncludes: (substring: string) => `Okun gbọdọ ni "${substring}"`,
  stringIp: 'Àdírẹsì IP ti ko tọ',
  stringIpv4: 'Àdírẹsì IPv4 ti ko tọ',
  stringIpv6: 'Àdírẹsì IPv6 ti ko tọ',
  stringEmpty: 'Okun ko gbọdọ ṣofo',

  // Number validation messages
  invalidNumber: 'Nọmba ti ko tọ',
  numberMin: (min: number) => `Nọmba gbọdọ jẹ o kere ju ${min}`,
  numberMax: (max: number) => `Nọmba gbọdọ jẹ o pọ ju ${max} lọ`,
  numberInt: 'Nọmba gbọdọ jẹ nọmba odidi',
  numberPositive: 'Nọmba gbọdọ jẹ rere',
  numberNegative: 'Nọmba gbọdọ jẹ airotẹlu',
  numberNonnegative: 'Nọmba ko gbọdọ jẹ airotẹlu',
  numberNonpositive: 'Nọmba ko gbọdọ jẹ rere',
  numberFinite: 'Nọmba gbọdọ jẹ pipin',
  numberSafe: 'Nọmba gbọdọ jẹ nọmba odidi aabo',
  numberMultipleOf: (value: number) => `Nọmba gbọdọ jẹ elopọkan ${value}`,

  // Boolean validation messages
  invalidBoolean: 'Iye boolean ti ko tọ',

  // Date validation messages
  invalidDate: 'Ọjọ ti ko tọ',
  dateMin: (date: Date) => `Ọjọ gbọdọ wa lẹhin ${date.toISOString()}`,
  dateMax: (date: Date) => `Ọjọ gbọdọ wa ṣaaju ${date.toISOString()}`,

  // Object validation messages
  invalidObject: 'Ohun kan ti ko tọ',
  unexpectedKeys: (keys: string[]) => `Bọtini airotẹlejade: ${keys.join(', ')}`,
  requiredField: (field: string) => `Pápá pataki "${field}" kọja`,

  // Array validation messages
  invalidArray: 'Agbolohun ti ko tọ',
  arrayMin: (min: number) => `Agbolohun gbọdọ ni o kere ju ${min} nkan`,
  arrayMax: (max: number) => `Agbolohun gbọdọ ni o pọ ju ${max} nkan lọ`,
  arrayLength: (length: number) => `Agbolohun gbọdọ ni ${length} nkan gangan`,
  arrayEmpty: 'Agbolohun ko gbọdọ ṣofo',
  arrayItem: (index: number, error: string) => `Nkan ti ko tọ ni itọka ${index}: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `Pápá ti ko tọ "${field}": ${error}`,

  // Union validation messages
  unionNoMatch: () => `Igbewọle ti ko tọ`,

  // Intersection validation messages
  intersectionError: (error: string) => `Aṣiṣe idaniloju opin: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `A reti ${expected}, a gba ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `A reti ọkan ninu [${values.join(', ')}], a gba ${received}`,

  // Special type validation messages
  expectedUndefined: 'A reti undefined',
  neverType: 'Iru never ko le ṣe itupalẹ',

  // New advanced type validation messages
  invalidBigint: 'bigint ti ko tọ',
  invalidSymbol: 'symbol ti ko tọ',
  invalidTuple: 'Tuple ti ko tọ',
  tupleLength: (expected: number, received: number) => `Tuple gbọdọ ni ${expected} nkan gangan, a gba ${received}`,
  invalidRecord: 'Igbeyin ti ko tọ',
  invalidSet: 'Ẹgbẹ ti ko tọ',
  invalidMap: 'Maapu ti ko tọ',

  // Transformation and refinement messages
  transformError: (error: string) => `Aṣiṣe iyipada: ${error}`,
  refinementError: (error: string) => `Aṣiṣe ṣiṣedede: ${error}`,
  customValidationError: (error: string) => `Aṣiṣe idaniloju akanṣe: ${error}`,

  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `Ko le yi ${JSON.stringify(value)} di ${type}`,

  // Codec messages
  codecDecodeFailed: 'Iṣeduroọdọọmi iye kuna',
  codecEncodeFailed: 'Fi koodu iye kuna',
  codecAsyncNotSupported: 'Iṣẹ codec ti ko ni deede nilo awọn ọna parseAsync/encodeAsync',

  // Base64/Hex messages
  invalidBase64: 'Okun base64 ti ko tọ',
  invalidHex: 'Okun hexadecimal ti ko tọ',

  // Uint8Array messages
  expectedUint8Array: 'A reti Uint8Array',
  uint8ArrayMinLength: (min: number) => `Uint8Array gbọdọ ni o kere ju ${min} baiti`,
  uint8ArrayMaxLength: (max: number) => `Uint8Array gbọdọ ni o pọ ju ${max} baiti lọ`,
  uint8ArrayExactLength: (length: number) => `Uint8Array gbọdọ ni ${length} baiti gangan`,

  // Generic type error messages
  expectedString: 'A reti okun',
  stringExpected: (received: string, expected: string) => `A reti ${expected}, a gba ${received}`,
  stringBoolExpected: (validValues: string, received: string) => `Okun boolean ti ko tọ: a reti ọkan ninu ${validValues}, a gba "${received}"`,
  invalidJson: 'JSON ti ko tọ',
  stringPatternInvalid: 'Okun ko ba àwòkan ti o nilọ mu',

  // File validation messages
  invalidFile: 'A reti ohun kan File',
  fileNotSupported: 'File API ko ni atilẹyin ni ayika yi',
  fileMinSize: (min: number) => `Iwọn faili gbọdọ jẹ o kere ju ${min} baiti`,
  fileMaxSize: (max: number) => `Iwọn faili ko gbọdọ kọja ${max} baiti`,
  fileMimeType: (allowed: string[]) => `Iru faili ti ko tọ: a reti ${allowed.join(', ')}`,

  // Function validation messages
  invalidFunction: 'A reti iṣẹ',

  // CIDR validation messages
  stringCidrv4: 'Bulọọki IPv4 CIDR ti ko tọ',
  stringCidrv6: 'Bulọọki IPv6 CIDR ti ko tọ',

  // Safe extend validation messages
  safeExtendOverlap: (keys: string[]) => `Ko le ṣe atunṣe awọn bọtini ti o wa tẹlẹ: ${keys.join(', ')}. Lo extend() ti o ba fẹ ṣe atunṣe wọn.`,
};
