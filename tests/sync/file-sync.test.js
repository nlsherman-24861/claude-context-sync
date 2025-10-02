import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FileSync } from '../../src/sync/file-sync.js';
import { join } from 'path';
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, readdirSync } from 'fs';
import { tmpdir } from 'os';

describe('FileSync', () => {
  let testDir;
  let fileSync;

  beforeEach(() => {
    // Create temp directory for tests
    testDir = join(tmpdir(), `file-sync-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    fileSync = new FileSync();
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('findProjectCLAUDE', () => {
    it('should find CLAUDE.md in .claude/ directory', async () => {
      const claudeDir = join(testDir, '.claude');
      mkdirSync(claudeDir, { recursive: true });
      writeFileSync(join(claudeDir, 'CLAUDE.md'), '# Test', 'utf-8');

      const found = await fileSync.findProjectCLAUDE(testDir);

      expect(found).toContain('.claude');
      expect(found).toContain('CLAUDE.md');
    });

    it('should find CLAUDE.md in root directory (legacy)', async () => {
      writeFileSync(join(testDir, 'CLAUDE.md'), '# Test', 'utf-8');

      const found = await fileSync.findProjectCLAUDE(testDir);

      expect(found).toBe(join(testDir, 'CLAUDE.md'));
    });

    it('should prefer .claude/CLAUDE.md over root', async () => {
      const claudeDir = join(testDir, '.claude');
      mkdirSync(claudeDir, { recursive: true });
      writeFileSync(join(claudeDir, 'CLAUDE.md'), '# Claude Dir', 'utf-8');
      writeFileSync(join(testDir, 'CLAUDE.md'), '# Root', 'utf-8');

      const found = await fileSync.findProjectCLAUDE(testDir);

      expect(found).toContain('.claude');
    });

    it('should return default .claude/CLAUDE.md path if neither exists', async () => {
      const found = await fileSync.findProjectCLAUDE(testDir);

      expect(found).toBe(join(testDir, '.claude', 'CLAUDE.md'));
    });
  });

  describe('mergeContent', () => {
    it('should preserve project context when marker exists', () => {
      const existing = `
# Some User Content

---

# PROJECT CONTEXT
## Tech Stack
- Node.js
- React
`;

      const newPrefs = `
# Working with User
## Communication Style
- Concise bullets
`;

      const merged = fileSync.mergeContent(existing, newPrefs);

      expect(merged).toContain('Working with User');
      expect(merged).toContain('PROJECT CONTEXT');
      expect(merged).toContain('Tech Stack');
      expect(merged).toContain('Node.js');
      expect(merged).not.toContain('Some User Content');
    });

    it('should prepend user preferences when no project marker exists', () => {
      const existing = `
# Existing Content
Some text here
`;

      const newPrefs = `
# Working with User
User preferences
`;

      const merged = fileSync.mergeContent(existing, newPrefs);

      expect(merged).toContain('Working with User');
      expect(merged).toContain('Existing Content');
      expect(merged.indexOf('Working with User')).toBeLessThan(merged.indexOf('Existing Content'));
    });
  });

  describe('createBackup', () => {
    it('should create timestamped backup file', async () => {
      const filePath = join(testDir, 'test.md');
      writeFileSync(filePath, '# Original Content', 'utf-8');

      const backupPath = await fileSync.createBackup(filePath);

      expect(existsSync(backupPath)).toBe(true);
      expect(backupPath).toMatch(/test\.md\.backup\.\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}/);

      const backupContent = readFileSync(backupPath, 'utf-8');
      expect(backupContent).toBe('# Original Content');
    });

    it('should preserve original file when creating backup', async () => {
      const filePath = join(testDir, 'test.md');
      const originalContent = '# Original Content';
      writeFileSync(filePath, originalContent, 'utf-8');

      await fileSync.createBackup(filePath);

      const currentContent = readFileSync(filePath, 'utf-8');
      expect(currentContent).toBe(originalContent);
    });
  });

  describe('syncGlobal', () => {
    it('should perform dry run without writing', async () => {
      const content = '# Test Content';

      const result = await fileSync.syncGlobal(content, { dryRun: true });

      expect(result.success).toBe(true);
      expect(result.dryRun).toBe(true);
      expect(result.path).toBeDefined();
    });

    it('should create directory if it does not exist', async () => {
      const testSync = new FileSync();
      const testPath = join(testDir, '.claude', 'CLAUDE.md');
      testSync.globalCLAUDEPath = testPath;

      const content = '# Test Content';

      const result = await testSync.syncGlobal(content, { backup: false });

      expect(result.success).toBe(true);
      expect(existsSync(testPath)).toBe(true);

      const written = readFileSync(testPath, 'utf-8');
      expect(written).toBe(content);
    });

    it('should create backup before overwriting', async () => {
      const testSync = new FileSync();
      const testPath = join(testDir, 'CLAUDE.md');
      testSync.globalCLAUDEPath = testPath;

      writeFileSync(testPath, '# Original', 'utf-8');

      await testSync.syncGlobal('# New Content', { backup: true });

      const backups = readdirSync(testDir).filter(f => f.includes('.backup.'));
      expect(backups.length).toBe(1);
    });

    it('should skip backup when backup option is false', async () => {
      const testSync = new FileSync();
      const testPath = join(testDir, 'CLAUDE.md');
      testSync.globalCLAUDEPath = testPath;

      writeFileSync(testPath, '# Original', 'utf-8');

      await testSync.syncGlobal('# New Content', { backup: false });

      const backups = readdirSync(testDir).filter(f => f.includes('.backup.'));
      expect(backups.length).toBe(0);
    });
  });

  describe('syncProject', () => {
    it('should perform dry run without writing', async () => {
      const content = '# Test Content';

      const result = await fileSync.syncProject(content, testDir, { dryRun: true });

      expect(result.success).toBe(true);
      expect(result.dryRun).toBe(true);
      expect(result.path).toBeDefined();
    });

    it('should write to .claude/CLAUDE.md by default', async () => {
      const content = '# Test Content';

      const result = await fileSync.syncProject(content, testDir, { backup: false });

      expect(result.success).toBe(true);
      expect(result.path).toContain('.claude');
      expect(existsSync(result.path)).toBe(true);

      const written = readFileSync(result.path, 'utf-8');
      expect(written).toBe(content);
    });

    it('should merge with existing content by default', async () => {
      const claudeDir = join(testDir, '.claude');
      mkdirSync(claudeDir, { recursive: true });
      const claudePath = join(claudeDir, 'CLAUDE.md');

      const existing = `
# Existing Preferences

---

# PROJECT CONTEXT
## Tech Stack
- Node.js
`;
      writeFileSync(claudePath, existing, 'utf-8');

      const newContent = '# New Preferences\n## Style\n- Concise';

      const result = await fileSync.syncProject(newContent, testDir, { backup: false });

      expect(result.merged).toBe(true);

      const written = readFileSync(result.path, 'utf-8');
      expect(written).toContain('New Preferences');
      expect(written).toContain('PROJECT CONTEXT');
      expect(written).toContain('Tech Stack');
    });

    it('should overwrite when noMerge is true', async () => {
      const claudeDir = join(testDir, '.claude');
      mkdirSync(claudeDir, { recursive: true });
      const claudePath = join(claudeDir, 'CLAUDE.md');

      writeFileSync(claudePath, '# Old Content', 'utf-8');

      const newContent = '# New Content';

      const result = await fileSync.syncProject(newContent, testDir, {
        backup: false,
        noMerge: true
      });

      expect(result.merged).toBe(false);

      const written = readFileSync(result.path, 'utf-8');
      expect(written).toBe(newContent);
      expect(written).not.toContain('Old Content');
    });
  });

  describe('listBackups', () => {
    it('should list all backups for a file', async () => {
      const filePath = join(testDir, 'test.md');
      writeFileSync(filePath, '# V1', 'utf-8');

      // Create multiple backups with small delays to ensure unique timestamps
      await fileSync.createBackup(filePath);
      await new Promise(resolve => setTimeout(resolve, 10));
      writeFileSync(filePath, '# V2', 'utf-8');
      await fileSync.createBackup(filePath);
      await new Promise(resolve => setTimeout(resolve, 10));
      writeFileSync(filePath, '# V3', 'utf-8');
      await fileSync.createBackup(filePath);

      const backups = await fileSync.listBackups(filePath);

      expect(backups.length).toBe(3);
      expect(backups[0]).toMatch(/test\.md\.backup\./);
    });

    it('should return empty array when no backups exist', async () => {
      const filePath = join(testDir, 'test.md');

      const backups = await fileSync.listBackups(filePath);

      expect(backups).toEqual([]);
    });

    it('should return backups in reverse chronological order', async () => {
      const filePath = join(testDir, 'test.md');
      writeFileSync(filePath, '# V1', 'utf-8');

      await fileSync.createBackup(filePath);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s
      writeFileSync(filePath, '# V2', 'utf-8');
      await fileSync.createBackup(filePath);

      const backups = await fileSync.listBackups(filePath);

      // Most recent should be first
      expect(backups[0] > backups[1]).toBe(true);
    });
  });

  describe('restoreBackup', () => {
    it('should restore content from backup', async () => {
      const filePath = join(testDir, 'test.md');
      writeFileSync(filePath, '# Original', 'utf-8');

      const backupPath = await fileSync.createBackup(filePath);
      writeFileSync(filePath, '# Modified', 'utf-8');

      const result = await fileSync.restoreBackup(backupPath, filePath);

      expect(result.success).toBe(true);
      expect(result.path).toBe(filePath);

      const restored = readFileSync(filePath, 'utf-8');
      expect(restored).toBe('# Original');
    });

    it('should throw error if backup does not exist', async () => {
      const backupPath = join(testDir, 'nonexistent.backup');
      const targetPath = join(testDir, 'test.md');

      await expect(fileSync.restoreBackup(backupPath, targetPath)).rejects.toThrow('Backup not found');
    });

    it('should create backup of current file before restoring', async () => {
      const filePath = join(testDir, 'test.md');
      writeFileSync(filePath, '# Original', 'utf-8');

      const backupPath = await fileSync.createBackup(filePath);
      writeFileSync(filePath, '# Modified', 'utf-8');

      const result = await fileSync.restoreBackup(backupPath, filePath);

      // Verify restore worked
      expect(result.success).toBe(true);
      const restored = readFileSync(filePath, 'utf-8');
      expect(restored).toBe('# Original');

      // Should have at least one backup (the "Modified" version before restore)
      const backups = await fileSync.listBackups(filePath);
      expect(backups.length).toBeGreaterThanOrEqual(1);
    });
  });
});
