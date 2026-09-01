/**
 * VldArrayV2 — array validator with single-def + check-class pattern.
 * Public API mirrors the legacy VldArray 1:1. Exposed via v.arrayV2().
 */
import { VldBase, VLD_VALIDATOR_TYPES, type ErrorParam, type ParseResult } from './base';
import { VldError, createInvalidTypeIssue, getTypeName } from '../errors-core';
import { getMessages } from '../locales/runtime';

type SimpleItemMode = 'string' | 'number' | 'boolean' | undefined;

export interface VldArrayCheckIssue { code: string; path: (string | number)[]; message: string; [k: string]: any }
export interface VldArrayCheckPayload { length: number; issues: VldArrayCheckIssue[] }

export abstract class VldArrayCheck {
  abstract readonly kind: 'minLength' | 'maxLength' | 'exactLength' | 'nonempty' | 'unique';
  abstract readonly message: string | undefined;
  abstract check(value: { length: number; items?: unknown[] }, payload: VldArrayCheckPayload): void;
  abstract meta(): Record<string, any>;
}

export class VldArrayCheckMin extends VldArrayCheck {
  readonly kind = 'minLength' as const;
  constructor(readonly minLength: number, msg?: string) { super(); this._msg = msg; }
  get message() { return this._msg; }
  private _msg: string | undefined;
  check(v: { length: number }, p: VldArrayCheckPayload): void {
    if (v.length < this.minLength) {
      p.issues.push({ code: 'too_small', path: [], origin: 'array', minimum: this.minLength, inclusive: true,
        message: this._msg || `Array must have at least ${this.minLength} items` });
    }
  }
  meta() { return { kind: 'minLength', value: this.minLength, message: this._msg }; }
}

export class VldArrayCheckMax extends VldArrayCheck {
  readonly kind = 'maxLength' as const;
  constructor(readonly maxLength: number, msg?: string) { super(); this._msg = msg; }
  get message() { return this._msg; }
  private _msg: string | undefined;
  check(v: { length: number }, p: VldArrayCheckPayload): void {
    if (v.length > this.maxLength) {
      p.issues.push({ code: 'too_big', path: [], origin: 'array', maximum: this.maxLength, inclusive: true,
        message: this._msg || `Array must have at most ${this.maxLength} items` });
    }
  }
  meta() { return { kind: 'maxLength', value: this.maxLength, message: this._msg }; }
}

export class VldArrayCheckLength extends VldArrayCheck {
  readonly kind = 'exactLength' as const;
  constructor(readonly exactLength: number, msg?: string) { super(); this._msg = msg; }
  get message() { return this._msg; }
  private _msg: string | undefined;
  check(v: { length: number }, p: VldArrayCheckPayload): void {
    if (v.length !== this.exactLength) {
      p.issues.push({ code: 'too_big', path: [], origin: 'array', exact: this.exactLength,
        message: this._msg || `Array must have exactly ${this.exactLength} items` });
    }
  }
  meta() { return { kind: 'exactLength', value: this.exactLength, message: this._msg }; }
}

export class VldArrayCheckUnique extends VldArrayCheck {
  readonly kind = 'unique' as const;
  constructor(msg?: string) { super(); this._msg = msg; }
  get message() { return this._msg; }
  private _msg: string | undefined;
  check(v: { length: number; items: unknown[] }, p: VldArrayCheckPayload): void {
    const seen = new Set();
    for (let i = 0; i < v.items.length; i++) {
      const item = v.items[i];
      if (seen.has(item)) {
        p.issues.push({ code: 'custom', path: [i], message: this._msg || `Duplicate item at index ${i}` });
        return;
      }
      seen.add(item);
    }
  }
  meta() { return { kind: 'unique', message: this._msg }; }
}

export interface VldArrayDef {
  readonly type: 'array';
  readonly itemValidator: VldBase<unknown, any>;
  readonly checks: ReadonlyArray<VldArrayCheck>;
  readonly simpleItemMode: SimpleItemMode;
  readonly hasUnique: boolean;
  readonly errorMessage?: string;
}

function getSimpleItemMode(v: VldBase<unknown, any>): SimpleItemMode {
  if ((v as any).isSimple !== true) return undefined;
  switch (v.validatorType) {
    case VLD_VALIDATOR_TYPES.STRING: return 'string';
    case VLD_VALIDATOR_TYPES.NUMBER: return 'number';
    case VLD_VALIDATOR_TYPES.BOOLEAN: return 'boolean';
    default: return undefined;
  }
}

export class VldArrayV2<T> extends VldBase<unknown[], T[]> {
  readonly __def: VldArrayDef;

  constructor(def: VldArrayDef) {
    super(VLD_VALIDATOR_TYPES.ARRAY);
    this.__def = def;
  }

  static create<T>(itemValidator: VldBase<unknown, T>): VldArrayV2<T> {
    return new VldArrayV2({
      type: 'array',
      itemValidator,
      checks: Object.freeze([]) as ReadonlyArray<VldArrayCheck>,
      simpleItemMode: getSimpleItemMode(itemValidator),
      hasUnique: false,
    });
  }

  get element(): VldBase<unknown, T> { return this.__def.itemValidator as VldBase<unknown, T>; }
  unwrap(): VldBase<unknown, T> { return this.__def.itemValidator as VldBase<unknown, T>; }
  get isSimple(): boolean { return this.__def.checks.length === 0; }

  parse(value: unknown): T[] {
    if (!Array.isArray(value)) {
      throw new VldError([createInvalidTypeIssue('array', getTypeName(value), this.__def.errorMessage)]);
    }
    return this.parseKnownArray(value);
  }

  parseKnownArray(value: unknown[]): T[] {
    const def = this.__def;
    const checks = def.checks;
    if (checks.length > 0) {
      // Direct conditional checks (no payload allocation, no ctx object)
      for (let i = 0; i < checks.length; i++) {
        const c = checks[i]!;
        if (c.kind === 'minLength' && value.length < (c as VldArrayCheckMin).minLength) {
          throw new VldError([{ code: 'too_small', path: [], origin: 'array',
            minimum: (c as VldArrayCheckMin).minLength, inclusive: true,
            message: c.message || `Array must have at least ${(c as VldArrayCheckMin).minLength} items` }]);
        }
        if (c.kind === 'maxLength' && value.length > (c as VldArrayCheckMax).maxLength) {
          throw new VldError([{ code: 'too_big', path: [], origin: 'array',
            maximum: (c as VldArrayCheckMax).maxLength, inclusive: true,
            message: c.message || `Array must have at most ${(c as VldArrayCheckMax).maxLength} items` }]);
        }
        if (c.kind === 'exactLength' && value.length !== (c as VldArrayCheckLength).exactLength) {
          throw new VldError([{ code: 'too_big', path: [], origin: 'array',
            exact: (c as VldArrayCheckLength).exactLength,
            message: c.message || `Array must have exactly ${(c as VldArrayCheckLength).exactLength} items` }]);
        }
        if (c.kind === 'unique' && def.hasUnique) {
          const seen = new Set<unknown>();
          for (let j = 0; j < value.length; j++) {
            const item = value[j];
            if (seen.has(item)) {
              throw new VldError([{ code: 'custom', path: [j],
                message: c.message || `Duplicate item at index ${j}` }]);
            }
            seen.add(item);
          }
        }
      }
    }

    const length = value.length;
    const result = new Array<T>(length);
    const simpleItemMode = def.simpleItemMode;
    const itemValidator = def.itemValidator;

    if (simpleItemMode !== undefined) {
      for (let i = 0; i < length; i++) {
        const item = value[i];
        switch (simpleItemMode) {
          case 'string':
            if (typeof item !== 'string') throw new Error(getMessages().arrayItem(i, getMessages().invalidString));
            result[i] = item as T; break;
          case 'number':
            if (typeof item !== 'number' || isNaN(item)) throw new Error(getMessages().arrayItem(i, getMessages().invalidNumber));
            result[i] = item as T; break;
          case 'boolean':
            if (typeof item !== 'boolean') throw new Error(getMessages().arrayItem(i, getMessages().invalidBoolean));
            result[i] = item as T; break;
        }
      }
    } else {
      for (let i = 0; i < length; i++) {
        result[i] = itemValidator.parse(value[i]) as T;
      }
    }
    return result;
  }

  safeParse(value: unknown): ParseResult<T[]> {
    try { return { success: true, data: this.parse(value) }; }
    catch (e) { return { success: false, error: e instanceof VldError ? e : new VldError([{ code: 'custom', path: [], message: String(e) }]) }; }
  }

  protected withDef(def: Partial<VldArrayDef> & { type: 'array' }): VldArrayV2<T> {
    const merged = { ...this.__def, ...def, type: 'array' as const };
    return new (this.constructor as any)(merged);
  }

  min(length: number, message?: ErrorParam): VldArrayV2<T> {
    return this.withDef({
      type: 'array',
      checks: [...this.__def.checks, new VldArrayCheckMin(length, message as string)],
    });
  }
  max(length: number, message?: ErrorParam): VldArrayV2<T> {
    return this.withDef({
      type: 'array',
      checks: [...this.__def.checks, new VldArrayCheckMax(length, message as string)],
    });
  }
  length(length: number, message?: ErrorParam): VldArrayV2<T> {
    return this.withDef({
      type: 'array',
      checks: [...this.__def.checks, new VldArrayCheckLength(length, message as string)],
    });
  }
  nonempty(message?: ErrorParam): VldArrayV2<T> {
    return this.withDef({
      type: 'array',
      checks: [...this.__def.checks, new VldArrayCheckMin(1, message as string)],
    });
  }
  unique(message?: ErrorParam): VldArrayV2<T> {
    return this.withDef({
      type: 'array',
      checks: [...this.__def.checks, new VldArrayCheckUnique(message as string)],
      hasUnique: true,
    });
  }
  between(min: number, max: number, message?: ErrorParam): VldArrayV2<T> {
    return this.withDef({
      type: 'array',
      checks: [...this.__def.checks, new VldArrayCheckMin(min, message as string), new VldArrayCheckMax(max, message as string)],
    });
  }
}
