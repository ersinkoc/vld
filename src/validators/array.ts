import { VldBase, ParseResult } from './base';
import { getMessages } from '../locales';

/**
 * Configuration for array validator
 */
interface ArrayValidatorConfig<T> {
  readonly itemValidator: VldBase<unknown, T>;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly exactLength?: number;
  readonly unique?: boolean;
  readonly errorMessage?: string;
}

/**
 * Immutable array validator with chainable methods
 */
export class VldArray<T> extends VldBase<unknown[], T[]> {
  private readonly config: ArrayValidatorConfig<T>;
  
  /**
   * Private constructor to enforce immutability
   */
  private constructor(config: ArrayValidatorConfig<T>) {
    super();
    this.config = config;
  }
  
  /**
   * Create a new array validator
   */
  static create<T>(itemValidator: VldBase<unknown, T>): VldArray<T> {
    return new VldArray({ itemValidator });
  }
  
  /**
   * Parse and validate an array value
   */
  parse(value: unknown): T[] {
    if (!Array.isArray(value)) {
      throw new Error(this.config.errorMessage || getMessages().invalidArray);
    }
    
    // Validate length constraints
    if (this.config.exactLength !== undefined && value.length !== this.config.exactLength) {
      throw new Error(this.config.errorMessage || getMessages().arrayLength(this.config.exactLength));
    }
    
    if (this.config.minLength !== undefined && value.length < this.config.minLength) {
      throw new Error(this.config.errorMessage || getMessages().arrayMin(this.config.minLength));
    }
    
    if (this.config.maxLength !== undefined && value.length > this.config.maxLength) {
      throw new Error(this.config.errorMessage || getMessages().arrayMax(this.config.maxLength));
    }
    
    // Validate each item with optimized loop and safeParse
    const result: T[] = [];
    const length = value.length;
    
    for (let i = 0; i < length; i++) {
      const parseResult = this.config.itemValidator.safeParse(value[i]);
      if (!parseResult.success) {
        throw new Error(getMessages().arrayItem(i, parseResult.error.message));
      }
      result[i] = parseResult.data; // Direct assignment is faster than push
    }
    
    // Check uniqueness if required
    if (this.config.unique) {
      const seen = new Set<any>();
      for (const item of result) {
        const key = typeof item === 'object' ? this.stableStringify(item) : item;
        if (seen.has(key)) {
          throw new Error('Array must contain unique items');
        }
        seen.add(key);
      }
    }
    
    return result;
  }
  
  /**
   * Safely parse and validate an array value
   */
  safeParse(value: unknown): ParseResult<T[]> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Create a stable string representation of an object for hashing
   * Handles circular references and deep nesting gracefully
   * BUG-006 FIX: Added depth limit to prevent stack overflow
   * BUG-NEW-003 FIX: Fixed depth tracking to properly track recursion depth
   */
  private stableStringify(obj: any): string {
    const seen = new WeakSet();
    const MAX_DEPTH = 100; // Reasonable depth limit to prevent stack overflow

    // Helper function to sort keys and create stable representation
    const sortedStringify = (value: any, depth: number = 0): string => {
      // Check depth limit
      if (depth > MAX_DEPTH) {
        return '"[Max Depth Exceeded]"';
      }

      // Handle primitives
      if (value === null) return 'null';
      if (value === undefined) return 'undefined';
      if (typeof value !== 'object') return JSON.stringify(value);

      // Handle circular references
      if (seen.has(value)) {
        return '"[Circular]"';
      }

      seen.add(value);

      try {
        // Handle arrays
        if (Array.isArray(value)) {
          const items = value.map(item => sortedStringify(item, depth + 1));
          return `[${items.join(',')}]`;
        }

        // Handle objects - sort keys for stability
        const keys = Object.keys(value).sort();
        const pairs = keys.map(key => {
          const serializedKey = JSON.stringify(key);
          const serializedValue = sortedStringify(value[key], depth + 1);
          return `${serializedKey}:${serializedValue}`;
        });

        return `{${pairs.join(',')}}`;
      } finally {
        // Clean up seen set for this branch
        seen.delete(value);
      }
    };

    try {
      return sortedStringify(obj);
    } catch (error) {
      // Fallback to safe representation if stringify fails
      return String(obj);
    }
  }
  
  /**
   * Create a new validator with minimum length constraint
   */
  min(length: number, message?: string): VldArray<T> {
    return new VldArray({
      ...this.config,
      minLength: length,
      errorMessage: message || getMessages().arrayMin(length)
    });
  }
  
  /**
   * Create a new validator with maximum length constraint
   */
  max(length: number, message?: string): VldArray<T> {
    return new VldArray({
      ...this.config,
      maxLength: length,
      errorMessage: message || getMessages().arrayMax(length)
    });
  }
  
  /**
   * Create a new validator with exact length constraint
   */
  length(length: number, message?: string): VldArray<T> {
    return new VldArray({
      ...this.config,
      exactLength: length,
      minLength: undefined,
      maxLength: undefined,
      errorMessage: message || getMessages().arrayLength(length)
    });
  }
  
  /**
   * Create a new validator that ensures array is not empty
   */
  nonempty(message?: string): VldArray<T> {
    return new VldArray({
      ...this.config,
      minLength: 1,
      errorMessage: message || getMessages().arrayEmpty
    });
  }
  
  /**
   * Create a new validator that ensures array contains unique items
   */
  unique(message?: string): VldArray<T> {
    return new VldArray({
      ...this.config,
      unique: true,
      errorMessage: message || 'Array must contain unique items'
    });
  }
  
  /**
   * Create a new validator with a range constraint for length
   */
  between(min: number, max: number, message?: string): VldArray<T> {
    return new VldArray({
      ...this.config,
      minLength: min,
      maxLength: max,
      errorMessage: message || `Array length must be between ${min} and ${max}`
    });
  }
}