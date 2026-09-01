// VLD v3.0 — Basic usage
// VLD is a drop-in replacement for Zod. The v.* factory returns V1
// validators (VLD legacy) for backward compatibility; vV2 is the V2
// method-memoization variant and is the recommended default for new code.
//
// Run: node examples/basic.js

import { v, vV2 } from '@oxog/vld';

// ----- V1 (legacy, default) -----
const nameSchema = v.string().min(2).max(50);
console.log(nameSchema.parse('John')); // 'John'

const ageSchema = v.number().int().positive().max(120);
console.log(ageSchema.parse(25)); // 25

// Email with transformation
const emailSchema = v.string().trim().toLowerCase().email();
console.log(emailSchema.parse('  JOHN@EXAMPLE.COM  ')); // 'john@example.com'

// Object validation (composite validators stay in V1; V2 children plug in transparently)
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

// ----- V2 (recommended for new code) -----
// vV2 returns V2 classes everywhere; same surface, 2-6x faster, ~10x less memory.
const v2Email = vV2.string().trim().toLowerCase().email();
console.log('vV2 email:', v2Email.parse('  ADA@LOVELACE.DEV  '));

const v2User = vV2.object({
  name: vV2.string().min(2),
  email: vV2.string().email(),
  age: vV2.number().int().positive()
});
console.log('vV2 object:', v2User.parse({
  name: 'Ada Lovelace',
  email: 'ada@lovelace.dev',
  age: 36
}));

// Global toggle: switch v.* to V2 everywhere
v.setV2Mode(true);
console.log('v.string().email() under V2 mode:', v.string().email().parse('global@example.com'));
v.setV2Mode(false);

// ----- ZodError compat (optional) -----
import { toZodError, ZodLikeError } from '@oxog/vld';
const failed = v.object({ name: v.string().min(2) }).safeParse({ name: 'J' });
if (!failed.success) {
  const zodErr = toZodError(failed.error);
  console.log('ZodError-shaped:', zodErr instanceof ZodLikeError, zodErr.name);
  console.log('ZodError format():', JSON.stringify(zodErr.format()));
  console.log('ZodError flatten():', JSON.stringify(zodErr.flatten()));
}
