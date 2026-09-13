/**
 * Tajik (tg) locale coverage - added with the Zod 4.6 parity release.
 * Lives under tests/locales/ so the i18n assertions sit on the same
 * non-ASCII allowlist as the other locale catalogs.
 */

import { tg } from '../../src/locales/tg';
import { registerLocale, getMessagesForLocale, setLocale } from '../../src/locales/runtime';

describe('tg (Tajik) locale', () => {
  it('registers and produces Tajik messages', () => {
    registerLocale('tg', tg);
    setLocale('tg');
    const messages = getMessagesForLocale('tg');
    expect(messages.invalidString).toBe(tg.invalidString);
    expect(messages.stringMin(3)).toBe(tg.stringMin(3));
    expect(messages.numberMultipleOf(5)).toBe(tg.numberMultipleOf(5));
    expect(messages.enumExpected(['a', 'b'], 'c')).toContain('enum');
    expect(messages.fileMimeType(['image/png'])).toContain('image/png');
    setLocale('en');
  });

  it('renders every message template as a string', () => {
    const argSets: unknown[][] = [
      [3],
      ['x'],
      [3, 'x'],
      ['x', 'y'],
      [new Date()],
      [['a', 'b']],
      [['a'], 'y'],
      [['a'], ['b']],
    ];
    for (const value of Object.values(tg)) {
      if (typeof value !== 'function') continue;
      let rendered = false;
      for (const args of argSets) {
        try {
          const out = (value as (...a: unknown[]) => unknown)(...args);
          if (typeof out === 'string') {
            rendered = true;
            break;
          }
        } catch {
          // wrong arity/type for this template - try the next shape
        }
      }
      expect(rendered).toBe(true);
    }
  });
});
