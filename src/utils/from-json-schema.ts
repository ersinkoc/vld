/**
 * JSON Schema -> VLD schema construction.
 *
 * Split from the serializer half because building validators requires the
 * validator factories themselves; keeping that dependency here lets
 * `to-json-schema.ts` stay free of validator imports for tree-shaking.
 */

import { VldBase, VldPreprocess, type SchemaMetadata } from '../validators/base';
import type { SchemaRegistry } from '../registry';
import { VldError, type VldIssue } from '../errors-core';
import { VldAny } from '../validators/any';
import { VldArray } from '../validators/array';
import { VldEnum } from '../validators/enum';
import { VldIntersection } from '../validators/intersection';
import { VldLazy } from '../validators/lazy';
import { VldLiteral } from '../validators/literal';
import { VldNever } from '../validators/never';
import { VldNumber } from '../validators/number';
import { VldObject } from '../validators/object';
import { VldString } from '../validators/string';
import { VldBoolean } from '../validators/boolean';
import { VldNull } from '../validators/null';
import { VldRecord } from '../validators/record';
import { VldTuple } from '../validators/tuple';

import { VldUnion } from '../validators/union';
import { VldXor } from '../validators/xor';
import * as stringFormats from '../validators/string-formats';
import type { JSONSchemaDefinition } from './to-json-schema';

type AnyVldSchema = VldBase<any, any>;

export interface FromJSONSchemaOptions {
  defaultTarget?: 'draft-2020-12' | 'draft-7' | 'draft-4' | 'openapi-3.0';
  registry?: SchemaRegistry<Record<string, unknown>>;
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

  const schema = withRefDocument(normalized, () => jsonSchemaToVLD(normalized)) as VldBase<unknown, unknown>;
  const metadata = schema.meta();
  if (options.registry && metadata) {
    options.registry.add(schema, metadata);
  }
  return schema;
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
  if (json.uniqueItems === true) {
    // JSON Schema equality is structural and applies to the input items (an item schema may strip or rewrite them),
    // and tuples have no unique().
    result = VldPreprocess.create((value: unknown) => {
      if (Array.isArray(value) && value.some((item, index) => value.findIndex((other) => jsonDeepEqual(other, item)) !== index)) {
        throw new VldError([{ code: 'custom', path: [], message: 'Array must contain unique items' }]);
      }
      return value;
    }, result);
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

/** The document local `$ref`s resolve against while it is being converted (and while a lazily resolved ref converts). */
interface RefDocument {
  readonly root: JSONSchemaDefinition;
  readonly cache: Map<string, AnyVldSchema>;
}

let refDocument: RefDocument | undefined;

function withRefDocument<T>(root: JSONSchemaDefinition, run: () => T, cache: Map<string, AnyVldSchema> = new Map()): T {
  const previous = refDocument;
  refDocument = { root, cache };
  try {
    return run();
  } finally {
    refDocument = previous;
  }
}

/** The subschema a local JSON pointer ref (`#`, `#/$defs/x`, `#/definitions/x`, `#/properties/a`) points at; undefined when it points nowhere. */
function lookupLocalRef(root: JSONSchemaDefinition, ref: string): JSONSchemaDefinition | boolean | undefined {
  let node: unknown = root;
  if (ref !== '#') {
    if (!ref.startsWith('#/')) return undefined;
    for (const raw of ref.slice(2).split('/')) {
      const key = decodeURIComponent(raw).replace(/~1/g, '/').replace(/~0/g, '~');
      if (typeof node !== 'object' || node === null || !Object.prototype.hasOwnProperty.call(node, key)) return undefined;
      node = (node as Record<string, unknown>)[key];
    }
  }
  if (typeof node !== 'boolean' && (typeof node !== 'object' || node === null)) return undefined;
  return node as JSONSchemaDefinition | boolean;
}

/** A local ref converts lazily (recursive schemas) and once per document; a dangling ref accepts anything (as before). */
function resolveLocalRef(document: RefDocument, ref: string): AnyVldSchema {
  const cached = document.cache.get(ref);
  if (cached !== undefined) return cached;
  const target = lookupLocalRef(document.root, ref);
  if (target === undefined) return VldAny.create() as unknown as AnyVldSchema;
  const lazy = VldLazy.create(() => withRefDocument(document.root, () => jsonSchemaToVLD(target), document.cache)) as unknown as AnyVldSchema;
  document.cache.set(ref, lazy);
  return lazy;
}

/** "required" names that no listed property covers: the key must be present on the raw input. */
function applyRequiredKeys(objectSchema: any, json: JSONSchemaDefinition): any {
  const required = (json.required ?? []).filter(
    (key) => json.properties === undefined || !Object.prototype.hasOwnProperty.call(json.properties, key)
  );
  if (required.length === 0) return objectSchema;
  return VldPreprocess.create((value: unknown) => {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const issues: VldIssue[] = required
        .filter((key) => !Object.prototype.hasOwnProperty.call(value, key))
        .map((key) => ({ code: 'invalid_type', path: [key], message: `Invalid input: missing required property "${key}"` }) as VldIssue);
      if (issues.length > 0) throw new VldError(issues);
    }
    return value;
  }, objectSchema);
}

/** propertyNames on an object that is not a record: every own key must satisfy the key schema. */
function applyPropertyNames(objectSchema: any, json: JSONSchemaDefinition): any {
  const names = json.propertyNames as JSONSchemaDefinition | boolean | undefined;
  if (names === undefined) return objectSchema;
  const keySchema = jsonSchemaToVLD(typeof names === 'object' ? { type: 'string', ...names } : names);
  // Checked on the raw input: the object schema itself drops or rejects keys it does not list.
  return VldPreprocess.create((value: unknown) => {
    if (value !== null && typeof value === 'object') {
      const issues: VldIssue[] = [];
      for (const key of Object.keys(value)) {
        const parsed = keySchema.safeParse(key);
        if (!parsed.success) issues.push({ code: 'invalid_key', path: [key], message: parsed.error.message });
      }
      if (issues.length > 0) throw new VldError(issues);
    }
    return value;
  }, objectSchema);
}

function jsonSchemaToVLD(json: JSONSchemaDefinition | boolean): AnyVldSchema {
  // A boolean subschema (anyOf: [false, ...], items: false, properties: { a: true }) accepts everything or nothing.
  if (typeof json === 'boolean') return (json ? VldAny.create() : VldNever.create()) as unknown as AnyVldSchema;
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

/** JSON Schema equality (const / enum): structural for arrays and objects, strict for primitives. */
function jsonDeepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    const other = b as unknown[];
    return a.length === other.length && a.every((item, index) => jsonDeepEqual(item, other[index]));
  }
  const left = a as Record<string, unknown>;
  const right = b as Record<string, unknown>;
  const keys = Object.keys(left);
  return keys.length === Object.keys(right).length && keys.every((key) => Object.prototype.hasOwnProperty.call(right, key) && jsonDeepEqual(left[key], right[key]));
}

/** A const / enum member: primitives are literals, arrays and objects compare structurally. */
function jsonLiteral(value: unknown): AnyVldSchema {
  if (typeof value === 'object' && value !== null) {
    return VldAny.create().refine((candidate) => jsonDeepEqual(candidate, value)) as unknown as AnyVldSchema;
  }
  return VldLiteral.create(value as any) as unknown as AnyVldSchema;
}

function jsonSchemaToVLDInner(json: JSONSchemaDefinition): AnyVldSchema {
  // Handle $ref
  if (json.$ref) {
    // Local refs resolve against the converted document; dangling and external refs accept anything.
    return refDocument !== undefined && json.$ref.startsWith('#') ? resolveLocalRef(refDocument, json.$ref) : VldAny.create();
  }

  // Handle not: the remaining keywords must hold and the negated schema must not.
  if (json.not !== undefined) {
    // `default` stays with the outer schema (applied once by jsonSchemaToVLD).
    const { not, ...rest } = json;
    delete rest.default;
    const negated = jsonSchemaToVLD(not);
    return jsonSchemaToVLD(rest).refine((value) => !negated.safeParse(value).success) as unknown as AnyVldSchema;
  }

  // Handle anyOf/oneOf (union; oneOf is exclusive: exactly one branch must match)
  if (json.anyOf || json.oneOf) {
    const options = (json.anyOf || json.oneOf)!
      .map((s) => jsonSchemaToVLD(s))
      .filter(Boolean);
    if (options.length > 0) {
      return json.anyOf ? VldUnion.create(...options) : VldXor.create(options as any) as unknown as AnyVldSchema;
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

  // Handle const
  if (json.const !== undefined) {
    return jsonLiteral(json.const);
  }

  // Handle enum
  if (json.enum) {
    if (json.enum.every((value) => typeof value === 'string' || typeof value === 'number')) {
      return VldEnum.create(json.enum as any);
    }
    // null / boolean members: a union of literals (VldEnum only holds strings and numbers).
    const members = json.enum.map((value) => jsonLiteral(value));
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
    } else if (json.items === false) {
      arraySchema = VldArray.create(VldNever.create());
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

      return applyRequiredKeys(applyPropertyNames(applyObjectConstraints(obj, json), json), json);
    }
    // No properties: a dictionary whose keys follow propertyNames and whose
    // values follow additionalProperties.
    if ((json.propertyNames && json.additionalProperties !== false) || (json.additionalProperties && typeof json.additionalProperties === 'object')) {
      const valueSchema = json.additionalProperties && typeof json.additionalProperties === 'object'
        ? jsonSchemaToVLD(json.additionalProperties as JSONSchemaDefinition)
        : VldAny.create();
      const keySchema = json.propertyNames
        ? jsonSchemaToVLD({ type: 'string', ...(json.propertyNames as JSONSchemaDefinition) })
        : undefined;
      // JSON Schema never requires a key just because propertyNames lists it (only "required" does): enumerated keys stay optional.
      const record = VldRecord.create(valueSchema, keySchema as any);
      return applyRequiredKeys(applyObjectConstraints(keySchema ? record.partial() : record, json), json);
    }
    if (json.additionalProperties === false) {
      return applyRequiredKeys(applyPropertyNames(applyObjectConstraints(VldObject.create({}).strict(), json), json), json);
    }
    // Empty object schema
    return applyRequiredKeys(applyObjectConstraints(VldObject.create({}), json), json);
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
