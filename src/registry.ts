import type { SchemaMetadata, VldBase } from './validators/base';

/**
 * Strongly typed schema metadata registry.
 *
 * Registries keep metadata outside schema instances, which preserves validator
 * immutability and mirrors Zod 4's registry model while keeping VLD's existing
 * .meta() wrapper API backward compatible.
 */
export interface SchemaRegistry<TMetadata extends Record<string, unknown> = SchemaMetadata> {
  add<TSchema extends VldBase<any, any>>(schema: TSchema, metadata: TMetadata): TSchema;
  get(schema: VldBase<any, any>): TMetadata | undefined;
  has(schema: VldBase<any, any>): boolean;
  remove(schema: VldBase<any, any>): boolean;
  clear(): void;
}

class WeakSchemaRegistry<TMetadata extends Record<string, unknown>> implements SchemaRegistry<TMetadata> {
  private metadata = new WeakMap<VldBase<any, any>, TMetadata>();

  add<TSchema extends VldBase<any, any>>(schema: TSchema, metadata: TMetadata): TSchema {
    this.metadata.set(schema, { ...metadata });
    return schema;
  }

  get(schema: VldBase<any, any>): TMetadata | undefined {
    const metadata = this.metadata.get(schema);
    return metadata ? { ...metadata } : undefined;
  }

  has(schema: VldBase<any, any>): boolean {
    return this.metadata.has(schema);
  }

  remove(schema: VldBase<any, any>): boolean {
    return this.metadata.delete(schema);
  }

  clear(): void {
    this.metadata = new WeakMap();
  }
}

/**
 * Create a schema metadata registry.
 */
export function registry<TMetadata extends Record<string, unknown> = SchemaMetadata>(): SchemaRegistry<TMetadata> {
  return new WeakSchemaRegistry<TMetadata>();
}

/**
 * Global JSON Schema/OpenAPI compatible metadata registry.
 */
export const globalRegistry = registry<SchemaMetadata>();
