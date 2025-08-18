import { v } from '../src';

describe('Security Tests', () => {
  describe('Prototype Pollution Protection', () => {
    it('should prevent prototype pollution via __proto__ in passthrough mode', () => {
      const schema = v.object({
        name: v.string()
      }).passthrough();

      const maliciousInput = {
        name: 'test',
        __proto__: { polluted: true }
      };

      const result = schema.parse(maliciousInput);
      
      // The __proto__ should not be set to the malicious value
      expect(result).toEqual({ name: 'test' });
      expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
      
      // Check that Object prototype wasn't polluted
      const testObj = {};
      expect((testObj as any).polluted).toBeUndefined();
    });

    it('should prevent prototype pollution via constructor in passthrough mode', () => {
      const schema = v.object({
        name: v.string()
      }).passthrough();

      const maliciousInput = {
        name: 'test',
        constructor: { prototype: { polluted: true } }
      };

      const result = schema.parse(maliciousInput);
      
      // The constructor should not be overwritten
      expect(result).toEqual({ name: 'test' });
      expect(result.constructor).toBe(Object);
    });

    it('should prevent prototype pollution via prototype in passthrough mode', () => {
      const schema = v.object({
        name: v.string()
      }).passthrough();

      const maliciousInput = {
        name: 'test',
        prototype: { polluted: true }
      };

      const result = schema.parse(maliciousInput);
      
      // The prototype key should not be copied to the result
      expect(result).not.toHaveProperty('prototype');
      expect(result).toEqual({ name: 'test' });
    });

    it('should allow normal properties in passthrough mode', () => {
      const schema = v.object({
        name: v.string()
      }).passthrough();

      const input = {
        name: 'test',
        age: 25,
        email: 'test@example.com',
        metadata: { foo: 'bar' }
      };

      const result = schema.parse(input);
      
      // All normal properties should be preserved
      expect(result).toEqual({
        name: 'test',
        age: 25,
        email: 'test@example.com',
        metadata: { foo: 'bar' }
      });
    });

    it('should also protect safeParse from prototype pollution', () => {
      const schema = v.object({
        name: v.string()
      }).passthrough();

      const maliciousInput = {
        name: 'test',
        __proto__: { polluted: true },
        constructor: { prototype: { polluted2: true } },
        prototype: { polluted3: true }
      };

      const result = schema.safeParse(maliciousInput);
      
      expect(result.success).toBe(true);
      if (result.success) {
        // Dangerous properties should not be copied
        expect(result.data).toEqual({ name: 'test' });
        expect(Object.getPrototypeOf(result.data)).toBe(Object.prototype);
        expect(result.data.constructor).toBe(Object);
      }

      // Verify no pollution occurred
      const testObj = {};
      expect((testObj as any).polluted).toBeUndefined();
      expect((testObj as any).polluted2).toBeUndefined();
      expect((testObj as any).polluted3).toBeUndefined();
    });
  });

  describe('URL Regex Fix', () => {
    it('should validate URLs with + character correctly', () => {
      const schema = v.string().url();
      
      // URLs with + should be valid
      const validUrls = [
        'https://example.com/path+with+plus',
        'https://api.example.com/v1/users+data',
        'http://test.com?param=value+with+plus'
      ];

      validUrls.forEach(url => {
        expect(() => schema.parse(url)).not.toThrow();
      });
    });

    it('should validate coerced string URLs with + character', () => {
      const schema = v.coerce.string().url();
      
      // These should coerce to string then validate as URL
      expect(() => schema.parse('https://example.com/test+plus')).not.toThrow();
    });
  });
});