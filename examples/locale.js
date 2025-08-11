import { v, setLocale, getLocale } from '@oxog/vld';

console.log('🌍 VLD Locale Support Example\n');
console.log('='.repeat(50));

// Create a schema
const userSchema = v.object({
  name: v.string().min(2).max(50),
  email: v.string().email(),
  age: v.number().positive().int().max(120)
});

// Test with different locales
const invalidData = {
  name: 'J',  // Too short
  email: 'not-an-email',
  age: -5  // Negative number
};

console.log('\n📍 Current locale:', getLocale());

// English (default)
console.log('\n🇬🇧 English:');
let result = userSchema.safeParse(invalidData);
if (!result.success) {
  console.log('Error:', result.error.message);
}

// Turkish
console.log('\n🇹🇷 Turkish:');
setLocale('tr');
result = v.string().min(2).safeParse('J');
if (!result.success) {
  console.log('Hata:', result.error.message);
}

// Spanish
console.log('\n🇪🇸 Spanish:');
setLocale('es');
result = v.string().email().safeParse('invalid');
if (!result.success) {
  console.log('Error:', result.error.message);
}

// French
console.log('\n🇫🇷 French:');
setLocale('fr');
result = v.number().positive().safeParse(-5);
if (!result.success) {
  console.log('Erreur:', result.error.message);
}

// German
console.log('\n🇩🇪 German:');
setLocale('de');
result = v.string().min(5).safeParse('Hi');
if (!result.success) {
  console.log('Fehler:', result.error.message);
}

// Italian
console.log('\n🇮🇹 Italian:');
setLocale('it');
result = v.string().email().safeParse('invalid');
if (!result.success) {
  console.log('Errore:', result.error.message);
}

// Portuguese
console.log('\n🇵🇹 Portuguese:');
setLocale('pt');
result = v.number().int().safeParse(3.14);
if (!result.success) {
  console.log('Erro:', result.error.message);
}

// Russian
console.log('\n🇷🇺 Russian:');
setLocale('ru');
result = v.string().min(3).safeParse('AB');
if (!result.success) {
  console.log('Ошибка:', result.error.message);
}

// Japanese
console.log('\n🇯🇵 Japanese:');
setLocale('ja');
result = v.string().email().safeParse('invalid');
if (!result.success) {
  console.log('エラー:', result.error.message);
}

// Korean
console.log('\n🇰🇷 Korean:');
setLocale('ko');
result = v.number().positive().safeParse(0);
if (!result.success) {
  console.log('오류:', result.error.message);
}

// Chinese
console.log('\n🇨🇳 Chinese:');
setLocale('zh');
result = v.string().min(5).safeParse('你好');
if (!result.success) {
  console.log('错误:', result.error.message);
}

// Arabic
console.log('\n🇸🇦 Arabic:');
setLocale('ar');
result = v.string().email().safeParse('invalid');
if (!result.success) {
  console.log('خطأ:', result.error.message);
}

// Hindi
console.log('\n🇮🇳 Hindi:');
setLocale('hi');
result = v.number().positive().safeParse(-10);
if (!result.success) {
  console.log('त्रुटि:', result.error.message);
}

// Dutch
console.log('\n🇳🇱 Dutch:');
setLocale('nl');
result = v.string().min(3).safeParse('Hi');
if (!result.success) {
  console.log('Fout:', result.error.message);
}

// Polish
console.log('\n🇵🇱 Polish:');
setLocale('pl');
result = v.string().email().safeParse('invalid');
if (!result.success) {
  console.log('Błąd:', result.error.message);
}

// Reset to English
setLocale('en');

console.log('\n' + '='.repeat(50));
console.log('✨ Locale support demonstration complete!');
console.log('\nSupported locales:');
console.log('  en, tr, es, fr, de, it, pt, ru, ja, ko, zh, ar, hi, nl, pl');
console.log('\nUsage:');
console.log("  import { setLocale } from '@oxog/vld';");
console.log("  setLocale('tr'); // Switch to Turkish");
console.log("  setLocale('es'); // Switch to Spanish");
console.log('  // ... etc');