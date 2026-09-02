// Realistic composite schemas — exercising nested objects, discriminated
// unions, optional fields, transforms. Same source for Zod and VLD.

function buildCommonSchemas(z) {
  const Role = z.enum(['admin', 'user', 'guest']);

  const Address = z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    zip: z.string().regex(/^\d{5}$/),
    country: z.string().length(2)
  });

  const User = z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string().min(1).max(100),
    age: z.number().int().min(0).max(150),
    role: Role,
    isActive: z.boolean(),
    tags: z.array(z.string()).default([]),
    address: Address.optional(),
    createdAt: z.date()
  });

  const LineItem = z.object({
    sku: z.string().regex(/^[A-Z]{3}-\d{4}$/),
    qty: z.number().int().positive(),
    unitPrice: z.number().positive()
  });

  const Order = z.object({
    id: z.string().uuid(),
    customer: User,
    items: z.array(LineItem).min(1),
    status: z.enum(['pending', 'paid', 'shipped', 'delivered', 'cancelled']),
    notes: z.string().optional()
  });

  const Event = z.discriminatedUnion('type', [
    z.object({ type: z.literal('signup'), userId: z.string().uuid() }),
    z.object({ type: z.literal('purchase'), userId: z.string().uuid(), amount: z.number().positive() }),
    z.object({ type: z.literal('logout'), userId: z.string().uuid(), at: z.date() })
  ]);

  const SearchQuery = z.object({
    q: z.string().min(1).max(200),
    page: z.number().int().positive().default(1),
    perPage: z.number().int().positive().max(100).default(20),
    sort: z.enum(['asc', 'desc']).optional()
  });

  const ApiResponse = z.object({
    ok: z.boolean(),
    data: z.unknown(),
    error: z.string().optional(),
    timestamp: z.date()
  });

  return { Role, Address, User, Order, Event, SearchQuery, ApiResponse, LineItem };
}

export const compositeSchemas = [
  {
    name: 'Role (enum admin|user|guest)',
    make: (z) => buildCommonSchemas(z).Role,
    samples: ['admin', 'user', 'guest', 'superuser', null, 42]
  },
  {
    name: 'Address (regex zip, length-2 country)',
    make: (z) => buildCommonSchemas(z).Address,
    samples: [
      { street: '1 Main St', city: 'Springfield', zip: '12345', country: 'US' },
      { street: '1 Main St', city: 'Springfield', zip: '1234', country: 'US' },
      { street: '1 Main St', city: 'Springfield', zip: '12345', country: 'USA' }
    ]
  },
  {
    name: 'User (full)',
    make: (z) => buildCommonSchemas(z).User,
    samples: [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'ada@lovelace.dev',
        name: 'Ada Lovelace',
        age: 36,
        role: 'admin',
        isActive: true,
        tags: ['math', 'engine'],
        address: { street: '1 St James Sq', city: 'London', zip: '12345', country: 'UK' },
        createdAt: new Date('1815-12-10T00:00:00Z')
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'ada@lovelace.dev',
        name: 'Ada Lovelace',
        age: 36,
        role: 'admin',
        isActive: true,
        tags: [],
        createdAt: new Date('1815-12-10T00:00:00Z')
      },
      {
        id: 'not-uuid',
        email: 'ada@lovelace.dev',
        name: 'Ada Lovelace',
        age: 36,
        role: 'admin',
        isActive: true,
        createdAt: new Date()
      }
    ]
  },
  {
    name: 'Order (nested User + array LineItem)',
    make: (z) => buildCommonSchemas(z).Order,
    samples: [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        customer: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'a@b.io',
          name: 'A',
          age: 1,
          role: 'user',
          isActive: true,
          createdAt: new Date()
        },
        items: [{ sku: 'ABC-1234', qty: 2, unitPrice: 9.99 }],
        status: 'pending'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        customer: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'a@b.io',
          name: 'A',
          age: 1,
          role: 'user',
          isActive: true,
          createdAt: new Date()
        },
        items: [],
        status: 'pending'
      }
    ]
  },
  {
    name: 'Event (3-arm discriminated union)',
    make: (z) => buildCommonSchemas(z).Event,
    samples: [
      { type: 'signup', userId: '550e8400-e29b-41d4-a716-446655440000' },
      { type: 'purchase', userId: '550e8400-e29b-41d4-a716-446655440000', amount: 99.99 },
      { type: 'logout', userId: '550e8400-e29b-41d4-a716-446655440000', at: new Date() },
      { type: 'unknown' },
      { type: 'signup' }
    ]
  },
  {
    name: 'SearchQuery (with defaults)',
    make: (z) => buildCommonSchemas(z).SearchQuery,
    samples: [
      { q: 'hello' },
      { q: 'hello', page: 2, perPage: 50, sort: 'desc' },
      { q: 'hello', perPage: 999 },
      {}
    ]
  },
  {
    name: 'ApiResponse (ok + unknown data)',
    make: (z) => buildCommonSchemas(z).ApiResponse,
    samples: [
      { ok: true, data: { x: 1 }, timestamp: new Date('2024-01-01T00:00:00Z') },
      { ok: false, data: null, error: 'bad', timestamp: new Date('2024-01-01T00:00:00Z') },
      { ok: true, data: 'anything', timestamp: new Date('2024-01-01T00:00:00Z') }
    ]
  }
];
