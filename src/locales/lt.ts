import { LocaleMessages } from './types';

// Lithuanian (ported 2026-10-27)
export const lt: LocaleMessages = {
  // String validation messages
  invalidString: 'Netinkama eilutė',
  stringMin: (min: number) => `Eilutė turi būti bent ${min} simbolių ilgio`,
  stringMax: (max: number) => `Eilutė turi būti daugiausia ${max} simbolių ilgio`,
  stringLength: (length: number) => `Eilutė turi būti lygiai ${length} simbolių ilgio`,
  stringEmail: 'Netinkamas el. pašto adresas',
  stringUrl: 'Netinkamas URL',
  stringUuid: 'Netinkamas UUID',
  stringRegex: 'Netinkamas formatas',
  stringStartsWith: (prefix: string) => `Eilutė turi prasidėti "${prefix}"`,
  stringEndsWith: (suffix: string) => `Eilutė turi baigtis "${suffix}"`,
  stringIncludes: (substring: string) => `Eilutė turi turėti "${substring}"`,
  stringIp: 'Netinkamas IP adresas',
  stringIpv4: 'Netinkamas IPv4 adresas',
  stringIpv6: 'Netinkamas IPv6 adresas',
  stringEmpty: 'Eilutė negali būti tuščia',

  // Number validation messages
  invalidNumber: 'Netinkamas skaičius',
  numberMin: (min: number) => `Skaičius turi būti bent ${min}`,
  numberMax: (max: number) => `Skaičius turi būti daugiausia ${max}`,
  numberInt: 'Skaičius turi būti sveikasis',
  numberPositive: 'Skaičius turi būti teigiamas',
  numberNegative: 'Skaičius turi būti neigiamas',
  numberNonnegative: 'Skaičius negali būti neigiamas',
  numberNonpositive: 'Skaičius negali būti teigiamas',
  numberFinite: 'Skaičius turi būti baigtinis',
  numberSafe: 'Skaičius turi būti saugus sveikasis skaičius',
  numberMultipleOf: (value: number) => `Skaičius turi būti ${value} kartotinis`,

  // Boolean validation messages
  invalidBoolean: 'Netinkama loginė reikšmė',

  // Date validation messages
  invalidDate: 'Netinkama data',
  dateMin: (date: Date) => `Data turi būti po ${date.toISOString()}`,
  dateMax: (date: Date) => `Data turi būti prieš ${date.toISOString()}`,

  // Object validation messages
  invalidObject: 'Netinkamas objektas',
  unexpectedKeys: (keys: string[]) => `Netikėti raktai: ${keys.join(', ')}`,
  requiredField: (field: string) => `Trūksta privalomo lauko "${field}"`,

  // Array validation messages
  invalidArray: 'Netinkamas masyvas',
  arrayMin: (min: number) => `Masyvas turi turėti bent ${min} elementų`,
  arrayMax: (max: number) => `Masyvas turi turėti daugiausia ${max} elementų`,
  arrayLength: (length: number) => `Masyvas turi turėti lygiai ${length} elementų`,
  arrayEmpty: 'Masyvas negali būti tuščias',
  arrayItem: (index: number, error: string) => `Netinkamas elementas indeksu ${index}: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `Netinkamas laukas "${field}": ${error}`,

  // Union validation messages
  unionNoMatch: () => `Netinkama įvestis`,

  // Intersection validation messages
  intersectionError: (error: string) => `Sankirtos tikrinimo klaida: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `Tikėtasi ${expected}, gauta ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `Tikėtasi vieno iš [${values.join(', ')}], gauta ${received}`,

  // Special type validation messages
  expectedUndefined: 'Tikėtasi undefined',
  neverType: 'Never tipo negalima apdoroti',

  // New advanced type validation messages
  invalidBigint: 'Netinkamas bigint',
  invalidSymbol: 'Netinkamas symbol',
  invalidTuple: 'Netinkamas kortežas',
  tupleLength: (expected: number, received: number) => `Kortežas turi turėti lygiai ${expected} elementų, gauta ${received}`,
  invalidRecord: 'Netinkamas įrašas',
  invalidSet: 'Netinkamas rinkinys',
  invalidMap: 'Netinkamas žemėlapis',

  // Transformation and refinement messages
  transformError: (error: string) => `Transformacijos klaida: ${error}`,
  refinementError: (error: string) => `Patikslinimo klaida: ${error}`,
  customValidationError: (error: string) => `Pasirinktinio tikrinimo klaida: ${error}`,

  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `Nepavyko konvertuoti ${JSON.stringify(value)} į ${type}`,

  // Codec messages
  codecDecodeFailed: 'Nepavyko iškoduoti reikšmės',
  codecEncodeFailed: 'Nepavyko užkoduoti reikšmės',
  codecAsyncNotSupported: 'Asinchroninės kodeko operacijos reikalauja parseAsync/encodeAsync metodų',

  // Base64/Hex messages
  invalidBase64: 'Netinkama base64 eilutė',
  invalidHex: 'Netinkama šešioliktainė eilutė',

  // Uint8Array messages
  expectedUint8Array: 'Tikėtasi Uint8Array',
  uint8ArrayMinLength: (min: number) => `Uint8Array turi būti bent ${min} baitų`,
  uint8ArrayMaxLength: (max: number) => `Uint8Array turi būti daugiausia ${max} baitų`,
  uint8ArrayExactLength: (length: number) => `Uint8Array turi būti lygiai ${length} baitų`,

  // Generic type error messages
  expectedString: 'Tikėtasi eilutės',
  stringExpected: (received: string, expected: string) => `Tikėtasi ${expected}, gauta ${received}`,
  stringBoolExpected: (validValues: string, received: string) => `Netinkama loginė eilutė. Tikėtasi vienos iš: ${validValues}, gauta "${received}"`,
  invalidJson: 'Netinkamas JSON',
  stringPatternInvalid: 'Eilutė neatitinka reikalaujamo šablono',

  // File validation messages
  invalidFile: 'Tikėtasi File objekto',
  fileNotSupported: 'File API nepalaikoma šioje aplinkoje',
  fileMinSize: (min: number) => `Failo dydis turi būti bent ${min} baitų`,
  fileMaxSize: (max: number) => `Failo dydis negali viršyti ${max} baitų`,
  fileMimeType: (allowed: string[]) => `Netinkamas failo tipas. Tikėtasi: ${allowed.join(', ')}`,

  // Function validation messages
  invalidFunction: 'Tikėtasi funkcijos',

  // CIDR validation messages
  stringCidrv4: 'Netinkamas IPv4 CIDR blokas',
  stringCidrv6: 'Netinkamas IPv6 CIDR blokas',

  // Safe extend validation messages
  safeExtendOverlap: (keys: string[]) => `Negalima perrašyti egzistuojančių raktų: ${keys.join(', ')}. Naudokite extend(), jei norite perrašyti.`,
};
