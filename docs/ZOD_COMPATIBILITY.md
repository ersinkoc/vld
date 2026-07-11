# Zod compatibility policy

Last audited: 2026-07-10 against Zod 4.4.3 (`latest` on npm).

VLD treats Zod compatibility as a tested contract, not an export-count claim. The release gate checks the npm `latest` version, all public package subpaths, root and subpath exports, a compiled drop-in application, and a behavior suite covering the latest upstream fixes.

## Current compatibility baseline

| Area | Contract |
| --- | --- |
| Package paths | `zod`, `zod/mini`, `zod/locales`, `zod/v3`, `zod/v4`, `zod/v4-mini`, `zod/v4/mini`, `zod/v4/core`, and `zod/v4/locales` have VLD equivalents. |
| Modern factories | Array-based `union`, `tuple`, `xor`, `discriminatedUnion`, `enum`, multi-value `literal`, two-schema `record`, and empty `object()` calls are supported. VLD's older rest-argument forms remain available as extensions. |
| Direction API | Every schema exposes `decode`, `encode`, safe variants, async variants, and `spa`; codecs override the backward direction with their inverse transform. Object, array, and tuple schemas recursively encode nested codecs. |
| Defaults | Constant arrays, objects, maps, and sets are shallow-cloned per parse. Factory defaults and direct `.prefault(value)` follow Zod 4 behavior. |
| Records | Key schemas run and may transform keys; non-enumerable and unsafe prototype keys are skipped; invalid keys use the `invalid_key` issue code. |
| JSON Schema | Draft 2020-12 is the default, stripped objects emit `additionalProperties: false`, and unrepresentable schemas throw by default. `{ unrepresentable: "any" }` matches Zod; `{ unrepresentable: "vld" }` enables VLD's richer Map, Set, Date, and BigInt extensions. |
| Composition | Schema instances expose `array`, `or`, `and`, `nonoptional`, `overwrite`, and `toJSONSchema`; tuples support current rest-schema construction and `.rest()`. |
| JSON Schema input | `fromJSONSchema()` accepts boolean schemas, normalizes inputs through JSON, rejects cyclic/BigInt input, and can write discovered metadata to a supplied registry. |
| Module config | Global configuration is shared through `globalThis`, including mixed CJS/ESM use in one process. |
| Release fixes | The differential gate covers absent-key `catch`/`preprocess`, transformed record keys, cloned Map/Set defaults, empty XOR construction, multi-literals, prefaults, and schema direction methods. |

## VLD capabilities beyond the compatibility baseline

VLD keeps its zero-runtime-dependency architecture while adding built-in bidirectional codec presets, 27+ locales with lazy loading, plugins and lifecycle hooks, a typed Result API, a CLI, XOR validation, JSON parsing schemas, security hardening, and release-gated runtime/startup/memory benchmarks.

The bundle gate also compares equivalent tree-shaken root-string probes. The current VLD probe is 109.7 KiB versus Zod 4.4.3 at 119.6 KiB; `@oxog/vld/mini` remains 61.7 KiB.

## Verification

Run:

```bash
npm run build
npm run verify:zod
npm run verify:drop-in
npm test -- --runInBand
```

`verify:zod` fails if the installed comparison version is behind npm `latest`, if a public path/export is missing, or if the differential behavior suite diverges.

## Upstream sources

- [Zod releases](https://github.com/colinhacks/zod/releases)
- [Zod API](https://zod.dev/api)
- [Zod codecs](https://zod.dev/codecs)
- [Zod JSON Schema](https://zod.dev/json-schema)
- [Zod 4 migration guide](https://zod.dev/v4/changelog)
