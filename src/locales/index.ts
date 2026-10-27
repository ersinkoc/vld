import { Locale, LocaleMessages } from './types';
import {
  getLocale,
  getMessages,
  getMessagesForLocale as getMessagesForLocaleImpl,
  getSupportedLocales as getSupportedLocalesImpl,
  isLocaleLoaded as isLocaleLoadedImpl,
  isLocaleSupported as isLocaleSupportedImpl,
  registerFallbackLocale,
  registerLocale,
  setLocale as setLocaleImpl
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
import { gu } from './gu';
import { kn } from './kn';
import { ne } from './ne';
import { sk } from './sk';
import { tg } from './tg';
import { uk } from './uk';
import { be } from './be';
import { bg } from './bg';
import { cs } from './cs';
import { el } from './el';
import { hu } from './hu';
import { ro } from './ro';
import { hr } from './hr';
import { sl } from './sl';
import { he } from './he';
import { az } from './az';
import { ca } from './ca';
import { eo } from './eo';
import { fa } from './fa';
import { frCA } from './fr-CA';
import { is } from './is';
import { lt } from './lt';
import { mk } from './mk';
import { ms } from './ms';
import { nn } from './nn';
import { ur } from './ur';
import { uz } from './uz';
import { zhCN } from './zh-CN';
import { zhTW } from './zh-TW';

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
  'gu', 'kn', 'ne', 'sk',
  'sw', 'af',
  'tg',

  // 2026-10-27 port
  'uk', 'be', 'bg', 'cs', 'el', 'hu', 'ro', 'hr', 'sl', 'he',

  // 2026-10-27 second round
  'az', 'ca', 'eo', 'fa', 'fr-CA', 'is', 'lt', 'mk', 'ms', 'nn', 'ur', 'uz', 'zh-CN', 'zh-TW',

  'pt-BR', 'es-MX'
] as const satisfies readonly Locale[];

const fallbackLocaleCodes = [
         'lv',  'et',
    'sq', 'sr', 'bs', 'me', 'mt', 'ga', 'cy', 'eu', 
   'tl',    'ka', 'am', 'hy',  'kk', 'ky',
   'mn', 'my', 'km', 'lo', 'si', 'ta', 'te', 'ml',
  'pa', 'or', 'as', 'mr', 'sd', 'dv',
  'ha', 'yo', 'ig', 'zu', 'xh', 'st', 'tn', 'ts', 've', 'nr', 'ss',
  'es-AR',  'qu', 'gn', 'ay'
] as const satisfies readonly Locale[];

const translatedLocales: Record<typeof translatedLocaleCodes[number], LocaleMessages> = {
  // Base languages
  en, tr, es, fr, de, it, pt, ru, ja, ko, zh, ar, hi, nl, pl,

  // Major European Languages
  da, sv, no, fi, sk,

  // Major Asian Languages
  th, vi, id, bn, gu, kn, ne,

  // African Languages
  sw, af,

  // Tajik
  tg,

  // 2026-10-27 port: Ukrainian, Belarusian, Bulgarian, Czech, Greek,
  // Hungarian, Romanian, Croatian, Slovenian, Hebrew
  uk, be, bg, cs, el, hu, ro, hr, sl, he,

  // 2026-10-27 second round
  az, ca, eo, fa, 'fr-CA': frCA, is, lt, mk, ms, nn, ur, uz, 'zh-CN': zhCN, 'zh-TW': zhTW,

  // American Languages
  'pt-BR': ptBR,
  'es-MX': esMX,
};

let builtinsRegistered = false;

/**
 * Register the built-in translated locales and English fallbacks on first
 * use of a locale API.
 *
 * Registration used to run eagerly at import time, which forced every bundler
 * that keeps side-effectful statements (esbuild, webpack) to retain all 33
 * locale tables in every bundle importing the package root. Moving it behind
 * the locale APIs keeps `setLocale('tr')` working out of the box while
 * letting bundlers drop the tables from bundles that never call a locale
 * function. `registerLocale` intentionally does NOT trigger registration so
 * custom-locale-only bundles stay small.
 */
export function ensureBuiltinsRegistered(): void {
  if (builtinsRegistered) {
    return;
  }
  builtinsRegistered = true;
  for (const locale of translatedLocaleCodes) {
    registerLocale(locale, translatedLocales[locale]);
  }
  for (const locale of fallbackLocaleCodes) {
    registerFallbackLocale(locale);
  }
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

/** Locale APIs that observe the built-in registration wrap their runtime
 * counterparts so the first call registers the bundled tables. */
export function setLocale(locale: Locale): void {
  ensureBuiltinsRegistered();
  setLocaleImpl(locale);
}

export function getSupportedLocales(): Locale[] {
  ensureBuiltinsRegistered();
  return getSupportedLocalesImpl();
}

export function isLocaleSupported(locale: Locale): boolean {
  ensureBuiltinsRegistered();
  return isLocaleSupportedImpl(locale);
}

export function isLocaleLoaded(locale: Locale): boolean {
  ensureBuiltinsRegistered();
  return isLocaleLoadedImpl(locale);
}

export function getMessagesForLocale(locale: Locale): LocaleMessages {
  ensureBuiltinsRegistered();
  return getMessagesForLocaleImpl(locale);
}

export {
  getLocale,
  getMessages,
  registerLocale
};

// Re-export types
export type { Locale, LocaleMessages } from './types';
