import { VldBase, ParseResult, VldOptional } from './base';
import { getMessages } from '../locales';

/**
 * Configuration for object validator
 */
interface ObjectValidatorConfig<T extends Record<string, any>> {
  readonly shape: { readonly [K in keyof T]: VldBase<unknown, T[K]> };
  readonly strict?: boolean;
  readonly passthrough?: boolean;
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
      
      // Inline fast-path validation for common types
      const validatorType = validator.constructor.name;
      
      if (validatorType === 'VldString') {
        // For string with validations, use safeParse to handle email, regex etc.
        const parseResult = validator.safeParse(fieldValue);
        if (!parseResult.success) {
          throw new Error(getMessages().objectField(key, parseResult.error.message));
        }
        result[key] = parseResult.data;
      } else if (validatorType === 'VldNumber') {
        if (typeof fieldValue !== 'number' || isNaN(fieldValue)) {
          throw new Error(getMessages().objectField(key, getMessages().invalidNumber));
        }
        result[key] = fieldValue;
      } else if (validatorType === 'VldBoolean') {
        if (typeof fieldValue !== 'boolean') {
          throw new Error(getMessages().objectField(key, getMessages().invalidBoolean));
        }
        result[key] = fieldValue;
      } else if (validatorType === 'VldDate') {
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
        requiredShape[key] = (validator as any).baseValidator;
      } else {
        requiredShape[key] = validator;
      }
    }
    return new VldObject({ 
      ...this.config, 
      shape: requiredShape 
    }) as any;
  }
}