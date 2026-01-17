/**
 * VLD CLI Tool
 *
 * Command-line interface for VLD validation library.
 * Provides commands for validation, schema generation, and benchmarking.
 */

import { pigment } from '../pigment';

/**
 * CLI command definition
 */
export interface CliCommand {
  name: string;
  description: string;
  aliases?: string[];
  arguments?: CliArgument[];
  options?: CliOption[];
  action: (args: Record<string, unknown>, options: Record<string, unknown>) => void | Promise<void>;
}

/**
 * CLI argument definition
 */
export interface CliArgument {
  name: string;
  description: string;
  required?: boolean;
  default?: unknown;
}

/**
 * CLI option definition
 */
export interface CliOption {
  name: string;
  short?: string;
  description: string;
  type?: 'string' | 'number' | 'boolean';
  default?: unknown;
  required?: boolean;
}

/**
 * CLI instance
 */
export interface Cli {
  name: string;
  version: string;
  description: string;
  commands: Map<string, CliCommand>;

  // Builder methods
  command(cmd: CliCommand): Cli;
  help(): string;
  run(args: string[]): Promise<void>;
}

/**
 * Parse command line arguments
 */
function parseArgs(args: string[], options: CliOption[] = []): {
  positional: string[];
  options: Record<string, unknown>;
} {
  const result = {
    positional: [] as string[],
    options: {} as Record<string, unknown>
  };

  // Set defaults
  for (const opt of options) {
    if (opt.default !== undefined) {
      result.options[opt.name] = opt.default;
    }
  }

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg.startsWith('--')) {
      // Long option
      const [name, value] = arg.slice(2).split('=');
      const option = options.find((o) => o.name === name);

      if (option) {
        if (option.type === 'boolean') {
          result.options[name] = value !== 'false';
        } else if (value !== undefined) {
          result.options[name] = option.type === 'number' ? Number(value) : value;
        } else if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
          i++;
          result.options[name] = option.type === 'number' ? Number(args[i]) : args[i];
        } else {
          result.options[name] = true;
        }
      }
    } else if (arg.startsWith('-')) {
      // Short option
      const short = arg.slice(1);
      const option = options.find((o) => o.short === short);

      if (option) {
        if (option.type === 'boolean') {
          result.options[option.name] = true;
        } else if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
          i++;
          result.options[option.name] =
            option.type === 'number' ? Number(args[i]) : args[i];
        }
      }
    } else {
      // Positional argument
      result.positional.push(arg);
    }

    i++;
  }

  return result;
}

/**
 * Create a CLI instance
 */
export function createCli(name: string, version: string, description: string): Cli {
  const commands = new Map<string, CliCommand>();

  const cli: Cli = {
    name,
    version,
    description,
    commands,

    command(cmd: CliCommand): Cli {
      commands.set(cmd.name, cmd);
      if (cmd.aliases) {
        for (const alias of cmd.aliases) {
          commands.set(alias, cmd);
        }
      }
      return this;
    },

    help(): string {
      const lines: string[] = [];

      lines.push(pigment.bold(`${name} v${version}`));
      lines.push(pigment.dim(description));
      lines.push('');
      lines.push(pigment.bold('Usage:'));
      lines.push(`  ${name} <command> [options]`);
      lines.push('');
      lines.push(pigment.bold('Commands:'));

      const uniqueCommands = new Map<string, CliCommand>();
      for (const [_cmdName, cmd] of commands) {
        if (!uniqueCommands.has(cmd.name)) {
          uniqueCommands.set(cmd.name, cmd);
        }
      }

      for (const [cmdName, cmd] of uniqueCommands) {
        const aliases = cmd.aliases?.length ? pigment.dim(` (${cmd.aliases.join(', ')})`) : '';
        lines.push(`  ${pigment.cyan(cmdName)}${aliases}`);
        lines.push(`    ${cmd.description}`);
      }

      lines.push('');
      lines.push(pigment.bold('Options:'));
      lines.push(`  ${pigment.cyan('-h, --help')}     Show help`);
      lines.push(`  ${pigment.cyan('-v, --version')}  Show version`);

      return lines.join('\n');
    },

    async run(args: string[]): Promise<void> {
      // Handle help
      if (args.includes('--help') || args.includes('-h') || args.length === 0) {
        console.log(this.help());
        return;
      }

      // Handle version
      if (args.includes('--version') || args.includes('-v')) {
        console.log(`${name} v${version}`);
        return;
      }

      // Get command
      const cmdName = args[0];
      const cmd = commands.get(cmdName);

      if (!cmd) {
        console.error(pigment.red(`Unknown command: ${cmdName}`));
        console.log('');
        console.log(this.help());
        process.exitCode = 1;
        return;
      }

      // Parse arguments
      const parsed = parseArgs(args.slice(1), cmd.options);

      // Map positional arguments
      const positionalArgs: Record<string, unknown> = {};
      if (cmd.arguments) {
        for (let i = 0; i < cmd.arguments.length; i++) {
          const arg = cmd.arguments[i];
          if (i < parsed.positional.length) {
            positionalArgs[arg.name] = parsed.positional[i];
          } else if (arg.default !== undefined) {
            positionalArgs[arg.name] = arg.default;
          } else if (arg.required) {
            console.error(pigment.red(`Missing required argument: ${arg.name}`));
            process.exitCode = 1;
            return;
          }
        }
      }

      // Check required options
      if (cmd.options) {
        for (const opt of cmd.options) {
          if (opt.required && parsed.options[opt.name] === undefined) {
            console.error(pigment.red(`Missing required option: --${opt.name}`));
            process.exitCode = 1;
            return;
          }
        }
      }

      // Execute command
      try {
        await cmd.action(positionalArgs, parsed.options);
      } catch (error) {
        console.error(pigment.red('Error:'), (error as Error).message);
        process.exitCode = 1;
      }
    }
  };

  return cli;
}

/**
 * VLD CLI instance
 */
export const vldCli = createCli('vld', '1.5.0', 'Fast TypeScript Validation Library');

// Export CLI components
export { createCli as cli };
