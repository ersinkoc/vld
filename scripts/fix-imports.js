import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

async function fixImports(dir) {
  const files = await readdir(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = join(dir, file.name);
    
    if (file.isDirectory()) {
      await fixImports(fullPath);
    } else if (file.name.endsWith('.js')) {
      let content = await readFile(fullPath, 'utf-8');
      
      // Fix relative imports
      content = content.replace(
        /from\s+['"](\.[^'"]+)(?<!\.js)['"]/g,
        'from \'$1.js\''
      );
      
      // Fix export statements
      content = content.replace(
        /export\s+\*\s+from\s+['"](\.[^'"]+)(?<!\.js)['"]/g,
        'export * from \'$1.js\''
      );
      
      await writeFile(fullPath, content);
    }
  }
}

// Fix imports in dist directory
fixImports('./dist')
  .then(() => console.log('✅ Fixed all imports'))
  .catch(console.error);