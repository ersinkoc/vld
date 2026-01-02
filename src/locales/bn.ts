import { LocaleMessages } from './types';

export const bn: LocaleMessages = {
  // String validation messages
  invalidString: 'অবৈধ স্ট্রিং',
  stringMin: (min: number) => `স্ট্রিং কমপক্ষে ${min} অক্ষরের হতে হবে`,
  stringMax: (max: number) => `স্ট্রিং সর্বোচ্চ ${max} অক্ষরের হতে পারে`,
  stringLength: (length: number) => `স্ট্রিং ঠিক ${length} অক্ষরের হতে হবে`,
  stringEmail: 'অবৈধ ইমেইল ঠিকানা',
  stringUrl: 'অবৈধ URL',
  stringUuid: 'অবৈধ UUID',
  stringRegex: 'অবৈধ ফরম্যাট',
  stringStartsWith: (prefix: string) => `স্ট্রিং "${prefix}" দিয়ে শুরু হতে হবে`,
  stringEndsWith: (suffix: string) => `স্ট্রিং "${suffix}" দিয়ে শেষ হতে হবে`,
  stringIncludes: (substring: string) => `স্ট্রিং-এ "${substring}" থাকতে হবে`,
  stringIp: 'অবৈধ IP ঠিকানা',
  stringIpv4: 'অবৈধ IPv4 ঠিকানা',
  stringIpv6: 'অবৈধ IPv6 ঠিকানা',
  stringEmpty: 'স্ট্রিং খালি হতে পারবে না',

  // Number validation messages
  invalidNumber: 'অবৈধ সংখ্যা',
  numberMin: (min: number) => `সংখ্যা কমপক্ষে ${min} হতে হবে`,
  numberMax: (max: number) => `সংখ্যা সর্বোচ্চ ${max} হতে পারে`,
  numberInt: 'সংখ্যাটি একটি পূর্ণসংখ্যা হতে হবে',
  numberPositive: 'সংখ্যাটি ধনাত্মক হতে হবে',
  numberNegative: 'সংখ্যাটি ঋণাত্মক হতে হবে',
  numberNonnegative: 'সংখ্যাটি ঋণাত্মক হতে পারবে না',
  numberNonpositive: 'সংখ্যাটি ধনাত্মক হতে পারবে না',
  numberFinite: 'সংখ্যাটি সসীম হতে হবে',
  numberSafe: 'সংখ্যাটি একটি নিরাপদ পূর্ণসংখ্যা হতে হবে',
  numberMultipleOf: (value: number) => `সংখ্যাটি ${value} এর গুণিতক হতে হবে`,

  // Boolean validation messages
  invalidBoolean: 'অবৈধ বুলিয়ান মান',

  // Date validation messages
  invalidDate: 'অবৈধ তারিখ',
  dateMin: (date: Date) => `তারিখ ${date.toISOString()} এর পরে হতে হবে`,
  dateMax: (date: Date) => `তারিখ ${date.toISOString()} এর আগে হতে হবে`,

  // Object validation messages
  invalidObject: 'অবৈধ অবজেক্ট',
  unexpectedKeys: (keys: string[]) => `অপ্রত্যাশিত কী: ${keys.join(', ')}`,

  // Array validation messages
  invalidArray: 'অবৈধ অ্যারে',
  arrayMin: (min: number) => `অ্যারে-তে কমপক্ষে ${min}টি উপাদান থাকতে হবে`,
  arrayMax: (max: number) => `অ্যারে-তে সর্বোচ্চ ${max}টি উপাদান থাকতে পারে`,
  arrayLength: (length: number) => `অ্যারে-তে ঠিক ${length}টি উপাদান থাকতে হবে`,
  arrayEmpty: 'অ্যারে খালি হতে পারবে না',
  arrayItem: (index: number, error: string) => `${index} ইনডেক্সে অবৈধ উপাদান: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `অবৈধ ফিল্ড "${field}": ${error}`,

  // Union validation messages
  unionNoMatch: (errors: string[]) => `কোন ইউনিয়ন সদস্য মিলেনি: ${errors.join(', ')}`,

  // Intersection validation messages
  intersectionError: (error: string) => `ইন্টারসেকশন যাচাই ব্যর্থ: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `প্রত্যাশিত ${expected}, পেয়েছি ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `[${values.join(', ')}] এর মধ্যে একটি প্রত্যাশিত, পেয়েছি ${received}`,

  // Special type validation messages
  expectedUndefined: 'undefined প্রত্যাশিত',
  neverType: 'Never টাইপ পার্স করা যায় না',

  // New advanced type validation messages
  invalidBigint: 'অবৈধ bigint',
  invalidSymbol: 'অবৈধ সিম্বল',
  invalidTuple: 'অবৈধ টুপল',
  tupleLength: (expected: number, received: number) => `টুপলে ঠিক ${expected}টি উপাদান থাকতে হবে, পেয়েছি ${received}`,
  invalidRecord: 'অবৈধ রেকর্ড',
  invalidSet: 'অবৈধ Set',
  invalidMap: 'অবৈধ Map',
  
  // Transformation and refinement messages
  transformError: (error: string) => `রূপান্তর ব্যর্থ: ${error}`,
  refinementError: (error: string) => `পরিমার্জনা ব্যর্থ: ${error}`,
  customValidationError: (error: string) => `কাস্টম যাচাইকরণ ব্যর্থ: ${error}`,
  
  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `${JSON.stringify(value)} কে ${type} এ রূপান্তর করা যায়নি`,
  
  // Codec messages
  codecDecodeFailed: 'Failed to decode value',
  codecEncodeFailed: 'Failed to encode value',
  codecAsyncNotSupported: 'Async codec operations require using parseAsync/encodeAsync methods',
  
  // Base64/Hex messages
  invalidBase64: 'Invalid base64 string',
  invalidHex: 'Invalid hexadecimal string',
  
  // Uint8Array messages
  expectedUint8Array: 'Expected Uint8Array',
  uint8ArrayMinLength: (min: number) => `Uint8Array must have at least ${min} bytes`,
  uint8ArrayMaxLength: (max: number) => `Uint8Array must have at most ${max} bytes`,
  uint8ArrayExactLength: (length: number) => `Uint8Array must have exactly ${length} bytes`,
  
  // Generic type error messages
  expectedString: 'Expected string',
  stringExpected: (received: string, expected: string) => `প্রত্যাশিত ${expected}, পেয়েছি ${received}`,
  stringBoolExpected: (validValues: string, received: string) => `অবৈধ বুলিয়ান স্ট্রিং। নিম্নলিখিতগুলির একটি প্রত্যাশিত: ${validValues}, পেয়েছি: "${received}"`,
  invalidJson: 'অবৈধ JSON',
  stringPatternInvalid: 'স্ট্রিংটি প্রয়োজনীয় প্যাটার্নের সাথে মেলে না',

  // File validation messages
  invalidFile: 'Expected a File object',
  fileNotSupported: 'File API not supported in this environment',
  fileMinSize: (min: number) => `File size must be at least ${min} bytes`,
  fileMaxSize: (max: number) => `File size must not exceed ${max} bytes`,
  fileMimeType: (allowed: string[]) => `Invalid file type. Expected: ${allowed.join(", ")}`,
  // Function validation messages
  invalidFunction: 'একটি ফাংশন প্রত্যাশিত',

  // CIDR validation messages
  stringCidrv4: 'অবৈধ IPv4 CIDR ব্লক',
  stringCidrv6: 'অবৈধ IPv6 CIDR ব্লক',

  // Safe extend validation messages
  safeExtendOverlap: (keys: string[]) => `বিদ্যমান কীগুলি ওভাররাইড করা যায় না: ${keys.join(', ')}। ওভাররাইড করতে extend() ব্যবহার করুন।`
};
