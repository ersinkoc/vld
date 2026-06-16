import { describe, expect, it } from '@jest/globals';
import * as zod from 'zod';
import { v } from '../src/index';

type SyncSchema<T = unknown> = {
  safeParse(value: unknown): { success: true; data: T } | { success: false; error: unknown };
};

type AsyncSchema<T = unknown> = {
  safeParseAsync(value: unknown): Promise<{ success: true; data: T } | { success: false; error: unknown }>;
};

interface Case<T = unknown> {
  name: string;
  zod: SyncSchema<T>;
  vld: SyncSchema<T>;
  valid: unknown[];
  invalid: unknown[];
}

async function expectSameSyncBehavior<T>(testCase: Case<T>): Promise<void> {
  for (const value of testCase.valid) {
    const zodResult = testCase.zod.safeParse(value);
    const vldResult = testCase.vld.safeParse(value);

    expect(vldResult.success).toBe(zodResult.success);
    if (zodResult.success && vldResult.success) {
      expect(vldResult.data).toEqual(zodResult.data);
    }
  }

  for (const value of testCase.invalid) {
    const zodResult = testCase.zod.safeParse(value);
    const vldResult = testCase.vld.safeParse(value);

    expect(vldResult.success).toBe(zodResult.success);
  }
}

describe('Zod behavior parity matrix', () => {
  const cases: Case[] = [
    {
      name: 'string constraints',
      zod: zod.string().min(2).max(5).regex(/^[a-z]+$/),
      vld: v.string().min(2).max(5).regex(/^[a-z]+$/),
      valid: ['ab', 'abcde'],
      invalid: ['', 'a', 'abcdef', 'AB']
    },
    {
      name: 'number constraints',
      zod: zod.number().int().gte(0).lte(10).multipleOf(2),
      vld: v.number().int().gte(0).lte(10).multipleOf(2),
      valid: [0, 2, 10],
      invalid: [-2, 3, 12, Number.NaN, '2']
    },
    {
      name: 'boolean and literals',
      zod: zod.union([zod.literal(true), zod.literal('yes')]),
      vld: v.union(v.literal(true), v.literal('yes')),
      valid: [true, 'yes'],
      invalid: [false, 'no', 1]
    },
    {
      name: 'enum values',
      zod: zod.enum(['draft', 'published']),
      vld: v.enum('draft', 'published'),
      valid: ['draft', 'published'],
      invalid: ['archived', 1, null]
    },
    {
      name: 'optional nullable object',
      zod: zod.object({
        id: zod.string(),
        age: zod.number().optional(),
        nickname: zod.string().nullable()
      }),
      vld: v.object({
        id: v.string(),
        age: v.number().optional(),
        nickname: v.string().nullable()
      }),
      valid: [
        { id: 'usr_1', nickname: null },
        { id: 'usr_2', age: 42, nickname: 'neo' }
      ],
      invalid: [
        { id: 1, nickname: null },
        { id: 'usr_3' },
        { id: 'usr_4', age: '42', nickname: null }
      ]
    },
    {
      name: 'array constraints',
      zod: zod.array(zod.string()).min(1).max(3),
      vld: v.array(v.string()).min(1).max(3),
      valid: [['a'], ['a', 'b', 'c']],
      invalid: [[], ['a', 'b', 'c', 'd'], [1]]
    },
    {
      name: 'tuple values',
      zod: zod.tuple([zod.string(), zod.number()]),
      vld: v.tuple(v.string(), v.number()),
      valid: [['a', 1]],
      invalid: [['a'], ['a', '1'], [1, 'a']]
    },
    {
      name: 'record values',
      zod: zod.record(zod.string(), zod.number()),
      vld: v.record(v.number()),
      valid: [{ a: 1, b: 2 }],
      invalid: [{ a: '1' }, null, []]
    },
    {
      name: 'coerced primitives',
      zod: zod.object({
        name: zod.coerce.string(),
        count: zod.coerce.number(),
        active: zod.coerce.boolean()
      }),
      vld: v.object({
        name: v.coerce.string(),
        count: v.coerce.number(),
        active: v.coerce.boolean()
      }),
      valid: [
        { name: 123, count: '42', active: 1 },
        { name: true, count: false, active: '' },
        { name: null, count: '', active: null },
        { name: undefined, count: null, active: undefined },
        { name: Symbol('id'), count: '   ', active: [] }
      ],
      invalid: [
        { name: null, count: 'x', active: true },
        { name: 'ok', count: undefined, active: true }
      ]
    },
    {
      name: 'coerced dates',
      zod: zod.coerce.date(),
      vld: v.coerce.date(),
      valid: [null, true, false, 0, '2024-01-15', [1, 2]],
      invalid: [undefined, '', 'not-a-date', {}, []]
    },
    {
      name: 'transform values',
      zod: zod.string().transform(value => value.trim().length),
      vld: v.string().transform(value => value.trim().length),
      valid: [' ok ', 'abcd'],
      invalid: [1, null]
    },
    {
      name: 'refine values',
      zod: zod.string().refine(value => value.startsWith('v')),
      vld: v.string().refine(value => value.startsWith('v')),
      valid: ['vld'],
      invalid: ['zod', 1]
    },
    {
      name: 'default values',
      zod: zod.string().default('fallback'),
      vld: v.string().default('fallback'),
      valid: [undefined, 'ok'],
      invalid: [1, null]
    },
    {
      name: 'catch values',
      zod: zod.string().catch('fallback'),
      vld: v.string().catch('fallback'),
      valid: ['ok', 1, null],
      invalid: []
    }
  ];

  it.each(cases)('matches Zod safeParse behavior for $name', async testCase => {
    await expectSameSyncBehavior(testCase);
  });

  it('matches Zod async refinement behavior', async () => {
    const zodSchema: AsyncSchema<string> = zod.string().refine(async value => value.startsWith('v'));
    const vldSchema: AsyncSchema<string> = v.string().refine(async value => value.startsWith('v'));

    await expect(zodSchema.safeParseAsync('vld')).resolves.toMatchObject({ success: true, data: 'vld' });
    await expect(vldSchema.safeParseAsync('vld')).resolves.toMatchObject({ success: true, data: 'vld' });
    await expect(zodSchema.safeParseAsync('bad')).resolves.toMatchObject({ success: false });
    await expect(vldSchema.safeParseAsync('bad')).resolves.toMatchObject({ success: false });
  });
});
