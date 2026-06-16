import { v } from '../../src';

describe('Collection validator fast paths', () => {
  it('should parse simple record values through the known-object fast path', () => {
    const record = v.record(v.number());
    const schema = v.object({ scores: record });

    expect((record as any).parseKnownRecord({ a: 1, b: 2 })).toEqual({ a: 1, b: 2 });
    expect(schema.parse({ scores: { a: 1, b: 2 } })).toEqual({ scores: { a: 1, b: 2 } });
    expect(schema.safeParse({ scores: { a: 1, b: Number.NaN } }).success).toBe(false);
  });

  it('should parse literal record values without calling the generic validator path', () => {
    const schema = v.record(v.literal('ready'));

    expect(schema.parse({ a: 'ready', b: 'ready' })).toEqual({ a: 'ready', b: 'ready' });
    expect(schema.safeParse({ a: 'ready', b: 'pending' }).success).toBe(false);
  });

  it('should parse boolean record values through the simple fast path', () => {
    const schema = v.record(v.boolean());

    expect(schema.parse({ a: true, b: false })).toEqual({ a: true, b: false });
    expect(schema.safeParse({ a: true, b: 'false' }).success).toBe(false);
  });

  it('should parse scalar record values through simple fast paths', () => {
    const token = Symbol('token');
    const bigintRecord = v.record(v.bigint());
    const symbolRecord = v.record(v.symbol());
    const nullRecord = v.record(v.null());
    const undefinedRecord = v.record(v.undefined());
    const anyRecord = v.record(v.any());
    const value = { nested: true };

    expect(bigintRecord.parse({ a: 1n, b: 2n })).toEqual({ a: 1n, b: 2n });
    expect(bigintRecord.safeParse({ a: 1 }).success).toBe(false);
    expect(symbolRecord.parse({ token })).toEqual({ token });
    expect(symbolRecord.safeParse({ token: 'token' }).success).toBe(false);
    expect(nullRecord.parse({ value: null })).toEqual({ value: null });
    expect(nullRecord.safeParse({ value: undefined }).success).toBe(false);
    expect(undefinedRecord.parse({ value: undefined })).toEqual({ value: undefined });
    expect(undefinedRecord.safeParse({ value: null }).success).toBe(false);
    expect(anyRecord.parse({ value })).toEqual({ value });
  });

  it('should parse simple set items through the known-set fast path', () => {
    const set = v.set(v.string());
    const schema = v.object({ tags: set });

    expect([...((set as any).parseKnownSet(new Set(['a', 'b'])) as Set<string>)]).toEqual(['a', 'b']);
    expect(schema.parse({ tags: new Set(['a', 'b']) })).toEqual({ tags: new Set(['a', 'b']) });
    expect(schema.safeParse({ tags: new Set(['a', 1]) }).success).toBe(false);
  });

  it('should parse number set items through the specialized known-set fast path', () => {
    const set = v.set(v.number());

    expect(set.parse(new Set([1, 2]))).toEqual(new Set([1, 2]));
    expect(set.safeParse(new Set([1, Number.NaN])).success).toBe(false);
    expect(set.safeParse(new Set([1, '2'])).success).toBe(false);
  });

  it('should parse boolean and literal set items through simple fast paths', () => {
    const booleanSet = v.set(v.boolean());
    const literalSet = v.set(v.literal('ready'));

    expect(booleanSet.parse(new Set([true, false]))).toEqual(new Set([true, false]));
    expect(booleanSet.safeParse(new Set([true, 'false'])).success).toBe(false);
    expect(literalSet.parse(new Set(['ready']))).toEqual(new Set(['ready']));
    expect(literalSet.safeParse(new Set(['pending'])).success).toBe(false);
  });

  it('should parse scalar set items through simple fast paths', () => {
    const token = Symbol('token');
    const value = { nested: true };
    const bigintSet = v.set(v.bigint());
    const symbolSet = v.set(v.symbol());
    const nullSet = v.set(v.null());
    const undefinedSet = v.set(v.undefined());
    const anySet = v.set(v.any());

    expect(bigintSet.parse(new Set([1n, 2n]))).toEqual(new Set([1n, 2n]));
    expect(bigintSet.safeParse(new Set([1n, 2])).success).toBe(false);
    expect(symbolSet.parse(new Set([token]))).toEqual(new Set([token]));
    expect(symbolSet.safeParse(new Set(['token'])).success).toBe(false);
    expect(nullSet.parse(new Set([null]))).toEqual(new Set([null]));
    expect(nullSet.safeParse(new Set([undefined])).success).toBe(false);
    expect(undefinedSet.parse(new Set([undefined]))).toEqual(new Set([undefined]));
    expect(undefinedSet.safeParse(new Set([null])).success).toBe(false);
    expect(anySet.parse(new Set([value, null, undefined]))).toEqual(new Set([value, null, undefined]));
  });

  it('should keep unsupported simple-like set validators on the generic path', () => {
    const set = v.set(v.array(v.string()));

    expect((set as any).getSimpleItemMode({ isSimple: true, validatorType: 'unsupported' })).toBeUndefined();
    expect((set as any).getSimpleItemError('value')).toBe('Invalid set');
  });

  it('should keep complex set items on the generic validator path', () => {
    const set = v.set(v.array(v.number()));

    expect(set.parse(new Set([[1, 2], [3, 4]]))).toEqual(new Set([[1, 2], [3, 4]]));
    expect(set.safeParse(new Set([[1, 2], [3, Number.NaN]])).success).toBe(false);
  });

  it('should parse simple map keys and values through the known-map fast path', () => {
    const map = v.map(v.string(), v.number());
    const schema = v.object({ counts: map });

    expect((map as any).parseKnownMap(new Map([['a', 1]])).get('a')).toBe(1);
    expect(schema.parse({ counts: new Map([['a', 1], ['b', 2]]) })).toEqual({
      counts: new Map([['a', 1], ['b', 2]])
    });
    expect(schema.safeParse({ counts: new Map([['a', Number.NaN]]) }).success).toBe(false);
  });

  it('should parse string map keys and values through the specialized known-map fast path', () => {
    const map = v.map(v.string(), v.string());

    expect(map.parse(new Map([['status', 'ready']]))).toEqual(new Map([['status', 'ready']]));
    expect(map.safeParse(new Map([['status', 1]])).success).toBe(false);
    expect(map.safeParse(new Map([[1, 'ready']])).success).toBe(false);
  });

  it('should parse mixed simple and complex map entries without losing errors', () => {
    const simpleKeyMap = v.map(v.string(), v.array(v.number()));
    const simpleValueMap = v.map(v.array(v.number()), v.string());
    const arrayKey = [1, 2];

    expect(simpleKeyMap.parse(new Map([['scores', [1, 2]]]))).toEqual(new Map([['scores', [1, 2]]]));
    expect(simpleKeyMap.safeParse(new Map([['scores', [1, Number.NaN]]])).success).toBe(false);
    expect(simpleValueMap.parse(new Map([[arrayKey, 'scores']]))).toEqual(new Map([[[1, 2], 'scores']]));
    expect(simpleValueMap.safeParse(new Map([[[1, Number.NaN], 'scores']])).success).toBe(false);
  });

  it('should parse boolean and literal map items through simple fast paths', () => {
    const booleanMap = v.map(v.boolean(), v.literal('enabled'));
    const literalMap = v.map(v.literal('feature'), v.boolean());

    expect(booleanMap.parse(new Map([[true, 'enabled']]))).toEqual(new Map([[true, 'enabled']]));
    expect(booleanMap.safeParse(new Map([[false, 'disabled']])).success).toBe(false);
    expect(literalMap.parse(new Map([['feature', true]]))).toEqual(new Map([['feature', true]]));
    expect(literalMap.safeParse(new Map([['other', true]])).success).toBe(false);
  });

  it('should parse scalar map keys and values through simple fast paths', () => {
    const token = Symbol('token');
    const bigintMap = v.map(v.bigint(), v.symbol());
    const nullishMap = v.map(v.null(), v.undefined());
    const voidMap = v.map(v.void(), v.null());

    expect(bigintMap.parse(new Map([[1n, token]]))).toEqual(new Map([[1n, token]]));
    expect(bigintMap.safeParse(new Map([[1, token]])).success).toBe(false);
    expect(bigintMap.safeParse(new Map([[1n, 'token']])).success).toBe(false);

    expect(nullishMap.parse(new Map([[null, undefined]]))).toEqual(new Map([[null, undefined]]));
    expect(nullishMap.safeParse(new Map([[undefined, undefined]])).success).toBe(false);
    expect(nullishMap.safeParse(new Map([[null, null]])).success).toBe(false);

    expect(voidMap.parse(new Map([[undefined, null]]))).toEqual(new Map([[undefined, null]]));
    expect(voidMap.safeParse(new Map([[null, null]])).success).toBe(false);
  });

  it('should pass any and unknown map entries through simple fast paths', () => {
    const key = { id: 1 };
    const value = { nested: true };
    const anyMap = v.map(v.any(), v.unknown());

    const parsed = anyMap.parse(new Map([[key, value]]));

    expect(parsed.get(key)).toBe(value);
    expect(anyMap.safeParse(new Map([[null, undefined]])).success).toBe(true);
  });

  it('should combine scalar simple map items with generic validators without losing errors', () => {
    const token = Symbol('token');
    const simpleKeyMap = v.map(v.symbol(), v.array(v.bigint()));
    const simpleValueMap = v.map(v.array(v.bigint()), v.null());

    expect(simpleKeyMap.parse(new Map([[token, [1n, 2n]]]))).toEqual(new Map([[token, [1n, 2n]]]));
    expect(simpleKeyMap.safeParse(new Map([['token', [1n]]])).success).toBe(false);
    expect(simpleKeyMap.safeParse(new Map([[token, [1n, 2]]])).success).toBe(false);

    expect(simpleValueMap.parse(new Map([[[1n, 2n], null]]))).toEqual(new Map([[[1n, 2n], null]]));
    expect(simpleValueMap.safeParse(new Map([[[1n, 2], null]])).success).toBe(false);
    expect(simpleValueMap.safeParse(new Map([[[1n], undefined]])).success).toBe(false);
  });

  it('should cover mixed simple map parser errors for string, number, and boolean modes', () => {
    const stringBooleanMap = v.map(v.string(), v.boolean());
    const numberBooleanMap = v.map(v.number(), v.boolean());
    const booleanBooleanMap = v.map(v.boolean(), v.boolean());

    expect(stringBooleanMap.parse(new Map([['enabled', true]]))).toEqual(new Map([['enabled', true]]));
    expect(stringBooleanMap.safeParse(new Map([[1, true]])).success).toBe(false);
    expect(numberBooleanMap.parse(new Map([[1, true]]))).toEqual(new Map([[1, true]]));
    expect(numberBooleanMap.safeParse(new Map([[Number.NaN, true]])).success).toBe(false);
    expect(booleanBooleanMap.safeParse(new Map([['true', true]])).success).toBe(false);
    expect(booleanBooleanMap.safeParse(new Map([[true, 'false']])).success).toBe(false);
  });

  it('should keep unsupported simple-like map validators on the generic path', () => {
    const map = v.map(v.string(), v.string());

    expect((map as any).getSimpleItemMode({ isSimple: true, validatorType: 'unsupported' })).toBeUndefined();
    expect((map as any).getSimpleItemError(undefined, undefined, 'value')).toBe('Invalid map');
  });
});
