'use strict';
const { v, compile } = require('../dist/cjs/index.cjs');
const { z, compile: zCompile } = require('zod');

const schema = v.object({ a: v.string(), b: v.number() });
const zschema = z.object({ a: z.string(), b: z.number() });

const input = { a: 'hi', b: 1, extra: 'STRAY', evil: true };

console.log('--- Uncompiled parse (VLD) ---');
const u = schema.parse(input);
console.log('Result:', JSON.stringify(u));
console.log('Has extra?', 'extra' in u);

console.log('--- Compiled parse (VLD) ---');
const c = compile(schema);
const up = c.parse(input);
console.log('Result:', JSON.stringify(up));
console.log('Has extra?', 'extra' in up);
console.log('up === input?', up === input);

console.log('--- Compiled parse (Zod) ---');
const zc = zCompile(zschema);
const zp = zc.parse(input);
console.log('Result:', JSON.stringify(zp));
console.log('Has extra?', 'extra' in zp);
console.log('zp === input?', zp === input);

console.log('--- Compiled validate (VLD vs Zod) ---');
console.log('VLD:', v.validate(c, input));
console.log('Zod:', z.validate(zc, input));
