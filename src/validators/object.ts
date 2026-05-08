import { VldBase, ParseResult, VldOptional, VLD_VALIDATOR_TYPES } from './base';
import { getMessages } from '../locales';
import { VldEnum } from './enum';

/**
 * Configuration for object validator
 */
interface ObjectValidatorConfig<T extends Record<string, any>> {
  readonly shape: { readonly [K in keyof T]: VldBase<unknown, T[K]> };
  readonly strict?: boolean;
  readonly passthrough?: boolean;
  readonly catchall?: VldBase<unknown, any>;
  readonly errorMessage?: string;
}

/**
 * Optimized immutable object validator with chainable methods
 * Features pre-computed keys and Set-based lookups for better performance
 */
export class VldObject<T extends Record<string, any>> extends VldBase<unknown, T> {
  private readonly _config: ObjectValidatorConfig<T>;
  private readonly _shapeKeys: string[];
  private readonly _shapeKeysSet: Set<string>;

  /**
   * Private constructor to enforce immutability
   */
  private constructor(config: ObjectValidatorConfig<T>) {
    super();
    this._config = config;
    // Pre-compute shape keys for faster access
    this._shapeKeys = Object.keys(config.shape);
    this._shapeKeysSet = new Set(this._shapeKeys);
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
    shape: { [K in keyof T]: VldBase<unknown, T[K]> }
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

    const obj = value as Record<string, unknown>;
    const result: any = {};

    // Ultra-optimized field validation with inline fast paths
    for (let i = 0; i < this._shapeKeys.length; i++) {
      const key = this._shapeKeys[i];
      const validator = this._config.shape[key];
      const fieldValue = obj[key];

      // BUG-NEW-002 FIX: Use instanceof instead of constructor.name
      // constructor.name breaks in minified builds where class names become 'a', 'b', etc.
      // instanceof checks are reliable regardless of minification
      //
      // Note: Coercion validators extend their base validators, so we need to check for
      // coercion types first (more specific) before checking base types

      switch (validator.validatorType) {
        case VLD_VALIDATOR_TYPES.COERCE_STRING:
        case VLD_VALIDATOR_TYPES.COERCE_NUMBER:
        case VLD_VALIDATOR_TYPES.COERCE_BOOLEAN:
        case VLD_VALIDATOR_TYPES.COERCE_DATE: {
          const parseResult = validator.safeParse(fieldValue);
          if (!parseResult.success) {
            throw new Error(getMessages().objectField(key, parseResult.error.message));
          }
          result[key] = parseResult.data;
          break;
        }
        case VLD_VALIDATOR_TYPES.STRING: {
          const parseResult = validator.safeParse(fieldValue);
          if (!parseResult.success) {
            throw new Error(getMessages().objectField(key, parseResult.error.message));
          }
          result[key] = parseResult.data;
          break;
        }
        // Use safeParse to ensure all checks (min, max, positive, etc.) run
        case VLD_VALIDATOR_TYPES.NUMBER: {
          const parseResult = validator.safeParse(fieldValue);
          if (!parseResult.success) {
            throw new Error(getMessages().objectField(key, parseResult.error.message));
          }
          result[key] = parseResult.data;
          break;
        }
        case VLD_VALIDATOR_TYPES.BOOLEAN: {
          const parseResult = validator.safeParse(fieldValue);
          if (!parseResult.success) {
            throw new Error(getMessages().objectField(key, parseResult.error.message));
          }
          result[key] = parseResult.data;
          break;
        }
        case VLD_VALIDATOR_TYPES.DATE: {
          const parseResult = validator.safeParse(fieldValue);
          if (!parseResult.success) {
            throw new Error(getMessages().objectField(key, parseResult.error.message));
          }
          result[key] = parseResult.data;
          break;
        }
        default: {
          const parseResult = validator.safeParse(fieldValue);
          if (!parseResult.success) {
            throw new Error(getMessages().objectField(key, parseResult.error.message));
          }
          result[key] = parseResult.data;
          break;
        }
      }

    }

    // Handle strict/passthrough/catchall modes - optimized single Object.keys() call
    if (this._config.strict || this._config.passthrough || this._config.catchall) {
      const objKeys = Object.keys(obj);

      // Handle strict mode - optimized with Set
      if (this._config.strict) {
        const extraKeys: string[] = [];

        for (let i = 0; i < objKeys.length; i++) {
          if (!this._shapeKeysSet.has(objKeys[i])) {
            extraKeys.push(objKeys[i]);
          }
        }

        if (extraKeys.length > 0) {
          throw new Error(getMessages().unexpectedKeys(extraKeys));
        }
      }

      // Handle passthrough mode - optimized with comprehensive prototype pollution protection
      if (this._config.passthrough) {
        for (let i = 0; i < objKeys.length; i++) {
          const key = objKeys[i];
          // Skip dangerous keys to prevent prototype pollution
          if (!this._shapeKeysSet.has(key) && !this.isDangerousKey(key)) {
            result[key] = obj[key];
          }
        }
      }

      // Handle catchall - validate extra keys with catchall validator
      if (this._config.catchall) {
        for (let i = 0; i < objKeys.length; i++) {
          const key = objKeys[i];
          // Skip keys already in shape and dangerous keys
          if (!this._shapeKeysSet.has(key) && !this.isDangerousKey(key)) {
            result[key] = this._config.catchall.parse(obj[key]);
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
        error: new Error(this._config.errorMessage || getMessages().invalidObject)
      };
    }

    const obj = value as Record<string, unknown>;
    const result: any = {};

    // Ultra-optimized field validation with inline fast paths
    for (let i = 0; i < this._shapeKeys.length; i++) {
      const key = this._shapeKeys[i];
      const validator = this._config.shape[key];
      const fieldValue = obj[key];

      switch (validator.validatorType) {
        case VLD_VALIDATOR_TYPES.COERCE_STRING:
        case VLD_VALIDATOR_TYPES.COERCE_NUMBER:
        case VLD_VALIDATOR_TYPES.COERCE_BOOLEAN:
        case VLD_VALIDATOR_TYPES.COERCE_DATE: {
          const parseResult = validator.safeParse(fieldValue);
          if (!parseResult.success) {
            return {
              success: false,
              error: new Error(getMessages().objectField(key, parseResult.error.message))
            };
          }
          result[key] = parseResult.data;
          break;
        }
        case VLD_VALIDATOR_TYPES.STRING: {
          const parseResult = validator.safeParse(fieldValue);
          if (!parseResult.success) {
            return {
              success: false,
              error: new Error(getMessages().objectField(key, parseResult.error.message))
            };
          }
          result[key] = parseResult.data;
          break;
        }
        // Use safeParse to ensure all checks (min, max, positive, etc.) run
        case VLD_VALIDATOR_TYPES.NUMBER: {
          const parseResult = validator.safeParse(fieldValue);
          if (!parseResult.success) {
            return { success: false, error: new Error(getMessages().objectField(key, parseResult.error.message)) };
          }
          result[key] = parseResult.data;
          break;
        }
        case VLD_VALIDATOR_TYPES.BOOLEAN: {
          const parseResult = validator.safeParse(fieldValue);
          if (!parseResult.success) {
            return { success: false, error: new Error(getMessages().objectField(key, parseResult.error.message)) };
          }
          result[key] = parseResult.data;
          break;
        }
        case VLD_VALIDATOR_TYPES.DATE: {
          const parseResult = validator.safeParse(fieldValue);
          if (!parseResult.success) {
            return {
              success: false,
              error: new Error(getMessages().objectField(key, parseResult.error.message))
            };
          }
          result[key] = parseResult.data;
          break;
        }
        default: {
          const parseResult = validator.safeParse(fieldValue);
          if (!parseResult.success) {
            return {
              success: false,
              error: new Error(getMessages().objectField(key, parseResult.error.message))
            };
          }
          result[key] = parseResult.data;
          break;
        }
      }
    }

    // Handle strict/passthrough/catchall modes - optimized single Object.keys() call
    if (this._config.strict || this._config.passthrough || this._config.catchall) {
      const objKeys = Object.keys(obj);

      // Handle strict mode
      if (this._config.strict) {
        const extraKeys: string[] = [];

        for (let i = 0; i < objKeys.length; i++) {
          if (!this._shapeKeysSet.has(objKeys[i])) {
            extraKeys.push(objKeys[i]);
          }
        }

        if (extraKeys.length > 0) {
          return {
            success: false,
            error: new Error(getMessages().unexpectedKeys(extraKeys))
          };
        }
      }

      // Handle passthrough mode with comprehensive prototype pollution protection
      if (this._config.passthrough) {
        for (let i = 0; i < objKeys.length; i++) {
          const key = objKeys[i];
          // Skip dangerous keys to prevent prototype pollution
          if (!this._shapeKeysSet.has(key) && !this.isDangerousKey(key)) {
            result[key] = obj[key];
          }
        }
      }

      // Handle catchall - validate extra keys with catchall validator
      if (this._config.catchall) {
        for (let i = 0; i < objKeys.length; i++) {
          const key = objKeys[i];
          // Skip keys already in shape and dangerous keys
          if (!this._shapeKeysSet.has(key) && !this.isDangerousKey(key)) {
            const catchallResult = this._config.catchall.safeParse(obj[key]);
            if (!catchallResult.success) {
              return {
                success: false,
                error: new Error(getMessages().objectField(key, catchallResult.error.message))
              };
            }
            result[key] = catchallResult.data;
          }
        }
      }
    }

    return { success: true, data: result as T };
  }

  /**
   * Comprehensive prototype pollution protection
   * Checks for dangerous keys that could modify Object.prototype
   */
  private isDangerousKey(key: string): boolean {
    // Direct dangerous keys
    const directDangerousKeys = ['__proto__', 'constructor', 'prototype'];
    if (directDangerousKeys.includes(key)) {
      return true;
    }

    // Nested prototype manipulation vectors
    // These patterns could allow prototype pollution through nested access
    const nestedPatterns = [
      'constructor.prototype',
      '__proto__.toString',
      'prototype.constructor',
      '__defineGetter__',
      '__defineSetter__',
      '__lookupGetter__',
      '__lookupSetter__'
    ];

    // Check for nested patterns
    for (const pattern of nestedPatterns) {
      if (key.includes(pattern)) {
        return true;
      }
    }

    // Check for property access chains that could lead to prototype pollution
    // This covers patterns like "x.constructor.prototype.polluted"
    const dangerousChains = [
      'constructor.',
      '__proto__.',
      'prototype.'
    ];

    for (const chain of dangerousChains) {
      if (key.includes(chain)) {
        return true;
      }
    }

    // Additional protection: reject keys that could be used for property shadowing
    const shadowingPatterns = [
      'hasOwnProperty',
      'toString',
      'valueOf',
      'isPrototypeOf',
      'propertyIsEnumerable'
    ];

    for (const pattern of shadowingPatterns) {
      if (key === pattern || key.includes(`.${pattern}`)) {
        return true;
      }
    }

    return false;
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