import { LocaleMessages } from './types';

export const zh: LocaleMessages = {
  // String validation messages
  invalidString: '无效字符串',
  stringMin: (min: number) => `字符串必须至少${min}个字符`,
  stringMax: (max: number) => `字符串不能超过${max}个字符`,
  stringLength: (length: number) => `字符串必须正好${length}个字符`,
  stringEmail: '无效邮箱地址',
  stringUrl: '无效URL',
  stringUuid: '无效UUID',
  stringRegex: '无效格式',
  stringStartsWith: (prefix: string) => `字符串必须以"${prefix}"开头`,
  stringEndsWith: (suffix: string) => `字符串必须以"${suffix}"结尾`,
  stringIncludes: (substring: string) => `字符串必须包含"${substring}"`,
  stringIp: '无效IP地址',
  stringIpv4: '无效IPv4地址',
  stringIpv6: '无效IPv6地址',
  stringEmpty: '字符串不能为空',

  // Number validation messages
  invalidNumber: '无效数字',
  numberMin: (min: number) => `数字必须至少为${min}`,
  numberMax: (max: number) => `数字不能大于${max}`,
  numberInt: '数字必须是整数',
  numberPositive: '数字必须是正数',
  numberNegative: '数字必须是负数',
  numberNonnegative: '数字不能是负数',
  numberNonpositive: '数字不能是正数',
  numberFinite: '数字必须是有限的',
  numberSafe: '数字必须是安全整数',
  numberMultipleOf: (value: number) => `数字必须是${value}的倍数`,

  // Boolean validation messages
  invalidBoolean: '无效布尔值',

  // Date validation messages
  invalidDate: '无效日期',
  dateMin: (date: Date) => `日期必须在${date.toISOString()}之后`,
  dateMax: (date: Date) => `日期必须在${date.toISOString()}之前`,

  // Object validation messages
  invalidObject: '无效对象',
  unexpectedKeys: (keys: string[]) => `意外的键: ${keys.join(', ')}`,

  // Array validation messages
  invalidArray: '无效数组',
  arrayMin: (min: number) => `数组必须至少有${min}个元素`,
  arrayMax: (max: number) => `数组不能超过${max}个元素`,
  arrayLength: (length: number) => `数组必须正好有${length}个元素`,
  arrayEmpty: '数组不能为空',
  arrayItem: (index: number, error: string) => `索引${index}处的无效元素: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `无效字段"${field}": ${error}`,

  // Union validation messages
  unionNoMatch: (errors: string[]) => `没有匹配的联合成员: ${errors.join(', ')}`,

  // Intersection validation messages
  intersectionError: (error: string) => `交集验证失败: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `期望${expected}，得到${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `期望[${values.join(', ')}]中的一个，得到${received}`,

  // Special type validation messages
  expectedUndefined: '期望undefined',
  neverType: 'never类型无法解析',

  // New advanced type validation messages
  invalidBigint: '无效bigint',
  invalidSymbol: '无效符号',
  invalidTuple: '无效元组',
  tupleLength: (expected: number, received: number) => `元组必须正好有${expected}个元素，得到${received}个`,
  invalidRecord: '无效记录',
  invalidSet: '无效Set',
  invalidMap: '无效Map',
  
  // Transformation and refinement messages
  transformError: (error: string) => `转换失败: ${error}`,
  refinementError: (error: string) => `细化失败: ${error}`,
  customValidationError: (error: string) => `自定义验证失败: ${error}`,
  
  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `无法将${JSON.stringify(value)}强制转换为${type}`,
  
  // Codec messages
  codecDecodeFailed: 'Failed to decode value',
  codecEncodeFailed: 'Failed to encode value',
  codecAsyncNotSupported: 'Async codec operations require using parseAsync/encodeAsync methods',
  
  // Base64/Hex messages
  invalidBase64: 'Invalid base64 string',
  invalidHex: 'Invalid hexadecimal string',
  
  // Uint8Array messages
  expectedUint8Array: 'Expected Uint8Array',
  uint8ArrayMinLength: 'Uint8Array must have at least {min} bytes',
  uint8ArrayMaxLength: 'Uint8Array must have at most {max} bytes',
  uint8ArrayExactLength: 'Uint8Array must have exactly {length} bytes',
  
  // Generic type error messages
  expectedString: 'Expected string'
};