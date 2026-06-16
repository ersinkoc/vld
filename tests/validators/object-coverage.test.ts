/**
 * Coverage tests for VldObject validator
 * These tests target specific uncovered lines in object.ts
 */

import { v } from '../../src';

describe('VldObject Coverage Tests', () => {
  describe('strict mode (safeParse path)', () => {
    it('should reject extra keys in strict mode', () => {
      const schema = v.object({
        name: v.string()
      }).strict();

      const result = schema.safeParse({
        name: 'John',
        extra: 'value'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('extra');
      }
    });
  });

  describe('passthrough mode (safeParse path)', () => {
    it('should allow extra keys in passthrough mode', () => {
      const schema = v.object({
        name: v.string()
      }).passthrough();

      const result = schema.safeParse({
        name: 'John',
        extra: 'value'
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          name: 'John',
          extra: 'value'
        });
      }
    });

    it('should filter dangerous keys in passthrough mode', () => {
      const schema = v.object({
        name: v.string()
      }).passthrough();

      // Create object without prototype to test dangerous keys
      const input = Object.create(null);
      input.name = 'John';
      input.safe = 'value';

      const result = schema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        // Should include safe keys
        expect(result.data.name).toBe('John');
        expect((result.data as any).safe).toBe('value');
      }
    });
  });

  describe('catchall mode (safeParse path)', () => {
    it('should validate extra keys with catchall validator', () => {
      const schema = v.object({
        name: v.string()
      }).catchall(v.number());

      const result = schema.safeParse({
        name: 'John',
        age: 30,
        score: 100
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          name: 'John',
          age: 30,
          score: 100
        });
      }
    });

    it('should reject extra keys that fail catchall validation', () => {
      const schema = v.object({
        name: v.string()
      }).catchall(v.number());

      const result = schema.safeParse({
        name: 'John',
        invalid: 'not a number'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('invalid');
      }
    });

    it('should filter dangerous keys in catchall mode', () => {
      const schema = v.object({
        name: v.string()
      }).catchall(v.string());

      // Create object without prototype to test dangerous keys
      const input = Object.create(null);
      input.name = 'John';
      input.safe = 'value';

      const result = schema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('John');
        expect(result.data.safe).toBe('value');
      }
    });
  });

  describe('parse() path with coercion validators', () => {
    it('should handle coercion validator errors in parse()', () => {
      const schema = v.object({
        count: v.coerce.number()
      });

      // This should fail because 'invalid' cannot be coerced to number
      expect(() => schema.parse({
        count: 'not-a-number'
      })).toThrow();
    });
  });

  describe('parse() path with date validators', () => {
    it('should handle date validator errors in parse()', () => {
      const schema = v.object({
        createdAt: v.date()
      });

      // This should fail because 'invalid' is not a valid date
      expect(() => schema.parse({
        createdAt: 'invalid-date'
      })).toThrow();
    });
  });

  describe('parse() simple field fast paths', () => {
    it('should parse all simple field modes through the fast path', () => {
      const schema = v.object({
        name: v.string(),
        count: v.number(),
        active: v.boolean(),
        kind: v.literal('user')
      });

      expect(schema.parse({
        name: 'Ada',
        count: 42,
        active: true,
        kind: 'user'
      })).toEqual({
        name: 'Ada',
        count: 42,
        active: true,
        kind: 'user'
      });
    });

    it('should report object field errors for simple number, boolean, and literal failures', () => {
      expect(() => v.object({ name: v.string() }).parse({ name: 1 })).toThrow('name');
      expect(() => v.object({ count: v.number() }).parse({ count: NaN })).toThrow('count');
      expect(() => v.object({ active: v.boolean() }).parse({ active: 'yes' })).toThrow('active');
      expect(() => v.object({ kind: v.literal('user') }).parse({ kind: 'admin' })).toThrow('kind');
    });

    it('should parse literal-string-number specialized objects through the fast path', () => {
      const schema = v.object({
        type: v.literal('user'),
        name: v.string(),
        score: v.number()
      });

      expect(schema.parse({ type: 'user', name: 'Ada', score: 42 })).toEqual({
        type: 'user',
        name: 'Ada',
        score: 42
      });

      expect(() => schema.parse({ type: 'admin', name: 'Ada', score: 42 })).toThrow('type');
      expect(() => schema.parse({ type: 'user', name: 1, score: 42 })).toThrow('name');
      expect(() => schema.parse({ type: 'user', name: 'Ada', score: NaN })).toThrow('score');
    });

    it('should parse primitive scalar simple fields through object fast paths', () => {
      const token = Symbol('token');
      const schema = v.object({
        id: v.bigint(),
        token: v.symbol(),
        nil: v.null(),
        undef: v.undefined(),
        empty: v.void()
      });

      const payload = {
        id: 1n,
        token,
        nil: null,
        undef: undefined,
        empty: undefined
      };

      expect(schema.parse(payload)).toEqual(payload);
      expect(schema.safeParse(payload)).toEqual({ success: true, data: payload });
      expect(() => schema.parse({ ...payload, id: 1 })).toThrow('id');
      expect(() => schema.parse({ ...payload, token: 'token' })).toThrow('token');
      expect(() => schema.parse({ ...payload, nil: undefined })).toThrow('nil');
      expect(() => schema.parse({ ...payload, undef: null })).toThrow('undef');
      expect(() => schema.parse({ ...payload, empty: null })).toThrow('empty');
    });

    it('should parse primitive scalar simple fields when object mode disables the simple-object fast path', () => {
      const token = Symbol('token');
      const schema = v.object({
        count: v.number(),
        active: v.boolean(),
        id: v.bigint(),
        token: v.symbol(),
        nil: v.null(),
        undef: v.undefined(),
        empty: v.void()
      }).strict();

      const payload = {
        count: 42,
        active: true,
        id: 1n,
        token,
        nil: null,
        undef: undefined,
        empty: undefined
      };

      expect(schema.parse(payload)).toEqual(payload);
      expect(schema.safeParse(payload)).toEqual({ success: true, data: payload });
      expect(() => schema.parse({ ...payload, count: Number.NaN })).toThrow('count');
      expect(() => schema.parse({ ...payload, active: 'true' })).toThrow('active');
      expect(() => schema.parse({ ...payload, id: 1 })).toThrow('id');
      expect(() => schema.parse({ ...payload, token: 'token' })).toThrow('token');
      expect(() => schema.parse({ ...payload, nil: undefined })).toThrow('nil');
      expect(() => schema.parse({ ...payload, undef: null })).toThrow('undef');
      expect(() => schema.parse({ ...payload, empty: null })).toThrow('empty');
    });
  });

  describe('checked field fast paths', () => {
    it('should validate known constrained boolean fields without changing output', () => {
      const schema = v.object({
        enabled: v.boolean().true()
      });

      expect(schema.parse({ enabled: true })).toEqual({ enabled: true });
      expect(schema.safeParse({ enabled: false }).success).toBe(false);
      expect(() => schema.parse({ enabled: 'true' })).toThrow('Value must be true');
    });

    it('should validate checked string and number fields through parse and safeParse', () => {
      const schema = v.object({
        email: v.string().email(),
        age: v.number().positive()
      });

      expect(schema.parse({ email: 'ada@example.com', age: 36 })).toEqual({
        email: 'ada@example.com',
        age: 36
      });

      const valid = schema.safeParse({ email: 'ada@example.com', age: 36 });
      expect(valid.success).toBe(true);

      expect(() => schema.parse({ email: 'invalid', age: 36 })).toThrow('Invalid field "email"');
      const invalid = schema.safeParse({ email: 'ada@example.com', age: -1 });
      expect(invalid.success).toBe(false);
      if (!invalid.success) {
        expect(invalid.error.message).toContain('Invalid field "age"');
      }
    });

    it('should validate known nested object and array fields without changing output', () => {
      const schema = v.object({
        id: v.string(),
        profile: v.object({
          name: v.string(),
          age: v.number().positive()
        }),
        tags: v.array(v.string())
      });

      expect(schema.parse({
        id: 'usr_1',
        profile: { name: 'Ada', age: 36 },
        tags: ['admin', 'editor']
      })).toEqual({
        id: 'usr_1',
        profile: { name: 'Ada', age: 36 },
        tags: ['admin', 'editor']
      });

      expect(() => schema.parse({
        id: 'usr_1',
        profile: { name: 'Ada', age: -1 },
        tags: ['admin']
      })).toThrow('Invalid field "profile"');

      expect(() => schema.parse({
        id: 'usr_1',
        profile: { name: 'Ada', age: 36 },
        tags: ['admin', 123]
      })).toThrow('Invalid field "tags"');
    });

    it('should use the standard-validator safeParse fast path for nested fields', () => {
      const schema = v.object({
        id: v.string(),
        profile: v.object({
          name: v.string(),
          age: v.number().positive()
        }),
        tags: v.array(v.string())
      });

      expect(schema.safeParse({
        id: 'usr_1',
        profile: { name: 'Ada', age: 36 },
        tags: ['admin']
      })).toEqual({
        success: true,
        data: {
          id: 'usr_1',
          profile: { name: 'Ada', age: 36 },
          tags: ['admin']
        }
      });

      const result = schema.safeParse({
        id: 'usr_1',
        profile: { name: 'Ada', age: 36 },
        tags: ['admin', 123]
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Invalid field "tags"');
      }
    });
  });

  describe('dangerous key filtering in passthrough', () => {
    it('filters the canonical prototype-pollution sinks', () => {
      const schema = v.object({
        name: v.string()
      }).passthrough();

      const input: Record<string, unknown> = Object.create(null);
      input['name'] = 'John';
      input['__proto__'] = { polluted: true };
      input['constructor'] = 'hacked';
      input['prototype'] = 'exploited';

      const result = schema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(Object.keys(result.data)).not.toContain('__proto__');
        expect(Object.keys(result.data)).not.toContain('constructor');
        expect(Object.keys(result.data)).not.toContain('prototype');
        expect(result.data['name']).toBe('John');
        expect((Object.prototype as any).polluted).toBeUndefined();
      }
    });

    it('preserves dotted property names (they cannot pollute the prototype)', () => {
      const schema = v.object({
        name: v.string()
      }).passthrough();

      const input: Record<string, unknown> = Object.create(null);
      input['name'] = 'John';
      input['constructor.prototype'] = 'literal-key';
      input['__proto__.polluted'] = 'value';

      const result = schema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(Object.keys(result.data)).toEqual(
          expect.arrayContaining(['name', 'constructor.prototype', '__proto__.polluted'])
        );
      }
    });

    it('preserves keys named after Object.prototype methods', () => {
      const schema = v.object({
        name: v.string()
      }).passthrough();

      const input: Record<string, unknown> = Object.create(null);
      input['name'] = 'John';
      input['hasOwnProperty'] = 'data';
      input['toString'] = 'display name';

      const result = schema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(Object.keys(result.data)).toEqual(
          expect.arrayContaining(['name', 'hasOwnProperty', 'toString'])
        );
      }
    });
  });

  describe('catchall mode in parse()', () => {
    it('should validate extra keys with catchall in parse()', () => {
      const schema = v.object({
        name: v.string()
      }).catchall(v.number());

      const result = schema.parse({
        name: 'John',
        age: 30
      });

      expect(result).toEqual({
        name: 'John',
        age: 30
      });
    });

    it('should reject extra keys that fail catchall validation in parse()', () => {
      const schema = v.object({
        name: v.string()
      }).catchall(v.number());

      expect(() => schema.parse({
        name: 'John',
        age: 'old'
      })).toThrow('age');
    });

    it('should filter dangerous keys in catchall parse()', () => {
      const schema = v.object({
        name: v.string()
      }).catchall(v.string());

      const result = schema.parse({
        name: 'John',
        safe: 'ok',
        prototype: 'bad'
      });

      expect(result).not.toHaveProperty('prototype');
    });
  });

  describe('passthrough mode in parse()', () => {
    it('should pass extra keys in passthrough parse()', () => {
      const schema = v.object({
        name: v.string()
      }).passthrough();

      const result = schema.parse({
        name: 'John',
        extra: 'value'
      });

      expect(result).toEqual({
        name: 'John',
        extra: 'value'
      });
    });
  });

  describe('parseKnownObject optimized discriminator path', () => {
    it('should skip a trusted literal field only when the value matches exactly', () => {
      const schema = v.object({
        type: v.literal('user'),
        name: v.string()
      });

      expect((schema as any).parseKnownObject({ type: 'user', name: 'Ada' }, 'type')).toEqual({
        type: 'user',
        name: 'Ada'
      });

      expect(() => {
        (schema as any).parseKnownObject({ type: 'admin', name: 'Ada' }, 'type');
      }).toThrow('type');
    });

    it('should still validate trusted non-literal fields through the normal parser', () => {
      const schema = v.object({
        name: v.string().min(3)
      });

      expect(() => {
        (schema as any).parseKnownObject({ name: 'Al' }, 'name');
      }).toThrow('name');
    });
  });

  describe('getter and invalid field fallback paths', () => {
    it('should resolve getter-based schemas at parse time', () => {
      const schema = v.object({
        get name() {
          return v.string().min(2);
        }
      } as any);

      expect(schema.parse({ name: 'Ada' })).toEqual({ name: 'Ada' });
      expect(() => schema.parse({ name: 'A' })).toThrow('name');
    });

    it('should reject fields whose getter does not return a validator', () => {
      const schema = v.object({
        get broken() {
          return undefined;
        }
      } as any);

      expect(() => schema.parse({ broken: 'value' })).toThrow('Invalid validator for field "broken"');
      const result = schema.safeParse({ broken: 'value' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Invalid validator for field "broken"');
      }
    });

    it('should fall back to unknown validator type when shape getters throw during construction', () => {
      let initialized = false;
      const schema = v.object({
        get value() {
          if (!initialized) {
            throw new Error('not ready');
          }
          return v.string();
        }
      } as any);

      initialized = true;

      expect(schema.safeParse({ value: 'ready' }).success).toBe(true);
      expect(schema.safeParse({ value: 123 }).success).toBe(false);
    });

    it('should convert thrown field safeParse errors into safe failures', () => {
      const throwingValidator = {
        validatorType: 'custom',
        safeParse() {
          throw new Error('custom failure');
        }
      };
      const schema = v.object({
        value: throwingValidator
      } as any);

      const result = schema.safeParse({ value: 'input' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('custom failure');
      }
    });

    it('should convert thrown catchall safeParse errors into safe failures', () => {
      const throwingValidator = {
        parse() {
          throw new Error('custom failure');
        },
        safeParse() {
          throw new Error('catchall failure');
        }
      };
      const schema = v.object({ known: v.string() }).catchall(throwingValidator as any);

      const result = schema.safeParse({ known: 'ok', extra: 'input' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('catchall failure');
      }
    });
  });

  describe('shape getter', () => {
    it('should return the shape object', () => {
      const schema = v.object({
        name: v.string(),
        age: v.number()
      });

      const shape = schema.shape;
      expect(Object.keys(shape)).toEqual(['name', 'age']);
    });

    it('should expose precomputed shape key metadata', () => {
      const schema = v.object({
        name: v.string(),
        age: v.number()
      });

      expect(schema.shapeKeys).toEqual(['name', 'age']);
      expect(schema.shapeKeysSet.has('name')).toBe(true);
      expect(schema.shapeKeysSet.has('missing')).toBe(false);
    });
  });

  describe('non-VldBase fallback safeParse paths', () => {
    const customPassThroughValidator = {
      validatorType: 'custom',
      safeParse(value: unknown) {
        if (value === 'bad') {
          return { success: false, error: new Error('custom bad value') };
        }
        return { success: true, data: `custom:${String(value)}` };
      }
    };

    it('should reject non-object input before fallback validation', () => {
      const schema = v.object({
        value: customPassThroughValidator
      } as any);

      expect(schema.safeParse(null).success).toBe(false);
      expect(schema.safeParse([]).success).toBe(false);
    });

    it('should parse fields through non-VldBase safeParse validators', () => {
      const schema = v.object({
        value: customPassThroughValidator
      } as any);

      expect(schema.safeParse({ value: 123 })).toEqual({
        success: true,
        data: { value: 'custom:123' }
      });

      const result = schema.safeParse({ value: 'bad' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('custom bad value');
      }
    });

    it('should return a safe failure when simple fallback fields are invalid', () => {
      const schema = v.object({
        name: v.string(),
        value: customPassThroughValidator
      } as any);

      const result = schema.safeParse({ name: 123, value: 'ok' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('name');
        expect(result.error.message).toContain('Invalid string');
      }
    });

    it('should apply strict and passthrough modes in the fallback path', () => {
      const strictSchema = v.object({
        value: customPassThroughValidator
      } as any).strict();
      const passthroughSchema = v.object({
        value: customPassThroughValidator
      } as any).passthrough();

      expect(strictSchema.safeParse({ value: 'ok', extra: true }).success).toBe(false);
      expect(passthroughSchema.safeParse({ value: 'ok', extra: true })).toEqual({
        success: true,
        data: { value: 'custom:ok', extra: true }
      });
    });

    it('should apply VldBase catchall validators in the fallback path', () => {
      const schema = v.object({
        value: customPassThroughValidator
      } as any).catchall(v.number());

      expect(schema.safeParse({ value: 'ok', extra: 1 })).toEqual({
        success: true,
        data: { value: 'custom:ok', extra: 1 }
      });

      const result = schema.safeParse({ value: 'ok', extra: 'nope' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('extra');
      }
    });

    it('should apply non-VldBase catchall validators in the fallback path', () => {
      const catchallValidator = {
        safeParse(value: unknown) {
          if (value === 'bad') {
            return { success: false, error: new Error('catchall bad value') };
          }
          return { success: true, data: `extra:${String(value)}` };
        }
      };
      const schema = v.object({
        value: customPassThroughValidator
      } as any).catchall(catchallValidator as any);

      expect(schema.safeParse({ value: 'ok', extra: 1 })).toEqual({
        success: true,
        data: { value: 'custom:ok', extra: 'extra:1' }
      });

      const result = schema.safeParse({ value: 'ok', extra: 'bad' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('catchall bad value');
      }
    });
  });

  describe('private helper coverage', () => {
    it('should expose simple field error messages for all simple modes', () => {
      const schema = v.object({ value: v.string() }) as any;

      expect(schema.getSimpleFieldError('string')).toBe('Invalid string');
      expect(schema.getSimpleFieldError('number')).toBe('Invalid number');
      expect(schema.getSimpleFieldError('boolean')).toBe('Invalid boolean');
      expect(schema.getSimpleFieldError('bigint')).toBe('Invalid bigint');
      expect(schema.getSimpleFieldError('symbol')).toBe('Invalid symbol');
      expect(schema.getSimpleFieldError('undefinedValue')).toBe('Expected undefined');
      expect(schema.getSimpleFieldError('passthrough')).toBe('Invalid object');
      expect(schema.getSimpleFieldError(undefined)).toBe('Invalid object');
    });

    it('should resolve uncached field validators when no index is supplied', () => {
      const schema = v.object({ value: v.string() }) as any;

      expect(schema.getFieldValidator('value')).toBe(schema.shape.value);
      expect(() => schema.getFieldValidator('missing')).toThrow('Invalid validator for field "missing"');
    });

    it('should treat shape access failures as missing validators', () => {
      const schema = v.object({ value: v.string() }) as any;

      schema._config.shape = new Proxy(schema._config.shape, {
        getOwnPropertyDescriptor() {
          throw new Error('descriptor failure');
        }
      });

      expect(schema.tryGetFieldValidator('value')).toBeUndefined();
    });

    it('should catch validator getter failures during direct resolution', () => {
      const schema = v.object({ value: v.string() }) as any;
      schema._config.shape = Object.defineProperty({}, 'value', {
        enumerable: true,
        get() {
          throw new Error('getter failure');
        }
      });

      expect(schema.resolveFieldValidator('value')).toBeUndefined();
    });

    it('should keep defensive parser guards stable for unknown simple modes', () => {
      const fastSchema = v.object({ value: v.string() }) as any;
      fastSchema._simpleFieldModes[0] = 'unsupported';
      expect(() => fastSchema.parse({ value: 'ok' })).toThrow('value');

      const strictSchema = v.object({ value: v.string() }).strict() as any;
      strictSchema._simpleFieldModes[0] = 'unsupported';
      expect(strictSchema.parse({ value: 'ok' })).toEqual({});
    });

    it('should dispatch parseCheckedField through remaining known-value helpers', () => {
      const schema = v.object({ value: v.string() }) as any;
      const token = Symbol('token');
      const fn = () => 'ok';
      const map = new Map([[1, 'one']]);
      const set = new Set(['one']);

      expect(schema.parseCheckedField(v.symbol(), 'symbol', token)).toBe(token);
      expect(schema.parseCheckedField(v.function(), 'function', fn)).toBe(fn);
      expect(schema.parseCheckedField(v.tuple(v.string(), v.number()), 'tuple', ['a', 1])).toEqual(['a', 1]);
      expect(schema.parseCheckedField(v.record(v.string()), 'record', { a: 'one' })).toEqual({ a: 'one' });
      expect(schema.parseCheckedField(v.set(v.string()), 'set', set)).toEqual(set);
      expect(schema.parseCheckedField(v.map(v.number(), v.string()), 'map', map)).toEqual(map);
    });

    it('should fall back to generic parse when known-value helpers are absent', () => {
      const schema = v.object({ value: v.string() }) as any;
      const fileLike = { size: 1, type: 'text/plain' };
      const date = new Date('2024-01-01T00:00:00.000Z');
      const cases: Array<[string, unknown]> = [
        ['string', 'ok'],
        ['number', 1],
        ['boolean', true],
        ['bigint', BigInt(1)],
        ['symbol', Symbol('token')],
        ['function', () => 'ok'],
        ['file', fileLike],
        ['date', date],
        ['object', { value: true }],
        ['array', ['ok']],
        ['tuple', ['ok', 1]],
        ['record', { value: 'ok' }],
        ['set', new Set(['ok'])],
        ['map', new Map([['key', 'value']])]
      ];

      for (const [type, value] of cases) {
        const fallbackValidator = {
          parse: jest.fn((input: unknown) => input)
        };

        expect(schema.parseCheckedField(fallbackValidator, type, value)).toBe(value);
        expect(fallbackValidator.parse).toHaveBeenCalledWith(value);
      }
    });

    it('should skip file fast-path parsing for incomplete file-like objects', () => {
      const schema = v.object({ value: v.string() }) as any;
      const fallbackValidator = {
        parse: jest.fn((input: unknown) => input)
      };
      const value = { size: 1 };

      expect(schema.parseCheckedField(fallbackValidator, 'file', value)).toBe(value);
      expect(fallbackValidator.parse).toHaveBeenCalledWith(value);
    });

    it('should exercise safeParse fallback simple modes and defensive failures', () => {
      const schema = v.object({
        text: v.string(),
        count: v.number(),
        enabled: v.boolean(),
        amount: v.bigint(),
        token: v.symbol(),
        nil: v.null(),
        undef: v.undefined(),
        kind: v.literal('user'),
        payload: v.any()
      }).strict() as any;
      const token = Symbol('token');
      schema._canUseSafeParseFastPath = false;

      expect(schema.safeParse({
        text: 'ok',
        count: 1,
        enabled: true,
        amount: BigInt(1),
        token,
        nil: null,
        undef: undefined,
        kind: 'user',
        payload: { nested: true }
      })).toEqual({
        success: true,
        data: {
          text: 'ok',
          count: 1,
          enabled: true,
          amount: BigInt(1),
          token,
          nil: null,
          undef: undefined,
          kind: 'user',
          payload: { nested: true }
        }
      });

      expect(schema.safeParse({ text: 1 }).success).toBe(false);
      expect(schema.safeParse({ text: 'ok', count: Number.NaN }).success).toBe(false);
      expect(schema.safeParse({ text: 'ok', count: 1, enabled: 'yes' }).success).toBe(false);
      expect(schema.safeParse({ text: 'ok', count: 1, enabled: true, amount: 1 }).success).toBe(false);
      expect(schema.safeParse({
        text: 'ok',
        count: 1,
        enabled: true,
        amount: BigInt(1),
        token: 'token'
      }).success).toBe(false);
      expect(schema.safeParse({
        text: 'ok',
        count: 1,
        enabled: true,
        amount: BigInt(1),
        token,
        nil: undefined
      }).success).toBe(false);
      expect(schema.safeParse({
        text: 'ok',
        count: 1,
        enabled: true,
        amount: BigInt(1),
        token,
        nil: null,
        undef: null
      }).success).toBe(false);
      expect(schema.safeParse({
        text: 'ok',
        count: 1,
        enabled: true,
        amount: BigInt(1),
        token,
        nil: null,
        undef: undefined,
        kind: 'admin'
      }).success).toBe(false);

      schema._validators[0] = undefined;
      schema._config.shape = {
        text: {
          safeParse() {
            throw 'validator lookup failed';
          }
        }
      };
      expect(schema.safeParse({ text: 'ok' }).success).toBe(false);

      const throwingSchema = v.object({ value: v.string().min(2) }).strict() as any;
      const throwingValidator = v.string() as any;
      throwingValidator.parseKnownString = () => {
        throw 'plain parse failure';
      };
      throwingSchema._simpleFieldModes[0] = undefined;
      throwingSchema._validatorTypes[0] = 'string';
      throwingSchema._validators[0] = throwingValidator;
      throwingSchema._canUseSafeParseFastPath = false;
      const result = throwingSchema.safeParse({ value: 'ok' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('plain parse failure');
      }
    });

    it('should convert non-Error field lookup failures into safeParse errors', () => {
      const schema = v.object({ value: v.string().min(2) }).strict() as any;
      schema._canUseSafeParseFastPath = false;
      schema._simpleFieldModes[0] = undefined;
      schema.getFieldValidator = () => {
        throw 'plain lookup failure';
      };

      const result = schema.safeParse({ value: 'ok' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('plain lookup failure');
      }
    });

    it('should reject strict extra keys in the safeParse fallback path', () => {
      const schema = v.object({
        value: {
          safeParse(input: unknown) {
            return { success: true, data: input };
          }
        } as any
      }).strict();

      expect(schema.safeParse({ value: 'ok', extra: true }).success).toBe(false);
    });

    it('should allow strict objects without extra keys in the safeParse fallback path', () => {
      const schema = v.object({
        value: {
          safeParse(input: unknown) {
            return { success: true, data: input };
          }
        } as any
      }).strict();

      expect(schema.safeParse({ value: 'ok' })).toEqual({
        success: true,
        data: { value: 'ok' }
      });
    });

    it('should convert non-Error catchall parse failures into safeParse errors', () => {
      const catchallValidator = v.string() as any;
      catchallValidator.parse = () => {
        throw 'plain catchall failure';
      };
      const schema = v.object({
        known: {
          safeParse(input: unknown) {
            return { success: true, data: input };
          }
        } as any
      }).catchall(catchallValidator);

      const result = schema.safeParse({ known: 'ok', extra: 'bad' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('plain catchall failure');
      }
    });

    it('should ignore missing keys in pick', () => {
      const schema = v.object({ value: v.string() });

      expect((schema as any).pick('missing').shape).toEqual({});
    });

    it('should parse trusted literal objects without rechecking the discriminator', () => {
      const schema = v.object({
        type: v.literal('user'),
        name: v.string()
      }) as any;

      expect(schema.parseTrustedKnownObject({ type: 'admin', name: 'Ada' }, 'type')).toEqual({
        type: 'user',
        name: 'Ada'
      });
    });

    it('should parse trusted literal-string-number objects through the specialized path', () => {
      const schema = v.object({
        type: v.literal('user'),
        name: v.string(),
        score: v.number()
      }) as any;

      expect(schema.parseTrustedKnownObject({ type: 'admin', name: 'Ada', score: 42 }, 'type')).toEqual({
        type: 'user',
        name: 'Ada',
        score: 42
      });
    });

    it('should preserve object combinator behavior', () => {
      const base = v.object({
        name: v.string(),
        age: v.number().optional(),
        nested: v.object({ flag: v.boolean() })
      });

      expect(base.partial().safeParse({}).success).toBe(true);
      expect(base.deepPartial().safeParse({ nested: {} }).success).toBe(true);
      expect(base.pick('name').parse({ name: 'Ada' })).toEqual({ name: 'Ada' });
      expect(base.omit('age').safeParse({ name: 'Ada', nested: { flag: true } }).success).toBe(true);
      expect(base.extend({ active: v.boolean() }).parse({
        name: 'Ada',
        age: 36,
        nested: { flag: true },
        active: true
      })).toEqual({
        name: 'Ada',
        age: 36,
        nested: { flag: true },
        active: true
      });
      expect(base.merge(v.object({ role: v.string() })).parse({
        name: 'Ada',
        age: 36,
        nested: { flag: true },
        role: 'admin'
      })).toEqual({
        name: 'Ada',
        age: 36,
        nested: { flag: true },
        role: 'admin'
      });
      expect(base.safeExtend({ active: v.boolean() }).safeParse({
        name: 'Ada',
        nested: { flag: true },
        active: false
      }).success).toBe(true);
      expect(() => base.safeExtend({ name: v.number() })).toThrow('safeExtend');
    });
  });

  describe('keyof method', () => {
    it('should create enum from object keys', () => {
      const schema = v.object({
        name: v.string(),
        age: v.number()
      });

      const keysEnum = schema.keyof();
      expect(keysEnum.parse('name')).toBe('name');
      expect(keysEnum.parse('age')).toBe('age');
      expect(() => keysEnum.parse('unknown')).toThrow();
    });

    it('should throw on empty object', () => {
      const schema = v.object({});

      expect(() => schema.keyof()).toThrow('Cannot create keyof enum from empty object');
    });
  });

  describe('required method', () => {
    it('should make optional fields required', () => {
      const schema = v.object({
        name: v.string(),
        age: v.number().optional()
      });

      const requiredSchema = schema.required();

      // Should fail when age is missing
      expect(requiredSchema.safeParse({ name: 'John' }).success).toBe(false);

      // Should succeed with all fields
      expect(requiredSchema.safeParse({ name: 'John', age: 30 }).success).toBe(true);
    });

    it('should reject corrupted optional fields while making fields required', () => {
      const optionalAge = v.number().optional();
      (optionalAge as any).baseValidator = null;
      const schema = v.object({
        name: v.string(),
        age: optionalAge
      });

      expect(() => schema.required()).toThrow('Invalid VldOptional structure for field "age"');
    });
  });

  describe('parse with Date fields', () => {
    it('should validate Date fields in parse path', () => {
      const schema = v.object({
        createdAt: v.date()
      });

      // Should succeed with Date object
      const result = schema.parse({ createdAt: new Date('2024-01-01') });
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should fail with invalid Date in parse path', () => {
      const schema = v.object({
        createdAt: v.date()
      });

      expect(() => schema.parse({ createdAt: 'not-a-date' })).toThrow();
    });
  });
});
