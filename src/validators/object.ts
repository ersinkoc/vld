import { VldBase, ParseResult, VldOptional } from './base';
import { getMessages } from '../locales';
import { VldString } from './string';
import { VldNumber } from './number';
import { VldBoolean } from './boolean';
import { VldDate } from './date';
import { VldEnum } from './enum';
import { VldCoerceString } from '../coercion/string';
import { VldCoerceNumber } from '../coercion/number';
import { VldCoerceBoolean } from '../coercion/boolean';
import { VldCoerceDate } from '../coercion/date';

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
  private readonly config: ObjectValidatorConfig<T>;
  private readonly shapeKeys: string[];
  private readonly shapeKeysSet: Set<string>;
  
  /**
   * Private constructor to enforce immutability
   */
  private constructor(config: ObjectValidatorConfig<T>) {
    super();
    this.config = config;
    // Pre-compute shape keys for faster access
    this.shapeKeys = Object.keys(config.shape);
    this.shapeKeysSet = new Set(this.shapeKeys);
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
      throw new Error(this.config.errorMessage || getMessages().invalidObject);
    }
    
    const obj = value as Record<string, unknown>;
    const result: any = {};
    
    // Ultra-optimized field validation with inline fast paths
    for (let i = 0; i < this.shapeKeys.length; i++) {
      const key = this.shapeKeys[i];
      const validator = this.config.shape[key];
      const fieldValue = obj[key];

      // BUG-NEW-002 FIX: Use instanceof instead of constructor.name
      // constructor.name breaks in minified builds where class names become 'a', 'b', etc.
      // instanceof checks are reliable regardless of minification
      //
      // Note: Coercion validators extend their base validators, so we need to check for
      // coercion types first (more specific) before checking base types

      // Check for coercion validators first - they need full safeParse for type conversion
      if (validator instanceof VldCoerceString ||
          validator instanceof VldCoerceNumber ||
          validator instanceof VldCoerceBoolean ||
          validator instanceof VldCoerceDate) {
        // Coercion validators need safeParse to handle type conversion
        const parseResult = validator.safeParse(fieldValue);
        if (!parseResult.success) {
          throw new Error(getMessages().objectField(key, parseResult.error.message));
        }
        result[key] = parseResult.data;
      } else if (validator instanceof VldString) {
        // For string with validations, use safeParse to handle email, regex etc.
        const parseResult = validator.safeParse(fieldValue);
        if (!parseResult.success) {
          throw new Error(getMessages().objectField(key, parseResult.error.message));
        }
        result[key] = parseResult.data;
      } else if (validator instanceof VldNumber) {
        if (typeof fieldValue !== 'number' || isNaN(fieldValue)) {
          throw new Error(getMessages().objectField(key, getMessages().invalidNumber));
        }
        result[key] = fieldValue;
      } else if (validator instanceof VldBoolean) {
        if (typeof fieldValue !== 'boolean') {
          throw new Error(getMessages().objectField(key, getMessages().invalidBoolean));
        }
        result[key] = fieldValue;
      } else if (validator instanceof VldDate) {
        // Use the actual validator for Date parsing (handles string conversion)
        const parseResult = validator.safeParse(fieldValue);
        if (!parseResult.success) {
          throw new Error(getMessages().objectField(key, parseResult.error.message));
        }
        result[key] = parseResult.data;
      } else {
        // Fallback to safeParse for complex validators
        const parseResult = validator.safeParse(fieldValue);
        if (!parseResult.success) {
          throw new Error(getMessages().objectField(key, parseResult.error.message));
        }
        result[key] = parseResult.data;
      }
    }
    
    // Handle strict mode - optimized with Set
    if (this.config.strict) {
      const objKeys = Object.keys(obj);
      const extraKeys: string[] = [];

      for (let i = 0; i < objKeys.length; i++) {
        if (!this.shapeKeysSet.has(objKeys[i])) {
          extraKeys.push(objKeys[i]);
        }
      }

      if (extraKeys.length > 0) {
        throw new Error(getMessages().unexpectedKeys(extraKeys));
      }
    }

    // Handle passthrough mode - optimized with comprehensive prototype pollution protection
    if (this.config.passthrough) {
      const objKeys = Object.keys(obj);
      for (let i = 0; i < objKeys.length; i++) {
        const key = objKeys[i];
        // Skip dangerous keys to prevent prototype pollution
        if (!this.shapeKeysSet.has(key) && !this.isDangerousKey(key)) {
          result[key] = obj[key];
        }
      }
    }

    // Handle catchall - validate extra keys with catchall validator
    if (this.config.catchall) {
      const objKeys = Object.keys(obj);
      for (let i = 0; i < objKeys.length; i++) {
        const key = objKeys[i];
        // Skip keys already in shape and dangerous keys
        if (!this.shapeKeysSet.has(key) && !this.isDangerousKey(key)) {
          result[key] = this.config.catchall.parse(obj[key]);
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
        error: new Error(this.config.errorMessage || getMessages().invalidObject)
      };
    }
    
    const obj = value as Record<string, unknown>;
    const result: any = {};
    
    // Validate all fields
    for (let i = 0; i < this.shapeKeys.length; i++) {
      const key = this.shapeKeys[i];
      const validator = this.config.shape[key];
      const fieldValue = obj[key];
      
      const parseResult = validator.safeParse(fieldValue);
      
      if (parseResult.success) {
        result[key] = parseResult.data;
      } else {
        return {
          success: false,
          error: new Error(getMessages().objectField(key, parseResult.error.message))
        };
      }
    }
    
    // Handle strict mode
    if (this.config.strict) {
      const objKeys = Object.keys(obj);
      const extraKeys: string[] = [];

      for (let i = 0; i < objKeys.length; i++) {
        if (!this.shapeKeysSet.has(objKeys[i])) {
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
    if (this.config.passthrough) {
      const objKeys = Object.keys(obj);
      for (let i = 0; i < objKeys.length; i++) {
        const key = objKeys[i];
        // Skip dangerous keys to prevent prototype pollution
        if (!this.shapeKeysSet.has(key) && !this.isDangerousKey(key)) {
          result[key] = obj[key];
        }
      }
    }

    // Handle catchall - validate extra keys with catchall validator
    if (this.config.catchall) {
      const objKeys = Object.keys(obj);
      for (let i = 0; i < objKeys.length; i++) {
        const key = objKeys[i];
        // Skip keys already in shape and dangerous keys
        if (!this.shapeKeysSet.has(key) && !this.isDangerousKey(key)) {
          const catchallResult = this.config.catchall.safeParse(obj[key]);
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
      ...this.config,
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
      ...this.config,
      strict: false,
      passthrough: true
    });
  }
  
  /**
   * Create a new validator with all fields optional
   */
  partial(): VldObject<{ [K in keyof T]?: T[K] }> {
    const partialShape: any = {};
    for (const key in this.config.shape) {
      partialShape[key] = new VldOptional(this.config.shape[key]);
    }
    return new VldObject({ 
      ...this.config, 
      shape: partialShape 
    }) as any;
  }
  
  /**
   * Create a new validator with deep partial (nested objects also partial)
   */
  deepPartial(): VldObject<any> {
    const deepPartialShape: any = {};
    for (const key in this.config.shape) {
      const validator = this.config.shape[key];
      if (validator instanceof VldObject) {
        deepPartialShape[key] = new VldOptional(validator.deepPartial());
      } else {
        deepPartialShape[key] = new VldOptional(validator);
      }
    }
    return new VldObject({ 
      ...this.config, 
      shape: deepPartialShape 
    });
  }
  
  /**
   * Create a new validator with only specified keys
   */
  pick<K extends keyof T>(...keys: K[]): VldObject<Pick<T, K>> {
    const pickedShape: any = {};
    for (const key of keys) {
      if (key in this.config.shape) {
        pickedShape[key] = this.config.shape[key];
      }
    }
    return new VldObject({ 
      ...this.config, 
      shape: pickedShape 
    });
  }
  
  /**
   * Create a new validator without specified keys
   */
  omit<K extends keyof T>(...keys: K[]): VldObject<Omit<T, K>> {
    const omittedShape: any = {};
    const keysToOmit = new Set(keys);
    for (const key in this.config.shape) {
      if (!keysToOmit.has(key as any)) {
        omittedShape[key] = this.config.shape[key];
      }
    }
    return new VldObject({ 
      ...this.config, 
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
      ...this.config,
      shape: { ...this.config.shape, ...extension } as any
    });
  }
  
  /**
   * Create a new validator by merging with another object validator
   */
  merge<U extends Record<string, any>>(
    other: VldObject<U>
  ): VldObject<T & U> {
    return new VldObject({
      ...this.config,
      shape: { ...this.config.shape, ...other.config.shape } as any
    });
  }
  
  /**
   * Create a new validator with all fields required (removes optional)
   */
  required(): VldObject<{ [K in keyof T]-?: T[K] }> {
    const requiredShape: any = {};
    for (const key in this.config.shape) {
      const validator = this.config.shape[key];
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
      ...this.config,
      shape: requiredShape
    }) as any;
  }

  /**
   * Create a new validator with a catchall validator for extra keys
   * Zod 4 API parity - validates unknown keys with provided schema
   */
  catchall<U>(schema: VldBase<unknown, U>): VldObject<any> {
    return new VldObject({
      ...this.config,
      catchall: schema,
      passthrough: false // catchall overrides passthrough
    }) as any;
  }

  /**
   * Access the inner shape schemas
   * Zod 4 API parity - returns the shape object
   */
  get shape(): { readonly [K in keyof T]: VldBase<unknown, T[K]> } {
    return this.config.shape;
  }

  /**
   * Create an enum validator from object keys
   * Zod 4 API parity - creates literal union of keys
   */
  keyof(): VldEnum<[string, ...string[]]> {
    const keys = Object.keys(this.config.shape);
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
    const existingKeys = new Set(Object.keys(this.config.shape));
    const extensionKeys = Object.keys(extension);
    const overlappingKeys: string[] = [];

    for (const key of extensionKeys) {
      if (existingKeys.has(key)) {
        overlappingKeys.push(key);
      }
    }

    if (overlappingKeys.length > 0) {
      throw new Error(
        `safeExtend: Cannot override existing keys: ${overlappingKeys.join(', ')}. Use extend() if you want to override.`
      );
    }

    return new VldObject({
      ...this.config,
      shape: { ...this.config.shape, ...extension } as any
    });
  }
}