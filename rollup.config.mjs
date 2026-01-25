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

const { globSync } = fg;

const isProduction = process.env.NODE_ENV === 'production';

// ============================================
// Shared Plugins
// ============================================

const createTypescriptPlugin = (options = {}) =>
  typescript({
    tsconfig: './tsconfig.json',
    declaration: false,
    declarationMap: false,
    sourceMap: !isProduction,
    ...options,
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
  pigment: 'src/pigment.ts',
};

// Locale entry points (for individual imports)
const localeFiles = globSync('src/locales/*.ts', {
  ignore: ['src/locales/index.ts', 'src/locales/types.ts', 'src/locales/backup-*.ts'],
});

const localeEntries = Object.fromEntries(
  localeFiles.map((file) => {
    const name = path.basename(file, '.ts');
    return [`locales/${name}`, file];
  })
);

// Add lazy loader as main locale entry
localeEntries['locales/index'] = 'src/locales/lazy.ts';

// Validators entry
const validatorEntries = {
  'validators/index': 'src/validators/index.ts',
};

// Coercion entry
const coercionEntries = {
  'coercion/index': 'src/coercion/index.ts',
};

// Codecs entry
const codecEntries = {
  'codecs/index': 'src/codecs/index.ts',
};

// Compat entries
const compatEntries = {
  'compat/result': 'src/compat/result.ts',
  'compat/emitter': 'src/compat/emitter.ts',
};

// All entries combined
const allEntries = {
  ...mainEntries,
  ...localeEntries,
  ...validatorEntries,
  ...coercionEntries,
  ...codecEntries,
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
      sourcemap: !isProduction,
      preserveModules: false,
      hoistTransitiveImports: false,
    },
    plugins: [createTypescriptPlugin(), ...productionPlugins],
    external: [],
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
    },
  },

  // ==========================================
  // CJS Build - Main Bundle
  // ==========================================
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/cjs/index.cjs',
      format: 'cjs',
      exports: 'named',
      sourcemap: !isProduction,
      interop: 'auto',
    },
    plugins: [createTypescriptPlugin(), ...productionPlugins],
    external: [],
  },

  // ==========================================
  // CJS Build - Mini Bundle
  // ==========================================
  {
    input: 'src/mini.ts',
    output: {
      file: 'dist/cjs/mini.cjs',
      format: 'cjs',
      exports: 'named',
      sourcemap: !isProduction,
      interop: 'auto',
    },
    plugins: [createTypescriptPlugin(), ...productionPlugins],
    external: [],
  },

  // ==========================================
  // CJS Build - Errors
  // ==========================================
  {
    input: 'src/errors.ts',
    output: {
      file: 'dist/cjs/errors.cjs',
      format: 'cjs',
      exports: 'named',
      sourcemap: !isProduction,
      interop: 'auto',
    },
    plugins: [createTypescriptPlugin(), ...productionPlugins],
    external: [],
  },

  // ==========================================
  // CJS Build - Locales (Full)
  // ==========================================
  {
    input: 'src/locales/index.ts',
    output: {
      file: 'dist/cjs/locales/index.cjs',
      format: 'cjs',
      exports: 'named',
      sourcemap: !isProduction,
      interop: 'auto',
    },
    plugins: [createTypescriptPlugin(), ...productionPlugins],
    external: [],
  },

  // ==========================================
  // CJS Build - Lazy Locales
  // Note: inlineDynamicImports is required because lazy.ts uses dynamic imports
  // This means all locales will be bundled into the CJS lazy file
  // ==========================================
  {
    input: 'src/locales/lazy.ts',
    output: {
      file: 'dist/cjs/locales/lazy.cjs',
      format: 'cjs',
      exports: 'named',
      sourcemap: !isProduction,
      interop: 'auto',
      inlineDynamicImports: true,
    },
    plugins: [createTypescriptPlugin(), ...productionPlugins],
    external: [],
  },
];
