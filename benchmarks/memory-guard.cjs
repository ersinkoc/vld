/**
 * Memory and allocation regression guard.
 *
 * Each sample runs in a fresh Node.js process with --expose-gc so heap deltas are
 * comparable and require cache effects do not leak between VLD and Zod.
 */

const { execFileSync } = require('child_process');

const samples = Number(process.env.VLD_MEMORY_GUARD_SAMPLES || 3);
const minTotalMemoryRatio = Number(process.env.VLD_MEMORY_GUARD_MIN_TOTAL_RATIO || 2);
const minTotalSpeedRatio = Number(process.env.VLD_MEMORY_GUARD_MIN_SPEED_RATIO || 1.5);
const minCaseSpeedRatio = Number(process.env.VLD_MEMORY_GUARD_MIN_CASE_SPEED_RATIO || 1.1);
const minCaseMemoryRatio = Number(process.env.VLD_MEMORY_GUARD_MIN_CASE_MEMORY_RATIO || 0.95);

const cases = [
  { name: 'string email parse', iterations: 10000 },
  { name: 'complex object parse', iterations: 10000 },
  { name: 'large array parse', iterations: 1000 },
  { name: 'union parse', iterations: 10000 },
  { name: 'schema creation', iterations: 1000 },
];

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MiB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${bytes.toFixed(0)} B`;
}

function measurePackage(packageName) {
  const script = `
const { performance } = require('perf_hooks');
const lib = require(${JSON.stringify(packageName)});
const isZod = ${JSON.stringify(packageName)} === 'zod';
const api = isZod ? lib : lib.v;

function forceGc() {
  if (typeof global.gc === 'function') {
    global.gc();
    global.gc();
  }
}

function measure(name, iterations, setup) {
  const fn = setup();
  forceGc();
  const startHeap = process.memoryUsage().heapUsed;
  const start = performance.now();
  const results = [];
  for (let i = 0; i < iterations; i++) {
    results.push(fn());
  }
  const elapsedMs = performance.now() - start;
  forceGc();
  const heapUsed = Math.max(process.memoryUsage().heapUsed - startHeap, 1);
  return {
    name,
    heapUsed,
    memoryPerOp: heapUsed / iterations,
    opsPerSecond: (iterations / elapsedMs) * 1000,
    retainedResults: results.length
  };
}

const cases = [
  measure('string email parse', 10000, () => {
    const schema = api.string().email();
    return () => schema.parse('test@example.com');
  }),
  measure('complex object parse', 10000, () => {
    const schema = api.object({
      id: api.string().uuid(),
      name: api.string().min(2).max(100),
      email: api.string().email(),
      age: api.number().positive().int(),
      tags: api.array(api.string()),
      metadata: api.object({
        created: api.date(),
        updated: api.date(),
        active: api.boolean()
      })
    });
    const value = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'John Doe',
      email: 'john@example.com',
      age: 30,
      tags: ['developer', 'nodejs', 'typescript'],
      metadata: {
        created: new Date('2026-01-01T00:00:00.000Z'),
        updated: new Date('2026-01-02T00:00:00.000Z'),
        active: true
      }
    };
    return () => schema.parse(value);
  }),
  measure('large array parse', 1000, () => {
    const schema = api.array(api.number().positive());
    const value = Array.from({ length: 1000 }, (_, i) => i + 1);
    return () => schema.parse(value);
  }),
  measure('union parse', 10000, () => {
    const members = [
      api.string(),
      api.number(),
      api.boolean(),
      api.object({ type: api.literal('custom'), value: api.any() })
    ];
    const schema = isZod ? api.union(members) : api.union(...members);
    return () => {
      schema.parse('test');
      schema.parse(42);
      schema.parse(true);
      schema.parse({ type: 'custom', value: 'data' });
      return true;
    };
  }),
  measure('schema creation', 1000, () => () => api.object({
    id: api.string(),
    name: api.string(),
    age: api.number(),
    email: api.string().email(),
    active: api.boolean()
  }))
];

console.log(JSON.stringify(cases));
`;

  return JSON.parse(execFileSync(process.execPath, ['--expose-gc', '-e', script], {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }));
}

function summarize(packageName) {
  const runs = [];
  for (let i = 0; i < samples; i++) {
    runs.push(measurePackage(packageName));
  }

  return cases.map((testCase, index) => {
    const values = runs.map((run) => run[index]);
    return {
      name: testCase.name,
      heapUsed: median(values.map((value) => value.heapUsed)),
      memoryPerOp: median(values.map((value) => value.memoryPerOp)),
      opsPerSecond: median(values.map((value) => value.opsPerSecond)),
    };
  });
}

const vld = summarize('@oxog/vld');
const zod = summarize('zod');

const totals = {
  vldHeap: vld.reduce((sum, result) => sum + result.heapUsed, 0),
  zodHeap: zod.reduce((sum, result) => sum + result.heapUsed, 0),
  vldOps: vld.reduce((sum, result) => sum + result.opsPerSecond, 0),
  zodOps: zod.reduce((sum, result) => sum + result.opsPerSecond, 0),
};

const totalMemoryRatio = totals.zodHeap / totals.vldHeap;
const totalSpeedRatio = totals.vldOps / totals.zodOps;

console.log('VLD memory guard');
console.log(
  `Samples: ${samples}; min total memory ratio: ${minTotalMemoryRatio}x; ` +
    `min total speed ratio: ${minTotalSpeedRatio}x; ` +
    `min case speed ratio: ${minCaseSpeedRatio}x; min case memory ratio: ${minCaseMemoryRatio}x`
);

const failures = [];

for (let i = 0; i < cases.length; i++) {
  const memoryRatio = zod[i].heapUsed / vld[i].heapUsed;
  const speedRatio = vld[i].opsPerSecond / zod[i].opsPerSecond;
  const passed = speedRatio >= minCaseSpeedRatio && memoryRatio >= minCaseMemoryRatio;
  console.log(
    `${passed ? 'PASS' : 'FAIL'} ${cases[i].name}: ` +
      `VLD ${formatBytes(vld[i].heapUsed)} heap, ${vld[i].opsPerSecond.toFixed(0)} ops/sec; ` +
      `Zod ${formatBytes(zod[i].heapUsed)} heap, ${zod[i].opsPerSecond.toFixed(0)} ops/sec; ` +
      `${memoryRatio.toFixed(2)}x memory, ${speedRatio.toFixed(2)}x speed`
  );
  if (speedRatio < minCaseSpeedRatio) {
    failures.push(`${cases[i].name} speed ratio ${speedRatio.toFixed(2)}x is below ${minCaseSpeedRatio}x`);
  }
  if (memoryRatio < minCaseMemoryRatio) {
    failures.push(`${cases[i].name} memory ratio ${memoryRatio.toFixed(2)}x is below ${minCaseMemoryRatio}x`);
  }
}

console.log(
  `Total ratios: ${totalMemoryRatio.toFixed(2)}x less retained heap, ` +
    `${totalSpeedRatio.toFixed(2)}x aggregate speed`
);

if (totalMemoryRatio < minTotalMemoryRatio) {
  failures.push(`total memory ratio ${totalMemoryRatio.toFixed(2)}x is below ${minTotalMemoryRatio}x`);
}
if (totalSpeedRatio < minTotalSpeedRatio) {
  failures.push(`total speed ratio ${totalSpeedRatio.toFixed(2)}x is below ${minTotalSpeedRatio}x`);
}

if (failures.length > 0) {
  console.error('Memory guard failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
}
