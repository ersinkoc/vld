import { describe, it, expect } from '@jest/globals';
import { deepMerge, isPlainObject, deepFreeze } from '../../src/utils/deep-merge';

describe('Deep Merge Utilities', () => {
  describe('isPlainObject', () => {
    it('should identify plain objects', () => {
      expect(isPlainObject({})).toBe(true);
      expect(isPlainObject({ a: 1 })).toBe(true);
      expect(isPlainObject(Object.create(null))).toBe(false); // No constructor
      expect(isPlainObject(new Object())).toBe(true);
    });

    it('should reject non-plain objects', () => {
      expect(isPlainObject(null)).toBe(false);
      expect(isPlainObject(undefined)).toBe(false);
      expect(isPlainObject(42)).toBe(false);
      expect(isPlainObject('string')).toBe(false);
      expect(isPlainObject(true)).toBe(false);
      expect(isPlainObject([])).toBe(false);
      expect(isPlainObject(new Date())).toBe(false);
      expect(isPlainObject(new Map())).toBe(false);
      expect(isPlainObject(new Set())).toBe(false);
      expect(isPlainObject(() => {})).toBe(false);
      expect(isPlainObject(Symbol())).toBe(false);
    });

    it('should reject class instances', () => {
      class MyClass {}
      expect(isPlainObject(new MyClass())).toBe(false);
    });
  });

  describe('deepMerge', () => {
    it('should merge simple objects', () => {
      const target = { a: 1, b: 2 };
      const source = { b: 3, c: 4 };
      const result = deepMerge(target, source);
      
      expect(result).toEqual({ a: 1, b: 3, c: 4 });
      expect(result).not.toBe(target); // New object
      expect(target).toEqual({ a: 1, b: 2 }); // Original unchanged
    });

    it('should merge nested objects', () => {
      const target = {
        a: 1,
        nested: {
          x: 10,
          y: 20
        }
      };
      const source = {
        nested: {
          y: 30,
          z: 40
        }
      } as any;
      
      const result = deepMerge(target, source as any);
      expect(result).toEqual({
        a: 1,
        nested: {
          x: 10,
          y: 30,
          z: 40
        }
      });
    });

    it('should handle arrays without merging', () => {
      const target = { arr: [1, 2, 3] };
      const source = { arr: [4, 5] };
      const result = deepMerge(target, source);
      
      expect(result).toEqual({ arr: [4, 5] }); // Arrays are replaced, not merged
    });

    it('should handle null and undefined values', () => {
      const target = { a: 1, b: 2, c: 3 };
      const source = { b: null, c: undefined } as any;
      const result = deepMerge(target, source as any);
      
      expect(result).toEqual({ a: 1, b: null, c: undefined });
    });

    it('should prevent prototype pollution', () => {
      const maliciousPayload = {
        '__proto__': { polluted: true },
        'constructor': { polluted: true },
        'prototype': { polluted: true }
      } as any;
      
      const target = { safe: true };
      const result = deepMerge(target, maliciousPayload as any);
      
      // Check that prototype wasn't polluted
      expect(({} as any).polluted).toBeUndefined();
      expect(Object.prototype.hasOwnProperty('polluted')).toBe(false);
      expect(result).toEqual({ safe: true }); // Dangerous keys ignored
    });

    it('should ignore inherited properties', () => {
      const parent = { inherited: true };
      const source = Object.create(parent);
      source.own = true;
      
      const target = { existing: true };
      const result = deepMerge(target, source);
      
      expect(result).toEqual({ existing: true, own: true });
      expect(result.hasOwnProperty('inherited')).toBe(false);
    });

    it('should handle deeply nested objects', () => {
      const target = {
        level1: {
          level2: {
            level3: {
              value: 'original'
            }
          }
        }
      };
      
      const source = {
        level1: {
          level2: {
            level3: {
              value: 'updated',
              newValue: 'added'
            }
          }
        }
      };
      
      const result = deepMerge(target, source);
      expect(result.level1.level2.level3).toEqual({
        value: 'updated',
        newValue: 'added'
      });
    });

    it('should handle mixed types correctly', () => {
      const target = {
        str: 'string',
        num: 42,
        bool: true,
        obj: { nested: true }
      };
      
      const source = {
        str: 123, // Type change
        num: 'string', // Type change
        bool: false,
        obj: 'not an object' // Type change
      } as any;
      
      const result = deepMerge(target, source as any);
      expect(result).toEqual({
        str: 123,
        num: 'string',
        bool: false,
        obj: 'not an object'
      });
    });
  });

  describe('deepFreeze', () => {
    it('should freeze simple objects', () => {
      const obj = { a: 1, b: 2 };
      const frozen = deepFreeze(obj);
      
      expect(frozen).toBe(obj); // Same reference
      expect(Object.isFrozen(frozen)).toBe(true);
      
      // Attempt to modify should fail silently in non-strict mode
      expect(() => {
        'use strict';
        (frozen as any).a = 10;
      }).toThrow();
    });

    it('should freeze nested objects', () => {
      const obj = {
        level1: {
          level2: {
            value: 'test'
          }
        }
      };
      
      const frozen = deepFreeze(obj);
      
      expect(Object.isFrozen(frozen)).toBe(true);
      expect(Object.isFrozen(frozen.level1)).toBe(true);
      expect(Object.isFrozen(frozen.level1.level2)).toBe(true);
    });

    it('should freeze arrays', () => {
      const obj = {
        arr: [1, 2, { nested: true }]
      };
      
      const frozen = deepFreeze(obj);
      
      expect(Object.isFrozen(frozen)).toBe(true);
      expect(Object.isFrozen(frozen.arr)).toBe(true);
      expect(Object.isFrozen(frozen.arr[2])).toBe(true);
    });

    it('should handle already frozen objects', () => {
      const obj = Object.freeze({ a: 1 });
      const result = deepFreeze(obj);
      
      expect(result).toBe(obj);
      expect(Object.isFrozen(result)).toBe(true);
    });

    it('should handle null and primitives', () => {
      expect(deepFreeze(null)).toBe(null);
      expect(deepFreeze(undefined)).toBe(undefined);
      expect(deepFreeze(42)).toBe(42);
      expect(deepFreeze('string')).toBe('string');
      expect(deepFreeze(true)).toBe(true);
    });

    it('should freeze functions', () => {
      const obj = {
        fn: function() { return 42; }
      };
      
      const frozen = deepFreeze(obj);
      
      expect(Object.isFrozen(frozen)).toBe(true);
      expect(Object.isFrozen(frozen.fn)).toBe(true);
      expect(frozen.fn()).toBe(42); // Still callable
    });

    it('should handle circular references', () => {
      const obj: any = { a: 1 };
      obj.circular = obj; // Create circular reference
      
      // deepFreeze should handle this without infinite recursion
      const frozen = deepFreeze(obj);
      
      expect(Object.isFrozen(frozen)).toBe(true);
      expect(frozen.circular).toBe(frozen);
    });
  });

  describe('Integration Tests', () => {
    it('should work together for safe object merging', () => {
      const baseConfig = deepFreeze({
        api: {
          url: 'https://api.example.com',
          timeout: 5000
        },
        features: {
          auth: true,
          logging: true
        }
      });
      
      const userConfig = {
        api: {
          timeout: 10000
        },
        features: {
          logging: false,
          analytics: true
        }
      } as any;
      
      const merged = deepMerge(baseConfig, userConfig as any);
      
      expect(merged).toEqual({
        api: {
          url: 'https://api.example.com',
          timeout: 10000
        },
        features: {
          auth: true,
          logging: false,
          analytics: true
        }
      });
      
      // Original should be unchanged (frozen)
      expect(baseConfig.api.timeout).toBe(5000);
    });

    it('should prevent prototype pollution in real scenario', () => {
      const userInput = JSON.parse('{"__proto__": {"isAdmin": true}, "name": "hacker"}');
      const defaults = { name: 'guest', role: 'user' };
      
      const result = deepMerge(defaults, userInput);
      
      // Check that prototype wasn't polluted
      const testObj = {};
      expect((testObj as any).isAdmin).toBeUndefined();
      expect(result).toEqual({ name: 'hacker', role: 'user' });
    });
  });
});