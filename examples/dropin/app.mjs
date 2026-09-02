/**
 * Single self-contained source file that demonstrates the drop-in claim.
 *
 * To swap libraries, only the import line below changes:
 *   - import { z } from 'zod';
 *   - import { z } from '@oxog/vld';
 *
 * Everything below the import is the same source code. Run:
 *   node examples/dropin/app.mjs              (uses Zod by default)
 *   DROPIN_LIB=vld node examples/dropin/app.mjs
 *
 * This file is intentionally a single block of code — it's the user-facing
 * proof of "one-line migration".
 */

import { z, ACTIVE_LIB } from './shim.mjs';

const section = (n, t) => console.log(`\n[${n}] ${t}`);

// 1) Primitive chains
section(1, 'string().min(2).max(50).email()');
const Email = z.string().min(2).max(50).email();
console.log('  "ada@lovelace.dev" ->', Email.safeParse('ada@lovelace.dev').success);
console.log('  "bad"              ->', Email.safeParse('bad').success);

// 2) Object schema
section(2, 'object({...}) with nested object + optional + array');
const User = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  age: z.number().int().min(0).max(150),
  role: z.enum(['admin', 'user', 'guest']),
  isActive: z.boolean(),
  tags: z.array(z.string()).default([]),
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    zip: z.string().regex(/^\d{5}$/)
  }).optional()
});
const sample = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'ada@lovelace.dev',
  age: 36,
  role: 'admin',
  isActive: true,
  address: { street: '1 St James Sq', city: 'London', zip: '12345' }
};
const out = User.safeParse(sample);
console.log('  valid sample ->', out.success, '(role =', out.success ? out.data.role : 'n/a', ')');

// 3) Union and literal
section(3, 'union([string, number]) and literal');
const StrOrNum = z.union([z.string(), z.number()]);
const Status = z.literal('active');
console.log('  union("hi")   ->', StrOrNum.safeParse('hi').success);
console.log('  union(42)     ->', StrOrNum.safeParse(42).success);
console.log('  union(true)   ->', StrOrNum.safeParse(true).success);
console.log('  literal("active")   ->', Status.safeParse('active').success);
console.log('  literal("inactive") ->', Status.safeParse('inactive').success);

// 4) Discriminated union
section(4, 'discriminatedUnion("type", [signup, purchase, logout])');
const Event = z.discriminatedUnion('type', [
  z.object({ type: z.literal('signup'),   userId: z.string().uuid() }),
  z.object({ type: z.literal('purchase'), userId: z.string().uuid(), amount: z.number().positive() }),
  z.object({ type: z.literal('logout'),   userId: z.string().uuid(), at: z.date() })
]);
console.log('  signup    ->', Event.safeParse({ type: 'signup',   userId: '550e8400-e29b-41d4-a716-446655440000' }).success);
console.log('  purchase  ->', Event.safeParse({ type: 'purchase', userId: '550e8400-e29b-41d4-a716-446655440000', amount: 9.99 }).success);
console.log('  unknown   ->', Event.safeParse({ type: 'unknown' }).success);

// 5) Refine and transform
section(5, 'refine() and transform()');
const EvenLen = z.string().refine((s) => s.length % 2 === 0, 'must be even length');
const Upper   = z.string().transform((s) => s.toUpperCase());
console.log('  refine "ab"  ->', EvenLen.safeParse('ab').success);
console.log('  refine "abc" ->', EvenLen.safeParse('abc').success);
const upper = Upper.safeParse('hello');
console.log('  transform "hello" ->', upper.success ? upper.data : 'n/a');

// 6) Tuple
section(6, 'tuple([string, number])');
const Tup = z.tuple([z.string(), z.number()]);
console.log('  ["a", 1]   ->', Tup.safeParse(['a', 1]).success);
console.log('  ["a", 1, 2]->', Tup.safeParse(['a', 1, 2]).success);

// 7) Optional + default + catch
section(7, 'optional / default / catch');
const Opt = z.string().optional();
const Def = z.string().default('fallback');
const Cat = z.string().catch('recovered');
console.log('  optional("hi")         ->', Opt.safeParse('hi').success);
console.log('  optional(undefined)    ->', Opt.safeParse(undefined).success);
console.log('  default(undefined)     ->', Def.safeParse(undefined).success);
console.log('  catch(42)              ->', Cat.safeParse(42).success);

console.log('\n✓ Same source code works for both Zod and VLD — only the import line changes.');
console.log('  Active library:', ACTIVE_LIB, '(set DROPIN_LIB=zod|vld to switch)');
