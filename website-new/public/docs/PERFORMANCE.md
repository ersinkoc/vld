# VLD Performance Guide (v3.0.0)

Comprehensive guide to understanding and optimizing VLD's performance in your applications. VLD 3.0 is a true drop-in replacement for Zod 4.5.4 — 3.00x geomean on the honest head-to-head (10/10 wins, semantic-checked). V2 method-memoization is opt-in via `vV2` or `v.setV2Mode(true)` and contributes to the same 3.00x geomean; 1.6-10x smaller per instance.

## Table of Contents

- [Performance Overview](#performance-overview)
- [V2 vs V1 vs Zod 4.5 — Headline Numbers](#v2-vs-v1-vs-zod-45--headline-numbers)
- [Benchmark Results](#benchmark-results)
- [V2 Method-Memoization Internals](#v2-method-memoization-internals)
- [Optimization Techniques](#optimization-techniques)
- [Real-World Patterns](#real-world-patterns)
- [Memory Management](#memory-management)
- [Bundle Size](#bundle-size)
- [Running Benchmarks](#running-benchmarks)

## Performance Overview

VLD 3.0 is built from the ground up with performance as a primary goal. The release gate compares VLD against Zod 4.5.4 across runtime throughput, startup behavior, retained heap, packaging, installability, type declarations, and real app drop-in behavior.

### Key Performance Features

- **V2 Method-Memoization**: Single-def + check classes, no per-chain array growth
- **Zero Dependencies**: No external packages means smaller bundle and faster startup
- **Optimized Algorithms**: Hand-tuned for V8's JIT compiler
- **Immutable Validators**: Prevents memory leaks and improves caching
- **Minimal Allocations**: Reduces garbage collection pressure
- **Fast-Path Optimizations**: Common cases are optimized for speed
- **Lazy Stack Capture**: `VLD_CAPTURE_STACK=true` opt-in for debug stack traces
- **Release Guards**: `npm run release:check` blocks releases that fall below runtime, startup, memory, docs, exports, package, install, type, security, Zod parity, and drop-in app thresholds

## V2 vs V1 vs Zod 4.5 — Headline Numbers

### Runtime (1M `safeParse` operations, pre-built schemas)

| Schema | v.* (V1) | vV2 | Zod 4.5 | V2 vs Zod |
|---|---:|---:|---:|---:|
| `string().min(1).email()` | 22ms | **22ms** | 50ms | 2.3x faster |
| `number().int().positive().min(1)` | 12ms | **6ms** | 39ms | **6.5x faster** |
| `object({a:str, b:num})` | 12ms | **11ms** | 18ms | 1.6x faster |
| Realistic API (10 fields) | 276ms | **243ms** | 767ms | **3.2x faster** |

*1M `safeParse` operations, pre-built schemas, Node v24.13.0. Lower is better.*

### Memory (N=100k, 3-pass GC)

| Schema | v.* (V1) | vV2 | Zod 4.5 | V2 vs Zod |
|---|---:|---:|---:|---:|
| `string().email()` | 704 B/instance | **400 B/instance** | 4210 B/instance | ~10x smaller |
| Realistic API 10 fields | 7354 B/instance | **4980 B/instance** | ~50 KB/instance | ~10x smaller |

*Per-instance retained heap, lower is better.*

### Test Coverage

- **104 test suites, 3031/3031 tests pass** (no regressions vs v2.4.0)
- **22/22 real-world Zod pattern test** (discriminated union, lazy, preprocess, pipe, brand, pick/omit, merge, extend, catch, default, transform, refine, etc.)
- **28/28 Zod 4.5 parity test** (`import { v as z }` is a drop-in)

## Benchmark Results

### Release-Gated Snapshot

| Guard | v3.0 Snapshot | Release Threshold |
|-------|------------------|-------------------|
| Runtime throughput (drop-in) | **3.00x faster than Zod 4.5.4** (10/10 wins, semantic-checked) | Must stay faster |
| Memory (V2) | **1.6-10x less than Zod 4.5** | Must stay below |
| Startup | **1.5x+ faster** | >= 1.10x |
| 3031 unit tests | **PASS** | No regressions |
| 22/22 real-world Zod test | **PASS** | All must pass |
| Bundle size | **53.0 KiB minified root** | Release-gated |

### Memory Usage vs Zod 4.5

| Metric | vV2 | v.* (V1) | Zod 4.5 | Improvement (V2) |
|--------|-----|----------|---------|------------------|
| `string().email()` per instance | 400 B | 704 B | 4210 B | **10x smaller** |
| Realistic API per instance | 4980 B | 7354 B | ~50 KB | **10x smaller** |
| Composite wins | 30-40% over V1 | baseline | 3-10x more | **30-40%** |

### Startup Performance

| Metric | Improvement |
|--------|-------------|
| Library Import | **1.32x faster than Zod 4.5** |
| Total Startup | **1.55x faster** |
| Warm Parse | **2.90x faster** |

## V2 Method-Memoization Internals

### How V2 works

Zod 4.5 introduced "method memoization" — the chain methods (`.min()`, `.email()`, etc.) return a *new* schema that contains a *copy* of the parent's checks array plus the new check. VLD's V2 pattern does the same but ships the optimization in every chain-heavy validator:

```typescript
// V1 (legacy)
class VldString extends VldBase {
  parse(value) {
    if (typeof value !== 'string') throw new VldError('invalid_type');
    for (const check of this._checks) {
      if (!check.fn(value)) throw new VldError(check.message);
    }
    return value;
  }
}

// V2 (method-memoization)
class VldStringV2 extends VldBase {
  parse(value) {
    if (typeof value !== 'string') {
      const issue = new VldIssue('invalid_type', this.__def.origin, value);
      throw new VldError([issue]);
    }
    // Check classes return Issue | null (no per-call payload allocation)
    for (const check of this.__def.checks) {
      const issue = check.run(value);
      if (issue) throw new VldError([issue]);
    }
    return value;
  }
}
```

### V2 hot path optimizations

1. **Check classes return `Issue | null`**: No per-call `{value, issues}` payload allocation
2. **`isSimple` precomputed in `__def`**: V2 hot path checks `def.isSimple` (boolean field) instead of `def.checks.length === 0 && def.transforms.length === 0` (two array length reads)
3. **Lazy stack capture**: `Error.captureStackTrace` skipped by default; set `VLD_CAPTURE_STACK=true` for debug stack traces
4. **No per-chain array growth**: V2's `__def` is a frozen object built once per chain

### V1 vs V2 design tradeoff

Composites (`VldObject`, `VldArray`, `VldUnion`) stay in V1 form because they have 10 unique internal arrays (no duplicated data to collapse) — a `VldObjectV2` wrapper would have 2+10=12 own properties, worse than legacy. Mixing V2 children under a V1 object is fully supported via the `isSimple` / `parseKnown*` fast-path integration.

## Optimization Techniques

### 1. Schema Reuse

**Do:** Create schemas once and reuse them

```javascript
// Good - Create once
const userSchema = vV2.object({
  name: vV2.string(),
  email: vV2.string().email()
});

function validateUser(data) {
  return userSchema.parse(data);
}
```

**Don't:** Create schemas in loops or functions

```javascript
// Bad - Creates new schema each time
function validateUser(data) {
  const schema = vV2.object({
    name: vV2.string(),
    email: vV2.string().email()
  });
  return schema.parse(data);
}
```

### 2. Use SafeParse for Error Handling

**Do:** Use `safeParse` to avoid exception overhead

```javascript
const result = schema.safeParse(data);
if (result.success) {
  process(result.data);
} else {
  handleError(result.error);
}
```

### 3. Use V2 for Hot Paths (v3.0 new)

```javascript
import { vV2 } from '@oxog/vld';

// part of the 3.00x drop-in geomean
const hotPathSchema = vV2.string().min(1).email();
```

### 4. Use v.setV2Mode(true) for Existing Code (v3.0 new)

```javascript
import { v } from '@oxog/vld';

v.setV2Mode(true);
// No source rewrites — every v.* call is now V2
const existing = v.object({ name: v.string(), email: v.string().email() });
v.setV2Mode(false); // Back to V1
```

### 5. Optimize Union Types

**Do:** Put most common types first

```javascript
const idSchema = v.union(
  v.string(),   // Most common
  v.number(),   // Less common
  v.bigint()    // Rare
);
```

### 6. Use Coercion Wisely

**Do:** Use coercion for predictable conversions

```javascript
const formSchema = vV2.object({
  age: vV2.coerce.number(),
  acceptTerms: vV2.coerce.boolean()
});
```

## Real-World Patterns

### High-Performance API Validation (v3.0 — V2)

```javascript
import { vV2, toZodError } from '@oxog/vld';

const schemas = {
  user: vV2.object({
    id: vV2.string().uuid(),
    name: vV2.string().min(1).max(100),
    email: vV2.string().email()
  }),
  product: vV2.object({
    id: vV2.string().uuid(),
    name: vV2.string(),
    price: vV2.number().positive(),
    stock: vV2.number().nonnegative().int()
  })
};

function validateBody(schemaName) {
  const schema = schemas[schemaName];
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (result.success) {
      req.validatedBody = result.data;
      next();
    } else {
      res.status(400).json({ error: toZodError(result.error).flatten() });
    }
  };
}

app.post('/api/users', validateBody('user'), createUser);
app.post('/api/products', validateBody('product'), createProduct);
```

### Batch Validation (v3.0 — V2 children)

```javascript
import { vV2 } from '@oxog/vld';

function validateBatch(items, schema) {
  const results = { valid: [], invalid: [] };
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

const userSchema = vV2.object({
  name: vV2.string(),
  email: vV2.string().email()
});

const results = validateBatch(userDataArray, userSchema);
```

## Memory Management

### V2 memory layout

V2 validators use a single frozen `__def` object that holds all checks, transforms, and a precomputed `isSimple` boolean. This eliminates per-chain array growth and lets V8 inline the parse hot path.

```typescript
const email = vV2.string().min(1).email();
// email.__def = {
//   origin: 'string',
//   checks: [
//     { kind: 'min', run: fn },  // returns Issue | null
//     { kind: 'email', run: fn }
//   ],
//   transforms: [],
//   isSimple: false,  // precomputed
//   ...
// }
// __def is frozen — no per-chain allocation
```

### Avoiding Memory Leaks

```javascript
// Good - Immutable validators prevent leaks
const baseSchema = vV2.string();
const emailSchema = baseSchema.email(); // Creates new instance
// baseSchema is unchanged and can be GC'd if not referenced
```

### Large Dataset Validation

```javascript
async function validateLargeDataset(filepath, schema, chunkSize = 1000) {
  const results = [];
  const chunks = [];
  for await (const item of readFileStream(filepath)) {
    chunks.push(item);
    if (chunks.length >= chunkSize) {
      const validated = chunks
        .map(item => schema.safeParse(item))
        .filter(r => r.success)
        .map(r => r.data);
      results.push(...validated);
      chunks.length = 0;
    }
  }
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

| Library | Minified | Dependencies |
|---------|----------|--------------|
| VLD root string bundle | 53.0 KiB | 0 |
| VLD mini string bundle | 52.9 KiB | 0 |
| VLD V2 root string bundle | 51.2 KiB | 0 |
| Zod 4 | external baseline | 0 |
| Yup | 145 KB | 15 deps |
| Joi | 218 KB | 12 deps |

The release gate checks bundle output and package size on every release. The v3.0.0 package check produced a 295 KiB tarball with 1,674 KiB unpacked size and 299 files.

### Tree Shaking

VLD is fully tree-shakeable. Import only what you need:

```javascript
import { string, number, object } from '@oxog/vld/validators';
// Only these validators are included in bundle
const schema = object({
  name: string(),
  age: number()
});
```

### V2 Tree Shaking

V2 validators are exported from `@oxog/vld` as opt-in. Bundlers tree-shake unused V2 classes automatically:

```javascript
// Only VldStringV2 is included if you only use vV2.string()
import { vV2 } from '@oxog/vld';
const schema = vV2.string().email();
```

## Running Benchmarks

### Quick Benchmark

```bash
npm run benchmark
```

### V2 vs V1 vs Zod 4.5 (v3.0 new)

```bash
npm run benchmark:full
# Runs benchmarks/performance.cjs — full suite including V2 scenarios
```

### Memory Benchmark

```bash
npm run benchmark:memory
```

### Startup Benchmark

```bash
npm run benchmark:startup
```

### Release Gate

```bash
npm run release:check
```

This runs linting, TypeScript checks, the full Jest suite (3031 tests), build, ASCII/docs/export/bundle/type/package/install/security verification, Zod parity checks (28/28), real app drop-in verification, and runtime/startup/memory performance guards.

## Performance Tips Summary (v3.0)

1. **Reuse schemas** — Create once, use many times
2. **Use safeParse** — Avoid exception overhead
3. **Use vV2 for hot paths** — part of the 3.00x drop-in geomean vs Zod 4.5.4
4. **Use v.setV2Mode(true)** — One-line global V2 swap
5. **Optimize unions** — Most common types first
6. **Flatten structures** — Avoid deep nesting
7. **Coerce wisely** — Only when input types vary
8. **Batch operations** — Process multiple items efficiently
9. **Monitor memory** — Use chunks for large datasets
10. **Tree shake** — Import only needed validators (V2 is opt-in)

---

VLD 3.0 is built for speed. Follow these guidelines to get maximum performance from your validation layer! ⚡
