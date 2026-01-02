import { VldBase, ParseResult } from './base';
import { getMessages } from '../locales';

/**
 * Configuration for string boolean validation
 */
export interface StringBoolOptions {
  /** Custom truthy values (default: ['true', '1', 'yes', 'on', 'y', 'enabled']) */
  truthy?: readonly string[];
  /** Custom falsy values (default: ['false', '0', 'no', 'off', 'n', 'disabled']) */
  falsy?: readonly string[];
  /** Whether matching should be case-sensitive (default: false) */
  caseSensitive?: boolean;
}

/**
 * Default truthy and falsy value sets
 */
const DEFAULT_TRUTHY = ['true', '1', 'yes', 'on', 'y', 'enabled'] as const;
const DEFAULT_FALSY = ['false', '0', 'no', 'off', 'n', 'disabled'] as const;

/**
 * Immutable string boolean validator for flexible boolean parsing
 * Supports string representations like "true", "yes", "on", "1", etc.
 */
export class VldStringBool extends VldBase<unknown, boolean> {
  private constructor(
    private readonly options: StringBoolOptions
  ) {
    super();
  }

  /**
   * Create a new string boolean validator
   */
  static create(options: StringBoolOptions = {}): VldStringBool {
    return new VldStringBool(options);
  }

  /**
   * Normalize a string value based on case sensitivity setting
   */
  private normalizeValue(value: string): string {
    return this.options.caseSensitive ? value : value.toLowerCase();
  }

  /**
   * Get the effective truthy values (custom or default)
   */
  private getTruthyValues(): readonly string[] {
    return this.options.truthy ?? DEFAULT_TRUTHY;
  }

  /**
   * Get the effective falsy values (custom or default)
   */
  private getFalsyValues(): readonly string[] {
    return this.options.falsy ?? DEFAULT_FALSY;
  }

  /**
   * Parse and validate a string boolean value
   */
  parse(value: unknown): boolean {
    // First, ensure we have a string
    if (typeof value !== 'string') {
      // Also accept actual boolean values for convenience
      if (typeof value === 'boolean') {
        return value;
      }
      throw new Error(
        getMessages().stringExpected(typeof value, 'string')
      );
    }

    const normalized = this.normalizeValue(value);
    const truthyValues = this.getTruthyValues();
    const falsyValues = this.getFalsyValues();

    // Normalize the value sets for comparison
    const normalizedTruthy = this.options.caseSensitive
      ? truthyValues
      : truthyValues.map(v => v.toLowerCase());

    const normalizedFalsy = this.options.caseSensitive
      ? falsyValues
      : falsyValues.map(v => v.toLowerCase());

    // Check if value is in truthy set
    if (normalizedTruthy.includes(normalized)) {
      return true;
    }

    // Check if value is in falsy set
    if (normalizedFalsy.includes(normalized)) {
      return false;
    }

    // Value is not recognized
    const allValidValues = [...normalizedTruthy, ...normalizedFalsy];
    throw new Error(
      getMessages().stringBoolExpected(
        this.options.caseSensitive ? allValidValues.join(', ') : allValidValues.join(', '),
        value
      )
    );
  }

  /**
   * Safely parse and validate a string boolean value
   */
  safeParse(value: unknown): ParseResult<boolean> {
    try {
      const result = this.parse(value);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error as Error
      };
    }
  }

  /**
   * Create a new validator with custom truthy values
   */
  withTruthy(values: readonly string[]): VldStringBool {
    return new VldStringBool({
      ...this.options,
      truthy: values
    });
  }

  /**
   * Create a new validator with custom falsy values
   */
  withFalsy(values: readonly string[]): VldStringBool {
    return new VldStringBool({
      ...this.options,
      falsy: values
    });
  }

  /**
   * Create a new validator with case-sensitive matching
   */
  caseSensitive(): VldStringBool {
    return new VldStringBool({
      ...this.options,
      caseSensitive: true
    });
  }

  /**
   * Create a new validator with case-insensitive matching (default)
   */
  caseInsensitive(): VldStringBool {
    return new VldStringBool({
      ...this.options,
      caseSensitive: false
    });
  }
}
