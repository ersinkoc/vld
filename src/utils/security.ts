/**
 * Security utilities for prototype pollution protection
 */

/**
 * Keys that, when written via `obj[key] = ...`, can mutate Object.prototype
 * or alter property accessor behavior across the program.
 *
 * `__proto__`, `constructor`, `prototype` are the canonical prototype-pollution
 * sinks. The `__define*Getter__` / `__lookup*Getter__` family installs accessors
 * on the prototype chain in legacy engines.
 *
 * Note: keys such as `toString`, `valueOf`, or `hasOwnProperty` are NOT
 * blocked. Those are legitimate property names that appear in real payloads
 * (localization tables, custom widget config, generic key/value stores).
 * Silently dropping them causes data loss; a validation library must not do
 * that.
 */
const DANGEROUS_KEYS = new Set<string>([
  '__proto__',
  'constructor',
  'prototype',
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__',
]);

/**
 * Return true if a property key would, if assigned, mutate the prototype
 * chain or accessor behavior of the target object.
 */
export function isDangerousKey(key: string): boolean {
  return DANGEROUS_KEYS.has(key);
}
