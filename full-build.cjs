const { spawnSync } = require('child_process');
const steps = [
  ['node', ['-e', "require('fs').rmSync('./dist', { recursive: true, force: true })"]],
  ['node', ['./node_modules/rollup/dist/bin/rollup', '-c', 'rollup.config.mjs']],
  ['node', ['./node_modules/typescript/bin/tsc', '-p', 'tsconfig.build.json']],
  ['node', ['scripts/fix-imports.cjs']],
];
let allOk = true;
for (const [cmd, args] of steps) {
  const r = spawnSync(cmd, args, { encoding: 'utf8' });
  const ok = r.status === 0;
  allOk = allOk && ok;
  process.stdout.write(`\n=== ${cmd} ${args.join(' ')} -> ${ok ? 'OK' : 'FAILED'} (status ${r.status}) ===\n`);
  if (r.stdout) process.stdout.write('STDOUT:\n' + r.stdout + '\n');
  if (r.stderr) process.stdout.write('STDERR:\n' + r.stderr + '\n');
}
process.stdout.write('\nALL_OK: ' + allOk + '\n');
