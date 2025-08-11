import { describe, it, expect } from '@jest/globals';
import { VldBoolean } from '../../src/validators/boolean';
import { VldDate } from '../../src/validators/date';
import { VldArray } from '../../src/validators/array';
import { VldObject } from '../../src/validators/object';
import { VldUnion } from '../../src/validators/union';
import { VldLiteral } from '../../src/validators/literal';
import { VldEnum } from '../../src/validators/enum';
import { VldTuple } from '../../src/validators/tuple';
import { VldRecord } from '../../src/validators/record';
import { VldIntersection } from '../../src/validators/intersection';
import { VldBigInt } from '../../src/validators/bigint';
import { VldSymbol } from '../../src/validators/symbol';
import { VldSet } from '../../src/validators/set';
import { VldMap } from '../../src/validators/map';
import { VldAny } from '../../src/validators/any';
import { VldUnknown } from '../../src/validators/unknown';
import { VldVoid } from '../../src/validators/void';
import { VldNever } from '../../src/validators/never';
import { VldString } from '../../src/validators/string';
import { VldNumber } from '../../src/validators/number';

describe('All Validators - Comprehensive Tests', () => {
  describe('VldBoolean', () => {
    it('should validate boolean values', () => {
      const validator = VldBoolean.create();
      expect(validator.parse(true)).toBe(true);
      expect(validator.parse(false)).toBe(false);
      expect(() => validator.parse('true')).toThrow();
      expect(() => validator.parse(1)).toThrow();
      expect(() => validator.parse(null)).toThrow();
    });

    it('should validate true only', () => {
      const validator = VldBoolean.create().true();
      expect(validator.parse(true)).toBe(true);
      expect(() => validator.parse(false)).toThrow('Value must be true');
    });

    it('should validate false only', () => {
      const validator = VldBoolean.create().false();
      expect(validator.parse(false)).toBe(false);
      expect(() => validator.parse(true)).toThrow('Value must be false');
    });

    it('should handle safeParse', () => {
      const validator = VldBoolean.create();
      expect(validator.safeParse(true).success).toBe(true);
      expect(validator.safeParse('true').success).toBe(false);
    });
  });

  describe('VldDate', () => {
    const now = new Date();
    const past = new Date('2020-01-01');
    const future = new Date('2030-01-01');

    it('should validate Date objects', () => {
      const validator = VldDate.create();
      expect(validator.parse(now)).toEqual(now);
      expect(validator.parse(past)).toEqual(past);
    });

    it('should parse date strings', () => {
      const validator = VldDate.create();
      const result = validator.parse('2023-06-15');
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toContain('2023-06-15');
    });

    it('should parse timestamps', () => {
      const validator = VldDate.create();
      const timestamp = Date.now();
      const result = validator.parse(timestamp);
      expect(result.getTime()).toBe(timestamp);
    });

    it('should reject invalid dates', () => {
      const validator = VldDate.create();
      expect(() => validator.parse('invalid')).toThrow();
      expect(() => validator.parse({})).toThrow();
      expect(() => validator.parse(null)).toThrow();
    });

    it('should validate min date', () => {
      const validator = VldDate.create().min(past);
      expect(validator.parse(now)).toEqual(now);
      expect(() => validator.parse(new Date('2019-01-01'))).toThrow();
    });

    it('should validate max date', () => {
      const validator = VldDate.create().max(future);
      expect(validator.parse(now)).toEqual(now);
      expect(() => validator.parse(new Date('2031-01-01'))).toThrow();
    });

    it('should validate date between range', () => {
      const validator = VldDate.create().between(past, future);
      expect(validator.parse(now)).toEqual(now);
      expect(() => validator.parse(new Date('2019-01-01'))).toThrow();
      expect(() => validator.parse(new Date('2031-01-01'))).toThrow();
    });

    it('should validate past dates', () => {
      const validator = VldDate.create().past();
      expect(validator.parse(past)).toEqual(past);
      expect(() => validator.parse(future)).toThrow();
    });

    it('should validate future dates', () => {
      const validator = VldDate.create().future();
      expect(validator.parse(future)).toEqual(future);
      expect(() => validator.parse(past)).toThrow();
    });

    it('should validate weekday', () => {
      const validator = VldDate.create().weekday();
      const monday = new Date('2024-01-01'); // Monday
      const saturday = new Date('2024-01-06'); // Saturday
      expect(validator.parse(monday)).toEqual(monday);
      expect(() => validator.parse(saturday)).toThrow();
    });

    it('should validate weekend', () => {
      const validator = VldDate.create().weekend();
      const saturday = new Date('2024-01-06'); // Saturday
      const monday = new Date('2024-01-01'); // Monday
      expect(validator.parse(saturday)).toEqual(saturday);
      expect(() => validator.parse(monday)).toThrow();
    });

    it('should validate today', () => {
      const validator = VldDate.create().today();
      const today = new Date();
      const yesterday = new Date(Date.now() - 86400000);
      expect(validator.parse(today)).toEqual(today);
      expect(() => validator.parse(yesterday)).toThrow();
    });
  });

  describe('VldArray', () => {
    it('should validate arrays', () => {
      const validator = VldArray.create(VldNumber.create());
      expect(validator.parse([1, 2, 3])).toEqual([1, 2, 3]);
      expect(validator.parse([])).toEqual([]);
      expect(() => validator.parse('not array')).toThrow();
      expect(() => validator.parse([1, 'two', 3])).toThrow();
    });

    it('should validate min length', () => {
      const validator = VldArray.create(VldString.create()).min(2);
      expect(validator.parse(['a', 'b'])).toEqual(['a', 'b']);
      expect(() => validator.parse(['a'])).toThrow();
    });

    it('should validate max length', () => {
      const validator = VldArray.create(VldString.create()).max(2);
      expect(validator.parse(['a', 'b'])).toEqual(['a', 'b']);
      expect(() => validator.parse(['a', 'b', 'c'])).toThrow();
    });

    it('should validate exact length', () => {
      const validator = VldArray.create(VldNumber.create()).length(3);
      expect(validator.parse([1, 2, 3])).toEqual([1, 2, 3]);
      expect(() => validator.parse([1, 2])).toThrow();
      expect(() => validator.parse([1, 2, 3, 4])).toThrow();
    });

    it('should validate nonempty', () => {
      const validator = VldArray.create(VldString.create()).nonempty();
      expect(validator.parse(['a'])).toEqual(['a']);
      expect(() => validator.parse([])).toThrow();
    });

    it('should validate unique items', () => {
      const validator = VldArray.create(VldNumber.create()).unique();
      expect(validator.parse([1, 2, 3])).toEqual([1, 2, 3]);
      expect(() => validator.parse([1, 2, 2, 3])).toThrow();
    });

    it('should validate between range', () => {
      const validator = VldArray.create(VldString.create()).between(2, 4);
      expect(validator.parse(['a', 'b'])).toEqual(['a', 'b']);
      expect(validator.parse(['a', 'b', 'c', 'd'])).toEqual(['a', 'b', 'c', 'd']);
      expect(() => validator.parse(['a'])).toThrow();
      expect(() => validator.parse(['a', 'b', 'c', 'd', 'e'])).toThrow();
    });
  });

  describe('VldObject', () => {
    const shape = {
      name: VldString.create(),
      age: VldNumber.create(),
      active: VldBoolean.create()
    };

    it('should validate objects', () => {
      const validator = VldObject.create(shape);
      const data = { name: 'John', age: 30, active: true };
      expect(validator.parse(data)).toEqual(data);
    });

    it('should reject invalid types', () => {
      const validator = VldObject.create(shape);
      expect(() => validator.parse(null)).toThrow();
      expect(() => validator.parse([])).toThrow();
      expect(() => validator.parse('not object')).toThrow();
    });

    it('should reject missing fields', () => {
      const validator = VldObject.create(shape);
      expect(() => validator.parse({ name: 'John' })).toThrow();
    });

    it('should handle partial', () => {
      const validator = VldObject.create(shape).partial();
      expect(validator.parse({})).toEqual({});
      expect(validator.parse({ name: 'John' })).toEqual({ name: 'John' });
      expect(validator.parse({ name: 'John', age: 30 })).toEqual({ name: 'John', age: 30 });
    });

    it('should handle strict mode', () => {
      const validator = VldObject.create(shape).strict();
      const data = { name: 'John', age: 30, active: true };
      expect(validator.parse(data)).toEqual(data);
      expect(() => validator.parse({ ...data, extra: 'field' })).toThrow();
    });

    it('should handle passthrough', () => {
      const validator = VldObject.create(shape).passthrough();
      const data = { name: 'John', age: 30, active: true, extra: 'field' };
      expect(validator.parse(data)).toEqual(data);
    });

    it('should pick fields', () => {
      const validator = VldObject.create(shape).pick('name', 'age');
      const data = { name: 'John', age: 30 };
      expect(validator.parse(data)).toEqual(data);
      // picked validator doesn't require 'active' field anymore
    });

    it('should omit fields', () => {
      const validator = VldObject.create(shape).omit('active');
      const data = { name: 'John', age: 30 };
      expect(validator.parse(data)).toEqual(data);
    });

    it('should extend shape', () => {
      const validator = VldObject.create(shape).extend({
        email: VldString.create().email()
      });
      const data = { name: 'John', age: 30, active: true, email: 'john@example.com' };
      expect(validator.parse(data)).toEqual(data);
    });

    it('should merge objects', () => {
      const base = VldObject.create({ name: VldString.create() });
      const extra = VldObject.create({ age: VldNumber.create() });
      const validator = base.merge(extra);
      const data = { name: 'John', age: 30 };
      expect(validator.parse(data)).toEqual(data);
    });

    it('should make fields required', () => {
      const shape2 = { name: VldString.create().optional() };
      const validator = VldObject.create(shape2).required();
      expect(() => validator.parse({})).toThrow();
      expect(validator.parse({ name: 'John' })).toEqual({ name: 'John' });
    });

    it('should handle deep partial', () => {
      const nestedShape = {
        user: VldObject.create({
          name: VldString.create(),
          profile: VldObject.create({
            age: VldNumber.create()
          })
        })
      };
      const validator = VldObject.create(nestedShape).deepPartial();
      expect(validator.parse({})).toEqual({});
      expect(validator.parse({ user: {} })).toEqual({ user: {} });
      expect(validator.parse({ user: { profile: {} } })).toEqual({ user: { profile: {} } });
    });
  });

  describe('VldUnion', () => {
    it('should validate union types', () => {
      const validator = VldUnion.create(
        VldString.create(),
        VldNumber.create()
      );
      expect(validator.parse('test')).toBe('test');
      expect(validator.parse(42)).toBe(42);
      expect(() => validator.parse(true)).toThrow();
    });

    it('should try validators in order', () => {
      const validator = VldUnion.create(
        VldString.create().min(5),
        VldString.create()
      );
      expect(validator.parse('hello')).toBe('hello');
      expect(validator.parse('hi')).toBe('hi');
    });
  });

  describe('VldLiteral', () => {
    it('should validate literal values', () => {
      const validator = VldLiteral.create('test');
      expect(validator.parse('test')).toBe('test');
      expect(() => validator.parse('other')).toThrow();
    });

    it('should work with numbers', () => {
      const validator = VldLiteral.create(42);
      expect(validator.parse(42)).toBe(42);
      expect(() => validator.parse(43)).toThrow();
    });

    it('should work with booleans', () => {
      const validator = VldLiteral.create(true);
      expect(validator.parse(true)).toBe(true);
      expect(() => validator.parse(false)).toThrow();
    });

    it('should work with null', () => {
      const validator = VldLiteral.create(null);
      expect(validator.parse(null)).toBe(null);
      expect(() => validator.parse(undefined)).toThrow();
    });
  });

  describe('VldEnum', () => {
    it('should validate enum values', () => {
      const validator = VldEnum.create(['red', 'green', 'blue']);
      expect(validator.parse('red')).toBe('red');
      expect(validator.parse('green')).toBe('green');
      expect(validator.parse('blue')).toBe('blue');
      expect(() => validator.parse('yellow')).toThrow();
    });
  });

  describe('VldTuple', () => {
    it('should validate tuples', () => {
      const validator = VldTuple.create(
        VldString.create(),
        VldNumber.create(),
        VldBoolean.create()
      );
      expect(validator.parse(['test', 42, true])).toEqual(['test', 42, true]);
    });

    it('should validate length', () => {
      const validator = VldTuple.create(VldString.create(), VldNumber.create());
      expect(() => validator.parse(['test'])).toThrow();
      expect(() => validator.parse(['test', 42, 'extra'])).toThrow();
    });

    it('should reject non-arrays', () => {
      const validator = VldTuple.create(VldString.create());
      expect(() => validator.parse('not array')).toThrow();
    });
  });

  describe('VldRecord', () => {
    it('should validate records', () => {
      const validator = VldRecord.create(VldNumber.create());
      const data = { a: 1, b: 2, c: 3 };
      expect(validator.parse(data)).toEqual(data);
    });

    it('should validate all values', () => {
      const validator = VldRecord.create(VldString.create());
      expect(() => validator.parse({ a: 'test', b: 123 })).toThrow();
    });
  });

  describe('VldIntersection', () => {
    it('should validate intersection of objects', () => {
      const a = VldObject.create({ name: VldString.create() });
      const b = VldObject.create({ age: VldNumber.create() });
      const validator = VldIntersection.create(a, b);
      
      const data = { name: 'John', age: 30 };
      expect(validator.parse(data)).toEqual(data);
    });

    it('should validate intersection of primitives', () => {
      const a = VldNumber.create().min(0);
      const b = VldNumber.create().max(10);
      const validator = VldIntersection.create(a, b);
      
      expect(validator.parse(5)).toBe(5);
      expect(() => validator.parse(-1)).toThrow();
      expect(() => validator.parse(11)).toThrow();
    });
  });

  describe('VldBigInt', () => {
    it('should validate bigint values', () => {
      const validator = VldBigInt.create();
      expect(validator.parse(123n)).toBe(123n);
      expect(validator.parse(0n)).toBe(0n);
      expect(validator.parse(-456n)).toBe(-456n);
      expect(() => validator.parse(123)).toThrow();
    });

    it('should validate min/max', () => {
      const validator = VldBigInt.create().min(10n).max(100n);
      expect(validator.parse(50n)).toBe(50n);
      expect(() => validator.parse(5n)).toThrow();
      expect(() => validator.parse(150n)).toThrow();
    });

    it('should validate positive/negative', () => {
      const positive = VldBigInt.create().positive();
      expect(positive.parse(1n)).toBe(1n);
      expect(() => positive.parse(0n)).toThrow();
      
      const negative = VldBigInt.create().negative();
      expect(negative.parse(-1n)).toBe(-1n);
      expect(() => negative.parse(0n)).toThrow();
    });

    it('should validate nonnegative/nonpositive', () => {
      const nonnegative = VldBigInt.create().nonnegative();
      expect(nonnegative.parse(0n)).toBe(0n);
      expect(nonnegative.parse(1n)).toBe(1n);
      expect(() => nonnegative.parse(-1n)).toThrow();
      
      const nonpositive = VldBigInt.create().nonpositive();
      expect(nonpositive.parse(0n)).toBe(0n);
      expect(nonpositive.parse(-1n)).toBe(-1n);
      expect(() => nonpositive.parse(1n)).toThrow();
    });
  });

  describe('VldSymbol', () => {
    it('should validate symbol values', () => {
      const validator = VldSymbol.create();
      const sym = Symbol('test');
      expect(validator.parse(sym)).toBe(sym);
      expect(() => validator.parse('symbol')).toThrow();
    });
  });

  describe('VldSet', () => {
    it('should validate Set objects', () => {
      const validator = VldSet.create(VldNumber.create());
      const set = new Set([1, 2, 3]);
      const result = validator.parse(set);
      expect(result).toBeInstanceOf(Set);
      expect(Array.from(result)).toEqual([1, 2, 3]);
    });

    it('should validate item types', () => {
      const validator = VldSet.create(VldString.create());
      const set = new Set([1, 2, 3]);
      expect(() => validator.parse(set)).toThrow();
    });
  });

  describe('VldMap', () => {
    it('should validate Map objects', () => {
      const validator = VldMap.create(
        VldString.create(),
        VldNumber.create()
      );
      const map = new Map([['a', 1], ['b', 2]]);
      const result = validator.parse(map);
      expect(result).toBeInstanceOf(Map);
      expect(result.get('a')).toBe(1);
      expect(result.get('b')).toBe(2);
    });

    it('should validate key and value types', () => {
      const validator = VldMap.create(
        VldString.create(),
        VldNumber.create()
      );
      const map = new Map([[1, 'value']]);
      expect(() => validator.parse(map)).toThrow();
    });
  });

  describe('VldAny', () => {
    it('should accept any value', () => {
      const validator = VldAny.create();
      expect(validator.parse('string')).toBe('string');
      expect(validator.parse(123)).toBe(123);
      expect(validator.parse(true)).toBe(true);
      expect(validator.parse(null)).toBe(null);
      expect(validator.parse(undefined)).toBe(undefined);
      expect(validator.parse({})).toEqual({});
      expect(validator.parse([])).toEqual([]);
    });
  });

  describe('VldUnknown', () => {
    it('should accept unknown values', () => {
      const validator = VldUnknown.create();
      expect(validator.parse('string')).toBe('string');
      expect(validator.parse(123)).toBe(123);
      expect(validator.parse(true)).toBe(true);
      expect(validator.parse(null)).toBe(null);
      expect(validator.parse(undefined)).toBe(undefined);
    });
  });

  describe('VldVoid', () => {
    it('should only accept undefined', () => {
      const validator = VldVoid.create();
      expect(validator.parse(undefined)).toBe(undefined);
      expect(() => validator.parse(null)).toThrow();
      expect(() => validator.parse('')).toThrow();
      expect(() => validator.parse(0)).toThrow();
    });
  });

  describe('VldNever', () => {
    it('should never accept any value', () => {
      const validator = VldNever.create();
      expect(() => validator.parse(undefined)).toThrow();
      expect(() => validator.parse(null)).toThrow();
      expect(() => validator.parse('')).toThrow();
      expect(() => validator.parse(0)).toThrow();
      expect(() => validator.parse({})).toThrow();
    });

    it('should always fail safeParse', () => {
      const validator = VldNever.create();
      expect(validator.safeParse('any').success).toBe(false);
    });
  });
});