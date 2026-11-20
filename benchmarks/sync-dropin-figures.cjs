#!/usr/bin/env node
'use strict';

/**
 * Writes the published drop-in figures from benchmarks/dropin-median.json into
 * README.md, docs/*.md and the website, so the prose, the site table and the
 * measurement cannot drift apart.
 *
 * The producer is benchmarks/dropin-median.cjs (five full suite runs). The
 * npm script `benchmark:dropin-median` runs the harness and then this script,
 * so one command measures and publishes.
 *
 * Usage:
 *   node benchmarks/sync-dropin-figures.cjs             apply the JSON everywhere
 *   node benchmarks/sync-dropin-figures.cjs --check     verify, write nothing
 *   node benchmarks/sync-dropin-figures.cjs --dry-run   report what would change
 *   node benchmarks/sync-dropin-figures.cjs --from-log FILE
 *       rebuild benchmarks/dropin-median.json from a saved harness log
 *       (add --date YYYY-MM-DD to override the date taken from the log mtime)
 *
 * Only figures that sit in a drop-in context are rewritten: historical v3.0.5 /
 * Zod 4.6.4 measurements, memory/heap ratios, release thresholds and the
 * separate .validate() head-to-head keep their own numbers.
 */

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { buildFigures, formatFigures, localDate } = require('./dropin-figures.cjs');

const ROOT = path.resolve(__dirname, '..');
const ARTIFACT = path.join(__dirname, 'dropin-median.json');
const DOCS_COPY_DIR = path.join(ROOT, 'website-new', 'public', 'docs');

const DOC_FILES = [
  'README.md',
  'docs/PERFORMANCE.md',
  'docs/GETTING_STARTED.md',
  'docs/migration.md',
  'docs/ZOD_COMPATIBILITY.md',
  'docs/api.md',
  'docs/ADVANCED_FEATURES.md',
];

const SITE_FILES = [
  'website-new/src/pages/home.tsx',
  'website-new/src/pages/docs.tsx',
  'website-new/src/pages/api.tsx',
  'website-new/src/pages/examples.tsx',
  'website-new/src/pages/benchmark.tsx',
  'website-new/src/pages/playground.tsx',
  'website-new/src/components/layout/footer.tsx',
];

const TARGETS = [...DOC_FILES, ...SITE_FILES];

const CLAIM_CONTEXT = new RegExp(
  [
    'drop-in',
    'Drop-in',
    'dropin-median',
    'dropin-vs-zod',
    'geomean',
    'geometric mean',
    'faster than Zod 4\\.6',
    'vs Zod 4\\.6\\.7',
    'same code, \\d\\.\\d{2}x',
    'method-memoization \\(\\d\\.\\d{2}x\\)',
  ].join('|')
);

const HISTORICAL_MARKER = /historical|v3\.0\.5|v2\.1\.0|v3\.0\.0/i;
const NOT_A_GEOMEAN = /^\s*(?:lower|less|smaller|higher|aggregate|peak|observed|ms\b|\+)/;
const MEMORY_SLOT = /(?:vldHeap|zodHeap|heap|percentage|ratio):\s*'?$/;
const RUN_RANGE_CONTEXT = /individual runs|five geomeans|single runs/;
const DATE_EXCLUDE =
  /validate|34\.9x|observed peak|3\.3\.1|guarded-table|guard runs|Last audited|verify:bundle|verify:treeshake|bundle/i;
const DATE_CONTEXT = /re-measured|dropin-median|drop-in runs|five full runs|dropin-vs-zod/i;

// One row of the harness's printed median table, e.g.
// "1. string().min(1).email()     47.64     47.87     55.46    1.16x"
// (name, v1 ms, vV2 ms, Zod ms, vV2/Zod).
const SCENARIO_ROW = /^(\d+\.\s+.*?)\s{2,}([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)x\s*$/;

function parseArgs(argv) {
  const read = (flag) => {
    const index = argv.indexOf(flag);
    return index >= 0 ? argv[index + 1] : null;
  };
  return {
    check: argv.includes('--check'),
    dryRun: argv.includes('--dry-run'),
    fromLog: read('--from-log'),
    date: read('--date'),
  };
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function packageVersion(name) {
  try {
    return readJson(path.join(ROOT, 'node_modules', name, 'package.json')).version;
  } catch {
    return 'unknown';
  }
}

function figuresFromLog(file, options) {
  if (!fs.existsSync(file)) {
    throw new Error(`log not found: ${path.relative(ROOT, file)}`);
  }
  const text = fs.readFileSync(file, 'utf8');
  const rows = [];
  for (const line of text.split('\n')) {
    const match = line.match(SCENARIO_ROW);
    if (match) {
      rows.push({ name: match[1].trim(), v1Ms: Number(match[2]), v2Ms: Number(match[3]), zodMs: Number(match[4]) });
    }
  }
  if (rows.length === 0) {
    throw new Error(`${file}: no per-scenario rows found`);
  }
  const runs = text.match(/Per-scenario median of (\d+) full runs:/);
  const geomeans = text.match(/Individual run geomeans: (.*?) \(/);
  if (!geomeans) {
    throw new Error(`${file}: no "Individual run geomeans" line found`);
  }
  return buildFigures({
    rows,
    perRunGeomeans: geomeans[1].split(',').map((value) => Number(value.trim().replace(/x$/, ''))),
    runs: runs ? Number(runs[1]) : rows.length,
    date: options.date || localDate(fs.statSync(file).mtime),
    node: process.version,
    platform: `${process.platform} ${process.arch}`,
    vld: readJson(path.join(ROOT, 'package.json')).version,
    zod: packageVersion('zod'),
  });
}

function loadFigures(options) {
  if (options.fromLog) {
    return figuresFromLog(path.resolve(process.cwd(), options.fromLog), options);
  }
  if (!fs.existsSync(ARTIFACT)) {
    throw new Error('benchmarks/dropin-median.json is missing - run `npm run benchmark:dropin-median` first');
  }
  const figures = readJson(ARTIFACT);
  if (figures.schema !== 1 || !Array.isArray(figures.scenarios) || figures.scenarios.length === 0) {
    throw new Error('benchmarks/dropin-median.json is not a schema 1 figure set - re-run the harness');
  }
  return figures;
}

function isHistorical(text, index, token) {
  const after = text.slice(index + token.length, index + token.length + 60);
  if (/4\.6\.4/.test(after) && !/4\.6\.7/.test(after)) return true;
  if (HISTORICAL_MARKER.test(after.slice(0, 45)) && !/4\.6\.7/.test(after.slice(0, 45))) return true;

  // A historical marker that opens the same sentence, e.g. "Historical v3.0.5
  // measurement ... geomean 3.03x": protect unless a newer version is named
  // between the marker and the figure.
  const before = text.slice(Math.max(0, index - 220), index);
  const marker = new RegExp(HISTORICAL_MARKER.source, 'gi');
  let last = -1;
  let match;
  while ((match = marker.exec(before)) !== null) last = match.index;
  if (last >= 0) {
    const tail = before.slice(last);
    if (!/\.\s/.test(tail) && !/4\.6\.7/.test(tail)) return true;
  }
  return false;
}

function classifyGeomean(text, index, token) {
  const before = text.slice(Math.max(0, index - 90), index);
  const after = text.slice(index + token.length, index + token.length + 60);
  if (MEMORY_SLOT.test(before)) return 'memory';
  if (isHistorical(text, index, token)) return 'historical';
  if (NOT_A_GEOMEAN.test(after)) return 'other';
  if (CLAIM_CONTEXT.test(before + token + after)) return 'claim';
  return 'other';
}

function fixedWidth(value, previous) {
  return value.toFixed(2).padStart(previous.length);
}

function syncTable(text, figures, file, report, errors) {
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const lines = text.split(/\r?\n/);
  let index = 0;
  let seen = 0;

  for (let line = 0; line < lines.length; line++) {
    if (!lines[line].includes('vV2Ms:')) continue;
    const row = figures.scenarios[index];
    if (!row) {
      errors.push(`${file}:${line + 1}: more table rows than measured scenarios`);
      break;
    }
    const match = lines[line].match(
      /^(\s*\{ name: '(\d+)\. [^']*',\s*)(vV2Ms:\s*)([\d.]+)(, v1Ms:\s*)([\d.]+)(, zodMs:\s*)([\d.]+)( \},)$/
    );
    if (!match) {
      errors.push(`${file}:${line + 1}: unrecognised table row (expected name/vV2Ms/v1Ms/zodMs)`);
      continue;
    }
    if (Number(match[2]) !== index + 1) {
      errors.push(`${file}:${line + 1}: scenario ${match[2]} is out of order (expected ${index + 1})`);
      continue;
    }
    const next =
      match[1] +
      match[3] +
      fixedWidth(row.v2Ms, match[4]) +
      match[5] +
      fixedWidth(row.v1Ms, match[6]) +
      match[7] +
      fixedWidth(row.zodMs, match[8]) +
      match[9];
    if (next !== lines[line]) report.push(`${file}: scenario ${match[2]} medians`);
    lines[line] = next;
    index += 1;
    seen += 1;
  }

  if (seen !== figures.scenarios.length) {
    errors.push(`${file}: synced ${seen}/${figures.scenarios.length} table rows`);
  }
  return lines.join(eol);
}

function rewrite(text, figures, file) {
  const format = formatFigures(figures);
  const report = [];
  const errors = [];
  let claims = 0;

  // 1. Run-to-run geomean range ("the individual runs spanned 3.02x-3.13x").
  text = text.replace(/\b\d\.\d{2}x-\d\.\d{2}x\b/g, (match, offset) => {
    const window = text.slice(Math.max(0, offset - 120), offset + match.length + 20);
    if (!RUN_RANGE_CONTEXT.test(window)) return match;
    claims += 1;
    if (match !== format.runRange) report.push(`${file}: run range ${match} -> ${format.runRange}`);
    return format.runRange;
  });

  // 2. Geomean. Mask the ranges that step 1 deliberately left alone (per-scenario
  // spreads, guarded-ratio bands) so their endpoints are not read as geomeans.
  const masked = [];
  text = text.replace(/\b\d\.\d{2}x-\d\.\d{2}x\b/g, (match) => {
    masked.push(match);
    return `\u0000R${masked.length - 1}\u0000`;
  });
  text = text.replace(/\b\d\.\d{2}x\b/g, (match, offset) => {
    if (classifyGeomean(text, offset, match) !== 'claim') return match;
    claims += 1;
    const next = `${format.geomean}x`;
    if (match !== next) report.push(`${file}: geomean ${match} -> ${next}`);
    return next;
  });
  text = text.replace(/\u0000R(\d+)\u0000/g, (ignored, index) => masked[Number(index)]);

  // 3. Measurement date, skipping the .validate() head-to-head dates.
  text = text.replace(/\b20\d\d-\d\d-\d\d\b/g, (match, offset) => {
    const window = text.slice(Math.max(0, offset - 120), offset + match.length + 120);
    if (DATE_EXCLUDE.test(window)) return match;
    if (!DATE_CONTEXT.test(window)) return match;
    claims += 1;
    if (match !== format.date) report.push(`${file}: measurement date ${match} -> ${format.date}`);
    return format.date;
  });

  // 4. The site's per-scenario table.
  if (file.endsWith('benchmark.tsx')) {
    text = syncTable(text, figures, file, report, errors);
  }

  if (claims === 0) {
    errors.push(`${file}: no drop-in figures found - did the wording change?`);
  }

  return { text, report, errors, claims };
}

function firstDifference(before, after) {
  const beforeLines = before.split('\n');
  const afterLines = after.split('\n');
  for (let index = 0; index < Math.max(beforeLines.length, afterLines.length); index++) {
    if (beforeLines[index] !== afterLines[index]) {
      const detail = (afterLines[index] || '').trim().slice(0, 90);
      return `line ${index + 1}: ${detail}`;
    }
  }
  return 'unknown difference';
}

function runDocsSync() {
  const result = spawnSync(process.execPath, [path.join(ROOT, 'website-new', 'scripts', 'sync-docs.js')], {
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    throw new Error('website-new/scripts/sync-docs.js failed');
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const figures = loadFigures(options);
  const format = formatFigures(figures);
  const errors = [];
  const updated = [];
  let claims = 0;

  for (const file of TARGETS) {
    const absolute = path.join(ROOT, file);
    if (!fs.existsSync(absolute)) {
      errors.push(`${file}: missing`);
      continue;
    }
    const before = fs.readFileSync(absolute, 'utf8');
    const result = rewrite(before, figures, file);
    errors.push(...result.errors);
    claims += result.claims;

    const changed = result.text !== before;
    if (options.check) {
      if (changed) errors.push(`${file}: out of date (${firstDifference(before, result.text)})`);
    } else if (changed) {
      if (!options.dryRun) fs.writeFileSync(absolute, result.text);
      updated.push(file);
    }
    for (const line of result.report) {
      console.log(`dropin-sync: ${options.check || options.dryRun ? 'would update' : 'updated'} ${line}`);
    }
  }

  if (options.check) {
    for (const doc of DOC_FILES.filter((file) => file.startsWith('docs/'))) {
      const copy = path.join(DOCS_COPY_DIR, path.basename(doc));
      const relative = path.relative(ROOT, copy);
      if (!fs.existsSync(copy)) {
        errors.push(`${relative}: missing copy of ${doc}`);
      } else if (fs.readFileSync(copy, 'utf8') !== fs.readFileSync(path.join(ROOT, doc), 'utf8')) {
        errors.push(`${relative}: stale copy of ${doc}`);
      }
    }
  } else if (!options.dryRun) {
    if (options.fromLog) {
      fs.writeFileSync(ARTIFACT, `${JSON.stringify(figures, null, 2)}\n`);
      console.log('dropin-sync: wrote benchmarks/dropin-median.json from the saved log');
    }
    runDocsSync();
  }

  if (errors.length > 0) {
    for (const error of errors) console.error(`dropin-sync: ${error}`);
    console.error(
      options.check
        ? 'dropin-sync: published figures are stale - run `npm run benchmark:dropin-median`'
        : 'dropin-sync: failed'
    );
    process.exit(1);
  }

  console.log(
    `dropin-sync: ${format.geomean}x geomean, ${format.wins} wins, runs ${format.runRange}, ` +
      `scenarios ${format.scenarioRange} (${format.date}, ${figures.runs} runs, ${claims} figure slots)`
  );
  if (options.check) {
    console.log('dropin-sync: README, docs and website match benchmarks/dropin-median.json');
  } else if (options.dryRun) {
    console.log(`dropin-sync: dry run - ${updated.length} file(s) would change`);
  } else {
    console.log(`dropin-sync: ${updated.length} file(s) updated`);
  }
}

try {
  main();
} catch (error) {
  console.error(`dropin-sync: ${error.message}`);
  process.exit(1);
}
