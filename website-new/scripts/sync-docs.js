import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const websiteDir = path.resolve(__dirname, '..');
const rootDocsDir = path.resolve(websiteDir, '../docs');
const targetDocsDir = path.resolve(websiteDir, 'public/docs');

// Ensure target dir is fresh
if (fs.existsSync(targetDocsDir)) {
  fs.rmSync(targetDocsDir, { recursive: true, force: true });
}
fs.mkdirSync(targetDocsDir, { recursive: true });

// Copy all docs
if (fs.existsSync(rootDocsDir)) {
  fs.cpSync(rootDocsDir, targetDocsDir, { recursive: true });
  
  // Create uppercase aliases for case-sensitive links if needed
  const apiLower = path.join(targetDocsDir, 'api.md');
  const apiUpper = path.join(targetDocsDir, 'API.md');
  if (fs.existsSync(apiLower) && !fs.existsSync(apiUpper)) {
    fs.copyFileSync(apiLower, apiUpper);
  }

  const migLower = path.join(targetDocsDir, 'migration.md');
  const migUpper = path.join(targetDocsDir, 'MIGRATION.md');
  if (fs.existsSync(migLower) && !fs.existsSync(migUpper)) {
    fs.copyFileSync(migLower, migUpper);
  }
}

console.log('Docs synced successfully to public/docs');
