# VLD - Fast & Lightweight TypeScript Validation Library

[![NPM Version](https://img.shields.io/npm/v/@oxog/vld.svg)](https://www.npmjs.com/package/@oxog/vld) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/) [![Zero Dependencies](https://img.shields.io/badge/Dependencies-0-green.svg)](package.json) [![Test Coverage](https://img.shields.io/badge/Coverage-96.55%25-brightgreen.svg)](package.json)

VLD is a blazing-fast, type-safe validation library for TypeScript and JavaScript with **full Zod feature parity**. Built with performance in mind, it provides a simple and intuitive API while maintaining excellent type inference and 27+ language internationalization support.

## 📚 Table of Contents

- [🚀 Features](#-features)
- [📊 Performance](#-performance)
- [📦 Installation](#-installation)
- [🎯 Quick Start](#-quick-start)
- [📖 API Reference](#-api-reference)
- [🌍 Internationalization (i18n)](#-internationalization-i18n)
- [⚠️ Error Handling & Formatting](#️-error-handling--formatting)
- [🔥 Advanced Examples](#-advanced-examples)
- [🎯 Why VLD?](#-why-vld)
- [🔄 Codecs - Bidirectional Transformations](#-codecs---bidirectional-transformations)
- [🔄 Migrating from Zod](#-migrating-from-zod)
- [📈 Benchmarks](#-benchmarks)
- [🤝 Contributing](#-contributing)
- [🔗 Links](#-links)

## 🚀 Features

### Core Features
- **⚡ Blazing Fast**: Optimized for V8 engine with superior performance
- **🎯 Type-Safe**: Full TypeScript support with excellent type inference  
- **📦 Zero Dependencies**: Lightweight with no external dependencies
- **🌳 Tree-Shakeable**: Only import what you need
- **🔧 Composable**: Chain validations for complex schemas
- **⚠️ Advanced Error Formatting**: Tree, pretty, and flatten error utilities
- **🌍 Multi-language**: Built-in support for 27+ languages
- **✅ 96.55% Test Coverage**: Rigorously tested with 1142 passing tests
- **🏆 Industry Leading Performance**: 2.52x faster than Zod on average

### Advanced Zod-Compatible Features  
- **🔄 Type Coercion**: `v.coerce.string()`, `v.coerce.number()`, `v.coerce.boolean()`, etc.
- **📊 Advanced Types**: BigInt, Symbol, Tuple, Record, Set, Map validation
- **⚡ Intersection Types**: Combine multiple schemas with intelligent merging
- **🎨 Custom Validation**: `refine()` for custom predicates and validation logic
- **🔄 Data Transformation**: `transform()` for post-validation data transformation
- **🏠 Default Values**: `default()` for handling undefined inputs elegantly  
- **🛡️ Fallback Handling**: `catch()` for graceful error recovery
- **🎯 Object Utilities**: `pick()`, `omit()`, `extend()` for flexible object schemas

### 🚀 **NEW in v1.4.0** - Zod 4 Full API Parity
- **🌐 `v.cidrv6()`**: IPv6 CIDR block validation
- **🔗 `.apply()`**: External function chaining for advanced composition
- **🛡️ `.safeExtend()`**: Type-safe object extension without accidental overrides

### 🚀 Codec System - Beyond Zod
- **↔️ Bidirectional Transformations**: Full encode/decode support for data conversion
- **📦 19 Built-in Codecs**: String conversions, date parsing, JSON, URL, binary data
- **🔗 Zod-Compatible**: All `stringToNumber`, `jsonCodec`, `base64ToBytes`, etc.
- **⚡ Async Support**: Both sync and async codec operations
- **🛠 Custom Codecs**: Create your own bidirectional transformations
- **🎯 Type-Safe**: Full TypeScript support with perfect type inference

## 📊 Performance

VLD is designed for speed and efficiency with recent optimizations delivering exceptional performance:

### Speed Benchmarks (v1.0.0 - Optimized)
- **4.6x faster** for number validation with constraints
- **3.6x faster** for union type validation
- **2.5x faster** for email validation
- **1.9x faster** for array validation
- **1.7x faster** for primitive string validation
- **2.8x faster** overall average performance

### Recent Optimizations (v1.0.0)
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

## 📦 Installation

```bash
npm install @oxog/vld
# or
yarn add @oxog/vld
# or
pnpm add @oxog/vld
```

## 🎯 Quick Start

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

## 📖 API Reference

### Basic Types

```typescript
v.string()    // String validation
v.number()    // Number validation  
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

// Composition
v.union(v.string(), v.number())        // Union types
v.intersection(schemaA, schemaB)       // Intersection types
v.optional(v.string())                 // Optional fields
v.nullable(v.string())                 // Nullable fields
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
```

### Composite Types

```typescript
// Optional
v.optional(v.string())       // string | undefined

// Nullable
v.nullable(v.string())       // string | null

// Union
v.union(v.string(), v.number()) // string | number

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

## 🌍 Internationalization (i18n)

VLD supports 27+ languages out of the box with comprehensive error messages:

```typescript
import { v, setLocale } from '@oxog/vld';

// Default is English
const schema = v.string().min(5);
schema.safeParse('Hi'); // Error: "String must be at least 5 characters"

// Switch to Turkish
setLocale('tr');
schema.safeParse('Hi'); // Error: "Metin en az 5 karakter olmalı"

// Switch to Spanish
setLocale('es');
schema.safeParse('Hi'); // Error: "La cadena debe tener al menos 5 caracteres"

// Switch to Japanese
setLocale('ja');
schema.safeParse('Hi'); // Error: "文字列は5文字以上である必要があります"
```

### Supported Languages

#### Base Languages (15):
- 🇬🇧 English (`en`) - 🇹🇷 Turkish (`tr`) - 🇪🇸 Spanish (`es`) - 🇫🇷 French (`fr`) - 🇩🇪 German (`de`)
- 🇮🇹 Italian (`it`) - 🇵🇹 Portuguese (`pt`) - 🇷🇺 Russian (`ru`) - 🇯🇵 Japanese (`ja`) - 🇰🇷 Korean (`ko`)
- 🇨🇳 Chinese (`zh`) - 🇸🇦 Arabic (`ar`) - 🇮🇳 Hindi (`hi`) - 🇳🇱 Dutch (`nl`) - 🇵🇱 Polish (`pl`)

#### European Languages (4):
- 🇩🇰 Danish (`da`) - 🇸🇪 Swedish (`sv`) - 🇳🇴 Norwegian (`no`) - 🇫🇮 Finnish (`fi`)

#### Asian Languages (4):
- 🇹🇭 Thai (`th`) - 🇻🇳 Vietnamese (`vi`) - 🇮🇩 Indonesian (`id`) - 🇧🇩 Bengali (`bn`)

#### African Languages (2):
- 🇰🇪 Swahili (`sw`) - 🇿🇦 Afrikaans (`af`)

#### American Languages (2):
- 🇧🇷 Portuguese Brazil (`pt-BR`) - 🇲🇽 Spanish Mexico (`es-MX`)

**Plus 75+ additional languages** supported through comprehensive type definitions with English fallback, including Icelandic, Czech, Slovak, Hungarian, Romanian, Bulgarian, Croatian, Slovenian, Greek, Hebrew, Persian, Georgian, Armenian, and many more!

## ⚠️ Error Handling & Formatting

VLD provides advanced error formatting utilities similar to Zod's error handling system. These utilities help you transform validation errors into user-friendly formats for different use cases.

### Error Formatting Utilities

```typescript
import { v, VldError, treeifyError, prettifyError, flattenError } from '@oxog/vld';

// Note: Error formatting utilities like `treeifyError` are separate named exports
// and are not part of the main `v` object.

const userSchema = v.object({
  username: v.string().min(3),
  favoriteNumbers: v.array(v.number()),
  profile: v.object({
    name: v.string(),
    email: v.string().email()
  })
});

// This will fail validation
const result = userSchema.safeParse({
  username: 'ab', // too short
  favoriteNumbers: [1, 'two', 3], // 'two' is not a number
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
  console.log(tree);
  /*
  {
    errors: ['Unrecognized key: "extraField"'],
    properties: {
      username: { errors: ['String must be at least 3 characters'] },
      favoriteNumbers: {
        items: [
          undefined,
          { errors: ['Expected number, received string'] },
          undefined
        ]
      },
      profile: {
        properties: {
          name: { errors: ['String cannot be empty'] },
          email: { errors: ['Invalid email format'] }
        }
      }
    }
  }
  */
  
  // 2. Pretty Format - Human-readable console output
  const pretty = prettifyError(error);
  console.log(pretty);
  /*
  ✖ Unrecognized key: "extraField"
  ✖ String must be at least 3 characters
    → at username
  ✖ Expected number, received string
    → at favoriteNumbers[1]
  ✖ String cannot be empty
    → at profile.name
  ✖ Invalid email format
    → at profile.email
  */
  
  // 3. Flatten Format - Simple form validation
  const flattened = flattenError(error);
  console.log(flattened);
  /*
  {
    formErrors: ['Unrecognized key: "extraField"'],
    fieldErrors: {
      username: ['String must be at least 3 characters'],
      favoriteNumbers: ['Expected number, received string'],
      profile: ['String cannot be empty', 'Invalid email format']
    }
  }
  */
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
      // Process valid data
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
  } else {
    // Process valid user data
  }
});
```

#### Console Debugging
```typescript
function validateAndLog(data: unknown) {
  const result = userSchema.safeParse(data);
  
  if (!result.success) {
    console.log('Validation failed:');
    console.log(prettifyError(result.error as VldError));
  }
}
```

## 🔥 Advanced Examples

### Complex Validation with New Features

```typescript
const postSchema = v.object({
  id: v.union(v.string().uuid(), v.number()),
  title: v.string().min(5).max(100),
  content: v.string().min(10),
  author: v.object({
    name: v.string(),
    email: v.string().email(),
    age: v.coerce.number(), // Auto-convert to number
  }),
  tags: v.set(v.string()).default(new Set()), // Use Set instead of array
  metadata: v.record(v.any()), // Key-value metadata
  coordinates: v.tuple(v.number(), v.number()), // [lat, lng]
  publishedAt: v.date().default(() => new Date()),
  status: v.enum('draft', 'published', 'archived')
});

// Extend with additional fields
const blogPostSchema = postSchema.extend({
  viewCount: v.bigint().default(0n),
  categories: v.array(v.string()).min(1),
  featured: v.boolean().default(false)
});

// Create a public version without sensitive data
const publicPostSchema = blogPostSchema
  .omit('author')
  .extend({
    authorName: v.string()
  });
```

### Advanced Transformations & Validation

```typescript
// Complex email processing with coercion and transformation
const emailSchema = v.coerce.string()
  .transform(s => s.toLowerCase().trim())
  .refine(s => s.includes('@'), 'Must be valid email format')
  .transform(s => s.replace(/\+.*@/, '@')) // Remove plus addressing
  .catch('invalid@example.com');

// Process user input with fallbacks
const userInputSchema = v.object({
  name: v.coerce.string()
    .transform(s => s.trim())
    .refine(s => s.length > 0, 'Name cannot be empty')
    .default('Anonymous'),
  
  age: v.coerce.number()
    .refine(n => n >= 0 && n <= 150, 'Age must be realistic')
    .catch(0),
    
  preferences: v.record(v.any()).default({}),
  
  tags: v.union(
    v.array(v.string()),
    v.coerce.string().transform(s => s.split(','))
  ).default([])
});

// Intersection for combining user types
const baseUser = v.object({
  id: v.string(),
  name: v.string()
});

const adminUser = v.object({
  role: v.literal('admin'),
  permissions: v.array(v.string())
});

const adminSchema = v.intersection(baseUser, adminUser);
```

### Collection Validation

```typescript
// Advanced tuple validation
const coordinatesSchema = v.tuple(
  v.number().min(-90).max(90),    // latitude
  v.number().min(-180).max(180),  // longitude
  v.number().positive().optional() // altitude
);

// Map validation for configuration
const configSchema = v.map(
  v.string().min(1), // keys must be non-empty strings
  v.union(v.string(), v.number(), v.boolean()) // values can be mixed types
);

// Set validation for unique tags
const uniqueTagsSchema = v.set(v.string().min(1).max(20))
  .refine(tags => tags.size <= 10, 'Too many tags');
```

### Real-world API Schema

```typescript
// Complete API endpoint schema with all features
const apiUserSchema = v.object({
  // Basic info with coercion
  id: v.coerce.string(),
  username: v.string()
    .min(3)
    .max(20)
    .refine(s => /^[a-zA-Z0-9_]+$/.test(s), 'Invalid username format'),
  
  email: v.coerce.string()
    .transform(s => s.toLowerCase().trim())
    .refine(s => s.includes('@'), 'Invalid email'),
    
  // Age with fallback
  age: v.coerce.number()
    .min(13)
    .max(120)
    .catch(null),
    
  // Preferences as key-value store
  preferences: v.record(v.any()).default({}),
  
  // Roles as a set for uniqueness
  roles: v.set(v.enum('user', 'admin', 'moderator'))
    .default(new Set(['user'])),
    
  // Metadata with BigInt support
  createdAt: v.coerce.date(),
  userId: v.coerce.bigint(),
  
  // Optional complex nested data
  profile: v.object({
    bio: v.string().max(500).default(''),
    location: v.tuple(v.number(), v.number()).optional(),
    socialLinks: v.record(v.string().url()).default({})
  }).optional()
});

// Specialized schemas using pick/omit
const publicUserSchema = apiUserSchema.pick('username', 'profile');
const adminUserSchema = apiUserSchema.extend({
  adminNotes: v.string().optional(),
  lastLogin: v.date().optional()
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
    // data is now typed as LoginForm
    const { username, password, rememberMe } = result.data;
    // ... handle login
  } else {
    // Handle validation errors
    console.error(result.error);
  }
}
```

## 🆚 VLD vs. Zod

VLD is designed as a compelling alternative to Zod, offering full feature parity while delivering significant improvements in performance, bundle size, and internationalization.

### Feature Comparison

| Feature                 | VLD                                | Zod                                  |
| ----------------------- | ---------------------------------- | ------------------------------------ |
| **Performance**         | **~2.07x faster** (average)        | Baseline                             |
| **Memory Usage**        | **~78% less** overall              | Baseline                             |
| **Internationalization**| ✅ **Built-in (27+ languages)**    | ❌ Requires third-party library      |
| **Dependencies**        | **Zero**                           | `zod-i18n` for locales               |
| **Bundle Size**         | Smaller                            | Larger                               |
| **API**                 | 100% Zod-compatible                | Standard Zod API                     |
| **Codecs**              | ✅ Built-in, bidirectional         | ✅ Via external `zod-codecs`         |
| **Error Formatting**    | ✅ Advanced (tree, pretty, flatten)| ✅ Advanced (tree, pretty, flatten)|
| **Type Inference**      | ✅ Excellent                       | ✅ Excellent                         |

### 🔄 Seamless Migration from Zod

Migration is straightforward due to 100% API compatibility. You can typically just swap the import statement.

```javascript
// Before (Zod)
import { z } from 'zod';
const schema = z.string().email();

// After (VLD) - Exact same syntax!
import { v } from '@oxog/vld';
const schema = v.string().email();
```

## 🔄 Codecs - Bidirectional Transformations

VLD introduces **codecs** - powerful bidirectional transformations that can convert data between different representations. Unlike simple transformations, codecs can both **decode** (input → output) and **encode** (output → input).

### 🎯 What are Codecs?

Codecs enable safe, type-checked conversions between different data formats. They're perfect for:
- **API boundaries**: Convert strings to structured data
- **Database serialization**: Transform objects to/from storage formats
- **Network protocols**: Handle data encoding/decoding
- **Configuration parsing**: Convert config strings to typed values

### 📦 Built-in Codecs

VLD provides all Zod-compatible codecs plus additional utilities:

#### **String Conversion Codecs**

```typescript
import { stringToNumber, stringToInt, stringToBigInt, stringToBoolean } from '@oxog/vld';

// String to number conversion
const age = stringToNumber.parse('25'); // 25
const price = stringToNumber.encode(99.99); // "99.99"

// String to integer (validates integer constraint)
const count = stringToInt.parse('42'); // 42
stringToInt.parse('42.5'); // ❌ Validation error: must be integer

// String to BigInt for large numbers
const bigNum = stringToBigInt.parse('123456789012345678901234567890'); // 123456789012345678901234567890n

// String to boolean (flexible parsing)
stringToBoolean.parse('true'); // true
stringToBoolean.parse('1'); // true
stringToBoolean.parse('yes'); // true
stringToBoolean.parse('on'); // true
stringToBoolean.parse('false'); // false
stringToBoolean.parse('0'); // false
```

#### **Date Conversion Codecs**

```typescript
import { isoDatetimeToDate, epochSecondsToDate, epochMillisToDate } from '@oxog/vld';

// ISO datetime string to Date
const date1 = isoDatetimeToDate.parse('2023-12-25T10:30:00.000Z');
console.log(date1.toISOString()); // "2023-12-25T10:30:00.000Z"

// Unix epoch seconds to Date
const date2 = epochSecondsToDate.parse(1703505000);
console.log(date2.getFullYear()); // 2023

// Unix epoch milliseconds to Date
const date3 = epochMillisToDate.parse(1703505000000);
console.log(date3.getMonth()); // 11 (December)

// All support bidirectional conversion
const backToEpoch = epochSecondsToDate.encode(new Date()); // Unix timestamp
```

#### **JSON and Complex Data Codecs**

```typescript
import { jsonCodec, base64Json } from '@oxog/vld';

// Generic JSON codec
const userJson = jsonCodec();
const user = userJson.parse('{"name":"John","age":30}'); // { name: "John", age: 30 }
const jsonString = userJson.encode(user); // '{"name":"John","age":30}'

// JSON codec with schema validation
const userSchema = v.object({
  name: v.string(),
  age: v.number()
});
const typedJsonCodec = jsonCodec(userSchema);
const validatedUser = typedJsonCodec.parse('{"name":"John","age":30}'); // Fully typed!

// Base64-encoded JSON
const b64JsonCodec = base64Json(userSchema);
const encoded = b64JsonCodec.encode({ name: "Alice", age: 25 }); // Base64 string
const decoded = b64JsonCodec.parse(encoded); // { name: "Alice", age: 25 }
```

#### **URL and Web Codecs**

```typescript
import { stringToURL, stringToHttpURL, uriComponent } from '@oxog/vld';

// String to URL object
const url = stringToURL.parse('https://example.com/path?param=value');
console.log(url.hostname); // "example.com"
console.log(url.searchParams.get('param')); // "value"

// Restrict to HTTP/HTTPS only
const httpUrl = stringToHttpURL.parse('https://api.example.com');
stringToHttpURL.parse('ftp://files.example.com'); // ❌ Error: Must be HTTP/HTTPS

// URI component encoding/decoding
const encoded = uriComponent.parse('Hello World! 🚀'); // "Hello%20World!%20%F0%9F%9A%80"
const decoded = uriComponent.encode(encoded); // "Hello World! 🚀"
```

#### **Binary Data Codecs**

```typescript
import { base64ToBytes, hexToBytes, utf8ToBytes, bytesToUtf8 } from '@oxog/vld';

// Base64 to byte array
const bytes1 = base64ToBytes.parse('SGVsbG8gV29ybGQ='); // Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100])

// Hex to byte array
const bytes2 = hexToBytes.parse('48656c6c6f'); // Uint8Array([72, 101, 108, 108, 111])

// UTF-8 string to bytes
const bytes3 = utf8ToBytes.parse('Hello! 👋'); // Uint8Array([...])

// Bytes to UTF-8 string
const text = bytesToUtf8.parse(bytes3); // "Hello! 👋"

// All support round-trip conversion
const original = 'Hello World!';
const roundTrip = bytesToUtf8.parse(utf8ToBytes.parse(original)); // "Hello World!"
```

### 🛠 Custom Codecs

Create your own codecs for specific use cases:

```typescript
import { v } from '@oxog/vld';

// Custom CSV to array codec
const csvToArray = v.codec(
  v.string(), // Input: CSV string
  v.array(v.string()), // Output: Array of strings
  {
    decode: (csv: string) => csv.split(',').map(s => s.trim()),
    encode: (arr: string[]) => arr.join(', ')
  }
);

const tags = csvToArray.parse('react, typescript, vld'); // ["react", "typescript", "vld"]
const csvString = csvToArray.encode(['node', 'express', 'api']); // "node, express, api"

// Complex: Environment config codec
const envConfigCodec = v.codec(
  v.string(),
  v.object({
    port: v.number(),
    debug: v.boolean(),
    dbUrl: v.string()
  }),
  {
    decode: (envString: string) => {
      const config = {};
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

### 🚀 Advanced Codec Features

#### **Async Codecs**
```typescript
const asyncCodec = v.codec(
  v.string(),
  v.object({ data: v.string() }),
  {
    decode: async (str: string) => {
      // Simulate API call
      const response = await fetch(`/api/decode?data=${str}`);
      return response.json();
    },
    encode: async (obj) => {
      const response = await fetch('/api/encode', {
        method: 'POST',
        body: JSON.stringify(obj)
      });
      return response.text();
    }
  }
);

// Use async methods
const result = await asyncCodec.parseAsync('input-data');
const encoded = await asyncCodec.encodeAsync({ data: 'output' });
```

#### **Error Handling**
```typescript
const safeParseResult = stringToNumber.safeParse('not-a-number');
if (!safeParseResult.success) {
  console.error('Parse failed:', safeParseResult.error.message);
}

const safeEncodeResult = stringToNumber.safeEncode('invalid-input');
if (!safeEncodeResult.success) {
  console.error('Encode failed:', safeEncodeResult.error.message);
}
```

#### **JWT Payload Decoder**
```typescript
import { jwtPayload } from '@oxog/vld';

// Decode JWT payload (read-only)
const payloadSchema = v.object({
  sub: v.string(),
  name: v.string(),
  iat: v.number()
});

const decoder = jwtPayload(payloadSchema);
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

const payload = decoder.parse(token);
console.log(payload.name); // "John Doe"
console.log(payload.sub); // "1234567890"
```

### 🎯 Codec vs Transform

| Feature | Codec | Transform |
|---------|--------|-----------|
| **Direction** | Bidirectional (encode/decode) | Unidirectional (transform only) |
| **Type Safety** | Input and output validation | Output validation only |
| **Use Case** | Data serialization, API boundaries | Data cleaning, formatting |
| **Performance** | Optimized for round-trips | Optimized for single direction |

```typescript
// Transform: One-way conversion
const upperCase = v.string().transform(s => s.toUpperCase());
const result = upperCase.parse('hello'); // "HELLO"
// No way to get back to "hello"

// Codec: Two-way conversion
const upperCaseCodec = v.codec(
  v.string(),
  v.string(), 
  {
    decode: s => s.toUpperCase(),
    encode: s => s.toLowerCase()
  }
);
const encoded = upperCaseCodec.parse('hello'); // "HELLO"
const original = upperCaseCodec.encode('HELLO'); // "hello"
```

## 🔄 Migrating from Zod

VLD provides 100% feature parity with Zod, making migration seamless:

### Simple Migration
```javascript
// Before (Zod)
import { z } from 'zod';
const schema = z.string().email();

// After (VLD) - Exact same syntax!
import { v } from '@oxog/vld';
const schema = v.string().email();
```

### Why Migrate?
- **⚡ Performance**: 2-4x faster for most operations
- **💾 Memory**: Uses 1.18-1.82x less memory than Zod
- **🌍 Internationalization**: Built-in 27+ language support
- **📦 Bundle Size**: Smaller with zero dependencies
- **🔒 Security**: Immutable validators prevent memory leaks
- **✅ Testing**: 96.55% test coverage with 1142 tests

## 📈 Benchmarks

### Performance Results

Latest benchmark results show VLD consistently outperforming Zod:

| Test Case | VLD Performance | Improvement |
|-----------|----------------|-------------|
| Simple String | 44.4M ops/sec | **1.67x faster** |
| Email Validation | 18.6M ops/sec | **3.63x faster** |
| Number Validation | 22.7M ops/sec | **2.62x faster** |
| Object Validation | 7.6M ops/sec | **1.27x faster** |
| Array Validation | 6.7M ops/sec | **1.29x faster** |
| Union Types | 6.8M ops/sec | **1.54x faster** |
| Optional Values | 32.7M ops/sec | **4.52x faster** |
| Type Coercion | 18.4M ops/sec | **1.46x faster** |

**Average: 2.52x faster than Zod**

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

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🔗 Links

- [Documentation](https://vld.oxog.dev)
- [NPM Package](https://www.npmjs.com/package/@oxog/vld)
- [GitHub Repository](https://github.com/ersinkoc/vld)

---

Made with ❤️ by [Ersin KOÇ](https://github.com/ersinkoc)