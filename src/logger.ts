/**
 * VLD Logger
 *
 * This module provides a debug logging system for VLD,
 * compatible with @oxog/log when available.
 */

/**
 * Log levels
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

/**
 * Log level priorities (lower = more verbose)
 */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4
};

/**
 * Logger options
 */
export interface LoggerOptions {
  /** Logger name (appears in log output) */
  name?: string;
  /** Minimum log level to output */
  level?: LogLevel;
  /** Enable colored output (for terminals) */
  colored?: boolean;
  /** Enable timestamps in output */
  timestamps?: boolean;
  /** Custom log handler */
  handler?: LogHandler;
}

/**
 * Log entry
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: Date;
  name: string;
}

/**
 * Log handler function
 */
export type LogHandler = (entry: LogEntry) => void;

/**
 * Logger interface
 */
export interface Logger {
  /** Log at debug level */
  debug(message: string, data?: unknown): void;
  /** Log at info level */
  info(message: string, data?: unknown): void;
  /** Log at warn level */
  warn(message: string, data?: unknown): void;
  /** Log at error level */
  error(message: string, data?: unknown): void;
  /** Check if level is enabled */
  isLevelEnabled(level: LogLevel): boolean;
  /** Set log level */
  setLevel(level: LogLevel): void;
  /** Get current level */
  getLevel(): LogLevel;
  /** Create a child logger with a new name */
  child(name: string): Logger;
}

/**
 * ANSI color codes for terminal output
 */
const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

/**
 * Level colors
 */
const LEVEL_COLORS: Record<Exclude<LogLevel, 'silent'>, string> = {
  debug: COLORS.gray,
  info: COLORS.blue,
  warn: COLORS.yellow,
  error: COLORS.red
};

/**
 * Level labels
 */
const LEVEL_LABELS: Record<Exclude<LogLevel, 'silent'>, string> = {
  debug: 'DEBUG',
  info: 'INFO ',
  warn: 'WARN ',
  error: 'ERROR'
};

/**
 * Default log handler
 */
function createDefaultHandler(options: LoggerOptions): LogHandler {
  const colored = options.colored ?? true;
  const timestamps = options.timestamps ?? true;

  return (entry: LogEntry) => {
    if (entry.level === 'silent') return;

    const parts: string[] = [];

    // Timestamp
    if (timestamps) {
      const time = entry.timestamp.toISOString().slice(11, 23);
      parts.push(colored ? `${COLORS.dim}${time}${COLORS.reset}` : time);
    }

    // Level
    const levelLabel = LEVEL_LABELS[entry.level as Exclude<LogLevel, 'silent'>];
    const levelColor = LEVEL_COLORS[entry.level as Exclude<LogLevel, 'silent'>];
    parts.push(colored ? `${levelColor}${levelLabel}${COLORS.reset}` : levelLabel);

    // Name
    parts.push(colored ? `${COLORS.cyan}[${entry.name}]${COLORS.reset}` : `[${entry.name}]`);

    // Message
    parts.push(entry.message);

    // Output
    const output = parts.join(' ');

    // Use appropriate console method
    switch (entry.level) {
      case 'debug':
        console.debug(output, entry.data !== undefined ? entry.data : '');
        break;
      case 'info':
        console.info(output, entry.data !== undefined ? entry.data : '');
        break;
      case 'warn':
        console.warn(output, entry.data !== undefined ? entry.data : '');
        break;
      case 'error':
        console.error(output, entry.data !== undefined ? entry.data : '');
        break;
    }
  };
}

/**
 * Create a logger instance
 */
export function createLogger(options: LoggerOptions = {}): Logger {
  const name = options.name ?? 'vld';
  let level = options.level ?? 'warn';
  const handler = options.handler ?? createDefaultHandler(options);

  const log = (logLevel: Exclude<LogLevel, 'silent'>, message: string, data?: unknown): void => {
    if (LOG_LEVEL_PRIORITY[logLevel] < LOG_LEVEL_PRIORITY[level]) {
      return;
    }

    const entry: LogEntry = {
      level: logLevel,
      message,
      data,
      timestamp: new Date(),
      name
    };

    handler(entry);
  };

  const logger: Logger = {
    debug: (message, data) => log('debug', message, data),
    info: (message, data) => log('info', message, data),
    warn: (message, data) => log('warn', message, data),
    error: (message, data) => log('error', message, data),

    isLevelEnabled: (checkLevel) =>
      LOG_LEVEL_PRIORITY[checkLevel] >= LOG_LEVEL_PRIORITY[level],

    setLevel: (newLevel) => {
      level = newLevel;
    },

    getLevel: () => level,

    child: (childName) =>
      createLogger({
        ...options,
        name: `${name}:${childName}`
      })
  };

  return logger;
}

// ============================================
// Global Logger Management
// ============================================

let globalLogger: Logger | null = null;

/**
 * Initialize the global VLD logger
 */
export function initLogger(options?: LoggerOptions): Logger {
  globalLogger = createLogger({
    name: 'vld',
    ...options
  });
  return globalLogger;
}

/**
 * Get the global VLD logger
 * Returns null if not initialized
 */
export function getLogger(): Logger | null {
  return globalLogger;
}

/**
 * Set log level for the global logger
 */
export function setLogLevel(level: LogLevel): void {
  if (globalLogger) {
    globalLogger.setLevel(level);
  }
}

/**
 * Enable debug mode for VLD
 */
export function enableDebug(): void {
  if (!globalLogger) {
    initLogger({ level: 'debug' });
  } else {
    globalLogger.setLevel('debug');
  }
}

/**
 * Disable all VLD logging
 */
export function disableLogging(): void {
  if (globalLogger) {
    globalLogger.setLevel('silent');
  }
}

/**
 * Create a no-op logger for testing
 */
export function createNoOpLogger(): Logger {
  return createLogger({ level: 'silent' });
}

/**
 * Reset the global logger (for testing)
 */
export function resetLogger(): void {
  globalLogger = null;
}
