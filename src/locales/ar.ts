import { LocaleMessages } from './types';

export const ar: LocaleMessages = {
  // String validation messages
  invalidString: 'نص غير صحيح',
  stringMin: (min: number) => `يجب أن يحتوي النص على ${min} حرف على الأقل`,
  stringMax: (max: number) => `لا يمكن أن يحتوي النص على أكثر من ${max} حرف`,
  stringLength: (length: number) => `يجب أن يحتوي النص على ${length} حرف بالضبط`,
  stringEmail: 'عنوان بريد إلكتروني غير صحيح',
  stringUrl: 'رابط غير صحيح',
  stringUuid: 'UUID غير صحيح',
  stringRegex: 'تنسيق غير صحيح',
  stringStartsWith: (prefix: string) => `يجب أن يبدأ النص بـ "${prefix}"`,
  stringEndsWith: (suffix: string) => `يجب أن ينتهي النص بـ "${suffix}"`,
  stringIncludes: (substring: string) => `يجب أن يحتوي النص على "${substring}"`,
  stringIp: 'عنوان IP غير صحيح',
  stringIpv4: 'عنوان IPv4 غير صحيح',
  stringIpv6: 'عنوان IPv6 غير صحيح',
  stringEmpty: 'لا يمكن أن يكون النص فارغاً',

  // Number validation messages
  invalidNumber: 'رقم غير صحيح',
  numberMin: (min: number) => `يجب أن يكون الرقم ${min} على الأقل`,
  numberMax: (max: number) => `لا يمكن أن يكون الرقم أكبر من ${max}`,
  numberInt: 'يجب أن يكون الرقم صحيحاً',
  numberPositive: 'يجب أن يكون الرقم موجباً',
  numberNegative: 'يجب أن يكون الرقم سالباً',
  numberNonnegative: 'لا يمكن أن يكون الرقم سالباً',
  numberNonpositive: 'لا يمكن أن يكون الرقم موجباً',
  numberFinite: 'يجب أن يكون الرقم محدوداً',
  numberSafe: 'يجب أن يكون الرقم صحيحاً آمناً',
  numberMultipleOf: (value: number) => `يجب أن يكون الرقم مضاعفاً لـ ${value}`,

  // Boolean validation messages
  invalidBoolean: 'قيمة منطقية غير صحيحة',

  // Date validation messages
  invalidDate: 'تاريخ غير صحيح',
  dateMin: (date: Date) => `يجب أن يكون التاريخ بعد ${date.toISOString()}`,
  dateMax: (date: Date) => `يجب أن يكون التاريخ قبل ${date.toISOString()}`,

  // Object validation messages
  invalidObject: 'كائن غير صحيح',
  unexpectedKeys: (keys: string[]) => `مفاتيح غير متوقعة: ${keys.join(', ')}`,

  // Array validation messages
  invalidArray: 'مصفوفة غير صحيحة',
  arrayMin: (min: number) => `يجب أن تحتوي المصفوفة على ${min} عنصر على الأقل`,
  arrayMax: (max: number) => `لا يمكن أن تحتوي المصفوفة على أكثر من ${max} عنصر`,
  arrayLength: (length: number) => `يجب أن تحتوي المصفوفة على ${length} عنصر بالضبط`,
  arrayEmpty: 'لا يمكن أن تكون المصفوفة فارغة',
  arrayItem: (index: number, error: string) => `عنصر غير صحيح في الفهرس ${index}: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `حقل غير صحيح "${field}": ${error}`,

  // Union validation messages
  unionNoMatch: (errors: string[]) => `لا يوجد عضو اتحاد مطابق: ${errors.join(', ')}`,

  // Intersection validation messages
  intersectionError: (error: string) => `فشل في التحقق من التقاطع: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `متوقع ${expected}، تم استلام ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `متوقع واحد من [${values.join(', ')}]، تم استلام ${received}`,

  // Special type validation messages
  expectedUndefined: 'متوقع undefined',
  neverType: 'لا يمكن تحليل نوع never',

  // New advanced type validation messages
  invalidBigint: 'bigint غير صحيح',
  invalidSymbol: 'رمز غير صحيح',
  invalidTuple: 'صف غير صحيح',
  tupleLength: (expected: number, received: number) => `يجب أن يحتوي الصف على ${expected} عنصر بالضبط، تم استلام ${received}`,
  invalidRecord: 'سجل غير صحيح',
  invalidSet: 'Set غير صحيح',
  invalidMap: 'Map غير صحيح',
  
  // Transformation and refinement messages
  transformError: (error: string) => `فشل التحويل: ${error}`,
  refinementError: (error: string) => `فشل التنقيح: ${error}`,
  customValidationError: (error: string) => `فشل في التحقق المخصص: ${error}`,
  
  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `لا يمكن إكراه ${JSON.stringify(value)} إلى ${type}`
};