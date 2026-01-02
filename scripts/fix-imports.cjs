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
  if (importPath.endsWith('.js')) {
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
    } else if (file.name.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      const currentDir = path.dirname(fullPath);
      const importRegex = /from\s+['"](\.[^'"]+)['"]/g;
      const matches = [...content.matchAll(importRegex)];
      for (const match of matches) {
        const originalPath = match[1];
        if (!originalPath.endsWith('.js')) {
          const fixedPath = fixImportPath(originalPath, currentDir);
          content = content.split("from '" + originalPath + "'").join("from '" + fixedPath + "'");
          content = content.split('from "' + originalPath + '"').join("from '" + fixedPath + "'");
        }
      }
      fs.writeFileSync(fullPath, content);
    }
  }
}

fixImports('./dist');
console.log('Fixed all imports');
