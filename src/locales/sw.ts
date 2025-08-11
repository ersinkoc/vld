import { LocaleMessages } from './types';

export const sw: LocaleMessages = {
  // String validation messages
  invalidString: 'Mfuatano usio sahihi',
  stringMin: (min: number) => `Mfuatano lazima uwe na angalau vibambo ${min}`,
  stringMax: (max: number) => `Mfuatano hauwezi kuwa na zaidi ya vibambo ${max}`,
  stringLength: (length: number) => `Mfuatano lazima uwe na vibambo ${length} haswa`,
  stringEmail: 'Anwani ya barua pepe si sahihi',
  stringUrl: 'URL si sahihi',
  stringUuid: 'UUID si sahihi',
  stringRegex: 'Muundo usio sahihi',
  stringStartsWith: (prefix: string) => `Mfuatano lazima uanze na "${prefix}"`,
  stringEndsWith: (suffix: string) => `Mfuatano lazima umalize na "${suffix}"`,
  stringIncludes: (substring: string) => `Mfuatano lazima ujumuishe "${substring}"`,
  stringIp: 'Anwani ya IP si sahihi',
  stringIpv4: 'Anwani ya IPv4 si sahihi',
  stringIpv6: 'Anwani ya IPv6 si sahihi',
  stringEmpty: 'Mfuatano hauwezi kuwa tupu',

  // Number validation messages
  invalidNumber: 'Nambari si sahihi',
  numberMin: (min: number) => `Nambari lazima iwe angalau ${min}`,
  numberMax: (max: number) => `Nambari haiwezi kuwa zaidi ya ${max}`,
  numberInt: 'Nambari lazima iwe nzima',
  numberPositive: 'Nambari lazima iwe chanya',
  numberNegative: 'Nambari lazima iwe hasi',
  numberNonnegative: 'Nambari haiwezi kuwa hasi',
  numberNonpositive: 'Nambari haiwezi kuwa chanya',
  numberFinite: 'Nambari lazima iwe ya mwisho',
  numberSafe: 'Nambari lazima iwe nzima salama',
  numberMultipleOf: (value: number) => `Nambari lazima iwe mzidadi wa ${value}`,

  // Boolean validation messages
  invalidBoolean: 'Thamani ya boolean si sahihi',

  // Date validation messages
  invalidDate: 'Tarehe si sahihi',
  dateMin: (date: Date) => `Tarehe lazima iwe baada ya ${date.toISOString()}`,
  dateMax: (date: Date) => `Tarehe lazima iwe kabla ya ${date.toISOString()}`,

  // Object validation messages
  invalidObject: 'Kitu si sahihi',
  unexpectedKeys: (keys: string[]) => `Funguo zisizotarajiwa: ${keys.join(', ')}`,

  // Array validation messages
  invalidArray: 'Safu si sahihi',
  arrayMin: (min: number) => `Safu lazima iwe na angalau vipengele ${min}`,
  arrayMax: (max: number) => `Safu haiwezi kuwa na zaidi ya vipengele ${max}`,
  arrayLength: (length: number) => `Safu lazima iwe na vipengele ${length} haswa`,
  arrayEmpty: 'Safu haiwezi kuwa tupu',
  arrayItem: (index: number, error: string) => `Kipengele kisicho sahihi kwenye uhurizo ${index}: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `Uwanda "${field}" usio sahihi: ${error}`,

  // Union validation messages
  unionNoMatch: (errors: string[]) => `Hakuna mwanachama wa umoja aliyelingana: ${errors.join(', ')}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `Ilitegemewa ${expected}, ilipokewa ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `Ilitegemewa moja ya [${values.join(', ')}], ilipokewa ${received}`,

  // Special type validation messages
  expectedUndefined: 'Ilitegemewa undefined',
  neverType: 'Aina ya never haiwezi kuchakatwa'
};