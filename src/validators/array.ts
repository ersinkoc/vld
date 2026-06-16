import { VldBase, ParseResult, VLD_VALIDATOR_TYPES } from './base';
import { getMessages } from '../locales/runtime';
import { VldError } from '../errors-core';

type SimpleItemMode = 'string' | 'number' | 'boolean' | undefined;

function createArrayError(message: string): VldError {
  return new VldError([{ code: 'invalid_array', path: [], message }]);
}

/**
 * Configuration for array validator
 */
interface ArrayValidatorConfig<T> {
  readonly itemValidator: VldBase<unknown, T>;
  readonly minLength?: number | undefined;
  readonly maxLength?: number | undefined;
  readonly exactLength?: number;
  readonly unique?: boolean;
  readonly errorMessage?: string;
}

/**
 * Immutable array validator with chainable methods
 */
export class VldArray<T> extends VldBase<unknown[], T[]> {
  private readonly config: ArrayValidatorConfig<T>;
  private readonly _simpleItemMode: SimpleItemMode;
  
  /**
   * Private constructor to enforce immutability
   */
  private constructor(config: ArrayValidatorConfig<T>) {
    super(VLD_VALIDATOR_TYPES.ARRAY);
    this.config = config;
    this._simpleItemMode = this.getSimpleItemMode(config.itemValidator);
  }

  private getSimpleItemMode(itemValidator: VldBase<unknown, T>): SimpleItemMode {
    if ((itemValidator as any).isSimple !== true) {
      return undefined;
    }

    switch (itemValidator.validatorType) {
      case VLD_VALIDATOR_TYPES.STRING:
        return 'string';
      case VLD_VALIDATOR_TYPES.NUMBER:
        return 'number';
      case VLD_VALIDATOR_TYPES.BOOLEAN:
        return 'boolean';
      default:
        return undefined;
    }
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

    return this.parseArrayValue(value);
  }

  /**
   * Parse a value that has already passed the array type guard.
   * @internal Used by object validators to avoid duplicate hot-path checks.
   */
  parseKnownArray(value: unknown[]): T[] {
    return this.parseArrayValue(value);
  }

  private parseArrayValue(value: unknown[]): T[] {
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
    
    const length = value.length;
    const result = new Array<T>(length);
    const simpleItemMode = this._simpleItemMode;

    if (simpleItemMode !== undefined) {
      for (let i = 0; i < length; i++) {
        const item = value[i];
        switch (simpleItemMode) {
          case 'string':
            if (typeof item !== 'string') {
              throw new Error(getMessages().arrayItem(i, getMessages().invalidString));
            }
            result[i] = item as T;
            break;
          case 'number':
            if (typeof item !== 'number' || isNaN(item)) {
              throw new Error(getMessages().arrayItem(i, getMessages().invalidNumber));
            }
            result[i] = item as T;
            break;
          case 'boolean':
            if (typeof item !== 'boolean') {
              throw new Error(getMessages().arrayItem(i, getMessages().invalidBoolean));
            }
            result[i] = item as T;
            break;
        }
      }

      if (this.config.unique) {
        this.checkUnique(result);
      }

      return result;
    }

    // Validate each item without allocating a ParseResult object per element.
    for (let i = 0; i < length; i++) {
      try {
        result[i] = this.config.itemValidator.parse(value[i]);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(getMessages().arrayItem(i, message));
      }
    }
    
    // Check uniqueness if required - optimized with Map-based approach
    if (this.config.unique) {
      this.checkUnique(result);
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
      return { success: false, error: createArrayError((error as Error).message) };
    }
  }

  /**
   * Optimized uniqueness check using Map-based approach
   * Avoids repeated stableStringify calls by caching serialized values
   */
  private checkUnique(items: T[]): void {
    const seen = new Set<unknown>(); // Set of seen keys
    const objectKeys = new WeakMap<object, string>(); // Cache for object->string mappings

    for (const item of items) {
      let key: unknown;

      if (typeof item === 'object' && item !== null) {
        // Check if we've already serialized this object reference
        const cached = objectKeys.get(item);
        if (cached !== undefined) {
          key = cached;
        } else {
          // Serialize and cache
          const serialized = this.stableStringify(item);
          key = serialized;
          objectKeys.set(item, serialized);
        }
      } else {
        // Primitives can be used directly as keys
        key = item;
      }

      if (seen.has(key)) {
        throw new Error('Array must contain unique items');
      }
      seen.add(key);
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
    } catch {
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
