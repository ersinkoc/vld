// Drop-in ecosystem verification: installs real npm consumers of zod
// (@hookform/resolvers + react-hook-form) against the built package and
// proves the duck-typed integration works:
//   - zodResolver's zod v4 branch (`_zod` guard, `parseAsync`, and the
//     `_zod.traits.has('$ZodError')` re-throw check on the caught error)
//   - the `_zod.def` / `_zod.traits` / `_zod.version` introspection surface
//   - ZodError parity (name, constructor.name, JSON issue-list message)
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const errors = [];

function run(label, command, args, options = {}) {
  try {
    return execFileSync(command, args, {
      cwd: options.cwd || rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: options.env,
    });
  } catch (error) {
    const stderr = error.stderr ? error.stderr.toString().trim() : '';
    errors.push(`${label} failed${stderr ? `:\n${stderr}` : `: ${error.message}`}`);
    return '';
  }
}

function needsShell(command) {
  return process.platform === 'win32' && !path.isAbsolute(command);
}

function shellRun(label, commandLine, options = {}) {
  const { execSync } = require('child_process');
  try {
    return execSync(commandLine, {
      cwd: options.cwd || rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: options.env,
    });
  } catch (error) {
    const stderr = error.stderr ? error.stderr.toString().trim() : '';
    errors.push(`${label} failed${stderr ? `:\n${stderr}` : `: ${error.message}`}`);
    return '';
  }
}

function main() {
  for (const required of [path.join(rootDir, 'dist', 'index.js'), path.join(rootDir, 'dist', 'cjs', 'index.cjs')]) {
    if (!fs.existsSync(required)) {
      errors.push(`Missing built file ${required}. Run npm run build first.`);
    }
  }
  if (errors.length) return report();

  const tempDir = path.join(fs.realpathSync(os.tmpdir()), 'vld-verify-ecosystem');
  fs.rmSync(tempDir, { recursive: true, force: true });
  fs.mkdirSync(tempDir, { recursive: true });
  fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({ name: 'vld-ecosystem-probe', version: '0.0.0', private: true }, null, 2));

  const npmCommand = 'npm';
  const install = (specs, label) => {
    const list = Array.isArray(specs) ? specs : [specs];
    const joined = list.map((s) => (s.includes(' ') || s.includes('"') ? JSON.stringify(s) : s)).join(' ');
    shellRun(label, `npm install --no-audit --no-fund --legacy-peer-deps --silent ${joined}`, { cwd: tempDir });
  };

  install(['@hookform/resolvers@latest', 'react-hook-form@latest', 'react@latest'], 'install @hookform/resolvers');
  install(`file:${rootDir}`, 'install built vld');
  if (errors.length) return report();

  const probe = `
const assert = require('assert');
const vld = require(${JSON.stringify(packageJson.name)});
const z = vld.z || vld;

const schema = z.object({ name: z.string().min(2), age: z.number().int().min(0) });

(async () => {
  // Introspection surface used by ecosystem duck typing.
  assert.strictEqual(schema._zod.def.type, 'object');
  assert.deepStrictEqual(schema._zod.version, { major: 4, minor: 6, patch: 7 });
  assert.ok(schema._zod.traits.has('ZodObject'));
  assert.ok(schema._zod.traits.has('$ZodType'));
  assert.ok(schema._zod.def.shape && schema._zod.def.shape.name);

  // ZodError parity.
  let thrown;
  try { schema.parse({}); } catch (error) { thrown = error; }
  assert.ok(thrown, 'parse should throw');
  assert.strictEqual(thrown.name, 'ZodError');
  assert.strictEqual(thrown.constructor.name, 'ZodError');
  assert.ok(thrown._zod.traits.has('$ZodError'), 'error traits must contain $ZodError');
  assert.ok(thrown.message.startsWith('['), 'message must be the JSON issue list');

  // zodResolver: the real @hookform/resolvers integration.
  const { zodResolver } = require('@hookform/resolvers/zod');
  const resolver = zodResolver(schema);
  const invalid = await resolver({ name: 'a', age: -1 }, undefined, { fields: {}, shouldUseNativeValidation: false });
  assert.ok(invalid.errors && invalid.errors.name && invalid.errors.age, 'both field errors must surface');
  const valid = await resolver({ name: 'ab', age: 5 }, undefined, { fields: {}, shouldUseNativeValidation: false });
  assert.deepStrictEqual(valid.values, { name: 'ab', age: 5 });
  console.log('ECOSYSTEM-OK');
})().catch((error) => { console.error('ECOSYSTEM-FAIL: ' + error.message); process.exit(1); });
`;
  const probePath = path.join(tempDir, 'probe.cjs');
  fs.writeFileSync(probePath, probe);

  const out = run('ecosystem probe', process.execPath, [probePath], { cwd: tempDir });
  if (!out.includes('ECOSYSTEM-OK')) {
    errors.push('ecosystem probe did not report ECOSYSTEM-OK');
  } else {
    console.log('verify:ecosystem OK - zodResolver + _zod introspection + ZodError parity all pass');
  }

  fs.rmSync(tempDir, { recursive: true, force: true });
  report();
}

function report() {
  if (errors.length) {
    console.error(`verify:ecosystem found ${errors.length} problem(s):`);
    for (const error of errors) console.error('  - ' + error);
    process.exit(1);
  }
}

main();
