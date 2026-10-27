// Bundle-size guard: proves the published dist keeps tree-shaking under the
// reference bundler (rollup - the engine behind Vite production builds).
//
// Bundles three representative entries from the built dist and fails when a
// budget regresses. Budgets are generous on purpose; tighten them as the
// graph gets leaner, never loosen them without a release note.
const fs = require('fs');
const path = require('path');
const { rollup } = require('rollup');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const tmpDir = path.join(rootDir, '.tmp', 'verify-treeshake');
const errors = [];

const CASES = [
  {
    name: 'single sentinel (NEVER)',
    code: 'import { NEVER } from "INPUT"; export const s = NEVER;',
    maxKb: 90,
  },
  {
    name: 'realistic schema (object/string/number)',
    code:
      'import { object, string, number } from "INPUT"; export const s = object({ a: string().email(), b: number().int() });',
    maxKb: 220,
  },
  {
    name: 'mini entry single factory',
    code: 'import { string } from "MINI"; export const s = string();',
    maxKb: 120,
  },
];

function specToPath(spec) {
  if (spec === 'INPUT') return path.join(distDir, 'index.js');
  if (spec === 'MINI') return path.join(distDir, 'v4-mini', 'index.js');
  throw new Error('unknown spec ' + spec);
}

async function run() {
  for (const required of [
    path.join(distDir, 'index.js'),
    path.join(distDir, 'v4-mini', 'index.js'),
  ]) {
    if (!fs.existsSync(required)) {
      errors.push(`Missing built file ${required}. Run npm run build first.`);
    }
  }
  if (errors.length) return report();

  fs.mkdirSync(tmpDir, { recursive: true });

  for (const testCase of CASES) {
    const inputPath = specToPath(testCase.code.includes('"MINI"') ? 'MINI' : 'INPUT');
    const entry = testCase.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '.mjs';
    const entryPath = path.join(tmpDir, entry);
    fs.writeFileSync(
      entryPath,
      testCase.code.replace(/"(INPUT|MINI)"/g, JSON.stringify(inputPath))
    );

    try {
      // moduleSideEffects:false mirrors how Vite treats packages that
      // declare "sideEffects": false in package.json.
      const bundle = await rollup({ input: entryPath, treeshake: { moduleSideEffects: false } });
      const { output } = await bundle.generate({ format: 'esm' });
      let bytes = 0;
      for (const chunk of output) if (chunk.type === 'chunk') bytes += chunk.code.length;
      const kb = bytes / 1024;
      const status = kb <= testCase.maxKb ? 'PASS' : 'FAIL';
      console.log(
        `${status} tree-shake ${testCase.name}: ${kb.toFixed(1)} KB (budget ${testCase.maxKb} KB)`
      );
      if (kb > testCase.maxKb) {
        errors.push(
          `Tree-shaking budget exceeded for "${testCase.name}": ${kb.toFixed(1)} KB > ${testCase.maxKb} KB. ` +
            'The dist graph gained a hard dependency edge; check for new top-level wiring or wide imports.'
        );
      }
    } catch (error) {
      errors.push(`Tree-shake case "${testCase.name}" errored: ${error.message}`);
    }
  }

  report();
}

function report() {
  if (errors.length) {
    console.error(`verify:treeshake found ${errors.length} problem(s):`);
    for (const error of errors) console.error('  - ' + error);
    process.exit(1);
  }
  console.log('verify:treeshake OK');
}

run();
