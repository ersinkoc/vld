import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const websiteDir = path.resolve(__dirname, '..');
const distDir = path.resolve(websiteDir, 'dist');
const indexFile = path.resolve(distDir, 'index.html');

const ORIGIN = 'https://vld.oxog.dev';

// Client-side routes declared in src/App.tsx. GitHub Pages needs a real
// index.html per route, otherwise /benchmark is served as 404.html with a
// 404 status code. With the copies below Pages answers 301 -> /benchmark/
// -> 200 and the router renders the page on a clean status code.
const ROUTES = [
  {
    path: 'docs',
    title: 'VLD Documentation',
    description:
      'Installation, core concepts, and guides for the VLD TypeScript-first validation library.',
  },
  {
    path: 'api',
    title: 'VLD API Reference',
    description:
      'API reference for VLD validators, codecs, error formatting helpers, and factory methods.',
  },
  {
    path: 'examples',
    title: 'VLD Examples',
    description:
      'Practical VLD examples for schemas, coercion, codecs, and validation error handling.',
  },
  {
    path: 'playground',
    title: 'VLD Playground',
    description:
      'Try the VLD validation library in your browser with live schemas, parsing, and output.',
  },
  {
    path: 'benchmark',
    title: 'VLD Benchmarks',
    description:
      'Performance benchmarks for VLD against Zod, including the 34.9x peak .validate() result.',
  },
];

if (!fs.existsSync(indexFile)) {
  console.error('SPA route copies failed: dist/index.html not found. Run the build first.');
  process.exit(1);
}

const html = fs.readFileSync(indexFile, 'utf8');

const canonicalPattern = /<link rel="canonical" href="[^"]*" \/>/;
const ogUrlPattern = /<meta property="og:url" content="[^"]*" \/>/;
const titlePattern = /<title>[^<]*<\/title>/;
const descriptionPattern = /<meta name="description" content="[^"]*" \/>/;
const ogTitlePattern = /<meta property="og:title" content="[^"]*" \/>/;
const ogDescriptionPattern = /<meta property="og:description" content="[^"]*" \/>/;
const twitterTitlePattern = /<meta name="twitter:title" content="[^"]*" \/>/;
const twitterDescriptionPattern = /<meta name="twitter:description" content="[^"]*" \/>/;

// Every copy is derived from dist/index.html, which points canonical/og:url at
// the site root and carries the generic home page copy. Replace exactly one
// match per tag and fail loudly if index.html stops matching, so a broken tag
// can never be copied to the deep links.
function replaceTag(source, pattern, replacement, label) {
  const matches = source.match(new RegExp(pattern.source, 'g'));
  if (!matches || matches.length !== 1) {
    console.error(
      `SPA route copies failed: expected one ${label} in dist/index.html, found ${matches ? matches.length : 0}.`
    );
    process.exit(1);
  }
  return source.replace(pattern, replacement);
}

let sitemapRoutes = '';

for (const route of ROUTES) {
  const url = `${ORIGIN}/${route.path}/`;
  let routeHtml = html;
  routeHtml = replaceTag(
    routeHtml,
    canonicalPattern,
    `<link rel="canonical" href="${url}" />`,
    'canonical link'
  );
  routeHtml = replaceTag(
    routeHtml,
    ogUrlPattern,
    `<meta property="og:url" content="${url}" />`,
    'og:url meta'
  );
  routeHtml = replaceTag(
    routeHtml,
    titlePattern,
    `<title>${route.title}</title>`,
    'title element'
  );
  routeHtml = replaceTag(
    routeHtml,
    descriptionPattern,
    `<meta name="description" content="${route.description}" />`,
    'description meta'
  );
  routeHtml = replaceTag(
    routeHtml,
    ogTitlePattern,
    `<meta property="og:title" content="${route.title}" />`,
    'og:title meta'
  );
  routeHtml = replaceTag(
    routeHtml,
    ogDescriptionPattern,
    `<meta property="og:description" content="${route.description}" />`,
    'og:description meta'
  );
  routeHtml = replaceTag(
    routeHtml,
    twitterTitlePattern,
    `<meta name="twitter:title" content="${route.title}" />`,
    'twitter:title meta'
  );
  routeHtml = replaceTag(
    routeHtml,
    twitterDescriptionPattern,
    `<meta name="twitter:description" content="${route.description}" />`,
    'twitter:description meta'
  );

  const routeDir = path.resolve(distDir, route.path);
  fs.mkdirSync(routeDir, { recursive: true });
  fs.writeFileSync(path.resolve(routeDir, 'index.html'), routeHtml);

  sitemapRoutes += `  <url>\n    <loc>${url}</loc>\n  </url>\n`;
}

const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${ORIGIN}/</loc>
    <lastmod>${today}</lastmod>
  </url>
${sitemapRoutes.replace(/\n$/, '\n')}</urlset>
`;
fs.writeFileSync(path.resolve(distDir, 'sitemap.xml'), sitemap);

console.log(`SPA route shells written: ${ROUTES.map(r => `${r.path}/index.html`).join(', ')}`);
console.log(`Sitemap written: sitemap.xml (${ROUTES.length + 1} URLs)`);
