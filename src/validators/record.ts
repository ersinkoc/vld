import { VldBase, ParseResult } from './base';
import { getMessages } from '../locales';
import { isDangerousKey } from '../utils/security';

/**
 * Immutable record validator for key-value pairs
 * BUG-NEW-018 FIX: Uses comprehensive dangerous key protection
 */
export class VldRecord<T> extends VldBase<unknown, Record<string, T>> {
  /**
   * Private constructor to enforce immutability
   */
  protected constructor(
    protected readonly valueValidator: VldBase<unknown, T>,
    private readonly errorMessage?: string
  ) {
    super();
  }
  
  /**
   * Create a new record validator
   */
  static create<T>(valueValidator: VldBase<unknown, T>): VldRecord<T> {
    return new VldRecord(valueValidator);
  }
  
  /**
   * Parse and validate a record value
   * BUG-NEW-018 FIX: Use comprehensive dangerous key protection
   */
  parse(value: unknown): Record<string, T> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new Error(this.errorMessage || getMessages().invalidRecord);
    }

    const result: Record<string, T> = {};
    const obj = value as Record<string, unknown>;

    for (const [key, val] of Object.entries(obj)) {
      // Skip dangerous keys to prevent prototype pollution
      // Now using comprehensive protection from shared utility
      if (isDangerousKey(key)) {
        continue;
      }

      try {
        result[key] = this.valueValidator.parse(val);
      } catch (error) {
        throw new Error(getMessages().objectField(key, (error as Error).message));
      }
    }

    return result;
  }
  
  /**
   * Safely parse and validate a record value
   */
  safeParse(value: unknown): ParseResult<Record<string, T>> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Create a partial record variant (all keys optional)
   * Similar to v.object().partial() but for records
   */
  partial(): VldRecord<T | undefined> {
    const optionalValidator = this.valueValidator.optional();
    return new VldRecord(optionalValidator);
  }

  /**
   * Create a loose record variant (allows extra keys)
   * Similar to v.object().passthrough() but for records
   * Note: Records already allow any keys, so this mainly affects error handling
   */
  loose(): VldBase<unknown, Record<string, T>> {
    // For records, "loose" means we don't throw errors for validation failures
    // We return a modified version that catches validation errors
    return new VldLooseRecord(this.valueValidator);
  }
}

/**
 * Loose record variant that allows validation failures
 * Used internally by .loose() method
 */
class VldLooseRecord<T> extends VldBase<unknown, Record<string, T>> {
  constructor(private readonly valueValidator: VldBase<unknown, T>) {
    super();
  }

  parse(value: unknown): Record<string, T> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new Error(getMessages().invalidRecord);
    }

    const result: Record<string, T> = {} as Record<string, T>;
    const obj = value as Record<string, unknown>;

    for (const [key, val] of Object.entries(obj)) {
      // Skip dangerous keys
      if (isDangerousKey(key)) {
        continue;
      }

      // For loose records, skip invalid values instead of throwing
      const parseResult = this.valueValidator.safeParse(val);
      if (parseResult.success) {
        result[key] = parseResult.data;
      }
    }

    return result;
  }

  safeParse(value: unknown): ParseResult<Record<string, T>> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Create a partial variant (all keys optional)
   */
  partial(): VldLooseRecord<T | undefined> {
    const optionalValidator = this.valueValidator.optional();
    return new VldLooseRecord(optionalValidator);
  }

  /**
   * Return self (already loose)
   */
  loose(): VldLooseRecord<T> {
    return this;
  }
}