/**
 * VLD Plugin Types
 *
 * This module defines the plugin system interfaces and types
 * for extending VLD with custom validators, transforms, and codecs.
 */

import type { VldBase } from '../validators/base';
import type { VldError } from '../errors';
import type { ParseResult } from '../validators/base';
import type { Locale } from '../locales';

/**
 * Plugin metadata
 */
export interface PluginMeta {
  /** Plugin name (must be unique) */
  readonly name: string;
  /** Plugin version (semver) */
  readonly version: string;
  /** Plugin description */
  readonly description?: string;
  /** Plugin author */
  readonly author?: string;
  /** Plugin dependencies */
  readonly dependencies?: Record<string, string>;
}

/**
 * VLD context available to plugins
 */
export interface VldContext {
  /** Current locale */
  locale: Locale;
  /** Strict mode enabled */
  strict: boolean;
  /** Debug mode enabled */
  debug: boolean;
  /** Custom context data */
  custom: Record<string, unknown>;
}

/**
 * Validator factory function
 */
export type ValidatorFactory<T = unknown> = (
  ...args: unknown[]
) => VldBase<unknown, T>;

/**
 * Transform factory function
 */
export type TransformFactory<TInput = unknown, TOutput = unknown> = (
  ...args: unknown[]
) => (value: TInput) => TOutput;

/**
 * Codec factory function
 */
export interface CodecFactory<TInput = unknown, TOutput = unknown> {
  decode: (value: TInput) => TOutput | Promise<TOutput>;
  encode: (value: TOutput) => TInput | Promise<TInput>;
}

/**
 * Plugin hook context
 */
export interface HookContext {
  /** Path to current value in nested validation */
  path: (string | number)[];
  /** Parent schema (if nested) */
  parent?: VldBase<unknown, unknown>;
  /** Abort validation */
  abort: () => void;
}

/**
 * Plugin hooks for intercepting validation lifecycle
 */
export interface PluginHooks {
  /**
   * Called before parsing starts
   * Can modify the value before validation
   */
  onBeforeParse?: (
    value: unknown,
    schema: VldBase<unknown, unknown>,
    context: HookContext
  ) => unknown;

  /**
   * Called after parsing completes (success or failure)
   * Can modify the result
   */
  onAfterParse?: <T>(
    result: ParseResult<T>,
    schema: VldBase<unknown, unknown>,
    context: HookContext
  ) => ParseResult<T>;

  /**
   * Called when a validation error occurs
   * Can log, transform, or suppress errors
   */
  onError?: (
    error: VldError,
    schema: VldBase<unknown, unknown>,
    context: HookContext
  ) => void;

  /**
   * Called when validation succeeds
   * Useful for metrics and logging
   */
  onSuccess?: <T>(
    data: T,
    schema: VldBase<unknown, unknown>,
    context: HookContext
  ) => void;
}

/**
 * VLD Plugin interface
 */
export interface VldPlugin extends PluginMeta, PluginHooks {
  /**
   * Custom validators provided by this plugin
   */
  validators?: Record<string, ValidatorFactory>;

  /**
   * Custom transforms provided by this plugin
   */
  transforms?: Record<string, TransformFactory>;

  /**
   * Custom codecs provided by this plugin
   */
  codecs?: Record<string, CodecFactory>;

  /**
   * Install hook - called when plugin is registered
   * Receives the VLD kernel for additional setup
   */
  install?: (kernel: VldKernelInstance) => void | Promise<void>;

  /**
   * Uninstall hook - called when plugin is removed
   */
  uninstall?: (kernel: VldKernelInstance) => void | Promise<void>;
}

/**
 * Kernel options
 */
export interface VldKernelOptions {
  /** Initial context */
  context?: Partial<VldContext>;
  /** Plugins to load on creation */
  plugins?: VldPlugin[];
  /** Error handling strategy */
  errorStrategy?: 'throw' | 'isolate' | 'silent';
  /** Enable debug mode */
  debug?: boolean;
}

/**
 * VLD Kernel instance interface
 */
export interface VldKernelInstance {
  // ============================================
  // Context Management
  // ============================================

  /** Get current context */
  getContext(): VldContext;

  /** Update context */
  setContext(partial: Partial<VldContext>): void;

  // ============================================
  // Plugin Management
  // ============================================

  /** Register a plugin */
  use(plugin: VldPlugin): this;

  /** Remove a plugin by name */
  remove(name: string): boolean;

  /** Get a plugin by name */
  getPlugin(name: string): VldPlugin | undefined;

  /** Get all registered plugins */
  getPlugins(): VldPlugin[];

  /** Check if a plugin is registered */
  hasPlugin(name: string): boolean;

  // ============================================
  // Validator Registry
  // ============================================

  /** Register a custom validator */
  registerValidator(name: string, factory: ValidatorFactory): this;

  /** Get a validator by name */
  getValidator(name: string): VldBase<unknown, unknown> | undefined;

  /** Get all registered validators */
  getValidators(): Record<string, ValidatorFactory>;

  // ============================================
  // Transform Registry
  // ============================================

  /** Register a custom transform */
  registerTransform(name: string, factory: TransformFactory): this;

  /** Get a transform by name */
  getTransform(name: string): TransformFactory | undefined;

  // ============================================
  // Codec Registry
  // ============================================

  /** Register a custom codec */
  registerCodec(name: string, codec: CodecFactory): this;

  /** Get a codec by name */
  getCodec(name: string): CodecFactory | undefined;

  // ============================================
  // Hook Execution
  // ============================================

  /** Execute beforeParse hooks */
  executeBeforeParse(
    value: unknown,
    schema: VldBase<unknown, unknown>,
    context: HookContext
  ): unknown;

  /** Execute afterParse hooks */
  executeAfterParse<T>(
    result: ParseResult<T>,
    schema: VldBase<unknown, unknown>,
    context: HookContext
  ): ParseResult<T>;

  /** Execute error hooks */
  executeOnError(
    error: VldError,
    schema: VldBase<unknown, unknown>,
    context: HookContext
  ): void;

  /** Execute success hooks */
  executeOnSuccess<T>(
    data: T,
    schema: VldBase<unknown, unknown>,
    context: HookContext
  ): void;

  // ============================================
  // Lifecycle
  // ============================================

  /** Dispose of all plugins and cleanup */
  dispose(): Promise<void>;
}

/**
 * Plugin builder for fluent plugin creation
 */
export interface PluginBuilder {
  name(name: string): this;
  version(version: string): this;
  description(description: string): this;
  validator(name: string, factory: ValidatorFactory): this;
  transform(name: string, factory: TransformFactory): this;
  codec(name: string, codec: CodecFactory): this;
  hook<K extends keyof PluginHooks>(name: K, fn: PluginHooks[K]): this;
  install(fn: VldPlugin['install']): this;
  build(): VldPlugin;
}
