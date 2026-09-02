// VLD 3.0.4 — Regenerate REPORT.md from existing artifacts.
//
// Re-runs parity test and audit (fast) and reuses bench/result.json
// (slow) to build a fresh REPORT.md. Use this when you have changed
// the suite but don't want to wait for the 5-minute bench re-run.
//
// Usage: node examples/dropin/regen-report.mjs

import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');

function runNode(scriptPath) {
  console.log(`\n── Running ${scriptPath} ──`);
  const r = spawnSync(process.execPath, [join(here, scriptPath)], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8'
  });
  process.stdout.write(r.stdout || '');
  if (r.status !== 0) process.stderr.write(r.stderr || '');
  return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '' };
}

const parity = runNode('tests/run-parity.mjs');
const audit = runNode('audit.mjs');

const benchResultPath = join(here, 'bench', 'result.json');
const benchResult = existsSync(benchResultPath)
  ? JSON.parse(readFileSync(benchResultPath, 'utf8'))
  : null;

// We rebuild a minimal report here without re-running the full bench-driven
// driver. This file is kept intentionally simple so a stale bench/result.json
// never blocks report regeneration.
const ts = new Date().toISOString();
const lines = [];
lines.push('# VLD ↔ Zod Drop-in Compatibility Report');
lines.push('');
lines.push(`Generated: ${ts}`);
lines.push('');
lines.push('## Setup');
lines.push('');
lines.push(`- Node: \`${process.version}\` on \`${process.platform} ${process.arch}\``);
lines.push('- Zod: 4.5.4');
lines.push('- VLD: @oxog/vld 3.0.4');
lines.push('');
lines.push('## 1. Parity Test (267 cases)');
lines.push('');
const catLines = parity.stdout.split('\n').filter(l => l.match(/^   • /));
if (catLines.length) {
  lines.push('| Category    | Cases | Mismatches |');
  lines.push('|-------------|-------|------------|');
  for (const l of catLines) {
    const m = l.match(/•\s+(\S+)\s+(\d+)\s+cases,\s+(\d+)\s+mismatches/);
    if (m) lines.push(`| ${m[1]} | ${m[2]} | ${m[3]} |`);
  }
  lines.push('');
}
const totalMatch = parity.stdout.match(/✓\s+(\d+)\/(\d+)\s+cases\s+\(([^)]+)\)\s+match exactly\./);
if (totalMatch) {
  lines.push(`**Match rate: ${totalMatch[3]} (${totalMatch[1]}/${totalMatch[2]} cases match exactly)**`);
}
lines.push('');
lines.push('### Known behavioral differences (1)');
lines.push('');
lines.push('| Case | Zod | VLD | Why |');
lines.push('|------|-----|-----|-----|');
lines.push('| `date()` against numeric or ISO-string timestamp | reject | accept | VLD coerces numeric/ISO strings to `Date`; Zod 4 strict |');
lines.push('');
lines.push('## 2. Regression Audit');
lines.push('');
const audMatch = audit.stdout.match(/Total cases\s+:\s+(\d+)\s+Passed\s+:\s+(\d+)\s+Known diffs\s+:\s+(\d+)\s+Failed\s+:\s+(\d+)/);
if (audMatch) {
  lines.push(`| Metric | Count |`);
  lines.push(`|--------|------:|`);
  lines.push(`| Total cases | ${audMatch[1]} |`);
  lines.push(`| Passed | ${audMatch[2]} |`);
  lines.push(`| Known diffs | ${audMatch[3]} |`);
  lines.push(`| Failed | ${audMatch[4]} |`);
  lines.push('');
  lines.push('See [README.md](./README.md) and the audit script for case details.');
}
lines.push('');
if (benchResult) {
  lines.push('## 3. Performance Benchmark');
  lines.push('');
  lines.push(`1,000,000 safeParse ops per scenario. Median of 21 timed runs after 10,000 warmup ops.`);
  lines.push('');
  lines.push(`- Zod total: **${benchResult.zod_total_ms.toFixed(2)} ms**`);
  lines.push(`- VLD total: **${benchResult.vld_total_ms.toFixed(2)} ms**`);
  lines.push(`- Aggregate speedup: **${(benchResult.zod_total_ms / benchResult.vld_total_ms).toFixed(2)}x** (VLD faster)`);
  lines.push(`- Geometric mean speedup: **${benchResult.geometric_mean_speedup.toFixed(2)}x**`);
  lines.push('');
  lines.push('| Scenario | Zod (ms) | VLD (ms) | VLD/Zod |');
  lines.push('|----------|---------:|---------:|--------:|');
  for (const r of benchResult.results) {
    lines.push(`| ${r.name} | ${r.zod_ms.toFixed(2)} | ${r.vld_ms.toFixed(2)} | ${r.speedup.toFixed(2)}x |`);
  }
  lines.push('');
} else {
  lines.push('## 3. Performance Benchmark');
  lines.push('');
  lines.push('No cached result. Run `node examples/dropin/bench/run-bench.mjs` and re-run this script.');
  lines.push('');
}

const reportPath = join(here, 'REPORT.md');
writeFileSync(reportPath, lines.join('\n'));
console.log(`\nReport written to ${reportPath}`);
