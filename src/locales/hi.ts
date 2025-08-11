import { LocaleMessages } from './types';

export const hi: LocaleMessages = {
  // String validation messages
  invalidString: 'अमान्य स्ट्रिंग',
  stringMin: (min: number) => `स्ट्रिंग में कम से कम ${min} अक्षर होने चाहिए`,
  stringMax: (max: number) => `स्ट्रिंग में ${max} से अधिक अक्षर नहीं हो सकते`,
  stringLength: (length: number) => `स्ट्रिंग में ठीक ${length} अक्षर होने चाहिए`,
  stringEmail: 'अमान्य ईमेल पता',
  stringUrl: 'अमान्य URL',
  stringUuid: 'अमान्य UUID',
  stringRegex: 'अमान्य प्रारूप',
  stringStartsWith: (prefix: string) => `स्ट्रिंग "${prefix}" से शुरू होनी चाहिए`,
  stringEndsWith: (suffix: string) => `स्ट्रिंग "${suffix}" से समाप्त होनी चाहिए`,
  stringIncludes: (substring: string) => `स्ट्रिंग में "${substring}" होना चाहिए`,
  stringIp: 'अमान्य IP पता',
  stringIpv4: 'अमान्य IPv4 पता',
  stringIpv6: 'अमान्य IPv6 पता',
  stringEmpty: 'स्ट्रिंग खाली नहीं हो सकती',

  // Number validation messages
  invalidNumber: 'अमान्य संख्या',
  numberMin: (min: number) => `संख्या कम से कम ${min} होनी चाहिए`,
  numberMax: (max: number) => `संख्या ${max} से अधिक नहीं हो सकती`,
  numberInt: 'संख्या पूर्णांक होनी चाहिए',
  numberPositive: 'संख्या सकारात्मक होनी चाहिए',
  numberNegative: 'संख्या नकारात्मक होनी चाहिए',
  numberNonnegative: 'संख्या नकारात्मक नहीं हो सकती',
  numberNonpositive: 'संख्या सकारात्मक नहीं हो सकती',
  numberFinite: 'संख्या परिमित होनी चाहिए',
  numberSafe: 'संख्या सुरक्षित पूर्णांक होनी चाहिए',
  numberMultipleOf: (value: number) => `संख्या ${value} का गुणज होनी चाहिए`,

  // Boolean validation messages
  invalidBoolean: 'अमान्य बूलियन मान',

  // Date validation messages
  invalidDate: 'अमान्य तिथि',
  dateMin: (date: Date) => `तिथि ${date.toISOString()} के बाद होनी चाहिए`,
  dateMax: (date: Date) => `तिथि ${date.toISOString()} से पहले होनी चाहिए`,

  // Object validation messages
  invalidObject: 'अमान्य ऑब्जेक्ट',
  unexpectedKeys: (keys: string[]) => `अनपेक्षित कुंजियां: ${keys.join(', ')}`,

  // Array validation messages
  invalidArray: 'अमान्य सरणी',
  arrayMin: (min: number) => `सरणी में कम से कम ${min} तत्व होने चाहिए`,
  arrayMax: (max: number) => `सरणी में ${max} से अधिक तत्व नहीं हो सकते`,
  arrayLength: (length: number) => `सरणी में ठीक ${length} तत्व होने चाहिए`,
  arrayEmpty: 'सरणी खाली नहीं हो सकती',
  arrayItem: (index: number, error: string) => `सूचकांक ${index} पर अमान्य तत्व: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `अमान्य फ़ील्ड "${field}": ${error}`,

  // Union validation messages
  unionNoMatch: (errors: string[]) => `कोई यूनियन सदस्य मेल नहीं खाया: ${errors.join(', ')}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `अपेक्षित ${expected}, प्राप्त ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `[${values.join(', ')}] में से एक अपेक्षित, प्राप्त ${received}`,

  // Special type validation messages
  expectedUndefined: 'undefined अपेक्षित',
  neverType: 'never प्रकार का विश्लेषण नहीं किया जा सकता',

  // New advanced type validation messages
  invalidBigint: 'अमान्य bigint',
  invalidSymbol: 'अमान्य प्रतीक',
  invalidTuple: 'अमान्य ट्यूपल',
  tupleLength: (expected: number, received: number) => `ट्यूपल में ठीक ${expected} तत्व होने चाहिए, ${received} प्राप्त हुए`,
  invalidRecord: 'अमान्य रिकॉर्ड',
  invalidSet: 'अमान्य Set',
  invalidMap: 'अमान्य Map',
  
  // Transformation and refinement messages
  transformError: (error: string) => `रूपांतरण विफल: ${error}`,
  refinementError: (error: string) => `शुद्धीकरण विफल: ${error}`,
  
  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `${JSON.stringify(value)} को ${type} में परिवर्तित नहीं किया जा सकता`
};