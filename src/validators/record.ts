import { VldBase, ParseResult, VLD_VALIDATOR_TYPES } from './base';
import { getMessages } from '../locales/runtime';
import { isDangerousKey } from '../utils/security';
import { VldError, nestIssues, type VldIssue, createInvalidTypeIssue, getTypeName } from '../errors-core';

/**
 * Zod's record input check (isPlainObject): plain / null-prototype objects and
 * class-less dictionaries pass; Date, Map, Set, typed arrays and other
 * built-in instances do not (their state is not in own enumerable keys).
 * @internal Also used by VldObject's record-field fast path.
 */
export function isRecordLike(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const ctor = (value as { constructor?: unknown }).constructor;
  if (ctor === undefined || typeof ctor !== 'function') return true;
  const proto = (ctor as { prototype?: unknown }).prototype;
  return typeof proto === 'object' && proto !== null && Object.prototype.hasOwnProperty.call(proto, 'isPrototypeOf');
}

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

/**
 * Immutable record validator for key-value pairs
 * BUG-NEW-018 FIX: Uses comprehensive dangerous key protection
 */
/**
 * The finite set of property keys a key schema accepts (Zod's `_zod.values`): enum and literal values, a union whose
 * options all have one, and the wrappers that pass the input type through (readonly, optional, default, catch, brand,
 * refine, transform, pipe input...). Such a record is exhaustive: every key is required, any other key is unrecognized.
 */
function finiteKeyValues(schema: any): readonly unknown[] | undefined {
  switch (schema.validatorType) {
    case VLD_VALIDATOR_TYPES.ENUM:
    case VLD_VALIDATOR_TYPES.LITERAL:
      return schema.values ?? schema.__def.values ?? [schema.__def.value];
    case VLD_VALIDATOR_TYPES.UNION: {
      const options: any[] = schema.validators ?? schema.__def?.validators ?? [];
      const sets = options.map(finiteKeyValues);
      return options.length > 0 && sets.every(set => set !== undefined) ? sets.flat() : undefined;
    }
    case VLD_VALIDATOR_TYPES.PIPE:
      return finiteKeyValues(schema.first);
    case VLD_VALIDATOR_TYPES.SUPER_REFINE:
      return finiteKeyValues(schema._inner);
    case VLD_VALIDATOR_TYPES.READONLY:
    case VLD_VALIDATOR_TYPES.BRAND:
    case VLD_VALIDATOR_TYPES.META:
    case VLD_VALIDATOR_TYPES.OPTIONAL:
    case VLD_VALIDATOR_TYPES.NULLABLE:
    case VLD_VALIDATOR_TYPES.NULLISH:
    case VLD_VALIDATOR_TYPES.DEFAULT:
    case VLD_VALIDATOR_TYPES.PREFAULT:
    case VLD_VALIDATOR_TYPES.CATCH:
    case VLD_VALIDATOR_TYPES.REFINE:
    case VLD_VALIDATOR_TYPES.TRANSFORM:
      return finiteKeyValues(schema.baseValidator ?? schema.__def.inner);
    default:
      return undefined;
  }
}

export class VldRecord<T, K extends PropertyKey = string> extends VldBase<unknown, Record<K, T>> {
  /**
   * Private constructor to enforce immutability
   */
  protected constructor(
    protected readonly valueValidator: VldBase<unknown, T>,
    private readonly keyValidator?: VldBase<unknown, K>,
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

  get keySchema(): VldBase<unknown, K> | undefined {
    return this.keyValidator;
  }

  get valueType(): VldBase<unknown, T> {
    return this.valueValidator;
  }

  get keyType(): VldBase<unknown, K> | undefined {
    return this.keyValidator;
  }
  
  /**
   * Create a new record validator
   */
  static create<T, K extends PropertyKey = string>(
    valueValidator: VldBase<unknown, T>,
    keyValidator?: VldBase<unknown, K>
  ): VldRecord<T, K> {
    return new VldRecord(valueValidator, keyValidator);
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

  /**
   * Parse and validate a record value
   * BUG-NEW-018 FIX: Use comprehensive dangerous key protection
   */
  parse(value: unknown): Record<K, T> {
    if (!isRecordLike(value)) {
      throw new VldError([createInvalidTypeIssue('record', getTypeName(value), this.errorMessage || getMessages().invalidRecord)]);
    }

    return this.parseKnownRecord(value as Record<string, unknown>);
  }

  /**
   * Parse a value that has already passed the record object type guard.
   * @internal Used by object validators to avoid duplicate hot-path checks.
   */
  parseKnownRecord(obj: Record<string, unknown>): Record<K, T> {
    if (this.keyValidator !== undefined) {
      return this.parseKeyedRecord(obj);
    }

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
              this.throwRecordIssues(obj);
            }
            result[key] = val as T;
            continue;
          case 'number':
            if (typeof val !== 'number' || !Number.isFinite(val)) {
              this.throwRecordIssues(obj);
            }
            result[key] = val as T;
            continue;
          case 'boolean':
            if (typeof val !== 'boolean') {
              this.throwRecordIssues(obj);
            }
            result[key] = val as T;
            continue;
          case 'bigint':
            if (typeof val !== 'bigint') {
              this.throwRecordIssues(obj);
            }
            result[key] = val as T;
            continue;
          case 'symbol':
            if (typeof val !== 'symbol') {
              this.throwRecordIssues(obj);
            }
            result[key] = val as T;
            continue;
          case 'null':
            if (val !== null) {
              this.throwRecordIssues(obj);
            }
            result[key] = null as T;
            continue;
          case 'undefinedValue':
            if (val !== undefined) {
              this.throwRecordIssues(obj);
            }
            result[key] = undefined as T;
            continue;
          case 'literal':
            if (val !== this._simpleValue) {
              this.throwRecordIssues(obj);
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
      } catch {
        this.throwRecordIssues(obj);
      }
    }

    return result as Record<K, T>;
  }

  /**
   * Re-validates every entry in issue-collection mode and throws a VldError
   * with one nested issue per failing value at path `[key]` (Zod).
   */
  private throwRecordIssues(obj: Record<string, unknown>): never {
    const issues: VldIssue[] = [];
    for (const key of Object.keys(obj)) {
      if (isDangerousKey(key)) continue;
      const item = this.valueValidator.safeParse(obj[key]);
      if (!item.success) {
        issues.push(...nestIssues(item.error, key, message => message));
      }
    }
    throw new VldError(issues);
  }

  private parseKeyedRecord(obj: Record<string, unknown>): Record<K, T> {
    const result = {} as Record<K, T>;
    const keys = Reflect.ownKeys(obj);
    // Enum / literal keys form a finite key set: like Zod, a key outside it is
    // an unrecognized key (not an invalid one) and the record is exhaustive.
    const finiteKeys = this.keyValidator === undefined ? undefined : finiteKeyValues(this.keyValidator);
    const finiteKeySet = finiteKeys === undefined ? undefined : new Set(finiteKeys.filter(key => typeof key === 'string' || typeof key === 'number').map(String));
    const unrecognized: string[] = [];

    for (const rawKey of keys) {
      if (!Object.prototype.propertyIsEnumerable.call(obj, rawKey)) {
        continue;
      }
      if (typeof rawKey === 'string' && isDangerousKey(rawKey)) {
        continue;
      }

      // A key outside the finite key set is unrecognized whatever the key schema would make of it (a catch would remap it).
      if (finiteKeySet !== undefined && typeof rawKey === 'string' && !finiteKeySet.has(rawKey)) {
        unrecognized.push(rawKey);
        continue;
      }
      let parsedKey = this.keyValidator!.safeParse(rawKey);
      // Object keys are always strings; for numeric key schemas (v.number(),
      // v.literal(1), ...) retry a canonical numeric key ("1", "-2.5") as a number.
      if (!parsedKey.success && typeof rawKey === 'string' && rawKey !== '' && String(Number(rawKey)) === rawKey) {
        const numericKey = this.keyValidator!.safeParse(Number(rawKey));
        if (numericKey.success) {
          parsedKey = numericKey;
        }
      }
      if (!parsedKey.success) {
        this.throwKeyedRecordIssues(obj);
      }
      if (typeof parsedKey.data !== 'string' && typeof parsedKey.data !== 'number' && typeof parsedKey.data !== 'symbol') {
        this.throwKeyedRecordIssues(obj);
      }
      if (typeof parsedKey.data === 'string' && isDangerousKey(parsedKey.data)) {
        continue;
      }

      try {
        result[parsedKey.data] = this.valueValidator.parse(obj[rawKey as keyof typeof obj]);
      } catch {
        this.throwKeyedRecordIssues(obj);
      }
    }

    // Every key of a finite key set must be present unless the value schema
    // accepts undefined (partialRecord wraps values in optional()). Zod runs
    // the key schema on the declared key first: a key it rejects is an
    // invalid_key issue, not a value issue.
    if (finiteKeys !== undefined) {
      const missingIssues: VldIssue[] = [];
      for (const key of finiteKeys) {
        if ((typeof key !== 'string' && typeof key !== 'number') || Object.prototype.hasOwnProperty.call(obj, String(key))) {
          continue;
        }
        const keyResult = this.keyValidator!.safeParse(key);
        if (!keyResult.success) {
          missingIssues.push({
            code: 'invalid_key', origin: 'record', path: [String(key)],
            message: 'Invalid key in record', issues: keyResult.error.issues,
          });
          continue;
        }
        const missing = this.valueValidator.safeParse(undefined);
        if (!missing.success) {
          missingIssues.push(...nestIssues(missing.error, String(key), message => message));
          continue;
        }
        if (missing.data !== undefined) {
          result[key as K] = missing.data;
        }
      }
      if (missingIssues.length > 0) {
        // Zod reports the missing exhaustive keys and the unrecognized ones
        // together when both are present.
        if (unrecognized.length > 0) {
          missingIssues.push({ code: 'unrecognized_keys', path: [], keys: unrecognized, message: getMessages().unexpectedKeys(unrecognized) });
        }
        throw new VldError(missingIssues);
      }
    }
    if (unrecognized.length > 0) {
      throw new VldError([{ code: 'unrecognized_keys', path: [], keys: unrecognized, message: getMessages().unexpectedKeys(unrecognized) }]);
    }

    return result;
  }

  /**
   * Re-validates a keyed record in issue-collection mode and throws a VldError
   * matching Zod: an invalid key becomes one `invalid_key` issue at `[key]`
   * with origin `record` and the nested key issues; a failing value nests its
   * issues at `[key]`; missing exhaustive keys and unrecognized keys follow.
   */
  private throwKeyedRecordIssues(obj: Record<string, unknown>): never {
    const issues: VldIssue[] = [];
    const finiteKeys = this.keyValidator === undefined ? undefined : finiteKeyValues(this.keyValidator);
    const finiteKeySet = finiteKeys === undefined ? undefined : new Set(finiteKeys.filter(key => typeof key === 'string' || typeof key === 'number').map(String));
    const unrecognized: string[] = [];

    for (const rawKey of Reflect.ownKeys(obj)) {
      if (!Object.prototype.propertyIsEnumerable.call(obj, rawKey)) {
        continue;
      }
      if (typeof rawKey === 'string' && isDangerousKey(rawKey)) {
        continue;
      }
      if (finiteKeySet !== undefined && typeof rawKey === 'string' && !finiteKeySet.has(rawKey)) {
        unrecognized.push(rawKey);
        continue;
      }
      let parsedKey = this.keyValidator!.safeParse(rawKey);
      if (!parsedKey.success && typeof rawKey === 'string' && rawKey !== '' && String(Number(rawKey)) === rawKey) {
        const numericKey = this.keyValidator!.safeParse(Number(rawKey));
        if (numericKey.success) {
          parsedKey = numericKey;
        }
      }
      if (!parsedKey.success) {
        issues.push({
          code: 'invalid_key', origin: 'record', path: [String(rawKey)],
          message: 'Invalid key in record', issues: parsedKey.error.issues,
        });
        continue;
      }
      if (typeof parsedKey.data !== 'string' && typeof parsedKey.data !== 'number' && typeof parsedKey.data !== 'symbol') {
        issues.push({
          code: 'invalid_key', origin: 'record', path: [String(rawKey)],
          message: 'Record key transform must return a property key',
        });
        continue;
      }
      if (typeof parsedKey.data === 'string' && isDangerousKey(parsedKey.data)) {
        continue;
      }
      const item = this.valueValidator.safeParse(obj[rawKey as keyof typeof obj]);
      if (!item.success) {
        issues.push(...nestIssues(item.error, String(rawKey), message => message));
      }
    }

    if (finiteKeys !== undefined) {
      for (const key of finiteKeys) {
        if ((typeof key !== 'string' && typeof key !== 'number') || Object.prototype.hasOwnProperty.call(obj, String(key))) {
          continue;
        }
        const keyResult = this.keyValidator!.safeParse(key);
        if (!keyResult.success) {
          issues.push({
            code: 'invalid_key', origin: 'record', path: [String(key)],
            message: 'Invalid key in record', issues: keyResult.error.issues,
          });
          continue;
        }
        const missing = this.valueValidator.safeParse(undefined);
        if (!missing.success) {
          issues.push(...nestIssues(missing.error, String(key), message => message));
        }
      }
    }
    if (unrecognized.length > 0) {
      issues.push({ code: 'unrecognized_keys', path: [], keys: unrecognized, message: getMessages().unexpectedKeys(unrecognized) });
    }
    throw new VldError(issues);
  }
  
  /**
   * Safely parse and validate a record value
   */
  safeParse(value: unknown): ParseResult<Record<K, T>> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      // Every parse failure path throws VldError.
      return { success: false, error: error as VldError };
    }
  }

  /** Async parse: keys and values go through their schemas' parseAsync. */
  override async parseAsync(value: unknown): Promise<Record<K, T>> {
    if (!isRecordLike(value)) {
      return this.parse(value);
    }
    const obj = value as Record<PropertyKey, unknown>;
    const keyValidator = this.keyValidator;
    const result = {} as Record<PropertyKey, T>;
    const issues: VldIssue[] = [];
    const finiteKeys = keyValidator === undefined ? undefined : finiteKeyValues(keyValidator);
    const finiteKeySet = finiteKeys === undefined ? undefined : new Set(finiteKeys.filter(key => typeof key === 'string' || typeof key === 'number').map(String));
    const unrecognized: string[] = [];
    const rawKeys = keyValidator === undefined
      ? Object.keys(obj)
      : Reflect.ownKeys(obj).filter(key => Object.prototype.propertyIsEnumerable.call(obj, key));
    for (const rawKey of rawKeys) {
      if (typeof rawKey === 'string' && isDangerousKey(rawKey)) continue;
      let key: PropertyKey = rawKey;
      if (finiteKeySet !== undefined && typeof rawKey === 'string' && !finiteKeySet.has(rawKey)) {
        unrecognized.push(rawKey);
        continue;
      }
      if (keyValidator !== undefined) {
        let parsedKey = await keyValidator.safeParseAsync(rawKey);
        if (!parsedKey.success && typeof rawKey === 'string' && rawKey !== '' && String(Number(rawKey)) === rawKey) {
          const numericKey = await keyValidator.safeParseAsync(Number(rawKey));
          if (numericKey.success) parsedKey = numericKey;
        }
        if (!parsedKey.success) {
          issues.push({ code: 'invalid_key', origin: 'record', path: [String(rawKey)], message: 'Invalid key in record', issues: parsedKey.error.issues });
          continue;
        }
        key = parsedKey.data as PropertyKey;
        if (typeof key === 'string' && isDangerousKey(key)) continue;
      }
      const item = await this.valueValidator.safeParseAsync(obj[rawKey]);
      if (item.success) result[key] = item.data;
      else issues.push(...nestIssues(item.error, String(rawKey), message => message));
    }
    for (const key of finiteKeys ?? []) {
      if ((typeof key !== 'string' && typeof key !== 'number') || Object.prototype.hasOwnProperty.call(obj, String(key))) continue;
      // Zod runs the key schema on the declared key first (invalid_key on failure).
      const keyResult = await keyValidator!.safeParseAsync(key);
      if (!keyResult.success) {
        issues.push({ code: 'invalid_key', origin: 'record', path: [String(key)], message: 'Invalid key in record', issues: keyResult.error.issues });
        continue;
      }
      const missing = await this.valueValidator.safeParseAsync(undefined);
      if (!missing.success) issues.push(...nestIssues(missing.error, String(key), message => message));
      else if (missing.data !== undefined) result[key] = missing.data;
    }
    if (unrecognized.length > 0) {
      issues.push({ code: 'unrecognized_keys', path: [], keys: unrecognized, message: getMessages().unexpectedKeys(unrecognized) });
    }
    if (issues.length > 0) throw new VldError(issues);
    return result as Record<K, T>;
  }

  /**
   * Create a partial record variant (all keys optional)
   * Similar to v.object().partial() but for records
   */
  partial(): VldRecord<T | undefined, K> {
    const optionalValidator = this.valueValidator.optional();
    return new VldRecord(optionalValidator, this.keyValidator);
  }

  /**
   * Create a loose record variant (allows extra keys)
   * Similar to v.object().passthrough() but for records
   * Note: Records already allow any keys, so this mainly affects error handling
   */
  loose(): VldBase<unknown, Record<K, T>> {
    // For records, "loose" means we don't throw errors for validation failures
    // We return a modified version that catches validation errors
    return new VldLooseRecord(this.valueValidator, this.keyValidator);
  }
}

/**
 * Loose record variant that allows validation failures
 * Used internally by .loose() method
 */
class VldLooseRecord<T, K extends PropertyKey = string> extends VldBase<unknown, Record<K, T>> {
  constructor(
    private readonly valueValidator: VldBase<unknown, T>,
    private readonly keyValidator?: VldBase<unknown, K>
  ) {
    super(VLD_VALIDATOR_TYPES.RECORD);
  }

  get valueSchema(): VldBase<unknown, T> {
    return this.valueValidator;
  }

  parse(value: unknown): Record<K, T> {
    if (!isRecordLike(value)) {
      throw new VldError([createInvalidTypeIssue('record', getTypeName(value), getMessages().invalidRecord)]);
    }

    const result = {} as Record<K, T>;
    const obj = value as Record<string, unknown>;

    for (const key of Reflect.ownKeys(obj)) {
      if (!Object.prototype.propertyIsEnumerable.call(obj, key)) {
        continue;
      }
      // Skip dangerous keys
      if (typeof key === 'string' && isDangerousKey(key)) {
        continue;
      }

      const parsedKey = this.keyValidator?.safeParse(key);
      if (parsedKey && !parsedKey.success) {
        continue;
      }
      const outputKey = parsedKey?.data ?? key;
      if (typeof outputKey !== 'string' && typeof outputKey !== 'number' && typeof outputKey !== 'symbol') {
        continue;
      }
      if (typeof outputKey === 'string' && isDangerousKey(outputKey)) {
        continue;
      }

      // For loose records, skip invalid values instead of throwing
      const parseResult = this.valueValidator.safeParse(obj[key as keyof typeof obj]);
      if (parseResult.success) {
        result[outputKey as K] = parseResult.data;
      }
    }

    return result;
  }

  safeParse(value: unknown): ParseResult<Record<K, T>> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error as VldError };
    }
  }

  /**
   * Create a partial variant (all keys optional)
   */
  partial(): VldLooseRecord<T | undefined, K> {
    const optionalValidator = this.valueValidator.optional();
    return new VldLooseRecord(optionalValidator, this.keyValidator);
  }

  /**
   * Return self (already loose)
   */
  loose(): VldLooseRecord<T, K> {
    return this;
  }
}
