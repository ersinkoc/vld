import { VldBase, ParseResult } from './base';
import { getMessages } from '../locales';

/**
 * Immutable Set validator
 */
export class VldSet<T> extends VldBase<unknown, Set<T>> {
  /**
   * Private constructor to enforce immutability
   */
  private constructor(
    private readonly itemValidator: VldBase<unknown, T>,
    private readonly errorMessage?: string
  ) {
    super();
  }
  
  /**
   * Create a new Set validator
   */
  static create<T>(itemValidator: VldBase<unknown, T>): VldSet<T> {
    return new VldSet(itemValidator);
  }
  
  /**
   * Parse and validate a Set value
   */
  parse(value: unknown): Set<T> {
    if (!(value instanceof Set)) {
      throw new Error(this.errorMessage || getMessages().invalidSet);
    }
    
    const result = new Set<T>();
    for (const item of value) {
      try {
        result.add(this.itemValidator.parse(item));
      } catch (error) {
        throw new Error((error as Error).message);
      }
    }
    
    return result;
  }
  
  /**
   * Safely parse and validate a Set value
   */
  safeParse(value: unknown): ParseResult<Set<T>> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}