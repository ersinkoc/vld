/**
 * ZodError compatibility layer.
 *
 * Converts a VldError into a ZodError-shaped object so VLD can be a true
 * drop-in replacement for Zod. The result has the same `issues` shape
 * and `format()` / `flatten()` helpers that Zod users expect.
 *
 * @example
 *   const r = v.object({ a: v.string() }).safeParse({ a: 1 });
 *   if (!r.success) {
 *     const zErr = toZodError(r.error);
 *     console.log(zErr.issues[0].expected); // "string"
 *     console.log(zErr.format());
 *   }
 */

export interface ZodLikeIssue {
  /** The validator that failed: 'string', 'number', 'object', etc. */
  origin?: string;
  /** Discriminator code: 'invalid_type', 'too_small', 'invalid_format', etc. */
  code: string;
  /** Path to the failing field. */
  path: (string | number)[];
  /** Human-readable error message. */
  message: string;
  /** The expected value/type, when applicable. */
  expected?: string | number | boolean | null;
  /** The actual value/type that was received, when applicable. */
  received?: unknown;
  /** For numeric bounds. */
  minimum?: number;
  maximum?: number;
  inclusive?: boolean;
  /** For string length / array length bounds. */
  format?: string;
  pattern?: string;
  /** Allow additional fields. */
  [key: string]: unknown;
}

export class ZodLikeError extends Error {
  /** Array of individual issue descriptors. */
  readonly issues: ReadonlyArray<ZodLikeIssue>;
  /** Top-level error code (VLD-specific; Zod doesn't have this). */
  readonly code: string = 'VLD_VALIDATION_ERROR';

  constructor(issues: ReadonlyArray<ZodLikeIssue>) {
    // Zod serializes issues as JSON inside the message; match that for parity.
    super(JSON.stringify(issues, null, 2));
    this.name = 'ZodError';
    this.issues = issues;
  }

  /**
   * Zod-compatible `format()` method. Returns a nested error tree
   * keyed by path. For backward compatibility with Zod, the default
   * format() returns `_errors: string[]` and any nested fields.
   */
  format(): Record<string, any> {
    const result: Record<string, any> = { _errors: [] as string[] };
    for (const issue of this.issues) {
      const path = issue.path;
      if (path.length === 0) {
        (result as any)['_errors'].push(issue.message);
        continue;
      }
      let node: any = result;
      for (let i = 0; i < path.length - 1; i++) {
        const key = String(path[i]);
        if (!(key in node)) node[key] = { _errors: [] as string[] };
        node = node[key];
      }
      const last = String(path[path.length - 1]);
      if (!(last in node)) node[last] = { _errors: [] as string[] };
      (node[last]._errors as string[]).push(issue.message);
    }
    return result;
  }

  /**
   * Zod-compatible `flatten()` method. Returns `{ formErrors: string[],
   * fieldErrors: Record<string, string[]> }`.
   */
  flatten(): { formErrors: string[]; fieldErrors: Record<string, string[]> } {
    const formErrors: string[] = [];
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of this.issues) {
      if (issue.path.length === 0) {
        formErrors.push(issue.message);
        continue;
      }
      const key = String(issue.path[0]);
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(issue.message);
    }
    return { formErrors, fieldErrors };
  }

  /** Zod-compatible `errors` getter (alias of `issues`). */
  get errors(): ReadonlyArray<ZodLikeIssue> { return this.issues; }
}

/**
 * Convert a VldError to a ZodError-shaped error.
 *
 * The returned ZodLikeError has the same `issues` array shape, plus
 * `format()` and `flatten()` helpers that Zod users expect.
 */
export function toZodError(vldError: any): ZodLikeError {
  const issues: ZodLikeIssue[] = [];
  const rawIssues: any[] = vldError?.issues ?? [];

  for (const raw of rawIssues) {
    const issue: ZodLikeIssue = {
      code: raw.code ?? 'custom',
      path: Array.isArray(raw.path) ? raw.path : [],
      message: raw.message ?? 'Invalid value',
    };
    if (raw.expected !== undefined) issue.expected = raw.expected;
    if (raw.received !== undefined) issue.received = raw.received;
    if (raw.minimum !== undefined) issue.minimum = raw.minimum;
    if (raw.maximum !== undefined) issue.maximum = raw.maximum;
    if (raw.inclusive !== undefined) issue.inclusive = raw.inclusive;
    if (raw.origin) issue.origin = raw.origin;
    if (raw.format) issue.format = raw.format;
    if (raw.pattern) issue.pattern = raw.pattern;
    // Zod-compat defaults: fill in expected/received from context
    if (issue.expected === undefined) {
      if (issue.code === 'invalid_type' || issue.code === 'invalid_value' || issue.code === 'invalid_literal') {
        issue.expected = raw.origin ?? 'unknown';
      }
      if (issue.code === 'invalid_string' && raw.validation) {
        issue.expected = raw.validation;
      }
    }
    if (issue.received === undefined && issue.code === 'invalid_type') {
      issue.received = typeof raw.received === 'string' ? raw.received : (raw.expected ? 'unknown' : undefined);
    }
    issues.push(issue);
  }
  return new ZodLikeError(issues);
}

/**
 * Convenience: convert a safeParse result to a Zod-shaped result.
 * If `result.success === false`, the `error` field will be a ZodLikeError
 * instead of the raw VldError. Otherwise the result is unchanged.
 */
export function toZodSafeResult<T>(result: { success: boolean; data?: T; error?: any }):
  | { success: true; data: T }
  | { success: false; error: ZodLikeError } {
  if (result.success) return { success: true, data: result.data as T };
  return { success: false, error: toZodError(result.error) };
}
