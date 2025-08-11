/**
 * VLD Quick Performance Benchmark
 * Simple performance comparison without external dependencies
 */

const { v } = require('../dist');
const z = require('zod');

// Console colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Simple benchmark function
function benchmark(name, fn, iterations = 100000) {
  const start = process.hrtime.bigint();
  
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  
  const end = process.hrtime.bigint();
  const time = Number(end - start) / 1000000; // Convert to milliseconds
  const opsPerSec = (iterations / time) * 1000;
  
  return {
    name,
    time,
    opsPerSec,
    iterations
  };
}

// Run comparison
function compare(testName, vldFn, zodFn, iterations = 100000) {
  console.log(`\n${colors.cyan}${testName}${colors.reset}`);
  
  const vldResult = benchmark('VLD', vldFn, iterations);
  const zodResult = benchmark('Zod', zodFn, iterations);
  
  const ratio = (vldResult.opsPerSec / zodResult.opsPerSec).toFixed(2);
  const winner = ratio > 1 ? 'VLD' : 'Zod';
  const winnerColor = ratio > 1 ? colors.green : colors.yellow;
  
  console.log(`  VLD: ${colors.green}${vldResult.opsPerSec.toFixed(0)}${colors.reset} ops/sec`);
  console.log(`  Zod: ${colors.yellow}${zodResult.opsPerSec.toFixed(0)}${colors.reset} ops/sec`);
  console.log(`  ${winnerColor}${winner} is ${Math.abs(ratio > 1 ? ratio : 1/ratio).toFixed(2)}x faster${colors.reset}`);
  
  return { vldResult, zodResult, ratio: parseFloat(ratio) };
}

console.log(`${colors.bright}${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
console.log(`${colors.bright}                    VLD vs Zod Performance Benchmark${colors.reset}`);
console.log(`${colors.bright}${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);

const results = [];

// Test 1: Simple String Validation
const vldString = v.string();
const zodString = z.string();

results.push(compare(
  '1. Simple String Validation',
  () => vldString.parse('hello world'),
  () => zodString.parse('hello world')
));

// Test 2: Email Validation
const vldEmail = v.string().email();
const zodEmail = z.string().email();

results.push(compare(
  '2. Email Validation',
  () => vldEmail.parse('test@example.com'),
  () => zodEmail.parse('test@example.com')
));

// Test 3: Number Validation
const vldNumber = v.number().positive().int();
const zodNumber = z.number().positive().int();

results.push(compare(
  '3. Number Validation',
  () => vldNumber.parse(42),
  () => zodNumber.parse(42)
));

// Test 4: Simple Object
const vldObject = v.object({
  name: v.string(),
  age: v.number()
});

const zodObject = z.object({
  name: z.string(),
  age: z.number()
});

const testObj = { name: 'John', age: 30 };

results.push(compare(
  '4. Simple Object Validation',
  () => vldObject.parse(testObj),
  () => zodObject.parse(testObj),
  50000
));

// Test 5: Complex Object
const vldComplex = v.object({
  id: v.string(),
  user: v.object({
    name: v.string(),
    email: v.string().email(),
    age: v.number().positive()
  }),
  tags: v.array(v.string())
});

const zodComplex = z.object({
  id: z.string(),
  user: z.object({
    name: z.string(),
    email: z.string().email(),
    age: z.number().positive()
  }),
  tags: z.array(z.string())
});

const complexObj = {
  id: '123',
  user: {
    name: 'John Doe',
    email: 'john@example.com',
    age: 30
  },
  tags: ['developer', 'nodejs']
};

results.push(compare(
  '5. Complex Object Validation',
  () => vldComplex.parse(complexObj),
  () => zodComplex.parse(complexObj),
  25000
));

// Test 6: Array Validation
const vldArray = v.array(v.number());
const zodArray = z.array(z.number());
const testArray = [1, 2, 3, 4, 5];

results.push(compare(
  '6. Array Validation',
  () => vldArray.parse(testArray),
  () => zodArray.parse(testArray),
  50000
));

// Test 7: Union Types
const vldUnion = v.union(v.string(), v.number());
const zodUnion = z.union([z.string(), z.number()]);

results.push(compare(
  '7. Union Type Validation',
  () => {
    vldUnion.parse('test');
    vldUnion.parse(42);
  },
  () => {
    zodUnion.parse('test');
    zodUnion.parse(42);
  },
  50000
));

// Test 8: Optional Values
const vldOptional = v.string().optional();
const zodOptional = z.string().optional();

results.push(compare(
  '8. Optional Validation',
  () => {
    vldOptional.parse('test');
    vldOptional.parse(undefined);
  },
  () => {
    zodOptional.parse('test');
    zodOptional.parse(undefined);
  },
  50000
));

// Test 9: SafeParse
results.push(compare(
  '9. SafeParse (no throw)',
  () => vldString.safeParse('test'),
  () => zodString.safeParse('test')
));

// Test 10: Type Coercion
const vldCoerce = v.coerce.number();
const zodCoerce = z.coerce.number();

results.push(compare(
  '10. Type Coercion',
  () => vldCoerce.parse('42'),
  () => zodCoerce.parse('42'),
  50000
));

// Summary
console.log(`\n${colors.bright}${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
console.log(`${colors.bright}                           SUMMARY${colors.reset}`);
console.log(`${colors.bright}${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

const vldWins = results.filter(r => r.ratio > 1).length;
const zodWins = results.filter(r => r.ratio < 1).length;
const avgRatio = results.reduce((sum, r) => sum + (r.ratio > 1 ? r.ratio : 1/r.ratio), 0) / results.length;

console.log(`  ${colors.green}VLD won: ${vldWins}/10 tests${colors.reset}`);
console.log(`  ${colors.yellow}Zod won: ${zodWins}/10 tests${colors.reset}`);
console.log(`  ${colors.magenta}Average performance ratio: ${avgRatio.toFixed(2)}x${colors.reset}`);

if (vldWins > zodWins) {
  console.log(`\n  ${colors.bright}${colors.green}✅ VLD is faster overall!${colors.reset}`);
} else if (zodWins > vldWins) {
  console.log(`\n  ${colors.bright}${colors.yellow}⚠️ Zod is faster overall${colors.reset}`);
} else {
  console.log(`\n  ${colors.bright}${colors.cyan}📊 Performance is comparable${colors.reset}`);
}

console.log(`\n${colors.bright}✨ Benchmark completed${colors.reset}\n`);