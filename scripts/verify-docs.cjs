const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const readme = fs.readFileSync(path.join(rootDir, 'README.md'), 'utf8');
const errors = [];

const staleClaims = [
  '98.34%',
  '1914 passing tests',
  '2154 passing tests',
  '1.98x faster',
  '~1.98x faster',
  'Average: 1.98x',
  'Average median: 7.99x',
];

function exportNameForSpecifier(specifier) {
  if (specifier === packageJson.name) {
    return '.';
  }
  return `.${specifier.slice(packageJson.name.length)}`;
}

function isExported(exportName) {
  if (Object.prototype.hasOwnProperty.call(packageJson.exports || {}, exportName)) {
    return packageJson.exports[exportName] !== null;
  }

  for (const [candidate, entry] of Object.entries(packageJson.exports || {})) {
    if (entry === null || !candidate.includes('*')) {
      continue;
    }
    const escaped = candidate.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    const matcher = new RegExp(`^${escaped.replace('\\*', '[^/]+')}$`);
    if (matcher.test(exportName)) {
      return true;
    }
  }

  return false;
}

function collectReadmeImportSpecifiers() {
  const specifiers = new Set();
  const pattern = /from\s+['"](@oxog\/vld(?:\/[^'"\s;)]*)?)['"]/g;
  let match;

  while ((match = pattern.exec(readme)) !== null) {
    specifiers.add(match[1]);
  }

  return [...specifiers].sort();
}

function collectReadmeScriptReferences() {
  const scripts = new Set();
  const pattern = /npm run ([a-zA-Z0-9:_-]+)/g;
  let match;

  while ((match = pattern.exec(readme)) !== null) {
    scripts.add(match[1]);
  }

  return [...scripts].sort();
}

function collectNamedImports() {
  const imports = new Map();
  const pattern = /import\s+(?!type\b){([^;{}]*)}\s*from\s*['"](@oxog\/vld(?:\/[^'"\s;)]*)?)['"]/g;
  let match;

  while ((match = pattern.exec(readme)) !== null) {
    const names = match[1]
      .replace(/\/\/.*$/gm, '')
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name) => name.split(/\s+as\s+/)[0].trim());
    const specifier = match[2];
    const existing = imports.get(specifier) || new Set();
    for (const name of names) {
      existing.add(name);
    }
    imports.set(specifier, existing);
  }

  return imports;
}

for (const staleClaim of staleClaims) {
  if (readme.includes(staleClaim)) {
    errors.push(`README.md contains stale claim: ${staleClaim}`);
  }
}

for (const scriptName of collectReadmeScriptReferences()) {
  if (!packageJson.scripts?.[scriptName]) {
    errors.push(`README.md references missing npm script: ${scriptName}`);
  }
}

const importSpecifiers = collectReadmeImportSpecifiers();
for (const specifier of importSpecifiers) {
  const exportName = exportNameForSpecifier(specifier);
  if (!isExported(exportName)) {
    errors.push(`README.md imports non-exported package specifier: ${specifier}`);
  }
}

const namedImports = Object.fromEntries(
  [...collectNamedImports()].map(([specifier, names]) => [specifier, [...names].sort()])
);

if (Object.keys(namedImports).length > 0) {
  try {
    execFileSync(process.execPath, [
      '--input-type=module',
      '-e',
      `
const imports = ${JSON.stringify(namedImports)};
for (const [specifier, names] of Object.entries(imports)) {
  const mod = await import(specifier);
  for (const name of names) {
    if (!(name in mod)) {
      throw new Error(\`\${specifier} does not export \${name}\`);
    }
  }
}
`,
    ], {
      cwd: rootDir,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    const stderr = error.stderr ? error.stderr.toString().trim() : '';
    errors.push(`README.md named import smoke test failed${stderr ? `: ${stderr}` : ''}`);
  }
}

if (errors.length > 0) {
  console.error('Documentation verification failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(
  `Documentation verification passed: ${importSpecifiers.length} package specifiers, ` +
    `${Object.values(namedImports).reduce((sum, names) => sum + names.length, 0)} named imports`
);
