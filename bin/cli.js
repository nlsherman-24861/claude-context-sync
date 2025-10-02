#!/usr/bin/env node

import { program } from 'commander';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import { setVerbose, info, success, error, printError } from '../src/utils/logger.js';
import { loadConfig, getDefaultConfigPath } from '../src/config/index.js';
import { validateBasicStructure } from '../src/parsers/yaml-parser.js';
import { exportCmd, showAvailableFormats } from '../src/commands/export.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json for version
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '..', 'package.json'), 'utf-8')
);

program
  .name('claude-context-sync')
  .description('Sync your Claude preferences across chat, code, and projects')
  .version(packageJson.version)
  .option('-v, --verbose', 'enable verbose logging')
  .option('-d, --dry-run', 'show what would be done without making changes')
  .option('-c, --config <path>', 'specify config file path');

// Global options handler
program.hook('preAction', (thisCommand) => {
  const options = thisCommand.opts();
  if (options.verbose) {
    setVerbose(true);
  }
});

// Command groups
program
  .command('init')
  .description('Initialize configuration and create template preferences')
  .action(async (options) => {
    try {
      info('Initializing claude-context-sync configuration...');
      success(`Template will be created at: ${getDefaultConfigPath()}`);
      info('Init command - full implementation pending');
    } catch (err) {
      printError(err);
      process.exit(1);
    }
  });

program
  .command('setup')
  .description('Setup browser automation and verify access')
  .option('--authenticate', 'capture new authentication session')
  .option('--refresh-session', 'refresh existing session')
  .option('--browser', 'setup browser environment')
  .action(async (options) => {
    try {
      if (options.authenticate) {
        const { setupAuthenticate } = await import('../src/commands/setup.js');
        await setupAuthenticate();
      } else if (options.refreshSession) {
        const { setupRefreshSession } = await import('../src/commands/setup.js');
        await setupRefreshSession();
      } else if (options.browser) {
        const { setupBrowser } = await import('../src/commands/setup.js');
        await setupBrowser();
      } else {
        info('Setup browser automation and session management');
        info('Available options:');
        info('  --authenticate     Capture new session (opens browser)');
        info('  --refresh-session  Update existing session');
        info('  --browser         Setup browser environment');
      }
    } catch (err) {
      printError(err);
      process.exit(1);
    }
  });

program
  .command('sync')
  .description('Sync preferences across all Claude interfaces')
  .action(async (options) => {
    try {
      info('Syncing preferences...');
      info('Sync command - full implementation pending');
    } catch (err) {
      printError(err);
      process.exit(1);
    }
  });

program
  .command('export')
  .description('Export preferences to various formats')
  .requiredOption('-f, --format <format>', 'output format (chat, claude-md)')
  .option('-o, --output <file>', 'output file (defaults to stdout)')
  .option('-s, --section <name>', 'export specific section only')
  .action(async (options) => {
    try {
      const globalOptions = program.opts();
      const exportOptions = {
        ...options,
        configPath: globalOptions.config
      };
      
      await exportCmd(exportOptions);
    } catch (err) {
      printError(err);
      process.exit(1);
    }
  });

program
  .command('formats')
  .description('Show available export formats')
  .action(() => {
    showAvailableFormats();
  });

program
  .command('diff')
  .description('Show differences between local and remote preferences')
  .action(async (options) => {
    try {
      info('Checking for differences...');
      info('Diff command - full implementation pending');
    } catch (err) {
      printError(err);
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate preferences file structure')
  .action(async (options) => {
    try {
      const globalOptions = program.opts();
      const configPath = globalOptions.config;
      
      info('Validating preferences file...');
      
      const { config, path } = await loadConfig(configPath);
      const validation = validateBasicStructure(config);
      
      if (validation.valid) {
        success(`Configuration is valid: ${path}`);
      } else {
        error('Configuration validation failed:');
        validation.errors.forEach(err => error(`  - ${err}`));
        process.exit(1);
      }
    } catch (err) {
      printError(err);
      process.exit(1);
    }
  });

program
  .command('session')
  .description('Manage authentication sessions')
  .option('--check', 'validate current session')
  .option('--info', 'show session metadata')
  .option('--clear', 'remove current session')
  .action(async (options) => {
    try {
      if (options.check) {
        const { sessionCheck } = await import('../src/commands/session.js');
        await sessionCheck();
      } else if (options.info) {
        const { sessionInfo } = await import('../src/commands/session.js');
        await sessionInfo();
      } else if (options.clear) {
        const { sessionClear } = await import('../src/commands/session.js');
        await sessionClear();
      } else {
        info('Manage authentication sessions');
        info('Available options:');
        info('  --check   Validate current session');
        info('  --info    Show session metadata');
        info('  --clear   Remove current session');
      }
    } catch (err) {
      printError(err);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();