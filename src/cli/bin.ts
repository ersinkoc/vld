#!/usr/bin/env node
/**
 * VLD CLI Entry Point
 *
 * This is the main entry point for the `vld` command-line tool.
 */

import { vldCli } from './index';
import { validateCommand } from './commands/validate';
import { benchmarkCommand } from './commands/benchmark';
import { readFileSync } from 'fs';

const packageJson = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf-8')
) as { version?: string };
const version = packageJson.version || '0.0.0';
vldCli.version = version;

// Register commands
vldCli.command(validateCommand);
vldCli.command(benchmarkCommand);

// Help command
vldCli.command({
  name: 'help',
  description: 'Show help information',
  aliases: ['h'],
  action: () => {
    console.log(vldCli.help());
  }
});

// Version command
vldCli.command({
  name: 'version',
  description: 'Show version information',
  action: () => {
    console.log(`vld v${version}`);
  }
});

// Run CLI
vldCli.run(process.argv.slice(2)).catch((error) => {
  console.error('Fatal error:', error);
  process.exitCode = 1;
});
