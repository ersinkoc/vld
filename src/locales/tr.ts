import { LocaleMessages } from './types';

export const tr: LocaleMessages = {
  // String validation messages
  invalidString: 'Geçersiz metin',
  stringMin: (min: number) => `Metin en az ${min} karakter olmalı`,
  stringMax: (max: number) => `Metin en fazla ${max} karakter olmalı`,
  stringLength: (length: number) => `Metin tam olarak ${length} karakter olmalı`,
  stringEmail: 'Geçersiz e-posta adresi',
  stringUrl: 'Geçersiz URL',
  stringUuid: 'Geçersiz UUID',
  stringRegex: 'Geçersiz format',
  stringStartsWith: (prefix: string) => `Metin "${prefix}" ile başlamalı`,
  stringEndsWith: (suffix: string) => `Metin "${suffix}" ile bitmeli`,
  stringIncludes: (substring: string) => `Metin "${substring}" içermeli`,
  stringIp: 'Geçersiz IP adresi',
  stringIpv4: 'Geçersiz IPv4 adresi',
  stringIpv6: 'Geçersiz IPv6 adresi',
  stringEmpty: 'Metin boş olmamalı',

  // Number validation messages
  invalidNumber: 'Geçersiz sayı',
  numberMin: (min: number) => `Sayı en az ${min} olmalı`,
  numberMax: (max: number) => `Sayı en fazla ${max} olmalı`,
  numberInt: 'Sayı tam sayı olmalı',
  numberPositive: 'Sayı pozitif olmalı',
  numberNegative: 'Sayı negatif olmalı',
  numberNonnegative: 'Sayı negatif olmamalı',
  numberNonpositive: 'Sayı pozitif olmamalı',
  numberFinite: 'Sayı sonlu olmalı',
  numberSafe: 'Sayı güvenli tam sayı olmalı',
  numberMultipleOf: (value: number) => `Sayı ${value}'nin katı olmalı`,

  // Boolean validation messages
  invalidBoolean: 'Geçersiz boolean',

  // Date validation messages
  invalidDate: 'Geçersiz tarih',
  dateMin: (date: Date) => `Tarih ${date.toISOString()} sonrasında olmalı`,
  dateMax: (date: Date) => `Tarih ${date.toISOString()} öncesinde olmalı`,

  // Object validation messages
  invalidObject: 'Geçersiz nesne',
  unexpectedKeys: (keys: string[]) => `Beklenmeyen anahtarlar: ${keys.join(', ')}`,

  // Array validation messages
  invalidArray: 'Geçersiz dizi',
  arrayMin: (min: number) => `Dizi en az ${min} eleman içermeli`,
  arrayMax: (max: number) => `Dizi en fazla ${max} eleman içermeli`,
  arrayLength: (length: number) => `Dizi tam olarak ${length} eleman içermeli`,
  arrayEmpty: 'Dizi boş olmamalı',
  arrayItem: (index: number, error: string) => `${index} indeksindeki eleman geçersiz: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `"${field}" alanı geçersiz: ${error}`,

  // Union validation messages
  unionNoMatch: (errors: string[]) => `Hiçbir union üyesi eşleşmedi: ${errors.join(', ')}`,

  // Intersection validation messages
  intersectionError: (error: string) => `Intersection doğrulaması başarısız: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `${expected} beklendi, ${received} alındı`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `[${values.join(', ')}] değerlerinden biri beklendi, ${received} alındı`,

  // Special type validation messages
  expectedUndefined: 'Undefined beklendi',
  neverType: 'Never tipi parse edilemez',

  // New advanced type validation messages
  invalidBigint: 'Geçersiz bigint',
  invalidSymbol: 'Geçersiz symbol',
  invalidTuple: 'Geçersiz tuple',
  tupleLength: (expected: number, received: number) => `Tuple tam olarak ${expected} elemana sahip olmalı, ${received} aldı`,
  invalidRecord: 'Geçersiz record',
  invalidSet: 'Geçersiz set',
  invalidMap: 'Geçersiz map',
  
  // Transformation and refinement messages
  transformError: (error: string) => `Dönüştürme başarısız: ${error}`,
  refinementError: (error: string) => `Doğrulama başarısız: ${error}`,
  customValidationError: (error: string) => `Özel doğrulama başarısız: ${error}`,
  
  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `${JSON.stringify(value)} değeri ${type} tipine dönüştürülemez`
};