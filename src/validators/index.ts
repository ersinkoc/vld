/**
 * Main entry point for all validators
 */

// Export base types and classes
export { 
  VldBase, 
  ParseResult,
  VldRefine,
  VldTransform,
  VldDefault,
  VldCatch,
  VldOptional,
  VldNullable,
  VldNullish
} from './base';

// Export primitive validators
export { VldString } from './string';
export { VldNumber } from './number';
export { VldBoolean } from './boolean';
export { VldDate } from './date';

// Export complex validators
export { VldArray } from './array';
export { VldObject } from './object';

// Export utility validators (to be implemented)
export { VldUnion } from './union';
export { VldIntersection } from './intersection';
export { VldLiteral } from './literal';
export { VldEnum } from './enum';
export { VldTuple } from './tuple';
export { VldRecord } from './record';
export { VldSet } from './set';
export { VldMap } from './map';
export { VldBigInt } from './bigint';
export { VldSymbol } from './symbol';

// Export special validators
export { VldAny } from './any';
export { VldUnknown } from './unknown';
export { VldVoid } from './void';
export { VldNever } from './never';

// Import base for type inference
import { VldBase } from './base';

// Type inference helper
export type Infer<T extends VldBase<any, any>> = T extends VldBase<any, infer U> ? U : never;