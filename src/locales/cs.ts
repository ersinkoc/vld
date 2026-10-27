import { LocaleMessages } from './types';

// Czech (ported 2026-10-27)
export const cs: LocaleMessages = {
  // String validation messages
  invalidString: 'Neplatný řetězec',
  stringMin: (min: number) => `Řetězec musí mít alespoň ${min} znaků`,
  stringMax: (max: number) => `Řetězec musí mít nejvýše ${max} znaků`,
  stringLength: (length: number) => `Řetězec musí mít přesně ${length} znaků`,
  stringEmail: 'Neplatná e-mailová adresa',
  stringUrl: 'Neplatná URL',
  stringUuid: 'Neplatné UUID',
  stringRegex: 'Neplatný formát',
  stringStartsWith: (prefix: string) => `Řetězec musí začínat na "${prefix}"`,
  stringEndsWith: (suffix: string) => `Řetězec musí končit na "${suffix}"`,
  stringIncludes: (substring: string) => `Řetězec musí obsahovat "${substring}"`,
  stringIp: 'Neplatná IP adresa',
  stringIpv4: 'Neplatná IPv4 adresa',
  stringIpv6: 'Neplatná IPv6 adresa',
  stringEmpty: 'Řetězec nesmí být prázdný',

  // Number validation messages
  invalidNumber: 'Neplatné číslo',
  numberMin: (min: number) => `Číslo musí být alespoň ${min}`,
  numberMax: (max: number) => `Číslo musí být nejvýše ${max}`,
  numberInt: 'Číslo musí být celé',
  numberPositive: 'Číslo musí být kladné',
  numberNegative: 'Číslo musí být záporné',
  numberNonnegative: 'Číslo nesmí být záporné',
  numberNonpositive: 'Číslo nesmí být kladné',
  numberFinite: 'Číslo musí být konečné',
  numberSafe: 'Číslo musí být bezpečné celé číslo',
  numberMultipleOf: (value: number) => `Číslo musí být násobkem ${value}`,

  // Boolean validation messages
  invalidBoolean: 'Neplatná booleovská hodnota',

  // Date validation messages
  invalidDate: 'Neplatné datum',
  dateMin: (date: Date) => `Datum musí být po ${date.toISOString()}`,
  dateMax: (date: Date) => `Datum musí být před ${date.toISOString()}`,

  // Object validation messages
  invalidObject: 'Neplatný objekt',
  unexpectedKeys: (keys: string[]) => `Neočekávané klíče: ${keys.join(', ')}`,
  requiredField: (field: string) => `Povinné pole "${field}" chybí`,

  // Array validation messages
  invalidArray: 'Neplatné pole',
  arrayMin: (min: number) => `Pole musí mít alespoň ${min} prvků`,
  arrayMax: (max: number) => `Pole musí mít nejvýše ${max} prvků`,
  arrayLength: (length: number) => `Pole musí mít přesně ${length} prvků`,
  arrayEmpty: 'Pole nesmí být prázdné',
  arrayItem: (index: number, error: string) => `Neplatný prvek s indexem ${index}: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `Neplatné pole "${field}": ${error}`,

  // Union validation messages
  unionNoMatch: () => `Neplatný vstup`,

  // Intersection validation messages
  intersectionError: (error: string) => `Chyba validace průniku: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `Očekáváno ${expected}, obdrženo ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `Očekávána jedna z hodnot [${values.join(', ')}], obdrženo ${received}`,

  // Special type validation messages
  expectedUndefined: 'Očekáváno undefined',
  neverType: 'Typ never nelze parsovat',

  // New advanced type validation messages
  invalidBigint: 'Neplatný bigint',
  invalidSymbol: 'Neplatný symbol',
  invalidTuple: 'Neplatná n-tice',
  tupleLength: (expected: number, received: number) => `N-tice musí mít přesně ${expected} prvků, obdrženo ${received}`,
  invalidRecord: 'Neplatný záznam',
  invalidSet: 'Neplatná množina',
  invalidMap: 'Neplatná mapa',

  // Transformation and refinement messages
  transformError: (error: string) => `Chyba transformace: ${error}`,
  refinementError: (error: string) => `Chyba dodatečné validace: ${error}`,
  customValidationError: (error: string) => `Chyba vlastní validace: ${error}`,

  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `Nelze převést ${JSON.stringify(value)} na ${type}`,

  // Codec messages
  codecDecodeFailed: 'Dekódování hodnoty se nezdařilo',
  codecEncodeFailed: 'Kódování hodnoty se nezdařilo',
  codecAsyncNotSupported: 'Asynchronní operace kodeku vyžadují metody parseAsync/encodeAsync',

  // Base64/Hex messages
  invalidBase64: 'Neplatný base64 řetězec',
  invalidHex: 'Neplatný šestnáctkový řetězec',

  // Uint8Array messages
  expectedUint8Array: 'Očekáván Uint8Array',
  uint8ArrayMinLength: (min: number) => `Uint8Array musí mít alespoň ${min} bajtů`,
  uint8ArrayMaxLength: (max: number) => `Uint8Array musí mít nejvýše ${max} bajtů`,
  uint8ArrayExactLength: (length: number) => `Uint8Array musí mít přesně ${length} bajtů`,

  // Generic type error messages
  expectedString: 'Očekáván řetězec',
  stringExpected: (received: string, expected: string) => `Očekáváno ${expected}, obdrženo ${received}`,
  stringBoolExpected: (validValues: string, received: string) => `Neplatný booleovský řetězec. Očekávána jedna z hodnot: ${validValues}, obdrženo "${received}"`,
  invalidJson: 'Neplatný JSON',
  stringPatternInvalid: 'Řetězec neodpovídá požadovanému vzoru',

  // File validation messages
  invalidFile: 'Očekáván objekt File',
  fileNotSupported: 'File API není v tomto prostředí podporováno',
  fileMinSize: (min: number) => `Velikost souboru musí být alespoň ${min} bajtů`,
  fileMaxSize: (max: number) => `Velikost souboru nesmí překročit ${max} bajtů`,
  fileMimeType: (allowed: string[]) => `Neplatný typ souboru. Očekáváno: ${allowed.join(', ')}`,

  // Function validation messages
  invalidFunction: 'Očekávána funkce',

  // CIDR validation messages
  stringCidrv4: 'Neplatný CIDR blok IPv4',
  stringCidrv6: 'Neplatný CIDR blok IPv6',

  // Safe extend validation messages
  safeExtendOverlap: (keys: string[]) => `Existující klíče nelze přepsat: ${keys.join(', ')}. Chcete-li je přepsat, použijte extend().`,
};
