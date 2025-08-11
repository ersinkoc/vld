import { LocaleMessages } from './types';

export const vi: LocaleMessages = {
  // String validation messages
  invalidString: 'Chuỗi không hợp lệ',
  stringMin: (min: number) => `Chuỗi phải có ít nhất ${min} ký tự`,
  stringMax: (max: number) => `Chuỗi không được quá ${max} ký tự`,
  stringLength: (length: number) => `Chuỗi phải có chính xác ${length} ký tự`,
  stringEmail: 'Địa chỉ email không hợp lệ',
  stringUrl: 'URL không hợp lệ',
  stringUuid: 'UUID không hợp lệ',
  stringRegex: 'Định dạng không hợp lệ',
  stringStartsWith: (prefix: string) => `Chuỗi phải bắt đầu bằng "${prefix}"`,
  stringEndsWith: (suffix: string) => `Chuỗi phải kết thúc bằng "${suffix}"`,
  stringIncludes: (substring: string) => `Chuỗi phải chứa "${substring}"`,
  stringIp: 'Địa chỉ IP không hợp lệ',
  stringIpv4: 'Địa chỉ IPv4 không hợp lệ',
  stringIpv6: 'Địa chỉ IPv6 không hợp lệ',
  stringEmpty: 'Chuỗi không được để trống',

  // Number validation messages
  invalidNumber: 'Số không hợp lệ',
  numberMin: (min: number) => `Số phải ít nhất là ${min}`,
  numberMax: (max: number) => `Số không được vượt quá ${max}`,
  numberInt: 'Số phải là số nguyên',
  numberPositive: 'Số phải là số dương',
  numberNegative: 'Số phải là số âm',
  numberNonnegative: 'Số không được là số âm',
  numberNonpositive: 'Số không được là số dương',
  numberFinite: 'Số phải là số hữu hạn',
  numberSafe: 'Số phải là số nguyên an toàn',
  numberMultipleOf: (value: number) => `Số phải là bội số của ${value}`,

  // Boolean validation messages
  invalidBoolean: 'Giá trị boolean không hợp lệ',

  // Date validation messages
  invalidDate: 'Ngày không hợp lệ',
  dateMin: (date: Date) => `Ngày phải sau ${date.toISOString()}`,
  dateMax: (date: Date) => `Ngày phải trước ${date.toISOString()}`,

  // Object validation messages
  invalidObject: 'Đối tượng không hợp lệ',
  unexpectedKeys: (keys: string[]) => `Khóa không mong muốn: ${keys.join(', ')}`,

  // Array validation messages
  invalidArray: 'Mảng không hợp lệ',
  arrayMin: (min: number) => `Mảng phải có ít nhất ${min} phần tử`,
  arrayMax: (max: number) => `Mảng không được quá ${max} phần tử`,
  arrayLength: (length: number) => `Mảng phải có chính xác ${length} phần tử`,
  arrayEmpty: 'Mảng không được để trống',
  arrayItem: (index: number, error: string) => `Phần tử không hợp lệ tại vị trí ${index}: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `Trường "${field}" không hợp lệ: ${error}`,

  // Union validation messages
  unionNoMatch: (errors: string[]) => `Không có thành viên union nào khớp: ${errors.join(', ')}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `Mong đợi ${expected}, nhận được ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `Mong đợi một trong [${values.join(', ')}], nhận được ${received}`,

  // Special type validation messages
  expectedUndefined: 'Mong đợi undefined',
  neverType: 'Không thể phân tích kiểu never',

  // New advanced type validation messages
  invalidBigint: 'Bigint không hợp lệ',
  invalidSymbol: 'Ký hiệu không hợp lệ',
  invalidTuple: 'Tuple không hợp lệ',
  tupleLength: (expected: number, received: number) => `Tuple phải có chính xác ${expected} phần tử, nhận được ${received}`,
  invalidRecord: 'Record không hợp lệ',
  invalidSet: 'Set không hợp lệ',
  invalidMap: 'Map không hợp lệ',
  
  // Transformation and refinement messages
  transformError: (error: string) => `Biến đổi thất bại: ${error}`,
  refinementError: (error: string) => `Tinh chế thất bại: ${error}`,
  
  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `Không thể ép kiểu ${JSON.stringify(value)} thành ${type}`
};