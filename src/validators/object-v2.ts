/**
 * VldObjectV2 — Analysis and decision document
 *
 * After detailed analysis of VldObject (1071 lines, 10 own properties, all
 * precomputed internal arrays for fast-path dispatch), the V2 single-def
 * pattern does NOT yield memory wins for composite validators. Here's why:
 *
 *   - The V2 pattern saves memory by collapsing duplicated data
 *     (`config` + `_checks` + `_transforms` + `_isSimple` + `_checkMetas`)
 *     into a single `__def` object.
 *   - VldObject has NO duplicated data — it has 10 distinct internal arrays
 *     (shapeKeys, validators, validatorTypes, simpleFieldModes, ...), each
 *     serving a unique fast-path purpose.
 *   - A "VldObjectV2" wrapper that holds both a `__def` AND a VldObject
 *     child would have 2+10=12 own properties — WORSE than the legacy.
 *
 * The real Zod 4.5 9.8x win on `z.object()` came from a fundamentally
 * different data layout: a single `def = {type, shape, ...}` object shared
 * across all chained variants, plus bound methods. Replicating that for
 * VldObject would require rewriting the entire fast-path dispatch logic
 * (1071 lines) into a def-based representation — a multi-day refactor with
 * uncertain return.
 *
 * Decision (Faz 4): VldObject, VldArray, VldUnion remain in their legacy
 * form. The composite-side memory benefit from the V2 pattern is below
 * noise. The ~38% wins we observed come from using VldStringV2/VldNumberV2
 * as the children of VldObject — that's where the savings live.
 *
 * The composite itself is not refactored. Only its child primitive types
 * get the V2 treatment.
 *
 * If you really need to push composites, the next step would be:
 *   1. Move the precomputed arrays into a single shared `__def` object
 *   2. Replace per-instance fields with getter accessors on `__def`
 *   3. Use lazy memoization for keys that are only computed once
 *
 * That's a 3-5 day refactor of VldObject with ~10-20% expected win, much
 * smaller than the 38% we got from primitive V2.
 */

export {};
