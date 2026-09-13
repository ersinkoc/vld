# Zod compatibility policy

Last audited: 2026-09-13 against Zod 4.6.4 (`latest` on npm); **259/259 public Zod exports covered**, 29-case Zod 4.6 differential suite passes, 109 test suites / 3113 tests pass.

VLD 3.0.5 is a **drop-in replacement for Zod 4.6** (and remains a drop-in for 4.5). The release gate checks the exact npm `latest` version, all public package subpaths, root, subpath, and nested namespace exports, a compiled drop-in application, and a behavior suite covering the latest upstream fixes. A scheduled canary lane installs npm's current `canary` tag without changing the lockfile so upcoming surface changes are visible before they become stable.

## v3.0.5 highlights — Zod 4.6 parity

- **`.validate()` / `.validateAsync()` on every schema**: boolean validation with no result objects, short-circuiting on the first failed check. Three-tier fast path: explicitly compiled validator -> lazily AOT-compiled (memoized on first call, CSP-safe) -> bound runtime parser. Up to **35x faster than `zod.validate()`** (`npm run benchmark:validate`).
- **`z.iban()`**: electronic IBAN with the ISO 7064 MOD 97-10 checksum (no BigInt), byte-compatible accept/reject set with Zod 4.6.
- **`z.instanceof(Cls).properties(shape)`**: validates class-instance fields in place; the prototype survives parsing.
- **`z.withParser(schema, parser)`**: install an externally generated parser (`INVALID` hands back to the runtime) - the CSP-friendly escape hatch.
- **`fromJSONSchema` gained the 4.6 keywords**: `minProperties`, `maxProperties` (counted on the raw input like Zod), `uniqueItems`, `contains`, `minContains`, `maxContains`; `minItems`/`maxItems` now bind plain arrays too.
- **Behavior parity**: `emoji` rejects component-only strings (official 4.6 regex); full 4.6 regex namespace (`currencyCode`, `anyString`, `iban`); `tg` (Tajik) locale.
- **Compiler correctness fixes**: AOT lowering no longer skips email/url/uuid format checks, respects regex flags, refuses transform/strict/passthrough/catchall/unique schemas instead of mis-validating them, and models array bounds.

### Known intentional differences

| Area | VLD | Zod 4.6 | Why |
| --- | --- | --- | --- |
| `z.string().email()` | Fast simplified pattern - accepts more inputs (unicode locals, `a..b@c.de`) | RFC-oriented pattern | VLD's speed identity; rejects nothing Zod accepts |
| `'~standard'` issues | `[{ message }]` | `[{ code, path, expected, message }]` | Consumers reading only `.message` are unaffected |

## v3.0 highlights

- **V2 method-memoization**: 21 V2 classes shipped, matching Zod 4.5's "method memoization" optimization. Honest head-to-head on `benchmarks/dropin-vs-zod.cjs` shows 3.03x geomean vs Zod 4.6.4 (10/10 wins, semantic-checked); 1.6-10x smaller per instance.
- **ZodError compatibility layer**: `toZodError()` / `ZodLikeError` / `toZodSafeResult()` for ZodError-shaped errors with `.format()` and `.flatten()`
- **vV2 drop-in factory**: `import { vV2 as v } from '@oxog/vld'` for one-line V2 swap
- **v.setV2Mode(true)** global toggle: no source rewrites needed
- **z alias**: `import { v as z } from '@oxog/vld'` keeps the z.* style
- **109 test suites, 3113/3113 tests pass**, **22/22 real-world Zod test**, **29/29 Zod 4.6 differential test**

## Current compatibility baseline

| Area | Contract |
| --- | --- |
| Package paths | `zod`, `zod/mini`, `zod/locales`, `zod/v3`, `zod/v4`, `zod/v4-mini`, `zod/v4/mini`, `zod/v4/core`, and `zod/v4/locales` have VLD equivalents. |
| Modern factories | Array-based `union`, `tuple`, `xor`, `discriminatedUnion`, `enum`, multi-value `literal`, two-schema `record`, and empty `object()` calls are supported. VLD's older rest-argument forms remain available as extensions. |
| String formats | `regexes` mirrors Zod's nested public namespace, UUID versions v1-v8 are supported, URL protocol/hostname filters and normalization use WHATWG `URL`, and `iso.datetime()`/precision/offset/local options are available. |
| Direction API | Every schema exposes `decode`, `encode`, safe variants, async variants, and `spa`; codecs override the backward direction with their inverse transform. Object, array, and tuple schemas recursively encode nested codecs. |
| V2 method-memoization (v3.0) | `vV2.*` and `v.*V2()` ship the Zod 4.5 method-memoization pattern. Part of the 3.00x drop-in geomean vs Zod 4.5.4; 1.6-10x smaller per instance. Use `v.setV2Mode(true)` for a global swap. |
| ZodError adapter (v3.0) | `toZodError()` returns a `ZodLikeError` with `.name === 'ZodError'`, `.issues`, `.format()`, `.flatten()`. `toZodSafeResult()` wraps a `safeParse` result in one call. |
| Defaults | Constant arrays, objects, maps, and sets are shallow-cloned per parse. Factory defaults and direct `.prefault(value)` follow Zod 4 behavior. |
| Records | Key schemas run and may transform keys; non-enumerable and unsafe prototype keys are skipped; invalid keys use the `invalid_key` issue code. |
| JSON Schema | Draft 2020-12 is the default, stripped objects emit `additionalProperties: false`, and unrepresentable schemas throw by default. `{ unrepresentable: "any" }` matches Zod; `{ unrepresentable: "vld" }` enables VLD's richer Map, Set, Date, and BigInt extensions. |
| Composition | Schema instances expose `array`, `or`, `and`, `nonoptional`, `overwrite`, and `toJSONSchema`; tuples support current rest-schema construction and `.rest()`. |
| JSON Schema input | `fromJSONSchema()` accepts boolean schemas, normalizes inputs through JSON, rejects cyclic/BigInt input, and can write discovered metadata to a supplied registry. Zod 4.6 keywords `minProperties`, `maxProperties`, `uniqueItems`, `contains`, `minContains`, `maxContains` are enforced; `minItems`/`maxItems` bind plain arrays. |
| Boolean validation (v3.0.5) | Every schema exposes `.validate(data)` / `.validateAsync(data)` matching Zod 4.6, with a lazily AOT-compiled fast path and `z.withParser()` for externally generated parsers. |
| Module config | Global configuration is shared through `globalThis`, including mixed CJS/ESM use in one process. |
| Release fixes | The differential gate covers absent-key `catch`/`preprocess`, transformed record keys, cloned Map/Set defaults, empty XOR construction, multi-literals, prefaults, and schema direction methods. |
| Error issue structure | VLD produces Zod 4-compatible `VldIssue` objects: `invalid_type` with `expected`/`received`, `too_small`/`too_big` with `minimum`/`maximum`/`origin`/`inclusive`, `invalid_format` with `format`/`origin`/`pattern`, `invalid_value` with `values` array. `parse()` throws `VldError` (not plain `Error`). `v.number()` rejects `Infinity`/`-Infinity`/`NaN` by default like Zod 4. |

## VLD capabilities beyond the compatibility baseline

VLD keeps its zero-runtime-dependency architecture while adding:

- **V2 method-memoization** (v3.0 new): `vV2` drop-in factory, `v.setV2Mode(true)` global toggle, 21 V2 classes
- **ZodError compatibility** (v3.0 new): `toZodError()`, `ZodLikeError`, `toZodSafeResult()`
- Built-in bidirectional codec presets (19 codecs)
- 27+ locales with lazy loading
- Plugins and lifecycle hooks
- Typed Result API
- CLI tools
- XOR validation
- JSON parsing schemas
- Security hardening
- Release-gated runtime/startup/memory benchmarks

The bundle gate also compares equivalent tree-shaken root-string probes. The current VLD V2 probe is 51.2 KiB versus Zod 4.6.4 at 119.6 KiB; `@oxog/vld/mini` remains 52.9 KiB.

## Performance (v3.0.5 vs Zod 4.6.4)

| Schema | VLD vV2 | Zod 4.6.4 | V2 vs Zod |
|---|---:|---:|---:|
| `string().min(1).email()` | 25ms | 51ms | **2.0x faster** |
| `number().int().positive().min(1)` | 7ms | 74ms | **10.3x faster** |
| `object({a:str, b:num})` | 19ms | 43ms | **2.3x faster** |
| `array(string()).min(1).max(100)` | 32ms | 168ms | **5.2x faster** |
| `record(string())` | 72ms | 472ms | **6.5x faster** |
| `literal("active")` | 14ms | 40ms | **2.8x faster** |

*1M `safeParse` ops, pre-built schemas, Node v24.13.0. Geomean 3.03x, 10/10 wins.*

`.validate()` (boolean, no result object) versus Zod 4.6's own `.validate()`:

| Schema | Zod validate | VLD validate | VLD vs Zod |
|---|---:|---:|---:|
| `string().min(3).max(64).regex()` | 25ms | 9ms | **2.8x faster** |
| Wide object (12 fields) | 306ms | 11ms | **28x faster** |
| Nested object (3 levels) | 205ms | 21ms | **9.6x faster** |
| Array of 50 objects | 2357ms | 66ms | **35.5x faster** |
| Config object (defaults/optionals) | 95ms | 3ms | **27.6x faster** |
| `z.iban()` checksum | 87ms | 58ms | **1.5x faster** |

*500k ops, median of 15, `npm run benchmark:validate`.*

| Schema | VLD vV2 | Zod 4.5 | V2 vs Zod |
|---|---:|---:|---:|
| `string().email()` per instance | 400 B | 4210 B | **~10x smaller** |
| Realistic API 10 fields per instance | 4980 B | ~50 KB | **~10x smaller** |

*N=100k, 3-pass GC.*

## Verification

Run:

```bash
npm run build
npm run verify:zod
npm run verify:drop-in
npm test -- --runInBand

# Early warning only: install zod@canary without saving, then run
npm run verify:zod:canary
```

`verify:zod` fails unless the installed comparison version exactly matches npm `latest`, when a public path/root/subpath/nested export is missing or has the wrong runtime type, or when the differential behavior suite diverges. The scheduled `.github/workflows/zod-parity.yml` stable job is blocking; its canary job is an early-warning signal for maintainers to evaluate before promoting support.

## Test results (v3.0.5)

- **109 test suites, 3113/3113 tests pass** (no regressions)
- **22/22 real-world Zod pattern test** (discriminated union, lazy, preprocess, pipe, brand, pick/omit, merge, extend, catch, default, transform, refine, etc.)
- **29/29 Zod 4.6 differential test** (`tests/zod-4-6-parity.test.ts`, compared against the installed zod)
- **259/259 Zod public exports** have a VLD equivalent across root, `./mini`, `./v4`, `./v4-mini`, `./v4/core`, `./v4/locales`, `./compile`, and nested namespace entry points
- **366 VLD exports** across all entry points
- 15/15 drop-in application audit cases pass (`examples/dropin/audit.mjs`)

## Upstream sources

- [Zod releases](https://github.com/colinhacks/zod/releases)
- [Zod API](https://zod.dev/api)
- [Zod codecs](https://zod.dev/codecs)
- [Zod JSON Schema](https://zod.dev/json-schema)
- [Zod 4.6 announcement](https://zod.dev/blog/zod-4-6)
- [Zod 4 migration guide](https://zod.dev/v4/changelog)
