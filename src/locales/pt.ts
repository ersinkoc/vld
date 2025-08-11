import { LocaleMessages } from './types';

export const pt: LocaleMessages = {
  // String validation messages
  invalidString: 'String inválida',
  stringMin: (min: number) => `String deve ter pelo menos ${min} caracteres`,
  stringMax: (max: number) => `String não pode ter mais que ${max} caracteres`,
  stringLength: (length: number) => `String deve ter exactamente ${length} caracteres`,
  stringEmail: 'Endereço de email inválido',
  stringUrl: 'URL inválido',
  stringUuid: 'UUID inválido',
  stringRegex: 'Formato inválido',
  stringStartsWith: (prefix: string) => `String deve começar com "${prefix}"`,
  stringEndsWith: (suffix: string) => `String deve terminar com "${suffix}"`,
  stringIncludes: (substring: string) => `String deve conter "${substring}"`,
  stringIp: 'Endereço IP inválido',
  stringIpv4: 'Endereço IPv4 inválido',
  stringIpv6: 'Endereço IPv6 inválido',
  stringEmpty: 'String não pode estar vazia',

  // Number validation messages
  invalidNumber: 'Número inválido',
  numberMin: (min: number) => `Número deve ser pelo menos ${min}`,
  numberMax: (max: number) => `Número não pode ser maior que ${max}`,
  numberInt: 'Número deve ser inteiro',
  numberPositive: 'Número deve ser positivo',
  numberNegative: 'Número deve ser negativo',
  numberNonnegative: 'Número não pode ser negativo',
  numberNonpositive: 'Número não pode ser positivo',
  numberFinite: 'Número deve ser finito',
  numberSafe: 'Número deve ser um inteiro seguro',
  numberMultipleOf: (value: number) => `Número deve ser múltiplo de ${value}`,

  // Boolean validation messages
  invalidBoolean: 'Valor booleano inválido',

  // Date validation messages
  invalidDate: 'Data inválida',
  dateMin: (date: Date) => `Data deve ser após ${date.toISOString()}`,
  dateMax: (date: Date) => `Data deve ser antes de ${date.toISOString()}`,

  // Object validation messages
  invalidObject: 'Objecto inválido',
  unexpectedKeys: (keys: string[]) => `Chaves inesperadas: ${keys.join(', ')}`,

  // Array validation messages
  invalidArray: 'Array inválido',
  arrayMin: (min: number) => `Array deve ter pelo menos ${min} elementos`,
  arrayMax: (max: number) => `Array não pode ter mais que ${max} elementos`,
  arrayLength: (length: number) => `Array deve ter exactamente ${length} elementos`,
  arrayEmpty: 'Array não pode estar vazio',
  arrayItem: (index: number, error: string) => `Item inválido no índice ${index}: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `Campo inválido "${field}": ${error}`,

  // Union validation messages
  unionNoMatch: (errors: string[]) => `Nenhum membro da união correspondeu: ${errors.join(', ')}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `Esperado ${expected}, recebido ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `Esperado um de [${values.join(', ')}], recebido ${received}`,

  // Special type validation messages
  expectedUndefined: 'Esperado undefined',
  neverType: 'Tipo never não pode ser analisado'
};