import { useState } from 'react'
import { BookOpen, Code2, Boxes, Settings, FileCode, Layers, Braces, Hash, ToggleLeft, ListOrdered, FileJson, GitBranch, Repeat, AlertTriangle, Globe } from 'lucide-react'
import { CodeBlock } from '@/components/ui/code-block'
import { cn } from '@/lib/utils'

const sidebarSections = [
  {
    title: 'Getting Started',
    icon: BookOpen,
    items: [
      { title: 'Introduction', slug: 'introduction' },
      { title: 'Installation', slug: 'installation' },
      { title: 'Quick Start', slug: 'quick-start' },
      { title: 'Why VLD?', slug: 'why-vld' },
    ],
  },
  {
    title: 'Basic Types',
    icon: Code2,
    items: [
      { title: 'String', slug: 'string' },
      { title: 'Number', slug: 'number' },
      { title: 'Boolean', slug: 'boolean' },
      { title: 'Date', slug: 'date' },
      { title: 'BigInt', slug: 'bigint' },
    ],
  },
  {
    title: 'Complex Types',
    icon: Boxes,
    items: [
      { title: 'Array', slug: 'array' },
      { title: 'Object', slug: 'object' },
      { title: 'Record', slug: 'record' },
      { title: 'Tuple', slug: 'tuple' },
      { title: 'Enum', slug: 'enum' },
      { title: 'Union', slug: 'union' },
    ],
  },
  {
    title: 'Advanced',
    icon: Layers,
    items: [
      { title: 'Codecs', slug: 'codecs' },
      { title: 'Transformations', slug: 'transformations' },
      { title: 'Refinements', slug: 'refinements' },
      { title: 'Coercion', slug: 'coercion' },
      { title: 'Error Handling', slug: 'errors' },
    ],
  },
  {
    title: 'Configuration',
    icon: Settings,
    items: [
      { title: 'Localization', slug: 'localization' },
      { title: 'Custom Messages', slug: 'custom-messages' },
    ],
  },
]

const docContent: Record<string, { title: string; description: string; code: string; lang: string; tips?: string[] }> = {
  introduction: {
    title: 'Introduction',
    description: 'VLD is an ultra-fast, type-safe validation library for TypeScript. It provides a clean, chainable API similar to Zod but with significantly better performance.',
    code: `import { v } from "@oxog/vld"

// Define a schema
const userSchema = v.object({
  name: v.string().min(2).max(100),
  email: v.string().email(),
  age: v.number().int().positive().optional(),
})

// Infer TypeScript types
type User = v.infer<typeof userSchema>

// Validate data
const result = userSchema.safeParse({
  name: "John Doe",
  email: "john@example.com",
  age: 30,
})

if (result.success) {
  console.log(result.data) // Fully typed User!
} else {
  console.log(result.error.issues)
}`,
    lang: 'typescript',
    tips: [
      'VLD is on average 2.5x faster than Zod v4 (wins 9/10 benchmarks)',
      'Zero dependencies - 57KB gzipped (14% smaller than Zod)',
      'Full TypeScript inference',
      '27+ languages supported',
    ],
  },
  installation: {
    title: 'Installation',
    description: 'Install VLD using your preferred package manager.',
    code: `# npm
npm install @oxog/vld

# yarn
yarn add @oxog/vld

# pnpm
pnpm add @oxog/vld

# bun
bun add @oxog/vld`,
    lang: 'bash',
    tips: [
      'VLD has zero dependencies',
      'Works with Node.js, Deno, and browsers',
      'Full ESM and CommonJS support',
    ],
  },
  'quick-start': {
    title: 'Quick Start',
    description: 'Get started with VLD in just a few lines of code.',
    code: `import { v } from "@oxog/vld"

// 1. Define your schema
const schema = v.object({
  username: v.string().min(3).max(20),
  email: v.string().email(),
  password: v.string().min(8),
  age: v.number().int().min(18).optional(),
})

// 2. Extract the TypeScript type
type FormData = v.infer<typeof schema>

// 3. Validate with parse (throws on error)
try {
  const data = schema.parse(formInput)
  // data is typed as FormData
} catch (error) {
  console.error(error)
}

// 4. Or use safeParse (returns result object)
const result = schema.safeParse(formInput)
if (result.success) {
  const data = result.data // typed as FormData
} else {
  const errors = result.error.issues
}`,
    lang: 'typescript',
  },
  'why-vld': {
    title: 'Why VLD?',
    description: 'VLD was built to address performance limitations in existing validation libraries while maintaining a familiar, ergonomic API.',
    code: `// VLD advantages over alternatives:

// 1. Performance - 2.5x faster than Zod v4 on average
const result = schema.safeParse(data) // VLD wins 9/10 benchmarks

// 2. Bundle Size - 57KB gzipped (14% smaller)
import { v } from "@oxog/vld" // 57KB vs 66KB (Zod v4)

// 3. Memory Usage - 3x less memory overall
// Schema creation is 38x more memory efficient

// 4. Built-in i18n - 27+ languages
import { setLocale } from "@oxog/vld"
setLocale("tr") // Turkish error messages

// 5. Built-in Codecs - 19 data transformers
import { codecs } from "@oxog/vld"
const num = codecs.stringToNumber.decode("123") // 123

// 6. Same API as Zod - Easy migration
// Just change imports and you're done!
// import { z } from "zod"
import { v } from "@oxog/vld"

// Note: Zod v4 is faster for simple object validation (1.15x)
// Run "npm run benchmark" to verify these numbers`,
    lang: 'typescript',
  },
  string: {
    title: 'String Validation',
    description: 'String validators with comprehensive validation methods.',
    code: `import { v } from "@oxog/vld"

// Basic string
const str = v.string()

// With validations
const email = v.string().email()
const url = v.string().url()
const uuid = v.string().uuid()
const cuid = v.string().cuid()
const ulid = v.string().ulid()

// Length constraints
const username = v.string()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username cannot exceed 20 characters")

// Exact length
const code = v.string().length(6)

// Pattern matching
const phone = v.string().regex(/^\\+?[1-9]\\d{1,14}$/)

// Transformations
const trimmed = v.string().trim()
const lower = v.string().toLowerCase()
const upper = v.string().toUpperCase()

// IP addresses
const ipv4 = v.string().ip({ version: "v4" })
const ipv6 = v.string().ip({ version: "v6" })

// Datetime
const datetime = v.string().datetime()
const date = v.string().date()
const time = v.string().time()

// Combining validators
const password = v.string()
  .min(8)
  .max(100)
  .regex(/[A-Z]/, "Must contain uppercase")
  .regex(/[0-9]/, "Must contain number")`,
    lang: 'typescript',
    tips: [
      'Use .trim() to remove whitespace before validation',
      'Chain multiple validators for complex requirements',
      'Custom error messages are supported on all methods',
    ],
  },
  number: {
    title: 'Number Validation',
    description: 'Number validators with min, max, integer, and more.',
    code: `import { v } from "@oxog/vld"

// Basic number
const num = v.number()

// Integer only
const int = v.number().int()

// Positive/Negative
const positive = v.number().positive()
const negative = v.number().negative()
const nonnegative = v.number().nonnegative()
const nonpositive = v.number().nonpositive()

// Range constraints
const age = v.number().int().min(0).max(120)
const percentage = v.number().min(0).max(100)

// Greater/Less than
const gt = v.number().gt(0)  // > 0
const gte = v.number().gte(0) // >= 0
const lt = v.number().lt(100) // < 100
const lte = v.number().lte(100) // <= 100

// Finite only (no Infinity)
const finite = v.number().finite()

// Safe integers
const safe = v.number().safe() // Number.MIN_SAFE_INTEGER to MAX_SAFE_INTEGER

// Multiple of
const even = v.number().multipleOf(2)

// Combining
const price = v.number()
  .positive()
  .finite()
  .multipleOf(0.01) // Cents precision`,
    lang: 'typescript',
  },
  boolean: {
    title: 'Boolean Validation',
    description: 'Boolean type with optional coercion.',
    code: `import { v } from "@oxog/vld"

// Basic boolean
const bool = v.boolean()

// With coercion (from strings, numbers)
const coercedBool = v.coerce.boolean()

// Coercion rules:
// "true", "1", 1 -> true
// "false", "0", 0 -> false

// Usage examples
const schema = v.object({
  isActive: v.boolean(),
  acceptTerms: v.boolean(),
  newsletter: v.boolean().default(false),
})

// With literal values
const trueOnly = v.literal(true)
const falseOnly = v.literal(false)`,
    lang: 'typescript',
  },
  date: {
    title: 'Date Validation',
    description: 'Date validation with range constraints.',
    code: `import { v } from "@oxog/vld"

// Basic date
const date = v.date()

// With coercion (from strings, numbers)
const coercedDate = v.coerce.date()

// Range constraints
const pastDate = v.date().max(new Date())
const futureDate = v.date().min(new Date())

// Date range
const validDate = v.date()
  .min(new Date("2020-01-01"))
  .max(new Date("2030-12-31"))

// Usage example
const schema = v.object({
  birthDate: v.coerce.date().max(new Date()),
  appointmentDate: v.coerce.date().min(new Date()),
})`,
    lang: 'typescript',
  },
  bigint: {
    title: 'BigInt Validation',
    description: 'BigInt validation for large integers.',
    code: `import { v } from "@oxog/vld"

// Basic bigint
const big = v.bigint()

// With coercion
const coercedBigInt = v.coerce.bigint()

// Range constraints
const positive = v.bigint().positive()
const negative = v.bigint().negative()
const min = v.bigint().min(0n)
const max = v.bigint().max(1000000000000n)

// Usage
const schema = v.object({
  userId: v.bigint().positive(),
  balance: v.bigint().nonnegative(),
})`,
    lang: 'typescript',
  },
  array: {
    title: 'Array Validation',
    description: 'Array validation with element type and length constraints.',
    code: `import { v } from "@oxog/vld"

// Basic array
const strings = v.array(v.string())
const numbers = v.array(v.number())

// Length constraints
const tags = v.array(v.string())
  .min(1, "At least one tag required")
  .max(10, "Maximum 10 tags")

// Exact length
const coordinates = v.array(v.number()).length(2)

// Non-empty array
const items = v.array(v.string()).nonempty()

// Nested arrays
const matrix = v.array(v.array(v.number()))

// Array of objects
const users = v.array(v.object({
  id: v.number(),
  name: v.string(),
}))

// Complex example
const orderSchema = v.object({
  items: v.array(v.object({
    productId: v.string().uuid(),
    quantity: v.number().int().positive(),
    price: v.number().positive(),
  })).min(1),
  tags: v.array(v.string()).max(5).optional(),
})`,
    lang: 'typescript',
  },
  object: {
    title: 'Object Validation',
    description: 'Object validation with shape definition and modifiers.',
    code: `import { v } from "@oxog/vld"

// Basic object
const user = v.object({
  name: v.string(),
  email: v.string().email(),
})

// Optional fields
const profile = v.object({
  name: v.string(),
  bio: v.string().optional(),
  website: v.string().url().optional(),
})

// Partial (all fields optional)
const updateUser = v.object({
  name: v.string(),
  email: v.string().email(),
}).partial()

// Required (all fields required)
const requiredUser = profile.required()

// Pick specific fields
const nameOnly = user.pick({ name: true })

// Omit specific fields
const withoutEmail = user.omit({ email: true })

// Extend objects
const userWithAge = user.extend({
  age: v.number().int().positive(),
})

// Merge objects
const merged = user.merge(v.object({
  role: v.enum(["admin", "user"]),
}))

// Strict mode (no extra properties)
const strict = v.object({
  name: v.string(),
}).strict()

// Passthrough (allow extra properties)
const loose = v.object({
  name: v.string(),
}).passthrough()

// Deep partial
const deepPartial = v.object({
  user: v.object({
    name: v.string(),
    address: v.object({
      city: v.string(),
    }),
  }),
}).deepPartial()`,
    lang: 'typescript',
  },
  record: {
    title: 'Record Validation',
    description: 'Record type for dynamic key-value pairs.',
    code: `import { v } from "@oxog/vld"

// Basic record (string keys, any values)
const dict = v.record(v.string(), v.unknown())

// Record with string values
const stringDict = v.record(v.string(), v.string())

// Record with number values
const scores = v.record(v.string(), v.number())

// Record with enum keys
const roles = v.record(
  v.enum(["admin", "user", "guest"]),
  v.boolean()
)

// Record with complex values
const userMap = v.record(
  v.string(), // user ID
  v.object({
    name: v.string(),
    email: v.string().email(),
  })
)

// Usage example
const config = v.record(v.string(), v.union([
  v.string(),
  v.number(),
  v.boolean(),
]))`,
    lang: 'typescript',
  },
  tuple: {
    title: 'Tuple Validation',
    description: 'Fixed-length arrays with specific types at each position.',
    code: `import { v } from "@oxog/vld"

// Basic tuple
const point = v.tuple([v.number(), v.number()])

// Mixed types
const userTuple = v.tuple([
  v.string(), // name
  v.number(), // age
  v.boolean(), // isActive
])

// With rest elements
const args = v.tuple([v.string()]).rest(v.number())

// Usage
const coordinates: [number, number] = point.parse([10, 20])

// RGB color
const rgb = v.tuple([
  v.number().int().min(0).max(255),
  v.number().int().min(0).max(255),
  v.number().int().min(0).max(255),
])`,
    lang: 'typescript',
  },
  enum: {
    title: 'Enum Validation',
    description: 'Enum types for a fixed set of values.',
    code: `import { v } from "@oxog/vld"

// String enum
const Role = v.enum(["admin", "user", "guest"])
type Role = v.infer<typeof Role> // "admin" | "user" | "guest"

// Get enum values
const roles = Role.options // ["admin", "user", "guest"]

// Native enum support
enum Status {
  Active = "active",
  Inactive = "inactive",
  Pending = "pending",
}
const statusSchema = v.nativeEnum(Status)

// Usage with objects
const userSchema = v.object({
  name: v.string(),
  role: v.enum(["admin", "user", "guest"]),
  status: v.nativeEnum(Status),
})

// Extracting values
const role = Role.parse("admin") // "admin"
const invalid = Role.safeParse("superuser") // { success: false, ... }`,
    lang: 'typescript',
  },
  union: {
    title: 'Union Types',
    description: 'Union types for values that can be one of several types.',
    code: `import { v } from "@oxog/vld"

// Basic union
const stringOrNumber = v.union([v.string(), v.number()])

// Nullable (value or null)
const nullableString = v.string().nullable()

// Optional (value or undefined)
const optionalNumber = v.number().optional()

// Nullish (value, null, or undefined)
const nullishBoolean = v.boolean().nullish()

// Discriminated union (recommended for objects)
const shape = v.discriminatedUnion("type", [
  v.object({ type: v.literal("circle"), radius: v.number() }),
  v.object({ type: v.literal("square"), size: v.number() }),
  v.object({ type: v.literal("rectangle"), width: v.number(), height: v.number() }),
])

// Usage
const circle = shape.parse({ type: "circle", radius: 10 })
const square = shape.parse({ type: "square", size: 5 })

// Intersection
const hasName = v.object({ name: v.string() })
const hasAge = v.object({ age: v.number() })
const person = v.intersection([hasName, hasAge])`,
    lang: 'typescript',
  },
  codecs: {
    title: 'Codecs',
    description: 'Bidirectional data transformation with encode/decode support.',
    code: `import { codecs } from "@oxog/vld"

// String to Number
const numCodec = codecs.stringToNumber
numCodec.decode("123")    // 123
numCodec.encode(123)      // "123"

// String to Int
const intCodec = codecs.stringToInt
intCodec.decode("42")     // 42

// String to BigInt
const bigIntCodec = codecs.stringToBigInt
bigIntCodec.decode("9007199254740993")  // 9007199254740993n

// String to Boolean
const boolCodec = codecs.stringToBoolean
boolCodec.decode("true")  // true
boolCodec.decode("1")     // true

// ISO DateTime to Date
const dateCodec = codecs.isoDatetimeToDate
dateCodec.decode("2024-01-15T10:30:00Z")  // Date object

// Epoch to Date
const epochCodec = codecs.epochSecondsToDate
epochCodec.decode(1705315800)  // Date object

// JSON string parsing
const jsonCodec = codecs.jsonCodec
jsonCodec.decode('{"name":"John"}')  // { name: "John" }

// URL parsing
const urlCodec = codecs.stringToHttpURL
urlCodec.decode("https://example.com")  // URL object

// Base64 encoding
const base64Codec = codecs.stringToBase64
base64Codec.encode("Hello")  // "SGVsbG8="
base64Codec.decode("SGVsbG8=")  // "Hello"

// JWT payload extraction
const jwtCodec = codecs.jwtPayload
const payload = jwtCodec.decode(token)  // JWT payload object`,
    lang: 'typescript',
    tips: [
      'Codecs are bidirectional - encode and decode',
      '19 built-in codecs available',
      'Create custom codecs with VldCodec.create()',
    ],
  },
  transformations: {
    title: 'Transformations',
    description: 'Transform validated data into different shapes.',
    code: `import { v } from "@oxog/vld"

// Basic transform
const toNumber = v.string().transform((s) => parseInt(s, 10))

// Transform with validation
const percentage = v.string()
  .transform((s) => parseFloat(s))
  .refine((n) => n >= 0 && n <= 100, "Must be 0-100")

// Chain transforms
const trimAndLower = v.string()
  .transform((s) => s.trim())
  .transform((s) => s.toLowerCase())

// Default values
const withDefault = v.string().default("anonymous")

// Catch (provide fallback on error)
const safeParse = v.number().catch(0)

// Preprocess (transform before validation)
const preprocessed = v.preprocess(
  (val) => String(val).trim(),
  v.string().min(1)
)

// Complex transforms
const userInput = v.object({
  name: v.string().trim(),
  email: v.string().toLowerCase().email(),
  birthDate: v.string().transform((s) => new Date(s)),
})

// Async transforms
const asyncTransform = v.string().transform(async (s) => {
  const response = await fetch(\`/api/users/\${s}\`)
  return response.json()
})`,
    lang: 'typescript',
  },
  refinements: {
    title: 'Refinements',
    description: 'Add custom validation logic to any schema.',
    code: `import { v } from "@oxog/vld"

// Basic refinement
const positiveString = v.string().refine(
  (s) => s.length > 0,
  "String must not be empty"
)

// With custom error
const email = v.string().refine(
  (s) => s.includes("@"),
  { message: "Invalid email format" }
)

// Multiple refinements
const password = v.string()
  .min(8)
  .refine((s) => /[A-Z]/.test(s), "Must contain uppercase")
  .refine((s) => /[a-z]/.test(s), "Must contain lowercase")
  .refine((s) => /[0-9]/.test(s), "Must contain number")
  .refine((s) => /[^A-Za-z0-9]/.test(s), "Must contain special char")

// Cross-field validation with superRefine
const form = v.object({
  password: v.string().min(8),
  confirmPassword: v.string(),
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: "custom",
      path: ["confirmPassword"],
      message: "Passwords must match",
    })
  }
})

// Async refinement
const uniqueUsername = v.string().refine(
  async (username) => {
    const exists = await checkUsernameExists(username)
    return !exists
  },
  "Username already taken"
)`,
    lang: 'typescript',
  },
  coercion: {
    title: 'Type Coercion',
    description: 'Automatically convert input values to the expected type.',
    code: `import { v } from "@oxog/vld"

// Coerce to string
const str = v.coerce.string()
str.parse(123)       // "123"
str.parse(true)      // "true"
str.parse(null)      // "null"

// Coerce to number
const num = v.coerce.number()
num.parse("123")     // 123
num.parse("12.5")    // 12.5
num.parse(true)      // 1

// Coerce to boolean
const bool = v.coerce.boolean()
bool.parse("true")   // true
bool.parse("false")  // false
bool.parse(1)        // true
bool.parse(0)        // false

// Coerce to date
const date = v.coerce.date()
date.parse("2024-01-15")           // Date
date.parse(1705276800000)          // Date from timestamp

// Coerce to bigint
const big = v.coerce.bigint()
big.parse("9007199254740993")      // 9007199254740993n

// Usage in schemas
const apiInput = v.object({
  id: v.coerce.number().int().positive(),
  active: v.coerce.boolean(),
  createdAt: v.coerce.date(),
  amount: v.coerce.bigint(),
})

// Parse query string params
const params = apiInput.parse({
  id: "42",        // becomes 42
  active: "true",  // becomes true
  createdAt: "2024-01-15T00:00:00Z",
  amount: "1000000000000",
})`,
    lang: 'typescript',
    tips: [
      'Coercion is useful for API inputs (query params, form data)',
      'Coercion happens before validation',
      'Invalid coercion results in validation error',
    ],
  },
  errors: {
    title: 'Error Handling',
    description: 'VLD provides multiple error formatting options for different use cases.',
    code: `import { v, prettifyError, flattenError, treeifyError } from "@oxog/vld"

const schema = v.object({
  name: v.string().min(2),
  email: v.string().email(),
  age: v.number().int().positive(),
})

const result = schema.safeParse({
  name: "J",
  email: "invalid",
  age: -5,
})

if (!result.success) {
  // 1. Raw error issues
  console.log(result.error.issues)
  // [
  //   { path: ["name"], message: "String must be at least 2 characters" },
  //   { path: ["email"], message: "Invalid email" },
  //   { path: ["age"], message: "Number must be positive" }
  // ]

  // 2. Prettified (human-readable)
  console.log(prettifyError(result.error))
  // ✗ name: String must be at least 2 characters
  // ✗ email: Invalid email
  // ✗ age: Number must be positive

  // 3. Flattened (for forms)
  console.log(flattenError(result.error))
  // {
  //   formErrors: [],
  //   fieldErrors: {
  //     name: ["String must be at least 2 characters"],
  //     email: ["Invalid email"],
  //     age: ["Number must be positive"]
  //   }
  // }

  // 4. Tree structure (for nested objects)
  console.log(treeifyError(result.error))
  // Nested object structure matching your schema
}

// Custom error messages
const customSchema = v.string().min(5, {
  message: "Username must be at least 5 characters",
})

// Error map for global customization
const withErrorMap = v.string().email({
  message: "Please enter a valid email address",
})`,
    lang: 'typescript',
    tips: [
      'Use flattenError() for form validation',
      'Use prettifyError() for console output',
      'Use treeifyError() for complex nested errors',
    ],
  },
  localization: {
    title: 'Localization',
    description: 'VLD supports 27+ languages for error messages out of the box.',
    code: `import { v, setLocale, getLocale } from "@oxog/vld"

// Set global locale
setLocale("tr") // Turkish
setLocale("de") // German
setLocale("ja") // Japanese
setLocale("fr") // French
setLocale("es") // Spanish
setLocale("zh") // Chinese

// Get current locale
const currentLocale = getLocale() // "tr"

// Supported locales
const locales = [
  "en",    // English (default)
  "tr",    // Turkish
  "de",    // German
  "fr",    // French
  "es",    // Spanish
  "es-MX", // Spanish (Mexico)
  "pt",    // Portuguese
  "pt-BR", // Portuguese (Brazil)
  "it",    // Italian
  "nl",    // Dutch
  "pl",    // Polish
  "ru",    // Russian
  "ja",    // Japanese
  "ko",    // Korean
  "zh",    // Chinese
  "ar",    // Arabic
  "hi",    // Hindi
  "bn",    // Bengali
  "th",    // Thai
  "vi",    // Vietnamese
  "id",    // Indonesian
  "sv",    // Swedish
  "no",    // Norwegian
  "da",    // Danish
  "fi",    // Finnish
  "af",    // Afrikaans
  "sw",    // Swahili
]

// Example with Turkish locale
setLocale("tr")
const result = v.string().email().safeParse("invalid")
// Error: Geçersiz e-posta adresi`,
    lang: 'typescript',
    tips: [
      'setLocale() affects all subsequent validations',
      'Fallback to English if locale not found',
      'Add custom locales with registerLocale()',
    ],
  },
  'custom-messages': {
    title: 'Custom Error Messages',
    description: 'Override default error messages with your own.',
    code: `import { v } from "@oxog/vld"

// Inline custom messages
const username = v.string()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username cannot exceed 20 characters")
  .regex(/^[a-z0-9_]+$/, "Username can only contain lowercase letters, numbers, and underscores")

// Object format for more control
const email = v.string().email({
  message: "Please enter a valid email address",
})

// Dynamic messages
const age = v.number()
  .min(18, ({ minimum }) => \`You must be at least \${minimum} years old\`)
  .max(100, ({ maximum }) => \`Age cannot exceed \${maximum}\`)

// Complex validation messages
const password = v.string()
  .min(8, "Password must be at least 8 characters")
  .refine(
    (s) => /[A-Z]/.test(s),
    "Password must contain at least one uppercase letter"
  )
  .refine(
    (s) => /[0-9]/.test(s),
    "Password must contain at least one number"
  )

// Schema-level custom messages
const form = v.object({
  name: v.string({ required_error: "Name is required" }),
  email: v.string({ required_error: "Email is required" }).email({
    message: "Invalid email format",
  }),
})`,
    lang: 'typescript',
  },
}

const icons: Record<string, React.ElementType> = {
  introduction: BookOpen,
  installation: FileCode,
  'quick-start': Layers,
  'why-vld': Zap,
  string: FileCode,
  number: Hash,
  boolean: ToggleLeft,
  date: FileCode,
  bigint: Hash,
  array: ListOrdered,
  object: Braces,
  record: FileJson,
  tuple: ListOrdered,
  enum: GitBranch,
  union: GitBranch,
  codecs: Repeat,
  transformations: Repeat,
  refinements: AlertTriangle,
  coercion: Repeat,
  errors: AlertTriangle,
  localization: Globe,
  'custom-messages': FileCode,
}

// Import Zap icon
import { Zap } from 'lucide-react'

export function DocsPage() {
  const [activeSection, setActiveSection] = useState('introduction')
  const content = docContent[activeSection] || {
    title: activeSection.replace(/-/g, ' '),
    description: 'Documentation coming soon.',
    code: '// Coming soon',
    lang: 'typescript',
  }

  const IconComponent = icons[activeSection] || FileCode

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 space-y-6 max-h-[calc(100vh-8rem)] overflow-y-auto pr-4">
              {sidebarSections.map((section) => (
                <div key={section.title}>
                  <div className="flex items-center gap-2 text-sm font-semibold mb-3 text-muted-foreground">
                    <section.icon className="w-4 h-4" />
                    {section.title}
                  </div>
                  <ul className="space-y-1 ml-6">
                    {section.items.map((item) => (
                      <li key={item.slug}>
                        <button
                          onClick={() => setActiveSection(item.slug)}
                          className={cn(
                            'w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors',
                            activeSection === item.slug
                              ? 'bg-vld-primary/10 text-vld-primary font-medium'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          )}
                        >
                          {item.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0 max-w-4xl">
            {/* Mobile Navigation */}
            <div className="lg:hidden mb-6">
              <select
                value={activeSection}
                onChange={(e) => setActiveSection(e.target.value)}
                className="w-full p-3 rounded-lg border border-border bg-card"
              >
                {sidebarSections.map((section) => (
                  <optgroup key={section.title} label={section.title}>
                    {section.items.map((item) => (
                      <option key={item.slug} value={item.slug}>
                        {item.title}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-vld-primary/10 flex items-center justify-center">
                  <IconComponent className="w-5 h-5 text-vld-primary" />
                </div>
                <h1 className="text-3xl font-bold">{content.title}</h1>
              </div>
              <p className="text-lg text-muted-foreground">{content.description}</p>
            </div>

            {/* Tips */}
            {content.tips && (
              <div className="mb-6 p-4 rounded-xl bg-vld-primary/5 border border-vld-primary/20">
                <h3 className="text-sm font-semibold text-vld-primary mb-2">Tips</h3>
                <ul className="space-y-1">
                  {content.tips.map((tip, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-vld-primary mt-1">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Code Block */}
            <div className="rounded-xl overflow-hidden border border-border shadow-lg">
              <CodeBlock
                code={content.code}
                language={content.lang as 'typescript' | 'bash'}
                filename={content.lang === 'bash' ? 'terminal' : `${activeSection}.ts`}
                showLineNumbers
              />
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-8 border-t border-border">
              {(() => {
                const allItems = sidebarSections.flatMap((s) => s.items)
                const currentIndex = allItems.findIndex((item) => item.slug === activeSection)
                const prev = currentIndex > 0 ? allItems[currentIndex - 1] : null
                const next = currentIndex < allItems.length - 1 ? allItems[currentIndex + 1] : null
                return (
                  <>
                    {prev ? (
                      <button
                        onClick={() => setActiveSection(prev.slug)}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        ← {prev.title}
                      </button>
                    ) : (
                      <div />
                    )}
                    {next ? (
                      <button
                        onClick={() => setActiveSection(next.slug)}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {next.title} →
                      </button>
                    ) : (
                      <div />
                    )}
                  </>
                )
              })()}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
