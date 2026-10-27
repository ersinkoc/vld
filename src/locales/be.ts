import { LocaleMessages } from './types';

// Belarusian (ported 2026-10-27)
export const be: LocaleMessages = {
  // String validation messages
  invalidString: 'Няправільны радок',
  stringMin: (min: number) => `Радок павінен змяшчаць прынамсі ${min} сімвалаў`,
  stringMax: (max: number) => `Радок павінен змяшчаць не больш за ${max} сімвалаў`,
  stringLength: (length: number) => `Радок павінен змяшчаць роўна ${length} сімвалаў`,
  stringEmail: 'Няправільны адрас электроннай пошты',
  stringUrl: 'Няправільны URL',
  stringUuid: 'Няправільны UUID',
  stringRegex: 'Няправільны фармат',
  stringStartsWith: (prefix: string) => `Радок павінен пачынацца з "${prefix}"`,
  stringEndsWith: (suffix: string) => `Радок павінен заканчвацца на "${suffix}"`,
  stringIncludes: (substring: string) => `Радок павінен змяшчаць "${substring}"`,
  stringIp: 'Няправільны IP-адрас',
  stringIpv4: 'Няправільны IPv4-адрас',
  stringIpv6: 'Няправільны IPv6-адрас',
  stringEmpty: 'Радок не павінен быць пустым',

  // Number validation messages
  invalidNumber: 'Няправільны лік',
  numberMin: (min: number) => `Лік павінен быць не менш за ${min}`,
  numberMax: (max: number) => `Лік павінен быць не больш за ${max}`,
  numberInt: 'Лік павінен быць цэлым',
  numberPositive: 'Лік павінен быць дадатным',
  numberNegative: 'Лік павінен быць адмоўным',
  numberNonnegative: 'Лік не павінен быць адмоўным',
  numberNonpositive: 'Лік не павінен быць дадатным',
  numberFinite: 'Лік павінен быць скончаным',
  numberSafe: 'Лік павінен быць бяспечным цэлым',
  numberMultipleOf: (value: number) => `Лік павінен быць кратным ${value}`,

  // Boolean validation messages
  invalidBoolean: 'Няправільны булевы тып',

  // Date validation messages
  invalidDate: 'Няправільная дата',
  dateMin: (date: Date) => `Дата павінна быць пасля ${date.toISOString()}`,
  dateMax: (date: Date) => `Дата павінна быць да ${date.toISOString()}`,

  // Object validation messages
  invalidObject: 'Няправільны аб\'ект',
  unexpectedKeys: (keys: string[]) => `Нечаканыя ключы: ${keys.join(', ')}`,
  requiredField: (field: string) => `Абавязковае поле "${field}" адсутнічае`,

  // Array validation messages
  invalidArray: 'Няправільны масіў',
  arrayMin: (min: number) => `Масіў павінен змяшчаць прынамсі ${min} элементаў`,
  arrayMax: (max: number) => `Масіў павінен змяшчаць не больш за ${max} элементаў`,
  arrayLength: (length: number) => `Масіў павінен змяшчаць роўна ${length} элементаў`,
  arrayEmpty: 'Масіў не павінен быць пустым',
  arrayItem: (index: number, error: string) => `Няправільны элемент з індэксам ${index}: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `Няправільнае поле "${field}": ${error}`,

  // Union validation messages
  unionNoMatch: () => `Няправільны ўваходныя даныя`,

  // Intersection validation messages
  intersectionError: (error: string) => `Памылка праверкі перасячэння: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `Чакалася ${expected}, атрымана ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `Чакалася адно з [${values.join(', ')}], атрымана ${received}`,

  // Special type validation messages
  expectedUndefined: 'Чакалася undefined',
  neverType: 'Тып never нельга разабраць',

  // New advanced type validation messages
  invalidBigint: 'Няправільны bigint',
  invalidSymbol: 'Няправільны symbol',
  invalidTuple: 'Няправільны картэж',
  tupleLength: (expected: number, received: number) => `Картэж павінен змяшчаць роўна ${expected} элементаў, атрымана ${received}`,
  invalidRecord: 'Няправільны запіс',
  invalidSet: 'Няправільная мноства',
  invalidMap: 'Няправільная мапа',

  // Transformation and refinement messages
  transformError: (error: string) => `Памылка пераўтварэння: ${error}`,
  refinementError: (error: string) => `Памылка ўдакладнення: ${error}`,
  customValidationError: (error: string) => `Памылка карыстальніцкай праверкі: ${error}`,

  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `Не ўдалося пераўтварыць ${JSON.stringify(value)} у ${type}`,

  // Codec messages
  codecDecodeFailed: 'Не ўдалося дэкадзіраваць значэнне',
  codecEncodeFailed: 'Не ўдалося кадзіраваць значэнне',
  codecAsyncNotSupported: 'Асінхронныя аперацыі кодэка патрабуюць метадаў parseAsync/encodeAsync',

  // Base64/Hex messages
  invalidBase64: 'Няправільны радок base64',
  invalidHex: 'Няправільны шаснаццатковы радок',

  // Uint8Array messages
  expectedUint8Array: 'Чакаўся Uint8Array',
  uint8ArrayMinLength: (min: number) => `Uint8Array павінен змяшчаць прынамсі ${min} байтаў`,
  uint8ArrayMaxLength: (max: number) => `Uint8Array павінен змяшчаць не больш за ${max} байтаў`,
  uint8ArrayExactLength: (length: number) => `Uint8Array павінен змяшчаць роўна ${length} байтаў`,

  // Generic type error messages
  expectedString: 'Чакаўся радок',
  stringExpected: (received: string, expected: string) => `Чакалася ${expected}, атрымана ${received}`,
  stringBoolExpected: (validValues: string, received: string) => `Няправільны булевы радок. Чакалася адно з: ${validValues}, атрымана "${received}"`,
  invalidJson: 'Няправільны JSON',
  stringPatternInvalid: 'Радок не адпавядае неабходнаму шаблоне',

  // File validation messages
  invalidFile: 'Чакаўся аб\'ект File',
  fileNotSupported: 'File API не падтрымліваецца ў гэтым асяроддзі',
  fileMinSize: (min: number) => `Памер файла павінен быць прынамсі ${min} байтаў`,
  fileMaxSize: (max: number) => `Памер файла не павінен перавышаць ${max} байтаў`,
  fileMimeType: (allowed: string[]) => `Няправільны тып файла. Чакалася: ${allowed.join(', ')}`,

  // Function validation messages
  invalidFunction: 'Чакалася функцыя',

  // CIDR validation messages
  stringCidrv4: 'Няправільны блок CIDR IPv4',
  stringCidrv6: 'Няправільны блок CIDR IPv6',

  // Safe extend validation messages
  safeExtendOverlap: (keys: string[]) => `Нельга перавызначыць наяўныя ключы: ${keys.join(', ')}. Выкарыстоўвайце extend(), калі хочаце перавызначыць.`,
};
