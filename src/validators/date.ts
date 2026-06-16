import { VldBase, ParseResult, VLD_VALIDATOR_TYPES, ValidatorType } from './base';
import { getMessages } from '../locales/runtime';
import { VldError } from '../errors-core';

/**
 * Type for date validation check functions
 */
type DateCheckFn = (value: Date) => boolean;

function createDateError(message: string): VldError {
  return new VldError([{ code: 'invalid_date', path: [], message }]);
}

interface DateCheck {
  fn: DateCheckFn;
  message: string;
}

interface DateJSONSchemaHints {
  readonly formatMinimum?: string;
  readonly formatMaximum?: string;
  readonly formatExclusiveMinimum?: string;
  readonly formatExclusiveMaximum?: string;
}

/**
 * Configuration for date validator
 */
interface DateValidatorConfig {
  readonly checks: ReadonlyArray<DateCheck>;
  readonly errorMessage: string | undefined;
  readonly validatorType?: ValidatorType;
  readonly jsonSchema: DateJSONSchemaHints | undefined;
}

/**
 * Immutable date validator with chainable methods
 */
export class VldDate extends VldBase<Date, Date> {
  private readonly config: DateValidatorConfig;
  private readonly _checks: ReadonlyArray<DateCheck>;
  private readonly _isSimple: boolean;

  /**
   * Protected constructor to allow extension while maintaining immutability
   */
  protected constructor(config?: Partial<DateValidatorConfig>) {
    super(config?.validatorType || VLD_VALIDATOR_TYPES.DATE);
    this.config = {
      checks: config?.checks || [],
      errorMessage: config?.errorMessage,
      jsonSchema: config?.jsonSchema
    };
    this._checks = this.config.checks;
    this._isSimple = this._checks.length === 0;
  }

  get jsonSchema(): DateJSONSchemaHints | undefined {
    return this.config.jsonSchema;
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

    return this.parseValidDate(date);
  }

  /**
   * Parse a Date instance that has already passed the Date validity check.
   * @internal Used by object validators to avoid duplicate hot-path checks.
   */
  parseKnownDate(value: Date): Date {
    if (isNaN(value.getTime())) {
      throw new Error(this.config.errorMessage || getMessages().invalidDate);
    }

    return this.parseValidDate(value);
  }

  private parseValidDate(date: Date): Date {
    if (this._isSimple) {
      return date;
    }

    // Apply all checks
    for (const check of this._checks) {
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
    if (value instanceof Date) {
      try {
        return { success: true, data: this.parseKnownDate(value) };
      } catch (error) {
        return { success: false, error: createDateError((error as Error).message) };
      }
    }

    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: createDateError((error as Error).message) };
    }
  }

  /**
   * Create a new validator with minimum date constraint
   * BUG-NEW-009 FIX: Validate that min date is valid before creating validator
   */
  min(date: Date | string | number, message?: string): VldDate {
    const minDate = date instanceof Date ? date : new Date(date);

    // Validate that minDate is valid
    if (isNaN(minDate.getTime())) {
      throw new Error(`Invalid date provided to min(): ${date}`);
    }

    return new VldDate({
      ...this.config,
      checks: [...this.config.checks, {
        fn: (v: Date) => v >= minDate,
        message: message || getMessages().dateMin(minDate)
      }],
      jsonSchema: { ...this.config.jsonSchema, formatMinimum: minDate.toISOString() }
    });
  }

  /**
   * Create a new validator with maximum date constraint
   * BUG-NEW-009 FIX: Validate that max date is valid before creating validator
   */
  max(date: Date | string | number, message?: string): VldDate {
    const maxDate = date instanceof Date ? date : new Date(date);

    // Validate that maxDate is valid
    if (isNaN(maxDate.getTime())) {
      throw new Error(`Invalid date provided to max(): ${date}`);
    }

    return new VldDate({
      ...this.config,
      checks: [...this.config.checks, {
        fn: (v: Date) => v <= maxDate,
        message: message || getMessages().dateMax(maxDate)
      }],
      jsonSchema: { ...this.config.jsonSchema, formatMaximum: maxDate.toISOString() }
    });
  }

  /**
   * Create a new validator with a range constraint
   * BUG-NEW-019 FIX: Validate that min/max dates are valid before creating validator
   */
  between(
    min: Date | string | number,
    max: Date | string | number,
    message?: string
  ): VldDate {
    const minDate = min instanceof Date ? min : new Date(min);
    const maxDate = max instanceof Date ? max : new Date(max);

    // Validate that both dates are valid
    if (isNaN(minDate.getTime())) {
      throw new Error(`Invalid min date provided to between(): ${min}`);
    }
    if (isNaN(maxDate.getTime())) {
      throw new Error(`Invalid max date provided to between(): ${max}`);
    }

    return new VldDate({
      ...this.config,
      checks: [...this.config.checks, {
        fn: (v: Date) => v >= minDate && v <= maxDate,
        message: message || `Date must be between ${minDate.toISOString()} and ${maxDate.toISOString()}`
      }],
      jsonSchema: {
        ...this.config.jsonSchema,
        formatMinimum: minDate.toISOString(),
        formatMaximum: maxDate.toISOString()
      }
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
      }],
      jsonSchema: { ...this.config.jsonSchema, formatExclusiveMaximum: referenceDate.toISOString() }
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
      }],
      jsonSchema: { ...this.config.jsonSchema, formatExclusiveMinimum: referenceDate.toISOString() }
    });
  }

  /**
   * Create a new validator that checks if date is today
   * BUG-NEW-008 FIX: Capture reference date at validator creation time for deterministic behavior
   */
  today(message?: string): VldDate {
    // Capture the reference date (today) at validator creation time
    const referenceDate = new Date();
    const refYear = referenceDate.getFullYear();
    const refMonth = referenceDate.getMonth();
    const refDate = referenceDate.getDate();

    return new VldDate({
      ...this.config,
      checks: [...this.config.checks, {
        fn: (v: Date) => {
          return v.getFullYear() === refYear &&
                 v.getMonth() === refMonth &&
                 v.getDate() === refDate;
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

  /**
   * Create a new validator with strict greater than constraint
   * Zod 4 API parity - strictly greater than (not equal to)
   */
  gt(value: Date | number, message?: string): VldDate {
    const compareDate = value instanceof Date ? value : new Date(value);
    return new VldDate({
      ...this.config,
      checks: [...this.config.checks, {
        fn: (v: Date) => v.getTime() > compareDate.getTime(),
        message: message || `Date must be greater than ${compareDate.toISOString()}`
      }],
      jsonSchema: { ...this.config.jsonSchema, formatExclusiveMinimum: compareDate.toISOString() }
    });
  }

  /**
   * Create a new validator with strict less than constraint
   * Zod 4 API parity - strictly less than (not equal to)
   */
  lt(value: Date | number, message?: string): VldDate {
    const compareDate = value instanceof Date ? value : new Date(value);
    return new VldDate({
      ...this.config,
      checks: [...this.config.checks, {
        fn: (v: Date) => v.getTime() < compareDate.getTime(),
        message: message || `Date must be less than ${compareDate.toISOString()}`
      }],
      jsonSchema: { ...this.config.jsonSchema, formatExclusiveMaximum: compareDate.toISOString() }
    });
  }
}
