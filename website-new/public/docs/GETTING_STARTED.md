# Getting Started with VLD

A comprehensive guide to get you up and running with VLD (v3.0.0), the blazing-fast TypeScript validation library with Zod-compatible root and subpath APIs, V2 method-memoization chains, modular architecture, plugin system, CLI tools, and ZodError compatibility layer.

## Table of Contents

- [Installation](#installation)
- [Basic Concepts](#basic-concepts)
- [Your First Schema](#your-first-schema)
- [Common Patterns](#common-patterns)
- [Error Handling](#error-handling)
- [TypeScript Integration](#typescript-integration)
- [Best Practices](#best-practices)
- [V2 Method-Memoization (v3.0 new)](#v2-method-memoization-v30-new)
- [ZodError Compatibility (v3.0 new)](#zoderror-compatibility-v30-new)
- [Next Steps](#next-steps)

## Installation

Install VLD using your preferred package manager:

```bash
# npm
npm install @oxog/vld

# yarn
yarn add @oxog/vld

# pnpm
pnpm add @oxog/vld
```

**Requirements:** Node.js >= 18. Zero runtime dependencies. 100% TypeScript strict.

## Basic Concepts

VLD provides a simple, chainable API for building validation schemas. The core concept is creating validators that can parse, validate, and transform data.

### Core Principles

1. **Type-First**: Every validator is fully typed in TypeScript
2. **Composable**: Build complex schemas from simple primitives
3. **Performant**: Release-gated against the latest stable Zod for runtime, startup, and memory behavior
4. **Drop-in Focused**: Root, v4, v4-mini, v4/core, and v4/locales entry points are checked against Zod
5. **V2 Method-Memoization (v3.0)**: 3.00x drop-in geomean vs Zod 4.5.4 (10/10 honest wins, semantic-checked); 1.6-10x less memory per instance
6. **ZodError Compatible (v3.0)**: `toZodError()` produces ZodError-shaped errors with `.format()` and `.flatten()`
7. **Developer-Friendly**: Clear error messages and intuitive API

## Import Options

VLD v3.0 provides multiple import options for different needs:

### Full API (Classic) — V1 by default, V2 opt-in

```typescript
import { v, vV2, z, toZodError } from '@oxog/vld';

// v.* uses V1 (legacy, backward compatible)
const v1Email = v.string().email();

// vV2.* uses V2 (method-memoization, part of 3.00x drop-in geomean)
const v2Email = vV2.string().email();

// z = v — keep the z.* style
const zEmail = z.string().email();
```

### V2 Drop-in (recommended for new code)

```typescript
import { vV2 as v } from '@oxog/vld';
// Every call below is on the V2 path
const schema = v.object({
  email: v.string().email(),
  age: v.number().int().positive()
});
```

### Global V2 Toggle

```typescript
import { v } from '@oxog/vld';

v.setV2Mode(true);
// Now every v.* call returns V2 classes
const schema = v.string().email();
v.setV2Mode(false);
```

### Tree-Shakable Mini API

```typescript
import { string, number, object, optional } from '@oxog/vld/mini';
const schema = object({
  name: string().min(1),
  age: optional(number())
});
```

### Lazy Locale Loading

```typescript
import { setLocaleAsync } from '@oxog/vld/locales';
await setLocaleAsync('tr'); // Loads Turkish on demand
```

### Zod-Compatible Subpaths

```typescript
import { z, vV2 } from '@oxog/vld';
import * as v4 from '@oxog/vld/v4';
import * as mini from '@oxog/vld/v4-mini';
import * as core from '@oxog/vld/v4/core';
import * as locales from '@oxog/vld/v4/locales';

const schema = z.object({
  email: z.string().email(),
});
```

The release gate compares VLD exports against Zod 4.5.4 and runs the same TypeScript fixture once with `zod` and once with the built `@oxog/vld` package.

## Your First Schema

Let's start with a simple example:

```typescript
import { v, vV2 } from '@oxog/vld';

// V1 (legacy, default)
const nameSchema = v.string();
const name = nameSchema.parse('John'); // 'John'

// V2 (recommended, part of the 3.00x drop-in geomean)
const nameSchemaV2 = vV2.string();
const name2 = nameSchemaV2.parse('John'); // 'John'
```

### Safe Parsing

Use `safeParse` to handle errors without throwing:

```typescript
const result = nameSchema.safeParse('John');

if (result.success) {
  console.log('Valid name:', result.data);
} else {
  console.log('Validation error:', result.error.message);
}
```

### ZodError-Compatible Safe Parse (v3.0 new)

```typescript
import { v, toZodError, toZodSafeResult } from '@oxog/vld';

const zodResult = toZodSafeResult(
  v.object({ name: v.string().min(2) }).safeParse({ name: 'J' })
);

if (!zodResult.success) {
  // zodResult.error is a ZodLikeError with .format() and .flatten()
  console.log(zodResult.error.flatten());
  // { formErrors: [], fieldErrors: { name: ['...'] } }
}
```

## Common Patterns

### User Registration Form (V2)

```typescript
import { vV2 } from '@oxog/vld';

const userRegistrationSchema = vV2.object({
  username: vV2.string().min(3).max(20),
  email: vV2.string().email(),
  password: vV2.string().min(8),
  confirmPassword: vV2.string(),
  age: vV2.number().min(13).max(120),
  acceptTerms: vV2.boolean()
}).refine(
  data => data.password === data.confirmPassword,
  "Passwords don't match"
);

const formData = {
  username: 'johndoe',
  email: 'john@example.com',
  password: 'SecurePass123',
  confirmPassword: 'SecurePass123',
  age: 25,
  acceptTerms: true
};

const result = userRegistrationSchema.safeParse(formData);
if (result.success) {
  console.log('User registered:', result.data);
}
```

### API Request Validation (V2)

```typescript
import { vV2, toZodError } from '@oxog/vld';

const apiRequestSchema = vV2.object({
  method: vV2.enum('GET', 'POST', 'PUT', 'DELETE'),
  endpoint: vV2.string().startsWith('/api/'),
  headers: vV2.record(vV2.string()).optional(),
  body: vV2.unknown().optional(),
  queryParams: vV2.record(vV2.string()).optional()
});

function handleRequest(request: unknown) {
  const validated = apiRequestSchema.safeParse(request);
  if (!validated.success) {
    // ZodError-shaped for downstream tools
    return { error: toZodError(validated.error).flatten() };
  }
  return processApiCall(validated.data);
}
```

### Configuration Schema (V2)

```typescript
import { vV2 } from '@oxog/vld';

const configSchema = vV2.object({
  server: vV2.object({
    host: vV2.string().default('localhost'),
    port: vV2.number().positive().default(3000),
    ssl: vV2.boolean().default(false)
  }),
  database: vV2.object({
    url: vV2.string().url(),
    maxConnections: vV2.number().positive().default(10),
    timeout: vV2.number().positive().default(5000)
  }),
  features: vV2.object({
    authentication: vV2.boolean().default(true),
    rateLimit: vV2.boolean().default(true),
    logging: vV2.enum('none', 'error', 'warn', 'info', 'debug').default('info')
  })
});

const config = configSchema.parse({
  database: { url: 'postgresql://localhost:5432/mydb' }
});
// All missing fields are filled with defaults
```

### Data Transformation (V2)

```typescript
import { vV2 } from '@oxog/vld';

const userInputSchema = vV2.object({
  name: vV2.string()
    .transform(s => s.trim())
    .transform(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()),
  email: vV2.string()
    .transform(s => s.toLowerCase().trim())
    .email(),
  tags: vV2.string()
    .transform(s => s.split(',').map(tag => tag.trim()))
    .transform(tags => tags.filter(tag => tag.length > 0))
});

const input = {
  name: '  JOHN DOE  ',
  email: '  JOHN@EXAMPLE.COM  ',
  tags: 'javascript, typescript, , validation'
};

const result = userInputSchema.parse(input);
// Result: { name: 'John doe', email: 'john@example.com', tags: ['javascript', 'typescript', 'validation'] }
```

## Error Handling

VLD provides multiple ways to handle and format errors.

### Basic Error Handling

```typescript
import { v } from '@oxog/vld';

const schema = v.object({
  name: v.string().min(2),
  age: v.number().positive()
});

const result = schema.safeParse({ name: 'J', age: -5 });

if (!result.success) {
  console.log(result.error.message);
  // 'String must be at least 2 characters'
}
```

### Formatted Errors

```typescript
import { v, prettifyError, flattenError } from '@oxog/vld';

const schema = v.object({
  user: v.object({
    name: v.string().min(2),
    email: v.string().email()
  }),
  settings: v.object({
    theme: v.enum('light', 'dark'),
    notifications: v.boolean()
  })
});

const result = schema.safeParse({
  user: { name: 'J', email: 'invalid' },
  settings: { theme: 'blue', notifications: 'yes' }
});

if (!result.success) {
  console.log(prettifyError(result.error));
  // ✖ String must be at least 2 characters
  //   → at user.name
  // ✖ Invalid email format
  //   → at user.email
  // ✖ Invalid enum value
  //   → at settings.theme

  const flat = flattenError(result.error);
  // { fieldErrors: { 'user.name': [...], 'user.email': [...], 'settings.theme': [...] } }
}
```

### ZodError-Compatible Errors (v3.0 new)

```typescript
import { v, toZodError, ZodLikeError } from '@oxog/vld';

const result = v.object({
  name: v.string().min(2),
  email: v.string().email()
}).safeParse({ name: 'J', email: 'bad' });

if (!result.success) {
  const zodErr = toZodError(result.error);
  // zodErr is an instance of ZodLikeError / ZodError
  // zodErr.name === 'ZodError'
  // zodErr.issues: Zod-shaped issue array
  // zodErr.format() and zodErr.flatten() match Zod 4.5
}
```

## TypeScript Integration

### Type Inference

```typescript
import { vV2, type Infer } from '@oxog/vld';

const productSchema = vV2.object({
  id: vV2.string().uuid(),
  name: vV2.string(),
  price: vV2.number().positive(),
  inStock: vV2.boolean(),
  categories: vV2.array(vV2.string()),
  metadata: vV2.record(vV2.any()).optional()
});

type Product = Infer<typeof productSchema>;

function processProduct(product: Product) {
  console.log(product.name, product.price);
}

const rawData: unknown = fetchProductData();
const product = productSchema.parse(rawData);
// 'product' is typed as Product
```

### Type Guards

```typescript
const isValidProduct = (data: unknown): data is Product => {
  return productSchema.isValid(data);
};

if (isValidProduct(someData)) {
  console.log(someData.price);
}
```

## Best Practices

### 1. Reuse Schemas

```typescript
import { vV2 } from '@oxog/vld';

const emailSchema = vV2.string().email();
const passwordSchema = vV2.string().min(8);
const idSchema = vV2.string().uuid();

const loginSchema = vV2.object({ email: emailSchema, password: passwordSchema });
const userSchema = vV2.object({
  id: idSchema,
  email: emailSchema,
  password: passwordSchema,
  createdAt: vV2.date()
});
```

### 2. Use Descriptive Error Messages

```typescript
import { v } from '@oxog/vld';

const ageSchema = v.number()
  .min(18, 'You must be at least 18 years old')
  .max(120, 'Please enter a valid age');

const passwordSchema = v.string()
  .min(8, 'Password must be at least 8 characters')
  .refine(pwd => /[A-Z]/.test(pwd), 'Password must contain an uppercase letter');
```

### 3. Validate at Boundaries

```typescript
import { v, toZodError } from '@oxog/vld';

app.post('/api/users', (req, res) => {
  const result = userSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: toZodError(result.error).flatten() });
  }
  createUser(result.data);
});

const envSchema = v.object({
  NODE_ENV: v.enum('development', 'production', 'test'),
  PORT: v.coerce.number().positive(),
  DATABASE_URL: v.string().url()
});
const env = envSchema.parse(process.env);
```

### 4. Use Coercion for User Input

```typescript
import { vV2 } from '@oxog/vld';

const formSchema = vV2.object({
  age: vV2.coerce.number(),
  acceptTerms: vV2.coerce.boolean(),
  startDate: vV2.coerce.date()
});

formSchema.parse({
  age: '25',           // Coerced to 25
  acceptTerms: 'true', // Coerced to true
  startDate: '2024-01-01' // Coerced to Date object
});
```

### 5. Use String Format Validators

```typescript
import { v } from '@oxog/vld';

const emailSchema = v.email();
const uuidSchema = v.uuid();
const ipSchema = v.ipv4();

const dateSchema = v.iso.date();
const timeSchema = v.iso.time();

const userIdSchema = v.uuid({ version: 'v4' });
```

### 6. Use Discriminated Unions for Type Safety

```typescript
import { v } from '@oxog/vld';

const eventSchema = v.discriminatedUnion('type',
  v.object({ type: v.literal('click'), x: v.number(), y: v.number() }),
  v.object({ type: v.literal('scroll'), delta: v.number() }),
  v.object({ type: v.literal('keypress'), key: v.string() })
);

const event = eventSchema.parse(data);
if (event.type === 'click') {
  console.log(event.x, event.y); // TypeScript narrows the type
}
```

### 7. Use vV2 for Hot Paths (v3.0 new)

```typescript
import { vV2 } from '@oxog/vld';

// Identical surface, part of the 3.00x drop-in geomean
const hotPathSchema = vV2.string().min(1).email();
```

## V2 Method-Memoization (v3.0 new)

VLD 3.0 ships the **V2 method-memoization pattern** across every chain-heavy validator. V2 matches Zod 4.5's "method memoization" optimization and beats it on both throughput and memory.

### Why V2?

| Schema | v.* (V1) | vV2 | Zod 4.5 | V2 vs Zod |
|---|---:|---:|---:|---:|
| `string().min(1).email()` | 22ms | **22ms** | 50ms | 2.3x faster |
| `number().int().positive().min(1)` | 12ms | **6ms** | 39ms | **6.5x faster** |
| `object({a:str, b:num})` | 12ms | **11ms** | 18ms | 1.6x faster |
| Realistic API (10 fields) | 276ms | **243ms** | 767ms | **3.2x faster** |

*1M `safeParse` operations, pre-built schemas, Node v24.13.0.*

### Memory (N=100k, 3-pass GC)

- `v.stringV2().email()`: **400 B/instance** vs legacy 704 B/instance vs Zod 4210 B/instance
- Realistic API 10 fields: **4,980 B/instance** vs legacy 7,354 B/instance

### Three ways to use V2

**1. vV2 drop-in factory (recommended for new code)**
```typescript
import { vV2 } from '@oxog/vld';
const schema = vV2.string().min(1).email();
```

**2. v.setV2Mode(true) — global toggle (no source rewrites)**
```typescript
import { v } from '@oxog/vld';
v.setV2Mode(true);
const schema = v.string().min(1).email(); // Now V2
v.setV2Mode(false); // Back to V1
```

**3. z = v — keep the z.* style**
```typescript
import { v as z } from '@oxog/vld';
// Or: import { vV2 as z } from '@oxog/vld';
const schema = z.string().min(1).email();
```

### When NOT to use V2

Composites (`VldObject`, `VldArray`, `VldUnion`, etc.) stay in V1 form internally because they already have precomputed fast-paths. V2 is meaningful for chain-heavy leaf validators (string, number, date, bigint). Mixing V2 children under a V1 object is fully supported and is the recommended pattern.

## ZodError Compatibility (v3.0 new)

VLD 3.0 ships a ZodError compatibility layer for codebases that expect Zod-shaped errors.

```typescript
import { v, toZodError, toZodSafeResult, ZodLikeError } from '@oxog/vld';

const result = v.object({ name: v.string().min(2) }).safeParse({ name: 'J' });

if (!result.success) {
  const zodErr = toZodError(result.error);
  // zodErr is a ZodLikeError (instanceof ZodLikeError, name === 'ZodError')
  console.log(zodErr.issues[0].code);   // 'too_small'
  console.log(zodErr.issues[0].path);   // ['name']
  console.log(zodErr.format());         // Nested error tree
  console.log(zodErr.flatten());        // { formErrors, fieldErrors }
}

// One-liner safe result conversion
const zodResult = toZodSafeResult(result);
// { success: false, error: ZodLikeError }
```

## Next Steps

Now that you understand the basics, explore these advanced topics:

1. **[V3 Migration Guide](./migration.md)** — Migrate from V2 or Zod to VLD 3.0
2. **[V2 Pattern Deep Dive](./ADVANCED_FEATURES.md)** — V2 method-memoization internals
3. **[API Reference](./api.md)** — Complete V2/V1/ZodError API
4. **[Performance Guide](./PERFORMANCE.md)** — V2 vs V1 vs Zod 4.5 benchmarks
5. **[Zod Compatibility](./ZOD_COMPATIBILITY.md)** — Drop-in replacement policy

## Examples Repository

Check out our [examples directory](../examples) for more real-world use cases:

- `basic.js` — V1 + V2 + toZodError side-by-side
- `v3-features.js` — V2 method-memoization, vV2, setV2Mode, ZodError
- `advanced.js`, `advanced-features.js` — Complex V2 chains
- `zod-migration.js` — Step-by-step Zod → VLD migration
- `express-api.js` — Express middleware with vV2 hot path
- `react-form.jsx` — React form with vV2 + toZodError
- `typescript.ts` — Full TypeScript inference with V2 children
- `codecs.js`, `codecs.ts` — Bidirectional codecs with V2 inner schemas
- `internationalization.js` — 27+ locales on V1 and V2 paths

---

Happy validating! 🚀
