/**
 * VLD v3.0 - `.validate()` benchmark vs Zod 4.6
 *
 * Zod 4.6 introduced boolean `.validate()` as its fastest validation path.
 * This benchmark compares the same call on both libraries across realistic
 * schema shapes, alongside `.safeParse()` as the baseline.
 *
 * Guard: vld `.validate()` must beat zod `.validate()` on every scenario,
 * otherwise the process exits 1. Run after `npm run build`.
 *
 * Run: node benchmarks/validate-vs-zod.cjs
 */

const v = require('../dist/index.js');
const { z } = require('zod');

const ITER = 500_000;
const RUNS = 15;
const WARMUP = 10_000;
const ZOD_VER = require('zod/package.json').version;
const VLD_VER = require('../package.json').version;

function median(arr) {
  const sorted = arr.slice().sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function bench(fn, input) {
  for (let i = 0; i < WARMUP; i++) fn(input);
  const samples = [];
  for (let r = 0; r < RUNS; r++) {
    const start = process.hrtime.bigint();
    for (let i = 0; i < ITER; i++) fn(input);
    const end = process.hrtime.bigint();
    samples.push(Number(end - start) / 1_000_000);
  }
  return median(samples);
}

// ---------------------------------------------------------------------------
// Scenarios: same logical schema in both libraries.
// ---------------------------------------------------------------------------

const scenarios = [];

// 1. String with chained checks
{
  const vSch = v.z.string().min(3).max(64).regex(/^[a-z0-9_-]+$/);
  const zSch = z.string().min(3).max(64).regex(/^[a-z0-9_-]+$/);
  scenarios.push({
    name: 'string(min/max/regex)',
    input: 'user_name_42',
    vSafe: (d) => vSch.safeParse(d),
    zSafe: (d) => zSch.safeParse(d),
    vValidate: (d) => vSch.validate(d),
    zValidate: (d) => zSch.validate(d),
  });
}

// 2. Wide flat object (12 fields) - the shape where result-object overhead dominates
{
  const fields = ['a','b','c','d','e','f','g','h','i','j','k','l'];
  const vShape = {};
  const zShape = {};
  for (const f of fields) {
    vShape[f] = v.z.string().min(1).max(50);
    zShape[f] = z.string().min(1).max(50);
  }
  const vSch = v.z.object(vShape);
  const zSch = z.object(zShape);
  const input = {};
  for (const f of fields) input[f] = `value_${f}`;
  scenarios.push({
    name: 'wide object (12 string fields)',
    input,
    vSafe: (d) => vSch.safeParse(d),
    zSafe: (d) => zSch.safeParse(d),
    vValidate: (d) => vSch.validate(d),
    zValidate: (d) => zSch.validate(d),
  });
}

// 3. Nested object (3 levels)
{
  const vSch = v.z.object({
    user: v.z.object({
      profile: v.z.object({
        name: v.z.string(),
        age: v.z.number().int().min(0).max(130),
        email: v.z.string().email(),
      }),
      tags: v.z.array(v.z.string()).max(10),
    }),
    active: v.z.boolean(),
  });
  const zSch = z.object({
    user: z.object({
      profile: z.object({
        name: z.string(),
        age: z.number().int().min(0).max(130),
        email: z.string().email(),
      }),
      tags: z.array(z.string()).max(10),
    }),
    active: z.boolean(),
  });
  const input = {
    user: {
      profile: { name: 'ada', age: 36, email: 'ada@example.com' },
      tags: ['math', 'computing'],
    },
    active: true,
  };
  scenarios.push({
    name: 'nested object (3 levels)',
    input,
    vSafe: (d) => vSch.safeParse(d),
    zSafe: (d) => zSch.safeParse(d),
    vValidate: (d) => vSch.validate(d),
    zValidate: (d) => zSch.validate(d),
  });
}

// 4. Array of 50 objects
{
  const vItem = v.z.object({ id: v.z.number().int(), name: v.z.string() });
  const zItem = z.object({ id: z.number().int(), name: z.string() });
  const vSch = v.z.array(vItem).max(100);
  const zSch = z.array(zItem).max(100);
  const input = Array.from({ length: 50 }, (_, i) => ({ id: i, name: `item_${i}` }));
  scenarios.push({
    name: 'array of 50 objects',
    input,
    vSafe: (d) => vSch.safeParse(d),
    zSafe: (d) => zSch.safeParse(d),
    vValidate: (d) => vSch.validate(d),
    zValidate: (d) => zSch.validate(d),
  });
}

// 5. Optional-heavy config object
{
  const vSch = v.z.object({
    host: v.z.string().default('localhost'),
    port: v.z.number().int().min(1).max(65535).default(8080),
    debug: v.z.boolean().optional(),
    retries: v.z.number().int().min(0).optional(),
    ca: v.z.string().optional(),
    timeout: v.z.number().optional(),
  });
  const zSch = z.object({
    host: z.string().default('localhost'),
    port: z.number().int().min(1).max(65535).default(8080),
    debug: z.boolean().optional(),
    retries: z.number().int().min(0).optional(),
    ca: z.string().optional(),
    timeout: z.number().optional(),
  });
  const input = { host: 'example.com', port: 443 };
  scenarios.push({
    name: 'config object (defaults/optionals)',
    input,
    vSafe: (d) => vSch.safeParse(d),
    zSafe: (d) => zSch.safeParse(d),
    vValidate: (d) => vSch.validate(d),
    zValidate: (d) => zSch.validate(d),
  });
}

// 6. IBAN format (new in Zod 4.6)
{
  const vSch = v.z.iban();
  const zSch = z.iban();
  const input = 'GB82WEST12345698765432';
  scenarios.push({
    name: 'iban checksum',
    input,
    vSafe: (d) => vSch.safeParse(d),
    zSafe: (d) => zSch.safeParse(d),
    vValidate: (d) => vSch.validate(d),
    zValidate: (d) => zSch.validate(d),
  });
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

console.log(`VLD ${VLD_VER}  vs  Zod ${ZOD_VER} - .validate() benchmark`);
console.log(`Node ${process.version}, ${process.platform} ${process.arch}`);
console.log(`${ITER.toLocaleString()} ops x ${RUNS} runs, median, ${WARMUP} warmup\n`);

const header = [
  'scenario'.padEnd(34),
  'zod safeParse'.padStart(14),
  'vld safeParse'.padStart(14),
  'x'.padStart(5),
  'zod validate'.padStart(14),
  'vld validate'.padStart(14),
  'x'.padStart(5),
].join('  ');
console.log(header);
console.log('-'.repeat(header.length + 4));

let failures = 0;
for (const s of scenarios) {
  const zSafe = bench(s.zSafe, s.input);
  const vSafe = bench(s.vSafe, s.input);
  const zVal = bench(s.zValidate, s.input);
  const vVal = bench(s.vValidate, s.input);

  // Sanity: both libraries must agree on acceptance.
  const zOk = s.zValidate(s.input) === true;
  const vOk = s.vValidate(s.input) === true;
  if (zOk !== vOk) {
    console.error(`MISMATCH on ${s.name}: zod=${zOk} vld=${vOk}`);
    failures++;
  }

  const safeRatio = zSafe / vSafe;
  const valRatio = zVal / vVal;
  if (!(valRatio >= 1)) failures++;

  console.log(
    [
      s.name.padEnd(34),
      `${zSafe.toFixed(2)} ms`.padStart(14),
      `${vSafe.toFixed(2)} ms`.padStart(14),
      `${safeRatio.toFixed(1)}x`.padStart(5),
      `${zVal.toFixed(2)} ms`.padStart(14),
      `${vVal.toFixed(2)} ms`.padStart(14),
      `${valRatio.toFixed(1)}x`.padStart(5),
    ].join('  ')
  );
}

console.log('');
if (failures > 0) {
  console.error(`GUARD FAILED: ${failures} scenario(s) slower than zod or mismatched`);
  process.exit(1);
}
console.log('GUARD PASSED: vld .validate() is faster than zod .validate() on every scenario');
