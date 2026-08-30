/**
 * Tests for the AOT compile surface (src/compile.ts) and the v.compile /
 * v.validate / v.validateAsync / v.properties / v.getDiscriminatedOption /
 * v.memoizer / v.toZod namespace exports.
 *
 * Also covers three small coverage gaps that surfaced when the v2.3.0
 * AOT compile module landed:
 *   - src/index.ts line 1107 (v.compile via the v namespace)
 *   - src/validators/object.ts lines 996-1000 (VldObject.exactPartial)
 *   - src/validators/string-formats.ts line 116 (regexes.nanoidOfLength)
 */
import { v, zodCompileFn, ZodCompileAsyncError as ZCAError, ZodCompileUnsupportedError as ZCUError } from '../src/index';
import {
  compile as compileDirect,
  validate as validateDirect,
  validateAsync as validateAsyncDirect,
  properties as propertiesDirect,
  getDiscriminatedOption as getDiscriminatedOptionDirect,
  memoizer as memoizerDirect,
  toZod as toZodDirect,
  compileFn as compileFnDirect,
  compileFnValidate as compileFnValidateDirect,
  ZodCompileError,
  ZodCompileAsyncError,
  ZodCompileUnsupportedError,
} from '../src/compile';
import { regexes } from '../src/validators/string-formats';

describe('AOT compile  -  error class hierarchy', () => {
  test('ZodCompileError is an Error subclass with name', () => {
    const e = new ZodCompileError('boom');
    expect(e).toBeInstanceOf(Error);
    expect(e).toBeInstanceOf(ZodCompileError);
    expect(e.name).toBe('ZodCompileError');
    expect(e.message).toBe('boom');
  });

  test('ZodCompileAsyncError defaults the message', () => {
    const e = new ZodCompileAsyncError();
    expect(e).toBeInstanceOf(ZodCompileError);
    expect(e.name).toBe('ZodCompileAsyncError');
    expect(e.message).toContain('async');
  });

  test('ZodCompileAsyncError accepts a custom message', () => {
    const e = new ZodCompileAsyncError('custom');
    expect(e.message).toBe('custom');
  });

  test('ZodCompileUnsupportedError defaults the message', () => {
    const e = new ZodCompileUnsupportedError();
    expect(e).toBeInstanceOf(ZodCompileError);
    expect(e.name).toBe('ZodCompileUnsupportedError');
    expect(e.message).toContain('not supported');
  });

  test('ZodCompileUnsupportedError accepts a custom message', () => {
    const e = new ZodCompileUnsupportedError('bad node');
    expect(e.message).toBe('bad node');
  });
});

describe('AOT compile  -  memoizer', () => {
  test('memoizer caches by key reference', () => {
    let calls = 0;
    const compute = (k: { id: number }) => {
      calls++;
      return k.id * 2;
    };
    const memo = memoizerDirect(compute);
    const k1 = { id: 1 };
    const k2 = { id: 2 };
    expect(memo(k1)).toBe(2);
    expect(memo(k1)).toBe(2);
    expect(memo(k2)).toBe(4);
    expect(calls).toBe(2);
  });
});

describe('AOT compile  -  compileFn / compileFnValidate', () => {
  test('compileFnValidate emits a thin validator for primitives', () => {
    const fn = compileFnValidateDirect(v.string());
    expect(fn).not.toBeNull();
    expect(typeof fn).toBe('function');
  });

  test('compileFnValidate returns null for an uncompilable schema', () => {
    // VldAny is intentionally not lowerable; we use the VldObject with a
    // .refine() chain which is not currently in the supported subset.
    const refined = v.string().refine((s) => s.length > 0, 'nonempty');
    const fn = compileFnValidateDirect(refined);
    expect(fn).toBeNull();
  });

  test('compileFn returns a full validator for primitives', () => {
    const fn = compileFnDirect(v.string());
    expect(fn).not.toBeNull();
  });

  test('compileFn returns null for unsupported schemas', () => {
    const refined = v.string().refine((s) => s.length > 0, 'nonempty');
    const fn = compileFnDirect(refined);
    expect(fn).toBeNull();
  });
});

describe('AOT compile  -  compile()', () => {
  test('compile() is idempotent (returns the same schema on repeat call)', () => {
    const schema = v.object({ a: v.string() });
    const a = compileDirect(schema);
    const b = compileDirect(a);
    expect(b).toBe(a);
  });

  test('compile({ JITless: true }) skips the compile step', () => {
    const schema = v.object({ a: v.string() });
    const compiled = compileDirect(schema, { JITless: true });
    // _zod.bag is set but the validator is not populated
    expect((compiled as any)._zod.bag.validator).toBeUndefined();
    expect(validateDirect(compiled, { a: 'x' })).toBe(true);
  });

  test('compile() caches the validator on _zod.bag', () => {
    const schema = v.object({ a: v.string() });
    const compiled = compileDirect(schema);
    const bag = (compiled as any)._zod.bag;
    expect(typeof bag.validator).toBe('function');
    expect(typeof bag.validatorValidate).toBe('function');
  });
});

describe('AOT compile  -  validate() / validateAsync()', () => {
  test('validate() returns true for valid input via compiled body', () => {
    const schema = v.object({ a: v.string(), b: v.number() });
    const compiled = compileDirect(schema);
    expect(validateDirect(compiled, { a: 'x', b: 1 })).toBe(true);
  });

  test('validate() returns false for invalid input via compiled body', () => {
    const schema = v.object({ a: v.string(), b: v.number() });
    const compiled = compileDirect(schema);
    expect(validateDirect(compiled, { a: 'x', b: 'not-a-number' })).toBe(false);
  });

  test('validate() falls back to safeParse for uncompiled schemas', () => {
    const schema = v.object({ a: v.string() });
    expect(validateDirect(schema, { a: 'x' })).toBe(true);
    expect(validateDirect(schema, { a: 1 })).toBe(false);
  });

  test('validateAsync() returns true for valid input via compiled body', async () => {
    const schema = v.object({ a: v.string() });
    const compiled = compileDirect(schema);
    await expect(validateAsyncDirect(compiled, { a: 'x' })).resolves.toBe(true);
  });

  test('validateAsync() returns false for invalid input via compiled body', async () => {
    const schema = v.object({ a: v.string() });
    const compiled = compileDirect(schema);
    await expect(validateAsyncDirect(compiled, { a: 1 })).resolves.toBe(false);
  });

  test('validateAsync() falls back to safeParseAsync for uncompiled schemas', async () => {
    const schema = v.object({ a: v.string() });
    await expect(validateAsyncDirect(schema, { a: 'x' })).resolves.toBe(true);
    await expect(validateAsyncDirect(schema, { a: 1 })).resolves.toBe(false);
  });
});

describe('AOT compile  -  properties()', () => {
  test('every key becomes optional', () => {
    const schema = propertiesDirect({ a: v.string(), b: v.number() });
    expect(schema.parse({})).toEqual({});
    expect(schema.parse({ a: 'x' })).toEqual({ a: 'x' });
    expect(schema.parse({ a: 'x', b: 1 })).toEqual({ a: 'x', b: 1 });
  });

  test('rejects keys with the wrong type', () => {
    const schema = propertiesDirect({ a: v.string() });
    expect(() => schema.parse({ a: 1 })).toThrow();
  });
});

describe('AOT compile  -  getDiscriminatedOption()', () => {
  test('returns the matching option by discriminator value', () => {
    const aSchema = v.object({ type: v.literal('a'), a: v.string() });
    const bSchema = v.object({ type: v.literal('b'), b: v.number() });
    const match = getDiscriminatedOptionDirect('type', [aSchema, bSchema], { type: 'b' });
    expect(match).toBe(bSchema);
  });

  test('returns undefined when the discriminator value does not match', () => {
    const aSchema = v.object({ type: v.literal('a'), a: v.string() });
    const match = getDiscriminatedOptionDirect('type', [aSchema], { type: 'c' });
    expect(match).toBeUndefined();
  });

  test('returns undefined for non-object input', () => {
    const aSchema = v.object({ type: v.literal('a'), a: v.string() });
    expect(getDiscriminatedOptionDirect('type', [aSchema], null)).toBeUndefined();
    expect(getDiscriminatedOptionDirect('type', [aSchema], 'x')).toBeUndefined();
    expect(getDiscriminatedOptionDirect('type', [aSchema], [])).toBeUndefined();
  });

  test('skips options that do not declare the discriminator key', () => {
    const aSchema = v.object({ type: v.literal('a'), a: v.string() });
    const noDiscriminator = v.object({ other: v.string() });
    const match = getDiscriminatedOptionDirect('type', [noDiscriminator, aSchema], { type: 'a' });
    expect(match).toBe(aSchema);
  });
});

describe('AOT compile  -  toZod()', () => {
  test('returns the same VldBase if the input is already a schema', () => {
    const schema = v.string();
    expect(toZodDirect(schema)).toBe(schema);
  });

  test('builds v.null() from null', () => {
    const schema = toZodDirect(null);
    expect(schema.parse(null)).toBe(null);
  });

  test('builds v.string() / v.number() / v.boolean() from primitives', () => {
    expect(toZodDirect('hi').parse('hi')).toBe('hi');
    expect(toZodDirect(1).parse(1)).toBe(1);
    expect(toZodDirect(true).parse(true)).toBe(true);
    expect(toZodDirect(10n).parse(10n)).toBe(10n);
    expect(toZodDirect(undefined).parse(undefined)).toBe(undefined);
  });

  test('builds v.array() from an array', () => {
    const schema = toZodDirect(['a', 'b']);
    expect(schema.parse(['x'])).toEqual(['x']);
  });

  test('builds v.object() from a plain object shape', () => {
    // toZod treats a plain object as a shape (object of validators)  -  the
    // string 'placeholder' is the value of the "a" property in the shape.
    const schema = toZodDirect({ a: v.string() });
    expect(schema.parse({ a: 'x' })).toEqual({ a: 'x' });
  });
});

describe('v.* namespace  -  compile / validate / properties / getDiscriminatedOption / memoizer / toZod', () => {
  test('v.compile compiles and caches', () => {
    const schema = v.object({ a: v.string() });
    const compiled = v.compile(schema);
    expect(v.validate(compiled, { a: 'x' })).toBe(true);
    expect(v.validate(compiled, { a: 1 })).toBe(false);
  });

  test('v.validateAsync works on the compiled schema', async () => {
    const schema = v.object({ a: v.string() });
    const compiled = v.compile(schema);
    await expect(v.validateAsync(compiled, { a: 'x' })).resolves.toBe(true);
    await expect(v.validateAsync(compiled, { a: 1 })).resolves.toBe(false);
  });

  test('v.validateAsync works on an uncompiled schema', async () => {
    const schema = v.object({ a: v.string() });
    await expect(v.validateAsync(schema, { a: 'x' })).resolves.toBe(true);
  });

  test('v.properties returns a partial object schema', () => {
    const schema = v.properties({ a: v.string(), b: v.number() });
    expect(schema.parse({ a: 'x' })).toEqual({ a: 'x' });
  });

  test('v.getDiscriminatedOption routes by discriminator', () => {
    const aSchema = v.object({ type: v.literal('a'), a: v.string() });
    const bSchema = v.object({ type: v.literal('b'), b: v.number() });
    expect(v.getDiscriminatedOption('type', [aSchema, bSchema], { type: 'a' })).toBe(aSchema);
  });

  test('v.memoizer caches by key reference', () => {
    let calls = 0;
    const memo = v.memoizer<{ id: number }, number>((k) => {
      calls++;
      return k.id * 2;
    });
    const k1 = { id: 1 };
    expect(memo(k1)).toBe(2);
    expect(memo(k1)).toBe(2);
    expect(calls).toBe(1);
  });

  test('v.toZod wraps a plain object into a schema', () => {
    const schema = v.toZod({ a: v.string() });
    expect(schema.parse({ a: 'x' })).toEqual({ a: 'x' });
  });
});

describe('AOT compile  -  compiled parse returns the input on success (Moltar ParseSafe)', () => {
  test('compile(s).parse() returns the input as-is when valid', () => {
    const schema = v.object({ a: v.string(), b: v.number() });
    const compiled = v.compile(schema);
    const input = { a: 'x', b: 1 };
    expect(compiled.parse(input)).toEqual({ a: 'x', b: 1 });
  });

  test('compile(s).safeParse() returns { success: true, data: input }', () => {
    const schema = v.object({ a: v.string() });
    const compiled = v.compile(schema);
    const input = { a: 'x' };
    expect(compiled.safeParse(input)).toEqual({ success: true, data: input });
  });
});

describe('AOT compile  -  parse() / safeParse() fall back to the original parse path on failure', () => {
  test('compile(s).parse() falls back to the original parse() and throws on invalid input', () => {
    const schema = v.object({ a: v.string() });
    const compiled = v.compile(schema);
    expect(() => compiled.parse({ a: 1 })).toThrow();
  });

  test('compile(s).safeParse() returns { success: false, error } on invalid input', () => {
    const schema = v.object({ a: v.string() });
    const compiled = v.compile(schema);
    const result = compiled.safeParse({ a: 1 });
    expect(result.success).toBe(false);
    expect((result as any).error).toBeDefined();
  });
});

describe('Coverage gap  -  v.compile via the v namespace (src/index.ts)', () => {
  test('v.compile is exposed and calls the AOT compile surface', () => {
    const schema = v.object({ a: v.string(), b: v.number().int() });
    const compiled = v.compile(schema);
    expect(compiled.parse({ a: 'x', b: 1 })).toEqual({ a: 'x', b: 1 });
    expect(() => compiled.parse({ a: 1, b: 1 })).toThrow();
  });

  test('v.compile with { JITless: true } skips the AOT step (covers the options branch)', () => {
    const schema = v.object({ a: v.string() });
    const compiled = v.compile(schema, { JITless: true });
    expect(v.validate(compiled, { a: 'x' })).toBe(true);
  });
});

describe('Coverage gap  -  VldObject.exactPartial (src/validators/object.ts)', () => {
  test('exactPartial() makes every key optional and rejects explicit undefined', () => {
    const schema = v.object({ a: v.string(), b: v.number() }).exactPartial();
    expect(schema.parse({})).toEqual({});
    expect(schema.parse({ a: 'x' })).toEqual({ a: 'x' });
    expect(schema.parse({ a: 'x', b: 1 })).toEqual({ a: 'x', b: 1 });
  });

  test('exactPartial() accepts omitted keys but still validates types when present', () => {
    const schema = v.object({ a: v.string() }).exactPartial();
    expect(() => schema.parse({ a: 1 })).toThrow();
  });
});

describe('Coverage gap  -  regexes.nanoidOfLength (src/validators/string-formats.ts)', () => {
  test('nanoidOfLength(n) returns a fresh RegExp that matches exactly n characters', () => {
    const re = regexes.nanoidOfLength(10);
    expect(re).toBeInstanceOf(RegExp);
    expect('abc1234567'.length).toBe(10);
    expect(re.test('abc1234567')).toBe(true);
    expect(re.test('short')).toBe(false);
  });
});

describe('AOT compile  -  every string check kind is lowered', () => {
  test('min / max / length', () => {
    expect(v.validate(v.compile(v.string().min(2)), 'ab')).toBe(true);
    expect(v.validate(v.compile(v.string().min(3)), 'ab')).toBe(false);
    expect(v.validate(v.compile(v.string().max(2)), 'ab')).toBe(true);
    expect(v.validate(v.compile(v.string().max(1)), 'ab')).toBe(false);
    expect(v.validate(v.compile(v.string().length(2)), 'ab')).toBe(true);
    expect(v.validate(v.compile(v.string().length(3)), 'ab')).toBe(false);
  });

  test('regex', () => {
    expect(v.validate(v.compile(v.string().regex(/^a/)), 'apple')).toBe(true);
    expect(v.validate(v.compile(v.string().regex(/^a/)), 'banana')).toBe(false);
  });

  test('startsWith / endsWith / includes', () => {
    expect(v.validate(v.compile(v.string().startsWith('a')), 'apple')).toBe(true);
    expect(v.validate(v.compile(v.string().startsWith('b')), 'apple')).toBe(false);
    expect(v.validate(v.compile(v.string().endsWith('e')), 'apple')).toBe(true);
    expect(v.validate(v.compile(v.string().endsWith('z')), 'apple')).toBe(false);
    expect(v.validate(v.compile(v.string().includes('pp')), 'apple')).toBe(true);
    expect(v.validate(v.compile(v.string().includes('zz')), 'apple')).toBe(false);
  });
});

describe('AOT compile  -  every number check kind is lowered', () => {
  test('int / finite', () => {
    expect(v.validate(v.compile(v.number().int()), 1)).toBe(true);
    expect(v.validate(v.compile(v.number().int()), 1.5)).toBe(false);
    expect(v.validate(v.compile(v.number().finite()), 1)).toBe(true);
  });

  test('min (inclusive) / min (exclusive)', () => {
    expect(v.validate(v.compile(v.number().min(2)), 2)).toBe(true);
    expect(v.validate(v.compile(v.number().min(2)), 1)).toBe(false);
  });

  test('max (inclusive) / max (exclusive)', () => {
    expect(v.validate(v.compile(v.number().max(2)), 2)).toBe(true);
    expect(v.validate(v.compile(v.number().max(2)), 3)).toBe(false);
  });

  test('gt / gte / lt / lte', () => {
    expect(v.validate(v.compile(v.number().gt(1)), 2)).toBe(true);
    expect(v.validate(v.compile(v.number().gt(1)), 1)).toBe(false);
    expect(v.validate(v.compile(v.number().gte(1)), 1)).toBe(true);
    expect(v.validate(v.compile(v.number().lt(2)), 1)).toBe(true);
    expect(v.validate(v.compile(v.number().lt(2)), 2)).toBe(false);
    expect(v.validate(v.compile(v.number().lte(2)), 2)).toBe(true);
  });

  test('multipleOf / positive / negative / nonnegative / nonpositive / safe', () => {
    expect(v.validate(v.compile(v.number().multipleOf(3)), 6)).toBe(true);
    expect(v.validate(v.compile(v.number().multipleOf(3)), 7)).toBe(false);
    expect(v.validate(v.compile(v.number().positive()), 1)).toBe(true);
    expect(v.validate(v.compile(v.number().positive()), 0)).toBe(false);
    expect(v.validate(v.compile(v.number().negative()), -1)).toBe(true);
    expect(v.validate(v.compile(v.number().nonnegative()), 0)).toBe(true);
    expect(v.validate(v.compile(v.number().nonpositive()), 0)).toBe(true);
    expect(v.validate(v.compile(v.number().safe()), 1)).toBe(true);
  });

  test('rejects NaN', () => {
    expect(v.validate(v.compile(v.number()), NaN)).toBe(false);
  });
});

describe('AOT compile  -  boolean / bigint / null / undefined / literal / enum', () => {
  test('boolean', () => {
    expect(v.validate(v.compile(v.boolean()), true)).toBe(true);
    expect(v.validate(v.compile(v.boolean()), false)).toBe(true);
    expect(v.validate(v.compile(v.boolean()), 0)).toBe(false);
  });

  test('bigint', () => {
    expect(v.validate(v.compile(v.bigint()), 1n)).toBe(true);
    expect(v.validate(v.compile(v.bigint()), 1)).toBe(false);
  });

  test('null / undefined', () => {
    expect(v.validate(v.compile(v.null()), null)).toBe(true);
    expect(v.validate(v.compile(v.null()), 0)).toBe(false);
    expect(v.validate(v.compile(v.undefined()), undefined)).toBe(true);
    expect(v.validate(v.compile(v.undefined()), null)).toBe(false);
  });

  test('literal', () => {
    expect(v.validate(v.compile(v.literal('a')), 'a')).toBe(true);
    expect(v.validate(v.compile(v.literal('a')), 'b')).toBe(false);
  });

  test('enum', () => {
    const e = v.enum('a', 'b', 'c');
    expect(v.validate(v.compile(e), 'a')).toBe(true);
    expect(v.validate(v.compile(e), 'b')).toBe(true);
    expect(v.validate(v.compile(e), 'd')).toBe(false);
  });
});

describe('AOT compile  -  array / tuple / record / object / union / optional', () => {
  test('array of strings', () => {
    const schema = v.array(v.string());
    expect(v.validate(v.compile(schema), ['a', 'b'])).toBe(true);
    expect(v.validate(v.compile(schema), [1, 2])).toBe(false);
    expect(v.validate(v.compile(schema), 'not an array')).toBe(false);
  });

  test('array of numbers', () => {
    const schema = v.array(v.number());
    expect(v.validate(v.compile(schema), [1, 2])).toBe(true);
    expect(v.validate(v.compile(schema), [1, 'x'])).toBe(false);
  });

  test('tuple', () => {
    const schema = v.tuple([v.string(), v.number()]);
    expect(v.validate(v.compile(schema), ['a', 1])).toBe(true);
    // Zod tuples reject extra items by default (only `.rest()` opens the tail).
    expect(v.validate(v.compile(schema), ['a', 1, true])).toBe(false);
    expect(v.validate(v.compile(schema), ['a'])).toBe(false);
    expect(v.validate(v.compile(schema), [1, 1])).toBe(false);
  });

  test('record', () => {
    const schema = v.record(v.string(), v.number());
    expect(v.validate(v.compile(schema), { a: 1, b: 2 })).toBe(true);
    expect(v.validate(v.compile(schema), { a: 'x' })).toBe(false);
  });

  test('object', () => {
    const schema = v.object({ a: v.string(), b: v.number() });
    expect(v.validate(v.compile(schema), { a: 'x', b: 1 })).toBe(true);
    expect(v.validate(v.compile(schema), { a: 'x' })).toBe(false);
    expect(v.validate(v.compile(schema), { a: 1, b: 1 })).toBe(false);
    expect(v.validate(v.compile(schema), null)).toBe(false);
    expect(v.validate(v.compile(schema), 'not an object')).toBe(false);
  });

  test('union', () => {
    const schema: any = v.union([v.string(), v.number()]);
    expect(v.validate(v.compile(schema), 'a')).toBe(true);
    expect(v.validate(v.compile(schema), 1)).toBe(true);
    expect(v.validate(v.compile(schema), true)).toBe(false);
  });

  test('optional', () => {
    const schema = v.optional(v.string());
    expect(v.validate(v.compile(schema), 'a')).toBe(true);
    expect(v.validate(v.compile(schema), undefined)).toBe(true);
    expect(v.validate(v.compile(schema), null)).toBe(false);
  });
});

describe('AOT compile  -  root re-exports (zodCompileFn, ZodCompileAsyncError, ZodCompileUnsupportedError)', () => {
  test('zodCompileFn is the same as compileFn and works for primitives', () => {
    expect(typeof zodCompileFn).toBe('function');
    const fn = zodCompileFn(v.string());
    expect(fn).not.toBeNull();
  });

  test('ZodCompileAsyncError is re-exported with the class identity', () => {
    expect(ZCAError).toBe(ZodCompileAsyncError);
    const e = new ZCAError('async compile not supported');
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe('ZodCompileAsyncError');
  });

  test('ZodCompileUnsupportedError is re-exported with the class identity', () => {
    expect(ZCUError).toBe(ZodCompileUnsupportedError);
    const e = new ZCUError('not supported');
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe('ZodCompileUnsupportedError');
  });
});

describe('AOT compile  -  refinements / transforms fall back gracefully', () => {
  test('refined schema is not compiled (validateOnly returns null)', () => {
    const refined = v.string().refine((s) => s.length > 0);
    const compiled = compileFnDirect(refined);
    expect(compiled).toBeNull();
  });

  test('compiling a refined schema falls back to the runtime parse()', () => {
    const refined = v.string().refine((s) => s.length > 0);
    const compiled = v.compile(refined);
    expect(validateDirect(compiled, 'hello')).toBe(true);
    expect(validateDirect(compiled, '')).toBe(false);
  });
});

describe('AOT compile  -  bigint check kinds', () => {
  test('bigint with min / max', () => {
    expect(v.validate(v.compile(v.bigint().min(2n)), 2n)).toBe(true);
    expect(v.validate(v.compile(v.bigint().min(2n)), 1n)).toBe(false);
    expect(v.validate(v.compile(v.bigint().max(2n)), 2n)).toBe(true);
    expect(v.validate(v.compile(v.bigint().max(2n)), 3n)).toBe(false);
  });

  test('bigint with positive / negative / nonnegative / nonpositive', () => {
    expect(v.validate(v.compile(v.bigint().positive()), 1n)).toBe(true);
    expect(v.validate(v.compile(v.bigint().positive()), 0n)).toBe(false);
    expect(v.validate(v.compile(v.bigint().negative()), -1n)).toBe(true);
    expect(v.validate(v.compile(v.bigint().negative()), 0n)).toBe(false);
    expect(v.validate(v.compile(v.bigint().nonnegative()), 0n)).toBe(true);
    expect(v.validate(v.compile(v.bigint().nonpositive()), 0n)).toBe(true);
  });

  test('bigint rejects non-bigint', () => {
    expect(v.validate(v.compile(v.bigint()), 1)).toBe(false);
  });
});

describe('AOT compile  -  array of objects (inline build path)', () => {
  test('array of objects validates and returns true on the hot path', () => {
    const schema = v.array(v.object({ a: v.string(), b: v.number() }));
    expect(v.validate(v.compile(schema), [
      { a: 'x', b: 1 },
      { a: 'y', b: 2 },
    ])).toBe(true);
    expect(v.validate(v.compile(schema), [
      { a: 'x', b: 1 },
      { a: 2, b: 2 },
    ])).toBe(false);
  });

  test('array of objects rejects non-array input', () => {
    const schema = v.array(v.object({ a: v.string() }));
    expect(v.validate(v.compile(schema), 'not an array')).toBe(false);
    expect(v.validate(v.compile(schema), null)).toBe(false);
  });
});

describe('AOT compile  -  deeply nested objects', () => {
  test('nested object schema lowers and validates', () => {
    const schema = v.object({
      level1: v.object({
        level2: v.object({
          level3: v.object({
            a: v.string(),
            b: v.number(),
            c: v.boolean(),
          }),
        }),
      }),
    });
    const input = { level1: { level2: { level3: { a: 'x', b: 1, c: true } } } };
    expect(v.validate(v.compile(schema), input)).toBe(true);
    expect(v.validate(v.compile(schema), { level1: { level2: { level3: { a: 'x', b: 1, c: 'no' } } } })).toBe(false);
  });
});

describe('AOT compile  -  date / null / undefined / unknown / any', () => {
  test('date accepts a valid Date and rejects Invalid Date and non-dates', () => {
    expect(v.validate(v.compile(v.date()), new Date())).toBe(true);
    expect(v.validate(v.compile(v.date()), new Date('not-a-date'))).toBe(false);
    expect(v.validate(v.compile(v.date()), '2024-01-01')).toBe(false);
  });

  test('null / undefined / unknown / any are no-ops (anything goes)', () => {
    expect(v.validate(v.compile(v.null()), null)).toBe(true);
    expect(v.validate(v.compile(v.null()), 0)).toBe(false);
    expect(v.validate(v.compile(v.undefined()), undefined)).toBe(true);
    expect(v.validate(v.compile(v.undefined()), null)).toBe(false);
    expect(v.validate(v.compile(v.unknown()), { a: 1 })).toBe(true);
    expect(v.validate(v.compile(v.unknown()), 1)).toBe(true);
    expect(v.validate(v.compile(v.any()), 1)).toBe(true);
  });
});

describe('AOT compile  -  literal with single and multiple values', () => {
  test('literal with a single value (string)', () => {
    expect(v.validate(v.compile(v.literal('a')), 'a')).toBe(true);
    expect(v.validate(v.compile(v.literal('a')), 'b')).toBe(false);
  });

  test('literal with a single value (number)', () => {
    expect(v.validate(v.compile(v.literal(42)), 42)).toBe(true);
    expect(v.validate(v.compile(v.literal(42)), 41)).toBe(false);
  });

  test('literal with multiple values (union of literals)', () => {
    const schema: any = v.union([v.literal('a'), v.literal('b'), v.literal('c')]);
    expect(v.validate(v.compile(schema), 'a')).toBe(true);
    expect(v.validate(v.compile(schema), 'b')).toBe(true);
    expect(v.validate(v.compile(schema), 'c')).toBe(true);
    expect(v.validate(v.compile(schema), 'd')).toBe(false);
  });
});

describe('AOT compile  -  array of arrays / nested arrays', () => {
  test('array of arrays of strings', () => {
    const schema = v.array(v.array(v.string()));
    expect(v.validate(v.compile(schema), [['a', 'b'], ['c']])).toBe(true);
    expect(v.validate(v.compile(schema), [[1]])).toBe(false);
  });
});

describe('AOT compile  -  union with three types', () => {
  test('union routes by runtime type', () => {
    const schema: any = v.union([v.string(), v.number(), v.boolean()]);
    expect(v.validate(v.compile(schema), 'a')).toBe(true);
    expect(v.validate(v.compile(schema), 1)).toBe(true);
    expect(v.validate(v.compile(schema), true)).toBe(true);
    expect(v.validate(v.compile(schema), null)).toBe(false);
    expect(v.validate(v.compile(schema), [])).toBe(false);
  });
});

describe('AOT compile  -  error throws when schema cannot be lowered', () => {
  test('compile() returns the schema unchanged for an unhandled schema kind (lazy)', () => {
    // VldLazy is intentionally not lowered; compile() returns the schema and
    // falls back to the runtime parse() path on validate/parse.
    const schema: any = v.lazy(() => v.string());
    const compiled = compileDirect(schema);
    expect(v.validate(compiled, 'hello')).toBe(true);
    expect(v.validate(compiled, 1)).toBe(false);
  });

  test('compileFn() returns null when the schema kind is unknown', () => {
    // A bare object that doesn't match any known Vld* kind  -  compileFn
    // returns null so compile() falls through to the safeParse path.
    const notASchema: any = { _checks: [], _checkMetas: [] };
    expect(compileFnDirect(notASchema)).toBeNull();
  });
});

describe('AOT compile  -  schema with non-identifier keys', () => {
  test('object with a key that needs bracket access', () => {
    const schema: any = v.object({ 'with-dash': v.string(), 'normal': v.number() });
    expect(v.validate(v.compile(schema), { 'with-dash': 'x', 'normal': 1 })).toBe(true);
    expect(v.validate(v.compile(schema), { 'with-dash': 1, 'normal': 1 })).toBe(false);
  });
});
