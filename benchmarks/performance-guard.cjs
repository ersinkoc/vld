/**
 * Fast performance regression guard for CI and local release checks.
 *
 * This script intentionally checks a focused set of hot paths instead of the
 * full benchmark matrix. It fails when VLD loses to Zod on any guarded case or
 * when the average guarded ratio drops below the configured threshold.
 */

const { v } = require('@oxog/vld');
const z = require('zod');

const samples = Number(process.env.VLD_PERF_GUARD_SAMPLES || 5);
const warmupIterations = Number(process.env.VLD_PERF_GUARD_WARMUP || 20000);
const minCaseRatio = Number(process.env.VLD_PERF_GUARD_MIN_CASE_RATIO || 1.2);
const minAverageRatio = Number(process.env.VLD_PERF_GUARD_MIN_AVERAGE_RATIO || 3);

function run(fn, iterations) {
  const start = process.hrtime.bigint();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const elapsedMs = Number(process.hrtime.bigint() - start) / 1000000;
  return (iterations / elapsedMs) * 1000;
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function measure(fn, iterations) {
  run(fn, Math.min(warmupIterations, iterations));
  const values = [];
  for (let i = 0; i < samples; i++) {
    values.push(run(fn, iterations));
  }
  return median(values);
}

function formatOps(ops) {
  if (ops >= 1000000) return `${(ops / 1000000).toFixed(1)}M`;
  if (ops >= 1000) return `${(ops / 1000).toFixed(1)}K`;
  return ops.toFixed(0);
}

function guardedCase(name, iterations, vldFn, zodFn) {
  const vldOps = measure(vldFn, iterations);
  const zodOps = measure(zodFn, iterations);
  const ratio = vldOps / zodOps;
  const passed = ratio >= minCaseRatio;

  console.log(
    `${passed ? 'PASS' : 'FAIL'} ${name}: ` +
      `VLD ${formatOps(vldOps)} ops/sec, ` +
      `Zod ${formatOps(zodOps)} ops/sec, ` +
      `${ratio.toFixed(2)}x`
  );

  return { name, ratio, passed };
}

const vldString = v.string();
const zodString = z.string();
const vldNumber = v.number().positive().int();
const zodNumber = z.number().positive().int();
const vldArray = v.array(v.number());
const zodArray = z.array(z.number());
const testArray = [1, 2, 3, 4, 5];
const vldObject = v.object({ name: v.string(), age: v.number() });
const zodObject = z.object({ name: z.string(), age: z.number() });
const testObject = { name: 'Ada', age: 36 };
const vldUnion = v.union(v.string(), v.number());
const zodUnion = z.union([z.string(), z.number()]);
const vldOptional = v.string().optional();
const zodOptional = z.string().optional();
const vldNullish = v.boolean().nullish();
const zodNullish = z.boolean().nullish();
const vldDiscUnion = v.discriminatedUnion(
  'type',
  v.object({ type: v.literal('user'), name: v.string(), age: v.number() }),
  v.object({ type: v.literal('product'), title: v.string(), price: v.number() })
);
const zodDiscUnion = z.discriminatedUnion('type', [
  z.object({ type: z.literal('user'), name: z.string(), age: z.number() }),
  z.object({ type: z.literal('product'), title: z.string(), price: z.number() })
]);
const discValue = { type: 'product', title: 'Laptop', price: 999 };

console.log('VLD performance guard');
console.log(`Samples: ${samples}; min case ratio: ${minCaseRatio}x; min average ratio: ${minAverageRatio}x`);

const results = [
  guardedCase('simple string parse', 200000, () => vldString.parse('hello'), () => zodString.parse('hello')),
  guardedCase('number positive int parse', 200000, () => vldNumber.parse(42), () => zodNumber.parse(42)),
  guardedCase('array number parse', 100000, () => vldArray.parse(testArray), () => zodArray.parse(testArray)),
  guardedCase('simple object parse', 100000, () => vldObject.parse(testObject), () => zodObject.parse(testObject)),
  guardedCase('union string and number parse', 100000, () => {
    vldUnion.parse('ok');
    vldUnion.parse(42);
  }, () => {
    zodUnion.parse('ok');
    zodUnion.parse(42);
  }),
  guardedCase('optional parse', 100000, () => {
    vldOptional.parse('ok');
    vldOptional.parse(undefined);
  }, () => {
    zodOptional.parse('ok');
    zodOptional.parse(undefined);
  }),
  guardedCase('nullish parse', 100000, () => {
    vldNullish.parse(true);
    vldNullish.parse(undefined);
    vldNullish.parse(null);
  }, () => {
    zodNullish.parse(true);
    zodNullish.parse(undefined);
    zodNullish.parse(null);
  }),
  guardedCase('discriminated union parse', 50000, () => vldDiscUnion.parse(discValue), () => zodDiscUnion.parse(discValue)),
];

const averageRatio = results.reduce((sum, result) => sum + result.ratio, 0) / results.length;
const failedCases = results.filter(result => !result.passed);

console.log(`Average guarded ratio: ${averageRatio.toFixed(2)}x`);

if (failedCases.length > 0 || averageRatio < minAverageRatio) {
  if (failedCases.length > 0) {
    console.error(`Performance guard failed cases: ${failedCases.map(result => result.name).join(', ')}`);
  }
  if (averageRatio < minAverageRatio) {
    console.error(`Average ratio ${averageRatio.toFixed(2)}x is below ${minAverageRatio}x`);
  }
  process.exitCode = 1;
}
