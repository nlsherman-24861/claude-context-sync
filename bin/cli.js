#!/usr/bin/env node

/**
 * Claude Context Sync - CLI Entry Point
 * 
 * Synchronize your Claude preferences across chat, code, and projects
 */

import { Command } from 'commander';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import { setVerbose, info, success, error, printError } from '../src/utils/logger.js';
import { loadConfig, getDefaultConfigPath } from '../src/config/index.js';
import { validateBasicStructure } from '../src/parsers/yaml-parser.js';
import { exportCmd, showAvailableFormats } from '../src/commands/export.js';
import { installWrappers, uninstallWrappers, listWrappers } from '../src/wrappers/installer.js';
import { addUnifiedAliases, showUnifiedExamples } from '../src/wrappers/aliases.js';

const __dirname = dirname(new URL(import.meta.url).pathname);
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf-8')
);

const program = new Command();

program
  .name('claude-context-sync')
  .description('Sync your Claude preferences across chat, code, and projects')
  .version(packageJson.version)
  .option('-v, --verbose', 'Enable verbose logging')
  .option('-c, --config <path>', 'Path to preferences.yaml')
  .hook('preAction', (thisCommand) => {
    const opts = thisCommand.opts();
    if (opts.verbose) {
      setVerbose(true);
    }
  });

// Validate command
program
  .command('validate')
  .description('Validate preferences.yaml configuration')
  .action(async () => {
    try {
      const opts = program.opts();
      const configPath = opts.config || getDefaultConfigPath();
      
      info(`Validating config: ${configPath}`);
      const { config, path } = await loadConfig(configPath);
      
      const validation = validateBasicStructure(config);
      if (!validation.valid) {
        error('Validation failed:');
        validation.errors.forEach(err => error(`  - ${err}`));
        process.exit(1);
      }
      
      success('Configuration is valid!');
      info(`  Loaded from: ${path}`);
    } catch (e) {
      printError(e);
      process.exit(1);
    }
  });

// Export command
program
  .command('export')
  .description('Export preferences to different formats')
  .argument('[format]', 'Output format (claude-md, chat, etc.)')
  .option('-o, --output <file>', 'Write to file instead of stdout')
  .option('--list-formats', 'List available export formats')
  .action(async (format, options) => {
    if (options.listFormats) {
      showAvailableFormats();
      return;
    }

    if (!format) {
      error('Format required. Use --list-formats to see available formats.');
      process.exit(1);
    }

    try {
      await exportCmd(format, {
        config: program.opts().config,
        output: options.output
      });
    } catch (e) {
      printError(e);
      process.exit(1);
    }
  });

// Sync commands
program
  .command('sync')
  .description('Sync preferences to CLAUDE.md files')
  .option('--target <target>', 'Target: global, project, or all', 'all')
  .option('--path <path>', 'Project path (required for project target)')
  .option('--dry-run', 'Show what would be done without making changes')
  .option('--no-backup', 'Skip creating backups')
  .option('--no-merge', 'Overwrite instead of merging (project only)')
  .action(async (options) => {
    try {
      const { syncGlobal, syncProject, syncAll } = await import('../src/commands/sync.js');

      if (options.target === 'global') {
        await syncGlobal(options);
      } else if (options.target === 'project') {
        await syncProject(options);
      } else if (options.target === 'all') {
        await syncAll(options);
      } else {
        error('Invalid target. Use: global, project, or all');
        process.exit(1);
      }
    } catch (e) {
      printError(e);
      process.exit(1);
    }
  });

program
  .command('backups')
  .description('List available backups')
  .option('--target <target>', 'Target: global or project', 'global')
  .option('--path <path>', 'Project path (required for project target)')
  .action(async (options) => {
    try {
      const { listBackups } = await import('../src/commands/sync.js');
      await listBackups(options);
    } catch (e) {
      printError(e);
      process.exit(1);
    }
  });

program
  .command('restore')
  .description('Restore from backup')
  .requiredOption('--backup <path>', 'Path to backup file')
  .option('--target <target>', 'Target: global or project', 'global')
  .option('--path <path>', 'Project path (required for project target)')
  .action(async (options) => {
    try {
      const { restoreBackup } = await import('../src/commands/sync.js');
      await restoreBackup(options);
    } catch (e) {
      printError(e);
      process.exit(1);
    }
  });

// Repository sync commands
program
  .command('discover')
  .description('Discover repositories with .claude-sync markers')
  .option('--scan <paths...>', 'Paths to scan for repositories')
  .action(async (options) => {
    try {
      const { discoverRepos } = await import('../src/commands/sync-repos.js');
      await discoverRepos({ scan: options.scan || [], verbose: program.opts().verbose });
    } catch (e) {
      printError(e);
      process.exit(1);
    }
  });

program
  .command('sync-repos')
  .description('Sync configurator updates across repositories')
  .option('--path <paths...>', 'Specific repository paths to sync')
  .option('--scan <paths...>', 'Paths to scan for repositories')
  .option('--dry-run', 'Preview changes without applying them')
  .option('--interactive', 'Prompt for each repository')
  .option('--auto', 'Only sync repos with auto_update: true')
  .option('--force', 'Sync even if there are uncommitted changes')
  .action(async (options) => {
    try {
      const { syncReposCmd } = await import('../src/commands/sync-repos.js');
      await syncReposCmd({
        ...options,
        verbose: program.opts().verbose
      });
    } catch (e) {
      printError(e);
      process.exit(1);
    }
  });

// Wrapper installation commands
program
  .command('install-wrappers')
  .description('Install cross-platform wrapper scripts')
  .option('--shell <type>', 'Shell type (bash, powershell, cmd, all)')
  .option('--global', 'Install system-wide (requires permissions)')
  .option('--aliases', 'Add unified command aliases')
  .action(async (options) => {
    try {
      await installWrappers(options);
      
      if (options.aliases) {
        await addUnifiedAliases(options.shell || 'all');
      }
      
      success('Wrappers installed successfully!');
      info('Run sync-claude --help to get started');
    } catch (e) {
      printError(e);
      process.exit(1);
    }
  });

program
  .command('uninstall-wrappers')
  .description('Uninstall wrapper scripts')
  .option('--shell <type>', 'Shell type (bash, powershell, cmd, all)')
  .option('--global', 'Uninstall from system-wide location')
  .action(async (options) => {
    try {
      await uninstallWrappers(options);
      success('Wrappers uninstalled successfully');
    } catch (e) {
      printError(e);
      process.exit(1);
    }
  });

program
  .command('list-wrappers')
  .description('List installed wrapper scripts')
  .action(async () => {
    try {
      await listWrappers();
    } catch (e) {
      printError(e);
      process.exit(1);
    }
  });

program
  .command('wrapper-examples')
  .description('Show examples of unified wrapper commands')
  .action(() => {
    showUnifiedExamples();
  });

program.parse();
