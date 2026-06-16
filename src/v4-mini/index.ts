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
import { number as numberFactory } from '../index';

type ObjectShape = Record<string, VldBase<any, any>>;
type ObjectMask = Record<string, boolean>;
type ConstraintParam = string | { message?: string; error?: string };

function maskKeys(mask: ObjectMask): string[] {
  return Object.keys(mask).filter((key) => mask[key]);
}

function constraintMessage(params: ConstraintParam | undefined): string | undefined {
  return typeof params === 'string' ? params : params?.message || params?.error;
}

export const pick = <T extends Record<string, any>>(schema: VldObject<T>, mask: ObjectMask): VldObject<any> =>
  schema.pick(...maskKeys(mask) as Array<keyof T>);

export const omit = <T extends Record<string, any>>(schema: VldObject<T>, mask: ObjectMask): VldObject<any> =>
  schema.omit(...maskKeys(mask) as Array<keyof T>);

export const partial = <T extends Record<string, any>>(schema: VldObject<T>): VldObject<any> => schema.partial();

export const required = <T extends Record<string, any>>(schema: VldObject<T>): VldObject<any> => schema.required();

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

export const _default = <TInput, TOutput>(
  schema: VldBase<TInput, TOutput>,
  defaultValue: TOutput | (() => TOutput)
) => schema.default(typeof defaultValue === 'function' ? (defaultValue as () => TOutput)() : defaultValue);

export const minimum = (value: number, params?: ConstraintParam): VldBase<unknown, number> => {
  const message = constraintMessage(params);
  return numberFactory().min(value, message);
};

export const maximum = (value: number, params?: ConstraintParam): VldBase<unknown, number> => {
  const message = constraintMessage(params);
  return numberFactory().max(value, message);
};
