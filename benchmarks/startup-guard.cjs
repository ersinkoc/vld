/**
 * Startup regression guard.
 *
 * Runs each library in fresh Node.js processes so require cache and import
 * ordering do not hide startup regressions.
 */

const { execFileSync } = require('child_process');

const samples = Number(process.env.VLD_STARTUP_GUARD_SAMPLES || 5);
const warmupIterations = Number(process.env.VLD_STARTUP_GUARD_WARMUP || 200);
const measuredIterations = Number(process.env.VLD_STARTUP_GUARD_ITERATIONS || 2000);
// Cold import/total startup timing is dominated by filesystem and module
// resolution variance, which differs sharply across platforms (e.g. VLD's many
// locale chunks read slower under Windows/NTFS + AV than on CI Linux, landing at
// rough parity with Zod). These ratio floors are therefore set conservatively so
// the gate passes cross-platform; the warm-parse ratio below remains the
// meaningful runtime-performance guarantee.
const minImportRatio = Number(process.env.VLD_STARTUP_GUARD_MIN_IMPORT_RATIO || 0.85);
const minTotalRatio = Number(process.env.VLD_STARTUP_GUARD_MIN_TOTAL_RATIO || 0.9);
const minWarmRatio = Number(process.env.VLD_STARTUP_GUARD_MIN_WARM_RATIO || 1.25);

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function measurePackage(packageName) {
  const script = `
const { performance } = require('perf_hooks');
const importStart = performance.now();
const lib = require(${JSON.stringify(packageName)});
const importMs = performance.now() - importStart;
const api = ${JSON.stringify(packageName)} === 'zod' ? lib : lib.v;
const schemaStart = performance.now();
const schema = api.object({
  id: api.string().uuid(),
  name: api.string().min(2).max(100),
  email: api.string().email(),
  age: api.number().positive().int(),
  active: api.boolean(),
  tags: api.array(api.string()),
  metadata: api.object({})
});
const schemaMs = performance.now() - schemaStart;
const data = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
  active: true,
  tags: ['developer', 'nodejs'],
  metadata: {}
};
const firstStart = performance.now();
schema.parse(data);
const firstMs = performance.now() - firstStart;
for (let i = 0; i < ${warmupIterations}; i++) schema.parse(data);
const warmStart = performance.now();
for (let i = 0; i < ${measuredIterations}; i++) schema.parse(data);
const warmMs = (performance.now() - warmStart) / ${measuredIterations};
console.log(JSON.stringify({
  importMs,
  schemaMs,
  firstMs,
  warmMs,
  totalMs: importMs + schemaMs + firstMs
}));
`;

  return JSON.parse(execFileSync(process.execPath, ['-e', script], {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }));
}

function measureSamples(packageName) {
  const values = [];
  for (let i = 0; i < samples; i++) {
    values.push(measurePackage(packageName));
  }
  return {
    importMs: median(values.map((value) => value.importMs)),
    schemaMs: median(values.map((value) => value.schemaMs)),
    firstMs: median(values.map((value) => value.firstMs)),
    warmMs: median(values.map((value) => value.warmMs)),
    totalMs: median(values.map((value) => value.totalMs)),
  };
}

function formatMs(ms) {
  return `${ms.toFixed(3)}ms`;
}

const vld = measureSamples('@oxog/vld');
const zod = measureSamples('zod');

const importRatio = zod.importMs / vld.importMs;
const totalRatio = zod.totalMs / vld.totalMs;
const warmRatio = zod.warmMs / vld.warmMs;

console.log('VLD startup guard');
console.log(`Samples: ${samples}; min import ratio: ${minImportRatio}x; min total ratio: ${minTotalRatio}x; min warm ratio: ${minWarmRatio}x`);
console.log(`VLD import ${formatMs(vld.importMs)}, schema ${formatMs(vld.schemaMs)}, first parse ${formatMs(vld.firstMs)}, warm parse ${formatMs(vld.warmMs)}, total ${formatMs(vld.totalMs)}`);
console.log(`Zod import ${formatMs(zod.importMs)}, schema ${formatMs(zod.schemaMs)}, first parse ${formatMs(zod.firstMs)}, warm parse ${formatMs(zod.warmMs)}, total ${formatMs(zod.totalMs)}`);
console.log(`Ratios: import ${importRatio.toFixed(2)}x, total ${totalRatio.toFixed(2)}x, warm ${warmRatio.toFixed(2)}x`);

const failures = [];
if (importRatio < minImportRatio) {
  failures.push(`import ratio ${importRatio.toFixed(2)}x is below ${minImportRatio}x`);
}
if (totalRatio < minTotalRatio) {
  failures.push(`total startup ratio ${totalRatio.toFixed(2)}x is below ${minTotalRatio}x`);
}
if (warmRatio < minWarmRatio) {
  failures.push(`warm parse ratio ${warmRatio.toFixed(2)}x is below ${minWarmRatio}x`);
}

if (failures.length > 0) {
  console.error('Startup guard failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
}
