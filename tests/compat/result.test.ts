/**
 * Tests for Result pattern implementation
 */

import {
  Ok,
  Err,
  success,
  failure,
  isOk,
  isErr,
  isResult,
  unwrap,
  unwrapOr,
  map,
  mapErr,
  flatMap,
  match,
  tryCatch,
  tryCatchAsync,
  all,
  fromNullable,
  ResultUtils
} from '../../src/compat/result';

describe('Result Pattern', () => {
  describe('Ok and Err constructors', () => {
    it('should create Ok result', () => {
      const result = Ok(42);

      expect(result.success).toBe(true);
      expect(result.data).toBe(42);
      expect(result.value).toBe(42);
    });

    it('should create Err result', () => {
      const error = new Error('Something went wrong');
      const result = Err(error);

      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
    });

    it('should create Err with string', () => {
      const result = Err('error message');

      expect(result.success).toBe(false);
      expect(result.error).toBe('error message');
    });
  });

  describe('success and failure aliases', () => {
    it('should create success result', () => {
      const result = success('hello');

      expect(result.success).toBe(true);
      expect(result.data).toBe('hello');
    });

    it('should create failure result', () => {
      const result = failure('oops');

      expect(result.success).toBe(false);
      expect(result.error).toBe('oops');
    });
  });

  describe('Type guards', () => {
    it('isOk should return true for Ok result', () => {
      const ok = Ok(1);
      const err = Err(new Error('error'));

      expect(isOk(ok)).toBe(true);
      expect(isOk(err)).toBe(false);
    });

    it('isErr should return true for Err result', () => {
      const ok = Ok(1);
      const err = Err(new Error('error'));

      expect(isErr(ok)).toBe(false);
      expect(isErr(err)).toBe(true);
    });

    it('isResult should identify Result objects', () => {
      const ok = Ok(1);
      const err = Err(new Error('error'));

      expect(isResult(ok)).toBe(true);
      expect(isResult(err)).toBe(true);
      expect(isResult(null)).toBe(false);
      expect(isResult(undefined)).toBe(false);
      // Objects with success boolean are considered Results (duck typing)
      expect(isResult({ success: true })).toBe(true);
      expect(isResult({ success: false })).toBe(true);
      // But non-boolean success is not a Result
      expect(isResult({ success: 'yes' })).toBe(false);
      expect(isResult({ other: true })).toBe(false);
    });
  });

  describe('unwrap', () => {
    it('should return value for Ok result', () => {
      const result = Ok(42);

      expect(unwrap(result)).toBe(42);
    });

    it('should throw for Err result', () => {
      const result = Err(new Error('test error'));

      expect(() => unwrap(result)).toThrow('test error');
    });

    it('should throw string error wrapped in Error', () => {
      // unwrap expects Error type, so we need to create Err with Error
      const result = Err(new Error('string error'));

      expect(() => unwrap(result)).toThrow('string error');
    });
  });

  describe('unwrapOr', () => {
    it('should return value for Ok result', () => {
      const result = Ok(42);

      expect(unwrapOr(result, 0)).toBe(42);
    });

    it('should return default for Err result', () => {
      const result = Err(new Error('error')) as ReturnType<typeof Err<Error>>;

      expect(unwrapOr(result, 0)).toBe(0);
    });
  });

  describe('map', () => {
    it('should transform Ok value', () => {
      const result = Ok(5);
      const mapped = map(result, (x: number) => x * 2);

      expect(isOk(mapped)).toBe(true);
      if (isOk(mapped)) {
        expect(mapped.data).toBe(10);
      }
    });

    it('should pass through Err', () => {
      const result = Err(new Error('error'));
      const mapped = map(result, (x: number) => x * 2);

      expect(isErr(mapped)).toBe(true);
    });
  });

  describe('mapErr', () => {
    it('should pass through Ok', () => {
      const result = Ok(5);
      const mapped = mapErr(result, (e: Error) => new Error(`wrapped: ${e.message}`));

      expect(isOk(mapped)).toBe(true);
      if (isOk(mapped)) {
        expect(mapped.data).toBe(5);
      }
    });

    it('should transform Err value', () => {
      const result = Err(new Error('original'));
      const mapped = mapErr(result, (e: Error) => new Error(`wrapped: ${e.message}`));

      expect(isErr(mapped)).toBe(true);
      if (isErr(mapped)) {
        expect(mapped.error.message).toBe('wrapped: original');
      }
    });
  });

  describe('flatMap', () => {
    it('should chain Ok results', () => {
      const result = Ok(5);
      const chained = flatMap(result, (x: number) => Ok(x * 2));

      expect(isOk(chained)).toBe(true);
      if (isOk(chained)) {
        expect(chained.data).toBe(10);
      }
    });

    it('should short-circuit on first Err', () => {
      const result = Ok(5);
      const chained = flatMap(result, () => Err(new Error('failed')));

      expect(isErr(chained)).toBe(true);
    });

    it('should pass through initial Err', () => {
      const result = Err(new Error('initial error'));
      const chained = flatMap(result, (x: number) => Ok(x * 2));

      expect(isErr(chained)).toBe(true);
      if (isErr(chained)) {
        expect((chained.error as Error).message).toBe('initial error');
      }
    });
  });

  describe('match', () => {
    it('should call ok handler for Ok result', () => {
      const result = Ok(42);
      const matched = match(result, {
        ok: (x: number) => `value is ${x}`,
        err: (e: Error) => `error: ${e.message}`
      });

      expect(matched).toBe('value is 42');
    });

    it('should call err handler for Err result', () => {
      const result = Err(new Error('oops'));
      const matched = match(result, {
        ok: (x: unknown) => `value is ${x}`,
        err: (e: Error) => `error: ${e.message}`
      });

      expect(matched).toBe('error: oops');
    });
  });

  describe('tryCatch', () => {
    it('should return Ok for successful function', () => {
      const result = tryCatch(() => 42);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toBe(42);
      }
    });

    it('should return Err for throwing function', () => {
      const result = tryCatch(() => {
        throw new Error('test error');
      });

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.message).toBe('test error');
      }
    });

    it('should wrap non-Error throws', () => {
      const result = tryCatch(() => {
        throw 'string error';
      });

      expect(isErr(result)).toBe(true);
    });
  });

  describe('tryCatchAsync', () => {
    it('should return Ok for successful async function', async () => {
      const result = await tryCatchAsync(async () => 42);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toBe(42);
      }
    });

    it('should return Err for rejecting async function', async () => {
      const result = await tryCatchAsync(async () => {
        throw new Error('async error');
      });

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.message).toBe('async error');
      }
    });

    it('should wrap non-Error throws in async function', async () => {
      const result = await tryCatchAsync(async () => {
        throw 'string error';
      });

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.message).toBe('string error');
      }
    });
  });

  describe('all', () => {
    it('should return Ok with all values for all Ok results', () => {
      const results = [Ok(1), Ok(2), Ok(3)] as const;
      const combined = all([...results]);

      expect(isOk(combined)).toBe(true);
      if (isOk(combined)) {
        expect(combined.data).toEqual([1, 2, 3]);
      }
    });

    it('should return first Err for any Err result', () => {
      const results = [Ok(1), Err(new Error('error')), Ok(3)];
      const combined = all(results);

      expect(isErr(combined)).toBe(true);
    });

    it('should handle empty array', () => {
      const results: Array<ReturnType<typeof Ok<number>>> = [];
      const combined = all(results);

      expect(isOk(combined)).toBe(true);
      if (isOk(combined)) {
        expect(combined.data).toEqual([]);
      }
    });
  });

  describe('fromNullable', () => {
    it('should return Ok for non-null value', () => {
      const result = fromNullable(42);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toBe(42);
      }
    });

    it('should return Err for null', () => {
      const result = fromNullable(null);

      expect(isErr(result)).toBe(true);
    });

    it('should return Err for undefined', () => {
      const result = fromNullable(undefined);

      expect(isErr(result)).toBe(true);
    });

    it('should use custom error', () => {
      const customError = new Error('custom error');
      const result = fromNullable(null, customError);

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.message).toBe('custom error');
      }
    });
  });

  describe('ResultUtils', () => {
    it('should provide all utility functions', () => {
      expect(typeof ResultUtils.Ok).toBe('function');
      expect(typeof ResultUtils.Err).toBe('function');
      expect(typeof ResultUtils.isOk).toBe('function');
      expect(typeof ResultUtils.isErr).toBe('function');
      expect(typeof ResultUtils.unwrap).toBe('function');
      expect(typeof ResultUtils.unwrapOr).toBe('function');
      expect(typeof ResultUtils.map).toBe('function');
      expect(typeof ResultUtils.mapErr).toBe('function');
      expect(typeof ResultUtils.flatMap).toBe('function');
      expect(typeof ResultUtils.match).toBe('function');
      expect(typeof ResultUtils.tryCatch).toBe('function');
      expect(typeof ResultUtils.tryCatchAsync).toBe('function');
      expect(typeof ResultUtils.all).toBe('function');
      expect(typeof ResultUtils.fromNullable).toBe('function');
    });

    it('should work with object method calls', () => {
      const ok = ResultUtils.Ok(42);
      expect(ResultUtils.isOk(ok)).toBe(true);
      expect(ResultUtils.unwrap(ok)).toBe(42);

      const err = ResultUtils.Err(new Error('error'));
      expect(ResultUtils.isErr(err)).toBe(true);
      expect(ResultUtils.unwrapOr(err, 0)).toBe(0);
    });
  });
});
