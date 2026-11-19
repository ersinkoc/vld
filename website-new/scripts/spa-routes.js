import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const websiteDir = path.resolve(__dirname, '..');
const distDir = path.resolve(websiteDir, 'dist');
const indexFile = path.resolve(distDir, 'index.html');

const ORIGIN = 'https://vld.oxog.dev';
const ROUTES = ['docs', 'api', 'examples', 'playground', 'benchmark'];

// Client-side routes declared in src/App.tsx. GitHub Pages needs a real
// index.html per route, otherwise /benchmark is served as 404.html with a
// 404 status code. With the copies below Pages answers 301 -> /benchmark/
// -> 200 and the router renders the page on a clean status code.
if (!fs.existsSync(indexFile)) {
  console.error('SPA route copies failed: dist/index.html not found. Run the build first.');
  process.exit(1);
}

const html = fs.readFileSync(indexFile, 'utf8');

// The built shell points canonical/og:url at the site root. Each route copy
// must advertise its own trailing-slash URL instead, otherwise every deep
// link tells crawlers the root is canonical.
const rootCanonical = `rel="canonical" href="${ORIGIN}/"`;
const rootOgUrl = `property="og:url" content="${ORIGIN}/"`;

for (const tag of [rootCanonical, rootOgUrl]) {
  if (!html.includes(tag)) {
    console.error(`SPA route copies failed: dist/index.html has no root tag ${tag}`);
    process.exit(1);
  }
}

for (const route of ROUTES) {
  const url = `${ORIGIN}/${route}/`;
  const routeHtml = html
    .split(rootCanonical).join(`rel="canonical" href="${url}"`)
    .split(rootOgUrl).join(`property="og:url" content="${url}"`);
  const routeDir = path.resolve(distDir, route);
  fs.mkdirSync(routeDir, { recursive: true });
  fs.writeFileSync(path.resolve(routeDir, 'index.html'), routeHtml);
}

console.log(`SPA route shells written: ${ROUTES.map(r => `${r}/index.html`).join(', ')}`);
