import { LocaleMessages } from './types';

// Urdu (ported 2026-10-27)
export const ur: LocaleMessages = {
  // String validation messages
  invalidString: 'غلط اسٹرنگ',
  stringMin: (min: number) => `اسٹرنگ میں کم از کم ${min} حروف ہونے چاہئیں`,
  stringMax: (max: number) => `اسٹرنگ میں زیادہ سے زیادہ ${max} حروف ہونے چاہئیں`,
  stringLength: (length: number) => `اسٹرنگ میں بالکل ${length} حروف ہونے چاہئیں`,
  stringEmail: 'غلط ای میل ایڈریس',
  stringUrl: 'غلط URL',
  stringUuid: 'غلط UUID',
  stringRegex: 'غلط فارمیٹ',
  stringStartsWith: (prefix: string) => `اسٹرنگ "${prefix}" سے شروع ہونا چاہیے`,
  stringEndsWith: (suffix: string) => `اسٹرنگ "${suffix}" پر ختم ہونا چاہیے`,
  stringIncludes: (substring: string) => `اسٹرنگ میں "${substring}" شامل ہونا چاہیے`,
  stringIp: 'غلط IP ایڈریس',
  stringIpv4: 'غلط IPv4 ایڈریس',
  stringIpv6: 'غلط IPv6 ایڈریس',
  stringEmpty: 'اسٹرنگ خالی نہیں ہو سکتا',

  // Number validation messages
  invalidNumber: 'غلط عدد',
  numberMin: (min: number) => `عدد کم از کم ${min} ہونا چاہیے`,
  numberMax: (max: number) => `عدد زیادہ سے زیادہ ${max} ہونا چاہیے`,
  numberInt: 'عدد صحیح ہونا چاہیے',
  numberPositive: 'عدد مثبت ہونا چاہیے',
  numberNegative: 'عدد منفی ہونا چاہیے',
  numberNonnegative: 'عدد منفی نہیں ہو سکتا',
  numberNonpositive: 'عدد مثبت نہیں ہو سکتا',
  numberFinite: 'عدد محدود ہونا چاہیے',
  numberSafe: 'عدد محفوظ صحیح عدد ہونا چاہیے',
  numberMultipleOf: (value: number) => `عدد ${value} کا مضاعف ہونا چاہیے`,

  // Boolean validation messages
  invalidBoolean: 'غلط بولین ویلیو',

  // Date validation messages
  invalidDate: 'غلط تاریخ',
  dateMin: (date: Date) => `تاریخ ${date.toISOString()} کے بعد ہونی چاہیے`,
  dateMax: (date: Date) => `تاریخ ${date.toISOString()} سے پہلے ہونی چاہیے`,

  // Object validation messages
  invalidObject: 'غلط آبجیکٹ',
  unexpectedKeys: (keys: string[]) => `غیر متوقع کلیدیں: ${keys.join(', ')}`,
  requiredField: (field: string) => `لازمی فیلڈ "${field}" موجود نہیں ہے`,

  // Array validation messages
  invalidArray: 'غلط ارے',
  arrayMin: (min: number) => `ارے میں کم از کم ${min} عناصر ہونے چاہئیں`,
  arrayMax: (max: number) => `ارے میں زیادہ سے زیادہ ${max} عناصر ہونے چاہئیں`,
  arrayLength: (length: number) => `ارے میں بالکل ${length} عناصر ہونے چاہئیں`,
  arrayEmpty: 'ارے خالی نہیں ہو سکتا',
  arrayItem: (index: number, error: string) => `انڈیکس ${index} پر غلط عنصر: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `غلط فیلڈ "${field}": ${error}`,

  // Union validation messages
  unionNoMatch: () => `غلط ان پٹ`,

  // Intersection validation messages
  intersectionError: (error: string) => `تقاطع کی تصدیق میں خرابی: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `متوقع ${expected}، موصول ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `[${values.join(', ')}] میں سے کوئی ایک متوقع تھا، موصول ${received}`,

  // Special type validation messages
  expectedUndefined: 'undefined متوقع تھا',
  neverType: 'never قسم کو پارس نہیں کیا جا سکتا',

  // New advanced type validation messages
  invalidBigint: 'غلط bigint',
  invalidSymbol: 'غلط symbol',
  invalidTuple: 'غلط ٹپل',
  tupleLength: (expected: number, received: number) => `ٹپل میں بالکل ${expected} عناصر ہونے چاہئیں، ${received} موصول ہوئے`,
  invalidRecord: 'غلط ریکارڈ',
  invalidSet: 'غلط سیٹ',
  invalidMap: 'غلط میپ',

  // Transformation and refinement messages
  transformError: (error: string) => `تبدیلی میں خرابی: ${error}`,
  refinementError: (error: string) => `بہتری میں خرابی: ${error}`,
  customValidationError: (error: string) => `حسبِ ضرورت تصدیق میں خرابی: ${error}`,

  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `${JSON.stringify(value)} کو ${type} میں تبدیل نہیں کیا جا سکتا`,

  // Codec messages
  codecDecodeFailed: 'ویلیو ڈی کوڈ کرنے میں ناکامی',
  codecEncodeFailed: 'ویلیو ان کوڈ کرنے میں ناکامی',
  codecAsyncNotSupported: 'غیر ہم زمانہ کوڈک آپریشنز کے لیے parseAsync/encodeAsync طریقے درکار ہیں',

  // Base64/Hex messages
  invalidBase64: 'غلط base64 اسٹرنگ',
  invalidHex: 'غلط ہیکزاڈیسیمل اسٹرنگ',

  // Uint8Array messages
  expectedUint8Array: 'Uint8Array متوقع تھا',
  uint8ArrayMinLength: (min: number) => `Uint8Array میں کم از کم ${min} بائٹس ہونے چاہئیں`,
  uint8ArrayMaxLength: (max: number) => `Uint8Array میں زیادہ سے زیادہ ${max} بائٹس ہونے چاہئیں`,
  uint8ArrayExactLength: (length: number) => `Uint8Array میں بالکل ${length} بائٹس ہونے چاہئیں`,

  // Generic type error messages
  expectedString: 'اسٹرنگ متوقع تھا',
  stringExpected: (received: string, expected: string) => `متوقع ${expected}، موصول ${received}`,
  stringBoolExpected: (validValues: string, received: string) => `غلط بولین اسٹرنگ۔ ان میں سے کوئی ایک متوقع تھا: ${validValues}، موصول "${received}"`,
  invalidJson: 'غلط JSON',
  stringPatternInvalid: 'اسٹرنگ مطلوبہ پیٹرن سے مطابقت نہیں رکھتا',

  // File validation messages
  invalidFile: 'File آبجیکٹ متوقع تھا',
  fileNotSupported: 'File API اس ماحول میں معاون نہیں ہے',
  fileMinSize: (min: number) => `فائل کا سائز کم از کم ${min} بائٹس ہونا چاہیے`,
  fileMaxSize: (max: number) => `فائل کا سائز ${max} بائٹس سے زیادہ نہیں ہونا چاہیے`,
  fileMimeType: (allowed: string[]) => `غلط فائل کی قسم۔ متوقع: ${allowed.join(', ')}`,

  // Function validation messages
  invalidFunction: 'فنکشن متوقع تھا',

  // CIDR validation messages
  stringCidrv4: 'غلط IPv4 CIDR بلاک',
  stringCidrv6: 'غلط IPv6 CIDR بلاک',

  // Safe extend validation messages
  safeExtendOverlap: (keys: string[]) => `موجودہ کلیدیں اوور رائٹ نہیں ہو سکتیں: ${keys.join(', ')}۔ اوور رائٹ کرنا چاہتے ہیں تو extend() استعمال کریں۔`,
};
