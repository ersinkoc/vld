/**
 * Zod 4.6 parity suite.
 *
 * Differential tests against the installed `zod` package (devDependency,
 * pinned to ^4.6): every feature added in Zod 4.6 must exist in vld with
 * identical observable behavior, and vld must stay usable as a drop-in
 * replacement (`import * as z from 'zod'` -> `import * as z from '@oxog/vld'`).
 */

import * as v from '../src/index';
import * as zod from 'zod';

describe('Zod 4.6 parity', () => {
  describe('schema.validate() - boolean validation without result objects', () => {
    it('returns true/false exactly like zod for primitives', () => {
      expect(v.z.string().validate('hi')).toBe(true);
      expect(v.z.string().validate(5)).toBe(false);
      expect(v.z.string().validate('hi')).toBe(zod.string().validate('hi'));
      expect(v.z.string().validate(5)).toBe(zod.string().validate(5));

      expect(v.z.number().validate(42)).toBe(true);
      expect(v.z.number().validate('42')).toBe(false);
      expect(v.z.boolean().validate(true)).toBe(true);
      expect(v.z.boolean().validate(null)).toBe(false);
    });

    it('supports chained checks and short-circuits like zod', () => {
      const schema = v.z.string().min(2).max(5);
      const zSchema = zod.string().min(2).max(5);
      expect(schema.validate('abc')).toBe(zSchema.validate('abc'));
      expect(schema.validate('a')).toBe(false);
      expect(schema.validate('abcdef')).toBe(false);
    });

    it('validates objects, arrays and unions', () => {
      const schema = v.z.object({ name: v.z.string(), age: v.z.number().int().nonnegative() });
      const zSchema = zod.object({ name: zod.string(), age: zod.number().int().nonnegative() });
      expect(schema.validate({ name: 'a', age: 3 })).toBe(true);
      expect(schema.validate({ name: 'a', age: -1 })).toBe(false);
      expect(schema.validate({ name: 'a' })).toBe(false);
      expect(schema.validate({ name: 'a', age: 3 })).toBe(zSchema.validate({ name: 'a', age: 3 }));

      const u = v.z.union([v.z.string(), v.z.number()]);
      expect(u.validate('x')).toBe(true);
      expect(u.validate(true)).toBe(false);
    });

    it('works as a type predicate (narrowing)', () => {
      const schema = v.z.string();
      const input: unknown = 'hello';
      if (schema.validate(input)) {
        const len = (input as string).length;
        expect(len).toBe(5);
      } else {
        throw new Error('should have narrowed');
      }
    });

    it('uses the compiled fast path after z.compile()', () => {
      const schema = v.z.object({ a: v.z.number(), b: v.z.string() });
      const compiled = v.z.compile(schema);
      expect(compiled.validate({ a: 1, b: 'x' })).toBe(true);
      expect(compiled.validate({ a: 'nope', b: 'x' })).toBe(false);
      expect(compiled.validate(null)).toBe(false);
    });

    it('agrees with the top-level z.validate() helper', () => {
      const schema = v.z.object({ n: v.z.number() });
      for (const value of [{ n: 1 }, { n: 'x' }, null, 42]) {
        expect(schema.validate(value)).toBe(v.z.validate(schema, value));
      }
    });

    it('isValid routes through the same fast path', () => {
      const schema = v.z.string().email();
      expect(schema.isValid('a@b.co')).toBe(true);
      expect(schema.isValid('nope')).toBe(false);
    });

    it('throws on async-only schemas, like zod', () => {
      const promiseSchema = v.z.promise(v.z.string());
      expect(() => promiseSchema.validate(Promise.resolve('x'))).toThrow();
    });

    describe('validateAsync', () => {
      it('resolves to boolean for sync schemas', async () => {
        await expect(v.z.string().validateAsync('x')).resolves.toBe(true);
        await expect(v.z.string().validateAsync(1)).resolves.toBe(false);
        await expect(zod.string().validateAsync(1)).resolves.toBe(false);
      });

      it('supports async refinements', async () => {
        const schema = v.z.string().refine(async (val) => val.length > 2);
        await expect(schema.validateAsync('abc')).resolves.toBe(true);
        await expect(schema.validateAsync('a')).resolves.toBe(false);
      });
    });
  });

  describe('z.iban() - ISO 7064 MOD 97-10 checksummed IBAN', () => {
    it('matches zod on valid and checksum-failing numbers', () => {
      const cases = [
        'GB82WEST12345698765432', // valid
        'GB82WEST12345698765433', // bad checksum
        'TR330006100519786457841326', // valid
        'DE89370400440532013000', // valid
        'DE89370400440532013001', // bad checksum
        'gb82WEST12345698765432', // lowercase country - rejected
        'GB00WEST12345698765432', // check digits 00 - rejected by pattern
        'GB99WEST12345698765432', // check digits 99 - rejected by pattern
        '', // empty
        'GB82', // too short
      ];
      for (const value of cases) {
        expect(v.z.iban().validate(value)).toBe(zod.iban().validate(value));
      }
    });

    it('returns a string schema whose output is the input', () => {
      const schema = v.z.iban();
      expect(schema.parse('GB82WEST12345698765432')).toBe('GB82WEST12345698765432');
      expect(schema.safeParse('nope').success).toBe(false);
    });

    it('exposes the iban pattern through the regexes namespace', () => {
      expect(v.regexes.iban.test('GB82WEST12345698765432')).toBe(
        zod.regexes.iban.test('GB82WEST12345698765432')
      );
    });
  });

  describe('z.instanceof(Class).properties(shape)', () => {
    class Bucket {
      name: string;
      volume: number;
      constructor(name: string, volume: number) {
        this.name = name;
        this.volume = volume;
      }
    }

    const vSchema = () =>
      v.z.instanceof(Bucket).properties({ name: v.z.string(), volume: v.z.number() });
    const zSchema = () =>
      zod.instanceof(Bucket).properties({ name: zod.string(), volume: zod.number() });

    it('validates class instances while preserving the prototype', () => {
      const bucket = new Bucket('sand', 20);
      const parsed = vSchema().parse(bucket);
      expect(parsed).toBe(bucket);
      expect(parsed instanceof Bucket).toBe(true);
      expect(vSchema().parse(bucket) instanceof Bucket).toBe(
        zSchema().parse(bucket) instanceof Bucket
      );
    });

    it('rejects non-instances and invalid fields like zod', () => {
      expect(vSchema().validate(new Bucket('sand', 20))).toBe(true);
      expect(vSchema().validate(new Bucket(1 as unknown as string, 20))).toBe(false);
      expect(vSchema().validate({ name: 'sand' })).toBe(false);
      expect(vSchema().validate(null)).toBe(false);
      expect(vSchema().validate(new Bucket('sand', 20))).toBe(
        zSchema().validate(new Bucket('sand', 20))
      );
      expect(vSchema().validate({ name: 'sand' })).toBe(
        zSchema().validate({ name: 'sand' })
      );
    });

    it('reports field errors with the field name in the path', () => {
      try {
        vSchema().parse(new Bucket(42 as unknown as string, 20));
        throw new Error('should have thrown');
      } catch (error) {
        const issues = (error as { issues?: Array<{ path: (string | number)[] }> }).issues;
        expect(issues).toBeDefined();
        expect(issues![0]!.path[0]).toBe('name');
      }
    });

    it('still supports plain instanceof without properties', () => {
      const schema = v.z.instanceof(Bucket);
      expect(schema.validate(new Bucket('a', 1))).toBe(true);
      expect(schema.validate({})).toBe(false);
    });
  });

  describe('z.withParser(schema, parser)', () => {
    it('installs an external parser as the fast path', () => {
      const base = v.z.object({ a: v.z.number() });
      const schema = v.z.withParser(base, (input) => {
        if (typeof input === 'object' && input !== null && typeof (input as { a: unknown }).a === 'number') {
          return { a: (input as { a: number }).a * 2 };
        }
        return v.INVALID;
      });
      expect(schema.parse({ a: 21 })).toEqual({ a: 42 });
      expect(schema.safeParse({ a: 21 }).success).toBe(true);
      // INVALID hands the value back to the runtime parser.
      expect(schema.safeParse({ a: 'nope' }).success).toBe(false);
    });

    it('leaves the original schema untouched (clone semantics)', () => {
      const base = v.z.string().min(4);
      const schema = v.z.withParser(base, (input) =>
        typeof input === 'string' && input.length > 3 ? input : v.INVALID
      );
      expect(base.validate('hello')).toBe(true);
      expect(base.validate('hi')).toBe(false);
      expect(schema.validate('hello')).toBe(true);
      expect(schema.validate('hi')).toBe(false);
    });
  });

  describe('fromJSONSchema - six more Zod 4.6 keywords', () => {
    it('minProperties / maxProperties count raw input keys like zod', () => {
      const schema = v.z.fromJSONSchema({
        type: 'object',
        properties: { a: { type: 'string' } },
        minProperties: 2,
      });
      const zSchema = zod.fromJSONSchema({
        type: 'object',
        properties: { a: { type: 'string' } },
        minProperties: 2,
      });
      // Unknown keys count even though object parsing strips them.
      expect(schema.safeParse({ a: 'x', b: 1 }).success).toBe(true);
      expect(schema.safeParse({ a: 'x' }).success).toBe(false);
      expect(schema.safeParse({ a: 'x', b: 1 }).success).toBe(
        zSchema.safeParse({ a: 'x', b: 1 }).success
      );
      expect(schema.safeParse({ a: 'x' }).success).toBe(zSchema.safeParse({ a: 'x' }).success);

      const maxSchema = v.z.fromJSONSchema({ type: 'object', maxProperties: 1 });
      expect(maxSchema.validate({ a: 1 })).toBe(true);
      expect(maxSchema.validate({ a: 1, b: 2 })).toBe(false);
    });

    it('uniqueItems rejects duplicate items like zod', () => {
      const schema = v.z.fromJSONSchema({ type: 'array', uniqueItems: true });
      expect(schema.validate([1, 2, 3])).toBe(true);
      expect(schema.validate([1, 2, 2])).toBe(false);
      expect(schema.validate([1, 2, 2])).toBe(
        zod.fromJSONSchema({ type: 'array', uniqueItems: true }).validate([1, 2, 2])
      );
    });

    it('contains + minContains / maxContains count matching items', () => {
      const json = {
        type: 'array',
        items: { type: 'number' },
        contains: { type: 'number' as const, const: 5 },
        minContains: 1,
        maxContains: 2,
      } as const;
      const schema = v.z.fromJSONSchema(json);
      expect(schema.validate([1, 5, 7])).toBe(true); // exactly one match
      expect(schema.validate([1, 5, 5, 7])).toBe(true); // two matches - max ok
      expect(schema.validate([1, 5, 5, 5])).toBe(false); // three - over max
      expect(schema.validate([1, 2, 3])).toBe(false); // none, under min

      const zSchema = zod.fromJSONSchema(json);
      expect(schema.validate([1, 5, 7])).toBe(zSchema.validate([1, 5, 7]));
      expect(schema.validate([1, 5, 5, 5])).toBe(zSchema.validate([1, 5, 5, 5]));
      expect(schema.validate([1, 2, 3])).toBe(zSchema.validate([1, 2, 3]));
    });

    it('contains defaults to minContains=1', () => {
      const schema = v.z.fromJSONSchema({
        type: 'array',
        contains: { type: 'string' },
      });
      expect(schema.validate([1, 'x', 2])).toBe(true);
      expect(schema.validate([1, 2, 3])).toBe(false);
    });

    it('minItems / maxItems now bound plain arrays', () => {
      const schema = v.z.fromJSONSchema({
        type: 'array',
        items: { type: 'number' },
        minItems: 2,
        maxItems: 3,
      });
      expect(schema.validate([1, 2])).toBe(true);
      expect(schema.validate([1])).toBe(false);
      expect(schema.validate([1, 2, 3, 4])).toBe(false);
    });
  });

  describe('behavior changes in Zod 4.6', () => {
    it('emoji rejects component-only strings, keeps keycaps/flags', () => {
      const rejected = ['hello', '123', '\u25AB\uFE0E'];
      const accepted = ['\uD83D\uDE00', '1\uFE0F\u20E3', '\uD83C\uDDF9\uD83C\uDDF7', '\u2764\uFE0F'];
      for (const value of rejected) {
        expect(v.z.emoji().validate(value)).toBe(zod.emoji().validate(value));
        expect(v.z.emoji().validate(value)).toBe(false);
      }
      for (const value of accepted) {
        expect(v.z.emoji().validate(value)).toBe(zod.emoji().validate(value));
        expect(v.z.emoji().validate(value)).toBe(true);
      }
    });

    it('numeric enum options exclude reverse mappings', () => {
      const numEnum = { A: 1, B: 2 } as const;
      expect(v.z.nativeEnum(numEnum).options).toEqual([1, 2]);
      expect(v.z.nativeEnum(numEnum).options).toEqual(zod.nativeEnum(numEnum).options);
    });

    it('base64 keeps accepting the same strings as zod', () => {
      for (const value of ['', 'aGVsbG8=', 'aGVsbG8', '!!!', 'a=b']) {
        expect(v.z.string().base64().validate(value)).toBe(
          zod.base64().validate(value)
        );
      }
    });

    it('exposes the full Zod 4.6 regex namespace', () => {
      const zodKeys = Object.keys(zod.regexes).filter(
        (key) => !(key in v.regexes)
      );
      expect(zodKeys).toEqual([]);
      expect(v.regexes.currencyCode.test('TRY')).toBe(true);
      expect(v.regexes.anyString.test('anything')).toBe(true);
    });
  });

  describe('Standard Schema issue shape (v3.0.6 alignment)', () => {
    it('returns full issue objects like zod, not a single joined message', () => {
      const vResult = v.z.object({ name: v.z.string() })['~standard'].validate({ name: 5 });
      const zResult = zod.object({ name: zod.string() })['~standard'].validate({ name: 5 });
      expect('issues' in vResult).toBe('issues' in zResult);
      const vIssues = (vResult as { issues: Array<{ code: string; path: unknown[]; message: string }> }).issues;
      const zIssues = (zResult as { issues: Array<{ code: string; path: unknown[]; message: string }> }).issues;
      expect(vIssues[0]!.code).toBe(zIssues[0]!.code);
      expect(vIssues[0]!.path).toEqual(zIssues[0]!.path);
      expect(typeof vIssues[0]!.message).toBe('string');
      expect(vIssues[0]!.message.length).toBeGreaterThan(0);
    });

    it('promise schemas surface issues asynchronously with the same shape', async () => {
      const result = await v.z.promise(v.z.string())['~standard'].validate('not a promise');
      expect('issues' in result).toBe(true);
      const issues = (result as { issues: Array<{ message: string }> }).issues;
      expect(issues[0]!.message).toBe('Expected a Promise value');
    });
  });

  describe('drop-in smoke: z.* surface used by typical applications', () => {
    it('parses an API payload identically through zod and vld', () => {
      const payload = {
        id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
        email: 'user@example.com',
        tags: ['a', 'b'],
        role: 'admin' as const,
      };
      const vSchema = v.z.object({
        id: v.z.string().uuid(),
        email: v.z.string().email(),
        tags: v.z.array(v.z.string()).max(10),
        score: v.z.number().min(0).max(100).optional(),
        role: v.z.enum(['admin', 'user']),
      });
      const zSchema = zod.object({
        id: zod.string().uuid(),
        email: zod.string().email(),
        tags: zod.array(zod.string()).max(10),
        score: zod.number().min(0).max(100).optional(),
        role: zod.enum(['admin', 'user']),
      });
      expect(vSchema.parse(payload)).toEqual(zSchema.parse(payload));
      expect(vSchema.validate({ ...payload, role: 'bot' })).toBe(false);
    });
  });
});
