import { z as vldZ } from './adapters/vld.mjs';

console.log('Verifying VLD bug fix:\n');
const checks = [
  ['v.object({a: any()}) with {}', vldZ.object({ a: vldZ.any() }), {}, false],
  ['v.object({a: unknown()}) with {}', vldZ.object({ a: vldZ.unknown() }), {}, false],
  ['v.object({a: undefined()}) with {}', vldZ.object({ a: vldZ.undefined() }), {}, false],
  ['v.object({a: any(), b: string()}) with {b: "x"}', vldZ.object({ a: vldZ.any(), b: vldZ.string() }), { b: 'x' }, false],
  ['nested v.object({a: object({b: any()})}) with {a: {}}', vldZ.object({ a: vldZ.object({ b: vldZ.any() }) }), { a: {} }, false],
  ['DU: matched arm, data missing', vldZ.discriminatedUnion('type', [
    vldZ.object({ type: vldZ.literal('x'), data: vldZ.any() })
  ]), { type: 'x' }, false],

  // Sanity: these should still WORK correctly
  ['v.object({a: any()}) with {a: undefined}', vldZ.object({ a: vldZ.any() }), { a: undefined }, true],
  ['v.object({a: any()}) with {a: 42}', vldZ.object({ a: vldZ.any() }), { a: 42 }, true],
  ['v.object({a: any().optional()}) with {}', vldZ.object({ a: vldZ.any().optional() }), {}, true],
  ['v.object({a: undefined()}) with {a: undefined}', vldZ.object({ a: vldZ.undefined() }), { a: undefined }, true],
  ['v.object({a: string()}) with {}', vldZ.object({ a: vldZ.string() }), {}, false],
];

let failures = 0;
for (const [label, schema, sample, expected] of checks) {
  const r = schema.safeParse(sample);
  const actual = r.success;
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(`  ${ok ? '✓' : '✗ FAIL'}  ${label.padEnd(60)} expected=${expected} actual=${actual}`);
}
console.log(`\n${failures === 0 ? '✓ All 11 cases pass.' : '✗ ' + failures + ' failures.'}`);
process.exit(failures === 0 ? 0 : 1);
