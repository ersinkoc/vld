/**
 * Tests for VldLazy validator
 * Tests recursive and self-referencing schemas
 */

import { v } from '../../src';

describe('VldLazy', () => {
  describe('recursive object schema', () => {
    it('should validate simple recursive structure', () => {
      let CategorySchema: any;
      CategorySchema = v.object({
        name: v.string(),
        subcategories: v.array(v.lazy(() => CategorySchema)).default([])
      });

      const validData = {
        name: 'Electronics',
        subcategories: [
          { name: 'Computers', subcategories: [] },
          {
            name: 'Phones',
            subcategories: [
              { name: 'iPhone', subcategories: [] }
            ]
          }
        ]
      };

      const result = CategorySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Electronics');
        expect(result.data.subcategories).toHaveLength(2);
      }
    });

    it('should reject invalid nested structure', () => {
      let CategorySchema: any;
      CategorySchema = v.object({
        name: v.string(),
        subcategories: v.array(v.lazy(() => CategorySchema)).default([])
      });

      const invalidData = {
        name: 'Category',
        subcategories: [
          { name: 123, subcategories: [] } // invalid: name should be string
        ]
      };

      const result = CategorySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should handle deep nesting', () => {
      let CategorySchema: any;
      CategorySchema = v.object({
        name: v.string(),
        subcategories: v.array(v.lazy(() => CategorySchema)).default([])
      });

      const deepData = {
        name: 'Level 1',
        subcategories: [
          {
            name: 'Level 2',
            subcategories: [
              {
                name: 'Level 3',
                subcategories: [
                  { name: 'Level 4', subcategories: [] }
                ]
              }
            ]
          }
        ]
      };

      const result = CategorySchema.safeParse(deepData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.subcategories[0].subcategories[0].name).toBe('Level 3');
      }
    });
  });

  describe('tree structure', () => {
    it('should validate binary tree structure', () => {
      let TreeNodeSchema: any;
      TreeNodeSchema = v.object({
        value: v.number(),
        left: v.nullable(v.lazy(() => TreeNodeSchema)),
        right: v.nullable(v.lazy(() => TreeNodeSchema))
      });

      const tree = {
        value: 1,
        left: {
          value: 2,
          left: { value: 4, left: null, right: null },
          right: { value: 5, left: null, right: null }
        },
        right: {
          value: 3,
          left: null,
          right: { value: 6, left: null, right: null }
        }
      };

      const result = TreeNodeSchema.safeParse(tree);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.value).toBe(1);
        expect(result.data.left?.value).toBe(2);
        expect(result.data.right?.right?.value).toBe(6);
      }
    });

    it('should accept null leaves', () => {
      let TreeNodeSchema: any;
      TreeNodeSchema = v.object({
        value: v.number(),
        left: v.nullable(v.lazy(() => TreeNodeSchema)),
        right: v.nullable(v.lazy(() => TreeNodeSchema))
      });

      const leafNode = {
        value: 42,
        left: null,
        right: null
      };

      const result = TreeNodeSchema.safeParse(leafNode);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.left).toBe(null);
        expect(result.data.right).toBe(null);
      }
    });
  });

  describe('linked list', () => {
    it('should validate linked list structure', () => {
      let ListNodeSchema: any;
      ListNodeSchema = v.object({
        value: v.string(),
        next: v.nullable(v.lazy(() => ListNodeSchema))
      });

      const list = {
        value: 'first',
        next: {
          value: 'second',
          next: {
            value: 'third',
            next: null
          }
        }
      };

      const result = ListNodeSchema.safeParse(list);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.value).toBe('first');
        expect(result.data.next?.value).toBe('second');
        expect(result.data.next?.next?.value).toBe('third');
        expect(result.data.next?.next?.next).toBe(null);
      }
    });
  });

  describe('unwrap', () => {
    it('should return the inner schema', () => {
      let recursiveSchema: any;
      recursiveSchema = v.object({
        value: v.number(),
        nested: v.lazy(() => recursiveSchema).optional()
      });

      const lazySchema = v.lazy(() => recursiveSchema);
      const unwrapped = lazySchema.unwrap();

      expect(unwrapped).toBe(recursiveSchema);
    });
  });

  describe('circular references', () => {
    it('should handle mutually recursive types', () => {
      let PersonSchema: any;
      PersonSchema = v.object({
        name: v.string(),
        friends: v.array(v.lazy(() => PersonSchema)).default([])
      });

      // Simple case without cycles should work
      const simpleData = {
        name: 'Charlie',
        friends: [
          { name: 'Diana', friends: [] }
        ]
      };

      const result = PersonSchema.safeParse(simpleData);
      expect(result.success).toBe(true);
    });
  });

  describe('error messages', () => {
    it('should provide proper error messages for nested validation failures', () => {
      let CategorySchema: any;
      CategorySchema = v.object({
        name: v.string(),
        subcategories: v.array(v.lazy(() => CategorySchema)).default([])
      });

      const invalidData = {
        name: 'Valid',
        subcategories: [
          {
            name: 'Also Valid',
            subcategories: [
              { name: 999, subcategories: [] } // Invalid: name should be string
            ]
          }
        ]
      };

      const result = CategorySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBeDefined();
      }
    });
  });
});
