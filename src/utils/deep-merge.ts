import { isDangerousKey } from './security';

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
 * Optimized for performance with minimal object allocations
 * BUG-NEW-020 FIX: Use comprehensive dangerous key protection from shared utility
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
 * BUG-NEW-014 FIX: Add circular reference protection using WeakSet
 * @param obj Object to freeze
 * @returns The frozen object
 */
export function deepFreeze<T>(obj: T): Readonly<T> {
  const seen = new WeakSet();

  function freezeRecursive(value: any): void {
    // Primitive or null check
    if (value === null || (typeof value !== 'object' && typeof value !== 'function')) {
      return;
    }

    // Already frozen or already seen (circular reference protection)
    if (Object.isFrozen(value) || seen.has(value)) {
      return;
    }

    // Mark as seen before recursing to prevent circular reference issues
    seen.add(value);

    // Freeze this level
    Object.freeze(value);

    // Recursively freeze properties (including Symbol properties)
    Reflect.ownKeys(value).forEach(prop => {
      freezeRecursive((value as any)[prop]);
    });
  }

  freezeRecursive(obj);
  return obj;
}