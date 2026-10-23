import { VldBase, ParseResult, VLD_VALIDATOR_TYPES } from './base';
import { getMessages } from '../locales/runtime';
import { VldError, type VldIssue, stringifyForMessage, nestIssues, createInvalidTypeIssue, getTypeName } from '../errors-core';

type SimpleMapItemMode =
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
type ConcreteSimpleMapItemMode = Exclude<SimpleMapItemMode, undefined>;

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
 * Immutable Map validator
 */
export class VldMap<K, V> extends VldBase<unknown, Map<K, V>> {
  private readonly _checks: ReadonlyArray<SizeCheck<Map<K, V>>>;

  /**
   * Private constructor to enforce immutability
   */
  private constructor(
    private readonly keyValidator: VldBase<unknown, K>,
    private readonly valueValidator: VldBase<unknown, V>,
    private readonly errorMessage?: string,
    checks: ReadonlyArray<SizeCheck<Map<K, V>>> = []
  ) {
    super(VLD_VALIDATOR_TYPES.MAP);
    this._checks = checks;
    this._simpleKeyMode = this.getSimpleItemMode(keyValidator);
    this._simpleValueMode = this.getSimpleItemMode(valueValidator);
    this._simpleKeyValue = this._simpleKeyMode === 'literal' ? (keyValidator as any).literal : undefined;
    this._simpleValueValue = this._simpleValueMode === 'literal' ? (valueValidator as any).literal : undefined;
  }

  private readonly _simpleKeyMode: SimpleMapItemMode;
  private readonly _simpleValueMode: SimpleMapItemMode;
  private readonly _simpleKeyValue: unknown;
  private readonly _simpleValueValue: unknown;

  get keySchema(): VldBase<unknown, K> {
    return this.keyValidator;
  }

  get valueSchema(): VldBase<unknown, V> {
    return this.valueValidator;
  }

  get keyType(): VldBase<unknown, K> {
    return this.keyValidator;
  }

  get valueType(): VldBase<unknown, V> {
    return this.valueValidator;
  }
  
  /**
   * Create a new Map validator
   */
  static create<K, V>(
    keyValidator: VldBase<unknown, K>,
    valueValidator: VldBase<unknown, V>
  ): VldMap<K, V> {
    return new VldMap(keyValidator, valueValidator);
  }

  private getSimpleItemMode<T>(validator: VldBase<unknown, T>): SimpleMapItemMode {
    if ((validator as any).isSimple !== true) {
      return undefined;
    }

    switch (validator.validatorType) {
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
        return Number.isNaN((validator as any).literal) ? undefined : 'literal';
      case VLD_VALIDATOR_TYPES.ANY:
      case VLD_VALIDATOR_TYPES.UNKNOWN:
        return 'passthrough';
      default:
        return undefined;
    }
  }

  private getSimpleItemError(mode: SimpleMapItemMode, expected: unknown, received: unknown): string {
    switch (mode) {
      case 'string':
        return getMessages().invalidString;
      case 'number':
        return getMessages().invalidNumber;
      case 'boolean':
        return getMessages().invalidBoolean;
      case 'bigint':
        return getMessages().invalidBigint;
      case 'symbol':
        return getMessages().invalidSymbol;
      case 'null':
        return `Expected null, received ${typeof received}`;
      case 'undefinedValue':
        return getMessages().expectedUndefined;
      case 'literal':
        return getMessages().literalExpected(stringifyForMessage(expected), stringifyForMessage(received));
      default:
        return getMessages().invalidMap;
    }
  }

  private parseSimpleItem<T>(mode: ConcreteSimpleMapItemMode, expected: unknown, value: unknown): T {
    switch (mode) {
      case 'string':
        if (typeof value !== 'string') {
          throw new Error(this.getSimpleItemError(mode, expected, value));
        }
        return value as T;
      case 'number':
        if (typeof value !== 'number' || !Number.isFinite(value)) {
          throw new Error(this.getSimpleItemError(mode, expected, value));
        }
        return value as T;
      case 'boolean':
        if (typeof value !== 'boolean') {
          throw new Error(this.getSimpleItemError(mode, expected, value));
        }
        return value as T;
      case 'bigint':
        if (typeof value !== 'bigint') {
          throw new Error(this.getSimpleItemError(mode, expected, value));
        }
        return value as T;
      case 'symbol':
        if (typeof value !== 'symbol') {
          throw new Error(this.getSimpleItemError(mode, expected, value));
        }
        return value as T;
      case 'null':
        if (value !== null) {
          throw new Error(this.getSimpleItemError(mode, expected, value));
        }
        return null as T;
      case 'undefinedValue':
        if (value !== undefined) {
          throw new Error(this.getSimpleItemError(mode, expected, value));
        }
        return undefined as T;
      case 'literal':
        if (value !== expected) {
          throw new Error(this.getSimpleItemError(mode, expected, value));
        }
        return expected as T;
      case 'passthrough':
        return value as T;
    }
  }
  
  /**
   * Parse and validate a Map value
   */
  parse(value: unknown): Map<K, V> {
    if (!(value instanceof Map)) {
      throw new VldError([createInvalidTypeIssue('map', getTypeName(value), this.errorMessage || getMessages().invalidMap)]);
    }

    return this.parseKnownMap(value);
  }

  /**
   * Parse a value that has already passed the Map instance guard.
   * @internal Used by object validators to avoid duplicate hot-path checks.
   */
  parseKnownMap(value: Map<unknown, unknown>): Map<K, V> {
    // Zod 4.6.6+: a map over its upper size bound fails before any entry is
    // parsed, so no entry issue is reported alongside the size issue.
    for (const check of this._checks) {
      if ((check.kind === 'max' || check.kind === 'size') && value.size > check.value!) {
        throw new VldError([sizeIssue('map', check, value.size)]);
      }
    }

    const result = new Map<K, V>();
    const simpleKeyMode = this._simpleKeyMode;
    const simpleValueMode = this._simpleValueMode;

    if (simpleKeyMode === 'string' && simpleValueMode === 'number') {
      for (const [key, val] of value) {
        if (typeof key !== 'string') {
          this.throwMapIssues(value);
        }
        if (typeof val !== 'number' || !Number.isFinite(val)) {
          this.throwMapIssues(value);
        }
        result.set(key as K, val as V);
      }
    } else if (simpleKeyMode === 'string' && simpleValueMode === 'string') {
      for (const [key, val] of value) {
        if (typeof key !== 'string') {
          this.throwMapIssues(value);
        }
        if (typeof val !== 'string') {
          this.throwMapIssues(value);
        }
        result.set(key as K, val as V);
      }
    } else if (simpleKeyMode !== undefined && simpleValueMode !== undefined) {
      const keyMode = simpleKeyMode as ConcreteSimpleMapItemMode;
      const valueMode = simpleValueMode as ConcreteSimpleMapItemMode;

      for (const [key, val] of value) {
        try {
          const validKey = this.parseSimpleItem<K>(keyMode, this._simpleKeyValue, key);
          const validValue = this.parseSimpleItem<V>(valueMode, this._simpleValueValue, val);
          result.set(validKey, validValue);
        } catch {
          this.throwMapIssues(value);
        }
      }
    } else {
      for (const [key, val] of value) {
        try {
          const validKey = simpleKeyMode === undefined
            ? this.keyValidator.parse(key)
            : this.parseSimpleItem<K>(simpleKeyMode as ConcreteSimpleMapItemMode, this._simpleKeyValue, key);
          const validValue = simpleValueMode === undefined
            ? this.valueValidator.parse(val)
            : this.parseSimpleItem<V>(simpleValueMode as ConcreteSimpleMapItemMode, this._simpleValueValue, val);
          result.set(validKey, validValue);
        } catch {
          this.throwMapIssues(value);
        }
      }
    }

    // Lower bounds run after entry parsing (Zod).
    for (const check of this._checks) {
      if (!check.fn(result)) {
        throw new VldError([sizeIssue('map', check, result.size)]);
      }
    }

    return result;
  }

  /**
   * Re-validates every entry in issue-collection mode and throws a VldError
   * matching Zod's `handleMapResult`: failures on a property-key-shaped key are
   * prefixed with that key; failures on other keys collapse into a single
   * `invalid_key` / `invalid_element` issue at the root. Lower-bound size
   * issues are appended after the entry issues.
   */
  private throwMapIssues(value: Map<unknown, unknown>): never {
    const issues: VldIssue[] = [];
    const parsed = new Map<K, V>();
    for (const [key, val] of value) {
      const parsedKey = this.keyValidator.safeParse(key);
      const parsedValue = this.valueValidator.safeParse(val);
      if (!parsedKey.success) {
        issues.push(...this.mapEntryIssues(parsedKey.error, key));
      }
      if (!parsedValue.success) {
        issues.push(...this.mapEntryIssues(parsedValue.error, key, 'invalid_element'));
      }
      // Zod still writes the raw entry into the output on failure, so size
      // checks see every input entry.
      parsed.set(
        parsedKey.success ? parsedKey.data : key as K,
        parsedValue.success ? parsedValue.data : val as V
      );
    }
    // Size checks see one entry per input entry, as in Zod.
    for (const check of this._checks) {
      if ((check.kind === 'min' || check.kind === 'size') && !check.fn(parsed)) {
        issues.push(sizeIssue('map', check, parsed.size));
      }
    }
    throw new VldError(issues);
  }

  /** @internal Shared with parseAsync: Zod's key/value issue placement rules. */
  private mapEntryIssues(error: VldError, key: unknown, kind?: 'invalid_element'): VldIssue[] {
    if (typeof key === 'string' || typeof key === 'number' || typeof key === 'symbol') {
      // Property-key-shaped keys prefix the entry's issues (Zod prefixIssues).
      return nestIssues(error, key as string | number, message => message);
    }
    return [{
      code: kind === 'invalid_element' ? 'invalid_element' : 'invalid_key',
      origin: 'map',
      path: [],
      message: kind === 'invalid_element' ? `Invalid value in map` : `Invalid key in map`,
      issues: error.issues,
      ...(kind === 'invalid_element' ? { key } : {}),
    }];
  }

  /** Async parse: keys and values go through their schemas' parseAsync. */
  override async parseAsync(value: unknown): Promise<Map<K, V>> {
    if (!(value instanceof Map)) {
      return this.parse(value);
    }
    // Zod 4.6.6+: upper bounds gate before any entry is parsed.
    for (const check of this._checks) {
      if ((check.kind === 'max' || check.kind === 'size') && value.size > check.value!) {
        throw new VldError([sizeIssue('map', check, value.size)]);
      }
    }
    const result = new Map<K, V>();
    const issues: VldIssue[] = [];
    for (const [key, val] of value) {
      const parsedKey = await this.keyValidator.safeParseAsync(key);
      const parsedValue = await this.valueValidator.safeParseAsync(val);
      if (!parsedKey.success) issues.push(...this.mapEntryIssues(parsedKey.error, key));
      if (!parsedValue.success) issues.push(...this.mapEntryIssues(parsedValue.error, key, 'invalid_element'));
      if (parsedKey.success && parsedValue.success) result.set(parsedKey.data, parsedValue.data);
    }
    // Lower bounds run after entry parsing (Zod): appended alongside entry issues.
    for (const check of this._checks) {
      if ((check.kind === 'min' || check.kind === 'size') && !check.fn(result)) {
        issues.push(sizeIssue('map', check, result.size));
      }
    }
    if (issues.length > 0) throw new VldError(issues);
    return result;
  }

  /**
   * Safely parse and validate a Map value
   */
  safeParse(value: unknown): ParseResult<Map<K, V>> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      // Every parse failure path throws VldError.
      return { success: false, error: error as VldError };
    }
  }

  min(size: number, message?: string): VldMap<K, V> {
    return new VldMap(this.keyValidator, this.valueValidator, this.errorMessage, [
      ...this._checks,
      { fn: (m) => m.size >= size, message: message || `Map must contain at least ${size} entries`, kind: 'min', value: size }
    ]);
  }

  max(size: number, message?: string): VldMap<K, V> {
    return new VldMap(this.keyValidator, this.valueValidator, this.errorMessage, [
      ...this._checks,
      { fn: (m) => m.size <= size, message: message || `Map must contain at most ${size} entries`, kind: 'max', value: size }
    ]);
  }

  size(size: number, message?: string): VldMap<K, V> {
    return new VldMap(this.keyValidator, this.valueValidator, this.errorMessage, [
      ...this._checks,
      { fn: (m) => m.size === size, message: message || `Map must contain exactly ${size} entries`, kind: 'size', value: size }
    ]);
  }

  nonempty(message?: string): VldMap<K, V> {
    return this.min(1, message || 'Map cannot be empty');
  }
}
