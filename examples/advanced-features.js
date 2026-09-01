// VLD v3.0 — Advanced features
// Demonstrates V2 method-memoization chains, type coercion, intersections,
// transforms, refinements, and the vV2 drop-in factory.

import { v, vV2 } from '../dist/index.js';

console.log('VLD v3.0 Advanced Features Examples\n');

// 1. Type Coercion (V2 path: vV2.coerce.* for 2-6x faster hot path)
console.log('1. Type Coercion:');

const stringSchema = vV2.coerce.string();
console.log('   vV2.coerce.string().parse(123):', stringSchema.parse(123)); // "123"
console.log('   vV2.coerce.string().parse(true):', stringSchema.parse(true)); // "true"

const numberSchema = vV2.coerce.number();
console.log('   vV2.coerce.number().parse("123"):', numberSchema.parse('123')); // 123
console.log('   vV2.coerce.number().parse(true):', numberSchema.parse(true)); // 1

const boolSchema = v.coerce.boolean();
console.log('   v.coerce.boolean().parse("true"):', boolSchema.parse('true')); // true
console.log('   v.coerce.boolean().parse("0"):', boolSchema.parse('0')); // false

const bigintSchema = v.coerce.bigint();
console.log('   v.coerce.bigint().parse("999"):', bigintSchema.parse('999')); // 999n

const dateSchema = v.coerce.date();
console.log('   v.coerce.date().parse("2023-01-01"):', dateSchema.parse('2023-01-01')); // Date

console.log('\n');

// 2. Advanced Types
console.log('2. Advanced Types:');

const coordSchema = v.tuple(v.number(), v.number());
console.log('   Tuple [1, 2]:', coordSchema.parse([1, 2]));

const configSchema = v.record(v.string());
console.log('   Record {a: "1", b: "2"}:', configSchema.parse({ a: '1', b: '2' }));

const tagSchema = v.set(v.string());
console.log('   Set ["a", "b"]:', Array.from(tagSchema.parse(new Set(['a', 'b']))));

const mapSchema = v.map(v.string(), v.number());
const testMap = new Map([['a', 1], ['b', 2]]);
console.log('   Map entries:', Array.from(mapSchema.parse(testMap).entries()));

const bigIntSchema = v.bigint();
console.log('   BigInt 123n:', bigIntSchema.parse(123n));

const symSchema = v.symbol();
const testSymbol = Symbol('test');
console.log('   Symbol:', symSchema.parse(testSymbol).toString());

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

// 4. Custom Validation (V2 path: vV2 for the 2-6x speedup)
console.log('4. Custom Validation (V2):');

const positiveNumberSchema = vV2.number().refine(n => n > 0, 'Number must be positive');
console.log('   vV2 number refine positive 5:', positiveNumberSchema.parse(5));

try {
  positiveNumberSchema.parse(-1);
} catch (e) {
  console.log('   Negative error:', e.message);
}

const emailSchema = vV2.string()
  .refine(s => s.includes('@'), 'Must contain @')
  .refine(s => s.includes('.'), 'Must contain domain');

console.log('   V2 chained refine:', emailSchema.parse('test@example.com'));

console.log('\n');

// 5. Data Transformation (V2)
console.log('5. Data Transformation (V2):');

const upperCaseSchema = vV2.string().transform(s => s.toUpperCase());
console.log('   vV2 transform uppercase:', upperCaseSchema.parse('hello'));

const userTransformSchema = v.object({
  firstName: v.string(),
  lastName: v.string()
}).transform(user => ({
  ...user,
  fullName: `${user.firstName} ${user.lastName}`
}));

const user = { firstName: 'John', lastName: 'Doe' };
console.log('   Object transform:', userTransformSchema.parse(user));

console.log('\n');

// 6. Default Values
console.log('6. Default Values:');

const withDefaultSchema = v.string().default('fallback');
console.log('   undefined -> default:', withDefaultSchema.parse(undefined));
console.log('   "actual" -> actual:', withDefaultSchema.parse('actual'));

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
console.log('   Valid 42:', safeNumberSchema.parse(42));
console.log('   Invalid "abc" -> -1:', safeNumberSchema.parse('abc'));

const complexCatchSchema = v.string()
  .min(5)
  .transform(s => s.toUpperCase())
  .catch('ERROR');

console.log('   Valid "hello":', complexCatchSchema.parse('hello'));
console.log('   Invalid "hi" -> "ERROR":', complexCatchSchema.parse('hi'));

console.log('\n');

// 8. Object Schema Methods
console.log('8. Object Schema Methods:');

const fullUserSchema = v.object({
  name: v.string(),
  email: v.string(),
  age: v.number(),
  role: v.string()
});

const publicSchema = fullUserSchema.pick('name', 'age');
console.log('   Pick name, age:', publicSchema.parse({ name: 'John', age: 30 }));

const safeSchema = fullUserSchema.omit('email', 'role');
console.log('   Omit email, role:', safeSchema.parse({ name: 'John', age: 30 }));

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

// 9. V2 Method Chaining (recommended for new code)
console.log('9. V2 Method Chaining (vV2 chains):');

const complexV2Schema = vV2.string()
  .min(3)
  .transform(s => s.trim().toLowerCase())
  .refine(s => s.includes('test'), 'Must contain "test"')
  .default('default-test')
  .catch('error-fallback');

console.log('   vV2 valid "  HELLO-TEST  ":', complexV2Schema.parse('  HELLO-TEST  '));
console.log('   vV2 undefined -> default:', complexV2Schema.parse(undefined));
console.log('   vV2 invalid "hi" -> catch:', complexV2Schema.parse('hi'));

console.log('\n');

// 10. Real-world complex example using V2 children under a V1 object
console.log('10. Real-world API Schema (V2 children under object):');

const apiUserSchema = v.object({
  id: vV2.coerce.string(),
  username: vV2.string()
    .min(3)
    .max(20)
    .refine(s => /^[a-zA-Z0-9_]+$/.test(s), 'Invalid username format'),
  email: vV2.coerce.string()
    .transform(s => s.toLowerCase().trim()),
  age: vV2.coerce.number()
    .min(13)
    .max(120)
    .catch(null),
  preferences: v.record(v.any()).default({}),
  roles: v.set(v.enum('user', 'admin', 'moderator'))
    .default(new Set(['user'])),
  createdAt: vV2.coerce.date(),
  profile: v.object({
    bio: v.string().max(500).default(''),
    location: v.optional(v.tuple(v.number(), v.number()))
  })
});

const apiInput = {
  id: 123,
  username: 'johndoe',
  email: '  JOHN@EXAMPLE.COM  ',
  age: '25',
  createdAt: '2023-01-01',
  profile: {
    location: [40.7128, -74.0060]
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

console.log('\nAll advanced features demonstrated successfully.');
console.log('Tip: enable v.setV2Mode(true) to swap the entire v.* factory to V2.');
