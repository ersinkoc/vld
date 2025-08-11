# VLD - Fast, Type-Safe Validation Library

[![npm version](https://img.shields.io/npm/v/@oxog/vld.svg)](https://www.npmjs.com/package/@oxog/vld)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-0-green.svg)](package.json)

VLD is a blazing-fast, type-safe validation library for TypeScript and JavaScript. Built with performance in mind, it provides a simple and intuitive API while maintaining excellent type inference.

## 🚀 Features

- **⚡ Blazing Fast**: Optimized for V8 engine with superior performance
- **🎯 Type-Safe**: Full TypeScript support with excellent type inference
- **📦 Zero Dependencies**: Lightweight with no external dependencies
- **🌳 Tree-Shakeable**: Only import what you need
- **🔧 Composable**: Chain validations for complex schemas
- **💪 Flexible**: Support for transforms, custom errors, and more
- **🌍 Multi-language**: Built-in support for 15 languages

## 📊 Performance

VLD is designed for speed. In our benchmarks:
- **2.91x faster** than Zod for number validation
- **3.70x faster** for boolean validation
- **3.47x faster** for array validation
- **2.30x faster** for email validation

### 🎭 The Truth About Zod's Benchmarks

Many validation library benchmarks are misleading because they test with **reused schema instances**:

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

## 📖 API Reference

### Basic Types

```typescript
v.string()    // String validation
v.number()    // Number validation
v.boolean()   // Boolean validation
v.date()      // Date validation
v.literal()   // Literal values
v.enum()      // Enum values
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

### Custom Error Messages

```typescript
const schema = v.string().min(8, 'Password must be at least 8 characters');

const result = schema.safeParse('short');
if (!result.success) {
  console.log(result.error.message); // 'Password must be at least 8 characters'
}
```

## 🌍 Internationalization (i18n)

VLD supports 15 languages out of the box:

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

- 🇬🇧 English (`en`)
- 🇹🇷 Turkish (`tr`)
- 🇪🇸 Spanish (`es`)
- 🇫🇷 French (`fr`)
- 🇩🇪 German (`de`)
- 🇮🇹 Italian (`it`)
- 🇵🇹 Portuguese (`pt`)
- 🇷🇺 Russian (`ru`)
- 🇯🇵 Japanese (`ja`)
- 🇰🇷 Korean (`ko`)
- 🇨🇳 Chinese (`zh`)
- 🇸🇦 Arabic (`ar`)
- 🇮🇳 Hindi (`hi`)
- 🇳🇱 Dutch (`nl`)
- 🇵🇱 Polish (`pl`)

## 🔥 Advanced Examples

### Complex Validation

```typescript
const postSchema = v.object({
  id: v.union(v.string().uuid(), v.number()),
  title: v.string().min(5).max(100),
  content: v.string().min(10),
  author: v.object({
    name: v.string(),
    email: v.string().email()
  }),
  tags: v.array(v.string()).max(5),
  publishedAt: v.optional(v.date()),
  status: v.enum('draft', 'published', 'archived')
});
```

### Transformations

```typescript
// Normalize email addresses
const emailSchema = v.string()
  .toLowerCase()
  .trim()
  .email();

emailSchema.parse('  JOHN@EXAMPLE.COM  '); // 'john@example.com'
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

## 🎯 Why VLD?

### Performance First
VLD is built from the ground up with performance in mind. Every line of code is optimized for the V8 engine, resulting in validation that doesn't slow down your application.

### Real-World Testing
Our benchmarks test real-world scenarios, not just synthetic loops. VLD excels where it matters: in actual applications where schemas are created dynamically.

### Developer Experience
With excellent TypeScript support, intuitive API, and helpful error messages, VLD makes validation a breeze.

### Zero Dependencies
No dependencies means smaller bundle size, fewer security concerns, and better maintainability.

## 📈 Benchmarks

Run the benchmarks yourself:

```bash
# Standard performance comparison
npm run benchmark

# Real-world performance test (reveals the truth about benchmarks)
npm run benchmark:truth
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🔗 Links

- [NPM Package](https://www.npmjs.com/package/@oxog/vld)
- [GitHub Repository](https://github.com/ersinkoc/vld)
- [Documentation](https://github.com/ersinkoc/vld#readme)

---

Made with ❤️ by Ersin KOÇ