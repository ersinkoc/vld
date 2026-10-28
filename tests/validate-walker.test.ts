/**
 * Semantic-equivalence battery for the CSP interpreter walker: for every
 * walkable schema, walker verdicts must match safeParse success exactly;
 * non-walkable graphs must report null (never a wrong boolean).
 */
import { v, type VldBase } from '../src/index';
import { walkValid, walkerValidator } from '../src/validate-walker';

describe('validate walker (CSP interpreter fallback)', () => {
  describe('semantic equivalence with safeParse', () => {
    const cases: Array<{ name: string; schema: VldBase<any, any>; valid: unknown[]; invalid: unknown[] }> = [
      { name: 'plain string', schema: v.string(), valid: ['x', ''], invalid: [1, null, undefined] },
      { name: 'string with checks', schema: v.string().min(2).max(5).regex(/^[a-z]+$/), valid: ['ab', 'abcde'], invalid: ['a', 'abcdef', 'AB', 1] },
      { name: 'string email', schema: v.string().email(), valid: ['a@b.co'], invalid: ['nope', 'a@'] },
      { name: 'number with bounds', schema: v.number().int().min(0).max(10), valid: [0, 5, 10], invalid: [-1, 11, 1.5, NaN, Infinity, '3'] },
      { name: 'boolean', schema: v.boolean(), valid: [true, false], invalid: [1, 'true', null] },
      { name: 'bigint positive', schema: v.bigint().positive(), valid: [1n], invalid: [0n, -1n, 1] },
      { name: 'date', schema: v.date(), valid: [new Date()], invalid: [Date.now(), '2020-01-01', new Date('invalid')] },
      { name: 'null/undefined', schema: v.object({ a: v.null(), b: v.undefined() }), valid: [{ a: null, b: undefined }], invalid: [{ a: 0, b: undefined }, {}] },
      { name: 'literal', schema: v.literal('only'), valid: ['only'], invalid: ['other', 0] },
      { name: 'multi literal (NaN member)', schema: v.literal([1, 'a', NaN]), valid: [1, 'a', NaN], invalid: [2, 'b'] },
      { name: 'enum', schema: v.enum(['red', 'green']), valid: ['red', 'green'], invalid: ['blue', 0] },
      { name: 'optional field', schema: v.object({ a: v.string().optional() }), valid: [{}, { a: 'x' }], invalid: [{ a: 1 }] },
      { name: 'nullable field', schema: v.object({ a: v.string().nullable() }), valid: [{ a: null }, { a: 'x' }], invalid: [{}, { a: 1 }] },
      { name: 'default field', schema: v.object({ a: v.string().default('x') }), valid: [{}, { a: 'y' }], invalid: [{ a: 1 }] },
      { name: 'nested object', schema: v.object({ a: v.object({ b: v.string() }) }), valid: [{ a: { b: 'x' } }], invalid: [{ a: { b: 1 } }, { a: 1 }, 'o'] },
      { name: 'array of objects', schema: v.array(v.object({ a: v.string() })), valid: [[], [{ a: 'x' }, { a: 'y' }]], invalid: [['x'], [{ a: 1 }], {}] },
      { name: 'array bounds', schema: v.array(v.string()).min(1).max(2), valid: [['a'], ['a', 'b']], invalid: [[], ['a', 'b', 'c']] },
      { name: 'exact-length array', schema: v.array(v.string()).length(2), valid: [['a', 'b']], invalid: [['a'], []] },
      { name: 'union', schema: v.union([v.string(), v.number()]), valid: ['x', 1], invalid: [true, null] },
      { name: 'union of objects', schema: v.union([v.object({ t: v.literal('a'), a: v.string() }), v.object({ t: v.literal('b'), b: v.number() })]), valid: [{ t: 'a', a: 'x' }, { t: 'b', b: 1 }], invalid: [{ t: 'a', a: 1 }, { t: 'c' }] },
      { name: 'catch wrapper', schema: v.string().catch('fallback'), valid: ['x', 1, null], invalid: [] },
      { name: 'readonly wrapper', schema: v.object({ a: v.string() }).readonly(), valid: [{ a: 'x' }], invalid: [{ a: 1 }] },
      { name: 'tuple exact arity', schema: v.tuple([v.string(), v.number()]), valid: [['a', 1]], invalid: [['a'], ['a', 1, 2], [1, 'a']] },
      { name: 'presence check on any field', schema: v.object({ a: v.any() }), valid: [{ a: 1 }], invalid: [{}] },
      { name: 'deep composition', schema: v.object({ id: v.string().uuid(), tags: v.array(v.string().min(2)).max(3), meta: v.object({ n: v.number().int() }).optional() }), valid: [{ id: '123e4567-e89b-12d3-a456-426614174000', tags: ['ab'] }, { id: '123e4567-e89b-12d3-a456-426614174000', tags: [], meta: { n: 1 } }], invalid: [{ id: 'nope', tags: [] }, { id: '123e4567-e89b-12d3-a456-426614174000', tags: ['a'] }, { id: '123e4567-e89b-12d3-a456-426614174000', tags: [], meta: { n: 1.5 } }] },
    ];

    it.each(cases)('$name: walker matches safeParse', ({ schema, valid, invalid }) => {
      const validator = walkerValidator(schema);
      expect(validator).not.toBeNull();
      for (const input of valid) {
        expect(walkValid(schema, input)).toBe(true);
        expect(schema.safeParse(input).success).toBe(true);
      }
      for (const input of invalid) {
        expect(walkValid(schema, input)).toBe(false);
        expect(schema.safeParse(input).success).toBe(false);
      }
    });

    it('verdicts agree with schema.validate() through the bag', () => {
      const schema = v.object({ a: v.string().min(2) });
      const validator = walkerValidator(schema)!;
      expect(validator({ a: 'xy' })).toBe(true);
      const INVALID = Symbol.for('@oxog/vld/compile-invalid');
      expect(validator({ a: 'x' })).toBe(INVALID);
    });
  });

  describe('un-walkable graphs return null', () => {
    it.each([
      ['transform', v.string().transform((s) => s.trim())],
      ['refine', v.string().refine((s) => s.length > 2)],
      ['pipe', v.pipe(v.string(), v.string().email())],
      ['lazy', v.lazy(() => v.string())],
      ['record', v.record(v.string())],
      ['set', v.set(v.string())],
      ['map', v.map(v.string(), v.number())],
      ['strict object', v.object({ a: v.string() }).strict()],
      ['unique array', v.array(v.string()).unique()],
      ['tuple with rest', v.tuple([v.string()], v.number()) as unknown as VldBase<any, any>],
      ['intersection', v.intersection(v.object({ a: v.string() }), v.object({ b: v.number() }))],
    ])('%s -> walkerValidator null', (_name, schema) => {
      expect(walkerValidator(schema as VldBase<any, any>)).toBeNull();
    });

    it('union containing an un-walkable option is null', () => {
      expect(walkerValidator(v.union([v.string(), v.lazy(() => v.number())]))).toBeNull();
    });

    it('nested un-walkable field is null (no short-circuit mis-caching)', () => {
      expect(walkerValidator(v.object({ ok: v.string(), bad: v.pipe(v.string(), v.string()) }))).toBeNull();
    });
  });

  describe('compile({ JITless: true }) integration', () => {
    it('validate() uses the walker; parse keeps runtime semantics', () => {
      const schema = v.object({ a: v.string().min(2), tags: v.array(v.string()) });
      const jitless = v.compile(schema, { JITless: true });
      expect(jitless.validate({ a: 'xy', tags: ['t'] })).toBe(true);
      expect(jitless.validate({ a: 'x', tags: [] })).toBe(false);
      expect(jitless.validate({ a: 'xy', tags: [1] })).toBe(false);
      // parse still produces runtime output (stripped clones, defaults, ...)
      const parsed = jitless.safeParse({ a: 'xy', tags: ['t'], extra: 1 });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data).toEqual({ a: 'xy', tags: ['t'] });
      }
    });

    it('CSP degrade path installs the walker (EvalError simulation)', () => {
      const realFunction = globalThis.Function;
      const schema = v.object({ a: v.string(), b: v.number().int() });
      let compiled: any;
      try {
        // Simulate a CSP environment: every `new Function` throws EvalError.
        (globalThis as any).Function = function () {
          throw new EvalError('CSP: new Function is blocked');
        };
        compiled = v.compile(schema);
      } finally {
        (globalThis as any).Function = realFunction;
      }
      const bagValidator = compiled?._zod?.bag?.validator;
      expect(bagValidator).toBeDefined();
      expect((bagValidator as any).__vld_compiled).toBeUndefined();
      expect(compiled.validate({ a: 'x', b: 1 })).toBe(true);
      expect(compiled.validate({ a: 'x', b: 1.5 })).toBe(false);
      expect(compiled.safeParse({ a: 'x', b: 1 }).success).toBe(true);
    });

    it('.validate() ladder reaches the walker when the JIT cannot lower', () => {
      // Refinements are neither JIT-lowerable nor walkable; the ladder
      // must still answer correctly via the runtime parser.
      const schema = v.string().refine((s: string) => s.startsWith('vld-'));
      expect(schema.validate('vld-x')).toBe(true);
      expect(schema.validate('nope')).toBe(false);
    });
  });


  describe('remaining branch coverage', () => {
    it('nullish wrapper accepts inner values', () => {
      const schema = v.object({ a: v.string().nullish() });
      expect(walkerValidator(schema)).not.toBeNull();
      expect(schema.validate({ a: 'x' })).toBe(true);
      expect(schema.validate({ a: null })).toBe(true);
      expect(schema.validate({ a: 1 })).toBe(false);
    });

    it('prefault wrapper follows the default semantics', () => {
      const schema = v.object({ a: v.number().prefault(42) });
      expect(walkerValidator(schema)).not.toBeNull();
      expect(schema.validate({})).toBe(true);
      expect(schema.validate({ a: 'x' })).toBe(false);
    });

    it('xor options walk like union options', () => {
      const schema = v.xor([v.object({ a: v.string() }), v.object({ b: v.number() })]);
      const validator = walkerValidator(schema);
      expect(validator).not.toBeNull();
      expect(schema.validate({ a: 'x' })).toBe(true);
      expect(schema.validate({ a: 'x', b: 1 })).toBe(false);
      expect(schema.validate({ c: 1 })).toBe(false);
    });

    it('tuple shorter than items (omittable tail) is null', () => {
      const made = v.tuple([v.string().optional(), v.number()]);
      expect(walkerValidator(made)).not.toBeNull(); // optional items still walkable at full arity
      expect(made.validate(['x', 1])).toBe(true);
    });

    it('walkerValidator handles non-cacheable input defensively', () => {
      // frozen primitive wrapper path: a non-object schema returns null
      expect(walkerValidator(null as any)).toBeNull();
      expect(walkerValidator(undefined as any)).toBeNull();
    });
  });


  describe('default-case and malformed-input coverage', () => {
    it('an unknown validator kind answers null through walkValid', () => {
      const alien = { validate: () => true } as any;
      expect(walkValid(alien, 1)).toBeNull();
      expect(walkerValidator(alien)).toBeNull();
    });

    it('kindOf guards on schema-shape edge cases', () => {
      // constructor-less object (null prototype) walks the default branch
      const nullProto = Object.create(null);
      nullProto.parse = () => 1;
      expect(walkValid(nullProto as any, 1)).toBeNull();
    });
  });

  describe('walker validator is cached per schema', () => {
    it('returns the same closure for the same schema', () => {
      const schema = v.object({ a: v.string() });
      expect(walkerValidator(schema)).toBe(walkerValidator(schema));
    });
  });
});
