import { LocaleMessages } from './types';

// Armenian (ported 2026-10-27)
export const hy: LocaleMessages = {
  // String validation messages
  invalidString: 'Անվավեր տող',
  stringMin: (min: number) => `Տողը պետք է պարունակի առնվազն ${min} նշան`,
  stringMax: (max: number) => `Տողը պետք է պարունակի առավելագույնը ${max} նշան`,
  stringLength: (length: number) => `Տողը պետք է պարունակի ուղիղ ${length} նշան`,
  stringEmail: 'Անվավեր էլ. փոստի հասցե',
  stringUrl: 'Անվավեր URL',
  stringUuid: 'Անվավեր UUID',
  stringRegex: 'Անվավեր ֆորմատ',
  stringStartsWith: (prefix: string) => `Տողը պետք է սկսվի "${prefix}"-ով`,
  stringEndsWith: (suffix: string) => `Տողը պետք է ավարտվի "${suffix}"-ով`,
  stringIncludes: (substring: string) => `Տողը պետք է պարունակի "${substring}"`,
  stringIp: 'Անվավեր IP հասցե',
  stringIpv4: 'Անվավեր IPv4 հասցե',
  stringIpv6: 'Անվավեր IPv6 հասցե',
  stringEmpty: 'Տողը չպետք է դատարկ լինի',

  // Number validation messages
  invalidNumber: 'Անվավեր թիվ',
  numberMin: (min: number) => `Թիվը պետք է լինի առնվազն ${min}`,
  numberMax: (max: number) => `Թիվը պետք է լինի առավելագույնը ${max}`,
  numberInt: 'Թիվը պետք է լինի ամբողջ',
  numberPositive: 'Թիվը պետք է լինի դրական',
  numberNegative: 'Թիվը պետք է լինի բացասական',
  numberNonnegative: 'Թիվը չի կարող բացասական լինել',
  numberNonpositive: 'Թիվը չի կարող դրական լինել',
  numberFinite: 'Թիվը պետք է լինի վերջավոր',
  numberSafe: 'Թիվը պետք է լինի անվտանգ ամբողջ թիվ',
  numberMultipleOf: (value: number) => `Թիվը պետք է լինի ${value}-ի բազմապատիկը`,

  // Boolean validation messages
  invalidBoolean: 'Անվավեր բուլյան արժեք',

  // Date validation messages
  invalidDate: 'Անվավեր ամսաթիվ',
  dateMin: (date: Date) => `Ամսաթիվը պետք է լինի ${date.toISOString()}-ից հետո`,
  dateMax: (date: Date) => `Ամսաթիվը պետք է լինի ${date.toISOString()}-ից առաջ`,

  // Object validation messages
  invalidObject: 'Անվավեր օբյեկտ',
  unexpectedKeys: (keys: string[]) => `Անսպասելի բանալիներ: ${keys.join(', ')}`,
  requiredField: (field: string) => `Բացակայում է պարտադիր "${field}" դաշտը`,

  // Array validation messages
  invalidArray: 'Անվավեր զանգված',
  arrayMin: (min: number) => `Զանգվածը պետք է պարունակի առնվազն ${min} տարր`,
  arrayMax: (max: number) => `Զանգվածը պետք է պարունակի առավելագույնը ${max} տարր`,
  arrayLength: (length: number) => `Զանգվածը պետք է պարունակի ուղիղ ${length} տարր`,
  arrayEmpty: 'Զանգվածը չպետք է դատարկ լինի',
  arrayItem: (index: number, error: string) => `Անվավեր տարր ${index} ինդեքսում: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `Անվավեր "${field}" դաշտ: ${error}`,

  // Union validation messages
  unionNoMatch: () => `Անվավեր մուտքագրում`,

  // Intersection validation messages
  intersectionError: (error: string) => `Հատման ստուգման սխալ: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `Սպասվում էր ${expected}, ստացվել է ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `Սպասվում էր [${values.join(', ')}]-ից մեկը, ստացվել է ${received}`,

  // Special type validation messages
  expectedUndefined: 'Սպասվում էր undefined',
  neverType: 'never տիպը հնարավոր չէ վերլուծել',

  // New advanced type validation messages
  invalidBigint: 'Անվավեր bigint',
  invalidSymbol: 'Անվավեր symbol',
  invalidTuple: 'Անվավեր կորտեժ',
  tupleLength: (expected: number, received: number) => `Կորտեժը պետք է պարունակի ուղիղ ${expected} տարր, ստացվել է ${received}`,
  invalidRecord: 'Անվավեր գրառում',
  invalidSet: 'Անվավեր բազմություն',
  invalidMap: 'Անվավեր քարտեզ',

  // Transformation and refinement messages
  transformError: (error: string) => `Փոխակերպման սխալ: ${error}`,
  refinementError: (error: string) => `ճշգրտման սխալ: ${error}`,
  customValidationError: (error: string) => `Հատուկ ստուգման սխալ: ${error}`,

  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `Հնարավոր չէ վերածել ${JSON.stringify(value)}-ը ${type}-ի`,

  // Codec messages
  codecDecodeFailed: 'Արժեքի ապակոդավորումը ձախողվեց',
  codecEncodeFailed: 'Արժեքի կոդավորումը ձախողվեց',
  codecAsyncNotSupported: 'Կոդեկի ասինխրոն գործողությունները պահանջում են parseAsync/encodeAsync մեթոդներ',

  // Base64/Hex messages
  invalidBase64: 'Անվավեր base64 տող',
  invalidHex: 'Անվավեր տասնվեցական տող',

  // Uint8Array messages
  expectedUint8Array: 'Սպասվում էր Uint8Array',
  uint8ArrayMinLength: (min: number) => `Uint8Array-ը պետք է պարունակի առնվազն ${min} բայթ`,
  uint8ArrayMaxLength: (max: number) => `Uint8Array-ը պետք է պարունակի առավելագույնը ${max} բայթ`,
  uint8ArrayExactLength: (length: number) => `Uint8Array-ը պետք է պարունակի ուղիղ ${length} բայթ`,

  // Generic type error messages
  expectedString: 'Սպասվում էր տող',
  stringExpected: (received: string, expected: string) => `Սպասվում էր ${expected}, ստացվել է ${received}`,
  stringBoolExpected: (validValues: string, received: string) => `Անվավեր բուլյան տող: Սպասվում էր՝ ${validValues}, ստացվել է "${received}"`,
  invalidJson: 'Անվավեր JSON',
  stringPatternInvalid: 'Տողը չի համապատասխանում պահանջվող ձևաչափին',

  // File validation messages
  invalidFile: 'Սպասվում էր File օբյեկտ',
  fileNotSupported: 'File API-ն աջակցված չէ այս միջավայրում',
  fileMinSize: (min: number) => `Ֆայլի չափը պետք է լինի առնվազն ${min} բայթ`,
  fileMaxSize: (max: number) => `Ֆայլի չափը չպետք է գերազանցի ${max} բայթը`,
  fileMimeType: (allowed: string[]) => `Անվավեր ֆայլի տիպ: Սպասվում էր՝ ${allowed.join(', ')}`,

  // Function validation messages
  invalidFunction: 'Սպասվում էր ֆունկցիա',

  // CIDR validation messages
  stringCidrv4: 'Անվավեր IPv4 CIDR բլոկ',
  stringCidrv6: 'Անվավեր IPv6 CIDR բլոկ',

  // Safe extend validation messages
  safeExtendOverlap: (keys: string[]) => `Հնարավոր չէ վերագրավել առկա բանալիները՝ ${keys.join(', ')}: Օգտագործեք extend()՝ եթե ցանկանում եք վերագրավել։`,
};
