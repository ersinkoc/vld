import { VldBase, ParseResult, VLD_VALIDATOR_TYPES, ensureVldError, VldOptional, VldNullable, VldNullish } from './base';
import { getMessages } from '../locales/runtime';
import { VldError, createInvalidTypeIssue, getTypeName } from '../errors-core';
import { VldString } from './string';
import { VldLiteral } from './literal';
import { VldEnum } from './enum';
import { VldUnion } from './union';

function escapeForPattern(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Template literal component types
 */
type TLComponent = VldBase<any, any> | string | number | boolean | null | undefined | readonly TLComponent[];

/**
 * Immutable template literal validator
 * Validates strings matching a template pattern
 */
export class VldTemplateLiteral extends VldBase<unknown, string> {
  private constructor(
    private readonly pattern: RegExp
  ) {
    super(VLD_VALIDATOR_TYPES.TEMPLATE_LITERAL);
  }

  /**
   * Create a template literal validator from components
   */
  static create(...components: TLComponent[]): VldTemplateLiteral {
    // Zod's form passes the parts as one array: templateLiteral(['id-', z.number()]).
    const parts: unknown[] = components.length === 1 && Array.isArray(components[0]) ? components[0] : components;

    // Build regex pattern from components (no `s` flag needed: string parts use [\s\S])
    let pattern = '^';

    for (const comp of parts as TLComponent[]) {
      if (typeof comp !== 'object' || comp === null) {
        // Literal part (string, number, boolean, null, undefined): escape regex characters
        pattern += String(comp).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      } else {
        // Add appropriate pattern based on validator type
        pattern += getPatternForValidator(comp as VldBase<any, any>);
      }
    }

    pattern += '$';

    return new VldTemplateLiteral(new RegExp(pattern));
  }

  /**
   * Parse and validate a template literal string
   */
  parse(value: unknown): string {
    if (typeof value !== 'string') {
      throw new VldError([createInvalidTypeIssue('string', getTypeName(value), getMessages().invalidString)]);
    }

    if (!this.pattern.test(value)) {
      throw new VldError([{ code: 'invalid_format', path: [], format: 'template_literal', pattern: this.pattern.source, message: getMessages().stringPatternInvalid }]);
    }

    return value;
  }

  /**
   * Safely parse and validate a template literal string
   */
  safeParse(value: unknown): ParseResult<string> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return {
        success: false,
        error: ensureVldError(error)
      };
    }
  }
}

/**
 * Get regex pattern for a validator type
 */
function getPatternForValidator(validator: VldBase<any, any>): string {
  // For template literals, we need to identify the validator type
  // and return an appropriate capture group pattern.
  // Value sets (literal / enum / union) and string length bounds are encoded
  // as Zod does; otherwise "purple-car" would match `${'red' | 'blue'}-car`.
  if ((validator instanceof VldLiteral && !validator.values.includes(undefined as never)) || validator instanceof VldEnum) {
    return '(' + [...validator.values].map(v => escapeForPattern(String(v))).join('|') + ')';
  }
  if (validator instanceof VldUnion) {
    return '(' + validator.options.map((option: VldBase<any, any>) => getPatternForValidator(option)).join('|') + ')';
  }
  if (validator instanceof VldOptional) {
    return '(' + getPatternForValidator((validator as any).baseValidator) + ')?';
  }
  if (validator instanceof VldNullable || validator instanceof VldNullish) {
    return '(' + getPatternForValidator((validator as any).baseValidator) + '|null)' + (validator instanceof VldNullish ? '?' : '');
  }
  if (validator instanceof VldString) {
    // Non-empty unless min(0) is explicit; [\s\S] also matches newlines.
    return '([\\s\\S]{' + (validator.minLength ?? 1) + ',' + (validator.maxLength ?? '') + '})';
  }

  switch (validator.validatorType) {
    case VLD_VALIDATOR_TYPES.STRING:
    case VLD_VALIDATOR_TYPES.STRING_FORMAT:
      return '([\\s\\S]+)';
    case VLD_VALIDATOR_TYPES.NUMBER:
    case VLD_VALIDATOR_TYPES.COERCE_NUMBER:
      return '(-?\\d+(?:\\.\\d+)?)';
    case VLD_VALIDATOR_TYPES.BIGINT:
    case VLD_VALIDATOR_TYPES.COERCE_BIGINT:
      return '(-?\\d+)';
    case VLD_VALIDATOR_TYPES.BOOLEAN:
    case VLD_VALIDATOR_TYPES.COERCE_BOOLEAN:
      return '(true|false)';
    case VLD_VALIDATOR_TYPES.NULL:
      return '(null)';
    case VLD_VALIDATOR_TYPES.UNDEFINED:
    case VLD_VALIDATOR_TYPES.VOID:
      return '(undefined)';
  }

  // Default: match any non-empty string
  return '([\\s\\S]+)';
}

/**
 * Helper function to create template literal validators
 * Usage: v.templateLiteral(v.string(), '-', v.number())
 */
export function templateLiteral(...components: TLComponent[]): VldTemplateLiteral {
  return VldTemplateLiteral.create(...components);
}
