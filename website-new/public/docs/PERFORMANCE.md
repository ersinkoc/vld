# VLD Performance Guide

Comprehensive guide to understanding and optimizing VLD's performance in your applications (v1.5.0).

## Table of Contents

- [Performance Overview](#performance-overview)
- [Benchmark Results](#benchmark-results)
- [Optimization Techniques](#optimization-techniques)
- [Real-World Patterns](#real-world-patterns)
- [Memory Management](#memory-management)
- [Bundle Size](#bundle-size)
- [Running Benchmarks](#running-benchmarks)

## Performance Overview

VLD is built from the ground up with performance as a primary goal. Every line of code is optimized for the V8 JavaScript engine, resulting in validation that doesn't slow down your application.

### Key Performance Features

- **Zero Dependencies**: No external packages means smaller bundle and faster startup
- **Optimized Algorithms**: Hand-tuned for V8's JIT compiler
- **Immutable Validators**: Prevents memory leaks and improves caching
- **Minimal Allocations**: Reduces garbage collection pressure
- **Fast-Path Optimizations**: Common cases are optimized for speed

## Benchmark Results

### Overall Performance

VLD consistently outperforms Zod across all validation scenarios:

| Operation | VLD Performance | Zod Performance | Improvement |
|-----------|----------------|-----------------|-------------|
| Simple String | 73.0M ops/sec | 36.0M ops/sec | **2.03x faster** |
| Email Validation | 21.8M ops/sec | 6.7M ops/sec | **3.25x faster** |
| Number Validation | 36.3M ops/sec | 11.2M ops/sec | **3.23x faster** |
| Simple Object | 7.1M ops/sec | 6.9M ops/sec | **1.02x faster** |
| Complex Object | 1.9M ops/sec | 1.4M ops/sec | **1.34x faster** |
| Array Validation | 7.5M ops/sec | 5.6M ops/sec | **1.35x faster** |
| Union Types | 7.1M ops/sec | 5.5M ops/sec | **1.29x faster** |
| Optional Values | 36.1M ops/sec | 11.4M ops/sec | **3.16x faster** |
| SafeParse | 60.0M ops/sec | 22.0M ops/sec | **2.73x faster** |
| Type Coercion | 20.4M ops/sec | 20.2M ops/sec | **1.01x faster** |
| Enum Validation | 60.3M ops/sec | 28.9M ops/sec | **2.08x faster** |
| Discriminated Union | 3.6M ops/sec | 4.6M ops/sec | Zod 1.27x faster |

**VLD won 11/12 tests | Average: 1.98x faster than Zod**

### Memory Usage

VLD uses significantly less memory than Zod:

| Metric | VLD | Zod | Improvement |
|--------|-----|-----|-------------|
| Schema Creation | 2.1 MB | 98.5 MB | **98% less** |
| Data Parsing | 15.3 MB | 31.2 MB | **51% less** |
| Error Handling | 3.2 MB | 22.9 MB | **86% less** |
| Overall Average | 6.9 MB | 50.9 MB | **86% less** |

### Startup Performance

| Metric | VLD | Zod | Improvement |
|--------|-----|-----|-------------|
| Library Import | 12.3ms | 23.8ms | **1.94x faster** |
| First Schema | 0.15ms | 1.23ms | **8.22x faster** |
| First Validation | 0.21ms | 0.45ms | **2.14x faster** |
| Warmed Performance | 0.028ms | 0.051ms | **1.82x faster** |

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
| VLD | 45 KB | 13 KB | 0 |
| Zod 4 | 150 KB | 38 KB | 0 |
| Yup | 145 KB | 42 KB | 15 |
| Joi | 218 KB | 61 KB | 12 |

*Note: VLD size increased slightly in v1.5.0 due to plugin system, CLI tools, and event system features.*

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

Output:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    VLD vs Zod Performance Benchmark
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Simple String Validation
  VLD: 72,998,029 ops/sec
  Zod: 35,975,105 ops/sec
  VLD is 2.03x faster

2. Email Validation
  VLD: 21,826,913 ops/sec
  Zod: 6,720,611 ops/sec
  VLD is 3.25x faster

3. Number Validation
  VLD: 36,269,994 ops/sec
  Zod: 11,237,470 ops/sec
  VLD is 3.23x faster

...

SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  VLD won: 11/12 tests
  Zod won: 1/12 tests
  Average performance ratio: 1.98x
  ✅ VLD is faster overall!
```

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