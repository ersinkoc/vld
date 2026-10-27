/**
 * VLD schema -> JSON Schema serialization.
 *
 * Deliberately free of validator-class imports: dispatch goes through
 * `schema.constructor.name` and `validatorType` so that bundling a single
 * validator does not drag the whole serializer graph (and vice versa).
 */

import { VLD_VALIDATOR_TYPES, type SchemaMetadata } from '../validators/base';
import type { VldBase } from '../validators/base';
import { globalRegistry } from '../registry';
import { itemShape } from '../validators/item-shape';

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
  let schemaId: string | undefined;
  if (target === 'draft-04') {
    schemaId = 'http://json-schema.org/draft-04/schema#';
  } else if (target === 'draft-07') {
    schemaId = 'http://json-schema.org/draft-07/schema#';
  } else if (target === 'draft-2019-09') {
    schemaId = 'https://json-schema.org/draft/2019-09/schema';
  } else if (target === 'draft-2020-12') {
    schemaId = 'https://json-schema.org/draft/2020-12/schema';
  }
  if (schemaId !== undefined) {
    // Zod leads the document with $schema; preserve that key order.
    return { $schema: schemaId, ...result };
  }
  return result;
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
      const restItems = rest && typeof rest === 'object' ? normalizeForTarget(rest, options) : false;
      // Zod orders tuple keywords: type, prefixItems, items, then the bounds.
      const reordered: JSONSchemaDefinition = {
        ...(result.type !== undefined ? { type: result.type } : {}),
        prefixItems: tupleItems,
        items: restItems
      };
      for (const [key, value] of Object.entries(result)) {
        if (key !== 'type' && key !== 'items' && key !== 'additionalItems' && key !== 'prefixItems') {
          (reordered as any)[key] = value;
        }
      }
      return reordered;
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
    // The resolved schema; recursion comes back as a $ref through the cycle context.
    return withMetadata(schema, schemaToJSONSchema(unwrapInner(schemaAny), options), options);
  }

  if (schema.constructor.name === 'VldXor') {
    return withMetadata(schema, { oneOf: (schemaAny._options as AnyVldSchema[]).map((option) => schemaToJSONSchema(option, options)) }, options);
  }

  // prefault only changes the value fed to the inner schema: the JSON Schema is the inner one.
  if (schema.constructor.name === 'VldPrefault') {
    return withMetadata(schema, schemaToJSONSchema(unwrapInner(schemaAny), options), options);
  }

  // stringbool: a boolean on output, the accepted string on input (Zod).
  if (schema.constructor.name === 'VldStringBool') {
    return withMetadata(schema, { type: options.io === 'input' ? 'string' : 'boolean' }, options);
  }

  if (schema.constructor.name === 'VldJson') {
    // Zod: the recursive json union, self-referencing through $ref: '#'.
    return withMetadata(schema, {
      anyOf: [
        { type: 'string' },
        { type: 'number' },
        { type: 'boolean' },
        { type: 'null' },
        { type: 'array', items: { $ref: '#' } },
        { type: 'object', propertyNames: { type: 'string' }, additionalProperties: { $ref: '#' } },
      ],
    }, options);
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
    return unrepresentable(schema, options, 'Transforms', () => schemaToJSONSchema(unwrapInner(schemaAny), options));
  }

  // Handle meta types - unwrap metadata
  if (schema.constructor.name === 'VldMeta') {
    const result = schemaToJSONSchema(schemaAny.baseValidator, options);
    return withMetadata(schema, result, options);
  }

  // Handle refine/superRefine types
  // (read the wrapped schema directly: unwrap() forwards to e.g. an array's element schema)
  if (schema.constructor.name === 'VldRefine' || schema.constructor.name === 'VldSuperRefine') {
    return withMetadata(schema, schemaToJSONSchema(schemaAny.baseValidator ?? schemaAny._inner, options), options);
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
    return withMetadata(schema, defaultValue === undefined ? inner : { default: defaultValue, ...inner }, options);
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
    const format = jsonFormatName(formatSchema._format);
    // Zod emits the pattern alongside the format for regex-backed formats
    // (and no format keyword for time, which has none in JSON Schema).
    const definition: JSONSchemaDefinition =
      format === 'time' && formatSchema._patternSource
        ? { type: 'string', pattern: formatSchema._patternSource }
        : formatSchema._patternSource
          ? { type: 'string', format, pattern: formatSchema._patternSource }
          : { type: 'string', format };
    return withMetadata(schema, definition, options);
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
      return unrepresentable(schema, options, 'Transforms', () => schemaToJSONSchema(def.inner, options));
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

  // Zod orders array keywords with the size bounds first, then type and items.
  const bounds: JSONSchemaDefinition = {};
  if (schema.config?.exactLength !== undefined) {
    bounds.minItems = schema.config.exactLength;
    bounds.maxItems = schema.config.exactLength;
  } else {
    if (schema.config?.minLength !== undefined) bounds.minItems = schema.config.minLength;
    if (schema.config?.maxLength !== undefined) bounds.maxItems = schema.config.maxLength;
  }
  const result: JSONSchemaDefinition = { ...bounds, type: 'array' };
  if (inner) {
    result.items = schemaToJSONSchema(inner, options);
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
    // A key is required unless the field may be omitted (Zod's optionality ladder): on the
    // output side when it can produce undefined, on the input side when its declared type allows it.
    if (!isOmittable(child, options)) {
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
    // Zod models passthrough as the permissive empty schema, not boolean true.
    result.additionalProperties = {};
  } else if (schema.config?.catchall) {
    result.additionalProperties = schemaToJSONSchema(schema.config.catchall, options);
  } else if (options.io !== 'input' || schema.config?.strict) {
    // Strip mode accepts (and drops) unknown keys, so the input side is open.
    result.additionalProperties = false;
  }

  return result;
}

function isOmittable(schema: AnyVldSchema, options: ToJSONSchemaOptions): boolean {
  const shape = itemShape(schema, options.io === 'input');
  return options.io === 'input' ? shape.optin !== undefined : shape.optout;
}

/**
 * Build union JSON Schema
 */
function buildUnionSchema(schema: any, options: ToJSONSchemaOptions): JSONSchemaDefinition {
  const validators = schema._validators || schema._options || schema.validators || [];
  const schemas = validators.map((v: AnyVldSchema) => schemaToJSONSchema(v, options));
  // Zod collapses a union of primitive type schemas into a type array.
  const types: string[] = [];
  for (const sub of schemas) {
    if (!sub || typeof sub !== 'object' || Array.isArray(sub)) return { anyOf: schemas };
    const keys = Object.keys(sub);
    if (keys.length !== 1 || keys[0] !== 'type' || Array.isArray((sub as any).type)) return { anyOf: schemas };
    types.push((sub as any).type as string);
  }
  return types.length > 0 ? { type: types } : { anyOf: schemas };
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
  if (value === null) return { type: 'null', const: null };
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
    const types = new Set(values.map((item: unknown) => (item === null ? 'null' : typeof item)));
    if (types.size === 1 && (types.has('string') || types.has('number'))) {
      // Zod emits the member type alongside the enum values.
      return { type: [...types][0] as string, enum: [...values] };
    }
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
    // Zod orders record keywords: type, propertyNames, additionalProperties, required.
    const result: JSONSchemaDefinition = { type: 'object' };
    const keyValidator = schema.keyValidator;
    // Zod always emits propertyNames; a plain string key becomes {type:'string'}.
    if (keyValidator) {
      const keySchema = schemaToJSONSchema(keyValidator, options);
      if (!(Object.keys(keySchema).length === 1 && keySchema.type === 'string')) {
        result.propertyNames = keySchema;
      } else {
        result.propertyNames = { type: 'string' };
      }
    } else {
      result.propertyNames = { type: 'string' };
    }
    result.additionalProperties = schemaToJSONSchema(valueValidator, options);
    // Enum / literal keys: every key is required unless the value accepts undefined.
    if (keyValidator) {
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
    // Trailing items that may be omitted do not count towards the minimum (Zod).
    minItems: items.length
  };
  while (result.minItems! > 0 && isOmittable(items[result.minItems! - 1], options)) result.minItems!--;
  if (result.minItems === 0) delete result.minItems;
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
    (d.additionalProperties === undefined || typeof d.additionalProperties === 'boolean' ||
      (typeof d.additionalProperties === 'object' && Object.keys(d.additionalProperties).length === 0));
  if (!plainObject(a) || !plainObject(b)) {
    return undefined;
  }
  const required = [...new Set([...(a.required ?? []), ...(b.required ?? [])])];
  const result: JSONSchemaDefinition = { type: 'object', properties: { ...a.properties, ...b.properties } };
  if (required.length > 0) result.required = required;
  // Zod drops permissive additionalProperties sides when merging intersections.
  if (a.additionalProperties === false && b.additionalProperties === false) {
    result.additionalProperties = false;
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
    if (result.type === 'null') return result;
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

