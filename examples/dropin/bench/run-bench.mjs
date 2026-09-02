/**
 * Comparative benchmark — same schemas, same inputs, both libraries.
 *
 * For each scenario, we run 1M safeParse calls per library. The number
 * reported is the median of 21 timed runs after 10k warmup ops.
 *
 * Outputs a JSON file at examples/dropin/bench/result.json and a human
 * readable table on stdout.
 *
 * Run: node examples/dropin/bench/run-bench.mjs
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { z as zodZ, version as zodV } from '../adapters/zod.mjs';
import { z as vldZ, version as vldV } from '../adapters/vld.mjs';

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

// Scenarios: each one runs the same logical schema in both libraries.
const scenarios = [
  {
    name: 'string().min(1).email()',
    make: () => ({ z: zodZ.string().min(1).email(), v: vldZ.string().min(1).email() }),
    input: 'user@example.com'
  },
  {
    name: 'number().int().positive().min(1)',
    make: () => ({ z: zodZ.number().int().positive().min(1), v: vldZ.number().int().positive().min(1) }),
    input: 42
  },
  {
    name: 'object({ a: string, b: number })',
    make: () => ({ z: zodZ.object({ a: zodZ.string(), b: zodZ.number() }), v: vldZ.object({ a: vldZ.string(), b: vldZ.number() }) }),
    input: { a: 'hello', b: 42 }
  },
  {
    name: 'tuple([string, number, boolean])',
    make: () => ({ z: zodZ.tuple([zodZ.string(), zodZ.number(), zodZ.boolean()]), v: vldZ.tuple([vldZ.string(), vldZ.number(), vldZ.boolean()]) }),
    input: ['hello', 42, true]
  },
  {
    name: 'array(string).min(1).max(100)',
    make: () => ({ z: zodZ.array(zodZ.string()).min(1).max(100), v: vldZ.array(vldZ.string()).min(1).max(100) }),
    input: ['a', 'b', 'c', 'd', 'e']
  },
  {
    name: 'union([string, number])',
    make: () => ({ z: zodZ.union([zodZ.string(), zodZ.number()]), v: vldZ.union([vldZ.string(), vldZ.number()]) }),
    input: 'hello'
  },
  {
    name: 'discriminatedUnion (cat | dog)',
    make: () => ({
      z: zodZ.discriminatedUnion('kind', [
        zodZ.object({ kind: zodZ.literal('cat'), meow: zodZ.string() }),
        zodZ.object({ kind: zodZ.literal('dog'), bark: zodZ.string() })
      ]),
      v: vldZ.discriminatedUnion('kind', [
        vldZ.object({ kind: vldZ.literal('cat'), meow: vldZ.string() }),
        vldZ.object({ kind: vldZ.literal('dog'), bark: vldZ.string() })
      ])
    }),
    input: { kind: 'cat', meow: 'purr' }
  },
  {
    name: 'nested object (3 levels)',
    make: () => {
      const zUser = zodZ.object({ user: zodZ.object({ profile: zodZ.object({ name: zodZ.string().min(1), age: zodZ.number().int().positive() }) }) });
      const vUser = vldZ.object({ user: vldZ.object({ profile: vldZ.object({ name: vldZ.string().min(1), age: vldZ.number().int().positive() }) }) });
      return { z: zUser, v: vUser };
    },
    input: { user: { profile: { name: 'Ada', age: 36 } } }
  },
  {
    name: 'record(string)',
    make: () => ({ z: zodZ.record(zodZ.string()), v: vldZ.record(vldZ.string()) }),
    input: { a: 'x', b: 'y', c: 'z' }
  },
  {
    name: 'literal("active")',
    make: () => ({ z: zodZ.literal('active'), v: vldZ.literal('active') }),
    input: 'active'
  },
  {
    name: 'composite (User with nested address + array)',
    make: () => {
      const zS = zodZ.object({
        id: zodZ.string().uuid(),
        email: zodZ.string().email(),
        age: zodZ.number().int().min(0).max(150),
        role: zodZ.enum(['admin', 'user', 'guest']),
        isActive: zodZ.boolean(),
        tags: zodZ.array(zodZ.string()).default([]),
        address: zodZ.object({ street: zodZ.string().min(1), city: zodZ.string().min(1), zip: zodZ.string().regex(/^\d{5}$/) }).optional()
      });
      const vS = vldZ.object({
        id: vldZ.string().uuid(),
        email: vldZ.string().email(),
        age: vldZ.number().int().min(0).max(150),
        role: vldZ.enum(['admin', 'user', 'guest']),
        isActive: vldZ.boolean(),
        tags: vldZ.array(vldZ.string()).default([]),
        address: vldZ.object({ street: vldZ.string().min(1), city: vldZ.string().min(1), zip: vldZ.string().regex(/^\d{5}$/) }).optional()
      });
      return { z: zS, v: vS };
    },
    input: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'ada@lovelace.dev',
      age: 36,
      role: 'admin',
      isActive: true,
      address: { street: '1 St James Sq', city: 'London', zip: '12345' }
    }
  }
];

console.log('VLD vs Zod — Drop-in Benchmark');
console.log('================================');
console.log(`Node ${process.version} on ${process.platform} ${process.arch}`);
console.log(`Zod ${zodV.replace('zod@', '')}  vs  VLD ${vldV.replace('@oxog/vld@', '')}`);
console.log(`${ITER.toLocaleString()} safeParse ops, ${RUNS} runs median, ${WARMUP} warmup\n`);

const results = [];
let zTotal = 0, vTotal = 0;

console.log('Scenario' .padEnd(58) + '   Zod (ms)   VLD (ms)   VLD/Zod');
console.log('─'.repeat(86));

for (const sc of scenarios) {
  const { z, v } = sc.make();
  // Sanity: both should accept the input
  if (!z.safeParse(sc.input).success || !v.safeParse(sc.input).success) {
    console.error(`!! Input rejected by one library in scenario "${sc.name}". Skipping.`);
    continue;
  }
  const rZ = bench('zod', (x) => z.safeParse(x), sc.input);
  const rV = bench('vld', (x) => v.safeParse(x), sc.input);
  zTotal += rZ.ms;
  vTotal += rV.ms;
  const ratio = (rZ.ms / rV.ms).toFixed(2) + 'x';
  results.push({ name: sc.name, zod_ms: rZ.ms, vld_ms: rV.ms, speedup: rZ.ms / rV.ms });
  console.log(sc.name.padEnd(58) + '  ' + fmt(rZ.ms) + '  ' + fmt(rV.ms) + '  ' + ratio.padStart(7));
}

console.log('─'.repeat(86));
console.log('Total'.padEnd(58) + '  ' + fmt(zTotal) + '  ' + fmt(vTotal) + '  ' + (zTotal / vTotal).toFixed(2) + 'x');
console.log('\nVLD wins ' + results.filter(r => r.speedup > 1).length + ' / ' + results.length + ' scenarios.');
console.log('Geometric mean speedup of VLD over Zod: ' + Math.exp(results.reduce((a, r) => a + Math.log(r.speedup), 0) / results.length).toFixed(2) + 'x');

// Persist for the report writer
const here = dirname(fileURLToPath(import.meta.url));
const out = {
  zod_version: zodV,
  vld_version: vldV,
  node: process.version,
  iter: ITER,
  runs: RUNS,
  warmup: WARMUP,
  zod_total_ms: zTotal,
  vld_total_ms: vTotal,
  geometric_mean_speedup: Math.exp(results.reduce((a, r) => a + Math.log(r.speedup), 0) / results.length),
  results
};
mkdirSync(here, { recursive: true });
writeFileSync(here + '/result.json', JSON.stringify(out, null, 2));
console.log(`\nJSON results written to ${here}/result.json`);
