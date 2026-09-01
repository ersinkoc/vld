// VLD v3.0 — Internationalization example
// 27+ language support for validation errors, including V2 error paths.
// VLD's V2 path (vV2) reuses the same locale templates as V1.

import { v, vV2, setLocale, getLocale } from '../dist/index.js';

console.log('VLD v3.0 Internationalization Examples\n');
console.log('27+ languages supported on both V1 and V2 paths\n');

const testSchema = v.object({
  name: v.string().min(3),
  email: v.string().email(),
  age: v.number().min(18).max(100),
  tags: v.array(v.string()).min(1),
  isActive: v.boolean()
});

const invalidData = {
  name: 'ab',
  email: 'invalid-email',
  age: 15,
  tags: [],
  isActive: 'yes'
};

function testLanguage(locale, languageName) {
  console.log(`\n${languageName} (${locale}):`);
  setLocale(locale);

  try { testSchema.parse(invalidData); }
  catch (error) { console.log(`   Error: ${error.message}`); }

  try { v.string().min(5).parse('hi'); }
  catch (error) { console.log(`   String min: ${error.message}`); }

  try { v.number().max(10).parse(15); }
  catch (error) { console.log(`   Number max: ${error.message}`); }
}

// Major Languages
console.log('=== MAJOR LANGUAGES ===');

testLanguage('en', 'English');
testLanguage('es', 'Spanish');
testLanguage('fr', 'French');
testLanguage('de', 'German');
testLanguage('it', 'Italian');
testLanguage('pt', 'Portuguese');
testLanguage('ru', 'Russian');
testLanguage('ja', 'Japanese');
testLanguage('ko', 'Korean');
testLanguage('zh', 'Chinese');
testLanguage('ar', 'Arabic');
testLanguage('hi', 'Hindi');
testLanguage('tr', 'Turkish');
testLanguage('nl', 'Dutch');
testLanguage('pl', 'Polish');

// European Languages
console.log('\n=== EUROPEAN LANGUAGES ===');

testLanguage('da', 'Danish');
testLanguage('sv', 'Swedish');
testLanguage('no', 'Norwegian');
testLanguage('fi', 'Finnish');

// Asian Languages
console.log('\n=== ASIAN LANGUAGES ===');

testLanguage('th', 'Thai');
testLanguage('vi', 'Vietnamese');
testLanguage('id', 'Indonesian');
testLanguage('bn', 'Bengali');

// African Languages
console.log('\n=== AFRICAN LANGUAGES ===');

testLanguage('sw', 'Swahili');
testLanguage('af', 'Afrikaans');

// American Languages
console.log('\n=== AMERICAN LANGUAGES ===');

testLanguage('pt-BR', 'Portuguese (Brazil)');
testLanguage('es-MX', 'Spanish (Mexico)');

// ----- V2 path with i18n (recommended for hot paths) -----
console.log('\n=== V2 + i18n (VLD 3.0 new) ===');

const testV2Errors = (locale, languageName) => {
  console.log(`\n${languageName}:`);
  setLocale(locale);

  // V2 chain — 2-6x faster than V1
  try { vV2.string().min(5).email().parse('xx'); }
  catch (e) { console.log(`   V2 email+min: ${e.message}`); }

  try { vV2.number().int().min(0).max(10).parse(99); }
  catch (e) { console.log(`   V2 number range: ${e.message}`); }

  try { vV2.array(vV2.string()).min(2).max(5).parse(['only-one']); }
  catch (e) { console.log(`   V2 array min: ${e.message}`); }
};

testV2Errors('en', 'English');
testV2Errors('tr', 'Turkish');
testV2Errors('es', 'Spanish');
testV2Errors('ja', 'Japanese');

// Advanced Features with Internationalization
console.log('\n=== ADVANCED FEATURES + I18N ===');

const testAdvancedErrors = (locale, languageName) => {
  console.log(`\n${languageName}:`);
  setLocale(locale);

  try { v.coerce.number().parse('not-a-number'); }
  catch (error) { console.log(`   Coercion error: ${error.message}`); }

  try { v.bigint().parse('invalid'); }
  catch (error) { console.log(`   BigInt error: ${error.message}`); }

  try { v.tuple(v.string(), v.number()).parse(['a']); }
  catch (error) { console.log(`   Tuple error: ${error.message}`); }

  try { v.number().refine(n => n > 0, 'Must be positive').parse(-5); }
  catch (error) { console.log(`   Custom error: ${error.message}`); }
};

testAdvancedErrors('en', 'English');
testAdvancedErrors('tr', 'Turkish');
testAdvancedErrors('es', 'Spanish');
testAdvancedErrors('ja', 'Japanese');

// Real-world usage
console.log('\n=== REAL-WORLD USAGE EXAMPLE ===');

function createUserValidation(userLocale) {
  setLocale(userLocale);

  return v.object({
    username: v.string()
      .min(3, 'Username too short')
      .max(20, 'Username too long'),
    email: v.string().email('Invalid email format'),
    age: v.coerce.number()
      .min(13, 'Must be at least 13 years old')
      .max(120, 'Age too high'),
    country: v.string().min(2, 'Country code required')
  });
}

const users = [
  { locale: 'en', country: 'US', data: { username: 'jo', email: 'invalid', age: '12', country: 'US' } },
  { locale: 'es', country: 'ES', data: { username: 'pe', email: 'malo', age: '10', country: 'ES' } },
  { locale: 'ja', country: 'JP', data: { username: 't', email: 'muda', age: '8', country: 'JP' } },
  { locale: 'tr', country: 'TR', data: { username: 'ki', email: 'hatali', age: '5', country: 'TR' } }
];

users.forEach(({ locale, country, data }, index) => {
  console.log(`\nUser ${index + 1} (${country}):`);
  const schema = createUserValidation(locale);
  try { schema.parse(data); }
  catch (error) { console.log(`   Validation error: ${error.message}`); }
});

// Dynamic locale switching
console.log('\n=== DYNAMIC LOCALE SWITCHING ===');

const appSchema = v.object({
  email: v.string().email(),
  password: v.string().min(8)
});

const invalidInput = { email: 'not-an-email', password: 'short' };

['en', 'tr', 'es', 'fr', 'de'].forEach(locale => {
  setLocale(locale);
  console.log(`\nUser prefers ${locale.toUpperCase()}:`);
  try { appSchema.parse(invalidInput); }
  catch (error) { console.log(`   ${error.message}`); }
});

// Reset to English
setLocale('en');
console.log(`\nFinal locale: ${getLocale()}`);

console.log('\nInternationalization demo complete.');
console.log('27+ languages supported on V1 and V2 paths.');
console.log('Tip: vV2 chains for hot paths, v.setLocale for global locale.');
