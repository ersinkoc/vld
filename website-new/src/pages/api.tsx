import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Search, ChevronDown, ChevronRight, Code2, Box, Layers, Wand2, Globe, FileCode, Binary, Shield, GitBranch, Plug, Activity, Terminal } from 'lucide-react'
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
  { name: 'v.discriminatedUnion()', description: 'Fast union with discriminator field (O(1) lookup)', category: 'Composition', signature: 'v.discriminatedUnion(key, ...options): VldDiscriminatedUnion', example: `const schema = v.discriminatedUnion("type",\n  v.object({ type: v.literal("a"), a: v.string() }),\n  v.object({ type: v.literal("b"), b: v.number() })\n)` },
  { name: 'v.xor()', description: 'XOR validation - exactly one must match', category: 'Composition', signature: 'v.xor(options): VldXor', example: `const schema = v.xor([\n  v.object({ email: v.string() }),\n  v.object({ phone: v.string() })\n])` },
  { name: 'v.literal()', description: 'Validates exact literal value', category: 'Composition', signature: 'v.literal(value): VldLiteral', example: `const schema = v.literal("active")` },
  { name: 'v.enum()', description: 'Enum with fixed string values', category: 'Composition', signature: 'v.enum(...values): VldEnum', example: `const schema = v.enum("admin", "user", "guest")` },

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

  // Result Pattern
  { name: 'Ok()', description: 'Create a successful result', category: 'Result Pattern', signature: 'Ok<T>(value: T): Result<T, never>', example: `const success = Ok(42)` },
  { name: 'Err()', description: 'Create a failure result', category: 'Result Pattern', signature: 'Err<E>(error: E): Result<never, E>', example: `const failure = Err(new Error("failed"))` },
  { name: 'tryCatch()', description: 'Wrap throwable operations in a Result', category: 'Result Pattern', signature: 'tryCatch<T>(fn: () => T): Result<T, Error>', example: `const result = tryCatch(() => JSON.parse(data))` },
  { name: 'match()', description: 'Pattern match on a Result', category: 'Result Pattern', signature: 'match<T, E, R>(result, { ok, err }): R', example: `const value = match(result, {\n  ok: (v) => v * 2,\n  err: (e) => 0\n})` },
  { name: 'map()', description: 'Transform the success value', category: 'Result Pattern', signature: 'map<T, E, U>(result, fn): Result<U, E>', example: `const doubled = map(Ok(21), x => x * 2)` },
  { name: 'flatMap()', description: 'Chain Result-returning operations', category: 'Result Pattern', signature: 'flatMap<T, E, U>(result, fn): Result<U, E>' },
  { name: 'unwrapOr()', description: 'Get value with fallback', category: 'Result Pattern', signature: 'unwrapOr<T, E>(result, defaultValue: T): T', example: `const value = unwrapOr(result, "default")` },
  { name: 'isOk()', description: 'Type guard for success', category: 'Result Pattern', signature: 'isOk<T, E>(result): result is Ok<T>' },
  { name: 'isErr()', description: 'Type guard for failure', category: 'Result Pattern', signature: 'isErr<T, E>(result): result is Err<E>' },
  { name: 'all()', description: 'Combine multiple Results', category: 'Result Pattern', signature: 'all<T>(results: Result<T>[]): Result<T[]>', example: `const combined = all([Ok(1), Ok(2), Ok(3)])` },

  // Plugin System
  { name: 'definePlugin()', description: 'Define a VLD plugin with validators, transforms, and hooks', category: 'Plugin System', signature: 'definePlugin(config): VldPlugin', example: `const plugin = definePlugin({\n  name: "my-plugin",\n  validators: { phone: () => v.string().regex(/.../) }\n})` },
  { name: 'usePlugin()', description: 'Register a plugin globally', category: 'Plugin System', signature: 'usePlugin(plugin): void', example: `usePlugin(myPlugin)` },
  { name: 'createVldKernel()', description: 'Create isolated VLD instance with plugins', category: 'Plugin System', signature: 'createVldKernel(options?): VldKernelInstance', example: `const kernel = createVldKernel({ plugins: [myPlugin] })` },
  { name: 'getVldKernel()', description: 'Get the global kernel instance', category: 'Plugin System', signature: 'getVldKernel(): VldKernelInstance' },
  { name: 'resetVldKernel()', description: 'Reset the global kernel', category: 'Plugin System', signature: 'resetVldKernel(): void' },

  // Event Emitter
  { name: 'createEmitter()', description: 'Create a typed event emitter', category: 'Event Emitter', signature: 'createEmitter<T>(): Emitter<T>', example: `const emitter = createEmitter<VldEvents>()` },
  { name: 'createEventBus()', description: 'Create a global event bus', category: 'Event Emitter', signature: 'createEventBus<T>(): Emitter<T>' },
  { name: 'withEmitter()', description: 'Attach emitter to a schema', category: 'Event Emitter', signature: 'withEmitter(schema, emitter): schema' },
  { name: 'emitter.on()', description: 'Subscribe to an event', category: 'Event Emitter', signature: 'on(event, handler): unsubscribe', example: `emitter.on("parseStart", ({ value }) => log(value))` },
  { name: 'emitter.once()', description: 'Subscribe to event once', category: 'Event Emitter', signature: 'once(event, handler): unsubscribe' },
  { name: 'emitter.emit()', description: 'Emit an event', category: 'Event Emitter', signature: 'emit(event, payload): void' },

  // Logger
  { name: 'createLogger()', description: 'Create a logger instance', category: 'Logger', signature: 'createLogger(options?): Logger', example: `const logger = createLogger({ level: "debug" })` },
  { name: 'initLogger()', description: 'Initialize the global logger', category: 'Logger', signature: 'initLogger(options?): void' },
  { name: 'getLogger()', description: 'Get the global logger', category: 'Logger', signature: 'getLogger(): Logger' },
  { name: 'setLogLevel()', description: 'Set log level at runtime', category: 'Logger', signature: 'setLogLevel(level): void', example: `setLogLevel("warn")` },
  { name: 'enableDebug()', description: 'Enable debug logging', category: 'Logger', signature: 'enableDebug(): void' },
  { name: 'disableLogging()', description: 'Disable all logging', category: 'Logger', signature: 'disableLogging(): void' },

  // AOT Compile (v2.4.0) — Zod 4.5.4 parity
  { name: 'v.compile()', description: 'AOT-compile a schema to a flat if/typeof guard. Returns the same schema with _zod.bag.validator set. Pass { JITless: true } to skip the compile step.', category: 'AOT Compile', signature: 'v.compile(schema, options?): T', example: `import { v, compile } from "@oxog/vld"

const schema = v.object({ name: v.string(), age: v.number() })
const compiled = compile(schema)
compiled.parse({ name: "ada", age: 30 }) // returns the input on success (Moltar ParseSafe semantic)
v.validate(compiled, { name: "ada", age: 30 }) // true` },
  { name: 'v.validate()', description: 'Boolean validator. Reads _zod.bag.validator when present, falls back to safeParse for uncompiled schemas.', category: 'AOT Compile', signature: 'v.validate(schema, value): boolean', example: `import { v, compile } from "@oxog/vld"

const compiled = compile(v.string().email())
v.validate(compiled, "user@example.com") // true
v.validate(compiled, "not-an-email")     // false` },
  { name: 'v.validateAsync()', description: 'Async boolean validator. Resolves to true on success, false on failure.', category: 'AOT Compile', signature: 'v.validateAsync(schema, value): Promise<boolean>', example: `import { v, compile, validateAsync } from "@oxog/vld"

const compiled = compile(v.string().email())
await validateAsync(compiled, "user@example.com") // true` },
  { name: 'v.properties()', description: 'All-keys-optional object schema. Equivalent to v.object(shape with every key optional()).', category: 'AOT Compile', signature: 'v.properties(shape): VldObject', example: `import { v } from "@oxog/vld"

const schema = v.properties({ a: v.string(), b: v.number() })
schema.parse({ a: "x" })        // ok, b is optional
schema.parse({ a: "x", b: 1 })  // ok` },
  { name: 'v.getDiscriminatedOption()', description: 'Look up a discriminatedUnion option by discriminator value at runtime. Returns undefined if no match.', category: 'AOT Compile', signature: 'v.getDiscriminatedOption(discriminator, options, value): VldBase | undefined' },
  { name: 'v.memoizer()', description: 'Build a v4-core-compatible memoizer. The returned function caches the most recent (input, output) pair.', category: 'AOT Compile', signature: 'v.memoizer(): (input: unknown, output?: unknown) => unknown' },
  { name: 'v.toZod()', description: 'Convert a raw value (or VLD schema) to a VLD schema. Convenience for the v4-core toZod helper.', category: 'AOT Compile', signature: 'v.toZod(value): VldBase', example: `import { v } from "@oxog/vld"

const schema = v.toZod({ a: v.string() }) // wraps in v.object if shape, returns as-is if VldBase
const str = v.toZod("hello")              // v.string()` },
  { name: 'ZodCompileError', description: 'Thrown when an AOT-compiled validator fails at compile time (unsupported schema shape, etc).', category: 'AOT Compile', signature: 'class ZodCompileError extends Error' },
  { name: 'ZodCompileAsyncError', description: 'Async variant of ZodCompileError for validateAsync paths.', category: 'AOT Compile', signature: 'class ZodCompileAsyncError extends Error' },
  { name: 'ZodCompileUnsupportedError', description: 'Thrown when a schema feature cannot be lowered to an AOT compile body (e.g. custom refinements, async transforms).', category: 'AOT Compile', signature: 'class ZodCompileUnsupportedError extends Error' },

  // V2 Method-Memoization (v3.0 NEW) — part of the 3.00x drop-in story
  { name: 'vV2', description: 'Drop-in factory that always returns V2 method-memoization classes. Identical surface to v; vV2 contributes to the 3.00x geomean over Zod 4.5.4 in benchmarks/dropin-vs-zod.cjs.', category: 'V2 (v3.0)', signature: 'vV2: typeof v', example: `import { vV2 } from "@oxog/vld"

const schema = vV2.string().min(1).email()
schema.parse("user@example.com") // part of the 3.00x drop-in geomean` },
  { name: 'v.stringV2()', description: 'V2 string with single-def + check classes. Same chain surface as v.string().', category: 'V2 (v3.0)', signature: 'v.stringV2(): VldStringV2', example: `import { v } from "@oxog/vld"

const s = v.stringV2().min(2).max(100).email()
s.parse("user@example.com")` },
  { name: 'v.numberV2()', description: 'V2 number with 16 check classes. Up to 6.22x faster than v.number() on int().positive().min(1) in the head-to-head benchmark.', category: 'V2 (v3.0)', signature: 'v.numberV2(): VldNumberV2', example: `v.numberV2().int().positive().min(1).max(120).parse(25)` },
  { name: 'v.dateV2() / v.bigintV2() / v.arrayV2() / v.unionV2()', description: 'V2 method-memoization variants for date, bigint, array, union, tuple, set, map, intersection, record, literal, enum, boolean, optional, nullable, nullish, refine, transform. 21 V2 classes total.', category: 'V2 (v3.0)', signature: 'v.*V2()', example: `vV2.tuple([vV2.string(), vV2.number()])
vV2.literal("active")
vV2.union([vV2.string(), vV2.number()])` },
  { name: 'v.coerce.stringV2() / v.coerce.numberV2()', description: 'V2 coercion variants — same surface as v.coerce.*, included in the 3.00x geomean.', category: 'V2 (v3.0)', signature: 'v.coerce.stringV2() / v.coerce.numberV2()' },
  { name: 'v.setV2Mode(true)', description: 'Globally swap v.* factories to V2. No source rewrites needed. Call v.setV2Mode(false) to revert.', category: 'V2 (v3.0)', signature: 'v.setV2Mode(enabled: boolean): void', example: `import { v } from "@oxog/vld"

v.setV2Mode(true)
// Now v.string() / v.number() / v.object() return V2 classes
const schema = v.string().email()
v.setV2Mode(false) // back to V1` },
  { name: 'v.useV2', description: 'Read-only flag reflecting the current V2 mode. Updated by setV2Mode().', category: 'V2 (v3.0)', signature: 'v.useV2: boolean' },
  { name: 'v.pipeline()', description: 'Zod 4.5 alias for v.pipe(). Compose two schemas so the first validates, the second transforms.', category: 'V2 (v3.0)', signature: 'v.pipeline(a, b): VldPipe', example: `v.pipeline(v.string(), v.coerce.number()).parse("42") // 42` },
  { name: 'VLD_CAPTURE_STACK', description: 'Opt-in env flag for capturing V8 stack traces on VldError. Skip by default for invalid-path perf; set to "true" for debug.', category: 'V2 (v3.0)', signature: 'process.env.VLD_CAPTURE_STACK', example: `process.env.VLD_CAPTURE_STACK = "true" // capture stacks in VldError` },

  // True Drop-in Replacement (v3.0 NEW) — `z` is a real alias for `v`
  { name: 'z (drop-in alias for v)', description: '`import { z } from "@oxog/vld"` is a true drop-in for `import { z } from "zod"`. Same names, same shape, same return types. Use it for instant migration with a single import-line change — no other source rewrites needed.', category: 'Drop-in (v3.0)', signature: 'export const z: typeof v', example: `// BEFORE
import { z } from 'zod'
const S = z.object({ name: z.string().min(1) })
S.parse({ name: 'x' })

// AFTER — only the import line changes
import { z } from '@oxog/vld'
const S = z.object({ name: z.string().min(1) })
S.parse({ name: 'x' })  // 3.00x faster (benchmarks/dropin-vs-zod.cjs)` },
  { name: 'z (namespace)', description: '`z.infer<T>` and `z.input<T>` mirror the Zod namespace for type extraction. Same as `v.infer` / `v.input`.', category: 'Drop-in (v3.0)', signature: 'namespace z { type infer<T> = v.infer<T>; type input<T> = v.input<T> }', example: `import { z } from '@oxog/vld'
const S = z.object({ name: z.string() })
type User = z.infer<typeof S>  // { name: string }` },

  // ZodError Compatibility (v3.0 NEW)
  { name: 'toZodError()', description: 'Convert a VldError into a ZodError-shaped ZodLikeError with .format() and .flatten().', category: 'ZodError Compat (v3.0)', signature: 'toZodError(vldError): ZodLikeError', example: `import { v, toZodError } from "@oxog/vld"

const r = v.object({ name: v.string().min(2) }).safeParse({ name: "J" })
if (!r.success) {
  const zodErr = toZodError(r.error)
  console.log(zodErr.flatten()) // { formErrors: [], fieldErrors: { name: [...] } }
}` },
  { name: 'toZodSafeResult()', description: 'Convert a safeParse result to a Zod-shaped result in one call. The error is a ZodLikeError instead of a raw VldError.', category: 'ZodError Compat (v3.0)', signature: 'toZodSafeResult<T>(result): { success: true; data: T } | { success: false; error: ZodLikeError }' },
  { name: 'ZodLikeError', description: 'ZodError-shaped error class. Has .name === "ZodError", .issues array, .format(), and .flatten() methods. instanceof Error, instanceof ZodLikeError.', category: 'ZodError Compat (v3.0)', signature: 'class ZodLikeError extends Error', example: `const r = v.string().min(2).safeParse("J")
if (!r.success) {
  const z = toZodError(r.error)
  z instanceof ZodLikeError  // true
  z.name === "ZodError"     // true
  z.format()                 // nested error tree
  z.flatten()                // { formErrors, fieldErrors }
}` },
]

const categoryIcons: Record<string, React.ElementType> = {
  'Primitives': Code2,
  'Objects': Box,
  'Arrays': Layers,
  'Composition': Layers,
  'Modifiers': Wand2,
  'AOT Compile': Activity,
  'String Formats': FileCode,
  'Coercion': Wand2,
  'Advanced': Shield,
  'Binary': Binary,
  'Methods': Code2,
  'Codecs': Wand2,
  'Errors': Shield,
  'i18n': Globe,
  'Result Pattern': GitBranch,
  'Plugin System': Plug,
  'Event Emitter': Activity,
  'Logger': Terminal,
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
      <div className="container-wide py-8 lg:py-12">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl lg:text-4xl font-bold mb-4">API Reference</h1>
            <p className="text-lg text-muted-foreground">
              Complete API documentation for VLD. {apiMethods.length} methods across {categories.length} categories.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-xl py-4 mb-6 -mx-4 px-4 border-b border-border">
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
