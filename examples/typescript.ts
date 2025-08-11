import { v, Infer } from '@oxog/vld';

// Define enhanced schema with new VLD features
const userSchema = v.object({
  id: v.coerce.string(), // Auto-coerce to string
  name: v.string().min(2).max(100),
  email: v.string().email(),
  age: v.coerce.number().int().positive().catch(18), // Coerce and fallback
  role: v.enum('admin', 'user', 'guest').default('user'),
  isActive: v.boolean().default(true),
  userId: v.bigint().optional(), // BigInt support
  tags: v.set(v.string()).default(new Set()), // Set instead of array
  metadata: v.record(v.any()).default({}), // Key-value metadata
  coordinates: v.tuple(v.number(), v.number()).optional(), // Tuple for coordinates
  preferences: v.object({
    theme: v.enum('light', 'dark', 'auto').default('light'),
    notifications: v.boolean().default(true),
    language: v.string().default('en')
  }).optional()
});

// Infer TypeScript type
type User = Infer<typeof userSchema>;

// TypeScript knows the exact shape!
const user: User = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
  role: 'admin',
  isActive: true,
  metadata: {
    lastLogin: new Date(),
    preferences: {
      theme: 'dark',
      notifications: true
    }
  },
  tags: ['developer', 'typescript']
};

// Function with validated input
function createUser(input: unknown): User {
  return userSchema.parse(input);
}

// Discriminated unions
const notificationSchema = v.union(
  v.object({
    type: v.literal('email'),
    to: v.string().email(),
    subject: v.string(),
    body: v.string()
  }),
  v.object({
    type: v.literal('sms'),
    phoneNumber: v.string(),
    message: v.string().max(160)
  }),
  v.object({
    type: v.literal('push'),
    deviceToken: v.string(),
    title: v.string(),
    body: v.string()
  })
);

type Notification = Infer<typeof notificationSchema>;

function sendNotification(notification: Notification) {
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

// API response validation
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
  const json = await response.json();
  
  const apiResult = apiResponseSchema.parse(json);
  
  if (!apiResult.success) {
    throw new Error(apiResult.error?.message || 'Unknown error');
  }
  
  return userSchema.parse(apiResult.data);
}

// Form validation
const loginFormSchema = v.object({
  username: v.string().min(3).max(20),
  password: v.string().min(8),
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

// Advanced VLD TypeScript Features
console.log('🚀 Advanced VLD TypeScript Features Demo\n');

// Object schema methods with TypeScript
const baseUserSchema = v.object({
  name: v.string(),
  email: v.string().email(),
  age: v.number(),
  role: v.string()
});

// Pick creates new schema with selected fields
const publicUserSchema = baseUserSchema.pick('name', 'age');
type PublicUser = Infer<typeof publicUserSchema>; // { name: string; age: number }

// Omit creates new schema without specified fields  
const safeUserSchema = baseUserSchema.omit('email', 'role');
type SafeUser = Infer<typeof safeUserSchema>; // { name: string; age: number }

// Extend adds new fields to existing schema
const extendedUserSchema = baseUserSchema.extend({
  isVerified: v.boolean().default(false),
  lastLogin: v.date().optional(),
  metadata: v.record(v.any()).default({})
});
type ExtendedUser = Infer<typeof extendedUserSchema>;

// Intersection combines multiple schemas
const adminRoleSchema = v.object({
  permissions: v.array(v.string()),
  adminLevel: v.number().min(1).max(5)
});

const adminUserSchema = v.intersection(baseUserSchema, adminRoleSchema);
type AdminUser = Infer<typeof adminUserSchema>; // Combined type

// Advanced validation with refine and transform
const passwordSchema = v.string()
  .min(8, 'Password too short')
  .refine(pwd => /[A-Z]/.test(pwd), 'Must contain uppercase letter')
  .refine(pwd => /[0-9]/.test(pwd), 'Must contain number')
  .refine(pwd => /[!@#$%^&*]/.test(pwd), 'Must contain special character');

const emailNormalizationSchema = v.string()
  .transform(email => email.toLowerCase().trim())
  .refine(email => email.includes('@'), 'Invalid email format')
  .transform(email => email.replace(/\+.*@/, '@')); // Remove plus addressing

// Complex API schema with all features
const complexApiSchema = v.object({
  // Basic fields with coercion
  userId: v.coerce.bigint(),
  username: v.coerce.string()
    .transform(s => s.trim().toLowerCase())
    .refine(s => /^[a-z0-9_]+$/.test(s), 'Invalid username format'),
  
  // Email with normalization
  email: emailNormalizationSchema,
  
  // Password with validation
  password: passwordSchema,
  
  // Age with fallback
  age: v.coerce.number()
    .min(13, 'Too young')
    .max(120, 'Too old')  
    .catch(null),
    
  // Collections with advanced types
  roles: v.set(v.enum('user', 'admin', 'moderator')).default(new Set(['user'])),
  preferences: v.record(v.union(v.string(), v.number(), v.boolean())).default({}),
  tags: v.array(v.string()).max(10).default([]),
  
  // Tuple for coordinates
  location: v.tuple(v.number(), v.number()).optional(),
  
  // Nested object with defaults
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

// Type-safe API handler
async function createComplexUser(input: unknown): Promise<ComplexApiUser> {
  try {
    return complexApiSchema.parse(input);
  } catch (error) {
    console.error('Validation failed:', error.message);
    throw error;
  }
}

// Schema composition patterns
const timestampMixin = v.object({
  createdAt: v.date().default(() => new Date()),
  updatedAt: v.date().default(() => new Date())
});

const auditMixin = v.object({
  createdBy: v.string(),
  updatedBy: v.string().optional()
});

// Combine mixins with intersection
const auditableUserSchema = v.intersection(
  v.intersection(userSchema, timestampMixin),
  auditMixin
);

type AuditableUser = Infer<typeof auditableUserSchema>;

// Real-world e-commerce product schema
const productSchema = v.object({
  id: v.coerce.string(),
  name: v.string().min(1).max(200),
  description: v.string().max(2000).default(''),
  price: v.coerce.number().positive(),
  currency: v.enum('USD', 'EUR', 'GBP').default('USD'),
  
  // Categories as a set for uniqueness
  categories: v.set(v.string()).min(1),
  
  // Tags as array
  tags: v.array(v.string()).max(20).default([]),
  
  // Variants using record
  variants: v.record(v.object({
    price: v.number().positive(),
    stock: v.number().nonnegative(),
    sku: v.string()
  })).default({}),
  
  // Dimensions as tuple
  dimensions: v.tuple(v.number(), v.number(), v.number()).optional(),
  
  // Weight in grams as BigInt for precision
  weightGrams: v.coerce.bigint().positive().optional(),
  
  // Availability with fallback
  isAvailable: v.boolean().default(true),
  
  // Stock with coercion and fallback
  stock: v.coerce.number().nonnegative().catch(0),
  
  // Metadata as flexible record
  metadata: v.record(v.any()).default({})
});

type Product = Infer<typeof productSchema>;

// Product management schemas using pick/omit/extend
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

// Type-safe API responses
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
  ProductListResponse
};