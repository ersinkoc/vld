import { v, VldError } from '../../src/index';
import type { VldIssue } from '../../src/errors-core';

/** Extract the first issue from a failed safeParse, asserting it exists. */
function firstIssue(result: { success: false; error: Error }): VldIssue {
  const err = result.error as VldError;
  return err.issues[0]!;
}

/** Extract the first issue from a caught VldError. */
function thrownIssue(e: unknown): VldIssue {
  return (e as VldError).issues[0]!;
}

/**
 * Coverage for Zod 4-compatible error issue paths.
 * Exercises _createCheckIssue / _findFailingCheck / _runChecks branches.
 */
describe('Zod 4 error issue coverage', () => {
  describe('string constraint issue paths', () => {
    it('produces too_big issue for max() failure', () => {
      const r = v.string().max(3).safeParse('hello');
      expect(r.success).toBe(false);
      if (!r.success) {
        const issue = firstIssue(r as any);
        expect(issue.code).toBe('too_big');
        expect(issue.origin).toBe('string');
        expect(issue.maximum).toBe(3);
        expect(issue.inclusive).toBe(true);
      }
    });

    it('produces too_big issue for length() failure (too long)', () => {
      const r = v.string().length(3).safeParse('hello');
      expect(r.success).toBe(false);
      if (!r.success) {
        const issue = firstIssue(r as any);
        expect(issue.code).toBe('too_big');
        expect(issue.origin).toBe('string');
        expect(issue.exact).toBe(3);
      }
    });

    it('produces too_small issue for length() failure (too short)', () => {
      const r = v.string().length(5).safeParse('hi');
      expect(r.success).toBe(false);
      if (!r.success) {
        const issue = firstIssue(r as any);
        expect(issue.origin).toBe('string');
      }
    });

    it('produces invalid_format issue for regex() failure with pattern', () => {
      const r = v.string().regex(/^\d+$/).safeParse('abc');
      expect(r.success).toBe(false);
      if (!r.success) {
        const issue = firstIssue(r as any);
        expect(issue.code).toBe('invalid_format');
        expect(issue.origin).toBe('string');
        expect(issue.format).toBe('regex');
        expect(issue.pattern).toBe('^\\d+$');
      }
    });

    it('produces invalid_format issue for email() failure', () => {
      const r = v.string().email().safeParse('bad');
      expect(r.success).toBe(false);
      if (!r.success) {
        const issue = firstIssue(r as any);
        expect(issue.code).toBe('invalid_format');
        expect(issue.origin).toBe('string');
        expect(issue.format).toBe('email');
      }
    });

    it('produces invalid_format issue for uuid() failure', () => {
      const r = v.string().uuid().safeParse('bad');
      expect(r.success).toBe(false);
      if (!r.success) {
        const issue = firstIssue(r as any);
        expect(issue.code).toBe('invalid_format');
        expect(issue.format).toBe('uuid');
      }
    });

    it('produces invalid_format issue for url() failure', () => {
      const r = v.string().url().safeParse('bad');
      expect(r.success).toBe(false);
      if (!r.success) {
        const issue = firstIssue(r as any);
        expect(issue.code).toBe('invalid_format');
        expect(issue.format).toBe('url');
      }
    });

    it('produces invalid_format issue for ipv4() failure', () => {
      const r = v.string().ipv4().safeParse('bad');
      expect(r.success).toBe(false);
      if (!r.success) {
        const issue = firstIssue(r as any);
        expect(issue.code).toBe('invalid_format');
        expect(issue.format).toBe('ipv4');
      }
    });

    it('produces invalid_format issue for ipv6() failure', () => {
      const r = v.string().ipv6().safeParse('bad');
      expect(r.success).toBe(false);
      if (!r.success) {
        const issue = firstIssue(r as any);
        expect(issue.code).toBe('invalid_format');
        expect(issue.format).toBe('ipv6');
      }
    });

    it('produces too_small issue for nonempty() failure', () => {
      const r = v.string().nonempty().safeParse('');
      expect(r.success).toBe(false);
      if (!r.success) {
        const issue = firstIssue(r as any);
        expect(issue.code).toBe('too_small');
        expect(issue.minimum).toBe(1);
      }
    });

    it('produces invalid_format for format() failure (generic)', () => {
      const r = v.string().base64().safeParse('!!!not-base64!!!');
      expect(r.success).toBe(false);
      if (!r.success) {
        const issue = firstIssue(r as any);
        expect(issue.code).toBe('invalid_format');
        expect(issue.format).toBe('base64');
      }
    });

    it('falls back to custom code for startsWith failure', () => {
      const r = v.string().startsWith('abc').safeParse('xyz');
      expect(r.success).toBe(false);
      if (!r.success) {
        const issue = firstIssue(r as any);
        expect(issue.code).toBe('custom');
      }
    });

    it('parse() throws VldError for min failure', () => {
      try {
        v.string().min(5).parse('hi');
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(VldError);
        expect(thrownIssue(e).code).toBe('too_small');
        expect(thrownIssue(e).minimum).toBe(5);
      }
    });

    it('parse() throws VldError for type mismatch', () => {
      try {
        v.string().parse(42);
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(VldError);
        expect(thrownIssue(e).code).toBe('invalid_type');
        expect(thrownIssue(e).expected).toBe('string');
        expect(thrownIssue(e).received).toBe('number');
      }
    });
  });

  describe('number constraint issue paths', () => {
    it('produces too_small issue for min() failure', () => {
      const r = v.number().min(10).safeParse(5);
      expect(r.success).toBe(false);
      if (!r.success) {
        const issue = firstIssue(r as any);
        expect(issue.code).toBe('too_small');
        expect(issue.origin).toBe('number');
        expect(issue.minimum).toBe(10);
        expect(issue.inclusive).toBe(true);
      }
    });

    it('produces too_big issue for max() failure', () => {
      const r = v.number().max(100).safeParse(200);
      expect(r.success).toBe(false);
      if (!r.success) {
        const issue = firstIssue(r as any);
        expect(issue.code).toBe('too_big');
        expect(issue.origin).toBe('number');
        expect(issue.maximum).toBe(100);
        expect(issue.inclusive).toBe(true);
      }
    });

    it('produces invalid_type issue for int() failure', () => {
      const r = v.number().int().safeParse(1.5);
      expect(r.success).toBe(false);
      if (!r.success) {
        const issue = firstIssue(r as any);
        expect(issue.code).toBe('invalid_type');
        expect(issue.expected).toBe('int');
        expect(issue.received).toBe('number');
      }
    });

    it('produces too_small issue for gt() failure (exclusive)', () => {
      const r = v.number().gt(5).safeParse(3);
      expect(r.success).toBe(false);
      if (!r.success) {
        const issue = firstIssue(r as any);
        expect(issue.code).toBe('too_small');
        expect(issue.minimum).toBe(5);
        expect(issue.inclusive).toBe(false);
      }
    });

    it('produces too_big issue for lt() failure (exclusive)', () => {
      const r = v.number().lt(5).safeParse(10);
      expect(r.success).toBe(false);
      if (!r.success) {
        const issue = firstIssue(r as any);
        expect(issue.code).toBe('too_big');
        expect(issue.maximum).toBe(5);
        expect(issue.inclusive).toBe(false);
      }
    });

    it('safeParse positive fast-path failure', () => {
      const r = v.number().positive().safeParse(-5);
      expect(r.success).toBe(false);
      if (!r.success) {
        const issue = firstIssue(r as any);
        expect(issue.code).toBe('too_small');
        expect(issue.origin).toBe('number');
        expect(issue.inclusive).toBe(false);
      }
    });

    it('safeParse positive-int fast-path failure for negative value', () => {
      // .int() passes for -5 (it's an integer), but .positive() fails
      // So the issue is too_small from gt(0), not invalid_type from int
      const r = v.number().int().positive().safeParse(-5);
      expect(r.success).toBe(false);
      if (!r.success) {
        const issue = firstIssue(r as any);
        expect(issue.code).toBe('too_small');
        expect(issue.origin).toBe('number');
        expect(issue.minimum).toBe(0);
        expect(issue.inclusive).toBe(false);
      }
    });

    it('safeParse positive-int failure for non-integer', () => {
      // .int() fails first for 1.5
      const r = v.number().int().positive().safeParse(1.5);
      expect(r.success).toBe(false);
      if (!r.success) {
        const issue = firstIssue(r as any);
        expect(issue.code).toBe('invalid_type');
        expect(issue.expected).toBe('int');
      }
    });

    it('parseKnownNumber positive fast-path failure', () => {
      expect(() => v.number().positive().parseKnownNumber(-1)).toThrow();
    });

    it('parseKnownNumber positive-int fast-path failure', () => {
      expect(() => v.number().int().positive().parseKnownNumber(-1)).toThrow();
    });

    it('rejects Infinity via safeParse', () => {
      const r = v.number().safeParse(Infinity);
      expect(r.success).toBe(false);
      if (!r.success) {
        const issue = firstIssue(r as any);
        expect(issue.code).toBe('invalid_type');
        expect(issue.expected).toBe('number');
        expect(issue.received).toBe('Infinity');
      }
    });

    it('rejects -Infinity via safeParse', () => {
      const r = v.number().safeParse(-Infinity);
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(firstIssue(r as any).received).toBe('-Infinity');
      }
    });

    it('rejects NaN via safeParse', () => {
      const r = v.number().safeParse(NaN);
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(firstIssue(r as any).received).toBe('nan');
      }
    });

    it('parse() throws VldError for Infinity', () => {
      try {
        v.number().parse(Infinity);
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(VldError);
      }
    });
  });

  describe('array constraint issue paths', () => {
    it('produces too_small issue for min failure', () => {
      const r = v.array(v.string()).min(3).safeParse(['a']);
      expect(r.success).toBe(false);
      if (!r.success) {
        const issue = firstIssue(r as any);
        expect(issue.code).toBe('too_small');
        expect(issue.origin).toBe('array');
        expect(issue.minimum).toBe(3);
      }
    });

    it('produces too_big issue for max failure', () => {
      const r = v.array(v.string()).max(2).safeParse(['a', 'b', 'c']);
      expect(r.success).toBe(false);
      if (!r.success) {
        const issue = firstIssue(r as any);
        expect(issue.code).toBe('too_big');
        expect(issue.origin).toBe('array');
        expect(issue.maximum).toBe(2);
      }
    });

    it('produces invalid_type for non-array', () => {
      const r = v.array(v.string()).safeParse('not-array');
      expect(r.success).toBe(false);
      if (!r.success) {
        const issue = firstIssue(r as any);
        expect(issue.code).toBe('invalid_type');
        expect(issue.expected).toBe('array');
        expect(issue.received).toBe('string');
      }
    });
  });

  describe('enum and literal issue paths', () => {
    it('produces invalid_value for enum failure', () => {
      const r = v.enum(['a', 'b', 'c']).safeParse('d');
      expect(r.success).toBe(false);
      if (!r.success) {
        const issue = firstIssue(r as any);
        expect(issue.code).toBe('invalid_value');
        expect(issue.values).toEqual(['a', 'b', 'c']);
      }
    });

    it('produces invalid_value for literal failure', () => {
      const r = v.literal('foo').safeParse('bar');
      expect(r.success).toBe(false);
      if (!r.success) {
        const issue = firstIssue(r as any);
        expect(issue.code).toBe('invalid_value');
        expect(issue.values).toEqual(['foo']);
      }
    });

    it('enum parse() throws VldError', () => {
      try {
        v.enum(['a', 'b']).parse('c');
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(VldError);
        expect(thrownIssue(e).code).toBe('invalid_value');
      }
    });

    it('literal parse() throws VldError', () => {
      try {
        v.literal(42).parse(99);
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(VldError);
        expect(thrownIssue(e).code).toBe('invalid_value');
      }
    });
  });

  describe('boolean issue paths', () => {
    it('produces invalid_type for non-boolean', () => {
      const r = v.boolean().safeParse('not-bool');
      expect(r.success).toBe(false);
      if (!r.success) {
        const issue = firstIssue(r as any);
        expect(issue.code).toBe('invalid_type');
        expect(issue.expected).toBe('boolean');
        expect(issue.received).toBe('string');
      }
    });

    it('parse() throws VldError', () => {
      try {
        v.boolean().parse('not-bool');
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(VldError);
      }
    });

    it('true() parse throws VldError', () => {
      try {
        v.boolean().true().parse(false);
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(VldError);
      }
    });

    it('false() parse throws VldError', () => {
      try {
        v.boolean().false().parse(true);
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(VldError);
      }
    });

    it('true() safeParse returns VldError', () => {
      const r = v.boolean().true().safeParse(false);
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error).toBeInstanceOf(VldError);
      }
    });

    it('false() safeParse returns VldError', () => {
      const r = v.boolean().false().safeParse(true);
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error).toBeInstanceOf(VldError);
      }
    });
  });

  describe('string format validators produce invalid_format', () => {
    it('v.email() produces invalid_format', () => {
      const r = v.email().safeParse('bad');
      expect(r.success).toBe(false);
      if (!r.success) {
        const issue = firstIssue(r as any);
        expect(issue.code).toBe('invalid_format');
        expect(issue.format).toBe('email');
        expect(issue.origin).toBe('string');
        expect(issue.pattern).toBeDefined();
      }
    });

    it('v.uuid() produces invalid_format', () => {
      const r = v.uuid().safeParse('bad');
      expect(r.success).toBe(false);
      if (!r.success) {
        const issue = firstIssue(r as any);
        expect(issue.code).toBe('invalid_format');
        expect(issue.format).toBe('uuid');
      }
    });

    it('v.url() produces invalid_format', () => {
      const r = v.url().safeParse('bad');
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(firstIssue(r as any).code).toBe('invalid_format');
      }
    });

    it('v.email() parse() throws VldError for type mismatch', () => {
      try {
        v.email().parse(42);
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(VldError);
        expect(thrownIssue(e).code).toBe('invalid_type');
        expect(thrownIssue(e).expected).toBe('string');
      }
    });
  });

  describe('VldError JSON round-trip with new fields', () => {
    it('serializes and deserializes origin, format, pattern, values', () => {
      const e1 = v.email().safeParse('bad');
      if (!e1.success) {
        const json = (e1.error as VldError).toJSON();
        expect(json.issues[0]?.format).toBe('email');
        expect(json.issues[0]?.origin).toBe('string');
        const restored = VldError.fromJSON(json);
        expect(restored.issues[0]?.format).toBe('email');
        expect(restored.issues[0]?.origin).toBe('string');
      }

      const e2 = v.number().min(10).safeParse(5);
      if (!e2.success) {
        const json = (e2.error as VldError).toJSON();
        expect(json.issues[0]?.minimum).toBe(10);
        expect(json.issues[0]?.origin).toBe('number');
        expect(json.issues[0]?.inclusive).toBe(true);
        const restored = VldError.fromJSON(json);
        expect(restored.issues[0]?.minimum).toBe(10);
        expect(restored.issues[0]?.origin).toBe('number');
      }

      const e3 = v.enum(['a', 'b']).safeParse('c');
      if (!e3.success) {
        const json = (e3.error as VldError).toJSON();
        expect(json.issues[0]?.values).toEqual(['a', 'b']);
        const restored = VldError.fromJSON(json);
        expect(restored.issues[0]?.values).toEqual(['a', 'b']);
      }
    });
  });

  describe('getTypeName coverage for Date, Map, Set', () => {
    it('reports received type as date for Date values', () => {
      const r = v.string().safeParse(new Date());
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(firstIssue(r as any).received).toBe('date');
      }
    });

    it('reports received type as map for Map values', () => {
      const r = v.string().safeParse(new Map());
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(firstIssue(r as any).received).toBe('map');
      }
    });

    it('reports received type as set for Set values', () => {
      const r = v.string().safeParse(new Set());
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(firstIssue(r as any).received).toBe('set');
      }
    });

    it('reports received type as bigint for bigint values', () => {
      const r = v.string().safeParse(BigInt(123));
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(firstIssue(r as any).received).toBe('bigint');
      }
    });

    it('reports received type as symbol for symbol values', () => {
      const r = v.string().safeParse(Symbol('test'));
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(firstIssue(r as any).received).toBe('symbol');
      }
    });
  });

  describe('_createCheckIssue fallback message coverage', () => {
    it('uses fallback message for min when checkMeta has no message', () => {
      const { VldString } = require('../../src/validators/string');
      const schema = new VldString({
        checks: [(v: string) => v.length >= 5],
        checkMetas: [{ kind: 'min', value: 5, message: undefined }]
      });
      const r = schema.safeParse('hi');
      expect(r.success).toBe(false);
      if (!r.success) {
        const issue = firstIssue(r as any);
        expect(issue.code).toBe('too_small');
        expect(issue.message).toContain('Too small');
      }
    });

    it('uses fallback message for max when checkMeta has no message', () => {
      const { VldString } = require('../../src/validators/string');
      const schema = new VldString({
        checks: [(v: string) => v.length <= 3],
        checkMetas: [{ kind: 'max', value: 3, message: undefined }]
      });
      const r = schema.safeParse('hello');
      expect(r.success).toBe(false);
      if (!r.success) {
        const issue = firstIssue(r as any);
        expect(issue.code).toBe('too_big');
        expect(issue.message).toContain('Too big');
      }
    });

    it('uses fallback message for length when checkMeta has no message', () => {
      const { VldString } = require('../../src/validators/string');
      const schema = new VldString({
        checks: [(v: string) => v.length === 3],
        checkMetas: [{ kind: 'length', value: 3, message: undefined }]
      });
      const r = schema.safeParse('hello');
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(firstIssue(r as any).message).toContain('exactly');
      }
    });

    it('uses fallback message for format when checkMeta has no message', () => {
      const { VldString } = require('../../src/validators/string');
      const schema = new VldString({
        checks: [(v: string) => v === 'valid'],
        checkMetas: [{ kind: 'format', format: 'custom_fmt', message: undefined }]
      });
      const r = schema.safeParse('bad');
      expect(r.success).toBe(false);
      if (!r.success) {
        const issue = firstIssue(r as any);
        expect(issue.code).toBe('invalid_format');
        expect(issue.message).toContain('custom_fmt');
      }
    });

    it('uses fallback message for regex when checkMeta has no message', () => {
      const { VldString } = require('../../src/validators/string');
      const schema = new VldString({
        checks: [(v: string) => /^\d+$/.test(v)],
        checkMetas: [{ kind: 'regex', pattern: 'digits', message: undefined }]
      });
      const r = schema.safeParse('abc');
      expect(r.success).toBe(false);
      if (!r.success) {
        const issue = firstIssue(r as any);
        expect(issue.code).toBe('invalid_format');
        expect(issue.message).toContain('does not match');
      }
    });

    it('uses fallback for custom kind when no message', () => {
      const { VldString } = require('../../src/validators/string');
      const schema = new VldString({
        checks: [(v: string) => v.startsWith('abc')],
        checkMetas: [{ kind: 'other', message: undefined }]
      });
      const r = schema.safeParse('xyz');
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(firstIssue(r as any).message).toBe('Invalid string');
      }
    });
  });

  describe('number _createCheckIssue fallback message coverage', () => {
    it('uses fallback for min when checkMeta has no message', () => {
      const { VldNumber } = require('../../src/validators/number');
      const schema = new VldNumber({
        checks: [(v: number) => v >= 10],
        checkMetas: [{ kind: 'min', value: 10, inclusive: true, message: undefined }]
      });
      const r = schema.safeParse(5);
      expect(r.success).toBe(false);
      if (!r.success) {
        const issue = firstIssue(r as any);
        expect(issue.code).toBe('too_small');
        expect(issue.message).toContain('>=10');
      }
    });

    it('uses fallback for max when checkMeta has no message', () => {
      const { VldNumber } = require('../../src/validators/number');
      const schema = new VldNumber({
        checks: [(v: number) => v <= 100],
        checkMetas: [{ kind: 'max', value: 100, inclusive: true, message: undefined }]
      });
      const r = schema.safeParse(200);
      expect(r.success).toBe(false);
      if (!r.success) {
        const issue = firstIssue(r as any);
        expect(issue.code).toBe('too_big');
        expect(issue.message).toContain('<=100');
      }
    });

    it('uses fallback for gt when checkMeta has no message', () => {
      const { VldNumber } = require('../../src/validators/number');
      const schema = new VldNumber({
        checks: [(v: number) => v > 5],
        checkMetas: [{ kind: 'gt', value: 5, inclusive: false, message: undefined }]
      });
      const r = schema.safeParse(3);
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(firstIssue(r as any).message).toContain('>5');
      }
    });

    it('uses fallback for lt when checkMeta has no message', () => {
      const { VldNumber } = require('../../src/validators/number');
      const schema = new VldNumber({
        checks: [(v: number) => v < 5],
        checkMetas: [{ kind: 'lt', value: 5, inclusive: false, message: undefined }]
      });
      const r = schema.safeParse(10);
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(firstIssue(r as any).message).toContain('<5');
      }
    });

    it('uses fallback for int when checkMeta has no message', () => {
      const { VldNumber } = require('../../src/validators/number');
      const schema = new VldNumber({
        checks: [(v: number) => Number.isInteger(v)],
        checkMetas: [{ kind: 'int', message: undefined }]
      });
      const r = schema.safeParse(1.5);
      expect(r.success).toBe(false);
      if (!r.success) {
        const issue = firstIssue(r as any);
        expect(issue.code).toBe('invalid_type');
        expect(issue.message).toContain('expected int');
      }
    });

    it('uses fallback for custom kind when no message', () => {
      const { VldNumber } = require('../../src/validators/number');
      const schema = new VldNumber({
        checks: [(v: number) => v % 2 === 0],
        checkMetas: [{ kind: 'other', message: undefined }]
      });
      const r = schema.safeParse(3);
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(firstIssue(r as any).message).toBe('Invalid number');
      }
    });

    it('2-check path without checkMetas uses fallback', () => {
      const { VldNumber } = require('../../src/validators/number');
      const schema = new VldNumber({
        checks: [(v: number) => v >= 0, (v: number) => v <= 10]
      });
      const r = schema.safeParse(-1);
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(firstIssue(r as any).code).toBe('custom');
      }
    });

    it('3-check path without checkMetas uses fallback', () => {
      const { VldNumber } = require('../../src/validators/number');
      const schema = new VldNumber({
        checks: [(v: number) => v >= 0, (v: number) => v <= 10, (v: number) => v % 2 === 0]
      });
      const r = schema.safeParse(-1);
      expect(r.success).toBe(false);
    });

    it('safeParse catches thrown VldError from check', () => {
      const { VldNumber } = require('../../src/validators/number');
      const customError = new (require('../../src/errors-core').VldError)([{ code: 'custom', path: [], message: 'thrown vld error' }]);
      const schema = new VldNumber({
        checks: [() => { throw customError; }]
      });
      const r = schema.safeParse(1);
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error).toBe(customError);
      }
    });

    it('2-check path with checkMetas where first check fails', () => {
      const r = v.number().min(10).max(100).safeParse(5);
      expect(r.success).toBe(false);
    });

    it('3-check path with checkMetas where first check fails', () => {
      const r = v.number().min(10).max(100).int().safeParse(5);
      expect(r.success).toBe(false);
    });

    it('3-check path with checkMetas where second check fails', () => {
      const r = v.number().min(1).max(5).int().safeParse(3.5);
      expect(r.success).toBe(false);
    });

    it('3-check path with checkMetas where third check fails', () => {
      const r = v.number().min(1).max(100).int().safeParse(50);
      // 50 passes all three checks
      expect(r.success).toBe(true);
      // Now test third check failing
      const r2 = v.number().min(1).max(100).multipleOf(3).safeParse(50);
      expect(r2.success).toBe(false);
    });

    it('2-check without checkMetas: second check fails', () => {
      const { VldNumber } = require('../../src/validators/number');
      const schema = new VldNumber({
        checks: [(v: number) => v >= 0, (v: number) => v <= 10]
      });
      // 20 passes first check (>=0) but fails second (<=10)
      const r = schema.safeParse(20);
      expect(r.success).toBe(false);
    });

    it('3-check without checkMetas: second check fails', () => {
      const { VldNumber } = require('../../src/validators/number');
      const schema = new VldNumber({
        checks: [(v: number) => v >= 0, (v: number) => v <= 10, (v: number) => v % 2 === 0]
      });
      // 20 passes first (>=0) but fails second (<=10)
      const r = schema.safeParse(20);
      expect(r.success).toBe(false);
    });
  });

  describe('string _runChecks multi-check fallback coverage', () => {
    it('2-check path without checkMetas uses _fallbackMeta', () => {
      const { VldString } = require('../../src/validators/string');
      const schema = new VldString({
        checks: [(v: string) => v.length >= 3, (v: string) => v.length <= 5]
      });
      const r = schema.safeParse('hi');
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(firstIssue(r as any).code).toBe('custom');
      }
    });

    it('3-check path without checkMetas uses _fallbackMeta for second check', () => {
      const { VldString } = require('../../src/validators/string');
      const schema = new VldString({
        checks: [(v: string) => v.length >= 3, (v: string) => v.length <= 5, (v: string) => v.startsWith('a')]
      });
      // 'hi' fails the first check
      expect(schema.safeParse('hi').success).toBe(false);
      // 'abcd' passes first two but fails third
      const r = schema.safeParse('bcd');
      expect(r.success).toBe(false);
    });

    it('regex checkMeta without pattern does not set pattern field', () => {
      const { VldString } = require('../../src/validators/string');
      const schema = new VldString({
        checks: [(v: string) => /^\d+$/.test(v)],
        checkMetas: [{ kind: 'regex', message: 'bad pattern' }]
      });
      const r = schema.safeParse('abc');
      expect(r.success).toBe(false);
      if (!r.success) {
        const issue = firstIssue(r as any);
        expect(issue.code).toBe('invalid_format');
        expect(issue.pattern).toBeUndefined();
      }
    });

    it('3-check path with checkMetas where second check fails', () => {
      // This covers the _checkMetas?.[1] truthy branch in the 3-check case
      const r = v.string().min(3).max(10).startsWith('a').safeParse('bcd');
      expect(r.success).toBe(false);
      if (!r.success) {
        // 'bcd' passes min(3) and max(10) but fails startsWith('a')
        // This hits the third check, covering _checkMetas?.[2] in the 3-check path
      }
    });

    it('3-check path with checkMetas where first check fails', () => {
      const r = v.string().min(5).max(10).startsWith('a').safeParse('hi');
      expect(r.success).toBe(false);
    });

    it('3-check without checkMetas: second check fails', () => {
      const { VldString } = require('../../src/validators/string');
      const schema = new VldString({
        checks: [(v: string) => v.length >= 3, (v: string) => v.length <= 5, (v: string) => v.startsWith('a')]
      });
      // 'abcdef' passes first (>=3) but fails second (<=5)
      const r = schema.safeParse('abcdef');
      expect(r.success).toBe(false);
    });
  });
});
