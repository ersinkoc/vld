import{c as o,r as l,Z as m,S as n,j as e,a}from"./index-BvU-Ujwx.js";import{a as v}from"./code-block-CO9AyCs-.js";import{G as u,B as p}from"./globe-ClUHF73B.js";import{S as g}from"./shield-Bd8Z1JkO.js";import"./copy-gv81J8d7.js";import"./terminal-Djl9_VUq.js";const h=[["ellipse",{cx:"12",cy:"5",rx:"9",ry:"3",key:"msslwz"}],["path",{d:"M3 5V19A9 3 0 0 0 21 19V5",key:"1wlel7"}],["path",{d:"M3 12A9 3 0 0 0 21 12",key:"mv7ke4"}]],f=o("database",h);const y=[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 10 0v4",key:"fwvmzm"}]],b=o("lock",y);const x=[["path",{d:"m17 2 4 4-4 4",key:"nntrym"}],["path",{d:"M3 11v-1a4 4 0 0 1 4-4h14",key:"84bu3i"}],["path",{d:"m7 22-4-4 4-4",key:"1wqhfi"}],["path",{d:"M21 13v1a4 4 0 0 1-4 4H3",key:"1rx37r"}]],c=o("repeat",x);const S=[["rect",{width:"20",height:"8",x:"2",y:"2",rx:"2",ry:"2",key:"ngkwjq"}],["rect",{width:"20",height:"8",x:"2",y:"14",rx:"2",ry:"2",key:"iecqi9"}],["line",{x1:"6",x2:"6.01",y1:"6",y2:"6",key:"16zg32"}],["line",{x1:"6",x2:"6.01",y1:"18",y2:"18",key:"nzw8ys"}]],j=o("server",S);const w=[["circle",{cx:"8",cy:"21",r:"1",key:"jimo8o"}],["circle",{cx:"19",cy:"21",r:"1",key:"13723u"}],["path",{d:"M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12",key:"9zh506"}]],k=o("shopping-cart",w);const N=[["path",{d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",key:"975kel"}],["circle",{cx:"12",cy:"7",r:"4",key:"17ys0d"}]],T=o("user",N),i=[{id:"user-registration",title:"User Registration",description:"Complete form validation",icon:T,code:`import { v, flattenError } from "@oxog/vld"

// Define a comprehensive user registration schema
const registrationSchema = v.object({
  username: v.string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username cannot exceed 20 characters")
    .regex(/^[a-z0-9_]+$/, "Only lowercase letters, numbers, and underscores"),

  email: v.string().email("Please enter a valid email"),

  password: v.string()
    .min(8, "Password must be at least 8 characters")
    .refine(
      (p) => /[A-Z]/.test(p) && /[0-9]/.test(p),
      "Password must contain uppercase letter and number"
    ),

  confirmPassword: v.string(),

  age: v.number().int().min(18, "You must be at least 18"),

  acceptTerms: v.boolean().refine(
    (val) => val === true,
    "You must accept the terms"
  ),
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: "custom",
      path: ["confirmPassword"],
      message: "Passwords do not match",
    })
  }
})

// Infer TypeScript type
type Registration = v.infer<typeof registrationSchema>

// Usage in form handler
function handleSubmit(formData: unknown) {
  const result = registrationSchema.safeParse(formData)

  if (!result.success) {
    // Get flattened errors for form display
    const { fieldErrors } = flattenError(result.error)
    return { errors: fieldErrors }
  }

  // result.data is fully typed as Registration
  return { user: result.data }
}`},{id:"api-validation",title:"API Input/Output",description:"REST API validation",icon:j,code:`import { v } from "@oxog/vld"

// Request body validation
const createUserRequest = v.object({
  name: v.string().min(1),
  email: v.string().email(),
  role: v.enum("admin", "user", "guest").default("user"),
  metadata: v.record(v.string(), v.unknown()).optional(),
})

// Query parameters (with coercion for string inputs)
const listUsersQuery = v.object({
  page: v.coerce.number().int().positive().default(1),
  limit: v.coerce.number().int().min(1).max(100).default(20),
  sort: v.enum("name", "email", "createdAt").optional(),
  order: v.enum("asc", "desc").default("asc"),
  search: v.string().optional(),
})

// API Response schema
const userResponse = v.object({
  id: v.string().uuid(),
  name: v.string(),
  email: v.string().email(),
  role: v.enum("admin", "user", "guest"),
  createdAt: v.string().datetime(),
  updatedAt: v.string().datetime(),
})

const paginatedResponse = v.object({
  data: v.array(userResponse),
  meta: v.object({
    total: v.number().int().nonnegative(),
    page: v.number().int().positive(),
    limit: v.number().int().positive(),
    totalPages: v.number().int().nonnegative(),
  }),
})

// Express middleware example
function validateBody<T>(schema: v.VldType<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      return res.status(400).json({ errors: result.error.issues })
    }
    req.body = result.data
    next()
  }
}

// Usage
app.post("/users", validateBody(createUserRequest), async (req, res) => {
  // req.body is typed and validated
  const user = await createUser(req.body)
  res.json(user)
})`},{id:"ecommerce",title:"E-Commerce",description:"Shopping cart & orders",icon:k,code:`import { v } from "@oxog/vld"

// Product schema
const productSchema = v.object({
  id: v.string().uuid(),
  name: v.string().min(1).max(200),
  description: v.string().max(5000).optional(),
  price: v.number().positive(),
  currency: v.enum("USD", "EUR", "GBP", "TRY"),
  stock: v.number().int().nonnegative(),
  categories: v.array(v.string()).min(1),
  images: v.array(v.string().url()).max(10),
  metadata: v.record(v.string(), v.unknown()).optional(),
})

// Cart item with computed total
const cartItemSchema = v.object({
  product: productSchema.pick({ id: true, name: true, price: true, currency: true }),
  quantity: v.number().int().min(1).max(99),
})

// Shopping cart
const cartSchema = v.object({
  id: v.string().uuid(),
  userId: v.string().uuid().optional(), // Optional for guest checkout
  items: v.array(cartItemSchema),
  couponCode: v.string().optional(),
  notes: v.string().max(500).optional(),
}).refine(
  (cart) => cart.items.length > 0,
  "Cart cannot be empty"
)

// Shipping address
const addressSchema = v.object({
  firstName: v.string().min(1),
  lastName: v.string().min(1),
  street: v.string().min(1),
  city: v.string().min(1),
  state: v.string().optional(),
  postalCode: v.string(),
  country: v.string().length(2), // ISO country code
  phone: v.string().optional(),
})

// Order schema
const orderSchema = v.object({
  cart: cartSchema,
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(), // Same as shipping if not provided
  paymentMethod: v.discriminatedUnion("type", [
    v.object({
      type: v.literal("card"),
      cardToken: v.string(),
      saveCard: v.boolean().default(false),
    }),
    v.object({
      type: v.literal("paypal"),
      paypalOrderId: v.string(),
    }),
    v.object({
      type: v.literal("bank_transfer"),
      bankReference: v.string().optional(),
    }),
  ]),
})

type Order = v.infer<typeof orderSchema>`},{id:"dropin-zod",title:"Zod → VLD Drop-in",description:"True drop-in: same API, same semantics, 3.18x faster vs Zod 4.6.7",icon:c,code:`// Zod 4.6.7 and VLD 3.3.2 share the exact same public API.
// You can switch with a single import line change.
// See: examples/zod-vs-vld-dropin.js for the verified equivalent.

// BEFORE (Zod)
import { z } from 'zod'

const UserSchema = z.object({
  name: z.string().min(1),
  age:  z.number().int().positive(),
  role: z.enum(['admin', 'user']),
  tags: z.array(z.string()).min(1).max(100)
})

// AFTER (VLD — two flavors, both are drop-in)
import { v } from '@oxog/vld'                  // v.* V1 — works today, default
// or
import { v as z } from '@oxog/vld'            // alias to z — literally no other change
// or
import { vV2 } from '@oxog/vld'               // opt-in V2 method-memoization (3.18x)

const UserSchema = v.object({                  // ← same code, same shape
  name: v.string().min(1),
  age:  v.number().int().positive(),
  role: v.enum(['admin', 'user']),
  tags: v.array(v.string()).min(1).max(100)
})

// SAME method names, SAME return shape:
const u = UserSchema.safeParse(input)
if (!u.success) {
  // VldError exposes a Zod-compatible .format() and .flatten()
  console.log(u.error.format())
  console.log(u.error.flatten())
  // Or convert to a true ZodError-shape:
  // import { toZodError } from '@oxog/vld'
  // const zodErr = toZodError(u.error)
}

// Verified: 10/10 scenarios accept/reject the same inputs in both
// benchmarks/dropin-vs-zod.cjs — same logical schema, same input,
// 1M safeParse ops, 21 runs median, semantic-checked first.
// Result: 3.18x geometric mean speedup over Zod 4.6.7 (10/10 wins;
// single runs spanned 3.06x-3.23x).`},{id:"auth-jwt",title:"Authentication",description:"JWT & session validation",icon:b,code:`import { v, codecs } from "@oxog/vld"

// JWT payload schema
const jwtPayloadSchema = v.object({
  sub: v.string(), // Subject (user ID)
  email: v.string().email(),
  name: v.string(),
  roles: v.array(v.enum("admin", "user", "moderator")),
  permissions: v.array(v.string()).optional(),
  iat: v.number().int(), // Issued at
  exp: v.number().int(), // Expiration
  iss: v.string().optional(), // Issuer
  aud: v.union([v.string(), v.array(v.string())]).optional(), // Audience
})

type JwtPayload = v.infer<typeof jwtPayloadSchema>

// Validate and decode JWT
function validateToken(token: string): JwtPayload | null {
  try {
    // Decode JWT payload using built-in codec
    const decoded = codecs.jwtPayload.decode(token)

    // Validate payload structure
    const result = jwtPayloadSchema.safeParse(decoded)

    if (!result.success) {
      console.error("Invalid token payload:", result.error)
      return null
    }

    // Check expiration
    if (result.data.exp < Date.now() / 1000) {
      console.error("Token expired")
      return null
    }

    return result.data
  } catch (error) {
    console.error("Token decode error:", error)
    return null
  }
}

// Login request schema
const loginSchema = v.object({
  email: v.string().email(),
  password: v.string().min(1),
  rememberMe: v.boolean().default(false),
})

// OAuth callback schema
const oauthCallbackSchema = v.object({
  code: v.string(),
  state: v.string(),
  provider: v.enum("google", "github", "microsoft"),
})

// Session schema for server-side storage
const sessionSchema = v.object({
  id: v.string().uuid(),
  userId: v.string().uuid(),
  userAgent: v.string(),
  ipAddress: v.string().ip(),
  createdAt: v.date(),
  expiresAt: v.date(),
  data: v.record(v.string(), v.unknown()).optional(),
})`},{id:"discriminated-union",title:"Discriminated Unions",description:"Type-safe event handling",icon:m,code:`import { v } from "@oxog/vld"

// Event system with discriminated unions
// O(1) lookup performance - much faster than regular unions

const eventSchema = v.discriminatedUnion("type", [
  // User events
  v.object({
    type: v.literal("user.created"),
    userId: v.string().uuid(),
    email: v.string().email(),
    timestamp: v.string().datetime(),
  }),
  v.object({
    type: v.literal("user.updated"),
    userId: v.string().uuid(),
    changes: v.record(v.string(), v.unknown()),
    timestamp: v.string().datetime(),
  }),
  v.object({
    type: v.literal("user.deleted"),
    userId: v.string().uuid(),
    timestamp: v.string().datetime(),
  }),

  // Order events
  v.object({
    type: v.literal("order.placed"),
    orderId: v.string().uuid(),
    userId: v.string().uuid(),
    total: v.number().positive(),
    currency: v.string(),
    items: v.array(v.object({
      productId: v.string(),
      quantity: v.number().int().positive(),
    })),
    timestamp: v.string().datetime(),
  }),
  v.object({
    type: v.literal("order.shipped"),
    orderId: v.string().uuid(),
    trackingNumber: v.string(),
    carrier: v.string(),
    timestamp: v.string().datetime(),
  }),
  v.object({
    type: v.literal("order.delivered"),
    orderId: v.string().uuid(),
    signature: v.string().optional(),
    timestamp: v.string().datetime(),
  }),
])

type Event = v.infer<typeof eventSchema>

// Type-safe event handler
function handleEvent(event: Event) {
  switch (event.type) {
    case "user.created":
      // TypeScript knows: event.userId, event.email
      console.log(\`New user: \${event.email}\`)
      break
    case "order.placed":
      // TypeScript knows: event.orderId, event.total, event.items
      console.log(\`Order \${event.orderId}: \${event.total}\`)
      break
    case "order.shipped":
      // TypeScript knows: event.trackingNumber, event.carrier
      console.log(\`Shipped via \${event.carrier}: \${event.trackingNumber}\`)
      break
    // ... other cases
  }
}

// Webhook validation
function handleWebhook(payload: unknown) {
  const result = eventSchema.safeParse(payload)
  if (result.success) {
    handleEvent(result.data)
  }
}`},{id:"codecs",title:"Codecs",description:"Bidirectional data transformation",icon:c,code:`import { v, codecs } from "@oxog/vld"

// String to Number codec
const stringToNumber = codecs.stringToNumber
console.log(stringToNumber.decode("123"))    // 123
console.log(stringToNumber.encode(123))      // "123"

// Date codecs
const isoToDate = codecs.isoDatetimeToDate
const date = isoToDate.decode("2024-01-15T10:30:00Z")
console.log(date instanceof Date)            // true

const epochToDate = codecs.epochSecondsToDate
const date2 = epochToDate.decode(1705315800)

// JSON codec with schema validation
const userJsonCodec = codecs.jsonCodec(v.object({
  name: v.string(),
  age: v.number(),
}))

const jsonString = '{"name":"John","age":30}'
const user = userJsonCodec.decode(jsonString)  // { name: "John", age: 30 }
const back = userJsonCodec.encode(user)        // '{"name":"John","age":30}'

// Base64 JSON (useful for cookies/tokens)
const base64JsonCodec = codecs.base64Json(v.object({
  userId: v.string(),
  permissions: v.array(v.string()),
}))

// URL codec
const urlCodec = codecs.stringToHttpURL
const url = urlCodec.decode("https://api.example.com/users")
console.log(url.hostname)  // "api.example.com"

// Binary data codecs
const base64Codec = codecs.base64ToBytes
const bytes = base64Codec.decode("SGVsbG8gV29ybGQ=")  // Uint8Array
const base64 = base64Codec.encode(bytes)               // "SGVsbG8gV29ybGQ="

const hexCodec = codecs.hexToBytes
const hexBytes = hexCodec.decode("48656c6c6f")         // Uint8Array

// JWT payload extraction
const jwtCodec = codecs.jwtPayload
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
const payload = jwtCodec.decode(token)
// { sub: "1234567890", name: "John Doe", iat: 1516239022 }`},{id:"recursive",title:"Recursive Schemas",description:"Tree structures & self-reference",icon:f,code:`import { v } from "@oxog/vld"

// Category tree (self-referencing)
interface Category {
  id: string
  name: string
  children: Category[]
}

const categorySchema: v.VldType<Category> = v.lazy(() =>
  v.object({
    id: v.string().uuid(),
    name: v.string().min(1),
    children: v.array(categorySchema),
  })
)

// File system structure
interface FileNode {
  name: string
  type: "file" | "folder"
  size?: number
  children?: FileNode[]
}

const fileNodeSchema: v.VldType<FileNode> = v.lazy(() =>
  v.discriminatedUnion("type", [
    v.object({
      type: v.literal("file"),
      name: v.string(),
      size: v.number().int().nonnegative(),
    }),
    v.object({
      type: v.literal("folder"),
      name: v.string(),
      children: v.array(fileNodeSchema),
    }),
  ])
)

// Comment thread
interface Comment {
  id: string
  author: string
  content: string
  timestamp: string
  replies: Comment[]
}

const commentSchema: v.VldType<Comment> = v.lazy(() =>
  v.object({
    id: v.string().uuid(),
    author: v.string(),
    content: v.string().min(1).max(5000),
    timestamp: v.string().datetime(),
    replies: v.array(commentSchema),
  })
)

// JSON Schema-like structure
interface JsonSchema {
  type: string
  properties?: Record<string, JsonSchema>
  items?: JsonSchema
  required?: string[]
}

const jsonSchemaSchema: v.VldType<JsonSchema> = v.lazy(() =>
  v.object({
    type: v.string(),
    properties: v.record(v.string(), jsonSchemaSchema).optional(),
    items: jsonSchemaSchema.optional(),
    required: v.array(v.string()).optional(),
  })
)`},{id:"llm-retry",title:"LLM Structured-Output Retries",description:"toRetryMessage + describeSchema - measured design (0/30 to 30/30 recovery when enum vocabularies are named)",icon:n,code:`import { v, toRetryMessage, describeSchema } from "@oxog/vld"

const invoiceSchema = v.object({
  office: v.enum(["HAM", "LYO"]),
  amount: v.number().multipleOf(0.01),
  note: v.string().min(2),
})

// 1) Put the derived constraints in the first-attempt prompt
const promptConstraints = describeSchema(invoiceSchema)
const completions = await model.generate(prompt + promptConstraints)

// 2) On failure, send back the retry string - enum values named verbatim
const input = JSON.parse(completions[0].text)
const result = invoiceSchema.safeParse(input)
if (!result.success) {
  const retry = toRetryMessage(result, { input })
  // /office: must be one of "HAM", "LYO", got "HH"
  // /amount: Number must be a multiple of 0.01, got 10.333
  // /note: String must be at least 2 characters, got "x"
  await model.generate(prompt + promptConstraints + retry)
}`},{id:"i18n",title:"Internationalization",description:"68 languages - every zod locale code covered",icon:u,code:`import { v, setLocale, getLocale, prettifyError } from "@oxog/vld"

// Set locale globally
setLocale("tr") // Turkish

const schema = v.object({
  isim: v.string().min(2),
  email: v.string().email(),
  yas: v.number().int().positive(),
})

const result = schema.safeParse({
  isim: "A",
  email: "invalid",
  yas: -5,
})

if (!result.success) {
  console.log(prettifyError(result.error))
  // Output in Turkish:
  // ✗ isim: Metin en az 2 karakter olmalıdır
  // ✗ email: Geçersiz e-posta adresi
  // ✗ yas: Sayı pozitif olmalıdır
}

// Switch to Japanese
setLocale("ja")

const result2 = v.string().email().safeParse("invalid")
if (!result2.success) {
  console.log(result2.error.issues[0].message)
  // Output: 無効なメールアドレス
}

// Supported locales (68 — every zod locale code zod ships, plus extras):
const locales = [
  "en",    // English (default)
  "tr",    // Turkish - Türkçe
  "de",    // German - Deutsch
  "fr",    // French - Français
  "es",    // Spanish - Español
  "es-MX", // Spanish (Mexico)
  "pt",    // Portuguese - Português
  "pt-BR", // Portuguese (Brazil)
  "it",    // Italian - Italiano
  "nl",    // Dutch - Nederlands
  "pl",    // Polish - Polski
  "ru",    // Russian - Русский
  "ja",    // Japanese - 日本語
  "ko",    // Korean - 한국어
  "zh",    // Chinese - 中文
  "ar",    // Arabic - العربية
  "hi",    // Hindi - हिन्दी
  "bn",    // Bengali - বাংলা
  "th",    // Thai - ไทย
  "vi",    // Vietnamese - Tiếng Việt
  "id",    // Indonesian - Bahasa Indonesia
  "sv",    // Swedish - Svenska
  "no",    // Norwegian - Norsk
  "da",    // Danish - Dansk
  "fi",    // Finnish - Suomi
  "af",    // Afrikaans
  "sw",    // Swahili - Kiswahili
]

// Get current locale
console.log(getLocale()) // "ja"`},{id:"file-upload",title:"File Uploads",description:"File validation",icon:p,code:`import { v } from "@oxog/vld"

// Basic file validation
const imageSchema = v.file()
  .maxSize(5 * 1024 * 1024) // 5MB
  .mimeType(["image/jpeg", "image/png", "image/gif", "image/webp"])

// Document upload
const documentSchema = v.file()
  .maxSize(10 * 1024 * 1024) // 10MB
  .mimeType([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ])

// Avatar upload with size constraints
const avatarSchema = v.file()
  .maxSize(2 * 1024 * 1024) // 2MB
  .mimeType(["image/jpeg", "image/png"])

// Multiple file upload
const gallerySchema = v.array(
  v.file()
    .maxSize(10 * 1024 * 1024)
    .mimeType(["image/jpeg", "image/png", "image/webp"])
).min(1).max(10)

// Form with file and text fields
const profileUpdateSchema = v.object({
  name: v.string().min(1),
  bio: v.string().max(500).optional(),
  avatar: avatarSchema.optional(),
  documents: v.array(documentSchema).max(5).optional(),
})

// Usage with FormData
async function handleUpload(formData: FormData) {
  const file = formData.get("avatar") as File | null

  if (file) {
    const result = avatarSchema.safeParse(file)
    if (!result.success) {
      return { error: result.error.issues[0].message }
    }
    // Upload validated file
  }
}`},{id:"xor-validation",title:"XOR Validation",description:"Exactly one match required",icon:g,code:`import { v } from "@oxog/vld"

// Contact form: require either email OR phone, not both
const contactSchema = v.object({
  name: v.string().min(1),
  message: v.string().min(10),
}).and(
  v.xor([
    v.object({ email: v.string().email(), phone: v.undefined() }),
    v.object({ email: v.undefined(), phone: v.string() }),
  ])
)

// Payment: exactly one payment method
const paymentSchema = v.xor([
  v.object({
    method: v.literal("card"),
    cardNumber: v.string().length(16),
    cvv: v.string().length(3),
    expiry: v.string(),
  }),
  v.object({
    method: v.literal("bank"),
    iban: v.string(),
    bankCode: v.string(),
  }),
  v.object({
    method: v.literal("crypto"),
    walletAddress: v.string(),
    currency: v.enum("BTC", "ETH", "USDT"),
  }),
])

// Identifier: exactly one type of ID
const identifierSchema = v.xor([
  v.object({
    type: v.literal("email"),
    email: v.string().email()
  }),
  v.object({
    type: v.literal("phone"),
    phone: v.string()
  }),
  v.object({
    type: v.literal("username"),
    username: v.string().min(3)
  }),
])

// Usage
const result1 = identifierSchema.safeParse({
  type: "email",
  email: "user@example.com"
})
// success: true

const result2 = identifierSchema.safeParse({
  type: "email",
  email: "user@example.com",
  phone: "1234567890" // Error: more than one match
})
// success: false`},{id:"v3-features",title:"v3.0 — V2 + ZodError (new)",description:"V2 method-memoization, vV2 drop-in, toZodError",icon:n,code:`// VLD v3.0 ships V2 method-memoization + ZodError compat
import { v, vV2, toZodError, ZodLikeError } from "@oxog/vld"

// 1. vV2 — drop-in factory (part of the drop-in geomean vs Zod 4.6.7)
const v2 = vV2.string().min(1).email()
v2.parse("user@example.com")

// 2. v.setV2Mode(true) — global toggle (no source rewrites)
v.setV2Mode(true)
const existing = v.string().email() // now V2
v.setV2Mode(false)

// 3. z = v — keep the z.* style
import { v as z } from "@oxog/vld"
// or: import { vV2 as z } from "@oxog/vld";

// 4. toZodError — ZodError-shaped errors (v3.0 new)
const result = v.object({
  email: v.string().email(),
  age: v.number().int().min(18)
}).safeParse({ email: "bad", age: 12 })

if (!result.success) {
  const zodErr = toZodError(result.error)
  // zodErr is a ZodLikeError with .format() and .flatten()
  zodErr instanceof ZodLikeError  // true
  zodErr.name === "ZodError"     // true
  zodErr.flatten()
  // { formErrors: [], fieldErrors: { email: [...], age: [...] } }
  zodErr.format()
  // Nested error tree
}

// 5. V2 + i18n (68 locales)
import { setLocale } from "@oxog/vld"
setLocale("tr")
try { vV2.string().min(5).email().parse("xx") }
catch (e) { console.log(e.message) } // "Metin en az 5 karakter olmalı"

// 6. Performance headline
//   string().min(1).email()    : V2 22ms vs Zod 50ms  (2.3x faster)
//   number().int().positive()  : V2  6ms vs Zod 39ms  (6.5x faster)
//   Realistic API 10 fields    : V2 243ms vs Zod 767ms (3.2x faster)
//   string().email() per instance: 400 B vs Zod 4210 B (~10x smaller)`}];function R(){const[s,d]=l.useState(i[0].id),t=i.find(r=>r.id===s);return e.jsx("div",{className:"min-h-screen",children:e.jsx("div",{className:"container-wide py-12",children:e.jsxs("div",{className:"max-w-7xl mx-auto",children:[e.jsxs("div",{className:"mb-8",children:[e.jsx("h1",{className:"font-display text-4xl font-bold mb-4",children:"Examples"}),e.jsx("p",{className:"text-lg text-muted-foreground",children:"Real-world examples showcasing VLD's powerful validation capabilities. Click on any example to see the full code."})]}),e.jsxs("div",{className:"grid lg:grid-cols-4 gap-8",children:[e.jsx("div",{className:"lg:col-span-1",children:e.jsx("div",{className:"sticky top-24 space-y-2",children:i.map(r=>e.jsxs("button",{onClick:()=>d(r.id),className:a("w-full text-left p-3 rounded-lg transition-all flex items-center gap-3",s===r.id?"bg-vld-primary/10 border border-vld-primary/30 shadow-sm":"hover:bg-muted border border-transparent"),children:[e.jsx("div",{className:a("w-10 h-10 rounded-lg flex items-center justify-center",s===r.id?"bg-vld-primary/20":"bg-muted"),children:e.jsx(r.icon,{className:a("w-5 h-5",s===r.id?"text-vld-primary":"text-muted-foreground")})}),e.jsxs("div",{children:[e.jsx("div",{className:a("font-medium",s===r.id&&"text-vld-primary"),children:r.title}),e.jsx("div",{className:"text-xs text-muted-foreground",children:r.description})]})]},r.id))})}),e.jsxs("div",{className:"lg:col-span-3",children:[e.jsxs("div",{className:"rounded-xl overflow-hidden border border-border shadow-lg",children:[e.jsxs("div",{className:"bg-muted/50 px-4 py-3 border-b border-border flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("div",{className:"flex gap-1.5",children:[e.jsx("div",{className:"w-3 h-3 rounded-full bg-red-500/80"}),e.jsx("div",{className:"w-3 h-3 rounded-full bg-yellow-500/80"}),e.jsx("div",{className:"w-3 h-3 rounded-full bg-green-500/80"})]}),e.jsx("span",{className:"font-medium ml-2",children:t.title})]}),e.jsx("span",{className:"text-xs text-muted-foreground",children:t.description})]}),e.jsx(v,{code:t.code,language:"typescript",showLineNumbers:!0})]}),e.jsxs("div",{className:"mt-6 p-4 rounded-lg bg-muted/50 border border-border",children:[e.jsxs("h3",{className:"font-medium mb-2 flex items-center gap-2",children:[e.jsx(t.icon,{className:"w-4 h-4 text-vld-primary"}),"About this example"]}),e.jsxs("p",{className:"text-sm text-muted-foreground",children:[t.id==="user-registration"&&"Complete user registration form with password confirmation, custom refinements, and error flattening for form display.",t.id==="api-validation"&&"REST API validation patterns including request body, query parameters with coercion, and response schemas.",t.id==="ecommerce"&&"E-commerce schemas for products, shopping carts, and orders with discriminated union payment methods.",t.id==="auth-jwt"&&"JWT token validation and decoding using built-in codecs, plus session and OAuth schemas.",t.id==="discriminated-union"&&"Type-safe event handling with discriminated unions providing O(1) lookup performance.",t.id==="codecs"&&"Bidirectional data transformation with 19 built-in codecs for strings, dates, URLs, binary data, and JWT.",t.id==="recursive"&&"Self-referencing schemas using v.lazy() for tree structures, file systems, and comment threads.",t.id==="i18n"&&"Multi-language error messages with 68 supported locales — every zod locale code including Turkish, Japanese, Arabic, Ukrainian, Georgian, Tamil, and more.",t.id==="file-upload"&&"File upload validation with size limits, MIME type checking, and integration with FormData.",t.id==="xor-validation"&&"XOR validation ensuring exactly one option matches - useful for exclusive choices like payment methods."]})]})]})]})]})})})}export{R as ExamplesPage};
//# sourceMappingURL=examples-ciKVZUbK.js.map
