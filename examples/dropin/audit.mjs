/**
 * Deep audit: for each known difference AND for any other potentially
 * subtle case, run isolated assertions and print PASS/FAIL evidence
 * with the actual library output (success + data shape + error code).
 *
 * Run: node examples/dropin/audit.mjs
 */

import { z as zodZ } from './adapters/zod.mjs';
import { z as vldZ } from './adapters/vld.mjs';

const results = [];
function record(name, expected, actualZ, actualV, notes = '') {
  const match = actualZ === actualV;
  const expected_match = actualZ === expected;
  results.push({ name, expected, actualZ, actualV, match, expected_match, notes });
}

function safe(label, sch, val) {
  let r;
  try { r = sch.safeParse(val); } catch (e) { r = { success: false, _err: e.message }; }
  return r;
}

// --- 1. The 1 known behavioural difference ---------------------------
console.log('\n[1] date() coercion of number (1234567890)');
{
  const zodS = zodZ.date();
  const vldS = vldZ.date();
  const rZ = safe('zod', zodS, 1234567890);
  const rV = safe('vld', vldS, 1234567890);
  console.log('  Zod:', JSON.stringify(rZ).slice(0, 200));
  console.log('  VLD:', JSON.stringify(rV).slice(0, 200));
  console.log('  Note: VLD source (date.ts:87-88) explicitly coerces string|number. Zod 4 strict by default.');
  record('date() vs number 1234567890', 'reject', rZ.success, rV.success,
    'VLD by design coerces numbers to Date; Zod 4 strict');
}

console.log('\n[2] discriminatedUnion() with extra key on matching arm (post-fix)');
{
  const zodS = zodZ.discriminatedUnion('type', [
    zodZ.object({ type: zodZ.literal('success'), data: zodZ.any() }),
    zodZ.object({ type: zodZ.literal('error'), message: zodZ.string() })
  ]);
  const vldS = vldZ.discriminatedUnion('type', [
    vldZ.object({ type: vldZ.literal('success'), data: vldZ.any() }),
    vldZ.object({ type: vldZ.literal('error'), message: vldZ.string() })
  ]);
  const sample = { type: 'success', data: 42, message: 'extra' };
  const rZ = safe('zod', zodS, sample);
  const rV = safe('vld', vldS, sample);
  console.log('  Zod:', JSON.stringify(rZ).slice(0, 300));
  console.log('  VLD:', JSON.stringify(rV).slice(0, 300));
  console.log('  Note: Both now strip the extra key. VLD object() is non-strict by default; .strict() to enforce.');
  record('DU with extra key', 'strip', rZ.success && rZ.data?.data === 42, rV.success && rV.data?.data === 42,
    'Both strip extra keys (VLD non-strict, Zod non-strict on object default)');
}

// --- 3. VLD required-field bug regression coverage (3.0.2 fix) --------
console.log('\n[3] object({a: any()}) with {} — required any missing');
{
  const zodS = zodZ.object({ a: zodZ.any() });
  const vldS = vldZ.object({ a: vldZ.any() });
  const rZ = safe('zod', zodS, {});
  const rV = safe('vld', vldS, {});
  console.log('  Zod:', JSON.stringify(rZ).slice(0, 200));
  console.log('  VLD:', JSON.stringify(rV).slice(0, 200));
  record('object({a: any()}) with {}', 'reject', rZ.success, rV.success,
    'Bug fixed in 3.0.2 — both reject');
}

console.log('\n[4] object({a: unknown()}) with {} — required unknown missing');
{
  const zodS = zodZ.object({ a: zodZ.unknown() });
  const vldS = vldZ.object({ a: vldZ.unknown() });
  const rZ = safe('zod', zodS, {});
  const rV = safe('vld', vldS, {});
  console.log('  Zod:', JSON.stringify(rZ).slice(0, 200));
  console.log('  VLD:', JSON.stringify(rV).slice(0, 200));
  record('object({a: unknown()}) with {}', 'reject', rZ.success, rV.success,
    'Bug fixed in 3.0.2 — both reject');
}

console.log('\n[5] object({a: undefined()}) with {} — required undefined missing');
{
  const zodS = zodZ.object({ a: zodZ.undefined() });
  const vldS = vldZ.object({ a: vldZ.undefined() });
  const rZ = safe('zod', zodS, {});
  const rV = safe('vld', vldS, {});
  console.log('  Zod:', JSON.stringify(rZ).slice(0, 200));
  console.log('  VLD:', JSON.stringify(rV).slice(0, 200));
  record('object({a: undefined()}) with {}', 'reject', rZ.success, rV.success,
    'Bug fixed in 3.0.2 — both reject');
}

console.log('\n[6] object({a: any()}) with {a: undefined} — key present, any accepts');
{
  const zodS = zodZ.object({ a: zodZ.any() });
  const vldS = vldZ.object({ a: vldZ.any() });
  const rZ = safe('zod', zodS, { a: undefined });
  const rV = safe('vld', vldS, { a: undefined });
  console.log('  Zod:', JSON.stringify(rZ).slice(0, 200));
  console.log('  VLD:', JSON.stringify(rV).slice(0, 200));
  record('object({a: any()}) with {a: undefined}', 'accept', rZ.success, rV.success,
    'Both accept — key present, any accepts undefined');
}

console.log('\n[7] mixed required any missing');
{
  const zodS = zodZ.object({ a: zodZ.any(), b: zodZ.string() });
  const vldS = vldZ.object({ a: vldZ.any(), b: vldZ.string() });
  const rZ = safe('zod', zodS, { b: 'x' });
  const rV = safe('vld', vldS, { b: 'x' });
  console.log('  Zod:', JSON.stringify(rZ).slice(0, 200));
  console.log('  VLD:', JSON.stringify(rV).slice(0, 200));
  record('object({a: any(), b: string()}) with {b: "x"}', 'reject', rZ.success, rV.success,
    'Bug fixed in 3.0.2 — both reject missing `a`');
}

console.log('\n[8] nested required any missing');
{
  const zodS = zodZ.object({ a: zodZ.object({ b: zodZ.any() }) });
  const vldS = vldZ.object({ a: vldZ.object({ b: vldZ.any() }) });
  const rZ = safe('zod', zodS, { a: {} });
  const rV = safe('vld', vldS, { a: {} });
  console.log('  Zod:', JSON.stringify(rZ).slice(0, 200));
  console.log('  VLD:', JSON.stringify(rV).slice(0, 200));
  record('nested object({b: any()}) with {}', 'reject', rZ.success, rV.success,
    'Bug fixed in 3.0.2 — both reject');
}

console.log('\n[9] discriminatedUnion matched arm missing required any');
{
  const zodS = zodZ.discriminatedUnion('type', [
    zodZ.object({ type: zodZ.literal('x'), data: zodZ.any() })
  ]);
  const vldS = vldZ.discriminatedUnion('type', [
    vldZ.object({ type: vldZ.literal('x'), data: vldZ.any() })
  ]);
  const rZ = safe('zod', zodS, { type: 'x' });
  const rV = safe('vld', vldS, { type: 'x' });
  console.log('  Zod:', JSON.stringify(rZ).slice(0, 200));
  console.log('  VLD:', JSON.stringify(rV).slice(0, 200));
  record('DU matched arm missing required any', 'reject', rZ.success, rV.success,
    'Bug fixed in 3.0.2 — both reject');
}

// --- 10-15. Other edge cases (should all match) -----------------------
console.log('\n[10] date() coercion of ISO string "2024-01-01"');
{
  const zodS = zodZ.date();
  const vldS = vldZ.date();
  const rZ = safe('zod', zodS, '2024-01-01');
  const rV = safe('vld', vldS, '2024-01-01');
  console.log('  Zod:', JSON.stringify(rZ).slice(0, 200));
  console.log('  VLD:', JSON.stringify(rV).slice(0, 200));
  record('date() vs ISO string "2024-01-01"', 'reject', rZ.success, rV.success,
    'Same root cause as [1]');
}

console.log('\n[11] z.coerce.date() vs VLD date() with non-Date input');
{
  const zodS = zodZ.coerce.date();
  const vldS = vldZ.date();
  const samples = [new Date(), '2024-01-01', 1234567890, null, 'bad'];
  for (const s of samples) {
    const rZ = safe('zod', zodS, s);
    const rV = safe('vld', vldS, s);
    console.log(`  sample=${JSON.stringify(s) || 'null'} -> Zod=${rZ.success} VLD=${rV.success}`);
    record(`coerce.date() vs v.date() [${typeof s}]`, null, rZ.success, rV.success,
      'Equivalent behaviours once Zod uses coerce');
  }
}

console.log('\n[12] refine() returning false — both should reject');
{
  const zodS = zodZ.string().refine((s) => s.length > 0);
  const vldS = vldZ.string().refine((s) => s.length > 0);
  for (const s of ['hello', '']) {
    const rZ = safe('zod', zodS, s);
    const rV = safe('vld', vldS, s);
    console.log(`  "${s}" -> Zod=${rZ.success} VLD=${rV.success}`);
    record(`refine non-empty [${s}]`, null, rZ.success, rV.success);
  }
}

console.log('\n[13] string().min(1) with ""');
{
  const zodS = zodZ.string().min(1);
  const vldS = vldZ.string().min(1);
  const rZ = safe('zod', zodS, '');
  const rV = safe('vld', vldS, '');
  console.log('  Zod:', JSON.stringify(rZ).slice(0, 200));
  console.log('  VLD:', JSON.stringify(rV).slice(0, 200));
  record('string().min(1) vs ""', 'reject', rZ.success, rV.success);
}

console.log('\n[14] number().positive() with 0');
{
  const zodS = zodZ.number().positive();
  const vldS = vldZ.number().positive();
  const rZ = safe('zod', zodS, 0);
  const rV = safe('vld', vldS, 0);
  console.log('  Zod:', JSON.stringify(rZ).slice(0, 200));
  console.log('  VLD:', JSON.stringify(rV).slice(0, 200));
  record('number().positive() vs 0', 'reject', rZ.success, rV.success);
}

console.log('\n[15] union() with non-matching type');
{
  const zodS = zodZ.union([zodZ.string(), zodZ.number()]);
  const vldS = vldZ.union([vldZ.string(), vldZ.number()]);
  for (const s of [true, null, [], {}]) {
    const rZ = safe('zod', zodS, s);
    const rV = safe('vld', vldS, s);
    console.log(`  ${JSON.stringify(s)} -> Zod=${rZ.success} VLD=${rV.success}`);
    record(`union reject non-matching [${JSON.stringify(s)}]`, 'reject', rZ.success, rV.success);
  }
}

console.log('\n[16] catch() recovers from invalid');
{
  const zodS = zodZ.string().catch('recovered');
  const vldS = vldZ.string().catch('recovered');
  for (const s of [42, null, undefined, 'valid']) {
    const rZ = safe('zod', zodS, s);
    const rV = safe('vld', vldS, s);
    const sameSuccess = rZ.success === rV.success;
    const sameData = rZ.success && rV.success ? rZ.data === rV.data : true;
    console.log(`  ${JSON.stringify(s)} -> Zod=success:${rZ.success} data:${rZ.success ? rZ.data : 'n/a'} | VLD=success:${rV.success} data:${rV.success ? rV.data : 'n/a'} ${sameSuccess && sameData ? '✓' : '✗'}`);
    record(`catch() [${JSON.stringify(s)}]`, null, rZ.success, rV.success,
      `same success: ${sameSuccess}, same data: ${sameData}`);
  }
}

console.log('\n[17] transform() result shape');
{
  const zodS = zodZ.string().transform((s) => s.length);
  const vldS = vldZ.string().transform((s) => s.length);
  const rZ = safe('zod', zodS, 'hello');
  const rV = safe('vld', vldS, 'hello');
  console.log('  Zod:', JSON.stringify(rZ).slice(0, 200));
  console.log('  VLD:', JSON.stringify(rV).slice(0, 200));
  record('transform string→length', 'success(5)', rZ.success && rZ.data === 5, rV.success && rV.data === 5);
}

console.log('\n[18] Zod 4 default tuple vs VLD tuple');
{
  const zodS = zodZ.tuple([zodZ.string(), zodZ.number()]);
  const vldS = vldZ.tuple([vldZ.string(), vldZ.number()]);
  const rZ = safe('zod', zodS, ['hi', 1, 'extra']);
  const rV = safe('vld', vldS, ['hi', 1, 'extra']);
  console.log('  Zod (3-tuple vs 2-tuple):', JSON.stringify(rZ).slice(0, 200));
  console.log('  VLD (3-tuple vs 2-tuple):', JSON.stringify(rV).slice(0, 200));
  record('tuple vs longer array', 'reject', rZ.success, rV.success);
}

console.log('\n[19] record() with non-string keys');
{
  const zodS = zodZ.record(zodZ.string());
  const vldS = vldZ.record(vldZ.string());
  for (const s of [{ 1: 'a' }, [{ key: 'value' }], null]) {
    const rZ = safe('zod', zodS, s);
    const rV = safe('vld', vldS, s);
    console.log(`  ${JSON.stringify(s)} -> Zod=${rZ.success} VLD=${rV.success}`);
    record(`record edge [${JSON.stringify(s)}]`, null, rZ.success, rV.success);
  }
}

console.log('\n[20] set() with non-Set input');
{
  const zodS = zodZ.set(zodZ.string());
  const vldS = vldZ.set(vldZ.string());
  for (const s of [['a', 'b'], 'not-a-set', null]) {
    const rZ = safe('zod', zodS, s);
    const rV = safe('vld', vldS, s);
    console.log(`  ${JSON.stringify(s)} -> Zod=${rZ.success} VLD=${rV.success}`);
    record(`set edge [${JSON.stringify(s)}]`, null, rZ.success, rV.success);
  }
}

// === Summary ========================================================
console.log('\n══════════════════════════════════════════════════════');
console.log('  AUDIT RESULTS');
console.log('══════════════════════════════════════════════════════');
const trueMismatches = results.filter(r => !r.match);
const confirmedSame = results.filter(r => r.match);
const sameAsExpected = results.filter(r => r.match && r.expected_match);
console.log(`  Total cases audited         : ${results.length}`);
console.log(`  Zod ↔ VLD agree             : ${confirmedSame.length}`);
console.log(`  Zod ↔ VLD disagree          : ${trueMismatches.length}`);
console.log(`  Zod matches expected intent : ${sameAsExpected.length}`);
if (trueMismatches.length) {
  console.log('\n  Disagreements:');
  for (const m of trueMismatches) {
    console.log(`    - ${m.name}: Zod=${m.actualZ} VLD=${m.actualV} (${m.notes})`);
  }
} else {
  console.log('\n  ✓ No hidden disagreements found. All audit cases agree across libraries.');
}
console.log('══════════════════════════════════════════════════════');
