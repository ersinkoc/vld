/**
 * Tests for src/mini.ts - Tree-shakable functional API
 */

import {
  // Primitive validators
  string,
  number,
  int,
  int32,
  boolean,
  date,
  bigint,
  symbol,
  stringbool,

  // Complex validators
  array,
  object,
  strictObject,
  looseObject,
  tuple,
  record,
  partialRecord,
  looseRecord,
  set,
  map,

  // Union & Intersection
  union,
  intersection,
  discriminatedUnion,
  xor,

  // Literal & Enum
  literal,
  enumValidator,

  // Special validators
  any,
  unknown,
  voidValidator,
  never,
  nullValidator,
  undefinedValidator,
  nan,

  // Utility validators
  lazy,
  json,

  // Utility functions
  optional,
  nullable,
  nullish,
  preprocess,

  // Coercion
  coerce,

  // NEVER constant
  NEVER,

  // Type exports
  type Infer,
  type Input,
  type Output,

  // Class exports
  VldBase,
  VldString,
} from '../src/mini';

describe('Mini API', () => {
  describe('Primitive Validators', () => {
    test('string() creates a string validator', () => {
      const schema = string();
      expect(schema.parse('hello')).toBe('hello');
      expect(() => schema.parse(123)).toThrow();
    });

    test('number() creates a number validator', () => {
      const schema = number();
      expect(schema.parse(42)).toBe(42);
      expect(() => schema.parse('42')).toThrow();
    });

    test('int() creates an integer validator', () => {
      const schema = int();
      expect(schema.parse(42)).toBe(42);
      expect(() => schema.parse(42.5)).toThrow();
    });

    test('int32() creates an int32 validator', () => {
      const schema = int32();
      expect(schema.parse(42)).toBe(42);
      expect(schema.parse(-2147483648)).toBe(-2147483648);
      expect(schema.parse(2147483647)).toBe(2147483647);
      expect(() => schema.parse(2147483648)).toThrow();
      expect(() => schema.parse(-2147483649)).toThrow();
    });

    test('boolean() creates a boolean validator', () => {
      const schema = boolean();
      expect(schema.parse(true)).toBe(true);
      expect(schema.parse(false)).toBe(false);
      expect(() => schema.parse('true')).toThrow();
    });

    test('date() creates a date validator', () => {
      const schema = date();
      const now = new Date();
      expect(schema.parse(now)).toEqual(now);
      // Date validator accepts strings and numbers (passed to Date constructor)
      expect(schema.parse('2023-01-01')).toBeInstanceOf(Date);
      // Invalid date string should throw
      expect(() => schema.parse('not-a-date')).toThrow();
      // Non-date types should throw
      expect(() => schema.parse(true)).toThrow();
    });

    test('bigint() creates a bigint validator', () => {
      const schema = bigint();
      expect(schema.parse(BigInt(123))).toBe(BigInt(123));
      expect(() => schema.parse(123)).toThrow();
    });

    test('symbol() creates a symbol validator', () => {
      const schema = symbol();
      const sym = Symbol('test');
      expect(schema.parse(sym)).toBe(sym);
      expect(() => schema.parse('symbol')).toThrow();
    });

    test('stringbool() creates a string-to-boolean validator', () => {
      const schema = stringbool();
      expect(schema.parse('true')).toBe(true);
      expect(schema.parse('false')).toBe(false);
    });

    test('stringbool() with custom options', () => {
      const schema = stringbool({ truthy: ['yes', 'on'], falsy: ['no', 'off'], caseSensitive: false });
      expect(schema.parse('YES')).toBe(true);
      expect(schema.parse('no')).toBe(false);
    });
  });

  describe('Complex Validators', () => {
    test('array() creates an array validator', () => {
      const schema = array(string());
      expect(schema.parse(['a', 'b'])).toEqual(['a', 'b']);
      expect(() => schema.parse([1, 2])).toThrow();
    });

    test('object() creates an object validator', () => {
      const schema = object({
        name: string(),
        age: number(),
      });
      expect(schema.parse({ name: 'John', age: 30 })).toEqual({ name: 'John', age: 30 });
      expect(() => schema.parse({ name: 'John' })).toThrow();
    });

    test('strictObject() creates a strict object validator', () => {
      const schema = strictObject({
        name: string(),
      });
      expect(schema.parse({ name: 'John' })).toEqual({ name: 'John' });
      expect(() => schema.parse({ name: 'John', extra: 'field' })).toThrow();
    });

    test('looseObject() creates a loose object validator', () => {
      const schema = looseObject({
        name: string(),
      });
      expect(schema.parse({ name: 'John', extra: 'field' })).toEqual({ name: 'John', extra: 'field' });
    });

    test('tuple() creates a tuple validator', () => {
      const schema = tuple(string(), number());
      expect(schema.parse(['hello', 42])).toEqual(['hello', 42]);
      expect(() => schema.parse(['hello'])).toThrow();
    });

    test('record() creates a record validator', () => {
      const schema = record(number());
      expect(schema.parse({ a: 1, b: 2 })).toEqual({ a: 1, b: 2 });
      expect(() => schema.parse({ a: 'one' })).toThrow();
    });

    test('partialRecord() creates a partial record validator', () => {
      const schema = partialRecord(number());
      expect(schema.parse({ a: 1, b: undefined })).toEqual({ a: 1, b: undefined });
    });

    test('looseRecord() creates a loose record validator', () => {
      const schema = looseRecord(number());
      expect(schema.parse({ a: 1 })).toEqual({ a: 1 });
    });

    test('set() creates a set validator', () => {
      const schema = set(string());
      const result = schema.parse(new Set(['a', 'b']));
      expect(result).toBeInstanceOf(Set);
      expect(result.has('a')).toBe(true);
    });

    test('map() creates a map validator', () => {
      const schema = map(string(), number());
      const input = new Map([['a', 1], ['b', 2]]);
      const result = schema.parse(input);
      expect(result).toBeInstanceOf(Map);
      expect(result.get('a')).toBe(1);
    });
  });

  describe('Union & Intersection', () => {
    test('union() creates a union validator', () => {
      const schema = union(string(), number());
      expect(schema.parse('hello')).toBe('hello');
      expect(schema.parse(42)).toBe(42);
      expect(() => schema.parse(true)).toThrow();
    });

    test('intersection() creates an intersection validator', () => {
      const schema = intersection(
        object({ name: string() }),
        object({ age: number() })
      );
      expect(schema.parse({ name: 'John', age: 30 })).toEqual({ name: 'John', age: 30 });
    });

    test('discriminatedUnion() creates a discriminated union validator', () => {
      const schema = discriminatedUnion(
        'type',
        object({ type: literal('a'), value: string() }),
        object({ type: literal('b'), value: number() })
      );
      expect(schema.parse({ type: 'a', value: 'hello' })).toEqual({ type: 'a', value: 'hello' });
      expect(schema.parse({ type: 'b', value: 42 })).toEqual({ type: 'b', value: 42 });
    });

    test('xor() creates an XOR validator', () => {
      const schema = xor(
        object({ a: string() }),
        object({ b: number() })
      );
      expect(schema.parse({ a: 'hello' })).toEqual({ a: 'hello' });
      expect(schema.parse({ b: 42 })).toEqual({ b: 42 });
    });
  });

  describe('Literal & Enum', () => {
    test('literal() creates a literal validator', () => {
      const schema = literal('hello');
      expect(schema.parse('hello')).toBe('hello');
      expect(() => schema.parse('world')).toThrow();
    });

    test('literal() with different types', () => {
      expect(literal(42).parse(42)).toBe(42);
      expect(literal(true).parse(true)).toBe(true);
      expect(literal(null).parse(null)).toBe(null);
      expect(literal(undefined).parse(undefined)).toBe(undefined);
    });

    test('enumValidator() creates an enum validator', () => {
      const schema = enumValidator('a', 'b', 'c');
      expect(schema.parse('a')).toBe('a');
      expect(schema.parse('b')).toBe('b');
      expect(() => schema.parse('d')).toThrow();
    });
  });

  describe('Special Validators', () => {
    test('any() creates an any validator', () => {
      const schema = any();
      expect(schema.parse('hello')).toBe('hello');
      expect(schema.parse(42)).toBe(42);
      expect(schema.parse(null)).toBe(null);
    });

    test('unknown() creates an unknown validator', () => {
      const schema = unknown();
      expect(schema.parse('hello')).toBe('hello');
      expect(schema.parse(42)).toBe(42);
    });

    test('voidValidator() creates a void validator', () => {
      const schema = voidValidator();
      expect(schema.parse(undefined)).toBe(undefined);
      expect(() => schema.parse('hello')).toThrow();
    });

    test('never() creates a never validator', () => {
      const schema = never();
      expect(() => schema.parse('anything')).toThrow();
    });

    test('nullValidator() creates a null validator', () => {
      const schema = nullValidator();
      expect(schema.parse(null)).toBe(null);
      expect(() => schema.parse(undefined)).toThrow();
    });

    test('undefinedValidator() creates an undefined validator', () => {
      const schema = undefinedValidator();
      expect(schema.parse(undefined)).toBe(undefined);
      expect(() => schema.parse(null)).toThrow();
    });

    test('nan() creates a NaN validator', () => {
      const schema = nan();
      expect(schema.parse(NaN)).toBe(NaN);
      expect(() => schema.parse(42)).toThrow();
    });
  });

  describe('Utility Validators', () => {
    test('lazy() creates a lazy validator', () => {
      // Recursive schema for tree-like structures
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nodeSchema: any = lazy(() => object({
        value: string(),
        children: optional(array(nodeSchema)),
      }));

      const result = nodeSchema.parse({ value: 'root', children: [{ value: 'child' }] });
      expect(result.value).toBe('root');
    });

    test('json() creates a JSON validator', () => {
      const schema = json();
      expect(schema.parse('{"a":1}')).toEqual({ a: 1 });
    });

    test('json() with schema', () => {
      const schema = json(object({ a: number() }));
      expect(schema.parse('{"a":1}')).toEqual({ a: 1 });
      expect(() => schema.parse('{"a":"one"}')).toThrow();
    });
  });

  describe('Utility Functions', () => {
    test('optional() makes a validator optional', () => {
      const schema = optional(string());
      expect(schema.parse('hello')).toBe('hello');
      expect(schema.parse(undefined)).toBe(undefined);
    });

    test('nullable() makes a validator nullable', () => {
      const schema = nullable(string());
      expect(schema.parse('hello')).toBe('hello');
      expect(schema.parse(null)).toBe(null);
    });

    test('nullish() makes a validator nullish', () => {
      const schema = nullish(string());
      expect(schema.parse('hello')).toBe('hello');
      expect(schema.parse(null)).toBe(null);
      expect(schema.parse(undefined)).toBe(undefined);
    });

    test('preprocess() preprocesses input', () => {
      const schema = preprocess(
        (val) => String(val).trim(),
        string()
      );
      expect(schema.parse('  hello  ')).toBe('hello');
    });
  });

  describe('Coercion Validators', () => {
    test('coerce.string() coerces to string', () => {
      const schema = coerce.string();
      expect(schema.parse(42)).toBe('42');
      expect(schema.parse(true)).toBe('true');
    });

    test('coerce.number() coerces to number', () => {
      const schema = coerce.number();
      expect(schema.parse('42')).toBe(42);
    });

    test('coerce.boolean() coerces to boolean', () => {
      const schema = coerce.boolean();
      expect(schema.parse(1)).toBe(true);
      expect(schema.parse(0)).toBe(false);
    });

    test('coerce.date() coerces to date', () => {
      const schema = coerce.date();
      const result = schema.parse('2023-01-01');
      expect(result).toBeInstanceOf(Date);
    });

    test('coerce.bigint() coerces to bigint', () => {
      const schema = coerce.bigint();
      expect(schema.parse('123')).toBe(BigInt(123));
    });
  });

  describe('NEVER Constant', () => {
    test('NEVER is a never validator instance', () => {
      expect(() => NEVER.parse('anything')).toThrow();
    });
  });

  describe('Type Exports', () => {
    test('Infer type works correctly', () => {
      const schema = object({ name: string(), age: number() });
      type SchemaType = Infer<typeof schema>;
      const value: SchemaType = { name: 'John', age: 30 };
      expect(value.name).toBe('John');
    });

    test('Input type works correctly', () => {
      const schema = string();
      type InputType = Input<typeof schema>;
      const value: InputType = 'hello';
      expect(value).toBe('hello');
    });

    test('Output type works correctly', () => {
      const schema = string();
      type OutputType = Output<typeof schema>;
      const value: OutputType = 'hello';
      expect(value).toBe('hello');
    });
  });

  describe('Class Exports', () => {
    test('VldBase is exported', () => {
      expect(VldBase).toBeDefined();
    });

    test('VldString is exported', () => {
      expect(VldString).toBeDefined();
      const schema = VldString.create();
      expect(schema.parse('hello')).toBe('hello');
    });
  });
});
