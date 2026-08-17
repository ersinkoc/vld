export type VldErrorCode =
  | 'invalid_type'
  | 'invalid_string'
  | 'string_too_small'
  | 'string_too_big'
  | 'invalid_email'
  | 'invalid_url'
  | 'invalid_uuid'
  | 'invalid_regex'
  | 'invalid_format'
  | 'invalid_number'
  | 'too_small'
  | 'too_big'
  | 'not_integer'
  | 'not_finite'
  | 'not_safe'
  | 'not_multiple_of'
  | 'invalid_boolean'
  | 'invalid_date'
  | 'invalid_array'
  | 'invalid_object'
  | 'unrecognized_keys'
  | 'invalid_union'
  | 'invalid_key'
  | 'invalid_element'
  | 'invalid_literal'
  | 'invalid_value'
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
  origin?: string;
  format?: string;
  values?: unknown[];
  pattern?: string;
}

/**
 * Map a JavaScript value to Zod 4's type name for `invalid_type` issues.
 * Produces strings like 'string', 'number', 'boolean', 'undefined', 'null',
 * 'array', 'bigint', 'symbol', 'date', 'map', 'set', 'function', 'nan',
 * 'Infinity', '-Infinity', 'object'.
 */
export function getTypeName(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'number') {
    if (Number.isNaN(value)) return 'nan';
    if (value === Infinity) return 'Infinity';
    if (value === -Infinity) return '-Infinity';
    return 'number';
  }
  if (value instanceof Date) return 'date';
  if (value instanceof Map) return 'map';
  if (value instanceof Set) return 'set';
  return typeof value;
}

/**
 * Build a Zod 4-compatible `invalid_type` issue.
 */
export function createInvalidTypeIssue(expected: string, received: string, message?: string): VldIssue {
  return {
    code: 'invalid_type',
    path: [],
    expected,
    received,
    message: message ?? `Invalid input: expected ${expected}, received ${received}`,
  };
}

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
    origin?: string;
    format?: string;
    values?: unknown[];
    pattern?: string;
  }>;
}

type VldIssueJSON = VldErrorJSON['issues'][number];

function serializeIssue(issue: VldIssue): VldIssueJSON {
  const result: VldIssueJSON = {
    code: issue.code,
    path: issue.path,
    message: issue.message
  };

  if (issue.expected !== undefined) result.expected = issue.expected;
  if (issue.received !== undefined) result.received = issue.received;
  if (issue.keys !== undefined) result.keys = issue.keys;
  if (issue.minimum !== undefined) result.minimum = issue.minimum;
  if (issue.maximum !== undefined) result.maximum = issue.maximum;
  if (issue.exact !== undefined) result.exact = issue.exact;
  if (issue.inclusive !== undefined) result.inclusive = issue.inclusive;
  if (issue.origin !== undefined) result.origin = issue.origin;
  if (issue.format !== undefined) result.format = issue.format;
  if (issue.values !== undefined) result.values = issue.values;
  if (issue.pattern !== undefined) result.pattern = issue.pattern;

  return result;
}

function deserializeIssue(issue: VldIssueJSON): VldIssue {
  const result: VldIssue = {
    code: issue.code as VldErrorCode,
    path: issue.path,
    message: issue.message
  };

  if (issue.expected !== undefined) result.expected = issue.expected;
  if (issue.received !== undefined) result.received = issue.received;
  if (issue.keys !== undefined) result.keys = issue.keys;
  if (issue.minimum !== undefined) result.minimum = issue.minimum;
  if (issue.maximum !== undefined) result.maximum = issue.maximum;
  if (issue.exact !== undefined) result.exact = issue.exact;
  if (issue.inclusive !== undefined) result.inclusive = issue.inclusive;
  if (issue.origin !== undefined) result.origin = issue.origin;
  if (issue.format !== undefined) result.format = issue.format;
  if (issue.values !== undefined) result.values = issue.values;
  if (issue.pattern !== undefined) result.pattern = issue.pattern;

  return result;
}

export class VldError extends Error {
  public readonly issues: VldIssue[];

  constructor(issues: VldIssue[], customMessage?: string) {
    const firstIssue = issues[0];
    const message =
      customMessage !== undefined
        ? customMessage
        : issues.length === 1 && firstIssue !== undefined
          ? firstIssue.message
          : `${issues.length} validation errors`;

    super(message);
    this.name = 'VldError';
    this.issues = issues;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, VldError);
    }
  }

  get firstError(): VldIssue | undefined {
    return this.issues[0];
  }

  get errors(): VldIssue[] {
    return this.issues;
  }

  get isEmpty(): boolean {
    return this.issues.length === 0;
  }

  get formattedErrors(): string[] {
    return this.issues.map((issue) => issue.message);
  }

  addIssue(issue: VldIssue): void {
    this.issues.push(issue);
  }

  addIssues(issues: VldIssue[] = []): void {
    this.issues.push(...issues);
  }

  format(): Record<string, any> {
    const result: any = { _errors: [] };
    for (const issue of this.issues) {
      if (!issue.path || issue.path.length === 0) {
        result._errors.push(issue.message);
      } else {
        let curr = result;
        for (const key of issue.path) {
          if (!curr[key]) {
            curr[key] = { _errors: [] };
          }
          curr = curr[key];
        }
        curr._errors.push(issue.message);
      }
    }
    return result;
  }

  flatten<U = string>(mapper?: (issue: VldIssue) => U): {
    formErrors: U[];
    fieldErrors: { [k: string]: U[] };
  } {
    const mapFn = mapper ?? ((i: VldIssue) => i.message as unknown as U);
    const formErrors: U[] = [];
    const fieldErrors: { [k: string]: U[] } = {};
    for (const issue of this.issues) {
      if (!issue.path || issue.path.length === 0) {
        formErrors.push(mapFn(issue));
      } else {
        const key = String(issue.path[0]);
        fieldErrors[key] = fieldErrors[key] ?? [];
        fieldErrors[key].push(mapFn(issue));
      }
    }
    return { formErrors, fieldErrors };
  }

  toJSON(): VldErrorJSON {
    return {
      name: this.name,
      message: this.message,
      code: 'VLD_VALIDATION_ERROR',
      issues: this.issues.map(serializeIssue)
    };
  }

  static fromJSON(json: VldErrorJSON): VldError {
    const issues: VldIssue[] = json.issues.map(deserializeIssue);
    return new VldError(issues);
  }

  static isVldError(value: unknown): value is VldError {
    return value instanceof VldError;
  }
}
