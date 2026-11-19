import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const websiteDir = path.resolve(__dirname, '..');
const distDir = path.resolve(websiteDir, 'dist');
const indexFile = path.resolve(distDir, 'index.html');

// Client-side routes declared in src/App.tsx. GitHub Pages needs a real
// index.html per route, otherwise /benchmark is served as 404.html with a
// 404 status code. With the copies below Pages answers 301 -> /benchmark/
// -> 200 and the router renders the page on a clean status code.
const routes = ['docs', 'api', 'examples', 'playground', 'benchmark'];

if (!fs.existsSync(indexFile)) {
  console.error('SPA route copies failed: dist/index.html not found. Run the build first.');
  process.exit(1);
}

const html = fs.readFileSync(indexFile);

for (const route of routes) {
  const routeDir = path.resolve(distDir, route);
  fs.mkdirSync(routeDir, { recursive: true });
  fs.writeFileSync(path.resolve(routeDir, 'index.html'), html);
}

console.log(`SPA route shells written: ${routes.map(r => `${r}/index.html`).join(', ')}`);
