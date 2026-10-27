import { LocaleMessages } from './types';

// Azerbaijani (ported 2026-10-27)
export const az: LocaleMessages = {
  // String validation messages
  invalidString: 'Yanlış sətir',
  stringMin: (min: number) => `Sətir ən az ${min} simvol olmalıdır`,
  stringMax: (max: number) => `Sətir ən çox ${max} simvol olmalıdır`,
  stringLength: (length: number) => `Sətir tam olaraq ${length} simvol olmalıdır`,
  stringEmail: 'Yanlış e-poçt ünvanı',
  stringUrl: 'Yanlış URL',
  stringUuid: 'Yanlış UUID',
  stringRegex: 'Yanlış format',
  stringStartsWith: (prefix: string) => `Sətir "${prefix}" ilə başlamalıdır`,
  stringEndsWith: (suffix: string) => `Sətir "${suffix}" ilə bitməlidir`,
  stringIncludes: (substring: string) => `Sətir "${substring}" daxil etməlidir`,
  stringIp: 'Yanlış IP ünvanı',
  stringIpv4: 'Yanlış IPv4 ünvanı',
  stringIpv6: 'Yanlış IPv6 ünvanı',
  stringEmpty: 'Sətir boş olmamalıdır',

  // Number validation messages
  invalidNumber: 'Yanlış ədəd',
  numberMin: (min: number) => `Ədəd ən az ${min} olmalıdır`,
  numberMax: (max: number) => `Ədəd ən çox ${max} olmalıdır`,
  numberInt: 'Ədəd tam olmalıdır',
  numberPositive: 'Ədəd müsbət olmalıdır',
  numberNegative: 'Ədəd mənfi olmalıdır',
  numberNonnegative: 'Ədəd mənfi olmamalıdır',
  numberNonpositive: 'Ədəd müsbət olmamalıdır',
  numberFinite: 'Ədəd sonlu olmalıdır',
  numberSafe: 'Ədəd təhlükəsiz tam ədəd olmalıdır',
  numberMultipleOf: (value: number) => `Ədəd ${value}-in qatısı olmalıdır`,

  // Boolean validation messages
  invalidBoolean: 'Yanlış məntiqi dəyər',

  // Date validation messages
  invalidDate: 'Yanlış tarix',
  dateMin: (date: Date) => `Tarix ${date.toISOString()} sonrası olmalıdır`,
  dateMax: (date: Date) => `Tarix ${date.toISOString()} əvvəli olmalıdır`,

  // Object validation messages
  invalidObject: 'Yanlış obyekt',
  unexpectedKeys: (keys: string[]) => `Gözlənilməyən açarlar: ${keys.join(', ')}`,
  requiredField: (field: string) => `Tələb olunan "${field}" sahəsi çatışmır`,

  // Array validation messages
  invalidArray: 'Yanlış massiv',
  arrayMin: (min: number) => `Massiv ən az ${min} element daşımalıdır`,
  arrayMax: (max: number) => `Massiv ən çox ${max} element daşımalıdır`,
  arrayLength: (length: number) => `Massiv tam olaraq ${length} element daşımalıdır`,
  arrayEmpty: 'Massiv boş olmamalıdır',
  arrayItem: (index: number, error: string) => `${index} indeksli element yanlışdır: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `Yanlış "${field}" sahəsi: ${error}`,

  // Union validation messages
  unionNoMatch: () => `Yanlış daxiletmə`,

  // Intersection validation messages
  intersectionError: (error: string) => `Kəsişmə yoxlama xətası: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `Gözlənilən ${expected}, alınan ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `[${values.join(', ')}] dəyərlərindən biri gözlənilirdi, alınan ${received}`,

  // Special type validation messages
  expectedUndefined: 'undefined gözlənilirdi',
  neverType: 'never tipi təhlil edilə bilməz',

  // New advanced type validation messages
  invalidBigint: 'Yanlış bigint',
  invalidSymbol: 'Yanlış symbol',
  invalidTuple: 'Yanlış kortej',
  tupleLength: (expected: number, received: number) => `Kortej tam olaraq ${expected} element daşımalıdır, alınan ${received}`,
  invalidRecord: 'Yanlış qeyd',
  invalidSet: 'Yanlış çoxluq',
  invalidMap: 'Yanlış xəritə',

  // Transformation and refinement messages
  transformError: (error: string) => `Dəyişdirmə xətası: ${error}`,
  refinementError: (error: string) => `Dəqiqləşdirmə xətası: ${error}`,
  customValidationError: (error: string) => `Xüsusi yoxlama xətası: ${error}`,

  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `${JSON.stringify(value)} dəyəri ${type} tipinə çevrilə bilmədi`,

  // Codec messages
  codecDecodeFailed: 'Dəyərin dekodlanması alınmadı',
  codecEncodeFailed: 'Dəyərin kodlanması alınmadı',
  codecAsyncNotSupported: 'Asinxron kodek əməliyyatları parseAsync/encodeAsync metodlarını tələb edir',

  // Base64/Hex messages
  invalidBase64: 'Yanlış base64 sətri',
  invalidHex: 'Yanlış onaltılıq sətir',

  // Uint8Array messages
  expectedUint8Array: 'Uint8Array gözlənilirdi',
  uint8ArrayMinLength: (min: number) => `Uint8Array ən az ${min} bayt olmalıdır`,
  uint8ArrayMaxLength: (max: number) => `Uint8Array ən çox ${max} bayt olmalıdır`,
  uint8ArrayExactLength: (length: number) => `Uint8Array tam olaraq ${length} bayt olmalıdır`,

  // Generic type error messages
  expectedString: 'Sətir gözlənilirdi',
  stringExpected: (received: string, expected: string) => `Gözlənilən ${expected}, alınan ${received}`,
  stringBoolExpected: (validValues: string, received: string) => `Yanlış məntiqi sətir. Gözlənilən dəyərlərdən biri: ${validValues}, alınan "${received}"`,
  invalidJson: 'Yanlış JSON',
  stringPatternInvalid: 'Sətir tələb olunan naxışa uyğun gəlmir',

  // File validation messages
  invalidFile: 'File obyekti gözlənilirdi',
  fileNotSupported: 'File API bu mühitdə dəstəklənmir',
  fileMinSize: (min: number) => `Fayl ölçüsü ən az ${min} bayt olmalıdır`,
  fileMaxSize: (max: number) => `Fayl ölçüsü ${max} baytdan çox olmamalıdır`,
  fileMimeType: (allowed: string[]) => `Yanlış fayl tipi. Gözlənilən: ${allowed.join(', ')}`,

  // Function validation messages
  invalidFunction: 'Funksiya gözlənilirdi',

  // CIDR validation messages
  stringCidrv4: 'Yanlış IPv4 CIDR bloku',
  stringCidrv6: 'Yanlış IPv6 CIDR bloku',

  // Safe extend validation messages
  safeExtendOverlap: (keys: string[]) => `Mövcud açarları ləğv etmək olmaz: ${keys.join(', ')}. Ləğv etmək istəyirsinizsə extend() istifadə edin.`,
};
