import { describe, it, expect } from '@jest/globals';
import { VldError, VldIssue, treeifyError, prettifyError, flattenError, createIssue, getValueType } from '../src/errors';

describe('Error Formatting Tests', () => {
  
  describe('VldError', () => {
    it('should create error with single issue', () => {
      const issue: VldIssue = {
        code: 'invalid_type',
        path: ['username'],
        message: 'Invalid input: expected string, received number',
        expected: 'string',
        received: 'number'
      };

      const error = new VldError([issue]);
      
      expect(error.name).toBe('VldError');
      expect(error.issues).toHaveLength(1);
      expect(error.firstError).toBe(issue);
      expect(error.formattedErrors).toEqual(['Invalid input: expected string, received number']);
    });

    it('should create error with multiple issues', () => {
      const issues: VldIssue[] = [
        {
          code: 'invalid_type',
          path: ['username'],
          message: 'Invalid input: expected string, received number'
        },
        {
          code: 'unrecognized_keys',
          path: [],
          message: 'Unrecognized key: "extraKey"',
          keys: ['extraKey']
        }
      ];

      const error = new VldError(issues);
      
      expect(error.message).toBe('2 validation errors');
      expect(error.issues).toHaveLength(2);
      expect(error.formattedErrors).toHaveLength(2);
    });
  });

  describe('treeifyError', () => {
    it('should convert flat errors to tree structure', () => {
      const issues: VldIssue[] = [
        {
          code: 'invalid_type',
          path: ['username'],
          message: 'Invalid input: expected string, received number'
        },
        {
          code: 'invalid_type',
          path: ['favoriteNumbers', 1],
          message: 'Invalid input: expected number, received string'
        },
        {
          code: 'unrecognized_keys',
          path: [],
          message: 'Unrecognized key: "extraKey"'
        }
      ];

      const error = new VldError(issues);
      const tree = treeifyError(error);

      expect(tree.errors).toEqual(['Unrecognized key: "extraKey"']);
      expect(tree.properties?.username?.errors).toEqual(['Invalid input: expected string, received number']);
      expect(tree.properties?.favoriteNumbers?.items?.[1]?.errors).toEqual(['Invalid input: expected number, received string']);
    });

    it('should handle nested object paths', () => {
      const issues: VldIssue[] = [
        {
          code: 'invalid_type',
          path: ['user', 'profile', 'name'],
          message: 'Name is required'
        }
      ];

      const error = new VldError(issues);
      const tree = treeifyError(error);

      expect(tree.properties?.user?.properties?.profile?.properties?.name?.errors).toEqual(['Name is required']);
    });
  });

  describe('prettifyError', () => {
    it('should format errors with paths nicely', () => {
      const issues: VldIssue[] = [
        {
          code: 'invalid_type',
          path: ['username'],
          message: 'Invalid input: expected string, received number'
        },
        {
          code: 'invalid_type',
          path: ['favoriteNumbers', 1],
          message: 'Invalid input: expected number, received string'
        },
        {
          code: 'unrecognized_keys',
          path: [],
          message: 'Unrecognized key: "extraKey"'
        }
      ];

      const error = new VldError(issues);
      const pretty = prettifyError(error);

      expect(pretty).toContain('✖ Invalid input: expected string, received number');
      expect(pretty).toContain('→ at username');
      expect(pretty).toContain('✖ Invalid input: expected number, received string');
      expect(pretty).toContain('→ at favoriteNumbers[1]');
      expect(pretty).toContain('✖ Unrecognized key: "extraKey"');
    });

    it('should handle complex nested paths', () => {
      const issues: VldIssue[] = [
        {
          code: 'invalid_type',
          path: ['users', 0, 'profile', 'settings', 'theme'],
          message: 'Invalid theme value'
        }
      ];

      const error = new VldError(issues);
      const pretty = prettifyError(error);

      expect(pretty).toContain('✖ Invalid theme value');
      expect(pretty).toContain('→ at users[0].profile.settings.theme');
    });
  });

  describe('flattenError', () => {
    it('should separate form and field errors', () => {
      const issues: VldIssue[] = [
        {
          code: 'invalid_type',
          path: ['username'],
          message: 'Invalid username'
        },
        {
          code: 'invalid_type',
          path: ['email'],
          message: 'Invalid email'
        },
        {
          code: 'unrecognized_keys',
          path: [],
          message: 'Unrecognized key: "extraKey"'
        }
      ];

      const error = new VldError(issues);
      const flattened = flattenError(error);

      expect(flattened.formErrors).toEqual(['Unrecognized key: "extraKey"']);
      expect(flattened.fieldErrors.username).toEqual(['Invalid username']);
      expect(flattened.fieldErrors.email).toEqual(['Invalid email']);
    });

    it('should handle nested field paths', () => {
      const issues: VldIssue[] = [
        {
          code: 'invalid_type',
          path: ['user', 'name'],
          message: 'Name is required'
        },
        {
          code: 'invalid_type',
          path: ['user', 'email'],
          message: 'Email is invalid'
        }
      ];

      const error = new VldError(issues);
      const flattened = flattenError(error);

      expect(flattened.fieldErrors.user).toEqual(['Name is required', 'Email is invalid']);
    });
  });

  describe('createIssue', () => {
    it('should create issue with all properties', () => {
      const issue = createIssue(
        'invalid_type',
        ['username'],
        'Invalid type',
        {
          expected: 'string',
          received: 'number'
        }
      );

      expect(issue.code).toBe('invalid_type');
      expect(issue.path).toEqual(['username']);
      expect(issue.message).toBe('Invalid type');
      expect(issue.expected).toBe('string');
      expect(issue.received).toBe('number');
    });
  });

  describe('Edge Cases', () => {
    it('should handle single error message', () => {
      const issue: VldIssue = {
        code: 'invalid_type',
        path: [],
        message: 'Single error'
      };

      const error = new VldError([issue]);
      expect(error.message).toBe('Single error');
    });

    it('should handle empty arrays in tree structure', () => {
      const issues: VldIssue[] = [
        {
          code: 'invalid_type',
          path: ['items', 0],
          message: 'Invalid item'
        }
      ];

      const error = new VldError(issues);
      const tree = treeifyError(error);

      expect(tree.properties?.items?.items?.[0]?.errors).toEqual(['Invalid item']);
    });

    it('should handle deep nested array paths', () => {
      const issues: VldIssue[] = [
        {
          code: 'invalid_type',
          path: ['items', 0, 1, 2],
          message: 'Deep nested error'
        }
      ];

      const error = new VldError(issues);
      const tree = treeifyError(error);

      expect(tree.properties?.items?.items?.[0]?.items?.[1]?.items?.[2]?.errors).toEqual(['Deep nested error']);
    });

    it('should handle mixed path types', () => {
      const issues: VldIssue[] = [
        {
          code: 'invalid_type',
          path: ['data', 0, 'name'],
          message: 'Invalid name'
        }
      ];

      const error = new VldError(issues);
      const pretty = prettifyError(error);

      expect(pretty).toContain('→ at data[0].name');
    });

    it('should handle no-path errors in prettify', () => {
      const issues: VldIssue[] = [
        {
          code: 'unrecognized_keys',
          path: [],
          message: 'Unrecognized key'
        }
      ];

      const error = new VldError(issues);
      const pretty = prettifyError(error);

      expect(pretty).toBe('✖ Unrecognized key');
      expect(pretty).not.toContain('→ at');
    });
  });

  describe('getValueType', () => {
    it('should identify basic types correctly', () => {
      expect(getValueType(null)).toBe('null');
      expect(getValueType(undefined)).toBe('undefined');
      expect(getValueType([])).toBe('array');
      expect(getValueType(new Date())).toBe('date');
      expect(getValueType('string')).toBe('string');
      expect(getValueType(123)).toBe('number');
      expect(getValueType(true)).toBe('boolean');
      expect(getValueType({})).toBe('object');
      expect(getValueType(() => {})).toBe('function');
    });
  });
});