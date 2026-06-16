const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const errors = [];

function readInstalledZodPackage() {
  try {
    const packagePath = require.resolve('zod/package.json', { paths: [rootDir] });
    return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  } catch (error) {
    errors.push(`Unable to read installed zod package: ${error.message}`);
    return null;
  }
}

function readLatestZodVersion() {
  if (process.env.VLD_ZOD_PARITY_SKIP_REGISTRY === '1') {
    return null;
  }

  try {
    return execFileSync('npm', ['view', 'zod', 'version'], {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    const stderr = error.stderr ? error.stderr.toString().trim() : '';
    errors.push(`Unable to read latest zod version from npm registry${stderr ? `: ${stderr}` : ''}`);
    return null;
  }
}

function compareVersions(a, b) {
  const left = a.split(/[.-]/).map((part) => Number(part) || 0);
  const right = b.split(/[.-]/).map((part) => Number(part) || 0);
  const length = Math.max(left.length, right.length);

  for (let i = 0; i < length; i++) {
    const delta = (left[i] || 0) - (right[i] || 0);
    if (delta !== 0) {
      return delta;
    }
  }
  return 0;
}

function requireBuiltVld() {
  try {
    return require(path.join(rootDir, 'dist/cjs/index.cjs'));
  } catch (error) {
    errors.push(`Unable to load built VLD CJS entry. Run npm run build first: ${error.message}`);
    return null;
  }
}

function packageSpecifier(packageName, exportName) {
  if (exportName === '.') {
    return packageName;
  }
  return `${packageName}/${exportName.replace(/^\.\//, '')}`;
}

function verifyZodExportMapParity(installedZodPackage) {
  const zodExports = installedZodPackage.exports || {};
  const vldExports = packageJson.exports || {};
  const missingExportPaths = Object.keys(zodExports).filter((exportName) => !Object.prototype.hasOwnProperty.call(vldExports, exportName));

  if (missingExportPaths.length > 0) {
    errors.push(`VLD package exports are missing Zod public subpaths: ${missingExportPaths.join(', ')}`);
    return;
  }

  const publicSubpaths = Object.keys(zodExports)
    .filter((exportName) => exportName !== './package.json' && !exportName.includes('*'))
    .sort();

  for (const exportName of publicSubpaths) {
    const specifier = packageSpecifier(packageJson.name, exportName);

    try {
      require(specifier);
    } catch (error) {
      errors.push(`VLD CJS drop-in subpath failed to load ${specifier}: ${error.message}`);
    }

    try {
      execFileSync(process.execPath, ['--input-type=module', '-e', `await import(${JSON.stringify(specifier)});`], {
        cwd: rootDir,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (error) {
      const stderr = error.stderr ? error.stderr.toString().trim() : '';
      errors.push(`VLD ESM drop-in subpath failed to load ${specifier}${stderr ? `: ${stderr}` : ''}`);
    }
  }
}

function verifySubpathExportParity() {
  const checkedSubpaths = [
    ['zod/v4', `${packageJson.name}/v4`],
    ['zod/v4-mini', `${packageJson.name}/v4-mini`],
    ['zod/v4/mini', `${packageJson.name}/v4/mini`],
    ['zod/v4/core', `${packageJson.name}/v4/core`],
    ['zod/v4/locales', `${packageJson.name}/v4/locales`],
  ];

  for (const [zodSpecifier, vldSpecifier] of checkedSubpaths) {
    let zodSubpath;
    let vldSubpath;

    try {
      zodSubpath = require(zodSpecifier);
    } catch (error) {
      errors.push(`Unable to load ${zodSpecifier} for subpath parity: ${error.message}`);
      continue;
    }

    try {
      vldSubpath = require(vldSpecifier);
    } catch (error) {
      errors.push(`Unable to load ${vldSpecifier} for subpath parity: ${error.message}`);
      continue;
    }

    const missing = Object.keys(zodSubpath)
      .filter((key) => !Object.prototype.hasOwnProperty.call(vldSubpath, key))
      .sort();

    if (missing.length > 0) {
      errors.push(`${vldSpecifier} is missing ${missing.length} ${zodSpecifier} exports: ${missing.join(', ')}`);
      continue;
    }

    const typeMismatches = Object.keys(zodSubpath)
      .filter((key) => typeof vldSubpath[key] !== typeof zodSubpath[key])
      .sort();

    if (typeMismatches.length > 0) {
      errors.push(`${vldSpecifier} has ${typeMismatches.length} ${zodSpecifier} export type mismatches: ${typeMismatches.join(', ')}`);
    }
  }
}

function verifyNamespaceParity(zod, vld) {
  if (vld.z !== vld.v) {
    errors.push('VLD z namespace alias must reference the same object as v');
  }

  const namespaceKeys = [
    'parse',
    'safeParse',
    'decode',
    'encode',
    'toJSONSchema',
    'treeifyError',
    'prettifyError',
    'flattenError',
    'formatError',
    'NEVER',
    'iso',
    'coerce',
    'codec',
    'string',
    'object',
  ];

  for (const key of namespaceKeys) {
    if (typeof zod.z?.[key] !== 'undefined' && typeof vld.z?.[key] !== typeof zod.z[key]) {
      errors.push(`VLD z namespace ${key} type ${typeof vld.z?.[key]} does not match Zod ${typeof zod.z[key]}`);
    }
    if (typeof zod[key] !== 'undefined' && typeof vld.v?.[key] !== typeof zod[key]) {
      errors.push(`VLD v namespace ${key} type ${typeof vld.v?.[key]} does not match Zod root ${typeof zod[key]}`);
    }
  }
}

function verifyNamespaceBehavior(vld) {
  try {
    const schema = vld.z.object({ id: vld.z.string().min(2) });
    const valid = vld.z.safeParse(schema, { id: 'ok' });
    if (!valid.success || valid.data.id !== 'ok') {
      errors.push('VLD z.safeParse namespace smoke test returned an unexpected success result');
    }

    const invalid = vld.z.safeParse(schema, { id: 'x' });
    if (invalid.success) {
      errors.push('VLD z.safeParse namespace smoke test returned success for invalid data');
      return;
    }

    if (!(invalid.error instanceof vld.VldError)) {
      errors.push('VLD z.safeParse namespace smoke test did not return a VldError for object validation failure');
      return;
    }

    const tree = vld.z.treeifyError(invalid.error);
    const flattened = vld.z.flattenError(invalid.error);
    const pretty = vld.z.prettifyError(invalid.error);
    const jsonSchema = vld.z.toJSONSchema(schema);

    if (!tree || typeof tree !== 'object') {
      errors.push('VLD z.treeifyError namespace smoke test did not return an object');
    }
    if (!flattened || typeof flattened !== 'object') {
      errors.push('VLD z.flattenError namespace smoke test did not return an object');
    }
    if (typeof pretty !== 'string' || pretty.length === 0) {
      errors.push('VLD z.prettifyError namespace smoke test did not return a string');
    }
    if (!jsonSchema || jsonSchema.type !== 'object') {
      errors.push('VLD z.toJSONSchema namespace smoke test did not return an object schema');
    }
  } catch (error) {
    errors.push(`VLD z namespace behavior smoke test failed: ${error.message}`);
  }
}

const installedZodPackage = readInstalledZodPackage();
const latestZodVersion = readLatestZodVersion();
const zod = installedZodPackage ? require('zod') : null;
const vld = requireBuiltVld();

if (installedZodPackage && latestZodVersion && compareVersions(installedZodPackage.version, latestZodVersion) < 0) {
  errors.push(
    `Installed zod ${installedZodPackage.version} is behind npm latest ${latestZodVersion}. ` +
      'Update devDependencies and package-lock.json before releasing.'
  );
}

if (installedZodPackage && packageJson.devDependencies?.zod) {
  const declared = packageJson.devDependencies.zod.replace(/^[^\d]*/, '');
  if (declared && compareVersions(declared, installedZodPackage.version) < 0) {
    errors.push(
      `package.json declares zod ${packageJson.devDependencies.zod}, but node_modules has ${installedZodPackage.version}.`
    );
  }
}

if (zod && vld) {
  verifyZodExportMapParity(installedZodPackage);
  verifySubpathExportParity();

  const ignoredZodExports = new Set(['z']);
  const zodExports = Object.keys(zod).filter((key) => !ignoredZodExports.has(key)).sort();
  const vldExports = new Set(Object.keys(vld));
  const missing = zodExports.filter((key) => !vldExports.has(key));

  if (missing.length > 0) {
    errors.push(`VLD is missing ${missing.length} public Zod exports: ${missing.join(', ')}`);
  }

  verifyNamespaceParity(zod, vld);
  verifyNamespaceBehavior(vld);

  if (errors.length === 0) {
    console.log(
      `Zod parity verification passed: installed zod ${installedZodPackage.version}` +
        `${latestZodVersion ? `, npm latest ${latestZodVersion}` : ''}, ` +
        `${zodExports.length} checked Zod exports, ${Object.keys(vld).length} VLD exports`
    );
  }
}

if (errors.length > 0) {
  console.error('Zod parity verification failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}
