// Union, discriminated union, literal, enum — same source for Zod and VLD.

export const unionSchemas = [
  {
    name: 'literal("active")',
    make: (z) => z.literal('active'),
    samples: ['active', 'inactive', null, 0]
  },
  {
    name: 'literal(42)',
    make: (z) => z.literal(42),
    samples: [42, 43, '42', null]
  },
  {
    name: 'literal(true)',
    make: (z) => z.literal(true),
    samples: [true, false, 'true', 1]
  },
  {
    name: 'enum(["red", "green", "blue"])',
    make: (z) => z.enum(['red', 'green', 'blue']),
    samples: ['red', 'green', 'blue', 'yellow', null]
  },
  {
    name: 'enum(["a", "b", "c"])',
    make: (z) => z.enum(['a', 'b', 'c']),
    samples: ['a', 'b', 'c', 'd']
  },
  {
    name: 'union([string, number])',
    make: (z) => z.union([z.string(), z.number()]),
    samples: ['hello', 42, true, null, []]
  },
  {
    name: 'union([string, number, boolean])',
    make: (z) => z.union([z.string(), z.number(), z.boolean()]),
    samples: ['hi', 1, true, null, []]
  },
  {
    name: 'string().or(number())',
    make: (z) => z.union([z.string(), z.number()]),
    samples: ['hi', 1, true]
  },
  {
    name: 'discriminatedUnion("kind", cat | dog)',
    make: (z) => z.discriminatedUnion('kind', [
      z.object({ kind: z.literal('cat'), meow: z.string() }),
      z.object({ kind: z.literal('dog'), bark: z.string() })
    ]),
    samples: [
      { kind: 'cat', meow: 'purr' },
      { kind: 'dog', bark: 'woof' },
      { kind: 'fish' },
      { kind: 'cat', bark: 'wrong' },
      null
    ]
  },
  {
    name: 'discriminatedUnion("type", success | error)',
    make: (z) => z.discriminatedUnion('type', [
      z.object({ type: z.literal('success'), data: z.any() }),
      z.object({ type: z.literal('error'), message: z.string() })
    ]),
    samples: [
      { type: 'success', data: 42 },
      { type: 'error', message: 'oops' },
      { type: 'success', message: 'wrong' },
      { type: 'error', data: 'wrong' }
    ]
  }
];
