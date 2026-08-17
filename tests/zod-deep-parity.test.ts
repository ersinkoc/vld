import { z } from '../src';

describe('Zod Deep API Parity Tests', () => {
  describe('Zod Class & Namespace Exports on z / v', () => {
    it('should expose all Zod constructor aliases and helpers on z and v', () => {
      const zAny = z as any;
      expect(zAny.ZodString).toBeDefined();
      expect(zAny.ZodNumber).toBeDefined();
      expect(zAny.ZodBoolean).toBeDefined();
      expect(zAny.ZodDate).toBeDefined();
      expect(zAny.ZodBigInt).toBeDefined();
      expect(zAny.ZodObject).toBeDefined();
      expect(zAny.ZodArray).toBeDefined();
      expect(zAny.ZodEnum).toBeDefined();
      expect(zAny.ZodRecord).toBeDefined();
      expect(zAny.ZodMap).toBeDefined();
      expect(zAny.ZodSet).toBeDefined();
      expect(zAny.ZodTuple).toBeDefined();
      expect(zAny.ZodUnion).toBeDefined();
      expect(zAny.ZodIntersection).toBeDefined();
      expect(zAny.ZodDiscriminatedUnion).toBeDefined();
      expect(zAny.ZodLazy).toBeDefined();
      expect(zAny.ZodPromise).toBeDefined();
      expect(zAny.ZodLiteral).toBeDefined();
      expect(zAny.ZodCustom).toBeDefined();
      expect(zAny.ZodError).toBeDefined();
      expect(zAny.ZodType).toBeDefined();
      expect(zAny.globalRegistry).toBeDefined();
      expect(zAny.registry).toBeDefined();
      expect(zAny._default(z.string(), 'fallback').parse(undefined)).toBe('fallback');
      expect(zAny.success('ok').parse('ok')).toBe('ok');
      expect(zAny._function().parse(() => 1)).toBeInstanceOf(Function);
    });
  });

  describe('Schema Base Getters & Properties', () => {
    it('should expose type, _def, def, and _zod on all schemas', () => {
      const str = z.string();
      expect(str.type).toBe('string');
      expect(str._def.typeName).toBe('ZodString');
      expect(str.def.typeName).toBe('ZodString');
      expect(str._zod.typeName).toBe('ZodString');

      const num = z.number();
      expect(num.type).toBe('number');
      expect(num._def.typeName).toBe('ZodNumber');

      const customSchema = z.custom();
      expect(customSchema._def.typeName).toBe('ZodCustom');
    });
  });

  describe('VldString Getters', () => {
    it('should expose minLength and maxLength', () => {
      const s1 = z.string().min(5).max(10);
      expect(s1.minLength).toBe(5);
      expect(s1.maxLength).toBe(10);

      const s2 = z.string();
      expect(s2.minLength).toBeNull();
      expect(s2.maxLength).toBeNull();
    });
  });

  describe('VldNumber Getters', () => {
    it('should expose minValue, maxValue, isInt, isFinite, format', () => {
      const n1 = z.number().min(5).max(100);
      expect(n1.minValue).toBe(5);
      expect(n1.maxValue).toBe(100);
      expect(n1.isInt).toBe(false);
      expect(n1.isFinite).toBe(true);

      const intSchema = z.number().int();
      expect(intSchema.isInt).toBe(true);

      const n2 = z.number();
      expect(n2.minValue).toBeNull();
      expect(n2.maxValue).toBeNull();
      expect(n2.format).toBeNull();
    });
  });

  describe('VldDate Getters', () => {
    it('should expose minDate and maxDate', () => {
      const min = new Date('2025-01-01');
      const max = new Date('2026-01-01');
      const d1 = z.date().min(min).max(max);
      expect(d1.minDate).toEqual(min);
      expect(d1.maxDate).toEqual(max);

      const d2 = z.date();
      expect(d2.minDate).toBeNull();
      expect(d2.maxDate).toBeNull();
    });
  });

  describe('VldBigInt Getters & Methods', () => {
    it('should expose minValue, maxValue, format, and multipleOf', () => {
      const b1 = z.bigint().min(10n).max(1000n).multipleOf(5n);
      expect(b1.minValue).toBe(10n);
      expect(b1.maxValue).toBe(1000n);
      expect(b1.parse(15n)).toBe(15n);
      expect(() => b1.parse(16n)).toThrow();

      const b2 = z.bigint();
      expect(b2.minValue).toBeNull();
      expect(b2.maxValue).toBeNull();
      expect(b2.format).toBeNull();
    });
  });

  describe('VldEnum Getters', () => {
    it('should expose options and enum map', () => {
      const e = z.enum(['Red', 'Green', 'Blue']);
      expect(e.options).toEqual(['Red', 'Green', 'Blue']);
      expect(e.enum).toEqual({ Red: 'Red', Green: 'Green', Blue: 'Blue' });
    });
  });

  describe('VldLiteral Getters', () => {
    it('should expose value getter', () => {
      const lit = z.literal('hello');
      expect(lit.value).toBe('hello');
    });
  });

  describe('VldUnion & VldDiscriminatedUnion Getters', () => {
    it('should expose options on union and discriminated union', () => {
      const u = z.union([z.string(), z.number()]);
      expect(u.options).toHaveLength(2);

      const du = z.discriminatedUnion('type', [
        z.object({ type: z.literal('a'), val: z.string() }),
        z.object({ type: z.literal('b'), val: z.number() })
      ]);
      expect(du.options).toHaveLength(2);
      expect(du.discriminator).toBe('type');
    });
  });

  describe('VldRecord Getters', () => {
    it('should expose keyType and valueType', () => {
      const rec = z.record(z.string(), z.number());
      expect(rec.keyType).toBeDefined();
      expect(rec.valueType).toBeDefined();
    });
  });

  describe('VldMap & VldSet Methods and Getters', () => {
    it('should support keyType, valueType, min, max, size, nonempty on map', () => {
      const m = z.map(z.string(), z.number()).min(1).max(5).size(2).nonempty();
      expect(m.keyType).toBeDefined();
      expect(m.valueType).toBeDefined();

      const validMap = new Map([['a', 1], ['b', 2]]);
      expect(m.parse(validMap)).toEqual(validMap);

      const invalidMap = new Map([['a', 1]]);
      expect(() => m.parse(invalidMap)).toThrow();
    });

    it('should support min, max, size, nonempty on set', () => {
      const s = z.set(z.string()).min(1).max(5).size(2).nonempty();
      const validSet = new Set(['a', 'b']);
      expect(s.parse(validSet)).toEqual(validSet);

      const invalidSet = new Set(['a']);
      expect(() => s.parse(invalidSet)).toThrow();
    });
  });

  describe('z.custom() and v.custom() Overloads', () => {
    it('should support zero-arg custom validator accepting any value', () => {
      const c = (z.custom as any)();
      expect(c.parse('anything')).toBe('anything');
      expect(c.parse(123)).toBe(123);
      expect(c.parse({ a: 1 })).toEqual({ a: 1 });
    });

    it('should support predicate-function custom validator with custom message', () => {
      const c = (z.custom as any)((val: any) => typeof val === 'string' && val.startsWith('prefix_'), 'Must start with prefix_');
      expect(c.parse('prefix_valid')).toBe('prefix_valid');
      expect(() => c.parse('invalid')).toThrow('Must start with prefix_');
    });
  });
});
