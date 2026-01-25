/**
 * Tests for src/locales/lazy.ts - Async locale loader
 */

import {
  setLocaleAsync,
  setLocale,
  registerLocale,
  getLocale,
  getMessages,
  getMessagesForLocale,
  isLocaleLoaded,
  isLocaleSupported,
  getSupportedLocales,
  preloadLocales,
  type Locale,
} from '../../src/locales/lazy';

// Import a locale for testing registerLocale
import { tr } from '../../src/locales/tr';
import { de } from '../../src/locales/de';
import { en } from '../../src/locales/en';

describe('Lazy Locale System', () => {
  // Reset to English before each test
  beforeEach(async () => {
    // Register English and set it as current
    registerLocale('en', en);
    setLocale('en');
  });

  describe('getLocale()', () => {
    test('returns current locale', () => {
      expect(getLocale()).toBe('en');
    });
  });

  describe('getMessages()', () => {
    test('returns messages for current locale', () => {
      const messages = getMessages();
      expect(messages).toBeDefined();
      expect(messages.invalidString).toBeDefined();
    });
  });

  describe('isLocaleLoaded()', () => {
    test('returns true for English (always loaded)', () => {
      expect(isLocaleLoaded('en')).toBe(true);
    });

    test('returns false for unloaded locale', () => {
      // Japanese is probably not loaded
      expect(isLocaleLoaded('ja')).toBe(false);
    });
  });

  describe('isLocaleSupported()', () => {
    test('returns true for English', () => {
      expect(isLocaleSupported('en')).toBe(true);
    });

    test('returns true for supported locale', () => {
      expect(isLocaleSupported('tr')).toBe(true);
      expect(isLocaleSupported('de')).toBe(true);
      expect(isLocaleSupported('fr')).toBe(true);
    });

    test('returns false for unsupported locale', () => {
      // A locale that doesn't exist in the loaders
      expect(isLocaleSupported('xyz' as Locale)).toBe(false);
    });
  });

  describe('getSupportedLocales()', () => {
    test('returns array of supported locales', () => {
      const locales = getSupportedLocales();
      expect(Array.isArray(locales)).toBe(true);
      expect(locales).toContain('en');
      expect(locales).toContain('tr');
      expect(locales).toContain('de');
      expect(locales.length).toBeGreaterThan(20); // At least 20+ locales
    });
  });

  describe('registerLocale()', () => {
    test('registers a locale for synchronous access', () => {
      registerLocale('tr', tr);
      expect(isLocaleLoaded('tr')).toBe(true);
    });

    test('registered locale can be used with setLocale', () => {
      registerLocale('de', de);
      setLocale('de');
      expect(getLocale()).toBe('de');
      const messages = getMessages();
      expect(messages.invalidString).toBe('Ungültiger String');
    });
  });

  describe('setLocale()', () => {
    test('sets locale synchronously when preloaded', () => {
      registerLocale('tr', tr);
      setLocale('tr');
      expect(getLocale()).toBe('tr');
    });

    test('throws for unloaded locale', () => {
      expect(() => setLocale('ja')).toThrow();
    });

    test('error message suggests using setLocaleAsync', () => {
      expect(() => setLocale('ja')).toThrow(/setLocaleAsync/);
    });
  });

  describe('setLocaleAsync()', () => {
    test('loads and sets locale asynchronously', async () => {
      await setLocaleAsync('tr');
      expect(getLocale()).toBe('tr');
      expect(isLocaleLoaded('tr')).toBe(true);
    });

    test('returns immediately for already loaded locale', async () => {
      registerLocale('de', de);
      await setLocaleAsync('de');
      expect(getLocale()).toBe('de');
    });

    test('returns immediately for English', async () => {
      await setLocaleAsync('en');
      expect(getLocale()).toBe('en');
    });

    test('loads various locales', async () => {
      await setLocaleAsync('es');
      expect(getLocale()).toBe('es');

      await setLocaleAsync('fr');
      expect(getLocale()).toBe('fr');

      await setLocaleAsync('ja');
      expect(getLocale()).toBe('ja');
    });

    test('handles unsupported locale gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      await setLocaleAsync('xyz' as Locale);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('not available'));
      consoleSpy.mockRestore();
    });

    test('loads pt-BR locale', async () => {
      await setLocaleAsync('pt-BR');
      expect(getLocale()).toBe('pt-BR');
    });

    test('loads es-MX locale', async () => {
      await setLocaleAsync('es-MX');
      expect(getLocale()).toBe('es-MX');
    });
  });

  describe('getMessagesForLocale()', () => {
    test('returns messages for specific locale when loaded', () => {
      registerLocale('tr', tr);
      const messages = getMessagesForLocale('tr');
      expect(messages.invalidString).toBe('Geçersiz metin');
    });

    test('returns English fallback for unloaded locale', () => {
      const messages = getMessagesForLocale('xyz' as Locale);
      expect(messages).toEqual(en);
    });
  });

  describe('preloadLocales()', () => {
    test('preloads multiple locales in parallel', async () => {
      await preloadLocales(['it', 'nl', 'pl']);
      expect(isLocaleLoaded('it')).toBe(true);
      expect(isLocaleLoaded('nl')).toBe(true);
      expect(isLocaleLoaded('pl')).toBe(true);
    });

    test('skips already loaded locales', async () => {
      registerLocale('de', de);
      await preloadLocales(['de', 'sv']);
      expect(isLocaleLoaded('de')).toBe(true);
      expect(isLocaleLoaded('sv')).toBe(true);
    });

    test('skips English (always loaded)', async () => {
      await preloadLocales(['en', 'no']);
      expect(isLocaleLoaded('en')).toBe(true);
      expect(isLocaleLoaded('no')).toBe(true);
    });

    test('silently ignores invalid locales', async () => {
      // Should not throw
      await preloadLocales(['fi', 'xyz' as Locale, 'da']);
      expect(isLocaleLoaded('fi')).toBe(true);
      expect(isLocaleLoaded('da')).toBe(true);
    });
  });

  describe('All locale loaders', () => {
    // Test that all supported locales can be loaded
    test('loads all major locales', async () => {
      const majorLocales: Locale[] = [
        'tr', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh',
        'ar', 'hi', 'nl', 'pl', 'da', 'sv', 'no', 'fi', 'th', 'vi',
        'id', 'bn', 'sw', 'af'
      ];

      for (const locale of majorLocales) {
        await setLocaleAsync(locale);
        expect(getLocale()).toBe(locale);
        expect(isLocaleLoaded(locale)).toBe(true);
      }
    });
  });

  describe('Message content validation', () => {
    test('Turkish messages are correct', async () => {
      await setLocaleAsync('tr');
      const messages = getMessages();
      expect(messages.invalidString).toBe('Geçersiz metin');
      expect(messages.invalidNumber).toBe('Geçersiz sayı');
    });

    test('German messages are correct', async () => {
      await setLocaleAsync('de');
      const messages = getMessages();
      expect(messages.invalidString).toBe('Ungültiger String');
    });

    test('Spanish messages are correct', async () => {
      await setLocaleAsync('es');
      const messages = getMessages();
      expect(messages.invalidString).toBe('Cadena inválida');
    });
  });
});
