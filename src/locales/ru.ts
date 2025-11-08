import { LocaleMessages } from './types';

export const ru: LocaleMessages = {
  // String validation messages
  invalidString: 'Некорректная строка',
  stringMin: (min: number) => `Строка должна содержать не менее ${min} символов`,
  stringMax: (max: number) => `Строка не может содержать более ${max} символов`,
  stringLength: (length: number) => `Строка должна содержать ровно ${length} символов`,
  stringEmail: 'Некорректный email адрес',
  stringUrl: 'Некорректный URL',
  stringUuid: 'Некорректный UUID',
  stringRegex: 'Некорректный формат',
  stringStartsWith: (prefix: string) => `Строка должна начинаться с "${prefix}"`,
  stringEndsWith: (suffix: string) => `Строка должна заканчиваться на "${suffix}"`,
  stringIncludes: (substring: string) => `Строка должна содержать "${substring}"`,
  stringIp: 'Некорректный IP адрес',
  stringIpv4: 'Некорректный IPv4 адрес',
  stringIpv6: 'Некорректный IPv6 адрес',
  stringEmpty: 'Строка не может быть пустой',

  // Number validation messages
  invalidNumber: 'Некорректное число',
  numberMin: (min: number) => `Число должно быть не менее ${min}`,
  numberMax: (max: number) => `Число не может быть больше ${max}`,
  numberInt: 'Число должно быть целым',
  numberPositive: 'Число должно быть положительным',
  numberNegative: 'Число должно быть отрицательным',
  numberNonnegative: 'Число не может быть отрицательным',
  numberNonpositive: 'Число не может быть положительным',
  numberFinite: 'Число должно быть конечным',
  numberSafe: 'Число должно быть безопасным целым',
  numberMultipleOf: (value: number) => `Число должно быть кратно ${value}`,

  // Boolean validation messages
  invalidBoolean: 'Некорректный boolean',

  // Date validation messages
  invalidDate: 'Некорректная дата',
  dateMin: (date: Date) => `Дата должна быть после ${date.toISOString()}`,
  dateMax: (date: Date) => `Дата должна быть до ${date.toISOString()}`,

  // Object validation messages
  invalidObject: 'Некорректный объект',
  unexpectedKeys: (keys: string[]) => `Неожиданные ключи: ${keys.join(', ')}`,

  // Array validation messages
  invalidArray: 'Некорректный массив',
  arrayMin: (min: number) => `Массив должен содержать не менее ${min} элементов`,
  arrayMax: (max: number) => `Массив не может содержать более ${max} элементов`,
  arrayLength: (length: number) => `Массив должен содержать ровно ${length} элементов`,
  arrayEmpty: 'Массив не может быть пустым',
  arrayItem: (index: number, error: string) => `Некорректный элемент по индексу ${index}: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `Некорректное поле "${field}": ${error}`,

  // Union validation messages
  unionNoMatch: (errors: string[]) => `Ни один член объединения не подошёл: ${errors.join(', ')}`,

  // Intersection validation messages
  intersectionError: (error: string) => `Не удалось выполнить валидацию пересечения: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `Ожидалось ${expected}, получено ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `Ожидалось одно из [${values.join(', ')}], получено ${received}`,

  // Special type validation messages
  expectedUndefined: 'Ожидалось undefined',
  neverType: 'Тип never не может быть разобран',

  // New advanced type validation messages
  invalidBigint: 'Некорректный bigint',
  invalidSymbol: 'Некорректный символ',
  invalidTuple: 'Некорректный кортеж',
  tupleLength: (expected: number, received: number) => `Кортеж должен содержать ровно ${expected} элементов, получено ${received}`,
  invalidRecord: 'Некорректная запись',
  invalidSet: 'Некорректный set',
  invalidMap: 'Некорректная map',
  
  // Transformation and refinement messages
  transformError: (error: string) => `Преобразование не удалось: ${error}`,
  refinementError: (error: string) => `Уточнение не удалось: ${error}`,
  customValidationError: (error: string) => `Пользовательская проверка не удалась: ${error}`,
  
  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `Невозможно привести ${JSON.stringify(value)} к типу ${type}`,
  
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
  expectedString: 'Expected string'
};