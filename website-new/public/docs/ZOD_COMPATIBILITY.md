# Zod compatibility policy

Last audited: 2026-07-29 against Zod 4.4.3 (`latest` on npm); early-warning baseline: `4.5.0-canary.20260504T180558`.

VLD treats Zod compatibility as a tested contract, not an export-count claim. The release gate checks the exact npm `latest` version, all public package subpaths, root, subpath, and nested namespace exports, a compiled drop-in application, and a behavior suite covering the latest upstream fixes. A scheduled canary lane installs npm's current `canary` tag without changing the lockfile so upcoming surface changes are visible before they become stable.

## Current compatibility baseline

| Area | Contract |
| --- | --- |
| Package paths | `zod`, `zod/mini`, `zod/locales`, `zod/v3`, `zod/v4`, `zod/v4-mini`, `zod/v4/mini`, `zod/v4/core`, and `zod/v4/locales` have VLD equivalents. |
| Modern factories | Array-based `union`, `tuple`, `xor`, `discriminatedUnion`, `enum`, multi-value `literal`, two-schema `record`, and empty `object()` calls are supported. VLD's older rest-argument forms remain available as extensions. |
| String formats | `regexes` mirrors Zod's nested public namespace, UUID versions v1-v8 are supported, URL protocol/hostname filters and normalization use WHATWG `URL`, and `iso.datetime()`/precision/offset/local options are available. |
| Direction API | Every schema exposes `decode`, `encode`, safe variants, async variants, and `spa`; codecs override the backward direction with their inverse transform. Object, array, and tuple schemas recursively encode nested codecs. |
| Defaults | Constant arrays, objects, maps, and sets are shallow-cloned per parse. Factory defaults and direct `.prefault(value)` follow Zod 4 behavior. |
| Records | Key schemas run and may transform keys; non-enumerable and unsafe prototype keys are skipped; invalid keys use the `invalid_key` issue code. |
| JSON Schema | Draft 2020-12 is the default, stripped objects emit `additionalProperties: false`, and unrepresentable schemas throw by default. `{ unrepresentable: "any" }` matches Zod; `{ unrepresentable: "vld" }` enables VLD's richer Map, Set, Date, and BigInt extensions. |
| Composition | Schema instances expose `array`, `or`, `and`, `nonoptional`, `overwrite`, and `toJSONSchema`; tuples support current rest-schema construction and `.rest()`. |
| JSON Schema input | `fromJSONSchema()` accepts boolean schemas, normalizes inputs through JSON, rejects cyclic/BigInt input, and can write discovered metadata to a supplied registry. |
| Module config | Global configuration is shared through `globalThis`, including mixed CJS/ESM use in one process. |
| Release fixes | The differential gate covers absent-key `catch`/`preprocess`, transformed record keys, cloned Map/Set defaults, empty XOR construction, multi-literals, prefaults, and schema direction methods. |
| Error issue structure | VLD produces Zod 4-compatible `VldIssue` objects: `invalid_type` with `expected`/`received`, `too_small`/`too_big` with `minimum`/`maximum`/`origin`/`inclusive`, `invalid_format` with `format`/`origin`/`pattern`, `invalid_value` with `values` array. `parse()` throws `VldError` (not plain `Error`). `v.number()` rejects `Infinity`/`-Infinity`/`NaN` by default like Zod 4. |

## VLD capabilities beyond the compatibility baseline

VLD keeps its zero-runtime-dependency architecture while adding built-in bidirectional codec presets, 27+ locales with lazy loading, plugins and lifecycle hooks, a typed Result API, a CLI, XOR validation, JSON parsing schemas, security hardening, and release-gated runtime/startup/memory benchmarks.

The bundle gate also compares equivalent tree-shaken root-string probes. The current VLD probe is 112.5 KiB versus Zod 4.4.3 at 119.6 KiB; `@oxog/vld/mini` remains 61.7 KiB.

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

## Upstream sources

- [Zod releases](https://github.com/colinhacks/zod/releases)
- [Zod API](https://zod.dev/api)
- [Zod codecs](https://zod.dev/codecs)
- [Zod JSON Schema](https://zod.dev/json-schema)
- [Zod 4 migration guide](https://zod.dev/v4/changelog)
