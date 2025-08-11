// VLD Advanced Features Examples
// Demonstrates new Zod-compatible features like coercion, intersections, transforms, etc.

import { v } from '../dist/index.js';

console.log('🚀 VLD Advanced Features Examples\n');

// 1. Type Coercion Examples
console.log('1. Type Coercion:');

// String coercion
const stringSchema = v.coerce.string();
console.log('   v.coerce.string().parse(123):', stringSchema.parse(123)); // "123"
console.log('   v.coerce.string().parse(true):', stringSchema.parse(true)); // "true"

// Number coercion  
const numberSchema = v.coerce.number();
console.log('   v.coerce.number().parse("123"):', numberSchema.parse("123")); // 123
console.log('   v.coerce.number().parse(true):', numberSchema.parse(true)); // 1

// Boolean coercion
const boolSchema = v.coerce.boolean();
console.log('   v.coerce.boolean().parse("true"):', boolSchema.parse("true")); // true
console.log('   v.coerce.boolean().parse("0"):', boolSchema.parse("0")); // false

// BigInt coercion
const bigintSchema = v.coerce.bigint();
console.log('   v.coerce.bigint().parse("999"):', bigintSchema.parse("999")); // 999n

// Date coercion
const dateSchema = v.coerce.date();
console.log('   v.coerce.date().parse("2023-01-01"):', dateSchema.parse("2023-01-01")); // Date object

console.log('\n');

// 2. Advanced Types
console.log('2. Advanced Types:');

// Tuple validation
const coordSchema = v.tuple(v.number(), v.number());
console.log('   Tuple [1, 2]:', coordSchema.parse([1, 2])); // [1, 2]

// Record validation
const configSchema = v.record(v.string());
console.log('   Record {a: "1", b: "2"}:', configSchema.parse({a: "1", b: "2"}));

// Set validation
const tagSchema = v.set(v.string());
console.log('   Set ["a", "b"]:', Array.from(tagSchema.parse(new Set(["a", "b"]))));

// Map validation  
const mapSchema = v.map(v.string(), v.number());
const testMap = new Map([["a", 1], ["b", 2]]);
console.log('   Map entries:', Array.from(mapSchema.parse(testMap).entries()));

// BigInt validation
const bigIntSchema = v.bigint();
console.log('   BigInt 123n:', bigIntSchema.parse(123n)); // 123n

// Symbol validation
const symSchema = v.symbol();
const testSymbol = Symbol('test');
console.log('   Symbol:', symSchema.parse(testSymbol).toString()); // Symbol(test)

console.log('\n');

// 3. Intersection Types
console.log('3. Intersection Types:');

const baseUser = v.object({
  id: v.string(),
  name: v.string()
});

const adminUser = v.object({
  role: v.literal('admin'),
  permissions: v.array(v.string())
});

const adminSchema = v.intersection(baseUser, adminUser);

const admin = {
  id: '123',
  name: 'John Admin',
  role: 'admin', 
  permissions: ['read', 'write', 'delete']
};

console.log('   Admin user:', adminSchema.parse(admin));
console.log('\n');

// 4. Custom Validation with refine()
console.log('4. Custom Validation (refine):');

const positiveNumberSchema = v.number()
  .refine(n => n > 0, "Number must be positive");

console.log('   Positive 5:', positiveNumberSchema.parse(5)); // 5

try {
  positiveNumberSchema.parse(-1);
} catch (e) {
  console.log('   Negative error:', e.message);
}

const emailSchema = v.string()
  .refine(s => s.includes('@'), 'Must contain @')
  .refine(s => s.includes('.'), 'Must contain domain');

console.log('   Email test@example.com:', emailSchema.parse('test@example.com'));

console.log('\n');

// 5. Data Transformation
console.log('5. Data Transformation (transform):');

const upperCaseSchema = v.string()
  .transform(s => s.toUpperCase());

console.log('   "hello" -> uppercase:', upperCaseSchema.parse('hello')); // "HELLO"

const userTransformSchema = v.object({
  firstName: v.string(),
  lastName: v.string()
}).transform(user => ({
  ...user,
  fullName: `${user.firstName} ${user.lastName}`
}));

const user = { firstName: 'John', lastName: 'Doe' };
console.log('   User with fullName:', userTransformSchema.parse(user));

console.log('\n');

// 6. Default Values
console.log('6. Default Values:');

const withDefaultSchema = v.string().default('fallback');
console.log('   undefined -> default:', withDefaultSchema.parse(undefined)); // "fallback"
console.log('   "actual" -> actual:', withDefaultSchema.parse('actual')); // "actual"

const userWithDefaultsSchema = v.object({
  name: v.string(),
  role: v.string().default('user'),
  isActive: v.boolean().default(true)
});

const partialUser = { name: 'Alice' };
console.log('   User with defaults:', userWithDefaultsSchema.parse(partialUser));

console.log('\n');

// 7. Catch for Error Recovery  
console.log('7. Catch for Error Recovery:');

const safeNumberSchema = v.number().catch(-1);
console.log('   Valid number 42:', safeNumberSchema.parse(42)); // 42
console.log('   Invalid "abc" -> fallback:', safeNumberSchema.parse("abc")); // -1

const complexCatchSchema = v.string()
  .min(5)
  .transform(s => s.toUpperCase())
  .catch('ERROR');

console.log('   Valid "hello":', complexCatchSchema.parse('hello')); // "HELLO"
console.log('   Invalid "hi" -> catch:', complexCatchSchema.parse('hi')); // "ERROR"

console.log('\n');

// 8. Object Schema Methods
console.log('8. Object Schema Methods:');

const fullUserSchema = v.object({
  name: v.string(),
  email: v.string(),
  age: v.number(),
  role: v.string()
});

// Pick specific fields
const publicSchema = fullUserSchema.pick('name', 'age');
console.log('   Picked schema fields:', Object.keys(publicSchema.shape || {}));

// Omit sensitive fields
const safeSchema = fullUserSchema.omit('email', 'role');
console.log('   Omitted schema parse:', safeSchema.parse({ name: 'John', age: 30 }));

// Extend with new fields
const extendedSchema = fullUserSchema.extend({
  isActive: v.boolean(),
  metadata: v.record(v.any())
});

const extendedUser = {
  name: 'Jane',
  email: 'jane@example.com', 
  age: 25,
  role: 'admin',
  isActive: true,
  metadata: { theme: 'dark' }
};

console.log('   Extended schema:', extendedSchema.parse(extendedUser));

console.log('\n');

// 9. Method Chaining
console.log('9. Advanced Method Chaining:');

const complexSchema = v.string()
  .min(3)
  .transform(s => s.trim().toLowerCase())
  .refine(s => s.includes('test'), 'Must contain "test"')
  .default('default-test')
  .catch('error-fallback');

console.log('   Valid "  HELLO-TEST  ":', complexSchema.parse('  HELLO-TEST  '));
console.log('   undefined -> default:', complexSchema.parse(undefined));
console.log('   Invalid "hi" -> catch:', complexSchema.parse('hi'));

console.log('\n');

// 10. Real-world Complex Example
console.log('10. Real-world API Schema:');

const apiUserSchema = v.object({
  id: v.coerce.string(),
  username: v.string()
    .min(3)
    .max(20)
    .refine(s => /^[a-zA-Z0-9_]+$/.test(s), 'Invalid username format'),
  email: v.coerce.string()
    .transform(s => s.toLowerCase().trim()),
  age: v.coerce.number()
    .min(13)
    .max(120)
    .catch(null),
  preferences: v.record(v.any()).default({}),
  roles: v.set(v.enum('user', 'admin', 'moderator'))
    .default(new Set(['user'])),
  createdAt: v.coerce.date(),
  profile: v.object({
    bio: v.string().max(500).default(''),
    location: v.optional(v.tuple(v.number(), v.number()))
  })
});

const apiInput = {
  id: 123, // Will be coerced to string
  username: 'johndoe',
  email: '  JOHN@EXAMPLE.COM  ', // Will be transformed
  age: '25', // Will be coerced to number
  createdAt: '2023-01-01',
  profile: {
    location: [40.7128, -74.0060] // NYC coordinates
  }
};

const result = apiUserSchema.parse(apiInput);
console.log('   API User Result:', {
  id: result.id,
  username: result.username,
  email: result.email,
  age: result.age,
  rolesCount: result.roles.size,
  hasProfile: !!result.profile
});

console.log('\n✅ All advanced features demonstrated successfully!');