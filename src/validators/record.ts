import { VldBase, ParseResult, VLD_VALIDATOR_TYPES } from './base';
import { getMessages } from '../locales/runtime';
import { isDangerousKey } from '../utils/security';
import { VldError } from '../errors-core';

type SimpleRecordValueMode =
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

function createRecordError(message: string): VldError {
  return new VldError([{ code: 'invalid_object', path: [], message }]);
}

/**
 * Immutable record validator for key-value pairs
 * BUG-NEW-018 FIX: Uses comprehensive dangerous key protection
 */
export class VldRecord<T> extends VldBase<unknown, Record<string, T>> {
  /**
   * Private constructor to enforce immutability
   */
  protected constructor(
    protected readonly valueValidator: VldBase<unknown, T>,
    private readonly errorMessage?: string
  ) {
    super(VLD_VALIDATOR_TYPES.RECORD);
    this._simpleValueMode = this.getSimpleValueMode(valueValidator);
    this._simpleValue = this._simpleValueMode === 'literal' ? (valueValidator as any).literal : undefined;
  }

  private readonly _simpleValueMode: SimpleRecordValueMode;
  private readonly _simpleValue: unknown;

  get valueSchema(): VldBase<unknown, T> {
    return this.valueValidator;
  }
  
  /**
   * Create a new record validator
   */
  static create<T>(valueValidator: VldBase<unknown, T>): VldRecord<T> {
    return new VldRecord(valueValidator);
  }

  private getSimpleValueMode(valueValidator: VldBase<unknown, T>): SimpleRecordValueMode {
    if ((valueValidator as any).isSimple !== true) {
      return undefined;
    }

    switch (valueValidator.validatorType) {
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

  private getSimpleValueError(received: unknown): string {
    switch (this._simpleValueMode) {
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
        return getMessages().literalExpected(JSON.stringify(this._simpleValue), JSON.stringify(received));
      default:
        return getMessages().invalidRecord;
    }
  }
  
  /**
   * Parse and validate a record value
   * BUG-NEW-018 FIX: Use comprehensive dangerous key protection
   */
  parse(value: unknown): Record<string, T> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new Error(this.errorMessage || getMessages().invalidRecord);
    }

    return this.parseKnownRecord(value as Record<string, unknown>);
  }

  /**
   * Parse a value that has already passed the record object type guard.
   * @internal Used by object validators to avoid duplicate hot-path checks.
   */
  parseKnownRecord(obj: Record<string, unknown>): Record<string, T> {
    const result: Record<string, T> = {};
    const keys = Object.keys(obj);
    const simpleMode = this._simpleValueMode;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]!;

      // Skip dangerous keys to prevent prototype pollution
      // Now using comprehensive protection from shared utility
      if (isDangerousKey(key)) {
        continue;
      }

      const val = obj[key];
      if (simpleMode !== undefined) {
        switch (simpleMode) {
          case 'string':
            if (typeof val !== 'string') {
              throw new Error(getMessages().objectField(key, getMessages().invalidString));
            }
            result[key] = val as T;
            continue;
          case 'number':
            if (typeof val !== 'number' || isNaN(val)) {
              throw new Error(getMessages().objectField(key, getMessages().invalidNumber));
            }
            result[key] = val as T;
            continue;
          case 'boolean':
            if (typeof val !== 'boolean') {
              throw new Error(getMessages().objectField(key, getMessages().invalidBoolean));
            }
            result[key] = val as T;
            continue;
          case 'bigint':
            if (typeof val !== 'bigint') {
              throw new Error(getMessages().objectField(key, getMessages().invalidBigint));
            }
            result[key] = val as T;
            continue;
          case 'symbol':
            if (typeof val !== 'symbol') {
              throw new Error(getMessages().objectField(key, getMessages().invalidSymbol));
            }
            result[key] = val as T;
            continue;
          case 'null':
            if (val !== null) {
              throw new Error(getMessages().objectField(key, this.getSimpleValueError(val)));
            }
            result[key] = null as T;
            continue;
          case 'undefinedValue':
            if (val !== undefined) {
              throw new Error(getMessages().objectField(key, getMessages().expectedUndefined));
            }
            result[key] = undefined as T;
            continue;
          case 'literal':
            if (val !== this._simpleValue) {
              throw new Error(getMessages().objectField(key, this.getSimpleValueError(val)));
            }
            result[key] = this._simpleValue as T;
            continue;
          case 'passthrough':
            result[key] = val as T;
            continue;
        }
      }

      try {
        result[key] = this.valueValidator.parse(val);
      } catch (error) {
        throw new Error(getMessages().objectField(key, (error as Error).message));
      }
    }

    return result;
  }
  
  /**
   * Safely parse and validate a record value
   */
  safeParse(value: unknown): ParseResult<Record<string, T>> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: createRecordError((error as Error).message) };
    }
  }

  /**
   * Create a partial record variant (all keys optional)
   * Similar to v.object().partial() but for records
   */
  partial(): VldRecord<T | undefined> {
    const optionalValidator = this.valueValidator.optional();
    return new VldRecord(optionalValidator);
  }

  /**
   * Create a loose record variant (allows extra keys)
   * Similar to v.object().passthrough() but for records
   * Note: Records already allow any keys, so this mainly affects error handling
   */
  loose(): VldBase<unknown, Record<string, T>> {
    // For records, "loose" means we don't throw errors for validation failures
    // We return a modified version that catches validation errors
    return new VldLooseRecord(this.valueValidator);
  }
}

/**
 * Loose record variant that allows validation failures
 * Used internally by .loose() method
 */
class VldLooseRecord<T> extends VldBase<unknown, Record<string, T>> {
  constructor(private readonly valueValidator: VldBase<unknown, T>) {
    super(VLD_VALIDATOR_TYPES.RECORD);
  }

  get valueSchema(): VldBase<unknown, T> {
    return this.valueValidator;
  }

  parse(value: unknown): Record<string, T> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new Error(getMessages().invalidRecord);
    }

    const result: Record<string, T> = {} as Record<string, T>;
    const obj = value as Record<string, unknown>;

    for (const [key, val] of Object.entries(obj)) {
      // Skip dangerous keys
      if (isDangerousKey(key)) {
        continue;
      }

      // For loose records, skip invalid values instead of throwing
      const parseResult = this.valueValidator.safeParse(val);
      if (parseResult.success) {
        result[key] = parseResult.data;
      }
    }

    return result;
  }

  safeParse(value: unknown): ParseResult<Record<string, T>> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: createRecordError((error as Error).message) };
    }
  }

  /**
   * Create a partial variant (all keys optional)
   */
  partial(): VldLooseRecord<T | undefined> {
    const optionalValidator = this.valueValidator.optional();
    return new VldLooseRecord(optionalValidator);
  }

  /**
   * Return self (already loose)
   */
  loose(): VldLooseRecord<T> {
    return this;
  }
}
