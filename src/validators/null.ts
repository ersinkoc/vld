/**
 * VldNull - Validates that a value is exactly null
 * Part of Zod 4 API parity implementation
 */

import { VldBase } from './base';
import type { ParseResult } from './base';

/**
 * Null validator - validates that a value is exactly null
 */
export class VldNull extends VldBase<unknown, null> {
  private constructor() {
    super();
  }

  static create(): VldNull {
    return new VldNull();
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
      return { success: false, error: error as Error };
    }
  }
}
