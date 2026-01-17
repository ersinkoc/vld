/**
 * Coverage tests for VldLazy validator
 * These tests target specific uncovered lines in lazy.ts
 */

import { v } from '../../src';

describe('VldLazy Coverage Tests', () => {
  describe('parse() method', () => {
    it('should call parse on the inner schema', () => {
      // Define a recursive type using lazy
      interface TreeNode {
        value: string;
        children?: TreeNode[];
      }

      // Use 'any' for the recursive reference
      const treeSchema: any = v.lazy(() =>
        v.object({
          value: v.string(),
          children: v.array(treeSchema).optional()
        })
      );

      // Test parse (not safeParse)
      const result = treeSchema.parse({
        value: 'root',
        children: [
          { value: 'child1' },
          { value: 'child2', children: [{ value: 'grandchild' }] }
        ]
      }) as TreeNode;

      expect(result.value).toBe('root');
      expect(result.children?.length).toBe(2);
    });

    it('should throw on invalid input via parse', () => {
      const schema = v.lazy(() => v.string());

      expect(() => schema.parse(123)).toThrow();
    });
  });

  describe('unwrap() method', () => {
    it('should return the inner schema', () => {
      const innerSchema = v.string();
      const lazySchema = v.lazy(() => innerSchema);

      const unwrapped = lazySchema.unwrap();

      // Should work like the original schema
      expect(unwrapped.safeParse('test').success).toBe(true);
      expect(unwrapped.safeParse(123).success).toBe(false);
    });
  });

  describe('safeParse() method', () => {
    it('should delegate to inner schema safeParse', () => {
      const schema = v.lazy(() => v.number().positive());

      expect(schema.safeParse(5).success).toBe(true);
      expect(schema.safeParse(-5).success).toBe(false);
    });
  });
});
