const { spawnSync } = require('child_process');
const r = spawnSync('node', ['./node_modules/vite/bin/vite.js', 'build'], { encoding: 'utf8', cwd: 'website-new' });
process.stdout.write('STDOUT:\n' + (r.stdout || '') + '\n');
process.stdout.write('STDERR:\n' + (r.stderr || '') + '\n');
process.stdout.write('STATUS: ' + r.status + '\n');
