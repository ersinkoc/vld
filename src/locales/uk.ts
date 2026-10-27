import { LocaleMessages } from './types';

// Ukrainian (ported 2026-10-27; terminology cross-checked against zod's uk locale)
export const uk: LocaleMessages = {
  // String validation messages
  invalidString: 'Неправильний рядок',
  stringMin: (min: number) => `Рядок повинен містити принаймні ${min} символів`,
  stringMax: (max: number) => `Рядок повинен містити не більше ніж ${max} символів`,
  stringLength: (length: number) => `Рядок повинен містити рівно ${length} символів`,
  stringEmail: 'Неправильна адреса електронної пошти',
  stringUrl: 'Неправильний URL',
  stringUuid: 'Неправильний UUID',
  stringRegex: 'Неправильний формат',
  stringStartsWith: (prefix: string) => `Рядок повинен починатися з "${prefix}"`,
  stringEndsWith: (suffix: string) => `Рядок повинен закінчуватися на "${suffix}"`,
  stringIncludes: (substring: string) => `Рядок повинен містити "${substring}"`,
  stringIp: 'Неправильна IP-адреса',
  stringIpv4: 'Неправильна IPv4-адреса',
  stringIpv6: 'Неправильна IPv6-адреса',
  stringEmpty: 'Рядок не повинен бути порожнім',

  // Number validation messages
  invalidNumber: 'Неправильне число',
  numberMin: (min: number) => `Число повинно бути не менше ${min}`,
  numberMax: (max: number) => `Число повинно бути не більше ${max}`,
  numberInt: 'Число повинно бути цілим',
  numberPositive: 'Число повинно бути додатним',
  numberNegative: 'Число повинно бути від\'ємним',
  numberNonnegative: 'Число не повинно бути від\'ємним',
  numberNonpositive: 'Число не повинно бути додатним',
  numberFinite: 'Число повинно бути скінченним',
  numberSafe: 'Число повинно бути безпечним цілим',
  numberMultipleOf: (value: number) => `Число повинно бути кратним ${value}`,

  // Boolean validation messages
  invalidBoolean: 'Неправильний булівський тип',

  // Date validation messages
  invalidDate: 'Неправильна дата',
  dateMin: (date: Date) => `Дата повинна бути після ${date.toISOString()}`,
  dateMax: (date: Date) => `Дата повинна бути до ${date.toISOString()}`,

  // Object validation messages
  invalidObject: 'Неправильний об\'єкт',
  unexpectedKeys: (keys: string[]) => `Неочікувані ключі: ${keys.join(', ')}`,
  requiredField: (field: string) => "Обов'язкове поле \"" + field + '" відсутнє',

  // Array validation messages
  invalidArray: 'Неправильний масив',
  arrayMin: (min: number) => `Масив повинен містити принаймні ${min} елементів`,
  arrayMax: (max: number) => `Масив повинен містити не більше ніж ${max} елементів`,
  arrayLength: (length: number) => `Масив повинен містити рівно ${length} елементів`,
  arrayEmpty: 'Масив не повинен бути порожнім',
  arrayItem: (index: number, error: string) => `Неправильний елемент з індексом ${index}: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `Неправильне поле "${field}": ${error}`,

  // Union validation messages
  unionNoMatch: () => `Неправильні вхідні дані`,

  // Intersection validation messages
  intersectionError: (error: string) => `Помилка перевірки перетину: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `Очікувалося ${expected}, отримано ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `Очікувалося одне з [${values.join(', ')}], отримано ${received}`,

  // Special type validation messages
  expectedUndefined: 'Очікувалося undefined',
  neverType: 'Тип never не можна розібрати',

  // New advanced type validation messages
  invalidBigint: 'Неправильний bigint',
  invalidSymbol: 'Неправильний symbol',
  invalidTuple: 'Неправильний кортеж',
  tupleLength: (expected: number, received: number) => `Кортеж повинен містити рівно ${expected} елементів, отримано ${received}`,
  invalidRecord: 'Неправильний запис',
  invalidSet: 'Неправильна множина',
  invalidMap: 'Неправильна мапа',

  // Transformation and refinement messages
  transformError: (error: string) => `Помилка перетворення: ${error}`,
  refinementError: (error: string) => `Помилка уточнення: ${error}`,
  customValidationError: (error: string) => `Помилка користувацької перевірки: ${error}`,

  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `Не вдалося перетворити ${JSON.stringify(value)} на ${type}`,

  // Codec messages
  codecDecodeFailed: 'Не вдалося декодувати значення',
  codecEncodeFailed: 'Не вдалося закодувати значення',
  codecAsyncNotSupported: 'Асинхронні операції кодека потребують методів parseAsync/encodeAsync',

  // Base64/Hex messages
  invalidBase64: 'Неправильний рядок base64',
  invalidHex: 'Неправильний шістнадцятковий рядок',

  // Uint8Array messages
  expectedUint8Array: 'Очікувався Uint8Array',
  uint8ArrayMinLength: (min: number) => `Uint8Array повинен містити принаймні ${min} байтів`,
  uint8ArrayMaxLength: (max: number) => `Uint8Array повинен містити не більше ніж ${max} байтів`,
  uint8ArrayExactLength: (length: number) => `Uint8Array повинен містити рівно ${length} байтів`,

  // Generic type error messages
  expectedString: 'Очікувався рядок',
  stringExpected: (received: string, expected: string) => `Очікувалося ${expected}, отримано ${received}`,
  stringBoolExpected: (validValues: string, received: string) => `Неправильний булівський рядок. Очікувалося одне з: ${validValues}, отримано "${received}"`,
  invalidJson: 'Неправильний JSON',
  stringPatternInvalid: 'Рядок не відповідає необхідному шаблону',

  // File validation messages
  invalidFile: 'Очікувався об\'єкт File',
  fileNotSupported: 'File API не підтримується в цьому середовищі',
  fileMinSize: (min: number) => `Розмір файлу повинен бути принаймні ${min} байтів`,
  fileMaxSize: (max: number) => `Розмір файлу не повинен перевищувати ${max} байтів`,
  fileMimeType: (allowed: string[]) => `Неправильний тип файлу. Очікувалося: ${allowed.join(', ')}`,

  // Function validation messages
  invalidFunction: 'Очікувалася функція',

  // CIDR validation messages
  stringCidrv4: 'Неправильний блок CIDR IPv4',
  stringCidrv6: 'Неправильний блок CIDR IPv6',

  // Safe extend validation messages
  safeExtendOverlap: (keys: string[]) => `Не можна перевизначити наявні ключі: ${keys.join(', ')}. Використовуйте extend(), якщо хочете перевизначити.`,
};
