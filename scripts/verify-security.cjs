const { execFileSync, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const tempDir = path.join(rootDir, '.tmp', 'verify-security');
const isolatedUserConfigPath = path.join(tempDir, 'empty-user-npmrc');

function execFileCompat(command, args, options) {
  const needsShell =
    process.platform === 'win32' &&
    (/\.(cmd|bat)$/i.test(command) || !path.isAbsolute(command));
  if (needsShell) {
    const commandLine = [command, ...args]
      .map((part) => (/\s/.test(part) ? `"${part}"` : part))
      .join(' ');
    return execSync(commandLine, options);
  }
  return execFileSync(command, args, options);
}

function createIsolatedEnvironment() {
  const environment = { ...process.env };
  for (const key of Object.keys(environment)) {
    if (key.toLowerCase() === 'npm_config_allow_scripts') {
      delete environment[key];
    }
  }
  environment.NPM_CONFIG_USERCONFIG = isolatedUserConfigPath;
  environment.npm_config_userconfig = isolatedUserConfigPath;
  return environment;
}

fs.rmSync(tempDir, { recursive: true, force: true });
fs.mkdirSync(tempDir, { recursive: true });
fs.writeFileSync(isolatedUserConfigPath, '');

try {
  execFileCompat('npm', ['audit', '--audit-level=low', '--omit=dev', '--ignore-scripts'], {
    cwd: rootDir,
    env: createIsolatedEnvironment(),
    stdio: 'inherit',
  });
  console.log('Dependency security verification passed');
} catch (error) {
  process.exitCode = typeof error.status === 'number' ? error.status : 1;
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
  const tempRootDir = path.dirname(tempDir);
  if (fs.existsSync(tempRootDir) && fs.readdirSync(tempRootDir).length === 0) {
    fs.rmSync(tempRootDir, { recursive: true, force: true });
  }
}
