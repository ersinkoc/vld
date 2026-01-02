import { LocaleMessages } from './types';

export const th: LocaleMessages = {
  // String validation messages
  invalidString: 'ข้อความไม่ถูกต้อง',
  stringMin: (min: number) => `ข้อความต้องมีความยาวอย่างน้อย ${min} ตัวอักษร`,
  stringMax: (max: number) => `ข้อความต้องมีความยาวไม่เกิน ${max} ตัวอักษร`,
  stringLength: (length: number) => `ข้อความต้องมีความยาวเท่ากับ ${length} ตัวอักษร`,
  stringEmail: 'อีเมลไม่ถูกต้อง',
  stringUrl: 'URL ไม่ถูกต้อง',
  stringUuid: 'UUID ไม่ถูกต้อง',
  stringRegex: 'รูปแบบไม่ถูกต้อง',
  stringStartsWith: (prefix: string) => `ข้อความต้องเริ่มต้นด้วย "${prefix}"`,
  stringEndsWith: (suffix: string) => `ข้อความต้องลงท้ายด้วย "${suffix}"`,
  stringIncludes: (substring: string) => `ข้อความต้องมี "${substring}"`,
  stringIp: 'IP address ไม่ถูกต้อง',
  stringIpv4: 'IPv4 address ไม่ถูกต้อง',
  stringIpv6: 'IPv6 address ไม่ถูกต้อง',
  stringEmpty: 'ข้อความไม่สามารถเป็นค่าว่างได้',

  // Number validation messages
  invalidNumber: 'ตัวเลขไม่ถูกต้อง',
  numberMin: (min: number) => `ตัวเลขต้องมีค่าอย่างน้อย ${min}`,
  numberMax: (max: number) => `ตัวเลขต้องมีค่าไม่เกิน ${max}`,
  numberInt: 'ตัวเลขต้องเป็นจำนวนเต็ม',
  numberPositive: 'ตัวเลขต้องเป็นค่าบวก',
  numberNegative: 'ตัวเลขต้องเป็นค่าลบ',
  numberNonnegative: 'ตัวเลขไม่สามารถเป็นค่าลบได้',
  numberNonpositive: 'ตัวเลขไม่สามารถเป็นค่าบวกได้',
  numberFinite: 'ตัวเลขต้องเป็นค่าจำกัด',
  numberSafe: 'ตัวเลขต้องเป็นจำนวนเต็มที่ปลอดภัย',
  numberMultipleOf: (value: number) => `ตัวเลขต้องเป็นหลายเท่าของ ${value}`,

  // Boolean validation messages
  invalidBoolean: 'ค่า Boolean ไม่ถูกต้อง',

  // Date validation messages
  invalidDate: 'วันที่ไม่ถูกต้อง',
  dateMin: (date: Date) => `วันที่ต้องหลังจาก ${date.toISOString()}`,
  dateMax: (date: Date) => `วันที่ต้องก่อน ${date.toISOString()}`,

  // Object validation messages
  invalidObject: 'Object ไม่ถูกต้อง',
  unexpectedKeys: (keys: string[]) => `Key ที่ไม่คาดหวัง: ${keys.join(', ')}`,

  // Array validation messages
  invalidArray: 'Array ไม่ถูกต้อง',
  arrayMin: (min: number) => `Array ต้องมีสมาชิกอย่างน้อย ${min} ตัว`,
  arrayMax: (max: number) => `Array ต้องมีสมาชิกไม่เกิน ${max} ตัว`,
  arrayLength: (length: number) => `Array ต้องมีสมาชิกเท่ากับ ${length} ตัว`,
  arrayEmpty: 'Array ไม่สามารถเป็นค่าว่างได้',
  arrayItem: (index: number, error: string) => `สมาชิกที่ตำแหน่ง ${index} ไม่ถูกต้อง: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `ฟิลด์ "${field}" ไม่ถูกต้อง: ${error}`,

  // Union validation messages
  unionNoMatch: (errors: string[]) => `ไม่มี union member ที่ตรงกัน: ${errors.join(', ')}`,

  // Intersection validation messages
  intersectionError: (error: string) => `การตรวจสอบ intersection ล้มเหลว: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `คาดหวัง ${expected}, ได้รับ ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `คาดหวังค่าใดค่าหนึ่งจาก [${values.join(', ')}], ได้รับ ${received}`,

  // Special type validation messages
  expectedUndefined: 'คาดหวัง undefined',
  neverType: 'ไม่สามารถ parse ประเภท never ได้',

  // New advanced type validation messages
  invalidBigint: 'bigint ไม่ถูกต้อง',
  invalidSymbol: 'symbol ไม่ถูกต้อง',
  invalidTuple: 'tuple ไม่ถูกต้อง',
  tupleLength: (expected: number, received: number) => `tuple ต้องมีสมาชิกเท่ากับ ${expected} ตัว, ได้รับ ${received} ตัว`,
  invalidRecord: 'record ไม่ถูกต้อง',
  invalidSet: 'Set ไม่ถูกต้อง',
  invalidMap: 'Map ไม่ถูกต้อง',
  
  // Transformation and refinement messages
  transformError: (error: string) => `การแปลงล้มเหลว: ${error}`,
  refinementError: (error: string) => `การปรับแต่งล้มเหลว: ${error}`,
  customValidationError: (error: string) => `การตรวจสอบแบบกำหนดเองล้มเหลว: ${error}`,
  
  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `ไม่สามารถแปลง ${JSON.stringify(value)} เป็น ${type} ได้`,
  
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
  stringExpected: (received: string, expected: string) => `คาดหวัง ${expected}, ได้รับ ${received}`,
  stringBoolExpected: (validValues: string, received: string) => `สตริงบูลีนไม่ถูกต้อง คาดว่าจะเป็นหนึ่งในนั้น: ${validValues}, ได้รับ: "${received}"`,
  invalidJson: 'JSON ไม่ถูกต้อง',
  stringPatternInvalid: 'สตริงไม่ตรงกับรูปแบบที่จำเป็น',

  // File validation messages
  invalidFile: 'Expected a File object',
  fileNotSupported: 'File API not supported in this environment',
  fileMinSize: (min: number) => `File size must be at least ${min} bytes`,
  fileMaxSize: (max: number) => `File size must not exceed ${max} bytes`,
  fileMimeType: (allowed: string[]) => `Invalid file type. Expected: ${allowed.join(", ")}`,
  // Function validation messages
  invalidFunction: 'คาดหวังฟังก์ชัน',

  // CIDR validation messages
  stringCidrv4: 'บล็อก CIDR IPv4 ไม่ถูกต้อง',
  stringCidrv6: 'บล็อก CIDR IPv6 ไม่ถูกต้อง',

  // Safe extend validation messages
  safeExtendOverlap: (keys: string[]) => `ไม่สามารถเขียนทับคีย์ที่มีอยู่: ${keys.join(', ')}. ใช้ extend() เพื่อเขียนทับ`
};
