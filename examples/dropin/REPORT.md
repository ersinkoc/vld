# VLD ↔ Zod Drop-in Compatibility Report

Generated: 2026-09-02T10:06:09.868Z

## Setup

- Node: `v24.13.0` on `win32 x64`
- Zod: 4.5.4
- VLD: @oxog/vld 3.0.4

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
| `date()` against numeric or ISO-string timestamp | reject | accept | VLD coerces numeric/ISO strings to `Date`; Zod 4 strict |

## 2. Regression Audit

| Metric | Count |
|--------|------:|
| Total cases | 17 |
| Passed | 15 |
| Known diffs | 2 |
| Failed | 0 |

See [README.md](./README.md) and the audit script for case details.

## 3. Performance Benchmark

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
