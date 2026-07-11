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

type FixedTupleOutput<T extends readonly VldBase<any, any>[]> = {
  -readonly [K in keyof T]: ReturnType<T[K]['parse']>;
};

type TupleOutput<
  T extends readonly VldBase<any, any>[],
  TRest extends VldBase<any, any> | null
> = TRest extends VldBase<any, any>
  ? [...FixedTupleOutput<T>, ...ReturnType<TRest['parse']>[]]
  : FixedTupleOutput<T>;

function createTupleError(message: string): VldError {
  return new VldError([{ code: 'invalid_array', path: [], message }]);
}

/**
 * Immutable tuple validator for fixed-length arrays
 */
export class VldTuple<
  T extends readonly VldBase<any, any>[],
  TRest extends VldBase<any, any> | null = null
> extends VldBase<
  unknown,
  TupleOutput<T, TRest>
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
    private readonly errorMessage?: string,
    private readonly restValidator: TRest = null as TRest
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
  static create<T extends readonly VldBase<any, any>[]>(...validators: T): VldTuple<T, null> {
    return new VldTuple<T, null>(validators);
  }

  rest<TSchema extends VldBase<any, any>>(validator: TSchema): VldTuple<T, TSchema> {
    return new VldTuple<T, TSchema>(this.validators, this.errorMessage, validator);
  }
  
  /**
   * Parse and validate a tuple value
   */
  parse(value: unknown): TupleOutput<T, TRest> {
    if (!Array.isArray(value)) {
      throw new Error(this.errorMessage || getMessages().invalidTuple);
    }

    return this.parseKnownTuple(value);
  }

  /**
   * Parse a value that has already passed the tuple array type guard.
   * @internal Used by object validators to avoid duplicate hot-path checks.
   */
  parseKnownTuple(value: unknown[]): TupleOutput<T, TRest> {
    if (
      (this.restValidator === null && value.length !== this._length) ||
      (this.restValidator !== null && value.length < this._length)
    ) {
      throw new Error(
        this.errorMessage ||
        getMessages().tupleLength(this._length, value.length)
      );
    }

    const result = new Array(value.length);
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

    if (this.restValidator) {
      for (let i = this._length; i < value.length; i++) {
        try {
          result[i] = this.restValidator.parse(value[i]);
        } catch (error) {
          throw new Error(getMessages().arrayItem(i, (error as Error).message));
        }
      }
    }

    return result as TupleOutput<T, TRest>;
  }
  
  /**
   * Safely parse and validate a tuple value
   */
  safeParse(value: unknown): ParseResult<TupleOutput<T, TRest>> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: createTupleError((error as Error).message) };
    }
  }

  override encode(value: TupleOutput<T, TRest>): unknown {
    if (!Array.isArray(value)) {
      throw new Error(this.errorMessage || getMessages().invalidTuple);
    }
    this.validateEncodedLength(value.length);
    const result = new Array<unknown>(value.length);
    for (let i = 0; i < this._length; i++) {
      result[i] = this.validators[i]!.encode(value[i]);
    }
    if (this.restValidator) {
      for (let i = this._length; i < value.length; i++) {
        result[i] = this.restValidator.encode(value[i]);
      }
    }
    return result;
  }

  override safeEncode(
    value: TupleOutput<T, TRest>
  ): ParseResult<unknown> {
    try {
      return { success: true, data: this.encode(value) };
    } catch (error) {
      return { success: false, error: createTupleError((error as Error).message) };
    }
  }

  override async encodeAsync(
    value: TupleOutput<T, TRest>
  ): Promise<unknown> {
    if (!Array.isArray(value)) {
      throw new Error(this.errorMessage || getMessages().invalidTuple);
    }
    this.validateEncodedLength(value.length);
    const result = new Array<unknown>(value.length);
    for (let i = 0; i < this._length; i++) {
      result[i] = await this.validators[i]!.encodeAsync(value[i]);
    }
    if (this.restValidator) {
      for (let i = this._length; i < value.length; i++) {
        result[i] = await this.restValidator.encodeAsync(value[i]);
      }
    }
    return result;
  }

  override async safeEncodeAsync(
    value: TupleOutput<T, TRest>
  ): Promise<ParseResult<unknown>> {
    try {
      return { success: true, data: await this.encodeAsync(value) };
    } catch (error) {
      return { success: false, error: createTupleError((error as Error).message) };
    }
  }

  private validateEncodedLength(length: number): void {
    if (
      (this.restValidator === null && length !== this._length) ||
      (this.restValidator !== null && length < this._length)
    ) {
      throw new Error(this.errorMessage || getMessages().tupleLength(this._length, length));
    }
  }
}
