// VLD v3.0 — TypeScript-first usage
// vV2 is the V2 method-memoization factory (2-6x faster than Zod 4.5, 1.6-10x
// less memory in production benchmarks). v.setV2Mode(true) swaps v.* to V2
// globally. toZodError returns ZodError-shaped errors for downstream tooling.

import { v, vV2, z, type Infer, toZodError } from '@oxog/vld';

// V2 child schemas under a V1 object — same surface, faster hot path
const userSchema = v.object({
  id: vV2.coerce.string(),
  name: vV2.string().min(2).max(100),
  email: vV2.string().email(),
  age: vV2.coerce.number().int().positive().catch(18),
  role: v.enum('admin', 'user', 'guest').default('user'),
  isActive: v.boolean().default(true),
  userId: v.bigint().optional(),
  tags: v.set(v.string()).default(new Set<string>()),
  metadata: v.record(v.any()).default({} as Record<string, unknown>),
  coordinates: v.tuple(v.number(), v.number()).optional(),
  preferences: v.object({
    theme: v.enum('light', 'dark', 'auto').default('light'),
    notifications: v.boolean().default(true),
    language: v.string().default('en')
  }).optional()
});

// Inferred TypeScript type
type User = Infer<typeof userSchema>;

const user: User = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
  role: 'admin',
  isActive: true,
  metadata: {
    lastLogin: new Date()
  },
  tags: ['developer', 'typescript']
};

function createUser(input: unknown): User {
  return userSchema.parse(input);
}

// Discriminated unions
const notificationSchema = v.union(
  v.object({
    type: v.literal('email'),
    to: vV2.string().email(),
    subject: v.string(),
    body: v.string()
  }),
  v.object({
    type: v.literal('sms'),
    phoneNumber: v.string(),
    message: vV2.string().max(160)
  }),
  v.object({
    type: v.literal('push'),
    deviceToken: v.string(),
    title: v.string(),
    body: v.string()
  })
);

type Notification = Infer<typeof notificationSchema>;

function sendNotification(notification: Notification): void {
  switch (notification.type) {
    case 'email':
      console.log(`Email to ${notification.to}: ${notification.subject}`);
      break;
    case 'sms':
      console.log(`SMS to ${notification.phoneNumber}: ${notification.message}`);
      break;
    case 'push':
      console.log(`Push to device: ${notification.title}`);
      break;
  }
}

// API response validation with toZodError
const apiResponseSchema = v.object({
  success: v.boolean(),
  data: v.optional(v.unknown()),
  error: v.optional(v.object({
    code: v.string(),
    message: v.string()
  }))
});

type ApiResponse = Infer<typeof apiResponseSchema>;

async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  const json: unknown = await response.json();

  const apiResult = apiResponseSchema.parse(json);
  if (!apiResult.success) {
    throw new Error(apiResult.error?.message ?? 'Unknown error');
  }
  return userSchema.parse(apiResult.data);
}

// ZodError compatibility
function safeCreateUser(input: unknown): { ok: true; data: User } | { ok: false; zodError: ReturnType<typeof toZodError> } {
  const result = userSchema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, zodError: toZodError(result.error) };
}

// Form validation (V2 children)
const loginFormSchema = v.object({
  username: vV2.string().min(3).max(20),
  password: vV2.string().min(8),
  rememberMe: v.optional(v.boolean())
});

type LoginForm = Infer<typeof loginFormSchema>;

function validateLoginForm(formData: FormData): LoginForm {
  return loginFormSchema.parse({
    username: formData.get('username'),
    password: formData.get('password'),
    rememberMe: formData.get('rememberMe') === 'true'
  });
}

// Object schema methods with TypeScript
const baseUserSchema = v.object({
  name: v.string(),
  email: v.string().email(),
  age: v.number(),
  role: v.string()
});

const publicUserSchema = baseUserSchema.pick('name', 'age');
type PublicUser = Infer<typeof publicUserSchema>;

const safeUserSchema = baseUserSchema.omit('email', 'role');
type SafeUser = Infer<typeof safeUserSchema>;

const extendedUserSchema = baseUserSchema.extend({
  isVerified: v.boolean().default(false),
  lastLogin: v.date().optional(),
  metadata: v.record(v.any()).default({} as Record<string, unknown>)
});
type ExtendedUser = Infer<typeof extendedUserSchema>;

// Intersection (V1 stays optimal; V2 children plug in transparently)
const adminRoleSchema = v.object({
  permissions: v.array(v.string()),
  adminLevel: v.number().min(1).max(5)
});

const adminUserSchema = v.intersection(baseUserSchema, adminRoleSchema);
type AdminUser = Infer<typeof adminUserSchema>;

// V2 chain — full method memoization path
const passwordSchema = vV2.string()
  .min(8, 'Password too short')
  .refine(pwd => /[A-Z]/.test(pwd), 'Must contain uppercase letter')
  .refine(pwd => /[0-9]/.test(pwd), 'Must contain number')
  .refine(pwd => /[!@#$%^&*]/.test(pwd), 'Must contain special character');

const emailNormalizationSchema = vV2.string()
  .transform(email => email.toLowerCase().trim())
  .refine(email => email.includes('@'), 'Invalid email format')
  .transform(email => email.replace(/\+.*@/, '@')); // Remove plus addressing

// V2 + V1 mix in a real-world schema
const complexApiSchema = v.object({
  userId: vV2.coerce.bigint(),
  username: vV2.coerce.string()
    .transform(s => s.trim().toLowerCase())
    .refine(s => /^[a-z0-9_]+$/.test(s), 'Invalid username format'),
  email: emailNormalizationSchema,
  password: passwordSchema,
  age: vV2.coerce.number()
    .min(13, 'Too young')
    .max(120, 'Too old')
    .catch(null),
  roles: v.set(v.enum('user', 'admin', 'moderator')).default(new Set(['user'])),
  preferences: v.record(v.union(v.string(), v.number(), v.boolean())).default({} as Record<string, string | number | boolean>),
  tags: v.array(v.string()).max(10).default([]),
  location: v.tuple(v.number(), v.number()).optional(),
  profile: v.object({
    bio: v.string().max(500).default(''),
    website: v.string().url().optional(),
    socialLinks: v.map(v.string(), v.string().url()).default(new Map())
  }).default({
    bio: '',
    socialLinks: new Map()
  })
});

type ComplexApiUser = Infer<typeof complexApiSchema>;

async function createComplexUser(input: unknown): Promise<ComplexApiUser> {
  try {
    return complexApiSchema.parse(input);
  } catch (error) {
    console.error('Validation failed:', (error as Error).message);
    throw error;
  }
}

// z = v — keep the z.* style for codebases that use Zod naming
const zUserSchema = z.object({
  email: z.string().email(),
  age: z.number().int().positive()
});
type ZUser = Infer<typeof zUserSchema>;

// Mixins with intersection
const timestampMixin = v.object({
  createdAt: v.date().default(() => new Date()),
  updatedAt: v.date().default(() => new Date())
});

const auditMixin = v.object({
  createdBy: v.string(),
  updatedBy: v.string().optional()
});

const auditableUserSchema = v.intersection(
  v.intersection(userSchema, timestampMixin),
  auditMixin
);
type AuditableUser = Infer<typeof auditableUserSchema>;

// E-commerce product schema
const productSchema = v.object({
  id: vV2.coerce.string(),
  name: vV2.string().min(1).max(200),
  description: vV2.string().max(2000).default(''),
  price: vV2.coerce.number().positive(),
  currency: v.enum('USD', 'EUR', 'GBP').default('USD'),
  categories: v.set(v.string()).min(1),
  tags: v.array(v.string()).max(20).default([]),
  variants: v.record(v.object({
    price: v.number().positive(),
    stock: v.number().nonnegative(),
    sku: v.string()
  })).default({} as Record<string, { price: number; stock: number; sku: string }>),
  dimensions: v.tuple(v.number(), v.number(), v.number()).optional(),
  weightGrams: vV2.coerce.bigint().positive().optional(),
  isAvailable: v.boolean().default(true),
  stock: vV2.coerce.number().nonnegative().catch(0),
  metadata: v.record(v.any()).default({} as Record<string, unknown>)
});

type Product = Infer<typeof productSchema>;

const createProductSchema = productSchema.omit('id', 'metadata');
const updateProductSchema = createProductSchema.partial();
const productListSchema = productSchema.pick('id', 'name', 'price', 'isAvailable');

type CreateProduct = Infer<typeof createProductSchema>;
type UpdateProduct = Infer<typeof updateProductSchema>;
type ProductListItem = Infer<typeof productListSchema>;

// API response wrapper with generics
function createApiResponseSchema<T>(dataSchema: T) {
  return v.object({
    success: v.boolean(),
    data: v.optional(dataSchema),
    error: v.optional(v.object({
      code: v.string(),
      message: v.string(),
      details: v.record(v.any()).optional()
    })),
    meta: v.object({
      timestamp: v.date().default(() => new Date()),
      version: v.string().default('1.0')
    }).default({
      timestamp: new Date(),
      version: '1.0'
    })
  });
}

const userResponseSchema = createApiResponseSchema(userSchema);
const productListResponseSchema = createApiResponseSchema(v.array(productListSchema));

type UserResponse = Infer<typeof userResponseSchema>;
type ProductListResponse = Infer<typeof productListResponseSchema>;

export {
  User,
  Notification,
  ApiResponse,
  LoginForm,
  PublicUser,
  SafeUser,
  ExtendedUser,
  AdminUser,
  ComplexApiUser,
  AuditableUser,
  Product,
  CreateProduct,
  UpdateProduct,
  ProductListItem,
  UserResponse,
  ProductListResponse,
  ZUser
};
