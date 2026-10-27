/**
 * Smoke tests for the 2026-10-27 second-round ported locales (az ca eo fa
 * fr-CA is lt mk ms nn ur uz zh-CN zh-TW).
 */
import { v, setLocale, getLocale, isLocaleSupported, type Locale } from '../../src/index';
import * as lazy from '../../src/locales/lazy';
import { en } from '../../src/locales/en';
import { az } from '../../src/locales/az';
import { ca } from '../../src/locales/ca';
import { eo } from '../../src/locales/eo';
import { fa } from '../../src/locales/fa';
import { frCA } from '../../src/locales/fr-CA';
import { is } from '../../src/locales/is';
import { lt } from '../../src/locales/lt';
import { mk } from '../../src/locales/mk';
import { ms } from '../../src/locales/ms';
import { nn } from '../../src/locales/nn';
import { ur } from '../../src/locales/ur';
import { uz } from '../../src/locales/uz';
import { zhCN } from '../../src/locales/zh-CN';
import { zhTW } from '../../src/locales/zh-TW';

const PORTED: Locale[] = ['az', 'ca', 'eo', 'fa', 'fr-CA', 'is', 'lt', 'mk', 'ms', 'nn', 'ur', 'uz', 'zh-CN', 'zh-TW'];
const ORIGINAL_LOCALE = getLocale();

describe('ported locales round 2 (2026-10-27)', () => {
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
      az: az as never, ca: ca as never, eo: eo as never, fa: fa as never, 'fr-CA': frCA as never,
      is: is as never, lt: lt as never, mk: mk as never, ms: ms as never, nn: nn as never,
      ur: ur as never, uz: uz as never, 'zh-CN': zhCN as never, 'zh-TW': zhTW as never
    };
    const enKeys = Object.keys(en).sort();
    for (const code of PORTED) {
      const catalog = catalogs[code]!;
      expect(Object.keys(catalog).sort()).toEqual(enKeys);
    }
  });

  it('zh-CN aliases the base zh catalog', () => {
    expect(zhCN).toBeDefined();
  });

  it('fr-CA uses Quebec courriel terminology', () => {
    expect(frCA.stringEmail).toContain('courriel');
  });
});
