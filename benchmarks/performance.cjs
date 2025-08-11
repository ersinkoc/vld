/**
 * VLD Performance Benchmarks
 * Comprehensive performance testing suite
 */

const Benchmark = require('benchmark');
const { v } = require('../dist');
const z = require('zod');

// Console colors for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * Format operations per second for display
 */
function formatOps(ops) {
  if (ops > 1000000) {
    return `${(ops / 1000000).toFixed(2)}M`;
  } else if (ops > 1000) {
    return `${(ops / 1000).toFixed(2)}K`;
  }
  return ops.toFixed(0);
}

/**
 * Run a benchmark suite
 */
function runSuite(name, tests) {
  console.log(`\n${colors.bright}${colors.blue}━━━ ${name} ━━━${colors.reset}\n`);
  
  const suite = new Benchmark.Suite(name, {
    onCycle: (event) => {
      const bench = event.target;
      const ops = formatOps(bench.hz);
      const rme = bench.stats.rme.toFixed(2);
      console.log(`  ${colors.cyan}${bench.name.padEnd(30)}${colors.reset} ${colors.green}${ops.padStart(10)} ops/sec${colors.reset} ${colors.yellow}(±${rme}%)${colors.reset}`);
    },
    onComplete: function() {
      const fastest = this.filter('fastest')[0];
      const slowest = this.filter('slowest')[0];
      const ratio = (fastest.hz / slowest.hz).toFixed(2);
      
      console.log(`\n  ${colors.bright}Fastest:${colors.reset} ${colors.green}${fastest.name}${colors.reset}`);
      console.log(`  ${colors.bright}Slowest:${colors.reset} ${colors.yellow}${slowest.name}${colors.reset}`);
      console.log(`  ${colors.bright}Ratio:${colors.reset} ${colors.magenta}${ratio}x faster${colors.reset}\n`);
    }
  });

  // Add tests to suite
  Object.entries(tests).forEach(([name, fn]) => {
    suite.add(name, fn);
  });

  suite.run();
}

// Test data
const testData = {
  string: 'hello@example.com',
  number: 42,
  boolean: true,
  date: new Date(),
  array: [1, 2, 3, 4, 5],
  object: {
    name: 'John Doe',
    age: 30,
    email: 'john@example.com',
    active: true,
    tags: ['developer', 'nodejs'],
    address: {
      street: '123 Main St',
      city: 'New York',
      country: 'USA',
      zip: '10001'
    }
  },
  deepObject: {
    level1: {
      level2: {
        level3: {
          level4: {
            level5: {
              value: 'deep value',
              count: 100
            }
          }
        }
      }
    }
  }
};

// ============================================
// STRING VALIDATION BENCHMARKS
// ============================================

const vldString = v.string().email();
const zodString = z.string().email();

runSuite('String Validation', {
  'VLD - string.email()': () => {
    vldString.parse(testData.string);
  },
  'Zod - string.email()': () => {
    zodString.parse(testData.string);
  },
  'VLD - string.safeParse()': () => {
    vldString.safeParse(testData.string);
  },
  'Zod - string.safeParse()': () => {
    zodString.safeParse(testData.string);
  }
});

// ============================================
// NUMBER VALIDATION BENCHMARKS
// ============================================

const vldNumber = v.number().positive().int();
const zodNumber = z.number().positive().int();

runSuite('Number Validation', {
  'VLD - number.positive().int()': () => {
    vldNumber.parse(testData.number);
  },
  'Zod - number.positive().int()': () => {
    zodNumber.parse(testData.number);
  },
  'VLD - number.safeParse()': () => {
    vldNumber.safeParse(testData.number);
  },
  'Zod - number.safeParse()': () => {
    zodNumber.safeParse(testData.number);
  }
});

// ============================================
// OBJECT VALIDATION BENCHMARKS
// ============================================

const vldObject = v.object({
  name: v.string(),
  age: v.number(),
  email: v.string().email(),
  active: v.boolean(),
  tags: v.array(v.string()),
  address: v.object({
    street: v.string(),
    city: v.string(),
    country: v.string(),
    zip: v.string()
  })
});

const zodObject = z.object({
  name: z.string(),
  age: z.number(),
  email: z.string().email(),
  active: z.boolean(),
  tags: z.array(z.string()),
  address: z.object({
    street: z.string(),
    city: z.string(),
    country: z.string(),
    zip: z.string()
  })
});

runSuite('Object Validation', {
  'VLD - complex object': () => {
    vldObject.parse(testData.object);
  },
  'Zod - complex object': () => {
    zodObject.parse(testData.object);
  },
  'VLD - object.safeParse()': () => {
    vldObject.safeParse(testData.object);
  },
  'Zod - object.safeParse()': () => {
    zodObject.safeParse(testData.object);
  }
});

// ============================================
// ARRAY VALIDATION BENCHMARKS
// ============================================

const vldArray = v.array(v.number());
const zodArray = z.array(z.number());

runSuite('Array Validation', {
  'VLD - array(number)': () => {
    vldArray.parse(testData.array);
  },
  'Zod - array(number)': () => {
    zodArray.parse(testData.array);
  },
  'VLD - array.safeParse()': () => {
    vldArray.safeParse(testData.array);
  },
  'Zod - array.safeParse()': () => {
    zodArray.safeParse(testData.array);
  }
});

// ============================================
// UNION TYPE BENCHMARKS
// ============================================

const vldUnion = v.union(v.string(), v.number(), v.boolean());
const zodUnion = z.union([z.string(), z.number(), z.boolean()]);

runSuite('Union Type Validation', {
  'VLD - union (string match)': () => {
    vldUnion.parse('test');
  },
  'Zod - union (string match)': () => {
    zodUnion.parse('test');
  },
  'VLD - union (number match)': () => {
    vldUnion.parse(42);
  },
  'Zod - union (number match)': () => {
    zodUnion.parse(42);
  },
  'VLD - union (boolean match)': () => {
    vldUnion.parse(true);
  },
  'Zod - union (boolean match)': () => {
    zodUnion.parse(true);
  }
});

// ============================================
// DEEP NESTED OBJECT BENCHMARKS
// ============================================

const vldDeep = v.object({
  level1: v.object({
    level2: v.object({
      level3: v.object({
        level4: v.object({
          level5: v.object({
            value: v.string(),
            count: v.number()
          })
        })
      })
    })
  })
});

const zodDeep = z.object({
  level1: z.object({
    level2: z.object({
      level3: z.object({
        level4: z.object({
          level5: z.object({
            value: z.string(),
            count: z.number()
          })
        })
      })
    })
  })
});

runSuite('Deep Nested Object', {
  'VLD - 5 levels deep': () => {
    vldDeep.parse(testData.deepObject);
  },
  'Zod - 5 levels deep': () => {
    zodDeep.parse(testData.deepObject);
  }
});

// ============================================
// COERCION BENCHMARKS
// ============================================

const vldCoerce = v.coerce.number();
const zodCoerce = z.coerce.number();

runSuite('Type Coercion', {
  'VLD - coerce.number()': () => {
    vldCoerce.parse('42');
  },
  'Zod - coerce.number()': () => {
    zodCoerce.parse('42');
  },
  'VLD - coerce.safeParse()': () => {
    vldCoerce.safeParse('42');
  },
  'Zod - coerce.safeParse()': () => {
    zodCoerce.safeParse('42');
  }
});

// ============================================
// OPTIONAL/NULLABLE BENCHMARKS
// ============================================

const vldOptional = v.string().optional();
const zodOptional = z.string().optional();

runSuite('Optional Values', {
  'VLD - optional (defined)': () => {
    vldOptional.parse('test');
  },
  'Zod - optional (defined)': () => {
    zodOptional.parse('test');
  },
  'VLD - optional (undefined)': () => {
    vldOptional.parse(undefined);
  },
  'Zod - optional (undefined)': () => {
    zodOptional.parse(undefined);
  }
});

// ============================================
// TRANSFORMATION BENCHMARKS
// ============================================

const vldTransform = v.string().transform(s => s.toUpperCase());
const zodTransform = z.string().transform(s => s.toUpperCase());

runSuite('Transformations', {
  'VLD - transform': () => {
    vldTransform.parse('hello');
  },
  'Zod - transform': () => {
    zodTransform.parse('hello');
  }
});

// ============================================
// REFINEMENT BENCHMARKS
// ============================================

const vldRefine = v.string().refine(s => s.length > 5, 'Too short');
const zodRefine = z.string().refine(s => s.length > 5, 'Too short');

runSuite('Refinements', {
  'VLD - refine (pass)': () => {
    vldRefine.parse('hello world');
  },
  'Zod - refine (pass)': () => {
    zodRefine.parse('hello world');
  }
});

console.log(`\n${colors.bright}${colors.green}✓ All benchmarks completed${colors.reset}\n`);