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

  const vStr = validator.toString();

  // Check for specific validator types
  if (vStr.includes('VldString')) {
    return '(.+)';
  }
  if (vStr.includes('VldNumber')) {
    return '(-?\\d+(?:\\.\\d+)?)';
  }
  if (vStr.includes('VldBigInt')) {
    return '(-?\\d+)';
  }
  if (vStr.includes('VldBoolean')) {
    return '(true|false)';
  }
  if (vStr.includes('VldNull')) {
    return '(null)';
  }
  if (vStr.includes('VldUndefined')) {
    return '(undefined)';
  }
  if (vStr.includes('VldLiteral')) {
    // Extract literal value from validator
    const match = vStr.match(/value:\s*['"`]([^'"`]+)['"`]/);
    if (match) {
      return '(' + match[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')';
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
