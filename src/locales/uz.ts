import { LocaleMessages } from './types';

// Uzbek (ported 2026-10-27)
export const uz: LocaleMessages = {
  // String validation messages
  invalidString: 'Noto\'g\'ri satr',
  stringMin: (min: number) => `Satr kamida ${min} belgidan iborat bo\'lishi kerak`,
  stringMax: (max: number) => `Satr ko\'pi bilan ${max} belgidan iborat bo\'lishi kerak`,
  stringLength: (length: number) => `Satr aynan ${length} belgidan iborat bo\'lishi kerak`,
  stringEmail: 'Noto\'g\'ri e-pochta manzili',
  stringUrl: 'Noto\'g\'ri URL',
  stringUuid: 'Noto\'g\'ri UUID',
  stringRegex: 'Noto\'g\'ri format',
  stringStartsWith: (prefix: string) => `Satr "${prefix}" bilan boshlanishi kerak`,
  stringEndsWith: (suffix: string) => `Satr "${suffix}" bilan tugashi kerak`,
  stringIncludes: (substring: string) => `Satrda "${substring}" bo\'lishi kerak`,
  stringIp: 'Noto\'g\'ri IP manzil',
  stringIpv4: 'Noto\'g\'ri IPv4 manzil',
  stringIpv6: 'Noto\'g\'ri IPv6 manzil',
  stringEmpty: 'Satr bo\'sh bo\'lmasligi kerak',

  // Number validation messages
  invalidNumber: 'Noto\'g\'ri son',
  numberMin: (min: number) => `Son kamida ${min} bo\'lishi kerak`,
  numberMax: (max: number) => `Son ko\'pi bilan ${max} bo\'lishi kerak`,
  numberInt: 'Son butun bo\'lishi kerak',
  numberPositive: 'Son musbat bo\'lishi kerak',
  numberNegative: 'Son manfiy bo\'lishi kerak',
  numberNonnegative: 'Son manfiy bo\'lmasligi kerak',
  numberNonpositive: 'Son musbat bo\'lmasligi kerak',
  numberFinite: 'Son chekli bo\'lishi kerak',
  numberSafe: 'Son xavfsiz butun son bo\'lishi kerak',
  numberMultipleOf: (value: number) => `Son ${value} ga karrali bo\'lishi kerak`,

  // Boolean validation messages
  invalidBoolean: 'Noto\'g\'ri mantiqiy qiymat',

  // Date validation messages
  invalidDate: 'Noto\'g\'ri sana',
  dateMin: (date: Date) => `Sana ${date.toISOString()} dan keyin bo\'lishi kerak`,
  dateMax: (date: Date) => `Sana ${date.toISOString()} dan oldin bo\'lishi kerak`,

  // Object validation messages
  invalidObject: 'Noto\'g\'ri obyekt',
  unexpectedKeys: (keys: string[]) => `Kutilmagan kalitlar: ${keys.join(', ')}`,
  requiredField: (field: string) => `Majburiy "${field}" maydoni yo\'q`,

  // Array validation messages
  invalidArray: 'Noto\'g\'ri massiv',
  arrayMin: (min: number) => `Massivda kamida ${min} element bo\'lishi kerak`,
  arrayMax: (max: number) => `Massivda ko\'pi bilan ${max} element bo\'lishi kerak`,
  arrayLength: (length: number) => `Massivda aynan ${length} element bo\'lishi kerak`,
  arrayEmpty: 'Massiv bo\'sh bo\'lmasligi kerak',
  arrayItem: (index: number, error: string) => `${index} indeksdagi element noto\'g\'ri: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `Noto\'g\'ri "${field}" maydoni: ${error}`,

  // Union validation messages
  unionNoMatch: () => `Noto\'g\'ri kiritma`,

  // Intersection validation messages
  intersectionError: (error: string) => `Kesishma tekshiruvi xatosi: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `Kutilgan ${expected}, olingan ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `[${values.join(', ')}] dan biri kutilgan, olingan ${received}`,

  // Special type validation messages
  expectedUndefined: 'undefined kutilgan',
  neverType: 'never turini tahlil qilib bo\'lmaydi',

  // New advanced type validation messages
  invalidBigint: 'Noto\'g\'ri bigint',
  invalidSymbol: 'Noto\'g\'ri symbol',
  invalidTuple: 'Noto\'g\'ri kortej',
  tupleLength: (expected: number, received: number) => `Kortejda aynan ${expected} element bo\'lishi kerak, ${received} olingan`,
  invalidRecord: 'Noto\'g\'ri yozuv',
  invalidSet: 'Noto\'g\'ri to\'plam',
  invalidMap: 'Noto\'g\'ri xarita',

  // Transformation and refinement messages
  transformError: (error: string) => `O\'zgartirish xatosi: ${error}`,
  refinementError: (error: string) => `Aniqlashtirish xatosi: ${error}`,
  customValidationError: (error: string) => `Maxsus tekshiruv xatosi: ${error}`,

  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `${JSON.stringify(value)} ni ${type} ga aylantirib bo\'lmadi`,

  // Codec messages
  codecDecodeFailed: 'Qiymatni dekodlash amalga oshmadi',
  codecEncodeFailed: 'Qiymatni kodlash amalga oshmadi',
  codecAsyncNotSupported: 'Asinxron kodek operatsiyalari parseAsync/encodeAsync metodlarini talab qiladi',

  // Base64/Hex messages
  invalidBase64: 'Noto\'g\'ri base64 satr',
  invalidHex: 'Noto\'g\'ri o\'n oltilik satr',

  // Uint8Array messages
  expectedUint8Array: 'Uint8Array kutilgan',
  uint8ArrayMinLength: (min: number) => `Uint8Array kamida ${min} bayt bo\'lishi kerak`,
  uint8ArrayMaxLength: (max: number) => `Uint8Array ko\'pi bilan ${max} bayt bo\'lishi kerak`,
  uint8ArrayExactLength: (length: number) => `Uint8Array aynan ${length} bayt bo\'lishi kerak`,

  // Generic type error messages
  expectedString: 'Satr kutilgan',
  stringExpected: (received: string, expected: string) => `Kutilgan ${expected}, olingan ${received}`,
  stringBoolExpected: (validValues: string, received: string) => `Noto\'g\'ri mantiqiy satr. Kutilgan qiymatlardan biri: ${validValues}, olingan "${received}"`,
  invalidJson: 'Noto\'g\'ri JSON',
  stringPatternInvalid: 'Satr talab qilinadigan shablonga mos kelmaydi',

  // File validation messages
  invalidFile: 'File obyekti kutilgan',
  fileNotSupported: 'File API bu muhitda qo\'llab-quvvatlanmaydi',
  fileMinSize: (min: number) => `Fayl hajmi kamida ${min} bayt bo\'lishi kerak`,
  fileMaxSize: (max: number) => `Fayl hajmi ${max} baytdan oshmasligi kerak`,
  fileMimeType: (allowed: string[]) => `Noto\'g\'ri fayl turi. Kutilgan: ${allowed.join(', ')}`,

  // Function validation messages
  invalidFunction: 'Funksiya kutilgan',

  // CIDR validation messages
  stringCidrv4: 'Noto\'g\'ri IPv4 CIDR bloki',
  stringCidrv6: 'Noto\'g\'ri IPv6 CIDR bloki',

  // Safe extend validation messages
  safeExtendOverlap: (keys: string[]) => `Mavjud kalitlarni bekor qilib bo\'lmaydi: ${keys.join(', ')}. Bekor qilmoqchi bo\'lsangiz extend() dan foydalaning.`,
};
