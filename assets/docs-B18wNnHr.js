import{c as m,r as c,S as p,j as e,a as g}from"./index-BvU-Ujwx.js";import{a as x}from"./code-block-CO9AyCs-.js";import{C as w}from"./code-xml-CfxYGthH.js";import{L as k}from"./layers-BBzICoGs.js";import{P as j,S as C,C as S}from"./search-a99J-2Qd.js";import{C as D}from"./circle-alert-CRqKQ9hv.js";import"./copy-gv81J8d7.js";import"./terminal-Djl9_VUq.js";const N=[["path",{d:"M12 7v14",key:"1akyts"}],["path",{d:"M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z",key:"ruj8y"}]],P=m("book-open",N);const L=[["path",{d:"M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z",key:"lc1i9w"}],["path",{d:"m7 16.5-4.74-2.85",key:"1o9zyk"}],["path",{d:"m7 16.5 5-3",key:"va8pkn"}],["path",{d:"M7 16.5v5.17",key:"jnp8gn"}],["path",{d:"M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z",key:"8zsnat"}],["path",{d:"m17 16.5-5-3",key:"8arw3v"}],["path",{d:"m17 16.5 4.74-2.85",key:"8rfmw"}],["path",{d:"M17 16.5v5.17",key:"k6z78m"}],["path",{d:"M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z",key:"1xygjf"}],["path",{d:"M12 8 7.26 5.15",key:"1vbdud"}],["path",{d:"m12 8 4.74-2.85",key:"3rx089"}],["path",{d:"M12 13.5V8",key:"1io7kd"}]],I=m("boxes",L);const E=[["path",{d:"M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915",key:"1i5ecw"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]],B=m("settings",E),d=[{title:"Getting Started",icon:P,items:[{title:"Introduction",slug:"introduction"},{title:"Installation",slug:"installation"},{title:"Quick Start",slug:"quick-start"},{title:"Why VLD?",slug:"why-vld"}]},{title:"V3.0 New",icon:p,items:[{title:"V2 Method-Memoization",slug:"v2-method-memoization"},{title:"vV2 Drop-in Factory",slug:"vv2-factory"},{title:"setV2Mode Global Toggle",slug:"setv2mode"},{title:"ZodError Compatibility",slug:"zod-error"},{title:"Migration from v2.x",slug:"v3-migration"}]},{title:"Zod 4.6",icon:p,items:[{title:"Boolean .validate()",slug:"boolean-validate"},{title:"IBAN & Currency Codes",slug:"iban-currency"},{title:"Instance Properties",slug:"instance-properties"},{title:"withParser (CSP-safe)",slug:"with-parser"}]},{title:"Basic Types",icon:w,items:[{title:"String",slug:"string"},{title:"Number",slug:"number"},{title:"Boolean",slug:"boolean"},{title:"Date",slug:"date"},{title:"BigInt",slug:"bigint"}]},{title:"Complex Types",icon:I,items:[{title:"Array",slug:"array"},{title:"Object",slug:"object"},{title:"Record",slug:"record"},{title:"Tuple",slug:"tuple"},{title:"Enum",slug:"enum"},{title:"Union",slug:"union"}]},{title:"Advanced",icon:k,items:[{title:"Codecs",slug:"codecs"},{title:"Transformations",slug:"transformations"},{title:"Refinements",slug:"refinements"},{title:"Coercion",slug:"coercion"},{title:"Error Handling",slug:"errors"}]},{title:"Compatibility",icon:j,items:[{title:"Drop-in Subpaths",slug:"drop-in-subpaths"},{title:"Result Pattern",slug:"result-pattern"},{title:"Plugin System",slug:"plugin-system"},{title:"Event Emitter",slug:"event-emitter"},{title:"Logger",slug:"logger"}]},{title:"Configuration",icon:B,items:[{title:"Localization",slug:"localization"},{title:"Custom Messages",slug:"custom-messages"}]}],z={"boolean-validate":{title:"Boolean .validate()",description:"Zod 4.6 boolean validation: check validity without building result objects or errors. VLD lazily AOT-compiles each schema on its first .validate() call and wins every scenario head-to-head (34.9x observed peak).",code:`import { v } from "@oxog/vld"

const User = v.object({ name: v.string(), age: v.number().int() })

User.validate({ name: "ada", age: 36 }) // true
User.validate({ name: "ada", age: -1 }) // false

// Type-guard narrowing works like Zod:
const input: unknown = "hello"
if (v.string().validate(input)) {
  input.length // narrowed to string
}

// Async refinements
const unique = v.string().refine(async (s) => await checkDb(s))
await unique.validateAsync("value") // Promise<boolean>`,lang:"typescript",tips:["Short-circuits on the first failed check - no issue accumulation","The compiled validator is memoized per schema; CSP environments (no new Function) transparently fall back to the interpreter walker for .validate(), then the runtime parser - verdicts never change","z.promise schemas throw on sync .validate() like Zod - use .validateAsync()"]},"iban-currency":{title:"IBAN & Currency Codes",description:"Zod 4.6 string formats: electronic IBAN with the ISO 7064 MOD 97-10 checksum, and ISO 4217 currency codes. Accept/reject sets are byte-compatible with zod.",code:`import { v } from "@oxog/vld"

// IBAN: pattern + checksum (no BigInt)
v.iban().validate("GB82WEST12345698765432") // true
v.iban().validate("GB82WEST12345698765433") // false - checksum fails
v.iban().validate("TR330006100519786457841326") // true

// Currency codes
v.currencyCode().validate("TRY") // true
v.currencyCode().validate("try") // false

// Also available as string methods and regexes
v.string().iban()
v.regexes.iban
v.regexes.currencyCode`,lang:"typescript",tips:["Check digits 00, 01 and 99 are rejected by the pattern before the checksum runs","isValidIBAN() is exported for reuse without a schema"]},"instance-properties":{title:"Instance Properties",description:"Zod 4.6 z.instanceof(Class).properties(shape): validate the fields of a class instance in place. The parse output is the same instance - the prototype survives.",code:`import { v } from "@oxog/vld"

class Bucket {
  constructor(public name: string, public volume: number) {}
}

const BucketSchema = v.instanceof(Bucket).properties({
  name: v.string(),
  volume: v.number(),
})

const bucket = new Bucket("sand", 20)
BucketSchema.parse(bucket) instanceof Bucket // true - same instance
BucketSchema.validate(new Bucket(1, 2)) // false
// Field errors carry the field name: path: ["name"]`,lang:"typescript",tips:["Unlike v.object(), no plain-object copy is built - the class prototype is preserved","Non-instances fail with the constructor name in the message"]},"with-parser":{title:"withParser (CSP-safe)",description:"Zod 4.6 z.withParser(schema, parser): install an externally generated parser as the schema fast path. For build-time or native compilers in environments where new Function is blocked by CSP.",code:`import { v } from "@oxog/vld"

const fast = v.withParser(UserSchema, (input) => {
  if (isMyBuildTimeValid(input)) return normalize(input)
  return v.INVALID // hand the value to the runtime parser
})

fast.parse(payload)                 // routed through your parser
fast.safeParse(badPayload)          // INVALID -> runtime safeParse
UserSchema.validate(payload)        // original schema untouched`,lang:"typescript",tips:["Returns a clone; the original schema is unchanged","The parser must be synchronous and forward-direction, and must build fresh output","Pairs naturally with a build-time compiler that emits plain JS in a CI step"]},introduction:{title:"Introduction",description:"VLD is an ultra-fast, type-safe validation library for TypeScript. It provides Zod-compatible root and subpath APIs with release-gated runtime, startup, memory, package, and drop-in app checks.",code:`import { v } from "@oxog/vld"

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
}`,lang:"typescript",tips:["VLD v3.3.2 is checked against Zod 4.6.7 (259/259 exports; every behavioral sweep - formats, container semantics, JSON Schema, error formatting - reports zero divergences)",'`import { z } from "@oxog/vld"` is a true drop-in for `import { z } from "zod"` — 3.18x faster vs Zod 4.6.7 (10/10 wins, semantic-checked; zero divergences)',"`v.core` mirrors Zod's whole `z.core` surface (312 names: classes, `_*` factories, checks, `toDotPath`, `mergeValues`, compile). It is a plain object of getters, so a bundle that never reads it drops it entirely (root entry stays 96.0 KiB vs Zod 182.8 KiB); `@oxog/vld/v4/core` carries the same surface as a subpath","Every `v.core._*` factory accepts Zod's optional leading class argument, e.g. `_array($ZodArray, schema)` or `_check(fn)` with the payload-issues contract","Root, mini, v4, v4-mini, v4/core, v4/locales, and compile entry points are covered","Zod 4.6 APIs ship built-in: .validate(), .validateAsync(), z.iban(), z.currencyCode(), z.instanceof().properties(), z.withParser()","Full TypeScript inference","3620 tests with 100% statement, 99% branch, 100% function and line coverage"]},installation:{title:"Installation",description:"Install VLD using your preferred package manager.",code:`# npm
npm install @oxog/vld

# yarn
yarn add @oxog/vld

# pnpm
pnpm add @oxog/vld

# bun
bun add @oxog/vld`,lang:"bash",tips:["VLD has zero dependencies","Works with Node.js, Deno, and browsers","Full ESM and CommonJS support"]},"quick-start":{title:"Quick Start",description:"Get started with VLD in just a few lines of code.",code:`import { v } from "@oxog/vld"

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
}`,lang:"typescript"},"why-vld":{title:"Why VLD?",description:"VLD was built to address performance limitations while maintaining an ergonomic API and practical Zod replacement paths.",code:`// VLD advantages over alternatives:

// 0. TRUE DROP-IN for Zod 4.6 (v3.3.1) — only the import line changes
import { z } from "@oxog/vld"   // <- same as: import { z } from "zod"
//    3.18x faster vs Zod 4.6.7, 10/10 honest wins, semantic-checked
//    v.core mirrors the whole z.core surface (312 names), zero cost until read
//    benchmarks/dropin-vs-zod.cjs
const schema = z.object({ name: z.string().min(2) })

// 1. AOT Compile performance - release-gated against npm-latest Zod (4.6.7)
import { v, compile } from "@oxog/vld"
const compiled = compile(schema) // 1.46x parse, 2.36x validate vs z.compile
const ok = v.validate(compiled, data) // 310M ops/sec on Moltar ParseSafe

// 2. Package health
// 259/259 Zod exports, bundle, install, package, and type declarations are checked

// 3. Memory Usage - less retained heap than Zod

// 4. Built-in i18n - 32 languages
import { setLocale } from "@oxog/vld"
setLocale("tr") // Turkish error messages

// 5. Built-in Codecs - 19 data transformers
import { codecs } from "@oxog/vld"
const num = codecs.stringToNumber.decode("123") // 123

// 6. Same package shape as Zod - Easy migration
import { v } from "@oxog/vld" // Just change the import!`,lang:"typescript"},"drop-in-subpaths":{title:"Drop-in Subpaths",description:"VLD exposes Zod-compatible package entry points so applications can migrate root and Zod 4 subpath imports by changing the package name.",code:`// Before
import { z } from "zod"
import * as v4 from "zod/v4"
import * as mini from "zod/v4-mini"
import * as core from "zod/v4/core"
import * as locales from "zod/v4/locales"

// After
import { z } from "@oxog/vld"
import * as v4 from "@oxog/vld/v4"
import * as mini from "@oxog/vld/v4-mini"
import * as core from "@oxog/vld/v4/core"
import * as locales from "@oxog/vld/v4/locales"

const schema = z.object({
  email: z.string().email(),
})`,lang:"typescript",tips:["npm run verify:zod compares exports and typeof values against latest stable Zod","npm run verify:drop-in compiles and runs the same TypeScript app with both packages","npm run release:check runs both checks before publishing"]},string:{title:"String Validation",description:"String validators with comprehensive validation methods.",code:`import { v } from "@oxog/vld"

// Basic string
const str = v.string()

// With validations
const email = v.string().email()
const url = v.string().url()
const uuid = v.string().uuid()

// Length constraints
const username = v.string()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username cannot exceed 20 characters")

// Pattern matching
const phone = v.string().regex(/^\\+?[1-9]\\d{1,14}$/)

// Transformations
const trimmed = v.string().trim()
const lower = v.string().toLowerCase()
const upper = v.string().toUpperCase()

// IP addresses
const ipv4 = v.string().ip({ version: "v4" })
const ipv6 = v.string().ip({ version: "v6" })

// Combining validators
const password = v.string()
  .min(8)
  .max(100)
  .regex(/[A-Z]/, "Must contain uppercase")
  .regex(/[0-9]/, "Must contain number")`,lang:"typescript",tips:["Use .trim() to remove whitespace before validation","Chain multiple validators for complex requirements","Custom error messages are supported on all methods"]},number:{title:"Number Validation",description:"Number validators with min, max, integer, and more.",code:`import { v } from "@oxog/vld"

// Basic number
const num = v.number()

// Integer only
const int = v.number().int()

// Positive/Negative
const positive = v.number().positive()
const negative = v.number().negative()
const nonnegative = v.number().nonnegative()

// Range constraints
const age = v.number().int().min(0).max(120)
const percentage = v.number().min(0).max(100)

// Greater/Less than
const gt = v.number().gt(0)   // > 0
const gte = v.number().gte(0) // >= 0
const lt = v.number().lt(100) // < 100
const lte = v.number().lte(100) // <= 100

// Finite only (no Infinity)
const finite = v.number().finite()

// Safe integers
const safe = v.number().safe()

// Multiple of
const even = v.number().multipleOf(2)

// Combining
const price = v.number()
  .positive()
  .finite()
  .multipleOf(0.01) // Cents precision`,lang:"typescript"},boolean:{title:"Boolean Validation",description:"Boolean type with optional coercion.",code:`import { v } from "@oxog/vld"

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
const falseOnly = v.literal(false)`,lang:"typescript"},date:{title:"Date Validation",description:"Date validation with range constraints.",code:`import { v } from "@oxog/vld"

// Basic date
const date = v.date()          // Zod: Date instances only

// From strings / numbers (Date-constructor coercion)
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
})`,lang:"typescript"},bigint:{title:"BigInt Validation",description:"BigInt validation for large integers.",code:`import { v } from "@oxog/vld"

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
})`,lang:"typescript"},array:{title:"Array Validation",description:"Array validation with element type and length constraints.",code:`import { v } from "@oxog/vld"

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
})`,lang:"typescript"},object:{title:"Object Validation",description:"Object validation with shape definition and modifiers.",code:`import { v } from "@oxog/vld"

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
const updateUser = user.partial()

// Pick specific fields
const nameOnly = user.pick({ name: true })

// Omit specific fields
const withoutEmail = user.omit({ email: true })

// Extend objects
const userWithAge = user.extend({
  age: v.number().int().positive(),
})

// Strict mode (no extra properties)
const strict = v.object({
  name: v.string(),
}).strict()

// Passthrough (allow extra properties)
const loose = v.object({
  name: v.string(),
}).passthrough()`,lang:"typescript"},record:{title:"Record Validation",description:"Record type for dynamic key-value pairs.",code:`import { v } from "@oxog/vld"

// Basic record (string keys)
const dict = v.record(v.string(), v.unknown())

// Record with string values
const stringDict = v.record(v.string(), v.string())

// Record with number values
const scores = v.record(v.string(), v.number())

// Record with enum keys
const roles = v.record(
  v.enum("admin", "user", "guest"),
  v.boolean()
)

// Record with complex values
const userMap = v.record(
  v.string(), // user ID
  v.object({
    name: v.string(),
    email: v.string().email(),
  })
)`,lang:"typescript"},tuple:{title:"Tuple Validation",description:"Fixed-length arrays with specific types at each position.",code:`import { v } from "@oxog/vld"

// Basic tuple (variadic syntax)
const point = v.tuple(v.number(), v.number())

// Mixed types
const userTuple = v.tuple(
  v.string(), // name
  v.number(), // age
  v.boolean() // isActive
)

// With rest elements
const args = v.tuple(v.string()).rest(v.number())

// RGB color
const rgb = v.tuple(
  v.number().int().min(0).max(255),
  v.number().int().min(0).max(255),
  v.number().int().min(0).max(255)
)

// Usage
const coordinates: [number, number] = point.parse([10, 20])`,lang:"typescript"},enum:{title:"Enum Validation",description:"Enum types for a fixed set of values.",code:`import { v } from "@oxog/vld"

// String enum (variadic syntax)
const Role = v.enum("admin", "user", "guest")
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
  role: v.enum("admin", "user", "guest"),
  status: v.nativeEnum(Status),
})`,lang:"typescript"},union:{title:"Union Types",description:"Union types for values that can be one of several types.",code:`import { v } from "@oxog/vld"

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

// Intersection
const hasName = v.object({ name: v.string() })
const hasAge = v.object({ age: v.number() })
const person = v.intersection([hasName, hasAge])`,lang:"typescript"},codecs:{title:"Codecs",description:"Bidirectional data transformation with encode/decode support.",code:`import { codecs } from "@oxog/vld"

// String to Number
const numCodec = codecs.stringToNumber
numCodec.decode("123")    // 123
numCodec.encode(123)      // "123"

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

// JSON string parsing
const jsonCodec = codecs.jsonCodec
jsonCodec.decode('{"name":"John"}')  // { name: "John" }

// Base64 encoding
const base64Codec = codecs.stringToBase64
base64Codec.encode("Hello")  // "SGVsbG8="
base64Codec.decode("SGVsbG8=")  // "Hello"

// JWT payload extraction
const jwtCodec = codecs.jwtPayload
const payload = jwtCodec.decode(token)  // JWT payload object`,lang:"typescript",tips:["Codecs are bidirectional - encode and decode","19 built-in codecs available","Create custom codecs with VldCodec.create()"]},transformations:{title:"Transformations",description:"Transform validated data into different shapes.",code:`import { v } from "@oxog/vld"

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
})`,lang:"typescript"},refinements:{title:"Refinements",description:"Add custom validation logic to any schema.",code:`import { v } from "@oxog/vld"

// Basic refinement
const positiveString = v.string().refine(
  (s) => s.length > 0,
  "String must not be empty"
)

// Multiple refinements
const password = v.string()
  .min(8)
  .refine((s) => /[A-Z]/.test(s), "Must contain uppercase")
  .refine((s) => /[a-z]/.test(s), "Must contain lowercase")
  .refine((s) => /[0-9]/.test(s), "Must contain number")

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
)`,lang:"typescript"},coercion:{title:"Type Coercion",description:"Automatically convert input values to the expected type.",code:`import { v } from "@oxog/vld"

// Coerce to string
const str = v.coerce.string()
str.parse(123)       // "123"
str.parse(true)      // "true"

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
date.parse("2024-01-15")  // Date
date.parse(1705276800000) // Date from timestamp

// Usage in schemas
const apiInput = v.object({
  id: v.coerce.number().int().positive(),
  active: v.coerce.boolean(),
  createdAt: v.coerce.date(),
})`,lang:"typescript",tips:["Coercion is useful for API inputs (query params, form data)","Coercion happens before validation"]},errors:{title:"Error Handling",description:"VLD provides multiple error formatting options.",code:`import { v, prettifyError, flattenError, treeifyError } from "@oxog/vld"

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

  // 2. Prettified (human-readable)
  console.log(prettifyError(result.error))
  // ✗ name: String must be at least 2 characters
  // ✗ email: Invalid email
  // ✗ age: Number must be positive

  // 3. Flattened (for forms)
  console.log(flattenError(result.error))
  // { fieldErrors: { name: [...], email: [...] } }

  // 4. Tree structure (for nested objects)
  console.log(treeifyError(result.error))
}`,lang:"typescript",tips:["Use flattenError() for form validation","Use prettifyError() for console output","Use treeifyError() for complex nested errors"]},"result-pattern":{title:"Result Pattern",description:"Functional error handling with Ok/Err. Inspired by Rust.",code:`import { Ok, Err, match, tryCatch, map, flatMap, unwrapOr } from "@oxog/vld"

// Create results explicitly
const success = Ok(42)
const failure = Err(new Error("Something went wrong"))

// tryCatch - Wrap operations that might throw
const result = tryCatch(() => JSON.parse(jsonString))

// match - Handle both cases elegantly
const value = match(result, {
  ok: (data) => data.name,
  err: (error) => "default"
})

// map - Transform success values
const doubled = map(Ok(21), x => x * 2) // Ok(42)

// flatMap - Chain operations
const parsed = flatMap(
  tryCatch(() => JSON.parse(input)),
  data => data.id ? Ok(data.id) : Err("No ID")
)

// unwrapOr - Get value with fallback
const name = unwrapOr(result, "Anonymous")

// all - Combine multiple results
const results = all([Ok(1), Ok(2), Ok(3)])
// Ok([1, 2, 3]) if all succeed

// isOk / isErr - Type guards
if (isOk(result)) {
  console.log(result.value)
}`,lang:"typescript",tips:["Use match() for exhaustive handling","tryCatch() is great for JSON.parse, fetch, etc.","Chain operations with map() and flatMap()"]},"plugin-system":{title:"Plugin System",description:"Extend VLD with custom validators, transforms, and hooks.",code:`import { definePlugin, usePlugin, createVldKernel } from "@oxog/vld"

// Define a plugin
const myPlugin = definePlugin({
  name: "my-validation-plugin",
  version: "1.0.0",

  // Add custom validators
  validators: {
    phone: () => v.string().regex(/^\\+?[1-9]\\d{1,14}$/),
    username: () => v.string().min(3).max(20).regex(/^[a-z0-9_]+$/),
  },

  // Add custom transforms
  transforms: {
    slugify: () => (s: string) => s.toLowerCase().replace(/\\s+/g, "-"),
  },

  // Lifecycle hooks
  hooks: {
    onInit: (ctx) => console.log("Plugin initialized"),
    onValidate: (ctx) => console.log("Validating:", ctx.value),
  },
})

// Register the plugin globally
usePlugin(myPlugin)

// Or create an isolated kernel
const kernel = createVldKernel({ plugins: [myPlugin] })

// Access custom validators
const phoneSchema = kernel.validators.phone()
const result = phoneSchema.safeParse("+1234567890")`,lang:"typescript",tips:["Plugins are isolated and don't affect other instances","Use definePlugin() for type-safe plugin creation","createVldKernel() creates isolated instances"]},"event-emitter":{title:"Event Emitter",description:"Track validation lifecycle events for logging and debugging.",code:`import { createEmitter, withEmitter } from "@oxog/vld"
import type { VldEvents } from "@oxog/vld"

// Create an emitter for VLD events
const emitter = createEmitter<VldEvents>()

// Listen to validation events
emitter.on("parseStart", ({ schema, value }) => {
  console.log("Starting validation:", value)
})

emitter.on("parseSuccess", ({ result }) => {
  console.log("Validation succeeded:", result)
})

emitter.on("parseError", ({ error }) => {
  console.error("Validation failed:", error.issues)
})

// One-time listener
emitter.once("parseStart", () => {
  console.log("First validation started!")
})

// Remove listener
const unsubscribe = emitter.on("parseError", handler)
unsubscribe() // Remove the listener

// withEmitter - Create schema with attached emitter
const schema = withEmitter(
  v.object({ name: v.string() }),
  emitter
)`,lang:"typescript",tips:["Use once() for one-time event handlers","Unsubscribe to prevent memory leaks","Events: parseStart, parseSuccess, parseError"]},logger:{title:"Logger",description:"Built-in logger for debugging and tracing validation.",code:`import {
  createLogger,
  initLogger,
  getLogger,
  setLogLevel,
  enableDebug,
  disableLogging
} from "@oxog/vld"

// Create a custom logger
const logger = createLogger({
  level: "debug", // "debug" | "info" | "warn" | "error"
  prefix: "[VLD]",
  handler: (entry) => {
    console.log(\`[\${entry.level}] \${entry.message}\`, entry.data)
  }
})

// Initialize global logger
initLogger({ level: "info" })

// Get the global logger instance
const globalLogger = getLogger()

// Use logger methods
logger.debug("Validation started", { schema: "user" })
logger.info("Processing data", { count: 100 })
logger.warn("Deprecated feature used")
logger.error("Validation failed", { errors: issues })

// Change log level at runtime
setLogLevel("warn") // Only warn and error logged

// Quick debug mode toggle
enableDebug()    // Set level to "debug"
disableLogging() // Disable all logging`,lang:"typescript",tips:["Use debug level for development","Custom handlers for logging services","disableLogging() for production"]},localization:{title:"Localization",description:"VLD ships 68 locale catalogs - every locale code zod 4.6.7 covers, plus extras.",code:`import { v, setLocale, getLocale } from "@oxog/vld"

// Set global locale
setLocale("tr") // Turkish
setLocale("de") // German
setLocale("ja") // Japanese

// Get current locale
const currentLocale = getLocale() // "tr"

// Supported locales
const locales = [
  "en",    // English (default)
  "tr",    // Turkish
  "de",    // German
  "fr",    // French
  "es",    // Spanish
  "pt",    // Portuguese
  "it",    // Italian
  "ru",    // Russian
  "ja",    // Japanese
  "ko",    // Korean
  "zh",    // Chinese
  "ar",    // Arabic
  // ... and many more!
]

// Example with Turkish locale
setLocale("tr")
const result = v.string().email().safeParse("invalid")
// Error: Geçersiz e-posta adresi`,lang:"typescript",tips:["setLocale() affects all subsequent validations","Fallback to English if locale not found"]},"custom-messages":{title:"Custom Error Messages",description:"Override default error messages with your own.",code:`import { v } from "@oxog/vld"

// Inline custom messages
const username = v.string()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username cannot exceed 20 characters")

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

// Schema-level custom messages
const form = v.object({
  name: v.string({ required_error: "Name is required" }),
  email: v.string({ required_error: "Email is required" }).email({
    message: "Invalid email format",
  }),
})`,lang:"typescript"}};function F(){const[n,i]=c.useState("introduction"),[u,v]=c.useState(""),[h,f]=c.useState(new Set(["Getting Started"])),o=z[n]||{title:n.replace(/-/g," "),description:"Documentation coming soon.",code:"// Coming soon",lang:"typescript"},b=t=>{f(r=>{const s=new Set(r);return s.has(t)?s.delete(t):s.add(t),s})},y=d.map(t=>({...t,items:t.items.filter(r=>r.title.toLowerCase().includes(u.toLowerCase()))})).filter(t=>t.items.length>0);return e.jsx("div",{className:"min-h-screen",children:e.jsx("div",{className:"container-wide py-8",children:e.jsxs("div",{className:"flex gap-8",children:[e.jsx("aside",{className:"hidden lg:block w-64 shrink-0",children:e.jsxs("div",{className:"sticky top-24 space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto hide-scrollbar pr-4",children:[e.jsxs("div",{className:"relative",children:[e.jsx(C,{className:"absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"}),e.jsx("input",{type:"text",placeholder:"Search docs...",value:u,onChange:t=>v(t.target.value),className:"w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-vld-primary/50"})]}),e.jsx("nav",{className:"space-y-2",children:y.map(t=>{const r=h.has(t.title),s=t.icon;return e.jsxs("div",{children:[e.jsxs("button",{onClick:()=>b(t.title),className:"w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors",children:[e.jsx(s,{className:"w-4 h-4"}),e.jsx("span",{className:"flex-1 text-left",children:t.title}),e.jsx(S,{className:g("w-4 h-4 transition-transform",r&&"rotate-90")})]}),r&&e.jsx("ul",{className:"mt-1 ml-6 space-y-1",children:t.items.map(a=>e.jsx("li",{children:e.jsx("button",{onClick:()=>i(a.slug),className:g("w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors",n===a.slug?"bg-vld-primary/10 text-vld-primary font-medium":"text-muted-foreground hover:text-foreground hover:bg-muted"),children:a.title})},a.slug))})]},t.title)})})]})}),e.jsxs("main",{className:"flex-1 min-w-0 max-w-4xl",children:[e.jsx("div",{className:"lg:hidden mb-6",children:e.jsx("select",{value:n,onChange:t=>i(t.target.value),className:"w-full p-3 rounded-lg border border-border bg-card text-sm",children:d.map(t=>e.jsx("optgroup",{label:t.title,children:t.items.map(r=>e.jsx("option",{value:r.slug,children:r.title},r.slug))},t.title))})}),e.jsxs("div",{className:"mb-8",children:[e.jsx("h1",{className:"font-display text-3xl lg:text-4xl font-bold mb-4",children:o.title}),e.jsx("p",{className:"text-lg text-muted-foreground leading-relaxed",children:o.description})]}),o.tips&&o.tips.length>0&&e.jsxs("div",{className:"mb-8 p-4 rounded-xl bg-vld-primary/5 border border-vld-primary/20",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-3",children:[e.jsx(D,{className:"w-4 h-4 text-vld-primary"}),e.jsx("h3",{className:"text-sm font-semibold text-vld-primary",children:"Tips"})]}),e.jsx("ul",{className:"space-y-2",children:o.tips.map((t,r)=>e.jsxs("li",{className:"text-sm text-muted-foreground flex items-start gap-2",children:[e.jsx("span",{className:"text-vld-primary mt-0.5",children:"•"}),t]},r))})]}),e.jsx(x,{code:o.code,language:o.lang,filename:o.lang==="bash"?"terminal":`${n}.ts`,showLineNumbers:!0}),e.jsx("div",{className:"flex justify-between mt-10 pt-8 border-t border-border",children:(()=>{const t=d.flatMap(l=>l.items),r=t.findIndex(l=>l.slug===n),s=r>0?t[r-1]:null,a=r<t.length-1?t[r+1]:null;return e.jsxs(e.Fragment,{children:[s?e.jsxs("button",{onClick:()=>i(s.slug),className:"text-sm text-muted-foreground hover:text-vld-primary transition-colors",children:["← ",s.title]}):e.jsx("div",{}),a?e.jsxs("button",{onClick:()=>i(a.slug),className:"text-sm text-muted-foreground hover:text-vld-primary transition-colors",children:[a.title," →"]}):e.jsx("div",{})]})})()})]})]})})})}export{F as DocsPage};
//# sourceMappingURL=docs-B18wNnHr.js.map
