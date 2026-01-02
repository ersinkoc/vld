# @oxog/vld - LLM Documentation

> Ultra-fast TypeScript-first schema validation with zero dependencies and 27+ language support

**Version:** 1.4.0
**License:** MIT
**Repository:** https://github.com/ersinkoc/vld
**Author:** Ersin Koc

---

## Quick Reference

### Installation

```bash
npm install @oxog/vld
# or
yarn add @oxog/vld
# or
pnpm add @oxog/vld
```

### Quick Start

```typescript
import { v, Infer } from '@oxog/vld';

// Define a schema
const userSchema = v.object({
  name: v.string().min(2),
  email: v.string().email(),
  age: v.number().min(18).max(100),
  isActive: v.boolean()
});

// Infer TypeScript type
type User = Infer<typeof userSchema>;

// Validate data
const result = userSchema.safeParse({
  name: 'John Doe',
  email: 'john@example.com',
  age: 25,
  isActive: true
});

if (result.success) {
  console.log('Valid user:', result.data);
} else {
  console.log('Validation error:', result.error);
}
```

---

## Package Overview

### Purpose
VLD is a blazing-fast, type-safe validation library for TypeScript and JavaScript with full Zod API parity. Built for performance, it provides an intuitive API while maintaining excellent type inference and comprehensive internationalization support.

### Key Features
- **Zero Dependencies**: Lightweight with no external runtime dependencies
- **Blazing Fast**: 2.52x faster than Zod on average, optimized for V8 engine
- **Full TypeScript Support**: Excellent type inference with strict mode
- **100% Zod API Compatible**: Drop-in replacement for Zod
- **27+ Languages**: Built-in internationalization support
- **19 Built-in Codecs**: Bidirectional data transformations
- **96.55% Test Coverage**: Rigorously tested with 1142 passing tests
- **Tree-Shakeable**: Only import what you need
- **Immutable Validators**: Prevents memory leaks and race conditions

### Architecture
VLD uses an immutable validator pattern where each validator method returns a new instance. The core `VldBase` class provides the foundation for all validators with `parse()`, `safeParse()`, and chainable methods like `refine()`, `transform()`, `default()`, and `catch()`.

### Dependencies
- **Runtime:** Zero runtime dependencies
- **Peer:** None required

---

## API Reference

### Exports Summary

| Export | Type | Description |
|--------|------|-------------|
| `v` | object | Main API object with all factory methods |
| `VldBase` | class | Base class for all validators |
| `Infer` | type | Type inference helper |
| `Input` | type | Input type inference |
| `Output` | type | Output type inference |
| `setLocale` | function | Set the current locale |
| `getLocale` | function | Get the current locale |
| `getMessages` | function | Get localized messages |
| `VldError` | class | Validation error class |
| `treeifyError` | function | Convert error to tree structure |
| `prettifyError` | function | Convert error to readable string |
| `flattenError` | function | Flatten error for forms |

### Primitive Validators

#### `v.string()`

Creates a string validator.

```typescript
v.string()
  .min(5)                    // Minimum length
  .max(10)                   // Maximum length
  .length(8)                 // Exact length
  .email()                   // Email format
  .url()                     // URL format
  .uuid()                    // UUID format
  .regex(/pattern/)          // Custom regex
  .startsWith('prefix')      // String prefix
  .endsWith('suffix')        // String suffix
  .includes('substring')     // Contains substring
  .ip()                      // IP address (v4 or v6)
  .ipv4()                    // IPv4 only
  .ipv6()                    // IPv6 only
  .trim()                    // Trim whitespace
  .toLowerCase()             // Convert to lowercase
  .toUpperCase()             // Convert to uppercase
  .nonempty()                // Non-empty string
```

**Example:**

```typescript
const emailSchema = v.string().email();
emailSchema.parse('user@example.com'); // "user@example.com"
emailSchema.parse('invalid'); // throws Error

const passwordSchema = v.string().min(8).max(100);
passwordSchema.parse('securepassword123'); // "securepassword123"
```

#### `v.number()`

Creates a number validator.

```typescript
v.number()
  .min(0)                    // Minimum value (>= 0)
  .max(100)                  // Maximum value (<= 100)
  .gt(0)                     // Greater than (> 0)
  .lt(100)                   // Less than (< 100)
  .gte(0)                    // Greater than or equal (alias for min)
  .lte(100)                  // Less than or equal (alias for max)
  .int()                     // Integer only
  .positive()                // Positive numbers (> 0)
  .negative()                // Negative numbers (< 0)
  .nonnegative()             // >= 0
  .nonpositive()             // <= 0
  .finite()                  // Finite numbers
  .safe()                    // Safe integers
  .multipleOf(5)             // Multiple of value
  .step(5)                   // Alias for multipleOf
  .between(0, 100)           // Range constraint
  .even()                    // Even integers only
  .odd()                     // Odd integers only
```

**Example:**

```typescript
const ageSchema = v.number().int().min(0).max(150);
ageSchema.parse(25); // 25
ageSchema.parse(25.5); // throws Error (not integer)

const priceSchema = v.number().positive().multipleOf(0.01);
priceSchema.parse(19.99); // 19.99
```

#### `v.int()`

Shorthand for `v.number().int()`.

```typescript
const countSchema = v.int();
countSchema.parse(42); // 42
countSchema.parse(42.5); // throws Error
```

#### `v.int32()`

Creates an int32 validator (integer between -2147483648 and 2147483647).

```typescript
const int32Schema = v.int32();
int32Schema.parse(2147483647); // 2147483647
int32Schema.parse(2147483648); // throws Error
```

#### `v.boolean()`

Creates a boolean validator.

```typescript
v.boolean()
  .true()   // Only true allowed
  .false()  // Only false allowed
```

**Example:**

```typescript
const activeSchema = v.boolean();
activeSchema.parse(true); // true
activeSchema.parse('true'); // throws Error
```

#### `v.date()`

Creates a date validator. Accepts Date objects, date strings, and timestamps.

```typescript
v.date()
  .min(date)                 // Minimum date
  .max(date)                 // Maximum date
  .between(min, max)         // Date range
  .past()                    // Before now
  .future()                  // After now
  .today()                   // Today only
  .weekday()                 // Monday-Friday
  .weekend()                 // Saturday-Sunday
```

**Example:**

```typescript
const dateSchema = v.date();
dateSchema.parse(new Date()); // Date object
dateSchema.parse('2024-01-15'); // Date object
dateSchema.parse(1705276800000); // Date object from timestamp

const birthDateSchema = v.date().past().min(new Date('1900-01-01'));
```

#### `v.bigint()`

Creates a BigInt validator.

```typescript
v.bigint()
  .min(0n)                   // Minimum value
  .max(100n)                 // Maximum value
  .positive()                // Positive BigInt
  .negative()                // Negative BigInt
  .nonnegative()             // >= 0n
  .nonpositive()             // <= 0n
```

**Example:**

```typescript
const bigSchema = v.bigint();
bigSchema.parse(123n); // 123n
bigSchema.parse(BigInt('999999999999999999')); // 999999999999999999n
```

#### `v.symbol()`

Creates a Symbol validator.

```typescript
const symSchema = v.symbol();
symSchema.parse(Symbol('test')); // Symbol(test)
symSchema.parse('not a symbol'); // throws Error
```

### Special Type Validators

#### `v.any()`

Accepts any value (passthrough).

```typescript
const anySchema = v.any();
anySchema.parse(anything); // anything
```

#### `v.unknown()`

Accepts any value but requires type checking before use.

```typescript
const unknownSchema = v.unknown();
const value = unknownSchema.parse(data);
// value is typed as unknown, requires narrowing
```

#### `v.void()`

Accepts undefined only.

```typescript
const voidSchema = v.void();
voidSchema.parse(undefined); // undefined
voidSchema.parse(null); // throws Error
```

#### `v.never()`

Always fails validation.

```typescript
const neverSchema = v.never();
neverSchema.parse(anything); // always throws Error
```

#### `v.null()`

Accepts null only.

```typescript
const nullSchema = v.null();
nullSchema.parse(null); // null
nullSchema.parse(undefined); // throws Error
```

#### `v.undefined()`

Accepts undefined only.

```typescript
const undefinedSchema = v.undefined();
undefinedSchema.parse(undefined); // undefined
```

#### `v.nan()`

Accepts NaN only.

```typescript
const nanSchema = v.nan();
nanSchema.parse(NaN); // NaN
nanSchema.parse(123); // throws Error
```

### Collection Validators

#### `v.array(schema)`

Creates an array validator.

```typescript
v.array(v.string())
  .min(1)                    // Minimum length
  .max(10)                   // Maximum length
  .length(5)                 // Exact length
  .nonempty()                // At least one item
  .unique()                  // Unique items only
  .between(1, 10)            // Length range
```

**Example:**

```typescript
const tagsSchema = v.array(v.string()).min(1).max(5);
tagsSchema.parse(['a', 'b', 'c']); // ['a', 'b', 'c']

const uniqueNumbersSchema = v.array(v.number()).unique();
uniqueNumbersSchema.parse([1, 2, 3]); // [1, 2, 3]
uniqueNumbersSchema.parse([1, 2, 2]); // throws Error
```

#### `v.tuple(...schemas)`

Creates a fixed-length tuple validator.

```typescript
const coordSchema = v.tuple(v.number(), v.number());
coordSchema.parse([10, 20]); // [10, 20]
coordSchema.parse([10]); // throws Error

const mixedSchema = v.tuple(v.string(), v.number(), v.boolean());
mixedSchema.parse(['hello', 42, true]); // ['hello', 42, true]
```

#### `v.object(shape)`

Creates an object validator.

```typescript
v.object({ ... })
  .strict()                  // No extra keys allowed
  .passthrough()             // Extra keys preserved
  .partial()                 // All fields optional
  .deepPartial()             // Nested fields also optional
  .required()                // All fields required
  .pick('field1', 'field2')  // Only specified fields
  .omit('field1', 'field2')  // Exclude specified fields
  .extend({ newField: ... }) // Add new fields
  .safeExtend({ ... })       // Add fields (throws if key exists)
  .merge(otherObject)        // Merge with another object validator
  .catchall(schema)          // Validate extra keys with schema
  .keyof()                   // Get enum of keys
```

**Example:**

```typescript
const userSchema = v.object({
  id: v.string().uuid(),
  name: v.string().min(2),
  email: v.string().email(),
  age: v.number().int().positive().optional()
});

// Strict mode
const strictUser = userSchema.strict();

// Partial object
const patchSchema = userSchema.partial();

// Pick specific fields
const publicUser = userSchema.pick('id', 'name');

// Extend with new fields
const adminSchema = userSchema.extend({
  role: v.literal('admin'),
  permissions: v.array(v.string())
});

// Safe extend (throws if key already exists)
const safeExtended = userSchema.safeExtend({
  newField: v.string()
}); // OK

userSchema.safeExtend({
  name: v.number() // throws Error - key already exists
});
```

#### `v.strictObject(shape)`

Shorthand for `v.object(shape).strict()`.

#### `v.looseObject(shape)`

Shorthand for `v.object(shape).passthrough()`.

#### `v.record(valueSchema)`

Creates a record validator (dictionary with string keys).

```typescript
const dictSchema = v.record(v.number());
dictSchema.parse({ a: 1, b: 2 }); // { a: 1, b: 2 }
dictSchema.parse({ a: 'string' }); // throws Error
```

#### `v.partialRecord(valueSchema)`

Record where values can be undefined.

```typescript
const partialDict = v.partialRecord(v.number());
partialDict.parse({ a: 1, b: undefined }); // OK
```

#### `v.looseRecord(valueSchema)`

Record that allows any extra values.

#### `v.set(itemSchema)`

Creates a Set validator.

```typescript
const numbersSet = v.set(v.number());
numbersSet.parse(new Set([1, 2, 3])); // Set { 1, 2, 3 }
```

#### `v.map(keySchema, valueSchema)`

Creates a Map validator.

```typescript
const userMap = v.map(v.string(), v.number());
userMap.parse(new Map([['a', 1], ['b', 2]])); // Map { 'a' => 1, 'b' => 2 }
```

### Composition Validators

#### `v.union(...schemas)`

Creates a union type (value must match at least one schema).

```typescript
const stringOrNumber = v.union(v.string(), v.number());
stringOrNumber.parse('hello'); // 'hello'
stringOrNumber.parse(42); // 42
stringOrNumber.parse(true); // throws Error
```

#### `v.discriminatedUnion(discriminator, ...schemas)`

Creates a discriminated union for better performance with tagged types.

```typescript
const shapeSchema = v.discriminatedUnion('type',
  v.object({ type: v.literal('circle'), radius: v.number() }),
  v.object({ type: v.literal('square'), side: v.number() }),
  v.object({ type: v.literal('rectangle'), width: v.number(), height: v.number() })
);

shapeSchema.parse({ type: 'circle', radius: 5 }); // OK
shapeSchema.parse({ type: 'triangle', base: 10 }); // throws Error
```

#### `v.intersection(schema1, schema2)`

Creates an intersection type (value must match both schemas).

```typescript
const withId = v.object({ id: v.string() });
const withName = v.object({ name: v.string() });
const named = v.intersection(withId, withName);

named.parse({ id: '123', name: 'Test' }); // { id: '123', name: 'Test' }
```

#### `v.xor(...schemas)`

Exclusive or - value must match exactly one schema.

```typescript
const xorSchema = v.xor(
  v.object({ a: v.string() }),
  v.object({ b: v.number() })
);

xorSchema.parse({ a: 'hello' }); // OK
xorSchema.parse({ b: 42 }); // OK
xorSchema.parse({ a: 'hello', b: 42 }); // throws Error (matches both)
```

### Literal and Enum Validators

#### `v.literal(value)`

Creates a literal type validator.

```typescript
const activeSchema = v.literal('active');
activeSchema.parse('active'); // 'active'
activeSchema.parse('inactive'); // throws Error

const trueSchema = v.literal(true);
const nullSchema = v.literal(null);
```

#### `v.enum(...values)`

Creates an enum validator from string values.

```typescript
const statusSchema = v.enum('pending', 'active', 'completed');
statusSchema.parse('active'); // 'active'
statusSchema.parse('unknown'); // throws Error

// TypeScript enums
enum Status { Pending, Active, Completed }
const enumSchema = v.enum(...Object.values(Status).filter(v => typeof v === 'string'));
```

### Modifier Validators

#### `v.optional(schema)` / `.optional()`

Makes a value optional (allows undefined).

```typescript
const optionalString = v.optional(v.string());
// or
const optionalString = v.string().optional();

optionalString.parse('hello'); // 'hello'
optionalString.parse(undefined); // undefined
```

#### `v.nullable(schema)` / `.nullable()`

Makes a value nullable (allows null).

```typescript
const nullableString = v.nullable(v.string());
// or
const nullableString = v.string().nullable();

nullableString.parse('hello'); // 'hello'
nullableString.parse(null); // null
```

#### `v.nullish(schema)` / `.nullish()`

Makes a value nullish (allows null or undefined).

```typescript
const nullishString = v.nullish(v.string());
nullishString.parse(null); // null
nullishString.parse(undefined); // undefined
```

### Advanced Methods

#### `.refine(predicate, message?)`

Add custom validation logic.

```typescript
const positiveEven = v.number().refine(
  n => n > 0 && n % 2 === 0,
  'Must be a positive even number'
);

positiveEven.parse(4); // 4
positiveEven.parse(3); // throws Error
```

#### `.superRefine(refinement)`

Advanced refinement with context for multiple issues.

```typescript
const passwordSchema = v.string().superRefine((val, ctx) => {
  if (val.length < 8) {
    ctx.addIssue({ message: 'Password must be at least 8 characters' });
  }
  if (!/[A-Z]/.test(val)) {
    ctx.addIssue({ message: 'Password must contain uppercase letter' });
  }
  if (!/[0-9]/.test(val)) {
    ctx.addIssue({ message: 'Password must contain a number' });
  }
});
```

#### `.transform(transformer)`

Transform the validated value.

```typescript
const uppercaseEmail = v.string()
  .email()
  .transform(s => s.toLowerCase());

uppercaseEmail.parse('USER@EXAMPLE.COM'); // 'user@example.com'

const stringToNumber = v.string()
  .transform(s => parseInt(s, 10));

stringToNumber.parse('42'); // 42 (number)
```

#### `.default(value)`

Provide a default value for undefined inputs.

```typescript
const withDefault = v.string().default('anonymous');
withDefault.parse(undefined); // 'anonymous'
withDefault.parse('john'); // 'john'
```

#### `.catch(fallback)`

Provide a fallback value when validation fails.

```typescript
const withCatch = v.number().catch(-1);
withCatch.parse(42); // 42
withCatch.parse('invalid'); // -1
```

#### `.pipe(nextSchema)`

Pipe output to another validator.

```typescript
const stringToPositiveInt = v.string()
  .transform(s => parseInt(s, 10))
  .pipe(v.number().int().positive());

stringToPositiveInt.parse('42'); // 42
stringToPositiveInt.parse('-5'); // throws Error
```

#### `.readonly()`

Mark output as readonly.

```typescript
const readonlyArray = v.array(v.string()).readonly();
type ReadonlyArr = Infer<typeof readonlyArray>; // readonly string[]
```

#### `.brand<'BrandName'>()`

Brand the type for nominal typing.

```typescript
const UserId = v.string().brand<'UserId'>();
const ProductId = v.string().brand<'ProductId'>();

type UserId = Infer<typeof UserId>;
type ProductId = Infer<typeof ProductId>;

const userId: UserId = UserId.parse('user-123');
const productId: ProductId = ProductId.parse('prod-456');

// TypeScript prevents mixing these types:
// userId = productId; // Error!
```

#### `.apply(fn)`

Apply external function to transform validator.

```typescript
const withLength = (schema: VldBase<unknown, string>) =>
  schema.transform(s => s.length);

const lengthSchema = v.string().apply(withLength);
lengthSchema.parse('hello'); // 5
```

### Parsing Methods

#### `.parse(value)`

Validate and return value, throws on failure.

```typescript
const schema = v.string();
schema.parse('hello'); // 'hello'
schema.parse(123); // throws Error
```

#### `.safeParse(value)`

Validate and return result object (never throws).

```typescript
const schema = v.string();

const success = schema.safeParse('hello');
// { success: true, data: 'hello' }

const failure = schema.safeParse(123);
// { success: false, error: Error }

if (result.success) {
  console.log(result.data);
} else {
  console.log(result.error.message);
}
```

#### `.isValid(value)`

Quick boolean check.

```typescript
const schema = v.string();
schema.isValid('hello'); // true
schema.isValid(123); // false
```

#### `.parseOrDefault(value, defaultValue)`

Parse or return validated default.

```typescript
const schema = v.string();
schema.parseOrDefault(123, 'default'); // 'default'
```

### Type Coercion

VLD provides automatic type coercion validators.

```typescript
// Coerce to string
v.coerce.string().parse(123);        // '123'
v.coerce.string().parse(true);       // 'true'

// Coerce to number
v.coerce.number().parse('123');      // 123
v.coerce.number().parse(true);       // 1

// Coerce to boolean
v.coerce.boolean().parse('true');    // true
v.coerce.boolean().parse(1);         // true
v.coerce.boolean().parse('false');   // false
v.coerce.boolean().parse(0);         // false

// Coerce to date
v.coerce.date().parse('2024-01-01'); // Date object
v.coerce.date().parse(1705276800000); // Date from timestamp

// Coerce to BigInt
v.coerce.bigint().parse('123');      // 123n
v.coerce.bigint().parse(456);        // 456n
```

### String Format Validators

Specialized string format validators with Zod 4 parity.

```typescript
v.email()                            // Email format
v.uuid()                             // UUID (any version)
v.uuidv4()                           // UUID v4 only
v.hostname()                         // Valid hostname
v.emoji()                            // Contains emoji
v.base64()                           // Base64 string
v.base64url()                        // URL-safe Base64
v.hex()                              // Hexadecimal
v.jwt()                              // JWT format
v.nanoid()                           // NanoID format
v.cuid()                             // CUID format
v.cuid2()                            // CUID2 format
v.ulid()                             // ULID format
v.ipv4()                             // IPv4 address
v.ipv6()                             // IPv6 address
v.mac()                              // MAC address
v.cidrv4()                           // IPv4 CIDR block
v.cidrv6()                           // IPv6 CIDR block
v.e164()                             // E.164 phone number
v.hash('sha256')                     // Hash (md5, sha1, sha256, sha384, sha512)

// ISO formats
v.iso.date()                         // ISO date
v.iso.time()                         // ISO time
v.iso.dateTime()                     // ISO datetime
v.iso.duration()                     // ISO duration

// Custom format
v.stringFormat('customFormat', /^custom-\d+$/);
```

### Recursive Schemas

Use `v.lazy()` for recursive types.

```typescript
interface Category {
  name: string;
  subcategories: Category[];
}

const categorySchema: VldBase<unknown, Category> = v.lazy(() =>
  v.object({
    name: v.string(),
    subcategories: v.array(categorySchema)
  })
);

categorySchema.parse({
  name: 'Electronics',
  subcategories: [
    { name: 'Phones', subcategories: [] },
    { name: 'Laptops', subcategories: [] }
  ]
});
```

### JSON Validator

```typescript
// Validate JSON strings
const jsonSchema = v.json();
jsonSchema.parse('{"key": "value"}'); // { key: 'value' }

// With schema validation
const typedJson = v.json(v.object({ name: v.string() }));
typedJson.parse('{"name": "John"}'); // { name: 'John' }
```

### Custom Validators

```typescript
const customValidator = v.custom<string>({
  validate: (value) => typeof value === 'string' && value.startsWith('custom-'),
  message: 'Value must start with "custom-"'
});

customValidator.parse('custom-123'); // 'custom-123'
```

### Template Literal Validator

```typescript
const urlPath = v.templateLiteral('/api/', v.string(), '/', v.number());
urlPath.parse('/api/users/123'); // '/api/users/123'
```

### File Validator

```typescript
const fileSchema = v.file()
  .minSize(1024)           // Minimum size in bytes
  .maxSize(5 * 1024 * 1024) // Maximum size (5MB)
  .mimeType(['image/jpeg', 'image/png']);
```

### Function Validator

```typescript
const funcSchema = v.function();
funcSchema.parse(() => {}); // OK
funcSchema.parse('not a function'); // throws Error
```

### String-to-Boolean Validator

```typescript
const stringBool = v.stringbool({
  truthy: ['yes', 'true', '1'],
  falsy: ['no', 'false', '0'],
  caseSensitive: false
});

stringBool.parse('yes'); // true
stringBool.parse('NO'); // false
```

---

## Codec System (Bidirectional Transformations)

VLD provides codecs for bidirectional data transformations - both encode and decode.

### Built-in Codecs

#### String Conversion Codecs

```typescript
import { stringToNumber, stringToInt, stringToBigInt, stringToBoolean } from '@oxog/vld';

// String to number
stringToNumber.parse('42.5');        // 42.5
stringToNumber.encode(42.5);         // '42.5'

// String to integer
stringToInt.parse('42');             // 42
stringToInt.encode(42);              // '42'

// String to BigInt
stringToBigInt.parse('123456789');   // 123456789n
stringToBigInt.encode(123456789n);   // '123456789'

// String to boolean
stringToBoolean.parse('true');       // true
stringToBoolean.parse('yes');        // true
stringToBoolean.parse('1');          // true
stringToBoolean.encode(true);        // 'true'
```

#### Date Codecs

```typescript
import { isoDatetimeToDate, epochSecondsToDate, epochMillisToDate } from '@oxog/vld';

// ISO datetime to Date
isoDatetimeToDate.parse('2024-01-15T10:30:00.000Z'); // Date
isoDatetimeToDate.encode(new Date()); // '2024-01-15T10:30:00.000Z'

// Unix epoch seconds to Date
epochSecondsToDate.parse(1705312200); // Date
epochSecondsToDate.encode(new Date()); // 1705312200

// Unix epoch milliseconds to Date
epochMillisToDate.parse(1705312200000); // Date
```

#### JSON Codecs

```typescript
import { jsonCodec, base64Json } from '@oxog/vld';

// Generic JSON
const json = jsonCodec();
json.parse('{"name":"John"}'); // { name: 'John' }
json.encode({ name: 'John' }); // '{"name":"John"}'

// Typed JSON
const typedJson = jsonCodec(v.object({ name: v.string() }));

// Base64-encoded JSON
const b64Json = base64Json(v.object({ id: v.number() }));
b64Json.parse('eyJpZCI6MTIzfQ=='); // { id: 123 }
```

#### URL Codecs

```typescript
import { stringToURL, stringToHttpURL, uriComponent } from '@oxog/vld';

// String to URL object
stringToURL.parse('https://example.com/path'); // URL object
stringToURL.encode(new URL('https://example.com')); // 'https://example.com'

// HTTP/HTTPS only
stringToHttpURL.parse('https://api.example.com');

// URI component encoding
uriComponent.parse('Hello World!'); // 'Hello%20World!'
uriComponent.encode('Hello%20World!'); // 'Hello World!'
```

#### Binary Codecs

```typescript
import {
  base64ToBytes, base64urlToBytes, hexToBytes,
  utf8ToBytes, bytesToUtf8
} from '@oxog/vld';

// Base64 to Uint8Array
base64ToBytes.parse('SGVsbG8='); // Uint8Array

// URL-safe Base64 to Uint8Array
base64urlToBytes.parse('SGVsbG8');

// Hex to Uint8Array
hexToBytes.parse('48656c6c6f'); // Uint8Array

// UTF-8 string to bytes
utf8ToBytes.parse('Hello'); // Uint8Array

// Bytes to UTF-8 string
bytesToUtf8.parse(new Uint8Array([72, 101, 108, 108, 111])); // 'Hello'
```

#### JWT Payload Decoder

```typescript
import { jwtPayload } from '@oxog/vld';

const payloadSchema = v.object({
  sub: v.string(),
  name: v.string(),
  iat: v.number()
});

const decoder = jwtPayload(payloadSchema);
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

decoder.parse(token); // { sub: '1234567890', name: 'John Doe', iat: 1516239022 }
```

### Custom Codecs

```typescript
// Create custom codec
const csvToArray = v.codec(
  v.string(),           // Input type
  v.array(v.string()),  // Output type
  {
    decode: (csv: string) => csv.split(',').map(s => s.trim()),
    encode: (arr: string[]) => arr.join(', ')
  }
);

csvToArray.parse('a, b, c'); // ['a', 'b', 'c']
csvToArray.encode(['a', 'b', 'c']); // 'a, b, c'
```

### Codec Methods

```typescript
// Synchronous parsing
codec.parse(input);              // Parse or throw
codec.safeParse(input);          // Parse with result object

// Synchronous encoding
codec.encode(output);            // Encode or throw
codec.safeEncode(output);        // Encode with result object

// Async operations (for async codecs)
await codec.parseAsync(input);
await codec.safeParseAsync(input);
await codec.encodeAsync(output);
await codec.safeEncodeAsync(output);
```

---

## Error Handling

### VldError Class

```typescript
import { VldError, VldIssue } from '@oxog/vld';

const error = new VldError([
  {
    code: 'invalid_string',
    path: ['user', 'email'],
    message: 'Invalid email format'
  }
]);

error.message;           // 'Invalid email format'
error.issues;            // Array of VldIssue
error.firstError;        // First issue
error.formattedErrors;   // Array of message strings
```

### Error Formatting Utilities

```typescript
import { treeifyError, prettifyError, flattenError, VldError } from '@oxog/vld';

const userSchema = v.object({
  email: v.string().email(),
  profile: v.object({
    age: v.number().positive()
  })
});

const result = userSchema.safeParse({
  email: 'invalid',
  profile: { age: -5 }
});

if (!result.success) {
  const error = result.error as VldError;

  // Tree format - nested structure
  const tree = treeifyError(error);
  /*
  {
    errors: [],
    properties: {
      email: { errors: ['Invalid email format'] },
      profile: {
        properties: {
          age: { errors: ['Number must be positive'] }
        }
      }
    }
  }
  */

  // Pretty format - human readable
  const pretty = prettifyError(error);
  /*
  ✖ Invalid email format
    → at email
  ✖ Number must be positive
    → at profile.age
  */

  // Flat format - for forms
  const flat = flattenError(error);
  /*
  {
    formErrors: [],
    fieldErrors: {
      email: ['Invalid email format'],
      profile: ['Number must be positive']
    }
  }
  */
}
```

---

## Internationalization (i18n)

### Setting Locale

```typescript
import { setLocale, getLocale, getMessages } from '@oxog/vld';

// Get current locale
getLocale(); // 'en' (default)

// Set locale
setLocale('es');

// Get messages object
const messages = getMessages();
console.log(messages.invalidString); // 'Se esperaba una cadena de texto'
```

### Supported Languages (27+)

**Base Languages:**
- English (en), Turkish (tr), Spanish (es), French (fr), German (de)
- Italian (it), Portuguese (pt), Russian (ru), Japanese (ja), Korean (ko)
- Chinese (zh), Arabic (ar), Hindi (hi), Dutch (nl), Polish (pl)

**European Languages:**
- Danish (da), Swedish (sv), Norwegian (no), Finnish (fi)

**Asian Languages:**
- Thai (th), Vietnamese (vi), Indonesian (id), Bengali (bn)

**African Languages:**
- Swahili (sw), Afrikaans (af)

**American Languages:**
- Portuguese Brazil (pt-BR), Spanish Mexico (es-MX)

Plus 75+ additional languages with English fallback.

---

## Type Inference

### Infer Types

```typescript
import { v, Infer, Input, Output } from '@oxog/vld';

const userSchema = v.object({
  name: v.string(),
  age: v.number().transform(n => n.toString())
});

// Output type (after transforms)
type User = Infer<typeof userSchema>;
// { name: string; age: string }

// Output type (alias)
type UserOutput = Output<typeof userSchema>;
// { name: string; age: string }

// Input type (before transforms)
type UserInput = Input<typeof userSchema>;
// { name: string; age: number }
```

---

## Usage Patterns

### Pattern 1: API Request Validation

```typescript
import { v, Infer } from '@oxog/vld';

const createUserSchema = v.object({
  name: v.string().min(2).max(100),
  email: v.string().email(),
  password: v.string().min(8),
  role: v.enum('user', 'admin').default('user')
});

type CreateUserInput = Infer<typeof createUserSchema>;

app.post('/api/users', (req, res) => {
  const result = createUserSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: flattenError(result.error as VldError)
    });
  }

  // result.data is typed as CreateUserInput
  createUser(result.data);
});
```

### Pattern 2: Environment Configuration

```typescript
const envSchema = v.object({
  NODE_ENV: v.enum('development', 'production', 'test'),
  PORT: v.coerce.number().default(3000),
  DATABASE_URL: v.string().url(),
  API_KEY: v.string().min(32),
  DEBUG: v.coerce.boolean().default(false)
});

const env = envSchema.parse(process.env);
```

### Pattern 3: Form Validation

```typescript
const loginFormSchema = v.object({
  username: v.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username cannot exceed 20 characters'),
  password: v.string()
    .min(8, 'Password must be at least 8 characters')
    .refine(
      p => /[A-Z]/.test(p) && /[0-9]/.test(p),
      'Password must contain uppercase letter and number'
    ),
  rememberMe: v.boolean().default(false)
});

function validateLoginForm(data: unknown) {
  const result = loginFormSchema.safeParse(data);

  if (!result.success) {
    return {
      valid: false,
      errors: flattenError(result.error as VldError).fieldErrors
    };
  }

  return { valid: true, data: result.data };
}
```

### Pattern 4: API Response Transformation

```typescript
const apiResponseSchema = v.object({
  id: v.coerce.string(),
  created_at: v.coerce.date(),
  user: v.object({
    full_name: v.string().transform(name => {
      const [first, ...rest] = name.split(' ');
      return { firstName: first, lastName: rest.join(' ') };
    })
  })
});

const response = apiResponseSchema.parse(apiData);
// { id: '123', created_at: Date, user: { full_name: { firstName, lastName } } }
```

### Pattern 5: Discriminated Union for Actions

```typescript
const actionSchema = v.discriminatedUnion('type',
  v.object({
    type: v.literal('CREATE'),
    payload: v.object({ name: v.string() })
  }),
  v.object({
    type: v.literal('UPDATE'),
    payload: v.object({ id: v.string(), name: v.string() })
  }),
  v.object({
    type: v.literal('DELETE'),
    payload: v.object({ id: v.string() })
  })
);

type Action = Infer<typeof actionSchema>;

function handleAction(action: Action) {
  switch (action.type) {
    case 'CREATE':
      // TypeScript knows payload has 'name'
      break;
    case 'UPDATE':
      // TypeScript knows payload has 'id' and 'name'
      break;
    case 'DELETE':
      // TypeScript knows payload has 'id'
      break;
  }
}
```

---

## Migration from Zod

VLD provides 100% API compatibility with Zod. Migration is typically a simple import swap.

```typescript
// Before (Zod)
import { z } from 'zod';
const schema = z.string().email();
type Email = z.infer<typeof schema>;

// After (VLD)
import { v, Infer } from '@oxog/vld';
const schema = v.string().email();
type Email = Infer<typeof schema>;
```

### API Differences

| Zod | VLD | Notes |
|-----|-----|-------|
| `z.infer<T>` | `Infer<T>` | Type inference |
| `z.input<T>` | `Input<T>` | Input type |
| `z.output<T>` | `Output<T>` | Output type |
| `z.ZodError` | `VldError` | Error class |

---

## Performance

### Benchmarks vs Zod

| Test Case | Improvement |
|-----------|-------------|
| Simple String | 1.67x faster |
| Email Validation | 3.63x faster |
| Number Validation | 2.62x faster |
| Object Validation | 1.27x faster |
| Array Validation | 1.29x faster |
| Union Types | 1.54x faster |
| Optional Values | 4.52x faster |
| Type Coercion | 1.46x faster |
| **Average** | **2.52x faster** |

### Memory Usage

- **98% less memory** for validator creation
- **51% less memory** for data parsing
- **86% less memory** for error handling
- **78% less memory** overall

### Optimization Tips

1. **Reuse schemas**: Create schemas once and reuse them
2. **Use discriminated unions**: Better performance for tagged types
3. **Prefer strict schemas**: Avoid passthrough when not needed
4. **Use coercion sparingly**: Direct type validators are faster

---

## Security Considerations

VLD includes several security measures:

- **Prototype Pollution Prevention**: Object validators block dangerous keys (`__proto__`, `constructor`, `prototype`)
- **ReDoS Prevention**: Simplified regex patterns and multi-step validation for IPv6
- **Safe String Coercion**: Length limits (1M characters) and control character sanitization
- **Immutable Validators**: Prevents memory leaks and race conditions
- **Type Safety**: Secure feature detection instead of constructor name checking

---

## Links

- **NPM:** https://www.npmjs.com/package/@oxog/vld
- **GitHub:** https://github.com/ersinkoc/vld
- **Issues:** https://github.com/ersinkoc/vld/issues
- **Changelog:** https://github.com/ersinkoc/vld/blob/main/CHANGELOG.md

---

## LLM Usage Notes

### When Helping Users with VLD

1. VLD uses the `v` object as the main API (similar to Zod's `z`)
2. All validators are immutable - methods return new instances
3. Use `Infer<typeof schema>` for type inference (not `z.infer`)
4. Error class is `VldError` (not `ZodError`)
5. All Zod patterns work identically in VLD

### Common Code Patterns

```typescript
// Always import v and helpers
import { v, Infer, setLocale, VldError, flattenError } from '@oxog/vld';

// Define reusable schemas
const schema = v.object({ /* ... */ });

// Use safeParse for error handling
const result = schema.safeParse(data);
if (!result.success) {
  const errors = flattenError(result.error as VldError);
}

// Use Infer for types
type SchemaType = Infer<typeof schema>;
```

### Recommended Prompts

- "Validate this data structure using VLD"
- "Create a VLD schema for [description]"
- "Convert this Zod schema to VLD"
- "Add validation for [field] with these constraints"
- "Handle VLD validation errors in React/Express"

---

## Document Metadata

- **Generated:** 2026-01-02
- **Package Version:** 1.4.0
- **Documentation Version:** 1.0
- **Format:** LLM-Optimized Markdown
