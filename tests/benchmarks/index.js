import { v } from '../../dist/index.js';

console.log('🚀 VLD Performance Benchmarks\n');

// Simple benchmarks
function benchmark(name, fn, iterations = 100000) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();
  const time = end - start;
  const opsPerSec = Math.round((iterations / time) * 1000);
  console.log(`${name}: ${time.toFixed(2)}ms for ${iterations} iterations (${opsPerSec.toLocaleString()} ops/sec)`);
}

// Test schemas
const stringSchema = v.string().min(5).max(100).email();
const numberSchema = v.number().positive().int().min(1).max(1000);
const objectSchema = v.object({
  name: v.string().min(2),
  age: v.number().positive().int(),
  email: v.string().email(),
  isActive: v.boolean()
});

const complexSchema = v.object({
  id: v.string().uuid(),
  user: v.object({
    firstName: v.string().min(1).max(50),
    lastName: v.string().min(1).max(50),
    email: v.string().email(),
    age: v.number().int().min(0).max(150),
    roles: v.array(v.string()),
    metadata: v.record(v.string())
  }),
  timestamps: v.object({
    created: v.date(),
    updated: v.optional(v.date())
  }),
  tags: v.array(v.string()).min(1).max(10),
  status: v.enum(['active', 'inactive', 'pending'])
});

// Test data
const validEmail = 'test@example.com';
const validNumber = 42;
const validObject = {
  name: 'John Doe',
  age: 30,
  email: 'john@example.com',
  isActive: true
};

const complexData = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  user: {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    age: 28,
    roles: ['admin', 'user'],
    metadata: { theme: 'dark', language: 'en' }
  },
  timestamps: {
    created: new Date(),
    updated: new Date()
  },
  tags: ['important', 'reviewed'],
  status: 'active'
};

console.log('Simple Validations:');
benchmark('String validation', () => stringSchema.safeParse(validEmail));
benchmark('Number validation', () => numberSchema.safeParse(validNumber));
benchmark('Object validation', () => objectSchema.safeParse(validObject));

console.log('\nComplex Validations:');
benchmark('Complex nested object', () => complexSchema.safeParse(complexData), 10000);

console.log('\nCoercion Performance:');
benchmark('String coercion', () => v.coerce.string().safeParse(123));
benchmark('Number coercion', () => v.coerce.number().safeParse('456'));
benchmark('Boolean coercion', () => v.coerce.boolean().safeParse('true'));

console.log('\nAdvanced Types:');
const tupleSchema = v.tuple(v.string(), v.number(), v.boolean());
const recordSchema = v.record(v.string());
const setSchema = v.set(v.number());

benchmark('Tuple validation', () => tupleSchema.safeParse(['test', 123, true]));
benchmark('Record validation', () => recordSchema.safeParse({ a: 'test', b: 'value' }));
benchmark('Set validation', () => setSchema.safeParse(new Set([1, 2, 3])));

console.log('\n✅ Performance benchmarks completed!');