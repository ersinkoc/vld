import { VldBase, ParseResult } from './base';
import { deepMerge, isPlainObject } from '../utils/deep-merge';
import { getMessages } from '../locales';

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
    super();
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
        return deepMerge(resultA as any, resultB as any) as A & B;
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
      return { success: false, error: error as Error };
    }
  }
}