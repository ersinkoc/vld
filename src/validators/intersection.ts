import { VldBase, ParseResult, VLD_VALIDATOR_TYPES } from './base';
import { isPlainObject } from '../utils/deep-merge';
import { isDangerousKey } from '../utils/security';
import { getMessages } from '../locales/runtime';
import { VldError, type VldIssue } from '../errors-core';

/**
 * Merge the two parsed sides of an intersection. Plain objects merge
 * key-by-key and same-length arrays element-by-element (both recursively), so
 * array outputs - always fresh copies - no longer fail an identity check and
 * nested arrays of objects keep the fields of both sides. Equal Dates are one
 * value. Any other conflicting leaf keeps the existing rule: the right side wins.
 */
function mergeIntersection(a: unknown, b: unknown): unknown {
  if (isPlainObject(a) && isPlainObject(b)) {
    const result: Record<string, unknown> = { ...a };
    for (const key of Object.keys(b)) {
      if (isDangerousKey(key)) continue;
      result[key] = Object.prototype.hasOwnProperty.call(a, key) ? mergeIntersection(a[key], b[key]) : b[key];
    }
    return result;
  }
  if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) {
    return a.map((item, index) => mergeIntersection(item, b[index]));
  }
  if (a instanceof Date && b instanceof Date && a.getTime() === b.getTime()) {
    return a;
  }
  return b;
}

/**
 * Combine the outputs of both intersection sides (shared with VldIntersectionV2).
 * @internal
 */
export function intersectResults(resultA: unknown, resultB: unknown): unknown {
  // BUG-NEW-015 FIX: Check type consistency before merging
  const aIsObject = isPlainObject(resultA);
  const bIsObject = isPlainObject(resultB);

  // Both are objects - safe to merge
  if (aIsObject && bIsObject) {
    return mergeIntersection(resultA, resultB);
  }

  // Both are arrays: each side returns its own copy, so compare by content.
  if (Array.isArray(resultA) && Array.isArray(resultB)) {
    if (resultA.length !== resultB.length) {
      throw new Error('Arrays must have the same length for intersection');
    }
    return mergeIntersection(resultA, resultB);
  }

  // Both are Dates: equal instants are the same value.
  if (resultA instanceof Date && resultB instanceof Date && resultA.getTime() === resultB.getTime()) {
    return resultA;
  }

  // Neither are objects - must be identical primitives
  if (!aIsObject && !bIsObject) {
    if ((resultA as any) === (resultB as any)) {
      return resultA;
    }
    throw new Error('Values must be identical for intersection of primitive types');
  }

  // One is object, one is primitive - invalid intersection
  throw new Error(
    'Cannot create intersection of object and primitive types. ' +
    'Both validators must produce the same type category.'
  );
}

/** One parsed side of an intersection; `keys` is set when the side failed only because of unrecognized keys. */
export type IntersectionSide =
  | { readonly ok: true; readonly data: unknown }
  | { readonly ok: false; readonly error: VldError; readonly keys: string[] | undefined };

export function intersectionSide(result: ParseResult<unknown>): IntersectionSide {
  if (result.success) return { ok: true, data: result.data };
  const issues = result.error.issues;
  const onlyUnrecognized = issues.length > 0 && issues.every(issue => issue.code === 'unrecognized_keys' && (issue.path?.length ?? 0) === 0);
  return { ok: false, error: result.error, keys: onlyUnrecognized ? issues.flatMap(issue => (issue as { keys?: string[] }).keys ?? []) : undefined };
}

/**
 * Zod reports an unrecognized key only when BOTH sides reject it, so a key owned by one branch survives the other
 * side's strict object. Returns the keys each failed side must be re-parsed without (undefined when both sides passed),
 * or throws when the intersection really fails.
 * @internal
 */
export function planIntersection(left: IntersectionSide, right: IntersectionSide): { left: string[]; right: string[] } | undefined {
  if (left.ok && right.ok) return undefined;
  if (!left.ok && !left.keys) throw left.error;
  if (!right.ok && !right.keys) throw right.error;
  const rejectedLeft = left.ok ? [] : left.keys!;
  const rejectedRight = right.ok ? [] : right.keys!;
  const both = rejectedLeft.filter(key => rejectedRight.includes(key));
  if (both.length > 0) {
    throw new VldError([{ code: 'unrecognized_keys', path: [], keys: both, message: getMessages().unexpectedKeys(both) } as VldIssue]);
  }
  return { left: rejectedLeft, right: rejectedRight };
}

/** The input without the keys the other side owns. */
export function withoutKeys(value: unknown, keys: readonly string[]): unknown {
  const copy = { ...(value as Record<string, unknown>) };
  for (const key of keys) delete copy[key];
  return copy;
}

/** An error that is only "unrecognized keys at the root" stays a structured error, so an enclosing intersection can reconcile it. */
function isUnrecognizedKeysError(error: unknown): error is VldError {
  if (!(error instanceof VldError)) return false;
  const side = intersectionSide({ success: false, error });
  return !side.ok && side.keys !== undefined;
}

function createIntersectionError(message: string): VldError {
  return new VldError([{ code: 'invalid_type', path: [], message }]);
}

/**
 * Immutable intersection validator for combining validators
 */
export class VldIntersection<A, B> extends VldBase<unknown, A & B> {
  /**
   * Private constructor to enforce immutability
   */
  private constructor(
    private readonly validatorA: VldBase<unknown, A>,
    private readonly validatorB: VldBase<unknown, B>
  ) {
    super(VLD_VALIDATOR_TYPES.INTERSECTION);
  }
  
  /**
   * Create a new intersection validator
   */
  static create<A, B>(
    validatorA: VldBase<unknown, A>,
    validatorB: VldBase<unknown, B>
  ): VldIntersection<A, B> {
    return new VldIntersection(validatorA, validatorB);
  }
  
  /**
   * Parse and validate a value against both validators
   */
  parse(value: unknown): A & B {
    try {
      // Both validators must pass
      const left = intersectionSide(this.validatorA.safeParse(value));
      const right = intersectionSide(this.validatorB.safeParse(value));
      const plan = planIntersection(left, right);
      if (plan === undefined) return intersectResults((left as { data: unknown }).data, (right as { data: unknown }).data) as A & B;
      const resultA = left.ok ? left.data : this.validatorA.parse(withoutKeys(value, plan.left));
      const resultB = right.ok ? right.data : this.validatorB.parse(withoutKeys(value, plan.right));
      return intersectResults(resultA, resultB) as A & B;
    } catch (error) {
      if (isUnrecognizedKeysError(error)) throw error;
      throw new Error(getMessages().intersectionError((error as Error).message));
    }
  }
  
  /** Async parse: both sides run their parseAsync, then the outputs are combined. */
  override async parseAsync(value: unknown): Promise<A & B> {
    try {
      const left = intersectionSide(await this.validatorA.safeParseAsync(value));
      const right = intersectionSide(await this.validatorB.safeParseAsync(value));
      const plan = planIntersection(left, right);
      if (plan === undefined) return intersectResults((left as { data: unknown }).data, (right as { data: unknown }).data) as A & B;
      const resultA = left.ok ? left.data : await this.validatorA.parseAsync(withoutKeys(value, plan.left));
      const resultB = right.ok ? right.data : await this.validatorB.parseAsync(withoutKeys(value, plan.right));
      return intersectResults(resultA, resultB) as A & B;
    } catch (error) {
      if (isUnrecognizedKeysError(error)) throw error;
      throw new Error(getMessages().intersectionError((error as Error).message));
    }
  }

  /**
   * Safely parse and validate a value against both validators
   */
  safeParse(value: unknown): ParseResult<A & B> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      if (isUnrecognizedKeysError(error)) return { success: false, error };
      return { success: false, error: createIntersectionError((error as Error).message) };
    }
  }
}
