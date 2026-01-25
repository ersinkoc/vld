# VLD - Fast & Lightweight TypeScript Validation Library

[![NPM Version](https://img.shields.io/npm/v/@oxog/vld.svg)](https://www.npmjs.com/package/@oxog/vld) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/) [![Zero Dependencies](https://img.shields.io/badge/Dependencies-0-green.svg)](package.json) [![Test Coverage](https://img.shields.io/badge/Coverage-99.23%25-brightgreen.svg)](package.json)

VLD is a blazing-fast, type-safe validation library for TypeScript and JavaScript with **full Zod feature parity**. Built with performance in mind, it provides a simple and intuitive API while maintaining excellent type inference and 27+ language internationalization support.

## Table of Contents

- [Features](#-features)
- [Performance](#-performance)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [API Reference](#-api-reference)
- [Internationalization (i18n)](#-internationalization-i18n)
- [Error Handling & Formatting](#%EF%B8%8F-error-handling--formatting)
- [Advanced Examples](#-advanced-examples)
- [Why VLD?](#-why-vld)
- [Codecs - Bidirectional Transformations](#-codecs---bidirectional-transformations)
- [Plugin System](#-plugin-system)
- [Result Pattern](#-result-pattern)
- [CLI Tools](#-cli-tools)
- [Migrating from Zod](#-migrating-from-zod)
- [Benchmarks](#-benchmarks)
- [Contributing](#-contributing)
- [Links](#-links)

## Features

### Core Features
- **Blazing Fast**: Optimized for V8 engine with superior performance
- **Type-Safe**: Full TypeScript support with excellent type inference
- **Zero Dependencies**: Lightweight with no external dependencies
- **Tree-Shakeable**: Only import what you need
- **Composable**: Chain validations for complex schemas
- **Advanced Error Formatting**: Tree, pretty, and flatten error utilities
- **Multi-language**: Built-in support for 27+ languages
- **99.23% Test Coverage**: Rigorously tested with 1858 passing tests
- **Industry Leading Performance**: 1.98x faster than Zod on average

### Advanced Zod-Compatible Features
- **Type Coercion**: `v.coerce.string()`, `v.coerce.number()`, `v.coerce.boolean()`, etc.
- **Advanced Types**: BigInt, Symbol, Tuple, Record, Set, Map validation
- **Intersection Types**: Combine multiple schemas with intelligent merging
- **Custom Validation**: `refine()` for custom predicates and validation logic
- **Data Transformation**: `transform()` for post-validation data transformation
- **Default Values**: `default()` for handling undefined inputs elegantly
- **Fallback Handling**: `catch()` for graceful error recovery
- **Object Utilities**: `pick()`, `omit()`, `extend()` for flexible object schemas

### NEW in v2.0.0 - Modular Architecture

#### Tree-Shakable Mini API
```typescript
import { string, number, object, optional } from '@oxog/vld/mini';

const schema = object({
  name: string().min(1),
  age: optional(number().positive()),
});
```
- **82% smaller bundles** when using only needed validators
- Individual factory functions for optimal tree-shaking
- Full TypeScript support with identical type inference

#### Lazy Locale Loading
```typescript
import { setLocaleAsync } from '@oxog/vld/locales';
await setLocaleAsync('tr'); // Loads Turkish on demand
```
- **92% bundle reduction** - Only English bundled by default
- `preloadLocales()` for SSR/batch loading
- Full backwards compatibility with `setLocale()`

#### Dual ESM/CJS Build
- ESM builds for modern bundlers (Vite, esbuild)
- CJS builds for Node.js and legacy environments
- Proper `exports` field with conditional exports

### NEW in v1.5.0 - Major Platform Release

#### Plugin System
- **`definePlugin()`**: Create custom plugins with validators, transforms, and codecs
- **`usePlugin()`**: Register plugins globally
- **Plugin Hooks**: Lifecycle hooks for validation events
- **Custom Validators**: Extend VLD with your own validators

#### Result Pattern
- **`Ok()`/`Err()`**: Functional error handling
- **`match()`**: Pattern matching on results
- **`map()`/`flatMap()`**: Transform results
- **`tryCatch()`**: Safe function execution
- **`all()`**: Combine multiple results

#### Event System
- **`createEmitter()`**: Type-safe event emitter
- **`createEventBus()`**: Global event bus
- **Validation Events**: Parse start, success, error, field validation

#### CLI Tools
- **`vld validate`**: Validate data from command line
- **`vld benchmark`**: Run performance benchmarks
- **Colored Output**: Beautiful terminal output with pigment

#### New Validators
- **`v.discriminatedUnion()`**: Discriminated union types
- **`v.xor()`**: Exclusive OR validation
- **`v.file()`**: File upload validation
- **`v.function()`**: Function validation
- **`v.custom()`**: Type-safe custom validators
- **`v.json()`**: JSON string validation with schema
- **`v.lazy()`**: Recursive schema support
- **`v.nan()`**: NaN validation
- **`v.null()`**: Null validation
- **`v.undefined()`**: Undefined validation
- **`v.templateLiteral()`**: Template literal types

#### New String Format Validators
- **`v.hostname()`**: Hostname validation
- **`v.emoji()`**: Emoji validation
- **`v.base64()`/`v.base64url()`**: Base64 format validation
- **`v.hex()`**: Hex string validation
- **`v.jwt()`**: JWT format validation
- **`v.nanoid()`/`v.cuid()`/`v.cuid2()`/`v.ulid()`**: ID format validation
- **`v.mac()`**: MAC address validation
- **`v.cidrv4()`/`v.cidrv6()`**: CIDR block validation
- **`v.e164()`**: E.164 phone number validation
- **`v.hash()`**: Hash validation (md5, sha1, sha256, sha384, sha512)
- **`v.iso.date()`/`v.iso.time()`/`v.iso.dateTime()`/`v.iso.duration()`**: ISO format validation

#### Enhanced Object Utilities
- **`v.strictObject()`**: Strict mode object validation
- **`v.looseObject()`**: Passthrough object validation
- **`v.partialRecord()`**: Partial record validation
- **`v.looseRecord()`**: Loose record validation
- **`v.int()`**: Integer shortcut
- **`v.int32()`**: 32-bit integer shortcut
- **`v.nullish()`**: Null or undefined
- **`v.NEVER`**: NEVER constant for transforms (Zod 4 parity)

### Codec System - Beyond Zod
- **Bidirectional Transformations**: Full encode/decode support for data conversion
- **19 Built-in Codecs**: String conversions, date parsing, JSON, URL, binary data
- **Zod-Compatible**: All `stringToNumber`, `jsonCodec`, `base64ToBytes`, etc.
- **Async Support**: Both sync and async codec operations
- **Custom Codecs**: Create your own bidirectional transformations
- **Type-Safe**: Full TypeScript support with perfect type inference

## Performance

VLD is designed for speed and efficiency with recent optimizations delivering exceptional performance:

### Speed Benchmarks (v1.5.0)
- **3.25x faster** for email validation
- **3.23x faster** for number validation
- **3.16x faster** for optional validation
- **2.73x faster** for safeParse operations
- **2.08x faster** for enum validation
- **2.03x faster** for simple string validation
- **1.98x faster** overall average performance

### Optimizations
- **110x improvement** in union type validation
- **Simplified email regex** for maximum performance
- **Inline type checks** in object validation
- **Optimized loops** with direct array assignment
- **SafeParse optimization** to avoid try-catch overhead
- **Pre-computed keys** with Set for O(1) lookups

### Memory Efficiency
- **98% less memory** for validator creation
- **51% less memory** for data parsing
- **86% less memory** for error handling
- **78% less memory** overall average

### A Note on Real-World Benchmarking

Many validation library benchmarks can be misleading because they often test with **reused schema instances**:

```javascript
// What benchmarks typically test (unrealistic):
const schema = z.string();
for (let i = 0; i < 1000000; i++) {
  schema.parse(data); // Same instance reused
}

// What happens in real applications:
app.post('/api/user', (req, res) => {
  // New schema created for each request
  const schema = z.object({
    email: z.string().email(),
    age: z.number().min(18)
  });
  schema.parse(req.body);
});
```

When testing real-world patterns:
- **Creating new instances**: VLD is **2000x faster** than Zod
- **Reused instances**: Zod benefits from V8's singleton optimization
- **Real applications**: Schemas are often created dynamically, where VLD excels

Run `npm run benchmark:truth` to see the real performance difference.

## Installation

```bash
npm install @oxog/vld
# or
yarn add @oxog/vld
# or
pnpm add @oxog/vld
```

## Quick Start

```typescript
import { v } from '@oxog/vld';

// It is recommended to import as `v` for consistency with Zod's `z`
// and for a more concise syntax.

// Define a schema
const userSchema = v.object({
  name: v.string().min(2),
  email: v.string().email(),
  age: v.number().min(18).max(100),
  isActive: v.boolean()
});

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

For advanced error formatting:
```typescript
import { v, VldError, treeifyError, prettifyError, flattenError } from '@oxog/vld';
```

## API Reference

### Basic Types

```typescript
v.string()    // String validation
v.number()    // Number validation
v.int()       // Integer validation (shortcut)
v.int32()     // 32-bit integer validation
v.boolean()   // Boolean validation
v.bigint()    // BigInt validation
v.symbol()    // Symbol validation
v.date()      // Date validation
v.uint8array()// Uint8Array validation
v.literal()   // Literal values
v.enum()      // Enum values (supports TypeScript enums)
v.any()       // Any type
v.unknown()   // Unknown type
v.void()      // Void type
v.never()     // Never type
v.null()      // Null type
v.undefined() // Undefined type
v.nan()       // NaN type
```

### Advanced Types

```typescript
// Collections
v.array(v.string())                    // Array validation
v.tuple(v.string(), v.number())        // Fixed-length tuple
v.record(v.number())                   // Record/dictionary validation
v.set(v.string())                      // Set validation
v.map(v.string(), v.number())          // Map validation

// Objects
v.object({                             // Object schema
  name: v.string(),
  age: v.number()
})
v.strictObject({...})                  // No extra fields allowed
v.looseObject({...})                   // Extra fields passed through

// Composition
v.union(v.string(), v.number())        // Union types
v.intersection(schemaA, schemaB)       // Intersection types
v.discriminatedUnion('type', ...)      // Discriminated union
v.xor(schemaA, schemaB)               // Exclusive OR
v.optional(v.string())                 // Optional fields
v.nullable(v.string())                 // Nullable fields
v.nullish(v.string())                  // Null or undefined
```

### String Validators

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
  .trim()                    // Trim whitespace
  .toLowerCase()             // Convert to lowercase
  .toUpperCase()             // Convert to uppercase
  .nonempty()               // Non-empty string
```

### String Format Validators (Top-Level)

```typescript
v.email()                    // Email validation
v.uuid()                     // UUID validation
v.uuid({ version: 'v4' })    // UUID v4 validation
v.uuidv4()                   // UUID v4 shortcut
v.hostname()                 // Hostname validation
v.emoji()                    // Emoji validation
v.base64()                   // Base64 format
v.base64url()                // Base64 URL-safe format
v.hex()                      // Hex string
v.jwt()                      // JWT format
v.nanoid()                   // NanoID format
v.cuid()                     // CUID format
v.cuid2()                    // CUID2 format
v.ulid()                     // ULID format
v.ipv4()                     // IPv4 address
v.ipv6()                     // IPv6 address
v.mac()                      // MAC address
v.cidrv4()                   // IPv4 CIDR block
v.cidrv6()                   // IPv6 CIDR block
v.e164()                     // E.164 phone number
v.hash('sha256')             // Hash validation
v.iso.date()                 // ISO date format
v.iso.time()                 // ISO time format
v.iso.dateTime()             // ISO datetime format
v.iso.duration()             // ISO duration format
```

### Number Validators

```typescript
v.number()
  .min(0)                    // Minimum value
  .max(100)                  // Maximum value
  .int()                     // Integer only
  .positive()                // Positive numbers
  .negative()                // Negative numbers
  .nonnegative()            // >= 0
  .nonpositive()            // <= 0
  .finite()                  // Finite numbers
  .safe()                    // Safe integers
  .multipleOf(5)            // Multiple of value
```

### Arrays and Objects

```typescript
// Arrays
v.array(v.string())          // Array of strings
  .min(1)                    // Minimum length
  .max(10)                   // Maximum length
  .length(5)                 // Exact length
  .nonempty()               // Non-empty array

// Objects
v.object({
  name: v.string(),
  age: v.number()
})
  .partial()                 // All fields optional
  .strict()                  // No extra fields
  .passthrough()             // Allow extra fields
```

### Composite Types

```typescript
// Optional
v.optional(v.string())       // string | undefined

// Nullable
v.nullable(v.string())       // string | null

// Nullish
v.nullish(v.string())        // string | null | undefined

// Union
v.union(v.string(), v.number()) // string | number

// Discriminated Union
v.discriminatedUnion('type',
  v.object({ type: v.literal('a'), a: v.string() }),
  v.object({ type: v.literal('b'), b: v.number() })
)

// Literal
v.literal('active')          // 'active'

// Enum
v.enum('red', 'green', 'blue') // 'red' | 'green' | 'blue'
```

### Type Coercion

```typescript
// Coerce strings from various types
v.coerce.string().parse(123)        // "123"
v.coerce.string().parse(true)       // "true"

// Coerce numbers from strings/booleans
v.coerce.number().parse("123")      // 123
v.coerce.number().parse(true)       // 1

// Coerce booleans from strings/numbers
v.coerce.boolean().parse("true")    // true
v.coerce.boolean().parse(1)         // true

// Coerce BigInt from strings/numbers
v.coerce.bigint().parse("123")      // 123n
v.coerce.bigint().parse(456)        // 456n

// Coerce Date from strings/timestamps
v.coerce.date().parse("2023-01-01") // Date object
v.coerce.date().parse(1672531200000) // Date object
```

### Object Schema Methods

```typescript
const userSchema = v.object({
  name: v.string(),
  age: v.number(),
  email: v.string(),
  role: v.string()
});

// Pick specific fields
const publicSchema = userSchema.pick('name', 'age');
// Type: { name: string; age: number }

// Omit sensitive fields
const safeSchema = userSchema.omit('email', 'role');
// Type: { name: string; age: number }

// Extend with new fields
const extendedSchema = userSchema.extend({
  isActive: v.boolean(),
  lastLogin: v.date()
});
// Type: { name: string; age: number; email: string; role: string; isActive: boolean; lastLogin: Date }
```

### Advanced Validation Methods

```typescript
// Custom validation with refine()
const positiveNumber = v.number()
  .refine(n => n > 0, "Number must be positive");

// Data transformation with transform()
const uppercaseString = v.string()
  .transform(s => s.toUpperCase());

// Default values for undefined
const withDefault = v.string().default("fallback");
withDefault.parse(undefined); // "fallback"

// Catch errors and provide fallback
const withCatch = v.number().catch(-1);
withCatch.parse("invalid"); // -1

// Method chaining
const complexSchema = v.string()
  .min(3)
  .transform(s => s.trim())
  .refine(s => s.includes('@'), 'Must contain @')
  .default('user@example.com');
```

### Special Validators

```typescript
// JSON validator with optional schema
v.json()                           // Any valid JSON
v.json(v.object({ name: v.string() }))  // Typed JSON

// Lazy for recursive schemas
const categorySchema = v.lazy(() =>
  v.object({
    name: v.string(),
    children: v.array(categorySchema).optional()
  })
);

// Custom validator
v.custom({
  check: (val) => typeof val === 'string' && val.length > 0,
  message: 'Must be a non-empty string'
});

// File validator
v.file()
  .maxSize(5 * 1024 * 1024)  // 5MB
  .type(['image/png', 'image/jpeg']);

// Function validator
v.function()
  .args(v.string(), v.number())
  .returns(v.boolean());
```

### Type Inference

```typescript
import { v, Infer } from '@oxog/vld';

const schema = v.object({
  name: v.string(),
  age: v.number()
});

// Automatically infer the type
type User = Infer<typeof schema>;
// { name: string; age: number }
```

### Error Formatting Types

```typescript
import {
  VldError,           // Main error class
  VldIssue,           // Individual validation issue
  VldErrorTree,       // Nested error structure
  VldFlattenedError   // Flattened error structure
} from '@oxog/vld';
```

### Custom Error Messages

```typescript
const schema = v.string().min(8, 'Password must be at least 8 characters');

const result = schema.safeParse('short');
if (!result.success) {
  console.log(result.error.message); // 'Password must be at least 8 characters'
}
```

## Internationalization (i18n)

VLD supports 27+ languages out of the box with comprehensive error messages:

```typescript
import { v, setLocale } from '@oxog/vld';

// Default is English
const schema = v.string().min(5);
schema.safeParse('Hi'); // Error: "String must be at least 5 characters"

// Switch to Turkish
setLocale('tr');
schema.safeParse('Hi'); // Error: "Metin en az 5 karakter olmali"

// Switch to Spanish
setLocale('es');
schema.safeParse('Hi'); // Error: "La cadena debe tener al menos 5 caracteres"

// Switch to Japanese
setLocale('ja');
schema.safeParse('Hi'); // Error: "..."
```

### Supported Languages

#### Base Languages (15):
- English (`en`) - Turkish (`tr`) - Spanish (`es`) - French (`fr`) - German (`de`)
- Italian (`it`) - Portuguese (`pt`) - Russian (`ru`) - Japanese (`ja`) - Korean (`ko`)
- Chinese (`zh`) - Arabic (`ar`) - Hindi (`hi`) - Dutch (`nl`) - Polish (`pl`)

#### European Languages (4):
- Danish (`da`) - Swedish (`sv`) - Norwegian (`no`) - Finnish (`fi`)

#### Asian Languages (4):
- Thai (`th`) - Vietnamese (`vi`) - Indonesian (`id`) - Bengali (`bn`)

#### African Languages (2):
- Swahili (`sw`) - Afrikaans (`af`)

#### American Languages (2):
- Portuguese Brazil (`pt-BR`) - Spanish Mexico (`es-MX`)

**Plus 75+ additional languages** supported through comprehensive type definitions with English fallback.

## Error Handling & Formatting

VLD provides advanced error formatting utilities similar to Zod's error handling system.

### Error Formatting Utilities

```typescript
import { v, VldError, treeifyError, prettifyError, flattenError } from '@oxog/vld';

const userSchema = v.object({
  username: v.string().min(3),
  favoriteNumbers: v.array(v.number()),
  profile: v.object({
    name: v.string(),
    email: v.string().email()
  })
});

const result = userSchema.safeParse({
  username: 'ab',
  favoriteNumbers: [1, 'two', 3],
  profile: {
    name: '',
    email: 'invalid-email'
  },
  extraField: 'not allowed'
});

if (!result.success) {
  const error = result.error as VldError;

  // 1. Tree Format - Nested structure for complex UIs
  const tree = treeifyError(error);

  // 2. Pretty Format - Human-readable console output
  const pretty = prettifyError(error);

  // 3. Flatten Format - Simple form validation
  const flattened = flattenError(error);
}
```

### Using Error Formats in Practice

#### React Form Validation
```typescript
function UserForm() {
  const [errors, setErrors] = useState<VldFlattenedError | null>(null);

  const handleSubmit = (data: unknown) => {
    const result = userSchema.safeParse(data);

    if (!result.success) {
      setErrors(flattenError(result.error as VldError));
    } else {
      setErrors(null);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {errors?.formErrors.map(error => (
        <div key={error} className="form-error">{error}</div>
      ))}

      <input name="username" />
      {errors?.fieldErrors.username?.map(error => (
        <div key={error} className="field-error">{error}</div>
      ))}
    </form>
  );
}
```

#### API Error Responses
```typescript
app.post('/api/users', (req, res) => {
  const result = userSchema.safeParse(req.body);

  if (!result.success) {
    const tree = treeifyError(result.error as VldError);
    res.status(400).json({
      error: 'Validation failed',
      details: tree
    });
  }
});
```

## Advanced Examples

### Complex Validation with New Features

```typescript
const postSchema = v.object({
  id: v.union(v.string().uuid(), v.number()),
  title: v.string().min(5).max(100),
  content: v.string().min(10),
  author: v.object({
    name: v.string(),
    email: v.string().email(),
    age: v.coerce.number(),
  }),
  tags: v.set(v.string()).default(new Set()),
  metadata: v.record(v.any()),
  coordinates: v.tuple(v.number(), v.number()),
  publishedAt: v.date().default(() => new Date()),
  status: v.enum('draft', 'published', 'archived')
});

// Extend with additional fields
const blogPostSchema = postSchema.extend({
  viewCount: v.bigint().default(0n),
  categories: v.array(v.string()).min(1),
  featured: v.boolean().default(false)
});
```

### Discriminated Union

```typescript
const eventSchema = v.discriminatedUnion('type',
  v.object({
    type: v.literal('click'),
    x: v.number(),
    y: v.number()
  }),
  v.object({
    type: v.literal('scroll'),
    direction: v.enum('up', 'down'),
    distance: v.number()
  }),
  v.object({
    type: v.literal('keypress'),
    key: v.string(),
    modifiers: v.array(v.enum('ctrl', 'alt', 'shift'))
  })
);

// Type-safe parsing
const event = eventSchema.parse({
  type: 'click',
  x: 100,
  y: 200
});
```

### Recursive Schemas

```typescript
const categorySchema: ReturnType<typeof v.lazy> = v.lazy(() =>
  v.object({
    name: v.string(),
    slug: v.string().regex(/^[a-z0-9-]+$/),
    children: v.array(categorySchema).optional()
  })
);

const category = categorySchema.parse({
  name: 'Electronics',
  slug: 'electronics',
  children: [
    {
      name: 'Phones',
      slug: 'phones',
      children: [
        { name: 'Smartphones', slug: 'smartphones' }
      ]
    }
  ]
});
```

### Type-Safe Forms

```typescript
const loginSchema = v.object({
  username: v.string().min(3),
  password: v.string().min(8),
  rememberMe: v.optional(v.boolean())
});

type LoginForm = Infer<typeof loginSchema>;

function handleLogin(data: unknown) {
  const result = loginSchema.safeParse(data);

  if (result.success) {
    const { username, password, rememberMe } = result.data;
    // ... handle login
  }
}
```

## Codecs - Bidirectional Transformations

VLD introduces **codecs** - powerful bidirectional transformations that can convert data between different representations.

### What are Codecs?

Codecs enable safe, type-checked conversions between different data formats:

```typescript
import { stringToNumber, jsonCodec, base64ToBytes } from '@oxog/vld';

// String to number conversion
const age = stringToNumber.parse('25'); // 25
const price = stringToNumber.encode(99.99); // "99.99"

// JSON codec
const userJson = jsonCodec();
const user = userJson.parse('{"name":"John","age":30}');
const jsonString = userJson.encode(user);

// Binary data
const bytes = base64ToBytes.parse('SGVsbG8gV29ybGQ=');
```

### Built-in Codecs

#### String Conversion Codecs
```typescript
import { stringToNumber, stringToInt, stringToBigInt, stringToBoolean } from '@oxog/vld';

stringToNumber.parse('42.5');     // 42.5
stringToInt.parse('42');          // 42
stringToBigInt.parse('123n');     // 123n
stringToBoolean.parse('true');    // true
```

#### Date Conversion Codecs
```typescript
import { isoDatetimeToDate, epochSecondsToDate, epochMillisToDate } from '@oxog/vld';

isoDatetimeToDate.parse('2023-12-25T10:30:00.000Z'); // Date
epochSecondsToDate.parse(1703505000);                // Date
epochMillisToDate.parse(1703505000000);              // Date
```

#### URL Codecs
```typescript
import { stringToURL, stringToHttpURL, uriComponent } from '@oxog/vld';

stringToURL.parse('https://example.com/path?q=1');
stringToHttpURL.parse('https://api.example.com');
uriComponent.parse('Hello World!'); // "Hello%20World!"
```

#### Binary Data Codecs
```typescript
import { base64ToBytes, hexToBytes, utf8ToBytes, bytesToUtf8 } from '@oxog/vld';

base64ToBytes.parse('SGVsbG8=');           // Uint8Array
hexToBytes.parse('48656c6c6f');            // Uint8Array
utf8ToBytes.parse('Hello');                // Uint8Array
bytesToUtf8.parse(new Uint8Array([72, 101, 108, 108, 111])); // "Hello"
```

### Custom Codecs

```typescript
const csvToArray = v.codec(
  v.string(),
  v.array(v.string()),
  {
    decode: (csv: string) => csv.split(',').map(s => s.trim()),
    encode: (arr: string[]) => arr.join(', ')
  }
);

const tags = csvToArray.parse('react, typescript, vld');
// ["react", "typescript", "vld"]

const csvString = csvToArray.encode(['node', 'express', 'api']);
// "node, express, api"
```

## Plugin System

VLD v1.5.0 introduces a powerful plugin system for extending functionality.

### Creating a Plugin

```typescript
import { definePlugin, usePlugin, v } from '@oxog/vld';

// Define a custom plugin
const myPlugin = definePlugin({
  name: 'my-plugin',
  version: '1.0.0',

  // Custom validators
  validators: {
    phoneNumber: () => v.string().regex(/^\+?[1-9]\d{1,14}$/),
    postalCode: () => v.string().regex(/^\d{5}(-\d{4})?$/)
  },

  // Custom transforms
  transforms: {
    normalizePhone: (phone: string) => phone.replace(/[^\d+]/g, '')
  },

  // Lifecycle hooks
  install(kernel) {
    console.log('Plugin installed!');
  }
});

// Register the plugin
usePlugin(myPlugin);
```

### Using Plugin Validators

```typescript
import { createVldKernel, usePlugin } from '@oxog/vld';

const kernel = createVldKernel({ debug: true });

kernel.use(myPlugin);

// Access custom validators
const phoneSchema = kernel.validator('phoneNumber');
phoneSchema.parse('+1234567890');
```

## Result Pattern

VLD v1.5.0 includes a functional Result pattern for error handling.

### Basic Usage

```typescript
import { Ok, Err, match, map, flatMap, tryCatch } from '@oxog/vld';

// Create results
const success = Ok(42);
const failure = Err(new Error('Something went wrong'));

// Pattern matching
const message = match(success, {
  ok: (value) => `Got: ${value}`,
  err: (error) => `Error: ${error.message}`
});

// Transform results
const doubled = map(success, (n) => n * 2); // Ok(84)

// Chain operations
const result = flatMap(success, (n) =>
  n > 0 ? Ok(n * 2) : Err(new Error('Must be positive'))
);

// Safe function execution
const parsed = tryCatch(() => JSON.parse('{"a":1}'));
```

### With Validation

```typescript
import { v, isOk, isErr, unwrapOr } from '@oxog/vld';

const schema = v.object({
  name: v.string(),
  age: v.number().min(0)
});

const result = schema.safeParse(data);

if (isOk(result)) {
  console.log('Valid:', result.data);
} else {
  console.log('Invalid:', result.error);
}

// With default value
const user = unwrapOr(result, { name: 'Guest', age: 0 });
```

### Combining Results

```typescript
import { all, fromNullable } from '@oxog/vld';

// Combine multiple results
const results = [Ok(1), Ok(2), Ok(3)];
const combined = all(results); // Ok([1, 2, 3])

// Convert nullable to Result
const maybeValue: string | null = getValue();
const result = fromNullable(maybeValue, new Error('Value is null'));
```

## CLI Tools

VLD includes command-line tools for validation and benchmarking.

### Installation

```bash
npm install -g @oxog/vld
# or use npx
npx vld --help
```

### Commands

```bash
# Show help
vld --help

# Validate data
vld validate schema.json data.json

# Run benchmarks
vld benchmark

# Show version
vld --version
```

### Programmatic CLI

```typescript
import { createCli, vldCli } from '@oxog/vld/cli';

// Use the built-in CLI
vldCli.run(process.argv.slice(2));

// Or create a custom CLI
const cli = createCli('my-app', '1.0.0', 'My validation app')
  .command({
    name: 'validate',
    description: 'Validate data',
    action: async (args, options) => {
      // Custom validation logic
    }
  });

cli.run(process.argv.slice(2));
```

## Logger & Colored Output

VLD includes a logging system and colored terminal output.

### Logger

```typescript
import { createLogger, setLogLevel, enableDebug } from '@oxog/vld';

// Create a logger
const logger = createLogger({ prefix: 'VLD' });

logger.info('Processing...');
logger.warn('Deprecated feature');
logger.error('Validation failed');
logger.debug('Debug info');

// Set log level globally
setLogLevel('debug');

// Enable debug mode
enableDebug();
```

### Colored Output (Pigment)

```typescript
import { pigment, red, green, blue, bold, dim } from '@oxog/vld';

console.log(red('Error!'));
console.log(green('Success!'));
console.log(bold(blue('Important')));
console.log(dim('Less important'));

// Or use the pigment object
console.log(pigment.red('Error!'));
console.log(pigment.bold(pigment.green('Success!')));
```

## VLD vs. Zod

VLD is designed as a compelling alternative to Zod, offering full feature parity while delivering significant improvements.

### Feature Comparison

| Feature                 | VLD                                | Zod                                  |
| ----------------------- | ---------------------------------- | ------------------------------------ |
| **Performance**         | **~1.98x faster** (average)        | Baseline                             |
| **Memory Usage**        | **~78% less** overall              | Baseline                             |
| **Internationalization**| **Built-in (27+ languages)**       | Requires third-party library         |
| **Dependencies**        | **Zero**                           | `zod-i18n` for locales               |
| **Bundle Size**         | Smaller                            | Larger                               |
| **API**                 | 100% Zod-compatible                | Standard Zod API                     |
| **Plugin System**       | **Built-in**                       | Not available                        |
| **Result Pattern**      | **Built-in**                       | Not available                        |
| **CLI Tools**           | **Built-in**                       | Not available                        |
| **Codecs**              | Built-in, bidirectional            | Via external `zod-codecs`            |
| **Type Inference**      | Excellent                          | Excellent                            |

### Seamless Migration from Zod

```javascript
// Before (Zod)
import { z } from 'zod';
const schema = z.string().email();

// After (VLD) - Exact same syntax!
import { v } from '@oxog/vld';
const schema = v.string().email();
```

## Benchmarks

### Performance Results

| Test Case | VLD Performance | Improvement |
|-----------|----------------|-------------|
| Simple String | 73.0M ops/sec | **2.03x faster** |
| Email Validation | 21.8M ops/sec | **3.25x faster** |
| Number Validation | 36.3M ops/sec | **3.23x faster** |
| Simple Object | 7.1M ops/sec | **1.02x faster** |
| Complex Object | 1.9M ops/sec | **1.34x faster** |
| Array Validation | 7.5M ops/sec | **1.35x faster** |
| Union Types | 7.1M ops/sec | **1.29x faster** |
| Optional Values | 36.1M ops/sec | **3.16x faster** |
| SafeParse | 60.0M ops/sec | **2.73x faster** |
| Type Coercion | 20.4M ops/sec | **1.01x faster** |
| Enum Validation | 60.3M ops/sec | **2.08x faster** |
| Discriminated Union | 3.6M ops/sec | Zod 1.27x faster |

**VLD won 11/12 tests | Average: 1.98x faster than Zod**

### Run Benchmarks

```bash
# Quick performance comparison
npm run benchmark

# Memory usage comparison
npm run benchmark:memory

# Startup time comparison
npm run benchmark:startup

# Run all benchmarks
npm run benchmark:all
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Links

- [Documentation](https://vld.oxog.dev)
- [NPM Package](https://www.npmjs.com/package/@oxog/vld)
- [GitHub Repository](https://github.com/ersinkoc/vld)

---

Made with Love by [Ersin KOC](https://github.com/ersinkoc)
