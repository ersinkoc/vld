/**
 * Backward-compatibility shim: JSON Schema support was split so the
 * serializer (`to-json-schema.ts`) carries no validator-class imports.
 */

export { toJSONSchema } from './to-json-schema';
export type { JSONSchemaDefinition, ToJSONSchemaOptions } from './to-json-schema';
export { fromJSONSchema } from './from-json-schema';
export type { FromJSONSchemaOptions } from './from-json-schema';
