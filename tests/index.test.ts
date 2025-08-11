import { v, VldBase, setLocale, getLocale, getMessages, VldError, treeifyError, prettifyError, flattenError } from '../src/index';

describe('index.ts - Main API Coverage', () => {
  describe('Main v API object', () => {
    it('should export all primitive validators', () => {
      expect(v.string).toBeDefined();
      expect(v.number).toBeDefined();
      expect(v.boolean).toBeDefined();
      expect(v.date).toBeDefined();
      
      // Test that they create validators
      const str = v.string();
      const num = v.number();
      const bool = v.boolean();
      const date = v.date();
      
      expect(str.parse('hello')).toBe('hello');
      expect(num.parse(123)).toBe(123);
      expect(bool.parse(true)).toBe(true);
      expect(date.parse(new Date('2024-01-01'))).toEqual(new Date('2024-01-01'));
    });
    
    it('should export complex validators', () => {
      expect(v.array).toBeDefined();
      expect(v.object).toBeDefined();
      expect(v.union).toBeDefined();
      expect(v.literal).toBeDefined();
      
      // Test array
      const arr = v.array(v.string());
      expect(arr.parse(['a', 'b'])).toEqual(['a', 'b']);
      
      // Test object
      const obj = v.object({
        name: v.string(),
        age: v.number()
      });
      expect(obj.parse({ name: 'John', age: 30 })).toEqual({ name: 'John', age: 30 });
      
      // Test union
      const union = v.union(v.string(), v.number());
      expect(union.parse('hello')).toBe('hello');
      expect(union.parse(123)).toBe(123);
      
      // Test literal
      const lit = v.literal('hello');
      expect(lit.parse('hello')).toBe('hello');
    });
    
    it('should export coerce API', () => {
      expect(v.coerce).toBeDefined();
      expect(v.coerce.string).toBeDefined();
      expect(v.coerce.number).toBeDefined();
      expect(v.coerce.boolean).toBeDefined();
      expect(v.coerce.date).toBeDefined();
      expect(v.coerce.bigint).toBeDefined();
      
      // Test coerce validators
      const str = v.coerce.string();
      const num = v.coerce.number();
      const bool = v.coerce.boolean();
      const date = v.coerce.date();
      const bigint = v.coerce.bigint();
      
      expect(str.parse(123)).toBe('123');
      expect(num.parse('123')).toBe(123);
      expect(bool.parse('true')).toBe(true);
      expect(date.parse('2024-01-01')).toEqual(new Date('2024-01-01'));
      expect(bigint.parse('123')).toBe(123n);
    });
  });
  
  describe('Re-exported base classes', () => {
    it('should export VldBase', () => {
      expect(VldBase).toBeDefined();
      
      // VldBase is abstract, but we can check it exists
      expect(typeof VldBase).toBe('function');
    });
  });
  
  describe('Re-exported locale functionality', () => {
    it('should export locale functions', () => {
      expect(setLocale).toBeDefined();
      expect(getLocale).toBeDefined();
      expect(getMessages).toBeDefined();
      
      // Test locale functions
      const originalLocale = getLocale();
      setLocale('es');
      expect(getLocale()).toBe('es');
      
      const messages = getMessages();
      expect(messages).toBeDefined();
      expect(messages.invalidString).toBeDefined();
      
      // Restore locale
      setLocale(originalLocale);
    });
  });
  
  describe('Re-exported error formatting utilities', () => {
    it('should export error utilities', () => {
      expect(VldError).toBeDefined();
      expect(treeifyError).toBeDefined();
      expect(prettifyError).toBeDefined();
      expect(flattenError).toBeDefined();
      
      // Test VldError
      const error = new VldError([
        { code: 'invalid_string', message: 'Invalid string', path: ['field'] }
      ]);
      expect(error.issues).toHaveLength(1);
      
      // Test treeifyError
      const tree = treeifyError(error);
      expect(tree).toBeDefined();
      
      // Test prettifyError
      const pretty = prettifyError(error);
      expect(pretty).toContain('field');
      
      // Test flattenError
      const flat = flattenError(error);
      expect(flat.fieldErrors).toBeDefined();
    });
  });
  
  describe('Default export', () => {
    it('should have default export for backward compatibility', async () => {
      const module = await import('../src/index');
      expect(module.default).toBe(v);
    });
  });
});