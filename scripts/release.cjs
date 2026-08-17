// Bumps package.json version and creates the matching vX.Y.Z tag locally.
// Publishing is intentionally NOT done here — .github/workflows/release.yml
// ships the release on tag push (OIDC provenance, CHANGELOG check, GitHub
// Release). This script only produces the commit + tag; the maintainer
// pushes with `git push --follow-tags`.
//
// Usage:
//   npm run release                       # auto-detect bump from commits
//   npm run release -- patch             # force patch
//   npm run release -- minor             # force minor
//   npm run release -- major             # force major
//
// Bump heuristic (matches this project's existing release convention):
//   - any commit since the last vX.Y.Z tag containing "BREAKING CHANGE"
//     or a `feat!`/`fix!`/`<scope>!:` footer -> major
//   - else any commit with a `feat:` prefix   -> minor
//   - else                                      patch

const { execFileSync, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Windows resolves bare commands (npm, git) and .cmd/.bat shims only through
// a shell. Node refuses to spawn a .cmd without one (EINVAL) and cannot find
// a bare "git" without one (ENOENT). Route those through the shell with
// space-containing arguments quoted; native execs given by absolute path keep
// using execFileSync directly. Same pattern as scripts/verify-zod-parity.cjs.
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

function run(command, args, options) {
  return execFileCompat(command, args, options).toString().trim();
}

// Resolve git to an absolute path so the helper above skips the cmd.exe
// branch. Without this, --pretty=%s|||%b is parsed by cmd.exe as a pipeline
// and `|||` fails before git ever runs. Same reason npm gets a shell, but
// git we can spawn directly because we control its absolute path.
function resolveGit() {
  if (process.env.GIT && path.isAbsolute(process.env.GIT)) return process.env.GIT;
  const candidates =
    process.platform === 'win32'
      ? [
          'C:\\Program Files\\Git\\cmd\\git.exe',
          'C:\\Program Files\\Git\\mingw64\\bin\\git.exe',
        ]
      : ['/usr/bin/git', '/usr/local/bin/git'];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error('Unable to locate git binary on this system.');
}

const gitBin = resolveGit();

const rootDir = path.resolve(__dirname, '..');
const pkgPath = path.join(rootDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const currentVersion = pkg.version;

const explicit = process.argv.slice(2).find((arg) => /^(major|minor|patch)$/.test(arg));
let bump;

if (explicit) {
  bump = explicit;
} else {
  // Find the most recent vX.Y.Z tag (if any). No tags yet -> bump from 0.0.0.
  let range = '';
  try {
    const lastTag = run(gitBin, ['describe', '--tags', '--abbrev=0', '--match', 'v*.*.*']);
    if (lastTag) range = `${lastTag}..HEAD`;
  } catch (_) {
    range = '';
  }

  const logArgs = range
    ? ['log', range, '--pretty=%s|||%b']
    : ['log', '--pretty=%s|||%b'];
  let log = '';
  try {
    log = run(gitBin, logArgs);
  } catch (error) {
    console.error('Unable to read git log:', error.message);
    process.exit(1);
  }

  const commits = log
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const sep = line.indexOf('|||');
      return sep === -1
        ? { subject: line, body: '' }
        : { subject: line.slice(0, sep), body: line.slice(sep + 3) };
    });

  let detectedBump = 'patch';
  for (const commit of commits) {
    const subject = commit.subject;
    const body = commit.body;
    const hasBreakingFooter = /BREAKING CHANGE\s*:/i.test(body);
    const hasBangType = /^(feat|fix|perf|refactor|chore|build|ci|docs|style|test)(\([^)]+\))?!:/i.test(subject);
    if (hasBreakingFooter || hasBangType) {
      detectedBump = 'major';
      break;
    }
    if (/^feat(\([^)]+\))?:\s/i.test(subject)) {
      detectedBump = 'minor';
    }
  }
  bump = detectedBump;
}

function bumpVersion(version, kind) {
  const parts = version.split('.').map((n) => parseInt(n, 10));
  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    throw new Error(`Invalid semver in package.json: ${version}`);
  }
  if (kind === 'major') return `${parts[0] + 1}.0.0`;
  if (kind === 'minor') return `${parts[0]}.${parts[1] + 1}.0`;
  return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
}

const newVersion = bumpVersion(currentVersion, bump);

console.log(`Current version: ${currentVersion}`);
console.log(`Bump kind:       ${bump}`);
console.log(`New version:     ${newVersion}`);

// Delegate the actual commit + tag creation to `npm version` so the commit
// shape matches prior releases ("chore: release vX.Y.Z"). Using
// --no-git-tag would defeat the CI workflow; we WANT the vX.Y.Z tag here.
//
// Note: we must NOT pipe this call through run() because run() does
//   .toString().trim() on the child output, and Node returns null when
// stdio is 'inherit' (the parent already streamed it). Calling .toString()
// on null throws "Cannot read properties of null (reading 'toString')".
// Use execFileSync directly and ignore its return value — the user sees
// `npm version`'s own output via inherited stdio.
try {
  execFileCompat('npm', ['version', newVersion, '-m', `chore: release v${newVersion}`], {
    cwd: rootDir,
    stdio: 'inherit',
  });
} catch (error) {
  console.error(`npm version failed: ${error.message}`);
  process.exit(1);
}

console.log('');
console.log(`Created commit + tag v${newVersion}.`);
console.log('Push with:  git push --follow-tags');
console.log('CI workflow .github/workflows/release.yml will publish to npm.');
