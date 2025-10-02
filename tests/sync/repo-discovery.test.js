import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RepoDiscovery } from '../../src/sync/repo-discovery.js';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('RepoDiscovery', () => {
  let testDir;
  let discovery;

  beforeEach(() => {
    testDir = join(tmpdir(), `repo-discovery-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    discovery = new RepoDiscovery();
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('discover', () => {
    it('should find repositories with .claude-sync markers', async () => {
      // Create test repo with marker
      const repo1 = join(testDir, 'repo1');
      mkdirSync(repo1, { recursive: true });
      writeFileSync(join(repo1, '.claude-sync'), 'sync: true', 'utf-8');

      const repos = await discovery.discover([testDir]);

      expect(repos.length).toBe(1);
      expect(repos[0].path).toBe(repo1);
      expect(repos[0].config.sync).toBe(true);
    });

    it('should ignore directories without .claude-sync', async () => {
      const repo1 = join(testDir, 'repo1');
      const repo2 = join(testDir, 'repo2');
      mkdirSync(repo1, { recursive: true });
      mkdirSync(repo2, { recursive: true });

      // Only repo1 has marker
      writeFileSync(join(repo1, '.claude-sync'), 'sync: true', 'utf-8');

      const repos = await discovery.discover([testDir]);

      expect(repos.length).toBe(1);
      expect(repos[0].path).toBe(repo1);
    });

    it('should respect maxDepth option', async () => {
      // Create nested structure
      const deep = join(testDir, 'level1', 'level2', 'level3', 'repo');
      mkdirSync(deep, { recursive: true });
      writeFileSync(join(deep, '.claude-sync'), 'sync: true', 'utf-8');

      // Should not find with maxDepth: 2
      const repos1 = await discovery.discover([testDir], { maxDepth: 2 });
      expect(repos1.length).toBe(0);

      // Should find with maxDepth: 4
      const repos2 = await discovery.discover([testDir], { maxDepth: 4 });
      expect(repos2.length).toBe(1);
    });

    it('should skip ignored patterns', async () => {
      const nodeModules = join(testDir, 'node_modules', 'some-package');
      mkdirSync(nodeModules, { recursive: true });
      writeFileSync(join(nodeModules, '.claude-sync'), 'sync: true', 'utf-8');

      const repos = await discovery.discover([testDir]);

      expect(repos.length).toBe(0);
    });

    it('should exclude repos with sync: false', async () => {
      const repo1 = join(testDir, 'repo1');
      mkdirSync(repo1, { recursive: true });
      writeFileSync(join(repo1, '.claude-sync'), 'sync: false', 'utf-8');

      const repos = await discovery.discover([testDir]);

      expect(repos.length).toBe(0);
    });

    it('should parse YAML marker files', async () => {
      const repo1 = join(testDir, 'repo1');
      mkdirSync(repo1, { recursive: true });

      const marker = `
sync: true
auto_update: true
configurator: claude-actions-setup
create_pr: false
`;
      writeFileSync(join(repo1, '.claude-sync'), marker, 'utf-8');

      const repos = await discovery.discover([testDir]);

      expect(repos.length).toBe(1);
      expect(repos[0].config.auto_update).toBe(true);
      expect(repos[0].config.configurator).toBe('claude-actions-setup');
      expect(repos[0].config.create_pr).toBe(false);
    });

    it('should parse JSON marker files', async () => {
      const repo1 = join(testDir, 'repo1');
      mkdirSync(repo1, { recursive: true });

      const marker = JSON.stringify({
        sync: true,
        auto_update: true,
        configurator: 'setup-claude-integration'
      });
      writeFileSync(join(repo1, '.claude-sync'), marker, 'utf-8');

      const repos = await discovery.discover([testDir]);

      expect(repos.length).toBe(1);
      expect(repos[0].config.configurator).toBe('setup-claude-integration');
    });
  });

  describe('filterByConfigurator', () => {
    it('should filter repos by configurator type', () => {
      const repos = [
        { path: '/repo1', config: { configurator: 'claude-actions-setup' } },
        { path: '/repo2', config: { configurator: 'setup-claude-integration' } },
        { path: '/repo3', config: { configurator: 'claude-actions-setup' } }
      ];

      const filtered = discovery.filterByConfigurator(repos, 'claude-actions-setup');

      expect(filtered.length).toBe(2);
      expect(filtered[0].path).toBe('/repo1');
      expect(filtered[1].path).toBe('/repo3');
    });
  });

  describe('getAutoUpdateRepos', () => {
    it('should return only repos with auto_update: true', () => {
      const repos = [
        { path: '/repo1', config: { auto_update: true } },
        { path: '/repo2', config: { auto_update: false } },
        { path: '/repo3', config: { auto_update: true } }
      ];

      const autoRepos = discovery.getAutoUpdateRepos(repos);

      expect(autoRepos.length).toBe(2);
      expect(autoRepos[0].path).toBe('/repo1');
      expect(autoRepos[1].path).toBe('/repo3');
    });
  });

  describe('getInteractiveRepos', () => {
    it('should return repos that need interactive confirmation', () => {
      const repos = [
        { path: '/repo1', config: { auto_update: true } },
        { path: '/repo2', config: { auto_update: false } },
        { path: '/repo3', config: { auto_update: undefined } }
      ];

      const interactiveRepos = discovery.getInteractiveRepos(repos);

      expect(interactiveRepos.length).toBe(2);
      expect(interactiveRepos[0].path).toBe('/repo2');
      expect(interactiveRepos[1].path).toBe('/repo3');
    });
  });
});
