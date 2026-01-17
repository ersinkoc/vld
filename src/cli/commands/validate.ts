/**
 * VLD CLI - Validate Command
 *
 * Validate JSON data against a VLD schema file.
 */

import * as fs from 'fs';
import * as path from 'path';
import { pigment } from '../../pigment';
import { prettifyError, prettifyErrorColored } from '../../errors';
import type { CliCommand } from '../index';

/**
 * Validate command
 */
export const validateCommand: CliCommand = {
  name: 'validate',
  description: 'Validate JSON data against a VLD schema',
  aliases: ['v'],
  arguments: [
    {
      name: 'schema',
      description: 'Path to schema file (.ts or .js)',
      required: true
    },
    {
      name: 'data',
      description: 'Path to JSON data file or JSON string',
      required: true
    }
  ],
  options: [
    {
      name: 'strict',
      short: 's',
      description: 'Enable strict mode (no extra keys)',
      type: 'boolean',
      default: false
    },
    {
      name: 'quiet',
      short: 'q',
      description: 'Only output errors',
      type: 'boolean',
      default: false
    },
    {
      name: 'json',
      short: 'j',
      description: 'Output as JSON',
      type: 'boolean',
      default: false
    },
    {
      name: 'no-color',
      description: 'Disable colored output',
      type: 'boolean',
      default: false
    }
  ],
  action: async (args, options) => {
    const schemaPath = args.schema as string;
    const dataArg = args.data as string;
    const quiet = options.quiet as boolean;
    const json = options.json as boolean;
    const noColor = options['no-color'] as boolean;

    // Load schema
    let schema: { parse: (value: unknown) => unknown; safeParse: (value: unknown) => { success: boolean; data?: unknown; error?: Error } };

    try {
      const absoluteSchemaPath = path.resolve(process.cwd(), schemaPath);

      if (!fs.existsSync(absoluteSchemaPath)) {
        throw new Error(`Schema file not found: ${schemaPath}`);
      }

      // Dynamic import for ESM/CJS compatibility
      const schemaModule = await import(absoluteSchemaPath);
      schema = schemaModule.default || schemaModule.schema || schemaModule;

      if (!schema || typeof schema.parse !== 'function') {
        throw new Error('Schema must export a VLD validator with parse() method');
      }
    } catch (error) {
      if (json) {
        console.log(JSON.stringify({ success: false, error: (error as Error).message }));
      } else {
        console.error(pigment.red('Schema Error:'), (error as Error).message);
      }
      process.exitCode = 1;
      return;
    }

    // Load data
    let data: unknown;

    try {
      // Check if it's a file path or JSON string
      if (dataArg.startsWith('{') || dataArg.startsWith('[')) {
        data = JSON.parse(dataArg);
      } else {
        const absoluteDataPath = path.resolve(process.cwd(), dataArg);

        if (!fs.existsSync(absoluteDataPath)) {
          throw new Error(`Data file not found: ${dataArg}`);
        }

        const content = fs.readFileSync(absoluteDataPath, 'utf-8');
        data = JSON.parse(content);
      }
    } catch (error) {
      if (json) {
        console.log(JSON.stringify({ success: false, error: (error as Error).message }));
      } else {
        console.error(pigment.red('Data Error:'), (error as Error).message);
      }
      process.exitCode = 1;
      return;
    }

    // Validate
    const result = schema.safeParse(data);

    if (json) {
      if (result.success) {
        console.log(JSON.stringify({ success: true, data: result.data }));
      } else {
        const err = result.error as { message?: string; issues?: unknown[] } | undefined;
        const errorJson = {
          success: false,
          error: err?.message,
          issues: err?.issues
        };
        console.log(JSON.stringify(errorJson));
      }
    } else {
      if (result.success) {
        if (!quiet) {
          console.log(pigment.green('✓ Validation passed'));
          console.log('');
          console.log(pigment.dim('Data:'));
          console.log(JSON.stringify(result.data, null, 2));
        }
      } else {
        console.error(pigment.red('✗ Validation failed'));
        console.error('');

        // Check if it's a VldError with issues
        if (result.error && 'issues' in result.error) {
          const formatted = noColor
            ? prettifyError(result.error as Parameters<typeof prettifyError>[0], { colored: false })
            : prettifyErrorColored(result.error as Parameters<typeof prettifyErrorColored>[0]);
          console.error(formatted);
        } else {
          console.error(result.error?.message || 'Unknown error');
        }

        process.exitCode = 1;
      }
    }
  }
};
