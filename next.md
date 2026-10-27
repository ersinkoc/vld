# Next Steps - VLD Zod Parity

This file tracks the state of the zod-parity effort on `@oxog/vld`.

---

## 1. Current state (2026-10-27)

| Item | State |
|---|---|
| Parity baseline | **zod 4.6.7** (npm `latest`, lockfile pinned) |
| Behavioral divergences | **Zero.** Differential sweeps green; `ZodError.message`/`name` now Zod-parity (JSON issue list), asserted by battery |
| Ecosystem duck typing | `_zod.def/traits/version/bag` on schemas, `$ZodError` traits on errors; `verify:ecosystem` proves `@hookform/resolvers` `zodResolver` end to end |
| Tree-shaking | rollup (Vite prod parity): NEVER 70.8 KB / realistic schema 129 KB / mini factory 93.3 KB, guarded by `verify:treeshake`; root-string probe 93.4 KiB vs zod's 182.8 KiB |
| Tests | 118 suites, 3380 tests, all passing; coverage 100/99/100/100 |
| Lint / `tsc --noEmit` / build / all verify scripts | clean |
| `npm run benchmark:guard` | PASS (~5.3x average vs Zod) |

### 2026-10-27 architecture notes (why base.ts looks like this)

- `VldArray`/`VldUnion`/`VldIntersection` live **inside** `validators/base.ts`;
  `validators/{array,union,intersection}.ts` are re-export shims. Reason: a
  static `base -> array -> base` cycle throws TDZ at class-declaration time
  (array evaluates before VldBase when base is entered first), and the old
  factory-injection wiring pinned the whole dist graph for bundlers.
- `.toJSONSchema()` is **late-bound** via `configureToJSONSchema` (called once
  from `src/index.ts`). A direct `base -> utils/to-json-schema` import is
  runtime-safe (function-level references only) but creates a module cycle
  that silently breaks ts-jest ESM coverage attribution - statements execute
  yet record zero hits. Do not re-introduce that import.
- `utils/json-schema.ts` is split into `to-json-schema.ts` (serializer, no
  validator imports; dispatch is `constructor.name`/`validatorType`) and
  `from-json-schema.ts` (builder, imports factories). `itemShape` lives in
  `validators/item-shape.ts` for the same cycle reason.
- Tests must not use dynamic `await import()` on src modules: ts-jest ESM
  records **zero coverage** for modules loaded that way (cost hours to find).

## 2. Known remaining gaps (from the 2026-10-26 audit)

1. **esbuild cannot tree-shake the root entry** (multiple stacked pins,
   partially mapped 2026-10-27):
   - Pin A (proven, ~139 KB): the main namespace object literal (`v`, dist
     name varies per build) is evaluated whenever a root export flows
     through its destructuring re-export; members with import-reference
     values (locales, regexes, util, core) pin their modules.
     `scripts/hoist-root-exports.cjs` removes this pin (hoists the ~121
     destructured members to top-level vars in dist/index.js; validated:
     ESM loads, v.string === string identities preserved, rollup neutral).
     NOT wired into the build because fixing Pin A alone shows zero esbuild
     gain while Pins B+ remain.
   - Pins B+ (~329 KB with the namespace literal emptied): unidentified.
     Suspects: the vV2 namespace literal, the schema-transform functions
     (partial/deepPartial walkers), and/or shared-chunk contents.
     Working method: surgical variants of dist/index.js measured with
     esbuild inside a sideEffects:false package context (the
     /tmp/clean-probe + final-bisect.cjs pattern); beware that measuring
     in directories whose package.json lacks sideEffects:false produces
     false pins (several hours were lost to exactly that).
   - Mini named imports DO shake under esbuild (74 KB min). Until solved,
     size-sensitive esbuild users should import from `@oxog/vld/mini`.

   Post-fix yardstick: zod reaches 88 KB min for the same root probe.
2. **`src/v4-mini/index.ts` still does `export * from '../index'`**: mini's
   namespace import retains the full surface. Making mini standalone (own
   factory layer over the validators, no `../index` edge) is the big
   remaining tree-shaking win; base is now wiring-free so it is unblocked.
   zod-mini namespace probe: 13 KB - the target.
3. **Locale catalog**: zod ships 63 locales, vld 33. Missing: az be bg ca
   ckb cs el eo fa fr-CA he hr hu hy is ka kh km lt mk ms nn ota ps ro sl
   ta tk ua uk ur uz yo zh-CN zh-TW. Porting recipe: zod is MIT-licensed;
   each `zod/v4/locales/<code>.js` exports the message catalog in the same
   shape vld locales already use (en is byte-parity) - adapt, register in
   `src/locales/index.ts` (translatedLocaleCodes + translatedLocales) and
   the rollup locale entry list, add the jest.config ignore line, add a
   round-trip test per locale.

## 3. When a new zod release lands

1. `npm view zod version` - if newer than the lockfile, `npm i -D zod@latest`.
2. Download both tarballs and `diff -rq` the `v4/` dist trees; npm release notes are thin.
3. Port any behavior changes; keep `.temp_files/sweep_*.ts` green (zero output).
4. Update `docs/ZOD_COMPATIBILITY.md` audit line and the CHANGELOG.
5. Update `ZOD_COMPAT_VERSION` in `src/validators/base.ts` and the ecosystem
   probe expectations if zod's minor/patch moves.

## 4. Tooling reminders (`.temp_files/`, git-ignored)

- `node --no-experimental-strip-types run.cjs <script>.ts` runs a probe/sweep.
- `cov.cjs` lists zero-hit lines, `covb.cjs` lists zero-hit branches from lcov.
- **Always check coverage threshold output directly** (`grep "does not meet"`);
  `tail -4` of jest output hides the threshold lines (they print before the totals).

## 5. Candidate future work (not parity)

- Benchmark presence on moltar's typescript-runtime-type-benchmarks and schemabenchmarks.dev.
- An interpreter fallback for `v.compile` where `new Function` is blocked (edge runtimes) - see the ata-validator comparison in the 2026-10-22 session.
- LLM-oriented error tooling (`toRetryMessage`-style) inspired by ata-validator.
- esbuild root-entry investigation (gap 2.1 above) - likely requires splitting
  dist/index.js's own namespace object (`v`) out of the module's top level.
