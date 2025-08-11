import { Locale, LocaleMessages } from './types';

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

// Create comprehensive locale registry
const locales: Record<Locale, LocaleMessages> = {
  // Base languages (already existing)
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
  
  // TODO: Add remaining languages from types.ts
  // For now, fallback to English for unimplemented languages
  is: en, cs: en, sk: en, hu: en, ro: en, bg: en, hr: en, sl: en, 
  lv: en, lt: en, et: en, el: en, mk: en, sq: en, sr: en, bs: en, 
  me: en, mt: en, ga: en, cy: en, eu: en, ca: en,
  
  // Asian languages fallbacks
  ms: en, tl: en, ur: en, fa: en, he: en, ka: en, am: en, hy: en, 
  az: en, kk: en, ky: en, uz: en, tg: en, mn: en, my: en, km: en, 
  lo: en, si: en, ta: en, te: en, ml: en, kn: en, gu: en, pa: en, 
  or: en, as: en, ne: en, mr: en, sd: en, dv: en,
  
  // African languages fallbacks
  ha: en, yo: en, ig: en, zu: en, xh: en, st: en, tn: en, ts: en, 
  ve: en, nr: en, ss: en,
  
  // American languages fallbacks
  'es-AR': en, 'fr-CA': en, qu: en, gn: en, ay: en
};

// Current locale state
let currentLocale: Locale = 'en';

/**
 * Set the current locale for validation messages
 */
export function setLocale(locale: Locale): void {
  if (!(locale in locales)) {
    throw new Error(`Unsupported locale: ${locale}`);
  }
  currentLocale = locale;
}

/**
 * Get the current locale
 */
export function getLocale(): Locale {
  return currentLocale;
}

/**
 * Get messages for the current locale
 */
export function getMessages(): LocaleMessages {
  return locales[currentLocale];
}

/**
 * Get messages for a specific locale
 */
export function getMessagesForLocale(locale: Locale): LocaleMessages {
  return locales[locale] || locales.en;
}

// Re-export types
export type { Locale, LocaleMessages } from './types';