const { rollup } = require('rollup');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const tempRootDir = path.join(rootDir, '.tmp');
const tempDir = path.join(tempRootDir, 'verify-bundle');
const errors = [];

const maxMiniStringBytes = Number(process.env.VLD_MAX_MINI_STRING_BUNDLE_BYTES || 70_000);
// Full Zod-compatible instance methods necessarily retain composition and
// JSON-Schema code. Keep a tight absolute ceiling and also require the probe
// to remain smaller than the installed latest Zod below.
const maxRootStringBytes = Number(process.env.VLD_MAX_ROOT_STRING_BUNDLE_BYTES || 115_000);

const forbiddenLocalePatterns = [
  /translatedLocaleCodes/,
  /fallbackLocaleCodes/,
  /Unsupported locale/,
  /locales\//
];

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

async function bundleProbe(name, importPath, maxBytes, checkForbiddenLocales = true) {
  const entryPath = path.join(tempDir, `${name}.mjs`);
  fs.writeFileSync(
    entryPath,
    `import { string } from '${importPath}';\n` +
      `export const schema = string().min(2);\n`
  );

  const bundle = await rollup({
    input: entryPath,
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
    },
    onwarn(warning, defaultHandler) {
      if (warning.code === 'EMPTY_BUNDLE') {
        errors.push(`${name} produced an empty bundle`);
        return;
      }
      if (warning.code === 'CIRCULAR_DEPENDENCY') {
        return;
      }
      defaultHandler(warning);
    },
  });

  try {
    const result = await bundle.generate({ format: 'esm' });
    const code = result.output
      .filter((chunk) => chunk.type === 'chunk')
      .map((chunk) => chunk.code)
      .join('\n');
    const bytes = Buffer.byteLength(code);

    if (bytes === 0) {
      errors.push(`${name} produced no JavaScript output`);
    }
    if (bytes > maxBytes) {
      errors.push(`${name} bundle is too large: ${formatBytes(bytes)} > ${formatBytes(maxBytes)}`);
    }
    if (checkForbiddenLocales) {
      for (const pattern of forbiddenLocalePatterns) {
        if (pattern.test(code)) {
          errors.push(`${name} bundle unexpectedly includes eager locale code matching ${pattern}`);
        }
      }
    }

    return { name, bytes };
  } finally {
    await bundle.close();
  }
}

(async () => {
  fs.rmSync(tempDir, { recursive: true, force: true });
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    const miniProbe = await bundleProbe('mini-string', '../../dist/mini.js', maxMiniStringBytes);
    const rootProbe = await bundleProbe('root-string', '../../dist/index.js', maxRootStringBytes);
    const zodProbe = await bundleProbe(
      'zod-root-string',
      path.join(rootDir, 'node_modules/zod/index.js'),
      Number.MAX_SAFE_INTEGER,
      false
    );
    const probes = [miniProbe, rootProbe, zodProbe];

    if (rootProbe.bytes >= zodProbe.bytes) {
      errors.push(
        `root-string bundle must stay smaller than Zod: ${formatBytes(rootProbe.bytes)} >= ${formatBytes(zodProbe.bytes)}`
      );
    }

    if (errors.length > 0) {
      console.error('Bundle verification failed:');
      for (const error of errors) {
        console.error(`- ${error}`);
      }
      process.exit(1);
    }

    console.log(
      `Bundle verification passed: ${probes.map((probe) => `${probe.name} ${formatBytes(probe.bytes)}`).join(', ')}`
    );
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
    if (fs.existsSync(tempRootDir) && fs.readdirSync(tempRootDir).length === 0) {
      fs.rmSync(tempRootDir, { recursive: true, force: true });
    }
  }
})().catch((error) => {
  fs.rmSync(tempDir, { recursive: true, force: true });
  console.error('Bundle verification failed:');
  console.error(`- ${error && error.stack ? error.stack : error}`);
  process.exit(1);
});
