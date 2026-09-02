// ============================================================================
// Zod 4.5.x adapter — exports a `z` namespace that mimics VLD's surface
// closely enough for the same schema source to run unmodified.
//
// This file is the ONLY place where Zod-specific syntax is allowed inside the
// drop-in suite. The schemas in /schemas/*.mjs import `z` from here and call
// `z.string()`, `z.object({...})`, etc. — identical to VLD usage.
// ============================================================================

import { z as zodReal } from 'zod';

// Normalize .refine's 2nd arg to the shape we use everywhere: a plain string.
// Zod: refine(fn, { message }) or refine(fn, message)
// VLD: refine(fn, stringMessage) — internally stores the same.
function normalizeRefineArgs(arg2) {
  if (arg2 == null) return arg2;
  if (typeof arg2 === 'string') return { message: arg2 };
  if (typeof arg2 === 'object' && 'message' in arg2) return arg2;
  return { message: String(arg2) };
}

function patch(proto, name, wrap) {
  const original = proto[name];
  if (typeof original !== 'function') return;
  proto[name] = function (...args) {
    const out = original.apply(this, args);
    return wrap.call(this, out, args);
  };
}

function installPatches() {
  // refine: Zod already supports { message }, no change needed.
  // But we want to be explicit.
  patch(zodReal.ZodType.prototype, 'refine', function (out) { return out; });

  // transform result is identical on both sides; nothing to patch.
}

installPatches();

export const z = zodReal;
export const version = 'zod@' + (process.env.ZOD_VERSION || '4.5.4');
