import { LocaleMessages } from './types';

// Greek (ported 2026-10-27)
export const el: LocaleMessages = {
  // String validation messages
  invalidString: 'Μη έγκυρη συμβολοσειρά',
  stringMin: (min: number) => `Η συμβολοσειρά πρέπει να έχει τουλάχιστον ${min} χαρακτήρες`,
  stringMax: (max: number) => `Η συμβολοσειρά πρέπει να έχει το πολύ ${max} χαρακτήρες`,
  stringLength: (length: number) => `Η συμβολοσειρά πρέπει να έχει ακριβώς ${length} χαρακτήρες`,
  stringEmail: 'Μη έγκυρη διεύθυνση email',
  stringUrl: 'Μη έγκυρο URL',
  stringUuid: 'Μη έγκυρο UUID',
  stringRegex: 'Μη έγκυρη μορφή',
  stringStartsWith: (prefix: string) => `Η συμβολοσειρά πρέπει να ξεκινά με "${prefix}"`,
  stringEndsWith: (suffix: string) => `Η συμβολοσειρά πρέπει να τελειώνει με "${suffix}"`,
  stringIncludes: (substring: string) => `Η συμβολοσειρά πρέπει να περιλαμβάνει "${substring}"`,
  stringIp: 'Μη έγκυρη διεύθυνση IP',
  stringIpv4: 'Μη έγκυρη διεύθυνση IPv4',
  stringIpv6: 'Μη έγκυρη διεύθυνση IPv6',
  stringEmpty: 'Η συμβολοσειρά δεν πρέπει να είναι κενή',

  // Number validation messages
  invalidNumber: 'Μη έγκυρος αριθμός',
  numberMin: (min: number) => `Ο αριθμός πρέπει να είναι τουλάχιστον ${min}`,
  numberMax: (max: number) => `Ο αριθμός πρέπει να είναι το πολύ ${max}`,
  numberInt: 'Ο αριθμός πρέπει να είναι ακέραιος',
  numberPositive: 'Ο αριθμός πρέπει να είναι θετικός',
  numberNegative: 'Ο αριθμός πρέπει να είναι αρνητικός',
  numberNonnegative: 'Ο αριθμός δεν πρέπει να είναι αρνητικός',
  numberNonpositive: 'Ο αριθμός δεν πρέπει να είναι θετικός',
  numberFinite: 'Ο αριθμός πρέπει να είναι πεπερασμένος',
  numberSafe: 'Ο αριθμός πρέπει να είναι ασφαλής ακέραιος',
  numberMultipleOf: (value: number) => `Ο αριθμός πρέπει να είναι πολλαπλάσιο του ${value}`,

  // Boolean validation messages
  invalidBoolean: 'Μη έγκυρη λογική τιμή',

  // Date validation messages
  invalidDate: 'Μη έγκυρη ημερομηνία',
  dateMin: (date: Date) => `Η ημερομηνία πρέπει να είναι μετά από ${date.toISOString()}`,
  dateMax: (date: Date) => `Η ημερομηνία πρέπει να είναι πριν από ${date.toISOString()}`,

  // Object validation messages
  invalidObject: 'Μη έγκυρο αντικείμενο',
  unexpectedKeys: (keys: string[]) => `Μη αναμενόμενα κλειδιά: ${keys.join(', ')}`,
  requiredField: (field: string) => `Λείπει το υποχρεωτικό πεδίο "${field}"`,

  // Array validation messages
  invalidArray: 'Μη έγκυρος πίνακας',
  arrayMin: (min: number) => `Ο πίνακας πρέπει να έχει τουλάχιστον ${min} στοιχεία`,
  arrayMax: (max: number) => `Ο πίνακας πρέπει να έχει το πολύ ${max} στοιχεία`,
  arrayLength: (length: number) => `Ο πίνακας πρέπει να έχει ακριβώς ${length} στοιχεία`,
  arrayEmpty: 'Ο πίνακας δεν πρέπει να είναι κενός',
  arrayItem: (index: number, error: string) => `Μη έγκυρο στοιχείο με δείκτη ${index}: ${error}`,

  // Object field validation
  objectField: (field: string, error: string) => `Μη έγκυρο πεδίο "${field}": ${error}`,

  // Union validation messages
  unionNoMatch: () => `Μη έγκυρα δεδομένα`,

  // Intersection validation messages
  intersectionError: (error: string) => `Σφάλμα επικύρωσης τομής: ${error}`,

  // Literal validation messages
  literalExpected: (expected: string, received: string) => `Αναμενόταν ${expected}, ελήφθη ${received}`,

  // Enum validation messages
  enumExpected: (values: any[], received: string) => `Αναμενόταν ένα από [${values.join(', ')}], ελήφθη ${received}`,

  // Special type validation messages
  expectedUndefined: 'Αναμενόταν undefined',
  neverType: 'Ο τύπος never δεν μπορεί να αναλυθεί',

  // New advanced type validation messages
  invalidBigint: 'Μη έγκυρο bigint',
  invalidSymbol: 'Μη έγκυρο symbol',
  invalidTuple: 'Μη έγκυρη πλειάδα',
  tupleLength: (expected: number, received: number) => `Η πλειάδα πρέπει να έχει ακριβώς ${expected} στοιχεία, ελήφθησαν ${received}`,
  invalidRecord: 'Μη έγκυρη εγγραφή',
  invalidSet: 'Μη έγκυρο σύνολο',
  invalidMap: 'Μη έγκυρος χάρτης',

  // Transformation and refinement messages
  transformError: (error: string) => `Σφάλμα μετασχηματισμού: ${error}`,
  refinementError: (error: string) => `Σφάλμα βελτίωσης: ${error}`,
  customValidationError: (error: string) => `Σφάλμα προσαρμοσμένης επικύρωσης: ${error}`,

  // Coercion messages
  coercionFailed: (type: string, value: unknown) => `Δεν είναι δυνατή η μετατροπή του ${JSON.stringify(value)} σε ${type}`,

  // Codec messages
  codecDecodeFailed: 'Αποτυχία αποκωδικοποίησης τιμής',
  codecEncodeFailed: 'Αποτυχία κωδικοποίησης τιμής',
  codecAsyncNotSupported: 'Οι ασύγχρονες λειτουργίες codec απαιτούν τις μεθόδους parseAsync/encodeAsync',

  // Base64/Hex messages
  invalidBase64: 'Μη έγκυρη συμβολοσειρά base64',
  invalidHex: 'Μη έγκυρη δεκαεξαδική συμβολοσειρά',

  // Uint8Array messages
  expectedUint8Array: 'Αναμενόταν Uint8Array',
  uint8ArrayMinLength: (min: number) => `Το Uint8Array πρέπει να έχει τουλάχιστον ${min} bytes`,
  uint8ArrayMaxLength: (max: number) => `Το Uint8Array πρέπει να έχει το πολύ ${max} bytes`,
  uint8ArrayExactLength: (length: number) => `Το Uint8Array πρέπει να έχει ακριβώς ${length} bytes`,

  // Generic type error messages
  expectedString: 'Αναμενόταν συμβολοσειρά',
  stringExpected: (received: string, expected: string) => `Αναμενόταν ${expected}, ελήφθη ${received}`,
  stringBoolExpected: (validValues: string, received: string) => `Μη έγκυρη λογική συμβολοσειρά. Αναμενόταν ένα από: ${validValues}, ελήφθη "${received}"`,
  invalidJson: 'Μη έγκυρο JSON',
  stringPatternInvalid: 'Η συμβολοσειρά δεν ταιριάζει με το απαιτούμενο μοτίβο',

  // File validation messages
  invalidFile: 'Αναμενόταν αντικείμενο File',
  fileNotSupported: 'Το File API δεν υποστηρίζεται σε αυτό το περιβάλλον',
  fileMinSize: (min: number) => `Το μέγεθος του αρχείου πρέπει να είναι τουλάχιστον ${min} bytes`,
  fileMaxSize: (max: number) => `Το μέγεθος του αρχείου δεν πρέπει να υπερβαίνει τα ${max} bytes`,
  fileMimeType: (allowed: string[]) => `Μη έγκυρος τύπος αρχείου. Αναμενόταν: ${allowed.join(', ')}`,

  // Function validation messages
  invalidFunction: 'Αναμενόταν συνάρτηση',

  // CIDR validation messages
  stringCidrv4: 'Μη έγκυρο μπλοκ CIDR IPv4',
  stringCidrv6: 'Μη έγκυρο μπλοκ CIDR IPv6',

  // Safe extend validation messages
  safeExtendOverlap: (keys: string[]) => `Δεν είναι δυνατή η αντικατάσταση υπαρχόντων κλειδιών: ${keys.join(', ')}. Χρησιμοποιήστε το extend() αν θέλετε να τα αντικαταστήσετε.`,
};
