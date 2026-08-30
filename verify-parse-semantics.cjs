const { spawnSync } = require('child_process');
const r = spawnSync('node', ['scripts/verify-parse-semantics.cjs'], { encoding: 'utf8' });
process.stdout.write('STDOUT:\n' + (r.stdout || '') + '\n');
process.stdout.write('STDERR:\n' + (r.stderr || '') + '\n');
process.stdout.write('STATUS: ' + r.status + '\n');
