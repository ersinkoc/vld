/**
 * VldUndefined - Validates that a value is exactly undefined
 * Part of Zod 4 API parity implementation
 */

import { VldBase } from './base';
import type { ParseResult } from './base';

/**
 * Undefined validator - validates that a value is exactly undefined
 */
export class VldUndefined extends VldBase<unknown, undefined> {
  private constructor() {
    super();
  }

  static create(): VldUndefined {
    return new VldUndefined();
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
      return { success: false, error: error as Error };
    }
  }
}
