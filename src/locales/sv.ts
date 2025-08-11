import { LocaleMessages } from './types';

export const sv: LocaleMessages = {
  // String validation messages
  invalidString: 'Ogiltig sträng',
  stringMin: (min: number) => `Sträng måste vara minst ${min} tecken lång`,
  stringMax: (max: number) => `Sträng får vara högst ${max} tecken lång`,
  stringLength: (length: number) => `Sträng måste vara exakt ${length} tecken lång`,
  stringEmail: 'Ogiltig e-postadress',
  stringUrl: 'Ogiltig URL',
  stringUuid: 'Ogiltig UUID',
  stringRegex: 'Ogiltigt format',
  stringStartsWith: (prefix: string) => `Sträng måste börja med "${prefix}"`,
  stringEndsWith: (suffix: string) => `Sträng måste sluta med "${suffix}"`,
  stringIncludes: (substring: string) => `Sträng måste innehålla "${substring}"`,
  stringIp: 'Ogiltig IP-adress',
  stringIpv4: 'Ogiltig IPv4-adress',
  stringIpv6: 'Ogiltig IPv6-adress',
  stringEmpty: 'Sträng får inte vara tom',

  // Number validation messages
  invalidNumber: 'Ogiltigt nummer',
  numberMin: (min: number) => `Nummer måste vara minst ${min}`,
  numberMax: (max: number) => `Nummer får vara högst ${max}`,
  numberInt: 'Nummer måste vara ett heltal',
  numberPositive: 'Nummer måste vara positivt',
  numberNegative: 'Nummer måste vara negativt',
  numberNonnegative: 'Nummer får inte vara negativt',
  numberNonpositive: 'Nummer får inte vara positivt',
  numberFinite: 'Nummer måste vara ändligt',
  numberSafe: 'Nummer måste vara ett säkert heltal',
  numberMultipleOf: (value: number) => `Nummer måste vara en multipel av ${value}`,

  // Boolean validation messages
  invalidBoolean: 'Ogiltigt boolean-värde',

  // Date validation messages
  invalidDate: 'Ogiltigt datum',
  dateMin: (date: Date) => `Datum måste vara efter ${date.toISOString()}`,
  dateMax: (date: Date) => `Datum måste vara före ${date.toISOString()}`,

  // Object validation messages
  invalidObject: 'Ogiltigt objekt',
  unexpectedKeys: (keys: string[]) => `Oväntade nycklar: ${keys.join(', ')}`,

  // Array validation messages
  invalidArray: 'Ogiltig array',
  arrayMin: (min: number) => `Array måste ha minst ${min} element`,
  arrayMax: (max: number) => `Array får ha högst ${max} element`,
  arrayLength: (length: number) => `Array måste ha exakt ${length} element`,
  arrayEmpty: 'Array får inte vara tom',
  arrayItem: (index: number, error: string) => `Ogiltigt element vid index ${index}: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `Ogiltigt fält "${field}": ${error}`,

  // Union validation messages
  unionNoMatch: (errors: string[]) => `Ingen union-medlem matchade: ${errors.join(', ')}`,

  // Intersection validation messages
  intersectionError: (error: string) => `Intersection validering misslyckades: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `Förväntade ${expected}, fick ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `Förväntade en av [${values.join(', ')}], fick ${received}`,

  // Special type validation messages
  expectedUndefined: 'Förväntade undefined',
  neverType: 'Never-typ kan inte parsas',

  // New advanced type validation messages
  invalidBigint: 'Ogiltig bigint',
  invalidSymbol: 'Ogiltig symbol',
  invalidTuple: 'Ogiltig tupel',
  tupleLength: (expected: number, received: number) => `Tupel måste ha exakt ${expected} element, fick ${received}`,
  invalidRecord: 'Ogiltig post',
  invalidSet: 'Ogiltig Set',
  invalidMap: 'Ogiltig Map',
  
  // Transformation and refinement messages
  transformError: (error: string) => `Transformation misslyckades: ${error}`,
  refinementError: (error: string) => `Förfining misslyckades: ${error}`,
  customValidationError: (error: string) => `Anpassad validering misslyckades: ${error}`,
  
  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `Kan inte konvertera ${JSON.stringify(value)} till ${type}`
};