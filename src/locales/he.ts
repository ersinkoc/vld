import { LocaleMessages } from './types';

// Hebrew (ported 2026-10-27)
export const he: LocaleMessages = {
  // String validation messages
  invalidString: 'מחרוזת לא תקינה',
  stringMin: (min: number) => `המחרוזת חייבת להכיל לפחות ${min} תווים`,
  stringMax: (max: number) => `המחרוזת חייבת להכיל לכל היותר ${max} תווים`,
  stringLength: (length: number) => `המחרוזת חייבת להכיל בדיוק ${length} תווים`,
  stringEmail: 'כתובת דואר אלקטרוני לא תקינה',
  stringUrl: 'כתובת URL לא תקינה',
  stringUuid: 'UUID לא תקין',
  stringRegex: 'פורמט לא תקין',
  stringStartsWith: (prefix: string) => `המחרוזת חייבת להתחיל ב-"${prefix}"`,
  stringEndsWith: (suffix: string) => `המחרוזת חייבת להסתיים ב-"${suffix}"`,
  stringIncludes: (substring: string) => `המחרוזת חייבת לכלול "${substring}"`,
  stringIp: 'כתובת IP לא תקינה',
  stringIpv4: 'כתובת IPv4 לא תקינה',
  stringIpv6: 'כתובת IPv6 לא תקינה',
  stringEmpty: 'המחרוזת לא יכולה להיות ריקה',

  // Number validation messages
  invalidNumber: 'מספר לא תקין',
  numberMin: (min: number) => `המספר חייב להיות לפחות ${min}`,
  numberMax: (max: number) => `המספר חייב להיות לכל היותר ${max}`,
  numberInt: 'המספר חייב להיות שלם',
  numberPositive: 'המספר חייב להיות חיובי',
  numberNegative: 'המספר חייב להיות שלילי',
  numberNonnegative: 'המספר לא יכול להיות שלילי',
  numberNonpositive: 'המספר לא יכול להיות חיובי',
  numberFinite: 'המספר חייב להיות סופי',
  numberSafe: 'המספר חייב להיות מספר שלם בטוח',
  numberMultipleOf: (value: number) => `המספר חייב להיות כפולה של ${value}`,

  // Boolean validation messages
  invalidBoolean: 'ערך בוליאני לא תקין',

  // Date validation messages
  invalidDate: 'תאריך לא תקין',
  dateMin: (date: Date) => `התאריך חייב להיות אחרי ${date.toISOString()}`,
  dateMax: (date: Date) => `התאריך חייב להיות לפני ${date.toISOString()}`,

  // Object validation messages
  invalidObject: 'אובייקט לא תקין',
  unexpectedKeys: (keys: string[]) => `מפתחות לא צפויים: ${keys.join(', ')}`,
  requiredField: (field: string) => `השדה החובה "${field}" חסר`,

  // Array validation messages
  invalidArray: 'מערך לא תקין',
  arrayMin: (min: number) => `המערך חייב להכיל לפחות ${min} אלמנטים`,
  arrayMax: (max: number) => `המערך חייב להכיל לכל היותר ${max} אלמנטים`,
  arrayLength: (length: number) => `המערך חייב להכיל בדיוק ${length} אלמנטים`,
  arrayEmpty: 'המערך לא יכול להיות ריק',
  arrayItem: (index: number, error: string) => `אלמנט לא תקין באינדקס ${index}: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `שדה לא תקין "${field}": ${error}`,

  // Union validation messages
  unionNoMatch: () => `קלט לא תקין`,

  // Intersection validation messages
  intersectionError: (error: string) => `שגיאת אימות חיתוך: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `ציפה ל-${expected}, התקבל ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `ציפה לאחד מ-[${values.join(', ')}], התקבל ${received}`,

  // Special type validation messages
  expectedUndefined: 'ציפה ל-undefined',
  neverType: 'לא ניתן לנתח את הטיפוס never',

  // New advanced type validation messages
  invalidBigint: 'BigInt לא תקין',
  invalidSymbol: 'Symbol לא תקין',
  invalidTuple: 'Tuple לא תקין',
  tupleLength: (expected: number, received: number) => `ה-Tuple חייב להכיל בדיוק ${expected} אלמנטים, התקבלו ${received}`,
  invalidRecord: 'Record לא תקין',
  invalidSet: 'Set לא תקין',
  invalidMap: 'Map לא תקין',

  // Transformation and refinement messages
  transformError: (error: string) => `שגיאת טרנספורמציה: ${error}`,
  refinementError: (error: string) => `שגיאת רפינמנט: ${error}`,
  customValidationError: (error: string) => `שגיאת אימות מותאמת אישית: ${error}`,

  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `לא ניתן להמיר את ${JSON.stringify(value)} ל-${type}`,

  // Codec messages
  codecDecodeFailed: 'פענוח הערך נכשל',
  codecEncodeFailed: 'קידוד הערך נכשל',
  codecAsyncNotSupported: 'פעולות codec אסינכרוניות דורשות את המתודות parseAsync/encodeAsync',

  // Base64/Hex messages
  invalidBase64: 'מחרוזת base64 לא תקינה',
  invalidHex: 'מחרוזת הקסדצימלית לא תקינה',

  // Uint8Array messages
  expectedUint8Array: 'ציפה ל-Uint8Array',
  uint8ArrayMinLength: (min: number) => `ה-Uint8Array חייב להכיל לפחות ${min} בייטים`,
  uint8ArrayMaxLength: (max: number) => `ה-Uint8Array חייב להכיל לכל היותר ${max} בייטים`,
  uint8ArrayExactLength: (length: number) => `ה-Uint8Array חייב להכיל בדיוק ${length} בייטים`,

  // Generic type error messages
  expectedString: 'ציפה למחרוזת',
  stringExpected: (received: string, expected: string) => `ציפה ל-${expected}, התקבל ${received}`,
  stringBoolExpected: (validValues: string, received: string) => `מחרוזת בוליאנית לא תקינה. ציפה לאחת מ: ${validValues}, התקבל "${received}"`,
  invalidJson: 'JSON לא תקין',
  stringPatternInvalid: 'המחרוזת אינה תואמת לתבנית הנדרשת',

  // File validation messages
  invalidFile: 'ציפה לאובייקט File',
  fileNotSupported: 'File API אינו נתמך בסביבה זו',
  fileMinSize: (min: number) => `גודל הקובץ חייב להיות לפחות ${min} בייטים`,
  fileMaxSize: (max: number) => `גודל הקובץ לא יעלה על ${max} בייטים`,
  fileMimeType: (allowed: string[]) => `סוג קובץ לא תקין. ציפה ל: ${allowed.join(', ')}`,

  // Function validation messages
  invalidFunction: 'ציפה לפונקציה',

  // CIDR validation messages
  stringCidrv4: 'בלוק CIDR IPv4 לא תקין',
  stringCidrv6: 'בלוק CIDR IPv6 לא תקין',

  // Safe extend validation messages
  safeExtendOverlap: (keys: string[]) => `לא ניתן לדרוס מפתחות קיימים: ${keys.join(', ')}. השתמשו ב-extend() אם ברצונכם לדרוס.`,
};
