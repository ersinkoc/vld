/**
 * VldDateV2 — OPTIMIZED: check returns Issue | null.
 */
import { VldBase, VLD_VALIDATOR_TYPES, type ErrorParam, type ParseResult } from './base';
import { VldError, createInvalidTypeIssue, getTypeName, type VldIssue } from '../errors-core';

export abstract class VldDateCheck {
  abstract readonly kind: 'min' | 'max' | 'gt' | 'lt' | 'past' | 'future' | 'today' | 'weekday' | 'weekend';
  abstract check(value: Date): VldIssue | null;
  abstract meta(): Record<string, any>;
}

function toDate(v: Date | string | number): Date { return v instanceof Date ? v : new Date(v); }

export class VldDateCheckMin extends VldDateCheck {
  readonly kind = 'min' as const;
  private _threshold: Date;
  constructor(threshold: Date | string | number, private _msg?: string) { super(); this._threshold = toDate(threshold); }
  check(value: Date): VldIssue | null {
    if (value.getTime() < this._threshold.getTime()) {
      return { code: 'too_small', path: [], origin: 'date', message: this._msg || `Date must be >= ${this._threshold.toISOString()}` };
    }
    return null;
  }
  meta() { return { kind: 'min', value: this._threshold, message: this._msg }; }
}

export class VldDateCheckMax extends VldDateCheck {
  readonly kind = 'max' as const;
  private _threshold: Date;
  constructor(threshold: Date | string | number, private _msg?: string) { super(); this._threshold = toDate(threshold); }
  check(value: Date): VldIssue | null {
    if (value.getTime() > this._threshold.getTime()) {
      return { code: 'too_big', path: [], origin: 'date', message: this._msg || `Date must be <= ${this._threshold.toISOString()}` };
    }
    return null;
  }
  meta() { return { kind: 'max', value: this._threshold, message: this._msg }; }
}

export class VldDateCheckGt extends VldDateCheck {
  readonly kind = 'gt' as const;
  private _threshold: Date;
  constructor(threshold: Date | number, private _msg?: string) { super(); this._threshold = toDate(threshold); }
  check(value: Date): VldIssue | null {
    if (value.getTime() <= this._threshold.getTime()) {
      return { code: 'too_small', path: [], origin: 'date', message: this._msg || `Date must be > ${this._threshold.toISOString()}` };
    }
    return null;
  }
  meta() { return { kind: 'gt', value: this._threshold, message: this._msg }; }
}

export class VldDateCheckLt extends VldDateCheck {
  readonly kind = 'lt' as const;
  private _threshold: Date;
  constructor(threshold: Date | number, private _msg?: string) { super(); this._threshold = toDate(threshold); }
  check(value: Date): VldIssue | null {
    if (value.getTime() >= this._threshold.getTime()) {
      return { code: 'too_big', path: [], origin: 'date', message: this._msg || `Date must be < ${this._threshold.toISOString()}` };
    }
    return null;
  }
  meta() { return { kind: 'lt', value: this._threshold, message: this._msg }; }
}

export class VldDateCheckPast extends VldDateCheck {
  readonly kind = 'past' as const;
  constructor(private _msg?: string) { super(); }
  check(value: Date): VldIssue | null {
    if (value.getTime() >= Date.now()) {
      return { code: 'custom', path: [], message: this._msg || 'Date must be in the past' };
    }
    return null;
  }
  meta() { return { kind: 'past', message: this._msg }; }
}

export class VldDateCheckFuture extends VldDateCheck {
  readonly kind = 'future' as const;
  constructor(private _msg?: string) { super(); }
  check(value: Date): VldIssue | null {
    if (value.getTime() <= Date.now()) {
      return { code: 'custom', path: [], message: this._msg || 'Date must be in the future' };
    }
    return null;
  }
  meta() { return { kind: 'future', message: this._msg }; }
}

export class VldDateCheckToday extends VldDateCheck {
  readonly kind = 'today' as const;
  constructor(private _msg?: string) { super(); }
  check(value: Date): VldIssue | null {
    const now = new Date();
    if (value.toDateString() !== now.toDateString()) {
      return { code: 'custom', path: [], message: this._msg || 'Date must be today' };
    }
    return null;
  }
  meta() { return { kind: 'today', message: this._msg }; }
}

export class VldDateCheckWeekday extends VldDateCheck {
  readonly kind = 'weekday' as const;
  constructor(private _msg?: string) { super(); }
  check(value: Date): VldIssue | null {
    const day = value.getDay();
    if (day === 0 || day === 6) {
      return { code: 'custom', path: [], message: this._msg || 'Date must be a weekday' };
    }
    return null;
  }
  meta() { return { kind: 'weekday', message: this._msg }; }
}

export class VldDateCheckWeekend extends VldDateCheck {
  readonly kind = 'weekend' as const;
  constructor(private _msg?: string) { super(); }
  check(value: Date): VldIssue | null {
    const day = value.getDay();
    if (day !== 0 && day !== 6) {
      return { code: 'custom', path: [], message: this._msg || 'Date must be a weekend' };
    }
    return null;
  }
  meta() { return { kind: 'weekend', message: this._msg }; }
}

export interface VldDateDef {
  readonly type: 'date';
  readonly checks: ReadonlyArray<VldDateCheck>;
  readonly jsonSchema?: { minimum?: string; maximum?: string; format?: string } | undefined;
  readonly errorMessage?: string | undefined;
  readonly isSimple: boolean;
}

const EMPTY_DATE_DEF: VldDateDef = Object.freeze({
  type: 'date',
  checks: Object.freeze([]) as ReadonlyArray<VldDateCheck>,
  isSimple: true,
});

function buildDateDef(checks: ReadonlyArray<VldDateCheck>, jsonSchema: VldDateDef['jsonSchema'], errorMessage: string | undefined): VldDateDef {
  return Object.freeze({
    type: 'date' as const,
    checks,
    jsonSchema,
    errorMessage,
    isSimple: checks.length === 0,
  });
}

export class VldDateV2 extends VldBase<Date, Date> {
  readonly __def: VldDateDef;

  constructor(def: VldDateDef = EMPTY_DATE_DEF) {
    super(VLD_VALIDATOR_TYPES.DATE);
    this.__def = def;
  }

  static create(): VldDateV2 { return new VldDateV2(); }

  get isSimple(): boolean { return this.__def.isSimple; }

  parse(value: unknown): Date {
    let d: Date;
    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) {
        throw new VldError([createInvalidTypeIssue('date', 'Invalid Date', this.__def.errorMessage)]);
      }
      d = value;
    } else if (typeof value === 'string' || typeof value === 'number') {
      d = new Date(value);
      if (Number.isNaN(d.getTime())) {
        throw new VldError([createInvalidTypeIssue('date', getTypeName(value), this.__def.errorMessage)]);
      }
    } else {
      throw new VldError([createInvalidTypeIssue('date', getTypeName(value), this.__def.errorMessage)]);
    }
    if (this.__def.isSimple) return d;
    return this.parseKnownDate(d);
  }

  parseKnownDate(value: Date): Date {
    const checks = this.__def.checks;
    for (let i = 0; i < checks.length; i++) {
      const issue = checks[i]!.check(value);
      if (issue !== null) throw new VldError([issue]);
    }
    return value;
  }

  safeParse(value: unknown): ParseResult<Date> {
    try { return { success: true, data: this.parse(value) }; }
    catch (e) { return { success: false, error: e instanceof VldError ? e : new VldError([{ code: 'custom', path: [], message: String(e) }]) }; }
  }

  protected withDef(def: Partial<VldDateDef> & { type: 'date' }): VldDateV2 {
    const merged = buildDateDef(
      def.checks ?? this.__def.checks,
      def.jsonSchema ?? this.__def.jsonSchema,
      def.errorMessage ?? this.__def.errorMessage
    );
    return new (this.constructor as any)(merged);
  }

  min(date: Date | string | number, message?: ErrorParam): VldDateV2 { return this.withDef({ type: 'date', checks: [...this.__def.checks, new VldDateCheckMin(date, message as string)], jsonSchema: { ...this.__def.jsonSchema, minimum: toDate(date).toISOString() } }); }
  max(date: Date | string | number, message?: ErrorParam): VldDateV2 { return this.withDef({ type: 'date', checks: [...this.__def.checks, new VldDateCheckMax(date, message as string)], jsonSchema: { ...this.__def.jsonSchema, maximum: toDate(date).toISOString() } }); }
  past(message?: ErrorParam): VldDateV2 { return this.withDef({ type: 'date', checks: [...this.__def.checks, new VldDateCheckPast(message as string)] }); }
  future(message?: ErrorParam): VldDateV2 { return this.withDef({ type: 'date', checks: [...this.__def.checks, new VldDateCheckFuture(message as string)] }); }
  today(message?: ErrorParam): VldDateV2 { return this.withDef({ type: 'date', checks: [...this.__def.checks, new VldDateCheckToday(message as string)] }); }
  weekday(message?: ErrorParam): VldDateV2 { return this.withDef({ type: 'date', checks: [...this.__def.checks, new VldDateCheckWeekday(message as string)] }); }
  weekend(message?: ErrorParam): VldDateV2 { return this.withDef({ type: 'date', checks: [...this.__def.checks, new VldDateCheckWeekend(message as string)] }); }
  gt(value: Date | number, message?: ErrorParam): VldDateV2 { return this.withDef({ type: 'date', checks: [...this.__def.checks, new VldDateCheckGt(value, message as string)] }); }
  lt(value: Date | number, message?: ErrorParam): VldDateV2 { return this.withDef({ type: 'date', checks: [...this.__def.checks, new VldDateCheckLt(value, message as string)] }); }
}
