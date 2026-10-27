import { LocaleMessages } from './types';

// Ottoman Turkish (Arabic script; terminology cross-checked against zod's ota
// locale - epostagâh, hengâm etc. - ported 2026-10-27)
export const ota: LocaleMessages = {
  // String validation messages
  invalidString: 'سطر غير صحيح',
  stringMin: (min: number) => `سطر باید اققل ${min} حرف داشته باشد`,
  stringMax: (max: number) => `سطر باید اعظم ${max} حرف داشته باشد`,
  stringLength: (length: number) => `سطر باید دقیقاً ${length} حرف داشته باشد`,
  stringEmail: 'پوست‌گاه نامعتبر',
  stringUrl: 'URL نامعتبر',
  stringUuid: 'UUID نامعتبر',
  stringRegex: 'قالب نامعتبر',
  stringStartsWith: (prefix: string) => `سطر باید با "${prefix}" شروع شود`,
  stringEndsWith: (suffix: string) => `سطر باید با "${suffix}" تمام شود`,
  stringIncludes: (substring: string) => `سطر باید "${substring}" را در بر گیرد`,
  stringIp: 'آدرس IP نامعتبر',
  stringIpv4: 'آدرس IPv4 نامعتبر',
  stringIpv6: 'آدرس IPv6 نامعتبر',
  stringEmpty: 'سطر خالی نباشد',

  // Number validation messages
  invalidNumber: 'عدد نامعتبر',
  numberMin: (min: number) => `عدد باید اققل ${min} باشد`,
  numberMax: (max: number) => `عدد باید اعظم ${max} باشد`,
  numberInt: 'عدد باید صحیح باشد',
  numberPositive: 'عدد باید مثبت باشد',
  numberNegative: 'عدد باید منفی باشد',
  numberNonnegative: 'عدد منفی نباشد',
  numberNonpositive: 'عدد مثبت نباشد',
  numberFinite: 'عدد باید متناهی باشد',
  numberSafe: 'عدد باید عدد صحیح ایمن باشد',
  numberMultipleOf: (value: number) => `عدد باید مضرب ${value} باشد`,

  // Boolean validation messages
  invalidBoolean: 'قیمت منطقی نامعتبر',

  // Date validation messages
  invalidDate: 'تاریخ نامعتبر',
  dateMin: (date: Date) => `تاریخ باید بعد از ${date.toISOString()} باشد`,
  dateMax: (date: Date) => `تاریخ باید قبل از ${date.toISOString()} باشد`,

  // Object validation messages
  invalidObject: 'شیء نامعتبر',
  unexpectedKeys: (keys: string[]) => `کلیدهای غیرمنتظره: ${keys.join(', ')}`,
  requiredField: (field: string) => `میدان الزامی "${field}" موجود نیست`,

  // Array validation messages
  invalidArray: 'دیزه نامعتبر',
  arrayMin: (min: number) => `دیزه باید اققل ${min} عنصر داشته باشد`,
  arrayMax: (max: number) => `دیزه باید اعظم ${max} عنصر داشته باشد`,
  arrayLength: (length: number) => `دیزه باید دقیقاً ${length} عنصر داشته باشد`,
  arrayEmpty: 'دیزه خالی نباشد',
  arrayItem: (index: number, error: string) => `عنصر نامعتبر در اندیس ${index}: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `میدان نامعتبر "${field}": ${error}`,

  // Union validation messages
  unionNoMatch: () => `ورودی نامعتبر`,

  // Intersection validation messages
  intersectionError: (error: string) => `خطای تأیید تقاطع: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `منتظر ${expected} بود، ${received} دریافت شد`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `منتظر یکی از [${values.join(', ')}] بود، ${received} دریافت شد`,

  // Special type validation messages
  expectedUndefined: 'منتظر undefined بود',
  neverType: 'نوع never قابل تحلیل نیست',

  // New advanced type validation messages
  invalidBigint: 'bigint نامعتبر',
  invalidSymbol: 'symbol نامعتبر',
  invalidTuple: 'توبل نامعتبر',
  tupleLength: (expected: number, received: number) => `توبل باید دقیقاً ${expected} عنصر داشته باشد، ${received} دریافت شد`,
  invalidRecord: 'رکورد نامعتبر',
  invalidSet: 'مجموعه نامعتبر',
  invalidMap: 'نقشه نامعتبر',

  // Transformation and refinement messages
  transformError: (error: string) => `خطای تبدیل: ${error}`,
  refinementError: (error: string) => `خطای تصفیه: ${error}`,
  customValidationError: (error: string) => `خطای تأیید سفارشی: ${error}`,

  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `تبدیل ${JSON.stringify(value)} به ${type} ممکن نیست`,

  // Codec messages
  codecDecodeFailed: 'رمزگشایی قیمت ناموفق بود',
  codecEncodeFailed: 'رمزگذاری قیمت ناموفق بود',
  codecAsyncNotSupported: 'عملیات‌های غیرهمزمان کدک به روش‌های parseAsync/encodeAsync نیاز دارند',

  // Base64/Hex messages
  invalidBase64: 'سطر base64 نامعتبر',
  invalidHex: 'سطر شانزده‌ای نامعتبر',

  // Uint8Array messages
  expectedUint8Array: 'منتظر Uint8Array بود',
  uint8ArrayMinLength: (min: number) => `Uint8Array باید اققل ${min} بایت باشد`,
  uint8ArrayMaxLength: (max: number) => `Uint8Array باید اعظم ${max} بایت باشد`,
  uint8ArrayExactLength: (length: number) => `Uint8Array باید دقیقاً ${length} بایت باشد`,

  // Generic type error messages
  expectedString: 'منتظر سطر بود',
  stringExpected: (received: string, expected: string) => `منتظر ${expected} بود، ${received} دریافت شد`,
  stringBoolExpected: (validValues: string, received: string) => `سطر منطقی نامعتبر: منتظر یکی از ${validValues} بود، "${received}" دریافت شد`,
  invalidJson: 'JSON نامعتبر',
  stringPatternInvalid: 'سطر با الگوی مورد نیاز مطابقت ندارد',

  // File validation messages
  invalidFile: 'منتظر شیء File بود',
  fileNotSupported: 'File API در این محیط پشتیبانی نمی‌شود',
  fileMinSize: (min: number) => `اندازه فایل باید اققل ${min} بایت باشد`,
  fileMaxSize: (max: number) => `اندازه فایل نباید از ${max} بایت بیشتر شود`,
  fileMimeType: (allowed: string[]) => `نوع فایل نامعتبر: منتظر ${allowed.join(', ')} بود`,

  // Function validation messages
  invalidFunction: 'منتظر تابع بود',

  // CIDR validation messages
  stringCidrv4: 'بلوک IPv4 CIDR نامعتبر',
  stringCidrv6: 'بلوک IPv6 CIDR نامعتبر',

  // Safe extend validation messages
  safeExtendOverlap: (keys: string[]) => `کلیدهای موجود بازنویسی نشوند: ${keys.join(', ')}. اگر می‌خواهید بازنویسی کنید از extend() استفاده کنید.`,
};
