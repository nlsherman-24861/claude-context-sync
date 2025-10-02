import { readdirSync, statSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { parse as parseYaml } from 'yaml';

/**
 * Discovers repositories with .claude-sync markers
 */
export class RepoDiscovery {
  constructor(options = {}) {
    this.ignorePatterns = options.ignorePatterns || [
      'node_modules',
      '.git',
      'dist',
      'build',
      '.archived',
      '.backup'
    ];
  }

  /**
   * Scan directories for repositories with .claude-sync markers
   */
  async discover(scanPaths, options = {}) {
    const { maxDepth = 3, followSymlinks = false } = options;
    const repos = [];

    for (const scanPath of scanPaths) {
      if (!existsSync(scanPath)) {
        continue;
      }

      await this._scanDirectory(scanPath, 0, maxDepth, repos, followSymlinks);
    }

    return repos;
  }

  /**
   * Recursively scan directory for .claude-sync markers
   */
  async _scanDirectory(dir, currentDepth, maxDepth, repos, followSymlinks) {
    if (currentDepth > maxDepth) {
      return;
    }

    try {
      const entries = readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        // Skip ignored patterns
        if (this._shouldIgnore(entry.name)) {
          continue;
        }

        // Check for .claude-sync in this directory
        const markerPath = join(dir, '.claude-sync');
        if (existsSync(markerPath)) {
          const config = await this._parseMarkerFile(markerPath);
          if (config && config.sync !== false) {
            repos.push({
              path: dir,
              config: config,
              markerPath: markerPath
            });
          }
          // Don't recurse into repos with markers
          return;
        }

        // Recurse into subdirectories
        if (entry.isDirectory()) {
          await this._scanDirectory(
            fullPath,
            currentDepth + 1,
            maxDepth,
            repos,
            followSymlinks
          );
        } else if (entry.isSymbolicLink() && followSymlinks) {
          const stat = statSync(fullPath);
          if (stat.isDirectory()) {
            await this._scanDirectory(
              fullPath,
              currentDepth + 1,
              maxDepth,
              repos,
              followSymlinks
            );
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
      if (error.code !== 'EACCES' && error.code !== 'EPERM') {
        throw error;
      }
    }
  }

  /**
   * Check if path should be ignored
   */
  _shouldIgnore(name) {
    return this.ignorePatterns.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        return regex.test(name);
      }
      return name === pattern || name.startsWith(pattern);
    });
  }

  /**
   * Parse .claude-sync marker file
   */
  async _parseMarkerFile(markerPath) {
    try {
      const content = readFileSync(markerPath, 'utf-8');

      // Try parsing as YAML
      try {
        const config = parseYaml(content);
        return this._normalizeConfig(config);
      } catch (yamlError) {
        // Try parsing as JSON
        try {
          const config = JSON.parse(content);
          return this._normalizeConfig(config);
        } catch (jsonError) {
          return null;
        }
      }
    } catch (error) {
      return null;
    }
  }

  /**
   * Normalize marker config to standard format
   */
  _normalizeConfig(config) {
    return {
      sync: config.sync !== false,
      auto_update: config.auto_update || false,
      configurator: config.configurator || 'claude-actions-setup',
      version: config.version || '*',
      preserve_overrides: config.preserve_overrides !== false,
      create_pr: config.create_pr !== false,
      branch_name: config.branch_name || 'chore/update-claude-config'
    };
  }

  /**
   * Filter repos by configurator type
   */
  filterByConfigurator(repos, configurator) {
    return repos.filter(repo => repo.config.configurator === configurator);
  }

  /**
   * Get repos that want auto-update
   */
  getAutoUpdateRepos(repos) {
    return repos.filter(repo => repo.config.auto_update === true);
  }

  /**
   * Get repos that need interactive confirmation
   */
  getInteractiveRepos(repos) {
    return repos.filter(repo => repo.config.auto_update !== true);
  }
}
