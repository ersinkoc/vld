import { VldBase, ParseResult, VLD_VALIDATOR_TYPES } from './base';
import { isPlainObject } from '../utils/deep-merge';
import { isDangerousKey } from '../utils/security';
import { getMessages } from '../locales/runtime';
import { VldError } from '../errors-core';

/**
 * Merge the two parsed sides of an intersection. Plain objects merge
 * key-by-key and same-length arrays element-by-element (both recursively), so
 * array outputs - always fresh copies - no longer fail an identity check and
 * nested arrays of objects keep the fields of both sides. Equal Dates are one
 * value. Any other conflicting leaf keeps the existing rule: the right side wins.
 */
function mergeIntersection(a: unknown, b: unknown): unknown {
  if (isPlainObject(a) && isPlainObject(b)) {
    const result: Record<string, unknown> = { ...a };
    for (const key of Object.keys(b)) {
      if (isDangerousKey(key)) continue;
      result[key] = Object.prototype.hasOwnProperty.call(a, key) ? mergeIntersection(a[key], b[key]) : b[key];
    }
    return result;
  }
  if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) {
    return a.map((item, index) => mergeIntersection(item, b[index]));
  }
  if (a instanceof Date && b instanceof Date && a.getTime() === b.getTime()) {
    return a;
  }
  return b;
}

function createIntersectionError(message: string): VldError {
  return new VldError([{ code: 'invalid_type', path: [], message }]);
}

/**
 * Immutable intersection validator for combining validators
 */
export class VldIntersection<A, B> extends VldBase<unknown, A & B> {
  /**
   * Private constructor to enforce immutability
   */
  private constructor(
    private readonly validatorA: VldBase<unknown, A>,
    private readonly validatorB: VldBase<unknown, B>
  ) {
    super(VLD_VALIDATOR_TYPES.INTERSECTION);
  }
  
  /**
   * Create a new intersection validator
   */
  static create<A, B>(
    validatorA: VldBase<unknown, A>,
    validatorB: VldBase<unknown, B>
  ): VldIntersection<A, B> {
    return new VldIntersection(validatorA, validatorB);
  }
  
  /**
   * Parse and validate a value against both validators
   */
  parse(value: unknown): A & B {
    try {
      // Both validators must pass
      const resultA = this.validatorA.parse(value);
      const resultB = this.validatorB.parse(value);

      // BUG-NEW-015 FIX: Check type consistency before merging
      const aIsObject = isPlainObject(resultA);
      const bIsObject = isPlainObject(resultB);

      // Both are objects - safe to merge
      if (aIsObject && bIsObject) {
        return mergeIntersection(resultA, resultB) as A & B;
      }

      // Both are arrays: each side returns its own copy, so compare by content.
      if (Array.isArray(resultA) && Array.isArray(resultB)) {
        if (resultA.length !== resultB.length) {
          throw new Error('Arrays must have the same length for intersection');
        }
        return mergeIntersection(resultA, resultB) as A & B;
      }

      // Both are Dates: equal instants are the same value.
      if (resultA instanceof Date && resultB instanceof Date && resultA.getTime() === resultB.getTime()) {
        return resultA as A & B;
      }

      // Neither are objects - must be identical primitives
      if (!aIsObject && !bIsObject) {
        if ((resultA as any) === (resultB as any)) {
          return resultA as A & B;
        }
        throw new Error('Values must be identical for intersection of primitive types');
      }

      // One is object, one is primitive - invalid intersection
      throw new Error(
        'Cannot create intersection of object and primitive types. ' +
        'Both validators must produce the same type category.'
      );
    } catch (error) {
      throw new Error(getMessages().intersectionError((error as Error).message));
    }
  }
  
  /**
   * Safely parse and validate a value against both validators
   */
  safeParse(value: unknown): ParseResult<A & B> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: createIntersectionError((error as Error).message) };
    }
  }
}
