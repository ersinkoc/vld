/**
 * `v.core` mirrors Zod's `z.core` twice: on the root namespace, and on the
 * `@oxog/vld/v4/core` subpath. The root copy lives in
 * `src/v4/core/root-surface.ts` and imports nothing (that is what keeps the
 * root bundle tree-shakeable), so its hand-written helpers are a second
 * implementation of the subpath's. These tests run both over the same inputs
 * and require identical results, return values and thrown messages.
 */

import { v } from '../src';
import * as subpathModule from '../src/v4/core';
import * as zod from 'zod';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Any = any;

const root = v.core as unknown as Record<string, Any>;
const subpath = subpathModule as unknown as Record<string, Any>;

const outcome = (fn: Any, args: unknown[]): unknown => {
  try {
    return { returned: fn(...args) };
  } catch (error) {
    return { threw: (error as Error).message };
  }
};

/** Both surfaces must return the same value, or throw the same message. */
const expectSame = (name: string, buildArgs: () => unknown[]): void => {
  expect(outcome(root[name], buildArgs())).toEqual(outcome(subpath[name], buildArgs()));
};

/** Compares two schemas by the values they accept and the messages they report. */
const behavior = (schema: Any, values: unknown[]): unknown[] =>
  values.map((value) => {
    const result = schema.safeParse(value);
    return result.success ? { ok: result.data } : { ok: false, message: result.error?.message };
  });

const expectSameSchema = (name: string, buildArgs: () => unknown[], values: unknown[]): void => {
  expect([name, behavior(root[name](...buildArgs()), values)]).toEqual([
    name,
    behavior(subpath[name](...buildArgs()), values)
  ]);
};

const NUMBERS = [-5, -1, 0, 1, 3, 4, 10];
const DATES = [new Date(1999, 0, 1), new Date(2000, 0, 1), new Date(2001, 0, 1)];
const JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';

describe('v.core helpers match the v4/core subpath', () => {
  it('renders paths', () => {
    for (const path of [
      [],
      ['a'],
      ['a', 'b'],
      [0],
      ['a', 0, 'b-c'],
      [{ key: 'x' }, { key: 3 }],
      [Symbol('s'), 'a'],
      ['a b', '$c']
    ]) {
      expectSame('toDotPath', () => [path]);
    }
  });

  it('merges intersection values', () => {
    const cases: unknown[][] = [
      [1, 1],
      [1, 2],
      [new Date(0), new Date(0)],
      [new Date(0), new Date(1)],
      [{ a: 1 }, { b: 2 }],
      [{ a: { b: 1 } }, { a: { c: 2 } }],
      [{ a: { b: 1 } }, { a: { b: 2 } }],
      [{ a: [{ b: 1 }] }, { a: [{ c: 2 }] }],
      [{ a: 1 }, null],
      [[1, 2], [1, 2]],
      [[1], [1, 2]],
      [[{ a: 1 }], [{ a: 1 }]],
      [null, null]
    ];
    for (const args of cases) {
      expectSame('mergeValues', () => args);
    }
  });

  it('exposes the Standard Schema property bag', () => {
    // The bags carry functions, so compare their shape and behavior instead of
    // function identity.
    for (const schema of [v.string(), v.string().min(2), v.object({ a: v.string() })]) {
      const fromRoot = root['standardProps'](schema) as Any;
      const fromSubpath = subpath['standardProps'](schema) as Any;
      expect(Object.keys(fromRoot).sort()).toEqual(Object.keys(fromSubpath).sort());
      expect(fromRoot.vendor).toBe(fromSubpath.vendor);
      expect(fromRoot.version).toBe(fromSubpath.version);
      for (const value of ['x', 1, undefined]) {
        expect(fromRoot.validate(value)).toEqual(fromSubpath.validate(value));
      }
    }
    // Not a schema: both implementations must throw the same TypeError.
    expectSame('standardProps', () => [{ safeParse: undefined }]);
    expectSame('standardProps', () => [null]);
  });

  it('parses and validates URLs', () => {
    for (const input of ['https://example.com/a', 'example.com', 'http:/broken', 'not a url', '']) {
      expectSame('canParseURL', () => [input]);
      expectSame('validateURL', () => [input]);
      expectSame('parseURLObject', () => [input]);
    }
    expectSame('validateURL', () => ['example.com', { protocol: /^https$/ }]);
    expectSame('validateURL', () => ['https://example.com', { protocol: /^https$/ }]);
    expectSame('parseURLObject', () => ['example.com', { protocol: /^https$/ }]);
    expectSame('validateURL', () => ['http://example.com', { normalize: true }]);
    expectSame('urlHostnameOk', () => [new URL('https://example.com/x'), /example\.com$/g]);
    expectSame('urlHostnameOk', () => [new URL('https://example.com/x'), /nope/g]);
    expectSame('urlProtocolOk', () => [new URL('https://example.com'), /^https$/g]);
    expectSame('urlProtocolOk', () => [new URL('https://example.com'), /^http$/]);
    expectSame('stripTabAndNewline', () => ['a\tb\nc\rd']);
  });

  it('validates string formats', () => {
    const samples: Record<string, string[]> = {
      isValidBase64: ['aGk=', 'aGk', '', 'a b'],
      isValidBase64URL: ['aGk', 'a+b/', ''],
      isValidIPv6: ['::1', '2001:db8::1', '1.2.3.4', ''],
      isValidCIDRv6: ['::1/128', '2001:db8::/32', '10.0.0.0/8', ''],
      isValidCreditCard: ['4111111111111111', '4111', ''],
      isValidIBAN: ['TR330006100519786457841326', 'DE89370400440532013000', 'TR1', '']
    };
    for (const [name, values] of Object.entries(samples)) {
      for (const value of values) expectSame(name, () => [value]);
    }
    expectSame('isValidJWT', () => [JWT]);
    expectSame('isValidJWT', () => [JWT, 'HS256']);
    expectSame('isValidJWT', () => [JWT, 'HS512']);
    expectSame('isValidJWT', () => ['not-a-jwt']);
  });

  it('applies bound checks to number, bigint and Date', () => {
    for (const name of ['_min', '_max', '_gt', '_gte', '_lt', '_lte']) {
      expectSameSchema(name, () => [2], NUMBERS);
      expectSameSchema(name, () => [2n], [1n, 2n, 3n]);
      expectSameSchema(name, () => [new Date(2000, 0, 1)], DATES);
      expectSameSchema(name, () => [2, 'too small'], NUMBERS);
      expectSameSchema(name, () => [2, { message: 'boom' }], NUMBERS);
      expectSameSchema(name, () => [2, { error: 'boom2' }], NUMBERS);
    }
  });

  it('mirrors the JSON Schema unrepresentable fallback', () => {
    const cases: Array<() => unknown[]> = [
      () => ['schema', { unrepresentable: 'any' }, {}, { path: ['a'] }, 'no json'],
      () => ['schema', {}, {}, { path: ['a'] }, 'no json'],
      () => ['schema', { unrepresentable: 'throw' }, {}, { path: ['a'] }, 'no json'],
      () => ['schema', { unrepresentable: { type: 'string' } }, { type: 'object' }, { path: [] }, 'fallback'],
      () => [
        'schema',
        { unrepresentable: (info: unknown) => ({ anyOf: [info] }) },
        {},
        { path: ['b', 0] },
        'callback'
      ]
    ];
    for (const buildArgs of cases) expectSame('handleUnrepresentable', buildArgs);
  });

  it('detects recursive schemas the same way', () => {
    let cyclic: Any;
    cyclic = v.lazy(() => cyclic);
    const throwing = v.lazy(() => {
      throw new Error('not ready');
    });
    const plain = v.string();
    const object = v.object({ a: v.string() });
    const array = v.array(v.lazy(() => plain));
    const nested = v.object({ a: v.lazy(() => v.object({ b: v.string() })) });

    for (const schema of [plain, object, array, nested, cyclic, throwing, {}]) {
      expectSame('isRecursiveSchema', () => [schema]);
    }
    expect(root['isRecursiveSchema'](cyclic)).toBe(true);
    expect(root['isRecursiveSchema'](throwing)).toBe(true);
    expect(root['isRecursiveSchema'](object)).toBe(false);
  });

  it('shares the JSON Schema pass-throughs', () => {
    const schema = v.object({ a: v.string() });
    for (const name of ['finalize', 'process', 'processSchema']) {
      expect(root[name](schema)).toBe(schema);
      expect(subpath[name](schema)).toBe(schema);
    }
    for (const name of ['initializeContext', 'extractDefs']) {
      expect(root[name]()).toEqual(subpath[name]());
    }
    expect(typeof root['createToJSONSchemaMethod']()).toBe('function');
    expect(root['createToJSONSchemaMethod']()).toBe(subpath['createToJSONSchemaMethod']());
    expect(root['createStandardJSONSchemaMethod']()).toBe(subpath['createStandardJSONSchemaMethod']());
  });

  it('keeps the documented placeholders', () => {
    for (const name of ['$ZodCyclicError', 'isBackEdge']) {
      expect(typeof root[name]).toBe('function');
      expect(() => root[name]()).toThrow(`${name} is an internal Zod core compatibility placeholder`);
    }
    // Every `$ZodCheck*` name Zod publishes is a marker class of the one shape.
    const zodCoreNames = Object.keys((zod as unknown as { core: Record<string, unknown> }).core);
    const checkNames = zodCoreNames.filter((name) => name.startsWith('$ZodCheck'));
    expect(checkNames.length).toBeGreaterThan(0);
    for (const name of checkNames) {
      expect(typeof root[name]).toBe('function');
      expect(new root[name]()).toBeInstanceOf(root['$ZodCheck']);
    }
    // `version` tracks the parity baseline, so a zod bump must land here too.
    const zodCore = (zod as unknown as { core: Record<string, Any> }).core;
    expect(root['version']).toEqual(zodCore['version']);
    expect(String(root['base64Charset'])).toBe(String(zodCore['base64Charset']));
    expect(String(root['base64urlCharset'])).toBe(String(zodCore['base64urlCharset']));
    // Separate literals on each surface, so compare the patterns themselves.
    expect(String(root['base64Charset'])).toBe(String(subpath['base64Charset']));
    expect(String(root['base64urlCharset'])).toBe(String(subpath['base64urlCharset']));
    expect(root['URL_BAD_FORMAT']).toBe(subpath['URL_BAD_FORMAT']);
    expect(root['URL_UNPARSEABLE']).toBe(subpath['URL_UNPARSEABLE']);
  });
});
/**
 * The `_*` factories take Zod's optional leading class argument
 * (`_array($ZodArray, schema)`). Both surfaces must accept the same call forms
 * and build equivalent schemas.
 */
describe('v.core _* adapters match the v4/core subpath', () => {
  const S = v.string();
  const N = v.number();
  /** The surface's own class alias, used as the optional leading argument. */
  const C = (name: string): Any => root[name];

  const describeResult = (make: () => Any, values: unknown[]): unknown => {
    let produced: Any;
    try {
      produced = make();
    } catch (error) {
      // A form both surfaces reject must be rejected the same way.
      return { threw: (error as Error).message };
    }
    if (produced && typeof produced.safeParse === 'function') {
      return { type: produced.constructor?.name, results: behavior(produced, values) };
    }
    return { value: produced };
  };

  const expectSameAdapter = (
    name: string,
    plainArgs: () => unknown[],
    values: unknown[],
    classArgs?: () => unknown[]
  ): void => {
    expect({ [name]: describeResult(() => root[name](...plainArgs()), values) }).toEqual({
      [name]: describeResult(() => subpath[name](...plainArgs()), values)
    });
    if (classArgs) {
      expect({ [name]: describeResult(() => root[name](...classArgs()), values) }).toEqual({
        [name]: describeResult(() => subpath[name](...classArgs()), values)
      });
    }
  };

  it('builds the container factories', () => {
    expectSameAdapter('_array', () => [S], [['x'], [1], 'x'], () => [C('$ZodArray'), S]);
    expectSameAdapter('_tuple', () => [[S, N]], [['x', 1], ['x']], () => [C('$ZodTuple'), [S, N]]);
    expectSameAdapter('_record', () => [S, N], [{ k: 1 }, { k: 'x' }], () => [C('$ZodRecord'), S, N]);
    expectSameAdapter('_map', () => [S, N], [new Map([['k', 1]]), 'x'], () => [C('$ZodMap'), S, N]);
    expectSameAdapter('_set', () => [S], [new Set(['x']), new Set([1])], () => [C('$ZodSet'), S]);
    expectSameAdapter('_union', () => [[S, N]], ['x', 1, true], () => [C('$ZodUnion'), [S, N]]);
    expectSameAdapter('_xor', () => [[S, N]], ['x', 1], () => [C('$ZodXor'), [S, N]]);
    expectSameAdapter(
      '_intersection',
      () => [v.object({ a: S }), v.object({ b: N })],
      [{ a: 'x', b: 1 }, { a: 1 }],
      () => [C('$ZodIntersection'), v.object({ a: S }), v.object({ b: N })]
    );
  });

  it('builds the leaf and wrapper factories', () => {
    expectSameAdapter('_enum', () => [['a', 'b']], ['a', 'c'], () => [C('$ZodEnum'), ['a', 'b']]);
    expectSameAdapter('_literal', () => ['a'], ['a', 'b'], () => [C('$ZodLiteral'), 'a']);
    expectSameAdapter('_lazy', () => [() => S], ['x'], () => [C('$ZodLazy'), () => S]);
    expectSameAdapter('_optional', () => [S], [undefined, 'x'], () => [C('$ZodOptional'), S]);
    expectSameAdapter('_nullable', () => [S], [null, 'x'], () => [C('$ZodNullable'), S]);
    expectSameAdapter('_nonoptional', () => [S], [undefined, 'x'], () => [C('$ZodNonOptional'), S]);
    expectSameAdapter('_readonly', () => [S], ['x'], () => [C('$ZodReadonly'), S]);
    expectSameAdapter('_default', () => [S, 'd'], [undefined, 'x'], () => [C('$ZodDefault'), S, 'd']);
    expectSameAdapter('_catch', () => [S, 'c'], [1, 'x'], () => [C('$ZodCatch'), S, 'c']);
    expectSameAdapter('_promise', () => [S], [Promise.resolve('x'), 'x'], () => [C('$ZodPromise'), S]);
    expectSameAdapter('_pipe', () => [S, S], ['x', 1], () => [C('$ZodPipe'), S, S]);
    expectSameAdapter('_success', () => [S], ['x'], () => [C('$ZodSuccess'), S]);
    expectSameAdapter('_stringbool', () => [true], ['true', 'x'], () => [C('$ZodCodec'), true]);
    // Zod's class-first form carries the params after the class.
    expectSameAdapter('_creditCard', () => [], ['4111111111111111', '4111'], () => [
      C('$ZodCreditCard'),
      'must be a card'
    ]);
    expectSameAdapter('_iban', () => [], ['DE89370400440532013000', 'x'], () => [
      C('$ZodIBAN'),
      'must be an iban'
    ]);
  });

  it('builds the no-argument factories', () => {
    for (const name of ['_string', '_number', '_boolean', '_bigint', '_symbol', '_date', '_any', '_unknown', '_never', '_void', '_null', '_undefined', '_nan']) {
      expectSameAdapter(name, () => [], ['x', 1, undefined, null]);
      // A leading class must be ignored, not treated as factory options.
      expectSameAdapter(name, () => [], ['x'], () => [C('$ZodType')]);
    }
  });

  it('builds the refinement and transform adapters', () => {
    const check = (payload: Any) => payload.issues.push({ message: 'bad' });
    expectSameAdapter('_check', () => [check], ['x'], () => [C('$ZodCheck'), check]);
    expectSameAdapter('_refine', () => [(value: string) => value === 'x', 'msg'], ['x', 'y']);
    expectSameAdapter('_superRefine', () => [S, (value: string, ctx: Any) => {
      if (value !== 'x') ctx.addIssue({ message: 'no' });
    }], ['x', 'y']);
    expectSameAdapter('_transform', () => [(value: string) => value.length], ['abc', 1]);
  });
});
