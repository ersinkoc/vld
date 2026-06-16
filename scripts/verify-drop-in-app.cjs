const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const tempRootDir = path.join(rootDir, '.tmp');
const tempDir = path.join(tempRootDir, 'verify-drop-in-app');
const errors = [];

function run(label, command, args, options = {}) {
  try {
    return execFileSync(command, args, {
      cwd: options.cwd || rootDir,
      encoding: 'utf8',
      stdio: options.stdio || ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    const stdout = error.stdout ? error.stdout.toString().trim() : '';
    const stderr = error.stderr ? error.stderr.toString().trim() : '';
    errors.push(`${label} failed${stdout ? `:\n${stdout}` : ''}${stderr ? `\n${stderr}` : ''}`);
    return '';
  }
}

function ensureBuiltPackage() {
  for (const file of [
    'dist/index.js',
    'dist/cjs/index.cjs',
    'dist/v4/index.js',
    'dist/v4-mini/index.js',
    'dist/v4/core/index.js',
    'dist/v4/locales/index.js',
  ]) {
    if (!fs.existsSync(path.join(rootDir, file))) {
      errors.push(`Missing built file ${file}. Run npm run build before verify:drop-in.`);
    }
  }
}

function symlinkPackage(target, linkPath) {
  fs.mkdirSync(path.dirname(linkPath), { recursive: true });
  fs.rmSync(linkPath, { recursive: true, force: true });
  fs.symlinkSync(target, linkPath, process.platform === 'win32' ? 'junction' : 'dir');
}

function appSource(packageName) {
  return `
import {
  array,
  email,
  flattenError,
  literal,
  number,
  object,
  optional,
  safeParse,
  string,
  toJSONSchema,
  treeifyError,
  z
} from '${packageName}';
import * as v4 from '${packageName}/v4';
import * as mini from '${packageName}/v4-mini';
import * as core from '${packageName}/v4/core';
import * as locales from '${packageName}/v4/locales';

const userSchema = object({
  id: string().min(2),
  email: email(),
  tags: array(string()),
  age: optional(number().int())
});

const valid = userSchema.safeParse({
  id: 'u1',
  email: 'ada@example.com',
  tags: ['admin', 'editor'],
  age: 36
});
const invalid = userSchema.safeParse({
  id: 'x',
  email: 'bad',
  tags: [1],
  age: 1.2
});

if (!valid.success) {
  throw new Error('Expected valid user fixture to parse');
}
if (invalid.success) {
  throw new Error('Expected invalid user fixture to fail');
}

const flattened = flattenError(invalid.error as any);
const tree = treeifyError(invalid.error as any);
const jsonSchema = toJSONSchema(userSchema);
const statusSchema = literal('draft');
const v4Schema = v4.object({ id: v4.string() });
const miniSchema = mini.object({
  id: mini.string(),
  count: mini.optional(mini.number())
});
const coreString = core._string(core.$ZodString);
const coreArray = core._array(core.$ZodArray, coreString);
const localeMessages = locales.en();

const output = {
  coreArray: core.parse(coreArray, ['ok'])[0],
  coreString: core.parse(coreString, 'ok'),
  errorHasIssues: flattened.formErrors.length > 0 || Object.keys(flattened.fieldErrors).length > 0,
  jsonSchemaType: jsonSchema.type,
  localeIsObject: typeof localeMessages === 'object' && localeMessages !== null,
  miniPicked: mini.pick(miniSchema, { id: true }).parse({ id: 'm1', count: 1 }).id,
  rootHelperSuccess: safeParse(userSchema, { id: 'u2', email: 'ada@example.com', tags: [] }).success,
  status: statusSchema.parse('draft'),
  treeIsObject: typeof tree === 'object' && tree !== null,
  userId: valid.data.id,
  v4Id: v4Schema.parse({ id: 'v4' }).id,
  zNamespace: z.string().parse('z')
};

console.log(JSON.stringify(output, Object.keys(output).sort()));
`;
}

function writeProject(projectName, packageName, packageTarget) {
  const projectDir = path.join(tempDir, projectName);
  fs.mkdirSync(path.join(projectDir, 'src'), { recursive: true });
  fs.mkdirSync(path.join(projectDir, 'node_modules'), { recursive: true });
  fs.writeFileSync(path.join(projectDir, 'package.json'), `${JSON.stringify({
    private: true,
    type: 'module',
  }, null, 2)}\n`);
  fs.writeFileSync(path.join(projectDir, 'src', 'app.ts'), appSource(packageName));
  fs.writeFileSync(path.join(projectDir, 'tsconfig.json'), `${JSON.stringify({
    compilerOptions: {
      target: 'ES2022',
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      strict: true,
      outDir: 'dist',
      skipLibCheck: false,
      esModuleInterop: true,
      forceConsistentCasingInFileNames: true,
      types: []
    },
    include: ['src/app.ts']
  }, null, 2)}\n`);

  if (packageName.startsWith('@')) {
    const [scope, name] = packageName.split('/');
    symlinkPackage(packageTarget, path.join(projectDir, 'node_modules', scope, name));
  } else {
    symlinkPackage(packageTarget, path.join(projectDir, 'node_modules', packageName));
  }

  return projectDir;
}

function runProject(label, projectDir) {
  run(`${label} TypeScript compile`, process.execPath, [
    require.resolve('typescript/bin/tsc'),
    '-p',
    path.join(projectDir, 'tsconfig.json'),
    '--pretty',
    'false'
  ], { cwd: projectDir });

  if (errors.length > 0) {
    return '';
  }

  return run(`${label} runtime`, process.execPath, ['dist/app.js'], { cwd: projectDir }).trim();
}

ensureBuiltPackage();

if (errors.length === 0) {
  fs.rmSync(tempDir, { recursive: true, force: true });
  fs.mkdirSync(tempDir, { recursive: true });

  const zodPackagePath = path.dirname(require.resolve('zod/package.json', { paths: [rootDir] }));
  const zodProject = writeProject('zod-app', 'zod', zodPackagePath);
  const vldProject = writeProject('vld-app', packageJson.name, rootDir);
  const zodOutput = runProject('Zod drop-in fixture', zodProject);
  const vldOutput = runProject('VLD drop-in fixture', vldProject);

  if (zodOutput && vldOutput && zodOutput !== vldOutput) {
    errors.push(`Drop-in fixture output mismatch:\nZod: ${zodOutput}\nVLD: ${vldOutput}`);
  }
}

fs.rmSync(tempDir, { recursive: true, force: true });
if (fs.existsSync(tempRootDir) && fs.readdirSync(tempRootDir).length === 0) {
  fs.rmSync(tempRootDir, { recursive: true, force: true });
}

if (errors.length > 0) {
  console.error('Drop-in app verification failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('Drop-in app verification passed: same TypeScript fixture matches Zod and built VLD output');
