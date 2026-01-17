/**
 * Tests for Logger implementation
 */

import {
  createLogger,
  initLogger,
  getLogger,
  setLogLevel,
  enableDebug,
  disableLogging,
  createNoOpLogger,
  resetLogger
} from '../src/logger';

describe('Logger', () => {
  beforeEach(() => {
    // Reset global logger state before each test
    resetLogger();
  });

  describe('createLogger', () => {
    it('should create a logger with default options', () => {
      const logger = createLogger();

      expect(logger).toBeDefined();
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
    });

    it('should create a logger with custom name', () => {
      const logs: string[] = [];
      const logger = createLogger({
        name: 'VLD',
        level: 'info',
        handler: (entry) => logs.push(`[${entry.name}] ${entry.message}`)
      });

      logger.info('test message');

      expect(logs[0]).toContain('[VLD]');
      expect(logs[0]).toContain('test message');
    });

    it('should respect log level - debug', () => {
      const logs: string[] = [];
      const logger = createLogger({
        level: 'debug',
        handler: (entry) => logs.push(entry.message)
      });

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(logs).toContain('debug message');
      expect(logs).toContain('info message');
      expect(logs).toContain('warn message');
      expect(logs).toContain('error message');
    });

    it('should respect log level - info', () => {
      const logs: string[] = [];
      const logger = createLogger({
        level: 'info',
        handler: (entry) => logs.push(entry.message)
      });

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(logs).not.toContain('debug message');
      expect(logs).toContain('info message');
      expect(logs).toContain('warn message');
      expect(logs).toContain('error message');
    });

    it('should respect log level - warn', () => {
      const logs: string[] = [];
      const logger = createLogger({
        level: 'warn',
        handler: (entry) => logs.push(entry.message)
      });

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(logs).not.toContain('debug message');
      expect(logs).not.toContain('info message');
      expect(logs).toContain('warn message');
      expect(logs).toContain('error message');
    });

    it('should respect log level - error', () => {
      const logs: string[] = [];
      const logger = createLogger({
        level: 'error',
        handler: (entry) => logs.push(entry.message)
      });

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(logs).not.toContain('debug message');
      expect(logs).not.toContain('info message');
      expect(logs).not.toContain('warn message');
      expect(logs).toContain('error message');
    });

    it('should respect log level - silent', () => {
      const logs: string[] = [];
      const logger = createLogger({
        level: 'silent',
        handler: (entry) => logs.push(entry.message)
      });

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(logs).toHaveLength(0);
    });

    it('should include timestamp when enabled', () => {
      const entries: any[] = [];
      const logger = createLogger({
        level: 'info',
        timestamps: true,
        handler: (entry) => entries.push(entry)
      });

      logger.info('test');

      expect(entries[0].timestamp).toBeInstanceOf(Date);
    });

    it('should always include timestamp in entry', () => {
      const entries: any[] = [];
      const logger = createLogger({
        level: 'info',
        timestamps: false,
        handler: (entry) => entries.push(entry)
      });

      logger.info('test');

      // Timestamp is always present in the entry (even if not displayed)
      expect(entries[0].timestamp).toBeInstanceOf(Date);
    });

    it('should include log level in entry', () => {
      const entries: any[] = [];
      const logger = createLogger({
        level: 'debug',
        handler: (entry) => entries.push(entry)
      });

      logger.debug('msg');
      logger.info('msg');
      logger.warn('msg');
      logger.error('msg');

      expect(entries[0].level).toBe('debug');
      expect(entries[1].level).toBe('info');
      expect(entries[2].level).toBe('warn');
      expect(entries[3].level).toBe('error');
    });

    it('should include data in entry', () => {
      const entries: any[] = [];
      const logger = createLogger({
        level: 'info',
        handler: (entry) => entries.push(entry)
      });

      logger.info('test', { foo: 'bar', count: 42 });

      expect(entries[0].data).toEqual({ foo: 'bar', count: 42 });
    });

    it('should allow changing log level', () => {
      const logs: string[] = [];
      const logger = createLogger({
        level: 'info',
        handler: (entry) => logs.push(entry.message)
      });

      logger.debug('first debug');
      logger.setLevel('debug');
      logger.debug('second debug');

      expect(logs).not.toContain('first debug');
      expect(logs).toContain('second debug');
    });

    it('should use colored output by default', () => {
      const logger = createLogger({ colored: true });

      // Just verify it doesn't crash
      logger.info('colored message');
    });

    it('should support non-colored output', () => {
      const logger = createLogger({ colored: false });

      // Just verify it doesn't crash
      logger.info('plain message');
    });
  });

  describe('initLogger and getLogger', () => {
    it('should initialize global logger', () => {
      const logger = initLogger({ level: 'debug' });

      expect(logger).toBeDefined();
      expect(getLogger()).toBe(logger);
    });

    it('should return same instance on subsequent calls', () => {
      const logger1 = initLogger();
      const logger2 = getLogger();

      expect(logger1).toBe(logger2);
    });

    it('should return null if not initialized', () => {
      // Reset any global state first
      const logger = getLogger();

      // Before initLogger is called, getLogger returns null
      expect(logger).toBeNull();
    });
  });

  describe('setLogLevel', () => {
    it('should set global log level', () => {
      initLogger();

      setLogLevel('error');

      // Global level affects the global logger
      const logger = getLogger();
      expect(logger).not.toBeNull();
      expect(logger!.getLevel()).toBe('error');
    });
  });

  describe('enableDebug', () => {
    it('should enable debug mode', () => {
      const logs: string[] = [];
      initLogger({
        level: 'info',
        handler: (entry) => logs.push(entry.message)
      });

      enableDebug();

      // After enableDebug, debug logs should work
      const logger = getLogger();
      expect(logger).not.toBeNull();
      logger!.debug('debug message');

      // Note: enableDebug sets global state
    });
  });

  describe('disableLogging', () => {
    it('should disable all logging', () => {
      const logs: string[] = [];
      initLogger({
        level: 'debug',
        handler: (entry) => logs.push(entry.message)
      });

      disableLogging();

      const logger = getLogger();
      expect(logger).not.toBeNull();
      logger!.error('should not appear');

      // After disableLogging, nothing should be logged
      expect(logs).toHaveLength(0);
    });
  });

  describe('createNoOpLogger', () => {
    it('should create a no-op logger', () => {
      const logger = createNoOpLogger();

      expect(logger).toBeDefined();
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');

      // Should not throw
      logger.debug('test');
      logger.info('test');
      logger.warn('test');
      logger.error('test');
    });

    it('should do nothing when logging', () => {
      const logger = createNoOpLogger();

      // These should all do nothing without throwing
      expect(() => logger.debug('test')).not.toThrow();
      expect(() => logger.info('test', { context: true })).not.toThrow();
      expect(() => logger.warn('warning')).not.toThrow();
      expect(() => logger.error('error')).not.toThrow();
      expect(() => logger.setLevel('debug')).not.toThrow();
    });
  });

  describe('child logger', () => {
    it('should create a child logger with combined name', () => {
      const entries: any[] = [];
      const parent = createLogger({
        name: 'parent',
        level: 'debug',
        handler: (entry) => entries.push(entry)
      });

      const child = parent.child('child');
      child.info('child message');

      expect(entries[0].name).toBe('parent:child');
    });

    it('should inherit parent log level', () => {
      const entries: any[] = [];
      const parent = createLogger({
        name: 'parent',
        level: 'warn',
        handler: (entry) => entries.push(entry)
      });

      const child = parent.child('child');
      child.debug('should not appear');
      child.warn('should appear');

      expect(entries).toHaveLength(1);
      expect(entries[0].message).toBe('should appear');
    });
  });

  describe('isLevelEnabled', () => {
    it('should return true for enabled levels', () => {
      const logger = createLogger({ level: 'info' });

      expect(logger.isLevelEnabled('info')).toBe(true);
      expect(logger.isLevelEnabled('warn')).toBe(true);
      expect(logger.isLevelEnabled('error')).toBe(true);
    });

    it('should return false for disabled levels', () => {
      const logger = createLogger({ level: 'warn' });

      expect(logger.isLevelEnabled('debug')).toBe(false);
      expect(logger.isLevelEnabled('info')).toBe(false);
    });
  });

  describe('getLevel', () => {
    it('should return current log level', () => {
      const logger = createLogger({ level: 'error' });
      expect(logger.getLevel()).toBe('error');
    });

    it('should return default level when not specified', () => {
      const logger = createLogger();
      expect(logger.getLevel()).toBe('warn');
    });
  });

  describe('setLogLevel without initialized logger', () => {
    it('should not throw when no global logger exists', () => {
      expect(() => setLogLevel('debug')).not.toThrow();
    });
  });

  describe('enableDebug without initialized logger', () => {
    it('should initialize logger with debug level', () => {
      enableDebug();

      const logger = getLogger();
      expect(logger).not.toBeNull();
      expect(logger!.getLevel()).toBe('debug');
    });
  });

  describe('disableLogging without initialized logger', () => {
    it('should not throw when no global logger exists', () => {
      expect(() => disableLogging()).not.toThrow();
    });
  });

  describe('Default handler', () => {
    it('should use console methods for different levels', () => {
      const debugSpy = jest.spyOn(console, 'debug').mockImplementation();
      const infoSpy = jest.spyOn(console, 'info').mockImplementation();
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();

      const logger = createLogger({ level: 'debug' });

      logger.debug('debug msg');
      logger.info('info msg');
      logger.warn('warn msg');
      logger.error('error msg');

      expect(debugSpy).toHaveBeenCalled();
      expect(infoSpy).toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();

      debugSpy.mockRestore();
      infoSpy.mockRestore();
      warnSpy.mockRestore();
      errorSpy.mockRestore();
    });

    it('should include data in console output when provided', () => {
      const infoSpy = jest.spyOn(console, 'info').mockImplementation();

      const logger = createLogger({ level: 'info' });
      logger.info('test with data', { key: 'value' });

      expect(infoSpy).toHaveBeenCalledWith(
        expect.any(String),
        { key: 'value' }
      );

      infoSpy.mockRestore();
    });

    it('should pass empty string when no data provided', () => {
      const infoSpy = jest.spyOn(console, 'info').mockImplementation();

      const logger = createLogger({ level: 'info' });
      logger.info('test without data');

      expect(infoSpy).toHaveBeenCalledWith(
        expect.any(String),
        ''
      );

      infoSpy.mockRestore();
    });

    it('should output with colors when colored is true', () => {
      const infoSpy = jest.spyOn(console, 'info').mockImplementation();

      const logger = createLogger({ level: 'info', colored: true, timestamps: true });
      logger.info('colored test');

      expect(infoSpy).toHaveBeenCalled();
      const output = infoSpy.mock.calls[0][0] as string;
      // Should contain ANSI escape codes
      expect(output).toContain('\x1b[');

      infoSpy.mockRestore();
    });

    it('should output without colors when colored is false', () => {
      const infoSpy = jest.spyOn(console, 'info').mockImplementation();

      const logger = createLogger({ level: 'info', colored: false, timestamps: true });
      logger.info('plain test');

      expect(infoSpy).toHaveBeenCalled();
      const output = infoSpy.mock.calls[0][0] as string;
      // Should NOT contain ANSI escape codes
      expect(output).not.toContain('\x1b[');

      infoSpy.mockRestore();
    });

    it('should skip timestamp when timestamps is false', () => {
      const infoSpy = jest.spyOn(console, 'info').mockImplementation();

      const logger = createLogger({ level: 'info', colored: false, timestamps: false });
      logger.info('no timestamp test');

      expect(infoSpy).toHaveBeenCalled();
      const output = infoSpy.mock.calls[0][0] as string;
      // Should not have ISO time format (HH:MM:SS.mmm)
      expect(output).not.toMatch(/\d{2}:\d{2}:\d{2}\.\d{3}/);

      infoSpy.mockRestore();
    });

    it('should include timestamp when timestamps is true', () => {
      const infoSpy = jest.spyOn(console, 'info').mockImplementation();

      const logger = createLogger({ level: 'info', colored: false, timestamps: true });
      logger.info('timestamp test');

      expect(infoSpy).toHaveBeenCalled();
      const output = infoSpy.mock.calls[0][0] as string;
      // Should have ISO time format (HH:MM:SS.mmm)
      expect(output).toMatch(/\d{2}:\d{2}:\d{2}\.\d{3}/);

      infoSpy.mockRestore();
    });

    it('should handle debug level with data', () => {
      const debugSpy = jest.spyOn(console, 'debug').mockImplementation();

      const logger = createLogger({ level: 'debug' });
      logger.debug('debug with data', { debug: true });

      expect(debugSpy).toHaveBeenCalledWith(expect.any(String), { debug: true });

      debugSpy.mockRestore();
    });

    it('should handle warn level with data', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const logger = createLogger({ level: 'warn' });
      logger.warn('warn with data', { warning: 'test' });

      expect(warnSpy).toHaveBeenCalledWith(expect.any(String), { warning: 'test' });

      warnSpy.mockRestore();
    });

    it('should handle error level with data', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();

      const logger = createLogger({ level: 'error' });
      logger.error('error with data', { error: 'critical' });

      expect(errorSpy).toHaveBeenCalledWith(expect.any(String), { error: 'critical' });

      errorSpy.mockRestore();
    });

    it('should handle debug level without data', () => {
      const debugSpy = jest.spyOn(console, 'debug').mockImplementation();

      const logger = createLogger({ level: 'debug' });
      logger.debug('debug without data');

      expect(debugSpy).toHaveBeenCalledWith(expect.any(String), '');

      debugSpy.mockRestore();
    });

    it('should handle warn level without data', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const logger = createLogger({ level: 'warn' });
      logger.warn('warn without data');

      expect(warnSpy).toHaveBeenCalledWith(expect.any(String), '');

      warnSpy.mockRestore();
    });

    it('should handle error level without data', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();

      const logger = createLogger({ level: 'error' });
      logger.error('error without data');

      expect(errorSpy).toHaveBeenCalledWith(expect.any(String), '');

      errorSpy.mockRestore();
    });
  });
});
