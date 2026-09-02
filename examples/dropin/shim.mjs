// Default shim — selects the active library at runtime via DROPIN_LIB env var.
// Run with `DROPIN_LIB=zod` (default) or `DROPIN_LIB=vld` to pick which
// library `import { z } from './shim.mjs'` resolves to.
//
// In a real migration, the user would replace this file with a single line:
//   export { z } from 'zod';          // ← before
//   export { z } from '@oxog/vld';    // ← after
// (or use TypeScript path mapping to do the swap at build time).

import { z as zodZ } from 'zod';
import { v as vldV } from '../../dist/index.js';

const pick = (process.env.DROPIN_LIB || 'zod').toLowerCase();
export const z = pick === 'vld' ? vldV : zodZ;
export const ACTIVE_LIB = pick === 'vld' ? '@oxog/vld' : 'zod';
