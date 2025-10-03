import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

/**
 * Syncs CLAUDE.md preference files across repositories
 * This tool is ONLY for syncing preferences - not for running configurators
 */
export class RepoSync {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false;
  }

  /**
   * Sync CLAUDE.md preferences to a repository
   */
  async syncRepo(repo, options = {}) {
    const { dryRun = this.dryRun, verbose = false, force = false } = options;

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
        if (!force) {
          result.skipped = true;
          result.errors.push('Repository has uncommitted changes. Use --force to override.');
          return result;
        }
      }

      // Sync CLAUDE.md preferences
      const syncResult = await this._syncPreferences(repo.path, repo.config, { dryRun, verbose });

      if (!syncResult.success) {
        result.errors.push(syncResult.error);
        return result;
      }

      result.changes.push(...syncResult.changes);

      // Handle git operations if not dry run
      if (!dryRun && syncResult.changes.length > 0) {
        if (repo.config.create_pr) {
          const prResult = await this._createPR(repo.path, repo.config.branch_name);
          if (prResult.success) {
            result.changes.push(`Created PR on branch ${repo.config.branch_name}`);

            if (repo.config.auto_push) {
              result.changes.push('Pushed changes to remote');
            }
          } else {
            result.errors.push(`PR creation failed: ${prResult.error}`);
          }
        } else {
          const commitResult = await this._commitChanges(repo.path);
          if (commitResult.success) {
            result.changes.push('Committed changes');

            if (repo.config.auto_push) {
              const pushResult = await this._pushChanges(repo.path);
              if (pushResult.success) {
                result.changes.push('Pushed changes to remote');
              } else {
                result.errors.push(`Push failed: ${pushResult.error}`);
              }
            }
          } else {
            result.errors.push(`Commit failed: ${commitResult.error}`);
          }
        }
      } else if (dryRun) {
        result.changes.push(`Would ${repo.config.create_pr ? 'create PR' : 'commit'} changes`);
      }

      result.success = true;
    } catch (error) {
      result.errors.push(error.message);
    }

    return result;
  }

  /**
   * Sync CLAUDE.md preferences to a repository
   */
  async _syncPreferences(repoPath, config, options = {}) {
    const { dryRun = false, verbose = false } = options;

    try {
      if (dryRun) {
        return {
          success: true,
          changes: ['Would update CLAUDE.md files']
        };
      }

      // Import the necessary modules
      const { loadConfig } = await import('../config/index.js');
      const { createTransformer } = await import('../transformers/index.js');

      // Load preferences from default config, skipping project-specific layers
      // This prevents claude-context-sync's own project context from leaking to other repos
      const { config: preferences } = await loadConfig(null, { skipProjectLayers: true });

      // Transform to CLAUDE.md format
      const transformer = createTransformer('claude-md', preferences);
      const claudeMd = await transformer.transform();

      // Define target paths
      // Per Claude Code convention: CLAUDE.md in project root
      // Also sync to .claude/ for backward compatibility
      const targets = [
        join(repoPath, 'CLAUDE.md'),           // Primary: project root
        join(repoPath, '.claude', 'CLAUDE.md')  // Secondary: .claude directory
      ];

      const changes = [];

      // Write to both locations
      for (const targetPath of targets) {
        let finalContent = claudeMd;

        // Check if we need to preserve sections
        if (config.preserve_sections && config.preserve_sections.length > 0) {
          if (existsSync(targetPath)) {
            const existingContent = readFileSync(targetPath, 'utf-8');

            // Extract preserved sections from existing file
            const preservedContent = this._extractPreservedSections(
              existingContent,
              config.preserve_sections
            );

            if (preservedContent) {
              // Append preserved content with clear marker
              finalContent = claudeMd + '\n\n' + preservedContent;
            }
          }
        }

        // Check if file already exists and has same content
        if (existsSync(targetPath)) {
          const existingContent = readFileSync(targetPath, 'utf-8');
          if (existingContent === finalContent) {
            if (verbose) {
              console.log(`  ✓ ${targetPath} already up to date`);
            }
            continue;
          }
        }

        // Ensure directory exists
        mkdirSync(dirname(targetPath), { recursive: true });

        // Write file
        writeFileSync(targetPath, finalContent, 'utf-8');

        changes.push(`Updated ${targetPath}`);

        if (verbose) {
          console.log(`  ✓ Updated ${targetPath}`);
        }
      }

      return {
        success: true,
        changes
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to sync preferences: ${error.message}`,
        changes: []
      };
    }
  }

  /**
   * Extract preserved sections from existing CLAUDE.md file
   * Looks for HTML comment markers indicating project-specific content
   */
  _extractPreservedSections(content, sectionNames) {
    // Look for the PROJECT-SPECIFIC marker comment
    const startMarker = '<!-- PROJECT-SPECIFIC PREFERENCES';
    const startIndex = content.indexOf(startMarker);

    if (startIndex === -1) {
      return null; // No preserved section found
    }

    // Extract everything from the marker to the end
    const preserved = content.substring(startIndex);

    return preserved;
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
   * Create pull request
   */
  async _createPR(repoPath, branchName) {
    try {
      // Check if branch exists
      let branchExists = false;
      try {
        execSync(`git rev-parse --verify ${branchName}`, {
          cwd: repoPath,
          stdio: 'pipe'
        });
        branchExists = true;
      } catch {
        branchExists = false;
      }

      if (branchExists) {
        // Switch to existing branch
        execSync(`git checkout ${branchName}`, { cwd: repoPath, stdio: 'pipe' });
      } else {
        // Create and switch to new branch
        execSync(`git checkout -b ${branchName}`, { cwd: repoPath, stdio: 'pipe' });
      }

      // Stage changes
      execSync('git add .github/CLAUDE.md .claude/CLAUDE.md', { cwd: repoPath, stdio: 'pipe' });

      // Commit
      const commitMsg = 'chore: update Claude preferences\n\nAuto-synced from claude-context-sync';
      execSync(`git commit -m "${commitMsg}"`, { cwd: repoPath, stdio: 'pipe' });

      // Push
      execSync(`git push -u origin ${branchName}`, { cwd: repoPath, stdio: 'pipe' });

      // Create PR using gh cli if available
      try {
        execSync(`gh pr create --title "Update Claude Preferences" --body "Auto-synced preferences from claude-context-sync"`, {
          cwd: repoPath,
          stdio: 'pipe'
        });
      } catch {
        // gh cli not available or PR already exists - not a failure
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
      execSync('git add .github/CLAUDE.md .claude/CLAUDE.md', { cwd: repoPath, stdio: 'pipe' });

      const commitMsg = 'chore: update Claude preferences\n\nAuto-synced from claude-context-sync';
      execSync(`git commit -m "${commitMsg}"`, { cwd: repoPath, stdio: 'pipe' });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Push changes to remote
   */
  async _pushChanges(repoPath) {
    try {
      execSync('git push', { cwd: repoPath, stdio: 'pipe' });
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
