/**
 * VLD 3.0.4 — Targeted audit suite.
 *
 * After the 3.0.2 required-field fix, this script's job is no longer
 * to discover new bugs (it was used for that during 3.0.1 → 3.0.2
 * development). It is now a *regression coverage* guard that
 * exercises the small set of edge cases that the broad 267-case
 * parity test does not stress.
 *
 * Three categories:
 *
 *   [1] Known behavioral difference (date() numeric coercion)
 *   [2] DU/required-field regression cases fixed in 3.0.2
 *   [3] Other parity edge cases that should match in both libraries
 *
 * Run:  node examples/dropin/audit.mjs
 * Pass: Zod and VLD disagree only on the [1] known diffs.
 * Fail: any Zod/VLD disagreement in [2] or [3] is a regression.
 */

import { z as zodZ, version as zodV } from './adapters/zod.mjs';
import { z as vldZ, version as vldV } from './adapters/vld.mjs';

const results = { passed: 0, knownDiff: 0, failed: 0, total: 0 };
const failures = [];

function safe(sch, val) {
  let r;
  try { r = sch.safeParse(val); } catch (e) { r = { success: false, _err: e.message }; }
  return r;
}

function check(label, kind, expect, zodOk, vldOk, notes = '') {
  results.total++;
  const matched = zodOk === vldOk;
  // expect is 'accept' (true), 'reject' (false), or null (only matched matters)
  const expectedBool = expect === 'accept' ? true : expect === 'reject' ? false : null;
  const asExpected = expectedBool === null ? matched : (zodOk === expectedBool && vldOk === expectedBool);
  if (kind === 'knownDiff') {
    if (!matched) {
      results.knownDiff++;
      console.log(`  [known] ${label}  Zod=${zodOk} VLD=${vldOk}  ${notes}`);
    } else {
      results.passed++;
    }
    return;
  }
  if (matched && asExpected) {
    results.passed++;
    console.log(`  ✓  ${label}  Zod=${zodOk} VLD=${vldOk}`);
  } else {
    results.failed++;
    failures.push({ label, zodOk, vldOk, expect, notes });
    console.log(`  ✗  ${label}  Zod=${zodOk} VLD=${vldOk}  expected=${expect}  ${notes}`);
  }
}

const section = (n, t) => console.log(`\n[${n}] ${t}`);

// ─── 1. Known behavioral difference ──────────────────────────────
section(1, 'Known behavioral difference (date() coercion)');
{
  const zodS = zodZ.date();
  const vldS = vldZ.date();
  for (const sample of [1234567890, '2024-01-01']) {
    const rZ = safe(zodS, sample);
    const rV = safe(vldS, sample);
    check(`date() vs ${JSON.stringify(sample)}`, 'knownDiff', 'reject',
      rZ.success, rV.success,
      'VLD coerces by design; Zod 4 strict; use z.coerce.date() for parity');
  }
}

// ─── 2. Required-field regression coverage (3.0.2 fix) ───────────
section(2, 'Required-field enforcement (fixed in 3.0.2, must stay fixed)');
{
  const cases = [
    { label: 'object({a: any()}) with {}', zod: () => zodZ.object({ a: zodZ.any() }), vld: () => vldZ.object({ a: vldZ.any() }), sample: {}, expect: 'reject' },
    { label: 'object({a: unknown()}) with {}', zod: () => zodZ.object({ a: zodZ.unknown() }), vld: () => vldZ.object({ a: vldZ.unknown() }), sample: {}, expect: 'reject' },
    { label: 'object({a: undefined()}) with {}', zod: () => zodZ.object({ a: zodZ.undefined() }), vld: () => vldZ.object({ a: vldZ.undefined() }), sample: {}, expect: 'reject' },
    { label: 'object({a: any()}) with {a: undefined}', zod: () => zodZ.object({ a: zodZ.any() }), vld: () => vldZ.object({ a: vldZ.any() }), sample: { a: undefined }, expect: 'accept' },
    { label: 'object({a: any(), b: string()}) with {b: "x"}', zod: () => zodZ.object({ a: zodZ.any(), b: zodZ.string() }), vld: () => vldZ.object({ a: vldZ.any(), b: vldZ.string() }), sample: { b: 'x' }, expect: 'reject' },
    { label: 'object({a: object({b: any()})}) with {a: {}}', zod: () => zodZ.object({ a: zodZ.object({ b: zodZ.any() }) }), vld: () => vldZ.object({ a: vldZ.object({ b: vldZ.any() }) }), sample: { a: {} }, expect: 'reject' },
    { label: 'DU arm with missing required any', zod: () => zodZ.discriminatedUnion('type', [zodZ.object({ type: zodZ.literal('x'), data: zodZ.any() })]), vld: () => vldZ.discriminatedUnion('type', [vldZ.object({ type: vldZ.literal('x'), data: vldZ.any() })]), sample: { type: 'x' }, expect: 'reject' }
  ];
  for (const c of cases) {
    const rZ = safe(c.zod(), c.sample);
    const rV = safe(c.vld(), c.sample);
    check(c.label, 'expect', c.expect, rZ.success, rV.success, '3.0.2 fix');
  }
}

// ─── 3. Other parity edge cases (must match) ─────────────────────
section(3, 'Other parity edge cases (must match)');
{
  const cases = [
    { label: 'string().min(1) with ""', zod: () => zodZ.string().min(1), vld: () => vldZ.string().min(1), sample: '', expect: 'reject' },
    { label: 'number().positive() with 0', zod: () => zodZ.number().positive(), vld: () => vldZ.number().positive(), sample: 0, expect: 'reject' },
    { label: 'union() with true (not string|number)', zod: () => zodZ.union([zodZ.string(), zodZ.number()]), vld: () => vldZ.union([vldZ.string(), vldZ.number()]), sample: true, expect: 'reject' },
    { label: 'refine() returning false rejects', zod: () => zodZ.string().refine((s) => s.length > 0), vld: () => vldZ.string().refine((s) => s.length > 0), sample: '', expect: 'reject' },
    { label: 'catch() recovers from invalid (number→"recovered")', zod: () => zodZ.string().catch('recovered'), vld: () => vldZ.string().catch('recovered'), sample: 42, expect: 'accept' },
    { label: 'transform(string→length) result shape', zod: () => zodZ.string().transform((s) => s.length), vld: () => vldZ.string().transform((s) => s.length), sample: 'hello', expect: 'accept' },
    { label: 'tuple length mismatch', zod: () => zodZ.tuple([zodZ.string(), zodZ.number()]), vld: () => vldZ.tuple([vldZ.string(), vldZ.number()]), sample: ['a', 1, 2], expect: 'reject' },
    { label: 'set() with non-Set input', zod: () => zodZ.set(zodZ.string()), vld: () => vldZ.set(vldZ.string()), sample: ['a', 'b'], expect: 'reject' }
  ];
  for (const c of cases) {
    const rZ = safe(c.zod(), c.sample);
    const rV = safe(c.vld(), c.sample);
    check(c.label, 'expect', c.expect, rZ.success, rV.success);
  }
}

console.log(`\n${'═'.repeat(60)}`);
console.log(`  Zod  : ${zodV}`);
console.log(`  VLD  : ${vldV}`);
console.log(`  Total cases     : ${results.total}`);
console.log(`  Passed          : ${results.passed}`);
console.log(`  Known diffs     : ${results.knownDiff}`);
console.log(`  Failed          : ${results.failed}`);

if (results.failed > 0) {
  console.log(`\n  ✗ ${results.failed} regression(s) detected:`);
  for (const f of failures) console.log(`    - ${f.label}  Zod=${f.zodOk} VLD=${f.vldOk} expected=${f.expect}  ${f.notes}`);
  process.exit(1);
}

console.log(`\n  ✓ No regressions. ${results.passed} parity cases pass; ${results.knownDiff} are documented known differences.`);
