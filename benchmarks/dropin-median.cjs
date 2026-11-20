/**
 * VLD drop-in head-to-head - five-run median harness.
 *
 * Runs benchmarks/dropin-vs-zod.cjs N times (default 5), then reports the
 * PER-SCENARIO MEDIAN of those runs plus the geometric mean over the medians.
 * That is the figure quoted in README.md, docs/ and the website, because a
 * single suite run is noisy. The harness writes benchmarks/dropin-median.json
 * and `npm run benchmark:dropin-median` then runs
 * benchmarks/sync-dropin-figures.cjs, which applies those numbers to the prose
 * and the site table. Never hand-edit the published figures.
 *
 * Run: node benchmarks/dropin-median.cjs        (or: npm run benchmark:dropin-median)
 *      RUNS=7 node benchmarks/dropin-median.cjs
 *
 * Requires a fresh build: the suite loads ../dist/index.js.
 * Each inner suite run already medians 21 in-process samples per scenario and
 * aborts on a semantic mismatch, so this harness only aggregates their rows.
 */

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { buildFigures, localDate, round2 } = require('./dropin-figures.cjs');

const RUNS = Number(process.env.RUNS || 5);
const suitePath = path.resolve(__dirname, 'dropin-vs-zod.cjs');
const distEntry = path.resolve(__dirname, '..', 'dist', 'index.js');

if (!Number.isInteger(RUNS) || RUNS < 1) {
  console.error(`dropin-median: RUNS must be a positive integer, got ${process.env.RUNS}`);
  process.exit(1);
}

if (!fs.existsSync(distEntry)) {
  console.error('dropin-median: dist/index.js is missing. Run `npm run build` first.');
  process.exit(1);
}

// Matches one per-scenario row from dropin-vs-zod.cjs:
// "1. string().min(1).email()     43.26 ms    42.47 ms    51.58 ms    1.21x"
const SCENARIO_ROW = /^(\d+\.\s+.*?)\s+([\d.]+) ms\s+([\d.]+) ms\s+([\d.]+) ms\s+([\d.]+)x\s*$/;
const PER_RUN_GEOMEAN = /vV2 geometric mean speedup: ([\d.]+)x/;
const PER_RUN_WINS = /vV2 wins (\d+)\/10/;

function parseRun(output) {
  const scenarios = [];
  for (const line of output.split('\n')) {
    const match = line.match(SCENARIO_ROW);
    if (match) {
      scenarios.push({
        name: match[1].trim(),
        v1Ms: Number(match[2]),
        v2Ms: Number(match[3]),
        zodMs: Number(match[4]),
      });
    }
  }
  const geomean = output.match(PER_RUN_GEOMEAN);
  const wins = output.match(PER_RUN_WINS);
  return {
    scenarios,
    geomean: geomean ? Number(geomean[1]) : null,
    wins: wins ? Number(wins[1]) : null,
  };
}

function median(values) {
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function geomean(values) {
  return Math.exp(values.reduce((sum, value) => sum + Math.log(value), 0) / values.length);
}

const runs = [];
for (let run = 1; run <= RUNS; run++) {
  process.stdout.write(`dropin-median: run ${run}/${RUNS} ... `);
  const started = Date.now();
  const result = spawnSync(process.execPath, [suitePath], { encoding: 'utf8' });
  if (result.status !== 0) {
    console.log('FAILED');
    const detail = `${result.stdout || ''}${result.stderr || ''}`.trim().split('\n').slice(-12).join('\n');
    console.error(`dropin-median: run ${run} exited with ${result.status}. Last output:\n${detail}`);
    process.exit(1);
  }
  const parsed = parseRun(result.stdout);
  if (parsed.scenarios.length === 0 || parsed.geomean === null || parsed.wins === null) {
    console.log('FAILED');
    console.error(`dropin-median: run ${run} produced no parseable scenario rows. Suite output format changed?`);
    process.exit(1);
  }
  runs.push(parsed);
  console.log(`ok (${((Date.now() - started) / 1000).toFixed(1)}s, geomean ${parsed.geomean.toFixed(2)}x, ${parsed.wins}/${parsed.scenarios.length} wins)`);

  if (run > 1) {
    const expected = runs[0].scenarios.map(s => s.name).join('|');
    const actual = parsed.scenarios.map(s => s.name).join('|');
    if (expected !== actual) {
      console.error(`dropin-median: run ${run} listed different scenarios than run 1. Aborting.`);
      process.exit(1);
    }
  }
}

const scenarioNames = runs[0].scenarios.map(s => s.name);
// Round to the two decimals that get published, so the JSON artifact, the
// printed table and the site table all describe the same measurement.
const rows = scenarioNames.map((name, index) => {
  const v1Ms = round2(median(runs.map(r => r.scenarios[index].v1Ms)));
  const v2Ms = round2(median(runs.map(r => r.scenarios[index].v2Ms)));
  const zodMs = round2(median(runs.map(r => r.scenarios[index].zodMs)));
  return { name, v1Ms, v2Ms, zodMs, speedup: zodMs / v2Ms };
});

const v2Geomean = geomean(rows.map(r => r.speedup));
const v1Geomean = geomean(rows.map(r => r.zodMs / r.v1Ms));
const v2Wins = rows.filter(r => r.v2Ms < r.zodMs).length;
const v1Wins = rows.filter(r => r.v1Ms < r.zodMs).length;
const zodTotal = rows.reduce((sum, r) => sum + r.zodMs, 0);
const v2Total = rows.reduce((sum, r) => sum + r.v2Ms, 0);
const v1Total = rows.reduce((sum, r) => sum + r.v1Ms, 0);
const perRunGeomeans = runs.map(r => r.geomean);
const slowest = Math.min(...rows.map(r => r.speedup));
const fastest = Math.max(...rows.map(r => r.speedup));

console.log('');
console.log(`Per-scenario medians over ${RUNS} full suite runs (1M safeParse ops, lower is better):`);
console.log('');
console.log('Scenario'.padEnd(48) + '   v1 ms    vV2 ms    Zod ms   vV2/Zod');
console.log('-'.repeat(48) + '  -------  --------  --------  -------');
for (const row of rows) {
  console.log(
    row.name.padEnd(48) +
      row.v1Ms.toFixed(2).padStart(9) +
      row.v2Ms.toFixed(2).padStart(10) +
      row.zodMs.toFixed(2).padStart(10) +
      (row.speedup.toFixed(2) + 'x').padStart(9)
  );
}
console.log('');
console.log(`Per-scenario median of ${RUNS} full runs: ${v2Geomean.toFixed(2)}x geomean, ${v2Wins}/${rows.length} wins vs Zod (${slowest.toFixed(2)}x-${fastest.toFixed(2)}x per scenario).`);
console.log(`Individual run geomeans: ${perRunGeomeans.map(g => g.toFixed(2) + 'x').join(', ')} (${Math.min(...perRunGeomeans).toFixed(2)}x-${Math.max(...perRunGeomeans).toFixed(2)}x).`);
console.log(`v.* V1 geomean: ${v1Geomean.toFixed(2)}x, ${v1Wins}/${rows.length} wins.`);
console.log(`Total-time speedup: ${(zodTotal / v2Total).toFixed(2)}x (${v1Total.toFixed(0)} ms V1 | ${v2Total.toFixed(0)} ms V2 | ${zodTotal.toFixed(0)} ms Zod).`);

const vldVersion = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'package.json'), 'utf8')).version;
let zodVersion = 'unknown';
try {
  zodVersion = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'node_modules', 'zod', 'package.json'), 'utf8')).version;
} catch {
  // zod is a devDependency; the guard below keeps the artifact honest.
}

const figures = buildFigures({
  rows,
  perRunGeomeans,
  runs: RUNS,
  date: localDate(),
  node: process.version,
  platform: `${process.platform} ${process.arch}`,
  vld: vldVersion,
  zod: zodVersion,
});

fs.writeFileSync(path.resolve(__dirname, 'dropin-median.json'), `${JSON.stringify(figures, null, 2)}\n`);
console.log(
  `Figures written to benchmarks/dropin-median.json (${figures.geomean.toFixed(2)}x, ${figures.measuredAt}); ` +
    'run `npm run benchmark:dropin-median` to publish them.'
);
