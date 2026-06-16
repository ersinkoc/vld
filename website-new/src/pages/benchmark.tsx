import { Zap, Clock, HardDrive, Cpu, TrendingUp, TrendingDown, BarChart3, Activity, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// Release guard snapshot from v2.1.0 against Zod 4.4.3.
const benchmarks = [
  {
    name: 'Runtime Guard Average',
    description: 'Focused validation throughput guard',
    vldOps: 11670000,
    zodOps: 1000000,
    winner: 'vld',
    ratio: 11.67
  },
  {
    name: 'Import Startup',
    description: 'Cold library import timing',
    vldOps: 1320000,
    zodOps: 1000000,
    winner: 'vld',
    ratio: 1.32
  },
  {
    name: 'Total Startup',
    description: 'Import, schema creation, and first validation',
    vldOps: 1550000,
    zodOps: 1000000,
    winner: 'vld',
    ratio: 1.55
  },
  {
    name: 'Warm Parse Startup',
    description: 'Repeated parse after startup warm-up',
    vldOps: 2900000,
    zodOps: 1000000,
    winner: 'vld',
    ratio: 2.90
  },
  {
    name: 'Memory Aggregate Speed',
    description: 'Aggregate memory guard throughput',
    vldOps: 3130000,
    zodOps: 1000000,
    winner: 'vld',
    ratio: 3.13
  },
]

// Memory guard snapshot from v2.1.0.
const memoryBenchmarks = [
  {
    name: 'Retained Heap',
    vldHeap: '1.00x',
    zodHeap: '4.76x',
    vldMemPerOp: 'baseline',
    zodMemPerOp: '4.76x',
    ratio: 4.76,
    winner: 'vld'
  },
  {
    name: 'Aggregate Speed',
    vldHeap: '3.13x',
    zodHeap: '1.00x',
    vldMemPerOp: 'faster',
    zodMemPerOp: 'baseline',
    ratio: 3.13,
    winner: 'vld'
  },
  {
    name: 'Package Install',
    vldHeap: '295 KiB',
    zodHeap: 'external',
    vldMemPerOp: '299 files',
    zodMemPerOp: 'reference',
    ratio: 1,
    winner: 'vld'
  }
]

const features = [
  { icon: Zap, title: '11x+ Runtime', description: 'Runtime guard averaged 11.67x faster than Zod 4.4.3 in the v2.1.0 release check', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  { icon: HardDrive, title: 'Package Verified', description: 'Bundle, tarball, install, exports, and declaration checks run before release', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { icon: Cpu, title: '4.7x Less Heap', description: 'Retained heap guard measured 4.76x less heap than Zod', color: 'text-green-500', bg: 'bg-green-500/10' },
  { icon: Clock, title: '1.5x Startup', description: 'Total startup guard measured 1.55x faster startup than Zod', color: 'text-purple-500', bg: 'bg-purple-500/10' },
]

const bundleComparison = [
  { library: 'VLD root', size: '53.0 KiB', raw: 'bundle', percentage: 50 },
  { library: 'VLD mini', size: '52.9 KiB', raw: 'bundle', percentage: 50 },
]

const memoryOverall = [
  { library: 'VLD', heap: '1.00x', percentage: 21 },
  { library: 'Zod 4.4.3', heap: '4.76x', percentage: 100 },
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
              Release-gated results comparing VLD vs Zod 4.4.3. Run <code className="text-vld-primary font-mono">npm run release:check</code> to verify the full gate.
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
              <div className="text-sm text-muted-foreground">Guards Won</div>
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
                    <th className="text-center px-4 py-4 font-medium w-20">Chart</th>
                    <th className="text-right px-6 py-4 font-medium text-vld-primary">VLD</th>
                    <th className="text-right px-6 py-4 font-medium">Zod 4.4.3</th>
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
                    <span className="text-xl font-bold text-vld-success">1.32x</span>
                    <span className="text-sm text-muted-foreground">faster</span>
                  </div>
                  <div className="text-xs text-vld-success mt-1">import guard</div>
                </div>
                <div className="p-4 rounded-lg bg-vld-success/10 border border-vld-success/20">
                  <div className="text-xs text-muted-foreground mb-1">Total Startup</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-vld-success">1.55x</span>
                    <span className="text-sm text-muted-foreground">faster</span>
                  </div>
                  <div className="text-xs text-vld-success mt-1">full startup guard</div>
                </div>
                <div className="p-4 rounded-lg bg-vld-success/10 border border-vld-success/20">
                  <div className="text-xs text-muted-foreground mb-1">Warm Parse</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-vld-success">2.90x</span>
                    <span className="text-sm text-muted-foreground">faster</span>
                  </div>
                  <div className="text-xs text-vld-success mt-1">warm guard</div>
                </div>
                <div className="p-4 rounded-lg bg-vld-success/10 border border-vld-success/20">
                  <div className="text-xs text-muted-foreground mb-1">Runtime Average</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-vld-success">11.67x</span>
                    <span className="text-sm text-muted-foreground">faster</span>
                  </div>
                  <div className="text-xs text-vld-success mt-1">runtime guard</div>
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
                  <li>• Zod 4.4.3</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Configuration</p>
                <ul className="space-y-1">
                  <li>• Runtime, startup, and memory guard scripts</li>
                  <li>• Zod parity and real app drop-in verification</li>
                  <li>• Package, install, docs, exports, and type checks</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-sm text-muted-foreground">Run these benchmarks yourself:</p>
              <div className="p-3 rounded-lg bg-background/50 font-mono text-sm space-y-1">
                <div><span className="text-muted-foreground">$</span> npm run benchmark</div>
                <div><span className="text-muted-foreground">$</span> npm run release:check</div>
                <div><span className="text-muted-foreground">$</span> npm run benchmark:memory</div>
                <div><span className="text-muted-foreground">$</span> npm run benchmark:startup</div>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-8 p-4 rounded-lg border border-border bg-muted/30">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Note:</strong> Benchmark results may vary based on hardware, Node.js version, and system load.
              These results are from the v2.1.0 release gate and may vary by hardware, Node.js version, and system load.
              The release gate compares against the installed latest stable Zod and must pass before publishing.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
