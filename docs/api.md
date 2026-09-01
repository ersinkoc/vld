# VLD API Reference (v3.0.0)

Complete API documentation for the VLD validation library — Zod-compatible root and subpath APIs, V2 method-memoization, modular architecture, plugin system, CLI tools, and ZodError compatibility layer.

## Table of Contents

- [Installation](#installation)
- [Import Options](#import-options)
- [v.* vs vV2 vs z (v3.0 new)](#v-vs-vv2-vs-z-v30-new)
- [Basic Usage](#basic-usage)
- [Core Methods](#core-methods)
- [Primitive Types](#primitive-types)
- [V2 Factories (v3.0 new)](#v2-factories-v30-new)
- [String Format Validators](#string-format-validators)
- [Object Schemas](#object-schemas)
- [Array Schemas](#array-schemas)
- [Advanced Types](#advanced-types)
- [Discriminated Unions](#discriminated-unions)
- [Type Modifiers](#type-modifiers)
- [Validation Methods](#validation-methods)
- [Transformation Methods](#transformation-methods)
- [Preprocessing](#preprocessing)
- [Custom Validators](#custom-validators)
- [Codecs — Bidirectional Transformations](#codecs--bidirectional-transformations)
- [Built-in Codecs](#built-in-codecs)
- [Error Handling](#error-handling)
- [ZodError Compatibility (v3.0 new)](#zoderror-compatibility-v30-new)
- [Type Inference](#type-inference)

## Installation

```bash
npm install @oxog/vld
# or
yarn add @oxog/vld
# or
pnpm add @oxog/vld
```

**Requirements:** Node.js >= 18. Zero runtime dependencies. 100% TypeScript strict.

## Import Options

VLD v3.0 provides multiple import strategies for different needs:

### Full API (Classic) — V1 by default, V2 opt-in

```typescript
import { v, vV2, z, toZodError, setLocale } from '@oxog/vld';
setLocale('tr');
const schema = v.string().min(1); // V1 by default
const v2Schema = vV2.string().min(1); // V2 (recommended)
```

### V2 Drop-in (recommended for new code)

```typescript
import { vV2 as v } from '@oxog/vld';
// Every call below is on the V2 path (part of the 3.00x drop-in geomean)
const schema = v.object({ email: v.string().email() });
```

### Global V2 Toggle

```typescript
import { v } from '@oxog/vld';
v.setV2Mode(true);
// Now v.* returns V2 classes
v.setV2Mode(false);
```

### Tree-Shakable Mini API

```typescript
import { string, number, object, optional, array } from '@oxog/vld/mini';

const userSchema = object({
  name: string().min(1),
  age: optional(number().positive()),
  tags: array(string())
});
```

### Lazy Locale Loading

```typescript
import { setLocaleAsync, preloadLocales } from '@oxog/vld/locales';
await setLocaleAsync('tr');
await preloadLocales(['en', 'tr', 'de']);
```

### Individual Imports

```typescript
import { VldString } from '@oxog/vld/validators/string';
import { VldStringV2 } from '@oxog/vld/validators/string-v2';
import { stringToNumber } from '@oxog/vld/codecs';
import { VldError, prettifyError, toZodError, ZodLikeError } from '@oxog/vld/errors';
```

### Zod-Compatible Package Subpaths

```typescript
import { z, vV2 } from '@oxog/vld';
import * as v4 from '@oxog/vld/v4';
import * as mini from '@oxog/vld/v4-mini';
import * as miniAlias from '@oxog/vld/v4/mini';
import * as core from '@oxog/vld/v4/core';
import * as locales from '@oxog/vld/v4/locales';

const user = z.object({
  id: z.string().uuid(),
});
```

`npm run verify:zod` checks these subpaths against the installed latest stable Zod release, and `npm run verify:drop-in` compiles and runs the same TypeScript app against both packages.

## v.* vs vV2 vs z (v3.0 new)

| Surface | Returns | Use when |
|---|---|---|
| `v.*` | V1 (legacy) | Backward compatibility, reading internal VldString/VldNumber fields |
| `v.*V2()` | V2 single-class | Mixed V1/V2, granular opt-in |
| `vV2.*` | V2 (always) | New code, hot paths, 3.00x drop-in geomean |
| `v.setV2Mode(true)` | V2 globally | One-line global swap |
| `z.*` (= `v.*`) | V1 (legacy) | Drop-in for `z` import alias |
| `vV2 as z` | V2 (always) | New code, keep z.* style |

## Basic Usage

```typescript
import { v, vV2 } from '@oxog/vld';

// V1 (legacy, default)
const nameSchema = v.string();
const name = nameSchema.parse('John');

// V2 (recommended, part of the 3.00x drop-in geomean)
const nameSchemaV2 = vV2.string();
const name2 = nameSchemaV2.parse('John');
```

## Core Methods

All validators extend `VldBase<TInput, TOutput>` and provide:

- `.parse(value)` — Validates and returns value or throws
- `.safeParse(value)` — Returns `{ success, data }` or `{ success, error }`
- `.optional()` / `.nullable()` / `.nullish()` — Type modifiers
- `.refine(fn, message?)` — Custom validation
- `.transform(fn)` — Data transformation
- `.default(value)` — Fallback value
- `.catch(value)` — Error recovery
- `.pipe(schema)` — Schema pipeline (Zod 4.5 alias for `z.pipe`)
- `.isValid(value)` — Boolean check

## Primitive Types

```typescript
// V1 (default)
const str = v.string();
const num = v.number();
const bool = v.boolean();
const date = v.date();
const big = v.bigint();
const sym = v.symbol();

// V2 (recommended for new code)
const strV2 = vV2.string();
const numV2 = vV2.number();
const boolV2 = vV2.boolean();
const dateV2 = vV2.date();
const bigV2 = vV2.bigint();
const symV2 = vV2.symbol();
```

## V2 Factories (v3.0 new)

VLD 3.0 ships 21 V2 classes across 8 files. Use either `vV2.*` or `v.*V2()` interchangeably:

| V2 Factory | V1 Equivalent | Notes |
|---|---|---|
| `vV2.string()` / `v.stringV2()` | `v.string()` | String chain (15 check classes) |
| `vV2.coerce.string()` / `v.coerce.stringV2()` | `v.coerce.string()` | String coercion |
| `vV2.number()` / `v.numberV2()` | `v.number()` | Number chain (16 check classes) |
| `vV2.coerce.number()` / `v.coerce.numberV2()` | `v.coerce.number()` | Number coercion |
| `vV2.date()` / `v.dateV2()` | `v.date()` | Date chain (9 check classes) |
| `vV2.bigint()` / `v.bigintV2()` | `v.bigint()` | BigInt chain (6 check classes) |
| `vV2.array(...)` / `v.arrayV2(...)` | `v.array(...)` | Array chain |
| `vV2.union(...)` / `v.unionV2(...)` | `v.union(...)` | Union chain |
| `vV2.tuple(...)` / `v.tupleV2(...)` | `v.tuple(...)` | Tuple |
| `vV2.set(...)` / `v.setV2(...)` | `v.set(...)` | Set |
| `vV2.map(...)` / `v.mapV2(...)` | `v.map(...)` | Map |
| `vV2.intersection(...)` / `v.intersectionV2(...)` | `v.intersection(...)` | Intersection |
| `vV2.record(...)` / `v.recordV2(...)` | `v.record(...)` | Record |
| `vV2.literal(...)` / `v.literalV2(...)` | `v.literal(...)` | Literal |
| `vV2.enum(...)` / `v.enumV2(...)` | `v.enum(...)` | Enum |
| `vV2.boolean()` / `v.booleanV2()` | `v.boolean()` | Boolean |
| `vV2.any()` / `v.anyV2()` | `v.any()` | Any |
| `vV2.unknown()` / `v.unknownV2()` | `v.unknown()` | Unknown |
| `vV2.void()` / `v.voidV2()` | `v.void()` | Void |
| `vV2.never()` / `v.neverV2()` | `v.never()` | Never |
| `vV2.null()` / `v.nullV2()` | `v.null()` | Null |
| `vV2.undefined()` / `v.undefinedV2()` | `v.undefined()` | Undefined |
| `vV2.symbol()` / `v.symbolV2()` | `v.symbol()` | Symbol |
| `vV2.function()` / `v.functionV2()` | `v.function()` | Function |
| `vV2.optional(...)` / `v.optionalV2(...)` | `v.optional(...)` | Optional |
| `vV2.nullable(...)` / `v.nullableV2(...)` | `v.nullable(...)` | Nullable |
| `vV2.nullish(...)` / `v.nullishV2(...)` | `v.nullish(...)` | Nullish |
| `vV2.refine(...)` / `v.refineV2(...)` | `v.refine(...)` | Refine wrapper |
| `vV2.transform(...)` / `v.transformV2(...)` | `v.transform(...)` | Transform wrapper |
| `vV2.pipeline(...)` | `v.pipe(...)` | Zod 4.5 alias for pipe |

## String Format Validators

```typescript
const emailSchema = v.email();
const uuidSchema = v.uuid({ version: 'v4' });
const urlSchema = v.url();
const ipSchema = v.ipv4();
const dateSchema = v.iso.date();
const timeSchema = v.iso.time();
const datetimeSchema = v.iso.datetime();
const nanoidSchema = v.nanoid();
```

## Object Schemas

```typescript
const userSchema = v.object({
  name: v.string().min(1),
  email: v.string().email(),
  age: v.optional(v.number().positive())
});

const partialSchema = userSchema.partial();
const pickedSchema = userSchema.pick('name', 'email');
const omittedSchema = userSchema.omit('age');
const extendedSchema = userSchema.extend({ isActive: v.boolean() });
const mergedSchema = userSchema.merge(otherSchema);
```

## Array Schemas

```typescript
const tagsSchema = v.array(v.string()).min(1).max(10);
const numbersSchema = v.array(v.number());
const usersSchema = v.array(userSchema).nonempty();
```

## Advanced Types

```typescript
const tupleSchema = v.tuple(v.string(), v.number());
const recordSchema = v.record(v.string());
const setSchema = v.set(v.string());
const mapSchema = v.map(v.string(), v.number());
const intersectionSchema = v.intersection(schemaA, schemaB);
const literalSchema = v.literal('success');
const enumSchema = v.enum('red', 'green', 'blue');
```

## Discriminated Unions

```typescript
const eventSchema = v.discriminatedUnion('type',
  v.object({ type: v.literal('click'), x: v.number(), y: v.number() }),
  v.object({ type: v.literal('scroll'), delta: v.number() }),
  v.object({ type: v.literal('keypress'), key: v.string() })
);
```

## Type Modifiers

```typescript
v.optional(v.string());    // string | undefined
v.nullable(v.string());    // string | null
v.nullish(v.string());     // string | null | undefined
v.nonoptional(v.string()); // string (rejects undefined)
```

## Validation Methods

```typescript
v.string().min(5);
v.string().max(100);
v.string().length(10);
v.string().email();
v.string().url();
v.string().uuid({ version: 'v4' });
v.string().regex(/pattern/);
v.string().startsWith('prefix');
v.string().endsWith('suffix');
v.string().includes('substring');
v.string().trim();
v.string().toLowerCase();
v.string().toUpperCase();
v.number().int();
v.number().positive();
v.number().negative();
v.number().nonnegative();
v.number().finite();
v.number().min(0).max(100);
v.number().multipleOf(5);
v.array(v.string()).min(1).max(10);
v.array(v.string()).nonempty();
v.array(v.string()).length(5);
```

## Transformation Methods

```typescript
v.string().transform(s => s.toUpperCase());
v.number().transform(n => n * 2);
v.string().pipe(v.number()); // Zod 4.5 alias for v.pipe
v.transform(inputSchema, outputSchema, (val) => val);
```

## Preprocessing

```typescript
v.preprocess(
  (input) => typeof input === 'string' ? input.trim() : input,
  v.string()
);
```

## Custom Validators

```typescript
v.custom<number>()
  .refine(n => n > 0, 'Must be positive')
  .refine(n => n % 2 === 0, 'Must be even');

v.string().refine(
  s => s.length >= 3,
  'Must be at least 3 characters'
);
```

## Codecs — Bidirectional Transformations

VLD ships 19 built-in codecs for bidirectional data transformations:

### String Conversions
- `stringToNumber`, `stringToInt`, `stringToBigInt`
- `numberToBigInt`, `stringToBoolean`

### Date Conversions
- `isoDatetimeToDate`, `epochSecondsToDate`, `epochMillisToDate`

### JSON and Complex Data
- `jsonCodec()`, `jsonCodec(schema)`, `base64Json(schema)`, `jwtPayload(schema)`

### URLs
- `stringToURL`, `stringToHttpURL`, `uriComponent`

### Binary Data
- `base64ToBytes`, `base64urlToBytes`, `hexToBytes`, `utf8ToBytes`, `bytesToUtf8`

## Built-in Codecs

```typescript
import { stringToNumber, isoDatetimeToDate, jsonCodec } from '@oxog/vld';

const age = stringToNumber.parse('25');    // 25
const date = isoDatetimeToDate.parse('2024-01-01T00:00:00Z'); // Date

const userJsonCodec = jsonCodec(userSchema);
const user = userJsonCodec.parse('{"name":"John","age":30}');
const back = userJsonCodec.encode(user);   // '{"name":"John","age":30}'
```

## Error Handling

```typescript
import { v, prettifyError, flattenError, treeifyError } from '@oxog/vld';

const result = schema.safeParse(data);
if (!result.success) {
  console.log(result.error.message);
  console.log(prettifyError(result.error));
  const flat = flattenError(result.error);
  // { formErrors: [], fieldErrors: { 'name': [...], 'email': [...] } }
  const tree = treeifyError(result.error);
}
```

## ZodError Compatibility (v3.0 new)

```typescript
import { v, toZodError, toZodSafeResult, ZodLikeError } from '@oxog/vld';

const result = v.object({ name: v.string().min(2) }).safeParse({ name: 'J' });

if (!result.success) {
  // Convert to ZodError shape
  const zodErr = toZodError(result.error);
  // zodErr instanceof ZodLikeError
  // zodErr.name === 'ZodError'
  // zodErr.issues[0] has code, path, message, expected, received
  console.log(zodErr.format());
  console.log(zodErr.flatten());

  // Or convert the whole safe result in one call
  const zodResult = toZodSafeResult(result);
  // { success: false, error: ZodLikeError }
}
```

## Type Inference

```typescript
import { v, vV2, type Infer, type Input, type Output } from '@oxog/vld';

const userSchema = vV2.object({
  name: vV2.string(),
  age: vV2.number()
});

type User = Infer<typeof userSchema>;        // { name: string; age: number }
type UserInput = Input<typeof userSchema>;  // { name: string; age: number }
type UserOutput = Output<typeof userSchema>; // { name: string; age: number }
```
