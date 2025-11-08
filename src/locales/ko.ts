import { LocaleMessages } from './types';

export const ko: LocaleMessages = {
  // String validation messages
  invalidString: '유효하지 않은 문자열',
  stringMin: (min: number) => `문자열은 최소 ${min}자여야 합니다`,
  stringMax: (max: number) => `문자열은 최대 ${max}자여야 합니다`,
  stringLength: (length: number) => `문자열은 정확히 ${length}자여야 합니다`,
  stringEmail: '유효하지 않은 이메일 주소',
  stringUrl: '유효하지 않은 URL',
  stringUuid: '유효하지 않은 UUID',
  stringRegex: '유효하지 않은 형식',
  stringStartsWith: (prefix: string) => `문자열은 "${prefix}"로 시작해야 합니다`,
  stringEndsWith: (suffix: string) => `문자열은 "${suffix}"로 끝나야 합니다`,
  stringIncludes: (substring: string) => `문자열은 "${substring}"을 포함해야 합니다`,
  stringIp: '유효하지 않은 IP 주소',
  stringIpv4: '유효하지 않은 IPv4 주소',
  stringIpv6: '유효하지 않은 IPv6 주소',
  stringEmpty: '문자열은 비어있을 수 없습니다',

  // Number validation messages
  invalidNumber: '유효하지 않은 숫자',
  numberMin: (min: number) => `숫자는 최소 ${min}이어야 합니다`,
  numberMax: (max: number) => `숫자는 최대 ${max}이어야 합니다`,
  numberInt: '숫자는 정수여야 합니다',
  numberPositive: '숫자는 양수여야 합니다',
  numberNegative: '숫자는 음수여야 합니다',
  numberNonnegative: '숫자는 음수일 수 없습니다',
  numberNonpositive: '숫자는 양수일 수 없습니다',
  numberFinite: '숫자는 유한해야 합니다',
  numberSafe: '숫자는 안전한 정수여야 합니다',
  numberMultipleOf: (value: number) => `숫자는 ${value}의 배수여야 합니다`,

  // Boolean validation messages
  invalidBoolean: '유효하지 않은 불린 값',

  // Date validation messages
  invalidDate: '유효하지 않은 날짜',
  dateMin: (date: Date) => `날짜는 ${date.toISOString()} 이후여야 합니다`,
  dateMax: (date: Date) => `날짜는 ${date.toISOString()} 이전이어야 합니다`,

  // Object validation messages
  invalidObject: '유효하지 않은 객체',
  unexpectedKeys: (keys: string[]) => `예상치 못한 키: ${keys.join(', ')}`,

  // Array validation messages
  invalidArray: '유효하지 않은 배열',
  arrayMin: (min: number) => `배열은 최소 ${min}개의 요소가 있어야 합니다`,
  arrayMax: (max: number) => `배열은 최대 ${max}개의 요소가 있어야 합니다`,
  arrayLength: (length: number) => `배열은 정확히 ${length}개의 요소가 있어야 합니다`,
  arrayEmpty: '배열은 비어있을 수 없습니다',
  arrayItem: (index: number, error: string) => `인덱스 ${index}의 유효하지 않은 요소: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `유효하지 않은 필드 "${field}": ${error}`,

  // Union validation messages
  unionNoMatch: (errors: string[]) => `어떤 유니온 멤버도 일치하지 않았습니다: ${errors.join(', ')}`,

  // Intersection validation messages
  intersectionError: (error: string) => `교집합 검증에 실패했습니다: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `${expected}가 예상되었지만 ${received}를 받았습니다`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `[${values.join(', ')}] 중 하나가 예상되었지만 ${received}를 받았습니다`,

  // Special type validation messages
  expectedUndefined: 'undefined가 예상되었습니다',
  neverType: 'never 타입은 파싱할 수 없습니다',

  // New advanced type validation messages
  invalidBigint: '유효하지 않은 bigint',
  invalidSymbol: '유효하지 않은 심볼',
  invalidTuple: '유효하지 않은 튜플',
  tupleLength: (expected: number, received: number) => `튜플은 정확히 ${expected}개의 요소가 있어야 하지만 ${received}개를 받았습니다`,
  invalidRecord: '유효하지 않은 레코드',
  invalidSet: '유효하지 않은 Set',
  invalidMap: '유효하지 않은 Map',
  
  // Transformation and refinement messages
  transformError: (error: string) => `변환 실패: ${error}`,
  refinementError: (error: string) => `정제 실패: ${error}`,
  customValidationError: (error: string) => `사용자 정의 유효성 검사 실패: ${error}`,
  
  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `${JSON.stringify(value)}를 ${type}로 강제 변환할 수 없습니다`,
  
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
  expectedString: 'Expected string'
};