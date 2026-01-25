/**
 * VLD Lazy Locale System
 *
 * This module provides lazy loading for locale files to reduce bundle size.
 * English is always bundled as a fallback; other languages are loaded on demand.
 *
 * @example
 * ```typescript
 * // Async loading (recommended for web apps)
 * import { setLocaleAsync, getMessages } from '@oxog/vld/locales';
 * await setLocaleAsync('tr');
 *
 * // Static import (for SSR or known locales)
 * import { tr } from '@oxog/vld/locales/tr';
 * import { registerLocale } from '@oxog/vld/locales';
 * registerLocale('tr', tr);
 * ```
 */

import type { Locale, LocaleMessages } from './types';
import { en } from './en'; // English is always bundled as fallback

// ============================================
// State
// ============================================

let currentLocale: Locale = 'en';
let currentMessages: LocaleMessages = en;
const loadedLocales = new Map<Locale, LocaleMessages>([['en', en]]);

// ============================================
// Dynamic Import Registry
// ============================================

type LocaleLoader = () => Promise<LocaleMessages>;

const localeLoaders: Partial<Record<Locale, LocaleLoader>> = {
  // Base languages
  tr: () => import('./tr').then(m => m.tr),
  es: () => import('./es').then(m => m.es),
  fr: () => import('./fr').then(m => m.fr),
  de: () => import('./de').then(m => m.de),
  it: () => import('./it').then(m => m.it),
  pt: () => import('./pt').then(m => m.pt),
  ru: () => import('./ru').then(m => m.ru),
  ja: () => import('./ja').then(m => m.ja),
  ko: () => import('./ko').then(m => m.ko),
  zh: () => import('./zh').then(m => m.zh),
  ar: () => import('./ar').then(m => m.ar),
  hi: () => import('./hi').then(m => m.hi),
  nl: () => import('./nl').then(m => m.nl),
  pl: () => import('./pl').then(m => m.pl),

  // Major European Languages
  da: () => import('./da').then(m => m.da),
  sv: () => import('./sv').then(m => m.sv),
  no: () => import('./no').then(m => m.no),
  fi: () => import('./fi').then(m => m.fi),

  // Major Asian Languages
  th: () => import('./th').then(m => m.th),
  vi: () => import('./vi').then(m => m.vi),
  id: () => import('./id').then(m => m.id),
  bn: () => import('./bn').then(m => m.bn),

  // African Languages
  sw: () => import('./sw').then(m => m.sw),
  af: () => import('./af').then(m => m.af),

  // American Languages
  'pt-BR': () => import('./pt-BR').then(m => m.ptBR),
  'es-MX': () => import('./es-MX').then(m => m.esMX),
};

// ============================================
// Public API
// ============================================

/**
 * Set the current locale asynchronously (lazy loading)
 * This is the recommended way to load locales in web applications.
 *
 * @param locale - The locale to set
 * @throws Error if the locale is not supported
 *
 * @example
 * ```typescript
 * await setLocaleAsync('tr');
 * // Now all validation errors will be in Turkish
 * ```
 */
export async function setLocaleAsync(locale: Locale): Promise<void> {
  // If already loaded, just switch
  if (loadedLocales.has(locale)) {
    currentLocale = locale;
    currentMessages = loadedLocales.get(locale)!;
    return;
  }

  // If English, it's already bundled
  if (locale === 'en') {
    currentLocale = 'en';
    currentMessages = en;
    return;
  }

  // Try to load dynamically
  const loader = localeLoaders[locale];
  if (!loader) {
    console.warn(`Locale "${locale}" not available. Falling back to English.`);
    return;
  }

  try {
    const messages = await loader();
    loadedLocales.set(locale, messages);
    currentLocale = locale;
    currentMessages = messages;
  } catch (error) {
    console.warn(`Failed to load locale "${locale}". Falling back to English.`, error);
  }
}

/**
 * Set the current locale synchronously
 * Only works if the locale has been pre-loaded or registered.
 *
 * @param locale - The locale to set
 * @throws Error if the locale is not preloaded
 *
 * @example
 * ```typescript
 * import { tr } from '@oxog/vld/locales/tr';
 * import { registerLocale, setLocale } from '@oxog/vld/locales';
 * registerLocale('tr', tr);
 * setLocale('tr'); // Now works synchronously
 * ```
 */
export function setLocale(locale: Locale): void {
  if (loadedLocales.has(locale)) {
    currentLocale = locale;
    currentMessages = loadedLocales.get(locale)!;
    return;
  }

  throw new Error(
    `Locale "${locale}" not preloaded. Use setLocaleAsync() for lazy loading ` +
    `or import the locale directly: import { ${locale} } from '@oxog/vld/locales/${locale}'`
  );
}

/**
 * Register a locale for synchronous access
 * Use this after importing a locale file directly.
 *
 * @param locale - The locale code
 * @param messages - The locale messages object
 *
 * @example
 * ```typescript
 * import { tr } from '@oxog/vld/locales/tr';
 * import { registerLocale } from '@oxog/vld/locales';
 * registerLocale('tr', tr);
 * ```
 */
export function registerLocale(locale: Locale, messages: LocaleMessages): void {
  loadedLocales.set(locale, messages);
}

/**
 * Get the current locale code
 */
export function getLocale(): Locale {
  return currentLocale;
}

/**
 * Get messages for the current locale
 * This is used internally by validators to get error messages.
 */
export function getMessages(): LocaleMessages {
  return currentMessages;
}

/**
 * Get messages for a specific locale
 * Returns English fallback if locale is not loaded.
 *
 * @param locale - The locale to get messages for
 */
export function getMessagesForLocale(locale: Locale): LocaleMessages {
  return loadedLocales.get(locale) || en;
}

/**
 * Check if a locale is loaded and available for synchronous use
 *
 * @param locale - The locale to check
 */
export function isLocaleLoaded(locale: Locale): boolean {
  return loadedLocales.has(locale);
}

/**
 * Check if a locale is supported (can be lazy loaded)
 *
 * @param locale - The locale to check
 */
export function isLocaleSupported(locale: Locale): boolean {
  return locale === 'en' || locale in localeLoaders;
}

/**
 * Get list of all supported locales
 */
export function getSupportedLocales(): Locale[] {
  return ['en', ...Object.keys(localeLoaders)] as Locale[];
}

/**
 * Preload multiple locales in parallel
 * Useful for SSR or when you know which locales will be needed.
 *
 * @param locales - Array of locale codes to preload
 *
 * @example
 * ```typescript
 * // Preload Turkish, German, and French
 * await preloadLocales(['tr', 'de', 'fr']);
 * ```
 */
export async function preloadLocales(locales: Locale[]): Promise<void> {
  await Promise.all(
    locales.map(async (locale) => {
      if (!loadedLocales.has(locale) && locale !== 'en') {
        const loader = localeLoaders[locale];
        if (loader) {
          try {
            const messages = await loader();
            loadedLocales.set(locale, messages);
          } catch {
            // Silently ignore preload failures
          }
        }
      }
    })
  );
}

// ============================================
// Re-export types
// ============================================

export type { Locale, LocaleMessages } from './types';
