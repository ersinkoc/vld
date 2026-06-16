import { VldBase, ParseResult, VLD_VALIDATOR_TYPES } from './base';
import { getMessages } from '../locales/runtime';

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
  private readonly truthyValues: readonly string[];
  private readonly falsyValues: readonly string[];
  private readonly normalizedTruthySet: ReadonlySet<string>;
  private readonly normalizedFalsySet: ReadonlySet<string>;
  private readonly validValuesText: string;

  private constructor(
    private readonly options: StringBoolOptions
  ) {
    super(VLD_VALIDATOR_TYPES.STRING_BOOL);
    this.truthyValues = options.truthy ?? DEFAULT_TRUTHY;
    this.falsyValues = options.falsy ?? DEFAULT_FALSY;
    const normalizedTruthy = this.normalizeValues(this.truthyValues);
    const normalizedFalsy = this.normalizeValues(this.falsyValues);
    this.normalizedTruthySet = new Set(normalizedTruthy);
    this.normalizedFalsySet = new Set(normalizedFalsy);
    this.validValuesText = [...normalizedTruthy, ...normalizedFalsy].join(', ');
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

  private normalizeValues(values: readonly string[]): readonly string[] {
    if (this.options.caseSensitive) {
      return values;
    }
    return values.map(value => value.toLowerCase());
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

    // Check if value is in truthy set
    if (this.normalizedTruthySet.has(normalized)) {
      return true;
    }

    // Check if value is in falsy set
    if (this.normalizedFalsySet.has(normalized)) {
      return false;
    }

    // Value is not recognized
    throw new Error(
      getMessages().stringBoolExpected(
        this.validValuesText,
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
