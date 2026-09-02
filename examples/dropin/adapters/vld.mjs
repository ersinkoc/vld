// ============================================================================
// VLD 3.0.4 adapter — exposes the VLD factory under the same `z` name used
// in the schema files. This is the only place VLD-specific code lives in
// the drop-in suite.
// ============================================================================

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
import { v as vReal } from '../../../dist/index.js';

const pkg = require('../../../package.json');

// VLD's .refine takes a plain string message. Zod's takes { message }.
// We don't need to patch VLD — the schemas will use the VLD-native form.
// (This adapter intentionally mirrors the Zod surface, not the other way
// around — so the schema source reads like idiomatic Zod code.)

export const z = vReal;
export const version = '@oxog/vld@' + (process.env.VLD_VERSION || pkg.version);
