import { VldBase, ParseResult } from './base';
import { getMessages } from '../locales';

/**
 * Immutable tuple validator for fixed-length arrays
 */
export class VldTuple<T extends readonly VldBase<any, any>[]> extends VldBase<
  unknown,
  { [K in keyof T]: T[K] extends VldBase<any, infer U> ? U : never }
> {
  /**
   * Private constructor to enforce immutability
   */
  private constructor(
    private readonly validators: T,
    private readonly errorMessage?: string
  ) {
    super();
  }
  
  /**
   * Create a new tuple validator
   */
  static create<T extends readonly VldBase<any, any>[]>(...validators: T): VldTuple<T> {
    return new VldTuple(validators);
  }
  
  /**
   * Parse and validate a tuple value
   */
  parse(value: unknown): { [K in keyof T]: T[K] extends VldBase<any, infer U> ? U : never } {
    if (!Array.isArray(value)) {
      throw new Error(this.errorMessage || getMessages().invalidTuple);
    }
    
    if (value.length !== this.validators.length) {
      throw new Error(
        this.errorMessage || 
        getMessages().tupleLength(this.validators.length, value.length)
      );
    }
    
    const result: any[] = [];
    for (let i = 0; i < this.validators.length; i++) {
      try {
        result[i] = this.validators[i].parse(value[i]);
      } catch (error) {
        throw new Error(getMessages().arrayItem(i, (error as Error).message));
      }
    }
    
    return result as { [K in keyof T]: T[K] extends VldBase<any, infer U> ? U : never };
  }
  
  /**
   * Safely parse and validate a tuple value
   */
  safeParse(value: unknown): ParseResult<{ [K in keyof T]: T[K] extends VldBase<any, infer U> ? U : never }> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}