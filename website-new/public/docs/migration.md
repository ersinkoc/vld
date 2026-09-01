# Migrating to VLD 3.0

A complete guide for migrating your codebase to VLD 3.0 with minimal changes, Zod-compatible package subpaths, and release-gated parity checks.

**VLD 3.0 is a non-breaking major bump.** Existing `v.*` factories stay V1 by default (backward compatible); use `vV2` or `v.setV2Mode(true)` for the V2 method-memoization path. **3.00x faster** vs Zod 4.5.4 on the honest head-to-head benchmark (`benchmarks/dropin-vs-zod.cjs`, 10/10 wins, semantic-checked).

## Table of Contents

- [Why Migrate?](#why-migrate)
- [Quick Migration](#quick-migration)
- [V2 vs V1 (v3.0 new)](#v2-vs-v1-v30-new)
- [API Compatibility](#api-compatibility)
- [Zod 4.5 Package Subpaths](#zod-45-package-subpaths)
- [Zod 4.5 API Parity](#zod-45-api-parity)
- [ZodError Compatibility (v3.0 new)](#zoderror-compatibility-v30-new)
- [Breaking Changes](#breaking-changes)
- [Migration Strategies](#migration-strategies)
- [Common Patterns](#common-patterns)
- [Performance Improvements](#performance-improvements)
- [Troubleshooting](#troubleshooting)

## Why Migrate?

### Performance Benefits (v3.0 — V2 method-memoization)

- **3.00x faster** than Zod 4.5.4 on the honest head-to-head (10/10 wins, semantic-checked, `benchmarks/dropin-vs-zod.cjs`)
- **1.6-10x less memory** than Zod 4.5 (per-instance retained heap)
- **6.5x faster** than Zod 4.5 on `number().int().positive().min(1)`
- **3.2x faster** than Zod 4.5 on a realistic 10-field API schema
- **Zero dependencies** for smaller bundle size
- **30-40% smaller** than VLD 2.x (V2 single-def layout)

### Additional Features (v3.0)

- **V2 method-memoization**: 21 V2 classes shipped, opt-in via `vV2` / `v.*V2()` / `v.setV2Mode(true)`
- **ZodError compatibility layer**: `toZodError()` / `ZodLikeError` / `toZodSafeResult()`
- **Built-in i18n**: 27+ languages supported out of the box
- **Better error formatting**: Tree, pretty, flatten, plus ZodError `.format()` / `.flatten()`
- **Immutable validators**: Prevent memory leaks
- **3031/3031 unit tests pass**, 22/22 real-world Zod test, 28/28 Zod 4.5 parity
- **100% statement, branch, function, and line coverage**
- **Plugin system**: Extend VLD with custom validators
- **CLI tools**: Command-line validation and benchmarking
- **Event system**: Validation lifecycle hooks
- **Result pattern**: Functional error handling
- **Real app drop-in verification**: A TypeScript fixture is compiled and run once with `zod` and once with built VLD

## Quick Migration

### From VLD 2.x to VLD 3.0 (non-breaking)

```bash
npm install @oxog/vld@latest
```

That's it. VLD 3.0 is fully backward compatible. Existing code keeps working unchanged.

To opt into the V2 method-memoization path, choose one:

```typescript
// Option A: vV2 drop-in (recommended for new code)
import { vV2 } from '@oxog/vld';
const schema = vV2.string().min(1).email();

// Option B: Global V2 toggle (no source rewrites)
import { v } from '@oxog/vld';
v.setV2Mode(true);
const schema = v.string().min(1).email(); // Now V2

// Option C: z alias
import { vV2 as z } from '@oxog/vld';
const schema = z.string().min(1).email();
```

### From Zod to VLD

```bash
npm install @oxog/vld
npm uninstall zod
```

```typescript
// Before (Zod)
import { z } from 'zod';

// After (VLD, equivalent)
import { v } from '@oxog/vld';
// Or: import { v as z } from '@oxog/vld';
```

```typescript
// Before (Zod)
const User = z.object({ name: z.string() });

// After (VLD)
const User = v.object({ name: v.string() });
```

That's it. VLD is a drop-in replacement for Zod 4.5. All public API surface, including `z.pipe`, `z.codec`, `z.preprocess`, `z.discriminatedUnion`, `z.brand`, `z.lazy`, and the Zod 4 issue structure, has VLD equivalents.

## V2 vs V1 (v3.0 new)

| | V1 (legacy, default) | V2 (opt-in, recommended) |
|---|---|---|
| Pattern | Per-chain array growth | Single-def + check classes |
| Memory per instance | 704 B (string.email) | 400 B (string.email) |
| Throughput | 22ms (string.email) | 22ms (string.email) |
| Composite support | Yes (VldObject/VldArray/VldUnion stay V1) | n/a — composites stay V1 |
| Read internal fields | Yes (config, _checks) | No (V2 uses `__def`) |

### When to use V1

- You read internal VldString/VldNumber fields (`config`, `_checks`)
- You depend on V1-only extension points
- You have wrappers that subclass V1 classes

### When to use V2

- New code, hot paths
- You want 3.00x drop-in speedup (or 1.6-10x less memory with V2)
- You don't read internal fields

### Mixing V1 and V2

Fully supported. V2 children under a V1 object work transparently via the `isSimple` / `parseKnown*` fast-path integration.

```typescript
import { v, vV2 } from '@oxog/vld';

const schema = v.object({            // V1 object
  name: vV2.string().min(1),         // V2 child
  email: vV2.string().email(),       // V2 child
  meta: v.record(v.any()).optional() // V1 child
});
```

## API Compatibility

VLD 3.0 is 100% backward compatible with VLD 2.4.x. All 3031 unit tests (including 2704 carried over from VLD 2.x) pass unchanged.

## Zod 4.5 Package Subpaths

VLD mirrors every Zod 4.5 subpath. Drop-in replacement is a one-line import change:

| Zod | VLD |
|---|---|
| `import { z } from 'zod'` | `import { v } from '@oxog/vld'` |
| `import { z } from 'zod/mini'` | `import * as mini from '@oxog/vld/v4-mini'` |
| `import { z } from 'zod/v4'` | `import * as v4 from '@oxog/vld/v4'` |
| `import { z } from 'zod/v4/core'` | `import * as core from '@oxog/vld/v4/core'` |
| `import { z } from 'zod/v4/locales'` | `import * as locales from '@oxog/vld/v4/locales'` |

## Zod 4.5 API Parity

VLD matches Zod 4.5's public API surface across:

- 28/28 Zod 4.5 parity test
- 22/22 real-world Zod pattern test (discriminated union, lazy, preprocess, pipe, brand, pick/omit, merge, extend, catch, default, transform, refine, etc.)
- 253/253 Zod public exports across root, `./mini`, `./v4`, `./v4-mini`, `./v4/core`, `./v4/locales`, `./compile`, and nested namespace entry points
- 339 VLD exports across all entry points

Notable Zod 4.5 features supported:
- `z.pipe(a, b)` (alias: `v.pipeline(a, b)`)
- `z.codec(input, output, { decode, encode })`
- `z.preprocess(fn, schema)`
- `z.discriminatedUnion('type', ...)`
- `z.lazy(() => schema)`
- `z.brand<'Name'>()`
- `z.templateLiteral(['a', z.string(), 'b'])`
- `z.file()`, `z.function()`, `z.promise()`
- `z.json()`, `z.base64()`, `z.hex()`, `z.uint8Array()`
- Modern factories: array-based `union`, `tuple`, `xor`, `enum`, multi-value `literal`, two-schema `record`, empty `object()`
- String formats: `regexes` namespace, UUID v1-v8, URL protocol/hostname filters, `iso.datetime()`/precision/offset/local
- Direction API: `decode`, `encode`, safe variants, async variants, `spa`
- Defaults: constant arrays/objects/Maps/Sets shallow-cloned; factory defaults and `.prefault(value)`
- Records: key schemas run and may transform keys; non-enumerable and unsafe prototype keys skipped
- JSON Schema: Draft 2020-12 default, stripped objects emit `additionalProperties: false`
- Composition: `array`, `or`, `and`, `nonoptional`, `overwrite`, `toJSONSchema`
- `fromJSONSchema()` accepts boolean schemas, normalizes inputs through JSON, rejects cyclic/BigInt input
- Error issue structure: `invalid_type` with `expected`/`received`, `too_small`/`too_big` with `minimum`/`maximum`/`origin`/`inclusive`, `invalid_format` with `format`/`origin`/`pattern`, `invalid_value` with `values` array
- `v.number()` rejects `Infinity`/`-Infinity`/`NaN` by default

## ZodError Compatibility (v3.0 new)

For codebases that need ZodError-shaped errors:

```typescript
import { v, toZodError, toZodSafeResult, ZodLikeError } from '@oxog/vld';

const result = v.object({ name: v.string().min(2) }).safeParse({ name: 'J' });

if (!result.success) {
  const zodErr = toZodError(result.error);
  // zodErr.name === 'ZodError'
  // zodErr.issues matches Zod 4.5 issue shape
  // zodErr.format() and zodErr.flatten() match Zod 4.5
  console.log(zodErr.flatten());
  // { formErrors: [], fieldErrors: { name: ['...'] } }
}

// One-liner safe result
const zodResult = toZodSafeResult(result);
// { success: false, error: ZodLikeError }
```

## Breaking Changes

**None.** VLD 3.0 is a non-breaking major bump:

- `v.*` factories still return V1 (legacy) by default
- All VLD 2.x tests pass unchanged (2704 carried over + 327 new V2 / drop-in tests)
- 22/22 real-world Zod test passes
- 28/28 Zod 4.5 parity test passes
- Zod 4.5 subpath exports are unchanged

V2 (`vV2`, `v.*V2()`) is opt-in. If you don't import V2, your code is byte-identical to VLD 2.4.x behavior.

## Migration Strategies

### Strategy 1: Zero-effort global swap

```typescript
// In a single init file (e.g. src/vld-init.ts)
import { v } from '@oxog/vld';
v.setV2Mode(true); // Every v.* call is now V2
```

No source changes. Every schema in your codebase automatically gets the V2 method-memoization path.

### Strategy 2: New code V2, existing code V1

```typescript
import { v, vV2 } from '@oxog/vld';

// Existing code — unchanged
const oldSchema = v.object({ name: v.string() });

// New code — opt into V2
const newSchema = vV2.object({ name: vV2.string() });
```

### Strategy 3: Full V2 rewrite

```typescript
import { vV2 as v } from '@oxog/vld';
// Replace every import { v } from '@oxog/vld' with import { vV2 as v }
// Surface is identical
```

## Common Patterns

### Drop-in Zod → VLD

```typescript
// Before
import { z } from 'zod';
const User = z.object({ name: z.string() });
const parsed = User.parse(data);
const safe = User.safeParse(data);

// After
import { v } from '@oxog/vld';
const User = v.object({ name: v.string() });
const parsed = User.parse(data);
const safe = User.safeParse(data);
// Identical behavior, 3.00x faster (drop-in geomean vs Zod 4.5.4)
```

### V2 drop-in for hot paths

```typescript
// Before (Zod)
import { z } from 'zod';
const emailSchema = z.string().email();

// After (VLD, V2 path)
import { vV2 } from '@oxog/vld';
const emailSchema = vV2.string().email();
// 2.3x faster than Zod 4.5
```

### V2 + ZodError compat

```typescript
// Before (Zod)
import { z } from 'zod';
const User = z.object({ name: z.string() });
const result = User.safeParse(data);
if (!result.success) {
  // result.error is a ZodError
  console.log(result.error.format());
}

// After (VLD with ZodError compat)
import { v, toZodError } from '@oxog/vld';
const User = v.object({ name: v.string() });
const result = User.safeParse(data);
if (!result.success) {
  const zodErr = toZodError(result.error);
  console.log(zodErr.format()); // ZodError-shaped
}
```

## Performance Improvements

VLD 3.0 vs Zod 4.5 (1M `safeParse` ops, pre-built schemas, Node v24.13.0):

| Schema | VLD vV2 | Zod 4.5 | Improvement |
|---|---:|---:|---:|
| `string().min(1).email()` | 22ms | 50ms | **2.3x faster** |
| `number().int().positive().min(1)` | 6ms | 39ms | **6.5x faster** |
| `object({a:str, b:num})` | 11ms | 18ms | **1.6x faster** |
| Realistic API (10 fields) | 243ms | 767ms | **3.2x faster** |

Memory (N=100k, 3-pass GC):

| Schema | VLD vV2 | Zod 4.5 | Improvement |
|---|---:|---:|---:|
| `string().email()` | 400 B/instance | 4210 B/instance | **~10x smaller** |
| Realistic API 10 fields | 4980 B/instance | ~50 KB/instance | **~10x smaller** |

## Troubleshooting

### "I read v.string().config and it changed in V2"

V2 uses a different internal layout. If your code reads `config` or `_checks` on a V1 validator, you must use `v.*` (V1) for that validator. Mixing V1 and V2 in the same schema is fine — only the validator you read internals on must stay V1.

```typescript
import { v } from '@oxog/vld';

// Don't switch this to vV2.string() if you read .config
const stringV1 = v.string().min(1).email();
console.log(stringV1.config); // works on V1

// This is V2 — different internal layout
const stringV2 = vV2.string().min(1).email();
// stringV2.config is undefined; use stringV2.__def instead
```

### "My V2 schema behaves differently from V1"

V2 hot path is functionally identical to V1. If you see a behavior difference, file an issue with a reproduction. 22/22 real-world Zod test and 3031/3031 unit tests pass on V2.

### "v.setV2Mode(true) broke my tests"

If your tests read internal V1 fields (`config`, `_checks`), V2 will fail those assertions. Either:
- Switch to V1: `v.setV2Mode(false)`
- Update your tests to read `__def` (V2) or use the public `safeParse` API

### "How do I migrate from VLD 1.x?"

VLD 1.x → 2.x migration was a non-breaking major. VLD 3.0 is also non-breaking. Just upgrade and you're done. See the v2 migration notes in older CHANGELOG entries if you need to walk through V1 → V2 internals.

---

Happy migrating! 🚀
