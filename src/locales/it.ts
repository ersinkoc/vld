import { LocaleMessages } from './types';

export const it: LocaleMessages = {
  // String validation messages
  invalidString: 'Stringa non valida',
  stringMin: (min: number) => `La stringa deve avere almeno ${min} caratteri`,
  stringMax: (max: number) => `La stringa non può avere più di ${max} caratteri`,
  stringLength: (length: number) => `La stringa deve avere esattamente ${length} caratteri`,
  stringEmail: 'Indirizzo email non valido',
  stringUrl: 'URL non valido',
  stringUuid: 'UUID non valido',
  stringRegex: 'Formato non valido',
  stringStartsWith: (prefix: string) => `La stringa deve iniziare con "${prefix}"`,
  stringEndsWith: (suffix: string) => `La stringa deve finire con "${suffix}"`,
  stringIncludes: (substring: string) => `La stringa deve contenere "${substring}"`,
  stringIp: 'Indirizzo IP non valido',
  stringIpv4: 'Indirizzo IPv4 non valido',
  stringIpv6: 'Indirizzo IPv6 non valido',
  stringEmpty: 'La stringa non può essere vuota',

  // Number validation messages
  invalidNumber: 'Numero non valido',
  numberMin: (min: number) => `Il numero deve essere almeno ${min}`,
  numberMax: (max: number) => `Il numero non può essere maggiore di ${max}`,
  numberInt: 'Il numero deve essere intero',
  numberPositive: 'Il numero deve essere positivo',
  numberNegative: 'Il numero deve essere negativo',
  numberNonnegative: 'Il numero non può essere negativo',
  numberNonpositive: 'Il numero non può essere positivo',
  numberFinite: 'Il numero deve essere finito',
  numberSafe: 'Il numero deve essere un intero sicuro',
  numberMultipleOf: (value: number) => `Il numero deve essere multiplo di ${value}`,

  // Boolean validation messages
  invalidBoolean: 'Valore booleano non valido',

  // Date validation messages
  invalidDate: 'Data non valida',
  dateMin: (date: Date) => `La data deve essere dopo ${date.toISOString()}`,
  dateMax: (date: Date) => `La data deve essere prima di ${date.toISOString()}`,

  // Object validation messages
  invalidObject: 'Oggetto non valido',
  unexpectedKeys: (keys: string[]) => `Chiavi impreviste: ${keys.join(', ')}`,

  // Array validation messages
  invalidArray: 'Array non valido',
  arrayMin: (min: number) => `L'array deve avere almeno ${min} elementi`,
  arrayMax: (max: number) => `L'array non può avere più di ${max} elementi`,
  arrayLength: (length: number) => `L'array deve avere esattamente ${length} elementi`,
  arrayEmpty: 'L\'array non può essere vuoto',
  arrayItem: (index: number, error: string) => `Elemento non valido all'indice ${index}: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `Campo non valido "${field}": ${error}`,

  // Union validation messages
  unionNoMatch: (errors: string[]) => `Nessun membro dell'unione corrisponde: ${errors.join(', ')}`,

  // Intersection validation messages
  intersectionError: (error: string) => `Validazione intersezione fallita: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `Previsto ${expected}, ricevuto ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `Previsto uno di [${values.join(', ')}], ricevuto ${received}`,

  // Special type validation messages
  expectedUndefined: 'Previsto undefined',
  neverType: 'Il tipo never non può essere analizzato',

  // New advanced type validation messages
  invalidBigint: 'Bigint non valido',
  invalidSymbol: 'Simbolo non valido',
  invalidTuple: 'Tupla non valida',
  tupleLength: (expected: number, received: number) => `La tupla deve avere esattamente ${expected} elementi, ricevuti ${received}`,
  invalidRecord: 'Record non valido',
  invalidSet: 'Set non valido',
  invalidMap: 'Map non valida',
  
  // Transformation and refinement messages
  transformError: (error: string) => `Trasformazione fallita: ${error}`,
  refinementError: (error: string) => `Raffinamento fallito: ${error}`,
  customValidationError: (error: string) => `Validazione personalizzata fallita: ${error}`,
  
  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `Impossibile convertire ${JSON.stringify(value)} in ${type}`,
  
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