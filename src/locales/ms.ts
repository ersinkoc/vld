import { LocaleMessages } from './types';

// Malay (ported 2026-10-27)
export const ms: LocaleMessages = {
  // String validation messages
  invalidString: 'Rentetan tidak sah',
  stringMin: (min: number) => `Rentetan mesti mempunyai sekurang-kurangnya ${min} aksara`,
  stringMax: (max: number) => `Rentetan mesti mempunyai paling banyak ${max} aksara`,
  stringLength: (length: number) => `Rentetan mesti mempunyai tepat ${length} aksara`,
  stringEmail: 'Alamat e-mel tidak sah',
  stringUrl: 'URL tidak sah',
  stringUuid: 'UUID tidak sah',
  stringRegex: 'Format tidak sah',
  stringStartsWith: (prefix: string) => `Rentetan mesti bermula dengan "${prefix}"`,
  stringEndsWith: (suffix: string) => `Rentetan mesti berakhir dengan "${suffix}"`,
  stringIncludes: (substring: string) => `Rentetan mesti mengandungi "${substring}"`,
  stringIp: 'Alamat IP tidak sah',
  stringIpv4: 'Alamat IPv4 tidak sah',
  stringIpv6: 'Alamat IPv6 tidak sah',
  stringEmpty: 'Rentetan tidak boleh kosong',

  // Number validation messages
  invalidNumber: 'Nombor tidak sah',
  numberMin: (min: number) => `Nombor mesti sekurang-kurangnya ${min}`,
  numberMax: (max: number) => `Nombor mesti paling banyak ${max}`,
  numberInt: 'Nombor mesti integer',
  numberPositive: 'Nombor mesti positif',
  numberNegative: 'Nombor mesti negatif',
  numberNonnegative: 'Nombor tidak boleh negatif',
  numberNonpositive: 'Nombor tidak boleh positif',
  numberFinite: 'Nombor mesti terhingga',
  numberSafe: 'Nombor mesti integer selamat',
  numberMultipleOf: (value: number) => `Nombor mesti gandaan ${value}`,

  // Boolean validation messages
  invalidBoolean: 'Nilai boolean tidak sah',

  // Date validation messages
  invalidDate: 'Tarikh tidak sah',
  dateMin: (date: Date) => `Tarikh mesti selepas ${date.toISOString()}`,
  dateMax: (date: Date) => `Tarikh mesti sebelum ${date.toISOString()}`,

  // Object validation messages
  invalidObject: 'Objek tidak sah',
  unexpectedKeys: (keys: string[]) => `Kunci tidak dijangka: ${keys.join(', ')}`,
  requiredField: (field: string) => `Medan wajib "${field}" tiada`,

  // Array validation messages
  invalidArray: 'Tatasusunan tidak sah',
  arrayMin: (min: number) => `Tatasusunan mesti mempunyai sekurang-kurangnya ${min} elemen`,
  arrayMax: (max: number) => `Tatasusunan mesti mempunyai paling banyak ${max} elemen`,
  arrayLength: (length: number) => `Tatasusunan mesti mempunyai tepat ${length} elemen`,
  arrayEmpty: 'Tatasusunan tidak boleh kosong',
  arrayItem: (index: number, error: string) => `Elemen tidak sah pada indeks ${index}: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `Medan tidak sah "${field}": ${error}`,

  // Union validation messages
  unionNoMatch: () => `Input tidak sah`,

  // Intersection validation messages
  intersectionError: (error: string) => `Ralat pengesahan persilangan: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `Dijangka ${expected}, diterima ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `Dijangka salah satu daripada [${values.join(', ')}], diterima ${received}`,

  // Special type validation messages
  expectedUndefined: 'Dijangka undefined',
  neverType: 'Jenis never tidak boleh dihuraikan',

  // New advanced type validation messages
  invalidBigint: 'bigint tidak sah',
  invalidSymbol: 'symbol tidak sah',
  invalidTuple: 'Tuple tidak sah',
  tupleLength: (expected: number, received: number) => `Tuple mesti mempunyai tepat ${expected} elemen, ${received} diterima`,
  invalidRecord: 'Rekod tidak sah',
  invalidSet: 'Set tidak sah',
  invalidMap: 'Peta tidak sah',

  // Transformation and refinement messages
  transformError: (error: string) => `Ralat transformasi: ${error}`,
  refinementError: (error: string) => `Ralat penalaan: ${error}`,
  customValidationError: (error: string) => `Ralat pengesahan tersuai: ${error}`,

  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `Tidak boleh menukar ${JSON.stringify(value)} kepada ${type}`,

  // Codec messages
  codecDecodeFailed: 'Gagal menyahkod nilai',
  codecEncodeFailed: 'Gagal mengekod nilai',
  codecAsyncNotSupported: 'Operasi kodek tak segerak memerlukan kaedah parseAsync/encodeAsync',

  // Base64/Hex messages
  invalidBase64: 'Rentetan base64 tidak sah',
  invalidHex: 'Rentetan heksadesimal tidak sah',

  // Uint8Array messages
  expectedUint8Array: 'Dijangka Uint8Array',
  uint8ArrayMinLength: (min: number) => `Uint8Array mesti mempunyai sekurang-kurangnya ${min} bait`,
  uint8ArrayMaxLength: (max: number) => `Uint8Array mesti mempunyai paling banyak ${max} bait`,
  uint8ArrayExactLength: (length: number) => `Uint8Array mesti mempunyai tepat ${length} bait`,

  // Generic type error messages
  expectedString: 'Dijangka rentetan',
  stringExpected: (received: string, expected: string) => `Dijangka ${expected}, diterima ${received}`,
  stringBoolExpected: (validValues: string, received: string) => `Rentetan boolean tidak sah. Dijangka salah satu daripada: ${validValues}, diterima "${received}"`,
  invalidJson: 'JSON tidak sah',
  stringPatternInvalid: 'Rentetan tidak sepadan dengan corak yang diperlukan',

  // File validation messages
  invalidFile: 'Dijangka objek File',
  fileNotSupported: 'API File tidak disokong dalam persekitaran ini',
  fileMinSize: (min: number) => `Saiz fail mesti sekurang-kurangnya ${min} bait`,
  fileMaxSize: (max: number) => `Saiz fail tidak boleh melebihi ${max} bait`,
  fileMimeType: (allowed: string[]) => `Jenis fail tidak sah. Dijangka: ${allowed.join(', ')}`,

  // Function validation messages
  invalidFunction: 'Dijangka fungsi',

  // CIDR validation messages
  stringCidrv4: 'Blok CIDR IPv4 tidak sah',
  stringCidrv6: 'Blok CIDR IPv6 tidak sah',

  // Safe extend validation messages
  safeExtendOverlap: (keys: string[]) => `Kunci sedia ada tidak boleh ditulis ganti: ${keys.join(', ')}. Gunakan extend() jika anda mahu menulis ganti.`,
};
