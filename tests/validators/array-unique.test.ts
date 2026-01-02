import { describe, it, expect } from '@jest/globals';
import { VldArray } from '../../src/validators/array';
import { VldAny } from '../../src/validators/any';

describe('VldArray unique check with objects', () => {
  it('should identify duplicate objects even with different key order', () => {
    const validator = VldArray.create(VldAny.create()).unique();
    const arrayWithDuplicates = [{ a: 1, b: 2 }, { b: 2, a: 1 }];

    // This test confirms the fix for the unique check.
    // The validator should now correctly identify these objects as duplicates and throw an error.
    expect(() => validator.parse(arrayWithDuplicates)).toThrow('Array must contain unique items');
  });

  it('should handle nested objects', () => {
    const validator = VldArray.create(VldAny.create()).unique();
    const nested = [{ a: { b: { c: 1 } } }, { a: { b: { c: 1 } } }];

    expect(() => validator.parse(nested)).toThrow('Array must contain unique items');
  });

  it('should handle circular references', () => {
    const validator = VldArray.create(VldAny.create()).unique();

    const circular: any = { a: 1 };
    circular.self = circular;

    const arrayWithCircular = [circular, { a: 1 }];
    // Should handle circular reference gracefully - circular becomes [Circular]
    // Both objects should be seen as different since one has [Circular] marker
    expect(validator.parse(arrayWithCircular)).toEqual(arrayWithCircular);
  });

  it('should handle arrays within objects', () => {
    const validator = VldArray.create(VldAny.create()).unique();
    const withArrays = [{ arr: [1, 2, 3] }, { arr: [1, 2, 3] }];

    expect(() => validator.parse(withArrays)).toThrow('Array must contain unique items');
  });

  it('should handle deeply nested structures', () => {
    const validator = VldArray.create(VldAny.create()).unique();
    const deep = [
      { level1: { level2: { level3: { level4: { value: 1 } } } } },
      { level1: { level2: { level3: { level4: { value: 1 } } } } }
    ];

    expect(() => validator.parse(deep)).toThrow('Array must contain unique items');
  });

  it('should handle mixed arrays', () => {
    const validator = VldArray.create(VldAny.create()).unique();
    const mixed = [{ a: 1 }, [1, 2], 'string', 123, null, undefined];

    // All unique, should pass
    expect(validator.parse(mixed)).toEqual(mixed);
  });

  it('should handle primitives correctly', () => {
    const validator = VldArray.create(VldAny.create()).unique();

    expect(validator.parse([1, 2, 3])).toEqual([1, 2, 3]);
    expect(() => validator.parse([1, 2, 1])).toThrow('Array must contain unique items');
  });
});
