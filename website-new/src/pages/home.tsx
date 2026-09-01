import { Link } from 'react-router-dom'
import { ArrowRight, Zap, Shield, Package, Code, CheckCircle2, Sparkles, GitCompare, Terminal, Cpu, Languages, Layers, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CodeBlock, CommandLine } from '@/components/ui/code-block'

const features = [
  {
    icon: Zap,
    title: '3.00x Faster Drop-in',
    description: '`import { z } from "@oxog/vld"` is a true drop-in for Zod 4.5.4. 3.00x geomean (10/10 honest wins, semantic-checked).',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: Layers,
    title: 'V2 Method-Memoization',
    description: 'Opt into the V2 path via `vV2`, `v.setV2Mode(true)`, or `v.*V2()`. Same surface, 1.6-10x less memory per instance.',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    icon: AlertCircle,
    title: 'ZodError Compatible',
    description: '`toZodError()` returns a ZodError-shaped error with `.format()` and `.flatten()` for downstream tooling.',
    color: 'from-rose-500 to-pink-500',
  },
  {
    icon: Shield,
    title: 'Type-Safe',
    description: 'Full TypeScript inference. Your types are always in sync with your schemas.',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Package,
    title: 'Zero Dependencies',
    description: 'No runtime dependencies, verified package exports, installability, and type declarations.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Languages,
    title: '27+ Languages',
    description: 'Built-in i18n support. Turkish, German, Japanese, and many more.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Cpu,
    title: 'Drop-in Subpaths',
    description: 'Root, v4, v4-mini, v4/core, and v4/locales entry points are checked against Zod.',
    color: 'from-rose-500 to-red-500',
  },
  {
    icon: Code,
    title: 'Real App Verified',
    description: 'The same TypeScript fixture is compiled and run with Zod and built VLD.',
    color: 'from-indigo-500 to-violet-500',
  },
]

const quickExample = `// v3.0.0 — true drop-in for Zod 4.5.4
//   import { z } from "@oxog/vld"   // literally the same as import { z } from "zod"
//   benchmarks/dropin-vs-zod.cjs  — 10/10 wins, 3.00x geomean (semantic-checked)

import { z } from "@oxog/vld"
import { toZodError } from "@oxog/vld"

const userSchema = z.object({
  name:  z.string().min(2).max(100),
  email: z.string().email(),
  age:   z.number().int().positive().optional(),
  role:  z.enum("admin", "user", "guest"),
  tags:  z.array(z.string()).min(1),
})

// Infer TypeScript type from schema
type User = typeof userSchema extends { _output: infer O } ? O : never

// ZodError-shaped errors (v3.0)
const result = userSchema.safeParse(data)
if (!result.success) {
  const zodErr = toZodError(result.error)
  console.log(zodErr.format())    // { name: { _errors: ['...'] } }
  console.log(zodErr.flatten())  // { formErrors: [], fieldErrors: {...} }
} else {
  console.log(result.data) // Fully typed!
}`

const zodComparison = `// Zod 4.5.4
import { z } from "zod"
const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
})

// VLD v3.0.0 — true drop-in: only the import line changes
//   3.00x faster (benchmarks/dropin-vs-zod.cjs, 10/10 wins, semantic-checked)
import { z } from "@oxog/vld"   // <- THAT'S IT
const schema = z.object({        // <- same code, 3.00x faster
  name: z.string().min(2),
  email: z.string().email(),
})

// Or opt into V2 method-memoization explicitly:
import { vV2 as z } from "@oxog/vld"
const schema = z.object({ name: z.string().min(2) })`

const resultPatternExample = `import { Ok, Err, match, tryCatch } from "@oxog/vld"

// Result Pattern - Functional error handling
// (unchanged from v3.0 — same surface)
const result = tryCatch(() => JSON.parse(data))
const value = match(result, {
  ok: (data) => data.name,
  err: (e) => "default"
})

// Plugin System - Extend VLD
const myPlugin = definePlugin({
  name: "my-plugin",
  validators: {
    phone: () => v.string().regex(/^\\+?[1-9]\\d{1,14}$/)
  }
})`

const stats = [
  { value: '3.00x', label: 'Drop-in Faster', sublabel: '10/10 vs Zod 4.5.4' },
  { value: '10/10', label: 'Honest Wins', sublabel: 'semantic-checked' },
  { value: '0', label: 'Dependencies', sublabel: 'zero bloat' },
  { value: '3031', label: 'Tests Passing', sublabel: '104 test suites' },
]

const comparisons = [
  { feature: 'Drop-in Replacement', vld: '3.00x faster (10/10)', zod: 'baseline', winner: 'vld' },
  { feature: 'True z Alias', vld: 'import { z } from "@oxog/vld"', zod: 'native', winner: 'tie' },
  { feature: 'V2 Method-Memoization', vld: 'opt-in via vV2 / setV2Mode', zod: 'baseline', winner: 'vld' },
  { feature: 'AOT Compile (parse)', vld: '1.46x faster (5/6)', zod: 'baseline', winner: 'vld' },
  { feature: 'AOT Compile (validate)', vld: '2.36x faster (6/6)', zod: 'baseline', winner: 'vld' },
  { feature: 'V2 Memory Footprint', vld: '1.6-10x smaller', zod: 'baseline', winner: 'vld' },
  { feature: 'Zod 4.5.4 Parity', vld: '253/253 exports', zod: 'reference', winner: 'vld' },
  { feature: 'ZodError Adapter', vld: 'toZodError() + .format() + .flatten()', zod: 'native', winner: 'tie' },
  { feature: 'Built-in i18n', vld: '27+ langs', zod: 'None', winner: 'vld' },
  { feature: 'Built-in Codecs', vld: '19 codecs', zod: 'None', winner: 'vld' },
]

export function HomePage() {
  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial opacity-30" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-vld-accent/10 rounded-full blur-3xl" />

        <div className="container-wide relative py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left: Content */}
            <div className="max-w-xl">
              <div className="animate-fade-in">
                <div className="tag mb-6">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>v3.0.0 — true Zod 4.5.4 drop-in, 3.00x faster (10/10 honest head-to-head)</span>
                </div>
              </div>

              <h1 className="animate-fade-in stagger-1 font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-balance">
                Ultra-Fast Validation for{' '}
                <span className="gradient-text">TypeScript</span>
              </h1>

              <p className="animate-fade-in stagger-2 text-lg text-muted-foreground mb-8 leading-relaxed">
                A lightning-fast, type-safe validation library with zero dependencies. V3.0.0 is a <strong>true drop-in replacement for Zod 4.5.4</strong> — just change <code className="font-mono text-vld-primary">import {'{ z }'}</code> from <code className="font-mono">"zod"</code> to <code className="font-mono text-vld-primary">"@oxog/vld"</code> and you&apos;re done. <strong>3.00x faster</strong> geometric mean (10/10 scenarios, 1M safeParse ops × 21 runs, semantic-checked). <code className="font-mono text-vld-primary">toZodError()</code> returns ZodError-shaped errors with <code className="font-mono">.format()</code> and <code className="font-mono">.flatten()</code>.
              </p>

              <div className="animate-fade-in stagger-3 flex flex-wrap items-center gap-4 mb-10">
                <Button variant="gradient" size="xl" asChild>
                  <Link to="/docs">
                    Get Started
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="xl" asChild>
                  <Link to="/playground">Try Playground</Link>
                </Button>
              </div>

              <div className="animate-fade-in stagger-4">
                <CommandLine command="npm install @oxog/vld" />
              </div>
            </div>

            {/* Right: Code Preview */}
            <div className="animate-fade-in stagger-5 lg:pl-8">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-vld-primary/20 to-cyan-500/20 rounded-2xl blur-2xl opacity-50" />
                <CodeBlock
                  code={quickExample}
                  language="typescript"
                  filename="schema.ts"
                  showLineNumbers
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-16 border-y border-border bg-muted/30">
        <div className="container-wide">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className="text-center animate-fade-in"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="font-display text-4xl lg:text-5xl font-bold gradient-text mb-1">
                  {stat.value}
                </div>
                <div className="font-medium text-foreground">{stat.label}</div>
                <div className="text-sm text-muted-foreground">{stat.sublabel}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Simple API Section */}
      <section className="py-24 lg:py-32">
        <div className="container-wide">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="tag mb-4">
                <Terminal className="w-3.5 h-3.5" />
                <span>Simple API</span>
              </div>
              <h2 className="font-display text-3xl lg:text-4xl font-bold mb-6">
                Intuitive, Chainable API
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Define schemas with a clean, chainable API that feels natural.
                Get full TypeScript inference without any configuration.
              </p>

              <ul className="space-y-4 mb-8">
                {[
                  'Full type inference from schemas',
                  'Chainable validation methods',
                  'Detailed, localized error messages',
                  'safeParse for error handling',
                  'Custom refinements and transforms',
                  'Async validation support',
                ].map((item, i) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 animate-fade-in"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <div className="w-5 h-5 rounded-full bg-vld-success/20 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-vld-success" />
                    </div>
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="flex gap-4">
                <Button variant="primary" asChild>
                  <Link to="/docs">
                    Documentation
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/api">API Reference</Link>
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-2xl blur-2xl" />
              <CodeBlock
                code={resultPatternExample}
                language="typescript"
                filename="features.ts"
                showLineNumbers
              />
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-24 lg:py-32 bg-muted/30">
        <div className="container-wide">
          <div className="text-center mb-16">
            <div className="tag mx-auto mb-4">
              <GitCompare className="w-3.5 h-3.5" />
              <span>Zod Comparison</span>
            </div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold mb-4">
              Why Switch to VLD?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Drop-in replacement for Zod with release-gated performance and package compatibility.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            <CodeBlock
              code={zodComparison}
              language="typescript"
              filename="comparison.ts"
              showLineNumbers
            />

            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/50">
                <h3 className="font-display font-semibold">Feature Comparison</h3>
              </div>
              <div className="divide-y divide-border">
                {comparisons.map((row) => (
                  <div
                    key={row.feature}
                    className="flex items-center p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex-1 text-sm font-medium">{row.feature}</div>
                    <div className={`w-28 text-center text-sm ${row.winner === 'vld' ? 'text-vld-success font-semibold' : ''}`}>
                      {row.vld}
                    </div>
                    <div className={`w-28 text-center text-sm ${row.winner === 'zod' ? 'text-vld-success font-semibold' : 'text-muted-foreground'}`}>
                      {row.zod}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center mt-10">
            <Button variant="outline" asChild>
              <Link to="/benchmark">
                View Full Benchmarks
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 lg:py-32">
        <div className="container-wide">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl lg:text-4xl font-bold mb-4">
              Why Choose VLD?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built for performance without sacrificing developer experience.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="group p-6 rounded-xl bg-card border border-border hover:border-transparent transition-all duration-300 animate-fade-in relative overflow-hidden"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {/* Hover gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-5 transition-opacity`} />

                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial opacity-40" />

        <div className="container-wide relative text-center">
          <h2 className="font-display text-3xl lg:text-5xl font-bold mb-6">
            Ready to Validate Faster?
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            Swap the package name, keep the Zod-shaped imports, and verify with the same release checks used by VLD.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Button variant="gradient" size="xl" asChild>
              <Link to="/docs">
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="outline" size="xl" asChild>
              <a href="https://github.com/ersinkoc/vld" target="_blank" rel="noopener noreferrer">
                Star on GitHub
              </a>
            </Button>
          </div>

          <CommandLine command="npm install @oxog/vld" className="max-w-md mx-auto" />
        </div>
      </section>
    </div>
  )
}
