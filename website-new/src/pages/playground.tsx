import { useState, useCallback } from 'react'
import { Play, RotateCcw, CheckCircle2, XCircle, Copy, Check, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

const presets = [
  {
    name: 'User Registration',
    code: `import { v } from "@oxog/vld"

const userSchema = v.object({
  name: v.string().min(2).max(50),
  email: v.string().email(),
  password: v.string().min(8).max(100),
  age: v.number().int().min(18).max(120).optional(),
  role: v.enum("admin", "user", "guest"),
  acceptTerms: v.boolean(),
})

type User = v.infer<typeof userSchema>`,
    data: `{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "age": 30,
  "role": "user",
  "acceptTerms": true
}`
  },
  {
    name: 'API Response',
    code: `import { v } from "@oxog/vld"

const apiResponseSchema = v.object({
  success: v.boolean(),
  data: v.object({
    items: v.array(v.object({
      id: v.number().int().positive(),
      title: v.string().min(1),
      completed: v.boolean(),
    })),
    total: v.number().int().min(0),
    page: v.number().int().positive(),
  }),
  timestamp: v.string(),
})

type ApiResponse = v.infer<typeof apiResponseSchema>`,
    data: `{
  "success": true,
  "data": {
    "items": [
      { "id": 1, "title": "Learn VLD", "completed": true },
      { "id": 2, "title": "Build awesome apps", "completed": false }
    ],
    "total": 2,
    "page": 1
  },
  "timestamp": "2024-01-15T10:30:00Z"
}`
  },
  {
    name: 'E-commerce Product',
    code: `import { v } from "@oxog/vld"

const productSchema = v.object({
  id: v.string().uuid(),
  name: v.string().min(1).max(200),
  description: v.string().max(5000).optional(),
  price: v.number().positive(),
  currency: v.enum("USD", "EUR", "GBP", "TRY"),
  stock: v.number().int().min(0),
  categories: v.array(v.string()).min(1),
  images: v.array(v.string().url()).max(10),
  metadata: v.record(v.string(), v.unknown()).optional(),
})

type Product = v.infer<typeof productSchema>`,
    data: `{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Wireless Headphones",
  "description": "Premium noise-cancelling headphones",
  "price": 299.99,
  "currency": "USD",
  "stock": 150,
  "categories": ["electronics", "audio"],
  "images": [
    "https://example.com/img1.jpg",
    "https://example.com/img2.jpg"
  ],
  "metadata": {
    "brand": "AudioTech",
    "warranty": "2 years"
  }
}`
  },
  {
    name: 'Nested Objects',
    code: `import { v } from "@oxog/vld"

const addressSchema = v.object({
  street: v.string().min(1),
  city: v.string().min(1),
  country: v.string().length(2),
  postalCode: v.string(),
})

const companySchema = v.object({
  name: v.string().min(1),
  employees: v.number().int().positive(),
  headquarters: addressSchema,
  branches: v.array(addressSchema).optional(),
  founded: v.number().int().min(1800).max(2024),
})

type Company = v.infer<typeof companySchema>`,
    data: `{
  "name": "Tech Corp",
  "employees": 500,
  "headquarters": {
    "street": "123 Main St",
    "city": "San Francisco",
    "country": "US",
    "postalCode": "94102"
  },
  "branches": [
    {
      "street": "456 Oak Ave",
      "city": "New York",
      "country": "US",
      "postalCode": "10001"
    }
  ],
  "founded": 2010
}`
  },
  {
    name: 'Form Validation',
    code: `import { v } from "@oxog/vld"

const contactFormSchema = v.object({
  firstName: v.string().min(1).max(50),
  lastName: v.string().min(1).max(50),
  email: v.string().email(),
  phone: v.string().regex(/^\\+?[1-9]\\d{1,14}$/).optional(),
  subject: v.enum("general", "support", "sales", "partnership"),
  message: v.string().min(10).max(2000),
  newsletter: v.boolean().default(false),
})

type ContactForm = v.infer<typeof contactFormSchema>`,
    data: `{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@example.com",
  "phone": "+1234567890",
  "subject": "support",
  "message": "I need help with my account. I cannot login anymore.",
  "newsletter": true
}`
  },
]

const invalidExamples = [
  {
    name: 'Invalid Email',
    data: `{
  "name": "John Doe",
  "email": "not-an-email",
  "password": "securePassword123",
  "role": "user",
  "acceptTerms": true
}`
  },
  {
    name: 'Missing Fields',
    data: `{
  "name": "John",
  "email": "john@example.com"
}`
  },
  {
    name: 'Wrong Types',
    data: `{
  "name": 123,
  "email": "john@example.com",
  "password": "pass",
  "age": "thirty",
  "role": "superuser",
  "acceptTerms": "yes"
}`
  },
]

export function PlaygroundPage() {
  const [code, setCode] = useState(presets[0].code)
  const [data, setData] = useState(presets[0].data)
  const [output, setOutput] = useState<{ success: boolean; message: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [showPresets, setShowPresets] = useState(false)
  const [activePreset, setActivePreset] = useState(presets[0].name)

  const runValidation = useCallback(() => {
    try {
      const parsedData = JSON.parse(data)

      // Simple mock validation logic
      const errors: Array<{ path: string[]; message: string }> = []

      // Check for common validation patterns in code
      if (code.includes('.email()') && parsedData.email && !parsedData.email.includes('@')) {
        errors.push({ path: ['email'], message: 'Invalid email format' })
      }
      if (code.includes('.min(') && parsedData.name && parsedData.name.length < 2) {
        errors.push({ path: ['name'], message: 'String must be at least 2 characters' })
      }
      if (code.includes('password') && parsedData.password && parsedData.password.length < 8) {
        errors.push({ path: ['password'], message: 'Password must be at least 8 characters' })
      }
      if (code.includes('.int()') && parsedData.age && !Number.isInteger(parsedData.age)) {
        errors.push({ path: ['age'], message: 'Must be an integer' })
      }
      if (code.includes('.positive()') && parsedData.price && parsedData.price <= 0) {
        errors.push({ path: ['price'], message: 'Must be positive' })
      }
      if (code.includes('.boolean()') && parsedData.acceptTerms !== undefined && typeof parsedData.acceptTerms !== 'boolean') {
        errors.push({ path: ['acceptTerms'], message: 'Must be a boolean' })
      }

      // Check for enum values
      const enumMatch = code.match(/v\.enum\(\[([^\]]+)\]\)/)
      if (enumMatch && parsedData.role) {
        const enumValues = enumMatch[1].split(',').map(s => s.trim().replace(/['"]/g, ''))
        if (!enumValues.includes(parsedData.role)) {
          errors.push({ path: ['role'], message: `Must be one of: ${enumValues.join(', ')}` })
        }
      }

      if (errors.length > 0) {
        setOutput({
          success: false,
          message: JSON.stringify({
            success: false,
            error: {
              issues: errors,
              message: `Validation failed with ${errors.length} error(s)`
            }
          }, null, 2)
        })
      } else {
        setOutput({
          success: true,
          message: JSON.stringify({
            success: true,
            data: parsedData
          }, null, 2)
        })
      }
    } catch (e) {
      setOutput({ success: false, message: 'JSON Parse Error: ' + (e as Error).message })
    }
  }, [code, data])

  const reset = () => {
    setCode(presets[0].code)
    setData(presets[0].data)
    setOutput(null)
    setActivePreset(presets[0].name)
  }

  const copyCode = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const selectPreset = (preset: typeof presets[0]) => {
    setCode(preset.code)
    setData(preset.data)
    setActivePreset(preset.name)
    setShowPresets(false)
    setOutput(null)
  }

  const tryInvalidExample = (example: typeof invalidExamples[0]) => {
    setData(example.data)
    setOutput(null)
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container-wide py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold mb-1">Playground</h1>
              <p className="text-muted-foreground">Try VLD validation in your browser</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Preset Dropdown */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPresets(!showPresets)}
                  className="min-w-[180px] justify-between"
                >
                  <span className="truncate">{activePreset}</span>
                  <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showPresets ? 'rotate-180' : ''}`} />
                </Button>
                {showPresets && (
                  <div className="absolute top-full mt-1 left-0 w-64 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                    <div className="p-2 border-b border-border bg-muted/50">
                      <span className="text-xs font-medium text-muted-foreground">PRESETS</span>
                    </div>
                    <div className="max-h-64 overflow-auto">
                      {presets.map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() => selectPreset(preset)}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${activePreset === preset.name ? 'bg-vld-primary/10 text-vld-primary' : ''}`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={reset}>
                <RotateCcw className="w-4 h-4 mr-2" />Reset
              </Button>
              <Button variant="outline" size="sm" onClick={copyCode}>
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button variant="gradient" size="sm" onClick={runValidation}>
                <Play className="w-4 h-4 mr-2" />Run
              </Button>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Panel - Schema & Data */}
            <div className="space-y-6">
              {/* Schema */}
              <div className="rounded-xl overflow-hidden border border-border bg-card shadow-sm">
                <div className="bg-muted/50 px-4 py-3 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/80" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                      <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <span className="font-medium text-sm ml-2">schema.ts</span>
                  </div>
                  <span className="text-xs text-muted-foreground">TypeScript</span>
                </div>
                <div className="relative">
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full h-80 font-mono text-sm bg-zinc-950 text-zinc-100 p-4 resize-none focus:outline-none leading-relaxed"
                    spellCheck={false}
                  />
                </div>
              </div>

              {/* Test Data */}
              <div className="rounded-xl overflow-hidden border border-border bg-card shadow-sm">
                <div className="bg-muted/50 px-4 py-3 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/80" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                      <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <span className="font-medium text-sm ml-2">data.json</span>
                  </div>
                  <span className="text-xs text-muted-foreground">JSON</span>
                </div>
                <div className="relative">
                  <textarea
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    className="w-full h-48 font-mono text-sm bg-zinc-950 text-zinc-100 p-4 resize-none focus:outline-none leading-relaxed"
                    spellCheck={false}
                  />
                </div>
              </div>

              {/* Quick Invalid Examples */}
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="text-sm font-medium mb-3">Try Invalid Data</h3>
                <div className="flex flex-wrap gap-2">
                  {invalidExamples.map((example) => (
                    <button
                      key={example.name}
                      onClick={() => tryInvalidExample(example)}
                      className="px-3 py-1.5 text-xs rounded-full border border-vld-error/30 text-vld-error hover:bg-vld-error/10 transition-colors"
                    >
                      {example.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Panel - Output */}
            <div className="rounded-xl overflow-hidden border border-border bg-card shadow-sm h-fit lg:sticky lg:top-24">
              <div className="bg-muted/50 px-4 py-3 border-b border-border flex items-center gap-2">
                {output && (
                  output.success
                    ? <CheckCircle2 className="w-4 h-4 text-vld-success" />
                    : <XCircle className="w-4 h-4 text-vld-error" />
                )}
                <span className="font-medium text-sm">Output</span>
                {output && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${output.success ? 'bg-vld-success/10 text-vld-success' : 'bg-vld-error/10 text-vld-error'}`}>
                    {output.success ? 'Valid' : 'Invalid'}
                  </span>
                )}
              </div>
              <div className="p-4 min-h-[500px] max-h-[600px] overflow-auto bg-zinc-950">
                {output ? (
                  <pre className="font-mono text-sm whitespace-pre-wrap">
                    <code className={output.success ? 'text-emerald-400' : 'text-red-400'}>
                      {output.message}
                    </code>
                  </pre>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                    <Play className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-sm">Click "Run" to validate your data</p>
                    <p className="text-xs mt-1 opacity-60">or press Ctrl/Cmd + Enter</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="mt-8 p-6 rounded-xl border border-border bg-card">
            <h3 className="font-semibold mb-4">Tips</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground">
              <div>
                <span className="font-medium text-foreground">Type Safety</span>
                <p>Use <code className="text-vld-primary">v.infer</code> to extract TypeScript types from your schemas.</p>
              </div>
              <div>
                <span className="font-medium text-foreground">Error Handling</span>
                <p>Use <code className="text-vld-primary">safeParse()</code> for validation without throwing errors.</p>
              </div>
              <div>
                <span className="font-medium text-foreground">Chaining</span>
                <p>Chain multiple validators like <code className="text-vld-primary">.min().max().email()</code></p>
              </div>
              <div>
                <span className="font-medium text-foreground">Optional Fields</span>
                <p>Use <code className="text-vld-primary">.optional()</code> or <code className="text-vld-primary">.nullable()</code> for optional values.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
