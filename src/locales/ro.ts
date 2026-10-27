import { LocaleMessages } from './types';

// Romanian (ported 2026-10-27)
export const ro: LocaleMessages = {
  // String validation messages
  invalidString: 'Șir invalid',
  stringMin: (min: number) => `Șirul trebuie să aibă cel puțin ${min} caractere`,
  stringMax: (max: number) => `Șirul trebuie să aibă cel mult ${max} caractere`,
  stringLength: (length: number) => `Șirul trebuie să aibă exact ${length} caractere`,
  stringEmail: 'Adresă de email invalidă',
  stringUrl: 'URL invalid',
  stringUuid: 'UUID invalid',
  stringRegex: 'Format invalid',
  stringStartsWith: (prefix: string) => `Șirul trebuie să înceapă cu "${prefix}"`,
  stringEndsWith: (suffix: string) => `Șirul trebuie să se termine cu "${suffix}"`,
  stringIncludes: (substring: string) => `Șirul trebuie să conțină "${substring}"`,
  stringIp: 'Adresă IP invalidă',
  stringIpv4: 'Adresă IPv4 invalidă',
  stringIpv6: 'Adresă IPv6 invalidă',
  stringEmpty: 'Șirul nu trebuie să fie gol',

  // Number validation messages
  invalidNumber: 'Număr invalid',
  numberMin: (min: number) => `Numărul trebuie să fie cel puțin ${min}`,
  numberMax: (max: number) => `Numărul trebuie să fie cel mult ${max}`,
  numberInt: 'Numărul trebuie să fie întreg',
  numberPositive: 'Numărul trebuie să fie pozitiv',
  numberNegative: 'Numărul trebuie să fie negativ',
  numberNonnegative: 'Numărul nu trebuie să fie negativ',
  numberNonpositive: 'Numărul nu trebuie să fie pozitiv',
  numberFinite: 'Numărul trebuie să fie finit',
  numberSafe: 'Numărul trebuie să fie un întreg sigur',
  numberMultipleOf: (value: number) => `Numărul trebuie să fie multiplu de ${value}`,

  // Boolean validation messages
  invalidBoolean: 'Valoare booleană invalidă',

  // Date validation messages
  invalidDate: 'Dată invalidă',
  dateMin: (date: Date) => `Data trebuie să fie după ${date.toISOString()}`,
  dateMax: (date: Date) => `Data trebuie să fie înainte de ${date.toISOString()}`,

  // Object validation messages
  invalidObject: 'Obiect invalid',
  unexpectedKeys: (keys: string[]) => `Chei neașteptate: ${keys.join(', ')}`,
  requiredField: (field: string) => `Câmpul obligatoriu "${field}" lipsește`,

  // Array validation messages
  invalidArray: 'Matrice invalidă',
  arrayMin: (min: number) => `Matricea trebuie să aibă cel puțin ${min} elemente`,
  arrayMax: (max: number) => `Matricea trebuie să aibă cel mult ${max} elemente`,
  arrayLength: (length: number) => `Matricea trebuie să aibă exact ${length} elemente`,
  arrayEmpty: 'Matricea nu trebuie să fie goală',
  arrayItem: (index: number, error: string) => `Element invalid la indexul ${index}: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `Câmp invalid "${field}": ${error}`,

  // Union validation messages
  unionNoMatch: () => `Date de intrare invalide`,

  // Intersection validation messages
  intersectionError: (error: string) => `Eroare de validare a intersecției: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `Se aștepta ${expected}, s-a primit ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `Se aștepta una din [${values.join(', ')}], s-a primit ${received}`,

  // Special type validation messages
  expectedUndefined: 'Se aștepta undefined',
  neverType: 'Tipul never nu poate fi analizat',

  // New advanced type validation messages
  invalidBigint: 'BigInt invalid',
  invalidSymbol: 'Symbol invalid',
  invalidTuple: 'Tuplu invalid',
  tupleLength: (expected: number, received: number) => `Tuplul trebuie să aibă exact ${expected} elemente, s-au primit ${received}`,
  invalidRecord: 'Înregistrare invalidă',
  invalidSet: 'Set invalid',
  invalidMap: 'Map invalid',

  // Transformation and refinement messages
  transformError: (error: string) => `Eroare de transformare: ${error}`,
  refinementError: (error: string) => `Eroare de rafinare: ${error}`,
  customValidationError: (error: string) => `Eroare de validare personalizată: ${error}`,

  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `Nu se poate converti ${JSON.stringify(value)} în ${type}`,

  // Codec messages
  codecDecodeFailed: 'Decodarea valorii a eșuat',
  codecEncodeFailed: 'Codarea valorii a eșuat',
  codecAsyncNotSupported: 'Operațiunile asincrone de codec necesită metodele parseAsync/encodeAsync',

  // Base64/Hex messages
  invalidBase64: 'Șir base64 invalid',
  invalidHex: 'Șir hexazecimal invalid',

  // Uint8Array messages
  expectedUint8Array: 'Se aștepta Uint8Array',
  uint8ArrayMinLength: (min: number) => `Uint8Array trebuie să aibă cel puțin ${min} octeți`,
  uint8ArrayMaxLength: (max: number) => `Uint8Array trebuie să aibă cel mult ${max} octeți`,
  uint8ArrayExactLength: (length: number) => `Uint8Array trebuie să aibă exact ${length} octeți`,

  // Generic type error messages
  expectedString: 'Se aștepta un șir',
  stringExpected: (received: string, expected: string) => `Se aștepta ${expected}, s-a primit ${received}`,
  stringBoolExpected: (validValues: string, received: string) => `Șir boolean invalid. Se aștepta una din: ${validValues}, s-a primit "${received}"`,
  invalidJson: 'JSON invalid',
  stringPatternInvalid: 'Șirul nu corespunde tiparului necesar',

  // File validation messages
  invalidFile: 'Se aștepta un obiect File',
  fileNotSupported: 'File API nu este acceptat în acest mediu',
  fileMinSize: (min: number) => `Dimensiunea fișierului trebuie să fie de cel puțin ${min} octeți`,
  fileMaxSize: (max: number) => `Dimensiunea fișierului nu trebuie să depășească ${max} octeți`,
  fileMimeType: (allowed: string[]) => `Tip de fișier invalid. Se aștepta: ${allowed.join(', ')}`,

  // Function validation messages
  invalidFunction: 'Se aștepta o funcție',

  // CIDR validation messages
  stringCidrv4: 'Bloc CIDR IPv4 invalid',
  stringCidrv6: 'Bloc CIDR IPv6 invalid',

  // Safe extend validation messages
  safeExtendOverlap: (keys: string[]) => `Cheile existente nu pot fi suprascrise: ${keys.join(', ')}. Folosiți extend() dacă doriți să le suprascrieți.`,
};
