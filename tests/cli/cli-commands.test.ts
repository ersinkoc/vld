/**
 * Regression tests for the `vld` CLI commands (audit round 5, findings F214-F216).
 * The commands are driven through their `action` functions with console output and
 * process.exitCode captured, using a throw-away schema file in a temp directory.
 */
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { validateCommand } from '../../src/cli/commands/validate';
import { benchmarkCommand } from '../../src/cli/commands/benchmark';

interface RunResult {
  exit: number;
  out: string;
  err: string;
}

async function run(
  command: { action: (args: Record<string, unknown>, options: Record<string, unknown>) => void | Promise<void> },
  args: Record<string, unknown>,
  options: Record<string, unknown>
): Promise<RunResult> {
  const logs: string[] = [];
  const errs: string[] = [];
  const log = console.log;
  const error = console.error;
  const previousExit = process.exitCode;
  console.log = (...parts: unknown[]) => { logs.push(parts.join(' ')); };
  console.error = (...parts: unknown[]) => { errs.push(parts.join(' ')); };
  process.exitCode = undefined;
  try {
    await command.action(args, options);
    return { exit: Number(process.exitCode ?? 0), out: logs.join('\n'), err: errs.join('\n') };
  } finally {
    console.log = log;
    console.error = error;
    process.exitCode = previousExit;
  }
}

describe('vld validate (CLI)', () => {
  const originalCwd = process.cwd();
  let dir: string;
  const flags = { strict: false, quiet: false, json: false, 'no-color': true };

  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vld-cli-'));
    // a schema that only accepts arrays of numbers
    fs.writeFileSync(
      path.join(dir, 'schema.cjs'),
      [
        'const issue = (message) => ({ code: "custom", path: [], message });',
        'const check = (value) => Array.isArray(value) && value.every((item) => typeof item === "number");',
        'module.exports = {',
        '  parse(value) { if (!check(value)) throw new Error("expected numbers"); return value; },',
        '  safeParse(value) { return check(value) ? { success: true, data: value } : { success: false, error: Object.assign(new Error("expected numbers"), { issues: [issue("expected numbers")] }) }; }',
        '};'
      ].join('\n')
    );
    fs.writeFileSync(path.join(dir, 'data.json'), '[1,2,3]');
  });

  afterAll(() => {
    process.chdir(originalCwd);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('F214 exits non-zero for invalid data in --json mode, like every other failure', async () => {
    process.chdir(dir);
    const cases: [string, string, number][] = [
      ['valid data', '[1,2]', 0],
      ['invalid data', '["x"]', 1],
      ['malformed data', '{not json', 1]
    ];
    for (const [, data, exit] of cases) {
      const json = await run(validateCommand, { schema: 'schema.cjs', data }, { ...flags, json: true });
      expect(json.exit).toBe(exit);
      expect(JSON.parse(json.out).success).toBe(exit === 0);
    }
    expect((await run(validateCommand, { schema: 'schema.cjs', data: '["x"]' }, flags)).exit).toBe(1);
    expect((await run(validateCommand, { schema: 'missing.cjs', data: '[1]' }, { ...flags, json: true })).exit).toBe(1);
    const failure = JSON.parse((await run(validateCommand, { schema: 'schema.cjs', data: '["x"]' }, { ...flags, json: true })).out);
    expect(failure.issues).toHaveLength(1);
    expect(typeof failure.error).toBe('string');
  });

  it('F215 path guard works from a filesystem-root cwd and still rejects real escapes', async () => {
    const fsRoot = path.parse(dir).root;
    const escapes = (result: RunResult) => /escapes allowed directory/.test(result.out + result.err);
    const schemaFromRoot = path.relative(fsRoot, path.join(dir, 'schema.cjs'));
    const dataFromRoot = path.relative(fsRoot, path.join(dir, 'data.json'));

    process.chdir(fsRoot);
    const viaRoot = await run(validateCommand, { schema: schemaFromRoot, data: dataFromRoot }, { ...flags, json: true });
    expect(escapes(viaRoot)).toBe(false);
    expect(viaRoot.exit).toBe(0);
    expect(JSON.parse(viaRoot.out)).toEqual({ success: true, data: [1, 2, 3] });
    expect(escapes(await run(validateCommand, { schema: path.join(dir, 'schema.cjs'), data: '[1]' }, { ...flags, json: true }))).toBe(false);

    // from an ordinary directory
    process.chdir(dir);
    expect(escapes(await run(validateCommand, { schema: './schema.cjs', data: 'data.json' }, { ...flags, json: true }))).toBe(false);
    expect(escapes(await run(validateCommand, { schema: '..hidden/schema.cjs', data: '[1]' }, { ...flags, json: true }))).toBe(false);
    expect(escapes(await run(validateCommand, { schema: '../outside.cjs', data: '[1]' }, { ...flags, json: true }))).toBe(true);
    expect(escapes(await run(validateCommand, { schema: 'schema.cjs', data: '../outside.json' }, { ...flags, json: true }))).toBe(true);
    // a sibling that merely shares the cwd's name as a prefix is outside it
    expect(escapes(await run(validateCommand, { schema: `${dir}-evil${path.sep}x.cjs`, data: '[1]' }, { ...flags, json: true }))).toBe(true);
  });
});

describe('vld validate schema loading (CLI)', () => {
  const originalCwd = process.cwd();
  let root: string;
  const flags = { strict: false, quiet: false, json: true, 'no-color': true };
  const schemaSource = (id: string) =>
    `const ${id} = { parse(v) { return v; }, safeParse(v) { return { success: true, data: { via: ${JSON.stringify(id)}, value: v } }; } };\n`;

  beforeAll(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'vld-load-'));
  });

  afterAll(() => {
    process.chdir(originalCwd);
    fs.rmSync(root, { recursive: true, force: true });
  });

  async function load(dir: string, file: string): Promise<{ exit: number; doc: any }> {
    process.chdir(dir);
    const result = await run(validateCommand, { schema: file, data: '[1]' }, flags);
    return { exit: result.exit, doc: JSON.parse(result.out) };
  }

  it('F217 loads schemas from directories whose names need URL encoding', async () => {
    for (const name of ['plain', 'with space', 'hash#dir', 'percent%20dir', 'ünïcödé', 'a+b&c=d']) {
      const dir = path.join(root, name);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'schema.cjs'), schemaSource('s') + 'module.exports = s;');
      const { exit, doc } = await load(dir, 'schema.cjs');
      expect(exit).toBe(0);
      expect(doc).toEqual({ success: true, data: { via: 's', value: [1] } });
    }
  });

  it('F218 uses the first export that is a validator', async () => {
    const dir = path.join(root, 'exports');
    fs.mkdirSync(dir, { recursive: true });
    const cases: [string, string, string | 'ERROR'][] = [
      ['named.cjs', schemaSource('s') + 'exports.schema = s;', 's'],
      ['default-not-schema.cjs', schemaSource('s') + 'exports.default = { notASchema: true };\nexports.schema = s;', 's'],
      ['both.cjs', schemaSource('d') + schemaSource('n') + 'exports.default = d;\nexports.schema = n;', 'd'],
      ['module-exports.cjs', schemaSource('s') + 'module.exports = s;', 's'],
      ['nothing.cjs', 'exports.default = { notASchema: true };\nexports.other = {};', 'ERROR']
    ];
    for (const [file, source, expected] of cases) {
      fs.writeFileSync(path.join(dir, file), source);
      const { exit, doc } = await load(dir, file);
      if (expected === 'ERROR') {
        expect(exit).toBe(1);
        expect(doc.error).toMatch(/must export a VLD validator/);
      } else {
        expect(exit).toBe(0);
        expect(doc.data.via).toBe(expected);
      }
    }
  });

  it('F218 reports a missing schema file and a schema that throws while loading', async () => {
    const dir = path.join(root, 'errors');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'throws.cjs'), 'throw new Error("boom at import");');
    const throwing = await load(dir, 'throws.cjs');
    expect(throwing.exit).toBe(1);
    expect(throwing.doc.error).toMatch(/boom at import/);
    const missing = await load(dir, 'nope.cjs');
    expect(missing.exit).toBe(1);
    expect(missing.doc.error).toMatch(/Schema file not found/);
  });
});

describe('vld benchmark (CLI)', () => {
  const defaults = { iterations: 2, suite: 'all', json: true, 'no-color': true };

  it('F216 rejects non-positive / fractional iterations and unknown suites', async () => {
    const rejected: [Record<string, unknown>, RegExp][] = [
      [{ iterations: 0 }, /--iterations expects a positive integer, got "0"/],
      [{ iterations: -5 }, /--iterations expects a positive integer, got "-5"/],
      [{ iterations: 2.5 }, /--iterations expects a positive integer, got "2.5"/],
      [{ iterations: Number.NaN }, /positive integer/],
      [{ suite: 'bogus' }, /--suite expects one of all, primitives, objects, arrays, got "bogus"/],
      [{ suite: true }, /--suite expects one of/]
    ];
    for (const [override, message] of rejected) {
      for (const json of [true, false]) {
        const result = await run(benchmarkCommand, {}, { ...defaults, ...override, json });
        expect(result.exit).toBe(1);
        expect(result.err).toMatch(message);
        expect(result.out).toBe('');
      }
    }
  });

  it('F216 still reports every valid suite', async () => {
    const counts: Record<string, number> = { all: 10, primitives: 5, objects: 3, arrays: 2 };
    for (const [suite, count] of Object.entries(counts)) {
      const result = await run(benchmarkCommand, {}, { ...defaults, iterations: 1, suite });
      expect(result.exit).toBe(0);
      expect(JSON.parse(result.out).results).toHaveLength(count);
    }
    const text = await run(benchmarkCommand, {}, { ...defaults, iterations: 3, suite: 'arrays', json: false });
    expect(text.exit).toBe(0);
    expect(text.out).toContain('Total benchmarks: 2');
  });
});
