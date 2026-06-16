import { VldBase, ParseResult, VLD_VALIDATOR_TYPES } from './base';
import { getMessages } from '../locales/runtime';
import { VldError } from '../errors-core';

type SimpleTupleItemMode =
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

function createTupleError(message: string): VldError {
  return new VldError([{ code: 'invalid_array', path: [], message }]);
}

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
  private readonly _length: number;
  private readonly _validatorTypes: string[];
  private readonly _simpleItemModes: SimpleTupleItemMode[];
  private readonly _simpleItemValues: unknown[];

  private constructor(
    private readonly validators: T,
    private readonly errorMessage?: string
  ) {
    super(VLD_VALIDATOR_TYPES.TUPLE);
    this._length = validators.length;
    this._validatorTypes = validators.map(validator => validator.validatorType);
    this._simpleItemModes = validators.map((validator, index) => this.getSimpleItemMode(validator, this._validatorTypes[index]!));
    this._simpleItemValues = validators.map((validator, index) =>
      this._simpleItemModes[index] === 'literal' ? (validator as any).literal : undefined
    );
  }

  get items(): T {
    return this.validators;
  }

  private getSimpleItemMode(validator: VldBase<any, any>, type: string): SimpleTupleItemMode {
    if ((validator as any).isSimple !== true) {
      return undefined;
    }

    switch (type) {
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

  private getSimpleItemError(mode: SimpleTupleItemMode, expected?: unknown, received?: unknown): string {
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
        return getMessages().literalExpected(JSON.stringify(expected), JSON.stringify(received));
      default:
        return getMessages().invalidTuple;
    }
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

    return this.parseKnownTuple(value);
  }

  /**
   * Parse a value that has already passed the tuple array type guard.
   * @internal Used by object validators to avoid duplicate hot-path checks.
   */
  parseKnownTuple(value: unknown[]): { [K in keyof T]: T[K] extends VldBase<any, infer U> ? U : never } {
    if (value.length !== this._length) {
      throw new Error(
        this.errorMessage ||
        getMessages().tupleLength(this._length, value.length)
      );
    }

    const result = new Array(this._length);
    for (let i = 0; i < this._length; i++) {
      const simpleMode = this._simpleItemModes[i];
      const item = value[i];

      if (simpleMode !== undefined) {
        switch (simpleMode) {
          case 'string':
            if (typeof item !== 'string') {
              throw new Error(getMessages().arrayItem(i, getMessages().invalidString));
            }
            result[i] = item;
            continue;
          case 'number':
            if (typeof item !== 'number' || isNaN(item)) {
              throw new Error(getMessages().arrayItem(i, getMessages().invalidNumber));
            }
            result[i] = item;
            continue;
          case 'boolean':
            if (typeof item !== 'boolean') {
              throw new Error(getMessages().arrayItem(i, getMessages().invalidBoolean));
            }
            result[i] = item;
            continue;
          case 'bigint':
            if (typeof item !== 'bigint') {
              throw new Error(getMessages().arrayItem(i, getMessages().invalidBigint));
            }
            result[i] = item;
            continue;
          case 'symbol':
            if (typeof item !== 'symbol') {
              throw new Error(getMessages().arrayItem(i, getMessages().invalidSymbol));
            }
            result[i] = item;
            continue;
          case 'null':
            if (item !== null) {
              throw new Error(getMessages().arrayItem(i, this.getSimpleItemError(simpleMode, undefined, item)));
            }
            result[i] = null;
            continue;
          case 'undefinedValue':
            if (item !== undefined) {
              throw new Error(getMessages().arrayItem(i, getMessages().expectedUndefined));
            }
            result[i] = undefined;
            continue;
          case 'literal': {
            const literal = this._simpleItemValues[i];
            if (item !== literal) {
              throw new Error(getMessages().arrayItem(i, this.getSimpleItemError(simpleMode, literal, item)));
            }
            result[i] = literal;
            continue;
          }
          case 'passthrough':
            result[i] = item;
            continue;
        }
      }

      try {
        const validator = this.validators[i]!;
        result[i] = validator.parse(item);
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
      return { success: false, error: createTupleError((error as Error).message) };
    }
  }
}
