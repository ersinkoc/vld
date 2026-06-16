const fs = require('fs');
const path = require('path');

function isDirectory(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function fixImportPath(importPath, currentDir) {
  if (path.extname(importPath)) {
    return importPath;
  }
  const fullPath = path.resolve(currentDir, importPath);
  if (isDirectory(fullPath)) {
    return importPath + '/index.js';
  }
  return importPath + '.js';
}

function fixImports(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      fixImports(fullPath);
    } else if (file.name.endsWith('.js') || file.name.endsWith('.d.ts')) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      const currentDir = path.dirname(fullPath);

      content = content.replace(/from\s+(['"])(\.[^'"]+)\1/g, (match, quote, importPath) => {
        return `from ${quote}${fixImportPath(importPath, currentDir)}${quote}`;
      });

      content = content.replace(/import\(\s*(['"])(\.[^'"]+)\1\s*\)/g, (match, quote, importPath) => {
        return `import(${quote}${fixImportPath(importPath, currentDir)}${quote})`;
      });

      fs.writeFileSync(fullPath, content);
    }
  }
}

fixImports('./dist');
for (const binPath of ['./dist/cli/bin.js']) {
  if (fs.existsSync(binPath)) {
    fs.chmodSync(binPath, 0o755);
  }
}
console.log('Fixed all imports');
