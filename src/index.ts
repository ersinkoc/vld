// VLD - Fast, Type-Safe Validation Library
// Zero dependencies, blazing fast performance

import { getMessages, setLocale, getLocale, type Locale } from './locales/index';

export type ParseResult<T> = 
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: Error };

// Base class for all validators
abstract class VldBase<T> {
  abstract parse(value: unknown): T;
  abstract safeParse(value: unknown): ParseResult<T>;

  // Refine with custom validation
  refine<R extends T>(predicate: (value: T) => value is R, message?: string): VldRefine<T, R>;
  refine(predicate: (value: T) => boolean, message?: string): VldRefine<T, T>;
  refine(predicate: (value: T) => boolean, message?: string): VldRefine<T, T> {
    return new VldRefine(this, predicate, message);
  }

  // Transform data after validation
  transform<U>(fn: (value: T) => U): VldTransform<T, U> {
    return new VldTransform(this, fn);
  }

  // Add default value
  default(value: T): VldDefault<T> {
    return new VldDefault(this, value);
  }

  // Catch validation errors and provide fallback
  catch(value: T): VldCatch<T> {
    return new VldCatch(this, value);
  }
}

// Pre-compiled regex patterns
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
const IPV4_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const IPV6_REGEX = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

// Helper function for deep merging objects in intersection
function deepMerge(obj1: any, obj2: any): any {
  const result = { ...obj1 };
  
  for (const key in obj2) {
    if (obj2.hasOwnProperty(key)) {
      if (typeof obj2[key] === 'object' && obj2[key] !== null && !Array.isArray(obj2[key]) &&
          typeof obj1[key] === 'object' && obj1[key] !== null && !Array.isArray(obj1[key])) {
        result[key] = deepMerge(obj1[key], obj2[key]);
      } else {
        result[key] = obj2[key];
      }
    }
  }
  
  return result;
}

// String validator
export class VldString extends VldBase<string> {
  private checks: Array<(v: string) => boolean> = [];
  private transforms: Array<(v: string) => string> = [];
  private errorMessage = getMessages().invalidString;

  parse(value: unknown): string {
    if (typeof value !== 'string') {
      throw new Error(this.errorMessage || getMessages().invalidString);
    }

    let val = value;
    
    // Apply transforms
    for (const transform of this.transforms) {
      val = transform(val);
    }

    // Apply checks
    for (const check of this.checks) {
      if (!check(val)) {
        throw new Error(this.errorMessage || getMessages().invalidString);
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
    newValidator.errorMessage = message || getMessages().stringMin(length);
    return newValidator;
  }

  max(length: number, message?: string): VldString {
    const newValidator = new VldString();
    newValidator.checks = [...this.checks, (v: string) => v.length <= length];
    newValidator.transforms = [...this.transforms];
    newValidator.errorMessage = message || getMessages().stringMax(length);
    return newValidator;
  }

  length(length: number, message?: string): VldString {
    const newValidator = new VldString();
    newValidator.checks = [...this.checks, (v: string) => v.length === length];
    newValidator.transforms = [...this.transforms];
    newValidator.errorMessage = message || getMessages().stringLength(length);
    return newValidator;
  }

  email(message?: string): VldString {
    const newValidator = new VldString();
    newValidator.checks = [...this.checks, (v: string) => EMAIL_REGEX.test(v)];
    newValidator.transforms = [...this.transforms];
    newValidator.errorMessage = message || getMessages().stringEmail;
    return newValidator;
  }

  url(message?: string): VldString {
    const newValidator = new VldString();
    newValidator.checks = [...this.checks, (v: string) => URL_REGEX.test(v)];
    newValidator.transforms = [...this.transforms];
    newValidator.errorMessage = message || getMessages().stringUrl;
    return newValidator;
  }

  uuid(message?: string): VldString {
    const newValidator = new VldString();
    newValidator.checks = [...this.checks, (v: string) => UUID_REGEX.test(v)];
    newValidator.transforms = [...this.transforms];
    newValidator.errorMessage = message || getMessages().stringUuid;
    return newValidator;
  }

  regex(pattern: RegExp, message?: string): VldString {
    const newValidator = new VldString();
    newValidator.checks = [...this.checks, (v: string) => pattern.test(v)];
    newValidator.transforms = [...this.transforms];
    newValidator.errorMessage = message || getMessages().stringRegex;
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
    newValidator.errorMessage = message || getMessages().stringStartsWith(str);
    return newValidator;
  }

  endsWith(str: string, message?: string): VldString {
    const newValidator = new VldString();
    newValidator.checks = [...this.checks, (v: string) => v.endsWith(str)];
    newValidator.transforms = [...this.transforms];
    newValidator.errorMessage = message || getMessages().stringEndsWith(str);
    return newValidator;
  }

  includes(str: string, message?: string): VldString {
    const newValidator = new VldString();
    newValidator.checks = [...this.checks, (v: string) => v.includes(str)];
    newValidator.transforms = [...this.transforms];
    newValidator.errorMessage = message || getMessages().stringIncludes(str);
    return newValidator;
  }

  ip(message?: string): VldString {
    const newValidator = new VldString();
    newValidator.checks = [...this.checks, (v: string) => IPV4_REGEX.test(v) || IPV6_REGEX.test(v)];
    newValidator.transforms = [...this.transforms];
    newValidator.errorMessage = message || getMessages().stringIp;
    return newValidator;
  }

  ipv4(message?: string): VldString {
    const newValidator = new VldString();
    newValidator.checks = [...this.checks, (v: string) => IPV4_REGEX.test(v)];
    newValidator.transforms = [...this.transforms];
    newValidator.errorMessage = message || getMessages().stringIpv4;
    return newValidator;
  }

  ipv6(message?: string): VldString {
    const newValidator = new VldString();
    newValidator.checks = [...this.checks, (v: string) => IPV6_REGEX.test(v)];
    newValidator.transforms = [...this.transforms];
    newValidator.errorMessage = message || getMessages().stringIpv6;
    return newValidator;
  }

  nonempty(message?: string): VldString {
    const newValidator = new VldString();
    newValidator.checks = [...this.checks, (v: string) => v.length > 0];
    newValidator.transforms = [...this.transforms];
    newValidator.errorMessage = message || getMessages().stringEmpty;
    return newValidator;
  }
}

// Number validator
export class VldNumber extends VldBase<number> {
  private checks: Array<(v: number) => boolean> = [];
  private errorMessage = getMessages().invalidNumber;

  parse(value: unknown): number {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error(this.errorMessage || getMessages().invalidNumber);
    }

    for (const check of this.checks) {
      if (!check(value)) {
        throw new Error(this.errorMessage || getMessages().invalidNumber);
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
    newValidator.errorMessage = message || getMessages().numberMin(value);
    return newValidator;
  }

  max(value: number, message?: string): VldNumber {
    const newValidator = new VldNumber();
    newValidator.checks = [...this.checks, (v: number) => v <= value];
    newValidator.errorMessage = message || getMessages().numberMax(value);
    return newValidator;
  }

  int(message?: string): VldNumber {
    const newValidator = new VldNumber();
    newValidator.checks = [...this.checks, (v: number) => Number.isInteger(v)];
    newValidator.errorMessage = message || getMessages().numberInt;
    return newValidator;
  }

  positive(message?: string): VldNumber {
    const newValidator = new VldNumber();
    newValidator.checks = [...this.checks, (v: number) => v > 0];
    newValidator.errorMessage = message || getMessages().numberPositive;
    return newValidator;
  }

  negative(message?: string): VldNumber {
    const newValidator = new VldNumber();
    newValidator.checks = [...this.checks, (v: number) => v < 0];
    newValidator.errorMessage = message || getMessages().numberNegative;
    return newValidator;
  }

  nonnegative(message?: string): VldNumber {
    const newValidator = new VldNumber();
    newValidator.checks = [...this.checks, (v: number) => v >= 0];
    newValidator.errorMessage = message || getMessages().numberNonnegative;
    return newValidator;
  }

  nonpositive(message?: string): VldNumber {
    const newValidator = new VldNumber();
    newValidator.checks = [...this.checks, (v: number) => v <= 0];
    newValidator.errorMessage = message || getMessages().numberNonpositive;
    return newValidator;
  }

  finite(message?: string): VldNumber {
    const newValidator = new VldNumber();
    newValidator.checks = [...this.checks, (v: number) => Number.isFinite(v)];
    newValidator.errorMessage = message || getMessages().numberFinite;
    return newValidator;
  }

  safe(message?: string): VldNumber {
    const newValidator = new VldNumber();
    newValidator.checks = [...this.checks, (v: number) => Number.isSafeInteger(v)];
    newValidator.errorMessage = message || getMessages().numberSafe;
    return newValidator;
  }

  multipleOf(value: number, message?: string): VldNumber {
    const newValidator = new VldNumber();
    newValidator.checks = [...this.checks, (v: number) => v % value === 0];
    newValidator.errorMessage = message || getMessages().numberMultipleOf(value);
    return newValidator;
  }

  step(value: number, message?: string): VldNumber {
    return this.multipleOf(value, message);
  }
}

// Boolean validator
export class VldBoolean extends VldBase<boolean> {
  private errorMessage = getMessages().invalidBoolean;

  parse(value: unknown): boolean {
    if (typeof value !== 'boolean') {
      throw new Error(this.errorMessage || getMessages().invalidBoolean);
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
      throw new Error(getMessages().invalidArray);
    }

    return value.map((item, index) => {
      try {
        return this.itemValidator.parse(item);
      } catch (error) {
        throw new Error(getMessages().arrayItem(index, (error as Error).message));
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
        throw new Error(message || getMessages().arrayMin(length));
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
        throw new Error(message || getMessages().arrayMax(length));
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
        throw new Error(message || getMessages().arrayLength(length));
      }
      return arr;
    };
    return this;
  }

  nonempty(message?: string): VldArray<T> {
    return this.min(1, message || getMessages().arrayEmpty);
  }
}

// Object validator
export class VldObject<T extends Record<string, any>> extends VldBase<T> {
  constructor(private shape: { [K in keyof T]: VldBase<T[K]> }) {
    super();
  }

  parse(value: unknown): T {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new Error(getMessages().invalidObject);
    }

    const result: any = {};
    const obj = value as Record<string, unknown>;

    for (const [key, validator] of Object.entries(this.shape)) {
      try {
        result[key] = validator.parse(obj[key]);
      } catch (error) {
        throw new Error(getMessages().objectField(key, (error as Error).message));
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
        throw new Error(getMessages().unexpectedKeys(extraKeys));
      }
      return result;
    };
    return this;
  }

  pick<K extends keyof T>(...keys: K[]): VldObject<Pick<T, K>> {
    const pickedShape: any = {};
    for (const key of keys) {
      if (key in this.shape) {
        pickedShape[key] = this.shape[key];
      }
    }
    return new VldObject(pickedShape);
  }

  omit<K extends keyof T>(...keys: K[]): VldObject<Omit<T, K>> {
    const omittedShape: any = {};
    for (const [key, validator] of Object.entries(this.shape)) {
      if (!keys.includes(key as K)) {
        omittedShape[key] = validator;
      }
    }
    return new VldObject(omittedShape);
  }

  extend<U extends Record<string, any>>(
    extension: { [K in keyof U]: VldBase<U[K]> }
  ): VldObject<T & U> {
    const extendedShape: any = { ...this.shape };
    for (const [key, validator] of Object.entries(extension)) {
      extendedShape[key] = validator;
    }
    return new VldObject(extendedShape);
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

    throw new Error(getMessages().unionNoMatch(errors.map(e => e.message)));
  }

  safeParse(value: unknown): ParseResult<T[number] extends VldBase<infer U> ? U : never> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}

// Intersection validator
export class VldIntersection<A, B> extends VldBase<A & B> {
  constructor(private validatorA: VldBase<A>, private validatorB: VldBase<B>) {
    super();
  }

  parse(value: unknown): A & B {
    try {
      // Both validators must pass
      const resultA = this.validatorA.parse(value);
      const resultB = this.validatorB.parse(value);
      
      // For object types, deep merge the results
      if (typeof resultA === 'object' && resultA !== null && 
          typeof resultB === 'object' && resultB !== null &&
          !Array.isArray(resultA) && !Array.isArray(resultB)) {
        return deepMerge(resultA, resultB) as A & B;
      }
      
      // For primitive types, both must be the same value
      if ((resultA as any) === (resultB as any)) {
        return resultA as A & B;
      }
      
      // If they're different primitive values, this is an error
      throw new Error(getMessages().intersectionError('Values must be identical for intersection of primitive types'));
    } catch (error) {
      throw new Error(getMessages().intersectionError((error as Error).message));
    }
  }

  safeParse(value: unknown): ParseResult<A & B> {
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
      throw new Error(getMessages().literalExpected(JSON.stringify(this.literal), JSON.stringify(value)));
    }
    return this.literal;
  }

  safeParse(value: unknown): ParseResult<T> {
    if (value === this.literal) {
      return { success: true, data: this.literal };
    }
    return { success: false, error: new Error(getMessages().literalExpected(JSON.stringify(this.literal), 'received')) };
  }
}

// Enum validator
export class VldEnum<T extends readonly [string, ...string[]]> extends VldBase<T[number]> {
  constructor(private values: T) {
    super();
  }

  parse(value: unknown): T[number] {
    if (!this.values.includes(value as string)) {
      throw new Error(getMessages().enumExpected([...this.values], JSON.stringify(value)));
    }
    return value as T[number];
  }

  safeParse(value: unknown): ParseResult<T[number]> {
    if (this.values.includes(value as string)) {
      return { success: true, data: value as T[number] };
    }
    return { success: false, error: new Error(getMessages().enumExpected([...this.values], 'received')) };
  }
}

// Date validator
export class VldDate extends VldBase<Date> {
  private checks: Array<(v: Date) => boolean> = [];
  private errorMessage = getMessages().invalidDate;

  parse(value: unknown): Date {
    let date: Date;
    
    if (value instanceof Date) {
      date = value;
    } else if (typeof value === 'string' || typeof value === 'number') {
      date = new Date(value);
    } else {
      throw new Error(this.errorMessage || getMessages().invalidDate);
    }

    if (isNaN(date.getTime())) {
      throw new Error(this.errorMessage || getMessages().invalidDate);
    }

    for (const check of this.checks) {
      if (!check(date)) {
        throw new Error(this.errorMessage || getMessages().invalidDate);
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
    newValidator.errorMessage = message || getMessages().dateMin(date);
    return newValidator;
  }

  max(date: Date, message?: string): VldDate {
    const newValidator = new VldDate();
    newValidator.checks = [...this.checks, (v: Date) => v <= date];
    newValidator.errorMessage = message || getMessages().dateMax(date);
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
      throw new Error(getMessages().expectedUndefined);
    }
    return undefined;
  }

  safeParse(value: unknown): ParseResult<void> {
    if (value === undefined) {
      return { success: true, data: undefined };
    }
    return { success: false, error: new Error(getMessages().expectedUndefined) };
  }
}

// Never validator
export class VldNever extends VldBase<never> {
  parse(_value: unknown): never {
    throw new Error(getMessages().neverType);
  }

  safeParse(_value: unknown): ParseResult<never> {
    return { success: false, error: new Error(getMessages().neverType) };
  }
}

// BigInt validator
export class VldBigInt extends VldBase<bigint> {
  private checks: Array<(v: bigint) => boolean> = [];
  private errorMessage = getMessages().invalidBigint;

  parse(value: unknown): bigint {
    if (typeof value !== 'bigint') {
      throw new Error(this.errorMessage || getMessages().invalidBigint);
    }

    for (const check of this.checks) {
      if (!check(value)) {
        throw new Error(this.errorMessage || getMessages().invalidBigint);
      }
    }

    return value;
  }

  safeParse(value: unknown): ParseResult<bigint> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}

// Symbol validator
export class VldSymbol extends VldBase<symbol> {
  private errorMessage = getMessages().invalidSymbol;

  parse(value: unknown): symbol {
    if (typeof value !== 'symbol') {
      throw new Error(this.errorMessage || getMessages().invalidSymbol);
    }
    return value;
  }

  safeParse(value: unknown): ParseResult<symbol> {
    if (typeof value === 'symbol') {
      return { success: true, data: value };
    }
    return { success: false, error: new Error(this.errorMessage) };
  }
}

// Tuple validator
export class VldTuple<T extends readonly VldBase<any>[]> extends VldBase<{ [K in keyof T]: T[K] extends VldBase<infer U> ? U : never }> {
  constructor(private validators: T) {
    super();
  }

  parse(value: unknown): { [K in keyof T]: T[K] extends VldBase<infer U> ? U : never } {
    if (!Array.isArray(value)) {
      throw new Error(getMessages().invalidTuple);
    }

    if (value.length !== this.validators.length) {
      throw new Error(getMessages().tupleLength(this.validators.length, value.length));
    }

    const result: any[] = [];
    for (let i = 0; i < this.validators.length; i++) {
      try {
        result[i] = this.validators[i].parse(value[i]);
      } catch (error) {
        throw new Error(getMessages().arrayItem(i, (error as Error).message));
      }
    }

    return result as { [K in keyof T]: T[K] extends VldBase<infer U> ? U : never };
  }

  safeParse(value: unknown): ParseResult<{ [K in keyof T]: T[K] extends VldBase<infer U> ? U : never }> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}

// Record validator
export class VldRecord<T> extends VldBase<Record<string, T>> {
  constructor(private valueValidator: VldBase<T>) {
    super();
  }

  parse(value: unknown): Record<string, T> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new Error(getMessages().invalidRecord);
    }

    const result: Record<string, T> = {};
    const obj = value as Record<string, unknown>;

    for (const [key, val] of Object.entries(obj)) {
      try {
        result[key] = this.valueValidator.parse(val);
      } catch (error) {
        throw new Error(getMessages().objectField(key, (error as Error).message));
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
}

// Set validator
export class VldSet<T> extends VldBase<Set<T>> {
  constructor(private itemValidator: VldBase<T>) {
    super();
  }

  parse(value: unknown): Set<T> {
    if (!(value instanceof Set)) {
      throw new Error(getMessages().invalidSet);
    }

    const result = new Set<T>();
    for (const item of value) {
      try {
        result.add(this.itemValidator.parse(item));
      } catch (error) {
        throw new Error((error as Error).message);
      }
    }

    return result;
  }

  safeParse(value: unknown): ParseResult<Set<T>> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}

// Map validator
export class VldMap<K, V> extends VldBase<Map<K, V>> {
  constructor(private keyValidator: VldBase<K>, private valueValidator: VldBase<V>) {
    super();
  }

  parse(value: unknown): Map<K, V> {
    if (!(value instanceof Map)) {
      throw new Error(getMessages().invalidMap);
    }

    const result = new Map<K, V>();
    for (const [key, val] of value) {
      try {
        const validKey = this.keyValidator.parse(key);
        const validValue = this.valueValidator.parse(val);
        result.set(validKey, validValue);
      } catch (error) {
        throw new Error((error as Error).message);
      }
    }

    return result;
  }

  safeParse(value: unknown): ParseResult<Map<K, V>> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}

// Coercion classes
export class VldCoerceString extends VldString {
  parse(value: unknown): string {
    try {
      // Attempt coercion to string
      if (value === null || value === undefined) {
        throw new Error(getMessages().coercionFailed('string', value));
      }
      const coerced = String(value);
      // Call parent parse with coerced value
      return super.parse(coerced);
    } catch (error) {
      const errorMessage = (error as Error).message;
      // If it's a coercion error, re-throw as is
      if (errorMessage.includes('Cannot coerce')) {
        throw error;
      }
      // If it's a validation error from parent, re-throw as is
      if (errorMessage.includes('String must') || errorMessage.includes('Invalid')) {
        throw error;
      }
      // Otherwise, it's a coercion failure
      throw new Error(getMessages().coercionFailed('string', value));
    }
  }

  safeParse(value: unknown): ParseResult<string> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}

export class VldCoerceNumber extends VldNumber {
  parse(value: unknown): number {
    try {
      // Attempt coercion to number
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed === '') {
          throw new Error(getMessages().coercionFailed('number', value));
        }
        const coerced = Number(trimmed);
        if (isNaN(coerced)) {
          throw new Error(getMessages().coercionFailed('number', value));
        }
        return super.parse(coerced);
      } else if (typeof value === 'boolean') {
        return super.parse(value ? 1 : 0);
      } else if (value === null || value === undefined) {
        throw new Error(getMessages().coercionFailed('number', value));
      }
      return super.parse(Number(value));
    } catch (error) {
      if ((error as Error).message.includes('coercionFailed')) {
        throw error;
      }
      throw new Error(getMessages().coercionFailed('number', value));
    }
  }

  safeParse(value: unknown): ParseResult<number> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}

export class VldCoerceBoolean extends VldBoolean {
  parse(value: unknown): boolean {
    try {
      // Attempt coercion to boolean
      if (typeof value === 'string') {
        const lower = value.toLowerCase().trim();
        if (lower === 'true' || lower === '1' || lower === 'yes') return true;
        if (lower === 'false' || lower === '0' || lower === 'no') return false;
        throw new Error(getMessages().coercionFailed('boolean', value));
      } else if (typeof value === 'number') {
        if (value === 1) return true;
        if (value === 0) return false;
        throw new Error(getMessages().coercionFailed('boolean', value));
      } else if (value === null || value === undefined) {
        throw new Error(getMessages().coercionFailed('boolean', value));
      }
      return super.parse(Boolean(value));
    } catch (error) {
      if ((error as Error).message.includes('coercionFailed')) {
        throw error;
      }
      throw new Error(getMessages().coercionFailed('boolean', value));
    }
  }

  safeParse(value: unknown): ParseResult<boolean> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}

export class VldCoerceBigInt extends VldBigInt {
  parse(value: unknown): bigint {
    try {
      // Attempt coercion to bigint
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed === '') {
          throw new Error(getMessages().coercionFailed('bigint', value));
        }
        return super.parse(BigInt(trimmed));
      } else if (typeof value === 'number') {
        if (!Number.isInteger(value)) {
          throw new Error(getMessages().coercionFailed('bigint', value));
        }
        return super.parse(BigInt(value));
      } else if (value === null || value === undefined) {
        throw new Error(getMessages().coercionFailed('bigint', value));
      }
      return super.parse(BigInt(value as any));
    } catch (error) {
      if ((error as Error).message.includes('coercionFailed')) {
        throw error;
      }
      throw new Error(getMessages().coercionFailed('bigint', value));
    }
  }

  safeParse(value: unknown): ParseResult<bigint> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}

export class VldCoerceDate extends VldDate {
  parse(value: unknown): Date {
    try {
      // Attempt coercion to date
      if (typeof value === 'string' || typeof value === 'number') {
        return super.parse(new Date(value));
      } else if (value === null || value === undefined) {
        throw new Error(getMessages().coercionFailed('date', value));
      }
      return super.parse(value);
    } catch (error) {
      if ((error as Error).message.includes('coercionFailed')) {
        throw error;
      }
      throw new Error(getMessages().coercionFailed('date', value));
    }
  }

  safeParse(value: unknown): ParseResult<Date> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}

// Refine validator - adds custom validation
export class VldRefine<T, U extends T = T> extends VldBase<U> {
  constructor(
    private baseValidator: VldBase<T>,
    private predicate: (value: T) => boolean,
    private customMessage?: string
  ) {
    super();
  }

  parse(value: unknown): U {
    const baseResult = this.baseValidator.parse(value);
    
    try {
      if (!this.predicate(baseResult)) {
        throw new Error(this.customMessage || 'Refinement condition not met');
      }
    } catch (error) {
      throw new Error(getMessages().customValidationError((error as Error).message));
    }
    
    return baseResult as U;
  }

  safeParse(value: unknown): ParseResult<U> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}

// Transform validator - transforms data after validation
export class VldTransform<T, U> extends VldBase<U> {
  constructor(
    private baseValidator: VldBase<T>,
    private transformer: (value: T) => U
  ) {
    super();
  }

  parse(value: unknown): U {
    const baseResult = this.baseValidator.parse(value);
    
    try {
      return this.transformer(baseResult);
    } catch (error) {
      throw new Error(getMessages().transformError((error as Error).message));
    }
  }

  safeParse(value: unknown): ParseResult<U> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}

// Default validator - provides default value for undefined
export class VldDefault<T> extends VldBase<T> {
  constructor(
    private baseValidator: VldBase<T>,
    private defaultValue: T
  ) {
    super();
  }

  parse(value: unknown): T {
    if (value === undefined) {
      return this.defaultValue;
    }
    return this.baseValidator.parse(value);
  }

  safeParse(value: unknown): ParseResult<T> {
    if (value === undefined) {
      return { success: true, data: this.defaultValue };
    }
    return this.baseValidator.safeParse(value);
  }
}

// Catch validator - provides fallback value on validation error
export class VldCatch<T> extends VldBase<T> {
  constructor(
    private baseValidator: VldBase<T>,
    private fallbackValue: T
  ) {
    super();
  }

  parse(value: unknown): T {
    try {
      return this.baseValidator.parse(value);
    } catch {
      return this.fallbackValue;
    }
  }

  safeParse(value: unknown): ParseResult<T> {
    const result = this.baseValidator.safeParse(value);
    if (result.success) {
      return result;
    } else {
      return { success: true, data: this.fallbackValue };
    }
  }
}

// Main API
export const v = {
  string: () => new VldString(),
  number: () => new VldNumber(),
  boolean: () => new VldBoolean(),
  bigint: () => new VldBigInt(),
  symbol: () => new VldSymbol(),
  array: <T>(item: VldBase<T>) => new VldArray(item),
  tuple: <T extends readonly VldBase<any>[]>(...validators: T) => new VldTuple(validators),
  object: <T extends Record<string, any>>(shape: { [K in keyof T]: VldBase<T[K]> }) => new VldObject(shape),
  record: <T>(valueValidator: VldBase<T>) => new VldRecord(valueValidator),
  set: <T>(item: VldBase<T>) => new VldSet(item),
  map: <K, V>(key: VldBase<K>, value: VldBase<V>) => new VldMap(key, value),
  optional: <T>(validator: VldBase<T>) => new VldOptional(validator),
  nullable: <T>(validator: VldBase<T>) => new VldNullable(validator),
  union: <T extends readonly VldBase<any>[]>(...validators: T) => new VldUnion(validators),
  intersection: <A, B>(a: VldBase<A>, b: VldBase<B>) => new VldIntersection(a, b),
  literal: <T extends string | number | boolean>(value: T) => new VldLiteral(value),
  enum: <T extends readonly [string, ...string[]]>(...values: T) => new VldEnum(values),
  date: () => new VldDate(),
  any: () => new VldAny(),
  unknown: () => new VldUnknown(),
  void: () => new VldVoid(),
  never: () => new VldNever(),
  
  // Coercion API
  coerce: {
    string: () => new VldCoerceString(),
    number: () => new VldCoerceNumber(),
    boolean: () => new VldCoerceBoolean(),
    bigint: () => new VldCoerceBigInt(),
    date: () => new VldCoerceDate(),
  }
};

// Type inference helpers
export type Infer<T extends VldBase<any>> = T extends VldBase<infer U> ? U : never;

// Export all validators for direct use
export {
  VldBase,
};

// Export locale functionality
export { setLocale, getLocale, getMessages, type Locale } from './locales';

// Export error formatting utilities
export { 
  VldError, 
  VldIssue, 
  VldErrorCode,
  VldErrorTree,
  VldFlattenedError,
  treeifyError, 
  prettifyError, 
  flattenError 
} from './errors';