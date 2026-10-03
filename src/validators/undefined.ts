/**
 * VldUndefined - Validates that a value is exactly undefined
 * Part of Zod 4 API parity implementation
 */

import { VldBase, VLD_VALIDATOR_TYPES } from './base';
import type { ParseResult } from './base';
import { VldError, createInvalidTypeIssue, getTypeName } from '../errors-core';

function createUndefinedError(message: string, value: unknown): VldError {
  return new VldError([createInvalidTypeIssue('undefined', getTypeName(value), message)]);
}

/**
 * Undefined validator - validates that a value is exactly undefined
 */
export class VldUndefined extends VldBase<unknown, undefined> {
  private constructor() {
    super(VLD_VALIDATOR_TYPES.UNDEFINED);
  }

  static create(): VldUndefined {
    return new VldUndefined();
  }

  get isSimple(): boolean {
    return true;
  }

  parse(value: unknown): undefined {
    if (value !== undefined) {
      throw new Error(`Expected undefined, received ${typeof value}`);
    }
    return undefined;
  }

  safeParse(value: unknown): ParseResult<undefined> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: createUndefinedError((error as Error).message, value) };
    }
  }
}
