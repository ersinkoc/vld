#!/usr/bin/env node
'use strict';

/**
 * Audits the committed npm lockfiles against the npm advisory database.
 *
 * Why this exists: verify-security.cjs already runs `npm audit --omit=dev` for
 * the published package, which by design ignores every devDependency. The
 * website-new lockfile was not audited at all, so a stale report of 20
 * advisories (14 high, in vite and react-router) kept being read against a tree
 * that no longer had them. This gate covers both manifests *including* dev
 * dependencies and prints the counts it actually saw, so the number in CI is
 * the number to trust.
 *
 * `npm audit` resolves the tree from package-lock.json, so no install is needed
 * and the result matches what Dependabot evaluates for the committed lockfile.
 *
 * Usage:
 *   node scripts/verify-audit.cjs              # root + website-new
 *   node scripts/verify-audit.cjs <dir> [...]  # specific package dirs
 *
 * Exits non-zero on any high or critical finding, or when the audit itself
 * cannot run (registry or lockfile problem) rather than passing silently.
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const SEVERITIES = ['critical', 'high', 'moderate', 'low', 'info'];
const FAILING_SEVERITIES = new Set(['critical', 'high']);

const defaultTargets = [
  { name: '/', dir: rootDir },
  { name: '/website-new', dir: path.join(rootDir, 'website-new') },
];

const requested = process.argv.slice(2).filter((arg) => !arg.startsWith('-'));
const targets = requested.length
  ? requested.map((dir) => {
      const absolute = path.resolve(rootDir, dir);
      const relative = path.relative(rootDir, absolute) || '.';
      return { name: relative.replace(/\\/g, '/'), dir: absolute };
    })
  : defaultTargets;

function fail(message) {
  console.error(`\n[verify:audit] ${message}\n`);
  process.exit(1);
}

function runAudit(dir) {
  if (!fs.existsSync(path.join(dir, 'package-lock.json'))) {
    fail(`${dir} has no package-lock.json; npm audit cannot resolve a tree.`);
  }

  // npm is a .cmd shim on Windows, so it needs a shell there; pass one command
  // string rather than argv + shell (Node deprecates the latter). The command
  // is a fixed constant, so there is nothing to escape.
  const result = spawnSync('npm audit --json --ignore-scripts --include=dev', {
    cwd: dir,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    shell: true,
    env: { ...process.env, NO_COLOR: '1', npm_config_color: 'false' },
  });

  const stdout = (result.stdout || '').trim();
  if (!stdout) {
    fail(
      `npm audit produced no output in ${dir} (exit ${result.status}):\n` +
        (result.stderr || '(no stderr)').trim()
    );
  }

  let report;
  try {
    report = JSON.parse(stdout);
  } catch {
    fail(
      `npm audit returned non-JSON output in ${dir}:\n` +
        `${stdout.slice(0, 2000)}\n` +
        (result.stderr || '').trim()
    );
  }

  if (report.error) {
    fail(
      `npm audit failed in ${dir}: ` +
        (report.error.summary || report.error.code || JSON.stringify(report.error))
    );
  }
  if (!report.metadata || !report.metadata.vulnerabilities) {
    fail(`npm audit report in ${dir} has no metadata.vulnerabilities block.`);
  }

  return report;
}

function fixLabel(fixAvailable) {
  if (!fixAvailable) return 'no fix available';
  if (fixAvailable === true) return 'fix available';
  const major = fixAvailable.isSemVerMajor ? ' (major)' : '';
  return `fix: ${fixAvailable.name}@${fixAvailable.version}${major}`;
}

function advisoryDetails(vulnerability) {
  const seen = new Set();
  const details = [];
  for (const entry of vulnerability.via || []) {
    // A string entry means "reached through this vulnerable package", which the
    // parent package reports in its own row.
    const detail =
      entry && typeof entry === 'object'
        ? `${entry.title || entry.name} <${entry.url || ''}>`
        : `via \`${entry}\``;
    if (seen.has(detail)) continue;
    seen.add(detail);
    details.push(detail);
  }
  return details;
}

function describe(target, report) {
  const counts = report.metadata.vulnerabilities;
  const summary = {
    name: target.name,
    totals: Object.fromEntries(
      SEVERITIES.map((severity) => [severity, counts[severity] || 0])
    ),
    total: counts.total || 0,
    dependencies: report.metadata.dependencies || {},
    findings: [],
    failed: false,
  };

  for (const vulnerability of Object.values(report.vulnerabilities || {})) {
    if (!FAILING_SEVERITIES.has(vulnerability.severity)) continue;
    summary.failed = true;
    summary.findings.push({
      name: vulnerability.name,
      severity: vulnerability.severity,
      range: vulnerability.range,
      direct: Boolean(vulnerability.isDirect),
      fix: fixLabel(vulnerability.fixAvailable),
      details: advisoryDetails(vulnerability),
    });
  }

  console.log(`\n=== npm audit: ${target.name} (${target.dir}) ===`);
  const deps = summary.dependencies;
  console.log(
    `  lockfile tree: ${deps.total || 0} packages ` +
      `(prod ${deps.prod || 0}, dev ${deps.dev || 0}, optional ${deps.optional || 0})`
  );
  console.log(
    `  advisories: ${summary.total} total ` +
      SEVERITIES.map((severity) => `| ${severity} ${summary.totals[severity]}`).join(' ') +
      ' |'
  );
  for (const finding of summary.findings) {
    console.log(
      `  FAIL ${finding.severity.toUpperCase()} ${finding.name}@{${finding.range}} ` +
        `(${finding.direct ? 'direct' : 'transitive'}, ${finding.fix})`
    );
    for (const detail of finding.details) {
      console.log(`       - ${detail}`);
    }
  }

  return summary;
}

const summaries = targets.map((target) => describe(target, runAudit(target.dir)));

const failed = summaries.filter((summary) => summary.failed);

function stepSummary() {
  const lines = ['## npm audit', '', '| Manifest | Packages | Critical | High | Moderate | Low | Result |', '| --- | --- | --- | --- | --- | --- | --- |'];
  for (const summary of summaries) {
    lines.push(
      `| \`${summary.name}\` | ${summary.dependencies.total || 0} | ` +
        SEVERITIES.slice(0, 4)
          .map((severity) => summary.totals[severity])
          .join(' | ') +
        ` | ${summary.failed ? 'fail' : 'pass'} |`
    );
  }

  if (failed.length) {
    lines.push('', '### High and critical findings', '');
    for (const summary of failed) {
      for (const finding of summary.findings) {
        lines.push(
          `- \`${summary.name}\`: **${finding.severity}** \`${finding.name}\` ` +
            `\`${finding.range}\` - ${finding.fix}`
        );
        for (const detail of finding.details) {
          lines.push(`  - ${detail}`);
        }
      }
    }
  } else {
    lines.push(
      '',
      'No high or critical advisories in either lockfile. If the GitHub security tab shows otherwise, the page is stale: this job reads the same advisory database Dependabot does.'
    );
  }

  return `${lines.join('\n')}\n`;
}

const markdown = stepSummary();
process.stdout.write(`\n${markdown}`);
if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
}

if (failed.length) {
  console.error(
    `[verify:audit] failed: ${failed
      .map((summary) => `${summary.name} (${summary.findings.length} high/critical)`)
      .join(', ')}`
  );
  process.exit(1);
}

console.log('[verify:audit] OK: no high or critical advisories.');
