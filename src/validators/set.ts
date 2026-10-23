import { VldBase, ParseResult, VLD_VALIDATOR_TYPES } from './base';
import { getMessages } from '../locales/runtime';
import { VldError, type VldIssue, createInvalidTypeIssue, getTypeName } from '../errors-core';

type SimpleSetItemMode =
  | 'string'
  | 'number'
  | 'boolean'
  | 'bigint'
  | 'symbol'
  | 'null'
  | 'undefinedValue'
  | 'literal'
  | 'passthrough'
  | undefined;

/** A size constraint; `kind` lets failures report too_small / too_big. */
interface SizeCheck<C> {
  readonly fn: (collection: C) => boolean;
  readonly message: string;
  readonly kind?: 'min' | 'max' | 'size';
  readonly value?: number;
}

function sizeIssue(origin: 'set' | 'map', check: SizeCheck<any>, actual: number): VldIssue {
  const limit = check.value!;
  if (check.kind === 'min' || (check.kind === 'size' && actual < limit)) {
    return { code: 'too_small', path: [], origin, minimum: limit, inclusive: true, message: check.message };
  }
  return { code: 'too_big', path: [], origin, maximum: limit, inclusive: true, message: check.message };
}

/**
 * Immutable Set validator
 */
export class VldSet<T> extends VldBase<unknown, Set<T>> {
  private readonly _checks: ReadonlyArray<SizeCheck<Set<T>>>;

  /**
   * Private constructor to enforce immutability
   */
  private constructor(
    private readonly itemValidator: VldBase<unknown, T>,
    private readonly errorMessage?: string,
    checks: ReadonlyArray<SizeCheck<Set<T>>> = []
  ) {
    super(VLD_VALIDATOR_TYPES.SET);
    this._checks = checks;
    this._simpleItemMode = this.getSimpleItemMode(itemValidator);
    this._simpleItemValue = this._simpleItemMode === 'literal' ? (itemValidator as any).literal : undefined;
  }

  private readonly _simpleItemMode: SimpleSetItemMode;
  private readonly _simpleItemValue: unknown;

  get itemSchema(): VldBase<unknown, T> {
    return this.itemValidator;
  }
  
  /**
   * Create a new Set validator
   */
  static create<T>(itemValidator: VldBase<unknown, T>): VldSet<T> {
    return new VldSet(itemValidator);
  }

  private getSimpleItemMode(itemValidator: VldBase<unknown, T>): SimpleSetItemMode {
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
      case VLD_VALIDATOR_TYPES.BIGINT:
        return 'bigint';
      case VLD_VALIDATOR_TYPES.SYMBOL:
        return 'symbol';
      case VLD_VALIDATOR_TYPES.NULL:
        return 'null';
      case VLD_VALIDATOR_TYPES.UNDEFINED:
      case VLD_VALIDATOR_TYPES.VOID:
        return 'undefinedValue';
      case VLD_VALIDATOR_TYPES.LITERAL:
        // The fast path compares with ===, which never matches NaN; the generic literal check does (SameValueZero).
        return Number.isNaN((itemValidator as any).literal) ? undefined : 'literal';
      case VLD_VALIDATOR_TYPES.ANY:
      case VLD_VALIDATOR_TYPES.UNKNOWN:
        return 'passthrough';
      default:
        return undefined;
    }
  }

  /**
   * Parse and validate a Set value
   */
  parse(value: unknown): Set<T> {
    if (!(value instanceof Set)) {
      throw new VldError([createInvalidTypeIssue('set', getTypeName(value), this.errorMessage || getMessages().invalidSet)]);
    }

    return this.parseKnownSet(value);
  }

  /**
   * Parse a value that has already passed the Set instance guard.
   * @internal Used by object validators to avoid duplicate hot-path checks.
   */
  parseKnownSet(value: Set<unknown>): Set<T> {
    // Zod 4.6.6+: a set over its upper size bound fails before any member is
    // parsed, so no member issue is reported alongside the size issue.
    for (const check of this._checks) {
      if ((check.kind === 'max' || check.kind === 'size') && value.size > check.value!) {
        throw new VldError([sizeIssue('set', check, value.size)]);
      }
    }

    const result = new Set<T>();
    const simpleMode = this._simpleItemMode;

    if (simpleMode === 'string') {
      for (const item of value) {
        if (typeof item !== 'string') {
          this.throwSetIssues(value);
        }
        result.add(item as T);
      }
    } else if (simpleMode === 'number') {
      for (const item of value) {
        if (typeof item !== 'number' || !Number.isFinite(item)) {
          this.throwSetIssues(value);
        }
        result.add(item as T);
      }
    } else if (simpleMode === 'boolean') {
      for (const item of value) {
        if (typeof item !== 'boolean') {
          this.throwSetIssues(value);
        }
        result.add(item as T);
      }
    } else if (simpleMode === 'bigint') {
      for (const item of value) {
        if (typeof item !== 'bigint') {
          this.throwSetIssues(value);
        }
        result.add(item as T);
      }
    } else if (simpleMode === 'symbol') {
      for (const item of value) {
        if (typeof item !== 'symbol') {
          this.throwSetIssues(value);
        }
        result.add(item as T);
      }
    } else if (simpleMode === 'null') {
      for (const item of value) {
        if (item !== null) {
          this.throwSetIssues(value);
        }
        result.add(null as T);
      }
    } else if (simpleMode === 'undefinedValue') {
      for (const item of value) {
        if (item !== undefined) {
          this.throwSetIssues(value);
        }
        result.add(undefined as T);
      }
    } else if (simpleMode === 'literal') {
      for (const item of value) {
        if (item !== this._simpleItemValue) {
          this.throwSetIssues(value);
        }
        result.add(this._simpleItemValue as T);
      }
    } else if (simpleMode === 'passthrough') {
      for (const item of value) {
        result.add(item as T);
      }
    } else {
      for (const item of value) {
        try {
          result.add(this.itemValidator.parse(item));
        } catch {
          this.throwSetIssues(value);
        }
      }
    }

    // Lower bounds run after member parsing (Zod).
    for (const check of this._checks) {
      if (!check.fn(result)) {
        throw new VldError([sizeIssue('set', check, result.size)]);
      }
    }

    return result;
  }

  /**
   * Re-validates every member in issue-collection mode and throws a VldError
   * carrying one issue per failing member at the set's root path (Zod reports
   * set members without an index segment) plus any pending lower-bound issue.
   * Size checks see the set of successfully parsed members, as in Zod.
   */
  private throwSetIssues(value: Set<unknown>): never {
    const issues: VldIssue[] = [];
    const parsed = new Set<T>();
    for (const item of value) {
      const result = this.itemValidator.safeParse(item);
      if (result.success) {
        parsed.add(result.data);
      } else {
        // Zod still adds the raw member to the output, so size checks see it.
        parsed.add(item as T);
        issues.push(...result.error.issues);
      }
    }
    for (const check of this._checks) {
      if ((check.kind === 'min' || check.kind === 'size') && !check.fn(parsed)) {
        issues.push(sizeIssue('set', check, parsed.size));
      }
    }
    throw new VldError(issues);
  }

  /** Async parse: each item goes through the item schema's parseAsync. */
  override async parseAsync(value: unknown): Promise<Set<T>> {
    if (!(value instanceof Set)) {
      return this.parse(value);
    }
    // Zod 4.6.6+: upper bounds gate before any member is parsed.
    for (const check of this._checks) {
      if ((check.kind === 'max' || check.kind === 'size') && value.size > check.value!) {
        throw new VldError([sizeIssue('set', check, value.size)]);
      }
    }
    const result = new Set<T>();
    const issues: VldIssue[] = [];
    for (const item of value) {
      const parsed = await this.itemValidator.safeParseAsync(item);
      if (parsed.success) result.add(parsed.data);
      else issues.push(...parsed.error.issues);
    }
    // Lower bounds run after member parsing (Zod): appended alongside member issues.
    for (const check of this._checks) {
      if ((check.kind === 'min' || check.kind === 'size') && !check.fn(result)) {
        issues.push(sizeIssue('set', check, result.size));
      }
    }
    if (issues.length > 0) throw new VldError(issues);
    return result;
  }

  /**
   * Safely parse and validate a Set value
   */
  safeParse(value: unknown): ParseResult<Set<T>> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      // Every parse failure path throws VldError.
      return { success: false, error: error as VldError };
    }
  }

  min(size: number, message?: string): VldSet<T> {
    return new VldSet(this.itemValidator, this.errorMessage, [
      ...this._checks,
      { fn: (s) => s.size >= size, message: message || `Set must contain at least ${size} elements`, kind: 'min', value: size }
    ]);
  }

  max(size: number, message?: string): VldSet<T> {
    return new VldSet(this.itemValidator, this.errorMessage, [
      ...this._checks,
      { fn: (s) => s.size <= size, message: message || `Set must contain at most ${size} elements`, kind: 'max', value: size }
    ]);
  }

  size(size: number, message?: string): VldSet<T> {
    return new VldSet(this.itemValidator, this.errorMessage, [
      ...this._checks,
      { fn: (s) => s.size === size, message: message || `Set must contain exactly ${size} elements`, kind: 'size', value: size }
    ]);
  }

  nonempty(message?: string): VldSet<T> {
    return this.min(1, message || 'Set cannot be empty');
  }
}
