import { Zap, Clock, HardDrive, Cpu, TrendingUp, TrendingDown, BarChart3, Activity, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// Real benchmark data from npm run benchmark (100,000 iterations) - v1.5.0
const benchmarks = [
  {
    name: 'Simple String',
    description: 'Basic string validation',
    vldOps: 72998029,
    zodOps: 35975105,
    winner: 'vld',
    ratio: 2.03
  },
  {
    name: 'Email Validation',
    description: 'String with email format check',
    vldOps: 21826913,
    zodOps: 6720611,
    winner: 'vld',
    ratio: 3.25
  },
  {
    name: 'Number Validation',
    description: 'number().positive().int()',
    vldOps: 36269994,
    zodOps: 11237470,
    winner: 'vld',
    ratio: 3.23
  },
  {
    name: 'Simple Object',
    description: 'Object with 2 fields (name, age)',
    vldOps: 7100000,
    zodOps: 6900000,
    winner: 'vld',
    ratio: 1.02
  },
  {
    name: 'Complex Object',
    description: 'Nested object with arrays',
    vldOps: 1900000,
    zodOps: 1400000,
    winner: 'vld',
    ratio: 1.34
  },
  {
    name: 'Array Validation',
    description: 'Array of 5 numbers',
    vldOps: 7500000,
    zodOps: 5600000,
    winner: 'vld',
    ratio: 1.35
  },
  {
    name: 'Union Types',
    description: 'union(string, number)',
    vldOps: 7100000,
    zodOps: 5500000,
    winner: 'vld',
    ratio: 1.29
  },
  {
    name: 'Optional Values',
    description: 'string().optional()',
    vldOps: 36100000,
    zodOps: 11400000,
    winner: 'vld',
    ratio: 3.16
  },
  {
    name: 'SafeParse',
    description: 'safeParse() without throwing',
    vldOps: 60000000,
    zodOps: 22000000,
    winner: 'vld',
    ratio: 2.73
  },
  {
    name: 'Type Coercion',
    description: 'coerce.number() from string',
    vldOps: 20400000,
    zodOps: 20200000,
    winner: 'vld',
    ratio: 1.01
  },
  {
    name: 'Enum Validation',
    description: 'enum("admin", "user", ...)',
    vldOps: 60300000,
    zodOps: 28900000,
    winner: 'vld',
    ratio: 2.08
  },
  {
    name: 'Discriminated Union',
    description: 'discriminatedUnion with 3 variants',
    vldOps: 3600000,
    zodOps: 4600000,
    winner: 'zod',
    ratio: 1.27
  },
]

// Memory benchmark results from npm run benchmark:memory - v1.5.0
const memoryBenchmarks = [
  {
    name: 'Schema Creation',
    vldHeap: '2.1 MB',
    zodHeap: '98.5 MB',
    vldMemPerOp: '2.1 KB',
    zodMemPerOp: '98.5 KB',
    ratio: 46.9,
    winner: 'vld'
  },
  {
    name: 'Data Parsing',
    vldHeap: '15.3 MB',
    zodHeap: '31.2 MB',
    vldMemPerOp: '15.3 KB',
    zodMemPerOp: '31.2 KB',
    ratio: 2.04,
    winner: 'vld'
  },
  {
    name: 'Error Handling',
    vldHeap: '3.2 MB',
    zodHeap: '22.9 MB',
    vldMemPerOp: '3.2 KB',
    zodMemPerOp: '22.9 KB',
    ratio: 7.15,
    winner: 'vld'
  },
  {
    name: 'Overall Average',
    vldHeap: '6.9 MB',
    zodHeap: '50.9 MB',
    vldMemPerOp: '6.9 KB',
    zodMemPerOp: '50.9 KB',
    ratio: 7.38,
    winner: 'vld'
  },
]

const features = [
  { icon: Zap, title: '~2x Faster', description: 'VLD is on average 1.98x faster than Zod v4, winning 11/12 tests', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  { icon: HardDrive, title: '~45KB gzip', description: '45KB gzipped vs 150KB for Zod v4 (70% smaller)', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { icon: Cpu, title: '86% Less Memory', description: 'Uses 86% less memory overall in validation tasks', color: 'text-green-500', bg: 'bg-green-500/10' },
  { icon: Clock, title: '8x Schema Creation', description: 'Creates schemas 8.22x faster than Zod', color: 'text-purple-500', bg: 'bg-purple-500/10' },
]

const bundleComparison = [
  { library: 'VLD', size: '13 KB', raw: '45 KB', percentage: 30 },
  { library: 'Zod v4', size: '38 KB', raw: '150 KB', percentage: 100 },
]

const memoryOverall = [
  { library: 'VLD', heap: '6.9 MB', percentage: 14 },
  { library: 'Zod v4', heap: '50.9 MB', percentage: 100 },
]

function formatOps(ops: number): string {
  if (ops >= 1000000000) {
    return `${(ops / 1000000000).toFixed(1)}B`
  } else if (ops >= 1000000) {
    return `${(ops / 1000000).toFixed(1)}M`
  } else if (ops >= 1000) {
    return `${(ops / 1000).toFixed(1)}K`
  }
  return ops.toString()
}

function OpsChart({ vld, zod }: { vld: number; zod: number }) {
  const max = Math.max(vld, zod)
  return (
    <div className="flex items-end gap-1 h-10">
      <div
        className="w-5 bg-vld-primary rounded-t transition-all"
        style={{ height: `${(vld / max) * 100}%` }}
        title={`VLD: ${formatOps(vld)} ops/sec`}
      />
      <div
        className="w-5 bg-zinc-400 dark:bg-zinc-500 rounded-t transition-all"
        style={{ height: `${(zod / max) * 100}%` }}
        title={`Zod: ${formatOps(zod)} ops/sec`}
      />
    </div>
  )
}

export function BenchmarkPage() {
  const vldWins = benchmarks.filter(b => b.winner === 'vld').length
  const avgRatio = (benchmarks.reduce((acc, b) => acc + b.ratio, 0) / benchmarks.length).toFixed(2)

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
              Real benchmark results comparing VLD vs Zod v4. Run <code className="text-vld-primary font-mono">npm run benchmark</code> to verify.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            <div className="p-6 rounded-xl bg-gradient-to-br from-vld-primary/20 to-vld-secondary/20 border border-vld-primary/20">
              <div className="text-4xl font-bold gradient-text mb-1">{avgRatio}x</div>
              <div className="text-sm text-muted-foreground">Average Speedup</div>
            </div>
            <div className="p-6 rounded-xl bg-card border border-border">
              <div className="text-4xl font-bold text-vld-success mb-1">{vldWins}/{benchmarks.length}</div>
              <div className="text-sm text-muted-foreground">Tests Won</div>
            </div>
            <div className="p-6 rounded-xl bg-card border border-border">
              <div className="text-4xl font-bold text-vld-accent mb-1">0</div>
              <div className="text-sm text-muted-foreground">Dependencies</div>
            </div>
            <div className="p-6 rounded-xl bg-card border border-border">
              <div className="text-4xl font-bold text-vld-warning mb-1">100%</div>
              <div className="text-sm text-muted-foreground">TypeScript</div>
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

          {/* Performance Benchmark Table */}
          <div className="rounded-xl border border-border overflow-hidden mb-12">
            <div className="bg-muted/50 px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl font-semibold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-vld-primary" />
                  Performance Results (ops/sec)
                </h2>
                <p className="text-sm text-muted-foreground">Higher is better - 100,000 iterations</p>
              </div>
              <div className="hidden sm:flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-vld-primary" />
                  <span>VLD</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-zinc-400 dark:bg-zinc-500" />
                  <span>Zod v4</span>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-6 py-4 font-medium">Test Case</th>
                    <th className="text-center px-4 py-4 font-medium w-20">Chart</th>
                    <th className="text-right px-6 py-4 font-medium text-vld-primary">VLD</th>
                    <th className="text-right px-6 py-4 font-medium">Zod v4</th>
                    <th className="text-right px-6 py-4 font-medium">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {benchmarks.map((bench, i) => (
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
                      <td className="px-4 py-4">
                        <OpsChart vld={bench.vldOps} zod={bench.zodOps} />
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
                  * VLD includes 27+ locales. Core library is smaller when tree-shaken.
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
                  VLD uses <strong className="text-vld-success">86% less memory</strong> overall
                </p>
              </div>
            </div>
          </div>

          {/* Startup Benchmark */}
          <div className="rounded-xl border border-border overflow-hidden mb-12">
            <div className="bg-muted/50 px-6 py-4 border-b border-border">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-vld-primary" />
                Startup Performance
              </h3>
            </div>
            <div className="p-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-vld-success/10 border border-vld-success/20">
                  <div className="text-xs text-muted-foreground mb-1">Library Import</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-vld-success">12.3ms</span>
                    <span className="text-sm text-muted-foreground">vs 23.8ms</span>
                  </div>
                  <div className="text-xs text-vld-success mt-1">VLD 1.94x faster</div>
                </div>
                <div className="p-4 rounded-lg bg-vld-success/10 border border-vld-success/20">
                  <div className="text-xs text-muted-foreground mb-1">First Schema</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-vld-success">0.15ms</span>
                    <span className="text-sm text-muted-foreground">vs 1.23ms</span>
                  </div>
                  <div className="text-xs text-vld-success mt-1">VLD 8.22x faster</div>
                </div>
                <div className="p-4 rounded-lg bg-vld-success/10 border border-vld-success/20">
                  <div className="text-xs text-muted-foreground mb-1">First Validation</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-vld-success">0.21ms</span>
                    <span className="text-sm text-muted-foreground">vs 0.45ms</span>
                  </div>
                  <div className="text-xs text-vld-success mt-1">VLD 2.14x faster</div>
                </div>
                <div className="p-4 rounded-lg bg-vld-success/10 border border-vld-success/20">
                  <div className="text-xs text-muted-foreground mb-1">Warmed Up (avg)</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-vld-success">0.028ms</span>
                    <span className="text-sm text-muted-foreground">vs 0.051ms</span>
                  </div>
                  <div className="text-xs text-vld-success mt-1">VLD 1.82x faster</div>
                </div>
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
                  <li>• Node.js v20.x LTS</li>
                  <li>• Windows 11 / macOS / Linux</li>
                  <li>• Zod v4.0.17</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Configuration</p>
                <ul className="space-y-1">
                  <li>• 100,000 iterations per test</li>
                  <li>• process.hrtime.bigint() timing</li>
                  <li>• --expose-gc for memory tests</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-sm text-muted-foreground">Run these benchmarks yourself:</p>
              <div className="p-3 rounded-lg bg-background/50 font-mono text-sm space-y-1">
                <div><span className="text-muted-foreground">$</span> npm run benchmark</div>
                <div><span className="text-muted-foreground">$</span> npm run benchmark:memory</div>
                <div><span className="text-muted-foreground">$</span> npm run benchmark:startup</div>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-8 p-4 rounded-lg border border-border bg-muted/30">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Note:</strong> Benchmark results may vary based on hardware, Node.js version, and system load.
              These results are from actual <code className="text-vld-primary">npm run benchmark</code> runs.
              VLD wins 11/12 performance tests but Zod v4 is faster for discriminated union validation.
              Both libraries are excellent choices - pick based on your specific needs.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
