import { LocaleMessages } from './types';

export const fi: LocaleMessages = {
  // String validation messages
  invalidString: 'Virheellinen merkkijono',
  stringMin: (min: number) => `Merkkijonon tulee olla vähintään ${min} merkkiä pitkä`,
  stringMax: (max: number) => `Merkkijono saa olla enintään ${max} merkkiä pitkä`,
  stringLength: (length: number) => `Merkkijonon tulee olla täsmälleen ${length} merkkiä pitkä`,
  stringEmail: 'Virheellinen sähköpostiosoite',
  stringUrl: 'Virheellinen URL',
  stringUuid: 'Virheellinen UUID',
  stringRegex: 'Virheellinen muoto',
  stringStartsWith: (prefix: string) => `Merkkijonon tulee alkaa merkeillä "${prefix}"`,
  stringEndsWith: (suffix: string) => `Merkkijonon tulee päättyä merkkeihin "${suffix}"`,
  stringIncludes: (substring: string) => `Merkkijonon tulee sisältää "${substring}"`,
  stringIp: 'Virheellinen IP-osoite',
  stringIpv4: 'Virheellinen IPv4-osoite',
  stringIpv6: 'Virheellinen IPv6-osoite',
  stringEmpty: 'Merkkijono ei saa olla tyhjä',

  // Number validation messages
  invalidNumber: 'Virheellinen luku',
  numberMin: (min: number) => `Luvun tulee olla vähintään ${min}`,
  numberMax: (max: number) => `Luku saa olla enintään ${max}`,
  numberInt: 'Luvun tulee olla kokonaisluku',
  numberPositive: 'Luvun tulee olla positiivinen',
  numberNegative: 'Luvun tulee olla negatiivinen',
  numberNonnegative: 'Luku ei saa olla negatiivinen',
  numberNonpositive: 'Luku ei saa olla positiivinen',
  numberFinite: 'Luvun tulee olla äärellinen',
  numberSafe: 'Luvun tulee olla turvallinen kokonaisluku',
  numberMultipleOf: (value: number) => `Luvun tulee olla ${value}:n kerrannainen`,

  // Boolean validation messages
  invalidBoolean: 'Virheellinen totuusarvo',

  // Date validation messages
  invalidDate: 'Virheellinen päivämäärä',
  dateMin: (date: Date) => `Päivämäärän tulee olla ${date.toISOString()} jälkeen`,
  dateMax: (date: Date) => `Päivämäärän tulee olla ennen ${date.toISOString()}`,

  // Object validation messages
  invalidObject: 'Virheellinen objekti',
  unexpectedKeys: (keys: string[]) => `Odottamattomat avaimet: ${keys.join(', ')}`,

  // Array validation messages
  invalidArray: 'Virheellinen taulukko',
  arrayMin: (min: number) => `Taulukossa tulee olla vähintään ${min} alkiota`,
  arrayMax: (max: number) => `Taulukossa saa olla enintään ${max} alkiota`,
  arrayLength: (length: number) => `Taulukossa tulee olla täsmälleen ${length} alkiota`,
  arrayEmpty: 'Taulukko ei saa olla tyhjä',
  arrayItem: (index: number, error: string) => `Virheellinen alkio indeksissä ${index}: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `Virheellinen kenttä "${field}": ${error}`,

  // Union validation messages
  unionNoMatch: (errors: string[]) => `Mikään union-jäsen ei täsmännyt: ${errors.join(', ')}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `Odotettiin ${expected}, saatiin ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `Odotettiin yhtä arvoista [${values.join(', ')}], saatiin ${received}`,

  // Special type validation messages
  expectedUndefined: 'Odotettiin undefined',
  neverType: 'Never-tyyppiä ei voida jäsentää'
};