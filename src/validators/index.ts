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
  VldNullish,
  VldPipe,
  VldReadonly,
  VldBrand,
  SuperRefineContext,
  VldSuperRefine,
  VldPreprocess
} from './base';

// Export primitive validators
export { VldString } from './string';
export { VldNumber } from './number';
export { VldBoolean } from './boolean';
export { VldDate } from './date';
export { VldStringBool } from './string-bool';

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

// Export Zod 4 parity validators
export { VldNull } from './null';
export { VldUndefined } from './undefined';
export { VldNan } from './nan';
export { VldLazy } from './lazy';
export { VldDiscriminatedUnion } from './discriminated-union';
export { VldXor } from './xor';
export { VldJson } from './json';
export { VldTemplateLiteral, templateLiteral } from './template-literal';
export { VldCustom, custom } from './custom';
export type { CustomValidatorOptions } from './custom';
export { VldFile, file } from './file';
export type { VldFileValue } from './file';
export { VldFunction, functionValidator } from './function';

// Export string format validators
export {
  email,
  uuid,
  uuidv4,
  hostname,
  emoji,
  base64,
  base64url,
  hex,
  jwt,
  nanoid,
  cuid,
  cuid2,
  ulid,
  ipv4,
  ipv6,
  mac,
  cidrv4,
  e164,
  hash,
  iso,
  stringFormat,
  regexes
} from './string-formats';

// Import base for type inference
import { VldBase } from './base';

// Type inference helper
export type Infer<T extends VldBase<any, any>> = T extends VldBase<any, infer U> ? U : never;

// Zod 4 API parity - Input and Output type utilities
export type Input<T extends VldBase<any, any>> = T extends VldBase<infer I, any> ? I : never;
export type Output<T extends VldBase<any, any>> = T extends VldBase<any, infer O> ? O : never;