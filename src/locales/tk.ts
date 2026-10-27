import { LocaleMessages } from './types';

// Turkmen (ported 2026-10-27)
export const tk: LocaleMessages = {
  // String validation messages
  invalidString: 'Nädogry setir',
  stringMin: (min: number) => `Setir iň az ${min} belgiden ybarat bolmaly`,
  stringMax: (max: number) => `Setir iň köp ${max} belgiden ybarat bolmaly`,
  stringLength: (length: number) => `Setir takmyndan ${length} belgiden ybarat bolmaly`,
  stringEmail: 'Nädogry e-poçta salgysy',
  stringUrl: 'Nädogry URL',
  stringUuid: 'Nädogry UUID',
  stringRegex: 'Nädogry format',
  stringStartsWith: (prefix: string) => `Setir "${prefix}" bilen başlamaly`,
  stringEndsWith: (suffix: string) => `Setir "${suffix}" bilen tamamlanmaly`,
  stringIncludes: (substring: string) => `Setir "${substring}" öz içine almaly`,
  stringIp: 'Nädogry IP salgysy',
  stringIpv4: 'Nädogry IPv4 salgysy',
  stringIpv6: 'Nädogry IPv6 salgysy',
  stringEmpty: 'Setir boş bolmaly däl',

  // Number validation messages
  invalidNumber: 'Nädogry san',
  numberMin: (min: number) => `San iň az ${min} bolmaly`,
  numberMax: (max: number) => `San iň köp ${max} bolmaly`,
  numberInt: 'San bitin bolmaly',
  numberPositive: 'San positiw bolmaly',
  numberNegative: 'San negatiw bolmaly',
  numberNonnegative: 'San negatiw bolmaly däl',
  numberNonpositive: 'San positiw bolmaly däl',
  numberFinite: 'San çäkli bolmaly',
  numberSafe: 'San howpsuz bitin san bolmaly',
  numberMultipleOf: (value: number) => `San ${value}-ä köpeltmek bolmaly`,

  // Boolean validation messages
  invalidBoolean: 'Nädogry logiki bahа',

  // Date validation messages
  invalidDate: 'Nädogry sene',
  dateMin: (date: Date) => `Sene ${date.toISOString()}-dan soň bolmaly`,
  dateMax: (date: Date) => `Sene ${date.toISOString()}-dan öň bolmaly`,

  // Object validation messages
  invalidObject: 'Nädogry obýekt',
  unexpectedKeys: (keys: string[]) => `Garaşylmadyk açarlar: ${keys.join(', ')}`,
  requiredField: (field: string) => `Hökümädär "${field}" meýdany ýok`,

  // Array validation messages
  invalidArray: 'Nädogry massiw',
  arrayMin: (min: number) => `Massiw iň az ${min} elementden ybarat bolmaly`,
  arrayMax: (max: number) => `Massiw iň köp ${max} elementden ybarat bolmaly`,
  arrayLength: (length: number) => `Massiw takmyndan ${length} elementden ybarat bolmaly`,
  arrayEmpty: 'Massiw boş bolmaly däl',
  arrayItem: (index: number, error: string) => `${index} indeksli element nädogry: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `Nädogry "${field}" meýdany: ${error}`,

  // Union validation messages
  unionNoMatch: () => `Nädogry girizme`,

  // Intersection validation messages
  intersectionError: (error: string) => `Kesişmegi barlamak ýalňyşy: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `Garaşyldy ${expected}, alnady ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `[${values.join(', ')}]-dan biri garaşyldy, alnady ${received}`,

  // Special type validation messages
  expectedUndefined: 'undefined garaşyldy',
  neverType: 'never görnüşini derňep bolmaýar',

  // New advanced type validation messages
  invalidBigint: 'Nädogry bigint',
  invalidSymbol: 'Nädogry symbol',
  invalidTuple: 'Nädogry korteg',
  tupleLength: (expected: number, received: number) => `Korteg takmyndan ${expected} elementden ybarat bolmaly, ${received} alnady`,
  invalidRecord: 'Nädogry ýazgy',
  invalidSet: 'Nädogry toplum',
  invalidMap: 'Nädogry kartа',

  // Transformation and refinement messages
  transformError: (error: string) => `Öwrüşiş ýalňyşy: ${error}`,
  refinementError: (error: string) => `Takýylaşdyrma ýalňyşy: ${error}`,
  customValidationError: (error: string) => `Aýratyn barlak ýalňyşy: ${error}`,

  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `${JSON.stringify(value)}-y ${type}-a öwürüp bolmaýar`,

  // Codec messages
  codecDecodeFailed: 'Bahany dekodlamak amala aşmady',
  codecEncodeFailed: 'Bahany kodlamak amala aşmady',
  codecAsyncNotSupported: 'Asinhron kodek amallary parseAsync/encodeAsync usullaryny talap edýär',

  // Base64/Hex messages
  invalidBase64: 'Nädogry base64 setiri',
  invalidHex: 'Nädogry onaltalyk setir',

  // Uint8Array messages
  expectedUint8Array: 'Uint8Array garaşyldy',
  uint8ArrayMinLength: (min: number) => `Uint8Array iň az ${min} baýt bolmaly`,
  uint8ArrayMaxLength: (max: number) => `Uint8Array iň köp ${max} baýt bolmaly`,
  uint8ArrayExactLength: (length: number) => `Uint8Array takmyndan ${length} baýt bolmaly`,

  // Generic type error messages
  expectedString: 'Setir garaşyldy',
  stringExpected: (received: string, expected: string) => `Garaşyldy ${expected}, alnady ${received}`,
  stringBoolExpected: (validValues: string, received: string) => `Nädogry logiki setir: ${validValues}-dan biri garaşyldy, "${received}" alnady`,
  invalidJson: 'Nädogry JSON',
  stringPatternInvalid: 'Setir talap edilýän nusga laýyk gelmeýär',

  // File validation messages
  invalidFile: 'File obýekti garaşyldy',
  fileNotSupported: 'File API bu gurşawda goldanylmaýar',
  fileMinSize: (min: number) => `Faýyň gönişi iň az ${min} baýt bolmaly`,
  fileMaxSize: (max: number) => `Faýyň gönişi ${max} baýtdan geçmali däl`,
  fileMimeType: (allowed: string[]) => `Nädogry faýyň görnüşi: ${allowed.join(', ')} garaşyldy`,

  // Function validation messages
  invalidFunction: 'Funksiýa garaşyldy',

  // CIDR validation messages
  stringCidrv4: 'Nädogry IPv4 CIDR bloky',
  stringCidrv6: 'Nädogry IPv6 CIDR bloky',

  // Safe extend validation messages
  safeExtendOverlap: (keys: string[]) => `Bar açarlary ýok edip bolmaýar: ${keys.join(', ')}. Ýok etmek isleseňiz extend() ulanyň.`,
};
