# VLD ↔ Zod Drop-in Compatibility Report

Generated: 2026-09-02T10:32:15.611Z

## Setup

- Node: `v24.13.0` on `win32 x64`
- Zod: 4.5.4 (latest at generation time)
- VLD: @oxog/vld 3.0.4 (drop-in release after the required-field fix in 3.0.2)

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
| `date()` against numeric or ISO-string timestamp | reject | accept | VLD coerces numeric/ISO strings to `Date`; Zod 4 strict. Use `z.coerce.date()` in Zod or rely on VLD's default for equivalent behaviour. |

## 2. Regression Audit (17 cases)

| Metric | Count |
|--------|------:|
| Total cases | 17 |
| Passed | 15 |
| Known diffs | 2 |
| Failed | 0 |

The audit script (`examples/dropin/audit.mjs`) exercises the small set of
edge cases that the 267-case broad parity test does not stress. The
required-field cases in [section 3](#3-required-field-regression-coverage-302-fix)
are the regression guard for the 6 bugs fixed in 3.0.2; the other cases
catch silent regressions in core validator behaviour.

## 3. Required-field regression coverage (3.0.2 fix)

Six cases of required fields with `any` / `unknown` / `undefined` types
were silently accepted by VLD in 3.0.1. All six now correctly reject,
matching Zod 4.5.4 exactly. The fix is enforced in the VLD source at
`src/validators/object.ts` and guarded by both `audit.mjs` (this suite)
and `tests/validators/required-field.test.ts` (Jest).

| # | Schema | Sample | 3.0.1 | 3.0.2+ | Zod 4.5.4 |
|---|--------|--------|:-----:|:-----:|:--------:|
| 1 | `object({a: any()})` | `{}` | accept | **reject** | reject |
| 2 | `object({a: unknown()})` | `{}` | accept | **reject** | reject |
| 3 | `object({a: undefined()})` | `{}` | accept | **reject** | reject |
| 4 | `object({a: any(), b: string()})` | `{b: "x"}` | accept | **reject** | reject |
| 5 | `object({a: object({b: any()})})` | `{a: {}}` | accept | **reject** | reject |
| 6 | `discriminatedUnion` arm with missing required `any` | `{type: "x"}` | accept | **reject** | reject |

## 4. Performance Benchmark

1,000,000 safeParse ops per scenario. Median of 21 timed runs after 10,000 warmup ops.

- Zod total: **1633.46 ms**
- VLD total: **789.52 ms**
- Aggregate speedup: **2.07x** (VLD faster)
- Geometric mean speedup: **2.53x**

| Scenario | Zod (ms) | VLD (ms) | VLD/Zod |
|----------|---------:|---------:|--------:|
| string().min(1).email() | 124.04 | 57.46 | 2.16x |
| number().int().positive().min(1) | 81.16 | 20.29 | 4.00x |
| object({ a: string, b: number }) | 34.07 | 18.76 | 1.82x |
| tuple([string, number, boolean]) | 85.61 | 21.00 | 4.08x |
| array(string).min(1).max(100) | 142.35 | 22.42 | 6.35x |
| union([string, number]) | 33.74 | 13.91 | 2.43x |
| discriminatedUnion (cat | dog) | 56.81 | 42.15 | 1.35x |
| nested object (3 levels) | 175.54 | 120.78 | 1.45x |
| record(string) | 306.65 | 73.94 | 4.15x |
| literal("active") | 33.98 | 14.72 | 2.31x |
| composite (User with nested address + array) | 559.52 | 384.08 | 1.46x |

VLD wins **11/11** scenarios.

## 5. Migration Verification

The single source file `examples/dropin/app.mjs` was executed with both libraries
by toggling `DROPIN_LIB`:

```bash
node examples/dropin/app.mjs                 # uses Zod
DROPIN_LIB=vld node examples/dropin/app.mjs  # uses VLD
```

All 17 assertions in `app.mjs` produced identical results on both libraries.

## 6. Drop-in Surface

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

## 7. Files in this drop-in suite

```
examples/dropin/
├── README.md              # overview
├── REPORT.md              # this file
├── run.mjs                # one-shot: parity + audit + bench + report
├── regen-report.mjs       # regen REPORT.md without re-running bench
├── shim.mjs               # DROPIN_LIB=zod|vld runtime switch
├── app.mjs                # single source file: 17 assertions, runs on both
├── audit.mjs              # 17 targeted edge cases, regression guard for 3.0.2
├── adapters/
│   ├── zod.mjs            # exports { z }  ← from zod
│   └── vld.mjs            # exports { z }  ← from @oxog/vld (version from package.json)
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
