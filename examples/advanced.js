// VLD v3.0 — Advanced usage
// VLD is a drop-in replacement for Zod. The v.* factory returns V1 validators
// (legacy) by default. vV2 is the V2 method-memoization variant and is the
// recommended default for new code. Set v.setV2Mode(true) to globally swap
// the v.* factories to V2.

import { v, vV2 } from '@oxog/vld';

// Optional: enable V2 globally for every v.* factory call below
// v.setV2Mode(true);

// ----- Unions (multiple types) -----
const idSchema = v.union(v.string().uuid(), v.number());
console.log(idSchema.parse('550e8400-e29b-41d4-a716-446655440000')); // UUID string
console.log(idSchema.parse(12345)); // number

// ----- Enums -----
const roleSchema = v.enum('admin', 'user', 'guest');
console.log(roleSchema.parse('admin')); // 'admin'

// ----- Arrays with constraints -----
const tagsSchema = v.array(v.string()).min(1).max(5);
console.log(tagsSchema.parse(['javascript', 'typescript'])); // ['javascript', 'typescript']

// ----- Nested objects -----
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
console.log(post);

// ----- Optional and nullable -----
const configSchema = v.object({
  apiUrl: v.string().url(),
  timeout: v.optional(v.number()),
  proxy: v.nullable(v.string()),
  retries: v.optional(v.number()).parse(undefined)
});

// ----- Date validation (V2 path: vV2.date() for the new memory layout) -----
const eventSchema = v.object({
  name: v.string(),
  startDate: v.date(),
  endDate: v.date()
});

const event = eventSchema.parse({
  name: 'Conference',
  startDate: new Date('2024-06-01'),
  endDate: '2024-06-03' // String will be coerced to Date
});
console.log(event);

// ----- Complex validation with custom messages -----
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

// ----- V2 chains (recommended for new code) -----
// vV2.* returns the V2 method-memoization classes — 2-6x faster and
// ~10x less memory than V1 in production benchmarks.
const v2Search = vV2.string().min(1).max(200).trim().toLowerCase();
console.log('vV2 search:', v2Search.parse('  Hello World  '));

const v2Post = vV2.object({
  id: vV2.string().uuid(),
  title: vV2.string().min(5).max(100),
  publishedAt: vV2.optional(vV2.date()),
  status: vV2.enum('draft', 'published', 'archived')
});
console.log('vV2 post:', v2Post.parse({
  id: '550e8400-e29b-41d4-a716-446655440000',
  title: 'VLD 3.0 ships V2 chains',
  status: 'published'
}));
