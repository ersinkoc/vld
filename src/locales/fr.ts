import { LocaleMessages } from './types';

export const fr: LocaleMessages = {
  invalidString: 'Chaîne invalide',
  stringMin: (min: number) => `La chaîne doit contenir au moins ${min} caractères`,
  stringMax: (max: number) => `La chaîne doit contenir au maximum ${max} caractères`,
  stringLength: (length: number) => `La chaîne doit contenir exactement ${length} caractères`,
  stringEmail: 'Adresse e-mail invalide',
  stringUrl: 'URL invalide',
  stringUuid: 'UUID invalide',
  stringRegex: 'Format invalide',
  stringStartsWith: (prefix: string) => `La chaîne doit commencer par "${prefix}"`,
  stringEndsWith: (suffix: string) => `La chaîne doit se terminer par "${suffix}"`,
  stringIncludes: (substring: string) => `La chaîne doit contenir "${substring}"`,
  stringIp: 'Adresse IP invalide',
  stringIpv4: 'Adresse IPv4 invalide',
  stringIpv6: 'Adresse IPv6 invalide',
  stringEmpty: 'La chaîne ne doit pas être vide',
  invalidNumber: 'Nombre invalide',
  numberMin: (min: number) => `Le nombre doit être d'au moins ${min}`,
  numberMax: (max: number) => `Le nombre doit être d'au maximum ${max}`,
  numberInt: 'Le nombre doit être un entier',
  numberPositive: 'Le nombre doit être positif',
  numberNegative: 'Le nombre doit être négatif',
  numberNonnegative: 'Le nombre ne doit pas être négatif',
  numberNonpositive: 'Le nombre ne doit pas être positif',
  numberFinite: 'Le nombre doit être fini',
  numberSafe: 'Le nombre doit être un entier sûr',
  numberMultipleOf: (value: number) => `Le nombre doit être un multiple de ${value}`,
  invalidBoolean: 'Boolean invalide',
  invalidDate: 'Date invalide',
  dateMin: (date: Date) => `La date doit être postérieure à ${date.toISOString()}`,
  dateMax: (date: Date) => `La date doit être antérieure à ${date.toISOString()}`,
  invalidObject: 'Objet invalide',
  unexpectedKeys: (keys: string[]) => `Clés inattendues: ${keys.join(', ')}`,
  invalidArray: 'Tableau invalide',
  arrayMin: (min: number) => `Le tableau doit contenir au moins ${min} éléments`,
  arrayMax: (max: number) => `Le tableau doit contenir au maximum ${max} éléments`,
  arrayLength: (length: number) => `Le tableau doit contenir exactement ${length} éléments`,
  arrayEmpty: 'Le tableau ne doit pas être vide',
  arrayItem: (index: number, error: string) => `Élément invalide à l'index ${index}: ${error}`,
  objectField: (field: string, error: string) => `Champ invalide "${field}": ${error}`,
  unionNoMatch: (errors: string[]) => `Aucun membre de l'union n'a correspondu: ${errors.join(', ')}`,
  intersectionError: (error: string) => `Échec de validation d'intersection: ${error}`,
  literalExpected: (expected: string, received: string) => `Attendu ${expected}, reçu ${received}`,
  enumExpected: (values: any[], received: string) => `Attendu un de [${values.join(', ')}], reçu ${received}`,
  expectedUndefined: 'Undefined attendu',
  neverType: 'Le type never ne peut pas être analysé',

  // New advanced type validation messages
  invalidBigint: 'Bigint invalide',
  invalidSymbol: 'Symbole invalide',
  invalidTuple: 'Tuple invalide',
  tupleLength: (expected: number, received: number) => `Le tuple doit contenir exactement ${expected} éléments, ${received} reçus`,
  invalidRecord: 'Enregistrement invalide',
  invalidSet: 'Set invalide',
  invalidMap: 'Map invalide',
  
  // Transformation and refinement messages
  transformError: (error: string) => `Transformation échouée : ${error}`,
  refinementError: (error: string) => `Raffinement échoué : ${error}`,
  customValidationError: (error: string) => `Validation personnalisée échouée : ${error}`,
  
  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `Impossible de convertir ${JSON.stringify(value)} en ${type}`,
  
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