import { LocaleMessages } from './types';

// Central Kurdish / Sorani (ported 2026-10-27)
export const ckb: LocaleMessages = {
  // String validation messages
  invalidString: 'زنجیرەی نادروست',
  stringMin: (min: number) => `زنجیرە دەبێت لانیکەم ${min} پیت بێت`,
  stringMax: (max: number) => `زنجیرە دەبێت لە زۆرترین ${max} پیت کەمتر بێت`,
  stringLength: (length: number) => `زنجیرە دەبێت بە تەواوی ${length} پیت بێت`,
  stringEmail: 'ناونیشانی ئیمەیڵی نادروست',
  stringUrl: 'URL ی نادروست',
  stringUuid: 'UUID ی نادروست',
  stringRegex: 'فۆرماتی نادروست',
  stringStartsWith: (prefix: string) => `زنجیرە دەبێت بە "${prefix}" دەست پێبکات`,
  stringEndsWith: (suffix: string) => `زنجیرە دەبێت بە "${suffix}" کۆتایی بێت`,
  stringIncludes: (substring: string) => `زنجیرە دەبێت "${substring}" لەخۆبگرێت`,
  stringIp: 'ناونیشانی IP ی نادروست',
  stringIpv4: 'ناونیشانی IPv4 ی نادروست',
  stringIpv6: 'ناونیشانی IPv6 ی نادروست',
  stringEmpty: 'زنجیرە نابێت بەتاڵ بێت',

  // Number validation messages
  invalidNumber: 'ژمارەی نادروست',
  numberMin: (min: number) => `ژمارە دەبێت لانیکەم ${min} بێت`,
  numberMax: (max: number) => `ژمارە دەبێت لە زۆرترین ${max} کەمتر بێت`,
  numberInt: 'ژمارە دەبێت تەواو بێت',
  numberPositive: 'ژمارە دەبێت ئەرێنی بێت',
  numberNegative: 'ژمارە دەبێت نەرێنی بێت',
  numberNonnegative: 'ژمارە نابێت نەرێنی بێت',
  numberNonpositive: 'ژمارە نابێت ئەرێنی بێت',
  numberFinite: 'ژمارە دەبێت سنووردار بێت',
  numberSafe: 'ژمارە دەبێت ژمارەی تەواوی سەلامەت بێت',
  numberMultipleOf: (value: number) => `ژمارە دەبێت دووجای ${value} بێت`,

  // Boolean validation messages
  invalidBoolean: 'بەهای بولینی نادروست',

  // Date validation messages
  invalidDate: 'بەروارێکی نادروست',
  dateMin: (date: Date) => `بەروار دەبێت دوای ${date.toISOString()} بێت`,
  dateMax: (date: Date) => `بەروار دەبێت پێش ${date.toISOString()} بێت`,

  // Object validation messages
  invalidObject: 'ئۆبجێکتی نادروست',
  unexpectedKeys: (keys: string[]) => `کلیلە چاوەڕواننەکراوەکان: ${keys.join(', ')}`,
  requiredField: (field: string) => `خانەی پێویست "${field}" نییە`,

  // Array validation messages
  invalidArray: 'ڕیزێکی نادروست',
  arrayMin: (min: number) => `ڕیز دەبێت لانیکەم ${min} توخم لەخۆبگرێت`,
  arrayMax: (max: number) => `ڕیز دەبێت لە زۆرترین ${max} توخم کەمتر بێت`,
  arrayLength: (length: number) => `ڕیز دەبێت بە تەواوی ${length} توخم بێت`,
  arrayEmpty: 'ڕیز نابێت بەتاڵ بێت',
  arrayItem: (index: number, error: string) => `توخمی نادروست لە ئیندێکسی ${index}: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `خانەی نادروست "${field}": ${error}`,

  // Union validation messages
  unionNoMatch: () => `داخڵکردنی نادروست`,

  // Intersection validation messages
  intersectionError: (error: string) => `هەڵەی پشکنینی لێکدان: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `چاوەڕوانی ${expected} بوو، ${received} وەرگیرا`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `چاوەڕوانی یەکێک لە [${values.join(', ')}] بوو، ${received} وەرگیرا`,

  // Special type validation messages
  expectedUndefined: 'چاوەڕوانی undefined بوو',
  neverType: 'جۆری never ناتوانرێت شیکار بکرێت',

  // New advanced type validation messages
  invalidBigint: 'bigint ی نادروست',
  invalidSymbol: 'symbol ی نادروست',
  invalidTuple: 'تیوپڵێکی نادروست',
  tupleLength: (expected: number, received: number) => `تیوپڵ دەبێت بە تەواوی ${expected} توخم بێت، ${received} وەرگیرا`,
  invalidRecord: 'تۆمارێکی نادروست',
  invalidSet: `کۆمەڵێکی نادروست`,
  invalidMap: `نەخشێکی نادروست`,

  // Transformation and refinement messages
  transformError: (error: string) => `هەڵەی گۆڕین: ${error}`,
  refinementError: (error: string) => `هەڵەی ڕەنگکردنەوە: ${error}`,
  customValidationError: (error: string) => `هەڵەی پشکنینی تایبەت: ${error}`,

  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `ناتوانرێت ${JSON.stringify(value)} بۆ ${type} بگۆڕدرێت`,

  // Codec messages
  codecDecodeFailed: 'دیکۆدکردنی بەها سەرکەوتوو نەبوو',
  codecEncodeFailed: 'ئینکۆدکردنی بەها سەرکەوتوو نەبوو',
  codecAsyncNotSupported: 'کردارە ناهاوسەنگەکانی کۆدێک پێویستیان بە میتۆدەکانی parseAsync/encodeAsync هەیە',

  // Base64/Hex messages
  invalidBase64: 'زنجیرەی base64 ی نادروست',
  invalidHex: 'زنجیرەی شازدەی نادروست',

  // Uint8Array messages
  expectedUint8Array: 'چاوەڕوانی Uint8Array بوو',
  uint8ArrayMinLength: (min: number) => `Uint8Array دەبێت لانیکەم ${min} بایت بێت`,
  uint8ArrayMaxLength: (max: number) => `Uint8Array دەبێت لە زۆرترین ${max} بایت کەمتر بێت`,
  uint8ArrayExactLength: (length: number) => `Uint8Array دەبێت بە تەواوی ${length} بایت بێت`,

  // Generic type error messages
  expectedString: 'چاوەڕوانی زنجیرە بوو',
  stringExpected: (received: string, expected: string) => `چاوەڕوانی ${expected} بوو، ${received} وەرگیرا`,
  stringBoolExpected: (validValues: string, received: string) => `زنجیرەی بولینی نادروست: چاوەڕوانی یەکێک لە ${validValues} بوو، "${received}" وەرگیرا`,
  invalidJson: 'JSON ی نادروست',
  stringPatternInvalid: 'زنجیرە لەگەڵ نموونەی پێویست یەکناگرێتەوە',

  // File validation messages
  invalidFile: 'چاوەڕوانی ئۆبجێکتی File بوو',
  fileNotSupported: 'File API لەم ژینگەیەدا پشتگیری نەکراوە',
  fileMinSize: (min: number) => `قەبارەی فایل دەبێت لانیکەم ${min} بایت بێت`,
  fileMaxSize: (max: number) => `قەبارەی فایل نابێت لە ${max} بایت زیاتر بێت`,
  fileMimeType: (allowed: string[]) => `جۆری فایلی نادروست: چاوەڕوانی ${allowed.join(', ')} بوو`,

  // Function validation messages
  invalidFunction: 'چاوەڕوانی فەنکشن بوو',

  // CIDR validation messages
  stringCidrv4: 'بلۆکی IPv4 CIDR ی نادروست',
  stringCidrv6: 'بلۆکی IPv6 CIDR ی نادروست',

  // Safe extend validation messages
  safeExtendOverlap: (keys: string[]) => `ناتوانرێت کلیلەکانی ئێستا بنووسرێنەوە: ${keys.join(', ')}. ئەگەر دەتەوێت بیاننووسیتەوە، extend() بەکاربهێنە.`,
};
