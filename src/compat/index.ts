/**
 * VLD Compatibility Layer
 *
 * This module provides internal implementations of @oxog ecosystem features
 * that can be replaced with actual @oxog packages when available.
 *
 * Features:
 * - Result pattern (@oxog/types compatibility)
 * - Event emitter (@oxog/emitter compatibility)
 */

// Result pattern exports (Ok and Err are both types and values)
export type { Result, VldResult } from './result';

export {
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
  fromNullable,
  ResultUtils
} from './result';

// Event emitter type exports
export type { EventMap, EventHandler, ListenerOptions, Emitter, VldEventHandler } from './emitter';

// Event emitter value exports
export { createEmitter, createEventBus, withEmitter } from './emitter';
