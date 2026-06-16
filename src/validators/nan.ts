/**
 * VldNan - Validates that a value is NaN (Not a Number)
 * Part of Zod 4 API parity implementation
 */

import { VldBase, VLD_VALIDATOR_TYPES } from './base';
import type { ParseResult } from './base';
import { VldError } from '../errors-core';

function createNanError(message: string): VldError {
  return new VldError([{ code: 'invalid_number', path: [], message }]);
}

/**
 * NaN validator - validates that a value is NaN
 * Note: Uses Number.isNaN() which is more strict than global isNaN()
 */
export class VldNan extends VldBase<unknown, number> {
  private constructor() {
    super(VLD_VALIDATOR_TYPES.NAN);
  }

  static create(): VldNan {
    return new VldNan();
  }

  parse(value: unknown): number {
    if (typeof value !== 'number' || !Number.isNaN(value)) {
      throw new Error(`Expected NaN, received ${typeof value === 'number' ? 'a valid number' : typeof value}`);
    }
    return value;
  }

  safeParse(value: unknown): ParseResult<number> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: createNanError((error as Error).message) };
    }
  }
}
