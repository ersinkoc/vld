// Composite / structural schemas — same source for Zod and VLD.

export const structureSchemas = [
  {
    name: 'object({a: string, b: number})',
    make: (z) => z.object({ a: z.string(), b: z.number() }),
    samples: [
      { a: 'hi', b: 1 },
      { a: 'hi' },
      { a: 1, b: 2 },
      { a: 'hi', b: 1, c: 'extra' }
    ]
  },
  {
    name: 'nested object (3 levels)',
    make: (z) => z.object({
      user: z.object({
        profile: z.object({
          name: z.string().min(1),
          age: z.number().int().nonnegative()
        })
      })
    }),
    samples: [
      { user: { profile: { name: 'Ada', age: 36 } } },
      { user: { profile: { name: '', age: -1 } } },
      { user: { profile: { name: 'Ada' } } }
    ]
  },
  {
    name: 'array(string())',
    make: (z) => z.array(z.string()),
    samples: [['a', 'b'], [], ['x', 1], 'not-an-array']
  },
  {
    name: 'array(string()).min(1).max(3)',
    make: (z) => z.array(z.string()).min(1).max(3),
    samples: [['a'], ['a', 'b', 'c'], [], ['a', 'b', 'c', 'd']]
  },
  {
    name: 'array(nonempty)',
    make: (z) => z.array(z.string()).min(1),
    samples: [['a'], [], 'x']
  },
  {
    name: 'tuple([string, number])',
    make: (z) => z.tuple([z.string(), z.number()]),
    samples: [
      ['a', 1],
      ['a', 1, 2],
      [1, 'a'],
      ['a']
    ]
  },
  {
    name: 'record(string())',
    make: (z) => z.record(z.string()),
    samples: [
      { a: 'x', b: 'y' },
      {},
      { a: 1 },
      'not-object'
    ]
  },
  {
    name: 'record(string(), number())',
    make: (z) => z.record(z.string(), z.number()),
    samples: [
      { a: 1, b: 2 },
      { a: 'x' },
      {}
    ]
  },
  {
    name: 'set(string())',
    make: (z) => z.set(z.string()),
    samples: [
      new Set(['a', 'b']),
      new Set(),
      new Set([1, 2]),
      []
    ]
  },
  {
    name: 'map(string(), number())',
    make: (z) => z.map(z.string(), z.number()),
    samples: [
      new Map([['a', 1]]),
      new Map([['a', 'x']]),
      new Map()
    ]
  }
];
