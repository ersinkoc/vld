// VLD Internationalization Example  
// Demonstrates 27+ language support for validation errors

const { v, setLocale, getLocale } = require('../dist/index.js');

console.log('🌍 VLD Internationalization Examples\n');
console.log('Demonstrating 27+ language support for validation errors\n');

// Test schema that will generate various error types
const testSchema = v.object({
  name: v.string().min(3),
  email: v.string().email(),
  age: v.number().min(18).max(100),
  tags: v.array(v.string()).min(1),
  isActive: v.boolean()
});

// Invalid test data to trigger errors
const invalidData = {
  name: 'ab', // too short
  email: 'invalid-email', // invalid format
  age: 15, // too young
  tags: [], // too few items
  isActive: 'yes' // wrong type
};

// Function to test validation in a specific language
function testLanguage(locale, languageName) {
  console.log(`\n${languageName} (${locale}):`);
  setLocale(locale);
  
  try {
    testSchema.parse(invalidData);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Test individual field errors
  try {
    v.string().min(5).parse('hi');
  } catch (error) {
    console.log(`   String min: ${error.message}`);
  }
  
  try {
    v.number().max(10).parse(15);
  } catch (error) {
    console.log(`   Number max: ${error.message}`);
  }
}

// Major Languages
console.log('=== MAJOR LANGUAGES ===');

testLanguage('en', '🇬🇧 English');
testLanguage('es', '🇪🇸 Spanish');
testLanguage('fr', '🇫🇷 French'); 
testLanguage('de', '🇩🇪 German');
testLanguage('it', '🇮🇹 Italian');
testLanguage('pt', '🇵🇹 Portuguese');
testLanguage('ru', '🇷🇺 Russian');
testLanguage('ja', '🇯🇵 Japanese');
testLanguage('ko', '🇰🇷 Korean');
testLanguage('zh', '🇨🇳 Chinese');
testLanguage('ar', '🇸🇦 Arabic');
testLanguage('hi', '🇮🇳 Hindi');
testLanguage('tr', '🇹🇷 Turkish');
testLanguage('nl', '🇳🇱 Dutch');
testLanguage('pl', '🇵🇱 Polish');

// European Languages
console.log('\n\n=== EUROPEAN LANGUAGES ===');

testLanguage('da', '🇩🇰 Danish');
testLanguage('sv', '🇸🇪 Swedish');
testLanguage('no', '🇳🇴 Norwegian');
testLanguage('fi', '🇫🇮 Finnish');

// Asian Languages  
console.log('\n\n=== ASIAN LANGUAGES ===');

testLanguage('th', '🇹🇭 Thai');
testLanguage('vi', '🇻🇳 Vietnamese');
testLanguage('id', '🇮🇩 Indonesian');
testLanguage('bn', '🇧🇩 Bengali');

// African Languages
console.log('\n\n=== AFRICAN LANGUAGES ===');

testLanguage('sw', '🇰🇪 Swahili');
testLanguage('af', '🇿🇦 Afrikaans');

// American Languages
console.log('\n\n=== AMERICAN LANGUAGES ===');

testLanguage('pt-BR', '🇧🇷 Portuguese (Brazil)');
testLanguage('es-MX', '🇲🇽 Spanish (Mexico)');

// Advanced Features with Internationalization
console.log('\n\n=== ADVANCED FEATURES + I18N ===');

console.log('\nAdvanced Validation Types in Different Languages:');

// Test coercion errors in multiple languages
const testAdvancedErrors = (locale, languageName) => {
  console.log(`\n${languageName}:`);
  setLocale(locale);
  
  // Coercion errors
  try {
    v.coerce.number().parse('not-a-number');
  } catch (error) {
    console.log(`   Coercion error: ${error.message}`);
  }
  
  // BigInt errors
  try {
    v.bigint().parse('invalid');
  } catch (error) {
    console.log(`   BigInt error: ${error.message}`);
  }
  
  // Tuple errors
  try {
    v.tuple(v.string(), v.number()).parse(['a']);
  } catch (error) {
    console.log(`   Tuple error: ${error.message}`);
  }
  
  // Custom refine errors
  try {
    v.number().refine(n => n > 0, 'Must be positive').parse(-5);
  } catch (error) {
    console.log(`   Custom error: ${error.message}`);
  }
};

testAdvancedErrors('en', '🇬🇧 English');
testAdvancedErrors('tr', '🇹🇷 Turkish');
testAdvancedErrors('es', '🇪🇸 Spanish');
testAdvancedErrors('ja', '🇯🇵 Japanese');

// Real-world usage example
console.log('\n\n=== REAL-WORLD USAGE EXAMPLE ===');

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

// Simulate user from different countries
const users = [
  { locale: 'en', country: 'US', data: { username: 'jo', email: 'invalid', age: '12', country: 'US' } },
  { locale: 'es', country: 'ES', data: { username: 'pe', email: 'malo', age: '10', country: 'ES' } },
  { locale: 'ja', country: 'JP', data: { username: 'た', email: '無効', age: '8', country: 'JP' } },
  { locale: 'tr', country: 'TR', data: { username: 'kı', email: 'hatalı', age: '5', country: 'TR' } }
];

users.forEach(({ locale, country, data }, index) => {
  console.log(`\nUser ${index + 1} (${country}):`);
  const schema = createUserValidation(locale);
  
  try {
    schema.parse(data);
  } catch (error) {
    console.log(`   Validation error: ${error.message}`);
  }
});

// Demonstrate locale switching within application
console.log('\n\n=== DYNAMIC LOCALE SWITCHING ===');

const appSchema = v.object({
  email: v.string().email(),
  password: v.string().min(8)
});

const invalidInput = {
  email: 'not-an-email',
  password: 'short'
};

// Simulate different users with different language preferences
const userPreferences = ['en', 'tr', 'es', 'fr', 'de'];

userPreferences.forEach(locale => {
  setLocale(locale);
  console.log(`\nUser prefers ${locale.toUpperCase()}:`);
  
  try {
    appSchema.parse(invalidInput);
  } catch (error) {
    console.log(`   ${error.message}`);
  }
});

// Reset to English for consistency
setLocale('en');

console.log('\n\n✅ Internationalization Demo Complete!');
console.log('💡 VLD supports 27+ languages with full error message localization');
console.log('🌍 Perfect for global applications with diverse user bases');
console.log('🚀 Simply call setLocale() to switch languages dynamically');

// Show supported languages summary
console.log('\n📋 SUPPORTED LANGUAGES SUMMARY:');
console.log('Base: en, tr, es, fr, de, it, pt, ru, ja, ko, zh, ar, hi, nl, pl');
console.log('European: da, sv, no, fi');  
console.log('Asian: th, vi, id, bn');
console.log('African: sw, af');
console.log('American: pt-BR, es-MX');
console.log('Plus: 75+ additional languages with English fallback!');