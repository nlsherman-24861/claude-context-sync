import { info, success, warn, error as logError } from '../utils/logger.js';
import { RepoDiscovery } from '../sync/repo-discovery.js';
import { RepoSync } from '../sync/repo-sync.js';
import { homedir } from 'os';
import { join } from 'path';

/**
 * Discover repositories with .claude-sync markers
 */
export async function discoverRepos(options = {}) {
  const { scan = [], verbose = false } = options;

  try {
    // Default scan paths if none provided
    const scanPaths = scan.length > 0 ? scan : [
      join(homedir(), 'projects'),
      join(homedir(), 'work'),
      join(homedir(), 'repos')
    ];

    info('Scanning for repositories with .claude-sync markers...');
    if (verbose) {
      info(`Scan paths: ${scanPaths.join(', ')}`);
    }

    const discovery = new RepoDiscovery();
    const repos = await discovery.discover(scanPaths, { maxDepth: 3 });

    if (repos.length === 0) {
      warn('No repositories found with .claude-sync markers');
      info('To mark a repository for auto-sync, create a .claude-sync file in its root:');
      console.log('');
      console.log('  sync: true');
      console.log('  auto_update: true');
      console.log('  configurator: claude-actions-setup');
      return [];
    }

    success(`Found ${repos.length} repository(ies) with .claude-sync markers:\n`);

    repos.forEach((repo, i) => {
      console.log(`${i + 1}. ${repo.path}`);
      console.log(`   Configurator: ${repo.config.configurator}`);
      console.log(`   Auto-update: ${repo.config.auto_update ? 'Yes' : 'No'}`);
      console.log(`   Create PR: ${repo.config.create_pr ? 'Yes' : 'No'}`);
      console.log('');
    });

    return repos;
  } catch (e) {
    logError(`Discovery failed: ${e.message}`);
    throw e;
  }
}

/**
 * Sync configurator updates to repositories
 */
export async function syncReposCmd(options = {}) {
  const {
    path = [],
    scan = [],
    dryRun = false,
    interactive = false,
    auto = false,
    force = false,
    verbose = false
  } = options;

  try {
    let repos = [];

    // If specific paths provided, use those
    if (path.length > 0) {
      info(`Syncing ${path.length} specific repository(ies)...`);
      // Load .claude-sync config for each path
      const discovery = new RepoDiscovery();
      for (const repoPath of path) {
        const markerPath = join(repoPath, '.claude-sync');
        const config = await discovery._parseMarkerFile(markerPath);
        if (config) {
          repos.push({ path: repoPath, config, markerPath });
        } else {
          warn(`No .claude-sync marker found in ${repoPath}`);
        }
      }
    } else {
      // Discover repos
      repos = await discoverRepos({ scan, verbose });
    }

    if (repos.length === 0) {
      return;
    }

    // Filter for auto-update if --auto flag
    if (auto) {
      const discovery = new RepoDiscovery();
      repos = discovery.getAutoUpdateRepos(repos);
      info(`Filtered to ${repos.length} auto-update repository(ies)`);
    }

    if (dryRun) {
      info('\n=== DRY RUN MODE ===');
      info('No changes will be made\n');
    }

    // Sync repos
    const repoSync = new RepoSync({ dryRun });
    const results = [];

    for (const repo of repos) {
      console.log(`\n${'='.repeat(60)}`);
      info(`Syncing: ${repo.path}`);
      console.log(`${'='.repeat(60)}\n`);

      // Interactive mode - ask for confirmation
      if (interactive && !auto && !dryRun) {
        const readline = await import('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });

        const answer = await new Promise(resolve => {
          rl.question(`Sync this repository? (y/n) `, resolve);
        });
        rl.close();

        if (answer.toLowerCase() !== 'y') {
          info('Skipped by user');
          continue;
        }
      }

      const result = await repoSync.syncRepo(repo, { dryRun, verbose, force });
      results.push(result);

      if (result.success) {
        success('✓ Sync completed');
        result.changes.forEach(change => info(`  • ${change}`));
      } else if (result.skipped) {
        warn('⚠ Sync skipped');
        result.errors.forEach(err => warn(`  • ${err}`));
      } else {
        logError('✗ Sync failed');
        result.errors.forEach(err => logError(`  • ${err}`));
      }
      console.log(''); // Blank line for readability
    }

    // Print summary
    console.log(`\n${'='.repeat(60)}`);
    info('SYNC SUMMARY');
    console.log(`${'='.repeat(60)}\n`);

    const summary = repoSync.getSummary(results);
    console.log(`Total repositories: ${summary.total}`);

    if (summary.successful > 0) {
      success(`✓ Successful: ${summary.successful}`);
      results.filter(r => r.success).forEach(r => {
        const repoName = r.repo.split(/[/\\]/).pop();
        console.log(`  • ${repoName}`);
      });
    }

    if (summary.failed > 0) {
      logError(`✗ Failed: ${summary.failed}`);
      results.filter(r => !r.success && !r.skipped).forEach(r => {
        const repoName = r.repo.split(/[/\\]/).pop();
        const errorMsg = r.errors[0] || 'Unknown error';
        console.log(`  • ${repoName}: ${errorMsg}`);
      });
    }

    if (summary.skipped > 0) {
      warn(`⚠ Skipped: ${summary.skipped}`);
      results.filter(r => r.skipped).forEach(r => {
        const repoName = r.repo.split(/[/\\]/).pop();
        const skipMsg = r.errors[0] || 'Unknown reason';
        console.log(`  • ${repoName}: ${skipMsg}`);
      });
    }

    if (dryRun) {
      info('\nThis was a dry run. Run without --dry-run to apply changes.');
    }

    return results;
  } catch (e) {
    logError(`Sync failed: ${e.message}`);
    throw e;
  }
}
