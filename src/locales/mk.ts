import { LocaleMessages } from './types';

// Macedonian (ported 2026-10-27)
export const mk: LocaleMessages = {
  // String validation messages
  invalidString: 'Невалиден стринг',
  stringMin: (min: number) => `Стрингот мора да има најмалку ${min} знаци`,
  stringMax: (max: number) => `Стрингот мора да има најмногу ${max} знаци`,
  stringLength: (length: number) => `Стрингот мора да има точно ${length} знаци`,
  stringEmail: 'Невалидна е-пошта',
  stringUrl: 'Невалиден URL',
  stringUuid: 'Невалиден UUID',
  stringRegex: 'Невалиден формат',
  stringStartsWith: (prefix: string) => `Стрингот мора да почнува со "${prefix}"`,
  stringEndsWith: (suffix: string) => `Стрингот мора да завршува со "${suffix}"`,
  stringIncludes: (substring: string) => `Стрингот мора да содржи "${substring}"`,
  stringIp: 'Невалидна IP адреса',
  stringIpv4: 'Невалидна IPv4 адреса',
  stringIpv6: 'Невалидна IPv6 адреса',
  stringEmpty: 'Стрингот не смее да биде празен',

  // Number validation messages
  invalidNumber: 'Невалиден број',
  numberMin: (min: number) => `Бројот мора да биде најмалку ${min}`,
  numberMax: (max: number) => `Бројот мора да биде најмногу ${max}`,
  numberInt: 'Бројот мора да биде цел број',
  numberPositive: 'Бројот мора да биде позитивен',
  numberNegative: 'Бројот мора да биде негативен',
  numberNonnegative: 'Бројот не смее да биде негативен',
  numberNonpositive: 'Бројот не смее да биде позитивен',
  numberFinite: 'Бројот мора да биде конечен',
  numberSafe: 'Бројот мора да биде безбеден цел број',
  numberMultipleOf: (value: number) => `Бројот мора да биде повеќекратник на ${value}`,

  // Boolean validation messages
  invalidBoolean: 'Невалидна булова вредност',

  // Date validation messages
  invalidDate: 'Невалиден датум',
  dateMin: (date: Date) => `Датумот мора да биде после ${date.toISOString()}`,
  dateMax: (date: Date) => `Датумот мора да биде пред ${date.toISOString()}`,

  // Object validation messages
  invalidObject: 'Невалиден објект',
  unexpectedKeys: (keys: string[]) => `Неочекувани клучеви: ${keys.join(', ')}`,
  requiredField: (field: string) => `Недостасува задолжителното поле "${field}"`,

  // Array validation messages
  invalidArray: 'Невалидна низа',
  arrayMin: (min: number) => `Низата мора да има најмалку ${min} елементи`,
  arrayMax: (max: number) => `Низата мора да има најмногу ${max} елементи`,
  arrayLength: (length: number) => `Низата мора да има точно ${length} елементи`,
  arrayEmpty: 'Низата не смее да биде празна',
  arrayItem: (index: number, error: string) => `Невалиден елемент на индекс ${index}: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `Невалидно поле "${field}": ${error}`,

  // Union validation messages
  unionNoMatch: () => `Невалиден влез`,

  // Intersection validation messages
  intersectionError: (error: string) => `Грешка при валидација на пресек: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `Се очекуваше ${expected}, се доби ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `Се очекуваше една од [${values.join(', ')}], се доби ${received}`,

  // Special type validation messages
  expectedUndefined: 'Се очекуваше undefined',
  neverType: 'Типот never не може да се анализира',

  // New advanced type validation messages
  invalidBigint: 'Невалиден bigint',
  invalidSymbol: 'Невалиден symbol',
  invalidTuple: 'Невалидна торка',
  tupleLength: (expected: number, received: number) => `Торката мора да има точно ${expected} елементи, се добија ${received}`,
  invalidRecord: 'Невалиден запис',
  invalidSet: 'Невалидно множество',
  invalidMap: 'Невалидна мапа',

  // Transformation and refinement messages
  transformError: (error: string) => `Грешка при трансформација: ${error}`,
  refinementError: (error: string) => `Грешка при прецизирање: ${error}`,
  customValidationError: (error: string) => `Грешка при прилагодена валидација: ${error}`,

  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `Не може да се конвертира ${JSON.stringify(value)} во ${type}`,

  // Codec messages
  codecDecodeFailed: 'Декодирањето на вредноста не успеа',
  codecEncodeFailed: 'Кодирањето на вредноста не успеа',
  codecAsyncNotSupported: 'Асинхроните кодек операции бараат методи parseAsync/encodeAsync',

  // Base64/Hex messages
  invalidBase64: 'Невалиден base64 стринг',
  invalidHex: 'Невалиден хексадецимален стринг',

  // Uint8Array messages
  expectedUint8Array: 'Се очекуваше Uint8Array',
  uint8ArrayMinLength: (min: number) => `Uint8Array мора да има најмалку ${min} бајти`,
  uint8ArrayMaxLength: (max: number) => `Uint8Array мора да има најмногу ${max} бајти`,
  uint8ArrayExactLength: (length: number) => `Uint8Array мора да има точно ${length} бајти`,

  // Generic type error messages
  expectedString: 'Се очекуваше стринг',
  stringExpected: (received: string, expected: string) => `Се очекуваше ${expected}, се доби ${received}`,
  stringBoolExpected: (validValues: string, received: string) => `Невалиден булов стринг. Се очекуваше една од: ${validValues}, се доби "${received}"`,
  invalidJson: 'Невалиден JSON',
  stringPatternInvalid: 'Стрингот не одговара на бараниот шаблон',

  // File validation messages
  invalidFile: 'Се очекуваше File објект',
  fileNotSupported: 'File API не е поддржан во оваа околина',
  fileMinSize: (min: number) => `Големината на датотеката мора да биде најмалку ${min} бајти`,
  fileMaxSize: (max: number) => `Големината на датотеката не смее да надмине ${max} бајти`,
  fileMimeType: (allowed: string[]) => `Невалиден тип на датотека. Се очекуваше: ${allowed.join(', ')}`,

  // Function validation messages
  invalidFunction: 'Се очекуваше функција',

  // CIDR validation messages
  stringCidrv4: 'Невалиден IPv4 CIDR блок',
  stringCidrv6: 'Невалиден IPv6 CIDR блок',

  // Safe extend validation messages
  safeExtendOverlap: (keys: string[]) => `Постоечките клучеви не можат да се пребришат: ${keys.join(', ')}. Користете extend() ако сакате да ги пребришете.`,
};
