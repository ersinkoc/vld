# VLD - Ultra-Fast TypeScript Validation Library

[![NPM Version](https://img.shields.io/npm/v/@oxog/vld.svg)](https://www.npmjs.com/package/@oxog/vld) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/) [![Zero Dependencies](https://img.shields.io/badge/Dependencies-0-green.svg)](package.json) [![Test Coverage](https://img.shields.io/badge/Coverage-100%25-brightgreen.svg)](package.json) [![Website](https://img.shields.io/badge/Website-vld.oxog.dev-6366f1.svg)](https://vld.oxog.dev)

**Website & Live Playground**: [https://vld.oxog.dev](https://vld.oxog.dev)

---

## Highlights

- **Release-Gated Speed**: CI-enforced performance floors against Zod on every commit - ~5x average guarded ratio, up to 18x on individual scenarios, with ~1.5x less retained heap.
- **Zero Dependencies**: Pure TypeScript/JavaScript with zero third-party runtime bloat.
- **Drop-in Zod Compatibility**: Swap imports directly or use subpaths (`@oxog/vld/v4`, `@oxog/vld/mini`, `@oxog/vld/v4/core`, `@oxog/vld/v4/locales`). Ecosystem duck-typing included: `@hookform/resolvers`' `zodResolver` works with vld schemas unchanged, verified in CI against the real npm packages.
- **CSP-Safe Everywhere**: `new Function` blocked (edge runtimes, MV3 extensions, strict CSP)? `.validate()` automatically falls back from AOT compilation to an interpreter walker that calls the runtime parser's own check closures - rejection allocates nothing (~12M ops/s vs ~0.05M for runtime `safeParse`).
- **LLM Structured-Output Tooling**: `toRetryMessage()` turns a failed parse into the exact string to send back to a model (enum vocabularies named verbatim - the measured difference between 0/30 and 30/30 recovery), and `describeSchema()` derives the first-attempt prompt constraints from the schema itself.
- **Full Static Inference**: Automatic type extraction using `v.infer<typeof schema>`.
- **Tree-Shakeable Mini API**: Build hyper-optimized bundles with `@oxog/vld/mini` - a root `import { NEVER }` tree-shakes to 68.5 KB under esbuild (zod measures 88 KB on the same probe).
- **Built-in i18n**: Out-of-the-box error localization for 68 languages - every zod locale code, with lazy-loading support (`@oxog/vld/locales/lazy`).
- **Result Pattern & Codecs**: Functional error handling (`tryCatch`, `match`, `Ok`, `Err`) and bidirectional data transformations.
- **100% Test Coverage**: Verified across 3500+ tests, 68 locale catalogs, and drop-in TypeScript application suites.

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
- `ZodError` parity: `error.message` is Zod's pretty-printed JSON issue list, `name`/`constructor.name` report `ZodError`.
- Zod v4 core introspection on every schema (`_zod.def/traits/version/bag`), so ecosystem libraries that duck-type zod schemas work unchanged - `@hookform/resolvers`' `zodResolver` is verified end to end in CI against the real npm packages.
- Compatibility tested against latest stable Zod releases (`npm run verify:zod` checks every public export - 259 as of zod 4.6.7).

---

## CSP-Safe Validation

`v.compile()` AOT-compiles a schema into a flat validator via `new Function`. In environments where that is blocked - edge runtimes, Manifest V3 extensions, strict CSP headers - vld degrades automatically through a three-step ladder:

```text
.validate() call
  1. AOT compiled validator   (new Function - fastest, ~43M ops/s on invalid input)
  2. interpreter walker        (plain JS - CSP-safe, ~12M ops/s on invalid input)
  3. runtime safeParse         (always correct, ~0.05M ops/s - allocates issues)
```

The interpreter walker walks the schema graph and calls the runtime parser's **own check closures**, so its verdicts cannot diverge from `safeParse` by construction; schemas it cannot interpret (strict objects, `unique()`, transforms, refinements, pipes, records) are handed to the runtime parser rather than guessed at.

```typescript
import { v } from '@oxog/vld';

// Explicit opt-out of JIT (e.g. a locked-down edge runtime):
const schema = v.compile(v.object({ id: v.string().uuid(), n: v.number() }), { JITless: true });

schema.validate({ id: '123e4567-e89b-12d3-a456-426614174000', n: 1 }); // true - walker path
schema.parse({ id: '123e4567-e89b-12d3-a456-426614174000', n: 1 });    // runtime parse (output semantics unchanged)
```

No configuration is needed for the automatic path: when `new Function` throws `EvalError`, `v.compile()` installs the walker for `.validate()` while `parse`/`safeParse` keep the runtime parser (the walker cannot prove output identity for defaults and key stripping).

---

## LLM Structured-Output Tooling

Two functions designed around a measurement (ata-validator's retry-message experiment), not a preference: conventional error text recovers constraints a model can infer from context, and never recovers constraints it cannot - an internal vocabulary above all. A model that reads "must be equal to one of the allowed values" for an enum guesses; it guesses plausibly ("HH" for Hamburg) and is always wrong.

### `toRetryMessage()` - the retry string

```typescript
import { v, toRetryMessage } from '@oxog/vld';

const schema = v.object({
  office: v.enum(['HAM', 'LYO']),
  amount: v.number().multipleOf(0.01),
  note: v.string().min(2),
});

const input = { office: 'HH', amount: 10.333, note: 'x' };
const result = schema.safeParse(input);

if (!result.success) {
  // One line per issue: where it failed, what was expected, what arrived.
  const retry = toRetryMessage(result, { input });
  // /office: must be one of "HAM", "LYO", got "HH"
  // /amount: Number must be a multiple of 0.01, got 10.333
  // /note: String must be at least 2 characters, got "x"
}
```

Enum values are named verbatim; the received value is recovered by walking each issue's path into the original input (pass it as `{ input }` - vld issues stay allocation-free); container values are suppressed (a model can see its own output, and a serialized object is the most expensive thing that can go into a prompt); `multipleOf(0.01)` is phrased as "rounded to 2 decimal places" because a model acts on that wording where it does not reliably act on the math. Capped at 20 issues by default (`{ limit }`).

### `describeSchema()` - the first-attempt prompt

```typescript
import { describeSchema } from '@oxog/vld';

describeSchema(schema);
// /office: one of "HAM", "LYO"
// /amount: number, rounded to 2 decimal places
// /note: string, at least 2 characters
```

Derived from the schema, so the description and the enforcement cannot drift - the measured difference between a careful hand-written description and the derived one was 0/30 vs 23/30 first-attempt validity, failing on exactly the fields whose values are an internal vocabulary.

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

VLD includes built-in translations for 68 languages (every locale code zod 4.6.7 ships, plus extras):

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

## V3 Migration Guide - V2 Method-Memoization Pattern

VLD 3.0 ships the **V2 pattern** (single-def + check classes) for every chain-heavy
validator. This matches Zod 4.5's "method memoization" optimization and is
**3.03x faster** than Zod 4.6.4 on the honest head-to-head at introduction
(10/10 wins, semantic-checked, see `benchmarks/dropin-vs-zod.cjs`; against
zod 4.6.7 the drop-in geomean is 2.56x) and **1.6-10x smaller** in memory.

### What changed

V3 adds V2 implementations of every leaf and composite validator, exposed as
opt-in factories. The legacy V1 (`v.*`) remains the default for backwards
compatibility.

| V1 (legacy, default) | V2 (opt-in, faster + smaller) |
|---|---|
| `v.string()` | `v.stringV2()` or `vV2.string` |
| `v.number()` | `v.numberV2()` or `vV2.number` |
| `v.boolean()` | `v.booleanV2()` or `vV2.boolean` |
| `v.date()` | `v.dateV2()` |
| `v.bigint()` | `v.bigintV2()` |
| `v.literal(x)` | `v.literalV2(x)` or `vV2.literal(x)` |
| `v.enum([...])` | `v.enumV2([...])` or `vV2.enum([...])` |
| `v.array(item)` | `v.arrayV2(item)` or `vV2.array(item)` |
| `v.union([...])` | `v.unionV2(...)` or `vV2.union(...)` |
| `v.record(v)` | `v.recordV2(v)` or `vV2.record(v)` |
| `v.string().optional()` | `v.optionalV2(v.stringV2())` |
| `v.string().nullable()` | `v.nullableV2(v.stringV2())` |
| `v.coerce.string()` | `v.coerce.stringV2()` |
| `v.refine(s, fn)` | `v.refineV2(s, fn)` |
| `v.transform(s, fn)` | `v.transformV2(s, fn)` |

### Migration paths

**Option 1 - Drop-in via `vV2` (recommended for new code):**

```ts
// Old (still works, V1):
import { v } from '@oxog/vld';
const schema = v.object({ email: v.string().email() });

// New (V3, drop-in):
import { vV2 as v } from '@oxog/vld';   // just change the import
const schema = v.object({ email: v.string().email() });
// All v.* calls now return V2 internally. v.object() composes them transparently.
```

**Option 2 - Global V2 toggle (for existing codebases):**

```ts
import { v } from '@oxog/vld';

// Switch all v.* factories to V2 once at app start
v.setV2Mode(true);

const s = v.string().email();   // now returns VldStringV2
```

**Option 3 - Selective V2 (keep V1 by default, opt in where it matters):**

```ts
import { v } from '@oxog/vld';

// Keep V1 for simple schemas
const s1 = v.boolean();

// Use V2 for the hot path
const s2 = v.stringV2().min(1).email();   // V2
const s3 = v.arrayV2(v.stringV2());       // V2
const s4 = v.object({ a: v.numberV2().int() });   // mixed - V2 child, V1 object
```

### Performance impact (V2 vs V1, same machine, 1M `safeParse` ops)

| Schema | V1 (2.4.0) | V2 (3.0) | Zod 4.5 | V2 vs Zod |
|---|---:|---:|---:|---:|
| `string().min(1).email()` | 22ms | 22ms | 50ms | **2.3x faster** |
| `number().int().positive().min(1)` | 12ms | 6ms | 39ms | **6.5x faster** |
| `object({a:str, b:num})` | 12ms | 11ms | 18ms | **1.6x faster** |
| Realistic API (10 fields) | 276ms | 243ms | 767ms | **3.2x faster** |

### API compatibility

- **28/28 Zod 4.5 parity tests pass.** `import { vV2 as z }` is a drop-in for Zod 4.5.
- **Zod 4.6 parity is verified per-release** (`npm run verify:zod` checks every public
  `zod@4.6` export - 259 as of 4.6.7) and `tests/zod-4-6-parity.test.ts` compares behavior against the installed zod.
- V1 is the default; existing code works unchanged.
- V2 validators can be children of V1 composites and vice-versa (mixed schemas work).

### Zod 4.6 support

| Zod 4.6 API | VLD | Notes |
|---|---|---|
| `schema.validate(data)` | yes | Boolean check, no result object; lazily AOT-compiles on first call - **2.8-33x faster than `zod.validate()`** (`node benchmarks/validate-vs-zod.cjs`) |
| `schema.validateAsync(data)` | yes | Async refinements supported |
| `z.iban()` | yes | ISO 7064 MOD 97-10 checksum in code, pattern inlined for JSON Schema |
| `z.instanceof(Cls).properties({...})` | yes | Validates instance fields in place; the prototype survives parsing |
| `z.withParser(schema, parser)` | yes | Install an externally generated parser (`v.INVALID` hands back to the runtime) - for pre-compiled or native validators; CSP environments are covered automatically by the interpreter walker (see CSP-Safe Validation above) |
| `fromJSONSchema` new keywords | yes | `minProperties`, `maxProperties`, `uniqueItems`, `contains`, `minContains`, `maxContains` |
| `z.emoji()` component rejection | yes | 4.6 regex byte-for-byte; keycaps and flags stay valid |
| `z.regexes.currencyCode` / `anyString` / `iban` | yes | Full 4.6 regex namespace |
| `tg` locale | yes | Tajik messages |

### Internal V2 pattern (for contributors)

Each V2 class follows this shape:
- A single `__def: Object` field on the instance (the only data).
- Chain methods create a new `__def` via `withDef({...})` - no per-instance field shadowing.
- Constraints are class instances (`VldCheckMin`, `VldCheckEmail`, ...) with a `check(value): Issue | null` method - no per-call payload allocation.
- `isSimple` is precomputed in `__def` for the parse hot path.

The pattern is exactly Zod 4.5's "method memoization via prototype getters" but
without the `inst[k] = proto[k].bind(inst)` trick (which costs a bound function
per method per instance). VLD's V2 trades that for a single shared `__def` reference
plus a precomputed `isSimple` boolean.

### Upgrading from V2.x

VLD 3.0 is a **non-breaking** major bump:
- `v.*` factories still return V1 by default (no existing user code changes).
- New `v.*V2` and `vV2` factories are pure additions.
- Performance is identical to V2.x for code that doesn't opt in.
- All 2633 existing tests pass; 41 new V2 tests added.

To start using V2 today, just import `vV2` instead of `v`:
```ts
import { vV2 as v } from '@oxog/vld';
```

---## Bidirectional Codecs

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

VLD is optimized for modern V8 runtimes. CI gates enforce performance floors on every commit against the installed zod (`npm run benchmark:guard:built`); the ratios below are a representative run against zod 4.6.7:

| Benchmark Case (guarded) | VLD Throughput | vs Zod 4.6.7 |
|----------------|----------------|------------------|
| Nullish Parse | ~250M ops/sec | **18x faster** |
| Number / Positive Int | ~235M ops/sec | **10.6x faster** |
| Optional Parse | ~240M ops/sec | **6.4x faster** |
| Union (string \| number) | ~34M ops/sec | **3.1x faster** |
| Simple String | ~230M ops/sec | **2.1x faster** |
| Array of Numbers | ~52M ops/sec | **2.0x faster** |
| Simple Object | ~52M ops/sec | **1.7x faster** |
| Discriminated Union | ~33M ops/sec | **1.6x faster** |

Average guarded ratio ~5x across releases; memory guard shows ~1.5x less retained heap and the `validate()` head-to-head wins every scenario (up to 35x). Bundle-wise, a root `import { NEVER }` tree-shakes to 68.5 KB under esbuild (zod: 88 KB on the same probe).

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

Made with Love by [Ersin KOC](https://github.com/ersinkoc)
