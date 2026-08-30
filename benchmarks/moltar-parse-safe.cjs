/**
 * VLD vs Zod (with z.compile())  -  Moltar ParseSafe benchmark
 *
 * Reproduces the Moltar ParseSafe scenario in-process:
 *   - Schema: nested object with primitives and a nested object
 *   - Input: a fixed payload that all libraries validate
 *   - Behaviour: strip unknown keys; throw on missing/invalid attributes
 *
 * Compares:
 *   1. VLD runtime parse
 *   2. VLD compiled parse (via v.compile / v.validate)
 *   3. Zod 4.5 runtime parse
 *   4. Zod 4.5 compiled parse (via z.compile / z.validate)  -  this is the
 *      "fastest schema library on the Moltar ParseSafe benchmark" that the
 *      Zod creator references in the 4.5 release post
 *
 * Each library is warmed up to remove JIT noise, then the median over 11
 * runs of N iterations is reported alongside ops/sec.
 */
'use strict';

const { v: vld, z: vldZ } = require('../dist/cjs/index.cjs');
const { z, compile: zCompile } = require('zod');

const validateData = Object.freeze({
  number: 1,
  negNumber: -1,
  maxNumber: Number.MAX_VALUE,
  string: 'string',
  longString:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  boolean: true,
  deeplyNested: {
    foo: 'bar',
    num: 1,
    bool: false,
  },
});

// ============================================================================
// Schema construction (VLD + Zod, mirroring Moltar ParseSafe)
// ============================================================================

const vldSchema = vld.object({
  number: vld.number(),
  negNumber: vld.number(),
  maxNumber: vld.number(),
  string: vld.string(),
  longString: vld.string(),
  boolean: vld.boolean(),
  deeplyNested: vld.object({
    foo: vld.string(),
    num: vld.number(),
    bool: vld.boolean(),
  }),
});

const zodSchema = z.object({
  number: z.number(),
  negNumber: z.number(),
  maxNumber: z.number(),
  string: z.string(),
  longString: z.string(),
  boolean: z.boolean(),
  deeplyNested: z.object({
    foo: z.string(),
    num: z.number(),
    bool: z.boolean(),
  }),
});

const vldCompiled = vld.compile(vldSchema);
const zodCompiled = zCompile(zodSchema);

// ============================================================================
// Functional equivalence smoke test
// ============================================================================

function smoke() {
  // Both must accept validateData exactly
  const v1 = vld.parse(vldSchema, validateData);
  const v2 = vld.parse(vldCompiled, validateData);
  const v3 = zodSchema.parse(validateData);
  const v4 = zodCompiled.parse(validateData);
  if (JSON.stringify(v1) !== JSON.stringify(validateData)) throw new Error('VLD runtime mismatch');
  if (JSON.stringify(v2) !== JSON.stringify(validateData)) throw new Error('VLD compiled mismatch');
  if (JSON.stringify(v3) !== JSON.stringify(validateData)) throw new Error('Zod runtime mismatch');
  if (JSON.stringify(v4) !== JSON.stringify(validateData)) throw new Error('Zod compiled mismatch');
  // Strip unknown keys
  const extra = { ...validateData, extraAttribute: 'foo' };
  const v1e = vld.parse(vldSchema, extra);
  const v4e = zodCompiled.parse(extra);
  if (v1e.extraAttribute !== undefined) throw new Error('VLD did not strip extra key');
  if (v4e.extraAttribute !== undefined) throw new Error('Zod compiled did not strip extra key');
  // Throw on missing
  const missing = { ...validateData };
  delete missing.number;
  let vldThrew = false;
  let zodThrew = false;
  try { vld.parse(vldSchema, missing); } catch { vldThrew = true; }
  try { zodCompiled.parse(missing); } catch { zodThrew = true; }
  if (!vldThrew || !zodThrew) throw new Error('Missing-attribute throw check failed');
  console.log('Functional equivalence: VLD (compiled) == Zod (compiled) [OK]');
}

smoke();

// ============================================================================
// Benchmark harness
// ============================================================================

const ITER = Number(process.env.ITER || 200000);
const RUNS = Number(process.env.RUNS || 11);
const WARMUP = Math.max(20000, Math.floor(ITER / 5));

function median(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const n = sorted.length;
  if (n % 2) return sorted[(n - 1) / 2];
  return (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
}

function runBench(name, fn) {
  // Warmup
  for (let i = 0; i < WARMUP; i++) fn();
  // Collect samples
  const samples = [];
  for (let r = 0; r < RUNS; r++) {
    const start = process.hrtime.bigint();
    for (let i = 0; i < ITER; i++) fn();
    const end = process.hrtime.bigint();
    samples.push(Number(end - start) / 1e6);
  }
  const med = median(samples);
  const ops = (ITER / med) * 1000;
  return { name, medianMs: med, opsPerSec: ops, samples };
}

// ============================================================================
// Run the benchmark
// ============================================================================

console.log(`\n--- Moltar ParseSafe benchmark (Node.js ${process.version}, ${ITER.toLocaleString()} iters, median of ${RUNS} runs) ---\n`);

const results = [
  runBench('VLD  (uncompiled parse)',     () => vld.parse(vldSchema, validateData)),
  runBench('VLD  (compiled   parse)',     () => vld.parse(vldCompiled, validateData)),
  runBench('VLD  (compiled   validate)',  () => vld.validate(vldCompiled, validateData)),
  runBench('Zod  (uncompiled parse)',     () => zodSchema.parse(validateData)),
  runBench('Zod  (compiled   parse)',     () => zodCompiled.parse(validateData)),
  runBench('Zod  (compiled   validate)',  () => z.validate(zodCompiled, validateData)),
];

// Print results
const maxName = Math.max(...results.map((r) => r.name.length));
const maxOps = Math.max(...results.map((r) => r.opsPerSec));
for (const r of results) {
  const bar = '#'.repeat(Math.round((r.opsPerSec / maxOps) * 40));
  const ms = r.medianMs.toFixed(2).padStart(7);
  const ops = r.opsPerSec.toLocaleString(undefined, { maximumFractionDigits: 0 }).padStart(12);
  console.log(`${r.name.padEnd(maxName)}  ${ms} ms  ${ops} ops/s  ${bar}`);
}

// Comparative ratio vs Zod compiled parse
const zodCompiledParseOps = results.find((r) => r.name === 'Zod  (compiled   parse)').opsPerSec;
console.log('\n--- Speedup vs Zod (compiled parse) ---');
for (const r of results) {
  const ratio = r.opsPerSec / zodCompiledParseOps;
  const flag = ratio > 1 ? '[OK] faster' : ratio < 1 ? '[!] slower' : '  equal  ';
  console.log(`${r.name.padEnd(maxName)}  ${flag}  ${ratio.toFixed(2)}x`);
}
