/**
 * Base result type for validation
 */
export type ParseResult<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: Error };

/**
 * Context for superRefine - allows adding multiple issues
 */
export interface SuperRefineContext {
  addIssue(issue: { message: string; code?: string }): void;
  path: (string | number)[];
}

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
   * BUG-NEW-017 FIX: Validate default value to ensure type safety
   * @param value The value to validate
   * @param defaultValue The default value to return on failure
   * @returns The validated value or default
   */
  parseOrDefault(value: unknown, defaultValue: TOutput): TOutput {
    const result = this.safeParse(value);
    if (result.success) {
      return result.data;
    }

    // Validate the default value to ensure it's actually valid
    const defaultResult = this.safeParse(defaultValue);
    if (!defaultResult.success) {
      throw new Error(`Invalid default value provided: ${defaultResult.error.message}`);
    }

    return defaultResult.data;
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
   * Advanced refinement with context for adding multiple issues
   * @param refinement The refinement function with context
   * @returns A new super refined validator
   */
  superRefine(
    refinement: (value: TOutput, ctx: SuperRefineContext) => void | Promise<void>
  ): VldSuperRefine<TInput, TOutput> {
    return new VldSuperRefine(this, refinement);
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

  /**
   * Pipe the output of this validator into another validator
   * @param next The next validator to pipe into
   * @returns A new piped validator
   */
  pipe<TNextOutput>(next: VldBase<TOutput, TNextOutput>): VldPipe<TInput, TOutput, TNextOutput> {
    return new VldPipe(this, next);
  }

  /**
   * Create a new validator that returns readonly output
   * Zod 4 API parity - marks output as readonly for TypeScript
   * @returns A new readonly validator
   */
  readonly(): VldReadonly<TInput, TOutput> {
    return new VldReadonly(this);
  }

  /**
   * Brand the output type with a unique brand for nominal typing
   * Zod 4 API parity - prevents accidental assignment of similarly typed values
   * @returns A new branded validator
   * @example
   * const userIdSchema = v.string().brand<'UserId'>();
   * const productIdSchema = v.string().brand<'ProductId'>();
   *
   * let userId: UserId = userIdSchema.parse('abc');
   * let productId: ProductId = productIdSchema.parse('xyz');
   *
   * userId = productId; // TypeScript error: types are incompatible
   */
  brand<TBrand extends string>(): VldBrand<TInput, TOutput, TBrand> {
    return new VldBrand(this);
  }

  /**
   * Apply an external function to transform this validator
   * Zod 4 API parity - allows external function chaining
   * @param fn External function that takes this validator and returns a new validator
   * @returns The result of applying the function to this validator
   * @example
   * const withLength = (schema: VldBase<unknown, string>) => schema.transform(s => s.length);
   * const lengthSchema = v.string().apply(withLength); // validates string, returns number
   */
  apply<TNewOutput>(fn: (schema: this) => VldBase<TInput, TNewOutput>): VldBase<TInput, TNewOutput> {
    return fn(this);
  }
}

/**
 * Readonly validator - marks output as readonly
 */
export class VldReadonly<TInput, TOutput> extends VldBase<TInput, Readonly<TOutput>> {
  constructor(private readonly baseValidator: VldBase<TInput, TOutput>) {
    super();
  }

  parse(value: unknown): Readonly<TOutput> {
    return this.baseValidator.parse(value);
  }

  safeParse(value: unknown): ParseResult<Readonly<TOutput>> {
    const result = this.baseValidator.safeParse(value);
    if (result.success) {
      return { success: true, data: result.data as Readonly<TOutput> };
    }
    return result as ParseResult<Readonly<TOutput>>;
  }
}

/**
 * Brand validator - adds a unique brand to the output type for nominal typing
 * Uses TypeScript's branded types pattern to prevent accidental assignment
 */
export class VldBrand<TInput, TOutput, TBrand extends string> extends VldBase<
  TInput,
  TOutput & { readonly __brand: TBrand }
> {
  constructor(
    private readonly baseValidator: VldBase<TInput, TOutput>
  ) {
    super();
  }

  parse(value: unknown): TOutput & { readonly __brand: TBrand } {
    return this.baseValidator.parse(value) as TOutput & {
      readonly __brand: TBrand;
    };
  }

  safeParse(value: unknown): ParseResult<TOutput & { readonly __brand: TBrand }> {
    const result = this.baseValidator.safeParse(value);
    if (result.success) {
      return {
        success: true,
        data: result.data as TOutput & { readonly __brand: TBrand }
      };
    }
    return result as ParseResult<TOutput & { readonly __brand: TBrand }>;
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

  /**
   * Pre-parse default - validates the default value instead of returning it directly
   * This is useful when the default value needs to be validated against the schema
   */
  prefault(): VldPrefault<TInput, TOutput> {
    // Return a new validator that validates the default value when parse(undefined) is called
    return new VldPrefault(this.baseValidator, this.defaultValue);
  }
}

/**
 * Prefault validator - validates the default value instead of returning it directly
 */
export class VldPrefault<TInput, TOutput> extends VldBase<TInput | undefined, TOutput> {
  constructor(
    private readonly baseValidator: VldBase<TInput, TOutput>,
    private readonly defaultValue: TOutput
  ) {
    super();
  }

  parse(value: unknown): TOutput {
    if (value === undefined) {
      // Validate the default value through the base validator
      return this.baseValidator.parse(this.defaultValue as unknown);
    }
    return this.baseValidator.parse(value);
  }

  safeParse(value: unknown): ParseResult<TOutput> {
    if (value === undefined) {
      return this.baseValidator.safeParse(this.defaultValue as unknown);
    }
    return this.baseValidator.safeParse(value);
  }

  /**
   * Calling prefault multiple times should be safe - return self
   */
  prefault(): VldPrefault<TInput, TOutput> {
    return this;
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

  unwrap(): VldBase<TInput, TOutput> {
    return this.baseValidator;
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

  unwrap(): VldBase<TInput, TOutput> {
    return this.baseValidator;
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

  unwrap(): VldBase<TInput, TOutput> {
    return this.baseValidator;
  }
}

/**
 * Pipe validator - chains validators, passing output of one to the next
 */
export class VldPipe<TInput, TIntermediate, TOutput> extends VldBase<TInput, TOutput> {
  constructor(
    private readonly first: VldBase<TInput, TIntermediate>,
    private readonly second: VldBase<TIntermediate, TOutput>
  ) {
    super();
  }

  parse(value: unknown): TOutput {
    const intermediateResult = this.first.parse(value);
    return this.second.parse(intermediateResult);
  }

  safeParse(value: unknown): ParseResult<TOutput> {
    const firstResult = this.first.safeParse(value);
    if (!firstResult.success) {
      return firstResult as ParseResult<TOutput>;
    }
    return this.second.safeParse(firstResult.data);
  }
}

/**
 * SuperRefine validator - advanced refinement with context
 */
export class VldSuperRefine<TInput, TOutput> extends VldBase<TInput, TOutput> {
  constructor(
    private readonly _inner: VldBase<TInput, TOutput>,
    private readonly _refinement: (value: TOutput, ctx: SuperRefineContext) => void | Promise<void>
  ) {
    super();
  }

  parse(value: unknown): TOutput {
    const result = this._inner.parse(value);

    const issues: { message: string; code?: string }[] = [];
    const ctx: SuperRefineContext = {
      addIssue: (issue) => issues.push(issue),
      path: []
    };

    const maybePromise = this._refinement(result, ctx);
    if (maybePromise instanceof Promise) {
      throw new Error('Use parseAsync for async refinements');
    }

    if (issues.length > 0) {
      throw new Error(issues.map(i => i.message).join('; '));
    }

    return result;
  }

  safeParse(value: unknown): ParseResult<TOutput> {
    const result = this._inner.safeParse(value);
    if (!result.success) return result as ParseResult<TOutput>;

    const issues: { message: string; code?: string }[] = [];
    const ctx: SuperRefineContext = {
      addIssue: (issue) => issues.push(issue),
      path: []
    };

    const maybePromise = this._refinement(result.data, ctx);
    if (maybePromise instanceof Promise) {
      throw new Error('Use safeParseAsync for async refinements');
    }

    if (issues.length > 0) {
      return {
        success: false,
        error: new Error(issues.map(i => i.message).join('; '))
      };
    }

    return result;
  }
}

/**
 * Preprocess validator - transforms input before validation
 */
export class VldPreprocess<TInput, TOutput> extends VldBase<unknown, TOutput> {
  constructor(
    private readonly _preprocessor: (input: unknown) => unknown,
    private readonly _schema: VldBase<TInput, TOutput>
  ) {
    super();
  }

  static create<TInput, TOutput>(
    preprocessor: (input: unknown) => unknown,
    schema: VldBase<TInput, TOutput>
  ): VldPreprocess<TInput, TOutput> {
    return new VldPreprocess(preprocessor, schema);
  }

  parse(value: unknown): TOutput {
    const preprocessed = this._preprocessor(value);
    return this._schema.parse(preprocessed);
  }

  safeParse(value: unknown): ParseResult<TOutput> {
    try {
      const preprocessed = this._preprocessor(value);
      return this._schema.safeParse(preprocessed);
    } catch (error) {
      return {
        success: false,
        error: error as Error
      };
    }
  }
}