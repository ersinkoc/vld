import { LocaleMessages } from './types';

// Georgian (ported 2026-10-27)
export const ka: LocaleMessages = {
  // String validation messages
  invalidString: 'არასწორი სტრიქონი',
  stringMin: (min: number) => `სტრიქონი უნდა შეიცავდეს მინიმუმ ${min} სიმბოლოს`,
  stringMax: (max: number) => `სტრიქონი უნდა შეიცავდეს მაქსიმუმ ${max} სიმბოლოს`,
  stringLength: (length: number) => `სტრიქონი უნდა შეიცავდეს ზუსტად ${length} სიმბოლოს`,
  stringEmail: 'არასწორი ელ. ფოსტის მისამართი',
  stringUrl: 'არასწორი URL',
  stringUuid: 'არასწორი UUID',
  stringRegex: 'არასწორი ფორმატი',
  stringStartsWith: (prefix: string) => `სტრიქონი უნდა იწყებოდეს "${prefix}"-ით`,
  stringEndsWith: (suffix: string) => `სტრიქონი უნდა მთავრდებოდეს "${suffix}"-ით`,
  stringIncludes: (substring: string) => `სტრიქონი უნდა შეიცავდეს "${substring}"-ს`,
  stringIp: 'არასწორი IP მისამართი',
  stringIpv4: 'არასწორი IPv4 მისამართი',
  stringIpv6: 'არასწორი IPv6 მისამართი',
  stringEmpty: 'სტრიქონი არ უნდა იყოს ცარიელი',

  // Number validation messages
  invalidNumber: 'არასწორი რიცხვი',
  numberMin: (min: number) => `რიცხვი უნდა იყოს მინიმუმ ${min}`,
  numberMax: (max: number) => `რიცხვი უნდა იყოს მაქსიმუმ ${max}`,
  numberInt: 'რიცხვი უნდა იყოს მთელი',
  numberPositive: 'რიცხვი უნდა იყოს დადებითი',
  numberNegative: 'რიცხვი უნდა იყოს უარყოფითი',
  numberNonnegative: 'რიცხვი არ უნდა იყოს უარყოფითი',
  numberNonpositive: 'რიცხვი არ უნდა იყოს დადებითი',
  numberFinite: 'რიცხვი უნდა იყოს სასრული',
  numberSafe: 'რიცხვი უნდა იყოს უსაფრთხო მთელი რიცხვი',
  numberMultipleOf: (value: number) => `რიცხვი უნდა იყოს ${value}-ის ჯერადი`,

  // Boolean validation messages
  invalidBoolean: 'არასწორი ბულევის მნიშვნელობა',

  // Date validation messages
  invalidDate: 'არასწორი თარიღი',
  dateMin: (date: Date) => `თარიღი უნდა იყოს ${date.toISOString()}-ის შემდეგ`,
  dateMax: (date: Date) => `თარიღი უნდა იყოს ${date.toISOString()}-მდე`,

  // Object validation messages
  invalidObject: 'არასწორი ობიექტი',
  unexpectedKeys: (keys: string[]) => `მოულოდნელი გასაღებები: ${keys.join(', ')}`,
  requiredField: (field: string) => `აკლია სავალდებულო ველი "${field}"`,

  // Array validation messages
  invalidArray: 'არასწორი მასივი',
  arrayMin: (min: number) => `მასივი უნდა შეიცავდეს მინიმუმ ${min} ელემენტს`,
  arrayMax: (max: number) => `მასივი უნდა შეიცავდეს მაქსიმუმ ${max} ელემენტს`,
  arrayLength: (length: number) => `მასივი უნდა შეიცავდეს ზუსტად ${length} ელემენტს`,
  arrayEmpty: 'მასივი არ უნდა იყოს ცარიელი',
  arrayItem: (index: number, error: string) => `არასწორი ელემენტი ინდექსზე ${index}: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `არასწორი ველი "${field}": ${error}`,

  // Union validation messages
  unionNoMatch: () => `არასწორი შეყვანა`,

  // Intersection validation messages
  intersectionError: (error: string) => `გადაკვეთის ვალიდაციის შეცდომა: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `მოსალოდნელი იყო ${expected}, მიღებულია ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `მოსალოდნელი იყო ერთ-ერთი [${values.join(', ')}]-დან, მიღებულია ${received}`,

  // Special type validation messages
  expectedUndefined: 'მოსალოდნელი იყო undefined',
  neverType: 'never ტიპის დამუშავება შეუძლებელია',

  // New advanced type validation messages
  invalidBigint: 'არასწორი bigint',
  invalidSymbol: 'არასწორი symbol',
  invalidTuple: 'არასწორი კორტეჟი',
  tupleLength: (expected: number, received: number) => `კორტეჟი უნდა შეიცავდეს ზუსტად ${expected} ელემენტს, მიღებულია ${received}`,
  invalidRecord: 'არასწორი ჩანაწერი',
  invalidSet: 'არასწორი სეტი',
  invalidMap: 'არასწორი რუკა',

  // Transformation and refinement messages
  transformError: (error: string) => `ტრანსფორმაციის შეცდომა: ${error}`,
  refinementError: (error: string) => `დაზუსტების შეცდომა: ${error}`,
  customValidationError: (error: string) => `განსაკუთრებული ვალიდაციის შეცდომა: ${error}`,

  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `${JSON.stringify(value)}-ის ${type}-ად გადაყვანა შეუძლებელია`,

  // Codec messages
  codecDecodeFailed: 'მნიშვნელობის დეკოდირება ჩავარდა',
  codecEncodeFailed: 'მნიშვნელობის კოდირება ჩავარდა',
  codecAsyncNotSupported: 'კოდეკის ასინქრონული ოპერაციები მოითხოვს parseAsync/encodeAsync მეთოდებს',

  // Base64/Hex messages
  invalidBase64: 'არასწორი base64 სტრიქონი',
  invalidHex: 'არასწორი თექვსმეტობითი სტრიქონი',

  // Uint8Array messages
  expectedUint8Array: 'მოსალოდნელი იყო Uint8Array',
  uint8ArrayMinLength: (min: number) => `Uint8Array უნდა შეიცავდეს მინიმუმ ${min} ბაიტს`,
  uint8ArrayMaxLength: (max: number) => `Uint8Array უნდა შეიცავდეს მაქსიმუმ ${max} ბაიტს`,
  uint8ArrayExactLength: (length: number) => `Uint8Array უნდა შეიცავდეს ზუსტად ${length} ბაიტს`,

  // Generic type error messages
  expectedString: 'მოსალოდნელი იყო სტრიქონი',
  stringExpected: (received: string, expected: string) => `მოსალოდნელი იყო ${expected}, მიღებულია ${received}`,
  stringBoolExpected: (validValues: string, received: string) => `არასწორი ბულევის სტრიქონი: მოსალოდნელი იყო ერთ-ერთი: ${validValues}, მიღებულია "${received}"`,
  invalidJson: 'არასწორი JSON',
  stringPatternInvalid: 'სტრიქონი არ შეესაბამება საჭირო შაბლონს',

  // File validation messages
  invalidFile: 'მოსალოდნელი იყო File ობიექტი',
  fileNotSupported: 'File API ამ გარემოში მხარდაჭერილი არ არის',
  fileMinSize: (min: number) => `ფაილის ზომა უნდა იყოს მინიმუმ ${min} ბაიტი`,
  fileMaxSize: (max: number) => `ფაილის ზომა არ უნდა გადასცდეს ${max} ბაიტს`,
  fileMimeType: (allowed: string[]) => `არასწორი ფაილის ტიპი: მოსალოდნელი იყო: ${allowed.join(', ')}`,

  // Function validation messages
  invalidFunction: 'მოსალოდნელი იყო ფუნქცია',

  // CIDR validation messages
  stringCidrv4: 'არასწორი IPv4 CIDR ბლოკი',
  stringCidrv6: 'არასწორი IPv6 CIDR ბლოკი',

  // Safe extend validation messages
  safeExtendOverlap: (keys: string[]) => `არსებული გასაღებების გადაწერა შეუძლებელია: ${keys.join(', ')}. გადაწერის სურვილის შემთხვევაში გამოიყენეთ extend().`,
};
