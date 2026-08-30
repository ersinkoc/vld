const { spawnSync } = require('child_process');
const r = spawnSync('node', ['./node_modules/rollup/dist/bin/rollup', '-c', 'rollup.config.mjs'], { encoding: 'utf8' });
process.stdout.write('STDOUT:\n' + (r.stdout || '') + '\n');
process.stdout.write('STDERR:\n' + (r.stderr || '') + '\n');
process.stdout.write('STATUS: ' + r.status + '\n');
