/**
 * Unified command aliases for cross-platform usage
 * Provides the simplified interface mentioned in the issue requirements
 */

import { info, success } from '../utils/logger.js';

/**
 * Add unified command aliases to the CLI
 */
export function addUnifiedAliases(program) {
  // Core sync operations
  program
    .command('all')
    .description('Sync everything (preferences to all targets)')
    .action(async () => {
      info('Syncing to all targets...');
      info('Will sync: chat preferences, global CLAUDE.md, and all marked projects');
      // TODO: Implement when sync functionality is ready
      info('Sync all command - full implementation pending');
    });

  program
    .command('chat')
    .description('Sync chat preferences only')
    .action(async () => {
      info('Syncing chat preferences...');
      // TODO: Implement when sync functionality is ready
      info('Sync chat command - full implementation pending');
    });

  program
    .command('global')
    .description('Sync global CLAUDE.md only')
    .action(async () => {
      info('Syncing global CLAUDE.md...');
      // TODO: Implement when sync functionality is ready
      info('Sync global command - full implementation pending');
    });

  program
    .command('project [path]')
    .description('Sync project CLAUDE.md (current directory if no path)')
    .action(async (path) => {
      const targetPath = path || process.cwd();
      info(`Syncing project CLAUDE.md for: ${targetPath}`);
      // TODO: Implement when sync functionality is ready
      info('Sync project command - full implementation pending');
    });

  // Quick actions
  program
    .command('edit')
    .description('Open preferences.yaml in $EDITOR')
    .action(async () => {
      info('Opening preferences in editor...');
      // TODO: Implement editor opening
      info('Edit command - full implementation pending');
    });

  // Session management shortcuts
  program
    .command('check')
    .alias('status')
    .description('Check session validity and sync status')
    .action(async () => {
      info('Checking session and sync status...');
      // TODO: Implement status checking
      info('Check command - full implementation pending');
    });

  program
    .command('refresh')
    .description('Refresh expired session')
    .action(async () => {
      info('Refreshing session...');
      // TODO: Implement session refresh
      info('Refresh command - full implementation pending');
    });

  // Discovery commands
  program
    .command('discover')
    .description('Find all .claude-sync enabled repositories')
    .action(async () => {
      info('Discovering .claude-sync repositories...');
      // TODO: Implement repository discovery
      info('Discover command - full implementation pending');
    });

  program
    .command('sync-repos')
    .description('Update all marked repositories')
    .option('--auto', 'automatically sync without confirmation')
    .action(async (options) => {
      info('Syncing marked repositories...');
      if (options.auto) {
        info('Auto mode enabled - will sync without prompts');
      }
      // TODO: Implement repository syncing
      info('Sync repos command - full implementation pending');
    });
}

/**
 * Display unified usage examples
 */
export function showUnifiedExamples() {
  const examples = [
    '# Core operations (work identically across platforms)',
    'sync-claude all                    # Sync everything',
    'sync-claude chat                   # Sync chat preferences',
    'sync-claude global                 # Sync global CLAUDE.md',
    'sync-claude project [path]         # Sync project CLAUDE.md',
    '',
    '# Quick actions',
    'sync-claude edit                   # Open preferences.yaml in $EDITOR',
    'sync-claude validate               # Validate preferences',
    'sync-claude diff [target]          # Show differences',
    '',
    '# Session management',
    'sync-claude check                  # Check session validity',
    'sync-claude refresh                # Refresh expired session',
    '',
    '# Discovery',
    'sync-claude discover               # Find all .claude-sync repos',
    'sync-claude sync-repos [--auto]    # Update marked repos',
    '',
    '# Wrapper management',
    'sync-claude install-wrappers       # Install platform wrappers',
    'sync-claude list-wrappers          # Show installed wrappers'
  ];

  info('Unified Interface Examples:');
  examples.forEach(example => info(example));
}

/**
 * Setup command aliases based on the original CLI commands
 */
export function setupCommandAliases(program) {
  // Add alias for the full sync command
  const syncCommand = program.commands.find(cmd => cmd.name() === 'sync');
  if (syncCommand) {
    // Clone the sync command but with shorter names
    const allCommand = program
      .command('all')
      .description('Sync everything (alias for sync --all)')
      .action(async () => {
        // Execute the sync command with --all flag
        await syncCommand.action({ all: true });
      });
  }
}