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

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `Se esperaba ${expected}, se recibió ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `Se esperaba uno de [${values.join(', ')}], se recibió ${received}`,

  // Special type validation messages
  expectedUndefined: 'Se esperaba undefined',
  neverType: 'El tipo never no se puede analizar'
};