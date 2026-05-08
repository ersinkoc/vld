/**
 * JSON Schema support for VLD validators
 * Provides conversion between VLD schemas and JSON Schema
 */

import { VldBase } from '../validators/base';

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
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;
  properties?: Record<string, JSONSchemaDefinition>;
  additionalProperties?: boolean | JSONSchemaDefinition;
  required?: string[];
  items?: JSONSchemaDefinition | JSONSchemaDefinition[];
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
};

/**
 * Options for JSON Schema conversion
 */
export interface ToJSONSchemaOptions {
  target?: 'draft-07' | 'draft-2019-09' | 'draft-2020-12';
  includeMetadata?: boolean;
  includeExamples?: boolean;
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
  return schemaToJSONSchema(schema as VldBase<unknown, unknown>, options);
}

/**
 * Convert a JSON Schema to a VLD schema
 * @param json The JSON Schema definition
 * @returns A VLD schema
 */
export function fromJSONSchema(json: JSONSchemaDefinition): VldBase<unknown, unknown> {
  return jsonSchemaToVLD(json);
}

/**
 * Internal function to convert VLD schema to JSON Schema
 */
function schemaToJSONSchema(schema: VldBase<unknown, unknown>, options: ToJSONSchemaOptions): JSONSchemaDefinition {
  const target = options.target || 'draft-07';

  // Handle primitives
  if (schema.constructor.name === 'VldString') {
    return buildStringSchema(target);
  }

  if (schema.constructor.name === 'VldNumber') {
    return buildNumberSchema(schema, target);
  }

  if (schema.constructor.name === 'VldBoolean') {
    return { type: 'boolean' };
  }

  if (schema.constructor.name === 'VldBigInt') {
    return { type: 'integer' };
  }

  if (schema.constructor.name === 'VldDate') {
    return { type: 'string', format: 'date-time' };
  }

  if (schema.constructor.name === 'VldArray') {
    return buildArraySchema(schema, options);
  }

  if (schema.constructor.name === 'VldObject') {
    return buildObjectSchema(schema, options);
  }

  // Handle union types
  if (schema.constructor.name === 'VldUnion') {
    return buildUnionSchema(schema, options);
  }

  // Handle literal types
  if (schema.constructor.name === 'VldLiteral') {
    return buildLiteralSchema(schema);
  }

  if (schema.constructor.name === 'VldEnum') {
    return buildEnumSchema(schema);
  }

  if (schema.constructor.name === 'VldRecord') {
    return buildRecordSchema(schema, options);
  }

  if (schema.constructor.name === 'VldTuple') {
    return buildTupleSchema(schema, options);
  }

  if (schema.constructor.name === 'VldIntersection') {
    return buildIntersectionSchema(schema, options);
  }

  if (schema.constructor.name === 'VldOptional') {
    return buildOptionalSchema(schema, options);
  }

  if (schema.constructor.name === 'VldNullable') {
    return buildNullableSchema(schema, options);
  }

  if (schema.constructor.name === 'VldNullish') {
    return buildNullishSchema(schema, options);
  }

  if (schema.constructor.name === 'VldExactOptional') {
    return buildExactOptionalSchema(schema, options);
  }

  if (schema.constructor.name === 'VldLazy') {
    return { type: 'object' }; // Placeholder for recursive schemas
  }

  if (schema.constructor.name === 'VldJson') {
    return {}; // Any JSON
  }

  if (schema.constructor.name === 'VldAny') {
    return {}; // JSON Schema true
  }

  if (schema.constructor.name === 'VldUnknown') {
    return {}; // JSON Schema true
  }

  if (schema.constructor.name === 'VldNever') {
    return { not: {} }; // JSON Schema false
  }

  if (schema.constructor.name === 'VldNull') {
    return { type: 'null' };
  }

  if (schema.constructor.name === 'VldUndefined') {
    return { not: {} }; // Undefined can't be represented in JSON Schema
  }

  if (schema.constructor.name === 'VldNan') {
    return { type: 'number', not: {} }; // NaN is a number type constraint
  }

  if (schema.constructor.name === 'VldVoid') {
    return { not: {} }; // Void/undefined can't be represented
  }

  // Handle branded types - unwrap and continue
  if (schema.constructor.name === 'VldBrand') {
    return schemaToJSONSchema((schema as any).baseValidator, options);
  }

  // Handle readonly types
  if (schema.constructor.name === 'VldReadonly') {
    return schemaToJSONSchema((schema as any).baseValidator, options);
  }

  // Handle transform types
  if (schema.constructor.name === 'VldTransform') {
    return schemaToJSONSchema((schema as any)._inner, options);
  }

  // Handle meta types - unwrap metadata
  if (schema.constructor.name === 'VldMeta') {
    const metaSchema = schema as any;
    const result = schemaToJSONSchema(metaSchema.baseValidator, options);
    if (options.includeMetadata !== false && metaSchema.metadata) {
      const meta = metaSchema.metadata;
      if (meta.title) result.title = meta.title;
      if (meta.description) result.description = meta.description;
      if (meta.examples && options.includeExamples) result.examples = meta.examples;
      if (meta.default !== undefined) result.default = meta.default;
      if (meta.deprecated) result.deprecated = true;
      if (meta.readOnly) result.readOnly = true;
      if (meta.writeOnly) result.writeOnly = true;
    }
    return result;
  }

  // Handle refine/superRefine types
  if (schema.constructor.name === 'VldRefine' || schema.constructor.name === 'VldSuperRefine') {
    return schemaToJSONSchema((schema as any)._inner || (schema as any)._baseValidator, options);
  }

  // Handle pipe types
  if (schema.constructor.name === 'VldPipe') {
    return schemaToJSONSchema((schema as any)._next || (schema as any).second, options);
  }

  // Handle default/catch types
  if (schema.constructor.name === 'VldDefault' || schema.constructor.name === 'VldCatch') {
    return schemaToJSONSchema((schema as any)._inner || (schema as any)._baseValidator, options);
  }

  // Handle preprocess types
  if (schema.constructor.name === 'VldPreprocess') {
    return schemaToJSONSchema((schema as any)._schema, options);
  }

  // Handle string format validators
  if (schema.constructor.name === 'VldStringFormat') {
    const formatSchema = schema as any;
    return { type: 'string', format: formatSchema._format };
  }

  // Fallback for unknown types
  return {};
}

/**
 * Build string JSON Schema
 */
function buildStringSchema(_target: string): JSONSchemaDefinition {
  return { type: 'string' };
}

/**
 * Build number JSON Schema from VLD number schema
 */
function buildNumberSchema(schema: any, _target: string): JSONSchemaDefinition {
  const config = schema.config || {};
  const checks = config.checks || [];

  const result: JSONSchemaDefinition = { type: 'number' };

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

/**
 * Build array JSON Schema
 */
function buildArraySchema(schema: any, options: ToJSONSchemaOptions): JSONSchemaDefinition {
  const inner = schema._item || schema._inner;
  if (inner) {
    return {
      type: 'array',
      items: toJSONSchema(inner, options)
    };
  }
  return { type: 'array' };
}

/**
 * Build object JSON Schema
 */
function buildObjectSchema(schema: any, options: ToJSONSchemaOptions): JSONSchemaDefinition {
  const shape = schema._shape || schema.shape;
  if (!shape) return { type: 'object' };

  const properties: Record<string, JSONSchemaDefinition> = {};
  const required: string[] = [];

  for (const [key, value] of Object.entries(shape)) {
    properties[key] = toJSONSchema(value as VldBase<unknown, unknown>, options);
    // VLD objects require all keys by default
    if (schema._strict !== false) {
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
  if (schema._passthrough || schema._loose) {
    result.additionalProperties = true;
  } else if (schema._strict) {
    result.additionalProperties = false;
  }

  return result;
}

/**
 * Build union JSON Schema
 */
function buildUnionSchema(schema: any, options: ToJSONSchemaOptions): JSONSchemaDefinition {
  const validators = schema._validators || schema._options || [];
  return {
    anyOf: validators.map((v: VldBase<unknown, unknown>) => toJSONSchema(v, options))
  };
}

/**
 * Build literal JSON Schema
 */
function buildLiteralSchema(schema: any): JSONSchemaDefinition {
  const value = schema._value || schema.value;
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
  const valueValidator = schema._value || schema._inner;
  if (valueValidator) {
    return {
      type: 'object',
      additionalProperties: toJSONSchema(valueValidator, options)
    };
  }
  return { type: 'object' };
}

/**
 * Build tuple JSON Schema
 */
function buildTupleSchema(schema: any, options: ToJSONSchemaOptions): JSONSchemaDefinition {
  const items = schema._items || schema.items;
  if (!items || !Array.isArray(items)) {
    return { type: 'array' };
  }

  return {
    type: 'array',
    items: items.map((item: VldBase<unknown, unknown>) => toJSONSchema(item, options)),
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
  if (first) schemas.push(toJSONSchema(first, options));
  if (second) schemas.push(toJSONSchema(second, options));

  if (schemas.length === 0) return {};
  if (schemas.length === 1) return schemas[0];

  return { allOf: schemas };
}

/**
 * Build optional JSON Schema
 */
function buildOptionalSchema(schema: any, options: ToJSONSchemaOptions): JSONSchemaDefinition {
  const inner = schema._inner || schema._baseValidator;
  if (!inner) return {};

  const result = toJSONSchema(inner, options);
  // Remove from required array - but we don't track required here
  return result;
}

/**
 * Build nullable JSON Schema
 */
function buildNullableSchema(schema: any, options: ToJSONSchemaOptions): JSONSchemaDefinition {
  const inner = schema._inner || schema._baseValidator;
  if (!inner) return { type: 'null' };

  const result = toJSONSchema(inner, options);
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
  const inner = schema._inner || schema._baseValidator;
  if (!inner) return {};

  return toJSONSchema(inner, options);
}

/**
 * Build exactOptional JSON Schema
 */
function buildExactOptionalSchema(schema: any, options: ToJSONSchemaOptions): JSONSchemaDefinition {
  const inner = schema._inner || schema._baseValidator;
  if (!inner) return {};

  return toJSONSchema(inner, options);
}

/**
 * Internal function to convert JSON Schema to VLD schema
 */
function jsonSchemaToVLD(json: JSONSchemaDefinition): VldBase<unknown, unknown> {
  // This is a simplified implementation
  // Full implementation would recursively handle all JSON Schema types

  const VldString = require('../validators/string').VldString;
  const VldNumber = require('../validators/number').VldNumber;
  const VldBoolean = require('../validators/boolean').VldBoolean;
  const VldObject = require('../validators/object').VldObject;
  const VldArray = require('../validators/array').VldArray;
  const VldUnion = require('../validators/union').VldUnion;
  const VldLiteral = require('../validators/literal').VldLiteral;
  const VldEnum = require('../validators/enum').VldEnum;
  const VldNull = require('../validators/null').VldNull;
  const VldAny = require('../validators/any').VldAny;
  const VldRecord = require('../validators/record').VldRecord;

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
    const first = jsonSchemaToVLD(json.allOf[0]);
    if (json.allOf.length > 1) {
      const second = jsonSchemaToVLD({ allOf: json.allOf.slice(1) });
      const VldIntersection = require('../validators/intersection').VldIntersection;
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
    return VldLiteral.create(json.const);
  }

  // Handle enum
  if (json.enum) {
    return VldEnum.create(json.enum as any);
  }

  // Handle type
  const type = json.type;

  if (type === 'string' || type === undefined) {
    const s = VldString.create();
    if (json.minLength) s.minLength = json.minLength;
    if (json.maxLength) s.maxLength = json.maxLength;
    if (json.pattern) s.pattern = json.pattern;
    if (json.format) {
      // Map JSON Schema formats to VLD validators
      switch (json.format) {
        case 'date-time':
        case 'date':
        case 'time':
          // Would need DateTime validator
          break;
        case 'email':
          const email = require('../validators/string-formats').email;
          return email();
        case 'uri':
        case 'uri-reference':
          const httpUrl = require('../validators/string-formats').httpUrl;
          return httpUrl();
        case 'uuid':
          const uuid = require('../validators/string-formats').uuid;
          return uuid();
        default:
          break;
      }
    }
    return s;
  }

  if (type === 'number' || type === 'integer') {
    const n = VldNumber.create();
    if (type === 'integer') n.int();
    if (json.minimum !== undefined) n.min(json.minimum);
    if (json.maximum !== undefined) n.max(json.maximum);
    if (json.exclusiveMinimum !== undefined) n.gt(json.exclusiveMinimum);
    if (json.exclusiveMaximum !== undefined) n.lt(json.exclusiveMaximum);
    if (json.multipleOf !== undefined) n.multipleOf(json.multipleOf);
    return n;
  }

  if (type === 'boolean') {
    return VldBoolean.create();
  }

  if (type === 'array') {
    if (json.items && !Array.isArray(json.items)) {
      return VldArray.create(jsonSchemaToVLD(json.items));
    }
    return VldArray.create(VldAny.create());
  }

  if (type === 'object') {
    if (json.properties) {
      const shape: Record<string, VldBase<unknown, unknown>> = {};
      const required = json.required || [];

      for (const [key, propSchema] of Object.entries(json.properties)) {
        shape[key] = jsonSchemaToVLD(propSchema as JSONSchemaDefinition);
      }

      let obj = VldObject.create(shape);

      if (!required.length) {
        // If no required fields, make all optional
        for (const key of Object.keys(shape)) {
          if (!required.includes(key)) {
            // The field is already optional in VLD object creation
          }
        }
      }

      if (json.additionalProperties === false) {
        obj = obj.strict();
      } else if (json.additionalProperties === true) {
        obj = obj.passthrough();
      } else if (json.additionalProperties) {
        // additionalProperties is a schema
        const valueSchema = jsonSchemaToVLD(json.additionalProperties as JSONSchemaDefinition);
        obj = VldRecord.create(valueSchema);
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
      return jsonSchemaToVLD({ ...json, type: t });
    });
    if (options.length > 0) {
      return VldUnion.create(...options);
    }
  }

  // Fallback to any
  return VldAny.create();
}