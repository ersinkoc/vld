/**
 * Result Pattern Implementation
 *
 * This module provides a Result type for functional error handling,
 * compatible with @oxog/types when available.
 */

import type { VldError } from '../errors';

/**
 * Success result type
 */
export interface Ok<T> {
  readonly success: true;
  readonly data: T;
  readonly value: T; // Alias for @oxog/types compatibility
  readonly error?: never;
}

/**
 * Error result type
 */
export interface Err<E = Error> {
  readonly success: false;
  readonly error: E;
  readonly data?: never;
  readonly value?: never;
}

/**
 * Result type - Either success with data or failure with error
 */
export type Result<T, E = Error> = Ok<T> | Err<E>;

/**
 * VLD-specific Result type with VldError
 */
export type VldResult<T> = Result<T, VldError>;

/**
 * Create a success result
 */
export function Ok<T>(data: T): Ok<T> {
  return { success: true, data, value: data };
}

/**
 * Create an error result
 */
export function Err<E = Error>(error: E): Err<E> {
  return { success: false, error };
}

/**
 * Create a success result (alias)
 */
export const success = Ok;

/**
 * Create a failure result (alias)
 */
export const failure = Err;

/**
 * Check if result is Ok
 */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.success === true;
}

/**
 * Check if result is Err
 */
export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return result.success === false;
}

/**
 * Check if value is a Result
 */
export function isResult<T, E>(value: unknown): value is Result<T, E> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    typeof (value as Result<T, E>).success === 'boolean'
  );
}

/**
 * Unwrap a result, throwing the error if it's an Err
 */
export function unwrap<T, E extends Error>(result: Result<T, E>): T {
  if (isOk(result)) {
    return result.data;
  }
  throw result.error;
}

/**
 * Unwrap a result with a default value
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (isOk(result)) {
    return result.data;
  }
  return defaultValue;
}

/**
 * Map over a successful result
 */
export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  if (isOk(result)) {
    return Ok(fn(result.data));
  }
  return result as Err<E>;
}

/**
 * Map over an error result
 */
export function mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  if (isErr(result)) {
    return Err(fn(result.error));
  }
  return result as Ok<T>;
}

/**
 * Chain results (flatMap)
 */
export function flatMap<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  if (isOk(result)) {
    return fn(result.data);
  }
  return result as Err<E>;
}

/**
 * Pattern match on a result
 */
export function match<T, E, U>(
  result: Result<T, E>,
  handlers: {
    ok: (value: T) => U;
    err: (error: E) => U;
  }
): U {
  if (isOk(result)) {
    return handlers.ok(result.data);
  }
  return handlers.err(result.error);
}

/**
 * Try to execute a function and wrap the result
 */
export function tryCatch<T>(fn: () => T): Result<T, Error> {
  try {
    return Ok(fn());
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Try to execute an async function and wrap the result
 */
export async function tryCatchAsync<T>(fn: () => Promise<T>): Promise<Result<T, Error>> {
  try {
    return Ok(await fn());
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Combine multiple results into a single result
 * Returns Ok with array of values if all succeed, Err with first error otherwise
 */
export function all<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const values: T[] = [];

  for (const result of results) {
    if (isErr(result)) {
      return result;
    }
    values.push(result.data);
  }

  return Ok(values);
}

/**
 * Convert a nullable value to a Result
 */
export function fromNullable<T>(
  value: T | null | undefined,
  error: Error = new Error('Value is null or undefined')
): Result<T, Error> {
  if (value === null || value === undefined) {
    return Err(error);
  }
  return Ok(value);
}

/**
 * Result utilities namespace
 */
export const ResultUtils = {
  Ok,
  Err,
  success,
  failure,
  isOk,
  isErr,
  isResult,
  unwrap,
  unwrapOr,
  map,
  mapErr,
  flatMap,
  match,
  tryCatch,
  tryCatchAsync,
  all,
  fromNullable
};
