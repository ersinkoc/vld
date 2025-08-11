/**
 * VLD Memory Usage Benchmarks
 * Measures memory consumption and efficiency
 */

const { v } = require('../dist');
const z = require('zod');

// Utility to format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Measure memory usage
function measureMemory(name, fn, iterations = 10000) {
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }

  const startMemory = process.memoryUsage();
  const startTime = process.hrtime.bigint();
  
  // Run the function multiple times
  const results = [];
  for (let i = 0; i < iterations; i++) {
    results.push(fn());
  }
  
  const endTime = process.hrtime.bigint();
  const endMemory = process.memoryUsage();
  
  // Calculate differences
  const heapUsed = endMemory.heapUsed - startMemory.heapUsed;
  const external = endMemory.external - startMemory.external;
  const time = Number(endTime - startTime) / 1000000; // Convert to milliseconds
  
  return {
    name,
    heapUsed,
    external,
    time,
    opsPerSecond: (iterations / time) * 1000,
    memoryPerOp: heapUsed / iterations,
    results: results.length // Keep results to prevent optimization
  };
}

// Print comparison results
function printComparison(vldResult, zodResult) {
  const speedRatio = (vldResult.opsPerSecond / zodResult.opsPerSecond).toFixed(2);
  const memoryRatio = (zodResult.heapUsed / vldResult.heapUsed).toFixed(2);
  
  console.log('\n📊 Results:');
  console.log('┌─────────────────┬──────────────────┬──────────────────┐');
  console.log('│ Metric          │ VLD              │ Zod              │');
  console.log('├─────────────────┼──────────────────┼──────────────────┤');
  console.log(`│ Heap Used       │ ${formatBytes(vldResult.heapUsed).padEnd(16)} │ ${formatBytes(zodResult.heapUsed).padEnd(16)} │`);
  console.log(`│ Memory/Op       │ ${formatBytes(vldResult.memoryPerOp).padEnd(16)} │ ${formatBytes(zodResult.memoryPerOp).padEnd(16)} │`);
  console.log(`│ Time (ms)       │ ${vldResult.time.toFixed(2).padEnd(16)} │ ${zodResult.time.toFixed(2).padEnd(16)} │`);
  console.log(`│ Ops/Second      │ ${vldResult.opsPerSecond.toFixed(0).padEnd(16)} │ ${zodResult.opsPerSecond.toFixed(0).padEnd(16)} │`);
  console.log('└─────────────────┴──────────────────┴──────────────────┘');
  
  console.log('\n📈 Performance Summary:');
  if (speedRatio > 1) {
    console.log(`  ✅ VLD is ${speedRatio}x faster`);
  } else {
    console.log(`  ⚠️  Zod is ${(1/speedRatio).toFixed(2)}x faster`);
  }
  
  if (memoryRatio > 1) {
    console.log(`  ✅ VLD uses ${memoryRatio}x less memory`);
  } else {
    console.log(`  ⚠️  Zod uses ${(1/memoryRatio).toFixed(2)}x less memory`);
  }
}

console.log('🚀 VLD Memory Usage Benchmarks\n');
console.log('Note: Run with --expose-gc flag for accurate memory measurements');
console.log('Example: node --expose-gc benchmarks/memory.js\n');

// ============================================
// TEST 1: Simple String Validation
// ============================================

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Test 1: Simple String Validation');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const vldString = v.string().email();
const zodString = z.string().email();

const vldStringResult = measureMemory('VLD String', () => {
  return vldString.parse('test@example.com');
});

const zodStringResult = measureMemory('Zod String', () => {
  return zodString.parse('test@example.com');
});

printComparison(vldStringResult, zodStringResult);

// ============================================
// TEST 2: Complex Object Validation
// ============================================

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Test 2: Complex Object Validation');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const vldObject = v.object({
  id: v.string().uuid(),
  name: v.string().min(2).max(100),
  email: v.string().email(),
  age: v.number().positive().int(),
  tags: v.array(v.string()),
  metadata: v.object({
    created: v.date(),
    updated: v.date(),
    active: v.boolean()
  })
});

const zodObject = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  age: z.number().positive().int(),
  tags: z.array(z.string()),
  metadata: z.object({
    created: z.date(),
    updated: z.date(),
    active: z.boolean()
  })
});

const testObject = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
  tags: ['developer', 'nodejs', 'typescript'],
  metadata: {
    created: new Date(),
    updated: new Date(),
    active: true
  }
};

const vldObjectResult = measureMemory('VLD Object', () => {
  return vldObject.parse(testObject);
});

const zodObjectResult = measureMemory('Zod Object', () => {
  return zodObject.parse(testObject);
});

printComparison(vldObjectResult, zodObjectResult);

// ============================================
// TEST 3: Large Array Validation
// ============================================

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Test 3: Large Array Validation');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const vldArray = v.array(v.number().positive());
const zodArray = z.array(z.number().positive());

const largeArray = Array.from({ length: 1000 }, (_, i) => i + 1);

const vldArrayResult = measureMemory('VLD Array', () => {
  return vldArray.parse(largeArray);
}, 1000);

const zodArrayResult = measureMemory('Zod Array', () => {
  return zodArray.parse(largeArray);
}, 1000);

printComparison(vldArrayResult, zodArrayResult);

// ============================================
// TEST 4: Union Type Validation
// ============================================

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Test 4: Union Type Validation');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const vldUnion = v.union(
  v.string(),
  v.number(),
  v.boolean(),
  v.object({ type: v.literal('custom'), value: v.any() })
);

const zodUnion = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.object({ type: z.literal('custom'), value: z.any() })
]);

const vldUnionResult = measureMemory('VLD Union', () => {
  vldUnion.parse('test');
  vldUnion.parse(42);
  vldUnion.parse(true);
  vldUnion.parse({ type: 'custom', value: 'data' });
  return true;
});

const zodUnionResult = measureMemory('Zod Union', () => {
  zodUnion.parse('test');
  zodUnion.parse(42);
  zodUnion.parse(true);
  zodUnion.parse({ type: 'custom', value: 'data' });
  return true;
});

printComparison(vldUnionResult, zodUnionResult);

// ============================================
// TEST 5: Schema Creation Memory
// ============================================

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Test 5: Schema Creation Memory');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const vldSchemaResult = measureMemory('VLD Schema Creation', () => {
  return v.object({
    id: v.string(),
    name: v.string(),
    age: v.number(),
    email: v.string().email(),
    active: v.boolean()
  });
}, 1000);

const zodSchemaResult = measureMemory('Zod Schema Creation', () => {
  return z.object({
    id: z.string(),
    name: z.string(),
    age: z.number(),
    email: z.string().email(),
    active: z.boolean()
  });
}, 1000);

printComparison(vldSchemaResult, zodSchemaResult);

// ============================================
// OVERALL SUMMARY
// ============================================

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 Overall Memory Usage Summary');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const totalVldMemory = vldStringResult.heapUsed + vldObjectResult.heapUsed + 
                       vldArrayResult.heapUsed + vldUnionResult.heapUsed + 
                       vldSchemaResult.heapUsed;

const totalZodMemory = zodStringResult.heapUsed + zodObjectResult.heapUsed + 
                       zodArrayResult.heapUsed + zodUnionResult.heapUsed + 
                       zodSchemaResult.heapUsed;

console.log(`\nTotal Memory Used:`);
console.log(`  VLD: ${formatBytes(totalVldMemory)}`);
console.log(`  Zod: ${formatBytes(totalZodMemory)}`);

const overallRatio = (totalZodMemory / totalVldMemory).toFixed(2);
if (overallRatio > 1) {
  console.log(`\n✅ VLD uses ${overallRatio}x less memory overall`);
} else {
  console.log(`\n⚠️  Zod uses ${(1/overallRatio).toFixed(2)}x less memory overall`);
}

console.log('\n✨ Benchmark completed\n');