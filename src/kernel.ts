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

  // What each plugin's registrations replaced, so remove() (and a failed
  // install) can restore the previous owner instead of deleting its entry.
  interface Registration {
    readonly registry: Map<string, unknown>;
    readonly name: string;
    readonly value: unknown;
    had: boolean;
    previous: unknown;
  }
  const registrations = new Map<string, Registration[]>();

  const registerFor = (pluginName: string, registry: Map<string, unknown>, name: string, value: unknown): void => {
    const records = registrations.get(pluginName) ?? [];
    records.push({ registry, name, value, had: registry.has(name), previous: registry.get(name) });
    registrations.set(pluginName, records);
    registry.set(name, value);
  };

  const unregisterFor = (pluginName: string): void => {
    const records = registrations.get(pluginName) ?? [];
    registrations.delete(pluginName);
    for (const record of records.reverse()) {
      if (record.registry.get(record.name) === record.value) {
        // Still ours: restore whatever we shadowed.
        if (record.had) record.registry.set(record.name, record.previous);
        else record.registry.delete(record.name);
        continue;
      }
      // A later registration shadows ours; when it is removed it must fall
      // back to what we shadowed, not to our removed entry.
      for (const others of registrations.values()) {
        for (const other of others) {
          if (other.registry === record.registry && other.name === record.name && other.had && other.previous === record.value) {
            other.had = record.had;
            other.previous = record.previous;
          }
        }
      }
    }
  };

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
        registerFor(plugin.name, validators as Map<string, unknown>, name, factory);
      }
    }

    // Register plugin transforms
    if (plugin.transforms) {
      for (const [name, factory] of Object.entries(plugin.transforms)) {
        registerFor(plugin.name, transforms as Map<string, unknown>, name, factory);
      }
    }

    // Register plugin codecs
    if (plugin.codecs) {
      for (const [name, codec] of Object.entries(plugin.codecs)) {
        registerFor(plugin.name, codecs as Map<string, unknown>, name, codec);
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
          // Roll back the half-installed plugin so its hooks stop running
          // and a retry can register it again.
          unregisterFor(plugin.name);
          plugins.delete(plugin.name);
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

    // Remove the plugin's validators, transforms and codecs, restoring any
    // registration they shadowed (another plugin's or the user's).
    unregisterFor(name);

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
    registrations.clear();
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

      const plugin: VldPlugin = {
        name: _name,
        version: _version,
        description: _description,
        ..._hooks
      };

      // Copy the builder's registries so reusing the builder cannot mutate
      // plugins that were already built.
      if (Object.keys(_validators).length > 0) plugin.validators = { ..._validators };
      if (Object.keys(_transforms).length > 0) plugin.transforms = { ..._transforms };
      if (Object.keys(_codecs).length > 0) plugin.codecs = { ..._codecs };
      if (_install !== undefined) plugin.install = _install;

      return plugin;
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
