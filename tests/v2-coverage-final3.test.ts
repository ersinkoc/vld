/**
 * V2 Coverage — Factory Surface (index.ts 1344-1346, 1366-1367)
 *
 * Targets the vV2 factory branches that were never exercised:
 *   vV2.record, vV2.union, vV2.intersection, vV2.transformV2, vV2.refineV2
 */
import { vV2, VldError } from '../src';
import { toZodError } from '../src/zod-error';

// ============================================================================
// vV2.record / vV2.union / vV2.intersection
// ============================================================================
describe('vV2 factory surface: record / union / intersection', () => {
  it('vV2.record parses simple string record', () => {
    const r = vV2.record(vV2.string());
    expect(r.safeParse({ a: 'x', b: 'y' }).success).toBe(true);
    expect(r.safeParse({ a: 1 }).success).toBe(false);
  });

  it('vV2.union accepts first matching alternative', () => {
    const u = vV2.union(vV2.string(), vV2.number());
    expect(u.safeParse('hi').success).toBe(true);
    expect(u.safeParse(42).success).toBe(true);
    expect(u.safeParse(true).success).toBe(false);
  });

  it('vV2.intersection merges two compatible schemas', () => {
    const i = vV2.intersection(
      vV2.object({ a: vV2.string() }),
      vV2.object({ b: vV2.number() })
    );
    expect(i.safeParse({ a: 'x', b: 1 }).success).toBe(true);
    expect(i.safeParse({ a: 'x' }).success).toBe(false);
  });
});

// ============================================================================
// vV2.transformV2 / vV2.refineV2
// ============================================================================
describe('vV2 factory surface: transformV2 / refineV2', () => {
  it('vV2.transformV2 applies transformation', async () => {
    const t = vV2.transformV2(vV2.string(), (s: string) => s.toUpperCase());
    const r = await t.safeParseAsync('hello');
    expect(r.success).toBe(true);
    if (r.success) expect((r as { success: true; data: string }).data).toBe('HELLO');
  });

  it('vV2.refineV2 with explicit message', () => {
    const r = vV2.refineV2(vV2.number(), (n: number) => n > 0, 'must be positive');
    const safe = r.safeParse(-1);
    expect(safe.success).toBe(false);
    if (!safe.success) {
      expect(String(safe.error.issues[0]?.message ?? '')).toContain('positive');
    }
  });
});

// ============================================================================
// zod-error.ts: line 74 branch (last-level node creation)
//                + line 111-117 default fallbacks
//                + line 132-134 invalid_string + validation
// ============================================================================
describe('zod-error.ts uncovered branches', () => {
  it('format() with 3-level path covers line 74 (last-level node creation)', () => {
    // 3-level path: a/b/c — middle nodes, then 'c' is last-level (no children)
    const vldErr = new VldError([{ code: 'custom', path: ['a', 'b', 'c'], message: 'deep' }]);
    const zodErr = toZodError(vldErr);
    const fmt = zodErr.format() as any;
    expect(fmt['a']['b']['c']['_errors']).toEqual(['deep']);
  });

  it('toZodError handles issue with no expected and no received (default fallbacks)', () => {
    // Pure custom issue with only code + path + message — minimal fields
    const vldErr = new VldError([{ code: 'custom', path: [], message: 'bare' }]);
    const zodErr = toZodError(vldErr);
    expect(zodErr.issues[0]?.message).toBe('bare');
    expect(zodErr.issues[0]?.code).toBe('custom');
  });

  it('toZodError with invalid_string + validation fills expected from validation', () => {
    // Cast: VldIssue doesn't expose `validation` but toZodError reads it from raw
    const vldErr = { issues: [{
      code: 'invalid_string', path: ['x'], message: 'bad', validation: 'email'
    }] } as any;
    const zodErr = toZodError(vldErr);
    expect(zodErr.issues[0]?.expected).toBe('email');
  });

  it('format() reuses existing node (line 74 false branch)', () => {
    // Two issues at the SAME path: the first creates the node, the second
    // finds it already there (so `!(last in node)` is false on the second hit).
    const vldErr = new VldError([
      { code: 'custom', path: ['user'], message: 'first' },
      { code: 'custom', path: ['user'], message: 'second' }
    ]);
    const zodErr = toZodError(vldErr);
    const fmt = zodErr.format() as any;
    expect(fmt['user']['_errors']).toEqual(['first', 'second']);
  });

  it('toZodError default fallbacks: missing code/path/message (lines 111-117)', () => {
    // No code → defaults to 'custom'; no path → []; no message → 'Invalid value'.
    // Also exercises the `vldError?.issues ?? []` fallback by passing issues inline.
    const vldErr = { issues: [{ /* everything missing */ }] } as any;
    const zodErr = toZodError(vldErr);
    const i = zodErr.issues[0]!;
    expect(i.code).toBe('custom');
    expect(i.path).toEqual([]);
    expect(i.message).toBe('Invalid value');
  });

  it('toZodError handles vldError with no issues array (line 111 fallback)', () => {
    // Pass object with no `issues` field → uses `?? []` empty fallback
    const zodErr = toZodError({} as any);
    expect(zodErr.issues).toEqual([]);
  });

  it('toZodError non-array path defaults to [] (line 116 false branch)', () => {
    const vldErr = { issues: [{ code: 'custom', path: 'oops', message: 'm' }] } as any;
    const zodErr = toZodError(vldErr);
    expect(zodErr.issues[0]?.path).toEqual([]);
  });
});
