/**
 * Shared figure assembly for the drop-in head-to-head.
 *
 * Producer: benchmarks/dropin-median.cjs, which measures five full suite runs
 * and writes benchmarks/dropin-median.json.
 * Consumer: benchmarks/sync-dropin-figures.cjs, which writes those numbers into
 * README.md, docs/ and the website.
 *
 * Both sides derive the public figures from the same rounded per-scenario
 * medians, so the JSON, the prose and the site's table cannot disagree.
 */

function median(values) {
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function geomean(values) {
  return Math.exp(values.reduce((sum, value) => sum + Math.log(value), 0) / values.length);
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function localDate(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Builds the published figure set. `rows` are per-scenario medians (already
 * rounded to the two decimals that get published), `perRunGeomeans` are the
 * geomeans of the individual runs.
 */
function buildFigures({ rows, perRunGeomeans, runs, date, node, platform, vld, zod }) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('buildFigures: no scenario rows');
  }
  if (!Array.isArray(perRunGeomeans) || perRunGeomeans.length === 0) {
    throw new Error('buildFigures: no per-run geomeans');
  }

  const scenarios = rows.map((row) => {
    const v1Ms = round2(row.v1Ms);
    const v2Ms = round2(row.v2Ms);
    const zodMs = round2(row.zodMs);
    return { name: row.name, v1Ms, v2Ms, zodMs, speedup: zodMs / v2Ms };
  });

  const v2Geomean = geomean(scenarios.map((row) => row.speedup));
  const v1Geomean = geomean(scenarios.map((row) => row.zodMs / row.v1Ms));
  const v2Wins = scenarios.filter((row) => row.v2Ms < row.zodMs).length;
  const v1Wins = scenarios.filter((row) => row.v1Ms < row.zodMs).length;
  const v2Total = scenarios.reduce((sum, row) => sum + row.v2Ms, 0);
  const v1Total = scenarios.reduce((sum, row) => sum + row.v1Ms, 0);
  const zodTotal = scenarios.reduce((sum, row) => sum + row.zodMs, 0);
  const speedups = scenarios.map((row) => row.speedup);

  return {
    schema: 1,
    measuredAt: date,
    runs,
    environment: { node, platform, vld, zod },
    geomean: v2Geomean,
    v1Geomean,
    wins: v2Wins,
    scenarioCount: scenarios.length,
    v1Wins,
    perScenario: { min: Math.min(...speedups), max: Math.max(...speedups) },
    perRun: {
      min: Math.min(...perRunGeomeans),
      max: Math.max(...perRunGeomeans),
      geomeans: perRunGeomeans,
    },
    totals: { v1Ms: v1Total, v2Ms: v2Total, zodMs: zodTotal, speedup: zodTotal / v2Total },
    scenarios,
  };
}

/** The exact strings that appear in the published prose and tables. */
function formatFigures(figures) {
  return {
    geomean: figures.geomean.toFixed(2),
    runRange: `${figures.perRun.min.toFixed(2)}x-${figures.perRun.max.toFixed(2)}x`,
    scenarioRange: `${figures.perScenario.min.toFixed(2)}x-${figures.perScenario.max.toFixed(2)}x`,
    wins: `${figures.wins}/${figures.scenarioCount}`,
    date: figures.measuredAt,
    node: figures.environment.node,
  };
}

module.exports = { median, geomean, round2, localDate, buildFigures, formatFigures };
