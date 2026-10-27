import { LocaleMessages } from './types';

// Traditional Chinese (Taiwan) (ported 2026-10-27; converted from zh with
// Taiwan-standard terminology - 物件/字串/布林/檔案/位元組/函式/支援)

export const zhTW: LocaleMessages = {
  // String validation messages
  invalidString: '無效字串',
  stringMin: (min: number) => `字串必須至少${min}個字元`,
  stringMax: (max: number) => `字串不能超過${max}個字元`,
  stringLength: (length: number) => `字串必須正好${length}個字元`,
  stringEmail: '無效電子郵件位址',
  stringUrl: '無效URL',
  stringUuid: '無效UUID',
  stringRegex: '無效格式',
  stringStartsWith: (prefix: string) => `字串必須以"${prefix}"開頭`,
  stringEndsWith: (suffix: string) => `字串必須以"${suffix}"結尾`,
  stringIncludes: (substring: string) => `字串必須包含"${substring}"`,
  stringIp: '無效IP位址',
  stringIpv4: '無效IPv4位址',
  stringIpv6: '無效IPv6位址',
  stringEmpty: '字串不能為空',

  // Number validation messages
  invalidNumber: '無效数字',
  numberMin: (min: number) => `数字必須至少为${min}`,
  numberMax: (max: number) => `数字不能大于${max}`,
  numberInt: '数字必須是整數',
  numberPositive: '数字必須是正數',
  numberNegative: '数字必須是負數',
  numberNonnegative: '数字不能是負數',
  numberNonpositive: '数字不能是正數',
  numberFinite: '数字必須是有限的',
  numberSafe: '数字必須是安全整數',
  numberMultipleOf: (value: number) => `数字必須是${value}的倍數`,

  // Boolean validation messages
  invalidBoolean: '無效布林值',

  // Date validation messages
  invalidDate: '無效日期',
  dateMin: (date: Date) => `日期必須在${date.toISOString()}之後`,
  dateMax: (date: Date) => `日期必須在${date.toISOString()}之前`,

  // Object validation messages
  invalidObject: '無效物件',
  unexpectedKeys: (keys: string[]) => `意外的鍵: ${keys.join(', ')}`,
  requiredField: (field: string) => `Required field "${field}" is missing`,

  // Array validation messages
  invalidArray: '無效陣列',
  arrayMin: (min: number) => `陣列必須至少有${min}個元素`,
  arrayMax: (max: number) => `陣列不能超過${max}個元素`,
  arrayLength: (length: number) => `陣列必須正好有${length}個元素`,
  arrayEmpty: '陣列不能為空',
  arrayItem: (index: number, error: string) => `索引${index}处的無效元素: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `無效欄位"${field}": ${error}`,

  // Union validation messages
  unionNoMatch: (errors: string[]) => `没有匹配的联合成员: ${errors.join(', ')}`,

  // Intersection validation messages
  intersectionError: (error: string) => `交集验证失敗: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `期望${expected}，得到${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `期望[${values.join(', ')}]中的一个，得到${received}`,

  // Special type validation messages
  expectedUndefined: '期望undefined',
  neverType: 'never類型无法解析',

  // New advanced type validation messages
  invalidBigint: '無效bigint',
  invalidSymbol: '無效符号',
  invalidTuple: '無效元組',
  tupleLength: (expected: number, received: number) => `元組必須正好有${expected}個元素，得到${received}个`,
  invalidRecord: '無效記錄',
  invalidSet: '無效Set',
  invalidMap: '無效Map',
  
  // Transformation and refinement messages
  transformError: (error: string) => `轉換失敗: ${error}`,
  refinementError: (error: string) => `细化失敗: ${error}`,
  customValidationError: (error: string) => `自訂验证失敗: ${error}`,
  
  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `无法将${JSON.stringify(value)}強制轉換为${type}`,
  
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
  stringExpected: (received: string, expected: string) => `期望${expected}，得到${received}`,
  stringBoolExpected: (validValues: string, received: string) => `無效的布林字串。期望以下之一: ${validValues}，得到: "${received}"`,
  invalidJson: '無效的JSON',
  stringPatternInvalid: '字串与所需模式不匹配',

  // File validation messages
  invalidFile: 'Expected a File object',
  fileNotSupported: 'File API not supported in this environment',
  fileMinSize: (min: number) => `File size must be at least ${min} bytes`,
  fileMaxSize: (max: number) => `File size must not exceed ${max} bytes`,
  fileMimeType: (allowed: string[]) => `Invalid file type. Expected: ${allowed.join(", ")}`,
  // Function validation messages
  invalidFunction: '期望一个函式',

  // CIDR validation messages
  stringCidrv4: '無效的IPv4 CIDR块',
  stringCidrv6: '無效的IPv6 CIDR块',

  // Safe extend validation messages
  safeExtendOverlap: (keys: string[]) => `无法覆寫現有鍵: ${keys.join(', ')}。如果要覆寫请使用extend()。`
};
