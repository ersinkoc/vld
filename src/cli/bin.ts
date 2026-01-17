#!/usr/bin/env node
/**
 * VLD CLI Entry Point
 *
 * This is the main entry point for the `vld` command-line tool.
 */

import { vldCli } from './index';
import { validateCommand } from './commands/validate';
import { benchmarkCommand } from './commands/benchmark';

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
    console.log('vld v1.5.0');
  }
});

// Run CLI
vldCli.run(process.argv.slice(2)).catch((error) => {
  console.error('Fatal error:', error);
  process.exitCode = 1;
});
