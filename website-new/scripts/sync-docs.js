import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const websiteDir = path.resolve(__dirname, '..');
const rootDocsDir = path.resolve(websiteDir, '../docs');
const targetDocsDir = path.resolve(websiteDir, 'public/docs');

// Ensure target dir exists
if (fs.existsSync(targetDocsDir)) {
  fs.rmSync(targetDocsDir, { recursive: true, force: true });
}
fs.mkdirSync(targetDocsDir, { recursive: true });

// Copy all docs preserving exact root filenames
if (fs.existsSync(rootDocsDir)) {
  fs.cpSync(rootDocsDir, targetDocsDir, { recursive: true });
}

console.log('Docs synced successfully to public/docs');
