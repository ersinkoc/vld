import { VldBase, ParseResult, VLD_VALIDATOR_TYPES } from './base';
import { VldTuple } from './tuple';
import { getMessages } from '../locales/runtime';
import { VldError, createInvalidTypeIssue, getTypeName } from '../errors-core';

type AnyFunction = (...args: any[]) => any;

function createFunctionError(message: string, value: unknown): VldError {
  return new VldError([createInvalidTypeIssue('function', getTypeName(value), message)]);
}

/** Argument values of an input tuple, in order. */
export type FunctionArgs<A extends readonly VldBase<any, any>[]> = {
  -readonly [K in keyof A]: A[K] extends VldBase<any, infer O> ? O : never;
};

/** Parsed return value of an output schema. */
export type FunctionOutput<R> = R extends VldBase<any, infer O> ? O : unknown;

/** Zod's `z.function({ input, output })` params. */
export interface FunctionParams<
  A extends readonly VldBase<any, any>[],
  R extends VldBase<any, any>
> {
  input?: A;
  output?: R;
}

/**
 * Immutable function validator
 * Validates that a value is a function, and - as in Zod 4 - can pin the
 * function's argument tuple and return schema so `implement()` returns a
 * checked wrapper.
 */
export class VldFunction<
  A extends readonly VldBase<any, any>[] = readonly VldBase<any, any>[],
  R extends VldBase<any, any> | undefined = undefined
> extends VldBase<unknown, AnyFunction> {
  private inputTuple: VldTuple<any, null> | undefined;

  private constructor(
    private readonly inputSchemas: A | undefined,
    private readonly outputSchema: R | undefined
  ) {
    super(VLD_VALIDATOR_TYPES.FUNCTION);
  }

  /**
   * Create a new function validator
   */
  static create(): VldFunction;
  static create<A extends readonly VldBase<any, any>[], R extends VldBase<any, any>>(
    params: { input: A; output: R }
  ): VldFunction<A, R>;
  static create<A extends readonly VldBase<any, any>[]>(params: { input: A }): VldFunction<A, undefined>;
  static create(params?: FunctionParams<readonly VldBase<any, any>[], VldBase<any, any>>): VldFunction<any, any> {
    return new VldFunction(params?.input, params?.output);
  }

  /** Zod: the argument tuple schema, or this schema when none was given. */
  input(): VldTuple<any, null> | this {
    if (this.inputSchemas === undefined) return this;
    let tuple = this.inputTuple;
    if (tuple === undefined) {
      tuple = VldTuple.create(...this.inputSchemas);
      this.inputTuple = tuple;
    }
    return tuple;
  }

  /** Zod: the return schema, or this schema when none was given. */
  output(): R | this {
    return this.outputSchema ?? this;
  }

  /**
   * Zod: wrap `fn` so its arguments are parsed against `input` and its return
   * value against `output`. Parse failures throw a VldError.
   */
  implement(fn: (...args: any[]) => unknown): (...args: FunctionArgs<A>) => FunctionOutput<R> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const schema = this;
    return function (this: unknown, ...args: unknown[]) {
      const parsedArgs = schema.inputSchemas === undefined
        ? args
        : (schema.input() as VldTuple<any, null>).parse(args) as unknown[];
      const result = fn.apply(this, parsedArgs);
      return schema.outputSchema === undefined ? result : schema.outputSchema.parse(result);
    } as (...args: FunctionArgs<A>) => FunctionOutput<R>;
  }

  /** Zod: `implement` for functions whose result needs async validation. */
  implementAsync(fn: (...args: any[]) => unknown): (...args: FunctionArgs<A>) => Promise<FunctionOutput<R>> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const schema = this;
    return async function (this: unknown, ...args: unknown[]) {
      const parsedArgs = schema.inputSchemas === undefined
        ? args
        : await (schema.input() as VldTuple<any, null>).parseAsync(args) as unknown[];
      const result = await fn.apply(this, parsedArgs);
      return schema.outputSchema === undefined ? result : schema.outputSchema.parseAsync(result);
    } as (...args: FunctionArgs<A>) => Promise<FunctionOutput<R>>;
  }

  /**
   * Parse and validate a function value
   */
  parse(value: unknown): AnyFunction {
    if (typeof value !== 'function') {
      throw createFunctionError(
        getMessages().invalidFunction || 'Expected a function',
        value
      );
    }

    return value as AnyFunction;
  }

  /**
   * Parse a value that has already passed the function type guard.
   * @internal Used by object validators to avoid duplicate hot-path checks.
   */
  parseKnownFunction(value: AnyFunction): AnyFunction {
    return value;
  }

  /**
   * Safely parse and validate a function value
   */
  safeParse(value: unknown): ParseResult<AnyFunction> {
    try {
      return { success: true, data: this.parse(value) };
    } catch (error) {
      return { success: false, error: createFunctionError((error as Error).message, value) };
    }
  }
}

/**
 * Helper function to create function validators
 * Usage: v.function() / v.function({ input: [v.string()], output: v.number() })
 */
export function functionValidator(): VldFunction;
export function functionValidator<A extends readonly VldBase<any, any>[], R extends VldBase<any, any>>(
  params: { input: A; output: R }
): VldFunction<A, R>;
export function functionValidator<A extends readonly VldBase<any, any>[]>(params: { input: A }): VldFunction<A, undefined>;
export function functionValidator(params?: FunctionParams<readonly VldBase<any, any>[], VldBase<any, any>>): VldFunction<any, any> {
  return VldFunction.create(params as any);
}
