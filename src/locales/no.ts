import { LocaleMessages } from './types';

export const no: LocaleMessages = {
  // String validation messages
  invalidString: 'Ugyldig streng',
  stringMin: (min: number) => `Streng må være minst ${min} tegn lang`,
  stringMax: (max: number) => `Streng kan være maks ${max} tegn lang`,
  stringLength: (length: number) => `Streng må være nøyaktig ${length} tegn lang`,
  stringEmail: 'Ugyldig e-postadresse',
  stringUrl: 'Ugyldig URL',
  stringUuid: 'Ugyldig UUID',
  stringRegex: 'Ugyldig format',
  stringStartsWith: (prefix: string) => `Streng må starte med "${prefix}"`,
  stringEndsWith: (suffix: string) => `Streng må slutte med "${suffix}"`,
  stringIncludes: (substring: string) => `Streng må inneholde "${substring}"`,
  stringIp: 'Ugyldig IP-adresse',
  stringIpv4: 'Ugyldig IPv4-adresse',
  stringIpv6: 'Ugyldig IPv6-adresse',
  stringEmpty: 'Streng kan ikke være tom',

  // Number validation messages
  invalidNumber: 'Ugyldig tall',
  numberMin: (min: number) => `Tall må være minst ${min}`,
  numberMax: (max: number) => `Tall kan være maks ${max}`,
  numberInt: 'Tall må være et heltall',
  numberPositive: 'Tall må være positivt',
  numberNegative: 'Tall må være negativt',
  numberNonnegative: 'Tall kan ikke være negativt',
  numberNonpositive: 'Tall kan ikke være positivt',
  numberFinite: 'Tall må være endelig',
  numberSafe: 'Tall må være et trygt heltall',
  numberMultipleOf: (value: number) => `Tall må være et multiplum av ${value}`,

  // Boolean validation messages
  invalidBoolean: 'Ugyldig boolean-verdi',

  // Date validation messages
  invalidDate: 'Ugyldig dato',
  dateMin: (date: Date) => `Dato må være etter ${date.toISOString()}`,
  dateMax: (date: Date) => `Dato må være før ${date.toISOString()}`,

  // Object validation messages
  invalidObject: 'Ugyldig objekt',
  unexpectedKeys: (keys: string[]) => `Uventede nøkler: ${keys.join(', ')}`,

  // Array validation messages
  invalidArray: 'Ugyldig array',
  arrayMin: (min: number) => `Array må ha minst ${min} elementer`,
  arrayMax: (max: number) => `Array kan ha maks ${max} elementer`,
  arrayLength: (length: number) => `Array må ha nøyaktig ${length} elementer`,
  arrayEmpty: 'Array kan ikke være tom',
  arrayItem: (index: number, error: string) => `Ugyldig element ved indeks ${index}: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `Ugyldig felt "${field}": ${error}`,

  // Union validation messages
  unionNoMatch: (errors: string[]) => `Ingen union-medlem passet: ${errors.join(', ')}`,

  // Intersection validation messages
  intersectionError: (error: string) => `Intersection validering feilet: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `Forventet ${expected}, fikk ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `Forventet en av [${values.join(', ')}], fikk ${received}`,

  // Special type validation messages
  expectedUndefined: 'Forventet undefined',
  neverType: 'Never-type kan ikke parses',

  // New advanced type validation messages
  invalidBigint: 'Ugyldig bigint',
  invalidSymbol: 'Ugyldig symbol',
  invalidTuple: 'Ugyldig tuppel',
  tupleLength: (expected: number, received: number) => `Tuppel må ha nøyaktig ${expected} elementer, fikk ${received}`,
  invalidRecord: 'Ugyldig post',
  invalidSet: 'Ugyldig Set',
  invalidMap: 'Ugyldig Map',
  
  // Transformation and refinement messages
  transformError: (error: string) => `Transformasjon mislyktes: ${error}`,
  refinementError: (error: string) => `Foredling mislyktes: ${error}`,
  customValidationError: (error: string) => `Tilpasset validering mislyktes: ${error}`,
  
  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `Kan ikke konvertere ${JSON.stringify(value)} til ${type}`
};