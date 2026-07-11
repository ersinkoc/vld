import { VldBase, ParseResult, VldOptional, VLD_VALIDATOR_TYPES } from './base';
import { getMessages } from '../locales/runtime';
import { VldEnum } from './enum';
import { isDangerousKey } from '../utils/security';
import { VldError } from '../errors-core';

type SimpleFieldMode =
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

/**
 * Configuration for object validator
 */
interface ObjectValidatorConfig<T extends Record<string, any>> {
  readonly shape: { readonly [K in keyof T]: VldBase<any, T[K]> };
  readonly strict?: boolean;
  readonly passthrough?: boolean;
  readonly catchall?: VldBase<unknown, any>;
  readonly errorMessage?: string | undefined;
}

/**
 * Optimized immutable object validator with chainable methods
 * Features pre-computed keys and Set-based lookups for better performance
 */
export class VldObject<T extends Record<string, any>> extends VldBase<unknown, T> {
  private readonly _config: ObjectValidatorConfig<T>;
  private readonly _shapeKeys: string[];
  private readonly _shapeKeysSet: Set<string>;
  private readonly _validators: Array<VldBase<unknown, any> | undefined>;
  private readonly _validatorTypes: string[];
  private readonly _simpleFieldModes: SimpleFieldMode[];
  private readonly _simpleFieldValues: unknown[];
  private readonly _canUseSimpleObjectFastPath: boolean;
  private readonly _canUseSafeParseFastPath: boolean;

  private createSafeParseError(message: string): VldError {
    return new VldError([{ code: 'invalid_object', path: [], message }]);
  }

  /**
   * Private constructor to enforce immutability
   */
  private constructor(config: ObjectValidatorConfig<T>) {
    super(VLD_VALIDATOR_TYPES.OBJECT);
    this._config = config;
    // Pre-compute shape keys for faster access
    this._shapeKeys = Object.keys(config.shape);
    this._shapeKeysSet = new Set(this._shapeKeys);
    this._validators = this._shapeKeys.map(k => this.tryGetFieldValidator(k));
    // Pre-compute validator types when possible. Getter-based recursive schemas
    // may reference the object being constructed, so unresolved getters fall
    // back to the generic path and are resolved at parse time.
    this._validatorTypes = this._shapeKeys.map((k, i) => this._validators[i]?.validatorType || this.getValidatorType(k));
    this._simpleFieldModes = this._validators.map((validator, i) => this.getSimpleFieldMode(validator, this._validatorTypes[i]!));
    this._simpleFieldValues = this._validators.map((validator, i) =>
      this._simpleFieldModes[i] === 'literal' ? (validator as any).literal : undefined
    );
    this._canUseSimpleObjectFastPath =
      !config.strict &&
      !config.passthrough &&
      !config.catchall &&
      this._shapeKeys.length > 0 &&
      this._simpleFieldModes.every(mode => mode !== undefined);
    this._canUseSafeParseFastPath =
      this._validators.every(validator => validator instanceof VldBase) &&
      (config.catchall === undefined || config.catchall instanceof VldBase);
  }

  private tryGetFieldValidator(key: string): VldBase<unknown, any> | undefined {
    try {
      const descriptor = Object.getOwnPropertyDescriptor(this._config.shape, key);
      if (descriptor?.get) {
        return undefined;
      }
      return this.resolveFieldValidator(key);
    } catch {
      return undefined;
    }
  }

  private resolveFieldValidator(key: string): VldBase<unknown, any> | undefined {
    try {
      const validator = (this._config.shape as any)[key];
      if (!validator || typeof validator.safeParse !== 'function') {
        return undefined;
      }
      return validator;
    } catch {
      return undefined;
    }
  }

  private getFieldValidator(key: string, index?: number): VldBase<unknown, any> {
    const cached = index === undefined ? undefined : this._validators[index];
    const validator = cached || this.resolveFieldValidator(key);
    if (!validator) {
      throw new Error(`Invalid validator for field "${key}"`);
    }
    return validator;
  }

  private getValidatorType(key: string): string {
    try {
      const validator = (this._config.shape as any)[key];
      return validator?.validatorType || VLD_VALIDATOR_TYPES.UNKNOWN;
    } catch {
      return VLD_VALIDATOR_TYPES.UNKNOWN;
    }
  }

  private getSimpleFieldMode(validator: VldBase<unknown, any> | undefined, type: string): SimpleFieldMode {
    if (!validator || (validator as any).isSimple !== true) {
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

  private getSimpleFieldError(mode: SimpleFieldMode, expected?: unknown, received?: unknown): string {
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
      case 'passthrough':
        return getMessages().invalidObject;
      default:
        return getMessages().invalidObject;
    }
  }

  private parseCheckedField(
    validator: VldBase<unknown, any>,
    type: string,
    value: unknown
  ): unknown {
    if (type === VLD_VALIDATOR_TYPES.STRING && typeof value === 'string') {
      const parseKnownString = (validator as any).parseKnownString;
      if (typeof parseKnownString === 'function') {
        return parseKnownString.call(validator, value);
      }
    }

    if (type === VLD_VALIDATOR_TYPES.NUMBER && typeof value === 'number' && !isNaN(value)) {
      const parseKnownNumber = (validator as any).parseKnownNumber;
      if (typeof parseKnownNumber === 'function') {
        return parseKnownNumber.call(validator, value);
      }
    }

    if (type === VLD_VALIDATOR_TYPES.BOOLEAN && typeof value === 'boolean') {
      const parseKnownBoolean = (validator as any).parseKnownBoolean;
      if (typeof parseKnownBoolean === 'function') {
        return parseKnownBoolean.call(validator, value);
      }
    }

    if (type === VLD_VALIDATOR_TYPES.BIGINT && typeof value === 'bigint') {
      const parseKnownBigInt = (validator as any).parseKnownBigInt;
      if (typeof parseKnownBigInt === 'function') {
        return parseKnownBigInt.call(validator, value);
      }
    }

    if (type === VLD_VALIDATOR_TYPES.SYMBOL && typeof value === 'symbol') {
      const parseKnownSymbol = (validator as any).parseKnownSymbol;
      if (typeof parseKnownSymbol === 'function') {
        return parseKnownSymbol.call(validator, value);
      }
    }

    if (type === VLD_VALIDATOR_TYPES.FUNCTION && typeof value === 'function') {
      const parseKnownFunction = (validator as any).parseKnownFunction;
      if (typeof parseKnownFunction === 'function') {
        return parseKnownFunction.call(validator, value);
      }
    }

    if (
      type === VLD_VALIDATOR_TYPES.FILE &&
      typeof value === 'object' &&
      value !== null &&
      (
        ('size' in value && 'type' in value) ||
        (typeof File !== 'undefined' && value instanceof File)
      )
    ) {
      const parseKnownFile = (validator as any).parseKnownFile;
      if (typeof parseKnownFile === 'function') {
        return parseKnownFile.call(validator, value);
      }
    }

    if (type === VLD_VALIDATOR_TYPES.DATE && value instanceof Date) {
      const parseKnownDate = (validator as any).parseKnownDate;
      if (typeof parseKnownDate === 'function') {
        return parseKnownDate.call(validator, value);
      }
    }

    if (
      type === VLD_VALIDATOR_TYPES.OBJECT &&
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value)
    ) {
      const parseKnownObject = (validator as any).parseKnownObject;
      if (typeof parseKnownObject === 'function') {
        return parseKnownObject.call(validator, value);
      }
    }

    if (type === VLD_VALIDATOR_TYPES.ARRAY && Array.isArray(value)) {
      const parseKnownArray = (validator as any).parseKnownArray;
      if (typeof parseKnownArray === 'function') {
        return parseKnownArray.call(validator, value);
      }
    }

    if (type === VLD_VALIDATOR_TYPES.TUPLE && Array.isArray(value)) {
      const parseKnownTuple = (validator as any).parseKnownTuple;
      if (typeof parseKnownTuple === 'function') {
        return parseKnownTuple.call(validator, value);
      }
    }

    if (
      type === VLD_VALIDATOR_TYPES.RECORD &&
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value)
    ) {
      const parseKnownRecord = (validator as any).parseKnownRecord;
      if (typeof parseKnownRecord === 'function') {
        return parseKnownRecord.call(validator, value);
      }
    }

    if (type === VLD_VALIDATOR_TYPES.SET && value instanceof Set) {
      const parseKnownSet = (validator as any).parseKnownSet;
      if (typeof parseKnownSet === 'function') {
        return parseKnownSet.call(validator, value);
      }
    }

    if (type === VLD_VALIDATOR_TYPES.MAP && value instanceof Map) {
      const parseKnownMap = (validator as any).parseKnownMap;
      if (typeof parseKnownMap === 'function') {
        return parseKnownMap.call(validator, value);
      }
    }

    return validator.parse(value);
  }

  private parseSimpleObjectValue(
    obj: Record<string, unknown>,
    trustedKey?: string,
    skipTrustedLiteralCheck = false
  ): T {
    if (
      this._shapeKeys.length === 2 &&
      this._simpleFieldModes[0] === 'string' &&
      this._simpleFieldModes[1] === 'number'
    ) {
      const key0 = this._shapeKeys[0]!;
      const value0 = obj[key0];
      if (typeof value0 !== 'string') {
        throw new Error(getMessages().objectField(key0, getMessages().invalidString));
      }

      const key1 = this._shapeKeys[1]!;
      const value1 = obj[key1];
      if (typeof value1 !== 'number' || isNaN(value1)) {
        throw new Error(getMessages().objectField(key1, getMessages().invalidNumber));
      }

      const result: any = {};
      result[key0] = value0;
      result[key1] = value1;
      return result as T;
    }

    if (
      this._shapeKeys.length === 3 &&
      this._simpleFieldModes[0] === 'literal' &&
      this._simpleFieldModes[1] === 'string' &&
      this._simpleFieldModes[2] === 'number'
    ) {
      const key0 = this._shapeKeys[0]!;
      const value0 = obj[key0];
      const literal0 = this._simpleFieldValues[0];
      if (!(skipTrustedLiteralCheck && key0 === trustedKey) && value0 !== literal0) {
        throw new Error(getMessages().objectField(
          key0,
          this.getSimpleFieldError('literal', literal0, value0)
        ));
      }

      const key1 = this._shapeKeys[1]!;
      const value1 = obj[key1];
      if (typeof value1 !== 'string') {
        throw new Error(getMessages().objectField(key1, getMessages().invalidString));
      }

      const key2 = this._shapeKeys[2]!;
      const value2 = obj[key2];
      if (typeof value2 !== 'number' || isNaN(value2)) {
        throw new Error(getMessages().objectField(key2, getMessages().invalidNumber));
      }

      const result: any = {};
      result[key0] = literal0;
      result[key1] = value1;
      result[key2] = value2;
      return result as T;
    }

    const result: any = {};

    for (let i = 0; i < this._shapeKeys.length; i++) {
      const key = this._shapeKeys[i]!;
      const fieldValue = obj[key];
      const simpleMode = this._simpleFieldModes[i];

      switch (simpleMode) {
        case 'string':
          if (typeof fieldValue !== 'string') {
            throw new Error(getMessages().objectField(key, getMessages().invalidString));
          }
          result[key] = fieldValue;
          break;
        case 'number':
          if (typeof fieldValue !== 'number' || isNaN(fieldValue)) {
            throw new Error(getMessages().objectField(key, getMessages().invalidNumber));
          }
          result[key] = fieldValue;
          break;
        case 'boolean':
          if (typeof fieldValue !== 'boolean') {
            throw new Error(getMessages().objectField(key, getMessages().invalidBoolean));
          }
          result[key] = fieldValue;
          break;
        case 'bigint':
          if (typeof fieldValue !== 'bigint') {
            throw new Error(getMessages().objectField(key, getMessages().invalidBigint));
          }
          result[key] = fieldValue;
          break;
        case 'symbol':
          if (typeof fieldValue !== 'symbol') {
            throw new Error(getMessages().objectField(key, getMessages().invalidSymbol));
          }
          result[key] = fieldValue;
          break;
        case 'null':
          if (fieldValue !== null) {
            throw new Error(getMessages().objectField(key, this.getSimpleFieldError(simpleMode, undefined, fieldValue)));
          }
          result[key] = null;
          break;
        case 'undefinedValue':
          if (fieldValue !== undefined) {
            throw new Error(getMessages().objectField(key, getMessages().expectedUndefined));
          }
          result[key] = undefined;
          break;
        case 'literal':
          if (skipTrustedLiteralCheck && key === trustedKey) {
            result[key] = this._simpleFieldValues[i];
            break;
          }
          if (fieldValue !== this._simpleFieldValues[i]) {
            throw new Error(getMessages().objectField(
              key,
              this.getSimpleFieldError(simpleMode, this._simpleFieldValues[i], fieldValue)
            ));
          }
          result[key] = this._simpleFieldValues[i];
          break;
        case 'passthrough':
          result[key] = fieldValue;
          break;
        default:
          throw new Error(getMessages().objectField(key, getMessages().invalidObject));
      }
    }

    return result as T;
  }

  /**
   * Get the validator configuration
   * @internal Used by discriminated union validator
   */
  get config(): ObjectValidatorConfig<T> {
    return this._config;
  }

  /**
   * Get the shape keys array
   */
  get shapeKeys(): string[] {
    return this._shapeKeys;
  }

  /**
   * Get the shape keys set for O(1) lookups
   * @internal Used by discriminated union validator
   */
  get shapeKeysSet(): Set<string> {
    return this._shapeKeysSet;
  }
  
  /**
   * Create a new object validator
   */
  static create<T extends Record<string, any>>(
    shape: { [K in keyof T]: VldBase<any, T[K]> }
  ): VldObject<T> {
    return new VldObject({ shape });
  }
  
  /**
   * Parse and validate an object value
   * Ultra-optimized with inline type checks and minimal overhead
   */
  parse(value: unknown): T {
    // Fast type check
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new Error(this._config.errorMessage || getMessages().invalidObject);
    }

    return this.parseObjectValue(value as Record<string, unknown>);
  }

  /**
   * Parse an object value that already passed the object type guard.
   * @internal Used by discriminated unions after discriminator lookup.
   */
  parseKnownObject(value: Record<string, unknown>, trustedKey?: string): T {
    return this.parseObjectValue(value, trustedKey);
  }

  /**
   * Parse an object after an owning discriminated union has already matched
   * the discriminator value to this exact object schema.
   * @internal
   */
  parseTrustedKnownObject(value: Record<string, unknown>, trustedKey: string): T {
    return this.parseObjectValue(value, trustedKey, true);
  }

  private parseObjectValue(
    obj: Record<string, unknown>,
    trustedKey?: string,
    skipTrustedLiteralCheck = false
  ): T {
    if (this._canUseSimpleObjectFastPath) {
      return this.parseSimpleObjectValue(obj, trustedKey, skipTrustedLiteralCheck);
    }

    const result: any = {};

    // Validate fields directly on parse() to avoid safeParse result allocation
    // in the successful hot path.
    let currentKey = '';
    try {
      for (let i = 0; i < this._shapeKeys.length; i++) {
        currentKey = this._shapeKeys[i]!;
        if (
          skipTrustedLiteralCheck &&
          currentKey === trustedKey &&
          this._simpleFieldModes[i] === 'literal'
        ) {
          result[currentKey] = this._simpleFieldValues[i];
          continue;
        }

        const simpleMode = this._simpleFieldModes[i];
        if (simpleMode !== undefined) {
          const fieldValue = obj[currentKey];
          switch (simpleMode) {
            case 'string':
              if (typeof fieldValue !== 'string') {
                throw new Error(getMessages().invalidString);
              }
              result[currentKey] = fieldValue;
              continue;
            case 'number':
              if (typeof fieldValue !== 'number' || isNaN(fieldValue)) {
                throw new Error(getMessages().invalidNumber);
              }
              result[currentKey] = fieldValue;
              continue;
            case 'boolean':
              if (typeof fieldValue !== 'boolean') {
                throw new Error(getMessages().invalidBoolean);
              }
              result[currentKey] = fieldValue;
              continue;
            case 'bigint':
              if (typeof fieldValue !== 'bigint') {
                throw new Error(getMessages().invalidBigint);
              }
              result[currentKey] = fieldValue;
              continue;
            case 'symbol':
              if (typeof fieldValue !== 'symbol') {
                throw new Error(getMessages().invalidSymbol);
              }
              result[currentKey] = fieldValue;
              continue;
            case 'null':
              if (fieldValue !== null) {
                throw new Error(this.getSimpleFieldError(simpleMode, undefined, fieldValue));
              }
              result[currentKey] = null;
              continue;
            case 'undefinedValue':
              if (fieldValue !== undefined) {
                throw new Error(getMessages().expectedUndefined);
              }
              result[currentKey] = undefined;
              continue;
            case 'literal':
              if (fieldValue !== this._simpleFieldValues[i]) {
                throw new Error(this.getSimpleFieldError(simpleMode, this._simpleFieldValues[i], fieldValue));
              }
              result[currentKey] = this._simpleFieldValues[i];
              continue;
            case 'passthrough':
              result[currentKey] = fieldValue;
              continue;
          }
          continue;
        }

        const validator = this.getFieldValidator(currentKey, i);
        result[currentKey] = this.parseCheckedField(validator, this._validatorTypes[i]!, obj[currentKey]);
      }
    } catch (error) {
      throw new Error(getMessages().objectField(currentKey, (error as Error).message));
    }

    // Handle strict/passthrough/catchall modes - optimized single Object.keys() call
    if (this._config.strict || this._config.passthrough || this._config.catchall) {
      const objKeys = Object.keys(obj);

      // Handle strict mode - optimized with Set
      if (this._config.strict) {
        const extraKeys: string[] = [];

        for (let i = 0; i < objKeys.length; i++) {
          const key = objKeys[i]!;
          if (!this._shapeKeysSet.has(key)) {
            extraKeys.push(key);
          }
        }

        if (extraKeys.length > 0) {
          throw new Error(getMessages().unexpectedKeys(extraKeys));
        }
      }

      // Handle passthrough mode - optimized with comprehensive prototype pollution protection
      if (this._config.passthrough) {
        for (let i = 0; i < objKeys.length; i++) {
          const key = objKeys[i]!;
          // Skip dangerous keys to prevent prototype pollution
          if (!this._shapeKeysSet.has(key) && !isDangerousKey(key)) {
            result[key] = obj[key];
          }
        }
      }

      // Handle catchall - validate extra keys with catchall validator
      if (this._config.catchall) {
        for (let i = 0; i < objKeys.length; i++) {
          const key = objKeys[i]!;
          // Skip keys already in shape and dangerous keys
          if (!this._shapeKeysSet.has(key) && !isDangerousKey(key)) {
            try {
              result[key] = this._config.catchall.parse(obj[key]);
            } catch (error) {
              throw new Error(getMessages().objectField(key, (error as Error).message));
            }
          }
        }
      }
    }

    return result as T;
  }
  
  /**
   * Safely parse and validate an object value
   * Optimized version using pre-computed keys
   */
  safeParse(value: unknown): ParseResult<T> {
    // Fast type check
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return {
        success: false,
        error: this.createSafeParseError(this._config.errorMessage || getMessages().invalidObject)
      };
    }

    const obj = value as Record<string, unknown>;
    if (this._canUseSimpleObjectFastPath) {
      try {
        return { success: true, data: this.parseSimpleObjectValue(obj) };
      } catch (error) {
        return { success: false, error: this.createSafeParseError((error as Error).message) };
      }
    }

    if (this._canUseSafeParseFastPath) {
      try {
        return { success: true, data: this.parseObjectValue(obj) };
      } catch (error) {
        return { success: false, error: this.createSafeParseError((error as Error).message) };
      }
    }

    const result: any = {};

    // Ultra-optimized field validation - use pre-computed validatorTypes in hot path
    for (let i = 0; i < this._shapeKeys.length; i++) {
      const key = this._shapeKeys[i]!;
      const fieldValue = obj[key];
      const simpleMode = this._simpleFieldModes[i];
      if (simpleMode !== undefined) {
        if (
          (simpleMode === 'string' && typeof fieldValue === 'string') ||
          (simpleMode === 'number' && typeof fieldValue === 'number' && !isNaN(fieldValue)) ||
          (simpleMode === 'boolean' && typeof fieldValue === 'boolean') ||
          (simpleMode === 'bigint' && typeof fieldValue === 'bigint') ||
          (simpleMode === 'symbol' && typeof fieldValue === 'symbol') ||
          (simpleMode === 'null' && fieldValue === null) ||
          (simpleMode === 'undefinedValue' && fieldValue === undefined) ||
          (simpleMode === 'literal' && fieldValue === this._simpleFieldValues[i]) ||
          simpleMode === 'passthrough'
        ) {
          result[key] = simpleMode === 'literal'
            ? this._simpleFieldValues[i]
            : simpleMode === 'null'
              ? null
              : fieldValue;
          continue;
        }

        return {
          success: false,
          error: this.createSafeParseError(getMessages().objectField(key, this.getSimpleFieldError(simpleMode, this._simpleFieldValues[i], fieldValue)))
        };
      }

      let validator: VldBase<unknown, any>;
      try {
        validator = this.getFieldValidator(key, i);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          success: false,
          error: this.createSafeParseError(getMessages().objectField(key, message))
        };
      }
      try {
        if (validator instanceof VldBase) {
          result[key] = this.parseCheckedField(validator, this._validatorTypes[i]!, fieldValue);
        } else {
          const parseResult = (validator as any).safeParse(fieldValue);
          if (!parseResult.success) {
            return {
              success: false,
              error: this.createSafeParseError(getMessages().objectField(key, parseResult.error.message))
            };
          }
          result[key] = parseResult.data;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          success: false,
          error: this.createSafeParseError(getMessages().objectField(key, message))
        };
      }
    }

    // Handle strict/passthrough/catchall modes - optimized single Object.keys() call
    if (this._config.strict || this._config.passthrough || this._config.catchall) {
      const objKeys = Object.keys(obj);

      // Handle strict mode
      if (this._config.strict) {
        const extraKeys: string[] = [];

        for (let i = 0; i < objKeys.length; i++) {
          const key = objKeys[i]!;
          if (!this._shapeKeysSet.has(key)) {
            extraKeys.push(key);
          }
        }

        if (extraKeys.length > 0) {
          return {
            success: false,
            error: this.createSafeParseError(getMessages().unexpectedKeys(extraKeys))
          };
        }
      }

      // Handle passthrough mode with comprehensive prototype pollution protection
      if (this._config.passthrough) {
        for (let i = 0; i < objKeys.length; i++) {
          const key = objKeys[i]!;
          // Skip dangerous keys to prevent prototype pollution
          if (!this._shapeKeysSet.has(key) && !isDangerousKey(key)) {
            result[key] = obj[key];
          }
        }
      }

      // Handle catchall - validate extra keys with catchall validator
      if (this._config.catchall) {
        const catchallValidator = this._config.catchall;
        for (let i = 0; i < objKeys.length; i++) {
          const key = objKeys[i]!;
          // Skip keys already in shape and dangerous keys
          if (!this._shapeKeysSet.has(key) && !isDangerousKey(key)) {
            try {
              if (catchallValidator instanceof VldBase) {
                result[key] = catchallValidator.parse(obj[key]);
              } else {
                const catchallResult = (catchallValidator as any).safeParse(obj[key]);
                if (!catchallResult.success) {
                  return {
                    success: false,
                    error: this.createSafeParseError(getMessages().objectField(key, catchallResult.error.message))
                  };
                }
                result[key] = catchallResult.data;
              }
            } catch (error) {
              const message = error instanceof Error ? error.message : String(error);
              return {
                success: false,
                error: this.createSafeParseError(getMessages().objectField(key, message))
              };
            }
          }
        }
      }
    }

    return { success: true, data: result as T };
  }

  override encode(value: T): unknown {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new Error(this._config.errorMessage || getMessages().invalidObject);
    }
    return this.encodeObjectSync(value as Record<string, unknown>);
  }

  override safeEncode(value: T): ParseResult<unknown> {
    try {
      return { success: true, data: this.encode(value) };
    } catch (error) {
      return { success: false, error: this.createSafeParseError((error as Error).message) };
    }
  }

  override async encodeAsync(value: T): Promise<unknown> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new Error(this._config.errorMessage || getMessages().invalidObject);
    }
    return this.encodeObjectAsync(value as Record<string, unknown>);
  }

  override async safeEncodeAsync(value: T): Promise<ParseResult<unknown>> {
    try {
      return { success: true, data: await this.encodeAsync(value) };
    } catch (error) {
      return { success: false, error: this.createSafeParseError((error as Error).message) };
    }
  }

  private encodeObjectSync(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (let i = 0; i < this._shapeKeys.length; i++) {
      const key = this._shapeKeys[i]!;
      const encoded = this.getFieldValidator(key, i).encode(obj[key]);
      if (encoded !== undefined || Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = encoded;
      }
    }
    this.encodeExtraKeysSync(obj, result);
    return result;
  }

  private async encodeObjectAsync(obj: Record<string, unknown>): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = {};
    for (let i = 0; i < this._shapeKeys.length; i++) {
      const key = this._shapeKeys[i]!;
      const encoded = await this.getFieldValidator(key, i).encodeAsync(obj[key]);
      if (encoded !== undefined || Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = encoded;
      }
    }

    const extraKeys = this.getEncodedExtraKeys(obj);
    for (const key of extraKeys) {
      if (isDangerousKey(key)) {
        continue;
      }
      if (this._config.catchall) {
        result[key] = await this._config.catchall.encodeAsync(obj[key]);
      } else if (this._config.passthrough) {
        result[key] = obj[key];
      }
    }
    return result;
  }

  private getEncodedExtraKeys(obj: Record<string, unknown>): string[] {
    const extraKeys = Object.keys(obj).filter(key => !this._shapeKeysSet.has(key));
    if (this._config.strict && extraKeys.length > 0) {
      throw new Error(getMessages().unexpectedKeys(extraKeys));
    }
    return extraKeys;
  }

  private encodeExtraKeysSync(obj: Record<string, unknown>, result: Record<string, unknown>): void {
    for (const key of this.getEncodedExtraKeys(obj)) {
      if (isDangerousKey(key)) {
        continue;
      }
      if (this._config.catchall) {
        result[key] = this._config.catchall.encode(obj[key]);
      } else if (this._config.passthrough) {
        result[key] = obj[key];
      }
    }
  }

  /**
   * Create a new validator in strict mode (no extra keys allowed)
   */
  strict(message?: string): VldObject<T> {
    return new VldObject({
      ...this._config,
      strict: true,
      passthrough: false,
      errorMessage: message
    });
  }
  
  /**
   * Create a new validator in passthrough mode (extra keys are preserved)
   */
  passthrough(): VldObject<T> {
    return new VldObject({
      ...this._config,
      strict: false,
      passthrough: true
    });
  }

  loose(): VldObject<T> {
    return this.passthrough();
  }

  strip(): VldObject<T> {
    const config: ObjectValidatorConfig<T> = {
      ...this._config,
      strict: false,
      passthrough: false
    };
    delete (config as { catchall?: VldBase<unknown, any> }).catchall;
    return new VldObject(config);
  }

  /**
   * Create a new validator with all fields optional
   */
  partial(): VldObject<{ [K in keyof T]?: T[K] }> {
    const partialShape: any = {};
    for (const key in this._config.shape) {
      partialShape[key] = new VldOptional(this._config.shape[key]);
    }
    return new VldObject({
      ...this._config,
      shape: partialShape
    }) as any;
  }

  /**
   * Create a new validator with deep partial (nested objects also partial)
   */
  deepPartial(): VldObject<any> {
    const deepPartialShape: any = {};
    for (const key in this._config.shape) {
      const validator = this._config.shape[key];
      if (validator instanceof VldObject) {
        deepPartialShape[key] = new VldOptional(validator.deepPartial());
      } else {
        deepPartialShape[key] = new VldOptional(validator);
      }
    }
    return new VldObject({
      ...this._config,
      shape: deepPartialShape
    });
  }

  /**
   * Create a new validator with only specified keys
   */
  pick<K extends keyof T>(...keys: K[]): VldObject<Pick<T, K>> {
    const pickedShape: any = {};
    for (const key of keys) {
      if (key in this._config.shape) {
        pickedShape[key] = this._config.shape[key];
      }
    }
    return new VldObject({
      ...this._config,
      shape: pickedShape
    });
  }

  /**
   * Create a new validator without specified keys
   */
  omit<K extends keyof T>(...keys: K[]): VldObject<Omit<T, K>> {
    const omittedShape: any = {};
    const keysToOmit = new Set(keys);
    for (const key in this._config.shape) {
      if (!keysToOmit.has(key as any)) {
        omittedShape[key] = this._config.shape[key];
      }
    }
    return new VldObject({
      ...this._config,
      shape: omittedShape
    });
  }

  /**
   * Create a new validator with additional fields
   */
  extend<U extends Record<string, any>>(
    extension: { [K in keyof U]: VldBase<unknown, U[K]> }
  ): VldObject<T & U> {
    return new VldObject({
      ...this._config,
      shape: { ...this._config.shape, ...extension } as any
    });
  }

  /**
   * Create a new validator by merging with another object validator
   */
  merge<U extends Record<string, any>>(
    other: VldObject<U>
  ): VldObject<T & U> {
    return new VldObject({
      ...this._config,
      shape: { ...this._config.shape, ...other.config.shape } as any
    });
  }

  /**
   * Create a new validator with all fields required (removes optional)
   */
  required(): VldObject<{ [K in keyof T]-?: T[K] }> {
    const requiredShape: any = {};
    for (const key in this._config.shape) {
      const validator = this._config.shape[key];
      // If it's optional, unwrap it
      if (validator instanceof VldOptional) {
        // BUG-001 FIX: Add defensive check for baseValidator property
        const unwrapped = (validator as any).baseValidator;
        if (!unwrapped || typeof unwrapped.parse !== 'function') {
          throw new Error(`Invalid VldOptional structure for field "${key}": missing or invalid baseValidator`);
        }
        requiredShape[key] = unwrapped;
      } else {
        requiredShape[key] = validator;
      }
    }
    return new VldObject({
      ...this._config,
      shape: requiredShape
    }) as any;
  }

  /**
   * Create a new validator with a catchall validator for extra keys
   * Zod 4 API parity - validates unknown keys with provided schema
   */
  catchall<U>(schema: VldBase<unknown, U>): VldObject<any> {
    return new VldObject({
      ...this._config,
      catchall: schema,
      passthrough: false // catchall overrides passthrough
    }) as any;
  }

  /**
   * Access the inner shape schemas
   * Zod 4 API parity - returns the shape object
   */
  get shape(): { readonly [K in keyof T]: VldBase<unknown, T[K]> } {
    return this._config.shape;
  }

  /**
   * Create an enum validator from object keys
   * Zod 4 API parity - creates literal union of keys
   */
  keyof(): VldEnum<[string, ...string[]]> {
    const keys = Object.keys(this._config.shape);
    if (keys.length === 0) {
      throw new Error('Cannot create keyof enum from empty object');
    }
    return VldEnum.create(keys as [string, ...string[]]);
  }

  /**
   * Type-safe extend that throws an error if any key already exists
   * Zod 4 API parity - prevents accidental field override
   * @param extension The extension shape to add
   * @returns A new validator with extended shape
   * @throws {Error} If any extension key already exists in the shape
   * @example
   * const base = v.object({ name: v.string() });
   * const extended = base.safeExtend({ age: v.number() }); // OK
   * const invalid = base.safeExtend({ name: v.number() }); // Throws error
   */
  safeExtend<U extends Record<string, any>>(
    extension: { [K in keyof U]: VldBase<unknown, U[K]> }
  ): VldObject<T & U> {
    // Check for overlapping keys
    const existingKeys = new Set(Object.keys(this._config.shape));
    const extensionKeys = Object.keys(extension);
    const overlappingKeys: string[] = [];

    for (const key of extensionKeys) {
      if (existingKeys.has(key)) {
        overlappingKeys.push(key);
      }
    }

    if (overlappingKeys.length > 0) {
      throw new Error(`safeExtend: ${getMessages().safeExtendOverlap(overlappingKeys)}`);
    }

    return new VldObject({
      ...this._config,
      shape: { ...this._config.shape, ...extension } as any
    });
  }
}
