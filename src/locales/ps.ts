import { LocaleMessages } from './types';

// Pashto (ported 2026-10-27)
export const ps: LocaleMessages = {
  // String validation messages
  invalidString: 'ناسمه پایله (سټرینګ)',
  stringMin: (min: number) => `سټرینګ باید لږ تر لږه ${min} توري ولري`,
  stringMax: (max: number) => `سټرینګ باید تر ټولو زیات ${max} توري ولري`,
  stringLength: (length: number) => `سټرینګ باید دقیقاً ${length} توري ولري`,
  stringEmail: 'ناسم بریښنالیک پته',
  stringUrl: 'ناسم URL',
  stringUuid: 'ناسم UUID',
  stringRegex: 'ناسم فورمټ',
  stringStartsWith: (prefix: string) => `سټرینګ باید په "${prefix}" پیل شي`,
  stringEndsWith: (suffix: string) => `سټرینګ باید په "${suffix}" پای ته ورسي`,
  stringIncludes: (substring: string) => `سټرینګ باید "${substring}" ولري`,
  stringIp: 'ناسم IP پته',
  stringIpv4: 'ناسمه IPv4 پته',
  stringIpv6: 'ناسمه IPv6 پته',
  stringEmpty: 'سټرینګ تش نه شي',

  // Number validation messages
  invalidNumber: 'ناسم شمېر',
  numberMin: (min: number) => `شمېر باید لږ تر لږه ${min} وي`,
  numberMax: (max: number) => `شمېر باید تر ټولو زیات ${max} وي`,
  numberInt: 'شمېر باید بشپړ وي',
  numberPositive: 'شمېر باید مثبت وي',
  numberNegative: 'شمېر باید منفي وي',
  numberNonnegative: 'شمېر منفي نه شي',
  numberNonpositive: 'شمېر مثبت نه شي',
  numberFinite: 'شمېر باید محدود وي',
  numberSafe: 'شمېر باید خوندي بشپړ شمېر وي',
  numberMultipleOf: (value: number) => `شمېر باید د ${value} مضرب وي`,

  // Boolean validation messages
  invalidBoolean: 'ناسم بولین ارزښت',

  // Date validation messages
  invalidDate: 'ناسمه نېټه',
  dateMin: (date: Date) => `نېټه باید د ${date.toISOString()} وروسته وي`,
  dateMax: (date: Date) => `نېټه باید د ${date.toISOString()} مخکې وي`,

  // Object validation messages
  invalidObject: 'ناسم اعتراض (آبجیکټ)',
  unexpectedKeys: (keys: string[]) => `ناڅرګنده کیليان: ${keys.join(', ')}`,
  requiredField: (field: string) => `لازمي برخه "${field}" نشته`,

  // Array validation messages
  invalidArray: 'ناسمېډون',
  arrayMin: (min: number) => `مېډون باید لږ تر لږه ${min} عناصر ولري`,
  arrayMax: (max: number) => `مېډون باید تر ټولو زیات ${max} عناصر ولري`,
  arrayLength: (length: number) => `مېډون باید دقیقاً ${length} عناصر ولري`,
  arrayEmpty: 'مېډون تش نه شي',
  arrayItem: (index: number, error: string) => `په ${index} انډیکس کې ناسم عنصر: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `ناسمه برخه "${field}": ${error}`,

  // Union validation messages
  unionNoMatch: () => `ناسم ان پټ`,

  // Intersection validation messages
  intersectionError: (error: string) => `د تقاطع د تصدیق خطا: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `تمه ${expected} وه، خو ${received} ترلاسه شو`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `د [${values.join(', ')}] څخه یو تمه وه، خو ${received} ترلاسه شو`,

  // Special type validation messages
  expectedUndefined: 'undefined تمه وه',
  neverType: 'never ډول نه شي تجزیه کیدلی',

  // New advanced type validation messages
  invalidBigint: 'ناسم bigint',
  invalidSymbol: 'ناسم symbol',
  invalidTuple: 'ناسم ټاپل',
  tupleLength: (expected: number, received: number) => `ټاپل باید دقیقاً ${expected} عناصر ولري، ${received} ترلاسه شول`,
  invalidRecord: 'ناسم ریکارډ',
  invalidSet: 'ناسم سیټ',
  invalidMap: 'ناسم نقشه',

  // Transformation and refinement messages
  transformError: (error: string) => `د بدلون خطا: ${error}`,
  refinementError: (error: string) => `د تصفیې خطا: ${error}`,
  customValidationError: (error: string) => `د ځانګړي تصدیق خطا: ${error}`,

  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `${JSON.stringify(value)} نه شي ${type} ته بدلیدلی`,

  // Codec messages
  codecDecodeFailed: 'د ارزښت ډیکوډ ناکام شو',
  codecEncodeFailed: 'د ارزښت انکوډ ناکام شو',
  codecAsyncNotSupported: 'غیر همغږي کوډیک عملیات د parseAsync/encodeAsync میتودونو ته اړتیا لري',

  // Base64/Hex messages
  invalidBase64: 'ناسم base64 سټرینګ',
  invalidHex: 'ناسم شپاړس توريزی سټرینګ',

  // Uint8Array messages
  expectedUint8Array: 'Uint8Array تمه وه',
  uint8ArrayMinLength: (min: number) => `Uint8Array باید لږ تر لږه ${min} بایټونه ولري`,
  uint8ArrayMaxLength: (max: number) => `Uint8Array باید تر ټولو زیات ${max} بایټونه ولري`,
  uint8ArrayExactLength: (length: number) => `Uint8Array باید دقیقاً ${length} بایټونه ولري`,

  // Generic type error messages
  expectedString: 'سټرینګ تمه وه',
  stringExpected: (received: string, expected: string) => `تمه ${expected} وه، خو ${received} ترلاسه شو`,
  stringBoolExpected: (validValues: string, received: string) => `ناسم بولین سټرینګ: د ${validValues} څخه یو تمه وه، خو "${received}" ترلاسه شو`,
  invalidJson: 'ناسم JSON',
  stringPatternInvalid: 'سټرینګ د اړین نمونې سره سمون نه لري',

  // File validation messages
  invalidFile: 'File آبجیکټ تمه وه',
  fileNotSupported: 'File API په دې چاپېریال کې ملاتړ نه لري',
  fileMinSize: (min: number) => `د فایل اندازه باید لږ تر لږه ${min} بایټونه وي`,
  fileMaxSize: (max: number) => `د فایل اندازه باید له ${max} بایټونو زیاته نه شي`,
  fileMimeType: (allowed: string[]) => `ناسم د فایل ډول: ${allowed.join(', ')} تمه وه`,

  // Function validation messages
  invalidFunction: 'فنکشن تمه وه',

  // CIDR validation messages
  stringCidrv4: 'ناسم IPv4 CIDR بلاک',
  stringCidrv6: 'ناسم IPv6 CIDR بلاک',

  // Safe extend validation messages
  safeExtendOverlap: (keys: string[]) => `موجودې کیليان نه شي بیا لیکل کیدلی: ${keys.join(', ')}. که بیا لیکل غواړئ نو extend() وکاروئ.`,
};
