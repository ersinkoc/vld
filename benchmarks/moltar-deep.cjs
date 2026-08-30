/**
 * Deep Moltar ParseSafe benchmark  -  VLD vs Zod across multiple schema
 * shapes (small object, large object, nested array, deep object, union,
 * discriminated union, tuple) and both `parse` and `validate` paths.
 *
 * This is the "honest report" benchmark: each cell is the median of 11
 * timed runs of N iterations, with WARMUP iterations of warmup. The full
 * data lands in `benchmarks/.temp_files/moltar-deep.json` so the report
 * can be reproduced verbatim.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { v: vld } = require('../dist/cjs/index.cjs');
const { z, compile: zCompile } = require('zod');

const ITER = Number(process.env.ITER || 100000);
const RUNS = Number(process.env.RUNS || 11);
const WARMUP = Math.max(20000, Math.floor(ITER / 5));

const validateData = {
  number: 1, negNumber: -1, maxNumber: Number.MAX_VALUE,
  string: 'string',
  longString: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  boolean: true,
  deeplyNested: { foo: 'bar', num: 1, bool: false }
};

// ============================================================================
// Schema shapes
// ============================================================================

const SHAPES = {
  // Moltar ParseSafe
  moltarParseSafe: {
    vld: vld.object({
      number: vld.number(),
      negNumber: vld.number(),
      maxNumber: vld.number(),
      string: vld.string(),
      longString: vld.string(),
      boolean: vld.boolean(),
      deeplyNested: vld.object({ foo: vld.string(), num: vld.number(), bool: vld.boolean() }),
    }),
    zod: z.object({
      number: z.number(),
      negNumber: z.number(),
      maxNumber: z.number(),
      string: z.string(),
      longString: z.string(),
      boolean: z.boolean(),
      deeplyNested: z.object({ foo: z.string(), num: z.number(), bool: z.boolean() }),
    }),
    sample: validateData
  },
  // 20-key object
  wideObject: (() => {
    const vldShape = {}; const zodShape = {};
    const sample = {};
    for (let i = 0; i < 20; i++) {
      vldShape[`f${i}`] = vld.number();
      zodShape[`f${i}`] = z.number();
      sample[`f${i}`] = i;
    }
    return { vld: vld.object(vldShape), zod: z.object(zodShape), sample };
  })(),
  // Array of 100 objects
  arrayOfObjects: (() => {
    const obj = vld.object({ id: vld.string(), n: vld.number(), active: vld.boolean() });
    const zObj = z.object({ id: z.string(), n: z.number(), active: z.boolean() });
    const sample = [];
    for (let i = 0; i < 100; i++) sample.push({ id: `id_${i}`, n: i, active: i % 2 === 0 });
    return { vld: vld.array(obj), zod: z.array(zObj), sample };
  })(),
  // 5-item tuple of mixed types
  tuple: {
    vld: vld.tuple([vld.string(), vld.number(), vld.boolean(), vld.string(), vld.number()]),
    zod: z.tuple([z.string(), z.number(), z.boolean(), z.string(), z.number()]),
    sample: ['x', 1, true, 'y', 2]
  },
  // Union of 3 types
  union: {
    vld: vld.union([vld.string(), vld.number(), vld.boolean()]),
    zod: z.union([z.string(), z.number(), z.boolean()]),
    sample: 42
  },
  // Nested object (3 levels)
  nested: {
    vld: vld.object({
      level1: vld.object({
        level2: vld.object({
          level3: vld.object({
            a: vld.string(), b: vld.number(), c: vld.boolean()
          })
        })
      })
    }),
    zod: z.object({
      level1: z.object({
        level2: z.object({
          level3: z.object({
            a: z.string(), b: z.number(), c: z.boolean()
          })
        })
      })
    }),
    sample: { level1: { level2: { level3: { a: 'x', b: 1, c: true } } } }
  }
};

// ============================================================================
// Benchmark harness
// ============================================================================

function median(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const n = sorted.length;
  if (n % 2) return sorted[(n - 1) / 2];
  return (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
}

function runBench(fn) {
  for (let i = 0; i < WARMUP; i++) fn();
  const samples = [];
  for (let r = 0; r < RUNS; r++) {
    const start = process.hrtime.bigint();
    for (let i = 0; i < ITER; i++) fn();
    const end = process.hrtime.bigint();
    samples.push(Number(end - start) / 1e6);
  }
  const med = median(samples);
  return { medianMs: med, opsPerSec: (ITER / med) * 1000 };
}

// ============================================================================
// Run
// ============================================================================

const results = {};
for (const [name, shape] of Object.entries(SHAPES)) {
  const vldCompiled = vld.compile(shape.vld);
  const zodCompiled = zCompile(shape.zod);
  const cell = {
    vldUncompiledParse: runBench(() => vld.parse(shape.vld, shape.sample)),
    vldCompiledParse:   runBench(() => vld.parse(vldCompiled, shape.sample)),
    vldCompiledValidate:runBench(() => vld.validate(vldCompiled, shape.sample)),
    zodUncompiledParse: runBench(() => shape.zod.parse(shape.sample)),
    zodCompiledParse:   runBench(() => zodCompiled.parse(shape.sample)),
    zodCompiledValidate:runBench(() => z.validate(zodCompiled, shape.sample)),
  };
  results[name] = cell;
}

const outPath = path.join(__dirname, '.temp_files', 'moltar-deep.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify({ ITER, RUNS, WARMUP, results }, null, 2));

// Print
console.log(`\n=== Moltar ParseSafe deep benchmark (Node.js ${process.version}, ${ITER.toLocaleString()} iters/run, median of ${RUNS}) ===\n`);
for (const [name, cell] of Object.entries(results)) {
  console.log(`\n  ${name}`);
  console.log('  ' + '-'.repeat(78));
  const maxOps = Math.max(...Object.values(cell).map((r) => r.opsPerSec));
  const rows = [
    ['VLD uncompiled parse',  cell.vldUncompiledParse],
    ['VLD compiled   parse',  cell.vldCompiledParse],
    ['VLD compiled   validate',cell.vldCompiledValidate],
    ['Zod uncompiled parse',  cell.zodUncompiledParse],
    ['Zod compiled   parse',  cell.zodCompiledParse],
    ['Zod compiled   validate',cell.zodCompiledValidate],
  ];
  for (const [label, r] of rows) {
    const bar = '#'.repeat(Math.round((r.opsPerSec / maxOps) * 30));
    const ms = r.medianMs.toFixed(2).padStart(7);
    const ops = r.opsPerSec.toLocaleString(undefined, { maximumFractionDigits: 0 }).padStart(13);
    console.log(`  ${label.padEnd(28)} ${ms} ms  ${ops} ops/s  ${bar}`);
  }
  const zodC = cell.zodCompiledParse.opsPerSec;
  const vldC = cell.vldCompiledParse.opsPerSec;
  const ratio = (vldC / zodC).toFixed(2);
  const flag = vldC > zodC ? '[OK]' : '[!]';
  console.log(`  ${flag} VLD compile / Zod compile: ${ratio}x`);
}

console.log('\nWrote', outPath);
