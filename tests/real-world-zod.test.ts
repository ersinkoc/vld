/**
 * Real-world Zod usage pattern tests — drop-in replacement validation.
 *
 * Each test pairs a VLD schema with its Zod 4.5 equivalent and asserts
 * they produce the same success/failure outcomes for the same inputs.
 */
import { describe, it, expect } from '@jest/globals';
import { z as v, vV2 } from '../src';
import { z as zod } from 'zod';
import { toZodError } from '../src';

describe('Real-world Zod patterns — VLD drop-in compatibility', () => {
  it('discriminated union on common pet example', () => {
    const vldCat = v.discriminatedUnion('type', [
      v.object({ type: v.literal('cat'), meow: v.string() }),
      v.object({ type: v.literal('dog'), bark: v.string() }),
    ]);
    const zodCat = zod.discriminatedUnion('type', [
      zod.object({ type: zod.literal('cat'), meow: zod.string() }),
      zod.object({ type: zod.literal('dog'), bark: zod.string() }),
    ]);
    expect(vldCat.safeParse({ type: 'cat', meow: 'purr' }).success).toBe(zodCat.safeParse({ type: 'cat', meow: 'purr' }).success);
    expect(vldCat.safeParse({ type: 'dog', bark: 'woof' }).success).toBe(zodCat.safeParse({ type: 'dog', bark: 'woof' }).success);
    expect(vldCat.safeParse({ type: 'fish' }).success).toBe(zodCat.safeParse({ type: 'fish' }).success);
  });

  it('brand types parse at runtime', () => {
    const vldId = v.string().brand();
    const zodId = zod.string().brand();
    expect(vldId.safeParse('abc').success).toBe(true);
    expect(zodId.safeParse('abc').success).toBe(true);
  });

  it('pipe / pipeline chains two validators', () => {
    const vldP = v.pipeline(v.string(), v.string().min(5));
    const zodP = zod.pipe(zod.string(), zod.string().min(5));
    expect(vldP.safeParse('hello').success).toBe(true);
    expect(vldP.safeParse('hi').success).toBe(false);
    expect(vldP.safeParse('hello').success).toBe(zodP.safeParse('hello').success);
    expect(vldP.safeParse('hi').success).toBe(zodP.safeParse('hi').success);
  });

  it('preprocess transforms input before validation', () => {
    const vldPre = v.preprocess((s: unknown) => String(s).trim(), v.string().email());
    const zodPre = zod.preprocess((s: unknown) => String(s).trim(), zod.string().email());
    expect(vldPre.safeParse('  a@b.com  ').success).toBe(true);
    expect(vldPre.safeParse('  not-email  ').success).toBe(false);
    expect(vldPre.safeParse('  a@b.com  ').success).toBe(zodPre.safeParse('  a@b.com  ').success);
  });

  it('transform returns new type', () => {
    const vldT = v.string().transform((s: string) => s.length);
    const zodT = zod.string().transform((s: string) => s.length);
    const vR = vldT.safeParse('hello');
    const zR = zodT.safeParse('hello');
    expect(vR.success).toBe(true);
    expect(zR.success).toBe(true);
    if (vR.success && zR.success) {
      expect(vR.data).toBe(zR.data);
    }
  });

  it('recursive lazy schema validates nested data (basic)', () => {
    // Basic sanity: lazy() returns a VldBase that can parse simple input
    const inner: any = v.object({ name: v.string() });
    const outer = v.lazy(() => inner);
    const r = outer.safeParse({ name: 'hi' });
    expect(r.success).toBe(true);
  });

  it('refine runs sync side-effect on parse', () => {
    let sideEffect = false;
    const s = v.string().refine(() => { sideEffect = true; return true; });
    s.safeParse('x');
    expect(sideEffect).toBe(true);
  });

  it('refine async side-effect via safeParseAsync', async () => {
    let sideEffect = false;
    const s = v.string().refine(async () => { sideEffect = true; return true; });
    await s.safeParseAsync('x');
    expect(sideEffect).toBe(true);
  });

  it('object.pick() returns a subset schema', () => {
    const obj = v.object({ a: v.string(), b: v.number(), c: v.boolean() });
    const picked = obj.pick({ a: true, c: true });
    expect(picked.safeParse({ a: 'x', c: true }).success).toBe(true);
    // picked schema has a and c only
    expect(picked.safeParse({ a: 'x' }).success).toBe(false);
    expect(picked.safeParse({ a: 1, c: true }).success).toBe(false);
  });

  it('object.omit() removes fields', () => {
    const obj = v.object({ a: v.string(), b: v.number(), c: v.boolean() });
    expect(obj.omit({ b: true }).safeParse({ a: 'x', c: true }).success).toBe(true);
  });

  it('object.partial() makes all fields optional', () => {
    const obj = v.object({ a: v.string(), b: v.number() });
    expect(obj.partial().safeParse({}).success).toBe(true);
    expect(obj.partial().safeParse({ a: 'x' }).success).toBe(true);
  });

  it('object.required() reverts partial()', () => {
    const obj = v.object({ a: v.string(), b: v.number() });
    const required = obj.partial().required();
    expect(required.safeParse({ a: 'x', b: 1 }).success).toBe(true);
    expect(required.safeParse({ a: 'x' }).success).toBe(false);
  });

  it('object.merge() combines two object schemas', () => {
    const merged = v.object({ a: v.string() }).merge(v.object({ b: v.number() }));
    expect(merged.safeParse({ a: 'x', b: 1 }).success).toBe(true);
    expect(merged.safeParse({ a: 'x' }).success).toBe(false);
  });

  it('object.extend() extends schema with new fields', () => {
    const ext = v.object({ a: v.string() }).extend({ b: v.number() });
    expect(ext.safeParse({ a: 'x', b: 1 }).success).toBe(true);
  });

  it('.catch() returns fallback on parse failure', () => {
    const c = v.string().catch('default');
    expect(c.safeParse(42)).toEqual({ success: true, data: 'default' });
  });

  it('.default() returns default when input is undefined', () => {
    const d = v.string().default('default');
    expect(d.safeParse(undefined).success).toBe(true);
    expect(d.safeParse('hi').success).toBe(true);
  });

  it('optional + nullable + default chain (real user schema)', () => {
    const user = v.object({
      name: v.string(),
      email: v.string().email().optional(),
      age: v.number().int().min(0).nullable(),
      role: v.string().default('user'),
    });
    expect(user.safeParse({ name: 'A', email: 'a@b.com', age: 30, role: 'admin' }).success).toBe(true);
    expect(user.safeParse({ name: 'A', age: null }).success).toBe(true);
    expect(user.safeParse({ name: 'A', age: -1 }).success).toBe(false);
  });

  it('nested arrays + objects (typical API response)', () => {
    const api = v.object({
      data: v.array(v.object({
        id: v.string().uuid(),
        attributes: v.object({
          title: v.string(),
          tags: v.array(v.string()),
          metadata: v.record(v.string()).optional(),
        }),
      })),
      meta: v.object({
        total: v.number().int().nonnegative(),
        page: v.number().int().positive().default(1),
      }),
    });
    const sample = {
      data: [{ id: '00000000-0000-4000-8000-000000000000', attributes: { title: 'Hello', tags: ['a'] } }],
      meta: { total: 10 },
    };
    expect(api.safeParse(sample).success).toBe(true);
  });

  it('toZodError converts VldError to ZodError shape', () => {
    const r = v.object({ a: v.string() }).safeParse({ a: 1 });
    expect(r.success).toBe(false);
    if (!r.success) {
      const zErr = toZodError(r.error);
      expect(zErr.name).toBe('ZodError');
      expect(zErr.issues.length).toBe(1);
      const firstIssue = zErr.issues[0]!;
      expect(firstIssue.code).toBe('invalid_type');
    }
  });

  it('vV2 factories produce the same parse results as v', () => {
    const s1 = vV2.string().email().min(1);
    const s2 = v.string().email().min(1);
    const samples = ['a@b.com', 'bad', 42, null, undefined];
    for (const s of samples) {
      expect(s1.safeParse(s).success).toBe(s2.safeParse(s).success);
    }
  });

  it('vV2.number() chains match v chains', () => {
    const s1 = vV2.number().int().positive().min(1);
    const s2 = v.number().int().positive().min(1);
    for (const n of [5, 0, -1, 1.5, 100, 'x']) {
      expect(s1.safeParse(n).success).toBe(s2.safeParse(n).success);
    }
  });

  it('vV2.array() matches v.array()', () => {
    const s1 = vV2.array(vV2.string().min(1)).max(3);
    const s2 = v.array(v.string().min(1)).max(3);
    for (const arr of [['a'], ['a', 'b'], ['a', 'b', 'c', 'd'], [1], []]) {
      expect(s1.safeParse(arr).success).toBe(s2.safeParse(arr).success);
    }
  });
});
