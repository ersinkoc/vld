# VLD - Ultra-Fast TypeScript Validation Library

[![NPM Version](https://img.shields.io/npm/v/@oxog/vld.svg)](https://www.npmjs.com/package/@oxog/vld) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/) [![Zero Dependencies](https://img.shields.io/badge/Dependencies-0-green.svg)](package.json) [![Test Coverage](https://img.shields.io/badge/Coverage-100%25-brightgreen.svg)](package.json) [![Website](https://img.shields.io/badge/Website-vld.oxog.dev-6366f1.svg)](https://vld.oxog.dev)

VLD is an ultra-fast, type-safe schema validation library for TypeScript and JavaScript with **drop-in Zod compatibility**. Built for extreme performance and developer ergonomics, it delivers full static type inference, zero runtime dependencies, and built-in internationalization across 27+ languages.

🌐 **Website & Live Playground**: [https://vld.oxog.dev](https://vld.oxog.dev)

---

## Highlights

- **Release-Gated Speed**: 11x+ faster runtime throughput and 4.7x+ less memory consumption compared to Zod.
- **Zero Dependencies**: Pure TypeScript/JavaScript with zero third-party runtime bloat.
- **Drop-in Zod Compatibility**: Swap imports directly or use subpaths (`@oxog/vld/v4`, `@oxog/vld/mini`, `@oxog/vld/v4/core`, `@oxog/vld/v4/locales`).
- **Full Static Inference**: Automatic type extraction using `v.infer<typeof schema>`.
- **Tree-Shakeable Mini API**: Build hyper-optimized bundles with `@oxog/vld/mini`.
- **Built-in i18n**: Out-of-the-box error localization for 27+ languages with lazy-loading support (`@oxog/vld/locales/lazy`).
- **Result Pattern & Codecs**: Functional error handling (`tryCatch`, `match`, `Ok`, `Err`) and bidirectional data transformations.
- **100% Test Coverage**: Verified across 2500+ tests and drop-in TypeScript application suites.

---

## Installation

```bash
npm install @oxog/vld
# or
yarn add @oxog/vld
# or
pnpm add @oxog/vld
# or
bun add @oxog/vld
```

---

## Quick Start

```typescript
import { v } from '@oxog/vld';

// Define schema with chainable validations
const userSchema = v.object({
  name: v.string().min(2).max(100),
  email: v.string().email(),
  age: v.number().int().positive().optional(),
  role: v.enum('admin', 'user', 'guest').default('user'),
  tags: v.array(v.string()).min(1),
});

// Infer TypeScript type
type User = v.infer<typeof userSchema>;

// Safe parsing (no throwing)
const result = userSchema.safeParse({
  name: 'John Doe',
  email: 'john@example.com',
  age: 28,
  tags: ['developer', 'typescript'],
});

if (result.success) {
  console.log('Valid data:', result.data); // Typed as User
} else {
  console.error('Validation issues:', result.error.issues);
}
```

---

## Core Schema API

### Primitive Validators

```typescript
v.string()          // String validation
v.number()          // Number validation
v.int()             // Integer validation
v.int32()           // 32-bit integer validation
v.boolean()         // Boolean validation
v.bigint()          // BigInt validation
v.date()            // Date validation
v.symbol()          // Symbol validation
v.uint8array()      // Uint8Array validation
v.literal('active') // Literal value
v.enum('admin', 'user', 'guest') // Enum values
v.any()             // Any type
v.unknown()         // Unknown type
v.null()            // Null
v.undefined()       // Undefined
v.nullish()         // Null or undefined
v.void()            // Void
v.never()           // Never
```

### String Formats

```typescript
v.string()
  .min(3)
  .max(100)
  .email()
  .url()
  .uuid()
  .regex(/^[a-z0-9]+$/)
  .startsWith('https://')
  .endsWith('.json')
  .trim()
  .toLowerCase();

// Top-level format helpers:
v.email()
v.uuid()
v.creditCard() // Luhn checksum validated
v.jwt()
v.cuid()
v.cuid2()
v.nanoid()
v.ulid()
v.ipv4()
v.ipv6()
v.iso.date()
v.iso.dateTime()
```

### Number Constraints

```typescript
v.number()
  .min(0)
  .max(100)
  .int()
  .positive()
  .negative()
  .nonnegative()
  .multipleOf(5)
  .finite()
  .safe();
```

### Objects & Collections

```typescript
// Objects
const profileSchema = v.object({
  username: v.string().min(3),
  age: v.number().optional(),
});

// Object transformations
profileSchema.partial();      // All fields optional
profileSchema.strict();       // Reject unknown fields
profileSchema.passthrough();  // Keep unknown fields
profileSchema.pick('username');
profileSchema.omit('age');
profileSchema.extend({ bio: v.string() });

// Arrays & Collections
v.array(v.string()).min(1).max(10);
v.tuple(v.string(), v.number());
v.record(v.string(), v.number());
v.set(v.string());
v.map(v.string(), v.number());
```

### Unions & Compositions

```typescript
// Union
v.union(v.string(), v.number());

// Discriminated Union
const eventSchema = v.discriminatedUnion('type',
  v.object({ type: v.literal('click'), x: v.number(), y: v.number() }),
  v.object({ type: v.literal('scroll'), offset: v.number() })
);

// Intersections & XOR
v.intersection(schemaA, schemaB);
v.xor(schemaA, schemaB);

// Recursive / Lazy Schemas
const treeSchema: ReturnType<typeof v.lazy> = v.lazy(() =>
  v.object({
    id: v.string(),
    children: v.array(treeSchema).optional(),
  })
);
```

---

## Type Coercion & Modifiers

### Automatic Coercion (`v.coerce`)

```typescript
v.coerce.string().parse(123);           // "123"
v.coerce.number().parse("42");          // 42
v.coerce.boolean().parse("true");       // true
v.coerce.bigint().parse("1000");        // 1000n
v.coerce.date().parse("2026-08-17");    // Date object
```

### Refinements, Transforms & Defaults

```typescript
const customSchema = v.string()
  .transform(val => val.trim())
  .refine(val => val.length >= 3, 'Must be at least 3 characters')
  .default('default_value')
  .catch('fallback_on_error');

// SuperRefine for multi-field cross validation
const passwordSchema = v.object({
  password: v.string().min(8),
  confirm: v.string(),
}).superRefine((data, ctx) => {
  if (data.password !== data.confirm) {
    ctx.addIssue({
      code: 'custom',
      path: ['confirm'],
      message: 'Passwords do not match',
    });
  }
});
```

---

## Tree-Shakeable Mini API

For bundle-constrained applications, `@oxog/vld/mini` provides pure standalone functions with zero extra overhead:

```typescript
import { string, number, object, optional, array } from '@oxog/vld/mini';

const userSchema = object({
  name: string().min(2),
  age: optional(number().positive()),
  roles: array(string()),
});
```

---

## Drop-in Zod Compatibility

VLD provides drop-in subpaths that mirror Zod export structures and error shapes:

```typescript
// Replace Zod imports seamlessly
import { z } from '@oxog/vld';
import * as core from '@oxog/vld/v4/core';
import * as mini from '@oxog/vld/v4-mini';
import * as locales from '@oxog/vld/v4/locales';

import { v, deepPartial, input, output } from '@oxog/vld';
```

- Structured error issues with `expected`, `received`, `minimum`, `maximum`, and `path`.
- Compatibility tested against latest stable Zod releases.

---

## Error Handling & Formatting

```typescript
import { v, VldError, treeifyError, prettifyError, flattenError } from '@oxog/vld';

const result = userSchema.safeParse(invalidData);

if (!result.success) {
  const error = result.error as VldError;

  // Flattened field errors for forms
  const { fieldErrors, formErrors } = flattenError(error);

  // Human-readable CLI / console output
  const pretty = prettifyError(error);

  // Nested tree structure for UI inspection
  const tree = treeifyError(error);
}
```

---

## Internationalization (i18n)

VLD includes built-in translations for 27+ languages:

```typescript
import { v, setLocale } from '@oxog/vld';

setLocale('tr'); // Turkish error messages
setLocale('es'); // Spanish
setLocale('de'); // German
setLocale('ja'); // Japanese
setLocale('fr'); // French
```

### Lazy Loading for Minimal Bundles

```typescript
import { setLocaleAsync, preloadLocales } from '@oxog/vld/locales/lazy';

// Loads locale on demand via dynamic import()
await setLocaleAsync('tr');

// Preload for SSR / warm start
await preloadLocales(['en', 'de', 'ja']);
```

---

## Bidirectional Codecs

```typescript
import { stringToNumber, jsonCodec, base64ToBytes, hexToBytes } from '@oxog/vld';

// String to Number decode & encode
const num = stringToNumber.parse('42');     // 42
const str = stringToNumber.encode(42);       // "42"

// JSON codec
const json = jsonCodec();
const parsed = json.parse('{"id":1}');
const encoded = json.encode(parsed);

// Binary conversions
const bytes = base64ToBytes.parse('SGVsbG8=');
```

---

## Result Pattern

Functional error handling without exceptions:

```typescript
import { Ok, Err, match, map, flatMap, tryCatch, isOk, isErr, unwrapOr } from '@oxog/vld';

const result = tryCatch(() => JSON.parse(rawInput));

const output = match(result, {
  ok: data => `Success: ${data.id}`,
  err: err => `Failed: ${err.message}`,
});
```

---

## Plugin System

```typescript
import { definePlugin, usePlugin, createVldKernel, v } from '@oxog/vld';

const phonePlugin = definePlugin({
  name: 'phone-validator',
  version: '1.0.0',
  validators: {
    phone: () => v.string().regex(/^\+?[1-9]\d{1,14}$/),
  },
});

usePlugin(phonePlugin);
```

---

## Performance

VLD is optimized for modern V8 runtimes. CI gates enforce performance floors on every commit against Zod:

| Benchmark Case | VLD Throughput | Relative Speedup |
|----------------|----------------|------------------|
| Nullish Parse | ~214M ops/sec | **30.7x faster** |
| Number / Positive Int | ~253M ops/sec | **9.1x faster** |
| Discriminated Union | ~35M ops/sec | **4.1x faster** |
| Optional Parse | ~213M ops/sec | **3.8x faster** |
| Union Parse | ~39M ops/sec | **3.3x faster** |
| Simple String | ~620M ops/sec | **3.0x faster** |
| Array / Object Parse | ~49M ops/sec | **1.7x faster** |

Explore full benchmark results and interactive visual comparisons at [vld.oxog.dev/benchmark](https://vld.oxog.dev/benchmark).

### Running Benchmarks Locally

```bash
npm run benchmark
npm run benchmark:guard
npm run benchmark:memory
npm run benchmark:startup
npm run release:check
```

---

## Contributing

Contributions are warmly welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md) for details.

---

## Links

- **Documentation & Playground**: [https://vld.oxog.dev](https://vld.oxog.dev)
- **NPM Package**: [https://www.npmjs.com/package/@oxog/vld](https://www.npmjs.com/package/@oxog/vld)
- **GitHub Repository**: [https://github.com/ersinkoc/vld](https://github.com/ersinkoc/vld)

---

Made with ❤️ by [Ersin KOC](https://github.com/ersinkoc)
