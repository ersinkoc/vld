// VLD Error System - Advanced error formatting and utilities

import { type Theme, vldTheme } from './pigment';
export { VldError } from './errors-core';
export type { VldErrorCode, VldErrorJSON, VldIssue } from './errors-core';
import { VldError, getOwnKey, setOwnKey, expandNestedIssues, type VldErrorCode, type VldIssue } from './errors-core';

// Error tree structure for nested validation
export interface VldErrorTree {
  errors: string[];
  properties?: Record<string, VldErrorTree>;
  items?: (VldErrorTree | undefined)[];
}

// Flattened error structure for simple forms
export interface VldFlattenedError {
  formErrors: string[];
  fieldErrors: Record<string, string[]>;
}

/**
 * Convert VldError to a nested tree structure
 */
export function treeifyError(error: VldError): VldErrorTree {
  const tree: VldErrorTree = { errors: [] };

  for (const issue of expandNestedIssues(error.issues)) {
    let currentNode = tree;
    const path = issue.path;

    // Navigate to the correct position in the tree
    for (let i = 0; i < path.length; i++) {
      const segment = path[i]!;
      const isLast = i === path.length - 1;

      if (typeof segment === 'string') {
        // Object property (Zod: only string segments become properties)
        if (!currentNode.properties) {
          currentNode.properties = {};
        }

        const child = getOwnKey<VldErrorTree>(currentNode.properties, segment)
          ?? setOwnKey<VldErrorTree>(currentNode.properties, segment, { errors: [] });

        if (isLast) {
          child.errors.push(issue.message);
        } else {
          currentNode = child;
        }
      } else {
        // Zod: every non-string segment (number, symbol) lands in items; a
        // symbol becomes a symbol-keyed property of the array, invisible to
        // JSON.stringify exactly like Zod's tree.
        if (!currentNode.items) {
          currentNode.items = [];
        }

        if (typeof segment === 'number') {
          while (currentNode.items.length <= segment) {
            currentNode.items.push(undefined);
          }
        }

        if (!getOwnKey<VldErrorTree>(currentNode.items as unknown as object, segment)) {
          setOwnKey(currentNode.items as unknown as object, segment, { errors: [] });
        }
        const child = getOwnKey<VldErrorTree>(currentNode.items as unknown as object, segment)!;

        if (isLast) {
          child.errors.push(issue.message);
        } else {
          currentNode = child;
        }
      }
    }

    // If path is empty, add to root errors
    if (path.length === 0) {
      tree.errors.push(issue.message);
    }
  }

  return tree;
}

/**
 * Prettify error options
 */
export interface PrettifyOptions {
  /** Enable colored output */
  colored?: boolean;
  /** Custom theme for colors */
  theme?: Theme;
  /** Include error code in output */
  includeCode?: boolean;
  /** Include expected/received values */
  includeDetails?: boolean;
}

/**
 * Convert VldError to human-readable string
 */
export function prettifyError(error: VldError, options: PrettifyOptions = {}): string {
  const { colored = true, theme = vldTheme, includeCode = false, includeDetails = false } =
    options;

  const lines: string[] = [];

  // Like Zod, shallow issues print before deeper ones (stable for equal depth).
  const issues = [...error.issues].sort((a, b) => a.path.length - b.path.length);
  for (const issue of issues) {
    // Symbol and message
    const symbol = colored ? theme.symbol('✖') : '✖';
    const message = colored ? theme.error(issue.message) : issue.message;
    let line = `${symbol} ${message}`;

    // Error code
    if (includeCode) {
      const code = colored ? theme.muted(`[${issue.code}]`) : `[${issue.code}]`;
      line += ` ${code}`;
    }

    // Path
    if (issue.path.length > 0) {
      // Zod's toDotPath: identifiers use dot notation; numbers, symbols and
      // keys with other characters use brackets, so distinct paths never
      // render the same (["a.b"] vs ["a","b"]).
      const pathStr = issue.path
        .map((segment: PropertyKey, index) => {
          let str: string;
          if (typeof segment === 'number') {
            str = `[${segment}]`;
          } else if (typeof segment === 'symbol') {
            str = `[${JSON.stringify(String(segment))}]`;
          } else if (/[^\w$]/.test(segment)) {
            str = `[${JSON.stringify(segment)}]`;
          } else {
            str = index === 0 ? segment : `.${segment}`;
          }
          return colored ? theme.path(str) : str;
        })
        .join('');

      const arrow = colored ? theme.muted('→ at ') : '→ at ';
      line += `\n  ${arrow}${pathStr}`;
    }

    // Details
    if (includeDetails) {
      if (issue.expected) {
        const expected = colored
          ? theme.muted('expected: ') + theme.success(issue.expected)
          : `expected: ${issue.expected}`;
        line += `\n  ${expected}`;
      }
      if (issue.received) {
        const received = colored
          ? theme.muted('received: ') + theme.warning(issue.received)
          : `received: ${issue.received}`;
        line += `\n  ${received}`;
      }
    }

    lines.push(line);
  }

  return lines.join('\n');
}

/**
 * Convert VldError to human-readable string with full colors
 * Shorthand for prettifyError with colored: true
 */
export function prettifyErrorColored(error: VldError, options: Omit<PrettifyOptions, 'colored'> = {}): string {
  return prettifyError(error, { ...options, colored: true });
}

/**
 * Convert VldError to plain text string (no colors)
 * Shorthand for prettifyError with colored: false
 */
export function prettifyErrorPlain(error: VldError, options: Omit<PrettifyOptions, 'colored'> = {}): string {
  return prettifyError(error, { ...options, colored: false });
}

/**
 * Flatten VldError for simple form validation
 */
export function flattenError(error: VldError): VldFlattenedError {
  const formErrors: string[] = [];
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    if (issue.path.length === 0) {
      formErrors.push(issue.message);
    } else {
      // Zod keeps the raw segment as the key: a symbol stays a symbol
      // (invisible to JSON.stringify, exactly like Zod's flatten).
      const fieldName = issue.path[0] as PropertyKey;
      (getOwnKey<string[]>(fieldErrors, fieldName) ?? setOwnKey<string[]>(fieldErrors, fieldName, []) as string[]).push(issue.message);
    }
  }

  return { formErrors, fieldErrors };
}

/**
 * Create a validation issue
 */
export function createIssue(
  code: VldErrorCode,
  path: PropertyKey[],
  message: string,
  extra?: Partial<VldIssue>
): VldIssue {
  return {
    code,
    path: [...path],
    message,
    ...extra
  };
}

/**
 * Helper to determine the type of a value for error messages
 */
export function getValueType(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'array';
  if (value instanceof Date) return 'date';
  return typeof value;
}
