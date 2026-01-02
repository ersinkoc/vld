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

  // Intersection validation messages
  intersectionError: (error: string) => `Uthibitisho wa intersection umeshindwa: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `Ilitegemewa ${expected}, ilipokewa ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `Ilitegemewa moja ya [${values.join(', ')}], ilipokewa ${received}`,

  // Special type validation messages
  expectedUndefined: 'Ilitegemewa undefined',
  neverType: 'Aina ya never haiwezi kuchakatwa',

  // New advanced type validation messages
  invalidBigint: 'Bigint si sahihi',
  invalidSymbol: 'Ishara si sahihi',
  invalidTuple: 'Jozi si sahihi',
  tupleLength: (expected: number, received: number) => `Jozi lazima iwe na vipengele ${expected} haswa, ilipokewa ${received}`,
  invalidRecord: 'Rekodi si sahihi',
  invalidSet: 'Set si sahihi',
  invalidMap: 'Ramani si sahihi',
  
  // Transformation and refinement messages
  transformError: (error: string) => `Mageuzi yameshindwa: ${error}`,
  refinementError: (error: string) => `Uboresha umeshindwa: ${error}`,
  customValidationError: (error: string) => `Uthibitisho wa kawaida umeshindwa: ${error}`,
  
  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `Haiwezi kulazimisha ${JSON.stringify(value)} kuwa ${type}`,
  
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
  stringExpected: (received: string, expected: string) => `Ilitegemewa ${expected}, ilipokewa ${received}`,
  stringBoolExpected: (validValues: string, received: string) => `Mfuatano wa boolean usio sahihi. Moja ya zifuatazo ilitegemewa: ${validValues}, ilipokewa: "${received}"`,
  invalidJson: 'JSON si sahihi',
  stringPatternInvalid: 'Mfuatano haufanani na mfano uliohitajika',

  // File validation messages
  invalidFile: 'Expected a File object',
  fileNotSupported: 'File API not supported in this environment',
  fileMinSize: (min: number) => `File size must be at least ${min} bytes`,
  fileMaxSize: (max: number) => `File size must not exceed ${max} bytes`,
  fileMimeType: (allowed: string[]) => `Invalid file type. Expected: ${allowed.join(", ")}`,
  // Function validation messages
  invalidFunction: 'Kazi inatarajiwa',

  // CIDR validation messages
  stringCidrv4: 'Kizuizi cha CIDR IPv4 si sahihi',
  stringCidrv6: 'Kizuizi cha CIDR IPv6 si sahihi',

  // Safe extend validation messages
  safeExtendOverlap: (keys: string[]) => `Haiwezi kuandika juu ya funguo zilizo tayari: ${keys.join(', ')}. Tumia extend() kuandika juu.`
};
