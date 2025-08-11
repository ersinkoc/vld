import { LocaleMessages } from './types';

export const pl: LocaleMessages = {
  // String validation messages
  invalidString: 'Nieprawidłowy ciąg znaków',
  stringMin: (min: number) => `Ciąg znaków musi mieć co najmniej ${min} znaków`,
  stringMax: (max: number) => `Ciąg znaków nie może mieć więcej niż ${max} znaków`,
  stringLength: (length: number) => `Ciąg znaków musi mieć dokładnie ${length} znaków`,
  stringEmail: 'Nieprawidłowy adres email',
  stringUrl: 'Nieprawidłowy URL',
  stringUuid: 'Nieprawidłowy UUID',
  stringRegex: 'Nieprawidłowy format',
  stringStartsWith: (prefix: string) => `Ciąg znaków musi zaczynać się od "${prefix}"`,
  stringEndsWith: (suffix: string) => `Ciąg znaków musi kończyć się na "${suffix}"`,
  stringIncludes: (substring: string) => `Ciąg znaków musi zawierać "${substring}"`,
  stringIp: 'Nieprawidłowy adres IP',
  stringIpv4: 'Nieprawidłowy adres IPv4',
  stringIpv6: 'Nieprawidłowy adres IPv6',
  stringEmpty: 'Ciąg znaków nie może być pusty',

  // Number validation messages
  invalidNumber: 'Nieprawidłowa liczba',
  numberMin: (min: number) => `Liczba musi być co najmniej ${min}`,
  numberMax: (max: number) => `Liczba nie może być większa niż ${max}`,
  numberInt: 'Liczba musi być liczbą całkowitą',
  numberPositive: 'Liczba musi być dodatnia',
  numberNegative: 'Liczba musi być ujemna',
  numberNonnegative: 'Liczba nie może być ujemna',
  numberNonpositive: 'Liczba nie może być dodatnia',
  numberFinite: 'Liczba musi być skończona',
  numberSafe: 'Liczba musi być bezpieczną liczbą całkowitą',
  numberMultipleOf: (value: number) => `Liczba musi być wielokrotnością ${value}`,

  // Boolean validation messages
  invalidBoolean: 'Nieprawidłowa wartość boolean',

  // Date validation messages
  invalidDate: 'Nieprawidłowa data',
  dateMin: (date: Date) => `Data musi być po ${date.toISOString()}`,
  dateMax: (date: Date) => `Data musi być przed ${date.toISOString()}`,

  // Object validation messages
  invalidObject: 'Nieprawidłowy obiekt',
  unexpectedKeys: (keys: string[]) => `Nieoczekiwane klucze: ${keys.join(', ')}`,

  // Array validation messages
  invalidArray: 'Nieprawidłowa tablica',
  arrayMin: (min: number) => `Tablica musi mieć co najmniej ${min} elementów`,
  arrayMax: (max: number) => `Tablica nie może mieć więcej niż ${max} elementów`,
  arrayLength: (length: number) => `Tablica musi mieć dokładnie ${length} elementów`,
  arrayEmpty: 'Tablica nie może być pusta',
  arrayItem: (index: number, error: string) => `Nieprawidłowy element na indeksie ${index}: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `Nieprawidłowe pole "${field}": ${error}`,

  // Union validation messages
  unionNoMatch: (errors: string[]) => `Żaden członek unii nie pasował: ${errors.join(', ')}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `Oczekiwano ${expected}, otrzymano ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `Oczekiwano jednego z [${values.join(', ')}], otrzymano ${received}`,

  // Special type validation messages
  expectedUndefined: 'Oczekiwano undefined',
  neverType: 'Typ never nie może być przeanalizowany',

  // New advanced type validation messages
  invalidBigint: 'Nieprawidłowy bigint',
  invalidSymbol: 'Nieprawidłowy symbol',
  invalidTuple: 'Nieprawidłowa krotka',
  tupleLength: (expected: number, received: number) => `Krotka musi mieć dokładnie ${expected} elementów, otrzymano ${received}`,
  invalidRecord: 'Nieprawidłowy rekord',
  invalidSet: 'Nieprawidłowy Set',
  invalidMap: 'Nieprawidłowa Map',
  
  // Transformation and refinement messages
  transformError: (error: string) => `Transformacja nie powiodła się: ${error}`,
  refinementError: (error: string) => `Rafinacja nie powiodła się: ${error}`,
  
  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `Nie można przekształcić ${JSON.stringify(value)} na ${type}`
};