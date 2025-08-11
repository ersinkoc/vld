# Migration Guide

## Migrating from Zod

VLD's API is designed to be familiar to Zod users. Here's how to migrate:

### Basic Types

```typescript
// Zod
import { z } from 'zod';
const schema = z.string();

// VLD
import { v } from '@oxog/vld';
const schema = v.string();
```

### Objects

```typescript
// Zod
const userSchema = z.object({
  name: z.string(),
  age: z.number()
});

// VLD
const userSchema = v.object({
  name: v.string(),
  age: v.number()
});
```

### Arrays

```typescript
// Zod
const schema = z.array(z.string());

// VLD
const schema = v.array(v.string());
```

### Unions

```typescript
// Zod
const schema = z.union([z.string(), z.number()]);

// VLD
const schema = v.union(v.string(), v.number());
```

### Optional and Nullable

```typescript
// Zod
z.string().optional()  // string | undefined
z.string().nullable()  // string | null
z.string().nullish()   // string | null | undefined

// VLD
v.optional(v.string())  // string | undefined
v.nullable(v.string())  // string | null
v.optional(v.nullable(v.string()))  // string | null | undefined
```

### Type Inference

```typescript
// Zod
type User = z.infer<typeof userSchema>;

// VLD
type User = Infer<typeof userSchema>;
```

### Validation Methods

```typescript
// Zod
schema.parse(data);       // Throws on error
schema.safeParse(data);   // Returns result object

// VLD (same)
schema.parse(data);       // Throws on error
schema.safeParse(data);   // Returns result object
```

### String Validations

```typescript
// Zod
z.string()
  .min(5)
  .max(10)
  .email()
  .url()
  .uuid()
  .regex(/pattern/)
  .startsWith('prefix')
  .endsWith('suffix')

// VLD (same)
v.string()
  .min(5)
  .max(10)
  .email()
  .url()
  .uuid()
  .regex(/pattern/)
  .startsWith('prefix')
  .endsWith('suffix')
```

### Number Validations

```typescript
// Zod
z.number()
  .int()
  .positive()
  .negative()
  .nonnegative()
  .nonpositive()
  .finite()
  .safe()

// VLD (same)
v.number()
  .int()
  .positive()
  .negative()
  .nonnegative()
  .nonpositive()
  .finite()
  .safe()
```

### Transforms

```typescript
// Zod
z.string().transform(val => val.toUpperCase())

// VLD
v.string().toUpperCase()  // Built-in transforms
v.string().toLowerCase()
v.string().trim()
```

### Custom Error Messages

```typescript
// Zod
z.string().min(8, { message: "Too short" })

// VLD
v.string().min(8, "Too short")
```

## Key Differences

### 1. Performance
VLD is 2-3x faster than Zod in most benchmarks, especially when creating new instances.

### 2. Bundle Size
VLD has zero dependencies and a smaller bundle size.

### 3. API Simplicity
VLD has a simpler API with fewer methods but covers all common use cases.

### 4. Optional/Nullable
VLD uses wrapper functions instead of methods:
- `v.optional(schema)` instead of `schema.optional()`
- `v.nullable(schema)` instead of `schema.nullable()`

### 5. Transforms
VLD has built-in transform methods for common operations (trim, toLowerCase, toUpperCase).

## Migration Script

Here's a simple regex-based migration helper:

```javascript
// Basic replacements for common patterns
const migrations = [
  [/import \{ z \} from ['"]zod['"]/g, "import { v } from '@oxog/vld'"],
  [/z\./g, "v."],
  [/z\.infer/g, "Infer"],
  [/\.optional\(\)/g, ""],  // Need manual wrapping with v.optional()
  [/\.nullable\(\)/g, ""],  // Need manual wrapping with v.nullable()
];

// Note: Optional and nullable need manual conversion:
// Before: z.string().optional()
// After:  v.optional(v.string())
```

## Getting Help

If you encounter any issues during migration:

1. Check the [API Reference](./api.md)
2. Look at the [Examples](../examples/)
3. Open an issue on [GitHub](https://github.com/ersinkoc/vld)