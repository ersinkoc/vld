# TypeScript Guide

VLD provides excellent TypeScript support with automatic type inference.

## Type Inference

VLD automatically infers TypeScript types from your schemas:

```typescript
import { v, Infer } from '@oxog/vld';

const userSchema = v.object({
  id: v.string(),
  name: v.string(),
  age: v.number(),
  email: v.string().email(),
  isActive: v.boolean(),
  role: v.enum('admin', 'user', 'guest'),
  metadata: v.optional(v.object({
    lastLogin: v.date(),
    tags: v.array(v.string())
  }))
});

// Automatically infer the type
type User = Infer<typeof userSchema>;

// TypeScript knows the exact shape:
// {
//   id: string;
//   name: string;
//   age: number;
//   email: string;
//   isActive: boolean;
//   role: 'admin' | 'user' | 'guest';
//   metadata?: {
//     lastLogin: Date;
//     tags: string[];
//   };
// }
```

## Working with Inferred Types

```typescript
// Use inferred types in functions
function processUser(user: User) {
  console.log(user.name); // TypeScript knows this is a string
  console.log(user.role); // TypeScript knows this is 'admin' | 'user' | 'guest'
}

// Validate unknown data
function validateUser(data: unknown): User {
  return userSchema.parse(data); // Returns User type
}

// Safe validation
function safeValidateUser(data: unknown): User | null {
  const result = userSchema.safeParse(data);
  if (result.success) {
    return result.data; // TypeScript knows this is User
  }
  return null;
}
```

## Generic Validation Functions

```typescript
import { VldBase } from '@oxog/vld';

function validate<T>(
  schema: VldBase<T>,
  data: unknown
): T {
  return schema.parse(data);
}

// Usage
const user = validate(userSchema, rawData);
// TypeScript infers user is User type
```

## Discriminated Unions

```typescript
const messageSchema = v.union(
  v.object({
    type: v.literal('text'),
    content: v.string()
  }),
  v.object({
    type: v.literal('image'),
    url: v.string().url(),
    alt: v.string()
  }),
  v.object({
    type: v.literal('video'),
    url: v.string().url(),
    duration: v.number()
  })
);

type Message = Infer<typeof messageSchema>;

function handleMessage(message: Message) {
  switch (message.type) {
    case 'text':
      console.log(message.content); // TypeScript knows content exists
      break;
    case 'image':
      console.log(message.url, message.alt); // TypeScript knows these exist
      break;
    case 'video':
      console.log(message.url, message.duration); // TypeScript knows these exist
      break;
  }
}
```

## Form Validation

```typescript
const loginSchema = v.object({
  username: v.string().min(3),
  password: v.string().min(8),
  rememberMe: v.optional(v.boolean())
});

type LoginForm = Infer<typeof loginSchema>;

function handleLogin(formData: FormData): LoginForm {
  const raw = {
    username: formData.get('username'),
    password: formData.get('password'),
    rememberMe: formData.get('rememberMe') === 'true'
  };
  
  return loginSchema.parse(raw);
}
```

## API Response Validation

```typescript
const apiResponseSchema = v.object({
  success: v.boolean(),
  data: v.optional(v.unknown()),
  error: v.optional(v.object({
    code: v.string(),
    message: v.string()
  }))
});

type ApiResponse = Infer<typeof apiResponseSchema>;

async function fetchData<T>(
  url: string,
  dataSchema: VldBase<T>
): Promise<T> {
  const response = await fetch(url);
  const json = await response.json();
  
  const apiResult = apiResponseSchema.parse(json);
  
  if (!apiResult.success || !apiResult.data) {
    throw new Error(apiResult.error?.message || 'Unknown error');
  }
  
  return dataSchema.parse(apiResult.data);
}
```

## Branded Types

```typescript
const EmailSchema = v.string().email();
type Email = Infer<typeof EmailSchema>;

const UUIDSchema = v.string().uuid();
type UUID = Infer<typeof UUIDSchema>;

// These help prevent mixing up string types
function sendEmail(to: Email, subject: string) {
  // Implementation
}

function getUserById(id: UUID) {
  // Implementation
}

// TypeScript will help catch errors:
const email: Email = EmailSchema.parse('user@example.com');
const id: UUID = UUIDSchema.parse('550e8400-e29b-41d4-a716-446655440000');

sendEmail(email, 'Hello'); // ✓ OK
// sendEmail(id, 'Hello'); // ✗ Type error
```

## Extending Schemas

```typescript
const baseUserSchema = v.object({
  name: v.string(),
  email: v.string().email()
});

const adminUserSchema = v.object({
  ...baseUserSchema.shape,
  role: v.literal('admin'),
  permissions: v.array(v.string())
});

type BaseUser = Infer<typeof baseUserSchema>;
type AdminUser = Infer<typeof adminUserSchema>;
```