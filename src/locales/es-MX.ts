import { LocaleMessages } from './types';

export const esMX: LocaleMessages = {
  // String validation messages
  invalidString: 'Cadena inválida',
  stringMin: (min: number) => `La cadena debe tener al menos ${min} caracteres`,
  stringMax: (max: number) => `La cadena no puede tener más de ${max} caracteres`,
  stringLength: (length: number) => `La cadena debe tener exactamente ${length} caracteres`,
  stringEmail: 'Dirección de correo inválida',
  stringUrl: 'URL inválida',
  stringUuid: 'UUID inválido',
  stringRegex: 'Formato inválido',
  stringStartsWith: (prefix: string) => `La cadena debe empezar con "${prefix}"`,
  stringEndsWith: (suffix: string) => `La cadena debe terminar con "${suffix}"`,
  stringIncludes: (substring: string) => `La cadena debe incluir "${substring}"`,
  stringIp: 'Dirección IP inválida',
  stringIpv4: 'Dirección IPv4 inválida',
  stringIpv6: 'Dirección IPv6 inválida',
  stringEmpty: 'La cadena no puede estar vacía',

  // Number validation messages
  invalidNumber: 'Número inválido',
  numberMin: (min: number) => `El número debe ser al menos ${min}`,
  numberMax: (max: number) => `El número no puede ser mayor a ${max}`,
  numberInt: 'El número debe ser entero',
  numberPositive: 'El número debe ser positivo',
  numberNegative: 'El número debe ser negativo',
  numberNonnegative: 'El número no puede ser negativo',
  numberNonpositive: 'El número no puede ser positivo',
  numberFinite: 'El número debe ser finito',
  numberSafe: 'El número debe ser un entero seguro',
  numberMultipleOf: (value: number) => `El número debe ser múltiplo de ${value}`,

  // Boolean validation messages
  invalidBoolean: 'Valor booleano inválido',

  // Date validation messages
  invalidDate: 'Fecha inválida',
  dateMin: (date: Date) => `La fecha debe ser después de ${date.toISOString()}`,
  dateMax: (date: Date) => `La fecha debe ser antes de ${date.toISOString()}`,

  // Object validation messages
  invalidObject: 'Objeto inválido',
  unexpectedKeys: (keys: string[]) => `Claves inesperadas: ${keys.join(', ')}`,

  // Array validation messages
  invalidArray: 'Array inválido',
  arrayMin: (min: number) => `El array debe tener al menos ${min} elementos`,
  arrayMax: (max: number) => `El array no puede tener más de ${max} elementos`,
  arrayLength: (length: number) => `El array debe tener exactamente ${length} elementos`,
  arrayEmpty: 'El array no puede estar vacío',
  arrayItem: (index: number, error: string) => `Elemento inválido en índice ${index}: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `Campo inválido "${field}": ${error}`,

  // Union validation messages
  unionNoMatch: (errors: string[]) => `Ningún miembro de la unión coincidió: ${errors.join(', ')}`,

  // Intersection validation messages
  intersectionError: (error: string) => `Error de validación de intersección: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `Se esperaba ${expected}, se recibió ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `Se esperaba uno de [${values.join(', ')}], se recibió ${received}`,

  // Special type validation messages
  expectedUndefined: 'Se esperaba undefined',
  neverType: 'El tipo never no se puede analizar',

  // New advanced type validation messages
  invalidBigint: 'Bigint inválido',
  invalidSymbol: 'Símbolo inválido',
  invalidTuple: 'Tupla inválida',
  tupleLength: (expected: number, received: number) => `La tupla debe tener exactamente ${expected} elementos, se recibieron ${received}`,
  invalidRecord: 'Registro inválido',
  invalidSet: 'Set inválido',
  invalidMap: 'Map inválido',
  
  // Transformation and refinement messages
  transformError: (error: string) => `Transformación falló: ${error}`,
  refinementError: (error: string) => `Refinamiento falló: ${error}`,
  customValidationError: (error: string) => `Validación personalizada falló: ${error}`,
  
  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `No se puede coaccionar ${JSON.stringify(value)} a ${type}`
};