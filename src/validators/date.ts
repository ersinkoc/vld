import { VldBase, ParseResult } from './base';
import { getMessages } from '../locales';

/**
 * Type for date validation check functions
 */
type DateCheckFn = (value: Date) => boolean;

interface DateCheck {
  fn: DateCheckFn;
  message: string;
}

/**
 * Configuration for date validator
 */
interface DateValidatorConfig {
  readonly checks: ReadonlyArray<DateCheck>;
  readonly errorMessage?: string;
}

/**
 * Immutable date validator with chainable methods
 */
export class VldDate extends VldBase<Date, Date> {
  private readonly config: DateValidatorConfig;

  /**
   * Protected constructor to allow extension while maintaining immutability
   */
  protected constructor(config?: Partial<DateValidatorConfig>) {
    super();
    this.config = {
      checks: config?.checks || [],
      errorMessage: config?.errorMessage
    };
  }

  /**
   * Create a new date validator
   */
  static create(): VldDate {
    return new VldDate();
  }

  /**
   * Parse and validate a date value
   */
  parse(value: unknown): Date {
    let date: Date;

    if (value instanceof Date) {
      date = value;
    } else if (typeof value === 'string' || typeof value === 'number') {
      date = new Date(value);
    } else {
      throw new Error(this.config.errorMessage || getMessages().invalidDate);
    }

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      throw new Error(this.config.errorMessage || getMessages().invalidDate);
    }

    // Apply all checks
    for (const check of this.config.checks) {
      if (!check.fn(date)) {
        throw new Error(check.message);
      }
    }

    return date;
  }

  /**
   * Safely parse and validate a date value
   */
  safeParse(value: unknown): ParseResult<Date> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Create a new validator with minimum date constraint
   */
  min(date: Date | string | number, message?: string): VldDate {
    const minDate = date instanceof Date ? date : new Date(date);
    return new VldDate({
      ...this.config,
      checks: [...this.config.checks, {
        fn: (v: Date) => v >= minDate,
        message: message || getMessages().dateMin(minDate)
      }]
    });
  }

  /**
   * Create a new validator with maximum date constraint
   */
  max(date: Date | string | number, message?: string): VldDate {
    const maxDate = date instanceof Date ? date : new Date(date);
    return new VldDate({
      ...this.config,
      checks: [...this.config.checks, {
        fn: (v: Date) => v <= maxDate,
        message: message || getMessages().dateMax(maxDate)
      }]
    });
  }

  /**
   * Create a new validator with a range constraint
   */
  between(
    min: Date | string | number,
    max: Date | string | number,
    message?: string
  ): VldDate {
    const minDate = min instanceof Date ? min : new Date(min);
    const maxDate = max instanceof Date ? max : new Date(max);
    return new VldDate({
      ...this.config,
      checks: [...this.config.checks, {
        fn: (v: Date) => v >= minDate && v <= maxDate,
        message: message || `Date must be between ${minDate.toISOString()} and ${maxDate.toISOString()}`
      }]
    });
  }

  /**
   * Create a new validator that checks if date is in the past
   * BUG-NEW-006 FIX: Capture reference date at validator creation time for deterministic behavior
   */
  past(message?: string): VldDate {
    const referenceDate = new Date(); // Capture NOW at validator creation time
    return new VldDate({
      ...this.config,
      checks: [...this.config.checks, {
        fn: (v: Date) => v < referenceDate,
        message: message || 'Date must be in the past'
      }]
    });
  }

  /**
   * Create a new validator that checks if date is in the future
   * BUG-NEW-006 FIX: Capture reference date at validator creation time for deterministic behavior
   */
  future(message?: string): VldDate {
    const referenceDate = new Date(); // Capture NOW at validator creation time
    return new VldDate({
      ...this.config,
      checks: [...this.config.checks, {
        fn: (v: Date) => v > referenceDate,
        message: message || 'Date must be in the future'
      }]
    });
  }

  /**
   * Create a new validator that checks if date is today
   */
  today(message?: string): VldDate {
    return new VldDate({
      ...this.config,
      checks: [...this.config.checks, {
        fn: (v: Date) => {
          const today = new Date();
          return v.getFullYear() === today.getFullYear() &&
                 v.getMonth() === today.getMonth() &&
                 v.getDate() === today.getDate();
        },
        message: message || 'Date must be today'
      }]
    });
  }

  /**
   * Create a new validator that checks if date is a weekday
   */
  weekday(message?: string): VldDate {
    return new VldDate({
      ...this.config,
      checks: [...this.config.checks, {
        fn: (v: Date) => {
          const day = v.getDay();
          return day >= 1 && day <= 5;
        },
        message: message || 'Date must be a weekday'
      }]
    });
  }

  /**
   * Create a new validator that checks if date is a weekend
   */
  weekend(message?: string): VldDate {
    return new VldDate({
      ...this.config,
      checks: [...this.config.checks, {
        fn: (v: Date) => {
          const day = v.getDay();
          return day === 0 || day === 6;
        },
        message: message || 'Date must be a weekend'
      }]
    });
  }
}