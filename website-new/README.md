# VLD Website

React + TypeScript + Vite website for `@oxog/vld`.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The build runs `npm run sync-docs` first, replacing `public/docs` with the root `docs` directory so the website ships the current package documentation.

## Release Notes

The website copy tracks VLD v2.1.0:

- Zod-compatible root and subpath APIs
- Zod 4.4.3 parity checks
- Real TypeScript app drop-in verification
- Runtime, startup, memory, package, install, docs, exports, and type release guards
