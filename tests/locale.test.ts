import { describe, it, expect, beforeEach } from '@jest/globals';
import { v, setLocale, getLocale } from '../src/index';
import { getMessages, getMessagesForLocale, type Locale } from '../src/locales/index';

// Import all locale files to ensure they're covered
import '../src/locales/en';
import '../src/locales/tr';
import '../src/locales/es';
import '../src/locales/fr';
import '../src/locales/de';
import '../src/locales/it';
import '../src/locales/pt';
import '../src/locales/ru';
import '../src/locales/ja';
import '../src/locales/ko';
import '../src/locales/zh';
import '../src/locales/ar';
import '../src/locales/hi';
import '../src/locales/nl';
import '../src/locales/pl';
import '../src/locales/da';
import '../src/locales/sv';
import '../src/locales/no';
import '../src/locales/fi';
import '../src/locales/th';
import '../src/locales/vi';
import '../src/locales/id';
import '../src/locales/bn';
import '../src/locales/sw';
import '../src/locales/af';
import '../src/locales/pt-BR';
import '../src/locales/es-MX';

describe('Locale System Tests', () => {
  
  beforeEach(() => {
    // Reset to English before each test
    setLocale('en');
  });

  describe('Basic Locale Functionality', () => {
    it('should default to English', () => {
      expect(getLocale()).toBe('en');
    });

    it('should switch locales', () => {
      setLocale('tr');
      expect(getLocale()).toBe('tr');
      
      setLocale('es');
      expect(getLocale()).toBe('es');
      
      setLocale('fr');
      expect(getLocale()).toBe('fr');
    });

    it('should throw on invalid locale', () => {
      expect(() => setLocale('invalid' as Locale)).toThrow('Unsupported locale: invalid');
    });

    it('should get messages for current locale', () => {
      const enMessages = getMessages();
      expect(enMessages.invalidString).toBe('Invalid string');
      
      setLocale('tr');
      const trMessages = getMessages();
      expect(trMessages.invalidString).toBe('Geçersiz metin');
    });

    it('should get messages for specific locale', () => {
      const esMessages = getMessagesForLocale('es');
      expect(esMessages.invalidString).toBe('Cadena inválida');
      
      const deMessages = getMessagesForLocale('de');
      expect(deMessages.invalidString).toBe('Ungültiger String');
    });

    it('should fallback to English for invalid locale in getMessagesForLocale', () => {
      const messages = getMessagesForLocale('invalid' as Locale);
      expect(messages.invalidString).toBe('Invalid string');
    });
  });

  describe('All Locales Coverage', () => {
    const allLocales: Locale[] = ['en', 'tr', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi', 'nl', 'pl', 'da', 'sv', 'no', 'fi', 'th', 'vi', 'id', 'bn', 'sw', 'af', 'pt-BR', 'es-MX'];
    
    allLocales.forEach(locale => {
      describe(`${locale} locale`, () => {
        beforeEach(() => {
          setLocale(locale);
        });

        it('should have all string messages', () => {
          const messages = getMessages();
          expect(messages.invalidString).toBeDefined();
          expect(messages.stringMin(5)).toContain('5');
          expect(messages.stringMax(10)).toContain('10');
          expect(messages.stringLength(8)).toContain('8');
          expect(messages.stringEmail).toBeDefined();
          expect(messages.stringUrl).toBeDefined();
          expect(messages.stringUuid).toBeDefined();
          expect(messages.stringRegex).toBeDefined();
          expect(messages.stringStartsWith('test')).toContain('test');
          expect(messages.stringEndsWith('test')).toContain('test');
          expect(messages.stringIncludes('test')).toContain('test');
          expect(messages.stringIp).toBeDefined();
          expect(messages.stringIpv4).toBeDefined();
          expect(messages.stringIpv6).toBeDefined();
          expect(messages.stringEmpty).toBeDefined();
        });

        it('should have all number messages', () => {
          const messages = getMessages();
          expect(messages.invalidNumber).toBeDefined();
          expect(messages.numberMin(5)).toContain('5');
          expect(messages.numberMax(10)).toContain('10');
          expect(messages.numberInt).toBeDefined();
          expect(messages.numberPositive).toBeDefined();
          expect(messages.numberNegative).toBeDefined();
          expect(messages.numberNonnegative).toBeDefined();
          expect(messages.numberNonpositive).toBeDefined();
          expect(messages.numberFinite).toBeDefined();
          expect(messages.numberSafe).toBeDefined();
          expect(messages.numberMultipleOf(5)).toContain('5');
        });

        it('should have all other type messages', () => {
          const messages = getMessages();
          const testDate = new Date('2024-01-01');
          
          expect(messages.invalidBoolean).toBeDefined();
          expect(messages.invalidDate).toBeDefined();
          expect(messages.dateMin(testDate)).toContain('2024');
          expect(messages.dateMax(testDate)).toContain('2024');
          expect(messages.invalidObject).toBeDefined();
          expect(messages.unexpectedKeys(['key1', 'key2'])).toContain('key1');
          expect(messages.invalidArray).toBeDefined();
          expect(messages.arrayMin(3)).toContain('3');
          expect(messages.arrayMax(5)).toContain('5');
          expect(messages.arrayLength(4)).toContain('4');
          expect(messages.arrayEmpty).toBeDefined();
          expect(messages.arrayItem(0, 'error')).toContain('0');
          expect(messages.objectField('field', 'error')).toContain('field');
          expect(messages.unionNoMatch(['error1', 'error2'])).toContain('error1');
          expect(messages.literalExpected('expected', 'got')).toBeDefined();
          expect(messages.enumExpected(['val1', 'val2'], 'got')).toContain('val1');
          expect(messages.expectedUndefined).toBeDefined();
          expect(messages.neverType).toBeDefined();
          
          // Test new advanced type messages
          expect(messages.invalidBigint).toBeDefined();
          expect(messages.invalidSymbol).toBeDefined();
          expect(messages.invalidTuple).toBeDefined();
          expect(messages.tupleLength(3, 2)).toContain('3');
          expect(messages.tupleLength(3, 2)).toContain('2');
          expect(messages.invalidRecord).toBeDefined();
          expect(messages.invalidSet).toBeDefined();
          expect(messages.invalidMap).toBeDefined();
          
          // Test intersection error
          expect(messages.intersectionError('validation failed')).toContain('validation');
          
          // Test transformation and refinement messages
          expect(messages.transformError('transform failed')).toContain('transform');
          expect(messages.refinementError('refinement failed')).toContain('refin');
          expect(messages.customValidationError('custom error')).toContain('custom');
          
          // Test coercion message
          expect(messages.coercionFailed('string', 123)).toBeDefined();
          expect(messages.coercionFailed('number', 'abc')).toBeDefined();
        });
      });
    });
  });

  describe('Validation with Different Locales', () => {
    it('should show English errors', () => {
      setLocale('en');
      const result = v.string().min(5).safeParse('Hi') as { success: false; error: Error };
      expect(result.success).toBe(false);
      expect(result.error.message).toBe('String must be at least 5 characters');
    });

    it('should show Turkish errors', () => {
      setLocale('tr');
      const result = v.string().min(5).safeParse('Hi') as { success: false; error: Error };
      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Metin en az 5 karakter olmalı');
    });

    it('should show Spanish errors', () => {
      setLocale('es');
      const result = v.string().email().safeParse('invalid') as { success: false; error: Error };
      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Dirección de correo inválida');
    });

    it('should show French errors', () => {
      setLocale('fr');
      const result = v.number().positive().safeParse(-5) as { success: false; error: Error };
      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Le nombre doit être positif');
    });

    it('should show German errors', () => {
      setLocale('de');
      const result = v.string().url().safeParse('not-url') as { success: false; error: Error };
      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Ungültige URL');
    });

    it('should show Italian errors', () => {
      setLocale('it');
      const result = v.string().uuid().safeParse('not-uuid') as { success: false; error: Error };
      expect(result.success).toBe(false);
      expect(result.error.message).toBe('UUID non valido');
    });

    it('should show Portuguese errors', () => {
      setLocale('pt');
      const result = v.number().int().safeParse(3.14) as { success: false; error: Error };
      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Número deve ser inteiro');
    });

    it('should show Russian errors', () => {
      setLocale('ru');
      const result = v.string().min(3).safeParse('AB') as { success: false; error: Error };
      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Строка должна содержать не менее 3 символов');
    });

    it('should show Japanese errors', () => {
      setLocale('ja');
      const result = v.string().max(3).safeParse('ABCD') as { success: false; error: Error };
      expect(result.success).toBe(false);
      expect(result.error.message).toBe('文字列は3文字以下である必要があります');
    });

    it('should show Korean errors', () => {
      setLocale('ko');
      const result = v.number().negative().safeParse(5) as { success: false; error: Error };
      expect(result.success).toBe(false);
      expect(result.error.message).toBe('숫자는 음수여야 합니다');
    });

    it('should show Chinese errors', () => {
      setLocale('zh');
      const result = v.string().length(5).safeParse('ABC') as { success: false; error: Error };
      expect(result.success).toBe(false);
      expect(result.error.message).toBe('字符串必须正好5个字符');
    });

    it('should show Arabic errors', () => {
      setLocale('ar');
      const result = v.number().finite().safeParse(Infinity) as { success: false; error: Error };
      expect(result.success).toBe(false);
      expect(result.error.message).toBe('يجب أن يكون الرقم محدوداً');
    });

    it('should show Hindi errors', () => {
      setLocale('hi');
      const result = v.number().safe().safeParse(Number.MAX_SAFE_INTEGER + 1) as { success: false; error: Error };
      expect(result.success).toBe(false);
      expect(result.error.message).toBe('संख्या सुरक्षित पूर्णांक होनी चाहिए');
    });

    it('should show Dutch errors', () => {
      setLocale('nl');
      const result = v.string().regex(/test/).safeParse('invalid') as { success: false; error: Error };
      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Ongeldig formaat');
    });

    it('should show Polish errors', () => {
      setLocale('pl');
      const result = v.string().nonempty().safeParse('') as { success: false; error: Error };
      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Ciąg znaków nie może być pusty');
    });
  });

  describe('Complex Message Functions', () => {
    it('should handle string message functions', () => {
      setLocale('en');
      const messages = getMessages();
      
      expect(messages.stringStartsWith('hello')).toBe('String must start with "hello"');
      expect(messages.stringEndsWith('world')).toBe('String must end with "world"');
      expect(messages.stringIncludes('test')).toBe('String must include "test"');
    });

    it('should handle array and object message functions', () => {
      setLocale('en');
      const messages = getMessages();
      
      expect(messages.arrayItem(5, 'Invalid value')).toBe('Invalid item at index 5: Invalid value');
      expect(messages.objectField('email', 'Invalid email')).toBe('Invalid field "email": Invalid email');
      expect(messages.unexpectedKeys(['foo', 'bar'])).toBe('Unexpected keys: foo, bar');
      expect(messages.unionNoMatch(['String error', 'Number error'])).toBe('No union member matched: String error, Number error');
    });

    it('should handle literal and enum message functions', () => {
      setLocale('en');
      const messages = getMessages();
      
      expect(messages.literalExpected('active', 'inactive')).toBe('Expected active, got inactive');
      expect(messages.enumExpected(['red', 'green', 'blue'], 'yellow')).toBe('Expected one of [red, green, blue], got yellow');
    });

    it('should handle date message functions', () => {
      setLocale('en');
      const messages = getMessages();
      const date = new Date('2024-01-01');
      
      expect(messages.dateMin(date)).toBe('Date must be after 2024-01-01T00:00:00.000Z');
      expect(messages.dateMax(date)).toBe('Date must be before 2024-01-01T00:00:00.000Z');
    });
  });

  describe('Message Consistency', () => {
    const allLocales: Locale[] = ['en', 'tr', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi', 'nl', 'pl', 'da', 'sv', 'no', 'fi', 'th', 'vi', 'id', 'bn', 'sw', 'af', 'pt-BR', 'es-MX'];
    
    it('should have the same structure for all locales', () => {
      const enMessages = getMessagesForLocale('en');
      const enKeys = Object.keys(enMessages).sort();
      
      allLocales.forEach(locale => {
        const messages = getMessagesForLocale(locale);
        const keys = Object.keys(messages).sort();
        expect(keys).toEqual(enKeys);
      });
    });

    it('should have functions with same parameters for all locales', () => {
      allLocales.forEach(locale => {
        const messages = getMessagesForLocale(locale);
        
        // Test functions that take parameters
        expect(typeof messages.stringMin).toBe('function');
        expect(messages.stringMin.length).toBe(1); // Takes 1 parameter
        
        expect(typeof messages.arrayItem).toBe('function');
        expect(messages.arrayItem.length).toBe(2); // Takes 2 parameters
        
        expect(typeof messages.literalExpected).toBe('function');
        expect(messages.literalExpected.length).toBe(2); // Takes 2 parameters
      });
    });
  });

  describe('Real-world Usage', () => {
    it('should maintain locale across multiple validations', () => {
      setLocale('fr');
      
      const stringResult = v.string().min(5).safeParse('Hi');
      const numberResult = v.number().positive().safeParse(-5);
      const emailResult = v.string().email().safeParse('invalid');
      
      expect(stringResult.success).toBe(false);
      expect(numberResult.success).toBe(false);
      expect(emailResult.success).toBe(false);
      
      const strErr = stringResult as { success: false; error: Error };
      const numErr = numberResult as { success: false; error: Error };
      const emailErr = emailResult as { success: false; error: Error };
      
      expect(strErr.error.message).toContain('au moins 5');
      expect(numErr.error.message).toContain('positif');
      expect(emailErr.error.message).toContain('e-mail invalide');
    });

    it('should work with complex schemas', () => {
      setLocale('de');
      
      const schema = v.object({
        name: v.string().min(2),
        age: v.number().positive().int(),
        email: v.string().email()
      });
      
      const result = schema.safeParse({
        name: 'A',
        age: -5,
        email: 'not-email'
      });
      
      expect(result.success).toBe(false);
      const err = result as { success: false; error: Error };
      expect(err.error.message).toContain('Ungültiges');
    });

    it('should preserve custom messages over locale messages', () => {
      setLocale('es');
      
      const schema = v.string().min(5, 'Custom error message');
      const result = schema.safeParse('Hi');
      
      expect(result.success).toBe(false);
      const err = result as { success: false; error: Error };
      expect(err.error.message).toBe('Custom error message');
    });
  });

  describe('Advanced Type Messages Coverage', () => {
    it('should test all advanced type error messages in multiple locales', () => {
      const testLocales: Locale[] = ['en', 'tr', 'es', 'fr', 'de'];
      
      testLocales.forEach(locale => {
        setLocale(locale);
        const messages = getMessages();
        
        // Test BigInt validation
        const bigintResult = v.bigint().safeParse('not bigint') as { success: false; error: Error };
        expect(bigintResult.success).toBe(false);
        expect(bigintResult.error.message).toBe(messages.invalidBigint);
        
        // Test Symbol validation
        const symbolResult = v.symbol().safeParse('not symbol') as { success: false; error: Error };
        expect(symbolResult.success).toBe(false);
        expect(symbolResult.error.message).toBe(messages.invalidSymbol);
        
        // Test Tuple validation
        const tupleResult = v.tuple(v.string(), v.number()).safeParse(['test']) as { success: false; error: Error };
        expect(tupleResult.success).toBe(false);
        expect(tupleResult.error.message).toContain(messages.tupleLength(2, 1));
        
        // Test Record validation
        const recordResult = v.record(v.string()).safeParse('not object') as { success: false; error: Error };
        expect(recordResult.success).toBe(false);
        expect(recordResult.error.message).toBe(messages.invalidRecord);
        
        // Test Set validation  
        const setResult = v.set(v.string()).safeParse('not set') as { success: false; error: Error };
        expect(setResult.success).toBe(false);
        expect(setResult.error.message).toBe(messages.invalidSet);
        
        // Test Map validation
        const mapResult = v.map(v.string(), v.number()).safeParse('not map') as { success: false; error: Error };
        expect(mapResult.success).toBe(false);
        expect(mapResult.error.message).toBe(messages.invalidMap);
      });
    });

    it('should test transformation and refinement error messages', () => {
      const testLocales: Locale[] = ['en', 'ja', 'zh', 'ar'];
      
      testLocales.forEach(locale => {
        setLocale(locale);
        const messages = getMessages();
        
        // Test transform error
        const transformSchema = v.string().transform(() => {
          throw new Error('Transform failed');
        });
        const transformResult = transformSchema.safeParse('test') as { success: false; error: Error };
        expect(transformResult.success).toBe(false);
        expect(transformResult.error.message).toContain('Transform failed');
        
        // Test refinement error
        const refineSchema = v.string().refine(() => false, 'Refinement failed');
        const refineResult = refineSchema.safeParse('test') as { success: false; error: Error };
        expect(refineResult.success).toBe(false);
        // The error message will be localized, so just check it contains the custom message
        expect(refineResult.error.message).toContain('Refinement failed');
        
        // Test coercion error
        const coerceResult = v.coerce.number().safeParse('not a number') as { success: false; error: Error };
        expect(coerceResult.success).toBe(false);
        expect(coerceResult.error.message).toBe(messages.coercionFailed('number', 'not a number'));
      });
    });

    it('should test intersection error messages', () => {
      const testLocales: Locale[] = ['nl', 'pl', 'sv', 'no'];
      
      testLocales.forEach(locale => {
        setLocale(locale);
        getMessages(); // Verify locale is set
        
        // Create an intersection that will fail
        const schema = v.intersection(
          v.object({ a: v.string() }),
          v.object({ a: v.number() })
        );
        
        const result = schema.safeParse({ a: 'test' });
        expect(result.success).toBe(false);
      });
    });
  });
});