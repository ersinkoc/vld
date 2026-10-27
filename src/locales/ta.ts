import { LocaleMessages } from './types';

// Tamil (ported 2026-10-27)
export const ta: LocaleMessages = {
  // String validation messages
  invalidString: 'தவறான சரம்',
  stringMin: (min: number) => `சரம் குறைந்தது ${min} எழுத்துகளைக் கொண்டிருக்க வேண்டும்`,
  stringMax: (max: number) => `சரம் அதிகபட்சம் ${max} எழுத்துகளை மட்டுமே கொண்டிருக்க வேண்டும்`,
  stringLength: (length: number) => `சரம் சரியாக ${length} எழுத்துகளைக் கொண்டிருக்க வேண்டும்`,
  stringEmail: 'தவறான மின்னஞ்சல் முகவரி',
  stringUrl: 'தவறான URL',
  stringUuid: 'தவறான UUID',
  stringRegex: 'தவறான வடிவம்',
  stringStartsWith: (prefix: string) => `சரம் "${prefix}" உடன் தொடங்க வேண்டும்`,
  stringEndsWith: (suffix: string) => `சரம் "${suffix}" உடன் முடிய வேண்டும்`,
  stringIncludes: (substring: string) => `சரம் "${substring}" ஐக் கொண்டிருக்க வேண்டும்`,
  stringIp: 'தவறான IP முகவரி',
  stringIpv4: 'தவறான IPv4 முகவரி',
  stringIpv6: 'தவறான IPv6 முகவரி',
  stringEmpty: 'சரம் காலியாக இருக்கக்கூடாது',

  // Number validation messages
  invalidNumber: 'தவறான எண்',
  numberMin: (min: number) => `எண் குறைந்தது ${min} ஆக இருக்க வேண்டும்`,
  numberMax: (max: number) => `எண் அதிகபட்சம் ${max} ஆக இருக்க வேண்டும்`,
  numberInt: 'எண் முழு எண்ணாக இருக்க வேண்டும்',
  numberPositive: 'எண் நேர்மறையாக இருக்க வேண்டும்',
  numberNegative: 'எண் எதிர்மறையாக இருக்க வேண்டும்',
  numberNonnegative: 'எண் எதிர்மறையாக இருக்கக்கூடாது',
  numberNonpositive: 'எண் நேர்மறையாக இருக்கக்கூடாது',
  numberFinite: 'எண் முடிவுறும் எண்ணாக இருக்க வேண்டும்',
  numberSafe: 'எண் பாதுகாப்பான முழு எண்ணாக இருக்க வேண்டும்',
  numberMultipleOf: (value: number) => `எண் ${value}-இன் மடங்காக இருக்க வேண்டும்`,

  // Boolean validation messages
  invalidBoolean: 'தவறான பூலியன் மதிப்பு',

  // Date validation messages
  invalidDate: 'தவறான தேதி',
  dateMin: (date: Date) => `தேதி ${date.toISOString()}-க்குப் பிறகு இருக்க வேண்டும்`,
  dateMax: (date: Date) => `தேதி ${date.toISOString()}-க்கு முன் இருக்க வேண்டும்`,

  // Object validation messages
  invalidObject: 'தவறான பொருள்',
  unexpectedKeys: (keys: string[]) => `எதிர்பாராத விசைகள்: ${keys.join(', ')}`,
  requiredField: (field: string) => `கட்டாயப் புலம் "${field}" இல்லை`,

  // Array validation messages
  invalidArray: 'தவறான வரிசை',
  arrayMin: (min: number) => `வரிசை குறைந்தது ${min} உறுப்புகளைக் கொண்டிருக்க வேண்டும்`,
  arrayMax: (max: number) => `வரிசை அதிகபட்சம் ${max} உறுப்புகளை மட்டுமே கொண்டிருக்க வேண்டும்`,
  arrayLength: (length: number) => `வரிசை சரியாக ${length} உறுப்புகளைக் கொண்டிருக்க வேண்டும்`,
  arrayEmpty: 'வரிசை காலியாக இருக்கக்கூடாது',
  arrayItem: (index: number, error: string) => `${index} அட்டவணையில் தவறான உறுப்பு: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `தவறான புலம் "${field}": ${error}`,

  // Union validation messages
  unionNoMatch: () => `தவறான உள்ளீடு`,

  // Intersection validation messages
  intersectionError: (error: string) => `குறுக்குவெட்டு சரிபார்ப்புப் பிழை: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `${expected} எதிர்பார்க்கப்பட்டது, ${received} பெறப்பட்டது`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `[${values.join(', ')}]-இல் ஒன்று எதிர்பார்க்கப்பட்டது, ${received} பெறப்பட்டது`,

  // Special type validation messages
  expectedUndefined: 'undefined எதிர்பார்க்கப்பட்டது',
  neverType: 'never வகையை பாகுபடுத்த முடியாது',

  // New advanced type validation messages
  invalidBigint: 'தவறான bigint',
  invalidSymbol: 'தவறான symbol',
  invalidTuple: 'தவறான டப்பிள்',
  tupleLength: (expected: number, received: number) => `டப்பிள் சரியாக ${expected} உறுப்புகளைக் கொண்டிருக்க வேண்டும், ${received} பெறப்பட்டது`,
  invalidRecord: 'தவறான பதிவு',
  invalidSet: 'தவறான தொகுப்பு',
  invalidMap: 'தவறான வரைபடம்',

  // Transformation and refinement messages
  transformError: (error: string) => `மாற்றுப் பிழை: ${error}`,
  refinementError: (error: string) => `சீர்படுத்தல் பிழை: ${error}`,
  customValidationError: (error: string) => `தனிப்பயன் சரிபார்ப்புப் பிழை: ${error}`,

  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `${JSON.stringify(value)}-ஐ ${type}-ஆக மாற்ற முடியவில்லை`,

  // Codec messages
  codecDecodeFailed: 'மதிப்பை டீகோட் செய்ய முடியவில்லை',
  codecEncodeFailed: 'மதிப்பை என்கோட் செய்ய முடியவில்லை',
  codecAsyncNotSupported: 'ஒத்திசைவற்ற கோடெக் செயல்பாடுகளுக்கு parseAsync/encodeAsync முறைகள் தேவை',

  // Base64/Hex messages
  invalidBase64: 'தவறான base64 சரம்',
  invalidHex: 'தவறான அறுபதின்ம சரம்',

  // Uint8Array messages
  expectedUint8Array: 'Uint8Array எதிர்பார்க்கப்பட்டது',
  uint8ArrayMinLength: (min: number) => `Uint8Array குறைந்தது ${min} பைட்டுகளைக் கொண்டிருக்க வேண்டும்`,
  uint8ArrayMaxLength: (max: number) => `Uint8Array அதிகபட்சம் ${max} பைட்டுகளை மட்டுமே கொண்டிருக்க வேண்டும்`,
  uint8ArrayExactLength: (length: number) => `Uint8Array சரியாக ${length} பைட்டுகளைக் கொண்டிருக்க வேண்டும்`,

  // Generic type error messages
  expectedString: 'சரம் எதிர்பார்க்கப்பட்டது',
  stringExpected: (received: string, expected: string) => `${expected} எதிர்பார்க்கப்பட்டது, ${received} பெறப்பட்டது`,
  stringBoolExpected: (validValues: string, received: string) => `தவறான பூலியன் சரம்: ${validValues}-இல் ஒன்று எதிர்பார்க்கப்பட்டது, "${received}" பெறப்பட்டது`,
  invalidJson: 'தவறான JSON',
  stringPatternInvalid: 'சரம் தேவையான வடிவத்துடன் பொருந்தவில்லை',

  // File validation messages
  invalidFile: 'File பொருள் எதிர்பார்க்கப்பட்டது',
  fileNotSupported: 'File API இந்தச் சூழலில் ஆதரிக்கப்படவில்லை',
  fileMinSize: (min: number) => `கோப்பின் அளவு குறைந்தது ${min} பைட்டுகளாக இருக்க வேண்டும்`,
  fileMaxSize: (max: number) => `கோப்பின் அளவு ${max} பைட்டுகளை மீறக்கூடாது`,
  fileMimeType: (allowed: string[]) => `தவறான கோப்பு வகை: ${allowed.join(', ')} எதிர்பார்க்கப்பட்டது`,

  // Function validation messages
  invalidFunction: 'செயல்பாடு எதிர்பார்க்கப்பட்டது',

  // CIDR validation messages
  stringCidrv4: 'தவறான IPv4 CIDR தொகுதி',
  stringCidrv6: 'தவறான IPv6 CIDR தொகுதி',

  // Safe extend validation messages
  safeExtendOverlap: (keys: string[]) => `ஏற்கனவே உள்ள விசைகளை மேலெழுத முடியாது: ${keys.join(', ')}. மேலெழுத விரும்பினால் extend()-ஐப் பயன்படுத்துங்கள்.`,
};
