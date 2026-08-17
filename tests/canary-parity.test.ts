/**
 * Tests for the Zod canary parity additions:
 * creditCard, deepPartial, input/output, and v4/core utilities.
 */

import { v, deepPartial, input, output } from '../src';
import * as core from '../src/v4/core';
import { isValidCreditCard, creditCard } from '../src/validators/string-formats';

describe('creditCard', () => {
  const validator = v.creditCard();

  it('accepts valid Luhn numbers with plain, space, and dash separators', () => {
    expect(validator.safeParse('4242424242424242').success).toBe(true);
    expect(validator.safeParse('4242 4242 4242 4242').success).toBe(true);
    expect(validator.safeParse('4242-4242-4242-4242').success).toBe(true);
    expect(validator.safeParse('5555555555554444').success).toBe(true);
  });

  it('rejects numbers failing the Luhn checksum', () => {
    expect(validator.safeParse('4242424242424243').success).toBe(false);
    expect(validator.safeParse('1234567812345678').success).toBe(false);
  });

  it('rejects values failing the shape regex', () => {
    expect(validator.safeParse('123').success).toBe(false); // too short
    expect(validator.safeParse('4242424242424242424242').success).toBe(false); // too long (20 digits)
    expect(validator.safeParse('abcd efgh ijkl mnop').success).toBe(false); // letters
    expect(validator.safeParse('4242_4242_4242_4242').success).toBe(false); // bad separator
    expect(validator.safeParse(4242424242424242).success).toBe(false); // not a string
  });

  it('supports a custom message', () => {
    const custom = creditCard({ message: 'not a card' });
    const result = custom.safeParse('nope');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('not a card');
    }
  });

  it('exposes isValidCreditCard as a direct predicate', () => {
    expect(isValidCreditCard('4242424242424242')).toBe(true);
    expect(isValidCreditCard('4242424242424241')).toBe(false);
    expect(isValidCreditCard('short')).toBe(false);
  });
});

describe('deepPartial', () => {
  it('makes nested object properties optional at every level', () => {
    const schema = v.object({
      name: v.string(),
      address: v.object({
        street: v.string(),
        geo: v.object({ lat: v.number(), lng: v.number() })
      })
    });
    const partial = deepPartial(schema);

    expect(partial.safeParse({}).success).toBe(true);
    expect(partial.safeParse({ address: {} }).success).toBe(true);
    expect(partial.safeParse({ address: { geo: {} } }).success).toBe(true);
    expect(partial.safeParse({ address: { geo: { lat: 1 } } }).success).toBe(true);
    expect(partial.safeParse({ name: 'x', address: { street: 'y', geo: { lat: 1, lng: 2 } } }).success).toBe(true);
    // Required keys still validated when present-but-invalid
    expect(partial.safeParse({ name: 1 }).success).toBe(false);
    expect(partial.safeParse({ address: { geo: { lat: 'no' } } }).success).toBe(false);
  });

  it('transforms objects nested inside arrays, sets, maps, records, and tuples', () => {
    const inner = v.object({ a: v.string() });
    const schema = v.object({
      list: v.array(inner),
      set: v.set(inner),
      map: v.map(v.string(), inner),
      record: v.record(inner),
      tuple: v.tuple(inner, v.number())
    });
    const partial = deepPartial(schema);

    expect(partial.safeParse({ list: [{}] }).success).toBe(true);
    expect(partial.safeParse({ set: new Set([{}]) }).success).toBe(true);
    expect(partial.safeParse({ map: new Map([['k', {}]]) }).success).toBe(true);
    expect(partial.safeParse({ record: { any: {} } }).success).toBe(true);
    expect(partial.safeParse({ tuple: [{}, 1] }).success).toBe(true);
    // Inner required key still enforced when provided invalid
    expect(partial.safeParse({ list: [{ a: 1 }] }).success).toBe(false);
  });

  it('walks union, intersection, and pipe children', () => {
    const inner = v.object({ a: v.string() });
    const schema = v.object({
      union: v.union(inner, v.string()),
      xor: v.xor(inner, v.number()),
      intersection: v.intersection(inner, v.object({ b: v.number() })),
      pipe: v.pipe(inner, v.transform(o => o))
    });
    const partial = deepPartial(schema);

    expect(partial.safeParse({ union: {} }).success).toBe(true);
    expect(partial.safeParse({ xor: {} }).success).toBe(true);
    expect(partial.safeParse({ intersection: {} }).success).toBe(true);
    expect(partial.safeParse({ pipe: {} }).success).toBe(true);
  });

  it('converts discriminated unions with transformed options to plain unions', () => {
    const option = v.object({ kind: v.literal('a'), value: v.object({ x: v.string() }) });
    const schema = v.discriminatedUnion('kind', option);
    const partial = deepPartial(v.object({ du: schema }));

    // discriminatedUnion options are objects -> partialed -> rebuild as union
    expect(partial.safeParse({ du: { kind: 'a', value: {} } }).success).toBe(true);
  });

  it('converts discriminated unions whose options were partialed', () => {
    const option = v.object({ kind: v.literal('a'), value: v.string() });
    const schema = v.discriminatedUnion('kind', option);
    const partial = deepPartial(schema) as any;

    // Options are objects, so they are always partialed; the union can no
    // longer discriminate (kind became optional) and degrades to a plain union.
    expect(partial).not.toBe(schema);
    expect(partial.validatorType).toBe('union');
    expect(partial.safeParse({ kind: 'a', value: 'x' }).success).toBe(true);
    expect(partial.safeParse({ kind: 'a', value: 1 }).success).toBe(false);
  });

  it('rebuilds wrappers around transformed inner schemas', () => {
    const inner = v.object({ a: v.string() });
    const schema = v.object({
      opt: v.optional(inner),
      nul: v.nullable(inner),
      nullish: v.nullish(inner),
      exact: v.exactOptional(inner),
      def: inner.default({ a: 'x' }),
      prefault: v.prefault(inner, { a: 'y' }),
      caught: v.catch(inner, { a: 'z' }),
      ro: v.readonly(inner),
      meta: v.meta(inner, { title: 'inner' }),
      refined: v.refine(inner, (o: { a?: string }) => (o?.a ?? '').length >= 0),
      transformed: v.transform(inner, o => o),
      preprocessed: v.preprocess(x => x, inner)
    });
    const partial = deepPartial(schema);

    expect(partial.safeParse({ opt: {} }).success).toBe(true);
    expect(partial.safeParse({ nul: null }).success).toBe(true);
    expect(partial.safeParse({ nullish: undefined }).success).toBe(true);
    expect(partial.safeParse({ exact: {} }).success).toBe(true);
    expect(partial.safeParse({ def: {} }).success).toBe(true);
    expect(partial.safeParse({ prefault: {} }).success).toBe(true);
    expect(partial.safeParse({ caught: {} }).success).toBe(true);
    expect(partial.safeParse({ ro: {} }).success).toBe(true);
    expect(partial.safeParse({ meta: {} }).success).toBe(true);
    expect(partial.safeParse({ refined: {} }).success).toBe(true);
    expect(partial.safeParse({ transformed: {} }).success).toBe(true);
    expect(partial.safeParse({ preprocessed: {} }).success).toBe(true);
  });

  it('preserves catchall schemas on rebuilt objects', () => {
    const schema = v.object({ a: v.object({ b: v.string() }) }).catchall(v.string());
    const partial = deepPartial(schema);
    // catchall stays active: unknown string keys pass, unknown object keys fail
    expect(partial.safeParse({ a: {}, extra: 'ok' }).success).toBe(true);
    expect(partial.safeParse({ a: {}, extra: 1 }).success).toBe(false);
  });

  it('transforms object catchalls alongside the shape', () => {
    const schema = v.object({ a: v.string() }).catchall(v.object({ nested: v.string() }));
    const partial = deepPartial(schema) as any;
    const catchall = partial._config.catchall;
    // The catchall object itself was partialed: nested key now optional.
    expect(catchall).not.toBe(schema.config.catchall);
    expect(catchall.safeParse({}).success).toBe(true);
    expect(catchall.safeParse({ nested: 'x' }).success).toBe(true);
    expect(catchall.safeParse({ nested: 1 }).success).toBe(false);
  });

  it('supports recursive schemas through lazy deferral', () => {
    let node: any;
    node = v.object({
      name: v.string(),
      children: v.optional(v.array(v.lazy(() => node)))
    });
    const partial = deepPartial(node);
    expect(partial.safeParse({}).success).toBe(true);
    expect(partial.safeParse({ children: [{}] }).success).toBe(true);
    expect(partial.safeParse({ children: [{ name: 1 }] }).success).toBe(false);
  });

  it('returns the same reference when nothing changes', () => {
    const leaf = v.string();
    expect(deepPartial(leaf)).toBe(leaf);
    const objLeaf = v.object({ a: v.string() });
    // deepPartial(objLeaf) is always a new object (partial changes it)
    expect(deepPartial(objLeaf)).not.toBe(objLeaf);
  });

  it('shares memoized results for repeated subtrees', () => {
    const shared = v.object({ a: v.string() });
    const schema = v.object({ x: shared, y: shared });
    const partial: any = deepPartial(schema);
    // The outer VldOptional wrappers are fresh per field (matching Zod), but
    // the memoized inner partialed object is shared between both usages.
    expect(partial.shape.x.baseValidator).toBe(partial.shape.y.baseValidator);
  });
});

describe('input/output', () => {
  const pipe = v.pipe(v.string().trim(), v.transform(s => s.toUpperCase()));

  it('input() returns the pre-transform side', () => {
    const pre = input(pipe);
    // VLD bakes .trim() into the string leaf rather than an inner pipe, so the
    // input side still trims; the uppercase transform is dropped.
    expect(pre.safeParse('  spaced  ')).toStrictEqual({ success: true, data: 'spaced' });
  });

  it('output() returns the post-transform side', () => {
    const post = output(pipe);
    expect(post.safeParse('abc')).toStrictEqual({ success: true, data: 'ABC' });
  });

  it('replaces pipes nested in containers', () => {
    const schema = v.object({ name: pipe, list: v.array(pipe) });
    const pre = input(schema);
    // Trim is part of the string leaf in VLD, so input() keeps trimming while
    // dropping the transform; output() keeps both.
    expect(pre.safeParse({ name: '  x  ', list: [' y '] })).toStrictEqual({
      success: true,
      data: { name: 'x', list: ['y'] }
    });
    const post = output(schema);
    expect(post.safeParse({ name: 'x', list: ['y'] })).toStrictEqual({
      success: true,
      data: { name: 'X', list: ['Y'] }
    });
  });

  it('returns the same reference when no pipes exist', () => {
    const plain = v.object({ a: v.string() });
    expect(input(plain)).toBe(plain);
    expect(output(plain)).toBe(plain);
  });

  it('preserves identity of every container and wrapper when no pipes exist', () => {
    const leafObj = v.object({ a: v.string() });
    const schema = v.object({
      arr: v.array(leafObj),
      set: v.set(leafObj),
      map: v.map(v.string(), leafObj),
      record: v.record(leafObj),
      keyedRecord: v.record(v.string(), leafObj),
      tuple: v.tuple([leafObj], v.number()),
      union: v.union(leafObj, v.string()),
      xor: v.xor(leafObj, v.number()),
      du: v.discriminatedUnion('kind', v.object({ kind: v.literal('a'), value: v.string() })),
      intersection: v.intersection(leafObj, v.object({ b: v.number() })),
      pipe: v.pipe(v.string().trim(), v.string()),
      opt: v.optional(leafObj),
      nul: v.nullable(leafObj),
      nullish: v.nullish(leafObj),
      exact: v.exactOptional(leafObj),
      def: leafObj.default({ a: 'x' }),
      prefault: v.prefault(leafObj, { a: 'y' }),
      caught: v.catch(leafObj, { a: 'z' }),
      ro: v.readonly(leafObj),
      meta: v.meta(leafObj, { title: 'inner' }),
      refined: v.refine(leafObj, () => true),
      transformed: v.transform(leafObj, o => o),
      preprocessed: v.preprocess(x => x, leafObj),
      lazy: v.lazy(() => leafObj)
    });

    const pre = input(schema) as any;
    // No pipes anywhere: every child keeps its identity through the walk.
    expect(pre.shape.arr).toBe(schema.shape.arr);
    expect(pre.shape.set).toBe(schema.shape.set);
    expect(pre.shape.map).toBe(schema.shape.map);
    expect(pre.shape.record).toBe(schema.shape.record);
    expect(pre.shape.keyedRecord).toBe(schema.shape.keyedRecord);
    expect(pre.shape.tuple).toBe(schema.shape.tuple);
    expect(pre.shape.union).toBe(schema.shape.union);
    expect(pre.shape.xor).toBe(schema.shape.xor);
    expect(pre.shape.du).toBe(schema.shape.du);
    expect(pre.shape.intersection).toBe(schema.shape.intersection);
    // (pipe intentionally absent: input() always replaces pipes with their
    // first side, covered in the replacement tests above)
    expect(pre.shape.opt).toBe(schema.shape.opt);
    expect(pre.shape.nul).toBe(schema.shape.nul);
    expect(pre.shape.nullish).toBe(schema.shape.nullish);
    expect(pre.shape.exact).toBe(schema.shape.exact);
    expect(pre.shape.def).toBe(schema.shape.def);
    expect(pre.shape.prefault).toBe(schema.shape.prefault);
    expect(pre.shape.caught).toBe(schema.shape.caught);
    expect(pre.shape.ro).toBe(schema.shape.ro);
    expect(pre.shape.meta).toBe(schema.shape.meta);
    expect(pre.shape.refined).toBe(schema.shape.refined);
    expect(pre.shape.transformed).toBe(schema.shape.transformed);
    expect(pre.shape.preprocessed).toBe(schema.shape.preprocessed);
    // Lazy nodes are always re-cloned (like Zod's visit): the deferred getter
    // must re-run the walk at resolution time, so identity is not preserved.
    expect(pre.shape.lazy).not.toBe(schema.shape.lazy);
    expect(pre.shape.lazy.safeParse({ a: 'x' })).toStrictEqual({ success: true, data: { a: 'x' } });
    expect(pre.shape.lazy.safeParse({ a: 1 }).success).toBe(false);
  });
});

describe('root namespace exposure', () => {
  it('exposes deepPartial, input, output, and creditCard on v and z', () => {
    expect(typeof v.deepPartial).toBe('function');
    expect(typeof v.input).toBe('function');
    expect(typeof v.output).toBe('function');
    expect(typeof v.creditCard).toBe('function');
    expect(v.creditCard().safeParse('4242424242424242').success).toBe(true);
  });

  it('root-level exports match the canary key set', async () => {
    const mod = await import('../src');
    expect(typeof mod.deepPartial).toBe('function');
    expect(typeof mod.input).toBe('function');
    expect(typeof mod.output).toBe('function');
    expect(typeof mod.creditCard).toBe('function');
    expect(typeof (mod as any).ZodCreditCard).toBe('function');
  });
});

describe('v4/core canary additions', () => {
  it('exports the five missing core keys', () => {
    expect(typeof core.$ZodCreditCard).toBe('function');
    expect(typeof core.standardProps).toBe('function');
    expect(typeof core.isValidCreditCard).toBe('function');
    expect(typeof core._creditCard).toBe('function');
    expect(typeof core.handleUnrepresentable).toBe('function');
  });

  it('_creditCard builds a working validator', () => {
    const validator = core._creditCard();
    expect(validator.safeParse('4242424242424242').success).toBe(true);
    expect(validator.safeParse('1234').success).toBe(false);
  });

  it('standardProps returns a Standard Schema v1 property bag', () => {
    const schema = v.string().min(2);
    const props = core.standardProps(schema) as {
      version: number; vendor: string; validate: (value: unknown) => { value?: unknown; issues?: unknown[] };
    };
    expect(props.version).toBe(1);
    expect(props.vendor).toBe('vld');
    const ok = props.validate('hello');
    expect((ok as { value: string }).value).toBe('hello');
    const bad = props.validate('x');
    expect(Array.isArray((bad as { issues: unknown[] }).issues)).toBe(true);
  });

  it('standardProps.validate returns the schema parsed output, matching the Standard Schema v1 contract', () => {
    // The repo's own ~standard getter (src/validators/base.ts:~standard) and
    // the StandardSchemaV1SuccessResult<Output> spec both return the
    // schema's parsed output on success ({ value: Output }). The shim must
    // behave identically so consumers (form libs, Standard Schema tooling)
    // see the same value whether they use VldBase['~standard'] or
    // v4/core.standardProps(schema).
    const schema = v.pipe(v.string(), v.transform(s => s.length));
    const props = core.standardProps(schema) as {
      validate: (value: unknown) => { value?: unknown; issues?: unknown[] };
    };
    const result = props.validate('hello');
    expect((result as { value: number }).value).toBe(5);
  });

  it('handleUnrepresentable honors each configured behavior', () => {
    const schema = v.symbol();
    const json: Record<string, unknown> = {};

    // "any" -> false, json untouched
    expect(core.handleUnrepresentable(schema, { unrepresentable: 'any' }, json, { path: [] }, 'msg')).toBe(false);
    expect(json).toStrictEqual({});

    // undefined -> throws
    expect(() => core.handleUnrepresentable(schema, {}, json, { path: [] }, 'cannot represent')).toThrow('cannot represent');

    // "throw" -> throws
    expect(() => core.handleUnrepresentable(schema, { unrepresentable: 'throw' }, json, { path: [] }, 'nope')).toThrow('nope');

    // object -> merged into json
    expect(core.handleUnrepresentable(schema, { unrepresentable: { type: 'string' } }, json, { path: [] }, 'm')).toBe(true);
    expect(json).toStrictEqual({ type: 'string' });

    // function -> return value used
    const fn = (info: { zodSchema: unknown; path: unknown[]; message: string }) => {
      expect(info.message).toBe('called');
      return { description: info.message };
    };
    expect(core.handleUnrepresentable(schema, { unrepresentable: fn }, json, { path: ['a'] }, 'called')).toBe(true);
    expect(json).toStrictEqual({ type: 'string', description: 'called' });
  });

  it('handleUnrepresentable shallow-clones the consumer-supplied object so a later mutation does not corrupt the JSON output', () => {
    const schema = v.symbol();
    const fragment = { description: 'first' };
    const json: Record<string, unknown> = {};
    expect(core.handleUnrepresentable(schema, { unrepresentable: fragment }, json, { path: [] }, 'm')).toBe(true);
    expect(json).toStrictEqual({ description: 'first' });
    // Mutate the consumer's original fragment after merging.
    fragment.description = 'corrupted';
    // The merged JSON output must remain the original snapshot.
    expect(json).toStrictEqual({ description: 'first' });
  });
});
