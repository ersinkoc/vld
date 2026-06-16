/**
 * VLD Rollup Configuration
 *
 * Generates:
 * - ESM build with preserved modules (tree-shakable)
 * - CJS build for Node.js compatibility
 * - Individual locale entry points
 */

import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import fg from 'fast-glob';
import path from 'path';
import { builtinModules } from 'module';

const { globSync } = fg;

const isProduction = process.env.NODE_ENV === 'production';
const nodeBuiltins = [...builtinModules, ...builtinModules.map((mod) => `node:${mod}`)];

// ============================================
// Shared Plugins
// ============================================

const createTypescriptPlugin = (options = {}) =>
  typescript({
    tsconfig: './tsconfig.json',
    ...options,
    declaration: false,
    declarationMap: false,
    sourceMap: false,
    inlineSources: false,
    compilerOptions: {
      sourceMap: false,
      inlineSources: false,
      ...(options.compilerOptions || {}),
    },
  });

const productionPlugins = isProduction ? [terser()] : [];

// ============================================
// Entry Points
// ============================================

// Main entry points
const mainEntries = {
  index: 'src/index.ts',
  mini: 'src/mini.ts',
  errors: 'src/errors.ts',
  kernel: 'src/kernel.ts',
  registry: 'src/registry.ts',
  pigment: 'src/pigment.ts',
};

const zodCompatEntries = {
  'v3/index': 'src/v3/index.ts',
  'v4/index': 'src/v4/index.ts',
  'v4-mini/index': 'src/v4-mini/index.ts',
  'v4/mini/index': 'src/v4/mini/index.ts',
  'v4/core/index': 'src/v4/core/index.ts',
  'v4/locales/index': 'src/v4/locales/index.ts',
};

// Locale entry points (for individual imports)
const localeFiles = globSync('src/locales/*.ts', {
  ignore: ['src/locales/index.ts', 'src/locales/lazy.ts', 'src/locales/types.ts', 'src/locales/backup-*.ts'],
});

const localeEntries = Object.fromEntries(
  localeFiles.map((file) => {
    const name = path.basename(file, '.ts');
    return [`locales/${name}`, file];
  })
);

// Add the full locale registry and the lazy loader as separate public subpaths
localeEntries['locales/index'] = 'src/locales/index.ts';
localeEntries['locales/lazy'] = 'src/locales/lazy.ts';

// Validators entries
const validatorFiles = globSync('src/validators/*.ts', {
  ignore: ['src/validators/index.ts'],
});

const validatorEntries = Object.fromEntries(
  validatorFiles.map((file) => {
    const name = path.basename(file, '.ts');
    return [`validators/${name}`, file];
  })
);

validatorEntries['validators/index'] = 'src/validators/index.ts';

// Coercion entry
const coercionEntries = {
  'coercion/index': 'src/coercion/index.ts',
};

// Codecs entry
const codecEntries = {
  'codecs/index': 'src/codecs/index.ts',
};

// CLI entries
const cliEntries = {
  'cli/index': 'src/cli/index.ts',
  'cli/bin': 'src/cli/bin.ts',
};

// Plugin entries
const pluginEntries = {
  'plugins/index': 'src/plugins/index.ts',
};

// Compat entries
const compatEntries = {
  'compat/result': 'src/compat/result.ts',
  'compat/emitter': 'src/compat/emitter.ts',
};

// All entries combined
const allEntries = {
  ...mainEntries,
  ...zodCompatEntries,
  ...localeEntries,
  ...validatorEntries,
  ...coercionEntries,
  ...codecEntries,
  ...cliEntries,
  ...pluginEntries,
  ...compatEntries,
};

// ============================================
// Build Configurations
// ============================================

export default [
  // ==========================================
  // ESM Build - Preserved Modules (Tree-Shakable)
  // ==========================================
  {
    input: allEntries,
    output: {
      dir: 'dist',
      format: 'esm',
      entryFileNames: '[name].js',
      chunkFileNames: 'chunks/[name]-[hash].js',
      sourcemap: false,
      preserveModules: false,
      hoistTransitiveImports: false,
    },
    plugins: [createTypescriptPlugin(), ...productionPlugins],
    external: nodeBuiltins,
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
    },
  },

  // ==========================================
  // CJS Build - Public Subpaths
  // ==========================================
  {
    input: allEntries,
    output: {
      dir: 'dist/cjs',
      format: 'cjs',
      entryFileNames: '[name].cjs',
      chunkFileNames: 'chunks/[name]-[hash].cjs',
      exports: 'named',
      sourcemap: false,
      interop: 'auto',
    },
    plugins: [createTypescriptPlugin({ compilerOptions: { outDir: 'dist/cjs' } }), ...productionPlugins],
    external: nodeBuiltins,
  },
];
