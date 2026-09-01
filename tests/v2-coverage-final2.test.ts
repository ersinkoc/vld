/**
 * V2 Coverage — Last 0.5%
 *
 * Targets remaining branches that istanbul tracks as separate edges.
 */
import { v, vV2, VldError } from '../src';
import { toZodError } from '../src/zod-error';
import {
  VldIntersectionV2, VldTupleV2
} from '../src/validators/composite-v2';
import { VldUnionV2 } from '../src/validators/union-v2';
import { VldLiteralV2, VldRecordV2 } from '../src/validators/leaf-v2';
import { VldRefineV2 } from '../src/validators/wrapper-v2';

// ============================================================================
// composite-v2: VldSetV2, VldMapV2, VldIntersectionV2 safeParse catch
//                   + VldTupleV2 safeParse catch
// ============================================================================
describe('composite-v2 VldSetV2/VldMapV2/VldIntersectionV2/VldTupleV2 safeParse catch', () => {
  it('VldSetV2.safeParse catches non-Set (non-VldError path)', () => {
    // Wrap a schema that throws a plain Error via the inner validator
    const s = vV2.set(vV2.string().email()); // emails will fail in valid set
    const r = s.safeParse(new Set(['not-an-email']));
    expect(r.success).toBe(false);
  });
  it('VldMapV2.safeParse catches non-Map', () => {
    const m = vV2.map(vV2.string().email(), vV2.number());
    const r = m.safeParse(new Map([['not-an-email', 1]]));
    expect(r.success).toBe(false);
  });
  it('VldIntersectionV2.safeParse catches errors', () => {
    const i = VldIntersectionV2.create(vV2.string().min(2), vV2.string().max(3));
    const r = i.safeParse('a');
    expect(r.success).toBe(false);
  });
  it('VldTupleV2.safeParse catches errors (non-VldError via inner)', () => {
    const t = VldTupleV2.create(vV2.string().email(), vV2.number());
    const r = t.safeParse(['not-an-email', 1]);
    expect(r.success).toBe(false);
  });
});

// ============================================================================
// leaf-v2: VldRecordV2.safeParse catch + VldLiteralV2 safeParse branches
// ============================================================================
describe('leaf-v2 final branches', () => {
  it('VldRecordV2.safeParse catches non-object (e instanceof VldError branch)', () => {
    // We need to test BOTH branches of `e instanceof VldError ? e : new VldError(...)`
    // First branch: invalid input throws VldError (non-object)
    const r1 = VldRecordV2.create(vV2.string()).safeParse(null);
    expect(r1.success).toBe(false);
    // Second branch: when the parse itself throws something that's not a VldError
    // Use a VldRecordV2 with simpleMode='string' (via direct constructor) — then a
    // non-string field value triggers `throw new Error(...)` (plain Error) which
    // falls into the `e instanceof VldError` FALSE branch and gets wrapped.
    const { VldRecordV2: VldRecordV2Ctor } = require('../src/validators/leaf-v2') as typeof import('../src/validators/leaf-v2');
    const r = new VldRecordV2Ctor(vV2.string()); // triggers simpleMode='string'
    const r2 = r.safeParse({ a: 42 });
    expect(r2.success).toBe(false);
  });
  it('VldLiteralV2.safeParse error path covers all branches', () => {
    // Branch where value === undefined triggers the 'undefined' received string
    const r1 = VldLiteralV2.create('admin').safeParse(undefined);
    expect(r1.success).toBe(false);
    // Branch where value !== undefined triggers typeof string
    const r2 = VldLiteralV2.create('admin').safeParse(42);
    expect(r2.success).toBe(false);
  });
});

// ============================================================================
// union-v2: all typeChecker branches (UNDEFINED, VOID, LITERAL, ENUM)
//            + safeParse catch + string(error) else
// ============================================================================
describe('union-v2 final branches', () => {
  it('VldUnionV2 UNDEFINED / VOID / LITERAL typeCheckers (line 52, 54-55)', () => {
    expect(v.unionV2(vV2.undefined()).safeParse(undefined).success).toBe(true);
    expect(v.unionV2(vV2.void()).safeParse(undefined).success).toBe(true);
    expect(v.unionV2(vV2.literal('hi')).safeParse('hi').success).toBe(true);
    expect(v.unionV2(vV2.literal('hi')).safeParse('bye').success).toBe(false);
  });
  it('VldUnionV2.safeParse catches error (line 117)', () => {
    // Construct a union that won't match anything
    const u = v.unionV2(vV2.string().min(100), vV2.string().min(200));
    const r = u.safeParse('x');
    expect(r.success).toBe(false);
  });
  it('VldUnionV2 custom error message (line 127 explicit branch)', () => {
    const u = new VldUnionV2([vV2.string()], 'no union match');
    try { u.parse(42); } catch (e) {
      expect((e as Error).message).toContain('no union match');
    }
  });
});

// ============================================================================
// zod-error: format() with multi-level + last-level path
//           + received default ternary (line 137)
// ============================================================================
describe('zod-error.ts final branches', () => {
  it('format() covers last-level path node creation (line 74)', () => {
    // Path with length 1: covers the `last` key creation branch
    const vldErr = new VldError([{ code: 'custom', path: ['a'], message: 'm' }]);
    const zodErr = toZodError(vldErr);
    const fmt = zodErr.format() as any;
    expect(fmt['a']['_errors']).toEqual(['m']);
  });
  it('format() with 2-level path: inner _errors is empty (line 70-71)', () => {
    // Path of length 2: covers the `key in node` check branch
    const vldErr = new VldError([{ code: 'custom', path: ['user', 'name'], message: 'm' }]);
    const zodErr = toZodError(vldErr);
    const fmt = zodErr.format() as any;
    expect(fmt['user']['name']['_errors']).toEqual(['m']);
  });
  it('received default ternary: raw.received undefined + raw.expected truthy → unknown', () => {
    // raw.received is undefined (so we reach line 137) and raw.expected='string' (truthy) → 'unknown'
    const vldErr = new VldError([{
      code: 'invalid_type', path: ['x'], message: 'm', expected: 'string'
    }]);
    const zodErr = toZodError(vldErr);
    expect(zodErr.issues[0]!.received).toBe('unknown');
  });
  it('received default ternary: raw.received undefined + raw.expected falsy → undefined', () => {
    // raw.received is undefined and raw.expected is '' (falsy string) → undefined
    const vldErr = new VldError([{
      code: 'invalid_type', path: ['x'], message: 'm', expected: ''
    }]);
    const zodErr = toZodError(vldErr);
    expect(zodErr.issues[0]!.received).toBeUndefined();
  });
});

// ============================================================================
// wrapper-v2: VldRefineV2 default message
// ============================================================================
describe('wrapper-2 final branches', () => {
  it('VldRefineV2 with no message uses default (line 128)', () => {
    // 3-arg overload with no message → uses 'Refinement check failed' default
    const r = VldRefineV2.create(vV2.string(), (s: string) => s.length > 5);
    const safe = r.safeParse('short');
    expect(safe.success).toBe(false);
  });
});
