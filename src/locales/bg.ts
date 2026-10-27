import { LocaleMessages } from './types';

// Bulgarian (ported 2026-10-27)
export const bg: LocaleMessages = {
  // String validation messages
  invalidString: 'Невалиден низ',
  stringMin: (min: number) => `Низът трябва да съдържа поне ${min} символа`,
  stringMax: (max: number) => `Низът трябва да съдържа не повече от ${max} символа`,
  stringLength: (length: number) => `Низът трябва да съдържа точно ${length} символа`,
  stringEmail: 'Невалиден имейл адрес',
  stringUrl: 'Невалиден URL',
  stringUuid: 'Невалиден UUID',
  stringRegex: 'Невалиден формат',
  stringStartsWith: (prefix: string) => `Низът трябва да започва с "${prefix}"`,
  stringEndsWith: (suffix: string) => `Низът трябва да завършва с "${suffix}"`,
  stringIncludes: (substring: string) => `Низът трябва да съдържа "${substring}"`,
  stringIp: 'Невалиден IP адрес',
  stringIpv4: 'Невалиден IPv4 адрес',
  stringIpv6: 'Невалиден IPv6 адрес',
  stringEmpty: 'Низът не трябва да е празен',

  // Number validation messages
  invalidNumber: 'Невалидно число',
  numberMin: (min: number) => `Числото трябва да е поне ${min}`,
  numberMax: (max: number) => `Числото трябва да е не повече от ${max}`,
  numberInt: 'Числото трябва да е цяло',
  numberPositive: 'Числото трябва да е положително',
  numberNegative: 'Числото трябва да е отрицателно',
  numberNonnegative: 'Числото не трябва да е отрицателно',
  numberNonpositive: 'Числото не трябва да е положително',
  numberFinite: 'Числото трябва да е крайно',
  numberSafe: 'Числото трябва да е безопасно цяло число',
  numberMultipleOf: (value: number) => `Числото трябва да е кратно на ${value}`,

  // Boolean validation messages
  invalidBoolean: 'Невалиден булев тип',

  // Date validation messages
  invalidDate: 'Невалидна дата',
  dateMin: (date: Date) => `Датата трябва да е след ${date.toISOString()}`,
  dateMax: (date: Date) => `Датата трябва да е преди ${date.toISOString()}`,

  // Object validation messages
  invalidObject: 'Невалиден обект',
  unexpectedKeys: (keys: string[]) => `Неочаквани ключове: ${keys.join(', ')}`,
  requiredField: (field: string) => `Задължителното поле "${field}" липсва`,

  // Array validation messages
  invalidArray: 'Невалиден масив',
  arrayMin: (min: number) => `Масивът трябва да съдържа поне ${min} елемента`,
  arrayMax: (max: number) => `Масивът трябва да съдържа не повече от ${max} елемента`,
  arrayLength: (length: number) => `Масивът трябва да съдържа точно ${length} елемента`,
  arrayEmpty: 'Масивът не трябва да е празен',
  arrayItem: (index: number, error: string) => `Невалиден елемент с индекс ${index}: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `Невалидно поле "${field}": ${error}`,

  // Union validation messages
  unionNoMatch: () => `Невалидни входни данни`,

  // Intersection validation messages
  intersectionError: (error: string) => `Грешка при валидация на пресечението: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `Очакваше се ${expected}, получено е ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `Очакваше се едно от [${values.join(', ')}], получено е ${received}`,

  // Special type validation messages
  expectedUndefined: 'Очакваше се undefined',
  neverType: 'Типът never не може да се анализира',

  // New advanced type validation messages
  invalidBigint: 'Невалиден bigint',
  invalidSymbol: 'Невалиден symbol',
  invalidTuple: 'Невалиден кортеж',
  tupleLength: (expected: number, received: number) => `Кортежът трябва да съдържа точно ${expected} елемента, получени са ${received}`,
  invalidRecord: 'Невалиден запис',
  invalidSet: 'Невалидно множество',
  invalidMap: 'Невалидна карта',

  // Transformation and refinement messages
  transformError: (error: string) => `Грешка при трансформация: ${error}`,
  refinementError: (error: string) => `Грешка при уточняване: ${error}`,
  customValidationError: (error: string) => `Грешка при потребителска валидация: ${error}`,

  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `Не може да се преобразува ${JSON.stringify(value)} в ${type}`,

  // Codec messages
  codecDecodeFailed: 'Неуспешно декодиране на стойността',
  codecEncodeFailed: 'Неуспешно кодиране на стойността',
  codecAsyncNotSupported: 'Асинхронните операции на кодека изискват методите parseAsync/encodeAsync',

  // Base64/Hex messages
  invalidBase64: 'Невалиден base64 низ',
  invalidHex: 'Невалиден шестнадесетичен низ',

  // Uint8Array messages
  expectedUint8Array: 'Очакваше се Uint8Array',
  uint8ArrayMinLength: (min: number) => `Uint8Array трябва да съдържа поне ${min} байта`,
  uint8ArrayMaxLength: (max: number) => `Uint8Array трябва да съдържа не повече от ${max} байта`,
  uint8ArrayExactLength: (length: number) => `Uint8Array трябва да съдържа точно ${length} байта`,

  // Generic type error messages
  expectedString: 'Очакваше се низ',
  stringExpected: (received: string, expected: string) => `Очакваше се ${expected}, получено е ${received}`,
  stringBoolExpected: (validValues: string, received: string) => `Невалиден булев низ. Очакваше се едно от: ${validValues}, получено е "${received}"`,
  invalidJson: 'Невалиден JSON',
  stringPatternInvalid: 'Низът не отговаря на изисквания шаблон',

  // File validation messages
  invalidFile: 'Очакваше се File обект',
  fileNotSupported: 'File API не се поддържа в тази среда',
  fileMinSize: (min: number) => `Размерът на файла трябва да е поне ${min} байта`,
  fileMaxSize: (max: number) => `Размерът на файла не трябва да надвишава ${max} байта`,
  fileMimeType: (allowed: string[]) => `Невалиден тип файл. Очакваше се: ${allowed.join(', ')}`,

  // Function validation messages
  invalidFunction: 'Очакваше се функция',

  // CIDR validation messages
  stringCidrv4: 'Невалиден CIDR блок IPv4',
  stringCidrv6: 'Невалиден CIDR блок IPv6',

  // Safe extend validation messages
  safeExtendOverlap: (keys: string[]) => `Не могат да се заменят съществуващите ключове: ${keys.join(', ')}. Използвайте extend(), ако искате да замените.`,
};
