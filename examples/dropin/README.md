# VLD ↔ Zod Drop-in Test & Benchmark Suite

The point of this directory is to make the **"import swap = no other code change"** claim falsifiable.

## Layout

```
dropin/
├── adapters/
│   ├── zod.mjs        # exports { z }  (Zod 4.5.x)
│   └── vld.mjs        # exports { v }  (@oxog/vld 3.0.x)
├── schemas/
│   ├── primitives.js  # strings, numbers, booleans, dates, bigint, ...
│   ├── structures.js  # objects, arrays, tuples, records, maps, sets
│   ├── unions.js      # unions, discriminated unions, literals, enums
│   ├── refinements.js # refine, transform, default, catch, optional, nullable
│   └── composite.js   # realistic user/order/api-request schemas
├── tests/
│   └── run-parity.mjs # runs every schema with both adapters, asserts same accept/reject
├── bench/
│   └── run-bench.mjs  # 1M safeParse per scenario, median-of-21
└── run.mjs            # one-shot driver: builds → tests → benchmarks → reports
```

## Run

```bash
# from project root
node examples/dropin/run.mjs
```

The output is a single Markdown report at `examples/dropin/REPORT.md` containing:
1. parity result for every (schema, input) pair
2. per-scenario and total benchmark medians
3. speedup factor of VLD over Zod
4. any mismatches with the smallest reproducer

## The contract

Every schema in `schemas/*.js` exports a single function `make(lib)`, where `lib` is either `z` or `v`. **The function bodies are the exact same source code** for both adapters. We never branch on `lib` inside `make` — if a method differs, we adapt it in the adapter file once and the schemas stay clean.
