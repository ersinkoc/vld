export * from '../index';
export { default } from '../index';

import { v } from '../index';
import type { VldBase } from '../validators/base';

// Legacy Zod 3 convenience factories, layered over VLD without replacing its
// existing v3 entry-point exports.
export const ostring = () => v.string().optional();
export const onumber = () => v.number().optional();
export const oboolean = () => v.boolean().optional();
export const pipeline = <I, M, O>(input: VldBase<I, M>, output: VldBase<M, O>) => input.pipe(output);
export const late = {
  object: <T extends Record<string, VldBase<any, any>>>(shape: () => T) =>
    v.lazy(() => v.object(shape()))
};
