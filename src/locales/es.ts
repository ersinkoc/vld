import { LocaleMessages } from './types';

export const es: LocaleMessages = {
  invalidString: 'Cadena inválida',
  stringMin: (min: number) => `La cadena debe tener al menos ${min} caracteres`,
  stringMax: (max: number) => `La cadena debe tener como máximo ${max} caracteres`,
  stringLength: (length: number) => `La cadena debe tener exactamente ${length} caracteres`,
  stringEmail: 'Dirección de correo inválida',
  stringUrl: 'URL inválida',
  stringUuid: 'UUID inválido',
  stringRegex: 'Formato inválido',
  stringStartsWith: (prefix: string) => `La cadena debe comenzar con "${prefix}"`,
  stringEndsWith: (suffix: string) => `La cadena debe terminar con "${suffix}"`,
  stringIncludes: (substring: string) => `La cadena debe incluir "${substring}"`,
  stringIp: 'Dirección IP inválida',
  stringIpv4: 'Dirección IPv4 inválida',
  stringIpv6: 'Dirección IPv6 inválida',
  stringEmpty: 'La cadena no debe estar vacía',
  invalidNumber: 'Número inválido',
  numberMin: (min: number) => `El número debe ser al menos ${min}`,
  numberMax: (max: number) => `El número debe ser como máximo ${max}`,
  numberInt: 'El número debe ser un entero',
  numberPositive: 'El número debe ser positivo',
  numberNegative: 'El número debe ser negativo',
  numberNonnegative: 'El número debe ser no negativo',
  numberNonpositive: 'El número debe ser no positivo',
  numberFinite: 'El número debe ser finito',
  numberSafe: 'El número debe ser un entero seguro',
  numberMultipleOf: (value: number) => `El número debe ser múltiplo de ${value}`,
  invalidBoolean: 'Boolean inválido',
  invalidDate: 'Fecha inválida',
  dateMin: (date: Date) => `La fecha debe ser posterior a ${date.toISOString()}`,
  dateMax: (date: Date) => `La fecha debe ser anterior a ${date.toISOString()}`,
  invalidObject: 'Objeto inválido',
  unexpectedKeys: (keys: string[]) => `Claves inesperadas: ${keys.join(', ')}`,
  invalidArray: 'Array inválido',
  arrayMin: (min: number) => `El array debe tener al menos ${min} elementos`,
  arrayMax: (max: number) => `El array debe tener como máximo ${max} elementos`,
  arrayLength: (length: number) => `El array debe tener exactamente ${length} elementos`,
  arrayEmpty: 'El array no debe estar vacío',
  arrayItem: (index: number, error: string) => `Elemento inválido en índice ${index}: ${error}`,
  objectField: (field: string, error: string) => `Campo inválido "${field}": ${error}`,
  unionNoMatch: (errors: string[]) => `Ningún miembro de la unión coincidió: ${errors.join(', ')}`,
  intersectionError: (error: string) => `Error de validación de intersección: ${error}`,
  literalExpected: (expected: string, received: string) => `Se esperaba ${expected}, se recibió ${received}`,
  enumExpected: (values: any[], received: string) => `Se esperaba uno de [${values.join(', ')}], se recibió ${received}`,
  expectedUndefined: 'Se esperaba undefined',
  neverType: 'El tipo never no puede ser parseado',

  // New advanced type validation messages
  invalidBigint: 'Bigint inválido',
  invalidSymbol: 'Símbolo inválido',
  invalidTuple: 'Tupla inválida',
  tupleLength: (expected: number, received: number) => `La tupla debe tener exactamente ${expected} elementos, se recibieron ${received}`,
  invalidRecord: 'Registro inválido',
  invalidSet: 'Set inválido',
  invalidMap: 'Map inválido',
  
  // Transformation and refinement messages
  transformError: (error: string) => `Transformación fallida: ${error}`,
  refinementError: (error: string) => `Refinamiento fallido: ${error}`,
  customValidationError: (error: string) => `Validación personalizada falló: ${error}`,
  
  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `No se puede coaccionar ${JSON.stringify(value)} a ${type}`,
  
  // Codec messages
  codecDecodeFailed: 'Failed to decode value',
  codecEncodeFailed: 'Failed to encode value',
  codecAsyncNotSupported: 'Async codec operations require using parseAsync/encodeAsync methods',
  
  // Base64/Hex messages
  invalidBase64: 'Invalid base64 string',
  invalidHex: 'Invalid hexadecimal string',
  
  // Uint8Array messages
  expectedUint8Array: 'Expected Uint8Array',
  uint8ArrayMinLength: 'Uint8Array must have at least {min} bytes',
  uint8ArrayMaxLength: 'Uint8Array must have at most {max} bytes',
  uint8ArrayExactLength: 'Uint8Array must have exactly {length} bytes',
  
  // Generic type error messages
  expectedString: 'Expected string'
};