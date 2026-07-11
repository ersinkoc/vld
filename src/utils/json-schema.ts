/**
 * JSON Schema support for VLD validators
 * Provides conversion between VLD schemas and JSON Schema
 */

import { VldBase, VLD_VALIDATOR_TYPES, type SchemaMetadata } from '../validators/base';
import { globalRegistry, type SchemaRegistry } from '../registry';
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
import { email, httpUrl, uuid } from '../validators/string-formats';

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
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
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
    if (target === 'draft-2020-12' || target === 'draft-2019-09') {
      result.prefixItems = tupleItems;
      result.items = false;
    } else {
      result.items = tupleItems;
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

  if (target === 'openapi-3.0') {
    normalizeOpenAPI30(result);
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

  if (typeof definition.exclusiveMinimum === 'number') {
    definition.minimum ??= definition.exclusiveMinimum;
    definition.exclusiveMinimum = true;
  }
  if (typeof definition.exclusiveMaximum === 'number') {
    definition.maximum ??= definition.exclusiveMaximum;
    definition.exclusiveMaximum = true;
  }
}

/**
 * Internal function to convert VLD schema to JSON Schema
 */
function schemaToJSONSchema(schema: AnyVldSchema, options: ToJSONSchemaOptions): JSONSchemaDefinition {
  const target = options.target || 'draft-2020-12';
  const schemaAny = schema as any;
  const validatorType = schema.validatorType;

  // Handle primitives
  if (schema.constructor.name === 'VldString' || validatorType === VLD_VALIDATOR_TYPES.STRING) {
    return withMetadata(schema, buildStringSchema(target, schema), options);
  }

  if (schema.constructor.name === 'VldNumber' || validatorType === VLD_VALIDATOR_TYPES.NUMBER) {
    return withMetadata(schema, buildNumberSchema(schema, target), options);
  }

  if (schema.constructor.name === 'VldBoolean' || validatorType === VLD_VALIDATOR_TYPES.BOOLEAN) {
    return withMetadata(schema, { type: 'boolean' }, options);
  }

  if (schema.constructor.name === 'VldBigInt' || validatorType === VLD_VALIDATOR_TYPES.BIGINT) {
    return unrepresentable(schema, options, 'BigInt', () => buildBigIntSchema(schema));
  }

  if (schema.constructor.name === 'VldDate' || validatorType === VLD_VALIDATOR_TYPES.DATE) {
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
    return withMetadata(schema, buildLiteralSchema(schema), options);
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
    return withMetadata(schema, schemaToJSONSchema(schemaAny.baseValidator, options), options);
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
    return withMetadata(schema, schemaToJSONSchema(unwrapInner(schemaAny), options), options);
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
    return withMetadata(schema, { type: 'string', format: formatSchema._format }, options);
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
  return result;
}

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
  if (hints.format) result.format = hints.format;
  if (hints.pattern) result.pattern = hints.pattern;

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
    // VLD objects require all keys by default
    if (!isOptionalLike(child)) {
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
  } else {
    result.additionalProperties = false;
  }

  return result;
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
function buildLiteralSchema(schema: any): JSONSchemaDefinition {
  const value = schema._literal ?? schema.literal ?? schema._value ?? schema.value;
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
    return {
      type: 'object',
      additionalProperties: schemaToJSONSchema(valueValidator, options)
    };
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

  return {
    type: 'array',
    items: items.map((item: AnyVldSchema) => schemaToJSONSchema(item, options)),
    minItems: items.length,
    maxItems: items.length
  };
}

/**
 * Build intersection JSON Schema
 */
function buildIntersectionSchema(schema: any, options: ToJSONSchemaOptions): JSONSchemaDefinition {
  const first = schema._first || schema.first;
  const second = schema._second || schema.second;

  const schemas: JSONSchemaDefinition[] = [];
  if (first) schemas.push(schemaToJSONSchema(first, options));
  if (second) schemas.push(schemaToJSONSchema(second, options));

  if (schemas.length === 0) return {};
  if (schemas.length === 1) return schemas[0] ?? {};

  return { allOf: schemas };
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

  const result = schemaToJSONSchema(inner, options);
  if (typeof result.type === 'string') {
    return { type: [result.type, 'null'] };
  } else if (Array.isArray(result.type)) {
    result.type.push('null');
    return result;
  }

  return {
    anyOf: [result, { type: 'null' }]
  };
}

/**
 * Build nullish JSON Schema
 */
function buildNullishSchema(schema: any, options: ToJSONSchemaOptions): JSONSchemaDefinition {
  const inner = unwrapInner(schema);
  if (!inner) return {};

  const result = schemaToJSONSchema(inner, options);
  if (typeof result.type === 'string') {
    return { ...result, type: [result.type, 'null'] };
  }
  return result;
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
function jsonSchemaToVLD(json: JSONSchemaDefinition): AnyVldSchema {
  return applyJSONSchemaMetadata(jsonSchemaToVLDInner(json), json);
}

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
    return VldEnum.create(json.enum as any);
  }

  // Handle type
  const type = json.nullable && typeof json.type === 'string'
    ? [json.type, 'null']
    : json.type;

  if (type === 'string' || type === undefined) {
    let s = VldString.create();
    if (json.minLength !== undefined) s = s.min(json.minLength);
    if (json.maxLength !== undefined) s = s.max(json.maxLength);
    if (json.pattern) s = s.regex(new RegExp(json.pattern));
    if (json.format) {
      // Map JSON Schema formats to VLD validators
      switch (json.format) {
        case 'date-time':
        case 'date':
        case 'time':
          // Would need DateTime validator
          break;
        case 'email':
          return email();
        case 'uri':
        case 'uri-reference':
          return httpUrl();
        case 'uuid':
          return uuid();
        default:
          break;
      }
    }
    return s;
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
    if (json.prefixItems && json.prefixItems.length > 0) {
      const validators = json.prefixItems.map((item) => jsonSchemaToVLD(item));
      return VldTuple.create(...validators as any);
    }

    if (Array.isArray(json.items)) {
      const validators = json.items.map((item) => jsonSchemaToVLD(item));
      return VldTuple.create(...validators as any);
    }

    if (json.items && !Array.isArray(json.items)) {
      return VldArray.create(jsonSchemaToVLD(json.items));
    }
    return VldArray.create(VldAny.create());
  }

  if (type === 'object') {
    if (json.properties) {
      const shape: Record<string, AnyVldSchema> = {};
      const required = new Set(json.required || []);

      for (const [key, propSchema] of Object.entries(json.properties)) {
        const fieldSchema = jsonSchemaToVLD(propSchema as JSONSchemaDefinition);
        shape[key] = required.has(key) ? fieldSchema : fieldSchema.optional();
      }

      let obj = VldObject.create(shape);

      if (json.additionalProperties === false) {
        obj = obj.strict();
      } else if (json.additionalProperties === true) {
        obj = obj.passthrough();
      } else if (json.additionalProperties) {
        // additionalProperties is a schema
        const valueSchema = jsonSchemaToVLD(json.additionalProperties as JSONSchemaDefinition);
        return VldRecord.create(valueSchema);
      }

      return obj;
    }
    // Empty object schema
    return VldObject.create({});
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
