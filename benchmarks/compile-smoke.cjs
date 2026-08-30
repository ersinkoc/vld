/**
 * VLD compile/validate smoke test — sanity check that the AOT compiler
 * round-trips identical results to the runtime parser before we feed it
 * to the Moltar ParseSafe benchmark.
 */
const { v, z, VldError } = require('../dist/cjs/index.cjs');

const sampleUser = {
  id: 'user_42',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  age: 36,
  roles: ['admin', 'editor'],
  address: { city: 'London', zip: 'NW1' }
};

function expect(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label} → ${JSON.stringify(actual)}`);
  if (!ok) {
    console.log(`     expected: ${JSON.stringify(expected)}`);
    process.exitCode = 1;
  }
}

// 1. Basic object schema, valid input
{
  const schema = v.object({
    id: v.string(),
    name: v.string().min(2),
    age: v.number().int().positive(),
    roles: v.array(v.string())
  });
  const compiled = v.compile(schema);
  expect('compile() object valid', compiled.safeParse(sampleUser).success, true);
  expect('validate() object valid', v.validate(compiled, sampleUser), true);
}

// 2. Object with invalid type
{
  const schema = v.object({
    id: v.string(),
    age: v.number().int().positive()
  });
  const compiled = v.compile(schema);
  expect('compile() object invalid', compiled.safeParse({ id: 'x', age: -1 }).success, false);
  expect('validate() object invalid', v.validate(compiled, { id: 'x', age: -1 }), false);
}

// 3. Array of objects
{
  const schema = v.array(v.object({ id: v.string(), n: v.number() }));
  const compiled = v.compile(schema);
  const valid = compiled.safeParse([{ id: 'a', n: 1 }, { id: 'b', n: 2 }]);
  expect('compile() array of object valid', valid.success, true);
  expect('validate() array valid', v.validate(compiled, [{ id: 'a', n: 1 }]), true);
  expect('validate() array invalid (wrong field)', v.validate(compiled, [{ id: 'a', n: 'x' }]), false);
}

// 4. Tuple
{
  const schema = v.tuple([v.string(), v.number(), v.boolean()]);
  const compiled = v.compile(schema);
  expect('compile() tuple valid', compiled.safeParse(['x', 1, true]).success, true);
  expect('validate() tuple valid', v.validate(compiled, ['x', 1, true]), true);
  expect('validate() tuple invalid (length)', v.validate(compiled, ['x', 1]), false);
  expect('validate() tuple invalid (type)', v.validate(compiled, ['x', '1', true]), false);
}

// 5. Union
{
  const schema = v.union([v.string(), v.number()]);
  const compiled = v.compile(schema);
  expect('compile() union valid string', v.validate(compiled, 'hello'), true);
  expect('compile() union valid number', v.validate(compiled, 42), true);
  expect('compile() union invalid boolean', v.validate(compiled, {}), false);
}

// 6. Optional
{
  const schema = v.object({ name: v.string().optional() });
  const compiled = v.compile(schema);
  expect('compile() optional present', v.validate(compiled, { name: 'x' }), true);
  expect('compile() optional missing', v.validate(compiled, {}), true);
  expect('compile() optional wrong type', v.validate(compiled, { name: 1 }), false);
}

// 7. Literal
{
  const schema = v.literal('hello');
  const compiled = v.compile(schema);
  expect('compile() literal match', v.validate(compiled, 'hello'), true);
  expect('compile() literal miss', v.validate(compiled, 'world'), false);
}

// 8. Enum
{
  const schema = v.enum(['red', 'green', 'blue']);
  const compiled = v.compile(schema);
  expect('compile() enum match', v.validate(compiled, 'red'), true);
  expect('compile() enum miss', v.validate(compiled, 'yellow'), false);
}

// 9. Record
{
  const schema = v.record(v.string(), v.number());
  const compiled = v.compile(schema);
  expect('compile() record valid', v.validate(compiled, { a: 1, b: 2 }), true);
  expect('compile() record invalid (value type)', v.validate(compiled, { a: 'x' }), false);
}

// 10. Properties (multi-property)
{
  const schema = v.properties({ a: v.string(), b: v.number() });
  expect('properties() partial allows both', schema.safeParse({ a: 'x', b: 1 }).success, true);
  expect('properties() partial allows subset', schema.safeParse({ a: 'x' }).success, true);
}

// 11. Result/error equivalence — uncompiled vs compiled must agree
{
  const schema = v.object({ a: v.string(), b: v.number() });
  const compiled = v.compile(schema);
  const validInput = { a: 'x', b: 1 };
  const invalidInput = { a: 1, b: 2 };
  expect('uncompiled valid', schema.safeParse(validInput).success, true);
  expect('compiled valid', compiled.safeParse(validInput).success, true);
  const uncompiledErr = schema.safeParse(invalidInput).error;
  const compiledErr = compiled.safeParse(invalidInput).error;
  expect('error type matches', compiledErr instanceof VldError, true);
  expect('error field path matches', compiledErr.issues[0].path[0], uncompiledErr.issues[0].path[0]);
}

// 12. validate() is much faster than safeParse() on a hot path
{
  const schema = v.object({
    a: v.string(), b: v.string(), c: v.string(), d: v.string(), e: v.string(),
    n1: v.number(), n2: v.number(), n3: v.number(), n4: v.number(), n5: v.number()
  });
  const compiled = v.compile(schema);
  const data = { a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', n1: 1, n2: 2, n3: 3, n4: 4, n5: 5 };
  let validateStart = process.hrtime.bigint();
  for (let i = 0; i < 100000; i++) v.validate(compiled, data);
  const validateTime = Number(process.hrtime.bigint() - validateStart) / 1e6;
  let safeParseStart = process.hrtime.bigint();
  for (let i = 0; i < 100000; i++) compiled.safeParse(data);
  const safeParseTime = Number(process.hrtime.bigint() - safeParseStart) / 1e6;
  console.log(`validate() x100k: ${validateTime.toFixed(2)}ms`);
  console.log(`safeParse() x100k: ${safeParseTime.toFixed(2)}ms`);
  console.log(`validate is ${(safeParseTime / validateTime).toFixed(2)}x faster`);
}

console.log('\nSmoke test completed.');
