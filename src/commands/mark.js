/**
 * Mark repositories for auto-sync
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { mkdir, writeFile, access, readFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { info, success, warn, error as logError } from '../utils/logger.js';
import yaml from 'js-yaml';

const execAsync = promisify(exec);

const DEFAULT_CLAUDE_SYNC_CONFIG = {
  sync: true,
  auto_update: true,
  configurator: 'claude-actions-setup',
  version: '*',
  preserve_overrides: true,
  create_pr: false,
  branch_name: 'chore/update-claude-config',
  auto_push: false
};

/**
 * Get default repos directory
 */
function getDefaultReposDir() {
  return join(homedir(), 'repos');
}

/**
 * Check if repo is already cloned locally
 */
async function isRepoCloned(repoPath) {
  try {
    await access(repoPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Clone a repository
 */
async function cloneRepo(repoUrl, targetDir) {
  info(`  Cloning ${repoUrl}...`);
  try {
    await execAsync(`git clone ${repoUrl} "${targetDir}"`);
    return true;
  } catch (error) {
    logError(`  Failed to clone: ${error.message}`);
    return false;
  }
}

/**
 * Create .claude-sync marker file
 */
async function createMarkerFile(repoPath, config = {}) {
  const markerPath = join(repoPath, '.claude-sync');
  const markerConfig = { ...DEFAULT_CLAUDE_SYNC_CONFIG, ...config };

  try {
    const yamlContent = yaml.dump(markerConfig, { lineWidth: -1 });
    await writeFile(markerPath, yamlContent, 'utf-8');
    return true;
  } catch (error) {
    logError(`  Failed to create marker file: ${error.message}`);
    return false;
  }
}

/**
 * Check if marker file already exists
 */
async function hasMarkerFile(repoPath) {
  try {
    await access(join(repoPath, '.claude-sync'));
    return true;
  } catch {
    return false;
  }
}

/**
 * List repositories from GitHub
 */
async function listGitHubRepos(username, filter = 'all') {
  let visibilityFilter = '';

  if (filter === 'private') {
    visibilityFilter = '--source --visibility private';
  } else if (filter === 'public') {
    visibilityFilter = '--source --visibility public';
  } else {
    visibilityFilter = '--source';
  }

  try {
    const { stdout } = await execAsync(
      `gh repo list ${username} ${visibilityFilter} --limit 100 --json name,url,isPrivate`
    );

    return JSON.parse(stdout);
  } catch (error) {
    throw new Error(`Failed to list repos: ${error.message}`);
  }
}

/**
 * Mark a single repository
 */
async function markRepo(repoName, repoUrl, reposDir, config = {}, options = {}) {
  const repoPath = join(reposDir, repoName);

  // Check if already cloned
  const alreadyCloned = await isRepoCloned(repoPath);

  if (alreadyCloned) {
    // Check if already marked
    const alreadyMarked = await hasMarkerFile(repoPath);

    if (alreadyMarked && !options.force) {
      info(`  ✓ ${repoName} - already marked`);
      return { status: 'skipped', reason: 'already_marked' };
    }

    // Create/update marker file
    const created = await createMarkerFile(repoPath, config);
    if (created) {
      success(`  ✓ ${repoName} - marked`);
      return { status: 'marked', path: repoPath };
    } else {
      return { status: 'failed', reason: 'marker_creation_failed' };
    }
  } else {
    // Clone the repo
    const cloned = await cloneRepo(repoUrl, repoPath);

    if (!cloned) {
      return { status: 'failed', reason: 'clone_failed' };
    }

    // Create marker file
    const created = await createMarkerFile(repoPath, config);
    if (created) {
      success(`  ✓ ${repoName} - cloned and marked`);
      return { status: 'cloned_and_marked', path: repoPath };
    } else {
      return { status: 'failed', reason: 'marker_creation_failed' };
    }
  }
}

/**
 * Load workspace config with exclude patterns
 */
async function loadWorkspaceConfig(reposDir) {
  const workspaceConfigPath = join(reposDir, '.claude-sync-workspace');

  try {
    await access(workspaceConfigPath);
    const content = await readFile(workspaceConfigPath, 'utf-8');
    return yaml.load(content);
  } catch {
    return null;
  }
}

/**
 * Check if repo should be excluded
 */
function shouldExcludeRepo(repoName, excludePatterns) {
  if (!excludePatterns || excludePatterns.length === 0) {
    return false;
  }

  for (const pattern of excludePatterns) {
    // Simple glob-like matching: * matches anything
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    if (regex.test(repoName)) {
      return true;
    }
  }

  return false;
}

/**
 * Bulk mark command
 */
export async function bulkMarkCmd(options = {}) {
  const {
    user,
    filter = 'private',
    reposDir = getDefaultReposDir(),
    config = {},
    dryRun = false,
    force = false,
    exclude = []
  } = options;

  if (!user) {
    throw new Error('Username required. Use --user <username>');
  }

  info(`→ Marking repositories for ${user}...`);
  info(`→ Filter: ${filter}`);
  info(`→ Repos directory: ${reposDir}`);

  if (dryRun) {
    warn('→ DRY RUN MODE - no changes will be made');
  }

  // List repos from GitHub
  info('→ Fetching repositories from GitHub...');
  const repos = await listGitHubRepos(user, filter);

  info(`→ Found ${repos.length} repositories`);
  info('');

  // Ensure repos directory exists
  if (!dryRun) {
    await mkdir(reposDir, { recursive: true });
  }

  const results = {
    marked: [],
    cloned_and_marked: [],
    skipped: [],
    failed: []
  };

  // Process each repo
  for (const repo of repos) {
    if (dryRun) {
      info(`  [DRY RUN] Would process: ${repo.name}`);
      continue;
    }

    const result = await markRepo(
      repo.name,
      repo.url,
      reposDir,
      config,
      { force }
    );

    if (result.status) {
      results[result.status] = results[result.status] || [];
      results[result.status].push(repo.name);
    }
  }

  // Summary
  info('');
  info('==================================================');
  success(`✓ Bulk marking completed!`);

  if (results.cloned_and_marked.length > 0) {
    info(`  - Cloned and marked: ${results.cloned_and_marked.length}`);
  }

  if (results.marked.length > 0) {
    info(`  - Marked (already cloned): ${results.marked.length}`);
  }

  if (results.skipped.length > 0) {
    info(`  - Skipped (already marked): ${results.skipped.length}`);
  }

  if (results.failed.length > 0) {
    warn(`  - Failed: ${results.failed.length}`);
  }

  info('');
  info(`Next steps:`);
  info(`  1. Review cloned repositories in: ${reposDir}`);
  info(`  2. Run: claude-context-sync sync --target all`);

  return results;
}

/**
 * Mark a single repo command
 */
export async function markRepoCmd(repoPath, options = {}) {
  const {
    config = {},
    force = false
  } = options;

  info(`→ Marking repository: ${repoPath}`);

  const alreadyMarked = await hasMarkerFile(repoPath);

  if (alreadyMarked && !force) {
    warn('  Repository is already marked');
    info('  Use --force to overwrite existing marker');
    return;
  }

  const created = await createMarkerFile(repoPath, config);

  if (created) {
    success('✓ Repository marked successfully');
    info(`  Marker file: ${join(repoPath, '.claude-sync')}`);
  } else {
    throw new Error('Failed to create marker file');
  }
}
