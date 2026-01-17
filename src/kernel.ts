/**
 * VLD Kernel
 *
 * The kernel is the core of the VLD plugin system.
 * It manages plugins, validators, transforms, and codecs.
 */

import type { Locale } from './locales';
import type { VldBase, ParseResult } from './validators/base';
import type { VldError } from './errors';
import { createEmitter } from './compat/emitter';
import type { VldEvents } from './events';
import type {
  VldContext,
  VldPlugin,
  VldKernelInstance,
  VldKernelOptions,
  ValidatorFactory,
  TransformFactory,
  CodecFactory,
  HookContext,
  PluginBuilder
} from './plugins/types';

/**
 * Create the VLD kernel
 */
export function createVldKernel(options: VldKernelOptions = {}): VldKernelInstance {
  // ============================================
  // State
  // ============================================

  const context: VldContext = {
    locale: 'en' as Locale,
    strict: false,
    debug: options.debug ?? false,
    custom: {},
    ...options.context
  };

  const plugins = new Map<string, VldPlugin>();
  const validators = new Map<string, ValidatorFactory>();
  const transforms = new Map<string, TransformFactory>();
  const codecs = new Map<string, CodecFactory>();

  const emitter = createEmitter<VldEvents>();
  const errorStrategy = options.errorStrategy ?? 'throw';

  // ============================================
  // Context Management
  // ============================================

  const getContext = (): VldContext => ({ ...context });

  const setContext = (partial: Partial<VldContext>): void => {
    Object.assign(context, partial);
  };

  // ============================================
  // Plugin Management
  // ============================================

  const use = (plugin: VldPlugin): VldKernelInstance => {
    if (plugins.has(plugin.name)) {
      if (errorStrategy === 'throw') {
        throw new Error(`Plugin "${plugin.name}" is already registered`);
      }
      return kernel;
    }

    // Register plugin validators
    if (plugin.validators) {
      for (const [name, factory] of Object.entries(plugin.validators)) {
        validators.set(name, factory);
      }
    }

    // Register plugin transforms
    if (plugin.transforms) {
      for (const [name, factory] of Object.entries(plugin.transforms)) {
        transforms.set(name, factory);
      }
    }

    // Register plugin codecs
    if (plugin.codecs) {
      for (const [name, codec] of Object.entries(plugin.codecs)) {
        codecs.set(name, codec);
      }
    }

    // Store plugin
    plugins.set(plugin.name, plugin);

    // Call install hook
    if (plugin.install) {
      try {
        const result = plugin.install(kernel);
        if (result instanceof Promise) {
          result.catch((err) => {
            if (context.debug) {
              console.error(`Error installing plugin "${plugin.name}":`, err);
            }
          });
        }
      } catch (err) {
        if (errorStrategy === 'throw') {
          throw err;
        }
        if (context.debug) {
          console.error(`Error installing plugin "${plugin.name}":`, err);
        }
      }
    }

    // Emit event
    emitter.emit('vld:plugin:registered', {
      name: plugin.name,
      version: plugin.version,
      timestamp: Date.now()
    });

    return kernel;
  };

  const remove = (name: string): boolean => {
    const plugin = plugins.get(name);
    if (!plugin) return false;

    // Call uninstall hook
    if (plugin.uninstall) {
      try {
        const result = plugin.uninstall(kernel);
        if (result instanceof Promise) {
          result.catch((err) => {
            if (context.debug) {
              console.error(`Error uninstalling plugin "${name}":`, err);
            }
          });
        }
      } catch (err) {
        if (context.debug) {
          console.error(`Error uninstalling plugin "${name}":`, err);
        }
      }
    }

    // Remove plugin validators
    if (plugin.validators) {
      for (const validatorName of Object.keys(plugin.validators)) {
        validators.delete(validatorName);
      }
    }

    // Remove plugin transforms
    if (plugin.transforms) {
      for (const transformName of Object.keys(plugin.transforms)) {
        transforms.delete(transformName);
      }
    }

    // Remove plugin codecs
    if (plugin.codecs) {
      for (const codecName of Object.keys(plugin.codecs)) {
        codecs.delete(codecName);
      }
    }

    return plugins.delete(name);
  };

  const getPlugin = (name: string): VldPlugin | undefined => plugins.get(name);

  const getPlugins = (): VldPlugin[] => Array.from(plugins.values());

  const hasPlugin = (name: string): boolean => plugins.has(name);

  // ============================================
  // Validator Registry
  // ============================================

  const registerValidator = (name: string, factory: ValidatorFactory): VldKernelInstance => {
    validators.set(name, factory);

    emitter.emit('vld:validator:registered', {
      name,
      timestamp: Date.now()
    });

    return kernel;
  };

  const getValidator = (name: string): VldBase<unknown, unknown> | undefined => {
    const factory = validators.get(name);
    return factory ? factory() : undefined;
  };

  const getValidators = (): Record<string, ValidatorFactory> =>
    Object.fromEntries(validators);

  // ============================================
  // Transform Registry
  // ============================================

  const registerTransform = (name: string, factory: TransformFactory): VldKernelInstance => {
    transforms.set(name, factory);
    return kernel;
  };

  const getTransform = (name: string): TransformFactory | undefined => transforms.get(name);

  // ============================================
  // Codec Registry
  // ============================================

  const registerCodec = (name: string, codec: CodecFactory): VldKernelInstance => {
    codecs.set(name, codec);

    emitter.emit('vld:codec:registered', {
      name,
      timestamp: Date.now()
    });

    return kernel;
  };

  const getCodec = (name: string): CodecFactory | undefined => codecs.get(name);

  // ============================================
  // Hook Execution
  // ============================================

  const executeBeforeParse = (
    value: unknown,
    schema: VldBase<unknown, unknown>,
    hookContext: HookContext
  ): unknown => {
    let currentValue = value;

    for (const plugin of plugins.values()) {
      if (plugin.onBeforeParse) {
        try {
          currentValue = plugin.onBeforeParse(currentValue, schema, hookContext);
        } catch (err) {
          if (errorStrategy === 'throw') throw err;
          if (context.debug) {
            console.error(`Error in onBeforeParse hook of "${plugin.name}":`, err);
          }
        }
      }
    }

    return currentValue;
  };

  const executeAfterParse = <T>(
    result: ParseResult<T>,
    schema: VldBase<unknown, unknown>,
    hookContext: HookContext
  ): ParseResult<T> => {
    let currentResult = result;

    for (const plugin of plugins.values()) {
      if (plugin.onAfterParse) {
        try {
          currentResult = plugin.onAfterParse(currentResult, schema, hookContext);
        } catch (err) {
          if (errorStrategy === 'throw') throw err;
          if (context.debug) {
            console.error(`Error in onAfterParse hook of "${plugin.name}":`, err);
          }
        }
      }
    }

    return currentResult;
  };

  const executeOnError = (
    error: VldError,
    schema: VldBase<unknown, unknown>,
    hookContext: HookContext
  ): void => {
    for (const plugin of plugins.values()) {
      if (plugin.onError) {
        try {
          plugin.onError(error, schema, hookContext);
        } catch (err) {
          if (context.debug) {
            console.error(`Error in onError hook of "${plugin.name}":`, err);
          }
        }
      }
    }
  };

  const executeOnSuccess = <T>(
    data: T,
    schema: VldBase<unknown, unknown>,
    hookContext: HookContext
  ): void => {
    for (const plugin of plugins.values()) {
      if (plugin.onSuccess) {
        try {
          plugin.onSuccess(data, schema, hookContext);
        } catch (err) {
          if (context.debug) {
            console.error(`Error in onSuccess hook of "${plugin.name}":`, err);
          }
        }
      }
    }
  };

  // ============================================
  // Lifecycle
  // ============================================

  const dispose = async (): Promise<void> => {
    // Uninstall all plugins in reverse order
    const pluginList = Array.from(plugins.values()).reverse();

    for (const plugin of pluginList) {
      if (plugin.uninstall) {
        try {
          await plugin.uninstall(kernel);
        } catch (err) {
          if (context.debug) {
            console.error(`Error uninstalling plugin "${plugin.name}":`, err);
          }
        }
      }
    }

    // Clear all registries
    plugins.clear();
    validators.clear();
    transforms.clear();
    codecs.clear();
    emitter.removeAllListeners();
  };

  // ============================================
  // Kernel Instance
  // ============================================

  const kernel: VldKernelInstance = {
    // Context
    getContext,
    setContext,

    // Plugins
    use,
    remove,
    getPlugin,
    getPlugins,
    hasPlugin,

    // Validators
    registerValidator,
    getValidator,
    getValidators,

    // Transforms
    registerTransform,
    getTransform,

    // Codecs
    registerCodec,
    getCodec,

    // Hooks
    executeBeforeParse,
    executeAfterParse,
    executeOnError,
    executeOnSuccess,

    // Lifecycle
    dispose
  };

  // ============================================
  // Load Initial Plugins
  // ============================================

  if (options.plugins) {
    for (const plugin of options.plugins) {
      use(plugin);
    }
  }

  return kernel;
}

// ============================================
// Plugin Builder
// ============================================

/**
 * Create a plugin using the builder pattern
 */
export function definePlugin(): PluginBuilder {
  let _name = '';
  let _version = '1.0.0';
  let _description = '';
  const _validators: Record<string, ValidatorFactory> = {};
  const _transforms: Record<string, TransformFactory> = {};
  const _codecs: Record<string, CodecFactory> = {};
  const _hooks: Partial<VldPlugin> = {};
  let _install: VldPlugin['install'];

  const builder: PluginBuilder = {
    name(name) {
      _name = name;
      return this;
    },

    version(version) {
      _version = version;
      return this;
    },

    description(description) {
      _description = description;
      return this;
    },

    validator(name, factory) {
      _validators[name] = factory;
      return this;
    },

    transform(name, factory) {
      _transforms[name] = factory;
      return this;
    },

    codec(name, codec) {
      _codecs[name] = codec;
      return this;
    },

    hook(name, fn) {
      (_hooks as Record<string, unknown>)[name] = fn;
      return this;
    },

    install(fn) {
      _install = fn;
      return this;
    },

    build(): VldPlugin {
      if (!_name) {
        throw new Error('Plugin name is required');
      }

      return {
        name: _name,
        version: _version,
        description: _description,
        validators: Object.keys(_validators).length > 0 ? _validators : undefined,
        transforms: Object.keys(_transforms).length > 0 ? _transforms : undefined,
        codecs: Object.keys(_codecs).length > 0 ? _codecs : undefined,
        install: _install,
        ..._hooks
      };
    }
  };

  return builder;
}

// ============================================
// Global Kernel Instance
// ============================================

let globalKernel: VldKernelInstance | null = null;

/**
 * Get or create the global VLD kernel
 */
export function getVldKernel(options?: VldKernelOptions): VldKernelInstance {
  if (!globalKernel) {
    globalKernel = createVldKernel(options);
  }
  return globalKernel;
}

/**
 * Reset the global VLD kernel
 */
export async function resetVldKernel(): Promise<void> {
  if (globalKernel) {
    await globalKernel.dispose();
    globalKernel = null;
  }
}

/**
 * Use a plugin with the global kernel
 */
export function usePlugin(plugin: VldPlugin): VldKernelInstance {
  return getVldKernel().use(plugin);
}

// Re-export types
export type {
  VldContext,
  VldPlugin,
  VldKernelInstance,
  VldKernelOptions,
  ValidatorFactory,
  TransformFactory,
  CodecFactory,
  HookContext,
  PluginBuilder,
  PluginMeta,
  PluginHooks
} from './plugins/types';
