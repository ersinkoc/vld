import * as zodMini from 'zod/mini';
import * as zodV3 from 'zod/v3';
import * as mini from '../src/mini';
import * as v3 from '../src/v3';

const missingExports = (upstream: object, local: object): string[] =>
  Object.keys(upstream).filter(key => !(key in local)).sort();

describe('Zod 4.6.5 subpath compatibility stages', () => {
  test('/mini exports every upstream runtime name, including its z namespace', () => {
    expect(missingExports(zodMini, mini)).toEqual([]);
    expect(missingExports(zodMini.z, mini.z)).toEqual([]);
    expect(typeof mini.z.string().parse).toBe('function');
  });

  test('/mini functional helpers agree on representative parsing and object composition', () => {
    const upstream = zodMini.object({ name: zodMini.string(), age: zodMini.optional(zodMini.number()) });
    const local = mini.object({ name: mini.string(), age: mini.optional(mini.number()) });
    for (const input of [{ name: 'Ada' }, { name: 'Ada', age: 36 }, { name: 4 }]) {
      expect(local.safeParse(input).success).toBe(upstream.safeParse(input).success);
    }
    expect(local.parse({ name: 'Ada', extra: true })).toEqual(upstream.parse({ name: 'Ada', extra: true }));
  });

  test('/v3 legacy convenience factories agree on present, absent, and invalid values', () => {
    for (const [local, upstream, value] of [
      [v3.ostring(), zodV3.ostring(), 'hello'],
      [v3.onumber(), zodV3.onumber(), 42],
      [v3.oboolean(), zodV3.oboolean(), true]
    ] as const) {
      for (const input of [undefined, value, null, {}]) {
        expect(local.safeParse(input).success).toBe(upstream.safeParse(input).success);
      }
    }
  });

  test('/v3 pipeline and late.object parse like Zod 3', () => {
    const localPipe = v3.pipeline(v3.string(), v3.string().transform(value => value.length));
    const upstreamPipe = zodV3.pipeline(zodV3.string(), zodV3.string().transform(value => value.length));
    for (const input of ['hello', 42]) {
      expect(localPipe.safeParse(input).success).toBe(upstreamPipe.safeParse(input).success);
    }
    expect(localPipe.parse('hello')).toBe(upstreamPipe.parse('hello'));
    const localLate = v3.late.object(() => ({ id: v3.string() }));
    const upstreamLate = zodV3.late.object(() => ({ id: zodV3.string() }));
    for (const input of [{ id: 'ok' }, {}, { id: 1 }]) {
      expect(localLate.safeParse(input).success).toBe(upstreamLate.safeParse(input).success);
    }
  });

  test('/v3 export inventory cannot regress beyond the current legacy gap', () => {
    const missing = missingExports(zodV3, v3);
    expect(missing.length).toBeLessThanOrEqual(25);
    for (const name of ['ostring', 'onumber', 'oboolean', 'pipeline', 'late']) {
      expect(missing).not.toContain(name);
    }
  });
});
