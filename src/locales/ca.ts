import { LocaleMessages } from './types';

// Catalan (ported 2026-10-27)
export const ca: LocaleMessages = {
  // String validation messages
  invalidString: 'Cadena no vàlida',
  stringMin: (min: number) => `La cadena ha de tenir com a mínim ${min} caràcters`,
  stringMax: (max: number) => `La cadena ha de tenir com a màxim ${max} caràcters`,
  stringLength: (length: number) => `La cadena ha de tenir exactament ${length} caràcters`,
  stringEmail: 'Adreça de correu electrònic no vàlida',
  stringUrl: 'URL no vàlida',
  stringUuid: 'UUID no vàlid',
  stringRegex: 'Format no vàlid',
  stringStartsWith: (prefix: string) => `La cadena ha de començar amb "${prefix}"`,
  stringEndsWith: (suffix: string) => `La cadena ha d'acabar amb "${suffix}"`,
  stringIncludes: (substring: string) => `La cadena ha d'incloure "${substring}"`,
  stringIp: 'Adreça IP no vàlida',
  stringIpv4: 'Adreça IPv4 no vàlida',
  stringIpv6: 'Adreça IPv6 no vàlida',
  stringEmpty: 'La cadena no pot ser buida',

  // Number validation messages
  invalidNumber: 'Número no vàlid',
  numberMin: (min: number) => `El número ha de ser com a mínim ${min}`,
  numberMax: (max: number) => `El número ha de ser com a màxim ${max}`,
  numberInt: 'El número ha de ser enter',
  numberPositive: 'El número ha de ser positiu',
  numberNegative: 'El número ha de ser negatiu',
  numberNonnegative: 'El número no pot ser negatiu',
  numberNonpositive: 'El número no pot ser positiu',
  numberFinite: 'El número ha de ser finit',
  numberSafe: 'El número ha de ser un enter segur',
  numberMultipleOf: (value: number) => `El número ha de ser múltiple de ${value}`,

  // Boolean validation messages
  invalidBoolean: 'Valor booleà no vàlid',

  // Date validation messages
  invalidDate: 'Data no vàlida',
  dateMin: (date: Date) => `La data ha de ser posterior a ${date.toISOString()}`,
  dateMax: (date: Date) => `La data ha de ser anterior a ${date.toISOString()}`,

  // Object validation messages
  invalidObject: 'Objecte no vàlid',
  unexpectedKeys: (keys: string[]) => `Claus inesperades: ${keys.join(', ')}`,
  requiredField: (field: string) => `Falta el camp obligatori "${field}"`,

  // Array validation messages
  invalidArray: 'Matriu no vàlida',
  arrayMin: (min: number) => `La matriu ha de tenir com a mínim ${min} elements`,
  arrayMax: (max: number) => `La matriu ha de tenir com a màxim ${max} elements`,
  arrayLength: (length: number) => `La matriu ha de tenir exactament ${length} elements`,
  arrayEmpty: 'La matriu no pot ser buida',
  arrayItem: (index: number, error: string) => `Element no vàlid a l'índex ${index}: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `Camp no vàlid "${field}": ${error}`,

  // Union validation messages
  unionNoMatch: () => `Entrada no vàlida`,

  // Intersection validation messages
  intersectionError: (error: string) => `Error de validació de la intersecció: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `S'esperava ${expected}, s'ha rebut ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `S'esperava un de [${values.join(', ')}], s'ha rebut ${received}`,

  // Special type validation messages
  expectedUndefined: "S'esperava undefined",
  neverType: 'El tipus never no es pot analitzar',

  // New advanced type validation messages
  invalidBigint: 'bigint no vàlid',
  invalidSymbol: 'symbol no vàlid',
  invalidTuple: 'Tupla no vàlida',
  tupleLength: (expected: number, received: number) => `La tupla ha de tenir exactament ${expected} elements, s'han rebut ${received}`,
  invalidRecord: 'Registre no vàlid',
  invalidSet: 'Conjunt no vàlid',
  invalidMap: 'Mapa no vàlid',

  // Transformation and refinement messages
  transformError: (error: string) => `Error de transformació: ${error}`,
  refinementError: (error: string) => `Error de refinament: ${error}`,
  customValidationError: (error: string) => `Error de validació personalitzada: ${error}`,

  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `No es pot convertir ${JSON.stringify(value)} a ${type}`,

  // Codec messages
  codecDecodeFailed: "No s'ha pogut descodificar el valor",
  codecEncodeFailed: "No s'ha pogut codificar el valor",
  codecAsyncNotSupported: 'Les operacions asíncrones del còdec requereixen els mètodes parseAsync/encodeAsync',

  // Base64/Hex messages
  invalidBase64: 'Cadena base64 no vàlida',
  invalidHex: 'Cadena hexadecimal no vàlida',

  // Uint8Array messages
  expectedUint8Array: "S'esperava un Uint8Array",
  uint8ArrayMinLength: (min: number) => `Uint8Array ha de tenir com a mínim ${min} bytes`,
  uint8ArrayMaxLength: (max: number) => `Uint8Array ha de tenir com a màxim ${max} bytes`,
  uint8ArrayExactLength: (length: number) => `Uint8Array ha de tenir exactament ${length} bytes`,

  // Generic type error messages
  expectedString: "S'esperava una cadena",
  stringExpected: (received: string, expected: string) => `S'esperava ${expected}, s'ha rebut ${received}`,
  stringBoolExpected: (validValues: string, received: string) => `Cadena booleana no vàlida. S'esperava un de: ${validValues}, s'ha rebut "${received}"`,
  invalidJson: 'JSON no vàlid',
  stringPatternInvalid: 'La cadena no coincideix amb el patró requerit',

  // File validation messages
  invalidFile: "S'esperava un objecte File",
  fileNotSupported: "L'API File no està suportada en aquest entorn",
  fileMinSize: (min: number) => `La mida del fitxer ha de ser com a mínim ${min} bytes`,
  fileMaxSize: (max: number) => `La mida del fitxer no pot superar ${max} bytes`,
  fileMimeType: (allowed: string[]) => `Tipus de fitxer no vàlid. S'esperava: ${allowed.join(', ')}`,

  // Function validation messages
  invalidFunction: "S'esperava una funció",

  // CIDR validation messages
  stringCidrv4: 'Bloc CIDR IPv4 no vàlid',
  stringCidrv6: 'Bloc CIDR IPv6 no vàlid',

  // Safe extend validation messages
  safeExtendOverlap: (keys: string[]) => `No es poden sobreescriure claus existents: ${keys.join(', ')}. Utilitzeu extend() si voleu sobreescriure-les.`,
};
