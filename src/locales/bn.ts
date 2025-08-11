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

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `প্রত্যাশিত ${expected}, পেয়েছি ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `[${values.join(', ')}] এর মধ্যে একটি প্রত্যাশিত, পেয়েছি ${received}`,

  // Special type validation messages
  expectedUndefined: 'undefined প্রত্যাশিত',
  neverType: 'Never টাইপ পার্স করা যায় না'
};