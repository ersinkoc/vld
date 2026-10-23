# Next Steps - VLD Zod Parity

This file tracks the state of the zod-parity effort on `@oxog/vld`.

---

## 1. Current state (2026-10-23)

| Item | State |
|---|---|
| Parity baseline | **zod 4.6.7** (npm `latest`, lockfile pinned) |
| Behavioral divergences | **Zero.** Every differential sweep in `.temp_files/` prints no output: formats, r3, r4, sizegate, fromJSONSchema, toJSONSchema (byte-identical key order), error formatting (treeify/flatten/prettify/format, symbol paths raw-keyed) |
| Default `en` messages | Match Zod verbatim, including `invalid_union`'s bare `Invalid input`; other locales keep translated summaries |
| Tests | 117 suites, 3338 tests, all passing |
| Coverage | statements 100%, lines 100%, functions 100%, branches >= 99% (threshold met) |
| Lint / `tsc --noEmit` / build | clean |
| `npm run benchmark:guard` | PASS (~5.5-6.2x average vs Zod) |
| `docs/ZOD_COMPATIBILITY.md` | Records zero known intentional differences, audited against 4.6.7 |

Commits closing the gap (2026-10-22..23): `ebf460e` (4.6.6/4.6.7 port: size gates,
per-member issue paths, JSON Schema emission), `e2f59be` (exactOptional,
required() presence, jwt/url formats, strict datetime, JSON Schema key order),
`3588eda` (json values, bigint int64/uint64, Date-only date(), stringbool,
lowercase/uppercase checks, .check ctx contract, coercion edges), `6db0e1a`
(error-formatting parity: symbol keys, items-branch routing, en messages).

### Known safe harbors kept on purpose

- `v.dateLegacy()` keeps vld's pre-parity coercing date behaviour (migration path).
- Non-`en` locales keep translated union/summary message wording (locale system by design).
- The V1 `number.uint64()/int64()` chain methods remain number-flavoured extras;
  the `v.int64()` / `v.uint64()` factories are bigint-based like Zod.

## 2. When a new zod release lands

1. `npm view zod version` - if newer than the lockfile, `npm i -D zod@latest`.
2. Download both tarballs and `diff -rq` the `v4/` dist trees; npm release notes are thin.
3. Port any behavior changes; keep `.temp_files/sweep_*.ts` green (zero output).
4. Update `docs/ZOD_COMPATIBILITY.md` audit line and the CHANGELOG.

## 3. Tooling reminders (`.temp_files/`, git-ignored)

- `node --no-experimental-strip-types run.cjs <script>.ts` runs a probe/sweep.
- `cov.cjs` lists zero-hit lines, `covb.cjs` lists zero-hit branches from lcov.
- **Always check coverage threshold output directly** (`grep "does not meet"`);
  `tail -4` of jest output hides the threshold lines (they print before the totals).

## 4. Candidate future work (not parity)

- Benchmark presence on moltar's typescript-runtime-type-benchmarks and schemabenchmarks.dev.
- An interpreter fallback for `v.compile` where `new Function` is blocked (edge runtimes) - see the ata-validator comparison in the 2026-10-22 session.
- LLM-oriented error tooling (`toRetryMessage`-style) inspired by ata-validator.
