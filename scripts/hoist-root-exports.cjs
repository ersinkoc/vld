// Post-build transform: hoist the destructured members of the main namespace
// object out of the object literal so root named exports never force its
// evaluation. esbuild (and webpack) cannot tree-shake through
// `const { string, ... } = NamespaceObject` inside a const chain - the
// destructuring evaluates the whole literal and pins every referenced
// import. Rollup inlines member reads; this makes the artifacts bundler-
// agnostic.
//
// Runs on dist/index.js and dist/cjs/index.cjs after rollup (wired into
// npm run build via scripts/fix-imports.cjs order).
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

function findStringEnd(text, i) {
  const q = text[i];
  i++;
  while (i < text.length && text[i] !== q) {
    if (text[i] === '\\') i++;
    i++;
  }
  return i + 1;
}

function findLiteralEnd(text, open) {
  let depth = 0;
  let i = open;
  while (i < text.length) {
    const c = text[i];
    if (c === '"' || c === "'") {
      i = findStringEnd(text, i);
      continue;
    }
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return i;
    }
    i++;
  }
  return -1;
}

// Parse object-literal members of a minified `{a:b,c(){...},...}` body.
function parseMembers(text, open, close) {
  const members = [];
  let pos = open + 1;
  const end = close;
  while (pos < end) {
    while (pos < end && /\s/.test(text[pos])) pos++;
    if (text[pos] === ',') {
      pos++;
      continue;
    }
    if (pos >= end) break;
    const km = /^(?:'([^']+)'|"([^"]+)"|([A-Za-z_$][\w$]*))\s*:/.exec(text.slice(pos, pos + 200));
    if (km) {
      const key = km[1] ?? km[2] ?? km[3];
      pos += km[0].length;
      let d = 0;
      let vEnd = pos;
      while (vEnd < end) {
        const c = text[vEnd];
        if (c === '"' || c === "'") {
          vEnd = findStringEnd(text, vEnd);
          continue;
        }
        if (c === '{' || c === '(' || c === '[') d++;
        else if (c === '}' || c === ')' || c === ']') {
          if (d === 0) break;
          d--;
        } else if (c === ',' && d === 0) break;
        vEnd++;
      }
      members.push({ key, value: text.slice(pos, vEnd).replace(/,+$/, '').trim() });
      pos = vEnd;
      continue;
    }
    const sm = /^([A-Za-z_$][\w$]*)\s*(?=[,}])/.exec(text.slice(pos, pos + 100));
    if (sm) {
      members.push({ key: sm[1], value: sm[1], shorthand: true });
      pos += sm[0].length;
      continue;
    }
    pos++;
  }
  return members;
}

// Positions where a top-level statement ends (`;` or `}` returning to depth
// 0), so inserts never land inside a function body.
function topLevelCutPoints(text) {
  const cuts = [];
  let depth = 0;
  let i = 0;
  const n = text.length;
  while (i < n) {
    const c = text[i];
    if (c === '"' || c === "'" || c === '`') {
      i = findStringEnd(text, i);
      continue;
    }
    if (c === '/' && text[i + 1] === '/') {
      while (i < n && text[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && text[i + 1] === '*') {
      i += 2;
      while (i < n && !(text[i] === '*' && text[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    if (c === '{' || c === '(' || c === '[') depth++;
    else if (c === '}' || c === ')' || c === ']') {
      depth--;
      if (depth === 0) cuts.push(i + 1);
    } else if (c === ';' && depth === 0) cuts.push(i + 1);
    i++;
  }
  return cuts;
}

function transformVariant(text) {
  // 1. Locate the big namespace object const.
  const declRe = /(?:^|[;,{}])(?:const|var|let)\s+([A-Za-z_$][\w$]*)\s*=\s*\{/g;
  let hit = null;
  let m;
  while ((m = declRe.exec(text))) {
    const open = text.indexOf('{', m.index + m[0].length - 1);
    const close = findLiteralEnd(text, open);
    if (close < 0 || close - open < 5000) continue;
    const name = m[1];
    // 2. After the literal, find the flat destructure `<pattern>}=NAME`
    const anchorRe = new RegExp('\\{([^{}]+)\\}=' + name + '\\b');
    const anchor = anchorRe.exec(text.slice(close, close + 8000));
    if (!anchor) continue;
    const patAbsStart = close + anchor.index;
    const patAbsEnd = close + anchor.index + anchor[0].length;
    hit = { name, nameStart: m.index, open, close, patAbsStart, patAbsEnd, pattern: anchor[1] };
    break;
  }
  if (!hit) return { skipped: 'pattern not found' };

  const { name, nameStart, open, close, patAbsStart, patAbsEnd, pattern } = hit;

  // 3. Destructure keys: entries `local`, `key:local`.
  const keys = pattern
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const parts = entry.split(':');
      return parts.length === 1
        ? { key: parts[0], local: parts[0] }
        : { key: parts[0].trim(), local: parts[1].trim() };
    });

  const members = parseMembers(text, open, close);
  const memberByKey = new Map(members.map((x) => [x.key, x]));
  const missing = keys.filter((k) => !memberByKey.has(k.key));
  if (missing.length) {
    return { skipped: 'missing members: ' + missing.slice(0, 5).map((k) => k.key).join(',') };
  }

  const safe = (k) => '__vld_' + k.replace(/[^A-Za-z0-9_$]/g, '_');
  const hoisted = [];
  const newMembers = members.map((mem) => {
    if (!keys.some((k) => k.key === mem.key)) {
      return mem.shorthand ? mem.key : mem.key + ':' + mem.value;
    }
    hoisted.push('var ' + safe(mem.key) + '=' + mem.value + ';');
    return mem.key + ':' + safe(mem.key);
  });
  const aliases = keys.map((k) => k.local + '=' + safe(k.key));

  // 4. Splice. The hoisted consts must land after the previous statement's
  // terminator (the namespace object declaration often sits inside a long
  // var/const chain, so inserting at the declaration itself would break
  // syntax). The destructuring `{...}=NAME` is replaced by plain alias
  // assignments continuing the surrounding chain.
  const kwPos = nameStart + (/[;,{}]/.test(text[nameStart]) ? 1 : 0);
  const cuts = topLevelCutPoints(text.slice(0, kwPos));
  let insertPos = 0;
  for (const c of cuts) if (c <= kwPos) insertPos = c;

  const out =
    text.slice(0, insertPos) +
    hoisted.join('') +
    text.slice(insertPos, open) +
    '{' + newMembers.join(',') + '}' +
    text.slice(close + 1, patAbsStart) +
    aliases.join(',') +
    text.slice(patAbsEnd);
  return { out, hoisted: hoisted.length, name };
}

function run(rel) {
  const file = path.join(rootDir, rel);
  if (!fs.existsSync(file)) return;
  const text = fs.readFileSync(file, 'utf8');
  const result = transformVariant(text);
  if (!result || result.skipped) {
    console.log(`hoist-root-exports: ${rel} skipped (${result ? result.skipped : 'no result'})`);
    return false;
  }
  if (!result.out) {
    console.log(`hoist-root-exports: ${rel} internal error (no output)`);
    return false;
  }
  fs.writeFileSync(file, result.out);
  console.log(`hoist-root-exports: ${rel} hoisted ${result.hoisted} members of ${result.name}`);
  return true;
}

module.exports = { run };

if (require.main === module) {
  // ESM only: CommonJS artifacts are never tree-shaken, so the transform
  // would add risk without benefit there.
  const okEsm = run('dist/index.js');
  if (!okEsm) process.exit(1);
}
