const { spawnSync } = require('child_process');
const r = spawnSync('node', ['./node_modules/npm/bin/npm-cli.js', 'run', 'build'], { encoding: 'utf8' });
process.stdout.write('STDOUT:\n' + (r.stdout || '') + '\n');
process.stdout.write('STDERR:\n' + (r.stderr || '') + '\n');
process.stdout.write('STATUS: ' + r.status + '\n');
