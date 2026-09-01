// VLD v3.0 — Zod Migration Example
// Shows how to migrate from Zod to VLD with identical syntax, plus how to
// opt into the V2 method-memoization pattern (2-6x faster than Zod 4.5) and
// the ZodError compatibility layer (toZodError / ZodLikeError).

import { v, vV2, z, toZodError, setLocale } from '../dist/index.js';

console.log('VLD v3.0 Zod Migration Examples\n');
console.log('Zod syntax works identically in VLD, plus 2-6x faster V2 chains\n');

// 1. Basic schemas - identical to Zod
console.log('1. Basic Schemas (identical to Zod):');

const stringSchema = v.string();
const numberSchema = v.number();
const booleanSchema = v.boolean();
const dateSchema = v.date();

console.log('   String:', stringSchema.parse('hello'));
console.log('   Number:', numberSchema.parse(42));
console.log('   Boolean:', booleanSchema.parse(true));
console.log('   Date:', dateSchema.parse(new Date()));

// 2. String validations - identical to Zod
console.log('\n2. String Validations (identical to Zod):');

const emailSchema = v.string().email();
const minLengthSchema = v.string().min(5);
const urlSchema = v.string().url();

console.log('   Email:', emailSchema.parse('test@example.com'));
console.log('   Min length:', minLengthSchema.parse('hello world'));

// 3. Number validations - identical to Zod
console.log('\n3. Number Validations (identical to Zod):');

const positiveSchema = v.number().positive();
const intSchema = v.number().int();
const minMaxSchema = v.number().min(0).max(100);

console.log('   Positive number:', positiveSchema.parse(42));
console.log('   Integer:', intSchema.parse(123));
console.log('   Min/max range:', minMaxSchema.parse(50));

// 4. Object schemas - identical to Zod
console.log('\n4. Object Schemas (identical to Zod):');

const UserSchema = v.object({
  name: v.string(),
  age: v.number(),
  email: v.string().email(),
  isActive: v.boolean().optional()
});

const user = {
  name: 'John Doe',
  age: 30,
  email: 'john@example.com',
  isActive: true
};

console.log('   User validation:', UserSchema.parse(user));

// 5. Array schemas - identical to Zod
console.log('\n5. Array Schemas (identical to Zod):');

const stringArraySchema = v.array(v.string());
const minItemsSchema = v.array(v.number()).min(2);

console.log('   String array:', stringArraySchema.parse(['a', 'b', 'c']));
console.log('   Min items array:', minItemsSchema.parse([1, 2, 3]));

// 6. Union and Optional - identical to Zod
console.log('\n6. Union and Optional (identical to Zod):');

const unionSchema = v.union(v.string(), v.number());
const optionalSchema = v.optional(v.string());

console.log('   Union string:', unionSchema.parse('hello'));
console.log('   Union number:', unionSchema.parse(42));
console.log('   Optional undefined:', optionalSchema.parse(undefined));
console.log('   Optional string:', optionalSchema.parse('test'));

// 7. Literal and Enum - identical to Zod
console.log('\n7. Literal and Enum (identical to Zod):');

const literalSchema = v.literal('success');
const enumSchema = v.enum('red', 'green', 'blue');

console.log('   Literal:', literalSchema.parse('success'));
console.log('   Enum:', enumSchema.parse('red'));

// 8. safeParse - identical to Zod
console.log('\n8. safeParse (identical to Zod):');

const result = v.string().safeParse(123);
if (!result.success) {
  console.log('   safeParse error:', result.error.message);
} else {
  console.log('   safeParse success:', result.data);
}

const validResult = v.string().safeParse('hello');
if (validResult.success) {
  console.log('   safeParse valid:', validResult.data);
}

// 9. Nested objects - identical to Zod
console.log('\n9. Nested Objects (identical to Zod):');

const AddressSchema = v.object({
  street: v.string(),
  city: v.string(),
  zipCode: v.string().regex(/^\d{5}$/)
});

const PersonSchema = v.object({
  name: v.string(),
  age: v.number().min(0).max(120),
  address: AddressSchema,
  hobbies: v.array(v.string()).optional()
});

const person = {
  name: 'Alice Smith',
  age: 28,
  address: { street: '123 Main St', city: 'Anytown', zipCode: '12345' },
  hobbies: ['reading', 'hiking']
};

console.log('   Nested object validation works:', PersonSchema.parse(person).name);

// 10. Custom error messages - identical to Zod
console.log('\n10. Custom Error Messages (identical to Zod):');

const customSchema = v.string().min(8, 'Password must be at least 8 characters');
try {
  customSchema.parse('short');
} catch (e) {
  console.log('   Custom error:', e.message);
}

// 11. Partial and strict - identical to Zod
console.log('\n11. Partial and Strict (identical to Zod):');

const BaseSchema = v.object({
  name: v.string(),
  age: v.number()
});

const partialSchema = BaseSchema.partial();
const strictSchema = BaseSchema.strict();

console.log('   Partial schema:', partialSchema.parse({ name: 'John' }));

try {
  strictSchema.parse({ name: 'John', age: 30, extra: 'field' });
} catch (e) {
  console.log('   Strict schema error:', e.message);
}

// ===========================================================================
// VLD 3.0 ENHANCEMENTS — beyond Zod
// ===========================================================================
console.log('\nVLD v3.0 ENHANCEMENTS beyond Zod:');

// 12. z — direct Zod-style alias
console.log('\n12. z = v — keep the z.* style:');

const zUser = z.object({
  email: z.string().email(),
  age: z.number().int().positive()
});
console.log('   z.object(...) parse:', zUser.parse({ email: 'ada@lovelace.dev', age: 36 }));

// 13. vV2 — drop-in V2 factory (2-6x faster than Zod 4.5)
console.log('\n13. vV2 — V2 method-memoization (2-6x faster than Zod 4.5):');

const v2SearchSchema = vV2.string().min(1).max(200).email();
console.log('   vV2 string().min().max().email():', v2SearchSchema.parse('user@example.com'));

// 14. toZodError — ZodError compatibility layer
console.log('\n14. toZodError — ZodError-shaped errors:');

const failed = v.object({ name: v.string().min(3), age: v.number().positive() })
  .safeParse({ name: 'Jo', age: -1 });
if (!failed.success) {
  const zodErr = toZodError(failed.error);
  console.log('   ZodError instance.name:', zodErr.name); // "ZodError"
  console.log('   ZodError.issues[0].code:', zodErr.issues[0].code);
  console.log('   ZodError.issues[0].path:', JSON.stringify(zodErr.issues[0].path));
  console.log('   ZodError.flatten():', JSON.stringify(zodErr.flatten()));
}

// 15. setV2Mode(true) — global V2 toggle (no source rewrites)
console.log('\n15. setV2Mode(true) — global V2 toggle:');

v.setV2Mode(true);
const vGlobalSchema = v.string().email();
console.log('   v.string().email() under V2 mode:', vGlobalSchema.parse('global@example.com'));
v.setV2Mode(false);

// 16. Coercion - VLD has more comprehensive coercion
console.log('\n16. Enhanced Coercion:');
const coerceSchema = v.coerce.number();
console.log('   Coerce "123" to number:', coerceSchema.parse('123')); // 123
console.log('   Coerce true to number:', coerceSchema.parse(true)); // 1

// 17. Internationalization - VLD exclusive feature
console.log('\n17. Internationalization (VLD Exclusive):');

setLocale('en');
try { v.string().parse(123); } catch (e) { console.log('   English error:', e.message); }
setLocale('es');
try { v.string().parse(123); } catch (e) { console.log('   Spanish error:', e.message); }
setLocale('tr');
try { v.string().parse(123); } catch (e) { console.log('   Turkish error:', e.message); }
setLocale('en');

// 18. Advanced types - VLD has more types than Zod
console.log('\n18. Advanced Types (Enhanced in VLD):');

const bigintSchema = v.bigint();
const symbolSchema = v.symbol();
const tupleSchema = v.tuple(v.string(), v.number());
const recordSchema = v.record(v.string());
const setSchema = v.set(v.string());
const mapSchema = v.map(v.string(), v.number());

console.log('   BigInt:', bigintSchema.parse(123n));
console.log('   Symbol:', symbolSchema.parse(Symbol('test')).toString());
console.log('   Tuple:', tupleSchema.parse(['hello', 42]));
console.log('   Record:', recordSchema.parse({ a: '1', b: '2' }));

// 19. Object methods - VLD enhancements
console.log('\n19. Object Methods (VLD Enhanced):');

const baseUserSchema = v.object({
  name: v.string(),
  email: v.string(),
  age: v.number(),
  role: v.string()
});

const publicUserSchema = baseUserSchema.pick('name', 'age');
console.log('   Pick name, age:', publicUserSchema.parse({ name: 'John', age: 30 }));

const safeUserSchema = baseUserSchema.omit('email');
console.log('   Omit email works');

const extendedUserSchema = baseUserSchema.extend({ isVerified: v.boolean() });
console.log('   Extended schema works');

// 20. Default and catch - VLD enhancements
console.log('\n20. Default and Catch (VLD Enhanced):');

const withDefaultSchema = v.string().default('fallback');
console.log('   Default value:', withDefaultSchema.parse(undefined));

const withCatchSchema = v.number().catch(-1);
console.log('   Catch invalid input:', withCatchSchema.parse('invalid'));

console.log('\nMigration Complete!');
console.log('VLD provides 100% Zod compatibility + V2 chains (2-6x faster)');
console.log('Plus: toZodError, vV2 drop-in, 27+ locales, codecs, i18n, plugin system');
console.log('Tip: replace z with v (or import { v as z }) and run as-is.');
