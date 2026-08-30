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

export const _default = <TInput, TOutput>(
  schema: VldBase<TInput, TOutput>,
  defaultValue: TOutput | (() => TOutput)
) => schema.default(typeof defaultValue === 'function' ? (defaultValue as () => TOutput)() : defaultValue);
