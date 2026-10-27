import { LocaleMessages } from './types';

// Persian (ported 2026-10-27)
export const fa: LocaleMessages = {
  // String validation messages
  invalidString: 'رشته نامعتبر',
  stringMin: (min: number) => `رشته باید حداقل ${min} نویسه داشته باشد`,
  stringMax: (max: number) => `رشته باید حداکثر ${max} نویسه داشته باشد`,
  stringLength: (length: number) => `رشته باید دقیقاً ${length} نویسه داشته باشد`,
  stringEmail: 'نشانی ایمیل نامعتبر',
  stringUrl: 'URL نامعتبر',
  stringUuid: 'UUID نامعتبر',
  stringRegex: 'قالب نامعتبر',
  stringStartsWith: (prefix: string) => `رشته باید با "${prefix}" شروع شود`,
  stringEndsWith: (suffix: string) => `رشته باید با "${suffix}" پایان یابد`,
  stringIncludes: (substring: string) => `رشته باید شامل "${substring}" باشد`,
  stringIp: 'نشانی IP نامعتبر',
  stringIpv4: 'نشانی IPv4 نامعتبر',
  stringIpv6: 'نشانی IPv6 نامعتبر',
  stringEmpty: 'رشته نمی‌تواند خالی باشد',

  // Number validation messages
  invalidNumber: 'عدد نامعتبر',
  numberMin: (min: number) => `عدد باید حداقل ${min} باشد`,
  numberMax: (max: number) => `عدد باید حداکثر ${max} باشد`,
  numberInt: 'عدد باید صحیح باشد',
  numberPositive: 'عدد باید مثبت باشد',
  numberNegative: 'عدد باید منفی باشد',
  numberNonnegative: 'عدد نمی‌تواند منفی باشد',
  numberNonpositive: 'عدد نمی‌تواند مثبت باشد',
  numberFinite: 'عدد باید متناهی باشد',
  numberSafe: 'عدد باید یک عدد صحیح امن باشد',
  numberMultipleOf: (value: number) => `عدد باید مضرب ${value} باشد`,

  // Boolean validation messages
  invalidBoolean: 'مقدار بولی نامعتبر',

  // Date validation messages
  invalidDate: 'تاریخ نامعتبر',
  dateMin: (date: Date) => `تاریخ باید بعد از ${date.toISOString()} باشد`,
  dateMax: (date: Date) => `تاریخ باید قبل از ${date.toISOString()} باشد`,

  // Object validation messages
  invalidObject: 'شیء نامعتبر',
  unexpectedKeys: (keys: string[]) => `کلیدهای غیرمنتظره: ${keys.join(', ')}`,
  requiredField: (field: string) => `فیلد الزامی "${field}" وجود ندارد`,

  // Array validation messages
  invalidArray: 'آرایه نامعتبر',
  arrayMin: (min: number) => `آرایه باید حداقل ${min} عنصر داشته باشد`,
  arrayMax: (max: number) => `آرایه باید حداکثر ${max} عنصر داشته باشد`,
  arrayLength: (length: number) => `آرایه باید دقیقاً ${length} عنصر داشته باشد`,
  arrayEmpty: 'آرایه نمی‌تواند خالی باشد',
  arrayItem: (index: number, error: string) => `عنصر نامعتبر در اندیس ${index}: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `فیلد نامعتبر "${field}": ${error}`,

  // Union validation messages
  unionNoMatch: () => `ورودی نامعتبر`,

  // Intersection validation messages
  intersectionError: (error: string) => `خطای اعتبارسنجی اشتراک: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `انتظار می‌رفت ${expected}، دریافت شد ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `انتظار می‌رفت یکی از [${values.join(', ')}]، دریافت شد ${received}`,

  // Special type validation messages
  expectedUndefined: 'انتظار می‌رفت undefined',
  neverType: 'نوع never قابل تجزیه نیست',

  // New advanced type validation messages
  invalidBigint: 'bigint نامعتبر',
  invalidSymbol: 'symbol نامعتبر',
  invalidTuple: 'تاپل نامعتبر',
  tupleLength: (expected: number, received: number) => `تاپل باید دقیقاً ${expected} عنصر داشته باشد، ${received} دریافت شد`,
  invalidRecord: 'رکورد نامعتبر',
  invalidSet: 'مجموعه نامعتبر',
  invalidMap: 'نقشه نامعتبر',

  // Transformation and refinement messages
  transformError: (error: string) => `خطای تبدیل: ${error}`,
  refinementError: (error: string) => `خطای پالایش: ${error}`,
  customValidationError: (error: string) => `خطای اعتبارسنجی سفارشی: ${error}`,

  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `تبدیل ${JSON.stringify(value)} به ${type} ممکن نیست`,

  // Codec messages
  codecDecodeFailed: 'رمزگشایی مقدار ناموفق بود',
  codecEncodeFailed: 'رمزگذاری مقدار ناموفق بود',
  codecAsyncNotSupported: 'عملیات‌های ناهمگام کدک به متدهای parseAsync/encodeAsync نیاز دارند',

  // Base64/Hex messages
  invalidBase64: 'رشته base64 نامعتبر',
  invalidHex: 'رشته هگزادسیمال نامعتبر',

  // Uint8Array messages
  expectedUint8Array: 'انتظار می‌رفت Uint8Array',
  uint8ArrayMinLength: (min: number) => `Uint8Array باید حداقل ${min} بایت داشته باشد`,
  uint8ArrayMaxLength: (max: number) => `Uint8Array باید حداکثر ${max} بایت داشته باشد`,
  uint8ArrayExactLength: (length: number) => `Uint8Array باید دقیقاً ${length} بایت داشته باشد`,

  // Generic type error messages
  expectedString: 'انتظار می‌رفت رشته',
  stringExpected: (received: string, expected: string) => `انتظار می‌رفت ${expected}، دریافت شد ${received}`,
  stringBoolExpected: (validValues: string, received: string) => `رشته بولی نامعتبر. انتظار می‌رفت یکی از: ${validValues}، دریافت شد "${received}"`,
  invalidJson: 'JSON نامعتبر',
  stringPatternInvalid: 'رشته با الگوی مورد نیاز مطابقت ندارد',

  // File validation messages
  invalidFile: 'انتظار می‌رفت شیء File',
  fileNotSupported: 'File API در این محیط پشتیبانی نمی‌شود',
  fileMinSize: (min: number) => `اندازه فایل باید حداقل ${min} بایت باشد`,
  fileMaxSize: (max: number) => `اندازه فایل نباید از ${max} بایت بیشتر شود`,
  fileMimeType: (allowed: string[]) => `نوع فایل نامعتبر. انتظار می‌رفت: ${allowed.join(', ')}`,

  // Function validation messages
  invalidFunction: 'انتظار می‌رفت تابع',

  // CIDR validation messages
  stringCidrv4: 'بلوک CIDR IPv4 نامعتبر',
  stringCidrv6: 'بلوک CIDR IPv6 نامعتبر',

  // Safe extend validation messages
  safeExtendOverlap: (keys: string[]) => `کلیدهای موجود قابل بازنویسی نیستند: ${keys.join(', ')}. اگر می‌خواهید بازنویسی کنید از extend() استفاده کنید.`,
};
