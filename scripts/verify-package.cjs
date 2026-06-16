const { execFileSync, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Windows resolves bare commands (npm) and .cmd/.bat shims only through a shell:
// Node refuses to spawn a .cmd without one (EINVAL) and cannot find a bare "npm"
// without one (ENOENT). Route those through the shell with space-containing
// arguments quoted so paths survive; native executables given by absolute path
// keep using execFileSync directly.
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
const packageLockPath = path.join(rootDir, 'package-lock.json');
const packageLock = fs.existsSync(packageLockPath)
  ? JSON.parse(fs.readFileSync(packageLockPath, 'utf8'))
  : undefined;

const errors = [];
const MAX_TARBALL_BYTES = Number(process.env.VLD_MAX_TARBALL_BYTES || 320_000);
const MAX_UNPACKED_BYTES = Number(process.env.VLD_MAX_UNPACKED_BYTES || 1_740_000);
const MAX_PACKED_FILE_COUNT = Number(process.env.VLD_MAX_PACKED_FILE_COUNT || 305);
const FILE_SIZE_BUDGETS = {
  'dist/index.js': Number(process.env.VLD_MAX_ESM_INDEX_BYTES || 75_000),
  'dist/cjs/index.cjs': Number(process.env.VLD_MAX_CJS_INDEX_BYTES || 90_000),
  'dist/mini.js': Number(process.env.VLD_MAX_ESM_MINI_BYTES || 10_000),
  'dist/cjs/mini.cjs': Number(process.env.VLD_MAX_CJS_MINI_BYTES || 14_000),
  'dist/index.d.ts': Number(process.env.VLD_MAX_INDEX_TYPES_BYTES || 90_000),
};
const REQUIRED_FILES = ['dist', 'README.md', 'LICENSE', 'CHANGELOG.md'];
const RUNTIME_DEPENDENCY_FIELDS = [
  'dependencies',
  'peerDependencies',
  'optionalDependencies',
  'bundledDependencies',
  'bundleDependencies',
];
const nullExports = new Set(
  Object.entries(packageJson.exports || {})
    .filter(([, entry]) => entry === null)
    .map(([exportName]) => exportName)
);

function normalizeTarget(target) {
  return target.startsWith('./') ? target.slice(2) : target;
}

function expandWildcardTarget(pattern) {
  const normalized = normalizeTarget(pattern);
  const starIndex = normalized.indexOf('*');
  const baseDir = path.join(rootDir, normalized.slice(0, starIndex));
  const suffix = normalized.slice(starIndex + 1);

  if (!fs.existsSync(baseDir)) {
    return [];
  }

  return fs.readdirSync(baseDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(rootDir, path.join(baseDir, entry.name)).split(path.sep).join('/'))
    .filter((file) => file.endsWith(suffix));
}

function wildcardToRegExp(pattern) {
  const escaped = normalizeTarget(pattern).replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped.replace('*', '(.+)')}$`);
}

function wildcardValueForFile(pattern, file) {
  return file.match(wildcardToRegExp(pattern))?.[1];
}

function collectExportTargets(entry) {
  if (entry === null) {
    return [];
  }
  if (typeof entry === 'string') {
    return [entry];
  }
  return Object.values(entry).filter((value) => typeof value === 'string');
}

function collectExpectedFiles() {
  const expected = new Set([
    normalizeTarget(packageJson.main),
    normalizeTarget(packageJson.module),
    normalizeTarget(packageJson.types),
  ].filter(Boolean));

  for (const binPath of Object.values(packageJson.bin || {})) {
    expected.add(normalizeTarget(binPath));
  }

  for (const [exportName, entry] of Object.entries(packageJson.exports || {})) {
    for (const target of collectExportTargets(entry)) {
      if (target === './package.json') {
        expected.add('package.json');
      } else if (target.includes('*')) {
        for (const file of expandWildcardTarget(target)) {
          const candidate = wildcardValueForFile(target, file);
          if (!candidate) {
            continue;
          }
          const materializedExportName = exportName.replace('*', candidate);
          if (nullExports.has(materializedExportName)) {
            continue;
          }
          expected.add(file);
        }
      } else {
        expected.add(normalizeTarget(target));
      }
    }
  }

  return expected;
}

function readPackFileList() {
  const output = execFileCompat('npm', ['pack', '--dry-run', '--json'], {
    cwd: rootDir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const jsonStart = output.indexOf('[');
  const jsonEnd = output.lastIndexOf(']');
  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd < jsonStart) {
    throw new Error(`Unable to find npm pack JSON output:\n${output}`);
  }
  const [pack] = JSON.parse(output.slice(jsonStart, jsonEnd + 1));
  return {
    pack,
    files: new Map(pack.files.map((file) => [file.path, file])),
  };
}

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

function hasEntries(value) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return value && typeof value === 'object' && Object.keys(value).length > 0;
}

function stableStringify(value) {
  if (!value || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  const sorted = {};
  for (const key of Object.keys(value).sort()) {
    sorted[key] = value[key];
  }
  return JSON.stringify(sorted);
}

function verifyPackageMetadata() {
  if (packageJson.private === true) {
    errors.push('Package must not be private when it is prepared for npm publishing');
  }
  if (packageJson.sideEffects !== false) {
    errors.push('package.json must keep sideEffects set to false for tree-shaking');
  }
  if (!packageJson.license) {
    errors.push('package.json must declare a license');
  }
  if (!packageJson.repository?.url) {
    errors.push('package.json must declare repository.url');
  }
  if (!packageJson.bugs?.url) {
    errors.push('package.json must declare bugs.url');
  }
  if (!packageJson.homepage) {
    errors.push('package.json must declare homepage');
  }
  if (!packageJson.engines?.node) {
    errors.push('package.json must declare engines.node');
  }
  if (packageJson.publishConfig?.access !== 'public') {
    errors.push('publishConfig.access must be public for the scoped npm package');
  }
  if (packageJson.publishConfig?.provenance !== true) {
    errors.push('publishConfig.provenance must stay enabled for npm provenance');
  }
  for (const file of REQUIRED_FILES) {
    if (!packageJson.files?.includes(file)) {
      errors.push(`package.json files must include ${file}`);
    }
  }
  for (const field of RUNTIME_DEPENDENCY_FIELDS) {
    if (hasEntries(packageJson[field])) {
      errors.push(`package.json must not declare runtime dependency field ${field}`);
    }
  }
}

function verifyPackageLockMetadata() {
  if (!packageLock) {
    errors.push('package-lock.json is required for reproducible release checks');
    return;
  }

  if (packageLock.lockfileVersion !== 3) {
    errors.push(`package-lock.json must use lockfileVersion 3, found ${packageLock.lockfileVersion}`);
  }

  const rootPackage = packageLock.packages?.[''];
  if (!rootPackage) {
    errors.push('package-lock.json must include the root package snapshot');
    return;
  }

  const fields = ['name', 'version', 'license'];
  for (const field of fields) {
    if (rootPackage[field] !== packageJson[field]) {
      errors.push(`package-lock.json root ${field} must match package.json`);
    }
  }

  if (rootPackage.engines?.node !== packageJson.engines?.node) {
    errors.push('package-lock.json root engines.node must match package.json');
  }

  if (stableStringify(rootPackage.devDependencies || {}) !== stableStringify(packageJson.devDependencies || {})) {
    errors.push('package-lock.json root devDependencies must match package.json');
  }
}

verifyPackageMetadata();
verifyPackageLockMetadata();

const packResult = readPackFileList();
const packedFiles = packResult.files;
const pack = packResult.pack;
const expectedFiles = collectExpectedFiles();

for (const file of expectedFiles) {
  if (!packedFiles.has(file)) {
    errors.push(`Expected package file is missing from npm pack output: ${file}`);
  }
}

const expectedExecutableFiles = new Set(
  Object.values(packageJson.bin || {}).map((binPath) => normalizeTarget(binPath))
);

for (const [file, metadata] of packedFiles) {
  if (file.endsWith('.map')) {
    errors.push(`Source map files should not be packed: ${file}`);
  }
  if (file.startsWith('src/') || file.startsWith('tests/') || file.startsWith('benchmarks/') || file.startsWith('scripts/')) {
    errors.push(`Non-runtime project file should not be packed: ${file}`);
  }
  if (file === 'package-lock.json') {
    errors.push('package-lock.json should not be packed for this library package');
  }
  if (metadata.size === 0) {
    errors.push(`Packed file must not be empty: ${file}`);
  }
  if (metadata.mode & 0o111 && !expectedExecutableFiles.has(file)) {
    errors.push(`Only package bin files may be executable in the tarball: ${file}`);
  }
}

for (const file of expectedExecutableFiles) {
  const metadata = packedFiles.get(file);
  if (!metadata) {
    continue;
  }
  // Windows filesystems do not track the Unix executable bit, so the chmod() in
  // the build is a no-op and `npm pack` always reports 0o644 here. The exec bit
  // is only meaningful (and verifiable) when packing from a POSIX host such as
  // CI, which is where releases are published; npm also restores +x on bin files
  // at install time. Skip the assertion on Windows rather than fail spuriously.
  if (process.platform !== 'win32' && (metadata.mode & 0o111) === 0) {
    errors.push(`Package bin file must be executable in the tarball: ${file}`);
  }
}

if (!packedFiles.has('README.md')) errors.push('README.md is missing from npm pack output');
if (!packedFiles.has('LICENSE')) errors.push('LICENSE is missing from npm pack output');
if (!packedFiles.has('CHANGELOG.md')) errors.push('CHANGELOG.md is missing from npm pack output');

if (pack.size > MAX_TARBALL_BYTES) {
  errors.push(`Package tarball is too large: ${formatBytes(pack.size)} > ${formatBytes(MAX_TARBALL_BYTES)}`);
}
if (pack.unpackedSize > MAX_UNPACKED_BYTES) {
  errors.push(`Package unpacked size is too large: ${formatBytes(pack.unpackedSize)} > ${formatBytes(MAX_UNPACKED_BYTES)}`);
}
if (pack.entryCount > MAX_PACKED_FILE_COUNT) {
  errors.push(`Package file count is too high: ${pack.entryCount} > ${MAX_PACKED_FILE_COUNT}`);
}

for (const [file, maxBytes] of Object.entries(FILE_SIZE_BUDGETS)) {
  const metadata = packedFiles.get(file);
  if (!metadata) {
    continue;
  }
  if (metadata.size > maxBytes) {
    errors.push(`${file} is too large: ${formatBytes(metadata.size)} > ${formatBytes(maxBytes)}`);
  }
}

if (errors.length > 0) {
  console.error('Package tarball verification failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(
  `Package tarball verification passed: ${formatBytes(pack.size)} tarball, ` +
  `${formatBytes(pack.unpackedSize)} unpacked, ${pack.entryCount} files`
);
