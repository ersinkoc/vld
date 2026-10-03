# Next Steps — VLD Audit Follow-up

This file lists the open work left after four audit rounds (findings F01–F201) on `@oxog/vld`, the Zod 4.6.5–compatible validator.
It covers the current repository state, what still has to be decided, and what is worth working on next, in priority order.

---

## 1. Current state

| Item | State |
|---|---|
| Rounds 1–2 (F01–F101) | Committed as `dec56ee` |
| Rounds 3–4 (F102–F201) | **Uncommitted** in the working tree (about 42 modified `src` files, `tests/audit-regressions.test.ts`, and the new `src/utils/string-length.ts`) |
| Tests | 112 suites, 3227 tests, all passing |
| Coverage | statements 100%, lines 100%, functions 100%, branches **99.00%**. The threshold is 99%, so there is no headroom. |
| Lint / `tsc --noEmit` / build | clean |
| `npm run benchmark:guard` | PASS (average 7.21x faster than Zod; slowest case is simple object parse at 1.65x) |
| Proof scripts | `.temp_files/prove_*` and `verify_*` for F01–F201 all pass (the folder is git-ignored) |
| Untouched entry points | `src/mini.ts` and `src/v3/index.ts` are byte-identical to HEAD |

### Audit tooling in `.temp_files/` (git-ignored; keep it, do not commit it)
- `run.cjs` is the TypeScript runner. Run a script with `cd .temp_files && node --no-experimental-strip-types run.cjs <script>.ts`.
  - `VLD_SRC=orig` maps `../src` imports to `orig/src`, the snapshot taken before the audit.
  - `VLD_SRC=r4` maps them to `orig_r4/src`, the snapshot taken at the start of round 4.
- `sh .temp_files/run_all.sh [ID-prefix]` checks three things for each finding:
  1. The prove script reproduces on the baseline.
  2. The prove script does not reproduce on the current code.
  3. The verify script passes.

  It uses the `r4` baseline for F152 and later; set `BASELINE=...` to override.
- `audit_round4.diff` is the full round-4 diff against `orig_r4`.
- `sweep_*.ts` files are differential sweeps against Zod: formats, types, refinements, error formatters, and composite APIs. Re-run them after any behaviour change.

---

## 2. Immediate actions (before anything else)

1. **Review and commit rounds 3 and 4 as separate commits.**
   - Round 3 is F102–F151; round 4 is F152–F201.
   - Splitting them is easiest by replaying the patch files in `.temp_files/patches/`. If that is impractical, use one commit and list the finding IDs in the body.
   - Never commit `.temp_files/`.
2. **Add a CHANGELOG entry.** Several fixes change observable behaviour and need release notes. See section 3.
3. **Run the full release gate:** `npm run release:check` (lint, source and published types, tests, build, package install, audit, Zod parity, performance guard).
4. **Restore coverage headroom.** Branch coverage sits exactly at 99.00%; any new branch without a test will fail CI. Cheap wins:
   - V2 `catch (e) { e instanceof VldError ? … }` fallbacks in `composite-v2.ts`, `bigint-v2.ts`, `date-v2.ts`, `leaf-v2.ts`, `number-v2.ts`.
   - `map.ts` / `set.ts`: `check.kind ? … : new Error(...)`.
   - `object.ts:854` (sync passthrough-mode branch).
   - Alternatively, delete fallbacks that are provably unreachable.

---

## 3. Behaviour changes to document (release notes / semver)

These fixes align VLD with Zod but can change results for existing users. Ship them in a **minor** release with explicit notes, or a major release if the project treats issue-shape changes as breaking.

| Area | Old behaviour | New behaviour | Findings |
|---|---|---|---|
| `string().email()` (V1/V2/compiled) | Loose `x@y.z` pattern | Zod's default email regex: rejects `mailto:`, quoted locals, IP literals, `-label`, and one-letter TLDs | F195 |
| `string().url()` | http(s) regex that also rejected valid URLs | http(s) prefix check plus WHATWG URL parsing | F196 |
| `v.httpUrl()` | Loose regex | Requires a domain hostname (rejects `localhost`, IP hosts, one-letter TLDs) | F193 |
| `v.url()` / `v.httpUrl()` output | Raw input | Trimmed, with tabs and newlines stripped | F194 |
| `v.jwt()` | Regex only | Decodes and validates the header; honours `{ alg }` | F159 |
| `iso.datetime()` | `T10:30Z` accepted | Seconds required when `Z` or an offset is present | F168 |
| String `min`/`max`/`length` | UTF-16 code units | Code points (Zod 4.6) | F172 |
| Strict objects | One `unrecognized_keys` issue per key, at path `[key]` | One issue at the object path, with `keys: [...]` | F177 |
| Exhaustive `record(enum, …)` | `invalid_key` / `invalid_object` | `unrecognized_keys` / value issue at path `[key]` | F192 |
| Issue codes | `custom`, `invalid_date`, `invalid_array`, `invalid_number`, `invalid_object`, `invalid_literal` in many places | Zod codes (`invalid_type` + `expected`, `too_small`/`too_big` + bounds, `invalid_value`, `invalid_format`) | F175, F176, F179, F181–F187, F189–F191 |
| `object.parse()` / `strict().parse()` / `catchall().parse()` | Could throw a plain `Error` without `.issues` | Always throws `VldError` with field paths | F178, F197 |
| `.default(x).optional()` / `.nullish()` | `undefined` → `undefined` | `undefined` → `x` | F173 |
| `partial(mask)` / `required(mask)` / mask `pick`/`omit` | Mask ignored; unknown keys silently ignored | Mask honoured; unknown keys throw `Unrecognized key: "…"` | F169–F171 |
| `literal([a, b]).value` | Returned `a` | Throws ("Use `.values`") | F201 |
| `treeifyError` / `formatError` | Union kept as a single summary line | Union branches are expanded into nested paths | F199 |
| Refinements | Stopped after the first failure | Continue after non-fatal failures; `abort`, `fatal` and `when` honoured | F156, F198 |

---

## 4. Decisions needed: Zod divergences currently pinned by tests

Each item below was **not fixed** because an existing test asserts the old behaviour. Every case differs from Zod 4.6. For each one, decide whether to keep VLD's behaviour (and document it) or adopt Zod's (and update the test).

| # | Behaviour | Pinned by | Zod behaviour |
|---|---|---|---|
| 4.1 | `stringV2().length(n)` always reports `too_big`, even for short strings | `tests/v2-coverage.test.ts:88` | `too_small` when the string is shorter (V1 already does this) |
| 4.2 | `object({ a: x.exactOptional() })` accepts `{ a: undefined }` | `tests/validators/base-coverage.test.ts:177` | Rejects an explicit `undefined`; only a missing key is allowed. VLD's own `exactPartial()` doc comment claims Zod behaviour. |
| 4.3 | `v.exactOptional(x).parse(undefined)` returns `undefined` | `tests/index-full-coverage.test.ts:223` | Delegates to the inner schema |
| 4.4 | `string().jwt()` is regex-only (`'abc.def.ghi'` passes) | `tests/zod-composition-compat.test.ts:52` | Header validation. The standalone `v.jwt()` already does it (F159). |
| 4.5 | `string().url()` rejects non-http schemes (`mailto:`, `ftp:`) | `tests/validators/string.test.ts:102` | Any WHATWG-parseable URL |
| 4.6 | `isValidIPv6()` utility accepts zone IDs (`fe80::1%eth0`) | `tests/coverage-gaps.test.ts:94`, `tests/utils/ip-validation-coverage.test.ts:78` | Rejects them. All format validators already use `isValidIPv6Address`; only the exported helper keeps the old rule. |
| 4.7 | `v.regexes.datetime()` accepts `T12:30Z` | `tests/validators/string-formats-coverage.test.ts:135` | Requires seconds when `Z` or an offset is present |
| 4.8 | `toJSONSchema(v.lazy(...))` returns `{ type: 'object' }` | `tests/json-schema-coverage.test.ts:274` | Converts the inner schema. Recursion is now handled with `$ref` (F166), so this placeholder is no longer needed. |
| 4.9 | `.check(fn)` treats `fn` as a boolean predicate | `tests/refine-chaining.test.ts:87` | `fn(payload)` pushes issues. VLD's `.with()` already implements the Zod form. |
| 4.10 | `default('a').prefault().optional()` returns `undefined` | `tests/validators/prefault.test.ts:91` | Runs the inner prefault/default |
| 4.11 | `v.json()` parses JSON *strings* | `tests/validators/json.test.ts` | Validates JSON-compatible *values* |
| 4.12 | `v.int64()` / `v.uint64()` are number-based | `tests/index-full-coverage.test.ts:109-111` | Bigint-based |
| 4.13 | Sync array/tuple/map/set/intersection element errors flatten into one container issue (`invalid_array` at the container path) | `tests/zod4-parity.test.ts` ("exposes Zod-style root parse…" `flattenError().formErrors`) | Per-element issues with full paths, e.g. `[1, 'a']`. The async paths (F153) already produce Zod paths, so sync and async now disagree. |
| 4.14 | Affix checks (`startsWith`/`endsWith`/`includes`) report `custom` | Earlier rounds | `invalid_format` |
| 4.15 | `lowercase()` / `uppercase()` are transforms | Earlier rounds | Checks (Zod `toLowerCase()` is the transform) |
| 4.16 | `stringbool()` also accepts booleans; `date()` accepts strings and numbers | Earlier rounds (design) | Rejects them |

**Recommendation:** fix 4.1, 4.2, 4.4, 4.6, 4.7, 4.8 and 4.13 in a single "Zod parity" release; they are low-risk and the tests only pin incidental output. Treat 4.11, 4.12 and 4.16 as product decisions.

---

## 5. Known gaps that need design work

1. **`.overwrite()` loses the chain API.**
   - Today `v.string().overwrite(f).max(2)` throws a TypeError because `overwrite` returns a `VldTransform`.
   - Zod returns the same schema class, with the overwrite running as an in-order check.
   - Suggested fix: a per-class `overwrite` (e.g. VldString appends to `transforms`). This needs a return-type change on `VldBase.overwrite`, or a `this`-typed overload.
2. **TypeScript typings for the wrapper-forwarded API (F157).**
   - At runtime, `describe()`, `meta()` and `brand()` forward about 95 chain methods. The `.d.ts` files do not declare them, so TypeScript users still see errors.
   - Options: generic `VldMeta<TInput, TOutput, TBase>` typings, or returning `this`-typed schemas.
3. **`required()` vs `default()`.** Zod's `required()` wraps fields in `nonoptional`, so `object({ a: string().default('d') }).required()` rejects `{}`; VLD accepts it.
4. **`string().url()` output is not trimmed**, unlike the standalone `v.url()`. Zod trims for both.
5. **Plugin hooks are never invoked.** The kernel registers them but the parse paths never call them. Wiring them adds per-parse overhead, so measure with `benchmark:guard`.
6. **Message wording differs from Zod.**
   - VLD prefixes nested messages, e.g. `Invalid field "a": …`.
   - Its locale texts also differ from Zod's English messages.
   - Decide whether `toZodError()` should rewrite them.
7. **Tuple with a rest element and too few items.** VLD reports `too_small`; Zod reports the missing element (`invalid_type` at `[i]`). This is left as a deliberate difference.
8. **JWT header decoding.** VLD decodes base64url (RFC 7515). Zod uses raw `atob` and rejects headers containing `-` or `_`. Keep VLD's behaviour and document it.

---

## 6. Areas not yet swept (candidates for round 5)

Use the same method: write a differential sweep against Zod, prove each defect, fix it, then verify.

- **Codecs** (19 built-ins): round-trip `encode(decode(x))`, error codes, and async codecs; compare with Zod 4.6 codec semantics.
- **Locales:** every locale defines every message key (`src/locales/types.ts`); the lazy-locale race in `src/locales/lazy.ts` (two uncovered branches at lines 135 and 140).
- **v4 / v4-mini / mini entry points:** API surface parity with `zod/v4`, `zod/v4/mini` and `zod/v4/core`. For example, `z.core` helpers such as `$ZodType` checks, `util.*`, and `regexes.*`.
- **`compile()` / `validate()`:** fuzz compiled vs interpreted results across random schemas. Bugs were found here in rounds 3 and 4 (lengths, URLs, `includes` position).
- **Error formatters:** `prettifyError` ordering and path rendering; `flattenError` with symbol keys; `toZodError` field mapping for the new issue fields (`keys`, `values`, `expected`, `format`, `pattern`).
- **`fromJSONSchema` ↔ `toJSONSchema` round trips:** `$defs`/`$ref` (VLD's `fromJSONSchema` currently treats `$ref` as `any`), `definitions`, and draft-04/07/openapi targets.
- **Compat layer** (`src/compat/*`), **logger**, and **CLI** (`src/cli`, excluded from coverage): add at least smoke tests.
- **Async edge cases:** `superRefine` with async `ctx.addIssue`, `transform` returning promises inside objects, and `catch` with async fallback functions.
- **Security:** prototype-pollution keys through `record`, `looseRecord`, catchall, and `fromJSONSchema` defaults; ReDoS on every format regex using the inputs in `.temp_files/p21.ts`.

---

## 7. Verification checklist for any future change

1. Write `prove_<ID>_<slug>.ts`. It must print EXPECTED/ACTUAL and `PROBLEM CONFIRMED` on the baseline.
2. Fix with a minimal diff; do not change public API unless the bug is there.
3. Write `verify_<ID>_<slug>.ts` with edge cases; it must print `FIX VERIFIED`.
4. `npx jest --coverage=false`: if an existing test pins the old behaviour, revert the fix and record it in section 4.
5. Add a regression test to `tests/audit-regressions.test.ts` (append only).
6. Run `npm test` (coverage gates), `npm run lint`, `npm run test:types`, `npm run build`, and `npm run benchmark:guard`. The guard is noisy; re-run once on a single-case failure.
7. Run `sh .temp_files/run_all.sh F` to confirm no earlier fix regressed.
8. Confirm `src/mini.ts` and `src/v3/index.ts` are unchanged unless the change targets them.

### Practical notes
- Source files use **CRLF** line endings and some lines have trailing whitespace. Patch scripts should match whitespace-tolerantly and write with `newline=''`.
- Avoid shell heredocs for content containing `\t`, `\n` or backslashes; write such files directly.
- `exactOptionalPropertyTypes` is enabled. Return precise types from `parseAsync` overrides; `Promise<any>` breaks inference in tests.
- Jest only collects `tests/**/*.test.ts`. Throwaway probes outside `tests/` are not run by Jest.
