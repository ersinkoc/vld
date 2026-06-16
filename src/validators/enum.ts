import { VldBase, ParseResult, VLD_VALIDATOR_TYPES } from './base';
import { getMessages } from '../locales/runtime';

/**
 * Immutable enum validator for string and number enum values
 */
type EnumValue = string | number;

export class VldEnum<T extends readonly [EnumValue, ...EnumValue[]]> extends VldBase<EnumValue, T[number]> {
  private readonly _valueSet: ReadonlySet<EnumValue> | undefined;

  /**
   * Private constructor to enforce immutability
   */
  private constructor(
    private readonly _values: T,
    private readonly errorMessage?: string
  ) {
    super(VLD_VALIDATOR_TYPES.ENUM);
    this._valueSet = _values.length > 6 ? new Set(_values) : undefined;
  }

  private createError(value: unknown): Error {
    return new Error(
      this.errorMessage ||
      getMessages().enumExpected([...this._values], JSON.stringify(value))
    );
  }

  /**
   * Get the enum values
   */
  get values(): T {
    return this._values;
  }
  
  /**
   * Create a new enum validator
   */
  static create<T extends readonly [EnumValue, ...EnumValue[]]>(values: T): VldEnum<T> {
    return new VldEnum(values);
  }
  
  /**
   * Parse and validate an enum value
   */
  parse(value: unknown): T[number] {
    // BUG-002 FIX: Add type check before includes() to prevent type confusion
    if (typeof value !== 'string' && typeof value !== 'number') {
      throw this.createError(value);
    }

    const values = this._values;
    switch (values.length) {
      case 1:
        if (value === values[0]) return value as T[number];
        break;
      case 2:
        if (value === values[0] || value === values[1]) return value as T[number];
        break;
      case 3:
        if (value === values[0] || value === values[1] || value === values[2]) return value as T[number];
        break;
      case 4:
        if (value === values[0] || value === values[1] || value === values[2] || value === values[3]) {
          return value as T[number];
        }
        break;
      case 5:
        if (value === values[0] || value === values[1] || value === values[2] || value === values[3] || value === values[4]) {
          return value as T[number];
        }
        break;
      case 6:
        if (value === values[0] || value === values[1] || value === values[2] || value === values[3] || value === values[4] || value === values[5]) {
          return value as T[number];
        }
        break;
      default:
        if (this._valueSet!.has(value)) return value as T[number];
        break;
    }

    throw this.createError(value);
  }

  /**
   * Safely parse and validate an enum value
   */
  safeParse(value: unknown): ParseResult<T[number]> {
    // BUG-002 FIX: Add type check before includes() to prevent type confusion
    if (typeof value !== 'string' && typeof value !== 'number') {
      return {
        success: false,
        error: this.createError(value)
      };
    }

    const values = this._values;
    switch (values.length) {
      case 1:
        if (value === values[0]) return { success: true, data: value as T[number] };
        break;
      case 2:
        if (value === values[0] || value === values[1]) return { success: true, data: value as T[number] };
        break;
      case 3:
        if (value === values[0] || value === values[1] || value === values[2]) return { success: true, data: value as T[number] };
        break;
      case 4:
        if (value === values[0] || value === values[1] || value === values[2] || value === values[3]) {
          return { success: true, data: value as T[number] };
        }
        break;
      case 5:
        if (value === values[0] || value === values[1] || value === values[2] || value === values[3] || value === values[4]) {
          return { success: true, data: value as T[number] };
        }
        break;
      case 6:
        if (value === values[0] || value === values[1] || value === values[2] || value === values[3] || value === values[4] || value === values[5]) {
          return { success: true, data: value as T[number] };
        }
        break;
      default:
        if (this._valueSet!.has(value)) return { success: true, data: value as T[number] };
        break;
    }

    return {
      success: false,
      error: this.createError(value)
    };
  }

  /**
   * Exclude specific values from the enum
   * Creates a new enum validator without the specified values
   */
  exclude<const E extends readonly EnumValue[]>(...excludeValues: E): VldEnum<
    T[number] extends E[number] ? never : T[number] extends Exclude<T[number], E[number]> ? T : Exclude<T, E>
  > {
    const filtered = this._values.filter(v => !excludeValues.includes(v));
    if (filtered.length === 0) {
      throw new Error('Cannot exclude all enum values');
    }
    // Type assertion needed because TypeScript can't guarantee the filtered array maintains the required type
    return new VldEnum(filtered as any, this.errorMessage);
  }

  /**
   * Extract specific values from the enum
   * Creates a new enum validator with only the specified values
   */
  extract<const E extends readonly EnumValue[]>(...extractValues: E): VldEnum<[E[number], ...E[number][]]> {
    const extracted = this._values.filter(v => extractValues.includes(v));
    if (extracted.length === 0) {
      throw new Error('Cannot extract non-existent enum values');
    }
    // Type assertion needed because TypeScript can't guarantee the extracted array has the required type
    return new VldEnum(extracted as any, this.errorMessage);
  }
}
