import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Search, ChevronDown, ChevronRight, Code2, Box, Layers, Wand2, Globe, FileCode, Binary, Shield } from 'lucide-react'
import { CodeBlock } from '@/components/ui/code-block'

interface ApiMethod {
  name: string
  description: string
  category: string
  signature?: string
  example?: string
  methods?: string[]
}

const apiMethods: ApiMethod[] = [
  // Primitives
  { name: 'v.string()', description: 'Creates a string validator with chainable methods', category: 'Primitives', signature: 'v.string(): VldString', methods: ['.min(n)', '.max(n)', '.length(n)', '.email()', '.url()', '.uuid()', '.regex(pattern)', '.startsWith(str)', '.endsWith(str)', '.includes(str)', '.trim()', '.toLowerCase()', '.toUpperCase()', '.nonempty()'], example: `const schema = v.string().min(2).max(100).email()` },
  { name: 'v.number()', description: 'Creates a number validator', category: 'Primitives', signature: 'v.number(): VldNumber', methods: ['.min(n)', '.max(n)', '.int()', '.positive()', '.negative()', '.nonnegative()', '.nonpositive()', '.finite()', '.safe()', '.multipleOf(n)'], example: `const schema = v.number().int().positive().max(100)` },
  { name: 'v.boolean()', description: 'Creates a boolean validator', category: 'Primitives', signature: 'v.boolean(): VldBoolean', example: `const schema = v.boolean()` },
  { name: 'v.bigint()', description: 'Creates a bigint validator', category: 'Primitives', signature: 'v.bigint(): VldBigInt', methods: ['.min(n)', '.max(n)', '.positive()', '.negative()', '.nonnegative()', '.nonpositive()'], example: `const schema = v.bigint().positive()` },
  { name: 'v.date()', description: 'Creates a date validator', category: 'Primitives', signature: 'v.date(): VldDate', methods: ['.min(date)', '.max(date)'], example: `const schema = v.date().min(new Date())` },
  { name: 'v.symbol()', description: 'Creates a symbol validator', category: 'Primitives', signature: 'v.symbol(): VldSymbol' },
  { name: 'v.int()', description: 'Shorthand for integer validation', category: 'Primitives', signature: 'v.int(): VldNumber', example: `const schema = v.int() // same as v.number().int()` },
  { name: 'v.int32()', description: '32-bit signed integer validation', category: 'Primitives', signature: 'v.int32(): VldNumber' },
  { name: 'v.null()', description: 'Validates null values only', category: 'Primitives', signature: 'v.null(): VldNull' },
  { name: 'v.undefined()', description: 'Validates undefined values only', category: 'Primitives', signature: 'v.undefined(): VldUndefined' },
  { name: 'v.void()', description: 'Alias for undefined validation', category: 'Primitives', signature: 'v.void(): VldUndefined' },
  { name: 'v.any()', description: 'Accepts any value without validation', category: 'Primitives', signature: 'v.any(): VldAny' },
  { name: 'v.unknown()', description: 'Unknown type validator', category: 'Primitives', signature: 'v.unknown(): VldUnknown' },
  { name: 'v.never()', description: 'Never type - always fails', category: 'Primitives', signature: 'v.never(): VldNever' },
  { name: 'v.nan()', description: 'Validates NaN values', category: 'Primitives', signature: 'v.nan(): VldNaN' },
  { name: 'v.stringbool()', description: 'String to boolean with custom truthy/falsy values', category: 'Primitives', signature: 'v.stringbool(options?): VldStringBool', example: `const schema = v.stringbool({ truthy: ['yes', '1'], falsy: ['no', '0'] })` },

  // Complex Types
  { name: 'v.object()', description: 'Creates an object validator with shape', category: 'Objects', signature: 'v.object(shape): VldObject', methods: ['.strict()', '.passthrough()', '.partial()', '.pick(keys)', '.omit(keys)', '.extend(shape)', '.merge(schema)', '.safeExtend(shape)'], example: `const schema = v.object({\n  name: v.string(),\n  age: v.number().optional()\n})` },
  { name: 'v.strictObject()', description: 'Strict object - no extra properties allowed', category: 'Objects', signature: 'v.strictObject(shape): VldObject' },
  { name: 'v.looseObject()', description: 'Loose object - extra properties pass through', category: 'Objects', signature: 'v.looseObject(shape): VldObject' },
  { name: 'v.array()', description: 'Creates an array validator', category: 'Arrays', signature: 'v.array(itemValidator): VldArray', methods: ['.min(n)', '.max(n)', '.length(n)', '.nonempty()', '.unique()'], example: `const schema = v.array(v.string()).min(1).max(10)` },
  { name: 'v.tuple()', description: 'Fixed-length array with specific types', category: 'Arrays', signature: 'v.tuple(items): VldTuple', example: `const schema = v.tuple([v.string(), v.number()])` },
  { name: 'v.set()', description: 'Set collection validator', category: 'Arrays', signature: 'v.set(itemValidator): VldSet', example: `const schema = v.set(v.string())` },
  { name: 'v.map()', description: 'Map collection validator', category: 'Arrays', signature: 'v.map(keyValidator, valueValidator): VldMap', example: `const schema = v.map(v.string(), v.number())` },
  { name: 'v.record()', description: 'Dictionary/record validator', category: 'Objects', signature: 'v.record(valueValidator): VldRecord', methods: ['.partial()', '.loose()'], example: `const schema = v.record(v.string(), v.number())` },
  { name: 'v.partialRecord()', description: 'Partial record with optional values', category: 'Objects', signature: 'v.partialRecord(valueValidator): VldRecord' },

  // Composition
  { name: 'v.union()', description: 'Union type - matches any of the validators', category: 'Composition', signature: 'v.union(validators): VldUnion', example: `const schema = v.union([v.string(), v.number()])` },
  { name: 'v.intersection()', description: 'Intersection type - must match all validators', category: 'Composition', signature: 'v.intersection(a, b): VldIntersection', example: `const schema = v.intersection(\n  v.object({ name: v.string() }),\n  v.object({ age: v.number() })\n)` },
  { name: 'v.discriminatedUnion()', description: 'Fast union with discriminator field (O(1) lookup)', category: 'Composition', signature: 'v.discriminatedUnion(key, options): VldDiscriminatedUnion', example: `const schema = v.discriminatedUnion("type", [\n  v.object({ type: v.literal("a"), a: v.string() }),\n  v.object({ type: v.literal("b"), b: v.number() })\n])` },
  { name: 'v.xor()', description: 'XOR validation - exactly one must match', category: 'Composition', signature: 'v.xor(options): VldXor', example: `const schema = v.xor([\n  v.object({ email: v.string() }),\n  v.object({ phone: v.string() })\n])` },
  { name: 'v.literal()', description: 'Validates exact literal value', category: 'Composition', signature: 'v.literal(value): VldLiteral', example: `const schema = v.literal("active")` },
  { name: 'v.enum()', description: 'Enum with fixed string values', category: 'Composition', signature: 'v.enum(values): VldEnum', example: `const schema = v.enum(["admin", "user", "guest"])` },

  // Utility Types
  { name: 'v.optional()', description: 'Makes validator accept undefined', category: 'Modifiers', signature: 'v.optional(validator): VldOptional', example: `const schema = v.optional(v.string())` },
  { name: 'v.nullable()', description: 'Makes validator accept null', category: 'Modifiers', signature: 'v.nullable(validator): VldNullable', example: `const schema = v.nullable(v.string())` },
  { name: 'v.nullish()', description: 'Makes validator accept null or undefined', category: 'Modifiers', signature: 'v.nullish(validator): VldNullish' },
  { name: 'v.lazy()', description: 'Deferred evaluation for recursive schemas', category: 'Modifiers', signature: 'v.lazy(getter): VldLazy', example: `type Node = { children: Node[] }\nconst nodeSchema: v.VldType<Node> = v.lazy(() =>\n  v.object({ children: v.array(nodeSchema) })\n)` },
  { name: 'v.preprocess()', description: 'Transform input before validation', category: 'Modifiers', signature: 'v.preprocess(fn, schema): VldPreprocess', example: `const schema = v.preprocess(\n  (val) => String(val).trim(),\n  v.string().min(1)\n)` },

  // String Formats (29 formats)
  { name: 'v.email()', description: 'Email address validation', category: 'String Formats', signature: 'v.email(options?): VldString' },
  { name: 'v.uuid()', description: 'UUID validation (all versions)', category: 'String Formats', signature: 'v.uuid(options?): VldString' },
  { name: 'v.uuidv4()', description: 'UUIDv4 specific validation', category: 'String Formats', signature: 'v.uuidv4(): VldString' },
  { name: 'v.hostname()', description: 'Hostname validation', category: 'String Formats', signature: 'v.hostname(): VldString' },
  { name: 'v.emoji()', description: 'Emoji validation', category: 'String Formats', signature: 'v.emoji(): VldString' },
  { name: 'v.base64()', description: 'Base64 string validation', category: 'String Formats', signature: 'v.base64(): VldString' },
  { name: 'v.base64url()', description: 'URL-safe Base64 validation', category: 'String Formats', signature: 'v.base64url(): VldString' },
  { name: 'v.hex()', description: 'Hexadecimal string validation', category: 'String Formats', signature: 'v.hex(): VldString' },
  { name: 'v.jwt()', description: 'JWT token format validation', category: 'String Formats', signature: 'v.jwt(): VldString' },
  { name: 'v.nanoid()', description: 'Nanoid validation', category: 'String Formats', signature: 'v.nanoid(): VldString' },
  { name: 'v.cuid()', description: 'CUID validation', category: 'String Formats', signature: 'v.cuid(): VldString' },
  { name: 'v.cuid2()', description: 'CUIDv2 validation', category: 'String Formats', signature: 'v.cuid2(): VldString' },
  { name: 'v.ulid()', description: 'ULID validation', category: 'String Formats', signature: 'v.ulid(): VldString' },
  { name: 'v.ipv4()', description: 'IPv4 address validation', category: 'String Formats', signature: 'v.ipv4(): VldString' },
  { name: 'v.ipv6()', description: 'IPv6 address validation', category: 'String Formats', signature: 'v.ipv6(): VldString' },
  { name: 'v.mac()', description: 'MAC address validation', category: 'String Formats', signature: 'v.mac(): VldString' },
  { name: 'v.cidrv4()', description: 'IPv4 CIDR block validation', category: 'String Formats', signature: 'v.cidrv4(): VldString' },
  { name: 'v.cidrv6()', description: 'IPv6 CIDR block validation', category: 'String Formats', signature: 'v.cidrv6(): VldString' },
  { name: 'v.e164()', description: 'E.164 phone number validation', category: 'String Formats', signature: 'v.e164(): VldString' },
  { name: 'v.hash()', description: 'Hash validation (md5, sha1, sha256, etc.)', category: 'String Formats', signature: 'v.hash(algorithm): VldString', example: `const schema = v.hash("sha256")` },
  { name: 'v.iso.date()', description: 'ISO 8601 date validation', category: 'String Formats', signature: 'v.iso.date(): VldString' },
  { name: 'v.iso.time()', description: 'ISO 8601 time validation', category: 'String Formats', signature: 'v.iso.time(): VldString' },
  { name: 'v.iso.dateTime()', description: 'ISO 8601 datetime validation', category: 'String Formats', signature: 'v.iso.dateTime(options?): VldString' },
  { name: 'v.iso.duration()', description: 'ISO 8601 duration validation', category: 'String Formats', signature: 'v.iso.duration(): VldString' },

  // Coercion
  { name: 'v.coerce.string()', description: 'Coerce any value to string', category: 'Coercion', signature: 'v.coerce.string(): VldString', example: `v.coerce.string().parse(123) // "123"` },
  { name: 'v.coerce.number()', description: 'Coerce string/boolean to number', category: 'Coercion', signature: 'v.coerce.number(): VldNumber', example: `v.coerce.number().parse("42") // 42` },
  { name: 'v.coerce.boolean()', description: 'Coerce string/number to boolean', category: 'Coercion', signature: 'v.coerce.boolean(): VldBoolean', example: `v.coerce.boolean().parse("true") // true` },
  { name: 'v.coerce.date()', description: 'Coerce string/number to Date', category: 'Coercion', signature: 'v.coerce.date(): VldDate', example: `v.coerce.date().parse("2024-01-15") // Date` },
  { name: 'v.coerce.bigint()', description: 'Coerce string/number to BigInt', category: 'Coercion', signature: 'v.coerce.bigint(): VldBigInt', example: `v.coerce.bigint().parse("123") // 123n` },

  // Advanced
  { name: 'v.json()', description: 'JSON string validation with optional schema', category: 'Advanced', signature: 'v.json(schema?): VldJson', example: `const schema = v.json(v.object({ name: v.string() }))` },
  { name: 'v.custom()', description: 'Create custom validator', category: 'Advanced', signature: 'v.custom(options): VldCustom', example: `const schema = v.custom({\n  parse: (val) => val instanceof MyClass,\n  message: "Must be MyClass instance"\n})` },
  { name: 'v.file()', description: 'File upload validation', category: 'Advanced', signature: 'v.file(): VldFile', example: `const schema = v.file().maxSize(5 * 1024 * 1024).mimeType(["image/png", "image/jpeg"])` },
  { name: 'v.function()', description: 'Function type validation', category: 'Advanced', signature: 'v.function(): VldFunction' },
  { name: 'v.templateLiteral()', description: 'Template literal type validation', category: 'Advanced', signature: 'v.templateLiteral(parts): VldTemplateLiteral', example: `const schema = v.templateLiteral(["user_", v.number()])` },

  // Binary
  { name: 'v.uint8Array()', description: 'Uint8Array validation', category: 'Binary', signature: 'v.uint8Array(): VldUint8Array' },
  { name: 'v.base64Bytes()', description: 'Base64-encoded bytes validation', category: 'Binary', signature: 'v.base64Bytes(): VldBase64Bytes' },
  { name: 'v.hexBytes()', description: 'Hex-encoded bytes validation', category: 'Binary', signature: 'v.hexBytes(): VldHexBytes' },

  // Methods
  { name: '.parse()', description: 'Validates and returns typed data, throws VldError on failure', category: 'Methods', signature: 'schema.parse(value): T', example: `const user = schema.parse(input) // throws if invalid` },
  { name: '.safeParse()', description: 'Validates and returns result object without throwing', category: 'Methods', signature: 'schema.safeParse(value): { success, data } | { success, error }', example: `const result = schema.safeParse(input)\nif (result.success) {\n  console.log(result.data)\n}` },
  { name: '.isValid()', description: 'Returns boolean indicating validity', category: 'Methods', signature: 'schema.isValid(value): boolean', example: `if (schema.isValid(input)) { ... }` },
  { name: '.parseOrDefault()', description: 'Parse with fallback default value', category: 'Methods', signature: 'schema.parseOrDefault(value, defaultValue): T' },
  { name: '.transform()', description: 'Transform validated output', category: 'Methods', signature: 'schema.transform(fn): VldTransform', example: `const schema = v.string().transform(s => s.toUpperCase())` },
  { name: '.refine()', description: 'Add custom validation logic', category: 'Methods', signature: 'schema.refine(predicate, message?): VldRefine', example: `const schema = v.string().refine(\n  s => s.includes("@"),\n  "Must contain @"\n)` },
  { name: '.superRefine()', description: 'Advanced refinement with context', category: 'Methods', signature: 'schema.superRefine(refinement): VldSuperRefine', example: `const schema = v.object({ ... }).superRefine((data, ctx) => {\n  if (data.a !== data.b) {\n    ctx.addIssue({ code: "custom", message: "Must match" })\n  }\n})` },
  { name: '.apply()', description: 'External function chaining', category: 'Methods', signature: 'schema.apply(fn): VldApply' },
  { name: '.default()', description: 'Provide default for undefined inputs', category: 'Methods', signature: 'schema.default(value): VldDefault', example: `const schema = v.string().default("anonymous")` },
  { name: '.catch()', description: 'Catch errors and return fallback', category: 'Methods', signature: 'schema.catch(fallback): VldCatch', example: `const schema = v.number().catch(0)` },
  { name: '.optional()', description: 'Allow undefined', category: 'Methods', signature: 'schema.optional(): VldOptional' },
  { name: '.nullable()', description: 'Allow null', category: 'Methods', signature: 'schema.nullable(): VldNullable' },
  { name: '.nullish()', description: 'Allow null or undefined', category: 'Methods', signature: 'schema.nullish(): VldNullish' },

  // Codecs
  { name: 'codecs.stringToNumber', description: 'Parse string to number (bidirectional)', category: 'Codecs', signature: 'codecs.stringToNumber', example: `codecs.stringToNumber.decode("123") // 123\ncodecs.stringToNumber.encode(123) // "123"` },
  { name: 'codecs.stringToInt', description: 'Parse string to integer', category: 'Codecs', signature: 'codecs.stringToInt' },
  { name: 'codecs.stringToBigInt', description: 'Parse string to BigInt', category: 'Codecs', signature: 'codecs.stringToBigInt' },
  { name: 'codecs.stringToBoolean', description: 'Parse string to boolean', category: 'Codecs', signature: 'codecs.stringToBoolean' },
  { name: 'codecs.isoDatetimeToDate', description: 'ISO 8601 string to Date', category: 'Codecs', signature: 'codecs.isoDatetimeToDate' },
  { name: 'codecs.epochSecondsToDate', description: 'Unix seconds to Date', category: 'Codecs', signature: 'codecs.epochSecondsToDate' },
  { name: 'codecs.epochMillisToDate', description: 'Unix milliseconds to Date', category: 'Codecs', signature: 'codecs.epochMillisToDate' },
  { name: 'codecs.jsonCodec', description: 'JSON string codec with optional validation', category: 'Codecs', signature: 'codecs.jsonCodec(schema?)' },
  { name: 'codecs.base64Json', description: 'Base64-encoded JSON codec', category: 'Codecs', signature: 'codecs.base64Json(schema?)' },
  { name: 'codecs.stringToURL', description: 'String to URL object', category: 'Codecs', signature: 'codecs.stringToURL' },
  { name: 'codecs.stringToHttpURL', description: 'String to HTTP/HTTPS URL', category: 'Codecs', signature: 'codecs.stringToHttpURL' },
  { name: 'codecs.uriComponent', description: 'URI component encoding/decoding', category: 'Codecs', signature: 'codecs.uriComponent' },
  { name: 'codecs.base64ToBytes', description: 'Base64 to Uint8Array', category: 'Codecs', signature: 'codecs.base64ToBytes' },
  { name: 'codecs.hexToBytes', description: 'Hex string to Uint8Array', category: 'Codecs', signature: 'codecs.hexToBytes' },
  { name: 'codecs.utf8ToBytes', description: 'UTF-8 string to Uint8Array', category: 'Codecs', signature: 'codecs.utf8ToBytes' },
  { name: 'codecs.jwtPayload', description: 'JWT payload decoder', category: 'Codecs', signature: 'codecs.jwtPayload(schema?)' },

  // Error Handling
  { name: 'prettifyError()', description: 'Convert error to human-readable format', category: 'Errors', signature: 'prettifyError(error): string', example: `if (!result.success) {\n  console.log(prettifyError(result.error))\n}` },
  { name: 'flattenError()', description: 'Convert error to flat form structure', category: 'Errors', signature: 'flattenError(error): FlattenedError', example: `const { fieldErrors } = flattenError(result.error)` },
  { name: 'treeifyError()', description: 'Convert error to nested tree structure', category: 'Errors', signature: 'treeifyError(error): ErrorTree' },

  // i18n
  { name: 'setLocale()', description: 'Set global validation message locale', category: 'i18n', signature: 'setLocale(locale: string): void', example: `setLocale("tr") // Turkish\nsetLocale("ja") // Japanese` },
  { name: 'getLocale()', description: 'Get current locale', category: 'i18n', signature: 'getLocale(): string' },
  { name: 'getMessages()', description: 'Get all messages for current locale', category: 'i18n', signature: 'getMessages(): Messages' },
]

const categoryIcons: Record<string, React.ElementType> = {
  'Primitives': Code2,
  'Objects': Box,
  'Arrays': Layers,
  'Composition': Layers,
  'Modifiers': Wand2,
  'String Formats': FileCode,
  'Coercion': Wand2,
  'Advanced': Shield,
  'Binary': Binary,
  'Methods': Code2,
  'Codecs': Wand2,
  'Errors': Shield,
  'i18n': Globe,
}

export function ApiPage() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const categories = [...new Set(apiMethods.map(m => m.category))]

  const filtered = apiMethods.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = !activeCategory || m.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const toggleExpand = (name: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
  }

  const groupedMethods = categories.reduce((acc, cat) => {
    acc[cat] = filtered.filter(m => m.category === cat)
    return acc
  }, {} as Record<string, ApiMethod[]>)

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">API Reference</h1>
            <p className="text-lg text-muted-foreground">
              Complete API documentation for VLD. {apiMethods.length} methods across {categories.length} categories.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="sticky top-20 z-40 bg-background/95 backdrop-blur-sm py-4 mb-6 -mx-4 px-4 border-b border-border">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search API methods..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-vld-primary/50"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveCategory(null)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    !activeCategory ? 'bg-vld-primary text-white' : 'bg-muted hover:bg-muted/80'
                  )}
                >
                  All ({apiMethods.length})
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {categories.map(cat => {
                const count = apiMethods.filter(m => m.category === cat).length
                const Icon = categoryIcons[cat] || Code2
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5',
                      activeCategory === cat ? 'bg-vld-primary text-white' : 'bg-muted hover:bg-muted/80'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {cat} ({count})
                  </button>
                )
              })}
            </div>
          </div>

          {/* Results */}
          <div className="space-y-8">
            {(activeCategory ? [activeCategory] : categories).map(category => {
              const methods = groupedMethods[category]
              if (!methods || methods.length === 0) return null

              const Icon = categoryIcons[category] || Code2

              return (
                <div key={category}>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 sticky top-40 bg-background py-2">
                    <Icon className="w-5 h-5 text-vld-primary" />
                    {category}
                    <span className="text-sm font-normal text-muted-foreground">({methods.length})</span>
                  </h2>
                  <div className="space-y-3">
                    {methods.map((method) => {
                      const isExpanded = expandedItems.has(method.name)
                      const hasDetails = method.example || method.methods

                      return (
                        <div
                          key={method.name}
                          className={cn(
                            'rounded-lg border border-border bg-card transition-all',
                            hasDetails && 'cursor-pointer hover:border-vld-primary/50'
                          )}
                        >
                          <div
                            className="p-4 flex items-start justify-between gap-4"
                            onClick={() => hasDetails && toggleExpand(method.name)}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <code className="text-base font-mono font-semibold text-vld-primary">
                                  {method.name}
                                </code>
                                {method.signature && (
                                  <code className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded hidden sm:inline">
                                    {method.signature}
                                  </code>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{method.description}</p>
                              {method.methods && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {method.methods.slice(0, 5).map(m => (
                                    <code key={m} className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                                      {m}
                                    </code>
                                  ))}
                                  {method.methods.length > 5 && (
                                    <span className="text-xs text-muted-foreground">+{method.methods.length - 5} more</span>
                                  )}
                                </div>
                              )}
                            </div>
                            {hasDetails && (
                              <div className="text-muted-foreground">
                                {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                              </div>
                            )}
                          </div>

                          {isExpanded && hasDetails && (
                            <div className="border-t border-border">
                              {method.methods && method.methods.length > 5 && (
                                <div className="p-4 border-b border-border">
                                  <h4 className="text-sm font-medium mb-2">All Methods</h4>
                                  <div className="flex flex-wrap gap-1">
                                    {method.methods.map(m => (
                                      <code key={m} className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                        {m}
                                      </code>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {method.example && (
                                <div className="overflow-hidden">
                                  <CodeBlock
                                    code={method.example}
                                    language="typescript"
                                    filename="example.ts"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No methods found matching "{search}"</p>
            </div>
          )}

          {/* Supported Locales */}
          <div className="mt-12 p-6 rounded-xl bg-muted/50 border border-border">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-vld-primary" />
              Supported Locales (27+)
            </h3>
            <div className="flex flex-wrap gap-2">
              {['en', 'tr', 'de', 'fr', 'es', 'es-MX', 'pt', 'pt-BR', 'it', 'nl', 'pl', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi', 'bn', 'th', 'vi', 'id', 'sv', 'no', 'da', 'fi', 'af', 'sw'].map(locale => (
                <code key={locale} className="text-xs bg-background px-2 py-1 rounded border border-border">
                  {locale}
                </code>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
