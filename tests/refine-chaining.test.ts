import { describe, it, expect } from '@jest/globals';
import { v } from '../src/index';

describe('Method Chaining after .refine(), .superRefine(), and .check()', () => {
  describe('VldString chaining', () => {
    it('should support .refine().max() chaining', () => {
      const schema = v.string().refine(s => s.startsWith('a'), 'Must start with a').max(5);
      
      expect(schema.parse('abc')).toBe('abc');
      expect(schema.parse('a1234')).toBe('a1234');
      
      expect(() => schema.parse('bbc')).toThrow('Must start with a');
      expect(() => schema.parse('a123456')).toThrow();
    });

    it('should support .refine().min().email() chaining', () => {
      const schema = v.string().refine(s => !s.includes('admin'), 'Cannot be admin').min(5).email();

      expect(schema.parse('user@example.com')).toBe('user@example.com');
      expect(() => schema.parse('admin@example.com')).toThrow('Cannot be admin');
      expect(() => schema.parse('a@b')).toThrow();
    });

    it('should cover custom and default error messages for sync and async refinements', async () => {
      const noMsgSync = v.string().refine(s => s === 'valid');
      expect(() => noMsgSync.parse('bad')).toThrow('Refinement check failed');

      const customMsgSync = v.string().refine(s => s === 'valid', 'Custom fail');
      expect(() => customMsgSync.parse('bad')).toThrow('Custom fail');

      const noMsgAsync = v.string().refine(async s => s === 'valid');
      await expect(noMsgAsync.parseAsync('bad')).rejects.toThrow('Refinement check failed');

      const customMsgAsync = v.string().refine(async s => s === 'valid', 'Custom async fail');
      await expect(customMsgAsync.parseAsync('bad')).rejects.toThrow('Custom async fail');

      const directRefine = new (v.string().refine(() => false).constructor as any)(v.string(), () => false);
      expect(() => directRefine.parse('a')).toThrow('Refinement check failed');
    });

    it('should support all string delegated methods on .refine()', () => {
      const base = v.string().refine(s => s.length > 0);
      expect(base.length(4).parse('test')).toBe('test');
      expect(base.url().parse('https://example.com')).toBe('https://example.com');
      expect(base.uuid().parse('123e4567-e89b-12d3-a456-426614174000')).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(base.regex(/^[a-z]+$/).parse('abc')).toBe('abc');
      expect(base.startsWith('foo').parse('foobar')).toBe('foobar');
      expect(base.endsWith('bar').parse('foobar')).toBe('foobar');
      expect(base.includes('oo').parse('foobar')).toBe('foobar');
      expect(base.ip().parse('192.168.1.1')).toBe('192.168.1.1');
      expect(base.ipv4().parse('10.0.0.1')).toBe('10.0.0.1');
      expect(base.ipv6().parse('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
      expect(base.nonempty().parse('ok')).toBe('ok');
      expect(base.trim().parse('  ok  ')).toBe('ok');
      expect(base.toLowerCase().parse('ABC')).toBe('abc');
      expect(base.lowercase().parse('ABC')).toBe('abc');
      expect(base.toUpperCase().parse('abc')).toBe('ABC');
      expect(base.uppercase().parse('abc')).toBe('ABC');
    });

    it('should support all string delegated methods on .superRefine()', () => {
      const base = v.string().superRefine((val, ctx) => {
        if (!val) ctx.addIssue({ message: 'Empty' });
      });
      expect(base.min(2).parse('test')).toBe('test');
      expect(base.max(10).parse('test')).toBe('test');
      expect(base.length(4).parse('test')).toBe('test');
      expect(base.email().parse('a@b.com')).toBe('a@b.com');
      expect(base.url().parse('http://a.b')).toBe('http://a.b');
      expect(base.uuid().parse('123e4567-e89b-12d3-a456-426614174000')).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(base.regex(/^[a-z]+$/).parse('abc')).toBe('abc');
      expect(base.startsWith('foo').parse('foobar')).toBe('foobar');
      expect(base.endsWith('bar').parse('foobar')).toBe('foobar');
      expect(base.includes('oo').parse('foobar')).toBe('foobar');
      expect(base.ip().parse('127.0.0.1')).toBe('127.0.0.1');
      expect(base.ipv4().parse('127.0.0.1')).toBe('127.0.0.1');
      expect(base.ipv6().parse('2001:db8::1')).toBe('2001:db8::1');
      expect(base.nonempty().parse('ok')).toBe('ok');
      expect(base.trim().parse('  ok  ')).toBe('ok');
      expect(base.toLowerCase().parse('ABC')).toBe('abc');
      expect(base.lowercase().parse('ABC')).toBe('abc');
      expect(base.toUpperCase().parse('abc')).toBe('ABC');
      expect(base.uppercase().parse('abc')).toBe('ABC');
    });

    it('should support .check().max() Zod 4 API chaining', () => {
      const schema = v.string().check(s => s.endsWith('.com')).max(15);
      
      expect(schema.parse('test.com')).toBe('test.com');
      expect(() => schema.parse('test.org')).toThrow();
      expect(() => schema.parse('extremelylongdomain.com')).toThrow();
    });
  });

  describe('VldNumber chaining', () => {
    it('should support .refine().positive() chaining', () => {
      const schema = v.number().refine(n => n % 2 === 0, 'Must be even').positive();

      expect(schema.parse(4)).toBe(4);
      expect(schema.parse(100)).toBe(100);

      expect(() => schema.parse(3)).toThrow('Must be even');
      expect(() => schema.parse(-4)).toThrow();
    });

    it('should support all number delegated methods on .refine()', () => {
      const base = v.number().refine(n => n !== 0);
      expect(base.negative().parse(-5)).toBe(-5);
      expect(base.nonnegative().parse(5)).toBe(5);
      expect(base.nonpositive().parse(-5)).toBe(-5);
      expect(base.int().parse(5)).toBe(5);
      expect(base.finite().parse(5)).toBe(5);
      expect(base.safe().parse(5)).toBe(5);
      expect(base.multipleOf(2).parse(4)).toBe(4);
      expect(base.step(2).parse(4)).toBe(4);
      expect(base.gt(2).parse(4)).toBe(4);
      expect(base.gte(4).parse(4)).toBe(4);
      expect(base.lt(10).parse(4)).toBe(4);
      expect(base.lte(4).parse(4)).toBe(4);
    });

    it('should support all number delegated methods on .superRefine()', () => {
      const base = v.number().superRefine((n, ctx) => {
        if (n === 999) ctx.addIssue({ message: 'Bad' });
      });
      expect(base.positive().parse(5)).toBe(5);
      expect(base.negative().parse(-5)).toBe(-5);
      expect(base.nonnegative().parse(5)).toBe(5);
      expect(base.nonpositive().parse(-5)).toBe(-5);
      expect(base.int().parse(5)).toBe(5);
      expect(base.finite().parse(5)).toBe(5);
      expect(base.safe().parse(5)).toBe(5);
      expect(base.multipleOf(2).parse(4)).toBe(4);
      expect(base.step(2).parse(4)).toBe(4);
      expect(base.gt(2).parse(4)).toBe(4);
      expect(base.gte(4).parse(4)).toBe(4);
      expect(base.lt(10).parse(4)).toBe(4);
      expect(base.lte(4).parse(4)).toBe(4);
    });
  });

  describe('VldObject chaining', () => {
    it('should support all object delegated methods on .refine()', () => {
      const base = v.object({ a: v.string(), b: v.number() }).refine(() => true);
      expect(base.shape.a).toBeDefined();
      expect(base.keyof).toBeDefined();
      expect(base.pick('a').parse({ a: 'hi' })).toEqual({ a: 'hi' });
      expect(base.omit('b').parse({ a: 'hi' })).toEqual({ a: 'hi' });
      expect(base.partial().parse({})).toEqual({});
      expect(base.required().parse({ a: 'hi', b: 1 })).toEqual({ a: 'hi', b: 1 });
      expect(base.extend({ c: v.boolean() }).parse({ a: 'hi', b: 1, c: true })).toEqual({ a: 'hi', b: 1, c: true });
      expect(base.merge(v.object({ c: v.boolean() })).parse({ a: 'hi', b: 1, c: true })).toEqual({ a: 'hi', b: 1, c: true });
      expect(base.strict().parse({ a: 'hi', b: 1 })).toEqual({ a: 'hi', b: 1 });
      expect(base.passthrough().parse({ a: 'hi', b: 1, extra: 2 })).toEqual({ a: 'hi', b: 1, extra: 2 });
      expect(base.strip().parse({ a: 'hi', b: 1, extra: 2 })).toEqual({ a: 'hi', b: 1 });
      expect(base.catchall(v.number()).parse({ a: 'hi', b: 1, extra: 2 })).toEqual({ a: 'hi', b: 1, extra: 2 });
    });

    it('should support all object delegated methods on .superRefine()', () => {
      const base = v.object({ a: v.string(), b: v.number() }).superRefine(() => undefined);
      expect(base.shape.a).toBeDefined();
      expect(base.keyof).toBeDefined();
      expect(base.pick('a').parse({ a: 'hi' })).toEqual({ a: 'hi' });
      expect(base.omit('b').parse({ a: 'hi' })).toEqual({ a: 'hi' });
      expect(base.partial().parse({})).toEqual({});
      expect(base.required().parse({ a: 'hi', b: 1 })).toEqual({ a: 'hi', b: 1 });
      expect(base.extend({ c: v.boolean() }).parse({ a: 'hi', b: 1, c: true })).toEqual({ a: 'hi', b: 1, c: true });
      expect(base.merge(v.object({ c: v.boolean() })).parse({ a: 'hi', b: 1, c: true })).toEqual({ a: 'hi', b: 1, c: true });
      expect(base.strict().parse({ a: 'hi', b: 1 })).toEqual({ a: 'hi', b: 1 });
      expect(base.passthrough().parse({ a: 'hi', b: 1, extra: 2 })).toEqual({ a: 'hi', b: 1, extra: 2 });
      expect(base.strip().parse({ a: 'hi', b: 1, extra: 2 })).toEqual({ a: 'hi', b: 1 });
      expect(base.catchall(v.number()).parse({ a: 'hi', b: 1, extra: 2 })).toEqual({ a: 'hi', b: 1, extra: 2 });
    });
  });

  describe('VldArray chaining', () => {
    it('should support array methods on .refine() and .superRefine()', () => {
      const baseRefine = v.array(v.string()).refine(arr => arr.length > 0);
      expect(baseRefine.element).toBeDefined();
      expect(baseRefine.unwrap()).toBeDefined();

      const baseSuperRefine = v.array(v.string()).superRefine(() => undefined);
      expect(baseSuperRefine.element).toBeDefined();
      expect(baseSuperRefine.unwrap()).toBeDefined();
    });
  });

  describe('Fallback branch coverage on non-matching types', () => {
    it('should fallback gracefully when methods are called on inappropriate underlying schema', () => {
      const refineAny = v.any().refine(() => true);
      expect(refineAny.min(5).parse('test')).toBe('test');
      expect(refineAny.max(5).parse('test')).toBe('test');
      expect(refineAny.length(5).parse('test')).toBe('test');
      expect(refineAny.email().parse('test')).toBe('test');
      expect(refineAny.url().parse('test')).toBe('test');
      expect(refineAny.uuid().parse('test')).toBe('test');
      expect(refineAny.regex(/a/).parse('test')).toBe('test');
      expect(refineAny.startsWith('a').parse('test')).toBe('test');
      expect(refineAny.endsWith('a').parse('test')).toBe('test');
      expect(refineAny.includes('a').parse('test')).toBe('test');
      expect(refineAny.ip().parse('test')).toBe('test');
      expect(refineAny.ipv4().parse('test')).toBe('test');
      expect(refineAny.ipv6().parse('test')).toBe('test');
      expect(refineAny.nonempty().parse('test')).toBe('test');
      expect(refineAny.trim().parse('test')).toBe('test');
      expect(refineAny.toLowerCase().parse('test')).toBe('test');
      expect(refineAny.toUpperCase().parse('test')).toBe('test');
      expect(refineAny.positive().parse(1)).toBe(1);
      expect(refineAny.negative().parse(1)).toBe(1);
      expect(refineAny.nonnegative().parse(1)).toBe(1);
      expect(refineAny.nonpositive().parse(1)).toBe(1);
      expect(refineAny.int().parse(1)).toBe(1);
      expect(refineAny.finite().parse(1)).toBe(1);
      expect(refineAny.safe().parse(1)).toBe(1);
      expect(refineAny.multipleOf(2).parse(1)).toBe(1);
      expect(refineAny.step(2).parse(1)).toBe(1);
      expect(refineAny.gt(2).parse(1)).toBe(1);
      expect(refineAny.gte(2).parse(1)).toBe(1);
      expect(refineAny.lt(2).parse(1)).toBe(1);
      expect(refineAny.lte(2).parse(1)).toBe(1);
      expect(refineAny.extend({}).parse('test')).toBe('test');
      expect(refineAny.merge({}).parse('test')).toBe('test');
      expect(refineAny.pick('a').parse('test')).toBe('test');
      expect(refineAny.omit('a').parse('test')).toBe('test');
      expect(refineAny.partial().parse('test')).toBe('test');
      expect(refineAny.required().parse('test')).toBe('test');
      expect(refineAny.strict().parse('test')).toBe('test');
      expect(refineAny.passthrough().parse('test')).toBe('test');
      expect(refineAny.strip().parse('test')).toBe('test');
      expect(refineAny.catchall(v.string()).parse('test')).toBe('test');
      expect(refineAny.unwrap()).toBeDefined();

      const superRefineAny = v.any().superRefine(() => undefined);
      expect(superRefineAny.min(5).parse('test')).toBe('test');
      expect(superRefineAny.max(5).parse('test')).toBe('test');
      expect(superRefineAny.length(5).parse('test')).toBe('test');
      expect(superRefineAny.email().parse('test')).toBe('test');
      expect(superRefineAny.url().parse('test')).toBe('test');
      expect(superRefineAny.uuid().parse('test')).toBe('test');
      expect(superRefineAny.regex(/a/).parse('test')).toBe('test');
      expect(superRefineAny.startsWith('a').parse('test')).toBe('test');
      expect(superRefineAny.endsWith('a').parse('test')).toBe('test');
      expect(superRefineAny.includes('a').parse('test')).toBe('test');
      expect(superRefineAny.ip().parse('test')).toBe('test');
      expect(superRefineAny.ipv4().parse('test')).toBe('test');
      expect(superRefineAny.ipv6().parse('test')).toBe('test');
      expect(superRefineAny.nonempty().parse('test')).toBe('test');
      expect(superRefineAny.trim().parse('test')).toBe('test');
      expect(superRefineAny.toLowerCase().parse('test')).toBe('test');
      expect(superRefineAny.toUpperCase().parse('test')).toBe('test');
      expect(superRefineAny.positive().parse(1)).toBe(1);
      expect(superRefineAny.negative().parse(1)).toBe(1);
      expect(superRefineAny.nonnegative().parse(1)).toBe(1);
      expect(superRefineAny.nonpositive().parse(1)).toBe(1);
      expect(superRefineAny.int().parse(1)).toBe(1);
      expect(superRefineAny.finite().parse(1)).toBe(1);
      expect(superRefineAny.safe().parse(1)).toBe(1);
      expect(superRefineAny.multipleOf(2).parse(1)).toBe(1);
      expect(superRefineAny.step(2).parse(1)).toBe(1);
      expect(superRefineAny.gt(2).parse(1)).toBe(1);
      expect(superRefineAny.gte(2).parse(1)).toBe(1);
      expect(superRefineAny.lt(2).parse(1)).toBe(1);
      expect(superRefineAny.lte(2).parse(1)).toBe(1);
      expect(superRefineAny.extend({}).parse('test')).toBe('test');
      expect(superRefineAny.merge({}).parse('test')).toBe('test');
      expect(superRefineAny.pick('a').parse('test')).toBe('test');
      expect(superRefineAny.omit('a').parse('test')).toBe('test');
      expect(superRefineAny.partial().parse('test')).toBe('test');
      expect(superRefineAny.required().parse('test')).toBe('test');
      expect(superRefineAny.strict().parse('test')).toBe('test');
      expect(superRefineAny.passthrough().parse('test')).toBe('test');
      expect(superRefineAny.strip().parse('test')).toBe('test');
      expect(superRefineAny.catchall(v.string()).parse('test')).toBe('test');
      expect(superRefineAny.unwrap()).toBeDefined();
    });
  });

  describe('VldBigInt and VldDate chaining', () => {
    it('should support .refine().positive() on BigInt', () => {
      const schema = v.bigint().refine(b => b % 2n === 0n, 'Must be even bigint').positive();

      expect(schema.parse(4n)).toBe(4n);
      expect(() => schema.parse(3n)).toThrow('Must be even bigint');
      expect(() => schema.parse(-4n)).toThrow();
    });

    it('should support .refine().min() on Date', () => {
      const past = new Date(2018, 0, 1);
      const schema = v.date().refine(d => d.getFullYear() >= 2020, 'Must be 2020+').min(past);

      const validDate = new Date(2022, 5, 1);
      expect(schema.parse(validDate)).toBe(validDate);
      expect(() => schema.parse(new Date(2019, 0, 1))).toThrow('Must be 2020+');
      expect(() => schema.parse(new Date(2017, 0, 1))).toThrow();
    });
  });
});
