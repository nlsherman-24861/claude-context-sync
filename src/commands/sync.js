import { info, success, error, warn } from '../utils/logger.js';
import { loadConfig } from '../config/index.js';
import { createTransformer } from '../transformers/index.js';
import { FileSync } from '../sync/file-sync.js';

/**
 * Sync preferences to global CLAUDE.md
 */
export async function syncGlobal(options = {}) {
  const { dryRun = false, backup = true, verbose = false } = options;

  try {
    info('Loading preferences...');
    const { config } = await loadConfig();

    info('Transforming to CLAUDE.md format...');
    const transformer = createTransformer('claude-md', config);
    const content = await transformer.transform();

    if (verbose) {
      console.log('\n--- Transformed Content Preview ---');
      console.log(content.substring(0, 500) + '...');
      console.log('--- End Preview ---\n');
    }

    const fileSync = new FileSync();
    const result = await fileSync.syncGlobal(content, { dryRun, backup });

    if (result.dryRun) {
      info('Dry run complete - no changes made');
      info(`Would write to: ${result.path}`);
    } else {
      success(`Global CLAUDE.md updated: ${result.path}`);
      if (backup) {
        info('Previous version backed up');
      }
    }

    return result;
  } catch (e) {
    error(`Sync to global CLAUDE.md failed: ${e.message}`);
    throw e;
  }
}

/**
 * Sync preferences to project CLAUDE.md
 */
export async function syncProject(options = {}) {
  const { path: projectPath, dryRun = false, backup = true, noMerge = false } = options;

  if (!projectPath) {
    error('Project path required: --path <repo-path>');
    throw new Error('Project path required');
  }

  try {
    info('Loading preferences...');
    const { config } = await loadConfig();

    info('Generating project preferences overlay...');
    const transformer = createTransformer('claude-md', config);
    const content = await transformer.transform();

    const fileSync = new FileSync();
    const result = await fileSync.syncProject(content, projectPath, {
      dryRun,
      backup,
      noMerge
    });

    if (result.dryRun) {
      info('Dry run complete - no changes made');
      info(`Would write to: ${result.path}`);
      info(`Mode: ${noMerge ? 'Overwrite' : 'Merge'}`);
    } else {
      success(`Project CLAUDE.md updated: ${result.path}`);
      if (result.merged) {
        info('Merged with existing project content');
      }
      if (backup) {
        info('Previous version backed up');
      }
    }

    return result;
  } catch (e) {
    error(`Sync to project CLAUDE.md failed: ${e.message}`);
    throw e;
  }
}

/**
 * Sync preferences to all targets
 */
export async function syncAll(options = {}) {
  info('Syncing to all targets...\n');

  const results = {
    global: null,
    errors: []
  };

  // Sync global CLAUDE.md
  try {
    info('Syncing global CLAUDE.md...');
    results.global = await syncGlobal(options);
  } catch (e) {
    results.errors.push({ target: 'global', error: e.message });
    warn(`Failed to sync global CLAUDE.md: ${e.message}`);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  if (results.errors.length === 0) {
    success('✓ All targets synced successfully!');
  } else {
    warn(`⚠ Completed with ${results.errors.length} error(s):`);
    results.errors.forEach(({ target, error }) => {
      warn(`  - ${target}: ${error}`);
    });
  }

  return results;
}

/**
 * List available backups
 */
export async function listBackups(options = {}) {
  const { target = 'global', path: projectPath } = options;

  try {
    const fileSync = new FileSync();
    let targetPath;

    if (target === 'global') {
      targetPath = fileSync.globalCLAUDEPath;
    } else if (target === 'project') {
      if (!projectPath) {
        error('Project path required for project backups: --path <repo-path>');
        throw new Error('Project path required');
      }
      targetPath = await fileSync.findProjectCLAUDE(projectPath);
    } else {
      error('Invalid target. Use: global or project');
      throw new Error('Invalid target');
    }

    const backups = await fileSync.listBackups(targetPath);

    if (backups.length === 0) {
      info(`No backups found for ${target} CLAUDE.md`);
    } else {
      success(`Found ${backups.length} backup(s) for ${target} CLAUDE.md:`);
      backups.forEach((backup, i) => {
        console.log(`  ${i + 1}. ${backup}`);
      });
    }

    return backups;
  } catch (e) {
    error(`Failed to list backups: ${e.message}`);
    throw e;
  }
}

/**
 * Restore from backup
 */
export async function restoreBackup(options = {}) {
  const { target = 'global', path: projectPath, backup: backupPath } = options;

  if (!backupPath) {
    error('Backup path required: --backup <backup-file>');
    throw new Error('Backup path required');
  }

  try {
    const fileSync = new FileSync();
    let targetPath;

    if (target === 'global') {
      targetPath = fileSync.globalCLAUDEPath;
    } else if (target === 'project') {
      if (!projectPath) {
        error('Project path required for project restore: --path <repo-path>');
        throw new Error('Project path required');
      }
      targetPath = await fileSync.findProjectCLAUDE(projectPath);
    } else {
      error('Invalid target. Use: global or project');
      throw new Error('Invalid target');
    }

    info(`Restoring ${target} CLAUDE.md from backup...`);
    const result = await fileSync.restoreBackup(backupPath, targetPath);

    success(`Restored ${target} CLAUDE.md from backup`);
    info(`Target: ${result.path}`);
    info(`Backup: ${result.restoredFrom}`);

    return result;
  } catch (e) {
    error(`Failed to restore backup: ${e.message}`);
    throw e;
  }
}
