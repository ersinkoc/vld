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

  // Intersection validation messages
  intersectionError: (error: string) => `Validação de intersecção falhou: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `Esperado ${expected}, recebido ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `Esperado um de [${values.join(', ')}], recebido ${received}`,

  // Special type validation messages
  expectedUndefined: 'Esperado undefined',
  neverType: 'Tipo never não pode ser analisado',

  // New advanced type validation messages
  invalidBigint: 'Bigint inválido',
  invalidSymbol: 'Símbolo inválido',
  invalidTuple: 'Tupla inválida',
  tupleLength: (expected: number, received: number) => `Tupla deve ter exactamente ${expected} elementos, recebidos ${received}`,
  invalidRecord: 'Registo inválido',
  invalidSet: 'Set inválido',
  invalidMap: 'Map inválido',
  
  // Transformation and refinement messages
  transformError: (error: string) => `Transformação falhou: ${error}`,
  refinementError: (error: string) => `Refinamento falhou: ${error}`,
  customValidationError: (error: string) => `Validação personalizada falhou: ${error}`,
  
  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `Não é possível converter ${JSON.stringify(value)} para ${type}`,
  
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
  expectedString: 'Expected string',
  stringExpected: (received: string, expected: string) => `Esperado ${expected}, recebido ${received}`,
  stringBoolExpected: (validValues: string, received: string) => `String boolean inválida. Esperado um de: ${validValues}, recebido: "${received}"`,
  invalidJson: 'JSON inválido',
  stringPatternInvalid: 'A string não corresponde ao padrão necessário',

  // File validation messages
  invalidFile: 'Expected a File object',
  fileNotSupported: 'File API not supported in this environment',
  fileMinSize: (min: number) => `File size must be at least ${min} bytes`,
  fileMaxSize: (max: number) => `File size must not exceed ${max} bytes`,
  fileMimeType: (allowed: string[]) => `Invalid file type. Expected: ${allowed.join(", ")}`,
  // Function validation messages
  invalidFunction: 'Uma função é esperada',

  // CIDR validation messages
  stringCidrv4: 'Bloco CIDR IPv4 inválido',
  stringCidrv6: 'Bloco CIDR IPv6 inválido',

  // Safe extend validation messages
  safeExtendOverlap: (keys: string[]) => `Não é possível substituir chaves existentes: ${keys.join(', ')}. Use extend() se quiser substituir.`
};
