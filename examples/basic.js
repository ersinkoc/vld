import { v } from '@oxog/vld';

// String validation
const nameSchema = v.string().min(2).max(50);
console.log(nameSchema.parse('John')); // 'John'

// Number validation  
const ageSchema = v.number().int().positive().max(120);
console.log(ageSchema.parse(25)); // 25

// Email with transformation
const emailSchema = v.string().trim().toLowerCase().email();
console.log(emailSchema.parse('  JOHN@EXAMPLE.COM  ')); // 'john@example.com'

// Object validation
const userSchema = v.object({
  name: v.string().min(2),
  email: v.string().email(),
  age: v.number().positive(),
  isActive: v.boolean()
});

const user = userSchema.parse({
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
  isActive: true
});
console.log(user);

// Safe parsing (no exceptions)
const result = userSchema.safeParse({ name: 'J' });
if (result.success) {
  console.log('Valid:', result.data);
} else {
  console.log('Invalid:', result.error.message);
}