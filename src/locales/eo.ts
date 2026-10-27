import { LocaleMessages } from './types';

// Esperanto (ported 2026-10-27)
export const eo: LocaleMessages = {
  // String validation messages
  invalidString: 'Nevalida ĉeno',
  stringMin: (min: number) => `La ĉeno devas havi almenaŭ ${min} signojn`,
  stringMax: (max: number) => `La ĉeno devas havi maksimume ${max} signojn`,
  stringLength: (length: number) => `La ĉeno devas havi ĝuste ${length} signojn`,
  stringEmail: 'Nevalida retpoŝta adreso',
  stringUrl: 'Nevalida URL',
  stringUuid: 'Nevalida UUID',
  stringRegex: 'Nevalida formato',
  stringStartsWith: (prefix: string) => `La ĉeno devas komenciĝi per "${prefix}"`,
  stringEndsWith: (suffix: string) => `La ĉeno devas finiĝi per "${suffix}"`,
  stringIncludes: (substring: string) => `La ĉeno devas enhavi "${substring}"`,
  stringIp: 'Nevalida IP-adreso',
  stringIpv4: 'Nevalida IPv4-adreso',
  stringIpv6: 'Nevalida IPv6-adreso',
  stringEmpty: 'La ĉeno ne rajtas esti malplena',

  // Number validation messages
  invalidNumber: 'Nevalida nombro',
  numberMin: (min: number) => `La nombro devas esti almenaŭ ${min}`,
  numberMax: (max: number) => `La nombro devas esti maksimume ${max}`,
  numberInt: 'La nombro devas esti entjero',
  numberPositive: 'La nombro devas esti pozitiva',
  numberNegative: 'La nombro devas esti negativa',
  numberNonnegative: 'La nombro ne rajtas esti negativa',
  numberNonpositive: 'La nombro ne rajtas esti pozitiva',
  numberFinite: 'La nombro devas esti finia',
  numberSafe: 'La nombro devas esti sekura entjero',
  numberMultipleOf: (value: number) => `La nombro devas esti oblo de ${value}`,

  // Boolean validation messages
  invalidBoolean: 'Nevalida bulea valoro',

  // Date validation messages
  invalidDate: 'Nevalida dato',
  dateMin: (date: Date) => `La dato devas esti post ${date.toISOString()}`,
  dateMax: (date: Date) => `La dato devas esti antaŭ ${date.toISOString()}`,

  // Object validation messages
  invalidObject: 'Nevalida objekto',
  unexpectedKeys: (keys: string[]) => `Neatendataj ŝlosiloj: ${keys.join(', ')}`,
  requiredField: (field: string) => `Mankas la deviga kampo "${field}"`,

  // Array validation messages
  invalidArray: 'Nevalida tabelo',
  arrayMin: (min: number) => `La tabelo devas havi almenaŭ ${min} elementojn`,
  arrayMax: (max: number) => `La tabelo devas havi maksimume ${max} elementojn`,
  arrayLength: (length: number) => `La tabelo devas havi ĝuste ${length} elementojn`,
  arrayEmpty: 'La tabelo ne rajtas esti malplena',
  arrayItem: (index: number, error: string) => `Nevalida elemento ĉe indico ${index}: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `Nevalida kampo "${field}": ${error}`,

  // Union validation messages
  unionNoMatch: () => `Nevalida enigo`,

  // Intersection validation messages
  intersectionError: (error: string) => `Eraro pri validaĵo de komunaĵo: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `Atendata ${expected}, ricevita ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `Atendata unu el [${values.join(', ')}], ricevita ${received}`,

  // Special type validation messages
  expectedUndefined: 'Atendata undefined',
  neverType: 'La tipo never ne povas esti analizata',

  // New advanced type validation messages
  invalidBigint: 'Nevalida bigint',
  invalidSymbol: 'Nevalida symbol',
  invalidTuple: 'Nevalida opo',
  tupleLength: (expected: number, received: number) => `La opo devas havi ĝuste ${expected} elementojn, ricevitaj ${received}`,
  invalidRecord: 'Nevalida registro',
  invalidSet: 'Nevalida aro',
  invalidMap: 'Nevalida mapo',

  // Transformation and refinement messages
  transformError: (error: string) => `Eraro pri transformo: ${error}`,
  refinementError: (error: string) => `Eraro pri rafinado: ${error}`,
  customValidationError: (error: string) => `Eraro pri propra validado: ${error}`,

  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `Ne eblas konverti ${JSON.stringify(value)} al ${type}`,

  // Codec messages
  codecDecodeFailed: 'Malsukcesis malkodi la valoron',
  codecEncodeFailed: 'Malsukcesis kodi la valoron',
  codecAsyncNotSupported: 'Asinkronaj kodek-operacioj bezonas la metodojn parseAsync/encodeAsync',

  // Base64/Hex messages
  invalidBase64: 'Nevalida base64-ĉeno',
  invalidHex: 'Nevalida deksesuma ĉeno',

  // Uint8Array messages
  expectedUint8Array: 'Atendata Uint8Array',
  uint8ArrayMinLength: (min: number) => `Uint8Array devas havi almenaŭ ${min} bajtojn`,
  uint8ArrayMaxLength: (max: number) => `Uint8Array devas havi maksimume ${max} bajtojn`,
  uint8ArrayExactLength: (length: number) => `Uint8Array devas havi ĝuste ${length} bajtojn`,

  // Generic type error messages
  expectedString: 'Atendata ĉeno',
  stringExpected: (received: string, expected: string) => `Atendata ${expected}, ricevita ${received}`,
  stringBoolExpected: (validValues: string, received: string) => `Nevalida bulea ĉeno. Atendata unu el: ${validValues}, ricevita "${received}"`,
  invalidJson: 'Nevalida JSON',
  stringPatternInvalid: 'La ĉeno ne kongruas kun la bezonata ŝablono',

  // File validation messages
  invalidFile: 'Atendata dosierobjekto (File)',
  fileNotSupported: 'La File-API ne estas subtenata en ĉi tiu medio',
  fileMinSize: (min: number) => `La dosiergrandeco devas esti almenaŭ ${min} bajtoj`,
  fileMaxSize: (max: number) => `La dosiergrandeco ne rajtas superi ${max} bajtojn`,
  fileMimeType: (allowed: string[]) => `Nevalida dosiertipo. Atendata: ${allowed.join(', ')}`,

  // Function validation messages
  invalidFunction: 'Atendata funkcio',

  // CIDR validation messages
  stringCidrv4: 'Nevalida IPv4-CIDR-bloko',
  stringCidrv6: 'Nevalida IPv6-CIDR-bloko',

  // Safe extend validation messages
  safeExtendOverlap: (keys: string[]) => `Ne eblas anstataŭigi ekzistantajn ŝlosilojn: ${keys.join(', ')}. Uzu extend() se vi volas anstataŭigi ilin.`,
};
