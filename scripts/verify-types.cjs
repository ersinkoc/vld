const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const tempRootDir = path.join(rootDir, '.tmp');
const tempDir = path.join(tempRootDir, 'verify-published-types');
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

function expandTypeWildcard(target) {
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

function collectTypeSpecifiers() {
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

    const typeTarget = typeof entry === 'string' ? entry : entry.types;
    if (typeof typeTarget !== 'string') {
      continue;
    }

    if (typeTarget.includes('*')) {
      for (const value of expandTypeWildcard(typeTarget)) {
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

function writeConsumer(specifiers) {
  const identifiers = createIdentifierMap(specifiers);
  const imports = specifiers
    .map((specifier) => `import * as ${identifiers.get(specifier)} from '${specifier}';`)
    .join('\n');
  const references = specifiers
    .map((specifier) => `void ${identifiers.get(specifier)};`)
    .join('\n');

  const content = `${imports}

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
`;

  fs.writeFileSync(path.join(tempDir, 'consumer.ts'), content);
}

function writeTsconfig() {
  const config = {
    compilerOptions: {
      target: 'ES2022',
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      strict: true,
      noEmit: true,
      skipLibCheck: false,
      esModuleInterop: true,
      forceConsistentCasingInFileNames: true,
      types: ['node']
    },
    include: ['consumer.ts']
  };

  fs.writeFileSync(path.join(tempDir, 'tsconfig.json'), `${JSON.stringify(config, null, 2)}\n`);
}

function runTypeScript() {
  try {
    execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'), '-p', path.join(tempDir, 'tsconfig.json'), '--pretty', 'false'], {
      cwd: rootDir,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    const stdout = error.stdout ? error.stdout.toString().trim() : '';
    const stderr = error.stderr ? error.stderr.toString().trim() : '';
    errors.push(`Published type smoke test failed${stdout ? `:\n${stdout}` : ''}${stderr ? `\n${stderr}` : ''}`);
  }
}

fs.rmSync(tempDir, { recursive: true, force: true });
fs.mkdirSync(tempDir, { recursive: true });

const specifiers = collectTypeSpecifiers();
if (specifiers.length === 0) {
  errors.push('No package type specifiers were discovered from package.json exports.');
} else {
  writeConsumer(specifiers);
  writeTsconfig();
  runTypeScript();
}

fs.rmSync(tempDir, { recursive: true, force: true });
if (fs.existsSync(tempRootDir) && fs.readdirSync(tempRootDir).length === 0) {
  fs.rmSync(tempRootDir, { recursive: true, force: true });
}

if (errors.length > 0) {
  console.error('Published type verification failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Published type verification passed for ${specifiers.length} package entrypoints`);
