// VLD - Fast, Type-Safe Validation Library
// Zero dependencies, blazing fast performance

export type ParseResult<T> = 
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: Error };

// Base class for all validators
abstract class VldBase<T> {
  abstract parse(value: unknown): T;
  abstract safeParse(value: unknown): ParseResult<T>;
}

// Pre-compiled regex patterns
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
const IPV4_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const IPV6_REGEX = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

// String validator
export class VldString extends VldBase<string> {
  private checks: Array<(v: string) => boolean> = [];
  private transforms: Array<(v: string) => string> = [];
  private errorMessage = 'Invalid string';

  parse(value: unknown): string {
    if (typeof value !== 'string') {
      throw new Error(this.errorMessage);
    }

    let val = value;
    
    // Apply transforms
    for (const transform of this.transforms) {
      val = transform(val);
    }

    // Apply checks
    for (const check of this.checks) {
      if (!check(val)) {
        throw new Error(this.errorMessage);
      }
    }

    return val;
  }

  safeParse(value: unknown): ParseResult<string> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  // Chainable methods
  min(length: number, message?: string): VldString {
    const newValidator = new VldString();
    newValidator.checks = [...this.checks, (v: string) => v.length >= length];
    newValidator.transforms = [...this.transforms];
    newValidator.errorMessage = message || `String must be at least ${length} characters`;
    return newValidator;
  }

  max(length: number, message?: string): VldString {
    const newValidator = new VldString();
    newValidator.checks = [...this.checks, (v: string) => v.length <= length];
    newValidator.transforms = [...this.transforms];
    newValidator.errorMessage = message || `String must be at most ${length} characters`;
    return newValidator;
  }

  length(length: number, message?: string): VldString {
    const newValidator = new VldString();
    newValidator.checks = [...this.checks, (v: string) => v.length === length];
    newValidator.transforms = [...this.transforms];
    newValidator.errorMessage = message || `String must be exactly ${length} characters`;
    return newValidator;
  }

  email(message?: string): VldString {
    const newValidator = new VldString();
    newValidator.checks = [...this.checks, (v: string) => EMAIL_REGEX.test(v)];
    newValidator.transforms = [...this.transforms];
    newValidator.errorMessage = message || 'Invalid email address';
    return newValidator;
  }

  url(message?: string): VldString {
    const newValidator = new VldString();
    newValidator.checks = [...this.checks, (v: string) => URL_REGEX.test(v)];
    newValidator.transforms = [...this.transforms];
    newValidator.errorMessage = message || 'Invalid URL';
    return newValidator;
  }

  uuid(message?: string): VldString {
    const newValidator = new VldString();
    newValidator.checks = [...this.checks, (v: string) => UUID_REGEX.test(v)];
    newValidator.transforms = [...this.transforms];
    newValidator.errorMessage = message || 'Invalid UUID';
    return newValidator;
  }

  regex(pattern: RegExp, message?: string): VldString {
    const newValidator = new VldString();
    newValidator.checks = [...this.checks, (v: string) => pattern.test(v)];
    newValidator.transforms = [...this.transforms];
    newValidator.errorMessage = message || 'Invalid format';
    return newValidator;
  }

  trim(): VldString {
    const newValidator = new VldString();
    newValidator.checks = [...this.checks];
    newValidator.transforms = [...this.transforms, (v: string) => v.trim()];
    newValidator.errorMessage = this.errorMessage;
    return newValidator;
  }

  toLowerCase(): VldString {
    const newValidator = new VldString();
    newValidator.checks = [...this.checks];
    newValidator.transforms = [...this.transforms, (v: string) => v.toLowerCase()];
    newValidator.errorMessage = this.errorMessage;
    return newValidator;
  }

  toUpperCase(): VldString {
    const newValidator = new VldString();
    newValidator.checks = [...this.checks];
    newValidator.transforms = [...this.transforms, (v: string) => v.toUpperCase()];
    newValidator.errorMessage = this.errorMessage;
    return newValidator;
  }

  startsWith(str: string, message?: string): VldString {
    const newValidator = new VldString();
    newValidator.checks = [...this.checks, (v: string) => v.startsWith(str)];
    newValidator.transforms = [...this.transforms];
    newValidator.errorMessage = message || `String must start with "${str}"`;
    return newValidator;
  }

  endsWith(str: string, message?: string): VldString {
    const newValidator = new VldString();
    newValidator.checks = [...this.checks, (v: string) => v.endsWith(str)];
    newValidator.transforms = [...this.transforms];
    newValidator.errorMessage = message || `String must end with "${str}"`;
    return newValidator;
  }

  includes(str: string, message?: string): VldString {
    const newValidator = new VldString();
    newValidator.checks = [...this.checks, (v: string) => v.includes(str)];
    newValidator.transforms = [...this.transforms];
    newValidator.errorMessage = message || `String must include "${str}"`;
    return newValidator;
  }

  ip(message?: string): VldString {
    const newValidator = new VldString();
    newValidator.checks = [...this.checks, (v: string) => IPV4_REGEX.test(v) || IPV6_REGEX.test(v)];
    newValidator.transforms = [...this.transforms];
    newValidator.errorMessage = message || 'Invalid IP address';
    return newValidator;
  }

  ipv4(message?: string): VldString {
    const newValidator = new VldString();
    newValidator.checks = [...this.checks, (v: string) => IPV4_REGEX.test(v)];
    newValidator.transforms = [...this.transforms];
    newValidator.errorMessage = message || 'Invalid IPv4 address';
    return newValidator;
  }

  ipv6(message?: string): VldString {
    const newValidator = new VldString();
    newValidator.checks = [...this.checks, (v: string) => IPV6_REGEX.test(v)];
    newValidator.transforms = [...this.transforms];
    newValidator.errorMessage = message || 'Invalid IPv6 address';
    return newValidator;
  }

  nonempty(message?: string): VldString {
    const newValidator = new VldString();
    newValidator.checks = [...this.checks, (v: string) => v.length > 0];
    newValidator.transforms = [...this.transforms];
    newValidator.errorMessage = message || 'String must not be empty';
    return newValidator;
  }
}

// Number validator
export class VldNumber extends VldBase<number> {
  private checks: Array<(v: number) => boolean> = [];
  private errorMessage = 'Invalid number';

  parse(value: unknown): number {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error(this.errorMessage);
    }

    for (const check of this.checks) {
      if (!check(value)) {
        throw new Error(this.errorMessage);
      }
    }

    return value;
  }

  safeParse(value: unknown): ParseResult<number> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  min(value: number, message?: string): VldNumber {
    const newValidator = new VldNumber();
    newValidator.checks = [...this.checks, (v: number) => v >= value];
    newValidator.errorMessage = message || `Number must be at least ${value}`;
    return newValidator;
  }

  max(value: number, message?: string): VldNumber {
    const newValidator = new VldNumber();
    newValidator.checks = [...this.checks, (v: number) => v <= value];
    newValidator.errorMessage = message || `Number must be at most ${value}`;
    return newValidator;
  }

  int(message?: string): VldNumber {
    const newValidator = new VldNumber();
    newValidator.checks = [...this.checks, (v: number) => Number.isInteger(v)];
    newValidator.errorMessage = message || 'Number must be an integer';
    return newValidator;
  }

  positive(message?: string): VldNumber {
    const newValidator = new VldNumber();
    newValidator.checks = [...this.checks, (v: number) => v > 0];
    newValidator.errorMessage = message || 'Number must be positive';
    return newValidator;
  }

  negative(message?: string): VldNumber {
    const newValidator = new VldNumber();
    newValidator.checks = [...this.checks, (v: number) => v < 0];
    newValidator.errorMessage = message || 'Number must be negative';
    return newValidator;
  }

  nonnegative(message?: string): VldNumber {
    const newValidator = new VldNumber();
    newValidator.checks = [...this.checks, (v: number) => v >= 0];
    newValidator.errorMessage = message || 'Number must be non-negative';
    return newValidator;
  }

  nonpositive(message?: string): VldNumber {
    const newValidator = new VldNumber();
    newValidator.checks = [...this.checks, (v: number) => v <= 0];
    newValidator.errorMessage = message || 'Number must be non-positive';
    return newValidator;
  }

  finite(message?: string): VldNumber {
    const newValidator = new VldNumber();
    newValidator.checks = [...this.checks, (v: number) => Number.isFinite(v)];
    newValidator.errorMessage = message || 'Number must be finite';
    return newValidator;
  }

  safe(message?: string): VldNumber {
    const newValidator = new VldNumber();
    newValidator.checks = [...this.checks, (v: number) => Number.isSafeInteger(v)];
    newValidator.errorMessage = message || 'Number must be a safe integer';
    return newValidator;
  }

  multipleOf(value: number, message?: string): VldNumber {
    const newValidator = new VldNumber();
    newValidator.checks = [...this.checks, (v: number) => v % value === 0];
    newValidator.errorMessage = message || `Number must be a multiple of ${value}`;
    return newValidator;
  }

  step(value: number, message?: string): VldNumber {
    return this.multipleOf(value, message);
  }
}

// Boolean validator
export class VldBoolean extends VldBase<boolean> {
  private errorMessage = 'Invalid boolean';

  parse(value: unknown): boolean {
    if (typeof value !== 'boolean') {
      throw new Error(this.errorMessage);
    }
    return value;
  }

  safeParse(value: unknown): ParseResult<boolean> {
    if (typeof value === 'boolean') {
      return { success: true, data: value };
    }
    return { success: false, error: new Error(this.errorMessage) };
  }
}

// Array validator
export class VldArray<T> extends VldBase<T[]> {
  constructor(private itemValidator: VldBase<T>) {
    super();
  }

  parse(value: unknown): T[] {
    if (!Array.isArray(value)) {
      throw new Error('Invalid array');
    }

    return value.map((item, index) => {
      try {
        return this.itemValidator.parse(item);
      } catch (error) {
        throw new Error(`Invalid item at index ${index}: ${(error as Error).message}`);
      }
    });
  }

  safeParse(value: unknown): ParseResult<T[]> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  min(length: number, message?: string): VldArray<T> {
    const originalParse = this.parse.bind(this);
    this.parse = (value: unknown) => {
      const arr = originalParse(value);
      if (arr.length < length) {
        throw new Error(message || `Array must have at least ${length} items`);
      }
      return arr;
    };
    return this;
  }

  max(length: number, message?: string): VldArray<T> {
    const originalParse = this.parse.bind(this);
    this.parse = (value: unknown) => {
      const arr = originalParse(value);
      if (arr.length > length) {
        throw new Error(message || `Array must have at most ${length} items`);
      }
      return arr;
    };
    return this;
  }

  length(length: number, message?: string): VldArray<T> {
    const originalParse = this.parse.bind(this);
    this.parse = (value: unknown) => {
      const arr = originalParse(value);
      if (arr.length !== length) {
        throw new Error(message || `Array must have exactly ${length} items`);
      }
      return arr;
    };
    return this;
  }

  nonempty(message?: string): VldArray<T> {
    return this.min(1, message || 'Array must not be empty');
  }
}

// Object validator
export class VldObject<T extends Record<string, any>> extends VldBase<T> {
  constructor(private shape: { [K in keyof T]: VldBase<T[K]> }) {
    super();
  }

  parse(value: unknown): T {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new Error('Invalid object');
    }

    const result: any = {};
    const obj = value as Record<string, unknown>;

    for (const [key, validator] of Object.entries(this.shape)) {
      try {
        result[key] = validator.parse(obj[key]);
      } catch (error) {
        throw new Error(`Invalid field "${key}": ${(error as Error).message}`);
      }
    }

    return result as T;
  }

  safeParse(value: unknown): ParseResult<T> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  partial(): VldObject<Partial<T>> {
    const partialShape: any = {};
    for (const [key, validator] of Object.entries(this.shape)) {
      partialShape[key] = new VldOptional(validator as any);
    }
    return new VldObject(partialShape);
  }

  strict(): VldObject<T> {
    const originalParse = this.parse.bind(this);
    this.parse = (value: unknown) => {
      const result = originalParse(value);
      const obj = value as Record<string, unknown>;
      const extraKeys = Object.keys(obj).filter(key => !(key in this.shape));
      if (extraKeys.length > 0) {
        throw new Error(`Unexpected keys: ${extraKeys.join(', ')}`);
      }
      return result;
    };
    return this;
  }
}

// Optional validator
export class VldOptional<T> extends VldBase<T | undefined> {
  constructor(private validator: VldBase<T>) {
    super();
  }

  parse(value: unknown): T | undefined {
    if (value === undefined) {
      return undefined;
    }
    return this.validator.parse(value);
  }

  safeParse(value: unknown): ParseResult<T | undefined> {
    if (value === undefined) {
      return { success: true, data: undefined };
    }
    return this.validator.safeParse(value);
  }
}

// Nullable validator
export class VldNullable<T> extends VldBase<T | null> {
  constructor(private validator: VldBase<T>) {
    super();
  }

  parse(value: unknown): T | null {
    if (value === null) {
      return null;
    }
    return this.validator.parse(value);
  }

  safeParse(value: unknown): ParseResult<T | null> {
    if (value === null) {
      return { success: true, data: null };
    }
    return this.validator.safeParse(value);
  }
}

// Union validator
export class VldUnion<T extends readonly VldBase<any>[]> extends VldBase<T[number] extends VldBase<infer U> ? U : never> {
  constructor(private validators: T) {
    super();
  }

  parse(value: unknown): T[number] extends VldBase<infer U> ? U : never {
    const errors: Error[] = [];
    
    for (const validator of this.validators) {
      try {
        return validator.parse(value);
      } catch (error) {
        errors.push(error as Error);
      }
    }

    throw new Error(`No union member matched: ${errors.map(e => e.message).join(', ')}`);
  }

  safeParse(value: unknown): ParseResult<T[number] extends VldBase<infer U> ? U : never> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}

// Literal validator
export class VldLiteral<T extends string | number | boolean> extends VldBase<T> {
  constructor(private literal: T) {
    super();
  }

  parse(value: unknown): T {
    if (value !== this.literal) {
      throw new Error(`Expected ${JSON.stringify(this.literal)}, got ${JSON.stringify(value)}`);
    }
    return this.literal;
  }

  safeParse(value: unknown): ParseResult<T> {
    if (value === this.literal) {
      return { success: true, data: this.literal };
    }
    return { success: false, error: new Error(`Expected ${JSON.stringify(this.literal)}`) };
  }
}

// Enum validator
export class VldEnum<T extends readonly [string, ...string[]]> extends VldBase<T[number]> {
  constructor(private values: T) {
    super();
  }

  parse(value: unknown): T[number] {
    if (!this.values.includes(value as string)) {
      throw new Error(`Expected one of [${this.values.join(', ')}], got ${JSON.stringify(value)}`);
    }
    return value as T[number];
  }

  safeParse(value: unknown): ParseResult<T[number]> {
    if (this.values.includes(value as string)) {
      return { success: true, data: value as T[number] };
    }
    return { success: false, error: new Error(`Expected one of [${this.values.join(', ')}]`) };
  }
}

// Date validator
export class VldDate extends VldBase<Date> {
  private checks: Array<(v: Date) => boolean> = [];
  private errorMessage = 'Invalid date';

  parse(value: unknown): Date {
    let date: Date;
    
    if (value instanceof Date) {
      date = value;
    } else if (typeof value === 'string' || typeof value === 'number') {
      date = new Date(value);
    } else {
      throw new Error(this.errorMessage);
    }

    if (isNaN(date.getTime())) {
      throw new Error(this.errorMessage);
    }

    for (const check of this.checks) {
      if (!check(date)) {
        throw new Error(this.errorMessage);
      }
    }

    return date;
  }

  safeParse(value: unknown): ParseResult<Date> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  min(date: Date, message?: string): VldDate {
    const newValidator = new VldDate();
    newValidator.checks = [...this.checks, (v: Date) => v >= date];
    newValidator.errorMessage = message || `Date must be after ${date.toISOString()}`;
    return newValidator;
  }

  max(date: Date, message?: string): VldDate {
    const newValidator = new VldDate();
    newValidator.checks = [...this.checks, (v: Date) => v <= date];
    newValidator.errorMessage = message || `Date must be before ${date.toISOString()}`;
    return newValidator;
  }
}

// Any validator
export class VldAny extends VldBase<any> {
  parse(value: unknown): any {
    return value;
  }

  safeParse(value: unknown): ParseResult<any> {
    return { success: true, data: value };
  }
}

// Unknown validator
export class VldUnknown extends VldBase<unknown> {
  parse(value: unknown): unknown {
    return value;
  }

  safeParse(value: unknown): ParseResult<unknown> {
    return { success: true, data: value };
  }
}

// Void validator
export class VldVoid extends VldBase<void> {
  parse(value: unknown): void {
    if (value !== undefined) {
      throw new Error('Expected undefined');
    }
    return undefined;
  }

  safeParse(value: unknown): ParseResult<void> {
    if (value === undefined) {
      return { success: true, data: undefined };
    }
    return { success: false, error: new Error('Expected undefined') };
  }
}

// Never validator
export class VldNever extends VldBase<never> {
  parse(_value: unknown): never {
    throw new Error('Never type cannot be parsed');
  }

  safeParse(_value: unknown): ParseResult<never> {
    return { success: false, error: new Error('Never type cannot be parsed') };
  }
}

// Main API
export const v = {
  string: () => new VldString(),
  number: () => new VldNumber(),
  boolean: () => new VldBoolean(),
  array: <T>(item: VldBase<T>) => new VldArray(item),
  object: <T extends Record<string, any>>(shape: { [K in keyof T]: VldBase<T[K]> }) => new VldObject(shape),
  optional: <T>(validator: VldBase<T>) => new VldOptional(validator),
  nullable: <T>(validator: VldBase<T>) => new VldNullable(validator),
  union: <T extends readonly VldBase<any>[]>(...validators: T) => new VldUnion(validators),
  literal: <T extends string | number | boolean>(value: T) => new VldLiteral(value),
  enum: <T extends readonly [string, ...string[]]>(...values: T) => new VldEnum(values),
  date: () => new VldDate(),
  any: () => new VldAny(),
  unknown: () => new VldUnknown(),
  void: () => new VldVoid(),
  never: () => new VldNever(),
};

// Type inference helpers
export type Infer<T extends VldBase<any>> = T extends VldBase<infer U> ? U : never;

// Export all validators for direct use
export {
  VldBase,
};