import { LocaleMessages } from './types';

export const nl: LocaleMessages = {
  // String validation messages
  invalidString: 'Ongeldige string',
  stringMin: (min: number) => `String moet ten minste ${min} tekens lang zijn`,
  stringMax: (max: number) => `String mag niet meer dan ${max} tekens lang zijn`,
  stringLength: (length: number) => `String moet precies ${length} tekens lang zijn`,
  stringEmail: 'Ongeldig e-mailadres',
  stringUrl: 'Ongeldige URL',
  stringUuid: 'Ongeldige UUID',
  stringRegex: 'Ongeldig formaat',
  stringStartsWith: (prefix: string) => `String moet beginnen met "${prefix}"`,
  stringEndsWith: (suffix: string) => `String moet eindigen met "${suffix}"`,
  stringIncludes: (substring: string) => `String moet "${substring}" bevatten`,
  stringIp: 'Ongeldig IP-adres',
  stringIpv4: 'Ongeldig IPv4-adres',
  stringIpv6: 'Ongeldig IPv6-adres',
  stringEmpty: 'String mag niet leeg zijn',

  // Number validation messages
  invalidNumber: 'Ongeldig getal',
  numberMin: (min: number) => `Getal moet ten minste ${min} zijn`,
  numberMax: (max: number) => `Getal mag niet meer dan ${max} zijn`,
  numberInt: 'Getal moet een geheel getal zijn',
  numberPositive: 'Getal moet positief zijn',
  numberNegative: 'Getal moet negatief zijn',
  numberNonnegative: 'Getal mag niet negatief zijn',
  numberNonpositive: 'Getal mag niet positief zijn',
  numberFinite: 'Getal moet eindig zijn',
  numberSafe: 'Getal moet een veilig geheel getal zijn',
  numberMultipleOf: (value: number) => `Getal moet een veelvoud van ${value} zijn`,

  // Boolean validation messages
  invalidBoolean: 'Ongeldige boolean waarde',

  // Date validation messages
  invalidDate: 'Ongeldige datum',
  dateMin: (date: Date) => `Datum moet na ${date.toISOString()} zijn`,
  dateMax: (date: Date) => `Datum moet voor ${date.toISOString()} zijn`,

  // Object validation messages
  invalidObject: 'Ongeldig object',
  unexpectedKeys: (keys: string[]) => `Onverwachte sleutels: ${keys.join(', ')}`,

  // Array validation messages
  invalidArray: 'Ongeldige array',
  arrayMin: (min: number) => `Array moet ten minste ${min} elementen hebben`,
  arrayMax: (max: number) => `Array mag niet meer dan ${max} elementen hebben`,
  arrayLength: (length: number) => `Array moet precies ${length} elementen hebben`,
  arrayEmpty: 'Array mag niet leeg zijn',
  arrayItem: (index: number, error: string) => `Ongeldig element op index ${index}: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `Ongeldig veld "${field}": ${error}`,

  // Union validation messages
  unionNoMatch: (errors: string[]) => `Geen union lid kwam overeen: ${errors.join(', ')}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `Verwacht ${expected}, ontvangen ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `Verwacht een van [${values.join(', ')}], ontvangen ${received}`,

  // Special type validation messages
  expectedUndefined: 'Verwacht undefined',
  neverType: 'Never type kan niet worden geparseerd'
};