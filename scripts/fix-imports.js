import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist');

// Fix imports in dist/index.js
const indexPath = path.join(distDir, 'index.js');
let indexContent = fs.readFileSync(indexPath, 'utf8');
indexContent = indexContent.replace(
  "import { getMessages } from './locales/index';",
  "import { getMessages } from './locales/index.js';"
);
indexContent = indexContent.replace(
  "export { setLocale, getLocale, getMessages } from './locales';",
  "export { setLocale, getLocale, getMessages } from './locales/index.js';"
);
indexContent = indexContent.replace(
  "export { VldError, treeifyError, prettifyError, flattenError } from './errors';",
  "export { VldError, treeifyError, prettifyError, flattenError } from './errors.js';"
);
fs.writeFileSync(indexPath, indexContent);

// Fix imports in dist/locales/index.js
const localesIndexPath = path.join(distDir, 'locales', 'index.js');
let localesContent = fs.readFileSync(localesIndexPath, 'utf8');

// Replace all locale imports to include .js extension
const localeFiles = [
  'en', 'tr', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh',
  'ar', 'hi', 'nl', 'pl', 'da', 'sv', 'no', 'fi', 'th', 'vi', 'id',
  'bn', 'sw', 'af', 'pt-BR', 'es-MX'
];

localeFiles.forEach(locale => {
  const regex = new RegExp(`from '\\./${locale}'`, 'g');
  localesContent = localesContent.replace(regex, `from './${locale}.js'`);
});

fs.writeFileSync(localesIndexPath, localesContent);

console.log('✅ Fixed ES module imports in dist files');