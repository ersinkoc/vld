// Primitives — same source for Zod and VLD.
// Each `make(z)` returns a { name, schema, samples } triple. The runner feeds
// every sample through both libraries and asserts identical accept/reject.

export const primitiveSchemas = [
  {
    name: 'string',
    make: (z) => z.string(),
    samples: ['hello', '', 42, null, undefined, {}, []]
  },
  {
    name: 'string().min(3).max(10)',
    make: (z) => z.string().min(3).max(10),
    samples: ['abc', 'abcdefghij', 'ab', 'abcdefghijk']
  },
  {
    name: 'string().length(5)',
    make: (z) => z.string().length(5),
    samples: ['hello', 'hi', 'helloworld']
  },
  {
    name: 'string().email()',
    make: (z) => z.string().email(),
    samples: ['a@b.io', 'good@example.com', 'no-at', 'a@b', '@b.io']
  },
  {
    name: 'string().url()',
    make: (z) => z.string().url(),
    samples: ['https://example.com', 'http://a.b/path?x=1', 'not a url', 'https://x.io']
  },
  {
    name: 'string().uuid()',
    make: (z) => z.string().uuid(),
    samples: ['550e8400-e29b-41d4-a716-446655440000', 'not-a-uuid', '550e8400e29b41d4a716446655440000']
  },
  {
    name: 'string().regex(/^[a-z]+$/)',
    make: (z) => z.string().regex(/^[a-z]+$/),
    samples: ['abc', 'ABC', 'a1b']
  },
  {
    name: 'string().startsWith("foo")',
    make: (z) => z.string().startsWith('foo'),
    samples: ['foobar', 'barfoo', 'fo']
  },
  {
    name: 'string().endsWith("bar")',
    make: (z) => z.string().endsWith('bar'),
    samples: ['foobar', 'barfoo', 'ba']
  },
  {
    name: 'string().includes("mid")',
    make: (z) => z.string().includes('mid'),
    samples: ['foomidbar', 'foo', 'mid']
  },
  {
    name: 'number()',
    make: (z) => z.number(),
    samples: [0, 1, -1, 3.14, '1', NaN, Infinity]
  },
  {
    name: 'number().int()',
    make: (z) => z.number().int(),
    samples: [1, 1.5, -2, '1']
  },
  {
    name: 'number().positive()',
    make: (z) => z.number().positive(),
    samples: [1, 0, -1, 0.1]
  },
  {
    name: 'number().negative()',
    make: (z) => z.number().negative(),
    samples: [-1, 0, 1, -0.0001]
  },
  {
    name: 'number().nonnegative()',
    make: (z) => z.number().nonnegative(),
    samples: [0, 1, -1]
  },
  {
    name: 'number().min(5).max(10)',
    make: (z) => z.number().min(5).max(10),
    samples: [4, 5, 7, 10, 11]
  },
  {
    name: 'number().finite()',
    make: (z) => z.number().finite(),
    samples: [1, Infinity, -Infinity, 0]
  },
  {
    name: 'boolean()',
    make: (z) => z.boolean(),
    samples: [true, false, 0, 1, 'true', null]
  },
  {
    name: 'date()',
    make: (z) => z.date(),
    samples: [new Date('2020-01-01T00:00:00Z'), new Date('not-a-date'), new Date(0), 1234567890]
  },
  {
    name: 'bigint()',
    make: (z) => z.bigint(),
    samples: [0n, 1n, -1n, 42n, 0, '1', null]
  },
  {
    name: 'null()',
    make: (z) => z.null(),
    samples: [null, undefined, 0, 'null']
  },
  {
    name: 'undefined()',
    make: (z) => z.undefined(),
    samples: [undefined, null, 0, '']
  },
  {
    name: 'any()',
    make: (z) => z.any(),
    samples: [1, 'a', null, undefined, {}, [], () => {}]
  },
  {
    name: 'unknown()',
    make: (z) => z.unknown(),
    samples: [1, 'a', null, undefined, {}]
  }
];
