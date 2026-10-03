/**
 * JSON Schema support for VLD validators
 * Provides conversion between VLD schemas and JSON Schema
 */

import { VldBase, VldPreprocess, VLD_VALIDATOR_TYPES, type SchemaMetadata } from '../validators/base';
import { globalRegistry, type SchemaRegistry } from '../registry';
import { VldError, type VldIssue } from '../errors-core';
import { VldAny } from '../validators/any';
import { VldArray } from '../validators/array';
import { VldBoolean } from '../validators/boolean';
import { VldEnum } from '../validators/enum';
import { VldIntersection } from '../validators/intersection';
import { VldLiteral } from '../validators/literal';
import { VldNever } from '../validators/never';
import { VldNull } from '../validators/null';
import { VldNumber } from '../validators/number';
import { VldObject } from '../validators/object';
import { VldRecord } from '../validators/record';
import { VldString } from '../validators/string';
import { VldTuple } from '../validators/tuple';
import { VldUnion } from '../validators/union';
import * as stringFormats from '../validators/string-formats';

type AnyVldSchema = VldBase<any, any>;

/**
 * JSON Schema definition types
 */
export type JSONSchemaDefinition = {
  $id?: string;
  $schema?: string;
  $ref?: string;
  $defs?: Record<string, JSONSchemaDefinition>;
  type?: string | string[];
  enum?: unknown[];
  const?: unknown;
  format?: string;
  formatMinimum?: string;
  formatMaximum?: string;
  formatExclusiveMinimum?: string;
  formatExclusiveMaximum?: string;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number | boolean;
  exclusiveMaximum?: number | boolean;
  multipleOf?: number;
  properties?: Record<string, JSONSchemaDefinition>;
  additionalProperties?: boolean | JSONSchemaDefinition;
  required?: string[];
  items?: JSONSchemaDefinition | JSONSchemaDefinition[] | false;
  prefixItems?: JSONSchemaDefinition[];
  contains?: JSONSchemaDefinition;
  minContains?: number;
  maxContains?: number;
  minProperties?: number;
  maxProperties?: number;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  additionalItems?: boolean | JSONSchemaDefinition;
  propertyNames?: JSONSchemaDefinition;
  anyOf?: JSONSchemaDefinition[];
  allOf?: JSONSchemaDefinition[];
  oneOf?: JSONSchemaDefinition[];
  not?: JSONSchemaDefinition;
  title?: string;
  description?: string;
  default?: unknown;
  examples?: unknown[];
  deprecated?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  nullable?: boolean;
  'x-vld-type'?: string;
  'x-vld-minimum'?: string;
  'x-vld-maximum'?: string;
  'x-vld-exclusiveMinimum'?: string;
  'x-vld-exclusiveMaximum'?: string;
};

/**
 * Options for JSON Schema conversion
 */
export interface ToJSONSchemaOptions {
  target?:
    | 'draft-04'
    | 'draft-4'
    | 'draft-07'
    | 'draft-7'
    | 'draft-2019-09'
    | 'draft-2020-12'
    | 'openapi-3.0'
    | (string & {});
  includeMetadata?: boolean;
  includeExamples?: boolean;
  /** Match Zod's default throw/any behavior, or opt into VLD extensions. */
  unrepresentable?: 'throw' | 'any' | 'vld';
  /** Select the input or output side of codecs and pipes. */
  io?: 'input' | 'output';
}

export interface FromJSONSchemaOptions {
  defaultTarget?: 'draft-2020-12' | 'draft-7' | 'draft-4' | 'openapi-3.0';
  registry?: SchemaRegistry<Record<string, unknown>>;
}

/**
 * Convert a VLD schema to JSON Schema
 * @param schema The VLD schema to convert
 * @param options Conversion options
 * @returns JSON Schema definition
 */
export function toJSONSchema<T>(
  schema: VldBase<unknown, T>,
  options: ToJSONSchemaOptions = {}
): JSONSchemaDefinition {
  const normalizedOptions = normalizeOptions(options);
  const result = normalizeForTarget(
    schemaToJSONSchema(schema as VldBase<unknown, unknown>, normalizedOptions),
    normalizedOptions
  );
  const target = normalizedOptions.target || 'draft-2020-12';
  if (target === 'draft-04') {
    result.$schema ??= 'http://json-schema.org/draft-04/schema#';
  } else if (target === 'draft-07') {
    result.$schema ??= 'http://json-schema.org/draft-07/schema#';
  } else if (target === 'draft-2019-09') {
    result.$schema ??= 'https://json-schema.org/draft/2019-09/schema';
  } else if (target === 'draft-2020-12') {
    result.$schema ??= 'https://json-schema.org/draft/2020-12/schema';
  }
  return result;
}

/**
 * Convert a JSON Schema to a VLD schema
 * @param json The JSON Schema definition
 * @returns A VLD schema
 */
export function fromJSONSchema(
  json: JSONSchemaDefinition | boolean,
  options: FromJSONSchemaOptions = {}
): VldBase<unknown, unknown> {
  if (typeof json === 'boolean') {
    return (json ? VldAny.create() : VldNever.create()) as unknown as VldBase<unknown, unknown>;
  }

  let normalized: JSONSchemaDefinition;
  try {
    normalized = JSON.parse(JSON.stringify(json)) as JSONSchemaDefinition;
  } catch {
    throw new Error('fromJSONSchema input is not valid JSON (possibly cyclic); use $defs/$ref for recursive schemas');
  }

  const schema = jsonSchemaToVLD(normalized) as VldBase<unknown, unknown>;
  const metadata = schema.meta();
  if (options.registry && metadata) {
    options.registry.add(schema, metadata);
  }
  return schema;
}

function normalizeOptions(options: ToJSONSchemaOptions): ToJSONSchemaOptions {
  const target = options.target;
  if (target === 'draft-4') {
    return { ...options, target: 'draft-04' };
  }
  if (target === 'draft-7') {
    return { ...options, target: 'draft-07' };
  }
  return options;
}

function normalizeForTarget(
  definition: JSONSchemaDefinition,
  options: ToJSONSchemaOptions
): JSONSchemaDefinition {
  const target = options.target || 'draft-2020-12';
  const result: JSONSchemaDefinition = { ...definition };

  if (Array.isArray(result.items)) {
    const tupleItems = result.items.map((item) => normalizeForTarget(item, options));
    // The rest element (or `false` for a closed tuple) travels as
    // additionalItems and becomes `items` in 2020-12 style output.
    const rest = result.additionalItems;
    if (target === 'draft-2020-12' || target === 'draft-2019-09') {
      result.prefixItems = tupleItems;
      result.items = rest && typeof rest === 'object' ? normalizeForTarget(rest, options) : false;
      delete result.additionalItems;
    } else {
      result.items = tupleItems;
      if (rest && typeof rest === 'object') {
        result.additionalItems = normalizeForTarget(rest, options);
      }
    }
  } else if (result.items && typeof result.items === 'object') {
    result.items = normalizeForTarget(result.items, options);
  }

  if (result.prefixItems) {
    result.prefixItems = result.prefixItems.map((item) => normalizeForTarget(item, options));
  }

  if (result.properties) {
    result.properties = Object.fromEntries(
      Object.entries(result.properties).map(([key, value]) => [key, normalizeForTarget(value, options)])
    );
  }

  if (result.additionalProperties && typeof result.additionalProperties === 'object') {
    result.additionalProperties = normalizeForTarget(result.additionalProperties, options);
  }

  for (const key of ['anyOf', 'allOf', 'oneOf'] as const) {
    if (result[key]) {
      result[key] = result[key]!.map((item) => normalizeForTarget(item, options));
    }
  }

  if (result.not && typeof result.not === 'object') {
    result.not = normalizeForTarget(result.not, options);
  }

  if (result.propertyNames && typeof result.propertyNames === 'object') {
    result.propertyNames = normalizeForTarget(result.propertyNames, options);
  }

  if (target === 'openapi-3.0') {
    normalizeOpenAPI30(result);
  } else if (target === 'draft-04') {
    // Draft-04 only knows boolean exclusiveMinimum/exclusiveMaximum.
    booleanExclusiveBounds(result);
  }

  return result;
}

function normalizeOpenAPI30(definition: JSONSchemaDefinition): void {
  if (Array.isArray(definition.type) && definition.type.includes('null')) {
    const nonNullTypes = definition.type.filter((type) => type !== 'null');
    definition.nullable = true;
    if (nonNullTypes.length === 1) {
      const nonNullType = nonNullTypes[0];
      if (nonNullType !== undefined) {
        definition.type = nonNullType;
      } else {
        delete definition.type;
      }
    } else if (nonNullTypes.length > 1) {
      definition.type = nonNullTypes;
    } else {
      delete definition.type;
    }
  }

  booleanExclusiveBounds(definition);
}

function booleanExclusiveBounds(definition: JSONSchemaDefinition): void {
  if (typeof definition.exclusiveMinimum === 'number') {
    definition.minimum ??= definition.exclusiveMinimum;
    definition.exclusiveMinimum = true;
  }
  if (typeof definition.exclusiveMaximum === 'number') {
    definition.maximum ??= definition.exclusiveMaximum;
    definition.exclusiveMaximum = true;
  }
}

interface CycleContext {
  readonly root: AnyVldSchema;
  readonly active: Set<AnyVldSchema>;
  readonly refs: Map<AnyVldSchema, string>;
  readonly defs: Record<string, JSONSchemaDefinition>;
}

let cycleContext: CycleContext | undefined;

/**
 * Convert a schema, turning cycles (getter-based recursive shapes) into
 * `$ref`s like Zod: `#` for the root, `#/$defs/__schemaN` otherwise.
 */
function schemaToJSONSchema(schema: AnyVldSchema, options: ToJSONSchemaOptions): JSONSchemaDefinition {
  const ctx = cycleContext;
  if (ctx === undefined) {
    const root: CycleContext = { root: schema, active: new Set(), refs: new Map(), defs: {} };
    cycleContext = root;
    try {
      const result = schemaToJSONSchema(schema, options);
      if (root.refs.size > 0) {
        const key = options.target === 'draft-04' || options.target === 'draft-07' ? 'definitions' : '$defs';
        const target = result as Record<string, unknown>;
        target[key] = { ...(target[key] as Record<string, JSONSchemaDefinition> | undefined), ...root.defs };
      }
      return result;
    } finally {
      cycleContext = undefined;
    }
  }
  const defsPath = options.target === 'draft-04' || options.target === 'draft-07' ? '#/definitions/' : '#/$defs/';
  if (ctx.active.has(schema)) {
    if (schema === ctx.root) return { $ref: '#' };
    let id = ctx.refs.get(schema);
    if (id === undefined) {
      id = `__schema${ctx.refs.size}`;
      ctx.refs.set(schema, id);
    }
    return { $ref: defsPath + id };
  }
  ctx.active.add(schema);
  let result: JSONSchemaDefinition;
  try {
    result = convertSchemaToJSONSchema(schema, options);
  } finally {
    ctx.active.delete(schema);
  }
  const id = ctx.refs.get(schema);
  if (id !== undefined && schema !== ctx.root) {
    ctx.defs[id] = result;
    return { $ref: defsPath + id };
  }
  return result;
}

/**
 * Internal function to convert VLD schema to JSON Schema
 */
function convertSchemaToJSONSchema(schema: AnyVldSchema, options: ToJSONSchemaOptions): JSONSchemaDefinition {
  const target = options.target || 'draft-2020-12';
  const schemaAny = schema as any;
  const validatorType = schema.validatorType;

  const v2 = buildV2Schema(schemaAny, target, options);
  if (v2 !== undefined) {
    return withMetadata(schema, v2, options);
  }

  // Handle primitives
  if (schema.constructor.name === 'VldString' || validatorType === VLD_VALIDATOR_TYPES.STRING || validatorType === VLD_VALIDATOR_TYPES.COERCE_STRING) {
    return withMetadata(schema, buildStringSchema(target, schema), options);
  }

  if (schema.constructor.name === 'VldNumber' || validatorType === VLD_VALIDATOR_TYPES.NUMBER || validatorType === VLD_VALIDATOR_TYPES.COERCE_NUMBER) {
    return withMetadata(schema, buildNumberSchema(schema, target), options);
  }

  if (schema.constructor.name === 'VldBoolean' || validatorType === VLD_VALIDATOR_TYPES.BOOLEAN || validatorType === VLD_VALIDATOR_TYPES.COERCE_BOOLEAN) {
    return withMetadata(schema, { type: 'boolean' }, options);
  }

  if (schema.constructor.name === 'VldBigInt' || validatorType === VLD_VALIDATOR_TYPES.BIGINT || validatorType === VLD_VALIDATOR_TYPES.COERCE_BIGINT) {
    return unrepresentable(schema, options, 'BigInt', () => buildBigIntSchema(schema));
  }

  if (schema.constructor.name === 'VldDate' || validatorType === VLD_VALIDATOR_TYPES.DATE || validatorType === VLD_VALIDATOR_TYPES.COERCE_DATE) {
    return unrepresentable(schema, options, 'Date', () => buildDateSchema(schema));
  }

  if (schema.constructor.name === 'VldArray' || validatorType === VLD_VALIDATOR_TYPES.ARRAY) {
    return withMetadata(schema, buildArraySchema(schema, options), options);
  }

  if (schema.constructor.name === 'VldObject' || validatorType === VLD_VALIDATOR_TYPES.OBJECT) {
    return withMetadata(schema, buildObjectSchema(schema, options), options);
  }

  // Handle union types
  if (schema.constructor.name === 'VldUnion') {
    return withMetadata(schema, buildUnionSchema(schema, options), options);
  }

  // Handle literal types
  if (schema.constructor.name === 'VldLiteral') {
    return withMetadata(schema, buildLiteralSchema(schema, options), options);
  }

  if (schema.constructor.name === 'VldEnum') {
    return withMetadata(schema, buildEnumSchema(schema), options);
  }

  if (schema.constructor.name === 'VldSet' || validatorType === VLD_VALIDATOR_TYPES.SET) {
    return unrepresentable(schema, options, 'Set', () => buildSetSchema(schema, options));
  }

  if (schema.constructor.name === 'VldMap' || validatorType === VLD_VALIDATOR_TYPES.MAP) {
    return unrepresentable(schema, options, 'Map', () => buildMapSchema(schema, options));
  }

  if (schema.constructor.name === 'VldRecord' || validatorType === VLD_VALIDATOR_TYPES.RECORD) {
    return withMetadata(schema, buildRecordSchema(schema, options), options);
  }

  if (schema.constructor.name === 'VldTuple' || validatorType === VLD_VALIDATOR_TYPES.TUPLE) {
    return withMetadata(schema, buildTupleSchema(schema, options), options);
  }

  if (schema.constructor.name === 'VldIntersection') {
    return withMetadata(schema, buildIntersectionSchema(schema, options), options);
  }

  if (schema.constructor.name === 'VldOptional') {
    return withMetadata(schema, buildOptionalSchema(schema, options), options);
  }

  if (schema.constructor.name === 'VldNullable') {
    return withMetadata(schema, buildNullableSchema(schema, options), options);
  }

  if (schema.constructor.name === 'VldNullish') {
    return withMetadata(schema, buildNullishSchema(schema, options), options);
  }

  if (schema.constructor.name === 'VldExactOptional') {
    return withMetadata(schema, buildExactOptionalSchema(schema, options), options);
  }

  if (schema.constructor.name === 'VldLazy') {
    return withMetadata(schema, { type: 'object' }, options); // Placeholder for recursive schemas
  }

  // stringbool: a boolean on output, the accepted string on input (Zod).
  if (schema.constructor.name === 'VldStringBool') {
    return withMetadata(schema, { type: options.io === 'input' ? 'string' : 'boolean' }, options);
  }

  if (schema.constructor.name === 'VldJson') {
    return withMetadata(schema, {}, options); // Any JSON
  }

  if (schema.constructor.name === 'VldAny') {
    return withMetadata(schema, {}, options); // JSON Schema true
  }

  if (schema.constructor.name === 'VldUnknown') {
    return withMetadata(schema, {}, options); // JSON Schema true
  }

  if (schema.constructor.name === 'VldNever') {
    return withMetadata(schema, { not: {} }, options); // JSON Schema false
  }

  if (schema.constructor.name === 'VldNull') {
    return withMetadata(schema, { type: 'null' }, options);
  }

  if (schema.constructor.name === 'VldUndefined') {
    return unrepresentable(schema, options, 'Undefined', () => ({ not: {} }));
  }

  if (schema.constructor.name === 'VldNan') {
    return unrepresentable(schema, options, 'NaN', () => ({ type: 'number', not: {} }));
  }

  if (schema.constructor.name === 'VldVoid') {
    return unrepresentable(schema, options, 'Void', () => ({ not: {} }));
  }

  if (schema.constructor.name === 'VldSymbol') {
    return unrepresentable(schema, options, 'Symbol', () => ({}));
  }

  // Handle branded types - unwrap and continue
  if (schema.constructor.name === 'VldBrand') {
    return withMetadata(schema, schemaToJSONSchema(schemaAny.baseValidator, options), options);
  }

  // Handle readonly types
  if (schema.constructor.name === 'VldReadonly') {
    return withMetadata(schema, { readOnly: true, ...schemaToJSONSchema(schemaAny.baseValidator, options) }, options);
  }

  // Handle transform types
  if (schema.constructor.name === 'VldTransform') {
    return unrepresentable(schema, options, 'Transform', () => schemaToJSONSchema(unwrapInner(schemaAny), options));
  }

  // Handle meta types - unwrap metadata
  if (schema.constructor.name === 'VldMeta') {
    const result = schemaToJSONSchema(schemaAny.baseValidator, options);
    return withMetadata(schema, result, options);
  }

  // Handle refine/superRefine types
  if (schema.constructor.name === 'VldRefine' || schema.constructor.name === 'VldSuperRefine') {
    return withMetadata(schema, schemaToJSONSchema(unwrapInner(schemaAny), options), options);
  }

  // Handle pipe types
  if (schema.constructor.name === 'VldPipe') {
    const side = options.io === 'input' ? schemaAny.first : schemaAny._next || schemaAny.second;
    return withMetadata(schema, schemaToJSONSchema(side, options), options);
  }

  // Handle default/catch types
  if (schema.constructor.name === 'VldDefault' || schema.constructor.name === 'VldCatch') {
    const inner = schemaToJSONSchema(unwrapInner(schemaAny), options);
    const defaultValue = schema.constructor.name === 'VldDefault'
      ? jsonDefault(schemaAny.defaultValue)
      : catchDefault(schemaAny.fallbackValue);
    return withMetadata(schema, defaultValue === undefined ? inner : { ...inner, default: defaultValue }, options);
  }

  // Handle preprocess types
  if (schema.constructor.name === 'VldPreprocess') {
    return unrepresentable(schema, options, 'Preprocess', () => schemaToJSONSchema(schemaAny._schema, options));
  }

  if (schema.constructor.name === 'VldCodec') {
    const side = options.io === 'input' ? schemaAny.inputValidator : schemaAny.outputValidator;
    return withMetadata(schema, schemaToJSONSchema(side, options), options);
  }

  if (schema.constructor.name === 'VldCustom') {
    return unrepresentable(schema, options, 'Custom', () => ({}));
  }

  // Handle string format validators
  if (schema.constructor.name === 'VldStringFormat') {
    const formatSchema = schema as any;
    return withMetadata(schema, { type: 'string', format: jsonFormatName(formatSchema._format) }, options);
  }

  if (schema.constructor.name === 'VldDiscriminatedUnion') {
    const discriminatedOptions = (schemaAny._options || []) as AnyVldSchema[];
    return withMetadata(schema, { oneOf: discriminatedOptions.map((option) => schemaToJSONSchema(option, options)) }, options);
  }

  if (schema.constructor.name === 'VldTemplateLiteral' && schemaAny.pattern instanceof RegExp) {
    return withMetadata(schema, { type: 'string', pattern: schemaAny.pattern.source }, options);
  }

  // Fallback for unknown types
  return withMetadata(schema, {}, options);
}

function unrepresentable(
  schema: AnyVldSchema,
  options: ToJSONSchemaOptions,
  typeName: string,
  vldExtension: () => JSONSchemaDefinition
): JSONSchemaDefinition {
  if (options.unrepresentable === 'any') {
    return withMetadata(schema, {}, options);
  }
  if (options.unrepresentable === 'vld') {
    return withMetadata(schema, vldExtension(), options);
  }
  throw new Error(`${typeName} cannot be represented in JSON Schema`);
}

/**
 * The V2 schema family keeps its definition in `__def`; present it in the
 * shape the V1 builders read instead of falling through to `{}`.
 */
function buildV2Schema(schema: any, target: string, options: ToJSONSchemaOptions): JSONSchemaDefinition | undefined {
  const def = schema.__def;
  if (!def || typeof def.type !== 'string' || !/V2$/.test(schema.constructor.name)) return undefined;
  switch (def.type) {
    case 'string': {
      const affixes = (def.checks as any[])
        .filter((check) => check.kind === 'startsWith' || check.kind === 'endsWith' || check.kind === 'includes')
        .map((check) => ({ kind: check.kind, value: check.prefix ?? check.suffix ?? check.substring }));
      return buildStringSchema(target, { config: { jsonSchema: { ...def.jsonSchema, affixes } } });
    }
    case 'number':
      return buildNumberSchema({ config: { jsonSchema: def.jsonSchema ?? {} } }, target);
    case 'array': {
      const config: any = { itemValidator: def.itemValidator };
      for (const check of def.checks as any[]) {
        if (check.kind === 'unique') config.unique = true;
        else if (typeof check.kind === 'string') config[check.kind] = check[check.kind];
      }
      return buildArraySchema({ config }, options);
    }
    case 'record':
      return buildRecordSchema({ valueValidator: def.valueValidator }, options);
    case 'union':
      return buildUnionSchema({ validators: def.validators }, options);
    case 'intersection':
      return buildIntersectionSchema({ first: def.left, second: def.right }, options);
    case 'literal':
      return buildLiteralSchema({ value: def.value }, options);
    case 'enum':
      return buildEnumSchema({ values: def.values });
    case 'optional':
      return schemaToJSONSchema(def.inner, options);
    case 'nullable':
    case 'nullish':
      return withNull(schemaToJSONSchema(def.inner, options));
    case 'refine':
      return schemaToJSONSchema(def.inner, options);
    case 'transform':
      return unrepresentable(schema, options, 'Transform', () => schemaToJSONSchema(def.inner, options));
    default:
      return undefined;
  }
}

function unwrapInner(schema: any): AnyVldSchema {
  if (typeof schema.unwrap === 'function') {
    return schema.unwrap();
  }
  return schema._inner || schema._baseValidator || schema.baseValidator || schema.valueValidator;
}

function getMetadata(schema: AnyVldSchema): SchemaMetadata | undefined {
  const registered = globalRegistry.get(schema);
  const schemaAny = schema as any;
  const local = typeof schemaAny.getMeta === 'function' ? schemaAny.getMeta() : undefined;
  return registered || local ? { ...(local || {}), ...(registered || {}) } : undefined;
}

function withMetadata(
  schema: AnyVldSchema,
  definition: JSONSchemaDefinition,
  options: ToJSONSchemaOptions
): JSONSchemaDefinition {
  if (options.includeMetadata === false) {
    return definition;
  }

  const metadata = getMetadata(schema);
  if (!metadata) {
    return definition;
  }

  const result: JSONSchemaDefinition = { ...definition };
  if (metadata.id) result.$id = metadata.id;
  if (metadata.title) result.title = metadata.title;
  if (metadata.description) result.description = metadata.description;
  if (metadata.examples && options.includeExamples !== false) result.examples = metadata.examples;
  if (metadata.default !== undefined) result.default = metadata.default;
  if (metadata.deprecated) result.deprecated = true;
  if (metadata.readOnly) result.readOnly = true;
  if (metadata.writeOnly) result.writeOnly = true;
  // Custom metadata keys (e.g. "x-order") pass through, as in Zod.
  for (const [key, value] of Object.entries(metadata)) {
    if (!KNOWN_METADATA_KEYS.has(key) && value !== undefined && typeof value !== 'function') {
      (result as Record<string, unknown>)[key] = value;
    }
  }
  return result;
}

const KNOWN_METADATA_KEYS = new Set([
  'id', 'title', 'description', 'examples', 'default', 'deprecated', 'readOnly', 'writeOnly'
]);

/** JSON Schema names for VLD's internal string format ids. */
function jsonFormatName(format: string): string {
  return format === 'datetime' ? 'date-time' : format;
}

/** A default value as JSON, or undefined when it has no JSON form. */
/** A catch fallback as a JSON default; a fallback function that needs its error context gives none. */
function catchDefault(fallback: unknown): unknown {
  try {
    return jsonDefault(typeof fallback === 'function' ? () => (fallback as (ctx: unknown) => unknown)({ error: undefined, issues: [], input: undefined }) : fallback);
  } catch {
    return undefined;
  }
}

function jsonDefault(value: unknown): unknown {
  try {
    const resolved = typeof value === 'function' ? (value as () => unknown)() : value;
    const json = JSON.stringify(resolved);
    return json === undefined ? undefined : JSON.parse(json);
  } catch {
    return undefined;
  }
}

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Build string JSON Schema
 */
function buildStringSchema(_target: string, schema?: any): JSONSchemaDefinition {
  const hints = schema?.config?.jsonSchema || {};
  const result: JSONSchemaDefinition = { type: 'string' };

  if (hints.exactLength !== undefined) {
    result.minLength = hints.exactLength;
    result.maxLength = hints.exactLength;
  } else {
    if (hints.minLength !== undefined) result.minLength = hints.minLength;
    if (hints.maxLength !== undefined) result.maxLength = hints.maxLength;
  }
  if (hints.format) result.format = jsonFormatName(hints.format);
  const patterns: string[] = hints.pattern ? [hints.pattern] : [];
  for (const affix of (hints.affixes ?? []) as Array<{ kind: string; value: string }>) {
    const literal = escapeRegex(affix.value);
    if (affix.kind === 'startsWith') patterns.push(`^${literal}.*`);
    else if (affix.kind === 'endsWith') patterns.push(`.*${literal}$`);
    else patterns.push(literal);
    result.format ??= affix.kind === 'startsWith' ? 'starts_with' : affix.kind === 'endsWith' ? 'ends_with' : 'includes';
  }
  if (patterns.length > 0) result.pattern = patterns[0]!;
  if (patterns.length > 1) result.allOf = patterns.slice(1).map((pattern) => ({ pattern }));

  return result;
}

/**
 * Build number JSON Schema from VLD number schema
 */
function buildNumberSchema(schema: any, _target: string): JSONSchemaDefinition {
  const config = schema.config || {};
  const hints = config.jsonSchema || {};
  const checks = config.checks || [];

  const result: JSONSchemaDefinition = { type: hints.type || 'number' };

  if (hints.minimum !== undefined) result.minimum = hints.minimum;
  if (hints.maximum !== undefined) result.maximum = hints.maximum;
  if (hints.exclusiveMinimum !== undefined) result.exclusiveMinimum = hints.exclusiveMinimum;
  if (hints.exclusiveMaximum !== undefined) result.exclusiveMaximum = hints.exclusiveMaximum;
  if (hints.multipleOf !== undefined) result.multipleOf = hints.multipleOf;

  if (Object.keys(hints).length > 0) {
    return result;
  }

  for (const check of checks) {
    // Try to extract constraints from closures
    const checkStr = check.toString();

    if (checkStr.includes('>=') || checkStr.includes('min')) {
      result.minimum = 0; // Default, actual value is in closure
    }
    if (checkStr.includes('<=') || checkStr.includes('max')) {
      result.maximum = 0; // Default, actual value is in closure
    }
    if (checkStr.includes('isInteger') || checkStr.includes('int')) {
      result.type = 'integer';
    }
    if (checkStr.includes('isSafeInteger')) {
      result.type = 'integer';
    }
    if (checkStr.includes('Number.isFinite')) {
      // Finite constraint
    }
  }

  return result;
}

function bigintToSafeNumber(value: bigint): number | undefined {
  const asNumber = Number(value);
  if (!Number.isSafeInteger(asNumber)) {
    return undefined;
  }
  return BigInt(asNumber) === value ? asNumber : undefined;
}

function applyBigIntBound(
  result: JSONSchemaDefinition,
  numericKey: 'minimum' | 'maximum' | 'exclusiveMinimum' | 'exclusiveMaximum',
  extensionKey: 'x-vld-minimum' | 'x-vld-maximum' | 'x-vld-exclusiveMinimum' | 'x-vld-exclusiveMaximum',
  value: bigint | undefined
): void {
  if (value === undefined) {
    return;
  }

  result[extensionKey] = value.toString();
  const safeNumber = bigintToSafeNumber(value);
  if (safeNumber !== undefined) {
    result[numericKey] = safeNumber;
  }
}

function buildBigIntSchema(schema: any): JSONSchemaDefinition {
  const hints = schema.jsonSchema || schema.config?.jsonSchema || {};
  const result: JSONSchemaDefinition = { type: 'integer' };

  applyBigIntBound(result, 'minimum', 'x-vld-minimum', hints.minimum);
  applyBigIntBound(result, 'maximum', 'x-vld-maximum', hints.maximum);
  applyBigIntBound(result, 'exclusiveMinimum', 'x-vld-exclusiveMinimum', hints.exclusiveMinimum);
  applyBigIntBound(result, 'exclusiveMaximum', 'x-vld-exclusiveMaximum', hints.exclusiveMaximum);

  return result;
}

function buildDateSchema(schema: any): JSONSchemaDefinition {
  const hints = schema.jsonSchema || schema.config?.jsonSchema || {};
  const result: JSONSchemaDefinition = {
    type: 'string',
    format: 'date-time'
  };

  if (hints.formatMinimum) result.formatMinimum = hints.formatMinimum;
  if (hints.formatMaximum) result.formatMaximum = hints.formatMaximum;
  if (hints.formatExclusiveMinimum) result.formatExclusiveMinimum = hints.formatExclusiveMinimum;
  if (hints.formatExclusiveMaximum) result.formatExclusiveMaximum = hints.formatExclusiveMaximum;

  return result;
}

/**
 * Build array JSON Schema
 */
function buildArraySchema(schema: any, options: ToJSONSchemaOptions): JSONSchemaDefinition {
  const inner = schema._item || schema._inner || schema.config?.itemValidator;
  const result: JSONSchemaDefinition = { type: 'array' };

  if (inner) {
    result.items = schemaToJSONSchema(inner, options);
  }

  if (schema.config?.exactLength !== undefined) {
    result.minItems = schema.config.exactLength;
    result.maxItems = schema.config.exactLength;
  } else {
    if (schema.config?.minLength !== undefined) result.minItems = schema.config.minLength;
    if (schema.config?.maxLength !== undefined) result.maxItems = schema.config.maxLength;
  }
  if (schema.config?.unique) result.uniqueItems = true;

  return result;
}

/**
 * Build object JSON Schema
 */
function buildObjectSchema(schema: any, options: ToJSONSchemaOptions): JSONSchemaDefinition {
  const shape = schema._shape || schema.shape || schema.config?.shape;
  if (!shape) return { type: 'object' };

  const properties: Record<string, JSONSchemaDefinition> = {};
  const required: string[] = [];

  for (const [key, value] of Object.entries(shape)) {
    const child = value as VldBase<unknown, unknown>;
    properties[key] = schemaToJSONSchema(child, options);
    // VLD objects require all keys by default; on the input side a defaulted
    // (or caught) field may be omitted.
    if (!isOptionalLike(child) && !(options.io === 'input' && isDefaultLike(child))) {
      required.push(key);
    }
  }

  const result: JSONSchemaDefinition = {
    type: 'object',
    properties
  };

  if (required.length > 0) {
    result.required = required;
  }

  // Handle passthrough mode
  if (schema._passthrough || schema._loose || schema.config?.passthrough) {
    result.additionalProperties = true;
  } else if (schema.config?.catchall) {
    result.additionalProperties = schemaToJSONSchema(schema.config.catchall, options);
  } else if (options.io !== 'input' || schema.config?.strict) {
    // Strip mode accepts (and drops) unknown keys, so the input side is open.
    result.additionalProperties = false;
  }

  return result;
}

function isDefaultLike(schema: AnyVldSchema): boolean {
  const name = schema.constructor.name;
  return name === 'VldDefault' || name === 'VldCatch';
}

function isOptionalLike(schema: AnyVldSchema): boolean {
  const name = schema.constructor.name;
  return (
    name === 'VldOptional' ||
    name === 'VldNullish' ||
    name === 'VldExactOptional' ||
    schema.validatorType === VLD_VALIDATOR_TYPES.OPTIONAL ||
    schema.validatorType === VLD_VALIDATOR_TYPES.NULLISH ||
    schema.validatorType === VLD_VALIDATOR_TYPES.EXACT_OPTIONAL
  );
}

/**
 * Build union JSON Schema
 */
function buildUnionSchema(schema: any, options: ToJSONSchemaOptions): JSONSchemaDefinition {
  const validators = schema._validators || schema._options || schema.validators || [];
  return {
    anyOf: validators.map((v: AnyVldSchema) => schemaToJSONSchema(v, options))
  };
}

/**
 * Build literal JSON Schema
 */
function buildLiteralSchema(schema: any, options: ToJSONSchemaOptions): JSONSchemaDefinition {
  const values: unknown[] = Array.isArray(schema.values) ? schema.values : [schema._literal ?? schema.literal ?? schema._value ?? schema.value];
  if (values.some((item) => item === undefined)) {
    return unrepresentable(schema, options, 'Literal `undefined`', () => ({ not: {} }));
  }
  if (values.some((item) => typeof item === 'bigint')) {
    return unrepresentable(schema, options, 'BigInt literal', () => ({ type: 'integer', enum: values.map(String) }));
  }
  if (values.length > 1) {
    const types = new Set(values.map((item) => (item === null ? 'null' : typeof item)));
    const only = types.size === 1 ? [...types][0] : undefined;
    return only !== undefined && only !== 'null' ? { type: only, enum: [...values] } : { enum: [...values] };
  }
  const value = values[0];
  if (value === null) return { type: 'null' };
  if (typeof value === 'string') return { type: 'string', const: value };
  if (typeof value === 'number') return { type: 'number', const: value };
  if (typeof value === 'boolean') return { type: 'boolean', const: value };
  return { const: value };
}

/**
 * Build enum JSON Schema
 */
function buildEnumSchema(schema: any): JSONSchemaDefinition {
  const values = schema._values || schema.values;
  if (Array.isArray(values)) {
    return { enum: [...values] };
  }
  return {};
}

/**
 * Build record JSON Schema
 */
function buildRecordSchema(schema: any, options: ToJSONSchemaOptions): JSONSchemaDefinition {
  const valueValidator = schema.valueSchema || schema._value || schema._inner || schema.valueValidator;
  if (valueValidator) {
    const result: JSONSchemaDefinition = {
      type: 'object',
      additionalProperties: schemaToJSONSchema(valueValidator, options)
    };
    const keyValidator = schema.keyValidator;
    if (keyValidator) {
      const keySchema = schemaToJSONSchema(keyValidator, options);
      // A plain string key adds nothing; anything stricter is kept.
      if (!(Object.keys(keySchema).length === 1 && keySchema.type === 'string')) {
        result.propertyNames = keySchema;
      }
      // Enum / literal keys: every key is required unless the value accepts undefined.
      const finiteKeys = keyValidator.constructor.name === 'VldEnum' || keyValidator.constructor.name === 'VldLiteral'
        ? [...(keyValidator.values as readonly unknown[])]
        : undefined;
      if (finiteKeys && !valueValidator.safeParse(undefined).success) {
        result.required = finiteKeys.map(String);
      }
    }
    return result;
  }
  return { type: 'object' };
}

/**
 * Build Set JSON Schema as the JSON-compatible array representation.
 */
function buildSetSchema(schema: any, options: ToJSONSchemaOptions): JSONSchemaDefinition {
  const itemValidator = schema.itemSchema || schema.itemValidator || schema._item || schema._inner;
  const result: JSONSchemaDefinition = {
    type: 'array',
    uniqueItems: true,
    'x-vld-type': 'set'
  };

  if (itemValidator) {
    result.items = schemaToJSONSchema(itemValidator, options);
  }

  return result;
}

/**
 * Build Map JSON Schema as an array of key/value pairs.
 */
function buildMapSchema(schema: any, options: ToJSONSchemaOptions): JSONSchemaDefinition {
  const keyValidator = schema.keySchema || schema.keyValidator || schema._key;
  const valueValidator = schema.valueSchema || schema.valueValidator || schema._value;
  const keySchema = keyValidator ? schemaToJSONSchema(keyValidator, options) : {};
  const valueSchema = valueValidator ? schemaToJSONSchema(valueValidator, options) : {};

  return {
    type: 'array',
    'x-vld-type': 'map',
    items: {
      type: 'array',
      items: [keySchema, valueSchema],
      minItems: 2,
      maxItems: 2
    }
  };
}

/**
 * Build tuple JSON Schema
 */
function buildTupleSchema(schema: any, options: ToJSONSchemaOptions): JSONSchemaDefinition {
  const items = schema.items || schema._items || schema.validators;
  if (!items || !Array.isArray(items)) {
    return { type: 'array' };
  }

  const rest = schema.restValidator as AnyVldSchema | null | undefined;
  const result: JSONSchemaDefinition = {
    type: 'array',
    items: items.map((item: AnyVldSchema) => schemaToJSONSchema(item, options)),
    // Extra elements must match the rest schema, or are not allowed at all.
    additionalItems: rest ? schemaToJSONSchema(rest, options) : false,
    minItems: items.length
  };
  if (!rest) {
    result.maxItems = items.length;
  }
  return result;
}

/**
 * Build intersection JSON Schema
 */
function buildIntersectionSchema(schema: any, options: ToJSONSchemaOptions): JSONSchemaDefinition {
  const first = schema._first || schema.first || schema.validatorA;
  const second = schema._second || schema.second || schema.validatorB;

  const schemas: JSONSchemaDefinition[] = [];
  if (first) schemas.push(schemaToJSONSchema(first, options));
  if (second) schemas.push(schemaToJSONSchema(second, options));

  if (schemas.length === 0) return {};
  if (schemas.length === 1) return schemas[0] ?? {};

  const merged = mergeObjectSchemas(schemas[0]!, schemas[1]!);
  return merged ?? { allOf: schemas };
}

/**
 * Merge two plain object schemas. `allOf` over two closed objects
 * (additionalProperties: false) would reject every value that has the keys
 * of both sides, although the intersection accepts it.
 */
function mergeObjectSchemas(a: JSONSchemaDefinition, b: JSONSchemaDefinition): JSONSchemaDefinition | undefined {
  const plainObject = (d: JSONSchemaDefinition) =>
    d.type === 'object' && d.properties !== undefined && Object.keys(d).every((key) =>
      key === 'type' || key === 'properties' || key === 'required' || key === 'additionalProperties') &&
    (d.additionalProperties === undefined || typeof d.additionalProperties === 'boolean');
  if (!plainObject(a) || !plainObject(b)) {
    return undefined;
  }
  const required = [...new Set([...(a.required ?? []), ...(b.required ?? [])])];
  const result: JSONSchemaDefinition = { type: 'object', properties: { ...a.properties, ...b.properties } };
  if (required.length > 0) result.required = required;
  if (a.additionalProperties === false && b.additionalProperties === false) {
    result.additionalProperties = false;
  } else if (a.additionalProperties === true || b.additionalProperties === true) {
    result.additionalProperties = true;
  }
  return result;
}

/**
 * Build optional JSON Schema
 */
function buildOptionalSchema(schema: any, options: ToJSONSchemaOptions): JSONSchemaDefinition {
  const inner = unwrapInner(schema);
  if (!inner) return {};

  const result = schemaToJSONSchema(inner, options);
  // Remove from required array - but we don't track required here
  return result;
}

/**
 * Build nullable JSON Schema
 */
function buildNullableSchema(schema: any, options: ToJSONSchemaOptions): JSONSchemaDefinition {
  const inner = unwrapInner(schema);
  if (!inner) return { type: 'null' };

  return withNull(schemaToJSONSchema(inner, options));
}

/**
 * Allow `null` in addition to a schema. Type-specific keywords (minLength,
 * properties, items, ...) ignore null, so widening `type` keeps them;
 * const/enum apply to every value, so those need an anyOf branch.
 */
function withNull(result: JSONSchemaDefinition): JSONSchemaDefinition {
  if (result.const === undefined && result.enum === undefined) {
    if (typeof result.type === 'string') {
      return { ...result, type: [result.type, 'null'] };
    }
    if (Array.isArray(result.type)) {
      return result.type.includes('null') ? result : { ...result, type: [...result.type, 'null'] };
    }
  }
  return { anyOf: [result, { type: 'null' }] };
}

/**
 * Build nullish JSON Schema
 */
function buildNullishSchema(schema: any, options: ToJSONSchemaOptions): JSONSchemaDefinition {
  const inner = unwrapInner(schema);
  if (!inner) return {};

  return withNull(schemaToJSONSchema(inner, options));
}

/**
 * Build exactOptional JSON Schema
 */
function buildExactOptionalSchema(schema: any, options: ToJSONSchemaOptions): JSONSchemaDefinition {
  const inner = unwrapInner(schema);
  if (!inner) return {};

  return schemaToJSONSchema(inner, options);
}

/**
 * Internal function to convert JSON Schema to VLD schema
 */
/**
 * Zod 4.6 JSON Schema keywords that aggregate over the array's items:
 * uniqueItems, contains, minContains and maxContains. Also wires the
 * previously-ignored minItems/maxItems bounds onto plain arrays.
 */
function applyJSONArrayConstraints(arraySchema: any, json: JSONSchemaDefinition): any {
  let result = arraySchema;
  if (json.minItems !== undefined && typeof result.min === 'function') {
    result = result.min(json.minItems);
  }
  if (json.maxItems !== undefined && typeof result.max === 'function') {
    result = result.max(json.maxItems);
  }
  // Tuples have no min()/max(): enforce the item counts as length checks (Zod).
  if (typeof result.min !== 'function' && (json.minItems !== undefined || json.maxItems !== undefined)) {
    const minItems = json.minItems ?? 0;
    const maxItems = json.maxItems ?? Infinity;
    result = result.refine(
      (items: unknown[]) => items.length >= minItems && items.length <= maxItems,
      `Array must have between ${minItems} and ${maxItems} items`
    );
  }
  if (json.uniqueItems === true && typeof result.unique === 'function') {
    result = result.unique();
  }
  if (json.contains) {
    const containsSchema = jsonSchemaToVLD(json.contains);
    const minContains = json.minContains ?? 1;
    const maxContains = json.maxContains;
    result = result.refine((items: unknown[]) => {
      if (!Array.isArray(items)) return false;
      let matches = 0;
      for (const item of items) {
        if (containsSchema.safeParse(item).success) {
          matches++;
          if (maxContains !== undefined && matches > maxContains) return false;
        }
      }
      return matches >= minContains;
    });
  }
  return result;
}

/**
 * Zod 4.6 JSON Schema keywords: minProperties and maxProperties.
 * Enforced via preprocess so the count runs on the raw input - matching
 * Zod, where unknown keys are counted even though object parsing strips them.
 */
function applyObjectConstraints(objectSchema: any, json: JSONSchemaDefinition): any {
  const min = json.minProperties;
  const max = json.maxProperties;
  if (min === undefined && max === undefined) return objectSchema;
  return VldPreprocess.create((value: unknown) => {
    const count = value !== null && typeof value === 'object'
      ? Object.keys(value as Record<string, unknown>).length
      : 0;
    if ((min !== undefined && count < min) || (max !== undefined && count > max)) {
      const issues: VldIssue[] = [{
        code: min !== undefined ? 'too_small' : 'too_big',
        path: [],
        message: min !== undefined
          ? `Too small: expected object to have >=${min} properties`
          : `Too big: expected object to have <=${max} properties`
      }];
      throw new VldError(issues);
    }
    return value;
  }, objectSchema);
}

function jsonSchemaToVLD(json: JSONSchemaDefinition): AnyVldSchema {
  const schema = applyJSONSchemaMetadata(jsonSchemaToVLDInner(json), json);
  // A JSON Schema `default` fills a missing value, as in Zod's fromJSONSchema.
  return json.default !== undefined ? schema.default(json.default as any) as AnyVldSchema : schema;
}

/** RFC 3339 full-time (format "time"), as Zod's fromJSONSchema. */
const JSON_SCHEMA_FULL_TIME = /^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/;

/** JSON Schema `format` -> check schema (Zod fromJSONSchema mapping). */
const JSON_SCHEMA_FORMATS: Record<string, () => AnyVldSchema> = {
  email: () => stringFormats.email(),
  uri: () => stringFormats.url(),
  'uri-reference': () => stringFormats.url(),
  uuid: () => stringFormats.uuid(),
  guid: () => stringFormats.guid(),
  'date-time': () => stringFormats.iso.datetime({ offset: true }),
  date: () => stringFormats.iso.date(),
  time: () => VldString.create().regex(JSON_SCHEMA_FULL_TIME),
  duration: () => stringFormats.iso.duration(),
  hostname: () => stringFormats.hostname(),
  ipv4: () => stringFormats.ipv4(),
  ipv6: () => stringFormats.ipv6(),
  mac: () => stringFormats.mac(),
  cidr: () => stringFormats.cidrv4(),
  'cidr-v6': () => stringFormats.cidrv6(),
  base64: () => stringFormats.base64(),
  base64url: () => stringFormats.base64url(),
  e164: () => stringFormats.e164(),
  credit_card: () => stringFormats.creditCard(),
  iban: () => stringFormats.iban(),
  jwt: () => stringFormats.jwt(),
  emoji: () => stringFormats.emoji(),
  nanoid: () => stringFormats.nanoid(),
  cuid: () => stringFormats.cuid(),
  cuid2: () => stringFormats.cuid2(),
  ulid: () => stringFormats.ulid(),
  xid: () => stringFormats.xid(),
  ksuid: () => stringFormats.ksuid()
};

function jsonSchemaToVLDInner(json: JSONSchemaDefinition): AnyVldSchema {
  // Handle $ref
  if (json.$ref) {
    // For now, return any - full $ref handling requires registry
    return VldAny.create();
  }

  // Handle anyOf/oneOf (union)
  if (json.anyOf || json.oneOf) {
    const options = (json.anyOf || json.oneOf)!
      .map((s) => jsonSchemaToVLD(s))
      .filter(Boolean);
    if (options.length > 0) {
      return VldUnion.create(...options);
    }
  }

  // Handle allOf (intersection)
  if (json.allOf) {
    // For intersection, we'd need VldIntersection
    const firstSchema = json.allOf[0];
    if (firstSchema === undefined) {
      return VldAny.create();
    }

    const first = jsonSchemaToVLD(firstSchema);
    if (json.allOf.length > 1) {
      const second = jsonSchemaToVLD({ allOf: json.allOf.slice(1) });
      return VldIntersection.create(first as any, second as any);
    }
    return first;
  }

  // Handle not
  if (json.not) {
    // For negation, we need special handling
    return VldAny.create();
  }

  // Handle const
  if (json.const !== undefined) {
    return VldLiteral.create(json.const as any);
  }

  // Handle enum
  if (json.enum) {
    if (json.enum.every((value) => typeof value === 'string' || typeof value === 'number')) {
      return VldEnum.create(json.enum as any);
    }
    // null / boolean members: a union of literals (VldEnum only holds strings and numbers).
    const members = json.enum.map((value) => VldLiteral.create(value as any));
    return members.length === 1 ? members[0]! : VldUnion.create(...members);
  }

  // Handle type
  const type = json.nullable && typeof json.type === 'string'
    ? [json.type, 'null']
    : json.type;

  if (
    type === undefined &&
    json.minLength === undefined && json.maxLength === undefined &&
    json.pattern === undefined && json.format === undefined
  ) {
    // An untyped schema ({}) accepts any value.
    return VldAny.create();
  }

  if (type === 'string' || type === undefined) {
    let s = VldString.create();
    if (json.minLength !== undefined) s = s.min(json.minLength);
    if (json.maxLength !== undefined) s = s.max(json.maxLength);
    if (json.pattern) s = s.regex(new RegExp(json.pattern));
    // Unknown / custom formats stay a plain string (as Zod).
    const formatCheck = json.format ? JSON_SCHEMA_FORMATS[json.format] : undefined;
    return formatCheck ? s.check(formatCheck() as any) as AnyVldSchema : s;
  }

  if (type === 'number' || type === 'integer') {
    let n = VldNumber.create();
    if (type === 'integer') n = n.int();
    if (json.minimum !== undefined) n = n.min(json.minimum);
    if (json.maximum !== undefined) n = n.max(json.maximum);
    if (typeof json.exclusiveMinimum === 'number') n = n.gt(json.exclusiveMinimum);
    if (typeof json.exclusiveMaximum === 'number') n = n.lt(json.exclusiveMaximum);
    if (json.exclusiveMinimum === true && json.minimum !== undefined) n = n.gt(json.minimum);
    if (json.exclusiveMaximum === true && json.maximum !== undefined) n = n.lt(json.maximum);
    if (json.multipleOf !== undefined) n = n.multipleOf(json.multipleOf);
    return n;
  }

  if (type === 'boolean') {
    return VldBoolean.create();
  }

  if (type === 'array') {
    let arraySchema: any;
    const tupleItems = json.prefixItems && json.prefixItems.length > 0
      ? json.prefixItems
      : Array.isArray(json.items) ? json.items : undefined;
    if (tupleItems) {
      // JSON Schema tuples do not require their positions: only the first
      // minItems are required, and further items follow the rest schema
      // (`items` in 2020-12, `additionalItems` in draft-07; absent = anything).
      const minItems = typeof json.minItems === 'number' ? json.minItems : 0;
      const validators = tupleItems.map((item, index) => {
        const validator = jsonSchemaToVLD(item);
        return index < minItems ? validator : validator.optional();
      });
      const restDefinition = tupleItems === json.prefixItems ? json.items : json.additionalItems;
      const tuple = VldTuple.create(...validators as any);
      arraySchema = restDefinition === false
        ? tuple
        : tuple.rest(restDefinition === undefined || restDefinition === true
          ? VldAny.create()
          : jsonSchemaToVLD(restDefinition as JSONSchemaDefinition));
    } else if (json.items && !Array.isArray(json.items)) {
      arraySchema = VldArray.create(jsonSchemaToVLD(json.items));
    } else {
      arraySchema = VldArray.create(VldAny.create());
    }
    return applyJSONArrayConstraints(arraySchema, json);
  }

  if (type === 'object') {
    if (json.properties) {
      const shape: Record<string, AnyVldSchema> = {};
      const required = new Set(json.required || []);

      for (const [key, propSchema] of Object.entries(json.properties)) {
        const fieldSchema = jsonSchemaToVLD(propSchema as JSONSchemaDefinition);
        // A property with a default already accepts a missing value (and fills it).
        const hasDefault = typeof propSchema === 'object' && propSchema !== null && (propSchema as JSONSchemaDefinition).default !== undefined;
        shape[key] = required.has(key) || hasDefault ? fieldSchema : fieldSchema.optional();
      }

      let obj = VldObject.create(shape);

      if (json.additionalProperties === false) {
        obj = obj.strict();
      } else if (json.additionalProperties === true) {
        obj = obj.passthrough();
      } else if (json.additionalProperties) {
        // additionalProperties is a schema: extra keys are validated by it,
        // the declared properties still apply (a record would drop them).
        obj = obj.catchall(jsonSchemaToVLD(json.additionalProperties as JSONSchemaDefinition) as any);
      }

      return applyObjectConstraints(obj, json);
    }
    // No properties: a dictionary whose keys follow propertyNames and whose
    // values follow additionalProperties.
    if (json.propertyNames || (json.additionalProperties && typeof json.additionalProperties === 'object')) {
      const valueSchema = json.additionalProperties && typeof json.additionalProperties === 'object'
        ? jsonSchemaToVLD(json.additionalProperties as JSONSchemaDefinition)
        : VldAny.create();
      const keySchema = json.propertyNames
        ? jsonSchemaToVLD({ type: 'string', ...(json.propertyNames as JSONSchemaDefinition) })
        : undefined;
      return applyObjectConstraints(VldRecord.create(valueSchema, keySchema as any), json);
    }
    if (json.additionalProperties === false) {
      return applyObjectConstraints(VldObject.create({}).strict(), json);
    }
    // Empty object schema
    return applyObjectConstraints(VldObject.create({}), json);
  }

  if (type === 'null') {
    return VldNull.create();
  }

  if (Array.isArray(type)) {
    // Union of types
    const options = type.map((t) => {
      return jsonSchemaToVLD({ ...json, type: t, nullable: false });
    });
    if (options.length > 0) {
      return VldUnion.create(...options);
    }
  }

  // Fallback to any
  return VldAny.create();
}

function applyJSONSchemaMetadata(
  schema: AnyVldSchema,
  json: JSONSchemaDefinition
): AnyVldSchema {
  const metadata: SchemaMetadata = {};
  if (json.$id) metadata.id = json.$id;
  if (json.title) metadata.title = json.title;
  if (json.description) metadata.description = json.description;
  if (json.examples) metadata.examples = json.examples;
  if (json.default !== undefined) metadata.default = json.default;
  if (json.deprecated) metadata.deprecated = true;
  if (json.readOnly) metadata.readOnly = true;
  if (json.writeOnly) metadata.writeOnly = true;

  return Object.keys(metadata).length > 0
    ? schema.meta(metadata) as AnyVldSchema
    : schema;
}
