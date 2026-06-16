# Migrating from Zod to VLD

A complete guide for migrating your codebase from Zod to VLD with minimal changes, Zod-compatible package subpaths, and release-gated parity checks.

**VLD v2.1.0 targets drop-in replacement workflows for Zod 4.4.3 root and subpath imports while keeping plugin system, CLI tools, i18n, codecs, and event system support.**

## Table of Contents

- [Why Migrate?](#why-migrate)
- [Quick Migration](#quick-migration)
- [API Compatibility](#api-compatibility)
- [Zod 4 Package Subpaths](#zod-4-package-subpaths)
- [Zod 4 API Parity](#zod-4-api-parity)
- [Breaking Changes](#breaking-changes)
- [Migration Strategies](#migration-strategies)
- [Common Patterns](#common-patterns)
- [Performance Improvements](#performance-improvements)
- [Troubleshooting](#troubleshooting)

## Why Migrate?

### Performance Benefits

- **11x+ guarded runtime speedup** in the v2.1.0 release check snapshot
- **4.7x+ less retained heap** in the v2.1.0 memory guard snapshot
- **1.5x+ total startup speedup** in the v2.1.0 startup guard snapshot
- **Zero dependencies** for smaller bundle size

### Additional Features

- **Built-in i18n**: 27+ languages supported out of the box
- **Better error formatting**: Tree, pretty, and flatten utilities
- **Immutable validators**: Prevent memory leaks
- **100% statement, branch, and line coverage**: Battle-tested with 2160 passing tests
- **Plugin system**: Extend VLD with custom validators
- **CLI tools**: Command-line validation and benchmarking
- **Event system**: Validation lifecycle hooks
- **Result pattern**: Functional error handling
- **Real app drop-in verification**: A TypeScript fixture is compiled and run once with `zod` and once with built VLD

## Quick Migration

### Step 1: Install VLD

```bash
npm install @oxog/vld
npm uninstall zod
```

### Step 2: Update Imports

```javascript
// Before (Zod)
import { z } from 'zod';

// After (VLD)
import { v } from '@oxog/vld';
```

### Step 3: Replace z with v

```javascript
// Before (Zod)
const schema = z.string().email();

// After (VLD)
const schema = v.string().email();
```

That's it for root imports. VLD also provides Zod-compatible package subpaths for projects that import Zod 4 entry points directly.

## Zod 4 Package Subpaths

For applications that import Zod subpaths, replace the package name and keep the entry point shape:

```javascript
// Before (Zod)
import { z } from 'zod';
import * as v4 from 'zod/v4';
import * as mini from 'zod/v4-mini';
import * as core from 'zod/v4/core';
import * as locales from 'zod/v4/locales';

// After (VLD)
import { z } from '@oxog/vld';
import * as v4 from '@oxog/vld/v4';
import * as mini from '@oxog/vld/v4-mini';
import * as core from '@oxog/vld/v4/core';
import * as locales from '@oxog/vld/v4/locales';
```

Release checks compare export names and `typeof` values for `zod/v4`, `zod/v4-mini`, `zod/v4/mini`, `zod/v4/core`, and `zod/v4/locales` against the installed latest Zod. `npm run verify:drop-in` also compiles and runs the same TypeScript app against both real `zod` and the local built `@oxog/vld` package.

## API Compatibility

### Identical APIs

These APIs work exactly the same in both libraries:

```javascript
// Primitives
v.string()          // z.string()
v.number()          // z.number()
v.boolean()         // z.boolean()
v.date()            // z.date()
v.bigint()          // z.bigint()
v.symbol()          // z.symbol()
v.undefined()       // z.undefined()
v.null()            // z.null()
v.void()            // z.void()
v.any()             // z.any()
v.unknown()         // z.unknown()
v.never()           // z.never()

// String validators
.min(n)             // Same
.max(n)             // Same
.length(n)          // Same
.email()            // Same
.url()              // Same
.uuid()             // Same
.regex(pattern)     // Same
.includes(str)      // Same
.startsWith(str)    // Same
.endsWith(str)      // Same
.trim()             // Same
.toLowerCase()      // Same
.toUpperCase()      // Same

// Number validators
.positive()         // Same
.negative()         // Same
.nonnegative()      // Same
.nonpositive()      // Same
.int()              // Same
.finite()           // Same
.safe()             // Same
.multipleOf(n)      // Same

// Modifiers
.optional()         // Same
.nullable()         // Same
.nullish()          // Same
.default(value)     // Same
.catch(fallback)    // Same

// Methods
.parse(data)        // Same
.safeParse(data)    // Same
.refine(fn, msg)    // Same
.transform(fn)      // Same
```

## Zod 4 API Parity

VLD v2.1.0 keeps expanding compatibility with Zod 4 APIs:

### Discriminated Union (Now Supported!)

```javascript
// Zod 4
const schema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("a"), value: z.string() }),
  z.object({ type: z.literal("b"), value: z.number() })
]);

// VLD
const schema = v.discriminatedUnion("type", [
  v.object({ type: v.literal("a"), value: v.string() }),
  v.object({ type: v.literal("b"), value: v.number() })
]);
```

### Zod 4-Compatible Validators and Helpers

```javascript
// Integer shortcuts
v.int()                  // z.number().int()
v.int32()                // 32-bit integer range

// Object variants
v.strictObject({ ... })  // z.strictObject()
v.looseObject({ ... })   // z.looseObject()

// Record variants
v.partialRecord(schema)  // z.partialRecord()
v.looseRecord(schema)    // z.looseRecord()

// XOR validator
v.xor(schemaA, schemaB)  // Exactly one must match

// String format validators
v.email()                // z.email()
v.uuid()                 // z.uuid()
v.ipv4()                 // z.ipv4()
v.ipv6()                 // z.ipv6()
v.base64()               // z.base64()
v.jwt()                  // z.jwt()
v.emoji()                // z.emoji()
v.nanoid()               // z.nanoid()
v.cuid()                 // z.cuid()
v.cuid2()                // z.cuid2()
v.ulid()                 // z.ulid()

// ISO formats
v.iso.date()             // z.iso.date()
v.iso.time()             // z.iso.time()
v.iso.dateTime()         // z.iso.dateTime()
v.iso.duration()         // z.iso.duration()

// Binary validators
v.base64Bytes()          // Base64 to Uint8Array
v.hexBytes()             // Hex to Uint8Array
v.uint8Array()           // Uint8Array validator

// Other new validators
v.nan()                  // NaN type
v.json()                 // JSON string parser
v.file()                 // File upload validation
v.function()             // Function validator
v.custom()               // Custom validator factory
v.stringbool()           // String to boolean
v.templateLiteral()      // Template literal patterns
v.NEVER                  // Never constant for transforms
```

## Breaking Changes

### 1. Union Syntax

```javascript
// Zod
const schema = z.union([z.string(), z.number()]);

// VLD supports Zod-style array syntax
const schema = v.union([v.string(), v.number()]);
```

**Note:** Discriminated unions support the same array option shape used by Zod 4.

### 2. Type Inference

```javascript
// Zod
type User = z.infer<typeof userSchema>;

// VLD
import { Infer } from '@oxog/vld';
type User = Infer<typeof userSchema>;
```

### 3. Error Class Name

```javascript
// Zod
import { ZodError } from 'zod';

// VLD
import { VldError } from '@oxog/vld';
```

## Migration Strategies

### Strategy 1: Global Find & Replace

For simple projects, use your IDE's find & replace:

1. Replace `from 'zod'` with `from '@oxog/vld'`
2. Replace `from "zod"` with `from "@oxog/vld"`
3. Replace `z.` with `v.`
4. Replace `ZodError` with `VldError`
5. Replace `z.infer` with `Infer`

### Strategy 2: Gradual Migration

For large projects, migrate file by file:

```javascript
// Create a compatibility layer
// lib/validation.js
export { v as z } from '@oxog/vld';
export { Infer as infer } from '@oxog/vld';
export { VldError as ZodError } from '@oxog/vld';

// Use in your files
import { z, infer, ZodError } from './lib/validation';
```

### Strategy 3: Automated Script

Create a migration script:

```javascript
// migrate-to-vld.js
const fs = require('fs');
const path = require('path');
const glob = require('glob');

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Update imports
  content = content.replace(/from ['"]zod['"]/g, 'from "@oxog/vld"');
  content = content.replace(/import \{ z \}/g, 'import { v }');
  content = content.replace(/import \{ z,/g, 'import { v,');
  
  // Update usage
  content = content.replace(/\bz\./g, 'v.');
  content = content.replace(/\bZodError\b/g, 'VldError');
  content = content.replace(/\bz\.infer</g, 'Infer<');
  
  // Fix unions
  content = content.replace(/v\.union\(\[([^\]]+)\]\)/g, 'v.union($1)');
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ Migrated: ${filePath}`);
}

// Run migration
glob('src/**/*.{js,ts,jsx,tsx}', (err, files) => {
  files.forEach(migrateFile);
  console.log(`\n🎉 Migration complete! Migrated ${files.length} files.`);
});
```

## Common Patterns

### Form Validation

```javascript
// Zod
const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

// VLD (identical)
const formSchema = v.object({
  email: v.string().email(),
  password: v.string().min(8),
  confirmPassword: v.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});
```

### API Validation

```javascript
// Zod
const apiSchema = z.object({
  body: z.object({
    name: z.string(),
    age: z.number()
  }),
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(10)
  })
});

// VLD (identical)
const apiSchema = v.object({
  body: v.object({
    name: v.string(),
    age: v.number()
  }),
  query: v.object({
    page: v.coerce.number().default(1),
    limit: v.coerce.number().default(10)
  })
});
```

### Environment Variables

```javascript
// Zod
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  PORT: z.coerce.number().positive(),
  DATABASE_URL: z.string().url()
});

// VLD (identical)
const envSchema = v.object({
  NODE_ENV: v.enum("development", "production", "test"),
  PORT: v.coerce.number().positive(),
  DATABASE_URL: v.string().url()
});
```

## Performance Improvements

After migrating to VLD, you can expect:

### Parsing Performance

```javascript
// Benchmark results
const schema = v.object({
  name: v.string(),
  email: v.string().email(),
  age: v.number().positive()
});

// v2.1.0 release guard snapshot:
// Runtime throughput: 11.67x faster than Zod 4.4.3
// Total startup: 1.55x faster
// Warm parse startup: 2.90x faster
```

### Memory Usage

```javascript
// v2.1.0 memory guard snapshot:
// VLD retained heap: 4.76x lower than Zod 4.4.3
```

### Startup Time

```javascript
// v2.1.0 startup guard snapshot:
// Import startup: 1.32x faster than Zod 4.4.3
```

## Troubleshooting

### Issue: Union Types Not Working

```javascript
// Problem (Zod syntax)
v.union([v.string(), v.number()]) // Error!

// Solution (VLD syntax)
v.union(v.string(), v.number()) // Correct
```

### Issue: Type Inference Errors

```javascript
// Problem
type User = v.infer<typeof schema>; // Error!

// Solution
import { Infer } from '@oxog/vld';
type User = Infer<typeof schema>; // Correct
```

### Issue: Discriminated Union

**This is now fully supported in VLD v1.4.0!**

```javascript
// Now works directly in VLD
const schema = v.discriminatedUnion("type",
  v.object({ type: v.literal("a"), value: v.string() }),
  v.object({ type: v.literal("b"), value: v.number() })
);
```

### Issue: Custom Error Messages

```javascript
// Both libraries support custom messages the same way
const schema = v.string().min(5, "Must be at least 5 characters");

// Or with i18n in VLD
import { setLocale } from '@oxog/vld';
setLocale('es'); // Spanish error messages
```

## Migration Checklist

- [ ] Install VLD package
- [ ] Uninstall Zod package
- [ ] Update all imports
- [ ] Replace `z` with `v`
- [ ] Fix union syntax
- [ ] Update type inference
- [ ] Replace error class names
- [ ] Run tests
- [ ] Check bundle size reduction
- [ ] Benchmark performance improvements

## Need Help?

- Check the [API Reference](./api.md) for detailed documentation
- Review [Advanced Features](./ADVANCED_FEATURES.md) for VLD-specific features
- See [Getting Started](./GETTING_STARTED.md) for basic usage

---

Welcome to the VLD community! Enjoy the performance boost! 🚀
