# VLD Advanced Features Documentation

## Table of Contents
1. [Type Coercion](#type-coercion)
2. [Advanced Types](#advanced-types)
3. [Intersection Types](#intersection-types)
4. [Custom Validation with refine()](#custom-validation-with-refine)
5. [Data Transformation with transform()](#data-transformation-with-transform)
6. [Default Values](#default-values)
7. [Error Handling with catch()](#error-handling-with-catch)
8. [Object Schema Methods](#object-schema-methods)
9. [Method Chaining](#method-chaining)
10. [Internationalization](#internationalization)

## Type Coercion

VLD provides comprehensive type coercion that automatically converts input values to the desired type when possible.

### String Coercion
```typescript
const stringSchema = v.coerce.string();

// Convert numbers to strings
stringSchema.parse(123);     // "123"
stringSchema.parse(0);       // "0" 
stringSchema.parse(-45.67);  // "-45.67"

// Convert booleans to strings
stringSchema.parse(true);    // "true"
stringSchema.parse(false);   // "false"

// Convert objects to strings
stringSchema.parse({});      // "[object Object]"
stringSchema.parse([]);      // ""

// Null and undefined are rejected
stringSchema.parse(null);     // Error: Cannot coerce null to string
stringSchema.parse(undefined); // Error: Cannot coerce undefined to string
```

### Number Coercion
```typescript
const numberSchema = v.coerce.number();

// Convert string numbers
numberSchema.parse("123");      // 123
numberSchema.parse("-45.67");   // -45.67
numberSchema.parse("  42  ");   // 42 (whitespace trimmed)

// Convert booleans
numberSchema.parse(true);       // 1
numberSchema.parse(false);      // 0

// Invalid strings are rejected
numberSchema.parse("not-a-number"); // Error: Cannot coerce "not-a-number" to number
numberSchema.parse("");             // Error: Cannot coerce "" to number
```

### Boolean Coercion
```typescript
const booleanSchema = v.coerce.boolean();

// Truthy strings
booleanSchema.parse("true");    // true
booleanSchema.parse("TRUE");    // true
booleanSchema.parse("1");       // true
booleanSchema.parse("yes");     // true
booleanSchema.parse("YES");     // true

// Falsy strings
booleanSchema.parse("false");   // false
booleanSchema.parse("FALSE");   // false
booleanSchema.parse("0");       // false
booleanSchema.parse("no");      // false

// Numbers
booleanSchema.parse(1);         // true
booleanSchema.parse(0);         // false
booleanSchema.parse(2);         // Error: Cannot coerce 2 to boolean
```

### BigInt Coercion
```typescript
const bigintSchema = v.coerce.bigint();

// Convert string numbers
bigintSchema.parse("123");      // 123n
bigintSchema.parse("-456");     // -456n

// Convert integers
bigintSchema.parse(123);        // 123n
bigintSchema.parse(0);          // 0n

// Float numbers are rejected
bigintSchema.parse(123.45);     // Error: Cannot coerce 123.45 to bigint
```

### Date Coercion
```typescript
const dateSchema = v.coerce.date();

// Convert string dates
dateSchema.parse("2023-12-25"); // Date object
dateSchema.parse("Dec 25, 2023"); // Date object

// Convert timestamps
const timestamp = Date.now();
dateSchema.parse(timestamp);     // Date object

// Invalid dates are rejected
dateSchema.parse("invalid-date"); // Error: Cannot coerce "invalid-date" to date
```

## Advanced Types

VLD supports all modern JavaScript types including collections and primitives.

### BigInt Validation
```typescript
const bigintSchema = v.bigint();

// Validates BigInt values
bigintSchema.parse(123n);        // 123n
bigintSchema.parse(BigInt(456)); // 456n

// Rejects other types
bigintSchema.parse(123);         // Error: Invalid bigint
bigintSchema.parse("123");       // Error: Invalid bigint
```

### Symbol Validation
```typescript
const symbolSchema = v.symbol();

const testSymbol = Symbol('test');
symbolSchema.parse(testSymbol);  // Symbol(test)

// Rejects other types
symbolSchema.parse("symbol");    // Error: Invalid symbol
symbolSchema.parse(123);         // Error: Invalid symbol
```

### Tuple Validation
```typescript
// Fixed-length array with specific types per position
const coordinateSchema = v.tuple(v.number(), v.number());

coordinateSchema.parse([1, 2]);     // [1, 2]
coordinateSchema.parse([1.5, 2.5]); // [1.5, 2.5]

// Wrong length
coordinateSchema.parse([1]);        // Error: Tuple must have exactly 2 elements, got 1
coordinateSchema.parse([1, 2, 3]);  // Error: Tuple must have exactly 2 elements, got 3

// Wrong types
coordinateSchema.parse(["1", "2"]); // Error: Expected number at position 0

// Three-element tuple with optional third element
const coordinateWithAltitude = v.tuple(v.number(), v.number(), v.number().optional());
coordinateWithAltitude.parse([1, 2]);    // [1, 2, undefined]
coordinateWithAltitude.parse([1, 2, 3]); // [1, 2, 3]
```

### Record Validation
```typescript
// Key-value pairs with consistent value type
const configSchema = v.record(v.string());

configSchema.parse({
  theme: "dark",
  language: "en",
  timezone: "UTC"
}); // Valid

// Complex value types
const userPreferencesSchema = v.record(v.object({
  enabled: v.boolean(),
  value: v.any()
}));

userPreferencesSchema.parse({
  notifications: { enabled: true, value: "email" },
  theme: { enabled: false, value: null }
}); // Valid
```

### Set Validation
```typescript
const tagSchema = v.set(v.string());

const tags = new Set(["javascript", "typescript", "validation"]);
tagSchema.parse(tags); // Set with validated string elements

// Rejects invalid element types
const invalidTags = new Set(["valid", 123, "also-valid"]);
tagSchema.parse(invalidTags); // Error: Invalid string at element
```

### Map Validation
```typescript
const userRolesSchema = v.map(v.string(), v.array(v.string()));

const roleMap = new Map([
  ["admin", ["read", "write", "delete"]],
  ["user", ["read"]],
  ["guest", []]
]);

userRolesSchema.parse(roleMap); // Valid Map with validated key-value pairs
```

## Intersection Types

Combine multiple schemas into one with intelligent merging.

### Object Intersections
```typescript
const userSchema = v.object({
  name: v.string(),
  age: v.number()
});

const adminSchema = v.object({
  role: v.string(),
  permissions: v.array(v.string())
});

const adminUserSchema = v.intersection(userSchema, adminSchema);

// Result type: { name: string; age: number; role: string; permissions: string[] }
adminUserSchema.parse({
  name: "John",
  age: 30,
  role: "admin",
  permissions: ["read", "write"]
}); // Valid
```

### Nested Object Intersections
```typescript
const baseSchema = v.object({
  id: v.string(),
  metadata: v.object({
    created: v.date()
  })
});

const extendedSchema = v.object({
  name: v.string(),
  metadata: v.object({
    updated: v.date()
  })
});

const combinedSchema = v.intersection(baseSchema, extendedSchema);

// Deep merge: metadata.created AND metadata.updated are both required
combinedSchema.parse({
  id: "123",
  name: "Test",
  metadata: {
    created: new Date(),
    updated: new Date()
  }
}); // Valid
```

### Primitive Intersections
```typescript
// Same values pass
const literalSchema = v.intersection(v.literal("test"), v.literal("test"));
literalSchema.parse("test"); // "test"

// Different values fail
const conflictSchema = v.intersection(v.literal("a"), v.literal("b"));
conflictSchema.parse("a"); // Error: Values must be identical for intersection of primitive types
```

## Custom Validation with refine()

Add custom validation logic with descriptive error messages.

### Basic Refinement
```typescript
const positiveNumberSchema = v.number()
  .refine(n => n > 0, "Number must be positive");

positiveNumberSchema.parse(5);  // 5
positiveNumberSchema.parse(-1); // Error: Custom validation failed: Number must be positive
```

### Multiple Refinements
```typescript
const passwordSchema = v.string()
  .min(8)
  .refine(pwd => /[A-Z]/.test(pwd), "Must contain uppercase letter")
  .refine(pwd => /[a-z]/.test(pwd), "Must contain lowercase letter")  
  .refine(pwd => /\d/.test(pwd), "Must contain number")
  .refine(pwd => /[!@#$%^&*]/.test(pwd), "Must contain special character");

passwordSchema.parse("MySecure123!"); // Valid
passwordSchema.parse("weak");          // Error: String must be at least 8 characters
passwordSchema.parse("nouppercase1!"); // Error: Must contain uppercase letter
```

### Object Refinements
```typescript
const userSchema = v.object({
  name: v.string(),
  age: v.number()
}).refine(user => user.age >= 18, "User must be an adult");

userSchema.parse({ name: "John", age: 25 }); // Valid
userSchema.parse({ name: "Jane", age: 16 }); // Error: Custom validation failed: User must be an adult
```

### Type Guard Refinements
```typescript
const stringOrNumberSchema = v.unknown()
  .refine((value): value is string => typeof value === "string", "Must be string");

// TypeScript knows the result is a string
const result: string = stringOrNumberSchema.parse("hello");
```

## Data Transformation with transform()

Transform validated data after successful validation.

### String Transformations
```typescript
const normalizeEmailSchema = v.string()
  .transform(s => s.toLowerCase().trim())
  .email();

normalizeEmailSchema.parse("  JOHN@EXAMPLE.COM  "); // "john@example.com"
```

### Number Transformations
```typescript
const absoluteValueSchema = v.number()
  .transform(n => Math.abs(n));

absoluteValueSchema.parse(-42); // 42
absoluteValueSchema.parse(42);  // 42
```

### Object Transformations
```typescript
const userTransformSchema = v.object({
  firstName: v.string(),
  lastName: v.string()
}).transform(user => ({
  ...user,
  fullName: `${user.firstName} ${user.lastName}`,
  initials: `${user.firstName[0]}${user.lastName[0]}`
}));

userTransformSchema.parse({
  firstName: "John",
  lastName: "Doe"
}); 
// Result: { firstName: "John", lastName: "Doe", fullName: "John Doe", initials: "JD" }
```

### Chained Transformations
```typescript
const processTextSchema = v.string()
  .transform(s => s.trim())           // Remove whitespace
  .transform(s => s.toLowerCase())    // Convert to lowercase
  .transform(s => s.replace(/\s+/g, '-')); // Replace spaces with hyphens

processTextSchema.parse("  Hello World  "); // "hello-world"
```

## Default Values

Provide fallback values for undefined inputs.

### Simple Defaults
```typescript
const withDefaultSchema = v.string().default("fallback");

withDefaultSchema.parse("actual");   // "actual"
withDefaultSchema.parse(undefined);  // "fallback"
withDefaultSchema.parse(null);       // Error: Invalid string (default only applies to undefined)
```

### Object Defaults
```typescript
const userSchema = v.object({
  name: v.string(),
  role: v.string().default("user"),
  isActive: v.boolean().default(true),
  preferences: v.object({
    theme: v.string().default("light"),
    notifications: v.boolean().default(true)
  }).default({
    theme: "light",
    notifications: true
  })
});

userSchema.parse({
  name: "Alice"
  // role, isActive, and preferences will use defaults
});
// Result: { name: "Alice", role: "user", isActive: true, preferences: { theme: "light", notifications: true } }
```

### Dynamic Defaults
```typescript
const timestampSchema = v.object({
  name: v.string(),
  createdAt: v.date().default(() => new Date()),
  id: v.string().default(() => Math.random().toString(36))
});

// Each parse gets a new timestamp and ID
timestampSchema.parse({ name: "Test" });
```

## Error Handling with catch()

Provide fallback values when validation fails.

### Basic Error Catching
```typescript
const safeNumberSchema = v.number().catch(-1);

safeNumberSchema.parse(42);        // 42
safeNumberSchema.parse("invalid"); // -1 (fallback)
safeNumberSchema.parse(null);      // -1 (fallback)
```

### Complex Validation with Catch
```typescript
const processedInputSchema = v.string()
  .min(5)
  .transform(s => s.toUpperCase())
  .refine(s => s.includes("VALID"), "Must contain VALID")
  .catch("ERROR");

processedInputSchema.parse("valid input");  // "VALID INPUT"
processedInputSchema.parse("short");        // "ERROR" (failed min length)
processedInputSchema.parse("long invalid"); // "ERROR" (failed refinement)
```

### Object Catch
```typescript
const userWithFallbackSchema = v.object({
  name: v.string(),
  age: v.number()
}).catch({
  name: "Unknown User",
  age: 0
});

userWithFallbackSchema.parse({ name: "John", age: 30 }); // Valid object
userWithFallbackSchema.parse("invalid");                 // { name: "Unknown User", age: 0 }
```

## Object Schema Methods

Manipulate object schemas with pick, omit, and extend.

### Pick Specific Fields
```typescript
const fullUserSchema = v.object({
  id: v.string(),
  name: v.string(),
  email: v.string(),
  password: v.string(),
  role: v.string()
});

// Create public schema with only safe fields
const publicUserSchema = fullUserSchema.pick('id', 'name', 'email');
// Type: { id: string; name: string; email: string }

publicUserSchema.parse({
  id: "123",
  name: "John",
  email: "john@example.com"
}); // Valid
```

### Omit Sensitive Fields
```typescript
// Create schema without sensitive fields
const safeUserSchema = fullUserSchema.omit('password', 'role');
// Type: { id: string; name: string; email: string }

safeUserSchema.parse({
  id: "123",
  name: "John", 
  email: "john@example.com"
}); // Valid
```

### Extend with New Fields
```typescript
// Add new fields to existing schema
const extendedUserSchema = fullUserSchema.extend({
  isVerified: v.boolean(),
  lastLogin: v.date().optional(),
  metadata: v.record(v.any()).default({})
});

// Type includes all original fields plus new ones
extendedUserSchema.parse({
  id: "123",
  name: "John",
  email: "john@example.com",
  password: "secret",
  role: "user",
  isVerified: true,
  lastLogin: new Date(),
  metadata: { theme: "dark" }
}); // Valid
```

### Method Chaining
```typescript
const apiUserSchema = fullUserSchema
  .omit('password')                    // Remove sensitive field
  .extend({ isActive: v.boolean() })   // Add new field
  .pick('id', 'name', 'isActive');     // Keep only needed fields

// Type: { id: string; name: string; isActive: boolean }
```

## Method Chaining

Chain multiple validation methods for complex schemas.

### Basic Chaining
```typescript
const complexStringSchema = v.string()
  .min(3)
  .max(50)
  .transform(s => s.trim().toLowerCase())
  .refine(s => !s.includes('spam'), 'Cannot contain spam')
  .default('default-value');

complexStringSchema.parse("  HELLO WORLD  "); // "hello world"
complexStringSchema.parse(undefined);         // "default-value"
complexStringSchema.parse("spam content");    // Error: Cannot contain spam
```

### Advanced Chaining with Error Recovery
```typescript
const robustProcessingSchema = v.string()
  .transform(s => s.trim())                    // Clean whitespace
  .refine(s => s.length > 0, 'Cannot be empty') // Validate not empty
  .transform(s => s.toLowerCase())              // Normalize case
  .refine(s => /^[a-z0-9-_]+$/.test(s), 'Invalid characters') // Validate format
  .default('fallback')                         // Provide default for undefined
  .catch('error-state');                       // Catch any validation errors

robustProcessingSchema.parse("  Valid-Input123  "); // "valid-input123"
robustProcessingSchema.parse("Invalid Input!");     // "error-state"
robustProcessingSchema.parse(undefined);            // "fallback"
```

## Internationalization

VLD supports 27+ languages with full error message localization.

### Setting Locale
```typescript
import { v, setLocale } from '@oxog/vld';

// Default is English
setLocale('en');
v.string().parse(123); // Error: "Invalid string"

// Switch to Spanish
setLocale('es');
v.string().parse(123); // Error: "Cadena inválida"

// Switch to Turkish
setLocale('tr');
v.string().parse(123); // Error: "Geçersiz metin"

// Switch to Japanese
setLocale('ja');
v.string().parse(123); // Error: "無効な文字列"
```

### Supported Languages
VLD supports these languages with full error message translation:

**Major Languages (15):** en, tr, es, fr, de, it, pt, ru, ja, ko, zh, ar, hi, nl, pl  
**European (4):** da, sv, no, fi  
**Asian (4):** th, vi, id, bn  
**African (2):** sw, af  
**Regional (2):** pt-BR, es-MX  

Plus 75+ additional languages with English fallback.

### Dynamic Locale Switching
```typescript
function validateUserInput(input: unknown, userLocale: string) {
  setLocale(userLocale);
  
  const schema = v.object({
    name: v.string().min(2),
    age: v.number().min(18)
  });
  
  return schema.safeParse(input);
}

// User from Spain
const spanishResult = validateUserInput({ name: "A", age: 15 }, 'es');
// Errors in Spanish: "La cadena debe tener al menos 2 caracteres"

// User from Turkey  
const turkishResult = validateUserInput({ name: "A", age: 15 }, 'tr');
// Errors in Turkish: "Metin en az 2 karakter olmalı"
```

### Application Example
```typescript
class ValidationService {
  constructor(private locale: string = 'en') {
    setLocale(this.locale);
  }
  
  setUserLocale(locale: string) {
    this.locale = locale;
    setLocale(locale);
  }
  
  validateUser(input: unknown) {
    const schema = v.object({
      email: v.string().email(),
      password: v.string().min(8)
    });
    
    return schema.safeParse(input);
  }
}

// Service automatically provides localized errors
const service = new ValidationService('fr');
const result = service.validateUser({ email: 'invalid', password: 'short' });
// Errors in French: "Format d'email invalide", "Le mot de passe doit contenir au moins 8 caractères"
```

## Performance Tips

1. **Reuse Schemas**: Create schemas once and reuse them for better performance
2. **Avoid Deep Nesting**: Very deep object structures can impact performance  
3. **Use Coercion Wisely**: Coercion has some overhead, use when necessary
4. **Batch Validations**: When possible, validate multiple items in batches
5. **Consider safeParse**: Use `safeParse()` to avoid exception handling overhead

## Best Practices

1. **Type Inference**: Always use `Infer<typeof schema>` for TypeScript types
2. **Error Messages**: Provide clear, user-friendly error messages in refinements
3. **Schema Composition**: Use intersection, pick, omit, and extend for reusable schemas
4. **Default Values**: Use defaults sparingly, prefer explicit undefined handling
5. **Internationalization**: Set locale at application startup or per-user basis
6. **Method Chaining**: Order matters - validate before transform, transform before refine
7. **Error Recovery**: Use catch() for graceful degradation, not as primary validation

This completes the comprehensive guide to VLD's advanced features. For more examples, see the `/examples` directory in the repository.