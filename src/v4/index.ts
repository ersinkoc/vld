export * from '../index';
export { default } from '../index';
import type { VldBase } from '../validators/base';

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

// A function default is a per-parse factory (VldDefault calls it on every
// parse), not a value to compute once when the schema is built.
export const _default = <TInput, TOutput>(
  schema: VldBase<TInput, TOutput>,
  defaultValue: TOutput | (() => TOutput)
) => schema.default(defaultValue);
