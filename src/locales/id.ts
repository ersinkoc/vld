import { LocaleMessages } from './types';

export const id: LocaleMessages = {
  // String validation messages
  invalidString: 'String tidak valid',
  stringMin: (min: number) => `String harus memiliki minimal ${min} karakter`,
  stringMax: (max: number) => `String tidak boleh lebih dari ${max} karakter`,
  stringLength: (length: number) => `String harus memiliki tepat ${length} karakter`,
  stringEmail: 'Alamat email tidak valid',
  stringUrl: 'URL tidak valid',
  stringUuid: 'UUID tidak valid',
  stringRegex: 'Format tidak valid',
  stringStartsWith: (prefix: string) => `String harus diawali dengan "${prefix}"`,
  stringEndsWith: (suffix: string) => `String harus diakhiri dengan "${suffix}"`,
  stringIncludes: (substring: string) => `String harus mengandung "${substring}"`,
  stringIp: 'Alamat IP tidak valid',
  stringIpv4: 'Alamat IPv4 tidak valid',
  stringIpv6: 'Alamat IPv6 tidak valid',
  stringEmpty: 'String tidak boleh kosong',

  // Number validation messages
  invalidNumber: 'Angka tidak valid',
  numberMin: (min: number) => `Angka harus minimal ${min}`,
  numberMax: (max: number) => `Angka tidak boleh lebih dari ${max}`,
  numberInt: 'Angka harus berupa bilangan bulat',
  numberPositive: 'Angka harus positif',
  numberNegative: 'Angka harus negatif',
  numberNonnegative: 'Angka tidak boleh negatif',
  numberNonpositive: 'Angka tidak boleh positif',
  numberFinite: 'Angka harus terhingga',
  numberSafe: 'Angka harus berupa bilangan bulat yang aman',
  numberMultipleOf: (value: number) => `Angka harus kelipatan dari ${value}`,

  // Boolean validation messages
  invalidBoolean: 'Nilai boolean tidak valid',

  // Date validation messages
  invalidDate: 'Tanggal tidak valid',
  dateMin: (date: Date) => `Tanggal harus setelah ${date.toISOString()}`,
  dateMax: (date: Date) => `Tanggal harus sebelum ${date.toISOString()}`,

  // Object validation messages
  invalidObject: 'Object tidak valid',
  unexpectedKeys: (keys: string[]) => `Kunci yang tidak diharapkan: ${keys.join(', ')}`,

  // Array validation messages
  invalidArray: 'Array tidak valid',
  arrayMin: (min: number) => `Array harus memiliki minimal ${min} elemen`,
  arrayMax: (max: number) => `Array tidak boleh lebih dari ${max} elemen`,
  arrayLength: (length: number) => `Array harus memiliki tepat ${length} elemen`,
  arrayEmpty: 'Array tidak boleh kosong',
  arrayItem: (index: number, error: string) => `Elemen tidak valid pada indeks ${index}: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `Field "${field}" tidak valid: ${error}`,

  // Union validation messages
  unionNoMatch: (errors: string[]) => `Tidak ada anggota union yang cocok: ${errors.join(', ')}`,

  // Intersection validation messages
  intersectionError: (error: string) => `Validasi intersection gagal: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `Diharapkan ${expected}, diterima ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `Diharapkan salah satu dari [${values.join(', ')}], diterima ${received}`,

  // Special type validation messages
  expectedUndefined: 'Diharapkan undefined',
  neverType: 'Tipe never tidak dapat diparse',

  // New advanced type validation messages
  invalidBigint: 'Bigint tidak valid',
  invalidSymbol: 'Simbol tidak valid',
  invalidTuple: 'Tuple tidak valid',
  tupleLength: (expected: number, received: number) => `Tuple harus memiliki tepat ${expected} elemen, diterima ${received}`,
  invalidRecord: 'Record tidak valid',
  invalidSet: 'Set tidak valid',
  invalidMap: 'Map tidak valid',
  
  // Transformation and refinement messages
  transformError: (error: string) => `Transformasi gagal: ${error}`,
  refinementError: (error: string) => `Penyempurnaan gagal: ${error}`,
  customValidationError: (error: string) => `Validasi kustom gagal: ${error}`,
  
  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `Tidak dapat memaksa ${JSON.stringify(value)} menjadi ${type}`,
  
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
  stringExpected: (received: string, expected: string) => `Diharapkan ${expected}, diterima ${received}`,
  stringBoolExpected: (validValues: string, received: string) => `String boolean tidak valid. Salah satu dari berikut diharapkan: ${validValues}, diterima: "${received}"`,
  invalidJson: 'JSON tidak valid',
  stringPatternInvalid: 'String tidak cocok dengan pola yang diperlukan',

  // File validation messages
  invalidFile: 'Expected a File object',
  fileNotSupported: 'File API not supported in this environment',
  fileMinSize: (min: number) => `File size must be at least ${min} bytes`,
  fileMaxSize: (max: number) => `File size must not exceed ${max} bytes`,
  fileMimeType: (allowed: string[]) => `Invalid file type. Expected: ${allowed.join(", ")}`,
  // Function validation messages
  invalidFunction: 'Fungsi diharapkan',

  // CIDR validation messages
  stringCidrv4: 'Blok CIDR IPv4 tidak valid',
  stringCidrv6: 'Blok CIDR IPv6 tidak valid',

  // Safe extend validation messages
  safeExtendOverlap: (keys: string[]) => `Tidak dapat menimpa kunci yang sudah ada: ${keys.join(', ')}. Gunakan extend() untuk menimpa.`
};
