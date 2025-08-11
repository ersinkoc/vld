import { v } from '@oxog/vld';

// Unions (multiple types)
const idSchema = v.union(v.string().uuid(), v.number());
console.log(idSchema.parse('550e8400-e29b-41d4-a716-446655440000')); // UUID string
console.log(idSchema.parse(12345)); // number

// Enums
const roleSchema = v.enum('admin', 'user', 'guest');
console.log(roleSchema.parse('admin')); // 'admin'

// Arrays with constraints
const tagsSchema = v.array(v.string()).min(1).max(5);
console.log(tagsSchema.parse(['javascript', 'typescript'])); // ['javascript', 'typescript']

// Nested objects
const postSchema = v.object({
  id: v.string().uuid(),
  title: v.string().min(5).max(100),
  content: v.string().min(10),
  author: v.object({
    id: v.string(),
    name: v.string(),
    email: v.string().email()
  }),
  tags: v.array(v.string()),
  publishedAt: v.optional(v.date()),
  status: v.enum('draft', 'published', 'archived')
});

const post = postSchema.parse({
  id: '550e8400-e29b-41d4-a716-446655440000',
  title: 'Getting Started with VLD',
  content: 'VLD is a fast validation library...',
  author: {
    id: 'user-123',
    name: 'John Doe',
    email: 'john@example.com'
  },
  tags: ['validation', 'typescript'],
  status: 'published'
});

// Optional and nullable
const configSchema = v.object({
  apiUrl: v.string().url(),
  timeout: v.optional(v.number()), // number | undefined
  proxy: v.nullable(v.string()),   // string | null
  retries: v.optional(v.number()).parse(undefined) // undefined
});

// Date validation
const eventSchema = v.object({
  name: v.string(),
  startDate: v.date(),
  endDate: v.date()
});

const event = eventSchema.parse({
  name: 'Conference',
  startDate: new Date('2024-06-01'),
  endDate: '2024-06-03' // String will be converted to Date
});

// Complex validation with custom messages
const passwordSchema = v.string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password is too long')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[0-9]/, 'Password must contain a number');

try {
  passwordSchema.parse('weak');
} catch (error) {
  console.log(error.message); // 'Password must be at least 8 characters'
}