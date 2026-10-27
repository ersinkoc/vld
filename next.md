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

1. **esbuild root entry - SOLVED end to end (2026-10-27, third pass)**:
   `import { NEVER }` 463.9 -> **68.5 KB** (zod: 88 KB same probe),
   realistic schema -> **124.8 KB**; guarded at 90/160 KB in
   verify:treeshake (esbuild devDep must stay >= 0.26). The full pin
   chain, for the record:
   - Pin A: `export const {...} = v` destructuring -> hoisted post-build
     (scripts/hoist-root-exports.cjs, in the build chain, ESM only).
   - Pin B: ten module-scope `v.catch`-style property reads -> hoisted
     factory consts; serializer imported directly, not via the shim.
   - Pin C: `NEVER: VldNever.create()` embedded in the core/v literals -
     a call inside a literal makes the whole literal (and every member
     reference: locales namespace, util, ...) undroppable -> single
     hoisted NEVER_SENTINEL const.
   - Pin D: eager 33-locale registration loops -> lazy
     ensureBuiltinsRegistered() behind the observing locale APIs.
   RULE going forward: **no calls and no fat references inside top-level
   object literals in src/index.ts** - a new `foo: SomeClass.create()`
   member will silently re-pin the graph (the esbuild guard will catch
   it).

2. **v4-mini measured post-fix (2026-10-27)**: esbuild namespace import
   112.9 KB / named 90.7 KB - the pin fixes cascaded through the
   `export * from '../index'` chain, so a standalone mini factory layer is
   no longer worth the churn. (zod-mini namespace probe: 13 KB, but it is a
   separate functional API; vld mini shares the parity validator classes.)
3. **Locale catalog - COMPLETE (2026-10-27, final round)**: 68 locales;
   every zod 4.6.7 locale code is covered (zod ships 63; vld adds
   af/es-MX/pt-BR-v4/sw/zh as extras). Final round added hy ka ta tk ps
   ckb yo km ota + kh/ua deprecated-alias shims (kh -> km, ua -> uk,
   mirroring zod). The per-key translation checklist and registration
   points live in tests/locales/ported-locales*.test.ts and
   src/locales/{index,lazy,types}.ts.

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
