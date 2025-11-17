/**
 * Security utilities for prototype pollution protection
 * BUG-NEW-018 & BUG-NEW-020 FIX: Centralized comprehensive dangerous key detection
 */

/**
 * Comprehensive prototype pollution protection
 * Checks for dangerous keys that could modify Object.prototype or built-in prototypes
 * @param key The property key to check
 * @returns true if the key is dangerous, false otherwise
 */
export function isDangerousKey(key: string): boolean {
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
