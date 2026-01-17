/**
 * VLD CLI - Benchmark Command
 *
 * Run performance benchmarks for VLD validation.
 */

import { pigment } from '../../pigment';
import { v } from '../../index';
import type { CliCommand } from '../index';

/**
 * Benchmark result
 */
interface BenchmarkResult {
  name: string;
  iterations: number;
  totalMs: number;
  avgMs: number;
  opsPerSec: number;
}

/**
 * Run a single benchmark
 */
function runBenchmark(
  name: string,
  fn: () => void,
  iterations: number
): BenchmarkResult {
  // Warm up
  for (let i = 0; i < Math.min(100, iterations / 10); i++) {
    fn();
  }

  // Run benchmark
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();

  const totalMs = end - start;
  const avgMs = totalMs / iterations;
  const opsPerSec = 1000 / avgMs;

  return { name, iterations, totalMs, avgMs, opsPerSec };
}

/**
 * Format number with comma separators
 */
function formatNumber(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

/**
 * Format benchmark result
 */
function formatResult(result: BenchmarkResult, colored: boolean): string {
  const name = colored ? pigment.cyan(result.name.padEnd(30)) : result.name.padEnd(30);
  const ops = colored
    ? pigment.green(formatNumber(result.opsPerSec).padStart(12))
    : formatNumber(result.opsPerSec).padStart(12);
  const avg = colored
    ? pigment.yellow(result.avgMs.toFixed(6).padStart(12))
    : result.avgMs.toFixed(6).padStart(12);

  return `${name} ${ops} ops/sec  ${avg} ms/op`;
}

/**
 * Benchmark command
 */
export const benchmarkCommand: CliCommand = {
  name: 'benchmark',
  description: 'Run performance benchmarks',
  aliases: ['bench', 'b'],
  options: [
    {
      name: 'iterations',
      short: 'n',
      description: 'Number of iterations',
      type: 'number',
      default: 10000
    },
    {
      name: 'suite',
      short: 's',
      description: 'Benchmark suite to run (all, primitives, objects, arrays)',
      type: 'string',
      default: 'all'
    },
    {
      name: 'json',
      short: 'j',
      description: 'Output as JSON',
      type: 'boolean',
      default: false
    },
    {
      name: 'no-color',
      description: 'Disable colored output',
      type: 'boolean',
      default: false
    }
  ],
  action: async (_args, options) => {
    const iterations = options.iterations as number;
    const suite = options.suite as string;
    const json = options.json as boolean;
    const noColor = options['no-color'] as boolean;
    const colored = !noColor;

    const results: BenchmarkResult[] = [];

    // Primitive validators
    const stringSchema = v.string();
    const numberSchema = v.number();
    const booleanSchema = v.boolean();
    const dateSchema = v.date();

    // Object validator
    const userSchema = v.object({
      name: v.string(),
      email: v.string(),
      age: v.number(),
      active: v.boolean()
    });

    // Array validator
    const numbersSchema = v.array(v.number());

    // Nested object validator
    const nestedSchema = v.object({
      user: v.object({
        name: v.string(),
        email: v.string()
      }),
      items: v.array(
        v.object({
          id: v.number(),
          name: v.string(),
          price: v.number()
        })
      )
    });

    // Test data
    const testString = 'hello world';
    const testNumber = 42;
    const testBoolean = true;
    const testDate = new Date();
    const testUser = { name: 'John', email: 'john@example.com', age: 30, active: true };
    const testNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const testNested = {
      user: { name: 'John', email: 'john@example.com' },
      items: [
        { id: 1, name: 'Item 1', price: 10.99 },
        { id: 2, name: 'Item 2', price: 20.99 },
        { id: 3, name: 'Item 3', price: 30.99 }
      ]
    };

    if (!json) {
      console.log(pigment.bold('VLD Performance Benchmark'));
      console.log(pigment.dim(`Running ${formatNumber(iterations)} iterations per test`));
      console.log('');
    }

    // Primitive benchmarks
    if (suite === 'all' || suite === 'primitives') {
      if (!json) {
        console.log(pigment.bold('Primitives:'));
      }

      results.push(
        runBenchmark('string.parse()', () => stringSchema.parse(testString), iterations)
      );
      results.push(
        runBenchmark('number.parse()', () => numberSchema.parse(testNumber), iterations)
      );
      results.push(
        runBenchmark('boolean.parse()', () => booleanSchema.parse(testBoolean), iterations)
      );
      results.push(
        runBenchmark('date.parse()', () => dateSchema.parse(testDate), iterations)
      );
      results.push(
        runBenchmark('string.safeParse()', () => stringSchema.safeParse(testString), iterations)
      );

      if (!json) {
        for (const result of results.slice(-5)) {
          console.log('  ' + formatResult(result, colored));
        }
        console.log('');
      }
    }

    // Object benchmarks
    if (suite === 'all' || suite === 'objects') {
      if (!json) {
        console.log(pigment.bold('Objects:'));
      }

      results.push(
        runBenchmark('object.parse()', () => userSchema.parse(testUser), iterations)
      );
      results.push(
        runBenchmark('object.safeParse()', () => userSchema.safeParse(testUser), iterations)
      );
      results.push(
        runBenchmark('nested.parse()', () => nestedSchema.parse(testNested), iterations)
      );

      if (!json) {
        for (const result of results.slice(-3)) {
          console.log('  ' + formatResult(result, colored));
        }
        console.log('');
      }
    }

    // Array benchmarks
    if (suite === 'all' || suite === 'arrays') {
      if (!json) {
        console.log(pigment.bold('Arrays:'));
      }

      results.push(
        runBenchmark('array.parse()', () => numbersSchema.parse(testNumbers), iterations)
      );
      results.push(
        runBenchmark('array.safeParse()', () => numbersSchema.safeParse(testNumbers), iterations)
      );

      if (!json) {
        for (const result of results.slice(-2)) {
          console.log('  ' + formatResult(result, colored));
        }
        console.log('');
      }
    }

    // Summary
    if (!json) {
      const totalOps = results.reduce((sum, r) => sum + r.opsPerSec, 0);
      const avgOps = totalOps / results.length;

      console.log(pigment.bold('Summary:'));
      console.log(`  Total benchmarks: ${results.length}`);
      console.log(`  Average ops/sec:  ${formatNumber(avgOps)}`);
    } else {
      console.log(
        JSON.stringify({
          iterations,
          suite,
          results: results.map((r) => ({
            name: r.name,
            iterations: r.iterations,
            totalMs: r.totalMs,
            avgMs: r.avgMs,
            opsPerSec: r.opsPerSec
          }))
        })
      );
    }
  }
};
