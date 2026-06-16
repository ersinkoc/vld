const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));

const errors = [];
const esmSpecifiers = new Set();
const cjsSpecifiers = new Set();
const blockedSpecifiers = new Set();
const nullExports = new Set(
  Object.entries(packageJson.exports || {})
    .filter(([, entry]) => entry === null)
    .map(([exportName]) => exportName)
);

function normalizeTarget(target) {
  return target.startsWith('./') ? target.slice(2) : target;
}

function fileExists(target) {
  return fs.existsSync(path.join(rootDir, normalizeTarget(target)));
}

function listFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

function wildcardToRegExp(pattern) {
  const escaped = normalizeTarget(pattern).replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped.replace('*', '(.+)')}$`);
}

function expandWildcardTargets(fields) {
  const candidates = new Set();

  for (const target of Object.values(fields)) {
    if (typeof target !== 'string' || !target.includes('*')) {
      continue;
    }

    const normalized = normalizeTarget(target);
    const baseDir = path.join(rootDir, normalized.slice(0, normalized.indexOf('*')));
    const matcher = wildcardToRegExp(target);

    for (const file of listFiles(baseDir)) {
      const relative = path.relative(rootDir, file).split(path.sep).join('/');
      const match = relative.match(matcher);
      if (match) {
        candidates.add(match[1]);
      }
    }
  }

  return [...candidates].sort();
}

function materializeWildcard(pattern, value) {
  return pattern.replace('*', value);
}

function checkTarget(label, target) {
  if (!fileExists(target)) {
    errors.push(`${label} points to missing file: ${target}`);
  }
}

function checkExportEntry(exportName, entry) {
  if (entry === null) {
    blockedSpecifiers.add(packageSpecifier(exportName));
    return;
  }

  if (exportName === './package.json') {
    checkTarget(`${exportName}`, entry);
    return;
  }

  if (typeof entry === 'string') {
    checkTarget(exportName, entry);
    return;
  }

  const fields = Object.fromEntries(
    Object.entries(entry).filter(([, value]) => typeof value === 'string')
  );

  if (Object.values(fields).some((target) => target.includes('*'))) {
    const candidates = expandWildcardTargets(fields);
    if (candidates.length === 0) {
      errors.push(`${exportName} has no built files matching its wildcard targets`);
      return;
    }

    for (const candidate of candidates) {
      const materializedExportName = exportName.replace('*', candidate);
      if (nullExports.has(materializedExportName)) {
        continue;
      }
      for (const [field, target] of Object.entries(fields)) {
        checkTarget(`${exportName} ${field} (${candidate})`, materializeWildcard(target, candidate));
      }
      addSmokeSpecifier(materializedExportName, fields);
    }
    return;
  }

  for (const [field, target] of Object.entries(fields)) {
    checkTarget(`${exportName} ${field}`, target);
  }
  addSmokeSpecifier(exportName, fields);
}

function packageSpecifier(exportName) {
  if (exportName === '.') {
    return packageJson.name;
  }
  return `${packageJson.name}/${exportName.replace(/^\.\//, '')}`;
}

function addSmokeSpecifier(exportName, fields) {
  const specifier = packageSpecifier(exportName);
  if (fields.import) {
    esmSpecifiers.add(specifier);
  }
  if (fields.require) {
    cjsSpecifiers.add(specifier);
  }
}

for (const [exportName, entry] of Object.entries(packageJson.exports || {})) {
  checkExportEntry(exportName, entry);
}

for (const [binName, binPath] of Object.entries(packageJson.bin || {})) {
  checkTarget(`bin ${binName}`, binPath);
  if (fileExists(binPath)) {
    const content = fs.readFileSync(path.join(rootDir, normalizeTarget(binPath)), 'utf8');
    if (!content.startsWith('#!/usr/bin/env node')) {
      errors.push(`bin ${binName} is missing the Node.js shebang: ${binPath}`);
    }
  }
}

function runNodeSmoke(label, args) {
  try {
    execFileSync(process.execPath, args, {
      cwd: rootDir,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    const stderr = error.stderr ? error.stderr.toString().trim() : '';
    errors.push(`${label} failed${stderr ? `: ${stderr}` : ''}`);
  }
}

runNodeSmoke('ESM package export smoke test', [
  '--input-type=module',
  '-e',
  `for (const specifier of ${JSON.stringify([...esmSpecifiers].sort())}) await import(specifier);`,
]);

runNodeSmoke('CJS package export smoke test', [
  '-e',
  `for (const specifier of ${JSON.stringify([...cjsSpecifiers].sort())}) require(specifier);`,
]);

if (blockedSpecifiers.size > 0) {
  runNodeSmoke('Blocked package export smoke test', [
    '--input-type=module',
    '-e',
    `
for (const specifier of ${JSON.stringify([...blockedSpecifiers].sort())}) {
  let blocked = false;
  try {
    await import(specifier);
  } catch (error) {
    blocked = error && (error.code === 'ERR_PACKAGE_PATH_NOT_EXPORTED' || error.code === 'ERR_PACKAGE_IMPORT_NOT_DEFINED');
  }
  if (!blocked) {
    throw new Error(\`\${specifier} should be blocked by package exports\`);
  }
}
`,
  ]);
}

if (errors.length > 0) {
  console.error('Package export verification failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('Package export verification passed');
