/**
 * Coverage companions for the Zod 4.6 surface: the Tajik locale catalog,
 * root-level iban/currencyCode factories, promise validate/validateAsync,
 * and the compile refusals added in 3.0.5 (strict objects, transforms).
 */

import * as v from '../src/index';

describe('Zod 4.6 coverage companions', () => {
  describe('root-level Zod 4.6 factories', () => {
    it('iban() validates with the checksum', () => {
      expect(v.iban().validate('GB82WEST12345698765432')).toBe(true);
      expect(v.iban().validate('GB82WEST12345698765433')).toBe(false);
      expect(v.iban({ message: 'Hatal\u0131 IBAN' }).safeParse('nope').error?.message).toBe('Hatal\u0131 IBAN');
      expect(v.iban().parse('TR330006100519786457841326')).toBe('TR330006100519786457841326');
    });

    it('currencyCode() validates ISO 4217 codes', () => {
      expect(v.currencyCode().validate('TRY')).toBe(true);
      expect(v.currencyCode().validate('try')).toBe(false);
      expect(v.currencyCode({ message: 'not a currency code' }).safeParse('XX').error?.message).toBe('not a currency code');
      expect(v.z.currencyCode().validate('USD')).toBe(true);
      expect(v.z.iban({ message: 'invalid IBAN' }).validate('GB82WEST12345698765433')).toBe(false);
    });

    it('exposes withParser and INVALID at the root', () => {
      const schema = v.withParser(v.z.number(), (input) =>
        typeof input === 'number' ? input * 2 : v.INVALID
      );
      expect(schema.parse(21)).toBe(42);
      expect(schema.safeParse('nope').success).toBe(false);
    });

    it('exposes the 4.6 class and helper aliases', () => {
      expect(v.ZodInstanceOf).toBeDefined();
      expect(v.ZodIBAN).toBeDefined();
      expect(v.INVALID).toBeDefined();
      expect(v.COMPILE_INVALID).toBeDefined();
      expect(v.isValidIBAN('GB82WEST12345698765432')).toBe(true);
      expect(v.isValidIBAN('GB82WEST12345698765433')).toBe(false);
    });
  });

  describe('promise validate/validateAsync', () => {
    it('validate() throws and validateAsync() resolves for promise schemas', async () => {
      const schema = v.z.promise(v.z.string());
      expect(() => schema.validate(Promise.resolve('x'))).toThrow(/validateAsync/);
      await expect(schema.validateAsync(Promise.resolve('x'))).resolves.toBe(true);
      await expect(schema.validateAsync(Promise.resolve(5))).resolves.toBe(false);
      await expect(schema.validateAsync('not a promise')).resolves.toBe(false);
    });
  });

  describe('compile refusals fall back to correct runtime behavior', () => {
    it('memoizes the compiled validator across repeated validate calls', async () => {
      const schema = v.z.object({ n: v.z.number() });
      expect(schema.validate({ n: 1 })).toBe(true); // cold path compiles
      expect(schema.validate({ n: 1 })).toBe(true); // hot path reads the memo
      expect(schema.validate({ n: 'x' })).toBe(false);
      expect(schema.validate(null)).toBe(false);
      await expect(schema.validateAsync({ n: 1 })).resolves.toBe(true); // async hot path
      await expect(schema.validateAsync({ n: 'x' })).resolves.toBe(false);
    });

    it('falls back to the runtime parser when the AOT compiler is blocked (CSP)', () => {
      const registryKey = '@oxog/vld/lazy-validate-compiler';
      const real = (globalThis as Record<string, unknown>)[registryKey];
      (globalThis as Record<string, unknown>)[registryKey] = () => {
        throw new Error('new Function is blocked by CSP');
      };
      try {
        const schema = v.z.string().min(5);
        expect(schema.validate('hello')).toBe(true); // bound safeParse fallback
        expect(schema.validate('abc')).toBe(false);
      } finally {
        (globalThis as Record<string, unknown>)[registryKey] = real;
      }
    });

    it('strict objects validate unknown keys through the runtime parser', () => {
      const schema = v.z.object({ a: v.z.string() }).strict();
      expect(schema.validate({ a: 'x' })).toBe(true);
      expect(schema.validate({ a: 'x', extra: 1 })).toBe(false);
    });

    it('transformed strings fall back instead of mis-validating', () => {
      const schema = v.z.string().trim().min(3);
      expect(schema.validate('abc ')).toBe(true);
      expect(schema.validate('a  ')).toBe(false);
    });

    it('array bounds are honored in validate()', () => {
      const schema = v.z.array(v.z.string()).min(2).max(3);
      expect(schema.validate(['a', 'b'])).toBe(true);
      expect(schema.validate(['a'])).toBe(false);
      expect(schema.validate(['a', 'b', 'c', 'd'])).toBe(false);
      const exact = v.z.array(v.z.string()).length(2);
      expect(exact.validate(['a', 'b'])).toBe(true);
      expect(exact.validate(['a'])).toBe(false);
    });

    it('unique arrays validate through the runtime parser', () => {
      const schema = v.z.array(v.z.number()).unique();
      expect(schema.validate([1, 2, 3])).toBe(true);
      expect(schema.validate([1, 2, 2])).toBe(false);
    });

    it('ip format strings are not skipped by the compiled path', () => {
      const schema = v.z.object({ ip: v.z.string().ip() });
      expect(schema.validate({ ip: '192.168.1.1' })).toBe(true);
      expect(schema.validate({ ip: 'not-an-ip' })).toBe(false);
      expect(schema.validate({ ip: '999.999.999.999' })).toBe(false);
    });
  });
});
