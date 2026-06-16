/**
 * VldNull - Validates that a value is exactly null
 * Part of Zod 4 API parity implementation
 */

import { VldBase, VLD_VALIDATOR_TYPES } from './base';
import type { ParseResult } from './base';
import { VldError } from '../errors-core';

function createNullError(message: string): VldError {
  return new VldError([{ code: 'invalid_type', path: [], message }]);
}

/**
 * Null validator - validates that a value is exactly null
 */
export class VldNull extends VldBase<unknown, null> {
  private constructor() {
    super(VLD_VALIDATOR_TYPES.NULL);
  }

  static create(): VldNull {
    return new VldNull();
  }

  get isSimple(): boolean {
    return true;
  }

  parse(value: unknown): null {
    if (value !== null) {
      throw new Error(`Expected null, received ${typeof value}`);
    }
    return null;
  }

  safeParse(value: unknown): ParseResult<null> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: createNullError((error as Error).message) };
    }
  }
}
