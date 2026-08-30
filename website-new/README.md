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

The website copy tracks VLD v2.3.0:

- Zod-compatible root and subpath APIs
- AOT compile (`v.compile`, `v.validate`, `v.validateAsync`, `v.properties`, `v.getDiscriminatedOption`, `v.memoizer`, `v.toZod`, `ZodCompileError`, `ZodCompileAsyncError`, `ZodCompileUnsupportedError`)
- Zod 4.5.4 parity (253/253 exports across root, mini, v4, v4-mini, v4/core, v4/locales, compile, and nested entry points)
- Real TypeScript app drop-in verification
- AOT compile, runtime, startup, memory, package, install, docs, exports, and type release guards
