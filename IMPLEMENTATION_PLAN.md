# VLD Feature Implementation Plan

**Date:** 2026-05-08
**Version:** 2.0.1 → 2.1.0
**Goal:** Implement missing APIs with improvements over Zod v4

---

## Priority 1: JSON Schema Support

### Feature: `toJSONSchema()` and `fromJSONSchema()`

**Zod v4 API:**
```typescript
const schema = z.object({ name: z.string(), age: z.number() });
const json = z.toJSONSchema(schema);
// => { type: "object", properties: { name: { type: "string" }, age: { type: "number" } }, required: ["name", "age"] }
const restored = z.fromJSONSchema(json);
```

**VLD Approach (Better):**
- Support `target: "draft-07" | "draft-2019-09" | "draft-2020-12"`
- Include VLD metadata in JSON Schema output
- Support `$ref` for nested schemas
- Generate `examples` from test data if available

**Implementation Location:** `src/utils/json-schema.ts`

**Technical Details:**
```typescript
interface ToJSONSchemaOptions {
  target?: "draft-07" | "draft-2019-09" | "draft-2020-12";
  includeMetadata?: boolean;
  includeExamples?: boolean;
  registry?: GlobalRegistry;
}

function toJSONSchema<T>(schema: VldBase<unknown, T>, options?: ToJSONSchemaOptions): JSONSchemaDefinition;
function fromJSONSchema(json: JSONSchemaDefinition): VldBase<unknown, unknown>;
```

**Steps:**
1. Create `JSONSchemaBuilder` class
2. Implement schema-to-JSON conversion for each validator type
3. Add `$defs` support for recursive schemas
4. Implement JSON-to-schema parsing
5. Add tests with known JSON Schema examples

---

## Priority 2: Metadata System

### Feature: `globalRegistry` and `.meta()`

**Zod v4 API:**
```typescript
const schema = z.string().meta({ title: "Name", examples: ["John"] });
const meta = schema.meta();
```

**VLD Approach (Better):**
- Schema-level metadata with TypeScript generics
- Per-instance metadata without affecting validation
- Support for OpenAPI/JSON Schema metadata (`description`, `examples`, `default`, etc.)
- Integration with `toJSONSchema()` to include metadata automatically

**Implementation Location:** `src/validators/base.ts` and `src/kernel.ts`

**Technical Details:**
```typescript
interface SchemaMetadata {
  id?: string;
  title?: string;
  description?: string;
  examples?: unknown[];
  default?: unknown;
  deprecated?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  [key: string]: unknown;
}

// Add to VldBase class
class VldBase<TInput, TOutput> {
  meta(): SchemaMetadata | undefined;
  meta(data: Partial<SchemaMetadata>): this;  // returns cloned instance
  describe(description: string): this;
}

// Global registry
interface GlobalRegistry {
  add(schema: VldBase<unknown, unknown>, meta: SchemaMetadata): void;
  get(schema: VldBase<unknown, unknown>): SchemaMetadata | undefined;
  has(schema: VldBase<unknown, unknown>): boolean;
  list(): Array<{ schema: VldBase<unknown, unknown>; meta: SchemaMetadata }>;
}

const globalRegistry: GlobalRegistry;
```

**Steps:**
1. Define `SchemaMetadata` interface
2. Add `meta()` method to `VldBase` class
3. Create `GlobalRegistry` class with WeakMap-based storage
4. Implement `describe()` as shortcut for `meta({ description })`
5. Integrate with existing `describe()` calls in validators
6. Export from `src/index.ts`

---

## Priority 3: Promise Validation

### Feature: `promise()`

**Zod v4 API:**
```typescript
const promiseSchema = z.promise(z.string());
const result = await promiseSchema.parseAsync(promiseValue);
```

**VLD Approach (Better):**
- Async validation with proper error handling
- Support for `Promise<T>` where T is any VLD schema
- `safeParseAsync()` already exists - `promise()` is syntactic sugar

**Implementation Location:** `src/validators/promise.ts`

**Technical Details:**
```typescript
class VldPromise<T> extends VldBase<Promise<T>, Promise<T>> {
  constructor(private inner: VldBase<unknown, T>) {
    super();
  }

  parse(value: unknown): Promise<T> {
    return Promise.resolve(value).then(v => this.inner.parse(v));
  }

  safeParse(value: unknown): Promise<ParseResult<Promise<T>>> {
    return Promise.resolve(this.inner.safeParse(value)).then(result => {
      if (result.success) {
        return { success: true, data: Promise.resolve(result.data) };
      }
      return { success: false, error: result.error };
    });
  }
}

function promise<T>(inner: VldBase<unknown, T>): VldPromise<T> {
  return new VldPromise(inner);
}
```

**Steps:**
1. Create `VldPromise` class extending `VldBase`
2. Implement `parseAsync()` and `safeParseAsync()` behavior
3. Export from `src/validators/index.ts`
4. Add factory method to `v` object
5. Add comprehensive tests

---

## Priority 4: Custom Check Function

### Feature: `check()`

**Zod v4 API:**
```typescript
const schema = z.string().check(val => val.includes("@"));
```

**VLD Current:** Has `.refine()` but no `.check()`

**VLD Approach:**
- Add `check()` as alias for `refine()` with better type inference
- Support for `check` method on validators (chainable)

**Implementation Location:** `src/validators/base.ts`

**Technical Details:**
```typescript
// In VldRefine class, add:
check<O>(predicate: (value: TOutput) => value is O): VldRefine<TInput, TOutput, O>;
check(predicate: (value: TOutput) => boolean): VldRefine<TInput, TOutput>;

// Add to VldBase class as alias for refine
check(
  predicate: (value: TOutput) => boolean,
  message?: string
): VldRefine<TInput, TOutput, TOutput> {
  return this.refine(predicate, message);
}
```

**Steps:**
1. Add `check()` method to `VldBase` (alias for `refine()`)
2. Ensure type inference works correctly
3. Update JSDoc to document the relationship to `refine()`
4. Tests already exist for refine - add check-specific tests

---

## Priority 5: Success Type Guard

### Feature: `success()`

**Zod v4 API:**
```typescript
const result = schema.safeParse(data);
if (result.success) {
  const validated = result.data; // already typed
}
```

**VLD Current:** Uses discriminated unions correctly already.

**VLD Approach:**
- Add `.success()` method that returns same instance but with refined types
- Actually, VLD's `safeParse` already returns correct discriminated union
- This may be redundant for VLD, but could add `.unwrap()` convenience

**Implementation Location:** `src/validators/base.ts`

**Technical Details:**
```typescript
// Add to VldBase
success(): this {
  // VLD's safeParse already gives correct types
  // This is mainly for API parity
  return this;
}

// Optional: add unwrap for result pattern
unwrap(): TOutput {
  // Only available after .catch() - for getting fallback
}
```

**Decision:** This feature is LOW priority for VLD since discriminated unions already provide correct typing.

---

## Priority 6: Exact Optional

### Feature: `exactOptional()`

**Zod v4 API:**
```typescript
const schema = z.object({
  name: z.string().exactOptional() // allows undefined but not missing
});
```

**VLD Current:** `optional()` allows undefined and missing the same.

**VLD Approach:**
- Add `exactOptional()` method that requires key presence but allows `undefined`
- Different from `optional()` which treats missing as `undefined`

**Implementation Location:** `src/validators/optional.ts`

**Technical Details:**
```typescript
class VldExactOptional<TInput, TOutput> extends VldBase<TInput | undefined, TOutput | undefined> {
  constructor(private inner: VldBase<TInput, TOutput>) {
    super();
  }

  parse(value: unknown): TOutput | undefined {
    if (value === undefined) {
      return undefined;
    }
    return this.inner.parse(value);
  }

  safeParse(value: unknown): ParseResult<TOutput | undefined> {
    // Unlike regular optional, undefined is valid
    return this.inner.safeParse(value);
  }
}

exactOptional(): VldExactOptional<TInput, TOutput> {
  return new VldExactOptional(this);
}
```

**Steps:**
1. Create `VldExactOptional` class
2. Add `exactOptional()` method to `VldBase`
3. Add tests for exact optional behavior
4. Export from validators

---

## Priority 7: Specific Integer Ranges

### Feature: `uint32()`, `uint64()`, `int32()`, `int64()`

**Zod v4 API:**
```typescript
z.uint32(); // 0 to 4294967295
z.uint64(); // 0 to 18446744073709551615
z.int32(); // -2147483648 to 2147483647
z.int64(); // BigInt range
```

**VLD Current:** Has `int()` but not specific range validators.

**Implementation Location:** `src/validators/number.ts`

**Technical Details:**
```typescript
// Add to VldNumber class
uint32(): this {
  return this.int().min(0).max(4294967295);
}

uint64(): this {
  return this.int().min(0).max(18446744073709551615n);
}

int32(): this {
  return this.int().min(-2147483648).max(2147483647);
}

int64(): this {
  return this.int().min(-9223372036854775808n).max(9223372036854775807n);
}

// Also add float32 and float64
float32(): this {
  return this.float().min(-3.4e38).max(3.4e38);
}

float64(): this {
  return this.float().min(-1.8e308).max(1.8e308);
}
```

**Steps:**
1. Add range methods to `VldNumber` class
2. Add `float()` method if not exists
3. Add tests for each range
4. Export from validators

---

## Priority 8: Additional String Formats

### Feature: `xid()`, `guid()`, `httpUrl()`

**Zod v4 API:**
```typescript
z.xid();    // XID unique ID
z.guid();   // GUID/UUID variant
z.httpUrl(); // HTTP/HTTPS URL
```

**VLD Current:** Has `uuid()`, `url()`, `ipv4()`, `ipv6()`, but missing these.

**Implementation Location:** `src/validators/string-formats.ts`

**Technical Details:**
```typescript
// XID - ksort's XID
const XID_REGEX = /^[A-Za-z0-9]{20}$/; // 20 char base62

// GUID - RFC 4122 format
const GUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

// httpUrl - like url() but enforces http/https
const HTTPURL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/;
```

**Steps:**
1. Add regex patterns for xid, guid, httpUrl
2. Add validator functions
3. Add to `v` object in index.ts
4. Add tests
5. Update exports

---

## Implementation Order

| # | Feature | Estimated Time | Dependencies |
|---|---------|---------------|--------------|
| 1 | Metadata + GlobalRegistry | 2-3 hours | None |
| 2 | toJSONSchema / fromJSONSchema | 4-5 hours | Metadata |
| 3 | promise() | 1 hour | None |
| 4 | check() | 30 min | None |
| 5 | exactOptional() | 1 hour | None |
| 6 | uint32/uint64/int32/int64/float32/float64 | 1 hour | None |
| 7 | xid/guid/httpUrl | 1 hour | None |

**Total Estimated Time:** 10-12 hours

---

## Code Organization

```
src/
├── validators/
│   ├── base.ts          # Add meta(), describe(), check(), exactOptional()
│   ├── optional.ts      # Add VldExactOptional
│   ├── promise.ts       # Add VldPromise (new file)
│   └── number.ts        # Add uint32/uint64/int32/int64/float32/float64
├── validators/string-formats.ts  # Add xid, guid, httpUrl
├── utils/
│   └── json-schema.ts   # Add toJSONSchema, fromJSONSchema (new file)
└── index.ts             # Update exports
```

---

## Testing Strategy

For each feature:
1. Unit tests with edge cases
2. Type inference tests
3. Integration tests with other validators
4. JSON Schema round-trip tests (where applicable)

---

## Breaking Changes

None required. All additions are additive.

---

## Backward Compatibility

All new features are opt-in. Existing code continues to work.
