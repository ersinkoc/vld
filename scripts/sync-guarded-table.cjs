/**
 * Regenerates the guarded benchmark table in README.md and docs/PERFORMANCE.md
 * from `benchmark:guard:built` itself.
 *
 * Both documents carry that table between the `guarded-table` markers, so the
 * numbers are never hand-edited twice: this script runs the guard N times, takes
 * the per-scenario median and rewrites the marker block in both files. The
 * website copy in website-new/public/docs is then refreshed with the project's
 * sync-docs script, so the public docs never wait for a manual sync.
 *
 * Requires a built package (`npm run build`), because the guard imports
 * `@oxog/vld` from dist.
 *
 *   npm run docs:guarded-table                 # 3 runs (default)
 *   VLD_GUARDED_TABLE_RUNS=5 npm run docs:guarded-table
 *
 * The guard itself takes several in-process samples per case; the extra runs
 * here only smooth the run-to-run drift of a shared machine.
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const guardScript = path.join(rootDir, 'benchmarks', 'performance-guard.cjs');
const targets = ['README.md', path.join('docs', 'PERFORMANCE.md')];
const siteSync = path.join(rootDir, 'website-new', 'scripts', 'sync-docs.js');

const START = '<!-- guarded-table:start -->';
const END = '<!-- guarded-table:end -->';

// Guard case name -> table row label, in the order performance-guard.cjs runs them.
const ROWS = [
  ['simple string parse', 'Simple String'],
  ['number positive int parse', 'Number / Positive Int'],
  ['array number parse', 'Array of Numbers'],
  ['simple object parse', 'Simple Object'],
  ['union string and number parse', 'Union (string \\| number)'],
  ['optional parse', 'Optional Parse'],
  ['nullish parse', 'Nullish Parse'],
  ['discriminated union parse', 'Discriminated Union'],
  ['mixed primitive object parse', 'Mixed Primitive Object'],
  ['optional-heavy object parse', 'Optional-Heavy Object'],
  ['config object with defaults parse', 'Config Object (defaults)'],
];

const PASS_LINE = /^PASS (.+?): VLD ([\d.]+)M ops\/sec, Zod ([\d.]+)M ops\/sec, ([\d.]+)x$/;
const AVERAGE_LINE = /^Average guarded ratio: ([\d.]+)x$/;
const SAMPLES_LINE = /^Samples: (\d+);/;

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

function runGuard() {
  const result = spawnSync(process.execPath, [guardScript], { cwd: rootDir, encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(`benchmark:guard:built failed:\n${result.stdout || ''}${result.stderr || ''}`);
  }

  const cases = new Map();
  let average = null;
  let samplesPerCase = null;
  for (const line of (result.stdout || '').split(/\r?\n/)) {
    const pass = PASS_LINE.exec(line);
    if (pass) {
      cases.set(pass[1], { vld: Number(pass[2]), zod: Number(pass[3]) });
      continue;
    }
    const avg = AVERAGE_LINE.exec(line);
    if (avg) average = Number(avg[1]);
    const samples = SAMPLES_LINE.exec(line);
    if (samples) samplesPerCase = Number(samples[1]);
  }
  return { cases, average, samplesPerCase };
}

function zodVersion() {
  try {
    return JSON.parse(fs.readFileSync(path.join(rootDir, 'node_modules', 'zod', 'package.json'), 'utf8')).version;
  } catch {
    return null;
  }
}

function replaceBlock(source, block, target) {
  const start = source.indexOf(START);
  const end = start === -1 ? -1 : source.indexOf(END, start + START.length);
  if (start === -1 || end === -1) {
    throw new Error(`${target}: missing the ${START} / ${END} markers`);
  }
  return source.slice(0, start) + block + source.slice(end + END.length);
}

function main() {
  const runs = Number(process.env.VLD_GUARDED_TABLE_RUNS ?? 3);
  if (!Number.isInteger(runs) || runs < 1) {
    throw new Error(`VLD_GUARDED_TABLE_RUNS must be a positive integer, got "${process.env.VLD_GUARDED_TABLE_RUNS}"`);
  }
  if (!fs.existsSync(guardScript)) {
    throw new Error(`missing ${path.relative(rootDir, guardScript)}`);
  }
  if (!fs.existsSync(path.join(rootDir, 'dist', 'index.js'))) {
    throw new Error('dist/index.js is missing; run `npm run build` before regenerating the table');
  }

  const measurements = ROWS.map(() => ({ vld: [], zod: [] }));
  const averages = [];
  let samplesPerCase = null;

  for (let run = 0; run < runs; run++) {
    const result = runGuard();
    if (result.average !== null) averages.push(result.average);
    if (result.samplesPerCase !== null) samplesPerCase = result.samplesPerCase;
    ROWS.forEach(([guardName], index) => {
      const caseResult = result.cases.get(guardName);
      if (!caseResult) {
        throw new Error(`benchmark:guard:built did not report "${guardName}"`);
      }
      measurements[index].vld.push(caseResult.vld);
      measurements[index].zod.push(caseResult.zod);
    });
  }

  // Ratios come from the medians themselves, so throughput and ratio always agree.
  const rows = ROWS.map(([, label], index) => {
    const vld = median(measurements[index].vld);
    const zod = median(measurements[index].zod);
    return { label, vld, zod, ratio: vld / zod };
  });

  const widest = rows
    .map((row, index) => {
      const ratios = measurements[index].vld.map((vld, sample) => vld / measurements[index].zod[sample]);
      return { label: row.label, low: Math.min(...ratios), high: Math.max(...ratios) };
    })
    .reduce((a, b) => (b.high - b.low > a.high - a.low ? b : a));

  const averageLabel = !averages.length
    ? null
    : averages.length === 1
      ? `${averages[0].toFixed(2)}x`
      : `${Math.min(...averages).toFixed(2)}x-${Math.max(...averages).toFixed(2)}x`;
  const version = zodVersion();
  const zodLabel = version ? `Zod ${version}` : 'Zod';
  const date = new Date().toISOString().slice(0, 10);
  const runLabel = `${runs} guard run${runs === 1 ? '' : 's'}`;

  const note = [
    `*Generated by \`npm run docs:guarded-table\` from \`benchmark:guard:built\`, so it is not hand-edited:`,
    `per-scenario median of ${runLabel} on ${date} against ${zodLabel}` +
      (samplesPerCase ? `, ${samplesPerCase} in-process samples each.` : '.'),
  ];
  if (runs > 1) {
    note.push(
      `The ratios swing between runs on shared hardware (${widest.label} spanned ` +
        `${widest.low.toFixed(1)}x-${widest.high.toFixed(1)}x` +
        (averageLabel ? `, average ${averageLabel}` : '') +
        `), so re-run the script instead of editing the numbers.*`
    );
  } else {
    note.push('Re-run the script instead of editing the numbers.*');
  }

  const block = [
    START,
    `| Benchmark Case (guarded) | VLD Throughput | vs ${zodLabel} |`,
    '|----------------|----------------|------------------|',
    ...rows.map((row) => `| ${row.label} | ~${Math.round(row.vld)}M ops/sec | **${row.ratio.toFixed(1)}x faster** |`),
    '',
    note.join(' '),
    END,
  ].join('\n');

  let updatedDocs = 0;
  for (const target of targets) {
    const file = path.join(rootDir, target);
    const source = fs.readFileSync(file, 'utf8');
    const next = replaceBlock(source, block, target);
    if (next === source) {
      console.log(`${target}: already up to date`);
      continue;
    }
    fs.writeFileSync(file, next);
    updatedDocs++;
    console.log(`${target}: updated`);
  }

  if (fs.existsSync(siteSync)) {
    const result = spawnSync(process.execPath, [siteSync], {
      cwd: path.join(rootDir, 'website-new'),
      encoding: 'utf8',
    });
    if (result.status !== 0) {
      throw new Error(`sync-docs failed:\n${result.stdout || ''}${result.stderr || ''}`);
    }
    console.log('website-new/public/docs: refreshed');
  } else {
    console.log('website-new/public/docs: skipped (no sync-docs script)');
  }

  console.log(
    `Guarded table: ${rows.length} scenarios from ${runLabel}, average ` +
      `${averageLabel ?? 'not reported'}, ${updatedDocs}/${targets.length} doc(s) updated`
  );
}

try {
  main();
} catch (error) {
  console.error(`docs:guarded-table: ${error.message}`);
  process.exitCode = 1;
}
