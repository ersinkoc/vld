import { VldBase, ParseResult, VLD_VALIDATOR_TYPES } from './base';
import { getMessages } from '../locales/runtime';
import { VldError } from '../errors-core';

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

function createSetError(message: string): VldError {
  return new VldError([{ code: 'invalid_type', path: [], message }]);
}

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
    super(VLD_VALIDATOR_TYPES.SET);
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
        return 'literal';
      case VLD_VALIDATOR_TYPES.ANY:
      case VLD_VALIDATOR_TYPES.UNKNOWN:
        return 'passthrough';
      default:
        return undefined;
    }
  }

  private getSimpleItemError(received: unknown): string {
    switch (this._simpleItemMode) {
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
        return getMessages().literalExpected(JSON.stringify(this._simpleItemValue), JSON.stringify(received));
      default:
        return getMessages().invalidSet;
    }
  }
  
  /**
   * Parse and validate a Set value
   */
  parse(value: unknown): Set<T> {
    if (!(value instanceof Set)) {
      throw new Error(this.errorMessage || getMessages().invalidSet);
    }

    return this.parseKnownSet(value);
  }

  /**
   * Parse a value that has already passed the Set instance guard.
   * @internal Used by object validators to avoid duplicate hot-path checks.
   */
  parseKnownSet(value: Set<unknown>): Set<T> {
    const result = new Set<T>();
    const simpleMode = this._simpleItemMode;

    if (simpleMode === 'string') {
      for (const item of value) {
        if (typeof item !== 'string') {
          throw new Error(this.getSimpleItemError(item));
        }
        result.add(item as T);
      }
      return result;
    }

    if (simpleMode === 'number') {
      for (const item of value) {
        if (typeof item !== 'number' || isNaN(item)) {
          throw new Error(this.getSimpleItemError(item));
        }
        result.add(item as T);
      }
      return result;
    }

    if (simpleMode === 'boolean') {
      for (const item of value) {
        if (typeof item !== 'boolean') {
          throw new Error(this.getSimpleItemError(item));
        }
        result.add(item as T);
      }
      return result;
    }

    if (simpleMode === 'bigint') {
      for (const item of value) {
        if (typeof item !== 'bigint') {
          throw new Error(this.getSimpleItemError(item));
        }
        result.add(item as T);
      }
      return result;
    }

    if (simpleMode === 'symbol') {
      for (const item of value) {
        if (typeof item !== 'symbol') {
          throw new Error(this.getSimpleItemError(item));
        }
        result.add(item as T);
      }
      return result;
    }

    if (simpleMode === 'null') {
      for (const item of value) {
        if (item !== null) {
          throw new Error(this.getSimpleItemError(item));
        }
        result.add(null as T);
      }
      return result;
    }

    if (simpleMode === 'undefinedValue') {
      for (const item of value) {
        if (item !== undefined) {
          throw new Error(this.getSimpleItemError(item));
        }
        result.add(undefined as T);
      }
      return result;
    }

    if (simpleMode === 'literal') {
      for (const item of value) {
        if (item !== this._simpleItemValue) {
          throw new Error(this.getSimpleItemError(item));
        }
        result.add(this._simpleItemValue as T);
      }
      return result;
    }

    if (simpleMode === 'passthrough') {
      for (const item of value) {
        result.add(item as T);
      }
      return result;
    }

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
      return { success: false, error: createSetError((error as Error).message) };
    }
  }
}
