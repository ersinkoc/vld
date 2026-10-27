/**
 * `.toJSONSchema()` is late-bound: the serializer is injected by the full
 * entry point (src/index.ts) to keep validators/base.ts free of the
 * base -> to-json-schema -> base module cycle. A schema created without the
 * full entry loaded reports a clear error instead of silently missing data.
 */
import { VldString } from '../src/validators/string';

describe('toJSONSchema without the full entry point', () => {
  it('throws a clear configuration error', () => {
    expect(() => VldString.create().toJSONSchema()).toThrow(/toJSONSchema is not configured/);
  });
});
