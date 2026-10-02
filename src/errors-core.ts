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
  /** Custom data attached via refine(fn, { params }). */
  params?: Record<string, unknown>;
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

/**
 * Own-property lookup for error-formatting accumulators. Issue paths come
 * from user data, so segments like "constructor" or "toString" must not
 * resolve to inherited Object.prototype members.
 * @internal
 */
export function getOwnKey<T>(target: object, key: PropertyKey): T | undefined {
  return Object.prototype.hasOwnProperty.call(target, key) ? (target as any)[key] as T : undefined;
}

/**
 * Create an own data property, so a "__proto__" path segment becomes a key
 * instead of replacing the accumulator's prototype.
 * @internal
 */
export function setOwnKey<T>(target: object, key: PropertyKey, value: T): T {
  Object.defineProperty(target, key, { value, writable: true, enumerable: true, configurable: true });
  return value;
}

/** JSON cannot encode bigint; serialize it as a decimal string like Zod's replacer. */
function jsonSafe<T>(value: T): T {
  return (typeof value === 'bigint' ? value.toString() : value) as T;
}

function serializeIssue(issue: VldIssue): VldIssueJSON {
  const result: VldIssueJSON = {
    code: issue.code,
    path: issue.path,
    message: issue.message
  };

  if (issue.expected !== undefined) result.expected = issue.expected;
  if (issue.received !== undefined) result.received = issue.received;
  if (issue.keys !== undefined) result.keys = issue.keys;
  if (issue.minimum !== undefined) result.minimum = jsonSafe(issue.minimum);
  if (issue.maximum !== undefined) result.maximum = jsonSafe(issue.maximum);
  if (issue.exact !== undefined) result.exact = jsonSafe(issue.exact);
  if (issue.inclusive !== undefined) result.inclusive = issue.inclusive;
  if (issue.origin !== undefined) result.origin = issue.origin;
  if (issue.format !== undefined) result.format = issue.format;
  if (issue.values !== undefined) result.values = issue.values.map(jsonSafe);
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

/**
 * Descend one level of a `format()` tree. A path segment named `_errors`
 * collides with the reserved message list, so its messages land on the
 * current node (matching Zod's formatError output).
 * @internal
 */
export function formatChild(node: Record<PropertyKey, any>, key: PropertyKey): Record<PropertyKey, any> {
  const existing = getOwnKey<any>(node, key);
  if (Array.isArray(existing)) return node;
  return existing ?? setOwnKey(node, key, { _errors: [] });
}

export class VldError extends Error {
  public readonly issues: VldIssue[];
  /** Alias of `issues` (own, non-enumerable; defined in the constructor). */
  declare readonly errors: VldIssue[];
  private _stack: string | undefined;

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
    // Node's util.inspect treats an Error with an array `errors` like an
    // AggregateError and reads its OWN property descriptor; a prototype-only
    // getter made console.log(error) throw. Expose it as an own, hidden alias.
    Object.defineProperty(this, 'errors', { value: issues, enumerable: false, configurable: true, writable: true });

    // Skip stack capture in production for performance. Stack can be captured
    // on demand by setting VLD_CAPTURE_STACK=true or calling captureStack().
    // Each Error.captureStackTrace call costs ~5-10us - significant for
    // high-throughput error paths.
    if ((globalThis as any).VLD_CAPTURE_STACK && Error.captureStackTrace) {
      Error.captureStackTrace(this, VldError);
    }
  }

  /** Force-capture the stack trace on demand. */
  captureStack(): void {
    if (!this._stack && Error.captureStackTrace) {
      Error.captureStackTrace(this, VldError);
      this._stack = this.stack;
    }
  }

  get firstError(): VldIssue | undefined {
    return this.issues[0];
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
          curr = formatChild(curr, key);
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
        (getOwnKey<U[]>(fieldErrors, key) ?? setOwnKey<U[]>(fieldErrors, key, [])).push(mapFn(issue));
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
