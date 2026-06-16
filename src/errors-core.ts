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

  return result;
}

export class VldError extends Error {
  public readonly issues: VldIssue[];

  constructor(issues: VldIssue[]) {
    const firstIssue = issues[0];
    const message =
      issues.length === 1 && firstIssue !== undefined
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

  get formattedErrors(): string[] {
    return this.issues.map((issue) => issue.message);
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
