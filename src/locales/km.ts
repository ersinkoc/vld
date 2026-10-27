import { LocaleMessages } from './types';

// Khmer (ported 2026-10-27)
export const km: LocaleMessages = {
  // String validation messages
  invalidString: 'ខ្សែអក្សរមិនត្រឹមត្រូវ',
  stringMin: (min: number) => `ខ្សែអក្សរត្រូវមានយ៉ាងតិច ${min} តួអក្សរ`,
  stringMax: (max: number) => `ខ្សែអក្សរត្រូវមានយ៉ាងច្រើន ${max} តួអក្សរ`,
  stringLength: (length: number) => `ខ្សែអក្សរត្រូវមាន ${length} តួអក្សរពេញលេញ`,
  stringEmail: 'អាសយដ្ឋានអ៊ីមែលមិនត្រឹមត្រូវ',
  stringUrl: 'URL មិនត្រឹមត្រូវ',
  stringUuid: 'UUID មិនត្រឹមត្រូវ',
  stringRegex: 'ទម្រង់មិនត្រឹមត្រូវ',
  stringStartsWith: (prefix: string) => `ខ្សែអក្សរត្រូវចាប់ផ្តើមដោយ "${prefix}"`,
  stringEndsWith: (suffix: string) => `ខ្សែអក្សរត្រូវបញ្ចប់ដោយ "${suffix}"`,
  stringIncludes: (substring: string) => `ខ្សែអក្សរត្រូវមាន "${substring}"`,
  stringIp: 'អាសយដ្ឋាន IP មិនត្រឹមត្រូវ',
  stringIpv4: 'អាសយដ្ឋាន IPv4 មិនត្រឹមត្រូវ',
  stringIpv6: 'អាសយដ្ឋាន IPv6 មិនត្រឹមត្រូវ',
  stringEmpty: 'ខ្សែអក្សរមិនត្រូវទទេឡើយ',

  // Number validation messages
  invalidNumber: 'លេខមិនត្រឹមត្រូវ',
  numberMin: (min: number) => `លេខត្រូវមានយ៉ាងតិច ${min}`,
  numberMax: (max: number) => `លេខត្រូវមានយ៉ាងច្រើន ${max}`,
  numberInt: 'លេខត្រូវជាលេខគត់',
  numberPositive: 'លេខត្រូវជាលេខវិជ្ជមាន',
  numberNegative: 'លេខត្រូវជាលេខអវិជ្ជមាន',
  numberNonnegative: 'លេខមិនត្រូវជាលេខអវិជ្ជមានឡើយ',
  numberNonpositive: 'លេខមិនត្រូវជាលេខវិជ្ជមានឡើយ',
  numberFinite: 'លេខត្រូវមានកំណត់',
  numberSafe: 'លេខត្រូវជាលេខគត់សុវត្ថិភាព',
  numberMultipleOf: (value: number) => `លេខត្រូវជាចំនួនពិជារបស់ ${value}`,

  // Boolean validation messages
  invalidBoolean: 'តម្លៃប៊ូលីនមិនត្រឹមត្រូវ',

  // Date validation messages
  invalidDate: 'កាលបរិច្ឆេទមិនត្រឹមត្រូវ',
  dateMin: (date: Date) => `កាលបរិច្ឆេទត្រូវក្រោយ ${date.toISOString()}`,
  dateMax: (date: Date) => `កាលបរិច្ឆេទត្រូវមុន ${date.toISOString()}`,

  // Object validation messages
  invalidObject: 'វត្ថុមិនត្រឹមត្រូវ',
  unexpectedKeys: (keys: string[]) => `កូនសោដែលមិនរំពឹងទុក៖ ${keys.join(', ')}`,
  requiredField: (field: string) => `បាត់វាលចាំបាច់ "${field}"`,

  // Array validation messages
  invalidArray: 'អារេមិនត្រឹមត្រូវ',
  arrayMin: (min: number) => `អារេត្រូវមានយ៉ាងតិច ${min} ធាតុ`,
  arrayMax: (max: number) => `អារេត្រូវមានយ៉ាងច្រើន ${max} ធាតុ`,
  arrayLength: (length: number) => `អារេត្រូវមាន ${length} ធាតុពេញលេញ`,
  arrayEmpty: 'អារេមិនត្រូវទទេឡើយ',
  arrayItem: (index: number, error: string) => `ធាតុមិនត្រឹមត្រូវនៅក្បាលសន្លឹក ${index}៖ ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `វាលមិនត្រឹមត្រូវ "${field}"៖ ${error}`,

  // Union validation messages
  unionNoMatch: () => `ការបញ្ចូលមិនត្រឹមត្រូវ`,

  // Intersection validation messages
  intersectionError: (error: string) => `កំហុសក្នុងការផ្ទៀងផ្ទាត់ការកាត់ចំណុច៖ ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `រំពឹងទុក ${expected} បានទទួល ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `រំពឹងទុកមួយក្នុងចំណោម [${values.join(', ')}] បានទទួល ${received}`,

  // Special type validation messages
  expectedUndefined: 'រំពឹងទុក undefined',
  neverType: 'ប្រភេទ never មិនអាចញែកបានទេ',

  // New advanced type validation messages
  invalidBigint: 'bigint មិនត្រឹមត្រូវ',
  invalidSymbol: 'symbol មិនត្រឹមត្រូវ',
  invalidTuple: 'ធូបលមិនត្រឹមត្រូវ',
  tupleLength: (expected: number, received: number) => `ធូបលត្រូវមាន ${expected} ធាតុពេញលេញ បានទទួល ${received}`,
  invalidRecord: 'កំណត់ត្រាមិនត្រឹមត្រូវ',
  invalidSet: 'សំណុំមិនត្រឹមត្រូវ',
  invalidMap: 'ផែនទីមិនត្រឹមត្រូវ',

  // Transformation and refinement messages
  transformError: (error: string) => `កំហុសបំលែង៖ ${error}`,
  refinementError: (error: string) => `កំហុសបង្គ្រប់៖ ${error}`,
  customValidationError: (error: string) => `កំហុសផ្ទៀងផ្ទាត់ផ្ទាល់ខ្លួន៖ ${error}`,

  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `មិនអាចបំលែង ${JSON.stringify(value)} ទៅជា ${type} បានទេ`,

  // Codec messages
  codecDecodeFailed: 'បរាជ័យក្នុងការដោះលេខតម្លៃ',
  codecEncodeFailed: 'បរាជ័យក្នុងការអ៊ិនកូដតម្លៃ',
  codecAsyncNotSupported: 'ប្រតិបត្តិការកូដិកអសមកាលកិច្ចត្រូវការវិធីសាស្ត្រ parseAsync/encodeAsync',

  // Base64/Hex messages
  invalidBase64: 'ខ្សែអក្សរ base64 មិនត្រឹមត្រូវ',
  invalidHex: 'ខ្សែអក្សរគោលដប់ប្រាំមួយមិនត្រឹមត្រូវ',

  // Uint8Array messages
  expectedUint8Array: 'រំពឹងទុក Uint8Array',
  uint8ArrayMinLength: (min: number) => `Uint8Array ត្រូវមានយ៉ាងតិច ${min} បៃ`,
  uint8ArrayMaxLength: (max: number) => `Uint8Array ត្រូវមានយ៉ាងច្រើន ${max} បៃ`,
  uint8ArrayExactLength: (length: number) => `Uint8Array ត្រូវមាន ${length} បៃពេញលេញ`,

  // Generic type error messages
  expectedString: 'រំពឹងទុកខ្សែអក្សរ',
  stringExpected: (received: string, expected: string) => `រំពឹងទុក ${expected} បានទទួល ${received}`,
  stringBoolExpected: (validValues: string, received: string) => `ខ្សែអក្សរប៊ូលីនមិនត្រឹមត្រូវ៖ រំពឹងទុកមួយក្នុងចំណោម ${validValues} បានទទួល "${received}"`,
  invalidJson: 'JSON មិនត្រឹមត្រូវ',
  stringPatternInvalid: 'ខ្សែអក្សរមិនស្របតាមលំនាំដែលត្រូវការ',

  // File validation messages
  invalidFile: 'រំពឹងទុកវត្ថុ File',
  fileNotSupported: 'File API មិនត្រូវបានគាំទ្រនៅក្នុងបរិវេណនេះទេ',
  fileMinSize: (min: number) => `ទំហំឯកសារត្រូវមានយ៉ាងតិច ${min} បៃ`,
  fileMaxSize: (max: number) => `ទំហំឯកសារមិនត្រូវលើសពី ${max} បៃ`,
  fileMimeType: (allowed: string[]) => `ប្រភេទឯកសារមិនត្រឹមត្រូវ៖ រំពឹងទុក ${allowed.join(', ')}`,

  // Function validation messages
  invalidFunction: 'រំពឹងទុកមុខងារ',

  // CIDR validation messages
  stringCidrv4: 'ប្លុក IPv4 CIDR មិនត្រឹមត្រូវ',
  stringCidrv6: 'ប្លុក IPv6 CIDR មិនត្រឹមត្រូវ',

  // Safe extend validation messages
  safeExtendOverlap: (keys: string[]) => `មិនអាចសរសេរជាន់ពីលើកូនសοίដែលមានស្រាប់ទេ៖ ${keys.join(', ')}. ប្រើ extend() ប្រសិនបើអ្នកចង់សរសេរជាន់ពីលើវាចុះ។`,
};
