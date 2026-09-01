/**
 * V2 wrappers: VldOptionalV2, VldNullableV2, VldNullishV2, VldRefineV2, VldTransformV2.
 * All single-def pattern. Public API mirrors legacy wrappers 1:1.
 */
import { VldBase, VLD_VALIDATOR_TYPES, type ParseResult, ensureVldError } from './base';
import { VldError } from '../errors-core';

// --------------------------------------------------------------------------
// VldOptionalV2
// --------------------------------------------------------------------------

export interface VldOptionalDef<TInput, TOutput> {
  readonly type: 'optional';
  readonly inner: VldBase<TInput, TOutput>;
}

export class VldOptionalV2<TInput, TOutput> extends VldBase<TInput | undefined, TOutput | undefined> {
  readonly __def: VldOptionalDef<TInput, TOutput>;

  constructor(inner: VldBase<TInput, TOutput>) {
    super(VLD_VALIDATOR_TYPES.OPTIONAL);
    this.__def = Object.freeze({ type: 'optional', inner });
  }

  static create<TInput, TOutput>(baseValidator: VldBase<TInput, TOutput>): VldOptionalV2<TInput, TOutput> {
    return new VldOptionalV2(baseValidator);
  }

  parse(value: unknown): TOutput | undefined {
    if (value === undefined) return undefined;
    return this.__def.inner.parse(value);
  }

  safeParse(value: unknown): ParseResult<TOutput | undefined> {
    if (value === undefined) return { success: true, data: undefined };
    return this.__def.inner.safeParse(value);
  }

  unwrap(): VldBase<TInput, TOutput> { return this.__def.inner; }
}

// --------------------------------------------------------------------------
// VldNullableV2
// --------------------------------------------------------------------------

export interface VldNullableDef<TInput, TOutput> {
  readonly type: 'nullable';
  readonly inner: VldBase<TInput, TOutput>;
}

export class VldNullableV2<TInput, TOutput> extends VldBase<TInput | null, TOutput | null> {
  readonly __def: VldNullableDef<TInput, TOutput>;

  constructor(inner: VldBase<TInput, TOutput>) {
    super(VLD_VALIDATOR_TYPES.NULLABLE);
    this.__def = Object.freeze({ type: 'nullable', inner });
  }

  static create<TInput, TOutput>(baseValidator: VldBase<TInput, TOutput>): VldNullableV2<TInput, TOutput> {
    return new VldNullableV2(baseValidator);
  }

  parse(value: unknown): TOutput | null {
    if (value === null) return null;
    return this.__def.inner.parse(value);
  }

  safeParse(value: unknown): ParseResult<TOutput | null> {
    if (value === null) return { success: true, data: null };
    return this.__def.inner.safeParse(value);
  }

  unwrap(): VldBase<TInput, TOutput> { return this.__def.inner; }
}

// --------------------------------------------------------------------------
// VldNullishV2
// --------------------------------------------------------------------------

export interface VldNullishDef<TInput, TOutput> {
  readonly type: 'nullish';
  readonly inner: VldBase<TInput, TOutput>;
}

export class VldNullishV2<TInput, TOutput> extends VldBase<TInput | null | undefined, TOutput | null | undefined> {
  readonly __def: VldNullishDef<TInput, TOutput>;

  constructor(inner: VldBase<TInput, TOutput>) {
    super(VLD_VALIDATOR_TYPES.NULLISH);
    this.__def = Object.freeze({ type: 'nullish', inner });
  }

  static create<TInput, TOutput>(baseValidator: VldBase<TInput, TOutput>): VldNullishV2<TInput, TOutput> {
    return new VldNullishV2(baseValidator);
  }

  parse(value: unknown): TOutput | null | undefined {
    if (value === null || value === undefined) return value;
    return this.__def.inner.parse(value);
  }

  safeParse(value: unknown): ParseResult<TOutput | null | undefined> {
    if (value === null || value === undefined) return { success: true, data: value };
    return this.__def.inner.safeParse(value);
  }

  unwrap(): VldBase<TInput, TOutput> { return this.__def.inner; }
}

// --------------------------------------------------------------------------
// VldRefineV2
// --------------------------------------------------------------------------

export interface VldRefineDef<TInput, TBase> {
  readonly type: 'refine';
  readonly inner: VldBase<TInput, TBase>;
  readonly predicate: (value: TBase) => boolean | Promise<boolean>;
  readonly message: string;
  readonly path?: ReadonlyArray<string | number> | undefined;
}

export class VldRefineV2<TInput, TBase, TOutput extends TBase = TBase> extends VldBase<TInput, TOutput> {
  readonly __def: VldRefineDef<TInput, TBase>;

  constructor(
    inner: VldBase<TInput, TBase>,
    predicate: (value: TBase) => boolean | Promise<boolean>,
    message: string = 'Refinement check failed',
    path?: ReadonlyArray<string | number>
  ) {
    super(VLD_VALIDATOR_TYPES.REFINE);
    this.__def = Object.freeze({ type: 'refine', inner, predicate, message, path });
  }

  static create<TInput, TBase, TOutput extends TBase = TBase>(
    inner: VldBase<TInput, TBase>,
    predicate: (value: TBase) => value is TOutput,
    message?: string
  ): VldRefineV2<TInput, TBase, TOutput>;
  static create<TInput, TBase, TOutput extends TBase = TBase>(
    inner: VldBase<TInput, TBase>,
    predicate: (value: TBase) => boolean | Promise<boolean>,
    message?: string
  ): VldRefineV2<TInput, TBase, TOutput>;
  static create<TInput, TBase, TOutput extends TBase = TBase>(
    inner: VldBase<TInput, TBase>,
    predicate: (value: TBase) => boolean | Promise<boolean>,
    message: string = 'Refinement check failed'
  ): VldRefineV2<TInput, TBase, TOutput> {
    return new VldRefineV2<TInput, TBase, TOutput>(inner, predicate, message);
  }

  override parse(value: unknown): TOutput {
    const baseResult = this.__def.inner.parse(value) as TBase;
    const passed = this.__def.predicate(baseResult);
    if (passed instanceof Promise) {
      throw new Error('Use parseAsync for async refinements');
    }
    if (!passed) {
      throw new VldError([{
        code: 'custom',
        path: this.__def.path ? [...this.__def.path] : [],
        message: this.__def.message,
      }]);
    }
    return baseResult as TOutput;
  }

  override safeParse(value: unknown): ParseResult<TOutput> {
    try { return { success: true, data: this.parse(value) }; }
    catch (e) { return { success: false, error: ensureVldError(e) }; }
  }

  override async parseAsync(value: unknown): Promise<TOutput> {
    const baseResult = await this.__def.inner.parseAsync(value);
    if (!await this.__def.predicate(baseResult as TBase)) {
      throw new VldError([{ code: 'custom', path: [], message: this.__def.message }]);
    }
    return baseResult as TOutput;
  }

  override async safeParseAsync(value: unknown): Promise<ParseResult<TOutput>> {
    try { return { success: true, data: await this.parseAsync(value) }; }
    catch (e) { return { success: false, error: ensureVldError(e) }; }
  }

  unwrap(): VldBase<TInput, TBase> { return this.__def.inner; }
}

// --------------------------------------------------------------------------
// VldTransformV2
// --------------------------------------------------------------------------

export interface VldTransformDef<TInput, TBase, TOutput> {
  readonly type: 'transform';
  readonly inner: VldBase<TInput, TBase>;
  readonly transformer: (value: TBase) => TOutput | Promise<TOutput>;
}

export class VldTransformV2<TInput, TBase, TOutput> extends VldBase<TInput, TOutput> {
  readonly __def: VldTransformDef<TInput, TBase, TOutput>;

  constructor(inner: VldBase<TInput, TBase>, transformer: (value: TBase) => TOutput | Promise<TOutput>) {
    super(VLD_VALIDATOR_TYPES.TRANSFORM);
    this.__def = Object.freeze({ type: 'transform', inner, transformer });
  }

  static create<TInput, TBase, TOutput>(
    inner: VldBase<TInput, TBase>,
    transformer: (value: TBase) => TOutput | Promise<TOutput>
  ): VldTransformV2<TInput, TBase, TOutput> {
    return new VldTransformV2(inner, transformer);
  }

  override parse(value: unknown): TOutput {
    const baseResult = this.__def.inner.parse(value);
    try {
      const out = this.__def.transformer(baseResult as TBase);
      if (out instanceof Promise) {
        throw new Error('Use parseAsync for async transforms');
      }
      return out;
    } catch (e) {
      throw new Error(`Transform failed: ${(e as Error).message}`);
    }
  }

  override safeParse(value: unknown): ParseResult<TOutput> {
    try { return { success: true, data: this.parse(value) }; }
    catch (e) { return { success: false, error: ensureVldError(e) }; }
  }

  override async parseAsync(value: unknown): Promise<TOutput> {
    const baseResult = await this.__def.inner.parseAsync(value);
    return this.__def.transformer(baseResult as TBase);
  }

  override async safeParseAsync(value: unknown): Promise<ParseResult<TOutput>> {
    try { return { success: true, data: await this.parseAsync(value) }; }
    catch (e) { return { success: false, error: ensureVldError(e) }; }
  }

  unwrap(): VldBase<TInput, TBase> { return this.__def.inner; }
}
