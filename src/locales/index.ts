import { Locale, LocaleMessages } from './types';
import {
  getLocale,
  getMessages,
  getMessagesForLocale,
  getSupportedLocales,
  isLocaleLoaded,
  isLocaleSupported,
  registerFallbackLocale,
  registerLocale,
  setLocale
} from './runtime';

// Import all language files
import { en } from './en';
import { tr } from './tr';
import { es } from './es';
import { fr } from './fr';
import { de } from './de';
import { it } from './it';
import { pt } from './pt';
import { ru } from './ru';
import { ja } from './ja';
import { ko } from './ko';
import { zh } from './zh';
import { ar } from './ar';
import { hi } from './hi';
import { nl } from './nl';
import { pl } from './pl';

// Major European Languages
import { da } from './da';
import { sv } from './sv';
import { no } from './no';
import { fi } from './fi';

// Major Asian Languages
import { th } from './th';
import { vi } from './vi';
import { id } from './id';
import { bn } from './bn';

// African Languages
import { sw } from './sw';
import { af } from './af';

// American Languages
import { ptBR } from './pt-BR';
import { esMX } from './es-MX';

const translatedLocaleCodes = [
  'en', 'tr', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi', 'nl', 'pl',
  'da', 'sv', 'no', 'fi',
  'th', 'vi', 'id', 'bn',
  'sw', 'af',
  'pt-BR', 'es-MX'
] as const satisfies readonly Locale[];

const fallbackLocaleCodes = [
  'is', 'cs', 'sk', 'hu', 'ro', 'bg', 'hr', 'sl', 'lv', 'lt', 'et',
  'el', 'mk', 'sq', 'sr', 'bs', 'me', 'mt', 'ga', 'cy', 'eu', 'ca',
  'ms', 'tl', 'ur', 'fa', 'he', 'ka', 'am', 'hy', 'az', 'kk', 'ky',
  'uz', 'tg', 'mn', 'my', 'km', 'lo', 'si', 'ta', 'te', 'ml', 'kn',
  'gu', 'pa', 'or', 'as', 'ne', 'mr', 'sd', 'dv',
  'ha', 'yo', 'ig', 'zu', 'xh', 'st', 'tn', 'ts', 've', 'nr', 'ss',
  'es-AR', 'fr-CA', 'qu', 'gn', 'ay'
] as const satisfies readonly Locale[];

const translatedLocales: Record<typeof translatedLocaleCodes[number], LocaleMessages> = {
  // Base languages
  en, tr, es, fr, de, it, pt, ru, ja, ko, zh, ar, hi, nl, pl,
  
  // Major European Languages
  da, sv, no, fi,
  
  // Major Asian Languages  
  th, vi, id, bn,
  
  // African Languages
  sw, af,
  
  // American Languages
  'pt-BR': ptBR,
  'es-MX': esMX,
};

for (const locale of translatedLocaleCodes) {
  registerLocale(locale, translatedLocales[locale]);
}

for (const locale of fallbackLocaleCodes) {
  registerFallbackLocale(locale);
}

/**
 * Set the current locale asynchronously.
 *
 * The eager locale entrypoint already bundles translated locales and English
 * fallbacks, so this mirrors setLocale() while preserving async API parity.
 */
export async function setLocaleAsync(locale: Locale): Promise<void> {
  setLocale(locale);
}

/**
 * Register or override a locale for synchronous validation messages.
 */
export {
  getLocale,
  getMessages,
  getMessagesForLocale,
  getSupportedLocales,
  isLocaleLoaded,
  isLocaleSupported,
  registerLocale,
  setLocale
};

// Re-export types
export type { Locale, LocaleMessages } from './types';
