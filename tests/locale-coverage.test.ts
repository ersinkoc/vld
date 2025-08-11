import { describe, it, expect } from '@jest/globals';
import { setLocale, getLocale, getMessages, getMessagesForLocale } from '../src/locales/index';
import type { Locale } from '../src/locales/types';

describe('Locale Functions 100% Coverage', () => {
  const allLocales: Locale[] = [
    'en', 'tr', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 
    'ar', 'hi', 'nl', 'pl', 'da', 'sv', 'no', 'fi', 'th', 'vi', 'id', 
    'bn', 'sw', 'af', 'pt-BR', 'es-MX'
  ];

  // Test locale index.ts functions
  describe('Locale index.ts coverage', () => {
    it('should throw error for unsupported locale', () => {
      expect(() => setLocale('invalid' as Locale)).toThrow('Unsupported locale: invalid');
    });

    it('should get and set locale correctly', () => {
      setLocale('en');
      expect(getLocale()).toBe('en');
      
      setLocale('tr');
      expect(getLocale()).toBe('tr');
    });

    it('should get messages for specific locale', () => {
      const enMessages = getMessagesForLocale('en');
      expect(enMessages.invalidString).toBe('Invalid string');
      
      const trMessages = getMessagesForLocale('tr');
      expect(trMessages.invalidString).toBe('Geçersiz metin');
    });

    it('should fallback to English for invalid locale in getMessagesForLocale', () => {
      const messages = getMessagesForLocale('invalid' as Locale);
      expect(messages.invalidString).toBe('Invalid string');
    });
  });

  allLocales.forEach(locale => {
    describe(`${locale} locale - ALL functions coverage`, () => {
      it('should call every single function in the locale', () => {
        setLocale(locale);
        const messages = getMessages();
        
        // String validation messages - call ALL functions
        expect(messages.invalidString).toBeDefined();
        expect(messages.stringMin(5)).toBeDefined();
        expect(messages.stringMax(10)).toBeDefined();
        expect(messages.stringLength(8)).toBeDefined();
        expect(messages.stringEmail).toBeDefined();
        expect(messages.stringUrl).toBeDefined();
        expect(messages.stringUuid).toBeDefined();
        expect(messages.stringRegex).toBeDefined();
        expect(messages.stringStartsWith('test')).toBeDefined();
        expect(messages.stringEndsWith('test')).toBeDefined();
        expect(messages.stringIncludes('test')).toBeDefined();
        expect(messages.stringIp).toBeDefined();
        expect(messages.stringIpv4).toBeDefined();
        expect(messages.stringIpv6).toBeDefined();
        expect(messages.stringEmpty).toBeDefined();
        
        // Number validation messages - call ALL functions
        expect(messages.invalidNumber).toBeDefined();
        expect(messages.numberMin(5)).toBeDefined();
        expect(messages.numberMax(10)).toBeDefined();
        expect(messages.numberInt).toBeDefined();
        expect(messages.numberPositive).toBeDefined();
        expect(messages.numberNegative).toBeDefined();
        expect(messages.numberNonnegative).toBeDefined();
        expect(messages.numberNonpositive).toBeDefined();
        expect(messages.numberFinite).toBeDefined();
        expect(messages.numberSafe).toBeDefined();
        expect(messages.numberMultipleOf(5)).toBeDefined();
        
        // Boolean validation messages
        expect(messages.invalidBoolean).toBeDefined();
        
        // Date validation messages - call ALL functions
        expect(messages.invalidDate).toBeDefined();
        const testDate = new Date('2024-01-01');
        expect(messages.dateMin(testDate)).toBeDefined();
        expect(messages.dateMax(testDate)).toBeDefined();
        
        // Object validation messages - call ALL functions
        expect(messages.invalidObject).toBeDefined();
        expect(messages.unexpectedKeys(['key1', 'key2'])).toBeDefined();
        
        // Array validation messages - call ALL functions
        expect(messages.invalidArray).toBeDefined();
        expect(messages.arrayMin(3)).toBeDefined();
        expect(messages.arrayMax(5)).toBeDefined();
        expect(messages.arrayLength(4)).toBeDefined();
        expect(messages.arrayEmpty).toBeDefined();
        expect(messages.arrayItem(0, 'error')).toBeDefined();
        
        // Object field validation - call function
        expect(messages.objectField('field', 'error')).toBeDefined();
        
        // Union validation messages - call function
        expect(messages.unionNoMatch(['error1', 'error2'])).toBeDefined();
        
        // Intersection validation messages - THIS WAS MISSING!
        expect(messages.intersectionError('test error')).toBeDefined();
        
        // Literal validation messages - call function
        expect(messages.literalExpected('expected', 'received')).toBeDefined();
        
        // Enum validation messages - call function
        expect(messages.enumExpected(['val1', 'val2'], 'received')).toBeDefined();
        
        // Special type validation messages
        expect(messages.expectedUndefined).toBeDefined();
        expect(messages.neverType).toBeDefined();
        
        // New advanced type validation messages
        expect(messages.invalidBigint).toBeDefined();
        expect(messages.invalidSymbol).toBeDefined();
        expect(messages.invalidTuple).toBeDefined();
        expect(messages.tupleLength(3, 2)).toBeDefined(); // THIS WAS MISSING!
        expect(messages.invalidRecord).toBeDefined();
        expect(messages.invalidSet).toBeDefined();
        expect(messages.invalidMap).toBeDefined();
        
        // Transformation and refinement messages - THESE WERE MISSING!
        expect(messages.transformError('transform error')).toBeDefined();
        expect(messages.refinementError('refinement error')).toBeDefined();
        expect(messages.customValidationError('custom error')).toBeDefined();
        
        // Coercion messages - THIS WAS MISSING!
        expect(messages.coercionFailed('string', 123)).toBeDefined();
        expect(messages.coercionFailed('number', 'abc')).toBeDefined();
        expect(messages.coercionFailed('boolean', null)).toBeDefined();
        expect(messages.coercionFailed('bigint', 3.14)).toBeDefined();
        expect(messages.coercionFailed('date', 'invalid')).toBeDefined();
      });
    });
  });
});