// VLD Error System - Advanced error formatting and utilities

import { type Theme, vldTheme } from './pigment';

export type VldErrorCode =
  | 'invalid_type'
  | 'invalid_string'
  | 'string_too_small'
  | 'string_too_big'
  | 'invalid_email'
  | 'invalid_url'
  | 'invalid_uuid'
  | 'invalid_regex'
  | 'invalid_number'
  | 'too_small'
  | 'too_big'
  | 'not_integer'
  | 'not_finite'
  | 'not_safe'
  | 'invalid_boolean'
  | 'invalid_date'
  | 'invalid_array'
  | 'invalid_object'
  | 'unrecognized_keys'
  | 'invalid_union'
  | 'invalid_literal'
  | 'invalid_enum'
  | 'custom';

export interface VldIssue {
  code: VldErrorCode;
  path: (string | number)[];
  message: string;
  expected?: string;
  received?: string;
  keys?: string[];
  minimum?: number;
  maximum?: number;
  exact?: number;
  inclusive?: boolean;
}

export class VldError extends Error {
  public readonly issues: VldIssue[];

  constructor(issues: VldIssue[]) {
    const message =
      issues.length === 1 ? issues[0].message : `${issues.length} validation errors`;

    super(message);
    this.name = 'VldError';
    this.issues = issues;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, VldError);
    }
  }

  get firstError(): VldIssue | undefined {
    return this.issues[0];
  }

  get formattedErrors(): string[] {
    return this.issues.map((issue) => issue.message);
  }

  /**
   * Convert error to JSON representation
   * Compatible with @oxog/types OxogError
   */
  toJSON(): VldErrorJSON {
    return {
      name: this.name,
      message: this.message,
      code: 'VLD_VALIDATION_ERROR',
      issues: this.issues.map((issue) => ({
        code: issue.code,
        path: issue.path,
        message: issue.message,
        expected: issue.expected,
        received: issue.received,
        keys: issue.keys,
        minimum: issue.minimum,
        maximum: issue.maximum,
        exact: issue.exact,
        inclusive: issue.inclusive
      }))
    };
  }

  /**
   * Create VldError from JSON representation
   */
  static fromJSON(json: VldErrorJSON): VldError {
    const issues: VldIssue[] = json.issues.map((issue) => ({
      code: issue.code as VldErrorCode,
      path: issue.path,
      message: issue.message,
      expected: issue.expected,
      received: issue.received,
      keys: issue.keys,
      minimum: issue.minimum,
      maximum: issue.maximum,
      exact: issue.exact,
      inclusive: issue.inclusive
    }));
    return new VldError(issues);
  }

  /**
   * Check if a value is a VldError
   */
  static isVldError(value: unknown): value is VldError {
    return value instanceof VldError;
  }
}

/**
 * JSON representation of VldError
 */
export interface VldErrorJSON {
  name: string;
  message: string;
  code: string;
  issues: Array<{
    code: string;
    path: (string | number)[];
    message: string;
    expected?: string;
    received?: string;
    keys?: string[];
    minimum?: number;
    maximum?: number;
    exact?: number;
    inclusive?: boolean;
  }>;
}

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

  for (const issue of error.issues) {
    let currentNode = tree;
    const path = issue.path;

    // Navigate to the correct position in the tree
    for (let i = 0; i < path.length; i++) {
      const segment = path[i];
      const isLast = i === path.length - 1;

      if (typeof segment === 'string') {
        // Object property
        if (!currentNode.properties) {
          currentNode.properties = {};
        }
        
        if (!currentNode.properties[segment]) {
          currentNode.properties[segment] = { errors: [] };
        }
        
        if (isLast) {
          currentNode.properties[segment].errors.push(issue.message);
        } else {
          currentNode = currentNode.properties[segment];
        }
      } else if (typeof segment === 'number') {
        // Array index
        if (!currentNode.items) {
          currentNode.items = [];
        }
        
        while (currentNode.items.length <= segment) {
          currentNode.items.push(undefined);
        }
        
        if (!currentNode.items[segment]) {
          currentNode.items[segment] = { errors: [] };
        }
        
        if (isLast) {
          currentNode.items[segment]!.errors.push(issue.message);
        } else {
          currentNode = currentNode.items[segment]!;
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

  for (const issue of error.issues) {
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
      const pathStr = issue.path
        .map((segment, index) => {
          if (typeof segment === 'string') {
            const str = index === 0 ? segment : `.${segment}`;
            return colored ? theme.path(str) : str;
          } else {
            const str = `[${segment}]`;
            return colored ? theme.path(str) : str;
          }
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
      const fieldName = issue.path[0].toString();
      if (!fieldErrors[fieldName]) {
        fieldErrors[fieldName] = [];
      }
      fieldErrors[fieldName].push(issue.message);
    }
  }

  return { formErrors, fieldErrors };
}

/**
 * Create a validation issue
 */
export function createIssue(
  code: VldErrorCode,
  path: (string | number)[],
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