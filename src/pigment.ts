/**
 * VLD Pigment - Colored Console Output
 *
 * This module provides ANSI color utilities for terminal output,
 * compatible with @oxog/pigment when available.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const window: any;
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Check if colors are supported in the current environment
 */
export function supportsColor(): boolean {
  // Check for NO_COLOR environment variable
  if (typeof process !== 'undefined' && process.env?.NO_COLOR) {
    return false;
  }

  // Check for FORCE_COLOR environment variable
  if (typeof process !== 'undefined' && process.env?.FORCE_COLOR) {
    return true;
  }

  // Check for TTY
  if (typeof process !== 'undefined' && process.stdout?.isTTY) {
    return true;
  }

  // Browser environment - no ANSI colors
  if (typeof window !== 'undefined') {
    return false;
  }

  return false;
}

/**
 * ANSI escape codes
 */
const ANSI = {
  // Reset
  reset: '\x1b[0m',

  // Styles
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
  blink: '\x1b[5m',
  inverse: '\x1b[7m',
  hidden: '\x1b[8m',
  strikethrough: '\x1b[9m',

  // Foreground colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  grey: '\x1b[90m',

  // Bright foreground colors
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',

  // Background colors
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',

  // Bright background colors
  bgBrightRed: '\x1b[101m',
  bgBrightGreen: '\x1b[102m',
  bgBrightYellow: '\x1b[103m',
  bgBrightBlue: '\x1b[104m',
  bgBrightMagenta: '\x1b[105m',
  bgBrightCyan: '\x1b[106m',
  bgBrightWhite: '\x1b[107m'
} as const;

/**
 * Create a color function
 */
function createColorFn(code: string): (text: string) => string {
  const enabled = supportsColor();
  return (text: string): string => {
    if (!enabled) return text;
    return `${code}${text}${ANSI.reset}`;
  };
}

/**
 * Pigment - Color utilities for terminal output
 */
export const pigment = {
  // Check support
  supportsColor,

  // Reset
  reset: (text: string): string => text,

  // Styles
  bold: createColorFn(ANSI.bold),
  dim: createColorFn(ANSI.dim),
  italic: createColorFn(ANSI.italic),
  underline: createColorFn(ANSI.underline),
  inverse: createColorFn(ANSI.inverse),
  hidden: createColorFn(ANSI.hidden),
  strikethrough: createColorFn(ANSI.strikethrough),

  // Foreground colors
  black: createColorFn(ANSI.black),
  red: createColorFn(ANSI.red),
  green: createColorFn(ANSI.green),
  yellow: createColorFn(ANSI.yellow),
  blue: createColorFn(ANSI.blue),
  magenta: createColorFn(ANSI.magenta),
  cyan: createColorFn(ANSI.cyan),
  white: createColorFn(ANSI.white),
  gray: createColorFn(ANSI.gray),
  grey: createColorFn(ANSI.grey),

  // Bright colors
  brightRed: createColorFn(ANSI.brightRed),
  brightGreen: createColorFn(ANSI.brightGreen),
  brightYellow: createColorFn(ANSI.brightYellow),
  brightBlue: createColorFn(ANSI.brightBlue),
  brightMagenta: createColorFn(ANSI.brightMagenta),
  brightCyan: createColorFn(ANSI.brightCyan),
  brightWhite: createColorFn(ANSI.brightWhite),

  // Background colors
  bgBlack: createColorFn(ANSI.bgBlack),
  bgRed: createColorFn(ANSI.bgRed),
  bgGreen: createColorFn(ANSI.bgGreen),
  bgYellow: createColorFn(ANSI.bgYellow),
  bgBlue: createColorFn(ANSI.bgBlue),
  bgMagenta: createColorFn(ANSI.bgMagenta),
  bgCyan: createColorFn(ANSI.bgCyan),
  bgWhite: createColorFn(ANSI.bgWhite),

  // Semantic colors
  success: createColorFn(ANSI.green),
  error: createColorFn(ANSI.red),
  warning: createColorFn(ANSI.yellow),
  info: createColorFn(ANSI.blue),
  muted: createColorFn(ANSI.gray),

  // Combine multiple styles
  combine: (...codes: string[]) =>
    (text: string): string => {
      if (!supportsColor()) return text;
      return `${codes.join('')}${text}${ANSI.reset}`;
    },

  // Strip ANSI codes from string
  strip: (text: string): string =>
    text.replace(
      /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
      ''
    ),

  // Get raw ANSI codes
  codes: ANSI
};

// Aliases for convenience
export const {
  bold,
  dim,
  italic,
  underline,
  red,
  green,
  yellow,
  blue,
  magenta,
  cyan,
  white,
  gray,
  grey,
  success,
  error,
  warning,
  info,
  muted,
  strip
} = pigment;

/**
 * Create a custom theme
 */
export interface Theme {
  error: (text: string) => string;
  success: (text: string) => string;
  warning: (text: string) => string;
  info: (text: string) => string;
  muted: (text: string) => string;
  path: (text: string) => string;
  value: (text: string) => string;
  key: (text: string) => string;
  symbol: (text: string) => string;
}

/**
 * Default VLD theme for error formatting
 */
export const vldTheme: Theme = {
  error: red,
  success: green,
  warning: yellow,
  info: blue,
  muted: dim,
  path: cyan,
  value: yellow,
  key: bold,
  symbol: red
};

/**
 * Create a custom theme
 */
export function createTheme(overrides: Partial<Theme> = {}): Theme {
  return { ...vldTheme, ...overrides };
}

export default pigment;
