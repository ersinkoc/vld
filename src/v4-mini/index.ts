export * from '../index';
export { default } from '../index';
export {
  ZodAny as ZodMiniAny,
  ZodArray as ZodMiniArray,
  ZodBase64 as ZodMiniBase64,
  ZodBase64URL as ZodMiniBase64URL,
  ZodBigInt as ZodMiniBigInt,
  ZodBigIntFormat as ZodMiniBigIntFormat,
  ZodBoolean as ZodMiniBoolean,
  ZodBranded as ZodMiniBrand,
  ZodCIDRv4 as ZodMiniCIDRv4,
  ZodCIDRv6 as ZodMiniCIDRv6,
  ZodCUID as ZodMiniCUID,
  ZodCUID2 as ZodMiniCUID2,
  ZodCatch as ZodMiniCatch,
  ZodCodec as ZodMiniCodec,
  ZodCreditCard as ZodMiniCreditCard,
  ZodCustom as ZodMiniCustom,
  ZodCustomStringFormat as ZodMiniCustomStringFormat,
  ZodDate as ZodMiniDate,
  ZodDefault as ZodMiniDefault,
  ZodDiscriminatedUnion as ZodMiniDiscriminatedUnion,
  ZodE164 as ZodMiniE164,
  ZodEmail as ZodMiniEmail,
  ZodEmoji as ZodMiniEmoji,
  ZodEnum as ZodMiniEnum,
  ZodExactOptional as ZodMiniExactOptional,
  ZodFile as ZodMiniFile,
  ZodFunction as ZodMiniFunction,
  ZodGUID as ZodMiniGUID,
  ZodIBAN as ZodMiniIBAN,
  ZodIPv4 as ZodMiniIPv4,
  ZodIPv6 as ZodMiniIPv6,
  ZodISODate as ZodMiniISODate,
  ZodISODateTime as ZodMiniISODateTime,
  ZodISODuration as ZodMiniISODuration,
  ZodISOTime as ZodMiniISOTime,
  ZodIntersection as ZodMiniIntersection,
  ZodJWT as ZodMiniJWT,
  ZodKSUID as ZodMiniKSUID,
  ZodLazy as ZodMiniLazy,
  ZodLiteral as ZodMiniLiteral,
  ZodMAC as ZodMiniMAC,
  ZodMap as ZodMiniMap,
  ZodNaN as ZodMiniNaN,
  ZodNanoID as ZodMiniNanoID,
  ZodNever as ZodMiniNever,
  ZodNonOptional as ZodMiniNonOptional,
  ZodNull as ZodMiniNull,
  ZodNullable as ZodMiniNullable,
  ZodNumber as ZodMiniNumber,
  ZodNumberFormat as ZodMiniNumberFormat,
  ZodObject as ZodMiniObject,
  ZodOptional as ZodMiniOptional,
  ZodPipe as ZodMiniPipe,
  ZodPrefault as ZodMiniPrefault,
  ZodPromise as ZodMiniPromise,
  ZodReadonly as ZodMiniReadonly,
  ZodRecord as ZodMiniRecord,
  ZodSet as ZodMiniSet,
  ZodString as ZodMiniString,
  ZodStringFormat as ZodMiniStringFormat,
  ZodSuccess as ZodMiniSuccess,
  ZodSymbol as ZodMiniSymbol,
  ZodTemplateLiteral as ZodMiniTemplateLiteral,
  ZodTransform as ZodMiniTransform,
  ZodTuple as ZodMiniTuple,
  ZodType as ZodMiniType,
  ZodULID as ZodMiniULID,
  ZodURL as ZodMiniURL,
  ZodUUID as ZodMiniUUID,
  ZodUndefined as ZodMiniUndefined,
  ZodUnion as ZodMiniUnion,
  ZodUnknown as ZodMiniUnknown,
  ZodVoid as ZodMiniVoid,
  ZodXID as ZodMiniXID,
  ZodXor as ZodMiniXor
} from '../index';

import type { VldBase } from '../validators/base';
import type { VldObject } from '../validators/object';
import { number as numberFactory, bigint as bigintFactory, date as dateFactory } from '../index';

type ObjectShape = Record<string, VldBase<any, any>>;
type ObjectMask = Record<string, boolean>;
type ConstraintParam = string | { message?: string; error?: string };

function maskKeys(mask: ObjectMask, schema?: VldObject<any>): string[] {
  const keys = Object.keys(mask).filter((key) => mask[key]);
  // Like Zod, a mask key that is not in the shape is a programming error
  // (typically a typo), not something to ignore silently.
  if (schema) {
    for (const key of keys) {
      if (!Object.prototype.hasOwnProperty.call(schema.shape, key)) {
        throw new Error(`Unrecognized key: "${key}"`);
      }
    }
  }
  return keys;
}

/** A Zod numeric bound (number | bigint | Date) as a standalone schema. */
function boundSchema(value: number | bigint | Date, kind: 'min' | 'max', message: string | undefined): VldBase<unknown, any> {
  if (typeof value === 'bigint') return bigintFactory()[kind](value, message);
  if (value instanceof Date) return dateFactory()[kind](value, message);
  return numberFactory()[kind](value, message);
}

function constraintMessage(params: ConstraintParam | undefined): string | undefined {
  return typeof params === 'string' ? params : params?.message || params?.error;
}

export const pick = <T extends Record<string, any>>(schema: VldObject<T>, mask: ObjectMask): VldObject<any> =>
  schema.pick(...maskKeys(mask, schema) as Array<keyof T>);

export const omit = <T extends Record<string, any>>(schema: VldObject<T>, mask: ObjectMask): VldObject<any> =>
  schema.omit(...maskKeys(mask, schema) as Array<keyof T>);

// With a mask, only the masked keys change (Zod's partial/required(schema, mask)).
export const partial = <T extends Record<string, any>>(schema: VldObject<T>, mask?: ObjectMask): VldObject<any> =>
  mask ? schema.extend(schema.pick(...maskKeys(mask, schema) as Array<keyof T>).partial().shape as any) : schema.partial();

export const required = <T extends Record<string, any>>(schema: VldObject<T>, mask?: ObjectMask): VldObject<any> =>
  mask ? schema.extend(schema.pick(...maskKeys(mask, schema) as Array<keyof T>).required().shape as any) : schema.required();

export const extend = <T extends Record<string, any>>(schema: VldObject<T>, shape: ObjectShape): VldObject<any> =>
  schema.extend(shape as any);

export const safeExtend = <T extends Record<string, any>>(schema: VldObject<T>, shape: ObjectShape): VldObject<any> =>
  schema.safeExtend(shape as any);

export const merge = <T extends Record<string, any>, U extends Record<string, any>>(
  schema: VldObject<T>,
  other: VldObject<U> | ObjectShape
): VldObject<any> => other && typeof (other as VldObject<U>).parse === 'function'
  ? schema.merge(other as VldObject<U>)
  : schema.extend(other as ObjectShape);

export const catchall = <T extends Record<string, any>>(
  schema: VldObject<T>,
  catchallSchema: VldBase<any, any>
): VldObject<any> => schema.catchall(catchallSchema);

// A function default is a per-parse factory (VldDefault calls it on every
// parse), not a value to compute once when the schema is built.
export const _default = <TInput, TOutput>(
  schema: VldBase<TInput, TOutput>,
  defaultValue: TOutput | (() => TOutput)
) => schema.default(defaultValue);

export const minimum = (value: number | bigint | Date, params?: ConstraintParam): VldBase<unknown, any> =>
  boundSchema(value, 'min', constraintMessage(params));

export const maximum = (value: number | bigint | Date, params?: ConstraintParam): VldBase<unknown, any> =>
  boundSchema(value, 'max', constraintMessage(params));

// Zod 4.5 AOT compilation parity (Zod Mini exposes compile/validate)
export {
  compile,
  validate,
  validateAsync,
  properties,
  getDiscriminatedOption,
  memoizer,
  toZod,
  ZodCompileError,
  ZodCompileAsyncError,
  ZodCompileUnsupportedError
} from '../compile';

export const exactPartial = <T extends Record<string, any>>(schema: VldObject<T>): VldObject<any> => schema.exactPartial();
