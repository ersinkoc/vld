import { describe, expect, it } from '@jest/globals';
import * as v4 from '../src/v4';
import * as core from '../src/v4/core';
import * as mini from '../src/v4-mini';
import * as v4Mini from '../src/v4/mini';
import * as v4Locales from '../src/v4/locales';

describe('Zod subpath compatibility entrypoints', () => {
  it('keeps v4 default helper behavior aligned with Zod-style subpaths', () => {
    const schema = v4._default(v4.string(), 'fallback');
    expect(schema.parse(undefined)).toBe('fallback');
  });

  it('keeps v4-mini object helpers wired to VLD object methods', () => {
    const base = mini.object({
      id: mini.string(),
      name: mini.string(),
      count: mini.number().optional()
    });

    expect(mini.pick(base, { id: true, name: false }).parse({ id: '1', name: 1 })).toEqual({ id: '1' });
    expect(mini.omit(base, { count: true }).parse({ id: '1', name: 'Ada', count: 1 })).toEqual({ id: '1', name: 'Ada' });
    expect(mini.partial(base).parse({})).toEqual({});
    expect(() => mini.required(base).parse({ id: '1', name: 'Ada' })).toThrow('Invalid field "count"');

    const extended = mini.extend(base, { active: mini.boolean() });
    expect(extended.parse({ id: '1', name: 'Ada', active: true })).toMatchObject({ active: true });
    expect(() => mini.safeExtend(base, { id: mini.number() })).toThrow('safeExtend');

    const mergedWithObject = mini.merge(base, mini.object({ active: mini.boolean() }));
    expect(mergedWithObject.parse({ id: '1', name: 'Ada', active: false })).toMatchObject({ active: false });

    const mergedWithShape = mini.merge(base, { active: mini.boolean() });
    expect(mergedWithShape.parse({ id: '1', name: 'Ada', active: true })).toMatchObject({ active: true });

    const catchall = mini.catchall(base, mini.number());
    expect(catchall.parse({ id: '1', name: 'Ada', extra: 1 })).toMatchObject({ extra: 1 });
    expect(() => catchall.parse({ id: '1', name: 'Ada', extra: 'bad' })).toThrow('Invalid field "extra"');
  });

  it('keeps v4-mini numeric check helpers and aliases available', () => {
    expect(mini.minimum(2).parse(2)).toBe(2);
    expect(() => mini.minimum(2, 'Too small').parse(1)).toThrow('Too small');
    expect(mini.maximum(2, { message: 'Too large' }).parse(2)).toBe(2);
    expect(() => mini.maximum(2, { error: 'Too large via error' }).parse(3)).toThrow('Too large via error');
    expect(mini._default(mini.string(), 'fallback').parse(undefined)).toBe('fallback');
    expect(v4Mini.ZodMiniString).toBe(mini.ZodMiniString);
    expect(v4Mini.pick(mini.object({ id: mini.string() }), { id: true }).parse({ id: '1' })).toEqual({ id: '1' });
  });

  it('exposes Zod-style v4 locale functions', () => {
    for (const localeFactory of Object.values(v4Locales)) {
      expect(typeof localeFactory).toBe('function');
      expect(localeFactory()).toHaveProperty('invalidString');
    }
  });

  it('accepts Zod core factory calling conventions for common schemas', () => {
    expect(core._string(core.$ZodString).parse('ok')).toBe('ok');
    expect(core._number(core.$ZodNumber).parse(1)).toBe(1);
    expect(core._array(core.$ZodArray, core._string(core.$ZodString)).parse(['ok'])).toEqual(['ok']);

    const objectSchema = core._object(core.$ZodObject, {
      id: core._string(core.$ZodString),
      count: core._optional(core.$ZodOptional, core._number(core.$ZodNumber))
    });
    expect(objectSchema.parse({ id: 'a' })).toEqual({ id: 'a' });

    const unionSchema = core._union(core.$ZodUnion, [
      core._string(core.$ZodString),
      core._number(core.$ZodNumber)
    ]);
    expect(unionSchema.parse(1)).toBe(1);

    const tupleSchema = core._tuple(core.$ZodTuple, [
      core._string(core.$ZodString),
      core._number(core.$ZodNumber)
    ]);
    expect(tupleSchema.parse(['a', 1])).toEqual(['a', 1]);

    expect(core._literal(core.$ZodLiteral, 'ok').parse('ok')).toBe('ok');
    expect(core._enum(core.$ZodEnum, ['red', 'blue']).parse('red')).toBe('red');
    expect(core._map(core.$ZodMap, core._string(core.$ZodString), core._number(core.$ZodNumber)).parse(new Map([['a', 1]]))).toEqual(new Map([['a', 1]]));
    expect(core._set(core.$ZodSet, core._string(core.$ZodString)).parse(new Set(['a']))).toEqual(new Set(['a']));
    expect(core._default(core.$ZodDefault, core._string(core.$ZodString), 'fallback').parse(undefined)).toBe('fallback');
    expect(core._catch(core.$ZodCatch, core._string(core.$ZodString), 'fallback').parse(1)).toBe('fallback');
    expect(core._pipe(core.$ZodPipe, core._string(core.$ZodString), core._transform(core.$ZodTransform, (value: string) => value.length)).parse('abcd')).toBe(4);
  });
});
