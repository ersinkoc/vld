# VLD Performance Guide

Comprehensive guide to understanding and optimizing VLD's performance in your applications (v2.1.0).

## Table of Contents

- [Performance Overview](#performance-overview)
- [Benchmark Results](#benchmark-results)
- [Optimization Techniques](#optimization-techniques)
- [Real-World Patterns](#real-world-patterns)
- [Memory Management](#memory-management)
- [Bundle Size](#bundle-size)
- [Running Benchmarks](#running-benchmarks)

## Performance Overview

VLD is built from the ground up with performance as a primary goal. The v2.1.0 release gate compares VLD against Zod 4.4.3 across runtime throughput, startup behavior, retained heap, packaging, installability, type declarations, and real app drop-in behavior.

### Key Performance Features

- **Zero Dependencies**: No external packages means smaller bundle and faster startup
- **Optimized Algorithms**: Hand-tuned for V8's JIT compiler
- **Immutable Validators**: Prevents memory leaks and improves caching
- **Minimal Allocations**: Reduces garbage collection pressure
- **Fast-Path Optimizations**: Common cases are optimized for speed
- **Release Guards**: `npm run release:check` blocks releases that fall below runtime, startup, memory, docs, exports, package, install, type, security, Zod parity, and drop-in app thresholds

## Benchmark Results

### Release-Gated Snapshot

The latest v2.1.0 release check measured VLD against Zod 4.4.3 with focused CI-friendly guards:

| Guard | v2.1.0 Snapshot | Release Threshold |
|-------|------------------|-------------------|
| Runtime throughput | **11.67x faster average** | Must stay faster than Zod |
| Import startup | **1.32x faster** | >= 1.10x |
| Total startup | **1.55x faster** | >= 1.25x |
| Warm parse startup | **2.90x faster** | >= 1.25x |
| Retained heap | **4.76x less heap** | Must stay below Zod |
| Aggregate memory speed | **3.13x faster** | Must stay faster than Zod |

Release checks also verify 239 Zod exports against 339 VLD exports across root and subpath entry points, then run a real TypeScript fixture against both packages.

### Memory Usage

VLD uses significantly less memory than Zod:

| Metric | VLD | Zod | Improvement |
|--------|-----|-----|-------------|
| Retained Heap | Baseline | 4.76x higher | **4.76x less retained heap** |
| Aggregate Memory Guard | Baseline | 3.13x slower | **3.13x faster aggregate memory behavior** |

### Startup Performance

| Metric | Improvement |
|--------|-------------|
| Library Import | **1.32x faster** |
| Total Startup | **1.55x faster** |
| Warm Parse | **2.90x faster** |

## Optimization Techniques

### 1. Schema Reuse

**Do:** Create schemas once and reuse them

```javascript
// Good - Create once
const userSchema = v.object({
  name: v.string(),
  email: v.string().email()
});

function validateUser(data) {
  return userSchema.parse(data);
}
```

**Don't:** Create schemas in loops or functions

```javascript
// Bad - Creates new schema each time
function validateUser(data) {
  const schema = v.object({
    name: v.string(),
    email: v.string().email()
  });
  return schema.parse(data);
}
```

### 2. Use SafeParse for Error Handling

**Do:** Use `safeParse` to avoid exception overhead

```javascript
// Good - No try-catch overhead
const result = schema.safeParse(data);
if (result.success) {
  process(result.data);
} else {
  handleError(result.error);
}
```

**Don't:** Use try-catch when errors are expected

```javascript
// Bad - Exception handling is expensive
try {
  const data = schema.parse(input);
  process(data);
} catch (error) {
  handleError(error);
}
```

### 3. Optimize Union Types

**Do:** Put most common types first

```javascript
// Good - String is most common
const idSchema = v.union(
  v.string(),      // Most common
  v.number(),      // Less common
  v.bigint()       // Rare
);
```

**Don't:** Put rare types first

```javascript
// Bad - Bigint is rarely used
const idSchema = v.union(
  v.bigint(),      // Rare
  v.number(),      // Less common
  v.string()       // Most common
);
```

### 4. Avoid Deep Nesting

**Do:** Flatten schemas when possible

```javascript
// Good - Flatter structure
const userSchema = v.object({
  id: v.string(),
  name: v.string(),
  email: v.string(),
  street: v.string(),
  city: v.string(),
  country: v.string()
});
```

**Don't:** Create unnecessary nesting

```javascript
// Bad - Deep nesting adds overhead
const userSchema = v.object({
  id: v.string(),
  info: v.object({
    personal: v.object({
      name: v.string(),
      email: v.string()
    }),
    address: v.object({
      street: v.string(),
      city: v.string(),
      country: v.string()
    })
  })
});
```

### 5. Use Coercion Wisely

**Do:** Use coercion for predictable conversions

```javascript
// Good - Form data often comes as strings
const formSchema = v.object({
  age: v.coerce.number(),
  acceptTerms: v.coerce.boolean()
});
```

**Don't:** Use coercion unnecessarily

```javascript
// Bad - Data is already correct type
const apiSchema = v.object({
  // API already sends numbers
  id: v.coerce.number(), // Unnecessary
  // API already sends booleans
  active: v.coerce.boolean() // Unnecessary
});
```

## Real-World Patterns

### High-Performance API Validation

```javascript
// Cache schemas globally
const schemas = {
  user: v.object({
    id: v.string().uuid(),
    name: v.string().min(1).max(100),
    email: v.string().email()
  }),
  
  product: v.object({
    id: v.string().uuid(),
    name: v.string(),
    price: v.number().positive(),
    stock: v.number().nonnegative().int()
  })
};

// Fast validation middleware
function validateBody(schemaName) {
  const schema = schemas[schemaName];
  
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    
    if (result.success) {
      req.validatedBody = result.data;
      next();
    } else {
      res.status(400).json({ error: result.error });
    }
  };
}

// Usage
app.post('/api/users', validateBody('user'), createUser);
app.post('/api/products', validateBody('product'), createProduct);
```

### Batch Validation

```javascript
// Efficient batch validation
function validateBatch(items, schema) {
  const results = {
    valid: [],
    invalid: []
  };
  
  for (const item of items) {
    const result = schema.safeParse(item);
    if (result.success) {
      results.valid.push(result.data);
    } else {
      results.invalid.push({ item, error: result.error });
    }
  }
  
  return results;
}

// Usage
const userSchema = v.object({
  name: v.string(),
  email: v.string().email()
});

const results = validateBatch(userDataArray, userSchema);
console.log(`Valid: ${results.valid.length}, Invalid: ${results.invalid.length}`);
```

### Streaming Validation

```javascript
// Validate streaming data efficiently
async function* validateStream(stream, schema) {
  for await (const chunk of stream) {
    const result = schema.safeParse(chunk);
    if (result.success) {
      yield result.data;
    }
    // Skip invalid data or handle as needed
  }
}

// Usage
const dataStream = getDataStream();
const validatedStream = validateStream(dataStream, schema);

for await (const validData of validatedStream) {
  await processData(validData);
}
```

## Memory Management

### Schema Lifecycle

```javascript
// Good - Long-lived schemas
class UserService {
  // Schema created once
  private schema = v.object({
    name: v.string(),
    email: v.string().email()
  });
  
  validate(data: unknown) {
    return this.schema.parse(data);
  }
}
```

### Avoiding Memory Leaks

```javascript
// Good - Immutable validators prevent leaks
const baseSchema = v.string();
const emailSchema = baseSchema.email(); // Creates new instance
// baseSchema is unchanged and can be GC'd if not referenced
```

### Large Dataset Validation

```javascript
// Process large datasets in chunks to manage memory
async function validateLargeDataset(filepath, schema, chunkSize = 1000) {
  const results = [];
  const chunks = [];
  
  for await (const item of readFileStream(filepath)) {
    chunks.push(item);
    
    if (chunks.length >= chunkSize) {
      // Process chunk
      const validated = chunks
        .map(item => schema.safeParse(item))
        .filter(r => r.success)
        .map(r => r.data);
      
      results.push(...validated);
      chunks.length = 0; // Clear chunk
    }
  }
  
  // Process remaining
  if (chunks.length > 0) {
    const validated = chunks
      .map(item => schema.safeParse(item))
      .filter(r => r.success)
      .map(r => r.data);
    results.push(...validated);
  }
  
  return results;
}
```

## Bundle Size

VLD has zero dependencies, resulting in smaller bundle sizes:

### Size Comparison

| Library | Minified | Gzipped | Dependencies |
|---------|----------|---------|--------------|
| VLD root string bundle | 53.0 KiB | release-gated | 0 |
| VLD mini string bundle | 52.9 KiB | release-gated | 0 |
| Zod 4 | varies by import path | external baseline | 0 |
| Yup | 145 KB | 42 KB | 15 |
| Joi | 218 KB | 61 KB | 12 |

The release gate checks bundle output and package size on every release. The v2.1.0 package check produced a 295.0 KiB tarball with 1,674.1 KiB unpacked size and 299 files.

### Tree Shaking

VLD is fully tree-shakeable. Import only what you need:

```javascript
// Import specific validators
import { string, number, object } from '@oxog/vld/validators';

// Only these validators are included in bundle
const schema = object({
  name: string(),
  age: number()
});
```

## Running Benchmarks

### Quick Benchmark

```bash
npm run benchmark
```

Use this for local exploratory benchmarking. Release decisions should rely on the guarded scripts below because they enforce thresholds and compare against the installed latest stable Zod.

### Memory Benchmark

```bash
npm run benchmark:memory
```

### Startup Benchmark

```bash
npm run benchmark:startup
```

### Full Benchmark Suite

```bash
npm run benchmark:all
```

### Release Gate

```bash
npm run release:check
```

This runs linting, TypeScript checks, the full Jest suite, build, ASCII/docs/export/bundle/type/package/install/security verification, Zod parity checks, real app drop-in verification, and runtime/startup/memory performance guards.

## Performance Tips Summary

1. **Reuse schemas** - Create once, use many times
2. **Use safeParse** - Avoid exception overhead
3. **Optimize unions** - Most common types first
4. **Flatten structures** - Avoid deep nesting
5. **Coerce wisely** - Only when input types vary
6. **Batch operations** - Process multiple items efficiently
7. **Monitor memory** - Use chunks for large datasets
8. **Tree shake** - Import only needed validators

---

VLD is built for speed. Follow these guidelines to get maximum performance from your validation layer! ⚡
