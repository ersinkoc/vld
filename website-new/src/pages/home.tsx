import { Link } from 'react-router-dom'
import { ArrowRight, Zap, Shield, Gauge, Package, Globe, Code, CheckCircle2, Sparkles, Copy, Check, GitCompare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CodeBlock } from '@/components/ui/code-block'
import { useState } from 'react'

const features = [
  { icon: Zap, title: 'Blazing Fast', description: 'On average 2.5x faster than Zod v4 with optimized V8 performance. Wins 9/10 benchmarks.' },
  { icon: Shield, title: 'Type-Safe', description: 'Full TypeScript inference. Your types are always in sync with your schemas.' },
  { icon: Package, title: 'Zero Dependencies', description: '~57KB gzipped (14% smaller than Zod). No bloat, just validation.' },
  { icon: Globe, title: '27+ Languages', description: 'Built-in i18n support for error messages. Turkish, German, Japanese and more.' },
  { icon: Gauge, title: 'Tree-Shakeable', description: 'Import only what you need. Modular architecture for optimal bundles.' },
  { icon: Code, title: 'Great DX', description: 'Intuitive, chainable API inspired by Zod. Easy migration path.' },
]

const quickExample = `import { v } from "@oxog/vld"

// Define your schema with full type inference
const userSchema = v.object({
  name: v.string().min(2).max(100),
  email: v.string().email(),
  age: v.number().int().positive().optional(),
  role: v.enum(["admin", "user", "guest"]),
  tags: v.array(v.string()).min(1),
})

// Infer TypeScript type from schema
type User = v.infer<typeof userSchema>

// Validate with detailed error handling
const result = userSchema.safeParse(data)
if (result.success) {
  console.log(result.data) // Fully typed!
} else {
  console.log(result.error.issues)
}`

const zodComparison = `// Zod
import { z } from "zod"
const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
})

// VLD - Same API, 2.5x faster on average
import { v } from "@oxog/vld"
const schema = v.object({
  name: v.string().min(2),
  email: v.string().email(),
})`

const codecsExample = `import { codecs } from "@oxog/vld"

// 19 built-in codecs for common transformations
const numCodec = codecs.stringToNumber
numCodec.decode("123")  // 123
numCodec.encode(123)    // "123"

// JWT payload extraction
const jwtCodec = codecs.jwtPayload
const payload = jwtCodec.decode(token)

// URL parsing with validation
const urlCodec = codecs.stringToHttpURL
const url = urlCodec.decode("https://example.com")`

const stats = [
  { value: '2.5x', label: 'Faster than Zod', detail: 'Benchmark proven' },
  { value: '0', label: 'Dependencies', detail: 'Zero bloat' },
  { value: '27+', label: 'Languages', detail: 'i18n built-in' },
  { value: '57KB', label: 'Gzipped', detail: '14% smaller' },
  { value: '19', label: 'Built-in Codecs', detail: 'Transform data' },
  { value: '9/10', label: 'Tests Won', detail: 'vs Zod v4' },
]

const comparisons = [
  { feature: 'Bundle Size (gzip)', vld: '57KB', zod: '66KB', winner: 'vld' },
  { feature: 'Avg Performance', vld: '2.5x faster', zod: 'baseline', winner: 'vld' },
  { feature: 'Memory Usage', vld: '3x less', zod: 'baseline', winner: 'vld' },
  { feature: 'TypeScript Inference', vld: 'Full', zod: 'Full', winner: 'tie' },
  { feature: 'Zero Dependencies', vld: '✓', zod: '✓', winner: 'tie' },
  { feature: 'Built-in i18n', vld: '27+ languages', zod: '✗', winner: 'vld' },
  { feature: 'Built-in Codecs', vld: '19 codecs', zod: '✗', winner: 'vld' },
  { feature: 'Simple Object Speed', vld: 'baseline', zod: '1.15x faster', winner: 'zod' },
]

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 transition-colors text-sm">
      {copied ? <Check className="w-4 h-4 text-vld-success" /> : <Copy className="w-4 h-4" />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

export function HomePage() {
  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-vld-primary/10 via-transparent to-vld-secondary/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-vld-primary/5 via-transparent to-transparent" />
        <div className="container mx-auto px-4 py-24 lg:py-32 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-vld-primary/10 border border-vld-primary/20 text-sm font-medium text-vld-primary mb-8 animate-fade-in">
              <Sparkles className="w-4 h-4" />
              <span>v1.4.0 - Now with 19 built-in codecs!</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Ultra-Fast Validation<br />
              for <span className="gradient-text">TypeScript</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              A lightning-fast, type-safe validation library with zero dependencies.
              Drop-in replacement for Zod, averaging 2.5x better performance.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <Button variant="gradient" size="xl" asChild>
                <Link to="/docs">Get Started <ArrowRight className="w-5 h-5" /></Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link to="/playground">Try Playground</Link>
              </Button>
            </div>
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 font-mono text-sm animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <span className="text-emerald-400">$</span>
              <code className="text-zinc-100">npm install @oxog/vld</code>
              <CopyButton text="npm install @oxog/vld" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-border bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {stats.map((stat, i) => (
              <div key={stat.label} className="text-center animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="text-3xl lg:text-4xl font-bold gradient-text mb-1">{stat.value}</div>
                <div className="text-sm font-medium mb-0.5">{stat.label}</div>
                <div className="text-xs text-muted-foreground">{stat.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Code Example Section */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">Simple, Intuitive API</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Define schemas with a clean, chainable API that feels natural.
                Get full TypeScript inference without any extra configuration.
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
                  <li key={item} className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                    <CheckCircle2 className="w-5 h-5 text-vld-success shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-4">
                <Button variant="outline" asChild>
                  <Link to="/docs">Documentation <ArrowRight className="w-4 h-4" /></Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/api">API Reference</Link>
                </Button>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border shadow-2xl overflow-hidden">
              <CodeBlock code={quickExample} language="typescript" filename="example.ts" showLineNumbers />
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-vld-primary/10 border border-vld-primary/20 text-sm font-medium text-vld-primary mb-4">
              <GitCompare className="w-4 h-4" />
              <span>Zod Comparison</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Why Switch to VLD?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              VLD is designed as a drop-in replacement for Zod with significantly better performance and extra features.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <CodeBlock code={zodComparison} language="typescript" filename="comparison.ts" showLineNumbers />
            </div>
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/50">
                <h3 className="font-semibold">Feature Comparison</h3>
              </div>
              <div className="divide-y divide-border">
                {comparisons.map((row) => (
                  <div key={row.feature} className="flex items-center p-4 hover:bg-muted/30 transition-colors">
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

          <div className="text-center mt-8">
            <Button variant="outline" asChild>
              <Link to="/benchmark">View Full Benchmarks <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Codecs Section */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 bg-card rounded-xl border border-border shadow-2xl overflow-hidden">
              <CodeBlock code={codecsExample} language="typescript" filename="codecs.ts" showLineNumbers />
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-vld-secondary/10 border border-vld-secondary/20 text-sm font-medium text-vld-secondary mb-4">
                <Sparkles className="w-4 h-4" />
                <span>New in v1.4</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">19 Built-in Codecs</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Transform and validate data with bidirectional codecs.
                Parse strings to numbers, dates, URLs, and more with type safety.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'String to Number/Int/BigInt conversion',
                  'ISO datetime and epoch to Date',
                  'JWT payload extraction',
                  'URL and URI component parsing',
                  'Base64/Hex binary encoding',
                  'JSON string parsing',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-vld-success shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Button variant="outline" asChild>
                <Link to="/api">Explore Codecs <ArrowRight className="w-4 h-4" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Why Choose VLD?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built for performance without sacrificing developer experience.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="p-6 rounded-xl bg-card border border-border hover:border-vld-primary/50 hover:shadow-lg hover:shadow-vld-primary/5 transition-all group animate-fade-in"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-vld-primary/20 to-vld-secondary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <f.icon className="w-6 h-6 text-vld-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-vld-primary/10 via-transparent to-vld-secondary/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-vld-secondary/5 via-transparent to-transparent" />
        <div className="container mx-auto px-4 text-center relative">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Ready to Validate Faster?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Join developers who switched from Zod to VLD for better performance without compromising on features.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Button variant="gradient" size="xl" asChild>
              <Link to="/docs">Get Started <ArrowRight className="w-5 h-5" /></Link>
            </Button>
            <Button variant="outline" size="xl" asChild>
              <a href="https://github.com/ersinkoc/vld" target="_blank" rel="noopener noreferrer">
                Star on GitHub
              </a>
            </Button>
          </div>
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 font-mono text-sm">
            <span className="text-emerald-400">$</span>
            <code className="text-zinc-100">npm install @oxog/vld</code>
          </div>
        </div>
      </section>
    </div>
  )
}
