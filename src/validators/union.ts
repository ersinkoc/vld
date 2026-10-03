import { VldBase, ParseResult, VLD_VALIDATOR_TYPES } from './base';
import { VldError, type VldIssue } from '../errors-core';
import { getMessages } from '../locales/runtime';

/**
 * Zod-style union failure: one `invalid_union` issue carrying each option's
 * issues, instead of a flattened `custom` string.
 */
function createUnionError(customMessage: string | undefined, optionErrors: unknown[] = []): VldError {
  const message = customMessage || getMessages().unionNoMatch(
    optionErrors.map(error => (error instanceof Error ? error.message : String(error)))
  );
  const errors: VldIssue[][] = optionErrors.map(error =>
    error instanceof VldError
      ? error.issues
      : [{ code: 'custom', path: [], message: error instanceof Error ? error.message : String(error) }]
  );
  return new VldError([{ code: 'invalid_union', path: [], message, errors }]);
}

type SimpleUnionMode =
  | 'string'
  | 'number'
  | 'boolean'
  | 'bigint'
  | 'symbol'
  | 'null'
  | 'undefined'
  | 'literal'
  | 'passthrough'
  | undefined;

/**
 * Optimized immutable union validator for multiple type options
 * Features type-checking shortcuts for 110x performance improvement
 */
export class VldUnion<T extends readonly VldBase<any, any>[]> extends VldBase<
  unknown,
  T[number] extends VldBase<any, infer U> ? U : never
> {
  private readonly validators: T;
  private readonly errorMessage: string | undefined;
  private readonly typeCheckers: Array<(value: unknown) => boolean>;
  private readonly simpleModes: SimpleUnionMode[];
  private readonly simpleValues: unknown[];
  
  /**
   * Private constructor to enforce immutability
   */
  private constructor(
    validators: T,
    errorMessage?: string
  ) {
    super(VLD_VALIDATOR_TYPES.UNION);
    this.validators = validators;
    this.errorMessage = errorMessage;
    this.typeCheckers = validators.map(validator => this.createTypeChecker(validator));
    this.simpleModes = validators.map(validator => this.createSimpleMode(validator));
    this.simpleValues = validators.map((validator, i) =>
      this.simpleModes[i] === 'literal' ? (validator as { literal?: unknown }).literal : undefined
    );
  }

  get options(): T {
    return this.validators;
  }

  private createSimpleMode(validator: VldBase<any, any>): SimpleUnionMode {
    if ((validator as { isSimple?: boolean }).isSimple !== true) {
      return undefined;
    }

    switch (validator.validatorType) {
      case VLD_VALIDATOR_TYPES.STRING:
        return 'string';
      case VLD_VALIDATOR_TYPES.NUMBER:
        return 'number';
      case VLD_VALIDATOR_TYPES.BOOLEAN:
        return 'boolean';
      case VLD_VALIDATOR_TYPES.BIGINT:
        return 'bigint';
      case VLD_VALIDATOR_TYPES.SYMBOL:
        return 'symbol';
      case VLD_VALIDATOR_TYPES.NULL:
        return 'null';
      case VLD_VALIDATOR_TYPES.UNDEFINED:
      case VLD_VALIDATOR_TYPES.VOID:
        return 'undefined';
      case VLD_VALIDATOR_TYPES.LITERAL:
        return 'literal';
      case VLD_VALIDATOR_TYPES.ANY:
      case VLD_VALIDATOR_TYPES.UNKNOWN:
        return 'passthrough';
      default:
        return undefined;
    }
  }

  private parseSimpleValue(mode: SimpleUnionMode, index: number, value: unknown): unknown {
    switch (mode) {
      case 'string':
      case 'number':
      case 'boolean':
      case 'bigint':
      case 'symbol':
        return value;
      case 'null':
        return null;
      case 'undefined':
        return undefined;
      case 'literal':
        return this.simpleValues[index];
      case 'passthrough':
        return value;
      default:
        return undefined;
    }
  }
  
  /**
   * Create type checker based on validator type for fast path optimization
   * Uses a safer approach that's less prone to spoofing
   */
  private createTypeChecker(validator: VldBase<any, any>): (value: unknown) => boolean {
    switch (validator.validatorType) {
      case VLD_VALIDATOR_TYPES.STRING:
        return (v) => typeof v === 'string';
      case VLD_VALIDATOR_TYPES.NUMBER:
        return (v) => typeof v === 'number' && Number.isFinite(v);
      case VLD_VALIDATOR_TYPES.BOOLEAN:
        return (v) => typeof v === 'boolean';
      case VLD_VALIDATOR_TYPES.BIGINT:
        return (v) => typeof v === 'bigint';
      case VLD_VALIDATOR_TYPES.SYMBOL:
        return (v) => typeof v === 'symbol';
      case VLD_VALIDATOR_TYPES.NAN:
        return (v) => typeof v === 'number' && Number.isNaN(v);
      case VLD_VALIDATOR_TYPES.ARRAY:
        return Array.isArray;
      case VLD_VALIDATOR_TYPES.OBJECT:
        return (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
      case VLD_VALIDATOR_TYPES.NULL:
        return (v) => v === null;
      case VLD_VALIDATOR_TYPES.UNDEFINED:
      case VLD_VALIDATOR_TYPES.VOID:
        return (v) => v === undefined;
      case VLD_VALIDATOR_TYPES.ENUM:
        return (v) => typeof v === 'string' || typeof v === 'number';
      case VLD_VALIDATOR_TYPES.LITERAL: {
        // v.literal(['a', 'b']) holds several values; test them all.
        const values = (validator as { values?: readonly unknown[] }).values ?? [(validator as { literal?: unknown }).literal];
        return (v) => values.includes(v);
      }
      case VLD_VALIDATOR_TYPES.NEVER:
        return () => false;
      case VLD_VALIDATOR_TYPES.ANY:
      case VLD_VALIDATOR_TYPES.UNKNOWN:
        return () => true;
      default:
        return () => true;
    }
  }
  
  /**
   * Create a new union validator
   */
  static create<T extends readonly VldBase<any, any>[]>(...validators: T): VldUnion<T> {
    return new VldUnion(validators);
  }
  
  /**
   * Parse and validate a value against union options
   * Optimized with type checking and direct parsing to avoid success-result allocations
   * BUG-NEW-013 FIX: Single-pass error collection to avoid double parsing
   */
  parse(value: unknown): T[number] extends VldBase<any, infer U> ? U : never {
    // Single pass: collect errors during validation
    let optionErrors: unknown[] | undefined;

    for (let i = 0; i < this.validators.length; i++) {
      const validator = this.validators[i]!;
      const typeChecker = this.typeCheckers[i];

      // Skip validators that definitely won't match based on type
      if (typeChecker && !typeChecker(value)) {
        continue;
      }

      const simpleMode = this.simpleModes[i];
      if (simpleMode !== undefined) {
        return this.parseSimpleValue(simpleMode, i, value) as T[number] extends VldBase<any, infer U> ? U : never;
      }

      try {
        return validator.parse(value);
      } catch (error) {
        (optionErrors ??= [])[i] = error;
      }
    }

    // All validators failed - throw with collected errors
    throw createUnionError(this.errorMessage, this.collectOptionErrors(value, optionErrors));
  }
  
  /**
   * Safely parse and validate a value against union options
   * Optimized version using type checking shortcuts
   * BUG-NEW-013 FIX: Single-pass error collection to avoid double parsing
   */
  safeParse(value: unknown): ParseResult<T[number] extends VldBase<any, infer U> ? U : never> {
    // Single pass: collect errors during validation
    let optionErrors: unknown[] | undefined;

    for (let i = 0; i < this.validators.length; i++) {
      const validator = this.validators[i]!;
      const typeChecker = this.typeCheckers[i];

      // Skip validators that definitely won't match based on type
      if (typeChecker && !typeChecker(value)) {
        continue;
      }

      const simpleMode = this.simpleModes[i];
      if (simpleMode !== undefined) {
        return {
          success: true,
          data: this.parseSimpleValue(simpleMode, i, value) as T[number] extends VldBase<any, infer U> ? U : never
        };
      }

      try {
        return { success: true, data: validator.parse(value) };
      } catch (error) {
        (optionErrors ??= [])[i] = error;
      }
    }

    // All validators failed - return error with collected messages
    return {
      success: false,
      error: createUnionError(this.errorMessage, this.collectOptionErrors(value, optionErrors))
    };
  }

  /**
   * Failure path only: one entry per option, in order. Options skipped by the
   * type pre-check never ran; their (type-mismatch) errors are computed here,
   * which runs no user code.
   */
  private collectOptionErrors(value: unknown, recorded: unknown[] | undefined): unknown[] {
    const all: unknown[] = [];
    for (let i = 0; i < this.validators.length; i++) {
      if (recorded !== undefined && recorded[i] !== undefined) {
        all.push(recorded[i]);
        continue;
      }
      const result = this.validators[i]!.safeParse(value);
      if (!result.success) all.push(result.error);
    }
    return all;
  }

  /** Async parse: the first option whose parseAsync succeeds wins. */
  override async parseAsync(value: unknown): Promise<T[number] extends VldBase<any, infer U> ? U : never> {
    const optionErrors: unknown[] = [];
    for (const validator of this.validators) {
      const result = await validator.safeParseAsync(value);
      if (result.success) return result.data as any;
      optionErrors.push(result.error);
    }
    throw createUnionError(this.errorMessage, optionErrors);
  }

  /** Encode with the first option that accepts the value (codecs run their encoder). */
  override safeEncode(value: any): ParseResult<any> {
    let optionErrors: unknown[] | undefined;
    for (const validator of this.validators) {
      const result = validator.safeEncode(value);
      if (result.success) return result;
      (optionErrors ??= []).push(result.error);
    }
    return { success: false, error: createUnionError(this.errorMessage, optionErrors) };
  }

  override encode(value: any): any {
    const result = this.safeEncode(value);
    if (!result.success) throw result.error;
    return result.data;
  }
}
