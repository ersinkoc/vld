# VLD Advanced Features

Deep dive into VLD's advanced features and capabilities for complex validation scenarios.

## Table of Contents

- [Type Coercion](#type-coercion)
- [Custom Validation](#custom-validation)
- [Data Transformation](#data-transformation)
- [Complex Types](#complex-types)
- [Error Handling](#error-handling)
- [Internationalization](#internationalization)
- [Advanced Patterns](#advanced-patterns)

## Type Coercion

VLD provides intelligent type coercion that automatically converts input values to the expected type when possible.

### String Coercion

```typescript
const schema = v.coerce.string();

// Number to string
schema.parse(123);        // "123"
schema.parse(45.67);      // "45.67"
schema.parse(0);          // "0"

// Boolean to string
schema.parse(true);       // "true"
schema.parse(false);      // "false"

// Arrays and objects
schema.parse([1, 2, 3]);  // "1,2,3"
schema.parse({});         // "[object Object]"

// Special values
schema.parse(null);       // Error: Cannot coerce null
schema.parse(undefined);  // Error: Cannot coerce undefined
```

### Number Coercion

```typescript
const schema = v.coerce.number();

// String to number
schema.parse("42");       // 42
schema.parse("3.14");     // 3.14
schema.parse("  10  ");   // 10 (trims whitespace)

// Boolean to number
schema.parse(true);       // 1
schema.parse(false);      // 0

// Invalid strings
schema.parse("abc");      // Error: Cannot coerce to number
schema.parse("");         // Error: Cannot coerce to number
```

### Boolean Coercion

```typescript
const schema = v.coerce.boolean();

// String to boolean
schema.parse("true");     // true
schema.parse("false");    // false
schema.parse("yes");      // true
schema.parse("no");       // false
schema.parse("1");        // true
schema.parse("0");        // false

// Number to boolean
schema.parse(1);          // true
schema.parse(0);          // false
schema.parse(2);          // Error: Cannot coerce 2 to boolean
```

### Date Coercion

```typescript
const schema = v.coerce.date();

// String to date
schema.parse("2024-01-15");           // Date object
schema.parse("Jan 15, 2024");         // Date object
schema.parse("2024-01-15T10:30:00Z"); // Date object

// Number to date (timestamp)
schema.parse(1704067200000);          // Date object
schema.parse(Date.now());             // Date object

// Invalid dates
schema.parse("invalid");              // Error: Invalid date
```

### BigInt Coercion

```typescript
const schema = v.coerce.bigint();

// String to bigint
schema.parse("123");      // 123n
schema.parse("-456");     // -456n

// Number to bigint (integers only)
schema.parse(789);        // 789n
schema.parse(0);          // 0n

// Floats not allowed
schema.parse(3.14);       // Error: Cannot coerce float to bigint
```

## Custom Validation

### Basic Refinements

```typescript
// Simple validation
const ageSchema = v.number()
  .refine(age => age >= 18, "Must be 18 or older");

// Multiple refinements
const passwordSchema = v.string()
  .min(8)
  .refine(pwd => /[A-Z]/.test(pwd), "Must contain uppercase")
  .refine(pwd => /[a-z]/.test(pwd), "Must contain lowercase")
  .refine(pwd => /\d/.test(pwd), "Must contain number")
  .refine(pwd => /[!@#$%]/.test(pwd), "Must contain special character");
```

### Object-Level Validation

```typescript
const userSchema = v.object({
  password: v.string(),
  confirmPassword: v.string()
}).refine(
  data => data.password === data.confirmPassword,
  "Passwords must match"
);

const dateRangeSchema = v.object({
  startDate: v.date(),
  endDate: v.date()
}).refine(
  data => data.startDate < data.endDate,
  "End date must be after start date"
);
```

### Async Validation

```typescript
const emailSchema = v.string().email().refine(
  async (email) => {
    // Check if email exists in database
    const exists = await checkEmailExists(email);
    return !exists;
  },
  "Email already registered"
);

// Usage with async/await
const result = await emailSchema.parseAsync(email);
```

### Type Predicates

```typescript
// Type guard refinements
const stringNumberSchema = v.unknown()
  .refine((val): val is string | number => 
    typeof val === 'string' || typeof val === 'number',
    "Must be string or number"
  );

// After parsing, TypeScript knows the type
const result = stringNumberSchema.parse(input);
// result is typed as string | number
```

## Data Transformation

### Simple Transformations

```typescript
// String transformations
const normalizedEmail = v.string()
  .transform(s => s.toLowerCase())
  .transform(s => s.trim())
  .email();

normalizedEmail.parse("  JOHN@EXAMPLE.COM  "); // "john@example.com"

// Number transformations
const percentageSchema = v.number()
  .min(0)
  .max(100)
  .transform(n => n / 100);

percentageSchema.parse(50); // 0.5
```

### Complex Transformations

```typescript
// Parse and transform CSV data
const csvRowSchema = v.string()
  .transform(row => row.split(','))
  .transform(cells => cells.map(cell => cell.trim()))
  .transform(cells => ({
    name: cells[0],
    email: cells[1],
    age: parseInt(cells[2])
  }));

csvRowSchema.parse("John Doe, john@example.com, 30");
// { name: "John Doe", email: "john@example.com", age: 30 }

// Transform nested objects
const userTransformSchema = v.object({
  firstName: v.string(),
  lastName: v.string(),
  birthDate: v.date()
}).transform(user => ({
  ...user,
  fullName: `${user.firstName} ${user.lastName}`,
  age: Math.floor((Date.now() - user.birthDate.getTime()) / 31536000000)
}));
```

### Conditional Transformations

```typescript
const flexibleIdSchema = v.union(v.string(), v.number())
  .transform(id => {
    if (typeof id === 'number') {
      return `ID_${id}`;
    }
    return id.toUpperCase();
  });

flexibleIdSchema.parse(123);    // "ID_123"
flexibleIdSchema.parse("abc");  // "ABC"
```

## Complex Types

### Tuple Types

```typescript
// Fixed-length arrays with specific types
const coordinateSchema = v.tuple(
  v.number().min(-90).max(90),   // latitude
  v.number().min(-180).max(180), // longitude
  v.number().positive().optional() // altitude (optional)
);

coordinateSchema.parse([40.7128, -74.0060]);       // OK
coordinateSchema.parse([40.7128, -74.0060, 100]); // OK with altitude

// Named tuple elements
const rgbSchema = v.tuple(
  v.number().min(0).max(255), // red
  v.number().min(0).max(255), // green
  v.number().min(0).max(255)  // blue
);
```

### Record Types

```typescript
// Dynamic key-value pairs
const configSchema = v.record(v.union(v.string(), v.number(), v.boolean()));

configSchema.parse({
  apiUrl: "https://api.example.com",
  timeout: 5000,
  debug: true,
  maxRetries: 3
}); // All valid

// Nested records
const translationsSchema = v.record(
  v.record(v.string()) // language -> key -> translation
);

translationsSchema.parse({
  en: { hello: "Hello", goodbye: "Goodbye" },
  es: { hello: "Hola", goodbye: "Adiós" }
});
```

### Set Types

```typescript
const uniqueTagsSchema = v.set(v.string().min(1).max(20))
  .refine(set => set.size <= 10, "Maximum 10 tags allowed");

const tags = new Set(["javascript", "typescript", "validation"]);
uniqueTagsSchema.parse(tags); // Valid Set

// Transform array to set
const arrayToSetSchema = v.array(v.string())
  .transform(arr => new Set(arr));

arrayToSetSchema.parse(["a", "b", "a", "c"]); // Set {"a", "b", "c"}
```

### Map Types

```typescript
const userPermissionsSchema = v.map(
  v.string(), // user ID
  v.set(v.enum("read", "write", "delete", "admin")) // permissions
);

const permissions = new Map([
  ["user1", new Set(["read", "write"])],
  ["user2", new Set(["read"])],
  ["admin", new Set(["read", "write", "delete", "admin"])]
]);

userPermissionsSchema.parse(permissions); // Valid
```

### Intersection Types

```typescript
// Combine multiple object schemas
const timestampSchema = v.object({
  createdAt: v.date(),
  updatedAt: v.date()
});

const authorSchema = v.object({
  authorId: v.string(),
  authorName: v.string()
});

const postSchema = v.intersection(
  v.object({
    id: v.string(),
    title: v.string(),
    content: v.string()
  }),
  timestampSchema,
  authorSchema
);

// Result has all properties combined
```

## Error Handling

### Error Formatting

```typescript
import { treeifyError, prettifyError, flattenError } from '@oxog/vld';

const schema = v.object({
  user: v.object({
    name: v.string().min(2),
    email: v.string().email(),
    age: v.number().positive()
  }),
  items: v.array(v.object({
    id: v.string(),
    quantity: v.number().positive()
  }))
});

const result = schema.safeParse(invalidData);

if (!result.success) {
  // Tree format - for debugging
  const tree = treeifyError(result.error);
  console.log(JSON.stringify(tree, null, 2));
  
  // Pretty format - for console output
  const pretty = prettifyError(result.error);
  console.log(pretty);
  
  // Flat format - for form validation
  const flat = flattenError(result.error);
  // Use flat.fieldErrors for form field errors
}
```

### Custom Error Classes

```typescript
class ValidationError extends Error {
  constructor(public errors: VldError) {
    super(prettifyError(errors));
    this.name = 'ValidationError';
  }
}

function validateOrThrow(schema: any, data: unknown) {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(result.error);
  }
  return result.data;
}
```

### Error Recovery

```typescript
// Provide defaults for failed validations
const configSchema = v.object({
  port: v.number().catch(3000),
  host: v.string().catch("localhost"),
  debug: v.boolean().catch(false)
});

// Invalid input gets defaults
configSchema.parse({
  port: "invalid",
  host: 123,
  debug: "not-a-boolean"
});
// Result: { port: 3000, host: "localhost", debug: false }
```

## Internationalization

### Setting Locale

```typescript
import { v, setLocale } from '@oxog/vld';

// Set global locale
setLocale('es'); // Spanish

const schema = v.string().min(5);
const result = schema.safeParse("Hi");
// Error message in Spanish: "La cadena debe tener al menos 5 caracteres"
```

### Supported Languages

VLD supports 27+ languages including:

- **Major**: English, Spanish, French, German, Italian, Portuguese, Russian, Japanese, Korean, Chinese, Arabic, Hindi, Turkish
- **European**: Danish, Swedish, Norwegian, Finnish, Dutch, Polish
- **Asian**: Thai, Vietnamese, Indonesian, Bengali
- **African**: Swahili, Afrikaans
- **Regional**: Portuguese (Brazil), Spanish (Mexico)

### Dynamic Locale Switching

```typescript
class LocalizedValidator {
  constructor(private userLocale: string) {
    setLocale(userLocale);
  }
  
  validate(schema: any, data: unknown) {
    // Temporarily switch locale
    const previousLocale = getLocale();
    setLocale(this.userLocale);
    
    const result = schema.safeParse(data);
    
    // Restore previous locale
    setLocale(previousLocale);
    
    return result;
  }
}

// Per-user validation
const validator = new LocalizedValidator('fr');
validator.validate(schema, data); // French error messages
```

## Advanced Patterns

### Recursive Schemas

```typescript
// Define recursive types for tree structures
type TreeNode = {
  value: string;
  children?: TreeNode[];
};

const treeNodeSchema: v.ZodType<TreeNode> = v.object({
  value: v.string(),
  children: v.lazy(() => v.array(treeNodeSchema).optional())
});

// Parse nested tree structure
treeNodeSchema.parse({
  value: "root",
  children: [
    { value: "child1" },
    { 
      value: "child2",
      children: [
        { value: "grandchild" }
      ]
    }
  ]
});
```

### Branded Types

```typescript
// Create branded types for type safety
const EmailBrand = Symbol('Email');
type Email = string & { [EmailBrand]: true };

const emailSchema = v.string()
  .email()
  .transform((email): Email => email as Email);

// Functions can require branded types
function sendEmail(to: Email, subject: string) {
  // TypeScript ensures 'to' is a validated email
}

const email = emailSchema.parse("user@example.com");
sendEmail(email, "Hello"); // Type-safe
```

### Schema Composition

```typescript
// Build complex schemas from reusable parts
const addressSchema = v.object({
  street: v.string(),
  city: v.string(),
  country: v.string(),
  zipCode: v.string()
});

const contactSchema = v.object({
  email: v.string().email(),
  phone: v.string().regex(/^\+?[\d\s-()]+$/)
});

const personSchema = v.object({
  id: v.string().uuid(),
  name: v.string()
});

// Compose into larger schemas
const customerSchema = personSchema
  .extend({
    billingAddress: addressSchema,
    shippingAddress: addressSchema.optional(),
    contact: contactSchema,
    customerSince: v.date()
  });

const employeeSchema = personSchema
  .extend({
    employeeId: v.string(),
    department: v.string(),
    officeAddress: addressSchema,
    workContact: contactSchema
  });
```

### Discriminated Unions

```typescript
// Type-safe discriminated unions
const shapeSchema = v.union(
  v.object({
    type: v.literal("circle"),
    radius: v.number().positive()
  }),
  v.object({
    type: v.literal("rectangle"),
    width: v.number().positive(),
    height: v.number().positive()
  }),
  v.object({
    type: v.literal("triangle"),
    base: v.number().positive(),
    height: v.number().positive()
  })
);

// TypeScript narrows type based on discriminator
const shape = shapeSchema.parse(data);
if (shape.type === "circle") {
  console.log(shape.radius); // TypeScript knows about radius
}
```

---

For more information, see the [API Reference](./API.md) or [Getting Started Guide](./GETTING_STARTED.md).