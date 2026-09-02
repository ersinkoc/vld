// One-shot script to add `requiredField` to every locale file that
// doesn't have it yet. Idempotent. Skips en.ts and tr.ts (already done).
// Inserts the line after `unexpectedKeys: ...` for consistency.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'D:/Codebox/__NPM__/vld/src/locales';
const files = readdirSync(dir).filter(f => f.endsWith('.ts') && !['types.ts', 'index.ts', 'runtime.ts', 'lazy.ts'].includes(f));

const PATTERN = /(\s+unexpectedKeys:\s*\([^)]*\)\s*=>\s*`[^`]+`)(,?)/;
const REPLACEMENT = '$1,\n  requiredField: (field: string) => `Required field "${field}" is missing`$2';

let updated = 0, skipped = 0, errors = [];
for (const f of files) {
  const path = join(dir, f);
  const src = readFileSync(path, 'utf8');
  if (src.includes('requiredField:')) { skipped++; continue; }
  if (!PATTERN.test(src)) { errors.push(`${f}: unexpectedKeys line not found`); continue; }
  const next = src.replace(PATTERN, REPLACEMENT);
  writeFileSync(path, next, 'utf8');
  updated++;
}

console.log(`Updated: ${updated}  Skipped (already had it): ${skipped}`);
if (errors.length) { console.log('Errors:'); for (const e of errors) console.log('  ' + e); }
