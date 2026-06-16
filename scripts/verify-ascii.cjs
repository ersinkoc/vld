const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const errors = [];

const scannedRoots = [
  'benchmarks',
  'scripts',
  'src',
  'tests',
  'README.md',
  'CLAUDE.md',
  'package.json',
  'jest.config.js',
  'rollup.config.mjs',
  'tsconfig.json',
  'tsconfig.build.json',
];

const allowedPathPatterns = [
  /^src\/locales\/[^/]+\.ts$/,
  /^tests\/locale\.test\.ts$/,
  /^tests\/locales\//,
  /^tests\/error-formatting\.test\.ts$/,
  /^tests\/pigment\.test\.ts$/,
  /^tests\/utils\/codec-utils\.test\.ts$/,
  /^tests\/validators\/json\.test\.ts$/,
  /^tests\/validators\/string\.test\.ts$/,
  /^tests\/validators\/string-formats\.test\.ts$/,
  /^tests\/codecs\/zod-compatible-codecs\.test\.ts$/,
];

const allowedLinePatterns = [
  {
    path: /^src\/errors\.ts$/,
    line: /['"](\u2716|\u2192 at )['"]/,
  },
];

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

function isAllowedPath(relativePath) {
  return allowedPathPatterns.some((pattern) => pattern.test(relativePath));
}

function isAllowedLine(relativePath, line) {
  return allowedLinePatterns.some((entry) => entry.path.test(relativePath) && entry.line.test(line));
}

function listFiles(target) {
  const absolute = path.join(rootDir, target);
  if (!fs.existsSync(absolute)) {
    return [];
  }

  const stat = fs.statSync(absolute);
  if (stat.isFile()) {
    return [absolute];
  }

  const files = [];
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'coverage' || entry.name === '.tmp') {
      continue;
    }
    const fullPath = path.join(absolute, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(path.relative(rootDir, fullPath)));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

const files = scannedRoots.flatMap(listFiles);

for (const file of files) {
  const relativePath = toPosix(path.relative(rootDir, file));
  if (isAllowedPath(relativePath)) {
    continue;
  }

  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (/[\u0080-\uFFFF]/.test(line) && !isAllowedLine(relativePath, line)) {
      errors.push(`${relativePath}:${index + 1}: non-ASCII text outside an allowed i18n or Unicode behavior surface`);
    }
  });
}

if (errors.length > 0) {
  console.error('ASCII verification failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`ASCII verification passed for ${files.length} files`);
