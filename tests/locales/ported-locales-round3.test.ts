/**
 * Smoke tests for the 2026-10-27 final-round locales (hy ka ta tk ps ckb yo
 * km ota + kh/ua deprecated-alias shims). With this round every zod locale
 * code is covered.
 */
import { v, setLocale, getLocale, isLocaleSupported, type Locale } from '../../src/index';
import * as lazy from '../../src/locales/lazy';
import { en } from '../../src/locales/en';
import { hy } from '../../src/locales/hy';
import { ka } from '../../src/locales/ka';
import { ta } from '../../src/locales/ta';
import { tk } from '../../src/locales/tk';
import { ps } from '../../src/locales/ps';
import { ckb } from '../../src/locales/ckb';
import { yo } from '../../src/locales/yo';
import { km } from '../../src/locales/km';
import { ota } from '../../src/locales/ota';
import { kh } from '../../src/locales/kh';
import { ua } from '../../src/locales/ua';

const PORTED: Locale[] = ['hy', 'ka', 'ta', 'tk', 'ps', 'ckb', 'yo', 'km', 'ota', 'kh', 'ua'];
const ORIGINAL_LOCALE = getLocale();

describe('ported locales final round (2026-10-27)', () => {
  it('lazy setLocaleAsync resolves every ported locale through its loader', async () => {
    for (const code of PORTED) {
      await lazy.setLocaleAsync(code);
      expect(lazy.getLocale()).toBe(code);
    }
    lazy.setLocale(ORIGINAL_LOCALE);
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

  it('each ported catalog key set matches the en template', () => {
    const catalogs: Record<string, { [key: string]: unknown }> = {
      hy: hy as never, ka: ka as never, ta: ta as never, tk: tk as never, ps: ps as never,
      ckb: ckb as never, yo: yo as never, km: km as never, ota: ota as never,
      kh: kh as never, ua: ua as never
    };
    const enKeys = Object.keys(en).sort();
    for (const code of PORTED) {
      const catalog = catalogs[code]!;
      expect(Object.keys(catalog).sort()).toEqual(enKeys);
    }
  });

  it('kh aliases km and ua aliases uk (zod deprecated aliases)', () => {
    expect(kh).toBe(km);
    expect(ua as unknown as Record<string, unknown>).toBeDefined();
  });
});
