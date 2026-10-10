import { VldBase, ParseResult, VLD_VALIDATOR_TYPES, isAsyncRequiredError } from './base';
import type { VldOptional, VldExactOptional, VldNullish } from './base';
import type { VldOptionalV2, VldNullishV2 } from './wrapper-v2';
import { getMessages } from '../locales/runtime';
import { VldError, stringifyForMessage, nestIssues, createInvalidTypeIssue, getTypeName, type VldIssue } from '../errors-core';

/**
 * Zod's optin / optout ladder for one tuple item: `optin` says whether an omitted slot is
 * acceptable ('optional' supplies nothing, 'defaulted' supplies a value), `optout` whether
 * the item may produce `undefined` for an omitted slot.
 */
export interface ItemShape {
  optin: 'optional' | 'defaulted' | undefined;
  optout: boolean;
}

const NO_SHAPE: ItemShape = { optin: undefined, optout: false };

export function itemShape(node: any, staticInput = false): ItemShape {
  // Wrappers form an acyclic chain (schemas are immutable); lazy schemas are not resolved.
  // staticInput: the declared input type (JSON Schema), which looks through catch like Zod's inputOptin.
  // V1 wrappers keep the wrapped schema in baseValidator, V2 wrappers in __def.inner.
  const inner = (): ItemShape => itemShape(node.baseValidator ?? node.__def.inner, staticInput);
  switch (node.validatorType) {
    case VLD_VALIDATOR_TYPES.DEFAULT:
    case VLD_VALIDATOR_TYPES.PREFAULT:
      return { optin: 'defaulted', optout: false };
    case VLD_VALIDATOR_TYPES.OPTIONAL:
    case VLD_VALIDATOR_TYPES.EXACT_OPTIONAL:
    case VLD_VALIDATOR_TYPES.NULLISH:
      return { optin: inner().optin === 'defaulted' ? 'defaulted' : 'optional', optout: true };
    case VLD_VALIDATOR_TYPES.CATCH:
      return staticInput ? inner() : { optin: inner().optin === 'defaulted' ? 'defaulted' : 'optional', optout: inner().optout };
    case VLD_VALIDATOR_TYPES.TRANSFORM:
      return { optin: inner().optin, optout: false };
    case VLD_VALIDATOR_TYPES.NULLABLE:
    case VLD_VALIDATOR_TYPES.READONLY:
    case VLD_VALIDATOR_TYPES.META:
    case VLD_VALIDATOR_TYPES.BRAND:
    case VLD_VALIDATOR_TYPES.REFINE:
      return inner();
    case VLD_VALIDATOR_TYPES.SUPER_REFINE:
      return itemShape(node._inner, staticInput);
    case VLD_VALIDATOR_TYPES.PIPE:
      return { optin: itemShape(node.first, staticInput).optin, optout: itemShape(node.second, staticInput).optout };
    case VLD_VALIDATOR_TYPES.UNION: {
      const options: ItemShape[] = (node.validators ?? node.__def.validators).map((option: unknown) => itemShape(option, staticInput));
      return {
        optin: options.some(option => option.optin === 'defaulted')
          ? 'defaulted'
          : options.some(option => option.optin !== undefined) ? 'optional' : undefined,
        optout: options.some(option => option.optout)
      };
    }
    default:
      return NO_SHAPE;
  }
}

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

type ItemOutput<S extends VldBase<any, any>> = ReturnType<S['parse']>;

/** A trailing optional / nullish item may be omitted (Zod's optout); `undefined`, `any` and union-with-undefined items may not. */
type OmittableItem<S extends VldBase<any, any>> = S extends
  | VldOptional<any, any>
  | VldExactOptional<any, any>
  | VldNullish<any, any>
  | VldOptionalV2<any, any>
  | VldNullishV2<any, any>
  ? true
  : false;

type FixedTupleOutput<T extends readonly VldBase<any, any>[], TrailingOptional extends boolean = true> =
  T extends readonly [...infer Head extends readonly VldBase<any, any>[], infer Last extends VldBase<any, any>]
    ? TrailingOptional extends true
      ? OmittableItem<Last> extends true
        ? [...FixedTupleOutput<Head, true>, ItemOutput<Last>?]
        : [...FixedTupleOutput<Head, false>, ItemOutput<Last>]
      : [...FixedTupleOutput<Head, false>, ItemOutput<Last>]
    : T extends readonly []
      ? []
      : { -readonly [K in keyof T]: ItemOutput<T[K]> };

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
  /** Required prefix length: trailing optional items may be omitted (Zod). */
  private readonly _minLength: number;
  /** First index of the trailing run of items that may produce `undefined` for an omitted slot. */
  private readonly _optoutStart: number;
  private readonly _shapes: ItemShape[];
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
    this._shapes = validators.map(validator => itemShape(validator));
    let minLength = validators.length;
    while (minLength > 0 && this._shapes[minLength - 1]!.optin !== undefined) {
      minLength--;
    }
    this._minLength = minLength;
    let optoutStart = validators.length;
    while (optoutStart > 0 && this._shapes[optoutStart - 1]!.optout) {
      optoutStart--;
    }
    this._optoutStart = optoutStart;
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
        // The fast path compares with ===, which never matches NaN; the generic literal check does (SameValueZero).
        return Number.isNaN((validator as any).literal) ? undefined : 'literal';
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
        return getMessages().literalExpected(stringifyForMessage(expected), stringifyForMessage(received));
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
      throw new VldError([createInvalidTypeIssue('tuple', getTypeName(value), this.errorMessage || getMessages().invalidTuple)]);
    }

    return this.parseKnownTuple(value);
  }

  /** Zod: a wrong arity is too_small (below the required items) or too_big. */
  private lengthError(length: number): VldError {
    const message = this.errorMessage || getMessages().tupleLength(this._length, length);
    return new VldError([length < this._minLength
      ? { code: 'too_small', path: [], origin: 'array', minimum: this._minLength, inclusive: true, message }
      : { code: 'too_big', path: [], origin: 'array', maximum: this._length, inclusive: true, message }]);
  }

  /**
   * Parse a value that has already passed the tuple array type guard.
   * @internal Used by object validators to avoid duplicate hot-path checks.
   */
  parseKnownTuple(value: unknown[]): TupleOutput<T, TRest> {
    if (this.isInvalidParseLength(value.length)) {
      throw this.lengthError(value.length);
    }

    const result = new Array(value.length);
    // Omitted trailing optional items stay omitted.
    const itemCount = Math.min(this._length, value.length);
    for (let i = 0; i < itemCount; i++) {
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
            if (typeof item !== 'number' || !Number.isFinite(item)) {
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

    for (let i = value.length; i < this._length; i++) {
      if (this.truncatesAt(i)) {
        result.length = i;
        break;
      }
      const item = this.validators[i]!.safeParse(undefined);
      if (!item.success) {
        if (isAsyncRequiredError(item.error)) throw item.error;
        if (i >= this._optoutStart) {
          result.length = i;
          break;
        }
        throw new Error(getMessages().arrayItem(i, item.error.message));
      }
      result[i] = item.data;
    }
    this.trimOmittedTail(result, value.length);

    return result as TupleOutput<T, TRest>;
  }

  /** Zod: an omitted optional item in the optional-out tail ends the output there. */
  private truncatesAt(index: number): boolean {
    return index >= this._optoutStart && this._shapes[index]!.optin === 'optional';
  }

  /** Zod: omitted trailing slots that produced `undefined` are not part of the output. */
  private trimOmittedTail(result: unknown[], inputLength: number): void {
    for (let i = result.length - 1; i >= inputLength; i--) {
      if (this._shapes[i]!.optout && result[i] === undefined) {
        result.length = i;
      } else {
        break;
      }
    }
  }

  /**
   * Safely parse and validate a tuple value
   */
  safeParse(value: unknown): ParseResult<TupleOutput<T, TRest>> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error instanceof VldError ? error : createTupleError((error as Error).message) };
    }
  }

  /** Async parse: each position (and rest item) goes through parseAsync. */
  override async parseAsync(value: unknown): Promise<TupleOutput<T, TRest>> {
    if (!Array.isArray(value) || this.isInvalidParseLength(value.length)) {
      return this.parse(value);
    }
    const result = new Array(value.length);
    const issues: VldIssue[] = [];
    const itemCount = Math.min(this._length, value.length);
    for (let i = 0; i < value.length; i++) {
      const validator = i < itemCount ? this.validators[i]! : this.restValidator!;
      const item = await validator.safeParseAsync(value[i]);
      if (item.success) result[i] = item.data;
      else issues.push(...nestIssues(item.error, i, message => getMessages().arrayItem(i, message)));
    }
    for (let i = value.length; i < this._length; i++) {
      if (this.truncatesAt(i)) {
        result.length = i;
        break;
      }
      const item = await this.validators[i]!.safeParseAsync(undefined);
      if (!item.success) {
        if (i >= this._optoutStart) {
          result.length = i;
          break;
        }
        issues.push(...nestIssues(item.error, i, message => getMessages().arrayItem(i, message)));
      } else {
        result[i] = item.data;
      }
    }
    if (issues.length > 0) throw new VldError(issues);
    this.trimOmittedTail(result, value.length);
    return result as TupleOutput<T, TRest>;
  }

  override encode(value: TupleOutput<T, TRest>): unknown {
    if (!Array.isArray(value)) {
      throw new Error(this.errorMessage || getMessages().invalidTuple);
    }
    this.validateEncodedLength(value.length);
    const result = new Array<unknown>(value.length);
    for (let i = 0; i < Math.min(this._length, value.length); i++) {
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
    for (let i = 0; i < Math.min(this._length, value.length); i++) {
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
    if (this.isInvalidLength(length)) {
      throw new Error(this.errorMessage || getMessages().tupleLength(this._length, length));
    }
  }

  /** With a rest schema Zod performs no arity check on parse: omitted fixed items are run with undefined instead. */
  private isInvalidParseLength(length: number): boolean {
    return this.restValidator === null && this.isInvalidLength(length);
  }

  private isInvalidLength(length: number): boolean {
    return length < this._minLength || (this.restValidator === null && length > this._length);
  }
}
