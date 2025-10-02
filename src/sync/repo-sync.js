import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Syncs configurator updates across repositories
 */
export class RepoSync {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false;
  }

  /**
   * Sync a repository with configurator updates
   */
  async syncRepo(repo, options = {}) {
    const { dryRun = this.dryRun, verbose = false } = options;

    const result = {
      repo: repo.path,
      success: false,
      changes: [],
      errors: [],
      skipped: false
    };

    try {
      // Check for uncommitted changes
      if (this._hasUncommittedChanges(repo.path)) {
        if (!options.force) {
          result.skipped = true;
          result.errors.push('Repository has uncommitted changes. Use --force to override.');
          return result;
        }
      }

      // Create backup if needed
      if (!dryRun && repo.config.preserve_overrides) {
        await this._createBackup(repo.path);
        result.changes.push('Created backup');
      }

      // Run configurator
      const configuratorResult = await this._runConfigurator(
        repo.path,
        repo.config.configurator,
        { dryRun, verbose }
      );

      if (configuratorResult.success) {
        result.changes.push(`Ran ${repo.config.configurator}`);
      } else {
        result.errors.push(configuratorResult.error);
        return result;
      }

      // Create PR or commit directly
      if (!dryRun) {
        if (repo.config.create_pr) {
          await this._createPR(repo.path, repo.config.branch_name);
          result.changes.push(`Created PR on branch ${repo.config.branch_name}`);
        } else {
          await this._commitChanges(repo.path);
          result.changes.push('Committed changes to current branch');
        }
      } else {
        result.changes.push(`Would ${repo.config.create_pr ? 'create PR' : 'commit'} changes`);
      }

      result.success = true;
    } catch (error) {
      result.errors.push(error.message);
    }

    return result;
  }

  /**
   * Sync multiple repositories
   */
  async syncRepos(repos, options = {}) {
    const results = [];

    for (const repo of repos) {
      const result = await this.syncRepo(repo, options);
      results.push(result);
    }

    return results;
  }

  /**
   * Check if repository has uncommitted changes
   */
  _hasUncommittedChanges(repoPath) {
    try {
      const gitStatus = execSync('git status --porcelain', {
        cwd: repoPath,
        encoding: 'utf-8',
        stdio: 'pipe'
      });
      return gitStatus.trim().length > 0;
    } catch (error) {
      // Not a git repo or git not available
      return false;
    }
  }

  /**
   * Create backup of important files
   */
  async _createBackup(repoPath) {
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+$/, '');
    const backupDir = join(repoPath, '.claude-backups', timestamp);

    const filesToBackup = [
      '.github/workflows/claude.yml',
      '.claude/CLAUDE.md',
      'CLAUDE.md'
    ];

    for (const file of filesToBackup) {
      const filePath = join(repoPath, file);
      if (existsSync(filePath)) {
        const content = readFileSync(filePath, 'utf-8');
        const backupPath = join(backupDir, file);

        // Create backup directory structure
        const { mkdirSync } = await import('fs');
        mkdirSync(join(backupDir, ...file.split('/').slice(0, -1)), { recursive: true });

        writeFileSync(backupPath, content, 'utf-8');
      }
    }

    return backupDir;
  }

  /**
   * Run configurator tool
   */
  async _runConfigurator(repoPath, configurator, options = {}) {
    const { dryRun = false, verbose = false } = options;

    try {
      if (dryRun) {
        return { success: true, output: '[DRY RUN] Would run configurator' };
      }

      const command = this._getConfiguratorCommand(configurator);

      const output = execSync(command, {
        cwd: repoPath,
        encoding: 'utf-8',
        stdio: verbose ? 'inherit' : 'pipe'
      });

      return { success: true, output };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get command for configurator
   */
  _getConfiguratorCommand(configurator) {
    const commands = {
      'claude-actions-setup': 'npx -y @nlsherman/claude-actions-setup',
      'setup-claude-integration': 'node setup-claude-integration.js'
    };

    return commands[configurator] || configurator;
  }

  /**
   * Create pull request
   */
  async _createPR(repoPath, branchName) {
    try {
      // Check if branch exists
      const branchExists = execSync(`git rev-parse --verify ${branchName}`, {
        cwd: repoPath,
        stdio: 'pipe'
      }).toString().trim();

      if (branchExists) {
        // Switch to existing branch
        execSync(`git checkout ${branchName}`, { cwd: repoPath, stdio: 'pipe' });
      } else {
        // Create and switch to new branch
        execSync(`git checkout -b ${branchName}`, { cwd: repoPath, stdio: 'pipe' });
      }

      // Stage changes
      execSync('git add .', { cwd: repoPath, stdio: 'pipe' });

      // Commit
      const commitMsg = 'chore: update Claude Code configuration\n\nAuto-synced from claude-context-sync';
      execSync(`git commit -m "${commitMsg}"`, { cwd: repoPath, stdio: 'pipe' });

      // Push
      execSync(`git push -u origin ${branchName}`, { cwd: repoPath, stdio: 'pipe' });

      // Create PR using gh cli if available
      try {
        execSync(`gh pr create --title "Update Claude Code Configuration" --body "Auto-synced configuration from claude-context-sync"`, {
          cwd: repoPath,
          stdio: 'pipe'
        });
      } catch (ghError) {
        // gh cli not available or PR already exists
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Commit changes directly
   */
  async _commitChanges(repoPath) {
    try {
      execSync('git add .', { cwd: repoPath, stdio: 'pipe' });

      const commitMsg = 'chore: update Claude Code configuration\n\nAuto-synced from claude-context-sync';
      execSync(`git commit -m "${commitMsg}"`, { cwd: repoPath, stdio: 'pipe' });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get sync summary
   */
  getSummary(results) {
    const summary = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success && !r.skipped).length,
      skipped: results.filter(r => r.skipped).length
    };

    return summary;
  }
}
