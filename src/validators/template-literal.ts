import { VldBase, ParseResult } from './base';
import { getMessages } from '../locales';

/**
 * Template literal component types
 */
type TLComponent = VldBase<any, any> | string;

/**
 * Immutable template literal validator
 * Validates strings matching a template pattern
 */
export class VldTemplateLiteral extends VldBase<unknown, string> {
  private constructor(
    private readonly pattern: RegExp
  ) {
    super();
  }

  /**
   * Create a template literal validator from components
   */
  static create(...components: TLComponent[]): VldTemplateLiteral {
    // Build regex pattern from components
    let pattern = '^';

    for (const comp of components) {
      if (typeof comp === 'string') {
        // Escape special regex characters
        pattern += comp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      } else {
        // Add appropriate pattern based on validator type
        pattern += getPatternForValidator(comp);
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
      throw new Error(getMessages().invalidString);
    }

    if (!this.pattern.test(value)) {
      throw new Error(getMessages().stringPatternInvalid);
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
        error: error as Error
      };
    }
  }
}

/**
 * Get regex pattern for a validator type
 */
function getPatternForValidator(validator: VldBase<any, any>): string {
  // For template literals, we need to identify the validator type
  // and return an appropriate capture group pattern

  const className = validator.constructor.name;

  // Check for specific validator types
  if (className === 'VldString') {
    return '(.+)';
  }
  if (className === 'VldNumber' || className === 'VldInt') {
    return '(-?\\d+(?:\\.\\d+)?)';
  }
  if (className === 'VldBigInt') {
    return '(-?\\d+)';
  }
  if (className === 'VldBoolean') {
    return '(true|false)';
  }
  if (className === 'VldNull') {
    return '(null)';
  }
  if (className === 'VldUndefined' || className === 'VldVoid') {
    return '(undefined)';
  }
  if (className === 'VldLiteral') {
    // Extract literal value - access private literal property via any
    const literalValidator = validator as any;
    if (literalValidator.literal !== undefined) {
      const valueStr = String(literalValidator.literal);
      return '(' + valueStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')';
    }
  }

  // Default: match any string
  return '(.+)';
}

/**
 * Helper function to create template literal validators
 * Usage: v.templateLiteral(v.string(), '-', v.number())
 */
export function templateLiteral(...components: TLComponent[]): VldTemplateLiteral {
  return VldTemplateLiteral.create(...components);
}
