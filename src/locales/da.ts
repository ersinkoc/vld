import { LocaleMessages } from './types';

export const da: LocaleMessages = {
  // String validation messages
  invalidString: 'Ugyldig streng',
  stringMin: (min: number) => `Streng skal være mindst ${min} tegn lang`,
  stringMax: (max: number) => `Streng må højst være ${max} tegn lang`,
  stringLength: (length: number) => `Streng skal være præcis ${length} tegn lang`,
  stringEmail: 'Ugyldig e-mailadresse',
  stringUrl: 'Ugyldig URL',
  stringUuid: 'Ugyldig UUID',
  stringRegex: 'Ugyldigt format',
  stringStartsWith: (prefix: string) => `Streng skal starte med "${prefix}"`,
  stringEndsWith: (suffix: string) => `Streng skal slutte med "${suffix}"`,
  stringIncludes: (substring: string) => `Streng skal indeholde "${substring}"`,
  stringIp: 'Ugyldig IP-adresse',
  stringIpv4: 'Ugyldig IPv4-adresse',
  stringIpv6: 'Ugyldig IPv6-adresse',
  stringEmpty: 'Streng må ikke være tom',

  // Number validation messages
  invalidNumber: 'Ugyldigt tal',
  numberMin: (min: number) => `Tal skal være mindst ${min}`,
  numberMax: (max: number) => `Tal må højst være ${max}`,
  numberInt: 'Tal skal være et heltal',
  numberPositive: 'Tal skal være positivt',
  numberNegative: 'Tal skal være negativt',
  numberNonnegative: 'Tal må ikke være negativt',
  numberNonpositive: 'Tal må ikke være positivt',
  numberFinite: 'Tal skal være endeligt',
  numberSafe: 'Tal skal være et sikkert heltal',
  numberMultipleOf: (value: number) => `Tal skal være et multiplum af ${value}`,

  // Boolean validation messages
  invalidBoolean: 'Ugyldig boolean-værdi',

  // Date validation messages
  invalidDate: 'Ugyldig dato',
  dateMin: (date: Date) => `Dato skal være efter ${date.toISOString()}`,
  dateMax: (date: Date) => `Dato skal være før ${date.toISOString()}`,

  // Object validation messages
  invalidObject: 'Ugyldigt objekt',
  unexpectedKeys: (keys: string[]) => `Uventede nøgler: ${keys.join(', ')}`,

  // Array validation messages
  invalidArray: 'Ugyldigt array',
  arrayMin: (min: number) => `Array skal have mindst ${min} elementer`,
  arrayMax: (max: number) => `Array må højst have ${max} elementer`,
  arrayLength: (length: number) => `Array skal have præcis ${length} elementer`,
  arrayEmpty: 'Array må ikke være tomt',
  arrayItem: (index: number, error: string) => `Ugyldigt element ved indeks ${index}: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `Ugyldigt felt "${field}": ${error}`,

  // Union validation messages
  unionNoMatch: (errors: string[]) => `Intet union-medlem matchede: ${errors.join(', ')}`,

  // Intersection validation messages
  intersectionError: (error: string) => `Intersection validering fejlede: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `Forventede ${expected}, fik ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `Forventede en af [${values.join(', ')}], fik ${received}`,

  // Special type validation messages
  expectedUndefined: 'Forventede undefined',
  neverType: 'Never-type kan ikke parses',

  // New advanced type validation messages
  invalidBigint: 'Ugyldig bigint',
  invalidSymbol: 'Ugyldigt symbol',
  invalidTuple: 'Ugyldig tupel',
  tupleLength: (expected: number, received: number) => `Tupel skal have præcis ${expected} elementer, fik ${received}`,
  invalidRecord: 'Ugyldig post',
  invalidSet: 'Ugyldigt Set',
  invalidMap: 'Ugyldig Map',
  
  // Transformation and refinement messages
  transformError: (error: string) => `Transformation fejlede: ${error}`,
  refinementError: (error: string) => `Forfinelse fejlede: ${error}`,
  customValidationError: (error: string) => `Brugerdefineret validering mislykkedes: ${error}`,
  
  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `Kan ikke konvertere ${JSON.stringify(value)} til ${type}`
};