import { LocaleMessages } from './types';

// Canadian French (ported 2026-10-27; adapted from fr with Québec usage —
// « courriel », espaces insécables avant « : » omis pour la cohérence du code)
export const frCA: LocaleMessages = {
  // String validation messages
  invalidString: 'Chaîne invalide',
  stringMin: (min: number) => `La chaîne doit contenir au moins ${min} caractères`,
  stringMax: (max: number) => `La chaîne doit contenir au maximum ${max} caractères`,
  stringLength: (length: number) => `La chaîne doit contenir exactement ${length} caractères`,
  stringEmail: 'Adresse courriel invalide',
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

  // Number validation messages
  invalidNumber: 'Nombre invalide',
  numberMin: (min: number) => `Le nombre doit être d'au moins ${min}`,
  numberMax: (max: number) => `Le nombre doit être d'au maximum ${max}`,
  numberInt: 'Le nombre doit être un entier',
  numberPositive: 'Le nombre doit être positif',
  numberNegative: 'Le nombre doit être négatif',
  numberNonnegative: 'Le nombre ne doit pas être négatif',
  numberNonpositive: 'Le nombre ne doit pas être positif',
  numberFinite: 'Le nombre doit être fini',
  numberSafe: 'Le nombre doit être un entier sécuritaire',
  numberMultipleOf: (value: number) => `Le nombre doit être un multiple de ${value}`,

  // Boolean validation messages
  invalidBoolean: 'Valeur booléenne invalide',

  // Date validation messages
  invalidDate: 'Date invalide',
  dateMin: (date: Date) => `La date doit être après ${date.toISOString()}`,
  dateMax: (date: Date) => `La date doit être avant ${date.toISOString()}`,

  // Object validation messages
  invalidObject: 'Objet invalide',
  unexpectedKeys: (keys: string[]) => `Clés inattendues : ${keys.join(', ')}`,
  requiredField: (field: string) => `Le champ obligatoire "${field}" est manquant`,

  // Array validation messages
  invalidArray: 'Tableau invalide',
  arrayMin: (min: number) => `Le tableau doit contenir au moins ${min} éléments`,
  arrayMax: (max: number) => `Le tableau doit contenir au maximum ${max} éléments`,
  arrayLength: (length: number) => `Le tableau doit contenir exactement ${length} éléments`,
  arrayEmpty: 'Le tableau ne doit pas être vide',
  arrayItem: (index: number, error: string) => `Élément invalide à l'index ${index} : ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `Champ invalide "${field}" : ${error}`,

  // Union validation messages
  unionNoMatch: () => `Entrée invalide`,

  // Intersection validation messages
  intersectionError: (error: string) => `Erreur de validation d'intersection : ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `Attendu ${expected}, reçu ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `Attendu l'un de [${values.join(', ')}], reçu ${received}`,

  // Special type validation messages
  expectedUndefined: 'undefined attendu',
  neverType: 'Le type never ne peut pas être analysé',

  // New advanced type validation messages
  invalidBigint: 'BigInt invalide',
  invalidSymbol: 'Symbol invalide',
  invalidTuple: 'Tuple invalide',
  tupleLength: (expected: number, received: number) => `Le tuple doit contenir exactement ${expected} éléments, ${received} reçus`,
  invalidRecord: 'Enregistrement invalide',
  invalidSet: 'Set invalide',
  invalidMap: 'Map invalide',

  // Transformation and refinement messages
  transformError: (error: string) => `Erreur de transformation : ${error}`,
  refinementError: (error: string) => `Erreur de raffinement : ${error}`,
  customValidationError: (error: string) => `Erreur de validation personnalisée : ${error}`,

  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `Impossible de convertir ${JSON.stringify(value)} en ${type}`,

  // Codec messages
  codecDecodeFailed: 'Échec du décodage de la valeur',
  codecEncodeFailed: 'Échec de l\'encodage de la valeur',
  codecAsyncNotSupported: 'Les opérations asynchrones de codec nécessitent les méthodes parseAsync/encodeAsync',

  // Base64/Hex messages
  invalidBase64: 'Chaîne base64 invalide',
  invalidHex: 'Chaîne hexadécimale invalide',

  // Uint8Array messages
  expectedUint8Array: 'Uint8Array attendu',
  uint8ArrayMinLength: (min: number) => `Le Uint8Array doit contenir au moins ${min} octets`,
  uint8ArrayMaxLength: (max: number) => `Le Uint8Array doit contenir au maximum ${max} octets`,
  uint8ArrayExactLength: (length: number) => `Le Uint8Array doit contenir exactement ${length} octets`,

  // Generic type error messages
  expectedString: 'Chaîne attendue',
  stringExpected: (received: string, expected: string) => `Attendu ${expected}, reçu ${received}`,
  stringBoolExpected: (validValues: string, received: string) => `Chaîne booléenne invalide. Attendu l'une de : ${validValues}, reçu "${received}"`,
  invalidJson: 'JSON invalide',
  stringPatternInvalid: 'La chaîne ne correspond pas au motif requis',

  // File validation messages
  invalidFile: 'Objet File attendu',
  fileNotSupported: 'L\'API File n\'est pas prise en charge dans cet environnement',
  fileMinSize: (min: number) => `La taille du fichier doit être d'au moins ${min} octets`,
  fileMaxSize: (max: number) => `La taille du fichier ne doit pas dépasser ${max} octets`,
  fileMimeType: (allowed: string[]) => `Type de fichier invalide. Attendu : ${allowed.join(', ')}`,

  // Function validation messages
  invalidFunction: 'Fonction attendue',

  // CIDR validation messages
  stringCidrv4: 'Bloc CIDR IPv4 invalide',
  stringCidrv6: 'Bloc CIDR IPv6 invalide',

  // Safe extend validation messages
  safeExtendOverlap: (keys: string[]) => `Impossible de remplacer les clés existantes : ${keys.join(', ')}. Utilisez extend() si vous voulez les remplacer.`,
};
