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
});
