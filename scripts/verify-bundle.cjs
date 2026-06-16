const { rollup } = require('rollup');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const tempRootDir = path.join(rootDir, '.tmp');
const tempDir = path.join(tempRootDir, 'verify-bundle');
const errors = [];

const maxMiniStringBytes = Number(process.env.VLD_MAX_MINI_STRING_BUNDLE_BYTES || 70_000);
const maxRootStringBytes = Number(process.env.VLD_MAX_ROOT_STRING_BUNDLE_BYTES || 70_000);

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

async function bundleProbe(name, importPath, maxBytes) {
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
    for (const pattern of forbiddenLocalePatterns) {
      if (pattern.test(code)) {
        errors.push(`${name} bundle unexpectedly includes eager locale code matching ${pattern}`);
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
    const probes = [
      await bundleProbe('mini-string', '../../dist/mini.js', maxMiniStringBytes),
      await bundleProbe('root-string', '../../dist/index.js', maxRootStringBytes),
    ];

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
