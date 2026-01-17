/**
 * Tests for Kernel (Plugin System) implementation
 */

import {
  createVldKernel,
  getVldKernel,
  resetVldKernel,
  usePlugin,
  definePlugin
} from '../src/kernel';
import type { VldPlugin, CodecFactory } from '../src/plugins/types';

describe('VLD Kernel', () => {
  beforeEach(() => {
    resetVldKernel();
  });

  describe('createVldKernel', () => {
    it('should create a kernel instance', () => {
      const kernel = createVldKernel();

      expect(kernel).toBeDefined();
      expect(typeof kernel.use).toBe('function');
      expect(typeof kernel.getContext).toBe('function');
    });

    it('should create kernel with options', () => {
      const kernel = createVldKernel({
        context: { locale: 'en', strict: true, debug: false, custom: {} },
        debug: true
      });

      const ctx = kernel.getContext();
      expect(ctx.locale).toBe('en');
      expect(ctx.strict).toBe(true);
    });

    it('should have default context values', () => {
      const kernel = createVldKernel();
      const ctx = kernel.getContext();

      expect(ctx.locale).toBe('en');
      expect(ctx.strict).toBe(false);
    });
  });

  describe('getVldKernel', () => {
    it('should return global kernel instance', () => {
      const kernel = getVldKernel();
      expect(kernel).toBeDefined();
    });

    it('should return same instance on subsequent calls', () => {
      const kernel1 = getVldKernel();
      const kernel2 = getVldKernel();

      expect(kernel1).toBe(kernel2);
    });
  });

  describe('resetVldKernel', () => {
    it('should reset the global kernel', async () => {
      const kernel1 = getVldKernel();
      await resetVldKernel();
      const kernel2 = getVldKernel();

      expect(kernel1).not.toBe(kernel2);
    });
  });

  describe('usePlugin', () => {
    it('should register a plugin', () => {
      const plugin: VldPlugin = {
        name: 'test-plugin',
        version: '1.0.0'
      };

      const kernel = usePlugin(plugin);
      expect(kernel).toBeDefined();
      expect(kernel.hasPlugin('test-plugin')).toBe(true);
    });

    it('should not throw when registering same plugin twice with isolate strategy', () => {
      const kernel = createVldKernel({ errorStrategy: 'isolate' });
      const plugin: VldPlugin = {
        name: 'unique-plugin',
        version: '1.0.0'
      };

      kernel.use(plugin);
      kernel.use(plugin); // Should not throw with isolate strategy

      expect(kernel.hasPlugin('unique-plugin')).toBe(true);
    });
  });

  describe('definePlugin', () => {
    it('should create a plugin builder', () => {
      const builder = definePlugin();

      expect(builder).toBeDefined();
      expect(typeof builder.name).toBe('function');
      expect(typeof builder.version).toBe('function');
      expect(typeof builder.description).toBe('function');
      expect(typeof builder.validator).toBe('function');
      expect(typeof builder.transform).toBe('function');
      expect(typeof builder.codec).toBe('function');
      expect(typeof builder.build).toBe('function');
    });

    it('should build a plugin with metadata', () => {
      const plugin = definePlugin()
        .name('my-plugin')
        .version('1.0.0')
        .description('A test plugin')
        .build();

      expect(plugin.name).toBe('my-plugin');
      expect(plugin.version).toBe('1.0.0');
      expect(plugin.description).toBe('A test plugin');
    });

    it('should build a plugin with hooks', () => {
      const beforeParseCalls: unknown[] = [];

      const plugin = definePlugin()
        .name('hook-plugin')
        .version('1.0.0')
        .hook('onBeforeParse', (value) => {
          beforeParseCalls.push(value);
          return value;
        })
        .build();

      expect(plugin.onBeforeParse).toBeDefined();
    });

    it('should build a plugin with validators', () => {
      const plugin = definePlugin()
        .name('validator-plugin')
        .version('1.0.0')
        .validator('custom', () => ({
          parse: (v: unknown) => v,
          safeParse: (v: unknown) => ({ success: true as const, data: v })
        }) as any)
        .build();

      expect(plugin.validators).toBeDefined();
      expect(plugin.validators?.custom).toBeDefined();
    });

    it('should build a plugin with transforms', () => {
      const plugin = definePlugin()
        .name('transform-plugin')
        .version('1.0.0')
        .transform('uppercase', () => (value: unknown) => (value as string).toUpperCase())
        .build();

      expect(plugin.transforms).toBeDefined();
      expect(plugin.transforms?.uppercase).toBeDefined();
    });

    it('should build a plugin with codecs', () => {
      const jsonCodec: CodecFactory<unknown, unknown> = {
        encode: (value: unknown) => JSON.stringify(value),
        decode: (value: unknown) => JSON.parse(value as string)
      };

      const plugin = definePlugin()
        .name('codec-plugin')
        .version('1.0.0')
        .codec('json', jsonCodec)
        .build();

      expect(plugin.codecs).toBeDefined();
      expect(plugin.codecs?.json).toBeDefined();
    });

    it('should chain all builder methods', () => {
      const plugin = definePlugin()
        .name('full-plugin')
        .version('2.0.0')
        .description('Full featured plugin')
        .hook('onBeforeParse', (v) => v)
        .hook('onAfterParse', (r) => r)
        .validator('custom', () => ({
          parse: (v: unknown) => v,
          safeParse: (v: unknown) => ({ success: true as const, data: v })
        }) as any)
        .transform('identity', () => (v: unknown) => v)
        .codec('passthrough', {
          encode: (v: unknown) => v,
          decode: (v: unknown) => v
        })
        .build();

      expect(plugin.name).toBe('full-plugin');
      expect(plugin.version).toBe('2.0.0');
      expect(plugin.validators).toBeDefined();
      expect(plugin.transforms).toBeDefined();
      expect(plugin.codecs).toBeDefined();
    });
  });

  describe('Kernel with plugins', () => {
    it('should use plugins', () => {
      const kernel = createVldKernel();

      const plugin: VldPlugin = {
        name: 'test',
        version: '1.0.0'
      };

      kernel.use(plugin);

      expect(kernel.hasPlugin('test')).toBe(true);
      expect(kernel.getPlugin('test')).toBeDefined();
    });

    it('should get all plugins', () => {
      const kernel = createVldKernel();

      kernel.use({ name: 'plugin1', version: '1.0.0' });
      kernel.use({ name: 'plugin2', version: '1.0.0' });

      const plugins = kernel.getPlugins();
      expect(plugins).toHaveLength(2);
    });

    it('should remove a plugin', () => {
      const kernel = createVldKernel();

      kernel.use({ name: 'removable', version: '1.0.0' });
      expect(kernel.hasPlugin('removable')).toBe(true);

      kernel.remove('removable');
      expect(kernel.hasPlugin('removable')).toBe(false);
    });

    it('should allow registering validators through kernel', () => {
      const kernel = createVldKernel();

      kernel.registerValidator('myValidator', () => ({
        parse: (v: unknown) => v,
        safeParse: (v: unknown) => ({ success: true as const, data: v })
      }) as any);

      const validator = kernel.getValidator('myValidator');
      expect(validator).toBeDefined();
    });

    it('should allow registering transforms through kernel', () => {
      const kernel = createVldKernel();

      kernel.registerTransform('myTransform', () => (v: unknown) => (v as string).toUpperCase());

      const transform = kernel.getTransform('myTransform');
      expect(transform).toBeDefined();
    });

    it('should allow registering codecs through kernel', () => {
      const kernel = createVldKernel();

      kernel.registerCodec('myCodec', {
        encode: (v: unknown) => JSON.stringify(v),
        decode: (v: unknown) => JSON.parse(v as string)
      });

      const codec = kernel.getCodec('myCodec');
      expect(codec).toBeDefined();
    });

    it('should return undefined for non-existent items', () => {
      const kernel = createVldKernel();

      expect(kernel.getValidator('nonexistent')).toBeUndefined();
      expect(kernel.getTransform('nonexistent')).toBeUndefined();
      expect(kernel.getCodec('nonexistent')).toBeUndefined();
      expect(kernel.getPlugin('nonexistent')).toBeUndefined();
    });
  });

  describe('Kernel context', () => {
    it('should get and set context', () => {
      const kernel = createVldKernel();

      kernel.setContext({ locale: 'fr' });
      expect(kernel.getContext().locale).toBe('fr');
    });

    it('should preserve other context values when updating', () => {
      const kernel = createVldKernel({
        context: { locale: 'en', strict: true, debug: false, custom: {} }
      });

      kernel.setContext({ locale: 'de' });

      const ctx = kernel.getContext();
      expect(ctx.locale).toBe('de');
      expect(ctx.strict).toBe(true);
    });
  });

  describe('Plugin install/uninstall hooks', () => {
    it('should call install hook when plugin is registered', () => {
      const kernel = createVldKernel();
      let installed = false;

      const plugin: VldPlugin = {
        name: 'installable',
        version: '1.0.0',
        install: () => {
          installed = true;
        }
      };

      kernel.use(plugin);

      expect(installed).toBe(true);
    });

    it('should call uninstall hook when plugin is removed', () => {
      const kernel = createVldKernel();
      let uninstalled = false;

      const plugin: VldPlugin = {
        name: 'uninstallable',
        version: '1.0.0',
        uninstall: () => {
          uninstalled = true;
        }
      };

      kernel.use(plugin);
      kernel.remove('uninstallable');

      expect(uninstalled).toBe(true);
    });
  });

  describe('Kernel dispose', () => {
    it('should dispose and cleanup', async () => {
      const kernel = createVldKernel();

      kernel.use({ name: 'plugin1', version: '1.0.0' });
      kernel.use({ name: 'plugin2', version: '1.0.0' });

      await kernel.dispose();

      // After dispose, plugins should be cleared
      expect(kernel.getPlugins()).toHaveLength(0);
    });

    it('should call uninstall on dispose for plugins with uninstall hook', async () => {
      const kernel = createVldKernel();
      let uninstallCalled = false;

      kernel.use({
        name: 'uninstallable',
        version: '1.0.0',
        uninstall: () => {
          uninstallCalled = true;
        }
      });

      await kernel.dispose();
      expect(uninstallCalled).toBe(true);
    });

    it('should handle uninstall errors in debug mode', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const kernel = createVldKernel({ debug: true });

      kernel.use({
        name: 'error-plugin',
        version: '1.0.0',
        uninstall: () => {
          throw new Error('Uninstall failed');
        }
      });

      await kernel.dispose();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Hook execution', () => {
    const createMockHookContext = () => ({ path: [], abort: () => {} });

    it('should execute onBeforeParse hooks', () => {
      const kernel = createVldKernel();
      const calls: unknown[] = [];

      kernel.use({
        name: 'before-parse-plugin',
        version: '1.0.0',
        onBeforeParse: (value) => {
          calls.push(value);
          return value;
        }
      });

      const mockSchema = { parse: (v: unknown) => v } as any;
      const result = kernel.executeBeforeParse('test-value', mockSchema, createMockHookContext());

      expect(calls).toEqual(['test-value']);
      expect(result).toBe('test-value');
    });

    it('should execute onAfterParse hooks', () => {
      const kernel = createVldKernel();
      const calls: unknown[] = [];

      kernel.use({
        name: 'after-parse-plugin',
        version: '1.0.0',
        onAfterParse: (result) => {
          calls.push(result);
          return result;
        }
      });

      const mockSchema = { parse: (v: unknown) => v } as any;
      const parseResult = { success: true as const, data: 'test' };
      const result = kernel.executeAfterParse(parseResult, mockSchema, createMockHookContext());

      expect(calls).toHaveLength(1);
      expect(result).toBe(parseResult);
    });

    it('should execute onError hooks', () => {
      const kernel = createVldKernel();
      const errors: unknown[] = [];

      kernel.use({
        name: 'error-handler-plugin',
        version: '1.0.0',
        onError: (error) => {
          errors.push(error);
        }
      });

      const mockSchema = { parse: (v: unknown) => v } as any;
      const mockError = { message: 'Test error', issues: [] } as any;
      kernel.executeOnError(mockError, mockSchema, createMockHookContext());

      expect(errors).toHaveLength(1);
    });

    it('should execute onSuccess hooks', () => {
      const kernel = createVldKernel();
      const successes: unknown[] = [];

      kernel.use({
        name: 'success-handler-plugin',
        version: '1.0.0',
        onSuccess: (data) => {
          successes.push(data);
        }
      });

      const mockSchema = { parse: (v: unknown) => v } as any;
      kernel.executeOnSuccess('success-data', mockSchema, createMockHookContext());

      expect(successes).toEqual(['success-data']);
    });

    it('should handle hook errors with throw strategy', () => {
      const kernel = createVldKernel({ errorStrategy: 'throw' });

      kernel.use({
        name: 'throwing-plugin',
        version: '1.0.0',
        onBeforeParse: () => {
          throw new Error('Hook error');
        }
      });

      const mockSchema = { parse: (v: unknown) => v } as any;
      expect(() => kernel.executeBeforeParse('test', mockSchema, createMockHookContext())).toThrow('Hook error');
    });

    it('should handle hook errors with isolate strategy in debug mode', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const kernel = createVldKernel({ errorStrategy: 'isolate', debug: true });

      kernel.use({
        name: 'error-plugin',
        version: '1.0.0',
        onBeforeParse: () => {
          throw new Error('Hook error');
        }
      });

      const mockSchema = { parse: (v: unknown) => v } as any;
      kernel.executeBeforeParse('test', mockSchema, createMockHookContext());

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle onAfterParse errors with throw strategy', () => {
      const kernel = createVldKernel({ errorStrategy: 'throw' });

      kernel.use({
        name: 'throwing-plugin',
        version: '1.0.0',
        onAfterParse: () => {
          throw new Error('After parse error');
        }
      });

      const mockSchema = { parse: (v: unknown) => v } as any;
      expect(() => kernel.executeAfterParse({ success: true, data: 'test' }, mockSchema, createMockHookContext())).toThrow('After parse error');
    });

    it('should handle onError hook errors in debug mode', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const kernel = createVldKernel({ debug: true });

      kernel.use({
        name: 'error-in-error-plugin',
        version: '1.0.0',
        onError: () => {
          throw new Error('Error in error handler');
        }
      });

      const mockSchema = { parse: (v: unknown) => v } as any;
      kernel.executeOnError({ message: 'test', issues: [] } as any, mockSchema, createMockHookContext());

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle onSuccess hook errors in debug mode', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const kernel = createVldKernel({ debug: true });

      kernel.use({
        name: 'error-in-success-plugin',
        version: '1.0.0',
        onSuccess: () => {
          throw new Error('Error in success handler');
        }
      });

      const mockSchema = { parse: (v: unknown) => v } as any;
      kernel.executeOnSuccess('data', mockSchema, createMockHookContext());

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Plugin registration edge cases', () => {
    it('should throw when registering duplicate plugin with throw strategy', () => {
      const kernel = createVldKernel({ errorStrategy: 'throw' });
      const plugin: VldPlugin = { name: 'duplicate', version: '1.0.0' };

      kernel.use(plugin);
      expect(() => kernel.use(plugin)).toThrow('Plugin "duplicate" is already registered');
    });

    it('should register plugin validators, transforms, and codecs', () => {
      const kernel = createVldKernel();

      const plugin: VldPlugin = {
        name: 'full-plugin',
        version: '1.0.0',
        validators: {
          myValidator: () => ({ parse: (v: unknown) => v } as any)
        },
        transforms: {
          myTransform: () => (v: unknown) => v
        },
        codecs: {
          myCodec: { encode: (v: unknown) => v, decode: (v: unknown) => v }
        }
      };

      kernel.use(plugin);

      expect(kernel.getValidator('myValidator')).toBeDefined();
      expect(kernel.getTransform('myTransform')).toBeDefined();
      expect(kernel.getCodec('myCodec')).toBeDefined();
    });

    it('should remove plugin validators, transforms, and codecs on remove', () => {
      const kernel = createVldKernel();

      const plugin: VldPlugin = {
        name: 'removable-full',
        version: '1.0.0',
        validators: { testValidator: () => ({ parse: (v: unknown) => v } as any) },
        transforms: { testTransform: () => (v: unknown) => v },
        codecs: { testCodec: { encode: (v: unknown) => v, decode: (v: unknown) => v } }
      };

      kernel.use(plugin);
      expect(kernel.getValidator('testValidator')).toBeDefined();

      kernel.remove('removable-full');
      expect(kernel.getValidator('testValidator')).toBeUndefined();
      expect(kernel.getTransform('testTransform')).toBeUndefined();
      expect(kernel.getCodec('testCodec')).toBeUndefined();
    });

    it('should return false when removing non-existent plugin', () => {
      const kernel = createVldKernel();
      expect(kernel.remove('non-existent')).toBe(false);
    });

    it('should handle async install hooks', async () => {
      const kernel = createVldKernel();
      let installed = false;

      const plugin: VldPlugin = {
        name: 'async-install',
        version: '1.0.0',
        install: async () => {
          await new Promise(r => setTimeout(r, 10));
          installed = true;
        }
      };

      kernel.use(plugin);
      await new Promise(r => setTimeout(r, 20));
      expect(installed).toBe(true);
    });

    it('should handle async install errors in debug mode', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const kernel = createVldKernel({ debug: true });

      const plugin: VldPlugin = {
        name: 'async-error-install',
        version: '1.0.0',
        install: async () => {
          throw new Error('Async install error');
        }
      };

      kernel.use(plugin);
      await new Promise(r => setTimeout(r, 10));
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle sync install errors with throw strategy', () => {
      const kernel = createVldKernel({ errorStrategy: 'throw' });

      const plugin: VldPlugin = {
        name: 'sync-error-install',
        version: '1.0.0',
        install: () => {
          throw new Error('Sync install error');
        }
      };

      expect(() => kernel.use(plugin)).toThrow('Sync install error');
    });

    it('should handle sync install errors with isolate strategy in debug mode', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const kernel = createVldKernel({ errorStrategy: 'isolate', debug: true });

      const plugin: VldPlugin = {
        name: 'sync-error-install-isolate',
        version: '1.0.0',
        install: () => {
          throw new Error('Sync install error');
        }
      };

      kernel.use(plugin);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle async uninstall hooks on remove', async () => {
      const kernel = createVldKernel();
      let uninstalled = false;

      const plugin: VldPlugin = {
        name: 'async-uninstall',
        version: '1.0.0',
        uninstall: async () => {
          await new Promise(r => setTimeout(r, 10));
          uninstalled = true;
        }
      };

      kernel.use(plugin);
      kernel.remove('async-uninstall');
      await new Promise(r => setTimeout(r, 20));
      expect(uninstalled).toBe(true);
    });

    it('should handle async uninstall errors in debug mode', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const kernel = createVldKernel({ debug: true });

      const plugin: VldPlugin = {
        name: 'async-error-uninstall',
        version: '1.0.0',
        uninstall: async () => {
          throw new Error('Async uninstall error');
        }
      };

      kernel.use(plugin);
      kernel.remove('async-error-uninstall');
      await new Promise(r => setTimeout(r, 10));
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle sync uninstall errors in debug mode', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const kernel = createVldKernel({ debug: true });

      const plugin: VldPlugin = {
        name: 'sync-error-uninstall',
        version: '1.0.0',
        uninstall: () => {
          throw new Error('Sync uninstall error');
        }
      };

      kernel.use(plugin);
      kernel.remove('sync-error-uninstall');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Kernel options', () => {
    it('should load initial plugins from options', () => {
      const kernel = createVldKernel({
        plugins: [
          { name: 'initial-plugin-1', version: '1.0.0' },
          { name: 'initial-plugin-2', version: '1.0.0' }
        ]
      });

      expect(kernel.hasPlugin('initial-plugin-1')).toBe(true);
      expect(kernel.hasPlugin('initial-plugin-2')).toBe(true);
    });

    it('should get all validators', () => {
      const kernel = createVldKernel();
      kernel.registerValidator('v1', () => ({ parse: (v: unknown) => v } as any));
      kernel.registerValidator('v2', () => ({ parse: (v: unknown) => v } as any));

      const validators = kernel.getValidators();
      expect(Object.keys(validators)).toContain('v1');
      expect(Object.keys(validators)).toContain('v2');
    });
  });

  describe('definePlugin edge cases', () => {
    it('should throw error when building plugin without name', () => {
      expect(() => definePlugin().build()).toThrow('Plugin name is required');
    });

    it('should support install hook in builder', () => {
      let installCalled = false;

      const plugin = definePlugin()
        .name('install-hook-plugin')
        .version('1.0.0')
        .install(() => {
          installCalled = true;
        })
        .build();

      const kernel = createVldKernel();
      kernel.use(plugin);

      expect(installCalled).toBe(true);
    });
  });
});
