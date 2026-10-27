/**
 * Smoke tests for the 2026-10-27 ported locales (uk be bg cs el hu ro hr sl
 * he). Each catalog must be complete, register through the lazy builtin
 * registration, and produce localized messages end to end.
 */
import { v, setLocale, getLocale, getSupportedLocales, isLocaleSupported, type Locale } from '../../src/index';
import * as lazy from '../../src/locales/lazy';
import { en } from '../../src/locales/en';
import { uk } from '../../src/locales/uk';
import { be } from '../../src/locales/be';
import { bg } from '../../src/locales/bg';
import { cs } from '../../src/locales/cs';
import { el } from '../../src/locales/el';
import { hu } from '../../src/locales/hu';
import { ro } from '../../src/locales/ro';
import { hr } from '../../src/locales/hr';
import { sl } from '../../src/locales/sl';
import { he } from '../../src/locales/he';

const PORTED: Locale[] = ['uk', 'be', 'bg', 'cs', 'el', 'hu', 'ro', 'hr', 'sl', 'he'];
const ORIGINAL_LOCALE = getLocale();

describe('ported locales (2026-10-27)', () => {
  it('lazy setLocaleAsync resolves every ported locale through its loader', async () => {
    for (const code of PORTED) {
      await lazy.setLocaleAsync(code);
      expect(lazy.getLocale()).toBe(code);
    }
    lazy.setLocale(ORIGINAL_LOCALE);
  });

  afterAll(() => {
    setLocale(ORIGINAL_LOCALE);
  });

  it.each(PORTED)('%s is supported and switchable', (code) => {
    expect(isLocaleSupported(code)).toBe(true);
    setLocale(code);
    expect(getLocale()).toBe(code);
  });

  it.each(PORTED)('%s produces localized messages', (code) => {
    setLocale(code);
    const messages = v.string().min(5).safeParse('ab');
    expect(messages.success).toBe(false);
    if (!messages.success) {
      const text = messages.error.issues[0]!.message;
      expect(text).not.toContain('must be at least');
      expect(text).toContain('5');
    }
  });

  it.each(PORTED)('%s registers via getSupportedLocales()', (code) => {
    expect(getSupportedLocales()).toContain(code);
  });

  it('each ported catalog key set matches the en template', () => {
    const catalogs: Record<string, { [key: string]: unknown }> = {
      uk: uk as never, be: be as never, bg: bg as never, cs: cs as never, el: el as never,
      hu: hu as never, ro: ro as never, hr: hr as never, sl: sl as never, he: he as never
    };
    const enKeys = Object.keys(en).sort();
    for (const code of PORTED) {
      const catalog = catalogs[code]!;
      expect(Object.keys(catalog).sort()).toEqual(enKeys);
    }
  });
});
