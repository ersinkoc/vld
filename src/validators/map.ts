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

function createMapError(message: string): VldError {
  return new VldError([{ code: 'invalid_type', path: [], message }]);
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
    const result = new Map<K, V>();
    const simpleKeyMode = this._simpleKeyMode;
    const simpleValueMode = this._simpleValueMode;

    if (simpleKeyMode === 'string' && simpleValueMode === 'number') {
      for (const [key, val] of value) {
        if (typeof key !== 'string') {
          throw new Error(this.getSimpleItemError(simpleKeyMode, this._simpleKeyValue, key));
        }
        if (typeof val !== 'number' || !Number.isFinite(val)) {
          throw new Error(this.getSimpleItemError(simpleValueMode, this._simpleValueValue, val));
        }
        result.set(key as K, val as V);
      }
    } else if (simpleKeyMode === 'string' && simpleValueMode === 'string') {
      for (const [key, val] of value) {
        if (typeof key !== 'string') {
          throw new Error(this.getSimpleItemError(simpleKeyMode, this._simpleKeyValue, key));
        }
        if (typeof val !== 'string') {
          throw new Error(this.getSimpleItemError(simpleValueMode, this._simpleValueValue, val));
        }
        result.set(key as K, val as V);
      }
    } else if (simpleKeyMode !== undefined && simpleValueMode !== undefined) {
      const keyMode = simpleKeyMode as ConcreteSimpleMapItemMode;
      const valueMode = simpleValueMode as ConcreteSimpleMapItemMode;

      for (const [key, val] of value) {
        const validKey = this.parseSimpleItem<K>(keyMode, this._simpleKeyValue, key);
        const validValue = this.parseSimpleItem<V>(valueMode, this._simpleValueValue, val);
        result.set(validKey, validValue);
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
        } catch (error) {
          throw new Error((error as Error).message);
        }
      }
    }
    
    for (const check of this._checks) {
      if (!check.fn(result)) {
        throw check.kind ? new VldError([sizeIssue('map', check, result.size)]) : new Error(check.message);
      }
    }
    
    return result;
  }
  
  /** Async parse: keys and values go through their schemas' parseAsync. */
  override async parseAsync(value: unknown): Promise<Map<K, V>> {
    if (!(value instanceof Map)) {
      return this.parse(value);
    }
    const result = new Map<K, V>();
    const issues: VldIssue[] = [];
    let index = 0;
    for (const [key, val] of value) {
      const segment = typeof key === 'string' || typeof key === 'number' ? key : index;
      const parsedKey = await this.keyValidator.safeParseAsync(key);
      const parsedValue = await this.valueValidator.safeParseAsync(val);
      if (!parsedKey.success) issues.push(...nestIssues(parsedKey.error, segment, message => message).map(issue => ({ ...issue, code: 'invalid_key' as const })));
      if (!parsedValue.success) issues.push(...nestIssues(parsedValue.error, segment, message => message));
      if (parsedKey.success && parsedValue.success) result.set(parsedKey.data, parsedValue.data);
      index++;
    }
    if (issues.length > 0) throw new VldError(issues);
    for (const check of this._checks) {
      if (!check.fn(result)) {
        throw check.kind ? new VldError([sizeIssue('map', check, result.size)]) : new Error(check.message);
      }
    }
    return result;
  }

  /**
   * Safely parse and validate a Map value
   */
  safeParse(value: unknown): ParseResult<Map<K, V>> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      if (error instanceof VldError) {
        return { success: false, error };
      }
      return { success: false, error: createMapError((error as Error).message) };
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
