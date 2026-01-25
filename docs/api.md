# VLD API Reference

Complete API documentation for the VLD validation library (v2.0 - Modular Architecture + Full Zod 4 API Parity + Plugin System + CLI Tools).

## Table of Contents

- [Installation](#installation)
- [Import Options](#import-options)
- [Basic Usage](#basic-usage)
- [Core Methods](#core-methods)
- [Primitive Types](#primitive-types)
- [String Format Validators](#string-format-validators)
- [Object Schemas](#object-schemas)
- [Array Schemas](#array-schemas)
- [Advanced Types](#advanced-types)
- [Discriminated Unions](#discriminated-unions)
- [Type Modifiers](#type-modifiers)
- [Validation Methods](#validation-methods)
- [Transformation Methods](#transformation-methods)
- [Preprocessing](#preprocessing)
- [Custom Validators](#custom-validators)
- [File Validation](#file-validation)
- [Function Validation](#function-validation)
- [Codecs - Bidirectional Transformations](#codecs---bidirectional-transformations)
- [Built-in Codecs](#built-in-codecs)
- [Binary Data Validators](#binary-data-validators)
- [Custom Codecs](#custom-codecs)
- [Error Handling](#error-handling)
- [Type Inference](#type-inference)

## Installation

```bash
npm install @oxog/vld
# or
yarn add @oxog/vld
# or
pnpm add @oxog/vld
```

## Import Options

VLD v2.0 provides multiple import strategies for different needs:

### Full API (Classic)
```typescript
import { v, setLocale } from '@oxog/vld';
setLocale('tr');
const schema = v.string().min(1);
```

### Tree-Shakable Mini API (NEW in v2.0)
Ideal for production applications where bundle size matters:
```typescript
import { string, number, object, optional, array } from '@oxog/vld/mini';

const userSchema = object({
  name: string().min(1),
  age: optional(number().positive()),
  tags: array(string()),
});
```

### Lazy Locale Loading (NEW in v2.0)
Load locales on demand to reduce initial bundle size:
```typescript
import { setLocaleAsync, preloadLocales } from '@oxog/vld/locales';

// Async loading
await setLocaleAsync('tr');

// Preload for SSR
await preloadLocales(['en', 'tr', 'de']);
```

### Individual Imports
Import only what you need:
```typescript
import { VldString } from '@oxog/vld/validators/string';
import { stringToNumber } from '@oxog/vld/codecs';
import { VldError, prettifyError } from '@oxog/vld/errors';
```

## Basic Usage

```typescript
import { v } from '@oxog/vld';

// Create a schema
const schema = v.string();

// Parse data
const result = schema.parse("hello"); // "hello"

// Safe parse without throwing
const safeResult = schema.safeParse("hello");
if (safeResult.success) {
  console.log(safeResult.data); // "hello"
} else {
  console.log(safeResult.error);
}
```

## Core Methods

### `parse(value: unknown): T`

Validates and returns typed data. Throws `VldError` on validation failure.

```typescript
const schema = v.string();
const result = schema.parse("hello"); // "hello"
schema.parse(123); // Throws VldError
```

### `safeParse(value: unknown): ParseResult<T>`

Safe validation that returns a result object instead of throwing.

```typescript
const schema = v.string();
const result = schema.safeParse("hello");

if (result.success) {
  console.log(result.data); // "hello"
} else {
  console.log(result.error); // VldError object
}
```

### `isValid(value: unknown): boolean`

Check if a value is valid without parsing.

```typescript
const schema = v.string();
schema.isValid("hello"); // true
schema.isValid(123); // false
```

## Primitive Types

### String

```typescript
const schema = v.string();
```

**Methods:**
- `.min(length: number, message?: string)` - Minimum length
- `.max(length: number, message?: string)` - Maximum length
- `.length(length: number, message?: string)` - Exact length
- `.email(message?: string)` - Email validation
- `.url(message?: string)` - URL validation
- `.uuid(message?: string)` - UUID validation
- `.regex(pattern: RegExp, message?: string)` - Regex pattern
- `.includes(substring: string, message?: string)` - Contains substring
- `.startsWith(prefix: string, message?: string)` - Starts with prefix
- `.endsWith(suffix: string, message?: string)` - Ends with suffix
- `.ip(message?: string)` - IP address (v4 or v6)
- `.trim()` - Trim whitespace
- `.toLowerCase()` - Convert to lowercase
- `.toUpperCase()` - Convert to uppercase
- `.nonempty(message?: string)` - Non-empty string

### Number

```typescript
const schema = v.number();
```

**Methods:**
- `.min(value: number, message?: string)` - Minimum value
- `.max(value: number, message?: string)` - Maximum value
- `.positive(message?: string)` - Positive numbers only
- `.negative(message?: string)` - Negative numbers only
- `.nonnegative(message?: string)` - >= 0
- `.nonpositive(message?: string)` - <= 0
- `.int(message?: string)` - Integers only
- `.finite(message?: string)` - Finite numbers only
- `.safe(message?: string)` - Safe integers only
- `.multipleOf(value: number, message?: string)` - Multiple of value

**Shorthand validators:**

```typescript
// Integer validator (shorthand for v.number().int())
v.int()

// 32-bit integer validator
v.int32()  // -2147483648 to 2147483647
```

### Boolean

```typescript
const schema = v.boolean();
```

### BigInt

```typescript
const schema = v.bigint();
```

**Methods:**
- `.min(value: bigint, message?: string)` - Minimum value
- `.max(value: bigint, message?: string)` - Maximum value
- `.positive(message?: string)` - Positive values only
- `.negative(message?: string)` - Negative values only
- `.nonnegative(message?: string)` - >= 0n
- `.nonpositive(message?: string)` - <= 0n

### Date

```typescript
const schema = v.date();
```

**Methods:**
- `.min(date: Date, message?: string)` - Minimum date
- `.max(date: Date, message?: string)` - Maximum date

### StringBool

Validates and converts string boolean values like "true", "false", "yes", "no", "1", "0".

```typescript
const schema = v.stringbool();

schema.parse("true");   // true
schema.parse("false");  // false
schema.parse("yes");    // true
schema.parse("no");     // false
schema.parse("1");      // true
schema.parse("0");      // false

// Custom truthy/falsy values
const customSchema = v.stringbool({
  truthy: ["on", "enabled"],
  falsy: ["off", "disabled"],
  caseSensitive: false
});
```

### Other Primitives

```typescript
v.symbol()      // Symbol type
v.undefined()   // Undefined only
v.null()        // Null only
v.void()        // Undefined (alias)
v.any()         // Any type
v.unknown()     // Unknown type
v.never()       // Never type
v.nan()         // NaN type

// NEVER constant for use in transforms
v.NEVER         // Returns never type (useful in conditional transforms)
```

## String Format Validators

VLD provides standalone string format validators for common patterns (Zod 4 API parity):

### Email

```typescript
const schema = v.email();
schema.parse("user@example.com"); // OK

// Custom pattern
const customEmail = v.email({ pattern: /^[a-z]+@company\.com$/ });
```

### UUID

```typescript
const schema = v.uuid();                    // Any UUID version
const v4Schema = v.uuid({ version: 'v4' }); // UUID v4 only
const v4Short = v.uuidv4();                 // Shorthand for v4
```

### IP Addresses

```typescript
v.ipv4();     // IPv4 address
v.ipv6();     // IPv6 address
v.cidrv4();   // IPv4 CIDR notation
v.cidrv6();   // IPv6 CIDR notation
v.mac();      // MAC address
```

### Encoding Formats

```typescript
v.base64();      // Base64 encoded string
v.base64url();   // Base64URL encoded string
v.hex();         // Hexadecimal string
v.jwt();         // JSON Web Token format
```

### Identifiers

```typescript
v.nanoid();    // NanoID format
v.cuid();      // CUID format
v.cuid2();     // CUID2 format
v.ulid();      // ULID format
```

### Other Formats

```typescript
v.hostname();  // Valid hostname
v.emoji();     // Emoji character(s)
v.e164();      // E.164 phone number format

// Hash algorithms
v.hash('md5');
v.hash('sha1');
v.hash('sha256');
v.hash('sha384');
v.hash('sha512');
```

### ISO Formats

```typescript
v.iso.date();      // ISO date (YYYY-MM-DD)
v.iso.time();      // ISO time (HH:mm:ss)
v.iso.dateTime();  // ISO datetime
v.iso.duration();  // ISO duration (P1Y2M3D)
```

### Custom String Formats

```typescript
// With regex
const productCode = v.stringFormat('productCode', /^PRD-\d{6}$/);

// With function
const evenDigits = v.stringFormat('evenDigits', (val) => {
  return /^\d+$/.test(val) && val.length % 2 === 0;
});
```

### Template Literals

Create validators for template literal patterns:

```typescript
const urlPath = v.templateLiteral('/api/', v.string(), '/users/', v.number());
urlPath.parse('/api/v1/users/123'); // OK
urlPath.parse('/api/v2/users/456'); // OK
```

## Object Schemas

### Creating Object Schemas

```typescript
const userSchema = v.object({
  name: v.string(),
  age: v.number(),
  email: v.string().email()
});

// Strict object - no extra properties allowed (Zod 4 parity)
const strictSchema = v.strictObject({
  name: v.string()
});

// Loose object - extra properties passed through (Zod 4 parity)
const looseSchema = v.looseObject({
  name: v.string()
});
```

### Object Methods

```typescript
const schema = v.object({ name: v.string() });

// Strict mode - no extra properties
schema.strict();

// Allow extra properties
schema.passthrough();

// Make all properties optional
schema.partial();

// Pick specific properties
schema.pick('name', 'email');

// Omit specific properties
schema.omit('password');

// Extend with new properties
schema.extend({
  phone: v.string()
});
```

### JSON Validator

Validate and parse JSON strings:

```typescript
// Parse any valid JSON
const jsonSchema = v.json();
jsonSchema.parse('{"name":"John"}'); // { name: "John" }

// Parse JSON with schema validation
const typedJson = v.json(v.object({
  name: v.string(),
  age: v.number()
}));
typedJson.parse('{"name":"John","age":30}'); // Typed result
```

## Array Schemas

### Creating Array Schemas

```typescript
const schema = v.array(v.string());
```

### Array Methods

```typescript
const schema = v.array(v.string());

// Length constraints
schema.min(1);         // Minimum length
schema.max(10);        // Maximum length
schema.length(5);      // Exact length
schema.nonempty();     // At least one item
```

## Advanced Types

### Union Types

```typescript
// Accept multiple types
const schema = v.union(
  v.string(),
  v.number(),
  v.boolean()
);

schema.parse("hello"); // OK
schema.parse(123);     // OK
schema.parse(true);    // OK
```

### Intersection Types

```typescript
const personSchema = v.object({ name: v.string() });
const employeeSchema = v.object({ employeeId: v.string() });

// Combine schemas
const schema = v.intersection(personSchema, employeeSchema);
// Result: { name: string, employeeId: string }
```

### Literal Values

```typescript
const statusSchema = v.literal("active");
statusSchema.parse("active"); // OK
statusSchema.parse("inactive"); // Error
```

### Enum Values

```typescript
const colorSchema = v.enum("red", "green", "blue");
colorSchema.parse("red");   // OK
colorSchema.parse("yellow"); // Error
```

### Tuple Types

```typescript
const coordinateSchema = v.tuple(
  v.number(),  // latitude
  v.number()   // longitude
);

coordinateSchema.parse([40.7128, -74.0060]); // OK
```

### Record Types

```typescript
// Dictionary with string keys and number values
const scoresSchema = v.record(v.number());

scoresSchema.parse({
  math: 95,
  science: 87,
  history: 92
}); // OK

// Partial record - values can be undefined (Zod 4 parity)
const partialConfig = v.partialRecord(v.string());

// Loose record - allows extra value types (Zod 4 parity)
const looseConfig = v.looseRecord(v.number());
```

### XOR Types (Zod 4 Parity)

Exactly one of the given validators must match:

```typescript
const paymentSchema = v.xor(
  v.object({ type: v.literal('card'), cardNumber: v.string() }),
  v.object({ type: v.literal('bank'), accountNumber: v.string() })
);

// OK - exactly one matches
paymentSchema.parse({ type: 'card', cardNumber: '1234' });

// Error - neither or both match
paymentSchema.parse({ type: 'other', value: 123 });
```

### Set Types

```typescript
const tagsSchema = v.set(v.string());

const tags = new Set(["javascript", "typescript"]);
tagsSchema.parse(tags); // OK
```

### Map Types

```typescript
const configSchema = v.map(
  v.string(),  // key type
  v.number()   // value type
);

const config = new Map([
  ["timeout", 5000],
  ["retries", 3]
]);
configSchema.parse(config); // OK
```

## Discriminated Unions

Efficiently validate unions using a discriminator key (Zod 4 parity):

```typescript
const resultSchema = v.discriminatedUnion('status',
  v.object({ status: v.literal('success'), data: v.string() }),
  v.object({ status: v.literal('error'), message: v.string() })
);

// Valid
resultSchema.parse({ status: 'success', data: 'Hello' });
resultSchema.parse({ status: 'error', message: 'Failed' });

// Invalid - unknown status
resultSchema.parse({ status: 'pending' }); // Error
```

## Type Modifiers

### Optional

Makes a type accept `undefined`.

```typescript
const schema = v.string().optional();
// Type: string | undefined

schema.parse("hello");    // "hello"
schema.parse(undefined);  // undefined
```

### Nullable

Makes a type accept `null`.

```typescript
const schema = v.string().nullable();
// Type: string | null

schema.parse("hello"); // "hello"
schema.parse(null);    // null
```

### Nullish

Makes a type accept both `null` and `undefined`.

```typescript
const schema = v.string().nullish();
// Type: string | null | undefined

schema.parse("hello");    // "hello"
schema.parse(null);       // null
schema.parse(undefined);  // undefined
```

## Validation Methods

### Custom Validation with `refine()`

Add custom validation logic.

```typescript
const ageSchema = v.number()
  .refine(age => age >= 18, "Must be 18 or older");

const emailSchema = v.string()
  .refine(
    email => email.includes("@company.com"),
    "Must be a company email"
  );
```

### Default Values

Provide default values for `undefined` inputs.

```typescript
const schema = v.string().default("guest");

schema.parse(undefined); // "guest"
schema.parse("john");    // "john"
```

### Catch Errors

Provide fallback values when validation fails.

```typescript
const schema = v.number().catch(0);

schema.parse(42);        // 42
schema.parse("invalid"); // 0
```

## Transformation Methods

### Transform Values

Transform valid values after validation.

```typescript
const schema = v.string()
  .transform(str => str.toUpperCase());

schema.parse("hello"); // "HELLO"
```

### Chaining Transformations

```typescript
const schema = v.string()
  .transform(str => str.trim())
  .transform(str => str.toLowerCase())
  .transform(str => str.replace(/\s+/g, '-'));

schema.parse("  Hello World  "); // "hello-world"
```

## Preprocessing

Transform input before validation:

```typescript
const schema = v.preprocess(
  (input) => typeof input === 'string' ? input.trim() : input,
  v.string().min(1)
);

schema.parse("  hello  "); // "hello"
```

## Custom Validators

Create fully custom validators with type safety:

```typescript
const positiveEven = v.custom<number>({
  check: (val) => typeof val === 'number' && val > 0 && val % 2 === 0,
  message: 'Must be a positive even number'
});

positiveEven.parse(4);  // OK
positiveEven.parse(3);  // Error
positiveEven.parse(-2); // Error
```

## File Validation

Validate file uploads (browser File API):

```typescript
const imageSchema = v.file()
  .type(['image/jpeg', 'image/png', 'image/gif'])
  .maxSize(5 * 1024 * 1024); // 5MB

// In form handler
const file = formData.get('avatar');
const result = imageSchema.safeParse(file);
```

## Function Validation

Validate functions:

```typescript
const callbackSchema = v.function();

callbackSchema.parse(() => {}); // OK
callbackSchema.parse(async () => {}); // OK
callbackSchema.parse('not a function'); // Error
```

## Error Handling

### Error Structure

```typescript
interface ParseResult<T> {
  success: boolean;
  data?: T;
  error?: VldError;
}

interface VldError {
  message: string;
  path?: (string | number)[];
  issues?: VldIssue[];
}
```

### Error Formatting Utilities

```typescript
import { treeifyError, prettifyError, flattenError } from '@oxog/vld';

const schema = v.object({
  name: v.string().min(2),
  email: v.string().email()
});

const result = schema.safeParse({ name: "a", email: "invalid" });

if (!result.success) {
  // Tree format - nested structure
  const tree = treeifyError(result.error);
  
  // Pretty format - human-readable
  const pretty = prettifyError(result.error);
  
  // Flat format - for forms
  const flat = flattenError(result.error);
}
```

## Type Inference

### Infer Types from Schemas

```typescript
import { v, Infer } from '@oxog/vld';

const userSchema = v.object({
  id: v.string(),
  name: v.string(),
  age: v.number(),
  email: v.string().email(),
  isActive: v.boolean()
});

// Automatically infer the TypeScript type
type User = Infer<typeof userSchema>;
// Result: {
//   id: string;
//   name: string;
//   age: number;
//   email: string;
//   isActive: boolean;
// }
```

### Using Inferred Types

```typescript
// Function with inferred parameter type
function processUser(user: Infer<typeof userSchema>) {
  console.log(user.name); // TypeScript knows all properties
}

// Variable with inferred type
const validUser: Infer<typeof userSchema> = {
  id: "123",
  name: "John",
  age: 30,
  email: "john@example.com",
  isActive: true
};
```

## Type Coercion

### Coerce to String

```typescript
const schema = v.coerce.string();

schema.parse(123);        // "123"
schema.parse(true);       // "true"
schema.parse([1, 2, 3]);  // "1,2,3"
```

### Coerce to Number

```typescript
const schema = v.coerce.number();

schema.parse("42");       // 42
schema.parse("3.14");     // 3.14
schema.parse(true);       // 1
schema.parse(false);      // 0
```

### Coerce to Boolean

```typescript
const schema = v.coerce.boolean();

schema.parse("true");     // true
schema.parse("false");    // false
schema.parse(1);          // true
schema.parse(0);          // false
schema.parse("yes");      // true
```

### Coerce to Date

```typescript
const schema = v.coerce.date();

schema.parse("2024-01-01");     // Date object
schema.parse(1704067200000);    // Date from timestamp
schema.parse(new Date());       // Date object (passthrough)
```

### Coerce to BigInt

```typescript
const schema = v.coerce.bigint();

schema.parse("123");      // 123n
schema.parse(456);        // 456n
```

## Codecs - Bidirectional Transformations

Codecs enable bidirectional data transformations. Unlike simple transforms, codecs can both decode (input → output) and encode (output → input).

### Basic Codec Usage

```typescript
import { v } from '@oxog/vld';

// Create a custom codec
const stringToNumberCodec = v.codec(
  v.string(),    // Input validator
  v.number(),    // Output validator
  {
    decode: (str: string) => parseFloat(str),    // string → number
    encode: (num: number) => num.toString()      // number → string
  }
);

// Use the codec
const number = stringToNumberCodec.parse("42.5");   // 42.5 (number)
const string = stringToNumberCodec.encode(99.9);    // "99.9" (string)
```

### Async Codecs

```typescript
const asyncCodec = v.codec(
  v.string(),
  v.object({ result: v.string() }),
  {
    decode: async (input: string) => {
      const response = await fetch(`/api/process?data=${input}`);
      return response.json();
    },
    encode: async (output) => {
      const response = await fetch('/api/serialize', {
        method: 'POST',
        body: JSON.stringify(output)
      });
      return response.text();
    }
  }
);

// Use async methods
const result = await asyncCodec.parseAsync("input");
const serialized = await asyncCodec.encodeAsync({ result: "output" });
```

## Built-in Codecs

VLD includes 19 ready-to-use codecs for common transformations:

### String Conversion Codecs

```typescript
import { 
  stringToNumber, 
  stringToInt, 
  stringToBigInt, 
  numberToBigInt,
  stringToBoolean 
} from '@oxog/vld';

// String to number with validation
const age = stringToNumber.parse("25");    // 25
const ageStr = stringToNumber.encode(30);  // "30"

// String to integer (validates integer constraint)
const count = stringToInt.parse("42");     // 42
stringToInt.parse("42.5");                 // ❌ Error: must be integer

// String to BigInt for large numbers
const bigNum = stringToBigInt.parse("999999999999999999999");  // BigInt

// Number to BigInt conversion
const converted = numberToBigInt.parse(123);  // 123n

// Flexible boolean parsing
stringToBoolean.parse("true");    // true
stringToBoolean.parse("1");       // true  
stringToBoolean.parse("yes");     // true
stringToBoolean.parse("on");      // true
stringToBoolean.parse("false");   // false
stringToBoolean.parse("0");       // false
```

### Date Conversion Codecs

```typescript
import { 
  isoDatetimeToDate, 
  epochSecondsToDate, 
  epochMillisToDate 
} from '@oxog/vld';

// ISO string to Date
const date1 = isoDatetimeToDate.parse("2023-12-25T10:30:00.000Z");
const isoString = isoDatetimeToDate.encode(new Date());

// Unix seconds to Date  
const date2 = epochSecondsToDate.parse(1703505000);
const seconds = epochSecondsToDate.encode(new Date());

// Unix milliseconds to Date
const date3 = epochMillisToDate.parse(1703505000000);
const millis = epochMillisToDate.encode(new Date());
```

### JSON and Complex Data

```typescript
import { jsonCodec, base64Json } from '@oxog/vld';

// Generic JSON codec
const json = jsonCodec();
const data = json.parse('{"name":"John","age":30}');
const jsonString = json.encode({ name: "Jane", age: 25 });

// Typed JSON codec with schema validation
const userSchema = v.object({
  name: v.string(),
  age: v.number()
});
const typedJson = jsonCodec(userSchema);
const user = typedJson.parse('{"name":"Alice","age":30}'); // Fully typed!

// Base64-encoded JSON
const b64Json = base64Json(userSchema);
const encoded = b64Json.encode({ name: "Bob", age: 40 });
const decoded = b64Json.parse(encoded);
```

### URL and Web Codecs

```typescript
import { stringToURL, stringToHttpURL, uriComponent } from '@oxog/vld';

// String to URL object
const url = stringToURL.parse("https://example.com/path?param=value");
console.log(url.hostname);  // "example.com"
console.log(url.pathname);  // "/path"

// HTTP/HTTPS only URLs
const httpUrl = stringToHttpURL.parse("https://api.example.com");
stringToHttpURL.parse("ftp://files.com");  // ❌ Error: Must be HTTP/HTTPS

// URI component encoding
const encoded = uriComponent.parse("Hello World!");  // "Hello%20World!"
const decoded = uriComponent.encode("Hello%20World!");  // "Hello World!"
```

### Binary Data Codecs

```typescript
import {
  base64ToBytes,
  base64urlToBytes,
  hexToBytes,
  hexLowerToBytes,
  utf8ToBytes,
  bytesToUtf8
} from '@oxog/vld';

// Base64 to Uint8Array
const bytes1 = base64ToBytes.parse("SGVsbG8gV29ybGQ=");
const base64 = base64ToBytes.encode(bytes1);

// Base64URL to Uint8Array (URL-safe)
const bytes2 = base64urlToBytes.parse("SGVsbG8gV29ybGQ");  // No padding

// Hex to Uint8Array
const bytes3 = hexToBytes.parse("48656c6c6f");
const hex = hexToBytes.encode(bytes3);

// Hex lowercase only
const bytes4 = hexLowerToBytes.parse("48656c6c6f");

// UTF-8 string to bytes
const bytes5 = utf8ToBytes.parse("Hello! 👋");
const text = bytesToUtf8.parse(bytes5);
```

## Binary Data Validators

Validators for binary data types:

```typescript
// Base64 string to Uint8Array
const base64Schema = v.base64Bytes();
base64Schema.parse("SGVsbG8="); // Uint8Array

// Hex string to Uint8Array
const hexSchema = v.hexBytes();
hexSchema.parse("48656c6c6f"); // Uint8Array

// Uint8Array validator
const bytesSchema = v.uint8Array();
bytesSchema.parse(new Uint8Array([1, 2, 3])); // OK
```

### JWT Payload Decoder

```typescript
import { jwtPayload } from '@oxog/vld';

// Decode JWT payload (read-only)
const payloadSchema = v.object({
  sub: v.string(),
  name: v.string(),
  iat: v.number()
});

const decoder = jwtPayload(payloadSchema);
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
const payload = decoder.parse(token);
console.log(payload.name);  // "John Doe" (fully typed!)
```

## Custom Codecs

Create your own codecs for specific use cases:

### Simple Custom Codec

```typescript
// CSV to array codec
const csvToArray = v.codec(
  v.string(),
  v.array(v.string()),
  {
    decode: (csv: string) => csv.split(',').map(s => s.trim()),
    encode: (arr: string[]) => arr.join(', ')
  }
);

const tags = csvToArray.parse("react, typescript, vld");
const csv = csvToArray.encode(["node", "express", "api"]);
```

### Complex Custom Codec

```typescript
// Environment variables codec
const envCodec = v.codec(
  v.string(),
  v.object({
    port: v.number(),
    debug: v.boolean(),
    dbUrl: v.string().url()
  }),
  {
    decode: (envString: string) => {
      const config: any = {};
      envString.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key === 'PORT') config.port = parseInt(value, 10);
        if (key === 'DEBUG') config.debug = value === 'true';
        if (key === 'DB_URL') config.dbUrl = value;
      });
      return config;
    },
    encode: (config) => [
      `PORT=${config.port}`,
      `DEBUG=${config.debug}`,
      `DB_URL=${config.dbUrl}`
    ].join('\n')
  }
);
```

### Error Handling with Codecs

```typescript
// Safe parse
const result = stringToNumber.safeParse("not-a-number");
if (!result.success) {
  console.error("Parse failed:", result.error.message);
} else {
  console.log("Parsed:", result.data);
}

// Safe encode  
const encodeResult = stringToNumber.safeEncode("invalid-input");
if (!encodeResult.success) {
  console.error("Encode failed:", encodeResult.error.message);
}
```

### Codec vs Transform Comparison

| Feature | Codec | Transform |
|---------|--------|-----------|
| **Direction** | Bidirectional (parse/encode) | Unidirectional (transform only) |
| **Type Safety** | Input and output validation | Output validation only |
| **Use Cases** | Serialization, API boundaries | Data cleaning, formatting |
| **Methods** | `parse()`, `encode()`, `safeParse()`, `safeEncode()` | `parse()`, `safeParse()` |

```typescript
// Transform: One-way only
const upperTransform = v.string().transform(s => s.toUpperCase());
const result = upperTransform.parse("hello"); // "HELLO"
// ❌ No way to get back to "hello"

// Codec: Two-way conversion
const upperCodec = v.codec(
  v.string(),
  v.string(),
  {
    decode: s => s.toUpperCase(),
    encode: s => s.toLowerCase()  
  }
);
const upper = upperCodec.parse("hello");    // "HELLO" 
const lower = upperCodec.encode("HELLO");   // "hello"
```

---

For more examples and advanced usage, see the [Getting Started Guide](./GETTING_STARTED.md) and [Advanced Features](./ADVANCED_FEATURES.md) documentation.