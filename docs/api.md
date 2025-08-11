# API Reference

## Core API

### v

The main entry point for creating validators.

```typescript
import { v } from '@oxog/vld';
```

## Primitive Types

### v.string()

```typescript
v.string()
  .min(length: number, message?: string)
  .max(length: number, message?: string)
  .length(length: number, message?: string)
  .email(message?: string)
  .url(message?: string)
  .uuid(message?: string)
  .regex(pattern: RegExp, message?: string)
  .startsWith(str: string, message?: string)
  .endsWith(str: string, message?: string)
  .includes(str: string, message?: string)
  .ip(message?: string)
  .ipv4(message?: string)
  .ipv6(message?: string)
  .trim()
  .toLowerCase()
  .toUpperCase()
  .nonempty(message?: string)
```

### v.number()

```typescript
v.number()
  .min(value: number, message?: string)
  .max(value: number, message?: string)
  .int(message?: string)
  .positive(message?: string)
  .negative(message?: string)
  .nonnegative(message?: string)
  .nonpositive(message?: string)
  .finite(message?: string)
  .safe(message?: string)
  .multipleOf(value: number, message?: string)
  .step(value: number, message?: string)
```

### v.boolean()

```typescript
v.boolean()
```

### v.date()

```typescript
v.date()
  .min(date: Date, message?: string)
  .max(date: Date, message?: string)
```

## Complex Types

### v.object()

```typescript
v.object({
  key: validator
})
  .partial()  // Makes all properties optional
  .strict()   // No extra properties allowed
```

### v.array()

```typescript
v.array(itemValidator)
  .min(length: number, message?: string)
  .max(length: number, message?: string)
  .length(length: number, message?: string)
  .nonempty(message?: string)
```

### v.union()

```typescript
v.union(validator1, validator2, ...)
```

### v.literal()

```typescript
v.literal(value)
```

### v.enum()

```typescript
v.enum(value1, value2, ...)
```

## Modifiers

### v.optional()

```typescript
v.optional(validator)  // T | undefined
```

### v.nullable()

```typescript
v.nullable(validator)  // T | null
```

## Special Types

### v.any()

Accepts any value.

```typescript
v.any()
```

### v.unknown()

Accepts any value (same as any, but semantically different).

```typescript
v.unknown()
```

### v.void()

Only accepts undefined.

```typescript
v.void()
```

### v.never()

Never accepts any value.

```typescript
v.never()
```

## Validation Methods

### parse()

Validates and returns the data. Throws on validation error.

```typescript
const data = schema.parse(input);
```

### safeParse()

Returns a result object. Never throws.

```typescript
const result = schema.safeParse(input);
if (result.success) {
  console.log(result.data);
} else {
  console.log(result.error);
}
```

## Type Inference

### Infer

Extract the TypeScript type from a schema.

```typescript
import { Infer } from '@oxog/vld';

const schema = v.object({
  name: v.string(),
  age: v.number()
});

type Data = Infer<typeof schema>;
// { name: string; age: number }
```

## Custom Error Messages

All validators accept an optional custom error message:

```typescript
v.string().min(8, 'Password must be at least 8 characters')
v.number().positive('Age must be positive')
```

## Chaining

All validators return a new instance, allowing for method chaining:

```typescript
const schema = v.string()
  .min(5)
  .max(100)
  .email()
  .trim()
  .toLowerCase();
```