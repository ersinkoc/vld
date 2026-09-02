# VLD ↔ Zod Drop-in Compatibility Report

Generated: 2026-09-02T08:22:04.876Z

## Setup

- Node: `v24.13.0` on `win32 x64`
- Zod: 4.5.4 (latest at generation time)
- VLD: @oxog/vld 3.0.1

## 1. Parity Test (267 cases)

| Category    | Cases | Mismatches |
|-------------|-------|------------|
| primitives | 106 | 0 |
| structures | 36 | 0 |
| unions | 43 | 0 |
| refinements | 56 | 0 |
| composite | 26 | 0 |

**Match rate: 99.6% (266/267 cases match exactly)**

### Known behavioral differences (1)

| Case | Zod | VLD | Why |
|------|-----|-----|-----|
| `date()` against `1234567890` (number) | reject | accept | VLD coerces numeric timestamps; Zod 4 requires `Date` instance |

### VLD bug surfaced by parity test (1)

| Case | Zod | VLD | Why |
|------|-----|-----|-----|
| `discriminatedUnion(...)` with `data` missing on the matched arm | reject | accept | same root cause as audit bugs #1-4: `any` fields not enforced as required |

## 2. Deep Audit — VLD bugs surfaced

The audit script (`audit.mjs`) runs targeted assertions on edge cases that the broader parity test does not stress. It reveals **5 cases** where VLD silently accepts inputs that Zod 4 correctly rejects. These are real VLD bugs, not design choices — required means required regardless of type.

| # | Schema | Sample | Zod | VLD | Issue |
|---|--------|--------|-----|-----|-------|
| 1 | `object({a: any()})` | `{}` | reject | accept | required `any` field missing should fail |
| 2 | `object({a: unknown()})` | `{}` | reject | accept | required `unknown` field missing should fail |
| 3 | `object({a: any(), b: string()})` | `{b: "x"}` | reject | accept | `a` missing — same root cause |
| 4 | `object({a: object({b: any()})})` | `{a: {}}` | reject | accept | propagates to nested `any` |
| 5 | `object({a: undefined()})` | `{}` | reject | accept | required `undefined` field missing should fail |

### Root cause

In `src/validators/object.ts` (~line 590), the `passthrough` SimpleFieldMode is used for `any` / `unknown` types and writes `result[key] = fieldValue` without checking whether the field is required. Zod 4 explicitly throws `expected: nonoptional, received: undefined` for required fields.

### Workaround until fixed in VLD

```js
// Avoid relying on VLD to reject missing required any/unknown fields.
// Until the bug is fixed, add a refine that checks presence:
v.object({ data: v.any() })
  .refine(o => "data" in o, { message: "data is required" });
```

## 3. Performance Benchmark

1,000,000 safeParse ops per scenario. Median of 21 timed runs after 10,000 warmup ops.

- Zod total: **1408.27 ms**
- VLD total: **673.90 ms**
- Aggregate speedup: **2.09x** (VLD faster)
- Geometric mean speedup: **2.46x**

| Scenario | Zod (ms) | VLD (ms) | VLD/Zod |
|----------|---------:|---------:|--------:|
| string().min(1).email() | 61.72 | 31.44 | 1.96x |
| number().int().positive().min(1) | 48.36 | 14.50 | 3.33x |
| object({ a: string, b: number }) | 24.17 | 11.69 | 2.07x |
| tuple([string, number, boolean]) | 60.36 | 19.41 | 3.11x |
| array(string).min(1).max(100) | 114.63 | 19.32 | 5.93x |
| union([string, number]) | 28.11 | 11.33 | 2.48x |
| discriminatedUnion (cat | dog) | 43.76 | 33.26 | 1.32x |
| nested object (3 levels) | 153.37 | 109.58 | 1.40x |
| record(string) | 268.57 | 62.62 | 4.29x |
| literal("active") | 27.47 | 11.18 | 2.46x |
| composite (User with nested address + array) | 577.77 | 349.56 | 1.65x |

VLD wins **11/11** scenarios.

## 4. Migration Verification

Single source file `examples/dropin/app.mjs` was executed with both libraries:

```bash
node examples/dropin/app.mjs           # uses Zod
DROPIN_LIB=vld node examples/dropin/app.mjs  # uses VLD
```

All 17 assertions in `app.mjs` produced identical results on both libraries. (`app.mjs` is intentionally conservative — it does not exercise the audit-flagged edge cases. To reproduce the bugs in [section 2](#2-deep-audit--vld-bugs-surfaced), run `node examples/dropin/audit.mjs`.)

## 5. Drop-in Surface

Same Zod-style API is supported in VLD with the same method names, chaining order, and result shape:

```js
z.string().min(1).max(100).email().url().uuid().regex(/.../);
z.number().int().positive().min(0).max(999);
z.boolean(); z.date(); z.bigint();
z.array(item).min(1).max(100);
z.tuple([a, b, c]);
z.union([a, b]);
z.discriminatedUnion("type", [arm1, arm2]);
z.object({ a, b }).partial().strict().pick("a").omit("b").extend({c});
z.literal("active");
z.enum(["a", "b", "c"]);  // array form required for cross-compat
z.record(z.string());
z.string().optional().nullable().default("x").catch("y").transform(s => s);
z.string().refine(fn, "msg");
z.lazy(() => z.string());
z.preprocess(fn, z.string());
z.promise(z.string());
```

### Two API-shape differences to be aware of

1. **`z.enum(...)` variadic vs array**: Zod 4.5 *only* accepts the array form `z.enum(["a","b","c"])`. The variadic form `z.enum("a","b","c")` is parsed as `enum("a")` (a single-character enum) and silently breaks. VLD accepts both, but the array form is the cross-compatible style.

2. **`refine(fn, msg)` shape**: Zod accepts either a string or `{ message: "..." }`. VLD accepts a string. Use the string form for cross-compatibility.

## 6. Files in this drop-in suite

```
examples/dropin/
├── README.md              # overview
├── REPORT.md              # this file
├── run.mjs                # one-shot: parity + audit + bench + report
├── regen-report.mjs       # regen REPORT.md without re-running bench
├── shim.mjs               # DROPIN_LIB=zod|vld runtime switch
├── app.mjs                # single source file: 17 assertions, runs on both
├── audit.mjs              # 15 targeted edge cases, surfaces VLD bugs
├── adapters/
│   ├── zod.mjs            # exports { z }  ← from zod
│   └── vld.mjs            # exports { z }  ← from @oxog/vld
├── schemas/
│   ├── primitives.mjs     # 24 schemas
│   ├── structures.mjs     # 10 schemas
│   ├── unions.mjs         # 10 schemas
│   ├── refinements.mjs    # 14 schemas
│   └── composite.mjs      # 7 realistic composite schemas
├── tests/
│   └── run-parity.mjs     # 267 (schema, sample) cases
└── bench/
    ├── run-bench.mjs      # 11 scenarios, 1M ops, 21 runs
    └── result.json        # machine-readable result
```
