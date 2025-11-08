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
 * Check if a key could be dangerous for prototype pollution
 */
function isDangerousKey(key: string): boolean {
  // Direct dangerous keys
  const directDangerousKeys = ['__proto__', 'constructor', 'prototype'];
  if (directDangerousKeys.includes(key)) {
    return true;
  }

  // Nested prototype manipulation vectors
  const nestedPatterns = [
    'constructor.prototype',
    '__proto__.toString',
    'prototype.constructor'
  ];

  // Check for nested patterns
  for (const pattern of nestedPatterns) {
    if (key.includes(pattern)) {
      return true;
    }
  }

  return false;
}

/**
 * Safely deep merge two objects without prototype pollution vulnerability
 * Optimized for performance with minimal object allocations
 * @param target The target object
 * @param source The source object to merge from
 * @returns A new merged object
 */
export function deepMerge<T extends Record<string, any>>(
  target: T,
  source: Partial<T>
): T {
  // Create a new object to avoid mutations (only once)
  const result = { ...target } as T;

  // Get source keys directly for better performance
  const sourceKeys = Object.keys(source);

  for (let i = 0; i < sourceKeys.length; i++) {
    const key = sourceKeys[i];

    // Skip dangerous keys that could lead to prototype pollution
    if (isDangerousKey(key)) {
      continue;
    }

    // Only process own properties (redundant with Object.keys but safe)
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