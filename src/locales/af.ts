import { LocaleMessages } from './types';

export const af: LocaleMessages = {
  // String validation messages
  invalidString: 'Ongeldige string',
  stringMin: (min: number) => `String moet ten minste ${min} karakters lank wees`,
  stringMax: (max: number) => `String mag hoogstens ${max} karakters lank wees`,
  stringLength: (length: number) => `String moet presies ${length} karakters lank wees`,
  stringEmail: 'Ongeldige e-pos adres',
  stringUrl: 'Ongeldige URL',
  stringUuid: 'Ongeldige UUID',
  stringRegex: 'Ongeldige formaat',
  stringStartsWith: (prefix: string) => `String moet begin met "${prefix}"`,
  stringEndsWith: (suffix: string) => `String moet eindig met "${suffix}"`,
  stringIncludes: (substring: string) => `String moet "${substring}" bevat`,
  stringIp: 'Ongeldige IP adres',
  stringIpv4: 'Ongeldige IPv4 adres',
  stringIpv6: 'Ongeldige IPv6 adres',
  stringEmpty: 'String mag nie leeg wees nie',

  // Number validation messages
  invalidNumber: 'Ongeldige getal',
  numberMin: (min: number) => `Getal moet ten minste ${min} wees`,
  numberMax: (max: number) => `Getal mag hoogstens ${max} wees`,
  numberInt: 'Getal moet \'n heelgetal wees',
  numberPositive: 'Getal moet positief wees',
  numberNegative: 'Getal moet negatief wees',
  numberNonnegative: 'Getal mag nie negatief wees nie',
  numberNonpositive: 'Getal mag nie positief wees nie',
  numberFinite: 'Getal moet eindig wees',
  numberSafe: 'Getal moet \'n veilige heelgetal wees',
  numberMultipleOf: (value: number) => `Getal moet \'n veelvoud van ${value} wees`,

  // Boolean validation messages
  invalidBoolean: 'Ongeldige boolean waarde',

  // Date validation messages
  invalidDate: 'Ongeldige datum',
  dateMin: (date: Date) => `Datum moet na ${date.toISOString()} wees`,
  dateMax: (date: Date) => `Datum moet voor ${date.toISOString()} wees`,

  // Object validation messages
  invalidObject: 'Ongeldige objek',
  unexpectedKeys: (keys: string[]) => `Onverwagte sleutels: ${keys.join(', ')}`,

  // Array validation messages
  invalidArray: 'Ongeldige skikking',
  arrayMin: (min: number) => `Skikking moet ten minste ${min} elemente hê`,
  arrayMax: (max: number) => `Skikking mag hoogstens ${max} elemente hê`,
  arrayLength: (length: number) => `Skikking moet presies ${length} elemente hê`,
  arrayEmpty: 'Skikking mag nie leeg wees nie',
  arrayItem: (index: number, error: string) => `Ongeldige element by indeks ${index}: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `Ongeldige veld "${field}": ${error}`,

  // Union validation messages
  unionNoMatch: (errors: string[]) => `Geen union lid het gepas nie: ${errors.join(', ')}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `Verwag ${expected}, ontvang ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `Verwag een van [${values.join(', ')}], ontvang ${received}`,

  // Special type validation messages
  expectedUndefined: 'Verwag undefined',
  neverType: 'Never tipe kan nie geparseer word nie',

  // New advanced type validation messages
  invalidBigint: 'Ongeldige bigint',
  invalidSymbol: 'Ongeldige simbool',
  invalidTuple: 'Ongeldige tupel',
  tupleLength: (expected: number, received: number) => `Tupel moet presies ${expected} elemente hê, ontvang ${received}`,
  invalidRecord: 'Ongeldige rekord',
  invalidSet: 'Ongeldige Set',
  invalidMap: 'Ongeldige Map',
  
  // Transformation and refinement messages
  transformError: (error: string) => `Transformasie het gefaal: ${error}`,
  refinementError: (error: string) => `Verfyning het gefaal: ${error}`,
  
  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `Kan nie ${JSON.stringify(value)} na ${type} dwing nie`
};