/**
 * VLD Startup Time Benchmark
 * Measures library initialization and first-use performance
 */

const { performance } = require('perf_hooks');

console.log('⏱️  VLD vs Zod Startup Time Benchmark\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Measure VLD import time
const vldStartTime = performance.now();
const { v } = require('../dist');
const vldImportTime = performance.now() - vldStartTime;

// Measure Zod import time
const zodStartTime = performance.now();
const z = require('zod');
const zodImportTime = performance.now() - zodStartTime;

console.log('📦 Library Import Time:');
console.log(`  VLD: ${vldImportTime.toFixed(3)}ms`);
console.log(`  Zod: ${zodImportTime.toFixed(3)}ms`);

const importRatio = (zodImportTime / vldImportTime).toFixed(2);
if (importRatio > 1) {
  console.log(`  ✅ VLD imports ${importRatio}x faster\n`);
} else {
  console.log(`  ⚠️  Zod imports ${(1/importRatio).toFixed(2)}x faster\n`);
}

// Measure first schema creation
console.log('🔧 First Schema Creation:');

const vldSchemaStart = performance.now();
const vldSchema = v.object({
  id: v.string().uuid(),
  name: v.string().min(2).max(100),
  email: v.string().email(),
  age: v.number().positive().int(),
  active: v.boolean(),
  tags: v.array(v.string()),
  metadata: v.object({})
});
const vldSchemaTime = performance.now() - vldSchemaStart;

const zodSchemaStart = performance.now();
const zodSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  age: z.number().positive().int(),
  active: z.boolean(),
  tags: z.array(z.string()),
  metadata: z.object({})
});
const zodSchemaTime = performance.now() - zodSchemaStart;

console.log(`  VLD: ${vldSchemaTime.toFixed(3)}ms`);
console.log(`  Zod: ${zodSchemaTime.toFixed(3)}ms`);

const schemaRatio = (zodSchemaTime / vldSchemaTime).toFixed(2);
if (schemaRatio > 1) {
  console.log(`  ✅ VLD creates schemas ${schemaRatio}x faster\n`);
} else {
  console.log(`  ⚠️  Zod creates schemas ${(1/schemaRatio).toFixed(2)}x faster\n`);
}

// Measure first validation
console.log('✅ First Validation:');

const testData = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
  active: true,
  tags: ['developer', 'nodejs'],
  metadata: {}
};

const vldFirstStart = performance.now();
vldSchema.parse(testData);
const vldFirstTime = performance.now() - vldFirstStart;

const zodFirstStart = performance.now();
zodSchema.parse(testData);
const zodFirstTime = performance.now() - zodFirstStart;

console.log(`  VLD: ${vldFirstTime.toFixed(3)}ms`);
console.log(`  Zod: ${zodFirstTime.toFixed(3)}ms`);

const firstRatio = (zodFirstTime / vldFirstTime).toFixed(2);
if (firstRatio > 1) {
  console.log(`  ✅ VLD validates ${firstRatio}x faster on first run\n`);
} else {
  console.log(`  ⚠️  Zod validates ${(1/firstRatio).toFixed(2)}x faster on first run\n`);
}

// Measure warmed-up performance
console.log('🔥 Warmed-up Validation (average of 1000 runs):');

// Warm up both libraries
for (let i = 0; i < 100; i++) {
  vldSchema.parse(testData);
  zodSchema.parse(testData);
}

// Measure VLD warmed performance
const vldWarmStart = performance.now();
for (let i = 0; i < 1000; i++) {
  vldSchema.parse(testData);
}
const vldWarmTime = (performance.now() - vldWarmStart) / 1000;

// Measure Zod warmed performance
const zodWarmStart = performance.now();
for (let i = 0; i < 1000; i++) {
  zodSchema.parse(testData);
}
const zodWarmTime = (performance.now() - zodWarmStart) / 1000;

console.log(`  VLD: ${vldWarmTime.toFixed(3)}ms per validation`);
console.log(`  Zod: ${zodWarmTime.toFixed(3)}ms per validation`);

const warmRatio = (zodWarmTime / vldWarmTime).toFixed(2);
if (warmRatio > 1) {
  console.log(`  ✅ VLD is ${warmRatio}x faster when warmed up\n`);
} else {
  console.log(`  ⚠️  Zod is ${(1/warmRatio).toFixed(2)}x faster when warmed up\n`);
}

// Calculate total startup overhead
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('📊 Total Startup Overhead:');

const vldTotal = vldImportTime + vldSchemaTime + vldFirstTime;
const zodTotal = zodImportTime + zodSchemaTime + zodFirstTime;

console.log(`  VLD: ${vldTotal.toFixed(3)}ms`);
console.log(`  Zod: ${zodTotal.toFixed(3)}ms`);

const totalRatio = (zodTotal / vldTotal).toFixed(2);
if (totalRatio > 1) {
  console.log(`\n✅ VLD has ${totalRatio}x less startup overhead`);
} else {
  console.log(`\n⚠️  Zod has ${(1/totalRatio).toFixed(2)}x less startup overhead`);
}

// Performance per millisecond of startup cost
const vldOpsPerMs = (1 / vldWarmTime) / vldTotal;
const zodOpsPerMs = (1 / zodWarmTime) / zodTotal;

console.log('\n⚡ Performance per ms of startup cost:');
console.log(`  VLD: ${vldOpsPerMs.toFixed(2)} ops/ms²`);
console.log(`  Zod: ${zodOpsPerMs.toFixed(2)} ops/ms²`);

const efficiencyRatio = (vldOpsPerMs / zodOpsPerMs).toFixed(2);
if (efficiencyRatio > 1) {
  console.log(`  ✅ VLD is ${efficiencyRatio}x more efficient overall`);
} else {
  console.log(`  ⚠️  Zod is ${(1/efficiencyRatio).toFixed(2)}x more efficient overall`);
}

console.log('\n✨ Startup benchmark completed\n');