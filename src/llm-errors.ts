/**
 * LLM-oriented error and schema tooling for structured-output retry loops.
 *
 * The design follows a measurement, not a preference (ata-validator's
 * retry-message experiment, MIT): feeding conventional error text back to a
 * model recovers constraints it could infer from context, and never recovers
 * constraints it could not - an internal vocabulary above all. A model that
 * sees "must be equal to one of the allowed values" for an enum guesses; it
 * guesses plausibly ("HH" for Hamburg, "FR" for Lyon) and is always wrong.
 * Naming the allowed values took recovery from 0 of 30 to 30 of 30.
 *
 * `toRetryMessage` therefore never throws away the halves a model needs:
 * where the failure was, what was expected (enum values and bounds named
 * explicitly), and what actually arrived. `describeSchema` is the other half
 * of the loop - the constraints to put in the prompt that asks for the first
 * attempt, derived from the schema so the two cannot drift.
 */
import type { VldBase } from './validators/base';
import { VldError, type VldIssue } from './errors-core';

function kindOf(schema: VldBase<any, any>): string {
  return (schema && (schema as any).constructor && (schema as any).constructor.name) || '';
}

/** JSON-literal rendering that stays safe for cyclic/exotic values. */
function lit(value: unknown): string {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

/**
 * Render a value for a `got ...` clause. Containers are suppressed: a model
 * can see its own object output, and a serialized object is the most
 * expensive thing that can go into a prompt while telling the model nothing
 * new. Primitives (the values models actually get wrong - enum members,
 * bounds, types) are kept.
 */
function renderReceived(value: unknown): string {
  if (value === undefined) return '';
  if (value === null) return 'null';
  if (typeof value === 'string') {
    // Long strings are truncated; the model can see the rest of its output.
    const text = value.length > 80 ? value.slice(0, 77) + '...' : value;
    return JSON.stringify(text);
  }
  if (typeof value === 'number' || typeof value === 'bigint' || typeof value === 'boolean') {
    return String(value);
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  // Objects, arrays, symbols, functions: nothing a retry can act on.
  return '';
}

/** The constraint phrase for one issue, naming what a model must match. */
function stripFieldWrapper(message: string): string {
  // Object-field issues wrap as 'Invalid field "x": ...'; the retry line's
  // path prefix already says where, so the wrapper is stutter.
  const match = /^Invalid field "[^"]*": /.exec(message);
  return match ? message.slice(match[0].length) : message;
}
function issueDetail(issue: VldIssue): string {
  switch (issue.code) {
    case 'invalid_value': {
      // The measured case: an enum/literal vocabulary must be listed, not
      // described. Prefer the raw values over the message text, because the
      // message may elide them ("one of the allowed values").
      if (Array.isArray(issue.values) && issue.values.length > 0) {
        return `must be one of ${issue.values.map(lit).join(', ')}`;
      }
      return stripFieldWrapper(issue.message);
    }
    case 'too_small':
    case 'too_big': {
      const bound = issue.minimum ?? issue.maximum;
      if (typeof bound === 'number' && !Number.isNaN(bound)) {
        // ata's money insight generalized: 0.01 is how a schema says "money",
        // but a model acts on "rounded to 2 decimal places".
        if (issue.code === 'too_small' && issue.origin === 'number' && bound > 0 && bound < 1) {
          const places = Math.round(Math.log10(1 / bound));
          if (Math.abs(10 ** -places - bound) < Number.EPSILON * 8) {
            return `must be rounded to ${places} decimal place${places === 1 ? '' : 's'}`;
          }
        }
        const text = stripFieldWrapper(issue.message);
        return text.includes(String(bound)) ? text : `${text} (${bound})`;
      }
      return stripFieldWrapper(issue.message);
    }
    case 'unrecognized_keys':
      return Array.isArray(issue.keys) && issue.keys.length > 0
        ? `unexpected key${issue.keys.length === 1 ? '' : 's'}: ${issue.keys.map(lit).join(', ')} (remove or move them)`
        : issue.message;
    default:
      return stripFieldWrapper(issue.message);
  }
}

/** Options for {@link toRetryMessage}. */
export interface RetryMessageOptions {
  /** Most issues to include. Defaults to 20: a model does not act on a long
   * list, and every line goes into the retry prompt. */
  limit?: number;
  /** The original submitted value. vld issues keep the hot path allocation-
   * free, so the offending value is recovered by walking each issue's path
   * into this input - the retry loop has it by definition (it just received
   * it back). Without it, `got ...` clauses use the issue message only. */
  input?: unknown;
}

/** Read the value an issue's path points at inside the submitted input. */
function resolvePath(input: unknown, path: PropertyKey[]): unknown {
  let current: unknown = input;
  for (const segment of path) {
    if (current === null || current === undefined) return undefined;
    if (typeof segment === 'number') {
      if (!Array.isArray(current)) return undefined;
      current = current[segment];
    } else {
      if (typeof current !== 'object') return undefined;
      current = (current as Record<PropertyKey, unknown>)[segment];
    }
  }
  return current;
}

function pathOf(issue: VldIssue): string {
  if (!issue.path || issue.path.length === 0) return '/';
  const segments = issue.path.map((segment) =>
    typeof segment === 'string' ? `/${segment}` : `/${String(segment)}`
  );
  return segments.join('').replace(/\/\//g, '/') || '/';
}

/**
 * A validation failure as a compact string to send back to a model in a
 * retry loop: `where: what was expected, got what arrived`, one line per
 * issue, enum values named, containers suppressed, at most `limit` lines.
 *
 * Accepts a `VldError`, a `{ success: false; error }` safe-parse result, or a
 * thrown error value; anything else renders as an empty string.
 */
export function toRetryMessage(
  failure: VldError | { error: VldError } | unknown,
  options?: RetryMessageOptions
): string {
  let issues: VldIssue[] | undefined;
  if (failure instanceof VldError) {
    issues = failure.issues;
  } else if (failure && typeof failure === 'object' && failure instanceof Object) {
    const candidate = (failure as { error?: unknown }).error;
    if (candidate instanceof VldError) {
      issues = candidate.issues;
    }
  }
  if (!issues || issues.length === 0) return '';
  const limit = typeof options?.limit === 'number' && options.limit > 0 ? options.limit : 20;
  const shown = issues.length > limit ? issues.slice(0, limit) : issues;

  const lines: string[] = [];
  for (const issue of shown) {
    const detail = issueDetail(issue);
    let receivedSource: unknown;
    if (options && 'input' in options) {
      receivedSource = resolvePath(options.input, issue.path);
    }
    const received = renderReceived(receivedSource);
    const got = received && !detail.includes(received) ? `, got ${received}` : '';
    lines.push(`${pathOf(issue)}: ${detail}${got}`);
  }
  if (issues.length > shown.length) {
    lines.push(`and ${issues.length - shown.length} more`);
  }
  return lines.join('\n');
}

/** Options for {@link describeSchema}. */
export interface DescribeSchemaOptions {
  /** Most lines to emit. Defaults to 30: prompts are not free either. */
  limit?: number;
}

const MAX_DESCRIBE_DEPTH = 12;

/**
 * The schema's constraints as prose, for the prompt that asks a model to
 * produce a document. Derived from the schema so the description and the
 * enforcement cannot drift. Enum vocabularies are listed verbatim - the
 * measured difference between 0/30 and 23/30 first-attempt validity.
 *
 * Scope mirrors the walkable kinds of the CSP walker (primitives with
 * bounds/formats, enums/literals, arrays/tuples, objects, wrappers); unions
 * are summarized per option; anything else renders as `any` rather than
 * being guessed at.
 */
export function describeSchema(
  schema: VldBase<any, any>,
  options?: DescribeSchemaOptions,
  depth = 0
): string {
  const limit = depth === 0 && options?.limit === undefined ? 30 : options?.limit ?? 30;
  const lines = describeLines(schema, '', depth);
  return lines.length > limit ? lines.slice(0, limit).concat([`and ${lines.length - limit} more constraints`]).join('\n') : lines.join('\n');
}

function describeLines(schema: VldBase<any, any>, prefix: string, depth: number): string[] {
  if (depth > MAX_DESCRIBE_DEPTH || !schema) return [`${prefix || '/'}: any`];
  const anySchema = schema as any;
  const kind = kindOf(schema);

  switch (kind) {
    case 'VldEnum': {
      const values = (anySchema._values as unknown[]) || [];
      return [`${prefix || '/'}: one of ${values.map(lit).join(', ')}`];
    }
    case 'VldLiteral': {
      const values = (anySchema._values as unknown[]) || [];
      return values.length === 1
        ? [`${prefix || '/'}: exactly ${lit(values[0])}`]
        : [`${prefix || '/'}: one of ${values.map(lit).join(', ')}`];
    }
    case 'VldString': {
      const constraints = describeStringChecks(anySchema);
      return [`${prefix || '/'}: string${constraints ? ', ' + constraints : ''}`];
    }
    case 'VldNumber': {
      const constraints = describeNumberChecks(anySchema);
      return [`${prefix || '/'}: number${constraints ? ', ' + constraints : ''}`];
    }
    case 'VldBoolean':
      return [`${prefix || '/'}: boolean`];
    case 'VldBigInt':
      return [`${prefix || '/'}: bigint`];
    case 'VldDate':
      return [`${prefix || '/'}: date (ISO 8601)`];
    case 'VldNull':
      return [`${prefix || '/'}: null`];
    case 'VldUndefined':
    case 'VldVoid':
      return [`${prefix || '/'}: undefined`];
    case 'VldAny':
    case 'VldUnknown':
      return [`${prefix || '/'}: any`];
    case 'VldCatch':
      return [`${prefix || '/'}: any (invalid input is replaced)`];
    case 'VldOptional':
    case 'VldNullable':
    case 'VldNullish':
    case 'VldReadonly':
      return describeLines(anySchema.baseValidator as VldBase<any, any>, prefix, depth + 1);
    case 'VldDefault':
    case 'VldPrefault': {
      const inner = describeLines(anySchema.baseValidator as VldBase<any, any>, prefix, depth + 1);
      return inner.map((line) => `${line} (optional)`);
    }
    case 'VldArray': {
      const cfg = anySchema.config ?? anySchema._config;
      const element = (cfg?.itemValidator ?? cfg?.element) as VldBase<any, any> | undefined;
      const bounds: string[] = [];
      if (typeof cfg?.exactLength === 'number') bounds.push(`exactly ${cfg.exactLength}`);
      else {
        if (typeof cfg?.minLength === 'number') bounds.push(`at least ${cfg.minLength}`);
        if (typeof cfg?.maxLength === 'number') bounds.push(`at most ${cfg.maxLength}`);
      }
      if (cfg?.unique) bounds.push('unique items');
      const selfLine = `${prefix || '/'}: array${bounds.length ? ' of ' + bounds.join(', ') : ''}`;
      if (!element) return [selfLine];
      const itemLines = describeLines(element, `${prefix || ''}/*`, depth + 1);
      return [selfLine, ...itemLines];
    }
    case 'VldTuple': {
      const items = (anySchema.validators as Array<VldBase<any, any> | undefined>) || [];
      const out: string[] = [`${prefix || '/'}: tuple of ${items.length} items`];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item) out.push(...describeLines(item, `${prefix || ''}/${i}`, depth + 1));
      }
      return out;
    }
    case 'VldObject': {
      const cfg = anySchema._config ?? anySchema.config;
      const shape = cfg?.shape as Record<string, VldBase<any, any>> | undefined;
      if (!shape) return [`${prefix || '/'}: object`];
      const out: string[] = [];
      for (const key of Object.keys(shape)) {
        out.push(...describeLines(shape[key]!, `${prefix || ''}/${key}`, depth + 1));
      }
      return out.length > 0 ? out : [`${prefix || '/'}: object (no fields)`];
    }
    case 'VldUnion':
    case 'VldXor': {
      const options = (anySchema.options ?? anySchema._options ?? anySchema.validators) as VldBase<any, any>[] | undefined;
      if (!options || options.length === 0) return [`${prefix || '/'}: any`];
      const first = describeLines(options[0]!, prefix, depth + 1);
      return [`${prefix || '/'}: one of ${options.length} shapes (first shown)`, ...first];
    }
    default:
      // Refinements, pipes, transforms, records, lazy: `any` rather than a guess.
      return [`${prefix || '/'}: any`];
  }
}

function describeStringChecks(schema: any): string {
  const metas = schema._checkMetas as Array<{ kind: string; value?: number; format?: string; pattern?: string }> | undefined;
  if (!metas || metas.length === 0) return '';
  const out: string[] = [];
  let min: number | undefined;
  let max: number | undefined;
  for (const meta of metas) {
    switch (meta.kind) {
      case 'min': min = meta.value; break;
      case 'max': max = meta.value; break;
      case 'length': min = meta.value; max = meta.value; break;
      case 'format':
        if (meta.format === 'email') out.push('email address');
        else if (meta.format === 'url') out.push('URL');
        else if (meta.format === 'uuid') out.push('UUID');
        else if (meta.format === 'starts_with' || meta.format === 'ends_with' || meta.format === 'includes') {
          // Affix values live in the jsonSchema hints; approximate.
        } else if (meta.pattern) {
          out.push(`matching ${meta.pattern}`);
        } else if (meta.format) {
          out.push(`${meta.format} format`);
        }
        break;
      case 'regex':
        if (meta.pattern) out.push(`matching ${meta.pattern}`);
        break;
    }
  }
  if (min !== undefined && max !== undefined) {
    out.unshift(min === max ? `exactly ${min} characters` : `at least ${min} characters, at most ${max} characters`);
  } else if (min !== undefined) out.unshift(`at least ${min} characters`);
  else if (max !== undefined) out.unshift(`at most ${max} characters`);
  return out.join(', ');
}

function describeNumberChecks(schema: any): string {
  const metas = schema._checkMetas as Array<{ kind: string; value?: number; inclusive?: boolean }> | undefined;
  if (!metas || metas.length === 0) return '';
  const out: string[] = [];
  let min: number | undefined;
  let max: number | undefined;
  let minExclusive = false;
  let maxExclusive = false;
  for (const meta of metas) {
    switch (meta.kind) {
      case 'min':
        min = meta.value;
        minExclusive = meta.inclusive === false;
        break;
      case 'max':
        max = meta.value;
        maxExclusive = meta.inclusive === false;
        break;
      case 'gt': min = meta.value; minExclusive = true; break;
      case 'lt': max = meta.value; maxExclusive = true; break;
      case 'int': case 'safe': out.push('integer'); break;
      case 'multipleOf':
      case 'multiple_of':
        if (typeof meta.value === 'number' && meta.value > 0 && meta.value < 1) {
          const places = Math.round(Math.log10(1 / meta.value));
          if (Math.abs(10 ** -places - meta.value) < Number.EPSILON * 8) {
            out.push(`rounded to ${places} decimal place${places === 1 ? '' : 's'}`);
            break;
          }
        }
        out.push(`a multiple of ${meta.value}`);
        break;
      default: break;
    }
  }
  const range: string[] = [];
  if (min !== undefined) range.push(`${minExclusive ? 'greater than' : 'at least'} ${min}`);
  if (max !== undefined) range.push(`${maxExclusive ? 'less than' : 'at most'} ${max}`);
  if (range.length > 0) out.unshift(range.join(' and '));
  return out.join(', ');
}
