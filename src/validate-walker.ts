/**
 * CSP-safe validate-only schema walker - the interpreter fallback for
 * `v.compile()` in environments where `new Function` is blocked (edge
 * runtimes, MV3 extensions, strict CSP).
 *
 * Design contract (mirrors the AOT compiler's supported-schema set):
 * - `walkValid(schema, value)` returns `true` (valid), `false` (invalid), or
 *   `null` when the walker cannot decide - callers then fall back to the
 *   runtime parser, so a `null` is always safe, never a mis-validation.
 * - Leaf checks call the schema's own `_checks` closures: the exact code the
 *   runtime parser runs, so verdicts cannot diverge from `safeParse`.
 * - Composite kinds (object/array/tuple/union/literal/enum/wrappers) follow
 *   the AOT `lower()` semantics: the same kind set, the same refusal rules
 *   (strict/passthrough/catchall objects, `unique()`, non-exact tuples,
 *   transforms, refinements, pipes, lazy schemas -> un-walkable).
 * - Unlike the runtime parser, the happy path allocates nothing (no issue
 *   objects, no error, no output building) and the failure path allocates
 *   nothing either - the payoff over `safeParse().success` in CSP builds.
 */
import { VldBase } from './validators/base';
import type { LiteralValue } from './validators/literal';

const COMPILE_INVALID = Symbol.for('@oxog/vld/compile-invalid');

type CheckClosure = (value: any) => boolean | null | undefined;

interface ArrayConfig {
  itemValidator?: VldBase<any, any>;
  element?: VldBase<any, any>;
  unique?: boolean;
}

interface ObjectConfig {
  shape?: Record<string, VldBase<any, any>>;
  strict?: boolean;
  passthrough?: boolean;
  catchall?: unknown;
}

function kindOf(schema: VldBase<any, any>): string {
  return (schema && (schema as any).constructor && (schema as any).constructor.name) || '';
}

/** SameValueZero membership matching `Array#includes` / `Set#has`. */
function sameMember(values: readonly unknown[], value: unknown): boolean {
  for (const candidate of values) {
    if (candidate === value || (Number.isNaN(candidate) && value !== value)) return true;
  }
  return false;
}

/** Apply a leaf schema's own check entries exactly as the runtime parser does.
 * Entries are either plain closures (string/number/bigint) or `{ fn }`
 * records (date bounds); both must fail closed on a falsy result. */
function checksPass(schema: VldBase<any, any>, value: unknown): boolean {
  const checks = (schema as any)._checks as Array<CheckClosure | { fn: CheckClosure }> | undefined;
  if (!checks || checks.length === 0) return true;
  for (const entry of checks) {
    const check = typeof entry === 'function' ? entry : entry?.fn;
    if (typeof check !== 'function' || !check(value)) return false;
  }
  return true;
}

/**
 * Structural walkability: every node of the schema graph (no value-driven
 * short-circuit) must be a kind the walker supports. A `false` here means
 * `walkValid` could still answer `null` mid-walk, so no validator closure
 * may be installed for such a graph.
 */
function isWalkable(schema: VldBase<any, any>, seen: Set<object>): boolean {
  const anySchema = schema as any;
  if (!schema || typeof schema !== 'object') return false;
  if (seen.has(schema)) return false; // defensive; cycles need VldLazy which is un-walkable
  seen.add(schema);

  switch (kindOf(schema)) {
    case 'VldString':
      return !anySchema._transforms?.length;
    case 'VldNumber':
    case 'VldBoolean':
    case 'VldBigInt':
    case 'VldDate':
    case 'VldNull':
    case 'VldUndefined':
    case 'VldAny':
    case 'VldUnknown':
    case 'VldLiteral':
    case 'VldEnum':
    case 'VldCatch':
      return true;
    case 'VldOptional':
    case 'VldNullable':
    case 'VldNullish':
    case 'VldDefault':
    case 'VldPrefault':
    case 'VldReadonly':
      return isWalkable(anySchema.baseValidator as VldBase<any, any>, seen);
    case 'VldArray': {
      const cfg = (anySchema.config ?? anySchema._config) as ArrayConfig | undefined;
      if (cfg?.unique) return false;
      const element = (cfg?.itemValidator ?? cfg?.element) as VldBase<any, any> | undefined;
      if (!element) return false;
      return isWalkable(element, seen);
    }
    case 'VldTuple': {
      const items = (anySchema.validators as Array<VldBase<any, any> | undefined>) || [];
      if (anySchema.restValidator) return false;
      if (anySchema._minLength !== items.length) return false;
      for (const item of items) {
        if (!item || !isWalkable(item, seen)) return false;
      }
      return true;
    }
    case 'VldObject': {
      const cfg = (anySchema._config ?? anySchema.config) as ObjectConfig | undefined;
      const shape = cfg?.shape;
      if (!shape) return false;
      if (cfg?.strict || cfg?.passthrough || cfg?.catchall) return false;
      for (const key of Object.keys(shape)) {
        const field = shape[key];
        if (!field || !isWalkable(field, seen)) return false;
      }
      return true;
    }
    case 'VldUnion':
    case 'VldXor': {
      const options = (anySchema.options ?? anySchema._options ?? anySchema.validators) as VldBase<any, any>[] | undefined;
      if (!options || options.length === 0) return false;
      for (const option of options) {
        if (!isWalkable(option, seen)) return false;
      }
      return true;
    }
    default:
      return false;
  }
}

/**
 * Walk a value against a schema for a validate-only verdict. Callers must
 * only rely on the result when `walkerValidator(schema)` returned a closure
 * (i.e. the graph passed `isWalkable`); otherwise this may answer `null`.
 */
export function walkValid(schema: VldBase<any, any>, value: unknown): boolean | null {
  const kind = kindOf(schema);
  const anySchema = schema as any;

  switch (kind) {
    case 'VldString': {
      if (typeof value !== 'string') return false;
      return checksPass(schema, value);
    }
    case 'VldNumber': {
      if (typeof value !== 'number' || !Number.isFinite(value)) return false;
      return checksPass(schema, value);
    }
    case 'VldBoolean':
      return typeof value === 'boolean';
    case 'VldBigInt': {
      if (typeof value !== 'bigint') return false;
      return checksPass(schema, value);
    }
    case 'VldDate': {
      if (!(value instanceof Date)) return false;
      if (value.getTime() !== value.getTime()) return false;
      return checksPass(schema, value);
    }
    case 'VldNull':
      return value === null;
    case 'VldUndefined':
      return value === undefined;
    case 'VldAny':
    case 'VldUnknown':
      return true;
    case 'VldLiteral': {
      const values = (anySchema._values as LiteralValue[]) || [];
      if (values.length === 0) return false;
      return sameMember(values, value);
    }
    case 'VldEnum': {
      const values = (anySchema._values as readonly (string | number)[]) || [];
      return sameMember(values, value);
    }
    case 'VldOptional': {
      if (value === undefined) return true;
      return walkValid(anySchema.baseValidator as VldBase<any, any>, value);
    }
    case 'VldNullable': {
      if (value === null) return true;
      return walkValid(anySchema.baseValidator as VldBase<any, any>, value);
    }
    case 'VldNullish': {
      if (value === null || value === undefined) return true;
      return walkValid(anySchema.baseValidator as VldBase<any, any>, value);
    }
    case 'VldDefault':
    case 'VldPrefault': {
      // An absent value is filled by the default: always valid (validate-only),
      // the same contract the AOT validate path uses.
      if (value === undefined) return true;
      return walkValid(anySchema.baseValidator as VldBase<any, any>, value);
    }
    case 'VldReadonly':
      return walkValid(anySchema.baseValidator as VldBase<any, any>, value);
    case 'VldCatch':
      // Catch always produces a value (the fallback), so validation succeeds.
      return true;
    case 'VldArray': {
      const cfg = (anySchema.config ?? anySchema._config) as
        | (ArrayConfig & { minLength?: number; maxLength?: number; exactLength?: number })
        | undefined;
      const element = (cfg?.itemValidator ?? cfg?.element) as VldBase<any, any> | undefined;
      if (!element) return null;
      if (!Array.isArray(value)) return false;
      if (typeof cfg?.exactLength === 'number') {
        if (value.length !== cfg.exactLength) return false;
      } else {
        if (typeof cfg?.minLength === 'number' && value.length < cfg.minLength) return false;
        if (typeof cfg?.maxLength === 'number' && value.length > cfg.maxLength) return false;
      }
      for (let i = 0; i < value.length; i++) {
        if (walkValid(element, value[i]) !== true) return false;
      }
      return true;
    }
    case 'VldTuple': {
      const items = (anySchema.validators as Array<VldBase<any, any> | undefined>) || [];
      if (anySchema.restValidator || anySchema._minLength !== items.length) return null;
      if (!Array.isArray(value) || value.length !== items.length) return false;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item) return null;
        if (walkValid(item, value[i]) !== true) return false;
      }
      return true;
    }
    case 'VldObject': {
      const cfg = (anySchema._config ?? anySchema.config) as ObjectConfig | undefined;
      const shape = cfg?.shape;
      if (!shape || cfg?.strict || cfg?.passthrough || cfg?.catchall) return null;
      if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
      for (const key of Object.keys(shape)) {
        const field = shape[key];
        if (!field) return null;
        const fieldKind = kindOf(field);
        // A missing key reads as undefined; any/unknown/undefined/void fields
        // accept that value, but the runtime parser still requires the key
        // itself to be present (mirrors the AOT presence check).
        if (fieldKind === 'VldAny' || fieldKind === 'VldUnknown' || fieldKind === 'VldUndefined' || fieldKind === 'VldVoid') {
          if (!Object.prototype.hasOwnProperty.call(value, key)) return false;
        }
        if (walkValid(field, (value as Record<string, unknown>)[key]) !== true) return false;
      }
      return true;
    }
    case 'VldUnion':
    case 'VldXor': {
      const options = (anySchema.options ?? anySchema._options ?? anySchema.validators) as VldBase<any, any>[] | undefined;
      if (!options || options.length === 0) return null;
      const xor = kind === 'VldXor';
      let matches = 0;
      for (const option of options) {
        if (walkValid(option, value) === true) {
          if (!xor) return true;
          matches++;
        }
      }
      // xor: exactly one option may match - both-match is invalid, like the
      // runtime parser's exclusive semantics.
      return xor ? matches === 1 : false;
    }
    default:
      return null;
  }
}

type WalkerValidator = (input: unknown) => true | typeof COMPILE_INVALID;

const walkerCache = new WeakMap<object, WalkerValidator | null>();

/**
 * Build (and memoize per schema) a CSP-safe validator with the same
 * `CompiledValidator` contract the AOT path uses: `(input) => true |
 * COMPILE_INVALID`. Returns `null` when the schema graph is not walkable;
 * those callers must keep using the runtime parser.
 */
export function walkerValidator(schema: VldBase<any, any>): WalkerValidator | null {
  const cached = walkerCache.get(schema);
  if (cached !== undefined) return cached;
  let built: WalkerValidator | null = null;
  if (isWalkable(schema, new Set())) {
    built = (input: unknown): true | typeof COMPILE_INVALID =>
      walkValid(schema, input) === true ? true : COMPILE_INVALID;
  }
  try {
    walkerCache.set(schema, built);
  } catch {
    // Non-object schemas cannot be cached; rebuild per call is acceptable.
  }
  return built;
}

export { COMPILE_INVALID };
