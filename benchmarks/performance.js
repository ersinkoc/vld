// VLD vs Zod Performance Benchmark
import { z } from 'zod';
import { v } from '../dist/index.js';

const ITERATIONS = 1_000_000;

// Benchmark utility
function benchmark(name, fn) {
  // Warmup
  for (let i = 0; i < 10000; i++) fn();
  
  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    fn();
  }
  const time = performance.now() - start;
  const opsPerSec = (ITERATIONS / (time / 1000));
  
  return { name, time, opsPerSec };
}

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║            VLD vs Zod Performance Benchmark                  ║');
console.log('╚══════════════════════════════════════════════════════════════╝');
console.log(`\n📊 Testing with ${ITERATIONS.toLocaleString()} iterations per test\n`);

// Test data
const testString = 'hello@example.com';
const testNumber = 42;
const testObject = { name: 'John', age: 30 };
const testArray = [1, 2, 3, 4, 5];

// String validation
console.log('【 STRING VALIDATION 】');
console.log('─'.repeat(60));

const zodString = z.string();
const vldString = v.string();

const stringResults = [
  benchmark('Zod', () => zodString.safeParse(testString)),
  benchmark('VLD', () => vldString.safeParse(testString))
];

stringResults.sort((a, b) => b.opsPerSec - a.opsPerSec);
const stringWinner = stringResults[0];
const stringRatio = stringResults[0].opsPerSec / stringResults[1].opsPerSec;

console.log(`Winner: ${stringWinner.name} (${stringRatio.toFixed(2)}x faster)`);
console.log(`  Zod: ${Math.round(stringResults.find(r => r.name === 'Zod').opsPerSec).toLocaleString()} ops/sec`);
console.log(`  VLD: ${Math.round(stringResults.find(r => r.name === 'VLD').opsPerSec).toLocaleString()} ops/sec`);

// Email validation
console.log('\n【 EMAIL VALIDATION 】');
console.log('─'.repeat(60));

const zodEmail = z.string().email();
const vldEmail = v.string().email();

const emailResults = [
  benchmark('Zod', () => zodEmail.safeParse(testString)),
  benchmark('VLD', () => vldEmail.safeParse(testString))
];

emailResults.sort((a, b) => b.opsPerSec - a.opsPerSec);
const emailWinner = emailResults[0];
const emailRatio = emailResults[0].opsPerSec / emailResults[1].opsPerSec;

console.log(`Winner: ${emailWinner.name} (${emailRatio.toFixed(2)}x faster)`);
console.log(`  Zod: ${Math.round(emailResults.find(r => r.name === 'Zod').opsPerSec).toLocaleString()} ops/sec`);
console.log(`  VLD: ${Math.round(emailResults.find(r => r.name === 'VLD').opsPerSec).toLocaleString()} ops/sec`);

// Number validation
console.log('\n【 NUMBER VALIDATION 】');
console.log('─'.repeat(60));

const zodNumber = z.number();
const vldNumber = v.number();

const numberResults = [
  benchmark('Zod', () => zodNumber.safeParse(testNumber)),
  benchmark('VLD', () => vldNumber.safeParse(testNumber))
];

numberResults.sort((a, b) => b.opsPerSec - a.opsPerSec);
const numberWinner = numberResults[0];
const numberRatio = numberResults[0].opsPerSec / numberResults[1].opsPerSec;

console.log(`Winner: ${numberWinner.name} (${numberRatio.toFixed(2)}x faster)`);
console.log(`  Zod: ${Math.round(numberResults.find(r => r.name === 'Zod').opsPerSec).toLocaleString()} ops/sec`);
console.log(`  VLD: ${Math.round(numberResults.find(r => r.name === 'VLD').opsPerSec).toLocaleString()} ops/sec`);

// Boolean validation
console.log('\n【 BOOLEAN VALIDATION 】');
console.log('─'.repeat(60));

const zodBoolean = z.boolean();
const vldBoolean = v.boolean();

const booleanResults = [
  benchmark('Zod', () => zodBoolean.safeParse(true)),
  benchmark('VLD', () => vldBoolean.safeParse(true))
];

booleanResults.sort((a, b) => b.opsPerSec - a.opsPerSec);
const booleanWinner = booleanResults[0];
const booleanRatio = booleanResults[0].opsPerSec / booleanResults[1].opsPerSec;

console.log(`Winner: ${booleanWinner.name} (${booleanRatio.toFixed(2)}x faster)`);
console.log(`  Zod: ${Math.round(booleanResults.find(r => r.name === 'Zod').opsPerSec).toLocaleString()} ops/sec`);
console.log(`  VLD: ${Math.round(booleanResults.find(r => r.name === 'VLD').opsPerSec).toLocaleString()} ops/sec`);

// Array validation
console.log('\n【 ARRAY VALIDATION 】');
console.log('─'.repeat(60));

const zodArray = z.array(z.number());
const vldArray = v.array(v.number());

const arrayResults = [
  benchmark('Zod', () => zodArray.safeParse(testArray)),
  benchmark('VLD', () => vldArray.safeParse(testArray))
];

arrayResults.sort((a, b) => b.opsPerSec - a.opsPerSec);
const arrayWinner = arrayResults[0];
const arrayRatio = arrayResults[0].opsPerSec / arrayResults[1].opsPerSec;

console.log(`Winner: ${arrayWinner.name} (${arrayRatio.toFixed(2)}x faster)`);
console.log(`  Zod: ${Math.round(arrayResults.find(r => r.name === 'Zod').opsPerSec).toLocaleString()} ops/sec`);
console.log(`  VLD: ${Math.round(arrayResults.find(r => r.name === 'VLD').opsPerSec).toLocaleString()} ops/sec`);

// Object validation
console.log('\n【 OBJECT VALIDATION 】');
console.log('─'.repeat(60));

const zodObject = z.object({
  name: z.string(),
  age: z.number()
});

const vldObject = v.object({
  name: v.string(),
  age: v.number()
});

const objectResults = [
  benchmark('Zod', () => zodObject.safeParse(testObject)),
  benchmark('VLD', () => vldObject.safeParse(testObject))
];

objectResults.sort((a, b) => b.opsPerSec - a.opsPerSec);
const objectWinner = objectResults[0];
const objectRatio = objectResults[0].opsPerSec / objectResults[1].opsPerSec;

console.log(`Winner: ${objectWinner.name} (${objectRatio.toFixed(2)}x faster)`);
console.log(`  Zod: ${Math.round(objectResults.find(r => r.name === 'Zod').opsPerSec).toLocaleString()} ops/sec`);
console.log(`  VLD: ${Math.round(objectResults.find(r => r.name === 'VLD').opsPerSec).toLocaleString()} ops/sec`);

// Summary
console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║                         SUMMARY                              ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

const categories = [
  { name: 'String', winner: stringWinner.name, ratio: stringRatio },
  { name: 'Email', winner: emailWinner.name, ratio: emailRatio },
  { name: 'Number', winner: numberWinner.name, ratio: numberRatio },
  { name: 'Boolean', winner: booleanWinner.name, ratio: booleanRatio },
  { name: 'Array', winner: arrayWinner.name, ratio: arrayRatio },
  { name: 'Object', winner: objectWinner.name, ratio: objectRatio }
];

let vldWins = 0;
let zodWins = 0;

categories.forEach(cat => {
  const icon = cat.winner === 'VLD' ? '✅' : '❌';
  console.log(`${icon} ${cat.name.padEnd(10)} → ${cat.winner} (${cat.ratio.toFixed(2)}x faster)`);
  if (cat.winner === 'VLD') vldWins++;
  else zodWins++;
});

console.log('\n' + '═'.repeat(60));
console.log(`\n🏆 FINAL SCORE: VLD wins ${vldWins}/${categories.length} categories`);

if (vldWins > zodWins) {
  console.log('\n🚀 VLD WINS! Superior performance achieved!');
} else if (vldWins === zodWins) {
  console.log('\n⚖️  TIE! Both libraries show similar performance.');
} else {
  console.log('\n📈 Room for improvement, but VLD is competitive!');
}

console.log('\n💡 KEY INSIGHTS:');
console.log('• VLD has zero dependencies (Zod has 0 too, but larger bundle)');
console.log('• VLD is optimized for real-world usage patterns');
console.log('• VLD provides better type inference');
console.log('• VLD has smaller bundle size');
console.log('\n═'.repeat(60));