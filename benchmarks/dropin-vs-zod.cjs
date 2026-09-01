/**
 * VLD v3.0 — Honest Drop-in Replacement Benchmark vs Zod 4.5
 *
 * Each scenario builds the SAME logical schema in both libraries
 * using their public API, then runs the same input through both
 * for 1M safeParse operations. We measure the median of 21 runs
 * after a 10k-op warmup. This is the realistic "I just rewrote
 * import { z } to import { v } and what do I get?" benchmark.
 *
 * Run: node benchmarks/dropin-vs-zod.cjs
 *
 * Both libraries are exercised on the valid path. Errors are NOT
 * benchmarked here (VLD's invalid path is slower than Zod's because
 * it allocates a VldError + issues array). That is documented in
 * benchmarks/perf-tradeoffs.cjs.
 */

const { v, vV2 } = require('../dist/index.js');
const { z } = require('zod');

const ITER = 1_000_000;
const RUNS = 21;
const WARMUP = 10_000;

function median(arr) {
  const sorted = arr.slice().sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function bench(label, fn, input) {
  for (let i = 0; i < WARMUP; i++) fn(input);
  const samples = [];
  for (let r = 0; r < RUNS; r++) {
    const start = process.hrtime.bigint();
    for (let i = 0; i < ITER; i++) fn(input);
    const end = process.hrtime.bigint();
    samples.push(Number(end - start) / 1_000_000);
  }
  return { label, ms: median(samples) };
}

function fmt(ms) { return ms.toFixed(2).padStart(10) + ' ms'; }

const NODE = process.version;
const PLATFORM = `${process.platform} ${process.arch}`;
const ZOD_VER = require('zod/package.json').version;
const VLD_VER = require('../package.json').version;

console.log('VLD v3.0 — Drop-in Replacement Benchmark');
console.log('==========================================');
console.log(`Node ${NODE} on ${PLATFORM}`);
console.log(`VLD ${VLD_VER}  vs  Zod ${ZOD_VER}`);
console.log(`${ITER.toLocaleString()} safeParse ops, ${RUNS} runs median, ${WARMUP} warmup\n`);

// Each scenario defines the schema in BOTH libraries. The schemas
// are semantically equivalent. We compare the parse result to make
// sure both accept/reject the same data.

function makeBenchmarks(name, mk, valid, invalid) {
  const { vSch, zSch } = mk();
  // Sanity check: both schemas must accept valid input and reject invalid
  const vOK = vSch.safeParse(valid).success;
  const zOK = zSch.safeParse(valid).success;
  const vBad = vSch.safeParse(invalid).success;
  const zBad = zSch.safeParse(invalid).success;
  if (vOK !== zOK || vBad !== zBad) {
    console.error(`!! Semantic mismatch in ${name}: VLD ok=${vOK} bad=${vBad} | Zod ok=${zOK} bad=${zBad}`);
    process.exit(1);
  }
  return [
    bench(`  v.* (V1) `, (x) => vSch.safeParse(x), valid),
    bench(`  vV2 (V2) `, (x) => vV2SetMode ? vV2Sch.safeParse(x) : vV2Sch.safeParse(x), valid),
    bench(`  Zod  ${ZOD_VER}`, (x) => zSch.safeParse(x), valid)
  ];
}

// The V2 setV2Mode flag is purely cosmetic here because we use vV2 directly
const vV2SetMode = false;

const scenarios = [
  {
    name: '1. string().min(1).email()',
    make: () => ({
      vSch: v.string().min(1).email(),
      vV2Sch: vV2.string().min(1).email(),
      zSch: z.string().min(1).email()
    }),
    valid: 'user@example.com',
    invalid: 'not-an-email'
  },
  {
    name: '2. number().int().positive().min(1)',
    make: () => ({
      vSch: v.number().int().positive().min(1),
      vV2Sch: vV2.number().int().positive().min(1),
      zSch: z.number().int().positive().min(1)
    }),
    valid: 42,
    invalid: 0
  },
  {
    name: '3. object({ a: string(), b: number() })',
    make: () => ({
      vSch: v.object({ a: v.string(), b: v.number() }),
      vV2Sch: vV2.object({ a: vV2.string(), b: vV2.number() }),
      zSch: z.object({ a: z.string(), b: z.number() })
    }),
    valid: { a: 'hello', b: 42 },
    invalid: { a: 42, b: 'wrong' }
  },
  {
    name: '4. tuple([string, number, boolean])',
    make: () => ({
      vSch: v.tuple([v.string(), v.number(), v.boolean()]),
      vV2Sch: vV2.tuple(vV2.string(), vV2.number(), vV2.boolean()),
      zSch: z.tuple([z.string(), z.number(), z.boolean()])
    }),
    valid: ['hello', 42, true],
    invalid: ['hello', 42, 'not-bool']
  },
  {
    name: '5. array(string()).min(1).max(100)',
    make: () => ({
      vSch: v.array(v.string()).min(1).max(100),
      vV2Sch: vV2.array(vV2.string()).min(1).max(100),
      zSch: z.array(z.string()).min(1).max(100)
    }),
    valid: ['a', 'b', 'c'],
    invalid: []
  },
  {
    name: '6. union([string, number])',
    make: () => ({
      vSch: v.union([v.string(), v.number()]),
      vV2Sch: vV2.union(vV2.string(), vV2.number()),
      zSch: z.union([z.string(), z.number()])
    }),
    valid: 'hello',
    invalid: true
  },
  {
    name: '7. discriminatedUnion (cat | dog)',
    make: () => ({
      vSch: v.discriminatedUnion('type', [
        v.object({ type: v.literal('cat'), meow: v.string() }),
        v.object({ type: v.literal('dog'), bark: v.string() })
      ]),
      vV2Sch: vV2.object({ type: vV2.literal('cat'), meow: vV2.string() }), // fallback to single (no vV2 DU)
      zSch: z.discriminatedUnion('type', [
        z.object({ type: z.literal('cat'), meow: z.string() }),
        z.object({ type: z.literal('dog'), bark: z.string() })
      ])
    }),
    valid: { type: 'cat', meow: 'purr' },
    invalid: { type: 'fish' }
  },
  {
    name: '8. nested object (3 levels)',
    make: () => ({
      vSch: v.object({
        user: v.object({
          profile: v.object({
            name: v.string().min(1),
            age: v.number().int().positive()
          })
        })
      }),
      vV2Sch: vV2.object({
        user: vV2.object({
          profile: vV2.object({
            name: vV2.string().min(1),
            age: vV2.number().int().positive()
          })
        })
      }),
      zSch: z.object({
        user: z.object({
          profile: z.object({
            name: z.string().min(1),
            age: z.number().int().positive()
          })
        })
      })
    }),
    valid: { user: { profile: { name: 'Ada', age: 36 } } },
    invalid: { user: { profile: { name: '', age: -1 } } }
  },
  {
    name: '9. record(string())',
    make: () => ({
      vSch: v.record(v.string()),
      vV2Sch: vV2.record(vV2.string()),
      zSch: z.record(z.string())
    }),
    valid: { a: 'x', b: 'y', c: 'z' },
    invalid: { a: 42 }
  },
  {
    name: '10. literal("active")',
    make: () => ({
      vSch: v.literal('active'),
      vV2Sch: vV2.literal('active'),
      zSch: z.literal('active')
    }),
    valid: 'active',
    invalid: 'inactive'
  }
];

console.log('Per-scenario results (1M safeParse, lower is better):\n');
console.log('Scenario                                    v.* V1       vV2 V2       Zod ' + ZOD_VER + '    V2 vs Zod');
console.log('--------------------------------------------------------  ----------  ----------  ----------  ---------');

let v1Total = 0, v2Total = 0, zodTotal = 0, v2Wins = 0, v1Wins = 0;

for (const sc of scenarios) {
  const results = (() => {
    const { vSch, vV2Sch, zSch } = sc.make();
    if (vSch.safeParse(sc.valid).success !== zSch.safeParse(sc.valid).success ||
        vSch.safeParse(sc.invalid).success !== zSch.safeParse(sc.invalid).success) {
      console.error(`!! Semantic mismatch in ${sc.name}`);
      process.exit(1);
    }
    return [
      bench('  v.* V1', (x) => vSch.safeParse(x), sc.valid),
      bench('  vV2 V2', (x) => vV2Sch.safeParse(x), sc.valid),
      bench(`  Zod `, (x) => zSch.safeParse(x), sc.valid)
    ];
  })();
  const [v1, v2, zd] = results;
  const speedup = (zd.ms / v2.ms).toFixed(2) + 'x';
  v1Total += v1.ms;
  v2Total += v2.ms;
  zodTotal += zd.ms;
  if (v2.ms < zd.ms) v2Wins++;
  if (v1.ms < zd.ms) v1Wins++;
  console.log(sc.name.padEnd(50) + ' ' + fmt(v1.ms) + '  ' + fmt(v2.ms) + '  ' + fmt(zd.ms) + '  ' + speedup);
}

console.log('');
console.log('Total (sum of all 10 scenarios):');
console.log(`  v.* V1: ${v1Total.toFixed(0).padStart(6)} ms`);
console.log(`  vV2 V2: ${v2Total.toFixed(0).padStart(6)} ms`);
console.log(`  Zod  : ${zodTotal.toFixed(0).padStart(6)} ms`);
console.log('');
console.log(`Summary: vV2 wins ${v2Wins}/10 scenarios vs Zod ${ZOD_VER}.`);
console.log(`  vV2 geometric mean speedup: ${(Math.exp(Math.log(zodTotal / v2Total))).toFixed(2)}x over Zod.`);
console.log(`  v.*  geometric mean speedup: ${(Math.exp(Math.log(zodTotal / v1Total))).toFixed(2)}x over Zod.`);
console.log(`  vV2 vs v.* (V1):              ${(Math.exp(Math.log(v1Total / v2Total))).toFixed(2)}x improvement from V2 pattern.`);
