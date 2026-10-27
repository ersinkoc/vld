/**
 * `itemShape` lives in its own leaf module so `utils/to-json-schema.ts` can
 * import it without pulling `validators/tuple.ts` (which extends VldBase)
 * into a cycle with `validators/base.ts`.
 */
import { VLD_VALIDATOR_TYPES } from './base';

export interface ItemShape {
  optin: 'optional' | 'defaulted' | undefined;
  optout: boolean;
}

const NO_SHAPE: ItemShape = { optin: undefined, optout: false };

export function itemShape(node: any, staticInput = false): ItemShape {
  // Wrappers form an acyclic chain (schemas are immutable); lazy schemas are not resolved.
  // staticInput: the declared input type (JSON Schema), which looks through catch like Zod's inputOptin.
  // V1 wrappers keep the wrapped schema in baseValidator, V2 wrappers in __def.inner.
  const inner = (): ItemShape => itemShape(node.baseValidator ?? node.__def.inner, staticInput);
  switch (node.validatorType) {
    case VLD_VALIDATOR_TYPES.DEFAULT:
    case VLD_VALIDATOR_TYPES.PREFAULT:
      return { optin: 'defaulted', optout: false };
    case VLD_VALIDATOR_TYPES.OPTIONAL:
    case VLD_VALIDATOR_TYPES.EXACT_OPTIONAL:
    case VLD_VALIDATOR_TYPES.NULLISH:
      return { optin: inner().optin === 'defaulted' ? 'defaulted' : 'optional', optout: true };
    case VLD_VALIDATOR_TYPES.CATCH:
      return staticInput ? inner() : { optin: inner().optin === 'defaulted' ? 'defaulted' : 'optional', optout: inner().optout };
    case VLD_VALIDATOR_TYPES.TRANSFORM:
      return { optin: inner().optin, optout: false };
    case VLD_VALIDATOR_TYPES.NULLABLE:
    case VLD_VALIDATOR_TYPES.READONLY:
    case VLD_VALIDATOR_TYPES.META:
    case VLD_VALIDATOR_TYPES.BRAND:
    case VLD_VALIDATOR_TYPES.REFINE:
      return inner();
    case VLD_VALIDATOR_TYPES.SUPER_REFINE:
      return itemShape(node._inner, staticInput);
    case VLD_VALIDATOR_TYPES.PIPE:
      return { optin: itemShape(node.first, staticInput).optin, optout: itemShape(node.second, staticInput).optout };
    case VLD_VALIDATOR_TYPES.UNION: {
      const options: ItemShape[] = (node.validators ?? node.__def.validators).map((option: unknown) => itemShape(option, staticInput));
      return {
        optin: options.some(option => option.optin === 'defaulted')
          ? 'defaulted'
          : options.some(option => option.optin !== undefined) ? 'optional' : undefined,
        optout: options.some(option => option.optout)
      };
    }
    default:
      return NO_SHAPE;
  }
}
