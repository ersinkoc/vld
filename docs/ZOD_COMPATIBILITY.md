# Zod compatibility policy (v3.0.0)

Last audited: 2026-09-01 against Zod 4.5.4 (`latest` on npm); 28/28 Zod 4.5 parity test pass, 22/22 real-world Zod pattern test pass.

VLD 3.0 is a **drop-in replacement for Zod 4.5**. The release gate checks the exact npm `latest` version, all public package subpaths, root, subpath, and nested namespace exports, a compiled drop-in application, and a behavior suite covering the latest upstream fixes. A scheduled canary lane installs npm's current `canary` tag without changing the lockfile so upcoming surface changes are visible before they become stable.

## v3.0 highlights

- **V2 method-memoization**: 21 V2 classes shipped, matching Zod 4.5's "method memoization" optimization and beating it on both throughput (2-6x faster) and memory (1.6-10x smaller)
- **ZodError compatibility layer**: `toZodError()` / `ZodLikeError` / `toZodSafeResult()` for ZodError-shaped errors with `.format()` and `.flatten()`
- **vV2 drop-in factory**: `import { vV2 as v } from '@oxog/vld'` for one-line V2 swap
- **v.setV2Mode(true)** global toggle: no source rewrites needed
- **z alias**: `import { v as z } from '@oxog/vld'` keeps the z.* style
- **95 test suites, 2704/2704 tests pass**, **22/22 real-world Zod test**, **28/28 Zod 4.5 parity test**

## Current compatibility baseline

| Area | Contract |
| --- | --- |
| Package paths | `zod`, `zod/mini`, `zod/locales`, `zod/v3`, `zod/v4`, `zod/v4-mini`, `zod/v4/mini`, `zod/v4/core`, and `zod/v4/locales` have VLD equivalents. |
| Modern factories | Array-based `union`, `tuple`, `xor`, `discriminatedUnion`, `enum`, multi-value `literal`, two-schema `record`, and empty `object()` calls are supported. VLD's older rest-argument forms remain available as extensions. |
| String formats | `regexes` mirrors Zod's nested public namespace, UUID versions v1-v8 are supported, URL protocol/hostname filters and normalization use WHATWG `URL`, and `iso.datetime()`/precision/offset/local options are available. |
| Direction API | Every schema exposes `decode`, `encode`, safe variants, async variants, and `spa`; codecs override the backward direction with their inverse transform. Object, array, and tuple schemas recursively encode nested codecs. |
| V2 method-memoization (v3.0) | `vV2.*` and `v.*V2()` ship the Zod 4.5 method-memoization pattern, beating it on valid path (2-6x) and memory (1.6-10x). Use `v.setV2Mode(true)` for a global swap. |
| ZodError adapter (v3.0) | `toZodError()` returns a `ZodLikeError` with `.name === 'ZodError'`, `.issues`, `.format()`, `.flatten()`. `toZodSafeResult()` wraps a `safeParse` result in one call. |
| Defaults | Constant arrays, objects, maps, and sets are shallow-cloned per parse. Factory defaults and direct `.prefault(value)` follow Zod 4 behavior. |
| Records | Key schemas run and may transform keys; non-enumerable and unsafe prototype keys are skipped; invalid keys use the `invalid_key` issue code. |
| JSON Schema | Draft 2020-12 is the default, stripped objects emit `additionalProperties: false`, and unrepresentable schemas throw by default. `{ unrepresentable: "any" }` matches Zod; `{ unrepresentable: "vld" }` enables VLD's richer Map, Set, Date, and BigInt extensions. |
| Composition | Schema instances expose `array`, `or`, `and`, `nonoptional`, `overwrite`, and `toJSONSchema`; tuples support current rest-schema construction and `.rest()`. |
| JSON Schema input | `fromJSONSchema()` accepts boolean schemas, normalizes inputs through JSON, rejects cyclic/BigInt input, and can write discovered metadata to a supplied registry. |
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

The bundle gate also compares equivalent tree-shaken root-string probes. The current VLD V2 probe is 51.2 KiB versus Zod 4.5.4 at 119.6 KiB; `@oxog/vld/mini` remains 52.9 KiB.

## Performance (v3.0 vs Zod 4.5.4)

| Schema | VLD vV2 | Zod 4.5 | V2 vs Zod |
|---|---:|---:|---:|
| `string().min(1).email()` | 22ms | 50ms | **2.3x faster** |
| `number().int().positive().min(1)` | 6ms | 39ms | **6.5x faster** |
| `object({a:str, b:num})` | 11ms | 18ms | **1.6x faster** |
| Realistic API (10 fields) | 243ms | 767ms | **3.2x faster** |

*1M `safeParse` ops, pre-built schemas, Node v24.13.0.*

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

## Test results (v3.0.0)

- **95 test suites, 2704/2704 tests pass** (no regressions vs v2.4.0)
- **22/22 real-world Zod pattern test** (discriminated union, lazy, preprocess, pipe, brand, pick/omit, merge, extend, catch, default, transform, refine, etc.)
- **28/28 Zod 4.5 parity test** (`import { v as z }` is a drop-in)
- **253/253 Zod public exports** have a VLD equivalent across root, `./mini`, `./v4`, `./v4-mini`, `./v4/core`, `./v4/locales`, `./compile`, and nested namespace entry points
- **339 VLD exports** across all entry points

## Upstream sources

- [Zod releases](https://github.com/colinhacks/zod/releases)
- [Zod API](https://zod.dev/api)
- [Zod codecs](https://zod.dev/codecs)
- [Zod JSON Schema](https://zod.dev/json-schema)
- [Zod 4 migration guide](https://zod.dev/v4/changelog)
