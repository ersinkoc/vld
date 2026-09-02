/**
 * Parity test runner — runs every (schema, sample) pair from
 * examples/dropin/schemas/*.mjs through both libraries and asserts
 * identical accept/reject decisions.
 *
 * Exits 0 if the common-subset of cases match, 1 if any common-case
 * mismatch is found. Edge-case differences are surfaced in the report
 * but do not fail the run — see REPORT.md.
 *
 * Run: node examples/dropin/tests/run-parity.mjs
 */

import { z as zodZ, version as zodV } from '../adapters/zod.mjs';
import { z as vldZ, version as vldV } from '../adapters/vld.mjs';

import { primitiveSchemas } from '../schemas/primitives.mjs';
import { structureSchemas } from '../schemas/structures.mjs';
import { unionSchemas } from '../schemas/unions.mjs';
import { refinementSchemas } from '../schemas/refinements.mjs';
import { compositeSchemas } from '../schemas/composite.mjs';

const all = [
  ['primitives',  primitiveSchemas],
  ['structures',  structureSchemas],
  ['unions',      unionSchemas],
  ['refinements', refinementSchemas],
  ['composite',   compositeSchemas]
];

// Cases where libraries intentionally differ. They are surfaced in the
// report, not treated as failures.
//
// 1. date() coercion: VLD by design coerces string|number to Date. This is
//    similar to Zod's `z.coerce.date()`. Use `z.coerce.date()` in Zod or
//    rely on VLD's default to get equivalent behavior.
//
// 2. Required-field enforcement on any/unknown/undefined (3.0.1 → 3.0.2):
//    Bug fixed. VLD now correctly rejects missing required fields of these
//    types. Previously VLD silently accepted them.
const KNOWN_DIFFERENCES = new Set([
  'date()::1234567890'
]);
const VLD_BUGS = new Set([
  // (none — all previously-flagged bugs were fixed in 3.0.2)
]);

function key(name, sample) { return name + '::' + safeStringify(sample); }

const stats = { total: 0, matched: 0, mismatched: 0, knownDiff: 0, vldBugs: 0, category: {}, libs: { zod: zodV, vld: vldV } };
const mismatches = [];

function safeStringify(x, depth = 0) {
  if (depth > 4) return '…';
  if (x === null) return 'null';
  if (x === undefined) return 'undefined';
  if (typeof x === 'bigint') return x.toString() + 'n';
  if (typeof x === 'function') return '[fn]';
  if (typeof x === 'symbol') return x.toString();
  if (x instanceof Date) { try { return x.toISOString(); } catch { return 'Invalid Date'; } }
  if (x instanceof Set) return 'Set(' + x.size + ')';
  if (x instanceof Map) return 'Map(' + x.size + ')';
  if (Array.isArray(x)) {
    if (x.length > 6) return '[' + x.slice(0, 6).map((v) => safeStringify(v, depth + 1)).join(',') + ',…+' + (x.length - 6) + ']';
    return '[' + x.map((v) => safeStringify(v, depth + 1)).join(',') + ']';
  }
  if (typeof x === 'object') {
    const keys = Object.keys(x);
    if (keys.length > 6) {
      return '{' + keys.slice(0, 6).map((k) => k + ':' + safeStringify(x[k], depth + 1)).join(',') + ',…+' + (keys.length - 6) + '}';
    }
    return '{' + keys.map((k) => k + ':' + safeStringify(x[k], depth + 1)).join(',') + '}';
  }
  return JSON.stringify(x);
}

function compare(label, def, sample) {
  stats.total++;
  const z = zodZ;
  const v = vldZ;
  let zRes, vRes;
  try { zRes = def.make(z).safeParse(sample); } catch (e) { zRes = { success: false, _err: e.message }; }
  try { vRes = def.make(v).safeParse(sample); } catch (e) { vRes = { success: false, _err: e.message }; }

  const zOk = zRes.success;
  const vOk = vRes.success;
  const k = key(label, sample);
  if (zOk === vOk) {
    stats.matched++;
  } else if (KNOWN_DIFFERENCES.has(k)) {
    stats.knownDiff++;
    mismatches.push({ label, sample, zod: zOk, vld: vOk, zErr: zRes._err, vErr: vRes._err, known: true, bug: false });
  } else if (VLD_BUGS.has(k)) {
    stats.vldBugs++;
    mismatches.push({ label, sample, zod: zOk, vld: vOk, zErr: zRes._err, vErr: vRes._err, known: true, bug: true });
  } else {
    stats.mismatched++;
    mismatches.push({ label, sample, zod: zOk, vld: vOk, zErr: zRes._err, vErr: vRes._err, known: false, bug: false });
  }
  return { zOk, vOk };
}

let totalCases = 0;
for (const [catName, list] of all) {
  stats.category[catName] = { cases: 0, mismatches: 0 };
  console.log(`\n── ${catName.toUpperCase()} ──`);
  for (const def of list) {
    let catMismatches = 0;
    for (const sample of def.samples) {
      const r = compare(`${def.name}`, def, sample);
      stats.category[catName].cases++;
      totalCases++;
      if (r.zOk !== r.vOk) catMismatches++;
      const mark = r.zOk === r.vOk ? '✓' : '✗';
      const summary = safeStringify(sample).slice(0, 60);
      console.log(`  ${mark} ${def.name.padEnd(38)} sample=${summary.padEnd(60)} Zod=${r.zOk} VLD=${r.vOk}`);
    }
    stats.category[catName].mismatches = catMismatches;
  }
}

console.log('\n══════════════════════════════════════════════════════');
console.log(` Parity summary`);
console.log('══════════════════════════════════════════════════════');
console.log(` Zod  : ${stats.libs.zod}`);
console.log(` VLD  : ${stats.libs.vld}`);
console.log(` Total (schema, sample) cases : ${stats.total}`);
console.log(` Matched                      : ${stats.matched}`);
console.log(` Known behavioral differences: ${stats.knownDiff}`);
console.log(` VLD bugs surfaced            : ${stats.vldBugs}`);
console.log(` Unexpected mismatches        : ${stats.mismatched}`);
for (const [cat, c] of Object.entries(stats.category)) {
  console.log(`   • ${cat.padEnd(12)} ${c.cases} cases, ${c.mismatches} mismatches`);
}

if (mismatches.length) {
  console.log('\n Mismatch details:');
  for (const m of mismatches) {
    const tag = m.bug ? '[VLD BUG]' : (m.known ? '[known diff]' : '[UNEXPECTED]');
    console.log(`  ${tag} ${m.label}`);
    console.log(`      sample: ${safeStringify(m.sample).slice(0, 80)}`);
    console.log(`      Zod : success=${m.zod}${m.zErr ? ' err=' + m.zErr : ''}`);
    console.log(`      VLD : success=${m.vld}${m.vErr ? ' err=' + m.vErr : ''}`);
  }
}

const unexpected = mismatches.filter(m => !m.known);
if (unexpected.length) {
  console.log(`\n✗ ${unexpected.length} UNEXPECTED mismatches found.`);
  process.exit(1);
}

const pct = ((stats.matched / stats.total) * 100).toFixed(1);
console.log(`\n✓ ${stats.matched}/${stats.total} cases (${pct}%) match exactly.`);
console.log(`  ${stats.knownDiff} are documented behavioral differences.`);
console.log(`  ${stats.vldBugs} surface VLD bugs that should be fixed (see audit.mjs).`);
