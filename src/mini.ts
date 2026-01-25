/**
 * VLD Mini - Tree-Shakable Functional API
 *
 * This module provides a functional, tree-shakable alternative to the main `v` object.
 * Use this when bundle size is critical.
 *
 * @example
 * ```typescript
 * import { string, number, object, optional } from '@oxog/vld/mini';
 *
 * const schema = object({
 *   name: string().min(1),
 *   age: optional(number().int())
 * });
 * ```
 */

// ============================================
// Base Types & Classes
// ============================================

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
  VldPreprocess,
  SuperRefineContext,
  VldSuperRefine
} from './validators/base';

// ============================================
// Validator Classes (for advanced usage)
// ============================================

export { VldString } from './validators/string';
export { VldNumber } from './validators/number';
export { VldBoolean } from './validators/boolean';
export { VldDate } from './validators/date';
export { VldBigInt } from './validators/bigint';
export { VldSymbol } from './validators/symbol';
export { VldStringBool } from './validators/string-bool';
export { VldArray } from './validators/array';
export { VldObject } from './validators/object';
export { VldTuple } from './validators/tuple';
export { VldRecord } from './validators/record';
export { VldSet } from './validators/set';
export { VldMap } from './validators/map';
export { VldUnion } from './validators/union';
export { VldIntersection } from './validators/intersection';
export { VldLiteral } from './validators/literal';
export { VldEnum } from './validators/enum';
export { VldAny } from './validators/any';
export { VldUnknown } from './validators/unknown';
export { VldVoid } from './validators/void';
export { VldNever } from './validators/never';
export { VldNull } from './validators/null';
export { VldUndefined } from './validators/undefined';
export { VldNan } from './validators/nan';
export { VldLazy } from './validators/lazy';
export { VldDiscriminatedUnion } from './validators/discriminated-union';
export { VldXor } from './validators/xor';
export { VldJson } from './validators/json';

// ============================================
// Type Inference Helpers
// ============================================

import type { VldBase } from './validators/base';

/** Infer the output type of a validator */
export type Infer<T extends VldBase<any, any>> = T extends VldBase<any, infer U> ? U : never;

/** Infer the input type of a validator */
export type Input<T extends VldBase<any, any>> = T extends VldBase<infer I, any> ? I : never;

/** Infer the output type of a validator (alias for Infer) */
export type Output<T extends VldBase<any, any>> = Infer<T>;

// ============================================
// Factory Functions (Tree-Shakable)
// ============================================

import { VldString } from './validators/string';
import { VldNumber } from './validators/number';
import { VldBoolean } from './validators/boolean';
import { VldDate } from './validators/date';
import { VldBigInt } from './validators/bigint';
import { VldSymbol } from './validators/symbol';
import { VldStringBool } from './validators/string-bool';
import { VldArray } from './validators/array';
import { VldObject } from './validators/object';
import { VldTuple } from './validators/tuple';
import { VldRecord } from './validators/record';
import { VldSet } from './validators/set';
import { VldMap } from './validators/map';
import { VldUnion } from './validators/union';
import { VldIntersection } from './validators/intersection';
import { VldLiteral } from './validators/literal';
import { VldEnum } from './validators/enum';
import { VldAny } from './validators/any';
import { VldUnknown } from './validators/unknown';
import { VldVoid } from './validators/void';
import { VldNever } from './validators/never';
import { VldNull } from './validators/null';
import { VldUndefined } from './validators/undefined';
import { VldNan } from './validators/nan';
import { VldLazy } from './validators/lazy';
import { VldDiscriminatedUnion } from './validators/discriminated-union';
import { VldXor } from './validators/xor';
import { VldJson } from './validators/json';
import { VldOptional, VldNullable, VldNullish, VldPreprocess } from './validators/base';

// --- Primitive Validators ---

/** Create a string validator */
export const string = () => VldString.create();

/** Create a number validator */
export const number = () => VldNumber.create();

/** Create an integer validator */
export const int = () => VldNumber.create().int();

/** Create an int32 validator (-2147483648 to 2147483647) */
export const int32 = () => VldNumber.create().int().min(-2147483648).max(2147483647);

/** Create a boolean validator */
export const boolean = () => VldBoolean.create();

/** Create a date validator */
export const date = () => VldDate.create();

/** Create a bigint validator */
export const bigint = () => VldBigInt.create();

/** Create a symbol validator */
export const symbol = () => VldSymbol.create();

/** Create a string-to-boolean validator */
export const stringbool = (options?: { truthy?: readonly string[]; falsy?: readonly string[]; caseSensitive?: boolean }) =>
  VldStringBool.create(options);

// --- Complex Validators ---

/** Create an array validator */
export const array = <T>(item: VldBase<unknown, T>) => VldArray.create(item);

/** Create an object validator */
export const object = <T extends Record<string, any>>(shape: { [K in keyof T]: VldBase<unknown, T[K]> }) =>
  VldObject.create(shape);

/** Create a strict object validator (no extra keys allowed) */
export const strictObject = <T extends Record<string, any>>(shape: { [K in keyof T]: VldBase<unknown, T[K]> }) =>
  VldObject.create(shape).strict();

/** Create a loose object validator (extra keys passed through) */
export const looseObject = <T extends Record<string, any>>(shape: { [K in keyof T]: VldBase<unknown, T[K]> }) =>
  VldObject.create(shape).passthrough();

/** Create a tuple validator */
export const tuple = <T extends readonly VldBase<any, any>[]>(...items: T) => VldTuple.create(...items);

/** Create a record validator */
export const record = <T>(value: VldBase<unknown, T>) => VldRecord.create(value);

/** Create a partial record validator */
export const partialRecord = <T>(value: VldBase<unknown, T>) => VldRecord.create(value).partial();

/** Create a loose record validator */
export const looseRecord = <T>(value: VldBase<unknown, T>) => VldRecord.create(value).loose();

/** Create a set validator */
export const set = <T>(item: VldBase<unknown, T>) => VldSet.create(item);

/** Create a map validator */
export const map = <K, V>(key: VldBase<unknown, K>, value: VldBase<unknown, V>) => VldMap.create(key, value);

// --- Union & Intersection ---

/** Create a union validator (value must match one of the validators) */
export const union = <T extends readonly VldBase<any, any>[]>(...validators: T) =>
  VldUnion.create(...validators);

/** Create an intersection validator (value must match both validators) */
export const intersection = <A, B>(first: VldBase<unknown, A>, second: VldBase<unknown, B>) =>
  VldIntersection.create(first, second);

/** Create a discriminated union validator */
export const discriminatedUnion = <K extends string, T extends readonly VldBase<any, any>[]>(
  discriminator: K,
  ...options: T
) => VldDiscriminatedUnion.create(discriminator, [...options] as any);

/** Create an XOR validator (value must match exactly one of the validators) */
export const xor = <T extends readonly VldBase<any, any>[]>(...options: T) =>
  VldXor.create([...options] as any);

// --- Literal & Enum ---

/** Create a literal validator */
export const literal = <T extends string | number | boolean | null | undefined>(value: T) =>
  VldLiteral.create(value);

/** Create an enum validator */
export const enumValidator = <T extends readonly [string, ...string[]]>(...values: T) => VldEnum.create(values as any);

// --- Special Validators ---

/** Create a validator that accepts any value */
export const any = () => VldAny.create();

/** Create a validator that accepts unknown values */
export const unknown = () => VldUnknown.create();

/** Create a void validator */
export const voidValidator = () => VldVoid.create();

/** Create a never validator (always fails) */
export const never = () => VldNever.create();

/** Create a null validator */
export const nullValidator = () => VldNull.create();

/** Create an undefined validator */
export const undefinedValidator = () => VldUndefined.create();

/** Create a NaN validator */
export const nan = () => VldNan.create();

// --- Utility Validators ---

/** Create a lazy validator for recursive schemas */
export const lazy = <T>(schemaGetter: () => VldBase<unknown, T>) => VldLazy.create(schemaGetter);

/** Create a JSON validator */
export const json = <T = unknown>(schema?: VldBase<unknown, T>) => VldJson.create(schema);

// ============================================
// Utility Functions (Wrappers)
// ============================================

/** Make a validator optional (allows undefined) */
export const optional = <TInput, TOutput>(validator: VldBase<TInput, TOutput>) =>
  VldOptional.create(validator);

/** Make a validator nullable (allows null) */
export const nullable = <TInput, TOutput>(validator: VldBase<TInput, TOutput>) =>
  VldNullable.create(validator);

/** Make a validator nullish (allows null or undefined) */
export const nullish = <TInput, TOutput>(validator: VldBase<TInput, TOutput>) =>
  VldNullish.create(validator);

/** Preprocess input before validation */
export const preprocess = <TInput, TOutput>(
  preprocessor: (input: unknown) => unknown,
  schema: VldBase<TInput, TOutput>
) => VldPreprocess.create(preprocessor, schema);

// ============================================
// Coercion Validators
// ============================================

import { VldCoerceString } from './coercion/string';
import { VldCoerceNumber } from './coercion/number';
import { VldCoerceBoolean } from './coercion/boolean';
import { VldCoerceDate } from './coercion/date';
import { VldCoerceBigInt } from './coercion/bigint';

/** Coercion validators - convert values to target type before validation */
export const coerce = {
  /** Coerce to string */
  string: () => VldCoerceString.create(),
  /** Coerce to number */
  number: () => VldCoerceNumber.create(),
  /** Coerce to boolean */
  boolean: () => VldCoerceBoolean.create(),
  /** Coerce to date */
  date: () => VldCoerceDate.create(),
  /** Coerce to bigint */
  bigint: () => VldCoerceBigInt.create(),
};

// ============================================
// NEVER Constant (for transforms)
// ============================================

/** NEVER constant for use in transforms - Zod 4 API parity */
export const NEVER = VldNever.create();
