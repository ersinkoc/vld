/**
 * Tests for v.optional, v.nullable, v.nullish utilities
 */

import { v } from '../../src';

describe('v.optional()', () => {
  it('should make any validator optional', () => {
    const schema = v.optional(v.string());

    expect(schema.parse(undefined)).toBe(undefined);
    expect(schema.parse('test')).toBe('test');
    expect(() => schema.parse(null)).toThrow();
  });

  it('should work with complex validators', () => {
    const schema = v.optional(v.number().min(10));

    expect(schema.parse(undefined)).toBe(undefined);
    expect(schema.parse(15)).toBe(15);
    expect(() => schema.parse(5)).toThrow();
  });

  it('should work with object validators', () => {
    const schema = v.optional(v.object({ name: v.string() }));

    expect(schema.parse(undefined)).toBe(undefined);
    expect(schema.parse({ name: 'John' })).toEqual({ name: 'John' });
  });
});

describe('v.nullable()', () => {
  it('should make any validator nullable', () => {
    const schema = v.nullable(v.string());

    expect(schema.parse(null)).toBe(null);
    expect(schema.parse('test')).toBe('test');
    expect(() => schema.parse(undefined)).toThrow();
  });

  it('should work with number validators', () => {
    const schema = v.nullable(v.number().positive());

    expect(schema.parse(null)).toBe(null);
    expect(schema.parse(5)).toBe(5);
    expect(() => schema.parse(-5)).toThrow();
  });
});

describe('v.nullish()', () => {
  it('should make any validator nullish (null or undefined)', () => {
    const schema = v.nullish(v.string());

    expect(schema.parse(null)).toBe(null);
    expect(schema.parse(undefined)).toBe(undefined);
    expect(schema.parse('test')).toBe('test');
  });

  it('should work with complex validators', () => {
    const schema = v.nullish(v.number().int());

    expect(schema.parse(null)).toBe(null);
    expect(schema.parse(undefined)).toBe(undefined);
    expect(schema.parse(42)).toBe(42);
    expect(() => schema.parse(3.14)).toThrow();
  });
});

describe('v.strictObject()', () => {
  it('should create object with strict validation', () => {
    const schema = v.strictObject({
      name: v.string(),
      age: v.number()
    });

    expect(schema.parse({ name: 'John', age: 30 })).toEqual({ name: 'John', age: 30 });
    expect(() => schema.parse({ name: 'John', age: 30, extra: 'field' })).toThrow();
  });

  it('should reject extra fields', () => {
    const schema = v.strictObject({ id: v.number() });

    expect(() => schema.parse({ id: 1, extra: 'value' })).toThrow();
  });
});

describe('v.looseObject()', () => {
  it('should create object with loose validation (passthrough)', () => {
    const schema = v.looseObject({
      name: v.string()
    });

    expect(schema.parse({ name: 'John' })).toEqual({ name: 'John' });
    expect(schema.parse({ name: 'John', age: 30, extra: 'field' })).toEqual({
      name: 'John',
      age: 30,
      extra: 'field'
    });
  });

  it('should allow extra fields to pass through', () => {
    const schema = v.looseObject({ id: v.number() });

    expect(schema.parse({ id: 1, metadata: { key: 'value' } })).toEqual({
      id: 1,
      metadata: { key: 'value' }
    });
  });
});
