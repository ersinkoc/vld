import { v, Infer } from '@oxog/vld';

// Define schema
const userSchema = v.object({
  id: v.string().uuid(),
  name: v.string().min(2).max(100),
  email: v.string().email(),
  age: v.number().int().positive(),
  role: v.enum('admin', 'user', 'guest'),
  isActive: v.boolean(),
  metadata: v.optional(v.object({
    lastLogin: v.date(),
    preferences: v.object({
      theme: v.enum('light', 'dark', 'auto'),
      notifications: v.boolean()
    })
  })),
  tags: v.array(v.string()).max(10)
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

export { User, Notification, ApiResponse, LoginForm };