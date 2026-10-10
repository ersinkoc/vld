import { VldBase, ParseResult, VldOptional, VldExactOptional, VLD_VALIDATOR_TYPES } from './base';
import { getMessages } from '../locales/runtime';
import { VldEnum } from './enum';
import { isDangerousKey } from '../utils/security';
import { VldError, VldIssue, stringifyForMessage, createInvalidTypeIssue, getTypeName } from '../errors-core';
import { isRecordLike } from './record';

/**
 * Assign a shape field onto a parse result. A shape key named "__proto__" must
 * become an own data property instead of invoking the Object.prototype setter,
 * which would silently replace the result's prototype.
 */
function setResultField(result: Record<string, unknown>, key: string, value: unknown): void {
  if (key === '__proto__') {
    Object.defineProperty(result, key, { value, writable: true, enumerable: true, configurable: true });
  } else {
    result[key] = value;
  }
}

/** Field types whose failures are a single issue, so fail-fast parsing loses nothing. */
const LEAF_FIELD_TYPES: ReadonlySet<string> = new Set([
  VLD_VALIDATOR_TYPES.STRING,
  VLD_VALIDATOR_TYPES.NUMBER,
  VLD_VALIDATOR_TYPES.BOOLEAN,
  VLD_VALIDATOR_TYPES.BIGINT,
  VLD_VALIDATOR_TYPES.SYMBOL,
  VLD_VALIDATOR_TYPES.FUNCTION,
  VLD_VALIDATOR_TYPES.FILE,
  VLD_VALIDATOR_TYPES.DATE
]);

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
  private readonly _hasProtoKey: boolean;

  private createSafeParseError(messageOrError: unknown, fieldKey?: string | number): VldError {
    if (messageOrError instanceof VldError) {
      if (fieldKey !== undefined) {
        return new VldError(messageOrError.issues.map(iss => ({
          ...iss,
          path: iss.path ? [fieldKey, ...iss.path] : [fieldKey],
          message: iss.message.startsWith('Invalid field') ? iss.message : getMessages().objectField(String(fieldKey), iss.message)
        })));
      }
      return messageOrError;
    }
    const message = messageOrError instanceof Error ? messageOrError.message : String(messageOrError);
    return new VldError([{
      code: 'invalid_type',
      path: fieldKey !== undefined ? [fieldKey] : [],
      message: fieldKey !== undefined && !message.startsWith('Invalid field') ? getMessages().objectField(String(fieldKey), message) : message
    }]);
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
    this._hasProtoKey = this._shapeKeysSet.has('__proto__');
    this._validators = this._shapeKeys.map(k => this.tryGetFieldValidator(k));
    // Pre-compute validator types when possible. Getter-based recursive schemas
    // may reference the object being constructed, so unresolved getters fall
    // back to the generic path and are resolved at parse time.
    this._validatorTypes = this._shapeKeys.map((k, i) => this._validators[i]?.validatorType || this.getValidatorType(k));
    this._simpleFieldModes = this._validators.map((validator, i) =>
      this._shapeKeys[i] === '__proto__' ? undefined : this.getSimpleFieldMode(validator, this._validatorTypes[i]!)
    );
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
        // The fast path compares with ===, which never matches NaN; the generic literal check does (SameValueZero).
        return Number.isNaN((validator as any).literal) ? undefined : 'literal';
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
        return getMessages().literalExpected(stringifyForMessage(expected), stringifyForMessage(received));
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

    if (type === VLD_VALIDATOR_TYPES.NUMBER && typeof value === 'number' && Number.isFinite(value)) {
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
      isRecordLike(value)
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
      // `x - x !== 0` rejects NaN and +/-Infinity; cheaper than Number.isFinite here.
      if (typeof value1 !== 'number' || value1 - value1 !== 0) {
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
      if (typeof value2 !== 'number' || value2 - value2 !== 0) {
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
          if (typeof fieldValue !== 'number' || !Number.isFinite(fieldValue)) {
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
          if (!Object.prototype.hasOwnProperty.call(obj, key)) {
            throw new VldError([{
              code: 'invalid_type',
              path: [key],
              message: getMessages().objectField(key, getMessages().requiredField(key))
            }]);
          }
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
          if (!Object.prototype.hasOwnProperty.call(obj, key)) {
            throw new VldError([{
              code: 'invalid_type',
              path: [key],
              message: getMessages().objectField(key, getMessages().requiredField(key))
            }]);
          }
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
      throw new VldError([createInvalidTypeIssue('object', getTypeName(value), this._config.errorMessage || getMessages().invalidObject)]);
    }

    try {
      return this.parseObjectValue(value as Record<string, unknown>);
    } catch (error) {
      return this.rethrowWithIssues(value, error);
    }
  }

  /**
   * Parse an object value that already passed the object type guard.
   * @internal Used by discriminated unions after discriminator lookup.
   */
  parseKnownObject(value: Record<string, unknown>, trustedKey?: string): T {
    try {
      return this.parseObjectValue(value, trustedKey);
    } catch (error) {
      return this.rethrowWithIssues(value, error);
    }
  }

  /**
   * Parse an object after an owning discriminated union has already matched
   * the discriminator value to this exact object schema.
   * @internal
   */
  parseTrustedKnownObject(value: Record<string, unknown>, trustedKey: string): T {
    try {
      return this.parseObjectValue(value, trustedKey, true);
    } catch (error) {
      return this.rethrowWithIssues(value, error);
    }
  }

  /**
   * The simple-field fast path fails with bare Errors (no code, no path);
   * report what safeParse would - a VldError with each field's issue.
   */
  private rethrowWithIssues(value: unknown, error: unknown): never {
    if (error instanceof VldError) throw error;
    const result = this.safeParse(value);
    throw result.success ? error : result.error;
  }

  private parseObjectValue(
    obj: Record<string, unknown>,
    trustedKey?: string,
    skipTrustedLiteralCheck = false,
    progress?: { result: any; index: number }
  ): T {
    if (this._canUseSimpleObjectFastPath) {
      return this.parseSimpleObjectValue(obj, trustedKey, skipTrustedLiteralCheck);
    }

    const result: any = {};
    if (progress) progress.result = result;

    // Validate fields directly on parse() to avoid safeParse result allocation
    // in the successful hot path.
    let currentKey = '';
    let i = 0;
    try {
      for (; i < this._shapeKeys.length; i++) {
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
              if (typeof fieldValue !== 'number' || !Number.isFinite(fieldValue)) {
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
              if (!Object.prototype.hasOwnProperty.call(obj, currentKey)) {
                throw new Error(getMessages().objectField(currentKey, getMessages().requiredField(currentKey)));
              }
              if (fieldValue !== undefined) {
                throw new Error(getMessages().objectField(currentKey, getMessages().expectedUndefined));
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
              if (!Object.prototype.hasOwnProperty.call(obj, currentKey)) {
                throw new Error(getMessages().objectField(currentKey, getMessages().requiredField(currentKey)));
              }
              result[currentKey] = fieldValue;
              continue;
          }
          continue;
        }

        const validator = this.getFieldValidator(currentKey, i);
        const fieldResult = this.parseCheckedField(validator, this._validatorTypes[i]!, obj[currentKey]);
        // An optional key that is absent from the input stays absent in the output.
        if (fieldResult !== undefined || currentKey in obj) {
          if (this._hasProtoKey) {
            setResultField(result, currentKey, fieldResult);
          } else {
            result[currentKey] = fieldResult;
          }
        }
      }
    } catch (error) {
      // Fields before `i` already succeeded: safeParse resumes from here
      // instead of running their transforms / refinements a second time.
      if (progress) progress.index = i;
      if (error instanceof VldError) {
        throw new VldError(error.issues.map(iss => ({
          ...iss,
          path: iss.path ? [currentKey, ...iss.path] : [currentKey],
          message: getMessages().objectField(currentKey, iss.message.startsWith('Invalid field') ? iss.message.replace(/^Invalid field "[^"]+": /, '') : iss.message)
        })));
      }
      const message = error instanceof Error ? error.message : String(error);
      throw new VldError([{
        code: 'invalid_type',
        path: [currentKey],
        message: message.startsWith('Invalid field') ? message : getMessages().objectField(currentKey, message)
      }]);
    }

    if (progress) progress.index = this._shapeKeys.length;

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
          throw new VldError([{ code: 'unrecognized_keys', path: [], keys: extraKeys, message: getMessages().unexpectedKeys(extraKeys) }]);
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
              throw this.createSafeParseError(error, key);
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
        error: new VldError([createInvalidTypeIssue('object', getTypeName(value), this._config.errorMessage || getMessages().invalidObject)])
      };
    }

    const obj = value as Record<string, unknown>;

    if (this._canUseSimpleObjectFastPath) {
      try {
        return { success: true, data: this.parseSimpleObjectValue(obj) };
      } catch {
        // Fall back to full issue aggregation on validation failure
      }
    }

    let result: any = {};
    let resumeFrom = 0;
    if (this._canUseSafeParseFastPath) {
      const progress = { result: undefined as any, index: 0 };
      try {
        return { success: true, data: this.parseObjectValue(obj, undefined, false, progress) };
      } catch {
        // Fall back to full issue aggregation on validation failure, keeping
        // the fields that already passed (each field runs once, as in Zod).
        if (progress.result !== undefined) {
          result = progress.result;
          resumeFrom = progress.index;
        }
      }
    }

    const issues: VldIssue[] = [];

    // Ultra-optimized field validation - use pre-computed validatorTypes in hot path
    for (let i = resumeFrom; i < this._shapeKeys.length; i++) {
      const key = this._shapeKeys[i]!;
      const fieldValue = obj[key];
      const simpleMode = this._simpleFieldModes[i];
      if (simpleMode !== undefined) {
        // Required-field check: a missing key must not be silently accepted for
        // any() / unknown() / undefined() (the simpleMode cases that otherwise
        // treat `fieldValue === undefined` as valid). Bug fix: 3.0.1 -> 3.0.2.
        if (
          (simpleMode === 'passthrough' || simpleMode === 'undefinedValue') &&
          !Object.prototype.hasOwnProperty.call(obj, key)
        ) {
          issues.push({
            code: 'invalid_type',
            path: [key],
            message: getMessages().objectField(key, getMessages().requiredField(key))
          });
          continue;
        }
        if (
          (simpleMode === 'string' && typeof fieldValue === 'string') ||
          (simpleMode === 'number' && typeof fieldValue === 'number' && Number.isFinite(fieldValue)) ||
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

        issues.push({
          code: 'invalid_type',
          path: [key],
          message: getMessages().objectField(key, this.getSimpleFieldError(simpleMode, this._simpleFieldValues[i], fieldValue))
        });
        continue;
      }

      let validator: VldBase<unknown, any>;
      try {
        validator = this.getFieldValidator(key, i);
      } catch (error) {
        const err = this.createSafeParseError(error, key);
        issues.push(...err.issues);
        continue;
      }
      try {
        if (validator instanceof VldBase && LEAF_FIELD_TYPES.has(this._validatorTypes[i]!)) {
          const fieldResult = this.parseCheckedField(validator, this._validatorTypes[i]!, fieldValue);
          if (fieldResult !== undefined || key in obj) {
            setResultField(result, key, fieldResult);
          }
          continue;
        }
        // Containers and wrappers go through the child's safeParse so every
        // nested issue is collected with its full path.
        const parseResult = (validator as any).safeParse(fieldValue);
        if (!parseResult.success) {
          const err = this.createSafeParseError(parseResult.error, key);
          issues.push(...err.issues);
        } else if (parseResult.data !== undefined || key in obj) {
          setResultField(result, key, parseResult.data);
        }
      } catch (error) {
        const err = this.createSafeParseError(error, key);
        issues.push(...err.issues);
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
          // Zod: one issue at the object's path listing every extra key.
          issues.push({ code: 'unrecognized_keys', path: [], keys: extraKeys, message: getMessages().unexpectedKeys(extraKeys) });
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
                  const err = this.createSafeParseError(catchallResult.error, key);
                  issues.push(...err.issues);
                } else {
                  result[key] = catchallResult.data;
                }
              }
            } catch (error) {
              const err = this.createSafeParseError(error, key);
              issues.push(...err.issues);
            }
          }
        }
      }
    }

    if (issues.length > 0) {
      return { success: false, error: new VldError(issues) };
    }

    return { success: true, data: result as T };
  }

  /**
   * Async parse: every field (and catchall value) goes through its own
   * parseAsync, so async refinements / transforms inside an object work.
   * Issues from all fields are collected, as in safeParse.
   */
  override async parseAsync(value: unknown): Promise<T> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return this.parse(value);
    }
    const obj = value as Record<string, unknown>;
    const result: any = {};
    const issues: VldIssue[] = [];
    for (let i = 0; i < this._shapeKeys.length; i++) {
      const key = this._shapeKeys[i]!;
      const simpleMode = this._simpleFieldModes[i];
      if ((simpleMode === 'passthrough' || simpleMode === 'undefinedValue') && !Object.prototype.hasOwnProperty.call(obj, key)) {
        issues.push({ code: 'invalid_type', path: [key], message: getMessages().objectField(key, getMessages().requiredField(key)) });
        continue;
      }
      let fieldResult: ParseResult<unknown>;
      try {
        fieldResult = await this.getFieldValidator(key, i).safeParseAsync(obj[key]);
      } catch (error) {
        issues.push(...this.createSafeParseError(error, key).issues);
        continue;
      }
      if (!fieldResult.success) {
        issues.push(...this.createSafeParseError(fieldResult.error, key).issues);
      } else if (fieldResult.data !== undefined || key in obj) {
        setResultField(result, key, fieldResult.data);
      }
    }

    if (this._config.strict || this._config.passthrough || this._config.catchall) {
      const extraKeys: string[] = [];
      for (const key of Object.keys(obj)) {
        if (this._shapeKeysSet.has(key)) continue;
        if (this._config.strict) {
          extraKeys.push(key);
        } else if (!isDangerousKey(key)) {
          if (this._config.catchall) {
            const extra = await this._config.catchall.safeParseAsync(obj[key]);
            if (extra.success) result[key] = extra.data;
            else issues.push(...this.createSafeParseError(extra.error, key).issues);
          } else {
            result[key] = obj[key];
          }
        }
      }
      if (extraKeys.length > 0) {
        issues.push({ code: 'unrecognized_keys', path: [], keys: extraKeys, message: getMessages().unexpectedKeys(extraKeys) });
      }
    }

    if (issues.length > 0) {
      throw new VldError(issues);
    }
    return result as T;
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
    const config: ObjectValidatorConfig<T> = {
      ...this._config,
      strict: true,
      passthrough: false,
      errorMessage: message
    };
    // The latest unknown-key policy wins: strict replaces an earlier catchall.
    delete (config as { catchall?: VldBase<unknown, any> }).catchall;
    return new VldObject(config);
  }
  
  /**
   * Create a new validator in passthrough mode (extra keys are preserved)
   */
  passthrough(): VldObject<T> {
    const config: ObjectValidatorConfig<T> = {
      ...this._config,
      strict: false,
      passthrough: true
    };
    // The latest unknown-key policy wins: passthrough replaces an earlier catchall.
    delete (config as { catchall?: VldBase<unknown, any> }).catchall;
    return new VldObject(config);
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
   * Keys a Zod-style `{ key: true }` mask selects (undefined: no mask, all
   * keys). Like Zod, a mask key outside the shape is an error.
   */
  private _maskedKeys(mask: Record<string, unknown> | undefined): Set<string> | undefined {
    if (mask === undefined) return undefined;
    const selected = new Set<string>();
    for (const key of Object.keys(mask)) {
      if (!Object.prototype.hasOwnProperty.call(this._config.shape, key)) {
        throw new Error(`Unrecognized key: "${key}"`);
      }
      if (mask[key]) selected.add(key);
    }
    return selected;
  }

  /**
   * Create a new validator with all fields optional
   */
  partial(): VldObject<{ [K in keyof T]?: T[K] }>;
  partial<M extends { [K in keyof T]?: true }>(mask: M): VldObject<Omit<T, keyof M> & { [K in keyof M & keyof T]?: T[K] }>;
  partial(mask?: Record<string, unknown>): VldObject<any> {
    const selected = this._maskedKeys(mask);
    const partialShape: any = {};
    for (const key in this._config.shape) {
      partialShape[key] = selected === undefined || selected.has(key)
        ? new VldOptional(this._config.shape[key])
        : this._config.shape[key];
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
   * Zod 4 `z.exactPartial()` counterpart  -  same as `partial()` but errors
   * when an explicit `undefined` is provided for an optional field. VLD
   * mirrors Zod's behaviour by rejecting explicit-undefined inputs through
   * `VldExactOptional`.
   */
  exactPartial(): VldObject<{ [K in keyof T]?: T[K] }> {
    const exactPartialShape: any = {};
    for (const key in this._config.shape) {
      exactPartialShape[key] = new VldExactOptional(this._config.shape[key]);
    }
    return new VldObject({
      ...this._config,
      shape: exactPartialShape
    }) as any;
  }

  /**
   * Create a new validator with only specified keys
   */
  pick<Mask extends { [k in keyof T]?: true }>(mask: Mask): VldObject<Pick<T, Extract<keyof Mask, keyof T>>>;
  pick<K extends keyof T>(...keys: K[]): VldObject<Pick<T, K>>;
  pick(...args: any[]): any {
    const pickedShape: any = {};
    let keyList: string[] = [];
    if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null && !Array.isArray(args[0])) {
      keyList = [...this._maskedKeys(args[0])!];
    } else {
      keyList = args.flat();
    }
    for (const key of keyList) {
      if (Object.prototype.hasOwnProperty.call(this._config.shape, key)) {
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
  omit<Mask extends { [k in keyof T]?: true }>(mask: Mask): VldObject<Omit<T, Extract<keyof Mask, keyof T>>>;
  omit<K extends keyof T>(...keys: K[]): VldObject<Omit<T, K>>;
  omit(...args: any[]): any {
    let keysToOmit: Set<string>;
    if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null && !Array.isArray(args[0])) {
      keysToOmit = this._maskedKeys(args[0])!;
    } else {
      keysToOmit = new Set(args.flat());
    }
    const omittedShape: any = {};
    for (const key in this._config.shape) {
      if (!keysToOmit.has(key)) {
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
    const config: ObjectValidatorConfig<any> = {
      ...this._config,
      shape: { ...this._config.shape, ...other.config.shape } as any,
      // Like Zod, the merged schema takes the argument's unknown-key policy.
      strict: other.config.strict === true,
      passthrough: other.config.passthrough === true
    };
    delete (config as { catchall?: VldBase<unknown, any> }).catchall;
    if (other.config.catchall) {
      (config as { catchall?: VldBase<unknown, any> }).catchall = other.config.catchall;
    }
    return new VldObject(config);
  }

  /**
   * Create a new validator with all fields required (removes optional)
   */
  required(): VldObject<{ [K in keyof T]-?: T[K] }>;
  required<M extends { [K in keyof T]?: true }>(mask: M): VldObject<Omit<T, keyof M> & { [K in keyof M & keyof T]-?: T[K] }>;
  required(mask?: Record<string, unknown>): VldObject<any> {
    const selected = this._maskedKeys(mask);
    const requiredShape: any = {};
    for (const key in this._config.shape) {
      const validator = this._config.shape[key];
      // If it's optional (and selected by the mask), unwrap it
      if ((selected === undefined || selected.has(key)) && (validator instanceof VldOptional || validator instanceof VldExactOptional)) {
        // Peel every optional layer: `.partial()` over an already optional
        // field nests them, and Zod's required() makes the key required.
        let unwrapped: any = validator;
        while (unwrapped instanceof VldOptional || unwrapped instanceof VldExactOptional) {
          // BUG-001 FIX: Add defensive check for baseValidator property
          const inner = (unwrapped as any).baseValidator;
          if (!inner || typeof inner.parse !== 'function') {
            throw new Error(`Invalid VldOptional structure for field "${key}": missing or invalid baseValidator`);
          }
          unwrapped = inner;
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
      strict: false, // catchall overrides strict
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
