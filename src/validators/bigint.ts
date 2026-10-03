import { VldBase, ParseResult, VLD_VALIDATOR_TYPES, ValidatorType } from './base';
import { getMessages } from '../locales/runtime';
import { VldError, createInvalidTypeIssue, getTypeName, type VldIssue } from '../errors-core';

/**
 * Type for bigint validation check functions
 */
type BigIntCheck = (value: bigint) => boolean;

function createBigIntError(message: string): VldError {
  return new VldError([{ code: 'invalid_type', path: [], message }]);
}

/**
 * Metadata for one bigint check, so a failure reports its own Zod-style issue
 * (too_small / too_big / not_multiple_of) and message instead of the last one's.
 */
interface BigIntCheckMeta {
  readonly kind: 'min' | 'max' | 'gt' | 'lt' | 'multiple_of';
  readonly value: bigint;
  readonly message: string;
}

interface BigIntJSONSchemaHints {
  readonly minimum?: bigint;
  readonly maximum?: bigint;
  readonly exclusiveMinimum?: bigint;
  readonly exclusiveMaximum?: bigint;
}

/**
 * Configuration for bigint validator
 */
interface BigIntValidatorConfig {
  readonly checks: ReadonlyArray<BigIntCheck>;
  readonly errorMessage: string | undefined;
  readonly validatorType?: ValidatorType;
  readonly jsonSchema: BigIntJSONSchemaHints | undefined;
  readonly checkMetas?: ReadonlyArray<BigIntCheckMeta> | undefined;
}

type BigIntFastCheckMode=
  | 'none'
  | 'positive'
  | 'negative'
  | 'nonnegative'
  | 'nonpositive'
  | undefined;

/**
 * Immutable bigint validator
 */
export class VldBigInt extends VldBase<bigint, bigint> {
  protected readonly config: BigIntValidatorConfig;
  private readonly _checks: ReadonlyArray<BigIntCheck>;
  private readonly _fastCheckMode: BigIntFastCheckMode;

  /**
   * Protected constructor to allow extension while maintaining immutability
   */
  protected constructor(config?: Partial<BigIntValidatorConfig>) {
    super(config?.validatorType || VLD_VALIDATOR_TYPES.BIGINT);
    this.config = {
      checks: config?.checks || [],
      errorMessage: config?.errorMessage,
      jsonSchema: config?.jsonSchema,
      checkMetas: config?.checkMetas
    };
    this._checks = this.config.checks;
    this._fastCheckMode = this.detectFastCheckMode();
  }

  /**
   * Build a sibling validator with `config`, keeping the concrete subclass
   * (e.g. v.coerce.*) so every chain method preserves coercion.
   */
  protected derive(config: Partial<BigIntValidatorConfig>): this {
    return new (this.constructor as new (config: Partial<BigIntValidatorConfig>) => this)(config);
  }

  get jsonSchema(): BigIntJSONSchemaHints | undefined {
    return this.config.jsonSchema;
  }

  get isSimple(): boolean {
    return this._checks.length === 0;
  }

  get minValue(): bigint | null {
    return this.config.jsonSchema?.minimum ? BigInt(this.config.jsonSchema.minimum) : null;
  }

  get maxValue(): bigint | null {
    return this.config.jsonSchema?.maximum ? BigInt(this.config.jsonSchema.maximum) : null;
  }

  get format(): string | null {
    return (this.config.jsonSchema as any)?.format ?? null;
  }
  
  /**
   * Create a new bigint validator
   */
  static create(): VldBigInt {
    return new VldBigInt();
  }

  private detectFastCheckMode(): BigIntFastCheckMode {
    if (this._checks.length === 0) {
      return 'none';
    }

    if (this._checks.length !== 1) {
      return undefined;
    }

    const schema = this.config.jsonSchema;
    if (schema?.exclusiveMinimum === 0n && schema.minimum === undefined && schema.maximum === undefined) {
      return 'positive';
    }
    if (schema?.exclusiveMaximum === 0n && schema.minimum === undefined && schema.maximum === undefined) {
      return 'negative';
    }
    if (schema?.minimum === 0n && schema.maximum === undefined && schema.exclusiveMaximum === undefined) {
      return 'nonnegative';
    }
    if (schema?.maximum === 0n && schema.minimum === undefined && schema.exclusiveMinimum === undefined) {
      return 'nonpositive';
    }

    return undefined;
  }

  private getValidationError(): Error {
    return new Error(this.config.errorMessage || getMessages().invalidBigint);
  }

  /** invalid_type for a non-bigint: the type message, not the last check's. */
  private getTypeError(value: unknown): VldError {
    return new VldError([createInvalidTypeIssue('bigint', getTypeName(value), getMessages().invalidBigint)]);
  }

  /** Issue for the check at `index`, from its own metadata when present. */
  private getCheckError(index: number): Error {
    const meta = this.config.checkMetas?.[index];
    if (!meta) return this.getValidationError();
    let issue: VldIssue;
    switch (meta.kind) {
      case 'min':
      case 'gt':
        issue = { code: 'too_small', path: [], origin: 'bigint', minimum: meta.value, inclusive: meta.kind === 'min', message: meta.message };
        break;
      case 'max':
      case 'lt':
        issue = { code: 'too_big', path: [], origin: 'bigint', maximum: meta.value, inclusive: meta.kind === 'max', message: meta.message };
        break;
      default:
        issue = { code: 'not_multiple_of', path: [], origin: 'bigint', divisor: meta.value, message: meta.message };
    }
    return new VldError([issue]);
  }

  private withCheck(check: BigIntCheck, meta: BigIntCheckMeta, jsonSchema: BigIntJSONSchemaHints): VldBigInt {
    return this.derive({
      ...this.config,
      checks: [...this.config.checks, check],
      errorMessage: meta.message,
      jsonSchema,
      checkMetas: [...(this.config.checkMetas ?? []), meta]
    });
  }

  /**
   * Parse and validate a bigint value
   */
  parse(value: unknown): bigint {
    if (typeof value !== 'bigint') {
      throw this.getTypeError(value);
    }

    return this.parseKnownBigInt(value);
  }

  /**
   * Parse a value that has already passed the bigint type guard.
   * @internal Used by object validators to avoid duplicate hot-path checks.
   */
  parseKnownBigInt(value: bigint): bigint {
    switch (this._fastCheckMode) {
      case 'none':
        return value;
      case 'positive':
        if (value > 0n) return value;
        throw this.getCheckError(0);
      case 'negative':
        if (value < 0n) return value;
        throw this.getCheckError(0);
      case 'nonnegative':
        if (value >= 0n) return value;
        throw this.getCheckError(0);
      case 'nonpositive':
        if (value <= 0n) return value;
        throw this.getCheckError(0);
    }

    // Apply all checks
    const checks = this._checks;
    for (let i = 0; i < checks.length; i++) {
      if (!checks[i]!(value)) {
        throw this.getCheckError(i);
      }
    }
    
    return value;
  }
  
  /**
   * Safely parse and validate a bigint value
   */
  safeParse(value: unknown): ParseResult<bigint> {
    if (typeof value !== 'bigint') {
      return { success: false, error: this.getTypeError(value) };
    }

    try {
      return { success: true, data: this.parseKnownBigInt(value) };
    } catch (error) {
      if (error instanceof VldError) return { success: false, error };
      return { success: false, error: createBigIntError((error as Error).message) };
    }
  }
  
  /**
   * Create a new validator with minimum value constraint
   */
  min(value: bigint, message?: string): VldBigInt {
    return this.withCheck((v: bigint) => v >= value, { kind: 'min', value: value, message: message || `BigInt must be at least ${value}` }, { ...this.config.jsonSchema, minimum: value });
  }
  
  /**
   * Create a new validator with maximum value constraint
   */
  max(value: bigint, message?: string): VldBigInt {
    return this.withCheck((v: bigint) => v <= value, { kind: 'max', value: value, message: message || `BigInt must be at most ${value}` }, { ...this.config.jsonSchema, maximum: value });
  }
  
  /**
   * Create a new validator that checks for positive values
   */
  positive(message?: string): VldBigInt {
    return this.withCheck((v: bigint) => v > 0n, { kind: 'gt', value: 0n, message: message || 'BigInt must be positive' }, { ...this.config.jsonSchema, exclusiveMinimum: 0n });
  }
  
  /**
   * Create a new validator that checks for negative values
   */
  negative(message?: string): VldBigInt {
    return this.withCheck((v: bigint) => v < 0n, { kind: 'lt', value: 0n, message: message || 'BigInt must be negative' }, { ...this.config.jsonSchema, exclusiveMaximum: 0n });
  }
  
  /**
   * Create a new validator that checks for non-negative values
   */
  nonnegative(message?: string): VldBigInt {
    return this.withCheck((v: bigint) => v >= 0n, { kind: 'min', value: 0n, message: message || 'BigInt must be non-negative' }, { ...this.config.jsonSchema, minimum: 0n });
  }
  
  /**
   * Create a new validator that checks for non-positive values
   */
  nonpositive(message?: string): VldBigInt {
    return this.withCheck((v: bigint) => v <= 0n, { kind: 'max', value: 0n, message: message || 'BigInt must be non-positive' }, { ...this.config.jsonSchema, maximum: 0n });
  }

  /**
   * Create a new validator with strict greater than constraint
   * Zod 4 API parity - strictly greater than (not equal to)
   */
  gt(value: bigint | number, message?: string): VldBigInt {
    const compareValue = typeof value === 'bigint' ? value : BigInt(value);
    return this.withCheck((v: bigint) => v > compareValue, { kind: 'gt', value: compareValue, message: message || `BigInt must be greater than ${compareValue}` }, { ...this.config.jsonSchema, exclusiveMinimum: compareValue });
  }

  /**
   * Create a new validator with strict less than constraint
   * Zod 4 API parity - strictly less than (not equal to)
   */
  lt(value: bigint | number, message?: string): VldBigInt {
    const compareValue = typeof value === 'bigint' ? value : BigInt(value);
    return this.withCheck((v: bigint) => v < compareValue, { kind: 'lt', value: compareValue, message: message || `BigInt must be less than ${compareValue}` }, { ...this.config.jsonSchema, exclusiveMaximum: compareValue });
  }

  /**
   * Create a new validator with greater than or equal constraint
   * Zod 4 API parity - alias for min()
   */
  gte(value: bigint | number, message?: string): VldBigInt {
    const compareValue = typeof value === 'bigint' ? value : BigInt(value);
    return this.min(compareValue, message);
  }

  /**
   * Create a new validator with less than or equal constraint
   * Zod 4 API parity - alias for max()
   */
  lte(value: bigint | number, message?: string): VldBigInt {
    const compareValue = typeof value === 'bigint' ? value : BigInt(value);
    return this.max(compareValue, message);
  }

  /**
   * Create a new validator with multiple of constraint
   */
  multipleOf(divisor: bigint, message?: string): VldBigInt {
    return this.withCheck(
      (v: bigint) => v % divisor === 0n,
      { kind: 'multiple_of', value: divisor, message: message || `BigInt must be a multiple of ${divisor}` },
      { ...this.config.jsonSchema, multipleOf: divisor } as any
    );
  }
}
