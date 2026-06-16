/**
 * Stable VLD vs Zod benchmark.
 * Runs each case repeatedly and reports median throughput to reduce one-run noise.
 */

const { v } = require('@oxog/vld');
const z = require('zod');

const samples = Number(process.env.VLD_BENCH_SAMPLES || 7);
const warmupIterations = Number(process.env.VLD_BENCH_WARMUP || 10000);

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function run(fn, iterations) {
  const start = process.hrtime.bigint();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const elapsedMs = Number(process.hrtime.bigint() - start) / 1000000;
  return (iterations / elapsedMs) * 1000;
}

async function runAsync(fn, iterations) {
  const start = process.hrtime.bigint();
  for (let i = 0; i < iterations; i++) {
    await fn();
  }
  const elapsedMs = Number(process.hrtime.bigint() - start) / 1000000;
  return (iterations / elapsedMs) * 1000;
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
}

function formatOps(ops) {
  if (ops >= 1000000) return `${(ops / 1000000).toFixed(1)}M`;
  if (ops >= 1000) return `${(ops / 1000).toFixed(1)}K`;
  return ops.toFixed(0);
}

function measure(fn, iterations) {
  run(fn, warmupIterations);

  const values = [];
  for (let i = 0; i < samples; i++) {
    values.push(run(fn, iterations));
  }

  return {
    median: median(values),
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

async function measureAsync(fn, iterations) {
  await runAsync(fn, Math.min(warmupIterations, iterations));

  const values = [];
  for (let i = 0; i < samples; i++) {
    values.push(await runAsync(fn, iterations));
  }

  return {
    median: median(values),
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

function compare(index, name, vldFn, zodFn, iterations = 100000) {
  const vldResult = measure(vldFn, iterations);
  const zodResult = measure(zodFn, iterations);
  const ratio = vldResult.median / zodResult.median;

  console.log(`\n${colors.cyan}${index}. ${name}${colors.reset}`);
  console.log(`  VLD median: ${colors.green}${formatOps(vldResult.median)}${colors.reset} ops/sec`);
  console.log(`  Zod median: ${colors.yellow}${formatOps(zodResult.median)}${colors.reset} ops/sec`);
  console.log(`  ${ratio >= 1 ? colors.green : colors.yellow}${ratio >= 1 ? 'VLD' : 'Zod'} is ${(ratio >= 1 ? ratio : 1 / ratio).toFixed(2)}x faster${colors.reset}`);

  return {
    name,
    vldOps: vldResult.median,
    zodOps: zodResult.median,
    ratio,
  };
}

async function compareAsync(index, name, vldFn, zodFn, iterations = 10000) {
  const vldResult = await measureAsync(vldFn, iterations);
  const zodResult = await measureAsync(zodFn, iterations);
  const ratio = vldResult.median / zodResult.median;

  console.log(`\n${colors.cyan}${index}. ${name}${colors.reset}`);
  console.log(`  VLD median: ${colors.green}${formatOps(vldResult.median)}${colors.reset} ops/sec`);
  console.log(`  Zod median: ${colors.yellow}${formatOps(zodResult.median)}${colors.reset} ops/sec`);
  console.log(`  ${ratio >= 1 ? colors.green : colors.yellow}${ratio >= 1 ? 'VLD' : 'Zod'} is ${(ratio >= 1 ? ratio : 1 / ratio).toFixed(2)}x faster${colors.reset}`);

  return {
    name,
    vldOps: vldResult.median,
    zodOps: zodResult.median,
    ratio,
  };
}

const vldString = v.string();
const zodString = z.string();
const vldEmail = v.string().email();
const zodEmail = z.string().email();
const vldTopLevelEmail = v.email();
const zodTopLevelEmail = z.email();
const vldNumber = v.number().positive().int();
const zodNumber = z.number().positive().int();
const vldObject = v.object({ name: v.string(), age: v.number() });
const zodObject = z.object({ name: z.string(), age: z.number() });
const testObj = { name: 'John', age: 30 };
const vldComplex = v.object({
  id: v.string(),
  user: v.object({
    name: v.string(),
    email: v.string().email(),
    age: v.number().positive(),
  }),
  tags: v.array(v.string()),
});
const zodComplex = z.object({
  id: z.string(),
  user: z.object({
    name: z.string(),
    email: z.string().email(),
    age: z.number().positive(),
  }),
  tags: z.array(z.string()),
});
const complexObj = {
  id: '123',
  user: { name: 'John Doe', email: 'john@example.com', age: 30 },
  tags: ['developer', 'nodejs'],
};
const vldArray = v.array(v.number());
const zodArray = z.array(z.number());
const testArray = [1, 2, 3, 4, 5];
const vldUnion = v.union(v.string(), v.number());
const zodUnion = z.union([z.string(), z.number()]);
const vldOptional = v.string().optional();
const zodOptional = z.string().optional();
const vldNullable = v.number().nullable();
const zodNullable = z.number().nullable();
const vldNullish = v.boolean().nullish();
const zodNullish = z.boolean().nullish();
const vldDefault = v.string().default('fallback');
const zodDefault = z.string().default('fallback');
const vldCatch = v.string().catch('fallback');
const zodCatch = z.string().catch('fallback');
const vldCoerce = v.coerce.number();
const zodCoerce = z.coerce.number();
const vldEnum = v.enum('admin', 'user', 'guest', 'moderator');
const zodEnum = z.enum(['admin', 'user', 'guest', 'moderator']);
const vldDiscUnion = v.discriminatedUnion(
  'type',
  v.object({ type: v.literal('user'), name: v.string(), age: v.number() }),
  v.object({ type: v.literal('product'), title: v.string(), price: v.number() }),
  v.object({ type: v.literal('order'), orderId: v.string(), total: v.number() })
);
const zodDiscUnion = z.discriminatedUnion('type', [
  z.object({ type: z.literal('user'), name: z.string(), age: z.number() }),
  z.object({ type: z.literal('product'), title: z.string(), price: z.number() }),
  z.object({ type: z.literal('order'), orderId: z.string(), total: z.number() }),
]);
const discTestData = { type: 'product', title: 'Laptop', price: 999 };
const vldTuple = v.tuple(v.string(), v.number(), v.boolean());
const zodTuple = z.tuple([z.string(), z.number(), z.boolean()]);
const tupleTestData = ['hello', 123, true];
const vldRecord = v.record(v.number());
const zodRecord = z.record(z.string(), z.number());
const recordTestData = { a: 1, b: 2, c: 3 };
const vldSet = v.set(v.string());
const zodSet = z.set(z.string());
const setTestData = new Set(['a', 'b', 'c']);
const vldMap = v.map(v.string(), v.number());
const zodMap = z.map(z.string(), z.number());
const mapTestData = new Map([['a', 1], ['b', 2], ['c', 3]]);
const vldBigInt = v.bigint().positive();
const zodBigInt = z.bigint().positive();
const vldDate = v.date();
const zodDate = z.date();
const dateTestData = new Date('2026-01-01T00:00:00.000Z');
const symbolTestData = Symbol('token');
const vldSymbol = v.symbol();
const zodSymbol = z.symbol();
const vldAny = v.any();
const zodAny = z.any();
const vldUnknown = v.unknown();
const zodUnknown = z.unknown();
const functionTestData = () => 'ok';
const vldFunction = v.function();
const zodFunction = z.function();
const vldStringBool = v.stringbool();
const zodStringBool = z.stringbool();
const vldPromise = v.promise(v.string());
const zodPromise = z.promise(z.string());
const vldTemplateLiteral = v.templateLiteral('id-', v.number());
const zodTemplateLiteral = z.templateLiteral(['id-', z.number()]);

console.log(`${colors.bright}${colors.blue}===================================================================${colors.reset}`);
console.log(`${colors.bright}               Stable VLD vs Zod Performance Benchmark${colors.reset}`);
console.log(`${colors.bright}${colors.blue}===================================================================${colors.reset}`);
console.log(`Samples per case: ${samples}; warmup iterations: ${warmupIterations}`);

const results = [
  compare(1, 'Simple String Validation', () => vldString.parse('hello world'), () => zodString.parse('hello world')),
  compare(2, 'Email Validation', () => vldEmail.parse('test@example.com'), () => zodEmail.parse('test@example.com')),
  compare(3, 'Top-level Email Format', () => vldTopLevelEmail.parse('test@example.com'), () => zodTopLevelEmail.parse('test@example.com')),
  compare(4, 'StringBool Validation', () => {
    vldStringBool.parse('enabled');
    vldStringBool.parse('disabled');
  }, () => {
    zodStringBool.parse('enabled');
    zodStringBool.parse('disabled');
  }, 50000),
  compare(5, 'Number Validation', () => vldNumber.parse(42), () => zodNumber.parse(42)),
  compare(6, 'Simple Object Validation', () => vldObject.parse(testObj), () => zodObject.parse(testObj), 50000),
  compare(7, 'Complex Object Validation', () => vldComplex.parse(complexObj), () => zodComplex.parse(complexObj), 25000),
  compare(8, 'Array Validation', () => vldArray.parse(testArray), () => zodArray.parse(testArray), 50000),
  compare(9, 'Union Type Validation', () => {
    vldUnion.parse('test');
    vldUnion.parse(42);
  }, () => {
    zodUnion.parse('test');
    zodUnion.parse(42);
  }, 50000),
  compare(10, 'Optional Validation', () => {
    vldOptional.parse('test');
    vldOptional.parse(undefined);
  }, () => {
    zodOptional.parse('test');
    zodOptional.parse(undefined);
  }, 50000),
  compare(11, 'Nullable Validation', () => {
    vldNullable.parse(42);
    vldNullable.parse(null);
  }, () => {
    zodNullable.parse(42);
    zodNullable.parse(null);
  }, 50000),
  compare(12, 'Nullish Validation', () => {
    vldNullish.parse(true);
    vldNullish.parse(undefined);
    vldNullish.parse(null);
  }, () => {
    zodNullish.parse(true);
    zodNullish.parse(undefined);
    zodNullish.parse(null);
  }, 50000),
  compare(13, 'Default Validation', () => {
    vldDefault.parse('test');
    vldDefault.parse(undefined);
  }, () => {
    zodDefault.parse('test');
    zodDefault.parse(undefined);
  }, 50000),
  compare(14, 'Catch Validation', () => {
    vldCatch.parse('test');
    vldCatch.parse(123);
  }, () => {
    zodCatch.parse('test');
    zodCatch.parse(123);
  }, 50000),
  compare(15, 'SafeParse (no throw)', () => vldString.safeParse('test'), () => zodString.safeParse('test')),
  compare(16, 'Type Coercion', () => vldCoerce.parse('42'), () => zodCoerce.parse('42'), 50000),
  compare(17, 'Enum Validation', () => vldEnum.parse('user'), () => zodEnum.parse('user'), 50000),
  compare(18, 'Discriminated Union', () => vldDiscUnion.parse(discTestData), () => zodDiscUnion.parse(discTestData), 25000),
  compare(19, 'Tuple Validation', () => vldTuple.parse(tupleTestData), () => zodTuple.parse(tupleTestData), 50000),
  compare(20, 'Record Validation', () => vldRecord.parse(recordTestData), () => zodRecord.parse(recordTestData), 50000),
  compare(21, 'Set Validation', () => vldSet.parse(setTestData), () => zodSet.parse(setTestData), 50000),
  compare(22, 'Map Validation', () => vldMap.parse(mapTestData), () => zodMap.parse(mapTestData), 50000),
  compare(23, 'BigInt Validation', () => vldBigInt.parse(42n), () => zodBigInt.parse(42n), 50000),
  compare(24, 'Date Validation', () => vldDate.parse(dateTestData), () => zodDate.parse(dateTestData), 50000),
  compare(25, 'Symbol Validation', () => vldSymbol.parse(symbolTestData), () => zodSymbol.parse(symbolTestData), 5000000),
  compare(26, 'Any Validation', () => vldAny.parse(testObj), () => zodAny.parse(testObj), 5000000),
  compare(27, 'Unknown Validation', () => vldUnknown.parse(testObj), () => zodUnknown.parse(testObj), 5000000),
  compare(28, 'Function Validation', () => vldFunction.parse(functionTestData), () => zodFunction.parse(functionTestData), 5000000),
  compare(29, 'Template Literal Validation', () => vldTemplateLiteral.parse('id-42'), () => zodTemplateLiteral.parse('id-42'), 50000),
];

(async () => {
  results.push(await compareAsync(
    30,
    'Promise Async Validation',
    () => vldPromise.parseAsync(Promise.resolve('ok')),
    () => zodPromise.parseAsync(Promise.resolve('ok')),
    10000
  ));

  const vldWins = results.filter(result => result.ratio > 1).length;
  const zodWins = results.length - vldWins;
  const averageRatio = results.reduce((sum, result) => sum + (result.ratio >= 1 ? result.ratio : 1 / result.ratio), 0) / results.length;

  console.log(`\n${colors.bright}${colors.blue}===================================================================${colors.reset}`);
  console.log(`${colors.bright}                           SUMMARY${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}===================================================================${colors.reset}\n`);
  console.log(`  ${colors.green}VLD won: ${vldWins}/${results.length} tests${colors.reset}`);
  console.log(`  ${colors.yellow}Zod won: ${zodWins}/${results.length} tests${colors.reset}`);
  console.log(`  ${colors.magenta}Average median performance ratio: ${averageRatio.toFixed(2)}x${colors.reset}`);

  if (vldWins !== results.length) {
    process.exitCode = 1;
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
