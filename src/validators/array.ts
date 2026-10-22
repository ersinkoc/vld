import { VldBase, ParseResult, VLD_VALIDATOR_TYPES } from './base';
import { getMessages } from '../locales/runtime';
import { VldError, getTypeName, createInvalidTypeIssue, nestIssues, type VldIssue } from '../errors-core';

type SimpleItemMode = 'string' | 'number' | 'boolean' | undefined;

function createArrayError(message: string): VldError {
  return new VldError([{ code: 'invalid_array', path: [], message }]);
}

function createArrayTooSmallError(minimum: number, message: string): VldError {
  return new VldError([{ code: 'too_small', path: [], origin: 'array', minimum, inclusive: true, message }]);
}

function createArrayTooBigError(maximum: number, message: string): VldError {
  return new VldError([{ code: 'too_big', path: [], origin: 'array', maximum, inclusive: true, message }]);
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
  readonly uniqueMessage?: string | undefined;
  // One message per constraint: a later min()/max() must not relabel an
  // earlier constraint's failure (or the "not an array" type error).
  readonly minMessage?: string | undefined;
  readonly maxMessage?: string | undefined;
  readonly lengthMessage?: string | undefined;
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

  get element(): VldBase<unknown, T> {
    return this.config.itemValidator;
  }

  unwrap(): VldBase<unknown, T> {
    return this.config.itemValidator;
  }
  
  /**
   * Parse and validate an array value
   */
  parse(value: unknown): T[] {
    if (!Array.isArray(value)) {
      throw new VldError([createInvalidTypeIssue('array', getTypeName(value), getMessages().invalidArray)]);
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
    const { exactLength, minLength, maxLength } = this.config;

    // Zod 4.6.6+: an array over its upper size bound fails before any element is
    // parsed, so no element issue is reported alongside the size issue.
    if (exactLength !== undefined && value.length > exactLength) {
      throw createArrayTooBigError(exactLength, this.config.lengthMessage || getMessages().arrayLength(exactLength));
    }
    if (maxLength !== undefined && value.length > maxLength) {
      throw createArrayTooBigError(maxLength, this.config.maxMessage || getMessages().arrayMax(maxLength));
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
              this.throwArrayIssues(value, i);
            }
            result[i] = item as T;
            break;
          case 'number':
            if (typeof item !== 'number' || !Number.isFinite(item)) {
              this.throwArrayIssues(value, i);
            }
            result[i] = item as T;
            break;
          case 'boolean':
            if (typeof item !== 'boolean') {
              this.throwArrayIssues(value, i);
            }
            result[i] = item as T;
            break;
        }
      }
    } else {
      // Validate each item without allocating a ParseResult object per element;
      // the first failure re-collects every remaining issue with its index (Zod).
      for (let i = 0; i < length; i++) {
        try {
          result[i] = this.config.itemValidator.parse(value[i]);
        } catch {
          this.throwArrayIssues(value, i);
        }
      }
    }

    // Lower bounds run after element parsing (Zod): an undersized array reports
    // its size issue alongside — not instead of — any element issue.
    if (exactLength !== undefined && length < exactLength) {
      throw createArrayTooSmallError(exactLength, this.config.lengthMessage || getMessages().arrayLength(exactLength));
    }
    if (minLength !== undefined && length < minLength) {
      throw createArrayTooSmallError(minLength, this.config.minMessage || getMessages().arrayMin(minLength));
    }

    // Check uniqueness if required - optimized with Map-based approach
    if (this.config.unique) {
      this.checkUnique(result);
    }

    return result;
  }

  /**
   * Re-validates `value` from `startIndex` in issue-collection mode and throws a
   * VldError carrying one issue per failing element (path `[index, ...]`) plus
   * any pending lower-bound size issue, matching Zod's reporting order.
   */
  private throwArrayIssues(value: unknown[], startIndex: number): never {
    const issues: VldIssue[] = [];
    for (let i = startIndex; i < value.length; i++) {
      const item = this.config.itemValidator.safeParse(value[i]);
      if (!item.success) {
        issues.push(...nestIssues(item.error, i, message => message));
      }
    }
    const { exactLength, minLength } = this.config;
    if (exactLength !== undefined && value.length < exactLength) {
      issues.push({
        code: 'too_small', path: [], origin: 'array',
        minimum: exactLength, inclusive: true,
        message: this.config.lengthMessage || getMessages().arrayLength(exactLength),
      });
    } else if (minLength !== undefined && value.length < minLength) {
      issues.push({
        code: 'too_small', path: [], origin: 'array',
        minimum: minLength, inclusive: true,
        message: this.config.minMessage || getMessages().arrayMin(minLength),
      });
    }
    throw new VldError(issues);
  }
  
  /**
   * Safely parse and validate an array value
   */
  safeParse(value: unknown): ParseResult<T[]> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      if (error instanceof VldError) {
        return { success: false, error };
      }
      return { success: false, error: createArrayError((error as Error).message) };
    }
  }

  /** Async parse: each item goes through the item schema's parseAsync. */
  override async parseAsync(value: unknown): Promise<T[]> {
    if (!Array.isArray(value)) {
      return this.parse(value);
    }
    const { exactLength, minLength, maxLength } = this.config;
    // Zod 4.6.6+: upper bounds gate before any element is parsed.
    if (exactLength !== undefined && value.length > exactLength) {
      throw createArrayTooBigError(exactLength, this.config.lengthMessage!);
    }
    if (maxLength !== undefined && value.length > maxLength) {
      throw createArrayTooBigError(maxLength, this.config.maxMessage!);
    }
    const result = new Array<T>(value.length);
    const issues: VldIssue[] = [];
    for (let i = 0; i < value.length; i++) {
      const item = await this.config.itemValidator.safeParseAsync(value[i]);
      if (item.success) result[i] = item.data;
      else issues.push(...nestIssues(item.error, i, message => message));
    }
    // Lower bounds run after element parsing (Zod): appended alongside element issues.
    if (exactLength !== undefined && value.length < exactLength) {
      issues.push({ code: 'too_small', path: [], origin: 'array', minimum: exactLength, inclusive: true, message: this.config.lengthMessage! });
    } else if (minLength !== undefined && value.length < minLength) {
      issues.push({ code: 'too_small', path: [], origin: 'array', minimum: minLength, inclusive: true, message: this.config.minMessage! });
    }
    if (issues.length > 0) throw new VldError(issues);
    if (this.config.unique) this.checkUnique(result);
    return result;
  }

  override encode(value: T[]): unknown[] {
    this.validateEncodedArray(value);
    const result = new Array<unknown>(value.length);
    for (let i = 0; i < value.length; i++) {
      result[i] = this.config.itemValidator.encode(value[i]!);
    }
    return result;
  }

  override safeEncode(value: T[]): ParseResult<unknown[]> {
    try {
      return { success: true, data: this.encode(value) };
    } catch (error) {
      return { success: false, error: createArrayError((error as Error).message) };
    }
  }

  override async encodeAsync(value: T[]): Promise<unknown[]> {
    this.validateEncodedArray(value);
    const result = new Array<unknown>(value.length);
    for (let i = 0; i < value.length; i++) {
      result[i] = await this.config.itemValidator.encodeAsync(value[i]!);
    }
    return result;
  }

  override async safeEncodeAsync(value: T[]): Promise<ParseResult<unknown[]>> {
    try {
      return { success: true, data: await this.encodeAsync(value) };
    } catch (error) {
      return { success: false, error: createArrayError((error as Error).message) };
    }
  }

  private validateEncodedArray(value: T[]): void {
    if (!Array.isArray(value)) {
      throw new Error(getMessages().invalidArray);
    }
    if (this.config.exactLength !== undefined && value.length !== this.config.exactLength) {
      throw new Error(this.config.lengthMessage!);
    }
    if (this.config.minLength !== undefined && value.length < this.config.minLength) {
      throw new Error(this.config.minMessage!);
    }
    if (this.config.maxLength !== undefined && value.length > this.config.maxLength) {
      throw new Error(this.config.maxMessage!);
    }
    if (this.config.unique) {
      this.checkUnique(value);
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
          const serialized = VldArray.stableStringify(item);
          key = serialized;
          objectKeys.set(item, serialized);
        }
      } else {
        // Primitives can be used directly as keys
        key = item;
      }

      if (seen.has(key)) {
        throw new Error(this.config.uniqueMessage || 'Array must contain unique items');
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
  /** @internal Also used by VldArrayV2.unique() so both validators agree. */
  static stableStringify(obj: any): string {
    const seen = new WeakSet();
    const MAX_DEPTH = 100; // Reasonable depth limit to prevent stack overflow

    // Helper function to sort keys and create stable representation
    const sortedStringify = (value: any, depth: number = 0): string => {
      // Check depth limit
      if (depth > MAX_DEPTH) {
        return '"[Max Depth Exceeded]"';
      }

      // Handle primitives (bigint has no JSON form; tag it so 1n !== 1)
      if (value === null) return 'null';
      if (value === undefined) return 'undefined';
      if (typeof value === 'bigint') return `${value}n`;
      if (typeof value !== 'object') return JSON.stringify(value);

      // Built-ins whose state is not in own enumerable keys: without these,
      // every Date / Map / Set would serialize as "{}" and collide.
      if (value instanceof Date) return `Date(${value.getTime()})`;

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

        if (value instanceof Map) {
          const entries = Array.from(value, ([k, v]) => `${sortedStringify(k, depth + 1)}=>${sortedStringify(v, depth + 1)}`).sort();
          return `Map{${entries.join(',')}}`;
        }

        if (value instanceof Set) {
          const entries = Array.from(value, item => sortedStringify(item, depth + 1)).sort();
          return `Set{${entries.join(',')}}`;
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
      minMessage: message || getMessages().arrayMin(length)
    });
  }
  
  /**
   * Create a new validator with maximum length constraint
   */
  max(length: number, message?: string): VldArray<T> {
    return new VldArray({
      ...this.config,
      maxLength: length,
      maxMessage: message || getMessages().arrayMax(length)
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
      lengthMessage: message || getMessages().arrayLength(length)
    });
  }
  
  /**
   * Create a new validator that ensures array is not empty
   */
  nonempty(message?: string): VldArray<T> {
    return new VldArray({
      ...this.config,
      minLength: 1,
      minMessage: message || getMessages().arrayEmpty
    });
  }
  
  /**
   * Create a new validator that ensures array contains unique items
   */
  unique(message?: string): VldArray<T> {
    return new VldArray({
      ...this.config,
      unique: true,
      uniqueMessage: message
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
      minMessage: message || `Array length must be between ${min} and ${max}`,
      maxMessage: message || `Array length must be between ${min} and ${max}`
    });
  }
}
