# VLD Advanced Features (v3.0.0)

Deep dive into VLD's advanced features: V2 method-memoization, ZodError compatibility, type coercion, custom validation, data transformation, preprocessing, complex types, and more.

## Table of Contents

- [V2 Method-Memoization (v3.0 new)](#v2-method-memoization-v30-new)
- [ZodError Compatibility (v3.0 new)](#zoderror-compatibility-v30-new)
- [Type Coercion](#type-coercion)
- [Custom Validation](#custom-validation)
- [Data Transformation](#data-transformation)
- [Preprocessing](#preprocessing)
- [Complex Types](#complex-types)
- [Discriminated Unions](#discriminated-unions)
- [String Format Validators](#string-format-validators)
- [File and Function Validation](#file-and-function-validation)
- [Error Handling](#error-handling)
- [Internationalization](#internationalization)
- [Advanced Patterns](#advanced-patterns)

## V2 Method-Memoization (v3.0 new)

VLD 3.0 ships the V2 method-memoization pattern across every chain-heavy validator. The pattern matches Zod 4.5's "method memoization" optimization but ships strictly better numbers across the board.

### Three ways to use V2

**1. vV2 drop-in factory (recommended for new code)**
```typescript
import { vV2 } from '@oxog/vld';
const schema = vV2.string().min(1).email();
```

**2. v.setV2Mode(true) — global toggle (no source rewrites)**
```typescript
import { v } from '@oxog/vld';
v.setV2Mode(true);
const schema = v.string().min(1).email(); // Now V2
v.setV2Mode(false);
```

**3. z = vV2 — keep the z.* style**
```typescript
import { vV2 as z } from '@oxog/vld';
const schema = z.object({ email: z.string().email() });
```

### Performance headline

| Schema | v.* (V1) | vV2 | Zod 4.5 | V2 vs Zod |
|---|---:|---:|---:|---:|
| `string().min(1).email()` | 22ms | **22ms** | 50ms | 2.3x faster |
| `number().int().positive().min(1)` | 12ms | **6ms** | 39ms | **6.5x faster** |
| Realistic API (10 fields) | 276ms | **243ms** | 767ms | **3.2x faster** |

*1M `safeParse` ops, pre-built schemas, Node v24.13.0.*

### V2 design principles

1. **Single-def + check classes**: `__def` is a frozen object built once per chain; checks are class instances, not config blobs
2. **Check classes return `Issue | null`**: No per-call `{value, issues}` payload allocation
3. **`isSimple` precomputed in `__def`**: Hot path checks a boolean field, not two array length reads
4. **Lazy stack capture**: `VLD_CAPTURE_STACK=true` opt-in for debug stack traces (default off)
5. **Composites stay V1**: V2 wrapper would have 2+10=12 own properties — worse than legacy

## ZodError Compatibility (v3.0 new)

```typescript
import { v, toZodError, toZodSafeResult, ZodLikeError } from '@oxog/vld';

const result = v.object({ name: v.string().min(2) }).safeParse({ name: 'J' });

if (!result.success) {
  const zodErr = toZodError(result.error);

  // ZodError shape
  console.log(zodErr.name);          // 'ZodError'
  console.log(zodErr.issues[0].code); // 'too_small'
  console.log(zodErr.issues[0].path); // ['name']

  // Zod 4.5 .format() and .flatten()
  console.log(zodErr.format());       // Nested tree
  console.log(zodErr.flatten());      // { formErrors, fieldErrors }

  // instanceof check
  console.log(zodErr instanceof ZodLikeError); // true
}

// One-liner safe result conversion
const zodResult = toZodSafeResult(result);
// { success: false, error: ZodLikeError }
```

## Type Coercion

VLD provides intelligent type coercion that automatically converts input values to the expected type when possible.

### String Coercion

```typescript
const schema = v.coerce.string();

schema.parse(123);        // '123'
schema.parse(45.67);      // '45.67'
schema.parse(0);          // '0'
schema.parse(true);       // 'true'
schema.parse(false);      // 'false'
schema.parse([1, 2, 3]);  // '1,2,3'

// V2 path
const v2Schema = vV2.coerce.string();
v2Schema.parse(123); // '123' (2-6x faster)
```

### Number Coercion

```typescript
const schema = v.coerce.number();

schema.parse('42');       // 42
schema.parse('3.14');     // 3.14
schema.parse('  10  ');   // 10 (trims whitespace)
schema.parse(true);       // 1
schema.parse(false);      // 0

// V2 path
const v2Schema = vV2.coerce.number();
```

### Boolean Coercion

```typescript
const schema = v.coerce.boolean();

schema.parse('true');     // true
schema.parse('false');    // false
schema.parse('yes');      // true
schema.parse('no');       // false
schema.parse('1');        // true
schema.parse('0');        // false
schema.parse(1);          // true
schema.parse(0);          // false
```

### Date Coercion

```typescript
const schema = v.coerce.date();

schema.parse('2024-01-15');           // Date
schema.parse('Jan 15, 2024');         // Date
schema.parse('2024-01-15T10:30:00Z'); // Date
schema.parse(1704067200000);          // Date
```

## Custom Validation

```typescript
// V1 (default)
const positiveNumber = v.number()
  .refine(n => n > 0, 'Number must be positive');

// V2 (recommended for hot paths)
const positiveNumberV2 = vV2.number()
  .refine(n => n > 0, 'Number must be positive');

// Multiple refines chain
const passwordSchema = vV2.string()
  .min(8, 'Password too short')
  .refine(pwd => /[A-Z]/.test(pwd), 'Must contain uppercase letter')
  .refine(pwd => /[0-9]/.test(pwd), 'Must contain number')
  .refine(pwd => /[!@#$%^&*]/.test(pwd), 'Must contain special character');

// SuperRefine for context-aware validation
vV2.string().superRefine((val, ctx) => {
  if (val.length < 3) {
    ctx.addIssue({ code: 'too_small', minimum: 3, type: 'string' });
  }
});
```

## Data Transformation

```typescript
// V1 (default)
const upper = v.string().transform(s => s.toUpperCase());

// V2 (recommended)
const upperV2 = vV2.string().transform(s => s.toUpperCase());

// Object transform
const userTransformSchema = v.object({
  firstName: v.string(),
  lastName: v.string()
}).transform(user => ({
  ...user,
  fullName: `${user.firstName} ${user.lastName}`
}));

// Chain transforms
const emailNormalization = vV2.string()
  .transform(email => email.toLowerCase().trim())
  .refine(email => email.includes('@'), 'Invalid email format')
  .transform(email => email.replace(/\+.*@/, '@'));
```

## Preprocessing

```typescript
// Preprocess then validate
const trimmedEmail = v.preprocess(
  (input) => typeof input === 'string' ? input.trim().toLowerCase() : input,
  v.string().email()
);

trimmedEmail.parse('  JOHN@EXAMPLE.COM  '); // 'john@example.com'

// V2 path
const trimmedEmailV2 = vV2.preprocess(
  (input) => typeof input === 'string' ? input.trim().toLowerCase() : input,
  vV2.string().email()
);
```

## Complex Types

### Tuple

```typescript
const coordSchema = v.tuple(v.number(), v.number());
coordSchema.parse([40.7128, -74.0060]); // [40.7128, -74.0060]

// Rest tuple
const restTuple = v.tuple(v.string(), v.number()).rest(v.boolean());
restTuple.parse(['hi', 1, true, false, true]); // ['hi', 1, true, false, true]
```

### Record

```typescript
const configSchema = v.record(v.string());
configSchema.parse({ a: '1', b: '2', c: '3' });

// With specific key type
const numericKeys = v.record(v.number());
// Keys are transformed/validated too
```

### Set

```typescript
const tagSchema = v.set(v.string());
tagSchema.parse(new Set(['javascript', 'typescript']));

// With size constraints
const boundedSet = v.set(v.string()).min(1).max(5);
```

### Map

```typescript
const mapSchema = v.map(v.string(), v.number());
const m = new Map([['a', 1], ['b', 2]]);
mapSchema.parse(m);
```

### Intersection

```typescript
const baseUser = v.object({ id: v.string(), name: v.string() });
const adminUser = v.object({ role: v.literal('admin'), permissions: v.array(v.string()) });
const adminSchema = v.intersection(baseUser, adminUser);
```

## Discriminated Unions

```typescript
const eventSchema = v.discriminatedUnion('type',
  v.object({ type: v.literal('click'), x: v.number(), y: v.number() }),
  v.object({ type: v.literal('scroll'), delta: v.number() }),
  v.object({ type: v.literal('keypress'), key: v.string() })
);

const event = eventSchema.parse(data);
// TypeScript narrows the type based on 'type' field
if (event.type === 'click') {
  console.log(event.x, event.y);
}
```

## String Format Validators

```typescript
const emailSchema = v.email();
const uuidSchema = v.uuid({ version: 'v4' });
const urlSchema = v.url();
const ipSchema = v.ipv4();
const ipv6Schema = v.ipv6();
const cidrv4Schema = v.cidrv4();
const cidrv6Schema = v.cidrv6();
const base64Schema = v.base64();
const nanoidSchema = v.nanoid();
const ulidSchema = v.ulid();
const cuidSchema = v.cuid();
const cuid2Schema = v.cuid2();
const isoDateSchema = v.iso.date();
const isoTimeSchema = v.iso.time();
const isoDatetimeSchema = v.iso.datetime();
const isoDurationSchema = v.iso.duration();
const e164Schema = v.e164();
const emojiSchema = v.emoji();
```

## File and Function Validation

### File Validation

```typescript
const imageSchema = v.file()
  .mime('image/png', 'image/jpeg')
  .max(5_000_000); // 5 MB

imageSchema.parse(new File([blob], 'photo.png', { type: 'image/png' }));
```

### Function Validation

```typescript
const adderSchema = v.function()
  .args(v.number(), v.number())
  .returns(v.number());

const adder = adderSchema.parse((a, b) => a + b);
adder(1, 2); // 3
```

## Error Handling

```typescript
import { v, prettifyError, flattenError, treeifyError, toZodError } from '@oxog/vld';

const result = schema.safeParse(data);

if (!result.success) {
  // Pretty console output
  console.log(prettifyError(result.error));

  // Flat for forms
  const flat = flattenError(result.error);

  // Tree for complex UIs
  const tree = treeifyError(result.error);

  // ZodError shape (v3.0 new)
  const zodErr = toZodError(result.error);
  console.log(zodErr.format());
  console.log(zodErr.flatten());
}
```

## Internationalization

```typescript
import { v, setLocale, setLocaleAsync, getLocale } from '@oxog/vld';

setLocale('tr');
const r = v.string().min(5).safeParse('hi');
if (!r.success) console.log(r.error.message); // 'Metin en az 5 karakter olmalı'

// Lazy load
await setLocaleAsync('ja');

// Per-parse locale override
v.parse(data, { locale: 'fr' });
```

VLD supports 27+ languages. See `examples/internationalization.js` for the full list.

## Advanced Patterns

### Schema Composition

```typescript
const timestampMixin = v.object({
  createdAt: v.date().default(() => new Date()),
  updatedAt: v.date().default(() => new Date())
});

const auditMixin = v.object({
  createdBy: v.string(),
  updatedBy: v.string().optional()
});

const auditableSchema = v.intersection(
  v.intersection(userSchema, timestampMixin),
  auditMixin
);
```

### Lazy Schemas (recursive types)

```typescript
type Category = { name: string; subcategories: Category[] };

const categorySchema: v.ZodType<Category> = v.lazy(() =>
  v.object({
    name: v.string(),
    subcategories: v.array(categorySchema)
  })
);
```

### Brand Types

```typescript
const userIdSchema = v.string().uuid().brand<'UserId'>();
type UserId = v.Infer<typeof userIdSchema>;
```

### Plugin System

```typescript
import { v, plugin } from '@oxog/vld';

const slugPlugin = plugin({
  name: 'slug',
  apply: (validator) => {
    return validator.refine(s => /^[a-z0-9-]+$/.test(s), 'Must be a slug');
  }
});

const slugSchema = slugPlugin.apply(v.string());
slugSchema.parse('hello-world'); // OK
slugSchema.parse('Hello World'); // throws 'Must be a slug'
```

### Event System

```typescript
import { v, onParseStart, onParseEnd } from '@oxog/vld';

onParseStart((event) => {
  console.log('Validating:', event.schema, event.input);
});

onParseEnd((event) => {
  console.log('Result:', event.success, event.data ?? event.error);
});
```

### CLI Tools

```bash
# Validate a JSON file
npx vld validate --schema ./schema.ts ./data.json

# Benchmark
npx vld bench ./schema.ts

# Generate TypeScript types from a schema
npx vld types ./schema.ts > types.d.ts
```

See [API Reference](./api.md) for complete documentation of all features.
