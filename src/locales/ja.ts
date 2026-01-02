import { LocaleMessages } from './types';

export const ja: LocaleMessages = {
  // String validation messages
  invalidString: '無効な文字列',
  stringMin: (min: number) => `文字列は${min}文字以上である必要があります`,
  stringMax: (max: number) => `文字列は${max}文字以下である必要があります`,
  stringLength: (length: number) => `文字列はちょうど${length}文字である必要があります`,
  stringEmail: '無効なメールアドレス',
  stringUrl: '無効なURL',
  stringUuid: '無効なUUID',
  stringRegex: '無効なフォーマット',
  stringStartsWith: (prefix: string) => `文字列は「${prefix}」で始まる必要があります`,
  stringEndsWith: (suffix: string) => `文字列は「${suffix}」で終わる必要があります`,
  stringIncludes: (substring: string) => `文字列は「${substring}」を含む必要があります`,
  stringIp: '無効なIPアドレス',
  stringIpv4: '無効なIPv4アドレス',
  stringIpv6: '無効なIPv6アドレス',
  stringEmpty: '文字列は空にできません',

  // Number validation messages
  invalidNumber: '無効な数値',
  numberMin: (min: number) => `数値は${min}以上である必要があります`,
  numberMax: (max: number) => `数値は${max}以下である必要があります`,
  numberInt: '数値は整数である必要があります',
  numberPositive: '数値は正の値である必要があります',
  numberNegative: '数値は負の値である必要があります',
  numberNonnegative: '数値は負の値にできません',
  numberNonpositive: '数値は正の値にできません',
  numberFinite: '数値は有限である必要があります',
  numberSafe: '数値は安全な整数である必要があります',
  numberMultipleOf: (value: number) => `数値は${value}の倍数である必要があります`,

  // Boolean validation messages
  invalidBoolean: '無効なブール値',

  // Date validation messages
  invalidDate: '無効な日付',
  dateMin: (date: Date) => `日付は${date.toISOString()}より後である必要があります`,
  dateMax: (date: Date) => `日付は${date.toISOString()}より前である必要があります`,

  // Object validation messages
  invalidObject: '無効なオブジェクト',
  unexpectedKeys: (keys: string[]) => `予期しないキー: ${keys.join(', ')}`,

  // Array validation messages
  invalidArray: '無効な配列',
  arrayMin: (min: number) => `配列は${min}個以上の要素が必要です`,
  arrayMax: (max: number) => `配列は${max}個以下の要素でなければなりません`,
  arrayLength: (length: number) => `配列はちょうど${length}個の要素が必要です`,
  arrayEmpty: '配列は空にできません',
  arrayItem: (index: number, error: string) => `インデックス${index}の無効な要素: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `無効なフィールド「${field}」: ${error}`,

  // Union validation messages
  unionNoMatch: (errors: string[]) => `どのユニオンメンバーもマッチしませんでした: ${errors.join(', ')}`,

  // Intersection validation messages
  intersectionError: (error: string) => `交差検証に失敗しました: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `${expected}が期待されましたが、${received}を受け取りました`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `[${values.join(', ')}]のいずれかが期待されましたが、${received}を受け取りました`,

  // Special type validation messages
  expectedUndefined: 'undefinedが期待されました',
  neverType: 'neverタイプは解析できません',

  // New advanced type validation messages
  invalidBigint: '無効なbigint',
  invalidSymbol: '無効なシンボル',
  invalidTuple: '無効なタプル',
  tupleLength: (expected: number, received: number) => `タプルはちょうど${expected}個の要素が必要ですが、${received}個を受け取りました`,
  invalidRecord: '無効なレコード',
  invalidSet: '無効なSet',
  invalidMap: '無効なMap',
  
  // Transformation and refinement messages
  transformError: (error: string) => `変換に失敗しました: ${error}`,
  refinementError: (error: string) => `リファインメントに失敗しました: ${error}`,
  customValidationError: (error: string) => `カスタム検証が失敗しました: ${error}`,
  
  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `${JSON.stringify(value)}を${type}に変換できません`,
  
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
  stringExpected: (received: string, expected: string) => `${expected}が期待されましたが、${received}を受け取りました`,
  stringBoolExpected: (validValues: string, received: string) => `無効なブール文字列です。次のいずれかである必要があります: ${validValues}、受け取りました: "${received}"`,
  invalidJson: '無効なJSON',
  stringPatternInvalid: '文字列が必要なパターンと一致しません',

  // File validation messages
  invalidFile: 'Expected a File object',
  fileNotSupported: 'File API not supported in this environment',
  fileMinSize: (min: number) => `File size must be at least ${min} bytes`,
  fileMaxSize: (max: number) => `File size must not exceed ${max} bytes`,
  fileMimeType: (allowed: string[]) => `Invalid file type. Expected: ${allowed.join(", ")}`,
  // Function validation messages
  invalidFunction: '関数が期待されました',

  // CIDR validation messages
  stringCidrv4: '無効なIPv4 CIDRブロック',
  stringCidrv6: '無効なIPv6 CIDRブロック',

  // Safe extend validation messages
  safeExtendOverlap: (keys: string[]) => `既存のキーを上書きできません: ${keys.join(', ')}。上書きしたい場合はextend()を使用してください。`
};
