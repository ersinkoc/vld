import type { Locale, LocaleMessages } from './types';
import { en } from './en';

const loadedLocales = new Map<Locale, LocaleMessages>([['en', en]]);
const translatedLocales = new Set<Locale>(['en']);

let currentLocale: Locale = 'en';
let currentMessages: LocaleMessages = en;

export function registerLocale(locale: Locale, messages: LocaleMessages): void {
  loadedLocales.set(locale, messages);
  translatedLocales.add(locale);
}

export function registerFallbackLocale(locale: Locale): void {
  loadedLocales.set(locale, en);
}

export function setLocale(locale: Locale): void {
  const messages = loadedLocales.get(locale);
  if (!messages) {
    throw new Error(`Unsupported locale: ${locale}`);
  }
  currentLocale = locale;
  currentMessages = messages;
}

export function getLocale(): Locale {
  return currentLocale;
}

export function getMessages(): LocaleMessages {
  return currentMessages;
}

export function getMessagesForLocale(locale: Locale): LocaleMessages {
  return loadedLocales.get(locale) || en;
}

export function isLocaleLoaded(locale: Locale): boolean {
  return loadedLocales.has(locale);
}

export function isLocaleSupported(locale: Locale): boolean {
  return translatedLocales.has(locale);
}

export function getSupportedLocales(): Locale[] {
  return [...translatedLocales];
}
