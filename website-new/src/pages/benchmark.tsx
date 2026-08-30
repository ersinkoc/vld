import { Zap, Clock, HardDrive, Cpu, TrendingUp, TrendingDown, BarChart3, Activity, CheckCircle2, AlertCircle, Code2, Terminal, FileCode, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// v2.4.0 AOT compile guard — VLD vs Zod 4.5.4
// ============================================================================
// Source: benchmarks/moltar-deep.cjs (200,000 iters × 21 runs, median)
// Node.js v24.13.0, Windows 11, single-isolate.
// Compiled parse/validate reads `_zod.bag.validator` on the schema; the
// `parse` body returns the input on success and delegates to the original
// safeParse on failure (Zod-equivalent Moltar ParseSafe semantic).
const compileScenarios = [
  {
    name: 'moltarParseSafe',
    description: 'Moltar ParseSafe object (7 keys, nested 3-key object)',
    vldParse: 310_366_232,
    zodParse: 161_147_369,
    vldValidate: 127_877_238,
    zodValidate: 53_255_226,
  },
  {
    name: 'wideObject',
    description: '20-key flat object',
    vldParse: 14_965_243,
    zodParse: 7_926_788,
    vldValidate: 15_310_184,
    zodValidate: 6_843_152,
  },
  {
    name: 'arrayOfObjects',
    description: 'Array of 100 × 3-key objects',
    vldParse: 3_487_930,
    zodParse: 1_128_920,
    vldValidate: 3_543_272,
    zodValidate: 3_298_164,
  },
  {
    name: 'tuple',
    description: '5-item tuple of mixed types',
    vldParse: 46_221_401,
    zodParse: 29_823_149,
    vldValidate: 69_864_114,
    zodValidate: 16_314_544,
  },
  {
    name: 'union',
    description: 'Union of string, number, boolean',
    vldParse: 48_224_146,
    zodParse: 98_092_108,
    vldValidate: 74_016_506,
    zodValidate: 23_644_295,
  },
  {
    name: 'nested',
    description: '3-level nested object (3 + 3 + 3 keys)',
    vldParse: 46_254_539,
    zodParse: 44_448_395,
    vldValidate: 55_035_773,
    zodValidate: 24_949_789,
  },
]

// Geometric means across all 6 scenarios.
function geoMean(arr: number[]): number {
  const logSum = arr.reduce((acc, v) => acc + Math.log(v), 0)
  return Math.exp(logSum / arr.length)
}

const parseGeoRatio = geoMean(compileScenarios.map((s) => s.vldParse / s.zodParse))
const validateGeoRatio = geoMean(compileScenarios.map((s) => s.vldValidate / s.zodValidate))
const parseWins = compileScenarios.filter((s) => s.vldParse > s.zodParse).length
const validateWins = compileScenarios.filter((s) => s.vldValidate > s.zodValidate).length

// ============================================================================
// v2.1.0 release-gate runtime/startup/memory snapshot (kept for context)
// ============================================================================
const runtimeStartupBenchmarks = [
  {
    name: 'Runtime Guard Average',
    description: 'Focused validation throughput guard',
    vldOps: 11_670_000,
    zodOps: 1_000_000,
    winner: 'vld',
    ratio: 11.67,
  },
  {
    name: 'Import Startup',
    description: 'Cold library import timing',
    vldOps: 1_320_000,
    zodOps: 1_000_000,
    winner: 'vld',
    ratio: 1.32,
  },
  {
    name: 'Total Startup',
    description: 'Import, schema creation, and first validation',
    vldOps: 1_550_000,
    zodOps: 1_000_000,
    winner: 'vld',
    ratio: 1.55,
  },
  {
    name: 'Warm Parse Startup',
    description: 'Repeated parse after startup warm-up',
    vldOps: 2_900_000,
    zodOps: 1_000_000,
    winner: 'vld',
    ratio: 2.90,
  },
  {
    name: 'Memory Aggregate Speed',
    description: 'Aggregate memory guard throughput',
    vldOps: 3_130_000,
    zodOps: 1_000_000,
    winner: 'vld',
    ratio: 3.13,
  },
]

const memoryBenchmarks = [
  {
    name: 'Retained Heap',
    vldHeap: '1.00x',
    zodHeap: '4.76x',
    vldMemPerOp: 'baseline',
    zodMemPerOp: '4.76x',
    ratio: 4.76,
    winner: 'vld',
  },
  {
    name: 'Aggregate Speed',
    vldHeap: '3.13x',
    zodHeap: '1.00x',
    vldMemPerOp: 'faster',
    zodMemPerOp: 'baseline',
    ratio: 3.13,
    winner: 'vld',
  },
  {
    name: 'Package Install',
    vldHeap: '295 KiB',
    zodHeap: 'external',
    vldMemPerOp: '299 files',
    zodMemPerOp: 'reference',
    ratio: 1,
    winner: 'vld',
  },
]

const features = [
  { icon: Zap, title: '1.46x Compile Parse', description: 'AOT-compiled parse is 1.46x faster than z.compile().parse() on Moltar ParseSafe (geometric mean, 5/6 wins)', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  { icon: Cpu, title: '2.36x Compile Validate', description: 'AOT-compiled validate is 2.36x faster than z.validate() on the same harness (6/6 wins)', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { icon: HardDrive, title: '253/253 Zod Parity', description: 'Root, mini, v4, v4-mini, v4/core, v4/locales, compile, and nested exports verified against Zod 4.5.4', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { icon: Clock, title: 'Zero Dependencies', description: 'No runtime dependencies. AOT compile emits a flat `if/typeof` chain that V8 inlines to a single guard', color: 'text-purple-500', bg: 'bg-purple-500/10' },
]

const bundleComparison = [
  { library: 'VLD root', size: '53.0 KiB', raw: 'bundle', percentage: 50 },
  { library: 'VLD mini', size: '52.9 KiB', raw: 'bundle', percentage: 50 },
]

const memoryOverall = [
  { library: 'VLD', heap: '1.00x', percentage: 21 },
  { library: 'Zod 4.5.4', heap: '4.76x', percentage: 100 },
]

// ============================================================================
// Reproducible benchmark scripts (root /benchmarks directory)
// ============================================================================
const benchmarkScripts = [
  {
    name: 'moltar-deep.cjs',
    path: 'benchmarks/moltar-deep.cjs',
    description: '6-scenario VLD vs Zod 4.5.4 guard. 200k iters × 21 runs median.',
    command: 'ITER=200000 RUNS=21 node benchmarks/moltar-deep.cjs',
  },
  {
    name: 'moltar-parse-safe.cjs',
    path: 'benchmarks/moltar-parse-safe.cjs',
    description: 'Single Moltar ParseSafe scenario, VLD vs Zod, lower noise.',
    command: 'node benchmarks/moltar-parse-safe.cjs',
  },
  {
    name: 'compile-smoke.cjs',
    path: 'benchmarks/compile-smoke.cjs',
    description: '28-case semantic equivalence suite (parse/safeParse/validate, error paths, properties).',
    command: 'node benchmarks/compile-smoke.cjs',
  },
]

function formatOps(ops: number): string {
  if (ops >= 1_000_000_000) {
    return `${(ops / 1_000_000_000).toFixed(1)}B`
  } else if (ops >= 1_000_000) {
    return `${(ops / 1_000_000).toFixed(1)}M`
  } else if (ops >= 1_000) {
    return `${(ops / 1_000).toFixed(1)}K`
  }
  return ops.toString()
}

function OpsBar({ vld, zod }: { vld: number; zod: number }) {
  const max = Math.max(vld, zod)
  return (
    <div className="flex items-end gap-1 h-10">
      <div
        className="w-3 bg-vld-primary rounded-t transition-all"
        style={{ height: `${(vld / max) * 100}%` }}
        title={`VLD: ${formatOps(vld)} ops/sec`}
      />
      <div
        className="w-3 bg-zinc-400 dark:bg-zinc-500 rounded-t transition-all"
        style={{ height: `${(zod / max) * 100}%` }}
        title={`Zod: ${formatOps(zod)} ops/sec`}
      />
    </div>
  )
}

export function BenchmarkPage() {
  return (
    <div className="min-h-screen">
      <div className="container-wide py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-vld-primary/10 border border-vld-primary/20 text-sm font-medium text-vld-primary mb-4">
              <Activity className="w-4 h-4" />
              <span>Real Benchmark Results</span>
            </div>
            <h1 className="font-display text-4xl lg:text-5xl font-bold mb-4">Performance Benchmarks</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              v2.4.0 AOT compile guard against Zod 4.5.4. The <code className="text-vld-primary font-mono">v.compile()</code> body
              is a flat <code className="text-vld-primary font-mono">if/typeof</code> chain emitted via{' '}
              <code className="text-vld-primary font-mono">new Function()</code>; <code className="text-vld-primary font-mono">v.validate()</code>{' '}
              returns the boolean result and <code className="text-vld-primary font-mono">v.compile(schema).parse()</code> returns the input on success (Zod-compiled semantic).
            </p>
          </div>

          {/* AOT compile headline stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            <div className="p-6 rounded-xl bg-gradient-to-br from-vld-primary/20 to-vld-secondary/20 border border-vld-primary/20">
              <div className="text-4xl font-bold gradient-text mb-1">{parseGeoRatio.toFixed(2)}x</div>
              <div className="text-sm text-muted-foreground">Compile Parse geomean</div>
              <div className="text-xs text-vld-success mt-1">{parseWins}/{compileScenarios.length} scenarios won</div>
            </div>
            <div className="p-6 rounded-xl bg-card border border-border">
              <div className="text-4xl font-bold text-vld-success mb-1">{validateGeoRatio.toFixed(2)}x</div>
              <div className="text-sm text-muted-foreground">Compile Validate geomean</div>
              <div className="text-xs text-vld-success mt-1">{validateWins}/{compileScenarios.length} scenarios won</div>
            </div>
            <div className="p-6 rounded-xl bg-card border border-border">
              <div className="text-4xl font-bold text-vld-accent mb-1">253</div>
              <div className="text-sm text-muted-foreground">Zod 4.5.4 Exports</div>
              <div className="text-xs text-vld-success mt-1">100% parity</div>
            </div>
            <div className="p-6 rounded-xl bg-card border border-border">
              <div className="text-4xl font-bold text-vld-warning mb-1">200k</div>
              <div className="text-sm text-muted-foreground">Iterations × 21 runs</div>
              <div className="text-xs text-muted-foreground mt-1">median, Node v24.13.0</div>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {features.map((feature) => (
              <div key={feature.title} className="p-6 rounded-xl bg-card border border-border hover:border-vld-primary/30 transition-colors group">
                <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center mb-4', feature.bg)}>
                  <feature.icon className={cn('w-6 h-6', feature.color)} />
                </div>
                <h3 className="font-semibold mb-2 group-hover:text-vld-primary transition-colors">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* AOT compile scenario table — the headline table */}
          <div className="rounded-xl border border-border overflow-hidden mb-12">
            <div className="bg-muted/50 px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl font-semibold flex items-center gap-2">
                  <Zap className="w-5 h-5 text-vld-primary" />
                  AOT Compile — VLD vs Zod 4.5.4 (ops/sec)
                </h2>
                <p className="text-sm text-muted-foreground">v.compile().parse() and v.validate() / z.validate(), 6 schema shapes</p>
              </div>
              <div className="hidden sm:flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-vld-primary" />
                  <span>VLD</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-zinc-400 dark:bg-zinc-500" />
                  <span>Zod 4.5.4</span>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-6 py-4 font-medium">Scenario</th>
                    <th className="text-center px-2 py-4 font-medium w-16">Bars</th>
                    <th className="text-right px-4 py-4 font-medium text-vld-primary">VLD parse</th>
                    <th className="text-right px-4 py-4 font-medium">Zod parse</th>
                    <th className="text-right px-4 py-4 font-medium">Ratio</th>
                    <th className="text-right px-4 py-4 font-medium text-vld-primary">VLD validate</th>
                    <th className="text-right px-4 py-4 font-medium">Zod validate</th>
                    <th className="text-right px-4 py-4 font-medium">Ratio</th>
                  </tr>
                </thead>
                <tbody>
                  {compileScenarios.map((s, i) => {
                    const parseRatio = s.vldParse / s.zodParse
                    const validateRatio = s.vldValidate / s.zodValidate
                    return (
                      <tr
                        key={s.name}
                        className={cn(
                          'border-b border-border last:border-0 hover:bg-muted/50 transition-colors',
                          i % 2 === 0 ? 'bg-transparent' : 'bg-muted/20'
                        )}
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium font-mono text-sm">{s.name}</div>
                          <div className="text-xs text-muted-foreground">{s.description}</div>
                        </td>
                        <td className="px-2 py-4">
                          <div className="flex justify-center gap-3">
                            <OpsBar vld={s.vldParse} zod={s.zodParse} />
                            <OpsBar vld={s.vldValidate} zod={s.zodValidate} />
                          </div>
                        </td>
                        <td className="text-right px-4 py-4 font-mono text-vld-primary text-sm font-semibold">{formatOps(s.vldParse)}</td>
                        <td className="text-right px-4 py-4 font-mono text-muted-foreground text-sm">{formatOps(s.zodParse)}</td>
                        <td className="text-right px-4 py-4">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                              parseRatio >= 1
                                ? 'bg-vld-success/10 text-vld-success'
                                : 'bg-zinc-500/10 text-zinc-500'
                            )}
                          >
                            {parseRatio >= 1 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {parseRatio.toFixed(2)}x
                          </span>
                        </td>
                        <td className="text-right px-4 py-4 font-mono text-vld-primary text-sm font-semibold">{formatOps(s.vldValidate)}</td>
                        <td className="text-right px-4 py-4 font-mono text-muted-foreground text-sm">{formatOps(s.zodValidate)}</td>
                        <td className="text-right px-4 py-4">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                              validateRatio >= 1
                                ? 'bg-vld-success/10 text-vld-success'
                                : 'bg-zinc-500/10 text-zinc-500'
                            )}
                          >
                            {validateRatio >= 1 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {validateRatio.toFixed(2)}x
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-vld-primary/30 bg-vld-primary/5">
                    <td colSpan={4} className="px-6 py-4 font-semibold text-sm">Geometric mean</td>
                    <td className="text-right px-4 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-vld-primary/15 text-vld-primary text-sm font-bold">
                        <TrendingUp className="w-3.5 h-3.5" />
                        {parseGeoRatio.toFixed(2)}x
                      </span>
                    </td>
                    <td colSpan={2} className="px-4 py-4"></td>
                    <td className="text-right px-4 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-vld-primary/15 text-vld-primary text-sm font-bold">
                        <TrendingUp className="w-3.5 h-3.5" />
                        {validateGeoRatio.toFixed(2)}x
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Benchmark scripts */}
          <div className="rounded-xl border border-border overflow-hidden mb-12">
            <div className="bg-muted/50 px-6 py-4 border-b border-border">
              <h2 className="font-display text-xl font-semibold flex items-center gap-2">
                <Code2 className="w-5 h-5 text-vld-primary" />
                Reproducible Benchmark Scripts
              </h2>
              <p className="text-sm text-muted-foreground">All scripts live under <code className="font-mono">/benchmarks</code> and accept <code className="font-mono">ITER</code> + <code className="font-mono">RUNS</code> env overrides</p>
            </div>
            <div className="divide-y divide-border">
              {benchmarkScripts.map((s) => (
                <div key={s.name} className="p-6">
                  <div className="flex items-start gap-4">
                    <FileCode className="w-5 h-5 text-vld-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-baseline gap-3 mb-1">
                        <span className="font-mono text-sm font-semibold">{s.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">{s.path}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{s.description}</p>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background/60 border border-border/50 font-mono text-xs">
                        <Terminal className="w-3.5 h-3.5 text-vld-primary shrink-0" />
                        <code className="text-foreground">{s.command}</code>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AOT compile methodology */}
          <div className="rounded-xl border border-border overflow-hidden mb-12">
            <div className="bg-muted/50 px-6 py-4 border-b border-border">
              <h2 className="font-display text-xl font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-vld-primary" />
                How v.compile() works
              </h2>
              <p className="text-sm text-muted-foreground">Walk-the-schema, emit flat guards, return true / COMPILE_INVALID</p>
            </div>
            <div className="p-6 space-y-4 text-sm text-muted-foreground">
              <p>
                <code className="text-vld-primary font-mono">v.compile(schema)</code> recursively walks the schema and emits a single JavaScript
                function via <code className="font-mono">new Function(...)</code>. The body is a flat <code className="font-mono">if (typeof x !== "...") return INVALID</code> chain — V8 inlines
                it as a single zero-allocation guard, the same shape Zod 4.5 uses.
              </p>
              <p>
                The compiled validator returns <code className="font-mono">true</code> on success or a <code className="font-mono">COMPILE_INVALID</code> sentinel on failure. <code className="text-vld-primary font-mono">v.validate()</code> returns
                the boolean directly; <code className="text-vld-primary font-mono">v.compile(s).parse(input)</code> returns the input on success and delegates to <code className="font-mono">safeParse</code> on failure
                (Zod-compiled <em>Moltar ParseSafe</em> semantic). The uncompiled <code className="font-mono">.parse()</code> path continues to strip unknown keys.
              </p>
              <p>
                The hot-path internals: <code className="font-mono">validateOnly</code> mode (V8 inlines the slim body best), <code className="font-mono">skipOutAssign</code> for object/tuple/array (skip intermediate
                <code className="font-mono">outParam = input</code> writes), and <code className="font-mono">kindOf()</code> cross-module constructor-name dispatch (Vld* <code className="font-mono">instanceof</code> is unreliable across
                module boundaries). <code className="font-mono">try</code>/<code className="font-mono">catch</code> + <code className="font-mono">throw</code> is intentionally rejected — V8 does not apply the zero-cost exception optimization inside{' '}
                <code className="font-mono">new Function()</code> bodies, which made union parsing 100x slower in our measurements.
              </p>
            </div>
          </div>

          {/* v2.1.0 runtime/startup/memory snapshot — kept for context */}
          <div className="rounded-xl border border-border overflow-hidden mb-12">
            <div className="bg-muted/50 px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl font-semibold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-vld-primary" />
                  Runtime / Startup Guards (v2.1.0 snapshot)
                </h2>
                <p className="text-sm text-muted-foreground">Higher is better - normalized Zod baseline</p>
              </div>
              <div className="hidden sm:flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-vld-primary" />
                  <span>VLD</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-zinc-400 dark:bg-zinc-500" />
                  <span>Zod 4.4.3</span>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-6 py-4 font-medium">Test Case</th>
                    <th className="text-right px-6 py-4 font-medium text-vld-primary">VLD</th>
                    <th className="text-right px-6 py-4 font-medium">Zod 4.4.3</th>
                    <th className="text-right px-6 py-4 font-medium">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {runtimeStartupBenchmarks.map((bench, i) => (
                    <tr
                      key={bench.name}
                      className={cn(
                        'border-b border-border last:border-0 hover:bg-muted/50 transition-colors',
                        i % 2 === 0 ? 'bg-transparent' : 'bg-muted/20'
                      )}
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium">{bench.name}</div>
                        <div className="text-sm text-muted-foreground">{bench.description}</div>
                      </td>
                      <td className="text-right px-6 py-4 font-mono text-vld-primary font-semibold">
                        {formatOps(bench.vldOps)}
                      </td>
                      <td className="text-right px-6 py-4 font-mono text-muted-foreground">
                        {formatOps(bench.zodOps)}
                      </td>
                      <td className="text-right px-6 py-4">
                        {bench.winner === 'vld' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-vld-success/10 text-vld-success text-sm font-medium">
                            <TrendingUp className="w-3 h-3" />
                            {bench.ratio}x
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-500/10 text-zinc-500 text-sm font-medium">
                            <TrendingDown className="w-3 h-3" />
                            {bench.ratio}x
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Memory Benchmark Table */}
          <div className="rounded-xl border border-border overflow-hidden mb-12">
            <div className="bg-muted/50 px-6 py-4 border-b border-border">
              <h2 className="font-display text-xl font-semibold flex items-center gap-2">
                <Cpu className="w-5 h-5 text-vld-primary" />
                Memory Usage Results
              </h2>
              <p className="text-sm text-muted-foreground">Lower is better - measured with --expose-gc</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-6 py-4 font-medium">Test Case</th>
                    <th className="text-right px-6 py-4 font-medium text-vld-primary">VLD Heap</th>
                    <th className="text-right px-6 py-4 font-medium">Zod Heap</th>
                    <th className="text-right px-6 py-4 font-medium text-vld-primary">VLD/Op</th>
                    <th className="text-right px-6 py-4 font-medium">Zod/Op</th>
                    <th className="text-right px-6 py-4 font-medium">Winner</th>
                  </tr>
                </thead>
                <tbody>
                  {memoryBenchmarks.map((bench, i) => (
                    <tr
                      key={bench.name}
                      className={cn(
                        'border-b border-border last:border-0 hover:bg-muted/50 transition-colors',
                        i % 2 === 0 ? 'bg-transparent' : 'bg-muted/20'
                      )}
                    >
                      <td className="px-6 py-4 font-medium">{bench.name}</td>
                      <td className="text-right px-6 py-4 font-mono text-vld-primary">{bench.vldHeap}</td>
                      <td className="text-right px-6 py-4 font-mono text-muted-foreground">{bench.zodHeap}</td>
                      <td className="text-right px-6 py-4 font-mono text-vld-primary text-sm">{bench.vldMemPerOp}</td>
                      <td className="text-right px-6 py-4 font-mono text-muted-foreground text-sm">{bench.zodMemPerOp}</td>
                      <td className="text-right px-6 py-4">
                        {bench.winner === 'vld' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-vld-success/10 text-vld-success text-xs font-medium">
                            <CheckCircle2 className="w-3 h-3" />
                            VLD {bench.ratio}x
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-500/10 text-zinc-500 text-xs font-medium">
                            <AlertCircle className="w-3 h-3" />
                            Zod {bench.ratio}x
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bundle Size & Memory Comparison */}
          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="bg-muted/50 px-6 py-4 border-b border-border">
                <h3 className="font-semibold flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-vld-primary" />
                  Bundle Size (gzipped)
                </h3>
              </div>
              <div className="p-6 space-y-4">
                {bundleComparison.map((lib) => (
                  <div key={lib.library}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">{lib.library}</span>
                      <span className="text-muted-foreground">{lib.size} <span className="text-xs">({lib.raw} raw)</span></span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${lib.percentage}%`,
                          backgroundColor: lib.library === 'VLD' ? 'var(--color-vld-primary)' : '#a1a1aa'
                        }}
                      />
                    </div>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground mt-4">
                  * Bundle and package sizes are checked by the release gate.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border overflow-hidden">
              <div className="bg-muted/50 px-6 py-4 border-b border-border">
                <h3 className="font-semibold flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-vld-primary" />
                  Total Memory Usage
                </h3>
              </div>
              <div className="p-6 space-y-4">
                {memoryOverall.map((lib) => (
                  <div key={lib.library}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">{lib.library}</span>
                      <span className="text-muted-foreground">{lib.heap}</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${lib.percentage}%`,
                          backgroundColor: lib.library === 'VLD' ? 'var(--color-vld-primary)' : '#a1a1aa'
                        }}
                      />
                    </div>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground mt-4">
                  VLD retained heap is <strong className="text-vld-success">4.76x lower</strong> in the v2.1.0 guard
                </p>
              </div>
            </div>
          </div>

          {/* Methodology */}
          <div className="p-6 rounded-xl bg-muted/50 border border-border">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-vld-primary" />
              Methodology & Reproducibility
            </h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground mb-1">Environment</p>
                <ul className="space-y-1">
                  <li>• Node.js v24.13.0 (v2.4.0 AOT guard), v20 LTS (legacy guard)</li>
                  <li>• Windows 11 / macOS / Linux</li>
                  <li>• Zod 4.5.4 (AOT guard) / Zod 4.4.3 (legacy guard)</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Configuration</p>
                <ul className="space-y-1">
                  <li>• 200,000 iterations × 21 runs, median</li>
                  <li>• 40,000-iteration warmup before sampling</li>
                  <li>• <code className="font-mono">process.hrtime.bigint()</code> for ns-precision timing</li>
                  <li>• Zod parity, drop-in app, and package guards on the same release</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-sm text-muted-foreground">Run these benchmarks yourself:</p>
              <div className="p-3 rounded-lg bg-background/50 font-mono text-sm space-y-1">
                <div><span className="text-muted-foreground">$</span> ITER=200000 RUNS=21 node benchmarks/moltar-deep.cjs</div>
                <div><span className="text-muted-foreground">$</span> node benchmarks/compile-smoke.cjs</div>
                <div><span className="text-muted-foreground">$</span> npm run benchmark</div>
                <div><span className="text-muted-foreground">$</span> npm run release:check</div>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-8 p-4 rounded-lg border border-border bg-muted/30">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Note:</strong> Benchmark results may vary based on hardware, Node.js version, and system load.
              The v2.4.0 AOT guard is measured against Zod 4.5.4 (npm <code className="font-mono">latest</code> at audit time). The
              release gate compares against the installed latest stable Zod and must pass before publishing.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
