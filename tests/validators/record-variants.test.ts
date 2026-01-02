/**
 * Tests for v.partialRecord() and v.looseRecord()
 */

import { v } from '../../src';

describe('v.partialRecord()', () => {
  it('should make all record values optional', () => {
    const schema = v.partialRecord(v.string().min(3));

    expect(schema.parse({ name: 'John', age: '300' })).toEqual({ name: 'John', age: '300' });
    expect(schema.parse({ name: 'John' })).toEqual({ name: 'John' });
    expect(schema.parse({})).toEqual({});
  });

  it('should accept undefined values', () => {
    const schema = v.partialRecord(v.number());

    expect(schema.parse({ a: 1, b: undefined })).toEqual({ a: 1, b: undefined });
  });

  it('should still validate defined values', () => {
    const schema = v.partialRecord(v.int());

    expect(schema.parse({ count: 5 })).toEqual({ count: 5 });
    expect(() => schema.parse({ count: 5.5 })).toThrow();
  });

  it('should work with method chaining', () => {
    const schema = v.partialRecord(v.string()).refine(
      (record) => Object.keys(record).length > 0,
      'Record must have at least one key'
    );

    expect(schema.parse({ name: 'John' })).toEqual({ name: 'John' });
    expect(() => schema.parse({})).toThrow();
  });

  it('should work in object schemas', () => {
    const schema = v.object({
      metadata: v.partialRecord(v.string())
    });

    expect(schema.parse({
      metadata: { key1: 'value1' }
    })).toEqual({ metadata: { key1: 'value1' } });
  });
});

describe('v.looseRecord()', () => {
  it('should allow invalid values and skip them', () => {
    const schema = v.looseRecord(v.int());

    const result = schema.parse({
      valid: 123,
      invalid: 'not a number',
      alsoValid: 456
    });

    expect(result).toEqual({
      valid: 123,
      alsoValid: 456
    });
  });

  it('should not throw validation errors', () => {
    const schema = v.looseRecord(v.string().min(5));

    const result = schema.parse({
      longEnough: 'abcdef',
      tooShort: 'xyz'
    });

    expect(result).toEqual({
      longEnough: 'abcdef'
    });
  });

  it('should skip dangerous keys', () => {
    const schema = v.looseRecord(v.string());

    const result = schema.parse({
      __proto__: 'dangerous',
      constructor: 'also dangerous',
      safe: 'value'
    });

    expect(result).toEqual({
      safe: 'value'
    });
  });

  it('should accept empty objects', () => {
    const schema = v.looseRecord(v.number());

    expect(schema.parse({})).toEqual({});
  });

  it('should work with method chaining', () => {
    const schema = v.looseRecord(v.string()).optional();

    expect(schema.parse({ a: 'test' })).toEqual({ a: 'test' });
    expect(schema.parse({})).toEqual({});
  });
});

describe('record variants integration', () => {
  it('should work with .partial() and .loose() combined', () => {
    const record = v.record(v.string().min(2));
    const partialLoose = record.partial().loose();

    const result = partialLoose.parse({
      valid: 'abc',
      tooShort: 'x',
      invalid: 123
    });

    expect(result).toEqual({
      valid: 'abc'
    });
  });

  it('should maintain immutability', () => {
    const original = v.record(v.number());
    const partial = original.partial();
    const loose = original.loose();

    // Original should still enforce strict validation
    expect(() => original.parse({ a: 1, b: 'invalid' })).toThrow();

    // Partial should allow undefined
    expect(partial.parse({ a: 1, b: undefined })).toEqual({ a: 1, b: undefined });

    // Loose should skip invalid values
    expect(loose.parse({ a: 1, b: 'invalid' })).toEqual({ a: 1 });
  });

  it('should work with complex nested structures', () => {
    const schema = v.object({
      config: v.partialRecord(
        v.object({
          enabled: v.boolean(),
          value: v.number()
        })
      )
    });

    const result = schema.parse({
      config: {
        feature1: { enabled: true, value: 100 },
        feature2: undefined
      }
    });

    expect(result.config.feature1).toEqual({ enabled: true, value: 100 });
    expect(result.config.feature2).toBe(undefined);
  });
});
