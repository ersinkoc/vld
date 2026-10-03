/**
 * String length as Zod 4.6 measures it: in code points, so an astral
 * character (emoji, CJK extension B) counts once instead of as two UTF-16
 * units.
 */
const HIGH_SURROGATE = /[\uD800-\uDBFF]/;

export function codePointLength(value: string): number {
  const units = value.length;
  if (!HIGH_SURROGATE.test(value)) return units;
  let count = units;
  for (let i = 0; i < units - 1; i++) {
    if ((value.charCodeAt(i) & 0xfc00) === 0xd800 && (value.charCodeAt(i + 1) & 0xfc00) === 0xdc00) {
      count--;
      i++;
    }
  }
  return count;
}

// A code point is one or two UTF-16 units, so the exact count is only needed
// when the unit count alone cannot decide the bound.
export const hasMinLength = (value: string, min: number): boolean =>
  value.length >= min && (value.length >= min * 2 || codePointLength(value) >= min);
export const hasMaxLength = (value: string, max: number): boolean =>
  value.length <= max || codePointLength(value) <= max;
export const hasExactLength = (value: string, length: number): boolean =>
  value.length >= length && value.length <= length * 2 && codePointLength(value) === length;
