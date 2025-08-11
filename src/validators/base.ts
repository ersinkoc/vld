/**
 * Base result type for validation
 */
export type ParseResult<T> = 
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: Error };

/**
 * Abstract base class for all validators
 * Implements immutable pattern to prevent memory leaks and race conditions
 */
export abstract class VldBase<TInput, TOutput = TInput> {
  /**
   * Parse and validate a value, throwing an error if invalid
   * @param value The value to validate
   * @returns The validated value
   * @throws {Error} If validation fails
   */
  abstract parse(value: unknown): TOutput;
  
  /**
   * Safely parse and validate a value, returning a result object
   * @param value The value to validate
   * @returns A result object with either success and data, or failure and error
   */
  abstract safeParse(value: unknown): ParseResult<TOutput>;
  
  /**
   * Check if a value is valid according to this validator
   * @param value The value to check
   * @returns True if valid, false otherwise
   */
  isValid(value: unknown): boolean {
    return this.safeParse(value).success;
  }
  
  /**
   * Parse a value or return a default if validation fails
   * @param value The value to validate
   * @param defaultValue The default value to return on failure
   * @returns The validated value or default
   */
  parseOrDefault(value: unknown, defaultValue: TOutput): TOutput {
    const result = this.safeParse(value);
    return result.success ? result.data : defaultValue;
  }
  
  /**
   * Create a new validator that refines this one with a custom predicate
   * @param predicate The refinement predicate
   * @param message Optional custom error message
   * @returns A new refined validator
   */
  refine<TRefined extends TOutput>(
    predicate: (value: TOutput) => value is TRefined,
    message?: string
  ): VldRefine<TInput, TOutput, TRefined>;
  refine(
    predicate: (value: TOutput) => boolean,
    message?: string
  ): VldRefine<TInput, TOutput, TOutput>;
  refine(
    predicate: (value: TOutput) => boolean,
    message?: string
  ): VldRefine<TInput, TOutput, TOutput> {
    return new VldRefine(this, predicate, message);
  }
  
  /**
   * Create a new validator that transforms the output
   * @param transformer The transformation function
   * @returns A new transformed validator
   */
  transform<TTransformed>(
    transformer: (value: TOutput) => TTransformed
  ): VldTransform<TInput, TOutput, TTransformed> {
    return new VldTransform(this, transformer);
  }
  
  /**
   * Create a new validator with a default value for undefined inputs
   * @param defaultValue The default value
   * @returns A new validator with default
   */
  default(defaultValue: TOutput): VldDefault<TInput, TOutput> {
    return new VldDefault(this, defaultValue);
  }
  
  /**
   * Create a new validator that catches errors and returns a fallback
   * @param fallbackValue The fallback value
   * @returns A new validator with catch
   */
  catch(fallbackValue: TOutput): VldCatch<TInput, TOutput> {
    return new VldCatch(this, fallbackValue);
  }
  
  /**
   * Make this validator optional (allows undefined)
   * @returns A new optional validator
   */
  optional(): VldOptional<TInput, TOutput> {
    return new VldOptional(this);
  }
  
  /**
   * Make this validator nullable (allows null)
   * @returns A new nullable validator
   */
  nullable(): VldNullable<TInput, TOutput> {
    return new VldNullable(this);
  }
  
  /**
   * Make this validator nullish (allows null or undefined)
   * @returns A new nullish validator
   */
  nullish(): VldNullish<TInput, TOutput> {
    return new VldNullish(this);
  }
}

/**
 * Refine validator - adds custom validation
 */
export class VldRefine<TInput, TBase, TOutput extends TBase = TBase> extends VldBase<TInput, TOutput> {
  constructor(
    private readonly baseValidator: VldBase<TInput, TBase>,
    private readonly predicate: (value: TBase) => boolean,
    private readonly customMessage?: string
  ) {
    super();
  }
  
  parse(value: unknown): TOutput {
    const baseResult = this.baseValidator.parse(value);
    
    if (!this.predicate(baseResult)) {
      throw new Error(this.customMessage || 'Refinement check failed');
    }
    
    return baseResult as TOutput;
  }
  
  safeParse(value: unknown): ParseResult<TOutput> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}

/**
 * Transform validator - transforms data after validation
 */
export class VldTransform<TInput, TBase, TOutput> extends VldBase<TInput, TOutput> {
  constructor(
    private readonly baseValidator: VldBase<TInput, TBase>,
    private readonly transformer: (value: TBase) => TOutput
  ) {
    super();
  }
  
  parse(value: unknown): TOutput {
    const baseResult = this.baseValidator.parse(value);
    
    try {
      return this.transformer(baseResult);
    } catch (error) {
      throw new Error(`Transform failed: ${(error as Error).message}`);
    }
  }
  
  safeParse(value: unknown): ParseResult<TOutput> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}

/**
 * Default validator - provides default value for undefined
 */
export class VldDefault<TInput, TOutput> extends VldBase<TInput | undefined, TOutput> {
  constructor(
    private readonly baseValidator: VldBase<TInput, TOutput>,
    private readonly defaultValue: TOutput
  ) {
    super();
  }
  
  parse(value: unknown): TOutput {
    if (value === undefined) {
      return this.defaultValue;
    }
    return this.baseValidator.parse(value);
  }
  
  safeParse(value: unknown): ParseResult<TOutput> {
    if (value === undefined) {
      return { success: true, data: this.defaultValue };
    }
    return this.baseValidator.safeParse(value);
  }
}

/**
 * Catch validator - provides fallback value on validation error
 */
export class VldCatch<TInput, TOutput> extends VldBase<TInput, TOutput> {
  constructor(
    private readonly baseValidator: VldBase<TInput, TOutput>,
    private readonly fallbackValue: TOutput
  ) {
    super();
  }
  
  parse(value: unknown): TOutput {
    try {
      return this.baseValidator.parse(value);
    } catch {
      return this.fallbackValue;
    }
  }
  
  safeParse(value: unknown): ParseResult<TOutput> {
    const result = this.baseValidator.safeParse(value);
    if (result.success) {
      return result;
    }
    return { success: true, data: this.fallbackValue };
  }
}

/**
 * Optional validator - allows undefined
 */
export class VldOptional<TInput, TOutput> extends VldBase<TInput | undefined, TOutput | undefined> {
  constructor(private readonly baseValidator: VldBase<TInput, TOutput>) {
    super();
  }
  
  static create<TInput, TOutput>(baseValidator: VldBase<TInput, TOutput>): VldOptional<TInput, TOutput> {
    return new VldOptional(baseValidator);
  }
  
  parse(value: unknown): TOutput | undefined {
    if (value === undefined) {
      return undefined;
    }
    return this.baseValidator.parse(value);
  }
  
  safeParse(value: unknown): ParseResult<TOutput | undefined> {
    if (value === undefined) {
      return { success: true, data: undefined };
    }
    return this.baseValidator.safeParse(value);
  }
}

/**
 * Nullable validator - allows null
 */
export class VldNullable<TInput, TOutput> extends VldBase<TInput | null, TOutput | null> {
  constructor(private readonly baseValidator: VldBase<TInput, TOutput>) {
    super();
  }
  
  static create<TInput, TOutput>(baseValidator: VldBase<TInput, TOutput>): VldNullable<TInput, TOutput> {
    return new VldNullable(baseValidator);
  }
  
  parse(value: unknown): TOutput | null {
    if (value === null) {
      return null;
    }
    return this.baseValidator.parse(value);
  }
  
  safeParse(value: unknown): ParseResult<TOutput | null> {
    if (value === null) {
      return { success: true, data: null };
    }
    return this.baseValidator.safeParse(value);
  }
}

/**
 * Nullish validator - allows null or undefined
 */
export class VldNullish<TInput, TOutput> extends VldBase<TInput | null | undefined, TOutput | null | undefined> {
  constructor(private readonly baseValidator: VldBase<TInput, TOutput>) {
    super();
  }
  
  static create<TInput, TOutput>(baseValidator: VldBase<TInput, TOutput>): VldNullish<TInput, TOutput> {
    return new VldNullish(baseValidator);
  }
  
  parse(value: unknown): TOutput | null | undefined {
    if (value === null || value === undefined) {
      return value as null | undefined;
    }
    return this.baseValidator.parse(value);
  }
  
  safeParse(value: unknown): ParseResult<TOutput | null | undefined> {
    if (value === null || value === undefined) {
      return { success: true, data: value as null | undefined };
    }
    return this.baseValidator.safeParse(value);
  }
}