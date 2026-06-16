const { execFileSync, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Windows resolves bare commands (npm) and .cmd/.bat shims (e.g. the installed
// vld.cmd binary) only through a shell: Node refuses to spawn a .cmd without one
// (EINVAL) and cannot find a bare "npm" without one (ENOENT). Route those through
// the shell with space-containing arguments quoted so paths survive; native
// executables given by absolute path (process.execPath) keep using execFileSync.
function execFileCompat(command, args, options) {
  const needsShell =
    process.platform === 'win32' &&
    (/\.(cmd|bat)$/i.test(command) || !path.isAbsolute(command));
  if (needsShell) {
    const commandLine = [command, ...args]
      .map((part) => (/\s/.test(part) ? `"${part}"` : part))
      .join(' ');
    return execSync(commandLine, options);
  }
  return execFileSync(command, args, options);
}

const rootDir = path.resolve(__dirname, '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const tempRootDir = path.join(rootDir, '.tmp');
const tempDir = path.join(tempRootDir, 'verify-install');
const projectDir = path.join(tempDir, 'consumer');
const packDir = path.join(tempDir, 'pack');
const errors = [];

function normalizeTarget(target) {
  return target.startsWith('./') ? target.slice(2) : target;
}

function packageSpecifier(exportName) {
  if (exportName === '.') {
    return packageJson.name;
  }
  return `${packageJson.name}/${exportName.replace(/^\.\//, '')}`;
}

function wildcardToRegExp(pattern) {
  const escaped = normalizeTarget(pattern).replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped.replace('*', '(.+)')}$`);
}

function listFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs.readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const fullPath = path.join(dir, entry.name);
      return entry.isDirectory() ? listFiles(fullPath) : [fullPath];
    });
}

function expandWildcard(target) {
  const normalized = normalizeTarget(target);
  const starIndex = normalized.indexOf('*');
  const baseDir = path.join(rootDir, normalized.slice(0, starIndex));
  const matcher = wildcardToRegExp(target);

  return listFiles(baseDir)
    .map((file) => path.relative(rootDir, file).split(path.sep).join('/'))
    .map((file) => file.match(matcher)?.[1])
    .filter(Boolean)
    .sort();
}

function collectSpecifiers(field) {
  const nullExports = new Set(
    Object.entries(packageJson.exports || {})
      .filter(([, entry]) => entry === null)
      .map(([exportName]) => exportName)
  );
  const specifiers = new Set();

  for (const [exportName, entry] of Object.entries(packageJson.exports || {})) {
    if (entry === null || exportName === './package.json') {
      continue;
    }

    const target = typeof entry === 'string' ? entry : entry[field];
    if (typeof target !== 'string') {
      continue;
    }

    if (target.includes('*')) {
      for (const value of expandWildcard(target)) {
        const materializedExportName = exportName.replace('*', value);
        if (!nullExports.has(materializedExportName)) {
          specifiers.add(packageSpecifier(materializedExportName));
        }
      }
    } else {
      specifiers.add(packageSpecifier(exportName));
    }
  }

  return [...specifiers].sort();
}

function sanitizeIdentifier(specifier) {
  return specifier.replace(/^@/, '').replace(/[^a-zA-Z0-9_$]/g, '_');
}

function createIdentifierMap(specifiers) {
  return new Map(specifiers.map((specifier, index) => [specifier, `${sanitizeIdentifier(specifier)}_${index}`]));
}

function run(label, command, args, options = {}) {
  try {
    return execFileCompat(command, args, {
      cwd: options.cwd || rootDir,
      encoding: options.encoding || 'utf8',
      stdio: options.stdio || ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    const stdout = error.stdout ? error.stdout.toString().trim() : '';
    const stderr = error.stderr ? error.stderr.toString().trim() : '';
    errors.push(`${label} failed${stdout ? `:\n${stdout}` : ''}${stderr ? `\n${stderr}` : ''}`);
    return '';
  }
}

function packTarball() {
  fs.mkdirSync(packDir, { recursive: true });
  const output = run('npm pack', 'npm', ['pack', '--pack-destination', packDir, '--json']);
  if (!output) {
    return null;
  }

  const jsonStart = output.indexOf('[');
  const jsonEnd = output.lastIndexOf(']');
  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd < jsonStart) {
    errors.push(`Unable to find npm pack JSON output:\n${output}`);
    return null;
  }

  const [pack] = JSON.parse(output.slice(jsonStart, jsonEnd + 1));
  return path.join(packDir, pack.filename);
}

function writeConsumerProject(tarballPath) {
  fs.mkdirSync(projectDir, { recursive: true });
  fs.writeFileSync(path.join(projectDir, 'package.json'), JSON.stringify({
    private: true,
    type: 'module',
    dependencies: {
      [packageJson.name]: tarballPath
    }
  }, null, 2));
}

function installTarball() {
  run('npm install packed package', 'npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund'], {
    cwd: projectDir,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function writeRuntimeSmokeFiles(esmSpecifiers, cjsSpecifiers) {
  const esmImports = esmSpecifiers
    .map((specifier) => `await import('${specifier}');`)
    .join('\n');
  fs.writeFileSync(path.join(projectDir, 'esm-smoke.mjs'), `${esmImports}
const { v } = await import('${packageJson.name}');
const value = v.object({ name: v.string() }).parse({ name: 'Ada' });
if (value.name !== 'Ada') throw new Error('Unexpected ESM parse result');
`);

  const cjsRequires = cjsSpecifiers
    .map((specifier) => `require('${specifier}');`)
    .join('\n');
  fs.writeFileSync(path.join(projectDir, 'cjs-smoke.cjs'), `${cjsRequires}
const { v } = require('${packageJson.name}');
const value = v.object({ name: v.string() }).parse({ name: 'Ada' });
if (value.name !== 'Ada') throw new Error('Unexpected CJS parse result');
`);
}

function writeTypeSmokeFile(typeSpecifiers) {
  const identifiers = createIdentifierMap(typeSpecifiers);
  const imports = typeSpecifiers
    .map((specifier) => `import * as ${identifiers.get(specifier)} from '${specifier}';`)
    .join('\n');
  const references = typeSpecifiers
    .map((specifier) => `void ${identifiers.get(specifier)};`)
    .join('\n');

  fs.writeFileSync(path.join(projectDir, 'types-smoke.ts'), `${imports}
import type { Infer, VldBase } from '${packageJson.name}';

const schema = ${identifiers.get(packageJson.name)}.v.object({
  name: ${identifiers.get(packageJson.name)}.v.string(),
  age: ${identifiers.get(packageJson.name)}.v.number().int().optional()
});

type User = Infer<typeof schema>;
const user: User = schema.parse({ name: 'Ada', age: 36 });
const typedSchema: VldBase<unknown, User> = schema;

void user;
void typedSchema;
${references}
`);

  fs.writeFileSync(path.join(projectDir, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      target: 'ES2022',
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      strict: true,
      noEmit: true,
      skipLibCheck: false,
      esModuleInterop: true,
      forceConsistentCasingInFileNames: true,
      types: []
    },
    include: ['types-smoke.ts']
  }, null, 2));
}

function runConsumerChecks() {
  run('ESM installed package smoke test', process.execPath, ['esm-smoke.mjs'], { cwd: projectDir });
  run('CJS installed package smoke test', process.execPath, ['cjs-smoke.cjs'], { cwd: projectDir });
  run('TypeScript installed package smoke test', process.execPath, [
    require.resolve('typescript/bin/tsc'),
    '-p',
    path.join(projectDir, 'tsconfig.json'),
    '--pretty',
    'false'
  ], { cwd: projectDir });

  const binPath = path.join(
    projectDir,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'vld.cmd' : 'vld'
  );
  const versionOutput = run('Installed CLI binary smoke test', binPath, ['--version'], { cwd: projectDir });
  if (versionOutput && !versionOutput.trim().includes(`vld v${packageJson.version}`)) {
    errors.push(`Installed CLI binary reported unexpected version: ${versionOutput.trim()}`);
  }
}

fs.rmSync(tempDir, { recursive: true, force: true });

const tarballPath = packTarball();
if (tarballPath) {
  writeConsumerProject(tarballPath);
  installTarball();

  const esmSpecifiers = collectSpecifiers('import');
  const cjsSpecifiers = collectSpecifiers('require');
  const typeSpecifiers = collectSpecifiers('types');

  if (esmSpecifiers.length === 0) errors.push('No ESM package specifiers were discovered.');
  if (cjsSpecifiers.length === 0) errors.push('No CJS package specifiers were discovered.');
  if (typeSpecifiers.length === 0) errors.push('No type package specifiers were discovered.');

  if (errors.length === 0) {
    writeRuntimeSmokeFiles(esmSpecifiers, cjsSpecifiers);
    writeTypeSmokeFile(typeSpecifiers);
    runConsumerChecks();
  }
}

fs.rmSync(tempDir, { recursive: true, force: true });
if (fs.existsSync(tempRootDir) && fs.readdirSync(tempRootDir).length === 0) {
  fs.rmSync(tempRootDir, { recursive: true, force: true });
}

if (errors.length > 0) {
  console.error('Installed package verification failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('Installed package verification passed');
