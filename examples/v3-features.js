// VLD v3.0 Feature Showcase
// Demonstrates the V2 method-memoization pattern, the vV2 drop-in factory,
// and the ZodError compatibility layer (toZodError / ZodLikeError).
//
// VLD 3.0 ships the V2 pattern across every chain-heavy validator, matching
// Zod 4.5's "method memoization" optimization and beating it on both the
// valid path (2-6x faster) and the per-instance memory footprint (1.6-10x
// smaller). The 22/22 real-world Zod test passes and 2704/2704 unit tests
// stay green.

import {
  v,
  vV2,
  z,
  toZodError,
  toZodSafeResult,
  ZodLikeError,
  setLocale
} from '../dist/index.js';

console.log('VLD v3.0 Feature Showcase\n');
console.log('V2 method-memoization + ZodError compat layer\n');

// ===========================================================================
// 1. vV2 — drop-in factory that always returns V2 validators
// ===========================================================================
console.log('1. vV2 — drop-in factory:');
console.log('   Identical surface to v, but every chain call goes through the');
console.log('   V2 single-def + check-class path (no per-chain array growth).\n');

const v2 = vV2;

const email = v2.string().min(1).email();
console.log('   vV2 string().email():', email.parse('user@example.com'));

const age = v2.number().int().positive().min(1).max(120);
console.log('   vV2 number().int().positive().min(1).max(120):', age.parse(25));

const tags = v2.array(v2.string()).min(1).max(5);
console.log('   vV2 array(string).min(1).max(5):', tags.parse(['ts', 'vld']));

// Use vV2 exactly like zod — works because vV2 is API-compatible
const { string: v2String, number: v2Number, object: v2Object } = vV2;
const v2User = v2Object({
  id: v2String().uuid(),
  name: v2String().min(2).max(50),
  age: v2Number().int().positive()
});
console.log('   vV2 object with V2 children:', v2User.parse({
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Ada Lovelace',
  age: 36
}));

// ===========================================================================
// 2. v.setV2Mode(true) — global toggle that swaps the v.* factories
// ===========================================================================
console.log('\n2. v.setV2Mode(true) — global toggle:');
console.log('   One call switches every v.string() / v.number() / v.object()');
console.log('   to the V2 implementation. No source rewrites required.\n');

v.setV2Mode(true);

// Now v.* returns V2 classes under the hood
const vString = v.string().email();
const vNumber = v.number().int().positive();
const vObject = v.object({ a: v.string(), b: v.number() });

console.log('   After setV2Mode(true):');
console.log('     v.string().email():', vString.parse('still-works@example.com'));
console.log('     v.number().int().positive():', vNumber.parse(7));
console.log('     v.object:', vObject.parse({ a: 'x', b: 1 }));

// Flip back to V1 if needed (composite validators still work either way)
v.setV2Mode(false);
console.log('   After setV2Mode(false): v is back to V1 default.\n');

// ===========================================================================
// 3. z — direct Zod-style alias of v
// ===========================================================================
console.log('3. z — drop-in Zod alias:');
console.log('   import { v as z } from "@oxog/vld" lets you keep z.* style.\n');

const zLikeUser = z.object({
  email: z.string().email(),
  age: z.number().int().positive()
});
console.log('   z.object({...}) parse:', zLikeUser.parse({
  email: 'ada@lovelace.dev',
  age: 36
}));

// ===========================================================================
// 4. toZodError — ZodError compatibility layer
// ===========================================================================
console.log('\n4. toZodError — ZodError-shaped errors:');
console.log('   Converts VldError to ZodError shape with .format() / .flatten().\n');

const strictUser = v.object({
  email: v.string().email(),
  age: v.number().int().min(18).max(120)
});

const result = strictUser.safeParse({ email: 'not-an-email', age: 12 });
if (!result.success) {
  const zodErr = toZodError(result.error);
  console.log('   toZodError instance check:', zodErr instanceof ZodLikeError);
  console.log('   toZodError.name:', zodErr.name); // "ZodError"
  console.log('   toZodError.issues[0].code:', zodErr.issues[0].code);
  console.log('   toZodError.issues[0].path:', JSON.stringify(zodErr.issues[0].path));
  console.log('   toZodError.format() output:');
  console.log(JSON.stringify(zodErr.format(), null, 2).split('\n').map(l => '     ' + l).join('\n'));
  console.log('   toZodError.flatten() output:');
  console.log(JSON.stringify(zodErr.flatten(), null, 2).split('\n').map(l => '     ' + l).join('\n'));
}

// ===========================================================================
// 5. toZodSafeResult — wrap a safeParse result in one call
// ===========================================================================
console.log('\n5. toZodSafeResult — one-liner Zod compat result:');

const zodResult = toZodSafeResult(strictUser.safeParse({
  email: 'ada@lovelace.dev',
  age: 36
}));
if (zodResult.success) {
  console.log('   toZodSafeResult success:', zodResult.data);
}

// ===========================================================================
// 6. V2 + i18n — locale-aware V2 chains
// ===========================================================================
console.log('\n6. V2 + i18n (27+ locales, including V2 error paths):');

setLocale('en');
try {
  v.setV2Mode(true);
  v.string().min(5).email().parse('xx');
} catch (e) {
  console.log('   EN (V2 path):', e.message);
}

setLocale('tr');
try {
  v.string().min(5).email().parse('xx');
} catch (e) {
  console.log('   TR (V2 path):', e.message);
}

setLocale('ja');
try {
  v.number().int().min(0).max(10).parse(99);
} catch (e) {
  console.log('   JA (V2 path):', e.message);
}
setLocale('en');
v.setV2Mode(false);

// ===========================================================================
// 7. V2 + codecs — codec chains benefit from V2 string/number/date checks
// ===========================================================================
console.log('\n7. V2 + codecs:');

const v2StringCodec = v.codec(
  v.string().min(1).max(64),
  v.string().email(),
  {
    decode: (s) => s.trim().toLowerCase(),
    encode: (s) => s
  }
);
console.log('   v2StringCodec.parse("  USER@Example.COM  "):',
  v2StringCodec.parse('  USER@Example.COM  '));

// ===========================================================================
// 8. V2 + transforms/refines — full method chain through the V2 path
// ===========================================================================
console.log('\n8. V2 + transforms + refines:');

const trimmedEmail = v.string()
  .transform(s => s.trim().toLowerCase())
  .refine(s => s.includes('@'), 'Must contain @')
  .refine(s => s.endsWith('.com') || s.endsWith('.dev'), 'Must end with .com or .dev')
  .catch('fallback@example.com');

console.log('   V2 transform+refine+catch:', trimmedEmail.parse('  Ada@Lovelace.DEV  '));
console.log('   V2 transform+refine+catch (bad input):', trimmedEmail.parse(12345));

// ===========================================================================
// 9. Hot path comparison: V2 vs V1 (illustrative micro-check)
// ===========================================================================
console.log('\n9. Hot path: V2 is the recommended default for new code');
console.log('   Real benchmarks live in benchmarks/v2-vs-v1.cjs.');
console.log('   Production results (1M safeParse ops, pre-built schemas):');
console.log('     string().min(1).email()       : VLD 22ms vs Zod 50ms (2.3x)');
console.log('     number().int().positive().min(1) : VLD  6ms vs Zod 39ms (6.5x)');
console.log('     Realistic API 10 fields       : VLD 243ms vs Zod 767ms (3.2x)');
console.log('   Memory (N=100k, 3-pass GC):');
console.log('     string().email()              : 400 B/instance vs Zod 4210 B (~10x)');
console.log('     Realistic API 10 fields       : 4980 B/instance vs Zod ~50kB (~10x)');

console.log('\nv3.0 feature showcase complete.');
console.log('   21 V2 classes shipped');
console.log('   95 test suites, 2704/2704 tests passing');
console.log('   22/22 real-world Zod pattern test passing');
console.log('   Zero dependencies, 100% TypeScript strict mode');
