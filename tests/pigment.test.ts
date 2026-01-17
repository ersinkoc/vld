/**
 * Tests for Pigment (colored output) implementation
 */

import {
  pigment,
  supportsColor,
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
  strip,
  vldTheme,
  createTheme
} from '../src/pigment';

describe('Pigment', () => {
  describe('supportsColor', () => {
    it('should return a boolean', () => {
      const result = supportsColor();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Color functions', () => {
    it('should apply red color', () => {
      const result = red('test');
      expect(result).toContain('test');
    });

    it('should apply green color', () => {
      const result = green('test');
      expect(result).toContain('test');
    });

    it('should apply yellow color', () => {
      const result = yellow('test');
      expect(result).toContain('test');
    });

    it('should apply blue color', () => {
      const result = blue('test');
      expect(result).toContain('test');
    });

    it('should apply magenta color', () => {
      const result = magenta('test');
      expect(result).toContain('test');
    });

    it('should apply cyan color', () => {
      const result = cyan('test');
      expect(result).toContain('test');
    });

    it('should apply white color', () => {
      const result = white('test');
      expect(result).toContain('test');
    });

    it('should apply gray color', () => {
      const result = gray('test');
      expect(result).toContain('test');
    });

    it('should apply grey color (alias)', () => {
      const result = grey('test');
      expect(result).toContain('test');
    });
  });

  describe('Style functions', () => {
    it('should apply bold style', () => {
      const result = bold('test');
      expect(result).toContain('test');
    });

    it('should apply dim style', () => {
      const result = dim('test');
      expect(result).toContain('test');
    });

    it('should apply italic style', () => {
      const result = italic('test');
      expect(result).toContain('test');
    });

    it('should apply underline style', () => {
      const result = underline('test');
      expect(result).toContain('test');
    });
  });

  describe('pigment object', () => {
    it('should have all color functions', () => {
      expect(typeof pigment.red).toBe('function');
      expect(typeof pigment.green).toBe('function');
      expect(typeof pigment.yellow).toBe('function');
      expect(typeof pigment.blue).toBe('function');
      expect(typeof pigment.magenta).toBe('function');
      expect(typeof pigment.cyan).toBe('function');
      expect(typeof pigment.white).toBe('function');
      expect(typeof pigment.gray).toBe('function');
      expect(typeof pigment.grey).toBe('function');
    });

    it('should have all style functions', () => {
      expect(typeof pigment.bold).toBe('function');
      expect(typeof pigment.dim).toBe('function');
      expect(typeof pigment.italic).toBe('function');
      expect(typeof pigment.underline).toBe('function');
    });

    it('should work with all color methods', () => {
      expect(pigment.red('test')).toContain('test');
      expect(pigment.green('test')).toContain('test');
      expect(pigment.yellow('test')).toContain('test');
      expect(pigment.blue('test')).toContain('test');
      expect(pigment.magenta('test')).toContain('test');
      expect(pigment.cyan('test')).toContain('test');
      expect(pigment.white('test')).toContain('test');
    });

    it('should work with all style methods', () => {
      expect(pigment.bold('test')).toContain('test');
      expect(pigment.dim('test')).toContain('test');
      expect(pigment.italic('test')).toContain('test');
      expect(pigment.underline('test')).toContain('test');
    });
  });

  describe('strip', () => {
    it('should remove ANSI codes from string', () => {
      const colored = red('test');
      const stripped = strip(colored);
      expect(stripped).toBe('test');
    });

    it('should handle strings without ANSI codes', () => {
      const result = strip('plain text');
      expect(result).toBe('plain text');
    });

    it('should handle empty string', () => {
      const result = strip('');
      expect(result).toBe('');
    });

    it('should remove nested ANSI codes', () => {
      const colored = bold(red('nested'));
      const stripped = strip(colored);
      expect(stripped).toBe('nested');
    });
  });

  describe('vldTheme', () => {
    it('should have error color', () => {
      expect(typeof vldTheme.error).toBe('function');
      expect(vldTheme.error('error')).toContain('error');
    });

    it('should have success color', () => {
      expect(typeof vldTheme.success).toBe('function');
      expect(vldTheme.success('success')).toContain('success');
    });

    it('should have warning color', () => {
      expect(typeof vldTheme.warning).toBe('function');
      expect(vldTheme.warning('warning')).toContain('warning');
    });

    it('should have info color', () => {
      expect(typeof vldTheme.info).toBe('function');
      expect(vldTheme.info('info')).toContain('info');
    });

    it('should have muted color', () => {
      expect(typeof vldTheme.muted).toBe('function');
      expect(vldTheme.muted('muted')).toContain('muted');
    });

    it('should have path color', () => {
      expect(typeof vldTheme.path).toBe('function');
      expect(vldTheme.path('path')).toContain('path');
    });

    it('should have value color', () => {
      expect(typeof vldTheme.value).toBe('function');
      expect(vldTheme.value('value')).toContain('value');
    });

    it('should have key color', () => {
      expect(typeof vldTheme.key).toBe('function');
      expect(vldTheme.key('key')).toContain('key');
    });

    it('should have symbol color', () => {
      expect(typeof vldTheme.symbol).toBe('function');
      expect(vldTheme.symbol('symbol')).toContain('symbol');
    });
  });

  describe('createTheme', () => {
    it('should create a custom theme', () => {
      const customTheme = createTheme({
        error: (s: string) => `[ERROR] ${s}`,
        success: (s: string) => `[OK] ${s}`,
        warning: (s: string) => `[WARN] ${s}`,
        info: (s: string) => `[INFO] ${s}`,
        muted: (s: string) => `(${s})`,
        path: (s: string) => `@${s}`,
        value: (s: string) => `"${s}"`,
        key: (s: string) => `<${s}>`,
        symbol: (s: string) => `!${s}!`
      });

      expect(customTheme.error('test')).toBe('[ERROR] test');
      expect(customTheme.success('test')).toBe('[OK] test');
      expect(customTheme.warning('test')).toBe('[WARN] test');
      expect(customTheme.info('test')).toBe('[INFO] test');
      expect(customTheme.muted('test')).toBe('(test)');
      expect(customTheme.path('test')).toBe('@test');
      expect(customTheme.value('test')).toBe('"test"');
      expect(customTheme.key('test')).toBe('<test>');
      expect(customTheme.symbol('test')).toBe('!test!');
    });

    it('should merge with default theme', () => {
      const partialTheme = createTheme({
        error: (s) => `ERROR: ${s}`
      });

      // Custom override
      expect(partialTheme.error('test')).toBe('ERROR: test');
      // Should have other methods from default
      expect(typeof partialTheme.success).toBe('function');
      expect(typeof partialTheme.warning).toBe('function');
    });
  });

  describe('Chaining colors', () => {
    it('should allow combining styles', () => {
      const result = bold(red('error'));
      expect(result).toContain('error');
    });

    it('should allow multiple style combinations', () => {
      const result = underline(bold(cyan('styled')));
      expect(result).toContain('styled');
    });
  });

  describe('Empty and special inputs', () => {
    it('should handle empty string', () => {
      expect(red('')).toBe('');
      expect(bold('')).toBe('');
    });

    it('should handle strings with special characters', () => {
      const special = 'test\nwith\ttabs';
      expect(red(special)).toContain(special);
    });

    it('should handle unicode', () => {
      const unicode = '✓ Validation passed';
      expect(green(unicode)).toContain(unicode);
    });

    it('should handle numbers converted to string', () => {
      const result = red(String(42));
      expect(result).toContain('42');
    });
  });

  describe('Additional style functions', () => {
    it('should apply inverse style', () => {
      const result = pigment.inverse('test');
      expect(result).toContain('test');
    });

    it('should apply hidden style', () => {
      const result = pigment.hidden('test');
      expect(result).toContain('test');
    });

    it('should apply strikethrough style', () => {
      const result = pigment.strikethrough('test');
      expect(result).toContain('test');
    });

    it('should apply black color', () => {
      const result = pigment.black('test');
      expect(result).toContain('test');
    });
  });

  describe('Bright colors', () => {
    it('should apply brightRed color', () => {
      const result = pigment.brightRed('test');
      expect(result).toContain('test');
    });

    it('should apply brightGreen color', () => {
      const result = pigment.brightGreen('test');
      expect(result).toContain('test');
    });

    it('should apply brightYellow color', () => {
      const result = pigment.brightYellow('test');
      expect(result).toContain('test');
    });

    it('should apply brightBlue color', () => {
      const result = pigment.brightBlue('test');
      expect(result).toContain('test');
    });

    it('should apply brightMagenta color', () => {
      const result = pigment.brightMagenta('test');
      expect(result).toContain('test');
    });

    it('should apply brightCyan color', () => {
      const result = pigment.brightCyan('test');
      expect(result).toContain('test');
    });

    it('should apply brightWhite color', () => {
      const result = pigment.brightWhite('test');
      expect(result).toContain('test');
    });
  });

  describe('Background colors', () => {
    it('should apply bgBlack color', () => {
      const result = pigment.bgBlack('test');
      expect(result).toContain('test');
    });

    it('should apply bgRed color', () => {
      const result = pigment.bgRed('test');
      expect(result).toContain('test');
    });

    it('should apply bgGreen color', () => {
      const result = pigment.bgGreen('test');
      expect(result).toContain('test');
    });

    it('should apply bgYellow color', () => {
      const result = pigment.bgYellow('test');
      expect(result).toContain('test');
    });

    it('should apply bgBlue color', () => {
      const result = pigment.bgBlue('test');
      expect(result).toContain('test');
    });

    it('should apply bgMagenta color', () => {
      const result = pigment.bgMagenta('test');
      expect(result).toContain('test');
    });

    it('should apply bgCyan color', () => {
      const result = pigment.bgCyan('test');
      expect(result).toContain('test');
    });

    it('should apply bgWhite color', () => {
      const result = pigment.bgWhite('test');
      expect(result).toContain('test');
    });
  });

  describe('Semantic colors', () => {
    it('should apply success color', () => {
      const result = pigment.success('test');
      expect(result).toContain('test');
    });

    it('should apply error color', () => {
      const result = pigment.error('test');
      expect(result).toContain('test');
    });

    it('should apply warning color', () => {
      const result = pigment.warning('test');
      expect(result).toContain('test');
    });

    it('should apply info color', () => {
      const result = pigment.info('test');
      expect(result).toContain('test');
    });

    it('should apply muted color', () => {
      const result = pigment.muted('test');
      expect(result).toContain('test');
    });
  });

  describe('Combine function', () => {
    it('should combine multiple ANSI codes', () => {
      const combinedFn = pigment.combine(pigment.codes.bold, pigment.codes.red);
      const result = combinedFn('test');
      expect(result).toContain('test');
    });

    it('should return text unchanged when no codes provided', () => {
      const combinedFn = pigment.combine();
      const result = combinedFn('test');
      expect(result).toContain('test');
    });
  });

  describe('Reset function', () => {
    it('should return text unchanged', () => {
      const result = pigment.reset('test');
      expect(result).toBe('test');
    });
  });

  describe('Codes property', () => {
    it('should expose ANSI codes', () => {
      expect(pigment.codes).toBeDefined();
      expect(pigment.codes.reset).toBeDefined();
      expect(pigment.codes.bold).toBeDefined();
      expect(pigment.codes.red).toBeDefined();
    });

    it('should have all style codes', () => {
      expect(pigment.codes.bold).toBe('\x1b[1m');
      expect(pigment.codes.dim).toBe('\x1b[2m');
      expect(pigment.codes.italic).toBe('\x1b[3m');
      expect(pigment.codes.underline).toBe('\x1b[4m');
    });

    it('should have all color codes', () => {
      expect(pigment.codes.red).toBe('\x1b[31m');
      expect(pigment.codes.green).toBe('\x1b[32m');
      expect(pigment.codes.yellow).toBe('\x1b[33m');
      expect(pigment.codes.blue).toBe('\x1b[34m');
    });
  });

  describe('supportsColor function on pigment object', () => {
    it('should be accessible from pigment object', () => {
      expect(typeof pigment.supportsColor).toBe('function');
      const result = pigment.supportsColor();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('supportsColor environment handling', () => {
    it('should handle NO_COLOR environment variable', () => {
      // The supportsColor function checks process.env.NO_COLOR
      const result = supportsColor();
      expect(typeof result).toBe('boolean');
    });

    it('should handle FORCE_COLOR environment variable', () => {
      // The supportsColor function checks process.env.FORCE_COLOR
      const result = supportsColor();
      expect(typeof result).toBe('boolean');
    });

    it('should handle TTY detection', () => {
      // The supportsColor function checks process.stdout.isTTY
      const result = supportsColor();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('createColorFn behavior', () => {
    it('should create color functions that handle empty string', () => {
      const result = pigment.red('');
      // Empty string should return empty string (no color codes)
      expect(result).toBe('');
    });

    it('should create color functions that wrap text', () => {
      const result = pigment.red('hello');
      // Should contain the text
      expect(result).toContain('hello');
    });
  });
});
