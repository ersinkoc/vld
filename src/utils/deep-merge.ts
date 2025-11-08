/**
 * Type guard to check if a value is a plain object
 */
export function isPlainObject(obj: any): obj is Record<string, any> {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    obj.constructor === Object &&
    Object.prototype.toString.call(obj) === '[object Object]'
  );
}

/**
 * Safely deep merge two objects without prototype pollution vulnerability
 * @param target The target object
 * @param source The source object to merge from
 * @returns A new merged object
 */
export function deepMerge<T extends Record<string, any>>(
  target: T,
  source: Partial<T>
): T {
  // Prevent prototype pollution
  const DANGEROUS_KEYS = ['__proto__', 'constructor', 'prototype'];
  
  // Create a new object to avoid mutations
  const result = { ...target } as T;
  
  for (const key in source) {
    // Skip dangerous keys that could lead to prototype pollution
    if (DANGEROUS_KEYS.includes(key)) {
      continue;
    }
    
    // Only process own properties, not inherited ones
    if (!Object.prototype.hasOwnProperty.call(source, key)) {
      continue;
    }
    
    const sourceValue = source[key];
    const targetValue = target[key];
    
    // If both values are plain objects, merge them recursively
    if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
      (result as any)[key] = deepMerge(targetValue as any, sourceValue as any);
    } else {
      // Otherwise, use the source value (including undefined)
      (result as any)[key] = sourceValue;
    }
  }
  
  return result;
}

/**
 * Freeze an object deeply to prevent any mutations
 * @param obj Object to freeze
 * @returns The frozen object
 */
export function deepFreeze<T>(obj: T): Readonly<T> {
  // Primitive values don't need processing
  if (obj === null || (typeof obj !== 'object' && typeof obj !== 'function')) {
    return obj;
  }
  
  // Check if already frozen to prevent infinite recursion
  if (Object.isFrozen(obj)) {
    return obj;
  }
  
  // Freeze the object/function itself
  Object.freeze(obj);

  // Recursively freeze all properties (including Symbol properties)
  Reflect.ownKeys(obj).forEach(prop => {
    const value = (obj as any)[prop];
    if (value !== null && (typeof value === 'object' || typeof value === 'function')) {
      deepFreeze(value);
    }
  });
  
  return obj;
}