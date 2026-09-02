// Refinements, transforms, defaults, catch — same source for Zod and VLD.

export const refinementSchemas = [
  {
    name: 'string().optional()',
    make: (z) => z.string().optional(),
    samples: ['hi', undefined, null, 0, '']
  },
  {
    name: 'string().nullable()',
    make: (z) => z.string().nullable(),
    samples: ['hi', null, undefined, 0]
  },
  {
    name: 'string().optional().nullable()',
    make: (z) => z.string().optional().nullable(),
    samples: ['hi', null, undefined, 0, '']
  },
  {
    name: 'string().min(1).optional()',
    make: (z) => z.string().min(1).optional(),
    samples: ['hi', '', undefined, null]
  },
  {
    name: 'string().default("hello")',
    make: (z) => z.string().default('hello'),
    samples: [undefined, 'world', 0, null]
  },
  {
    name: 'number().default(0)',
    make: (z) => z.number().default(0),
    samples: [undefined, 42, 'oops', null]
  },
  {
    name: 'string().catch("fallback")',
    make: (z) => z.string().catch('fallback'),
    samples: ['hi', 42, null, undefined]
  },
  {
    name: 'number().catch(-1)',
    make: (z) => z.number().catch(-1),
    samples: [42, 'oops', null, undefined]
  },
  {
    name: 'refine (even length)',
    make: (z) => z.string().refine((s) => s.length % 2 === 0),
    samples: ['ab', 'abc', 'abcd', '']
  },
  {
    name: 'refine with custom error',
    make: (z) => z.string().min(3, 'must be ≥ 3 chars'),
    samples: ['hello', 'ab', '']
  },
  {
    name: 'refine + transform (string → uppercase)',
    make: (z) => z.string().transform((s) => s.toUpperCase()),
    samples: ['hello', 'World', '']
  },
  {
    name: 'string → number transform',
    make: (z) => z.string().transform((s, n) => Number(s) * 2),
    samples: ['3', '10', 'oops']
  },
  {
    name: 'refine chain (positive + even)',
    make: (z) => z.number().refine((n) => n > 0).refine((n) => n % 2 === 0),
    samples: [4, 3, -2, 0, 2.5]
  },
  {
    name: 'object({ a }).partial()',
    make: (z) => z.object({ a: z.string(), b: z.number() }).partial(),
    samples: [{}, { a: 'x' }, { a: 'x', b: 1 }, { b: 1 }]
  }
];
