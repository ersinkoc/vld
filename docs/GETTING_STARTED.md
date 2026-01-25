# Getting Started with VLD

A comprehensive guide to get you up and running with VLD (v2.0), the blazing-fast TypeScript validation library with full Zod 4 API parity, modular architecture, plugin system, and CLI tools.

## Table of Contents

- [Installation](#installation)
- [Basic Concepts](#basic-concepts)
- [Your First Schema](#your-first-schema)
- [Common Patterns](#common-patterns)
- [Error Handling](#error-handling)
- [TypeScript Integration](#typescript-integration)
- [Best Practices](#best-practices)
- [Next Steps](#next-steps)

## Installation

Install VLD using your preferred package manager:

```bash
# npm
npm install @oxog/vld

# yarn
yarn add @oxog/vld

# pnpm
pnpm add @oxog/vld
```

## Basic Concepts

VLD provides a simple, chainable API for building validation schemas. The core concept is creating validators that can parse, validate, and transform data.

### Core Principles

1. **Type-First**: Every validator is fully typed in TypeScript
2. **Composable**: Build complex schemas from simple primitives
3. **Performant**: Optimized for speed with zero dependencies
4. **Developer-Friendly**: Clear error messages and intuitive API

## Import Options

VLD v2.0 provides multiple import options for different needs:

### Full API (Classic)
```typescript
import { v } from '@oxog/vld';
const schema = v.string().min(1);
```

### Tree-Shakable Mini API (NEW in v2.0)
```typescript
import { string, number, object, optional } from '@oxog/vld/mini';
const schema = object({
  name: string().min(1),
  age: optional(number()),
});
```

### Lazy Locale Loading (NEW in v2.0)
```typescript
import { setLocaleAsync } from '@oxog/vld/locales';
await setLocaleAsync('tr'); // Loads Turkish on demand
```

## Your First Schema

Let's start with a simple example:

```typescript
import { v } from '@oxog/vld';

// Create a simple string validator
const nameSchema = v.string();

// Parse data
const name = nameSchema.parse("John"); // "John"

// This will throw an error
// nameSchema.parse(123); // Error: Invalid string
```

### Safe Parsing

Use `safeParse` to handle errors without throwing:

```typescript
const result = nameSchema.safeParse("John");

if (result.success) {
  console.log("Valid name:", result.data);
} else {
  console.log("Validation error:", result.error.message);
}
```

## Common Patterns

### User Registration Form

```typescript
const userRegistrationSchema = v.object({
  username: v.string().min(3).max(20),
  email: v.string().email(),
  password: v.string().min(8),
  confirmPassword: v.string(),
  age: v.number().min(13).max(120),
  acceptTerms: v.boolean()
}).refine(
  data => data.password === data.confirmPassword,
  "Passwords don't match"
);

// Usage
const formData = {
  username: "johndoe",
  email: "john@example.com",
  password: "SecurePass123",
  confirmPassword: "SecurePass123",
  age: 25,
  acceptTerms: true
};

const result = userRegistrationSchema.safeParse(formData);
if (result.success) {
  // Register user
  console.log("User registered:", result.data);
}
```

### API Request Validation

```typescript
const apiRequestSchema = v.object({
  method: v.enum("GET", "POST", "PUT", "DELETE"),
  endpoint: v.string().startsWith("/api/"),
  headers: v.record(v.string()).optional(),
  body: v.unknown().optional(),
  queryParams: v.record(v.string()).optional()
});

// Validate incoming request
function handleRequest(request: unknown) {
  const validated = apiRequestSchema.safeParse(request);
  
  if (!validated.success) {
    return { error: "Invalid request format" };
  }
  
  // Process valid request
  return processApiCall(validated.data);
}
```

### Configuration Schema

```typescript
const configSchema = v.object({
  server: v.object({
    host: v.string().default("localhost"),
    port: v.number().positive().default(3000),
    ssl: v.boolean().default(false)
  }),
  database: v.object({
    url: v.string().url(),
    maxConnections: v.number().positive().default(10),
    timeout: v.number().positive().default(5000)
  }),
  features: v.object({
    authentication: v.boolean().default(true),
    rateLimit: v.boolean().default(true),
    logging: v.enum("none", "error", "warn", "info", "debug").default("info")
  })
});

// Parse config with defaults
const config = configSchema.parse({
  database: {
    url: "postgresql://localhost:5432/mydb"
  }
});
// Result includes all defaults for missing fields
```

### Data Transformation

```typescript
const userInputSchema = v.object({
  name: v.string()
    .transform(s => s.trim())
    .transform(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()),
  email: v.string()
    .transform(s => s.toLowerCase().trim())
    .email(),
  tags: v.string()
    .transform(s => s.split(',').map(tag => tag.trim()))
    .transform(tags => tags.filter(tag => tag.length > 0))
});

const input = {
  name: "  JOHN DOE  ",
  email: "  JOHN@EXAMPLE.COM  ",
  tags: "javascript, typescript, , validation"
};

const result = userInputSchema.parse(input);
// Result: {
//   name: "John doe",
//   email: "john@example.com",
//   tags: ["javascript", "typescript", "validation"]
// }
```

## Error Handling

VLD provides multiple ways to handle and format errors:

### Basic Error Handling

```typescript
const schema = v.object({
  name: v.string().min(2),
  age: v.number().positive()
});

const result = schema.safeParse({ name: "J", age: -5 });

if (!result.success) {
  console.log(result.error.message);
  // "String must be at least 2 characters"
}
```

### Formatted Errors

```typescript
import { prettifyError, flattenError } from '@oxog/vld';

const schema = v.object({
  user: v.object({
    name: v.string().min(2),
    email: v.string().email()
  }),
  settings: v.object({
    theme: v.enum("light", "dark"),
    notifications: v.boolean()
  })
});

const result = schema.safeParse({
  user: { name: "J", email: "invalid" },
  settings: { theme: "blue", notifications: "yes" }
});

if (!result.success) {
  // Pretty format for console
  console.log(prettifyError(result.error));
  // ✖ String must be at least 2 characters
  //   → at user.name
  // ✖ Invalid email format
  //   → at user.email
  // ✖ Invalid enum value
  //   → at settings.theme
  
  // Flat format for forms
  const flat = flattenError(result.error);
  // {
  //   fieldErrors: {
  //     "user.name": ["String must be at least 2 characters"],
  //     "user.email": ["Invalid email format"],
  //     "settings.theme": ["Invalid enum value"]
  //   }
  // }
}
```

## TypeScript Integration

### Type Inference

```typescript
import { v, Infer } from '@oxog/vld';

const productSchema = v.object({
  id: v.string().uuid(),
  name: v.string(),
  price: v.number().positive(),
  inStock: v.boolean(),
  categories: v.array(v.string()),
  metadata: v.record(v.any()).optional()
});

// Automatically infer the TypeScript type
type Product = Infer<typeof productSchema>;

// Use the inferred type
function processProduct(product: Product) {
  // TypeScript knows all properties
  console.log(product.name, product.price);
}

// Validate and get typed result
const rawData: unknown = fetchProductData();
const product = productSchema.parse(rawData);
// 'product' is now typed as Product
```

### Type Guards

```typescript
const isValidProduct = (data: unknown): data is Product => {
  return productSchema.isValid(data);
};

// Usage
if (isValidProduct(someData)) {
  // TypeScript knows someData is a Product here
  console.log(someData.price);
}
```

## Best Practices

### 1. Reuse Schemas

```typescript
// Define reusable schemas
const emailSchema = v.string().email();
const passwordSchema = v.string().min(8);
const idSchema = v.string().uuid();

// Compose them in larger schemas
const loginSchema = v.object({
  email: emailSchema,
  password: passwordSchema
});

const userSchema = v.object({
  id: idSchema,
  email: emailSchema,
  password: passwordSchema,
  createdAt: v.date()
});
```

### 2. Use Descriptive Error Messages

```typescript
const ageSchema = v.number()
  .min(18, "You must be at least 18 years old")
  .max(120, "Please enter a valid age");

const passwordSchema = v.string()
  .min(8, "Password must be at least 8 characters")
  .refine(
    pwd => /[A-Z]/.test(pwd),
    "Password must contain at least one uppercase letter"
  );
```

### 3. Validate at Boundaries

```typescript
// Validate API inputs
app.post('/api/users', (req, res) => {
  const result = userSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  // Process valid data
  createUser(result.data);
});

// Validate environment variables
const envSchema = v.object({
  NODE_ENV: v.enum("development", "production", "test"),
  PORT: v.coerce.number().positive(),
  DATABASE_URL: v.string().url()
});

const env = envSchema.parse(process.env);
```

### 4. Use Coercion for User Input

```typescript
// Coerce form data which often comes as strings
const formSchema = v.object({
  age: v.coerce.number(),
  acceptTerms: v.coerce.boolean(),
  startDate: v.coerce.date()
});

// Handles string inputs automatically
formSchema.parse({
  age: "25",           // Coerced to 25
  acceptTerms: "true", // Coerced to true
  startDate: "2024-01-01" // Coerced to Date object
});
```

### 5. Use String Format Validators

```typescript
// Standalone format validators for common patterns
const emailSchema = v.email();
const uuidSchema = v.uuid();
const ipSchema = v.ipv4();

// ISO format validators
const dateSchema = v.iso.date();
const timeSchema = v.iso.time();

// Combine with other validations
const userIdSchema = v.uuid({ version: 'v4' });
```

### 6. Use Discriminated Unions for Type Safety

```typescript
// Efficient validation with discriminator key
const eventSchema = v.discriminatedUnion('type',
  v.object({ type: v.literal('click'), x: v.number(), y: v.number() }),
  v.object({ type: v.literal('scroll'), delta: v.number() }),
  v.object({ type: v.literal('keypress'), key: v.string() })
);

// TypeScript narrows the type based on 'type' field
const event = eventSchema.parse(data);
if (event.type === 'click') {
  console.log(event.x, event.y); // TypeScript knows x and y exist
}
```

## Next Steps

Now that you understand the basics, explore these advanced topics:

1. **[API Reference](./API.md)** - Complete API documentation
2. **[Advanced Features](./ADVANCED_FEATURES.md)** - Transformations, refinements, and more
3. **[Migration Guide](./MIGRATION.md)** - Migrating from Zod to VLD
4. **[Performance Guide](./PERFORMANCE.md)** - Optimization tips and benchmarks

## Examples Repository

Check out our [examples directory](../examples) for more real-world use cases:

- Form validation
- API endpoint validation
- Configuration management
- Data transformation pipelines
- TypeScript integration patterns

---

Happy validating! 🚀